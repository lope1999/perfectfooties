import {
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  updateDoc,
  setDoc,
  query,
  where,
  orderBy,
  limit,
  arrayUnion,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { requireString, sanitizeString, validateNumber, validateOrderType, validateOrderStatus } from './validate';
import { updateBookedSlotStatus } from './bookedSlotsService';

export async function saveOrder(uid, data) {
  requireString(uid, 'uid');
  validateOrderType(data.type);
  const customerName = sanitizeString(data.customerName, 200);
  const total = validateNumber(data.total, { min: 0, label: 'total' });

  const items = Array.isArray(data.items) ? data.items.slice(0, 50) : [];

  // Ensure the user document exists so subcollection reads/writes work reliably
  const userRef = doc(db, 'users', uid);
  await setDoc(userRef, { uid }, { merge: true });

  const ref = collection(db, 'users', uid, 'orders');
  return addDoc(ref, {
    ...data,
    customerName,
    total,
    items,
    uid,
    status: 'pending',
    createdAt: serverTimestamp(),
    statusHistory: [{ status: 'pending', at: new Date().toISOString() }],
  });
}

export async function fetchOrders(uid, type) {
  const ref = collection(db, 'users', uid, 'orders');
  const constraints = [orderBy('createdAt', 'desc')];
  if (type) constraints.push(where('type', '==', type));
  const snap = await getDocs(query(ref, ...constraints));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function fetchRecentOrders(uid) {
  const ref = collection(db, 'users', uid, 'orders');
  const snap = await getDocs(query(ref, orderBy('createdAt', 'desc'), limit(3)));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function updateOrderStatus(uid, orderId, status, extraFields = {}) {
  requireString(uid, 'uid');
  requireString(orderId, 'orderId');
  validateOrderStatus(status, 'order');
  const ref = doc(db, 'users', uid, 'orders', orderId);
  updateBookedSlotStatus(orderId, status).catch(() => {});
  return updateDoc(ref, {
    status,
    ...extraFields,
    statusHistory: arrayUnion({ status, at: new Date().toISOString() }),
  });
}

export async function updateOrderDetails(uid, orderId, updates) {
  requireString(uid, 'uid');
  requireString(orderId, 'orderId');
  const ref = doc(db, 'users', uid, 'orders', orderId);
  return updateDoc(ref, updates);
}

export async function saveNailBedSizes(uid, sizes) {
  requireString(uid, 'uid');
  if (!sizes) return;
  const userRef = doc(db, 'users', uid);
  return setDoc(userRef, { nailBedSizes: sizes }, { merge: true });
}

export async function fetchNailBedSizes(uid) {
  requireString(uid, 'uid');
  const userRef = doc(db, 'users', uid);
  const snap = await getDoc(userRef);
  return snap.exists() ? snap.data().nailBedSizes || '' : '';
}
