import { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged, signInWithPopup, signOut as firebaseSignOut } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, googleProvider, db } from '../lib/firebase';

const AuthContext = createContext(null);

const ADMIN_EMAILS = new Set(['chizobaezeh338@gmail.com', 'perfect.footies@gmail.com']);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          await firebaseUser.reload().catch(() => {});
          setUser(auth.currentUser);

          const userRef = doc(db, 'users', firebaseUser.uid);
          const snap = await getDoc(userRef);
          if (!snap.exists()) {
            await setDoc(userRef, {
              displayName: firebaseUser.displayName || '',
              email: firebaseUser.email || '',
              photoURL: firebaseUser.photoURL || '',
              createdAt: serverTimestamp(),
            });
          } else {
            // Sync latest profile photo to Firestore (fire-and-forget)
            updateDoc(userRef, {
              displayName: firebaseUser.displayName || '',
              photoURL: firebaseUser.photoURL || '',
            }).catch(() => {});
          }
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error('Auth state handler error:', err);
        if (firebaseUser) setUser(auth.currentUser);
      } finally {
        setLoading(false);
      }
    });
    return unsubscribe;
  }, []);

  const signInWithGoogle = () => signInWithPopup(auth, googleProvider);

  const signOut = () => firebaseSignOut(auth);

  const isAdmin = ADMIN_EMAILS.has(user?.email);

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signOut, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
