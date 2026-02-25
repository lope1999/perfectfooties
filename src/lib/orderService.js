import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { requireString, sanitizeString, validateNumber, validateOrderType } from './validate';

export async function saveOrder(uid, data) {
  requireString(uid, 'uid');
  validateOrderType(data.type);
  const customerName = sanitizeString(data.customerName, 200);
  const total = validateNumber(data.total, { min: 0, label: 'total' });

  const items = Array.isArray(data.items) ? data.items.slice(0, 50) : [];

  const ref = collection(db, 'users', uid, 'orders');
  return addDoc(ref, {
    ...data,
    customerName,
    total,
    items,
    uid,
    status: 'pending',
    createdAt: serverTimestamp(),
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
