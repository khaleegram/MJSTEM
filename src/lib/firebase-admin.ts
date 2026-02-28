import { getApps, initializeApp, cert, applicationDefault, App } from "firebase-admin/app";
import { existsSync } from "node:fs";
import * as admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

let adminApp: App | undefined;
const firebaseProjectId = process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
const hasCredentialsFile = !!credentialsPath && existsSync(credentialsPath);
const hasServiceAccountEnv =
  !!firebaseProjectId &&
  !!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL &&
  !!process.env.GOOGLE_PRIVATE_KEY;

// ADC is typically present in managed GCP runtimes; local ADC is valid only when the file exists.
const hasGcpRuntimeHints =
  !!process.env.K_SERVICE ||
  !!process.env.FUNCTION_TARGET ||
  !!process.env.FUNCTION_NAME ||
  !!process.env.GAE_ENV;
const hasRuntimeAdc = hasGcpRuntimeHints || hasCredentialsFile;

const canUseAdminFirestore = hasServiceAccountEnv || hasRuntimeAdc;

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
    } else if (hasRuntimeAdc) {
        adminApp = initializeApp({
            credential: applicationDefault(),
            ...(firebaseProjectId ? { projectId: firebaseProjectId } : {}),
        });
        if (hasCredentialsFile) {
          console.log("[Firebase Admin] Initialized with Application Default Credentials from GOOGLE_APPLICATION_CREDENTIALS.");
        } else {
          console.log("[Firebase Admin] Initialized with Application Default Credentials from GCP runtime.");
        }
    } else if (firebaseProjectId) {
        // Local/dev mode: project ID is enough for auth token verification.
        adminApp = initializeApp({ projectId: firebaseProjectId });
        if (credentialsPath && !hasCredentialsFile) {
          console.warn(`[Firebase Admin] GOOGLE_APPLICATION_CREDENTIALS is set but file does not exist at: ${credentialsPath}`);
        }
        console.warn("[Firebase Admin] Initialized without credentials. Auth token verification is available, Firestore admin features are disabled.");
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
