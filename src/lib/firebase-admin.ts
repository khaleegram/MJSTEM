import { getApps, initializeApp, cert, applicationDefault, App } from "firebase-admin/app";
import { existsSync } from "node:fs";
import * as admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';

let adminApp: App | undefined;
function normalizeEnvString(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1).trim();
  }
  return trimmed;
}

function normalizePrivateKey(value: string | undefined): string | undefined {
  const normalized = normalizeEnvString(value);
  if (!normalized) return undefined;
  // Support both escaped and real newline formats.
  return normalized.replace(/\\n/g, "\n").replace(/\r\n/g, "\n");
}

const firebaseProjectId = normalizeEnvString(
  process.env.FIREBASE_PROJECT_ID || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
);
const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;
const hasCredentialsFile = !!credentialsPath && existsSync(credentialsPath);
const serviceAccountEmail = normalizeEnvString(process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL);
const serviceAccountPrivateKey = normalizePrivateKey(process.env.GOOGLE_PRIVATE_KEY);
const hasServiceAccountEnv =
  !!firebaseProjectId &&
  !!serviceAccountEmail &&
  !!serviceAccountPrivateKey;

// ADC is typically present in managed GCP runtimes; local ADC is valid only when the file exists.
const hasGcpRuntimeHints =
  !!process.env.K_SERVICE ||
  !!process.env.FUNCTION_TARGET ||
  !!process.env.FUNCTION_NAME ||
  !!process.env.GAE_ENV;
const hasRuntimeAdc = hasGcpRuntimeHints || hasCredentialsFile;

const canUseAdminFirestore = hasServiceAccountEnv || hasRuntimeAdc;
let credentialProbePromise: Promise<void> | null = null;

if (!getApps().length) {
  try {
    const serviceAccount = {
        projectId: firebaseProjectId,
        clientEmail: serviceAccountEmail,
        privateKey: serviceAccountPrivateKey,
    };

    if (serviceAccount.privateKey && serviceAccount.clientEmail && serviceAccount.projectId) {
        if (!serviceAccount.privateKey.includes("BEGIN PRIVATE KEY")) {
          console.warn("[Firebase Admin] GOOGLE_PRIVATE_KEY format looks invalid (missing BEGIN PRIVATE KEY).");
        }
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

function maskEmail(email: string | undefined): string {
  if (!email || !email.includes('@')) return 'unknown';
  const [local, domain] = email.split('@');
  const safeLocal = local.length <= 2 ? `${local[0] || '*'}*` : `${local.slice(0, 2)}***`;
  return `${safeLocal}@${domain}`;
}

async function logAdminCredentialProbe(context: string): Promise<void> {
  if (!adminApp) {
    console.warn(`[Firebase Admin] Credential probe skipped (${context}): admin app is not initialized.`);
    return;
  }

  if (credentialProbePromise) {
    return credentialProbePromise;
  }

  credentialProbePromise = (async () => {
    try {
      const credential = adminApp?.options?.credential as { getAccessToken?: () => Promise<any> } | undefined;
      if (!credential || typeof credential.getAccessToken !== 'function') {
        console.warn(`[Firebase Admin] Credential probe skipped (${context}): no credential.getAccessToken() available.`);
        return;
      }

      const tokenInfo = await credential.getAccessToken();
      const expiry = tokenInfo?.expirationTime || tokenInfo?.expireTime || 'unknown';
      console.log(
        `[Firebase Admin] Credential probe success (${context}): project=${firebaseProjectId || 'unknown'}, serviceAccount=${maskEmail(serviceAccountEmail)}, tokenExpiry=${expiry}`
      );
    } catch (error: any) {
      console.error(
        `[Firebase Admin] Credential probe failed (${context}): project=${firebaseProjectId || 'unknown'}, serviceAccount=${maskEmail(serviceAccountEmail)}, code=${error?.code || 'unknown'}, message=${error?.message || error}`
      );
    }
  })();

  return credentialProbePromise;
}

export { adminDb };
export { firebaseProjectId, canUseAdminFirestore, logAdminCredentialProbe };
export default admin;
