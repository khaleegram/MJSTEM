import { generateReactHelpers } from "@uploadthing/react";
import type { OurFileRouter } from "@/app/api/uploadthing/core";
import { auth } from "./firebase";
 
export const { useUploadThing } = generateReactHelpers<OurFileRouter>({
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
});
