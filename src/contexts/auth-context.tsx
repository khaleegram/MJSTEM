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
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { UserProfile } from '@/types';
import { claimReviewerInvitations } from '@/ai/flows/claim-invitations';
import { toast } from '@/hooks/use-toast';


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
    const profile: UserProfile = {
      uid: user.uid,
      email: user.email!,
      displayName: user.displayName || 'New User',
      photoURL: user.photoURL || '',
      role: 'Author',
      specialization: '',
      fcmTokens: [],
    };
    await setDoc(userRef, profile);
    return profile;
  }
};


export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const refetchUserProfile = async () => {
    if (auth.currentUser) {
       const profile = await ensureUserDocument(auth.currentUser);
       setUserProfile(profile);
       return profile;
    }
    return null;
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        // Handle verified users (including Google)
        if (firebaseUser.emailVerified) {
          const profile = await ensureUserDocument(firebaseUser);
          setUser(firebaseUser);
          setUserProfile(profile);
          
          // Professional Background Claim: Run on every successful login/boot
          if (firebaseUser.email) {
            console.log(`[Auth] Attempting to claim invitations for: ${firebaseUser.email}`);
            claimReviewerInvitations({ uid: firebaseUser.uid, email: firebaseUser.email })
              .then(async (result) => {
                if (result.success && result.count > 0) {
                  console.log(`[Auth] Claim success: ${result.count} invites.`);
                  // Refresh the profile locally so UI reflects "Reviewer" role immediately
                  await refetchUserProfile();
                  toast({
                    title: "Account Upgraded",
                    description: `You have been assigned to ${result.count} new manuscript(s) and your account has been promoted to Reviewer.`,
                  });
                }
              })
              .catch(err => console.error("[Auth] Background claim failed:", err));
          }
        } else {
          // If verification is needed, show basic user but null profile to block dashboard access
          setUser(firebaseUser); 
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
      throw new Error("Please check your inbox and verify your email address to log in.");
    }
    return userCredential.user;
  };

  const signup = async (email: string, pass: string, displayName: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
    const { user } = userCredential;
    if(user) {
        await updateProfile(user, { displayName });
        await sendEmailVerification(user);
        await signOut(auth);
    }
    return userCredential;
  };
  
  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    return await signInWithPopup(auth, provider);
  }

  const logout = () => signOut(auth);

  const sendPasswordReset = (email: string) => sendPasswordResetEmail(auth, email);

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

export const useAuth = () => useContext(AuthContext);
