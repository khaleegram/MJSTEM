
'use client';

import { useState, useEffect } from 'react';
import { getMessaging, getToken, isSupported } from 'firebase/messaging';
import { app, db } from '@/lib/firebase';
import { useAuth } from '@/contexts/auth-context';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { useToast } from './use-toast';

export const useRequestNotificationPermission = () => {
  const { user, userProfile } = useAuth();
  const { toast } = useToast();
  const [permission, setPermission] = useState<NotificationPermission | null>(null);
  const [isSupportedClient, setIsSupportedClient] = useState(false);

  useEffect(() => {
    isSupported().then(supported => {
        setIsSupportedClient(supported);
        if (supported && 'Notification' in window) {
            setPermission(Notification.permission);
        }
    });
  }, []);

  const requestPermission = async () => {
    if (!isSupportedClient) {
        toast({ title: "Push notifications not supported on this browser.", variant: "destructive"});
        return;
    }
    if (!user || !userProfile) {
        toast({ title: "You must be logged in to enable notifications.", variant: "destructive"});
        return;
    }

    const newPermission = await Notification.requestPermission();
    setPermission(newPermission);

    if (newPermission === 'granted') {
      try {
        const messaging = getMessaging(app);
        const vapidKey = process.env.NEXT_PUBLIC_VAPID_KEY;
        if (!vapidKey) {
            throw new Error("VAPID key is not configured in environment variables.");
        }
        
        const currentToken = await getToken(messaging, { vapidKey });

        if (currentToken) {
          const userDocRef = doc(db, 'users', user.uid);
          
          // Only add the token if it's not already there to avoid duplicates
          if (!userProfile.fcmTokens?.includes(currentToken)) {
            await updateDoc(userDocRef, {
                fcmTokens: arrayUnion(currentToken)
            });
             toast({ title: "Notifications Enabled!", description: "You will now receive push notifications for important updates."});
          } else {
             toast({ title: "Notifications Already Enabled", description: "This device is already set up to receive notifications."});
          }

        } else {
            toast({ title: "Could not get notification token.", description: "Please try again.", variant: "destructive"});
        }
      } catch (error: any) {
        console.error('An error occurred while retrieving token. ', error);
        toast({ title: "Error enabling notifications", description: error.message, variant: "destructive"});
      }
    } else {
      toast({ title: "Notifications Denied", description: "You can enable notifications from your browser settings later."});
    }
  };

  return { requestPermission, permission, isSupported: isSupportedClient };
};

