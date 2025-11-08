'use server';

import { createUploadthing, type FileRouter } from 'uploadthing/next';
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { auth as adminAuth } from 'firebase-admin';
import { NextRequest } from 'next/server';

// Initialize Firebase Admin SDK
if (!getApps().length) {
  initializeApp({
    credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY!)),
  });
}

// Auth middleware
const handleAuth = async ({ req }: { req: NextRequest }) => {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) throw new Error("Unauthorized: No token");

  const token = authHeader.split(" ")[1];
  if (!token) throw new Error("Unauthorized: Malformed token");

  try {
    const decoded = await adminAuth().verifyIdToken(token);
    return { userId: decoded.uid };
  } catch (err) {
    console.error('Firebase token verification failed:', err);
    throw new Error('Unauthorized: Invalid token');
  }
};

const f = createUploadthing();

export const ourFileRouter = {
  documentUploader: f({
    pdf: { maxFileSize: "16MB", maxFileCount: 1 },
    "application/msword": { maxFileSize: "16MB", maxFileCount: 1 },
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": { maxFileSize: "16MB", maxFileCount: 1 },
  })
    .middleware(handleAuth)
    .onUploadComplete(async ({ metadata, file }) => {
      // Return plain JSON
      return { uploadedBy: metadata.userId, url: file.url };
    }),

  imageUploader: f({
    image: { maxFileSize: "4MB", maxFileCount: 1 },
  })
    .middleware(handleAuth)
    .onUploadComplete(async ({ metadata, file }) => {
      return { uploadedBy: metadata.userId, url: file.url };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
