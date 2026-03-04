import {
  collection,
  doc,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';

const COL = 'galleryImages';

export async function fetchGalleryImages(category) {
  const ref = collection(db, COL);
  const snap = await getDocs(ref);
  const all = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  const filtered = category ? all.filter((img) => img.category === category) : all;
  filtered.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  return filtered;
}

export async function addGalleryImage(data) {
  const ref = collection(db, COL);
  return addDoc(ref, {
    imageUrl: data.imageUrl || '',
    caption: data.caption || '',
    category: data.category || 'nails',
    order: data.order ?? 0,
    createdAt: serverTimestamp(),
  });
}

export async function updateGalleryImage(id, data) {
  const ref = doc(db, COL, id);
  return updateDoc(ref, data);
}

export async function deleteGalleryImage(id) {
  const ref = doc(db, COL, id);
  return deleteDoc(ref);
}
