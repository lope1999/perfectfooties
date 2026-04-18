import {
  collection,
  doc,
  addDoc,
  setDoc,
  getDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  serverTimestamp,
  query,
  orderBy,
} from 'firebase/firestore';
import { db } from './firebase';

const COLLECTIONS_COL = 'collections';

// ── Collection Categories ─────────────────────────────────────

export async function fetchCollections() {
  const ref = collection(db, COLLECTIONS_COL);
  const snap = await getDocs(query(ref, orderBy('order', 'asc')));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getCollection(collectionId) {
  const snap = await getDoc(doc(db, COLLECTIONS_COL, collectionId));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() };
}

export async function updateCollection(collectionId, data) {
  await updateDoc(doc(db, COLLECTIONS_COL, collectionId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function addCollection(data) {
  if (!data.id) throw new Error('addCollection requires a data.id');
  const docRef = doc(db, COLLECTIONS_COL, data.id);
  await setDoc(docRef, {
    name: data.name || '',
    description: data.description || '',
    coverImage: data.coverImage || '',
    order: data.order ?? 99,
    active: data.active !== false,
    createdAt: serverTimestamp(),
  });
  return docRef;
}

export async function deleteCollection(collectionId) {
  await deleteDoc(doc(db, COLLECTIONS_COL, collectionId));
}

// ── Items (subcollection) ─────────────────────────────────────

function itemsRef(collectionId) {
  return collection(db, COLLECTIONS_COL, collectionId, 'items');
}

export async function fetchItems(collectionId) {
  const snap = await getDocs(query(itemsRef(collectionId), orderBy('createdAt', 'asc')));
  return snap.docs.map((d) => ({ id: d.id, collectionId, ...d.data() }));
}

export async function getItem(collectionId, itemId) {
  const snap = await getDoc(doc(db, COLLECTIONS_COL, collectionId, 'items', itemId));
  if (!snap.exists()) return null;
  return { id: snap.id, collectionId, ...snap.data() };
}

export async function addItem(collectionId, data) {
  return addDoc(itemsRef(collectionId), {
    name: data.name || '',
    description: data.description || '',
    images: Array.isArray(data.images) ? data.images.filter(Boolean) : [],
    price: Number(data.price) || 0,
    colors: Array.isArray(data.colors) ? data.colors : [],
    status: data.status || 'open',
    requiresLength: data.requiresLength !== false,
    careGuide: data.careGuide || '',
    colorStock: data.colorStock || {},
    orderCount: 0,
    createdAt: serverTimestamp(),
  });
}

export async function updateItem(collectionId, itemId, data) {
  await updateDoc(doc(db, COLLECTIONS_COL, collectionId, 'items', itemId), {
    ...data,
    updatedAt: serverTimestamp(),
  });
}

export async function deleteItem(collectionId, itemId) {
  await deleteDoc(doc(db, COLLECTIONS_COL, collectionId, 'items', itemId));
}

export async function incrementItemOrderCount(collectionId, itemId) {
  const { increment } = await import('firebase/firestore');
  await updateDoc(doc(db, COLLECTIONS_COL, collectionId, 'items', itemId), {
    orderCount: increment(1),
  });
}
