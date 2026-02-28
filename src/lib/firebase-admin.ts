import { getApps, initializeApp, cert, App } from "firebase-admin/app";
import * as admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

let adminApp: App | undefined;
const firebaseProjectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const hasServiceAccountEnv =
  !!firebaseProjectId &&
  !!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL &&
  !!process.env.GOOGLE_PRIVATE_KEY;

// ADC is typically present in managed GCP runtimes even without explicit service-account env vars.
const hasRuntimeAdcHints =
  !!process.env.GOOGLE_APPLICATION_CREDENTIALS ||
  !!process.env.K_SERVICE ||
  !!process.env.FUNCTION_TARGET ||
  !!process.env.FUNCTION_NAME ||
  !!process.env.GAE_ENV;

const canUseAdminFirestore = hasServiceAccountEnv || hasRuntimeAdcHints;

if (!getApps().length) {
  try {
    const serviceAccount = {
        projectId: firebaseProjectId,
        clientEmail: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        privateKey: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    };

    if (serviceAccount.privateKey && serviceAccount.clientEmail && serviceAccount.projectId) {
        adminApp = initializeApp({
            credential: cert(serviceAccount),
            projectId: serviceAccount.projectId,
        });
        console.log("[Firebase Admin] Initialized with Service Account.");
    } else if (firebaseProjectId) {
        // Local/dev mode: project ID is enough for auth token verification.
        adminApp = initializeApp({ projectId: firebaseProjectId });
        if (hasRuntimeAdcHints) {
          console.log("[Firebase Admin] Initialized with projectId and Application Default Credentials.");
        } else {
          console.warn("[Firebase Admin] Initialized without service account. Auth token verification is available, Firestore admin features may be disabled.");
        }
    } else {
        // Fallback app init enables services such as auth token verification.
        adminApp = initializeApp();
        console.warn("[Firebase Admin] Initialized without explicit projectId. Set FIREBASE_PROJECT_ID (or NEXT_PUBLIC_FIREBASE_PROJECT_ID) for local token verification.");
    }
  } catch (error: any) {
    console.error("[Firebase Admin] SDK initialization error:", error.message);
  }
} else {
    adminApp = getApps()[0];
}

if (!canUseAdminFirestore) {
  console.warn("[Firebase Admin] Firestore admin features disabled: no service account/ADC detected.");
}

const adminDb = adminApp && canUseAdminFirestore ? getFirestore(adminApp) : undefined;

export { adminDb };
export { firebaseProjectId, canUseAdminFirestore };
export default admin;
