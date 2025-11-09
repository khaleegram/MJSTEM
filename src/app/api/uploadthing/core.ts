
'use server';

import { createUploadthing, type FileRouter } from 'uploadthing/next';
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { auth as adminAuth } from 'firebase-admin';

// Initialize Firebase Admin SDK
if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      clientEmail: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      privateKey: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const f = createUploadthing();

// Auth middleware with logging
const handleAuth = async ({ req }: { req: Request }) => {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
        throw new Error("Unauthorized: No token provided.");
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
        throw new Error("Unauthorized: Bearer token is missing.");
    }
    
    const decoded = await adminAuth().verifyIdToken(token);
    return { userId: decoded.uid };
  } catch (err: any) {
    const errorMessage = err.code === 'auth/id-token-expired'
        ? 'Authentication Error: Token expired. Please refresh and try again.'
        : `Authentication Error: ${err.message || 'Failed to verify token.'}`;

    console.error("🔥 AUTH ERROR", err);
    throw new Error(errorMessage);
  }
};

// Define the file router
export const ourFileRouter = {
  documentUploader: f({
    pdf: { maxFileSize: "16MB", maxFileCount: 1 },
    "application/msword": { maxFileSize: "16MB", maxFileCount: 1 },
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": { maxFileSize: "16MB", maxFileCount: 1 },
  })
    .middleware(handleAuth)
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Upload complete for userId:", metadata.userId);
      console.log("file url", file.url);
      return { uploadedBy: metadata.userId, url: file.url };
    }),

  imageUploader: f({
    image: { maxFileSize: "4MB", maxFileCount: 1 },
  })
    .middleware(handleAuth)
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Image upload complete for userId:", metadata.userId);
      console.log("file url", file.url);
      return { uploadedBy: metadata.userId, url: file.url };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
