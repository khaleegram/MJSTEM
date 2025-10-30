
'use client';

import { useEffect } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';

// This is a client-side component that does not render anything.
// Its sole purpose is to listen for custom events and handle them.
export function FirebaseErrorListener() {
  useEffect(() => {
    const handleError = (error: any) => {
      // The FirestorePermissionError is designed to throw itself to be caught by the Next.js dev overlay.
      // We don't need to do anything else here, just listen for the event to ensure it's handled on the client.
      console.log("Caught a permission error, it should now appear in the dev overlay.");
    };

    errorEmitter.on('permission-error', handleError);

    return () => {
      errorEmitter.removeListener('permission-error', handleError);
    };
  }, []);

  return null; // This component does not render anything
}

    