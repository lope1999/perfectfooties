import {
  collection,
  doc,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  query,
  orderBy,
  where,
} from 'firebase/firestore';
import { db } from './firebase';

const COL = 'announcements';

export async function fetchAnnouncements() {
  const ref = collection(db, COL);
  const snap = await getDocs(query(ref, orderBy('createdAt', 'desc')));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function fetchActiveAnnouncements() {
  const ref = collection(db, COL);
  const snap = await getDocs(query(ref, where('active', '==', true)));
  const now = new Date();
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((a) => {
      if (!a.expiresAt) return true;
      const exp = a.expiresAt?.toDate?.() ?? new Date(a.expiresAt);
      return exp > now;
    })
    .sort((a, b) => {
      const aTime = a.createdAt?.toDate?.()?.getTime?.() ?? 0;
      const bTime = b.createdAt?.toDate?.()?.getTime?.() ?? 0;
      return bTime - aTime;
    });
}

// Keep for backwards compat
export async function fetchActiveAnnouncement() {
  const all = await fetchActiveAnnouncements();
  return all[0] ?? null;
}

export async function addAnnouncement(data) {
  const ref = collection(db, COL);
  return addDoc(ref, {
    title: data.title || '',
    message: data.message || '',
    ctaLabel: data.ctaLabel || '',
    ctaLink: data.ctaLink || '',
    imageUrl: data.imageUrl || '',
    active: Boolean(data.active),
    expiresAt: data.expiresAt || null,
    createdAt: serverTimestamp(),
  });
}

export async function updateAnnouncement(id, data) {
  const ref = doc(db, COL, id);
  const update = { ...data };
  delete update.id;
  delete update.createdAt;
  return updateDoc(ref, update);
}

export async function deleteAnnouncement(id) {
  return deleteDoc(doc(db, COL, id));
}
