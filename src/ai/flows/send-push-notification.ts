
'use server';
/**
 * @fileOverview A flow for sending push notifications via Firebase Cloud Messaging.
 */

import admin from '@/lib/firebase-admin';
import { getDocs, collection, query, where, DocumentData } from 'firebase/firestore';

// Note: This uses the regular Firestore client to query for user tokens,
// but the Firebase Admin SDK to actually send the messages.
import { db } from '@/lib/firebase';

interface PushNotificationInput {
    userIds: string[];
    title: string;
    body: string;
    link: string;
}

async function getTokensForUsers(userIds: string[]): Promise<string[]> {
    if (!userIds || userIds.length === 0) return [];
    
    try {
        const usersRef = collection(db, 'users');
        // Firestore 'in' query is limited to 30 items. If we need more, this needs batching.
        const q = query(usersRef, where('__name__', 'in', userIds.slice(0, 30)));
        const querySnapshot = await getDocs(q);

        const allTokens = querySnapshot.docs.flatMap(doc => {
            const data = doc.data();
            return data.fcmTokens || []; // fcmTokens is an array of strings
        });
        
        return [...new Set(allTokens)]; // Return unique tokens
    } catch (error) {
        console.error("[Push Notification] Error fetching user tokens:", error);
        return [];
    }
}

export async function sendPushNotification(input: PushNotificationInput): Promise<void> {
    const { userIds, title, body, link } = input;

    const tokens = await getTokensForUsers(userIds);

    if (tokens.length === 0) {
        console.log("[Push Notification] No push notification tokens found for the target users.");
        return;
    }

    const messagePayload = {
        notification: {
            title: title,
            body: body,
        },
        webpush: {
            notification: {
                // You can add an icon here if you have one hosted
                // icon: '/icons/icon-192x192.png' 
            },
            fcm_options: {
                link: `${process.env.NEXT_PUBLIC_BASE_URL}${link}`,
            },
        },
        tokens: tokens,
    };

    try {
        // Use the initialized Firebase Admin SDK to send the message
        const response = await admin.messaging().sendEachForMulticast(messagePayload);
        console.log(`[Push Notification] Successfully sent ${response.successCount} push notifications.`);
        if (response.failureCount > 0) {
            console.warn(`[Push Notification] Failed to send ${response.failureCount} push notifications.`);
            response.responses.forEach((resp, idx) => {
                if (!resp.success) {
                    console.error(`[Push Notification] Error for token ${tokens[idx]}:`, resp.error);
                }
            });
        }
    } catch (error) {
        console.error("[Push Notification] Error sending push notifications via Admin SDK:", error);
        // We don't throw here to avoid breaking the calling flow
    }
}
