
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
} from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { UserProfile } from '@/types';


interface AuthContextType {
  user: FirebaseUser | null;
  userProfile: UserProfile | null;
  loading: boolean;
  login: (email: string, pass: string) => Promise<any>;
  signup: (email: string, pass: string, displayName: string) => Promise<any>;
  logout: () => Promise<void>;
  signInWithGoogle: () => Promise<any>;
  refetchUserProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  userProfile: null,
  loading: true,
  login: async () => {},
  signup: async () => {},
  logout: async () => {},
  signInWithGoogle: async () => {},
  refetchUserProfile: async () => {},
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = async (user: FirebaseUser) => {
     // Fetch user role from Firestore
    const userDocRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);
    if (userDoc.exists()) {
        setUserProfile(userDoc.data() as UserProfile);
    } else {
        // This case might happen if user doc creation fails during signup
        // Or for pre-existing Firebase auth users without a profile doc
          const profile: UserProfile = {
          uid: user.uid,
          email: user.email!,
          displayName: user.displayName!,
          role: 'Author',
          specialization: 'General Topics',
        }
        // Let's create the user doc if it's missing for a google sign in
        await setDoc(userDocRef, profile);
        setUserProfile(profile); 
    }
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        await fetchUserProfile(user);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const login = (email: string, pass: string) => {
    return signInWithEmailAndPassword(auth, email, pass);
  };

  const signup = async (email: string, pass: string, displayName: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
    const { user } = userCredential;
    
    if(user) {
        await updateProfile(user, { displayName });

        // Create user profile in Firestore
        const userDocRef = doc(db, 'users', user.uid);
        const newProfile: UserProfile = {
            uid: user.uid,
            email: user.email!,
            displayName: displayName,
            role: 'Author', // Default role
            specialization: 'General Topics', // Default specialization
        };
        await setDoc(userDocRef, newProfile);
        setUserProfile(newProfile);
    }
    return userCredential;
  };
  
  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    const userCredential = await signInWithPopup(auth, provider);
    const { user } = userCredential;

    // Check if user profile already exists, if not create it
    const userDocRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userDocRef);
    if (!userDoc.exists()) {
        const newProfile: UserProfile = {
            uid: user.uid,
            email: user.email!,
            displayName: user.displayName!,
            role: 'Author',
            specialization: 'General Topics',
        };
        await setDoc(userDocRef, newProfile);
        setUserProfile(newProfile);
    } else {
        setUserProfile(userDoc.data() as UserProfile);
    }
    return userCredential;
  }

  const logout = () => {
    return signOut(auth);
  };

  const refetchUserProfile = async () => {
    if (auth.currentUser) {
      await fetchUserProfile(auth.currentUser);
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
    refetchUserProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  return useContext(AuthContext);
};
