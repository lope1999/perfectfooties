import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from './firebase';

/**
 * Updates the user's profile in Firestore.
 * @param {string} uid User ID
 * @param {object} updates Fields to update (displayName, phone, address, etc.)
 */
export async function updateUserProfile(uid, updates) {
  if (!uid) return;
  const userRef = doc(db, 'users', uid);
  return updateDoc(userRef, {
    ...updates,
    updatedAt: new Date().toISOString()
  });
}

/**
 * Fetches the user's profile from Firestore.
 * @param {string} uid User ID
 */
export async function fetchUserProfile(uid) {
  if (!uid) return null;
  const userRef = doc(db, 'users', uid);
  const snap = await getDoc(userRef);
  if (snap.exists()) {
    return { uid: snap.id, ...snap.data() };
  }
  return null;
}
