'use client';

import { useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useToast } from '@/hooks/use-toast';
import { getMessaging, getToken, isSupported } from 'firebase/messaging';
import { app, db } from '@/lib/firebase';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';

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

      // Logic for smart re-prompting
      const lastPrompted = localStorage.getItem('lastNotificationPrompt');
      const now = new Date().getTime();

      if (lastPrompted && (now - parseInt(lastPrompted, 10) < RE_PROMPT_INTERVAL)) {
        // It's too soon to ask again
        return;
      }

      // Wait a few seconds before prompting
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
                await updateDoc(userDocRef, { fcmTokens: arrayUnion(currentToken) });
                toast({ title: "Notifications Enabled!", description: "You will now receive push notifications for important updates." });
              }
            } else {
              toast({ title: "Could not get notification token.", description: "Please try again.", variant: "destructive" });
            }
          }
        } catch (error: any) {
          console.error('An error occurred while handling notification permission: ', error);
          toast({ title: "Error enabling notifications", description: error.message, variant: "destructive" });
        }
      }, PROMPT_DELAY);
    };

    checkAndRequestPermission();

  }, [user, userProfile, loading, toast]);

  return null; // This component doesn't render anything
}
