import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { auth } from 'firebase-admin';
import { getApps, initializeApp, cert } from 'firebase-admin/app';

// Initialize Firebase Admin SDK
if (!getApps().length) {
  try {
    initializeApp({
      credential: cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY!))
    });
  } catch (e) {
    console.error("Firebase Admin initialization error", e);
  }
}

const f = createUploadthing();
 
const handleAuth = async () => {
    // This function is your auth middleware.
    // It will run on your server before every upload.
    //
    // It will have access to the request object, so you can retrieve cookies,
    // headers, etc. to determine who is trying to upload.
    
    // In this case, we're using Firebase Admin SDK to verify the user's token.
    // The client should send the token in the Authorization header.
    // For that, we need to import `utapi` from `uploadthing/server`
    // and use it to create a new `UploadThing` instance with a custom `auth`
    // middleware.
    
    // Let's assume we have a function to get the current user from the request
    // using the Firebase Admin SDK.
    const { currentUser } = await auth();
    
    if (!currentUser) throw new UploadThingError("Unauthorized");

    // Whatever is returned here is accessible in onUploadComplete as `metadata`
    return { userId: currentUser.uid };
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
    // Set permissions and file types for this FileRoute
    .middleware(() => handleAuth())
    .onUploadComplete(async ({ metadata, file }) => {
      // This code RUNS ON YOUR SERVER after upload
      console.log("Upload complete for userId:", metadata.userId);
      console.log("file url", file.url);
 
      // !!! Whatever is returned here is sent to the clientside `onClientUploadComplete` callback
      return { uploadedBy: metadata.userId, url: file.url };
    }),
} satisfies FileRouter;
 
export type OurFileRouter = typeof ourFileRouter;

    