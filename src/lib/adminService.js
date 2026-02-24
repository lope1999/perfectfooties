import {
  collectionGroup,
  collection,
  doc,
  getDocs,
  getDoc,
  updateDoc,
  deleteDoc,
  setDoc,
  query,
  orderBy,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';

// ─── Orders ─────────────────────────────────────────────

export async function fetchAllOrders() {
  const q = query(collectionGroup(db, 'orders'), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => {
    const pathParts = d.ref.path.split('/');
    const uid = pathParts[1]; // users/{uid}/orders/{orderId}
    return { id: d.id, uid, ...d.data() };
  });
}

export async function updateOrderStatus(uid, orderId, status) {
  const ref = doc(db, 'users', uid, 'orders', orderId);
  return updateDoc(ref, { status });
}

export async function updateOrder(uid, orderId, updates) {
  const ref = doc(db, 'users', uid, 'orders', orderId);
  return updateDoc(ref, updates);
}

export async function deleteOrder(uid, orderId) {
  const ref = doc(db, 'users', uid, 'orders', orderId);
  return deleteDoc(ref);
}

export async function addOrderNote(uid, orderId, text) {
  const ref = doc(db, 'users', uid, 'orders', orderId);
  const snap = await getDoc(ref);
  const existing = snap.data()?.adminNotes || [];
  return updateDoc(ref, {
    adminNotes: [...existing, { text, timestamp: new Date().toISOString() }],
  });
}

// ─── Categories ─────────────────────────────────────────

export async function fetchCategories(collectionName) {
  const snap = await getDocs(collection(db, collectionName));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function addCategory(collectionName, id, data) {
  const ref = doc(db, collectionName, id);
  return setDoc(ref, { ...data, products: data.products || [] });
}

export async function updateCategory(collectionName, id, updates) {
  const ref = doc(db, collectionName, id);
  return updateDoc(ref, updates);
}

export async function deleteCategory(collectionName, id) {
  const ref = doc(db, collectionName, id);
  return deleteDoc(ref);
}

// ─── Products (nested array inside category docs) ───────

export async function addProduct(collectionName, categoryId, product) {
  const ref = doc(db, collectionName, categoryId);
  await runTransaction(db, async (transaction) => {
    const snap = await transaction.get(ref);
    if (!snap.exists()) throw new Error(`Category ${categoryId} not found`);
    const products = [...(snap.data().products || [])];
    products.push({ ...product, id: product.id || crypto.randomUUID() });
    transaction.update(ref, { products });
  });
}

export async function updateProduct(collectionName, categoryId, productId, updates) {
  const ref = doc(db, collectionName, categoryId);
  await runTransaction(db, async (transaction) => {
    const snap = await transaction.get(ref);
    if (!snap.exists()) throw new Error(`Category ${categoryId} not found`);
    const products = snap.data().products.map((p) =>
      p.id === productId ? { ...p, ...updates } : p
    );
    transaction.update(ref, { products });
  });
}

export async function deleteProduct(collectionName, categoryId, productId) {
  const ref = doc(db, collectionName, categoryId);
  await runTransaction(db, async (transaction) => {
    const snap = await transaction.get(ref);
    if (!snap.exists()) throw new Error(`Category ${categoryId} not found`);
    const products = snap.data().products.filter((p) => p.id !== productId);
    transaction.update(ref, { products });
  });
}

// ─── Stats ──────────────────────────────────────────────

export function computeDashboardStats(orders) {
  const total = orders.length;
  const revenue = orders.reduce((sum, o) => sum + (o.total || 0), 0);
  const pending = orders.filter((o) => o.status === 'pending').length;
  const confirmed = orders.filter((o) => o.status === 'confirmed').length;
  const completed = orders.filter((o) => o.status === 'completed').length;
  return { total, revenue, pending, confirmed, completed };
}

export function findLowStockProducts(categories, threshold = 5) {
  const low = [];
  for (const cat of categories) {
    for (const p of cat.products || []) {
      if (p.stock !== undefined && p.stock <= threshold) {
        low.push({ ...p, categoryName: cat.title || cat.id });
      }
    }
  }
  return low;
}
