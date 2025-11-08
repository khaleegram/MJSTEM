
import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { auth as adminAuth } from 'firebase-admin';
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { NextRequest } from "next/server";
import { UTApi } from "uploadthing/server";

export const utapi = new UTApi();


// Initialize Firebase Admin SDK
if (!getApps().length) {
  try {
    const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (!serviceAccount) throw new Error('Firebase service account key is not set.');
    initializeApp({
      credential: cert(JSON.parse(serviceAccount))
    });
  } catch (e) {
    console.error("Firebase Admin initialization error", e);
  }
}

const f = createUploadthing();
 
const handleAuth = async ({ req }: { req: NextRequest }) => {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        throw new UploadThingError("Unauthorized: No token provided");
    }
    const token = authHeader.split('Bearer ')[1];

    try {
        const decodedToken = await adminAuth().verifyIdToken(token);
        return { userId: decodedToken.uid };
    } catch (error) {
        console.error("Firebase Auth Error", error);
        throw new UploadThingError("Unauthorized: Invalid token");
    }
}
 
// FileRouter for your app, can contain multiple FileRoutes
export const ourFileRouter = {
  // Define as many FileRoutes as you like, each with a unique route slug
  documentUploader: f({ 
    "blob": { maxFileSize: "16MB", maxFileCount: 1 },
    "pdf": { maxFileSize: "16MB", maxFileCount: 1 },
    "text": { maxFileSize: "16MB", maxFileCount: 1 },
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
