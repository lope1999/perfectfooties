import {
  collectionGroup,
  collection,
  doc,
  addDoc,
  getDocs,
  getDoc,
  updateDoc,
  deleteDoc,
  setDoc,
  query,
  runTransaction,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';

// ─── Orders ─────────────────────────────────────────────

export async function fetchAllOrders() {
  const snap = await getDocs(collectionGroup(db, 'orders'));
  const orders = snap.docs.map((d) => {
    const pathParts = d.ref.path.split('/');
    const uid = pathParts[1]; // users/{uid}/orders/{orderId}
    return { id: d.id, uid, ...d.data() };
  });
  // Sort client-side to avoid requiring a Firestore collection group index
  orders.sort((a, b) => {
    const aTime = a.createdAt?.toDate?.() || new Date(0);
    const bTime = b.createdAt?.toDate?.() || new Date(0);
    return bTime - aTime;
  });
  return orders;
}

export async function createAdminOrder(data) {
  const colRef = collection(db, 'users', 'admin-legacy', 'orders');
  const orderData = {
    uid: 'admin-legacy',
    customerName: data.customerName || '',
    email: data.email || '',
    phone: data.phone || '',
    status: data.status || 'pending',
    total: data.total || 0,
    notes: data.notes || '',
    type: data.type || '',
    items: data.items || [],
    createdAt: data.createdAt ? Timestamp.fromDate(data.createdAt) : serverTimestamp(),
  };
  if (data.appointmentDate) {
    orderData.appointmentDate = data.appointmentDate;
  }
  return addDoc(colRef, orderData);
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
  const cats = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  // Sort client-side so docs without 'order' still appear (at the end)
  cats.sort((a, b) => (a.order ?? Infinity) - (b.order ?? Infinity));
  return cats;
}

export async function seedCategories(collectionName, staticData) {
  const snap = await getDocs(collection(db, collectionName));
  if (!snap.empty) {
    // Collection has data — patch any docs missing the 'order' field
    let i = 0;
    for (const d of snap.docs) {
      if (d.data().order === undefined) {
        await updateDoc(d.ref, { order: i });
      }
      i++;
    }
    return false;
  }
  // Collection is empty — seed from static data
  for (let i = 0; i < staticData.length; i++) {
    const { id, ...rest } = staticData[i];
    const ref = doc(db, collectionName, id);
    await setDoc(ref, { ...rest, order: i });
  }
  return true;
}

export async function addCategory(collectionName, id, data) {
  const ref = doc(db, collectionName, id);
  // Auto-assign order to end if not provided
  if (data.order === undefined) {
    const snap = await getDocs(collection(db, collectionName));
    data = { ...data, order: snap.size };
  }
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
  const received = orders.filter((o) => o.status === 'received').length;
  return { total, revenue, pending, confirmed, received };
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
