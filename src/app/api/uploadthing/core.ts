
import { createUploadthing, type FileRouter } from "uploadthing/next";
import { ourFileRouter } from "@/lib/uploadthing-router";
 
export type { OurFileRouter } from "@/lib/uploadthing-router";

// This file is now a passthrough and the logic is in `@/lib/uploadthing-router.ts`
// This is to avoid circular dependencies when using the router in other parts of the app.
const f = createUploadthing();
 
// Export the router for the API route
export const CoreRouter: FileRouter = ourFileRouter;
