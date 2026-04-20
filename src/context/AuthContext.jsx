import { createContext, useContext, useState, useEffect } from 'react';
import {
	onAuthStateChanged,
	signInWithPopup,
	signOut as firebaseSignOut,
	createUserWithEmailAndPassword,
	signInWithEmailAndPassword,
	sendPasswordResetEmail,
	updateProfile,
} from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, googleProvider, db } from '../lib/firebase';

const AuthContext = createContext(null);

const ADMIN_EMAILS = new Set([
	"chizobaezeh338@gmail.com",
	"perfectfooties@gmail.com",
	"praiseolusegun19@gmail.com",
]);

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

  const signUpWithEmail = async (email, password, displayName) => {
		const userCredential = await createUserWithEmailAndPassword(
			auth,
			email,
			password,
		);
		if (displayName) {
			await updateProfile(userCredential.user, { displayName });
		}
		return userCredential;
  };

  const signInWithEmail = async (email, password) => {
		return signInWithEmailAndPassword(auth, email, password);
  };

  const resetPassword = async (email) => {
		return sendPasswordResetEmail(auth, email);
  };

  const signOut = () => firebaseSignOut(auth);

  const isAdmin = ADMIN_EMAILS.has(user?.email);

  return (
		<AuthContext.Provider
			value={{
				user,
				loading,
				signInWithGoogle,
				signUpWithEmail,
				signInWithEmail,
				resetPassword,
				signOut,
				isAdmin,
			}}
		>
			{children}
		</AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
