import { generateUploadThingHooks } from "@uploadthing/react";
import type { OurFileRouter } from "@/app/api/uploadthing/core";
import { auth } from "./firebase";
 
export const { useUploadThing } = generateUploadThingHooks<OurFileRouter>({
  hooks: {
    onUploadBegins: async () => {
      const user = auth.currentUser;
      if (user) {
        const token = await user.getIdToken();
        return {
          Authorization: `Bearer ${token}`
        }
      }
      return {};
    }
  }
});
