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
import { doc, setDoc, getDoc, deleteDoc, collection, query, where, getDocs } from 'firebase/firestore';
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

/**
 * Reconciles user documents. 
 * If a placeholder doc (keyed by email) exists from a pre-invite, 
 * it converts it to a UID-based doc.
 */
const ensureUserDocument = async (user: FirebaseUser): Promise<UserProfile> => {
  const userRef = doc(db, 'users', user.uid);
  const snap = await getDoc(userRef);
  
  if (snap.exists()) {
    return snap.data() as UserProfile;
  }

  // Check if a placeholder exists for this email
  const emailNorm = user.email?.toLowerCase().trim();
  let placeholderData: Partial<UserProfile> | null = null;
  let placeholderId: string | null = null;

  if (emailNorm) {
      // Look for doc where Document ID is email or has a 'placeholder' marker
      const placeholderRef = doc(db, 'users', emailNorm);
      const placeholderSnap = await getDoc(placeholderRef);
      
      if (placeholderSnap.exists()) {
          placeholderData = placeholderSnap.data() as UserProfile;
          placeholderId = placeholderSnap.id;
      } else {
          // Alternative search if ID isn't email
          const q = query(collection(db, 'users'), where('email', '==', emailNorm), where('isPlaceholder', '==', true));
          const qSnap = await getDocs(q);
          if (!qSnap.empty) {
              placeholderData = qSnap.docs[0].data() as UserProfile;
              placeholderId = qSnap.docs[0].id;
          }
      }
  }

  const profile: UserProfile = {
    uid: user.uid,
    email: user.email!,
    displayName: user.displayName || placeholderData?.displayName || 'New User',
    photoURL: user.photoURL || placeholderData?.photoURL || '',
    role: (placeholderData?.role as any) || 'Author',
    specialization: placeholderData?.specialization || '',
    fcmTokens: [],
  };

  // Create the real UID-based document
  await setDoc(userRef, profile);

  // Clean up the placeholder if it existed
  if (placeholderId) {
      await deleteDoc(doc(db, 'users', placeholderId));
  }

  return profile;
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
        if (firebaseUser.emailVerified || firebaseUser.providerData.some(p => p.providerId === 'google.com')) {
          const profile = await ensureUserDocument(firebaseUser);
          setUser(firebaseUser);
          setUserProfile(profile);
          
          if (firebaseUser.email) {
            claimReviewerInvitations({ uid: firebaseUser.uid, email: firebaseUser.email })
              .then(async (result) => {
                if (result.success && result.count > 0) {
                    await refetchUserProfile();
                    toast({
                        title: "Account Upgraded",
                        description: `You have been linked to ${result.count} review assignment(s).`,
                    });
                }
              })
              .catch(err => console.error("[Auth] Background claim failed:", err));
          }
        } else {
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
