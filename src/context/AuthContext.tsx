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
  nickname?: string;
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
  updateProfileNickname: (nickname: string) => Promise<void>;
}

const NICKNAME_STORAGE_KEY = 'cubeonline_account_nickname';

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  signInGuest: async () => {},
  signOut: async () => {},
  updateProfileColor: async () => {},
  updateProfileNickname: async () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(() => {
    if (typeof window !== 'undefined') {
      const savedNickname = localStorage.getItem(NICKNAME_STORAGE_KEY) || '';
      return { nickname: savedNickname };
    }
    return null;
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      const localNickname = typeof window !== 'undefined' ? localStorage.getItem(NICKNAME_STORAGE_KEY) || '' : '';
      
      if (currentUser && !currentUser.isAnonymous) {
        // Fetch profile from Firestore
        try {
          const docRef = doc(firestore, 'users', currentUser.uid, 'profile', 'settings');
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const data = docSnap.data() as UserProfile;
            const effectiveNickname = data.nickname || localNickname;
            setProfile({ ...data, nickname: effectiveNickname });
            if (effectiveNickname && typeof window !== 'undefined') {
              localStorage.setItem(NICKNAME_STORAGE_KEY, effectiveNickname);
            }
          } else {
            setProfile({ nickname: localNickname });
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
          setProfile({ nickname: localNickname });
        }
      } else {
        setProfile({ nickname: localNickname });
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
    if (user && !user.isAnonymous) {
      const docRef = doc(firestore, 'users', user.uid, 'profile', 'settings');
      await setDoc(docRef, { color, accentColor }, { merge: true });
    }
    setProfile((prev) => ({ ...prev, color, accentColor }));
  };

  const updateProfileNickname = async (nickname: string) => {
    const formatted = nickname.toUpperCase().slice(0, 10);
    if (typeof window !== 'undefined') {
      localStorage.setItem(NICKNAME_STORAGE_KEY, formatted);
    }
    if (user && !user.isAnonymous) {
      const docRef = doc(firestore, 'users', user.uid, 'profile', 'settings');
      await setDoc(docRef, { nickname: formatted }, { merge: true });
    }
    setProfile((prev) => ({ ...prev, nickname: formatted }));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        loading,
        signInGuest,
        signOut,
        updateProfileColor,
        updateProfileNickname,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
