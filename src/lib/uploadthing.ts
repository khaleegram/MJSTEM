import { generateReactHelpers, generateUploadThing } from "@uploadthing/react";
import type { OurFileRouter } from "@/app/api/uploadthing/core";
import { auth } from "./firebase";
 
const ut = generateUploadThing<OurFileRouter>({
    hooks: {
        onUploadBegins: async () => {
            const user = auth.currentUser;
            if (!user) throw new Error("User not logged in");
            const token = await user.getIdToken();
            return {
                Authorization: `Bearer ${token}`
            }
        }
    }
});

export const useUploadThing = generateReactHelpers<OurFileRouter>({
    useAuth: () => {
        const user = auth.currentUser;
        return { user };
    }
}).useUploadThing;

export const uploadFiles = ut.uploadFiles;