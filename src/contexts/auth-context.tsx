
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
import { doc, setDoc, getDoc, collection, query, where, getDocs, writeBatch, arrayUnion, arrayRemove } from 'firebase/firestore';
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
  let profile: UserProfile;

  if (snap.exists()) {
    profile = snap.data() as UserProfile;
  } else {
    // Create the initial profile for the new user
    profile = {
      uid: user.uid,
      email: user.email!,
      displayName: user.displayName || 'New User',
      photoURL: user.photoURL || '',
      role: 'Author', // Default role
      specialization: '',
      fcmTokens: [],
    };
    await setDoc(userRef, profile);
  }

  // CLAIMING LOGIC: If the user is just an Author, check if they have pending invitations.
  // This runs on every login, ensuring invitations are always claimed and roles promoted.
  if (user.email) {
    const submissionsRef = collection(db, 'submissions');
    const q = query(submissionsRef, where('invitedReviewerEmails', 'array-contains', user.email));
    
    try {
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            const batch = writeBatch(db);
            
            querySnapshot.forEach(submissionDoc => {
                const submissionData = submissionDoc.data() as Submission;
                const submissionRef = doc(db, 'submissions', submissionDoc.id);
            
                // Update submission to link the UID permanently
                const updatedReviewers = submissionData.reviewers?.map(r =>
                    (r.email === user.email && (r.status === 'Invited' || r.id === null))
                    ? { ...r, id: user.uid, status: r.status === 'Invited' ? 'Pending' : r.status }
                    : r
                ) || [];

                batch.update(submissionRef, {
                    reviewers: updatedReviewers,
                    reviewerIds: arrayUnion(user.uid),
                    invitedReviewerEmails: arrayRemove(user.email)
                });
            });

            // Always ensure the user is promoted if they have invitations, even if they were manually promoted before
            if (profile.role === 'Author') {
                batch.update(userRef, { role: 'Reviewer' });
                profile.role = 'Reviewer';
            }
            
            await batch.commit();
            console.log(`[Auth] Claimed ${querySnapshot.size} pending invitations for ${user.email}.`);
            
            // Return the latest local profile
            return profile;
        }
    } catch (error) {
        console.error("[Auth] Error auto-claiming invitations:", error);
    }
  }

  return profile;
};


export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoading(true);
      if (user) {
        if (user.emailVerified) {
          setUser(user);
          const profile = await ensureUserDocument(user);
          setUserProfile(profile);
        } else {
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
    const result = await signInWithPopup(auth, provider);
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
