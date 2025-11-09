import { createUploadthing, type FileRouter } from "uploadthing/next";
import { auth as adminAuth } from 'firebase-admin';
import '@/lib/firebase-admin'; // Ensures Firebase Admin is initialized

const f = createUploadthing({
    /**
     * Log out more information about the error, but don't return it to the client
     * @see https://docs.uploadthing.com/errors#error-formatting
     */
    errorFormatter: (err) => {
      console.log("Error uploading file", err.message);
      console.log("  - Above error caused by:", err.cause);
  
      return { message: err.message };
    },
  });

// Auth middleware for UploadThing
const handleAuth = async ({ req }: { req: Request }) => {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
        throw new Error("Unauthorized: No token provided");
    }
    const token = authHeader.split(" ")[1];
    const decoded = await adminAuth().verifyIdToken(token);
    return { userId: decoded.uid };
  } catch (error: any) {
    console.error("🔥 AUTH ERROR", error);
    throw new Error(`Unauthorized: ${error.message}`);
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