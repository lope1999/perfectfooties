import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';

export async function saveShippingDetails(uid, shipping) {
  const userRef = doc(db, 'users', uid);
  return updateDoc(userRef, { shippingDetails: shipping });
}

export async function fetchShippingDetails(uid) {
  const userRef = doc(db, 'users', uid);
  const snap = await getDoc(userRef);
  return snap.exists() ? snap.data().shippingDetails || null : null;
}
