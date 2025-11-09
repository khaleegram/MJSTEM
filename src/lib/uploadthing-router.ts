
import { createUploadthing, type FileRouter } from "uploadthing/next";
import { auth as adminAuth } from 'firebase-admin';
import '@/lib/firebase-admin'; // Ensures Firebase Admin is initialized

const f = createUploadthing();

// Auth middleware for UploadThing
const handleAuth = async ({ req }: { req: Request }) => {
  const authHeader = req.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    throw new Error("Unauthorized: No token provided.");
  }
  const token = authHeader.split(" ")[1];
  try {
    const decoded = await adminAuth().verifyIdToken(token);
    return { userId: decoded.uid };
  } catch (error) {
    console.error("🔥 AUTH ERROR", error);
    throw new Error("Unauthorized: Invalid token");
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
