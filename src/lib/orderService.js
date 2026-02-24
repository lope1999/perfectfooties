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

export async function saveOrder(uid, data) {
  const ref = collection(db, 'users', uid, 'orders');
  return addDoc(ref, {
    ...data,
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
