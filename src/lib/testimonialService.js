import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from './firebase';
import { sanitizeString, validateNumber, validateEmail } from './validate';

export async function uploadReviewPhoto(uid, file) {
  const ext = file.name.split('.').pop() || 'jpg';
  const path = `review-photos/${uid}/${Date.now()}.${ext}`;
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  return getDownloadURL(storageRef);
}

const COLLECTION = 'testimonials';

export async function saveTestimonial(data) {
  const name = sanitizeString(data.name, 200);
  if (!name) throw new Error('Name is required');

  const rating = validateNumber(data.rating, { min: 1, max: 5, label: 'rating' });
  if (!Number.isInteger(rating)) throw new Error('Rating must be a whole number');

  const testimonial = sanitizeString(data.testimonial, 2000);
  const email = data.email ? validateEmail(data.email) : '';

  const ref = collection(db, COLLECTION);
  return addDoc(ref, {
    ...data,
    name,
    rating,
    testimonial,
    email,
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

/**
 * Given an array of order IDs, return a Set of the ones that have been reviewed.
 * Uses a single Firestore query with 'in' filter (batched in chunks of 30).
 */
export async function getReviewedOrderIds(orderIds) {
  if (!orderIds.length) return new Set();
  const reviewed = new Set();
  const ref = collection(db, COLLECTION);
  // Firestore 'in' supports max 30 values per query
  for (let i = 0; i < orderIds.length; i += 30) {
    const chunk = orderIds.slice(i, i + 30);
    const snap = await getDocs(query(ref, where('orderId', 'in', chunk)));
    snap.docs.forEach((d) => {
      const oid = d.data().orderId;
      if (oid) reviewed.add(oid);
    });
  }
  return reviewed;
}
