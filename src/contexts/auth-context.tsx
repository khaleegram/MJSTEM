
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
    const newProfile: UserProfile = {
      uid: user.uid,
      email: user.email!,
      displayName: user.displayName || 'New User',
      photoURL: user.photoURL || '',
      role: 'Author', // Default role
      specialization: '', // Default specialization
    };
    await setDoc(userRef, newProfile);
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
        setUser(user);
        const profile = await ensureUserDocument(user);
        setUserProfile(profile);
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
        // The onAuthStateChanged listener will handle creating the user document
    }
    return userCredential;
  };
  
  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    // The onAuthStateChanged listener will handle creating/fetching the user document
    return result;
  }

  const sendPasswordReset = (email: string) => {
    return sendPasswordResetEmail(auth, email);
  }

  const logout = () => {
    return signOut(auth);
  };

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
