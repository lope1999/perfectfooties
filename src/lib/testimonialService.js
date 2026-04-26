import {
	collection,
	doc,
	addDoc,
	getDoc,
	getDocs,
	updateDoc,
	deleteDoc,
	query,
	where,
	orderBy,
	limit,
	serverTimestamp,
} from "firebase/firestore";
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
  const productId = data.productId ? sanitizeString(String(data.productId), 100) : '';
  const productName = data.productName
		? sanitizeString(data.productName, 200)
		: "";
  const collectionId = data.collectionId
		? sanitizeString(String(data.collectionId), 100)
		: "";
  const collectionName = data.collectionName
		? sanitizeString(data.collectionName, 200)
		: "";
  const occupation = data.occupation
		? sanitizeString(data.occupation, 100)
		: "";
  const service = data.service
		? sanitizeString(data.service, 200)
		: productName || collectionName || "";
  const published = data.published !== false;
  const source = data.source || "customer";
  const photoURLs = Array.isArray(data.photoURLs)
		? data.photoURLs.filter(Boolean)
		: [];

  const ref = collection(db, COLLECTION);
  return addDoc(ref, {
		...data,
		...(productId && { productId }),
		...(productName && { productName }),
		...(collectionId && { collectionId }),
		...(collectionName && { collectionName }),
		...(occupation && { occupation }),
		...(service && { service }),
		published,
		source,
		photoURLs,
		name,
		rating,
		testimonial,
		email,
		createdAt: serverTimestamp(),
  });
}

export async function updateTestimonial(testimonialId, data) {
	const ref = doc(db, COLLECTION, testimonialId);
	return updateDoc(ref, {
		...data,
		updatedAt: serverTimestamp(),
	});
}

export async function deleteTestimonial(testimonialId) {
	return deleteDoc(doc(db, COLLECTION, testimonialId));
}

export async function fetchTestimonialsByCollectionId(collectionId) {
	if (!collectionId) return [];
	const ref = collection(db, COLLECTION);
	const snap = await getDocs(
		query(ref, where("collectionId", "==", collectionId)),
	);
	return snap.docs
		.map((d) => ({ id: d.id, ...d.data() }))
		.sort((a, b) => {
			const aTime = a.createdAt?.toDate?.()?.getTime() || 0;
			const bTime = b.createdAt?.toDate?.()?.getTime() || 0;
			return bTime - aTime;
		});
}

export async function fetchTestimonials() {
  const ref = collection(db, COLLECTION);
  const snap = await getDocs(query(ref, orderBy('createdAt', 'desc')));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function fetchTestimonialsByProductId(productId) {
  if (!productId) return [];
  const ref = collection(db, COLLECTION);
  const snap = await getDocs(query(ref, where('productId', '==', productId)));
  const docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  return docs.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
}

export async function hasReviewedOrder(orderId) {
  const ref = collection(db, COLLECTION);
  const snap = await getDocs(query(ref, where('orderId', '==', orderId)));
  return !snap.empty;
}

export async function fetchTestimonialByOrderId(orderId) {
  if (!orderId) return null;
  const ref = collection(db, COLLECTION);
  const snap = await getDocs(query(ref, where('orderId', '==', orderId), limit(1)));
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() };
}

// Fallback for old reviews saved before orderId was added to the payload.
// Queries by email alone (no composite index needed) and filters client-side by productId.
export async function fetchTestimonialByEmailAndProduct(email, productId) {
  if (!email) return null;
  const ref = collection(db, COLLECTION);
  const snap = await getDocs(query(ref, where('email', '==', email)));
  if (snap.empty) return null;
  const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  // Prefer the one matching the product, otherwise return the most recent
  const match = productId ? docs.find(d => d.productId === productId) : null;
  if (match) return match;
  // Sort by createdAt descending and return the most recent
  docs.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
  return docs[0] || null;
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
