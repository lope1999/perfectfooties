import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';

const COLLECTION = 'testimonials';

export async function saveTestimonial(data) {
  const ref = collection(db, COLLECTION);
  return addDoc(ref, {
    ...data,
    createdAt: serverTimestamp(),
  });
}

export async function fetchTestimonials() {
  const ref = collection(db, COLLECTION);
  const snap = await getDocs(query(ref, orderBy('createdAt', 'desc')));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function hasReviewedOrder(orderId) {
  const ref = collection(db, COLLECTION);
  const snap = await getDocs(query(ref, where('orderId', '==', orderId)));
  return !snap.empty;
}
