
import 'dotenv/config';
import { createUploadthing, type FileRouter } from "uploadthing/next";
import admin, { firebaseProjectId } from '@/lib/firebase-admin'; // Import the initialized admin app

const f = createUploadthing({
    errorFormatter: (err) => {
      console.log("Error uploading file", err.message);
      console.log("  - Above error caused by:", err.cause);
      return { message: err.message };
    },
  });

// Auth middleware for UploadThing
const handleAuth = async ({ req }: { req: Request }) => {
  try {
    if (!firebaseProjectId) {
      throw new Error("Server configuration missing Firebase project ID. Set FIREBASE_PROJECT_ID (or NEXT_PUBLIC_FIREBASE_PROJECT_ID).");
    }

    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
        throw new Error("Unauthorized: No token provided");
    }
    const token = authHeader.split(" ")[1];
    
    // Get the auth service from the initialized admin app
    const auth = admin.auth();
    const decoded = await auth.verifyIdToken(token);

    return { userId: decoded.uid };
  } catch (error: any) {
    console.error("🔥 AUTH ERROR", error);
    throw new Error(`Unauthorized: ${error.message || 'Authentication failed.'}`);
  }
};


// Define the file router
export const ourFileRouter = {
  // Author submission manuscripts are Word (.doc/.docx) only. Editors need the
  // editable Word file (e.g. for DOI insertion) during the editorial workflow.
  documentUploader: f({
    "application/msword": { maxFileSize: "16MB", maxFileCount: 1 },
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": { maxFileSize: "16MB", maxFileCount: 1 },
  })
    .middleware(handleAuth)
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Upload complete for userId:", metadata.userId);
      const fileWithMaybeUfs = file as typeof file & { ufsUrl?: string; ufssUrl?: string };
      const fileUrl = fileWithMaybeUfs.ufsUrl ?? fileWithMaybeUfs.ufssUrl ?? file.url;
      return { uploadedBy: metadata.userId, url: fileUrl };
    }),

  // Final published manuscript is PDF only. This is the non-editable file that
  // editors/admins drop in and that readers download from the public site.
  finalManuscriptUploader: f({
    "application/pdf": { maxFileSize: "16MB", maxFileCount: 1 },
  })
    .middleware(handleAuth)
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Final PDF upload complete for userId:", metadata.userId);
      const fileWithMaybeUfs = file as typeof file & { ufsUrl?: string; ufssUrl?: string };
      const fileUrl = fileWithMaybeUfs.ufsUrl ?? fileWithMaybeUfs.ufssUrl ?? file.url;
      return { uploadedBy: metadata.userId, url: fileUrl };
    }),

  generalDocumentUploader: f({
    "application/pdf": { maxFileSize: "16MB", maxFileCount: 1 },
    "application/msword": { maxFileSize: "16MB", maxFileCount: 1 },
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document": { maxFileSize: "16MB", maxFileCount: 1 },
    "text/plain": { maxFileSize: "16MB", maxFileCount: 1 },
    "application/rtf": { maxFileSize: "16MB", maxFileCount: 1 },
    "application/vnd.ms-powerpoint": { maxFileSize: "16MB", maxFileCount: 1 },
    "application/vnd.openxmlformats-officedocument.presentationml.presentation": { maxFileSize: "16MB", maxFileCount: 1 },
  })
    .middleware(handleAuth)
    .onUploadComplete(async ({ metadata, file }) => {
        console.log("General doc upload complete for userId:", metadata.userId);
        const fileWithMaybeUfs = file as typeof file & { ufsUrl?: string; ufssUrl?: string };
        const fileUrl = fileWithMaybeUfs.ufsUrl ?? fileWithMaybeUfs.ufssUrl ?? file.url;
        return { uploadedBy: metadata.userId, url: fileUrl };
    }),

  imageUploader: f({
    image: { maxFileSize: "4MB", maxFileCount: 1 },
  })
    .middleware(handleAuth)
    .onUploadComplete(async ({ metadata, file }) => {
      console.log("Image upload complete for userId:", metadata.userId);
      const fileWithMaybeUfs = file as typeof file & { ufsUrl?: string; ufssUrl?: string };
      const fileUrl = fileWithMaybeUfs.ufsUrl ?? fileWithMaybeUfs.ufssUrl ?? file.url;
      console.log("file url", fileUrl);
      return { uploadedBy: metadata.userId, url: fileUrl };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
