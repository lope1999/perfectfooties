import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from './firebase';

export async function saveShippingDetails(uid, shipping) {
  const userRef = doc(db, 'users', uid);
  return setDoc(userRef, { shippingDetails: shipping }, { merge: true });
}

export async function fetchShippingDetails(uid) {
  const userRef = doc(db, 'users', uid);
  const snap = await getDoc(userRef);
  return snap.exists() ? snap.data().shippingDetails || null : null;
}
