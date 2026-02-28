
'use client';

import { useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { getMessaging, getToken, isSupported } from 'firebase/messaging';
import { app, db } from '@/lib/firebase';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

const PROMPT_DELAY = 5000; // 5 seconds after login
const RE_PROMPT_INTERVAL = 7 * 24 * 60 * 60 * 1000; // 7 days

export function NotificationPermissionManager() {
  const { user, userProfile, loading } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (loading || !user || !userProfile) {
      return;
    }

    const checkAndRequestPermission = async () => {
      const isSupportedByBrowser = await isSupported();
      if (!isSupportedByBrowser) {
        console.log("Push notifications not supported by this browser.");
        return;
      }
      
      const currentPermission = Notification.permission;

      if (currentPermission === 'granted' || currentPermission === 'denied') {
        return; // User has already made a choice
      }

      const lastPrompted = localStorage.getItem('lastNotificationPrompt');
      const now = new Date().getTime();

      if (lastPrompted && (now - parseInt(lastPrompted, 10) < RE_PROMPT_INTERVAL)) {
        return;
      }

      setTimeout(async () => {
        try {
          const newPermission = await Notification.requestPermission();
          localStorage.setItem('lastNotificationPrompt', now.toString());

          if (newPermission === 'granted') {
            const messaging = getMessaging(app);
            const vapidKey = process.env.NEXT_PUBLIC_VAPID_KEY;
            if (!vapidKey) {
              throw new Error("VAPID key is not configured in environment variables.");
            }
            
            const currentToken = await getToken(messaging, { vapidKey });

            if (currentToken) {
              const userDocRef = doc(db, 'users', user.uid);
              if (!userProfile.fcmTokens?.includes(currentToken)) {
                const updateData = { fcmTokens: arrayUnion(currentToken) };
                updateDoc(userDocRef, updateData)
                  .then(() => {
                    toast({ title: "Notifications Enabled!", description: "You will now receive push notifications for important updates." });
                  })
                  .catch(async (serverError) => {
                    const permissionError = new FirestorePermissionError({
                      path: userDocRef.path,
                      operation: 'update',
                      requestResourceData: updateData,
                    });
                    errorEmitter.emit('permission-error', permissionError);
                  });
              }
            }
          }
        } catch (error: any) {
          console.error('An error occurred while handling notification permission: ', error);
        }
      }, PROMPT_DELAY);
    };

    checkAndRequestPermission();

  }, [user, userProfile, loading, toast]);

  return null;
}
