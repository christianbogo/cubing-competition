'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  onAuthStateChanged, 
  signInAnonymously, 
  signOut as firebaseSignOut 
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, firestore } from '@/lib/firebase';

export interface UserProfile {
  color?: string;
  accentColor?: string;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signInGuest: () => Promise<void>;
  signOut: () => Promise<void>;
  updateProfileColor: (color: string, accentColor: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  signInGuest: async () => {},
  signOut: async () => {},
  updateProfileColor: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser && !currentUser.isAnonymous) {
        // Fetch profile
        try {
          const docRef = doc(firestore, 'users', currentUser.uid, 'profile', 'settings');
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            setProfile(docSnap.data() as UserProfile);
          } else {
            setProfile({});
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
          setProfile({});
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInGuest = async () => {
    await signInAnonymously(auth);
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
  };

  const updateProfileColor = async (color: string, accentColor: string) => {
    if (!user || user.isAnonymous) return;
    const docRef = doc(firestore, 'users', user.uid, 'profile', 'settings');
    await setDoc(docRef, { color, accentColor }, { merge: true });
    setProfile((prev) => ({ ...prev, color, accentColor }));
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signInGuest, signOut, updateProfileColor }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
