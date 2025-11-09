
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import 'dotenv/config';

// Initialize Firebase Admin SDK only once.
if (!getApps().length) {
  try {
    initializeApp({
      credential: cert({
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        clientEmail: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        privateKey: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
    console.log("Firebase Admin SDK initialized successfully.");
  } catch (error: any) {
    console.error("Firebase Admin SDK initialization error:", error.message);
  }
}

// Export an empty object to satisfy module requirements.
// The main purpose of this file is the side effect of initialization.
export {};
