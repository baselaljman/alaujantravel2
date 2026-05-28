import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  auth, 
  db,
  signOut, 
  onAuthStateChanged, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile,
  doc,
  setDoc,
  getDoc,
  collection,
  query,
  where,
  getDocs
} from '../firebase';
import { UserProfile } from '../types';

interface AuthContextType {
  user: any;
  profile: UserProfile | null;
  loading: boolean;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  registerWithEmail: (email: string, pass: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: any) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        const userDocRef = doc(db, 'users', firebaseUser.uid);
        const userDoc = await getDoc(userDocRef);
        
        if (userDoc.exists()) {
          const uData = userDoc.data() as UserProfile;
          if (firebaseUser.email === 'baselaljman@gmail.com' && uData.role !== 'admin') {
            const up: UserProfile = { ...uData, role: 'admin' };
            await setDoc(userDocRef, up, { merge: true });
            setProfile(up);
          } else {
            setProfile(uData);
          }
        } else {
          // Fallback or self-heal
          const r: any = firebaseUser.email === 'baselaljman@gmail.com' ? 'admin' : 'user';
          const newProfile: UserProfile = {
            uid: firebaseUser.uid,
            email: firebaseUser.email || '',
            displayName: firebaseUser.displayName || 'مسافر',
            role: r,
            createdAt: new Date().toISOString()
          };
          await setDoc(userDocRef, newProfile);
          setProfile(newProfile);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const loginWithEmail = async (email: string, pass: string) => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, pass);
    } catch (e) {
      setLoading(false);
      throw e;
    }
  };

  const registerWithEmail = async (email: string, pass: string, name: string) => {
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, pass);
      await updateProfile(cred.user, { displayName: name });
      
      const r: any = email === 'baselaljman@gmail.com' ? 'admin' : 'user';
      const up: UserProfile = {
        uid: cred.user.uid,
        email: email,
        displayName: name,
        role: r,
        createdAt: new Date().toISOString()
      };
      await setDoc(doc(db, 'users', cred.user.uid), up);
      setProfile(up);
    } catch (e) {
      setLoading(false);
      throw e;
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, loginWithEmail, registerWithEmail, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
