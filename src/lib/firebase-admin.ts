import { getApps, initializeApp, cert } from "firebase-admin/app";
import * as admin from 'firebase-admin';

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

export default admin;
