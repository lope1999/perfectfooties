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

// Keeping 'nicheCollections' as the Firestore collection name avoids
// re-seeding existing data. Rename in Firestore console when ready.
const COL = 'nicheCollections';

export async function fetchProducts({ activeOnly = false } = {}) {
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

export async function addProduct(data) {
  const ref = collection(db, COL);
  return addDoc(ref, {
    name: data.name || '',
    material: data.material || '',
    category: data.category || '',
    description: data.description || '',
    images: Array.isArray(data.images) ? data.images.filter(Boolean) : [],
    price: Number(data.price) || 0,
    sizes: Array.isArray(data.sizes) ? data.sizes : [],
    colours: Array.isArray(data.colours) ? data.colours : [],
    status: data.status || 'upcoming',
    closesAt: data.closesAt || null,
    maxOrders: data.maxOrders ? Number(data.maxOrders) : null,
    orderCount: 0,
    requiresSize: Boolean(data.requiresSize),
    allowEngraving: Boolean(data.allowEngraving),
    multiSetDiscount: Boolean(data.multiSetDiscount),
    multiSetDiscountPercent: data.multiSetDiscount ? Number(data.multiSetDiscountPercent) || 0 : 0,
    hiddenFromStorefront: Boolean(data.hiddenFromStorefront),
    createdAt: serverTimestamp(),
  });
}

export async function updateProduct(id, data) {
  const ref = doc(db, COL, id);
  const update = { ...data };
  delete update.id;
  delete update.createdAt;
  return updateDoc(ref, update);
}

export async function deleteProduct(id) {
  return deleteDoc(doc(db, COL, id));
}

export async function fetchProductById(id) {
  const snap = await getDoc(doc(db, COL, id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

export async function incrementProductOrderCount(id) {
  return updateDoc(doc(db, COL, id), { orderCount: increment(1) });
}
