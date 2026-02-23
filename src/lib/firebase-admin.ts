import { getApps, initializeApp, cert, App } from "firebase-admin/app";
import * as admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

let adminApp: App | undefined;

if (!getApps().length) {
  try {
    const serviceAccount = {
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        clientEmail: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        privateKey: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    };

    if (serviceAccount.privateKey && serviceAccount.clientEmail && serviceAccount.projectId) {
        adminApp = initializeApp({
            credential: cert(serviceAccount),
            projectId: serviceAccount.projectId,
        });
        console.log("[Firebase Admin] Initialized with Service Account.");
    } else {
        // Fallback to Application Default Credentials
        adminApp = initializeApp();
        console.warn("[Firebase Admin] Initialized with Default Credentials (Service Account env vars missing).");
    }
  } catch (error: any) {
    console.error("[Firebase Admin] SDK initialization error:", error.message);
  }
} else {
    adminApp = getApps()[0];
}

const adminDb = adminApp ? getFirestore(adminApp) : undefined;

export { adminDb };
export default admin;
