import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { auth } from 'firebase-admin';

export const runtime = "nodejs";

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      privateKey: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

export async function GET() {
  try {
    const users = await auth().listUsers(1);
    return new Response(JSON.stringify(users), { status: 200 });
  } catch (err: any) {
    console.error("🔥 Firebase Admin test failed:", err);
    return new Response(err.message, { status: 500 });
  }
}
