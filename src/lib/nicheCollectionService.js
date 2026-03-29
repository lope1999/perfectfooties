import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  increment,
  query,
  orderBy,
} from 'firebase/firestore';
import { db } from './firebase';

const COL = 'nicheCollections';

export async function fetchNicheCollections({ activeOnly = false } = {}) {
  const ref = collection(db, COL);
  const snap = await getDocs(query(ref, orderBy('createdAt', 'desc')));
  let docs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  if (activeOnly) {
    docs = docs.filter(
      (c) => (c.status === 'open' || c.status === 'upcoming') && !c.hiddenFromStorefront,
    );
  }
  return docs;
}

export async function addNicheCollection(data) {
  const ref = collection(db, COL);
  return addDoc(ref, {
    name: data.name || '',
    season: data.season || '',
    description: data.description || '',
    images: Array.isArray(data.images) ? data.images.filter(Boolean) : [],
    price: Number(data.price) || 0,
    lengthSurcharges: data.lengthSurcharges && typeof data.lengthSurcharges === 'object' ? data.lengthSurcharges : {},
    availableShapes: Array.isArray(data.availableShapes) ? data.availableShapes : [],
    availableLengths: Array.isArray(data.availableLengths) ? data.availableLengths : [],
    status: data.status || 'upcoming',
    closesAt: data.closesAt || null,
    maxOrders: data.maxOrders ? Number(data.maxOrders) : null,
    orderCount: 0,
    requiresMeasurements: Boolean(data.requiresMeasurements),
    multiSetDiscount: Boolean(data.multiSetDiscount),
    multiSetDiscountPercent: data.multiSetDiscount ? Number(data.multiSetDiscountPercent) || 0 : 0,
    hiddenFromStorefront: Boolean(data.hiddenFromStorefront),
    createdAt: serverTimestamp(),
  });
}

export async function updateNicheCollection(id, data) {
  const ref = doc(db, COL, id);
  const update = { ...data };
  delete update.id;
  delete update.createdAt;
  return updateDoc(ref, update);
}

export async function deleteNicheCollection(id) {
  return deleteDoc(doc(db, COL, id));
}

export async function fetchNicheCollectionById(id) {
  const snap = await getDoc(doc(db, COL, id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

export async function incrementCollectionOrderCount(id) {
  return updateDoc(doc(db, COL, id), { orderCount: increment(1) });
}
