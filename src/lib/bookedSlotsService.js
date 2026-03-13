import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';

const ACTIVE_STATUSES = ['pending', 'confirmed', 'in progress'];

export async function fetchBookedSlots(formattedDate) {
  const ref = collection(db, 'bookedSlots');
  const q = query(
    ref,
    where('date', '==', formattedDate),
    where('status', 'in', ACTIVE_STATUSES)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => d.data().time);
}

export async function saveBookedSlot({ date, time, orderId, uid }) {
  const ref = collection(db, 'bookedSlots');
  return addDoc(ref, {
    date,
    time,
    orderId,
    uid,
    status: 'pending',
    createdAt: serverTimestamp(),
  });
}

export async function updateBookedSlotStatus(orderId, newStatus) {
  const ref = collection(db, 'bookedSlots');
  const q = query(ref, where('orderId', '==', orderId));
  const snap = await getDocs(q);
  const updates = snap.docs.map((d) => updateDoc(d.ref, { status: newStatus }));
  return Promise.all(updates);
}
export async function addToWaitlist({ date, name, email, phone, uid }) {
  const ref = collection(db, 'waitlist');
  return addDoc(ref, {
    date,
    name,
    email: email || '',
    phone: phone || '',
    uid: uid || '',
    status: 'waiting',
    createdAt: serverTimestamp(),
  });
}

export async function fetchWaitlistByDate(date) {
  const ref = collection(db, 'waitlist');
  const q = query(ref, where('date', '==', date), where('status', '==', 'waiting'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function fetchAllWaitlist() {
  const ref = collection(db, 'waitlist');
  const q = query(ref, where('status', '==', 'waiting'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => {
    const ta = a.createdAt?.seconds || 0;
    const tb = b.createdAt?.seconds || 0;
    return tb - ta;
  });
}
