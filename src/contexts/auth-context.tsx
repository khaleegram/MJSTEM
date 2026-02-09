
'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  updateProfile,
  User as FirebaseUser,
  GoogleAuthProvider,
  signInWithPopup,
  sendEmailVerification,
  sendPasswordResetEmail,
} from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, setDoc, getDoc, collection, query, where, getDocs, writeBatch, arrayUnion } from 'firebase/firestore';
import { UserProfile, Submission } from '@/types';


interface AuthContextType {
  user: FirebaseUser | null;
  userProfile: UserProfile | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<FirebaseUser>;
  signup: (email: string, pass: string, displayName: string) => Promise<any>;
  logout: () => Promise<void>;
  signInWithGoogle: () => Promise<any>;
  sendPasswordReset: (email: string) => Promise<void>;
  refetchUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userProfile: null,
  loading: true,
  login: async () => ({} as FirebaseUser),
  signup: async () => {},
  logout: async () => {},
  signInWithGoogle: async () => {},
  sendPasswordReset: async () => {},
  refetchUserProfile: async () => {},
});

const ensureUserDocument = async (user: FirebaseUser): Promise<UserProfile> => {
  const userRef = doc(db, 'users', user.uid);
  const snap = await getDoc(userRef);

  if (snap.exists()) {
    return snap.data() as UserProfile;
  } else {
    // Create the initial profile for the new user
    const newProfile: UserProfile = {
      uid: user.uid,
      email: user.email!,
      displayName: user.displayName || 'New User',
      photoURL: user.photoURL || '',
      role: 'Author', // Default role
      specialization: '',
      fcmTokens: [],
    };
    await setDoc(userRef, newProfile);

    // After creating the profile, check for pending invitations
    const invitationsRef = collection(db, 'invitations');
    const q = query(invitationsRef, where('email', '==', user.email));
    const invitationsSnapshot = await getDocs(q);

    if (!invitationsSnapshot.empty) {
        const batch = writeBatch(db);
        let needsRoleUpdate = false;

        for (const invitationDoc of invitationsSnapshot.docs) {
            const invitation = invitationDoc.data();
            const submissionRef = doc(db, 'submissions', invitation.submissionId);
            
            const submissionSnap = await getDoc(submissionRef);

            if (submissionSnap.exists()) {
                const submissionData = submissionSnap.data() as Submission;
                let wasUpdated = false;
                const updatedReviewers = submissionData.reviewers?.map(r => {
                    // Find the invited reviewer placeholder and update it
                    if (r.email === user.email && r.id === null) {
                        needsRoleUpdate = true;
                        wasUpdated = true;
                        return { ...r, id: user.uid, status: 'Pending' as const };
                    }
                    return r;
                });

                if(wasUpdated) {
                    // THE FIX: Also update the reviewerIds array for security rule access
                    batch.update(submissionRef, { 
                        reviewers: updatedReviewers,
                        reviewerIds: arrayUnion(user.uid) 
                    });
                    batch.delete(invitationDoc.ref); // Clean up the processed invitation
                }
            }
        }
        
        if (needsRoleUpdate) {
            // Only update role if it's the default 'Author'
            if (newProfile.role === 'Author') {
              batch.update(userRef, { role: 'Reviewer' });
            }
            await batch.commit();
            // Refetch the profile to return the updated one with the correct role
            const updatedSnap = await getDoc(userRef);
            return updatedSnap.data() as UserProfile;
        } else {
            // If for some reason no updates were needed, just commit any deletions
            await batch.commit();
        }
    }

    return newProfile;
  }
};


export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoading(true);
      if (user) {
        // Only fully set user if they are verified
        if (user.emailVerified) {
          setUser(user);
          const profile = await ensureUserDocument(user);
          setUserProfile(profile);
        } else {
          // Keep firebase user object for potential re-verification, but clear app-level profile
          setUser(user); 
          setUserProfile(null);
        }
      } else {
        setUser(null);
        setUserProfile(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const login = async (email: string, pass: string) => {
    const userCredential = await signInWithEmailAndPassword(auth, email, pass);
    if (!userCredential.user.emailVerified) {
      // Don't fully log in the user in our app state, just return the user object
      // so the UI can prompt for verification.
      throw new Error("Please check your inbox and verify your email address to log in.");
    }
    // Auth state listener will handle setting user and profile
    return userCredential.user;
  };

  const signup = async (email: string, pass: string, displayName: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
    const { user } = userCredential;
    
    if(user) {
        await updateProfile(user, { displayName });
        await sendEmailVerification(user);
        // The onAuthStateChanged listener will handle creating the user document once verified
        // We log them out to force them to verify.
        await signOut(auth);
    }
    return userCredential;
  };
  
  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    // The onAuthStateChanged listener will handle creating/fetching the user document
    return result;
  }

  const logout = () => {
    return signOut(auth);
  };

  const sendPasswordReset = (email: string) => {
    return sendPasswordResetEmail(auth, email);
  }

  const refetchUserProfile = async () => {
    if (auth.currentUser) {
       const profile = await ensureUserDocument(auth.currentUser);
       setUserProfile(profile);
    }
  }

  const value = {
    user,
    userProfile,
    loading,
    login,
    signup,
    logout,
    signInWithGoogle,
    sendPasswordReset,
    refetchUserProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  return useContext(AuthContext);
};
