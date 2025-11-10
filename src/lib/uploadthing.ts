import {
    generateReactHelpers,
    generateUploadButton,
    generateUploadDropzone,
  } from "@uploadthing/react";
import { useAuth } from "@/contexts/auth-context";
   
import type { OurFileRouter } from "@/app/api/uploadthing/core";

// This is a custom hook to pass the auth token to uploadthing
const useUploadThingWithAuth = () => {
    const { user } = useAuth();
    const reactHelpers = generateReactHelpers<OurFileRouter>();
    
    // Return the helpers, but with our custom logic to get the token
    return {
        ...reactHelpers,
        useUploadThing: (endpoint: keyof OurFileRouter, opts?: any) => {
            return reactHelpers.useUploadThing(endpoint, {
                ...opts,
                headers: async () => {
                    if (!user) return {};
                    const token = await user.getIdToken();
                    return { Authorization: `Bearer ${token}` };
                },
            });
        },
    };
};

export const { useUploadThing, uploadFiles } = useUploadThingWithAuth();

export const UploadButton = generateUploadButton<OurFileRouter>();
export const UploadDropzone = generateUploadDropzone<OurFileRouter>();
