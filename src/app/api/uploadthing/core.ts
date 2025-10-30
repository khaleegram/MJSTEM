import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { auth as firebaseAuth } from '@/lib/firebase';
 
const f = createUploadthing();
 
const handleAuth = () => {
    // This is a placeholder for your real auth logic.
    // In a real app, you'd get the user ID from your session.
    // See https://docs.uploadthing.com/getting-started/authentication
    const userId = "fake-user-id"; 
    if (!userId) throw new UploadThingError("Unauthorized");
    return { userId };
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
