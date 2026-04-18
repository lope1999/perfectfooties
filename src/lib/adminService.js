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
  arrayUnion,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import {
  validateCollectionName,
  sanitizeString,
  validateNumber,
  validateOrderStatus,
} from './validate';
import { updateBookedSlotStatus } from './bookedSlotsService';
import { awardPointsForOrder } from './loyaltyService';

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
  const customerName = sanitizeString(data.customerName, 200);
  const email = sanitizeString(data.email, 200);
  const phone = sanitizeString(data.phone, 50);
  const notes = sanitizeString(data.notes, 2000);
  const total = validateNumber(data.total || 0, { min: 0, label: 'total' });

  const colRef = collection(db, 'users', 'admin-legacy', 'orders');
  const orderData = {
    uid: 'admin-legacy',
    customerName,
    email,
    phone,
    status: data.status || 'pending',
    total,
    notes,
    type: data.type || '',
    items: Array.isArray(data.items) ? data.items.slice(0, 50) : [],
    createdAt: data.createdAt ? Timestamp.fromDate(data.createdAt) : serverTimestamp(),
  };
  if (data.appointmentDate) {
    orderData.appointmentDate = data.appointmentDate;
  }
  return addDoc(colRef, orderData);
}

const APPOINTMENT_ONLY_STATUSES = new Set(['no-show', 'rescheduled', 'in progress']);

export async function updateOrderStatus(uid, orderId, status, extra = {}) {
  const kind = APPOINTMENT_ONLY_STATUSES.has(status) ? 'appointment' : 'order';
  validateOrderStatus(status, kind);
  const ref = doc(db, 'users', uid, 'orders', orderId);
  updateBookedSlotStatus(orderId, status).catch(() => {});
  await updateDoc(ref, {
    status,
    ...extra,
    statusHistory: arrayUnion({ status, at: new Date().toISOString() }),
  });
  // Award loyalty points: retail/press-on orders on 'received', service appointments on 'completed'
  if (status === 'received' || status === 'completed') {
    const snap = await getDoc(ref).catch(() => null);
    const orderType = snap?.data()?.type || 'retail';
    if (status === 'received' && orderType !== 'service') {
      awardPointsForOrder(uid, orderId, orderType).catch(() => {});
    } else if (status === 'completed' && orderType === 'service') {
      awardPointsForOrder(uid, orderId, orderType).catch(() => {});
    }
  }
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
  const sanitized = sanitizeString(text, 2000);
  if (!sanitized) throw new Error('Note text is required');
  const ref = doc(db, 'users', uid, 'orders', orderId);
  const snap = await getDoc(ref);
  const existing = snap.data()?.adminNotes || [];
  return updateDoc(ref, {
    adminNotes: [...existing, { text: sanitized, timestamp: new Date().toISOString() }],
  });
}

// ─── Categories ─────────────────────────────────────────

export async function fetchCategories(collectionName) {
  validateCollectionName(collectionName);
  const snap = await getDocs(collection(db, collectionName));
  const cats = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
  // Sort client-side so docs without 'order' still appear (at the end)
  cats.sort((a, b) => (a.order ?? Infinity) - (b.order ?? Infinity));
  return cats;
}

/**
 * Seed Firestore from static data if a collection is empty, and return
 * the category data so callers don't need a second read.
 *
 * @returns {Promise<Array>} The category documents (already sorted).
 */
export async function seedAndFetchCategories(collectionName, staticData) {
  validateCollectionName(collectionName);
  const snap = await getDocs(collection(db, collectionName));

  if (!snap.empty) {
    // Patch docs missing the 'order' field (fire-and-forget, don't block)
    const patches = [];
    let i = 0;
    for (const d of snap.docs) {
      if (d.data().order === undefined) {
        patches.push(updateDoc(d.ref, { order: i }));
      }
      i++;
    }
    if (patches.length > 0) Promise.all(patches).catch(() => {});

    const cats = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    cats.sort((a, b) => (a.order ?? Infinity) - (b.order ?? Infinity));
    return cats;
  }

  // Collection is empty — seed from static data
  await Promise.all(
    staticData.map(({ id: docId, ...rest }, i) =>
      setDoc(doc(db, collectionName, docId), { ...rest, order: i })
    )
  );

  // Return the static data as the result (matches shape of fetched docs)
  return staticData.map(({ id: docId, ...rest }, i) => ({ id: docId, ...rest, order: i }));
}

export async function addCategory(collectionName, id, data) {
  validateCollectionName(collectionName);
  const ref = doc(db, collectionName, id);
  // Auto-assign order to end if not provided
  if (data.order === undefined) {
    const snap = await getDocs(collection(db, collectionName));
    data = { ...data, order: snap.size };
  }
  return setDoc(ref, { ...data, products: data.products || [] });
}

export async function updateCategory(collectionName, id, updates) {
  validateCollectionName(collectionName);
  const ref = doc(db, collectionName, id);
  return updateDoc(ref, updates);
}

export async function deleteCategory(collectionName, id) {
  validateCollectionName(collectionName);
  const ref = doc(db, collectionName, id);
  return deleteDoc(ref);
}

// ─── Products (nested array inside category docs) ───────

export async function addProduct(collectionName, categoryId, product) {
  validateCollectionName(collectionName);
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
  validateCollectionName(collectionName);
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
  validateCollectionName(collectionName);
  const ref = doc(db, collectionName, categoryId);
  await runTransaction(db, async (transaction) => {
    const snap = await transaction.get(ref);
    if (!snap.exists()) throw new Error(`Category ${categoryId} not found`);
    const products = snap.data().products.filter((p) => p.id !== productId);
    transaction.update(ref, { products });
  });
}

// ─── Users ──────────────────────────────────────────────

export async function fetchAllUsers() {
  const snap = await getDocs(collection(db, 'users'));
  return snap.docs
    .filter((d) => d.id !== 'admin-legacy')
    .map((d) => ({ uid: d.id, ...d.data() }));
}

export function computeUserStats(users, orders) {
  const ordersByUid = {};
  for (const o of orders) {
    const uid = o.uid;
    if (!uid) continue;
    if (!ordersByUid[uid]) ordersByUid[uid] = [];
    ordersByUid[uid].push(o);
  }

  return users.map((u) => {
    const userOrders = ordersByUid[u.uid] || [];
    const orderCount = userOrders.filter((o) => o.type !== 'service').length;
    const appointmentCount = userOrders.filter((o) => o.type === 'service').length;
    const totalPaid = userOrders
      .filter((o) => REVENUE_STATUSES.includes(o.status))
      .reduce((sum, o) => sum + (o.total || 0) + (o.extraCharge || 0), 0);
    const lastOrder = userOrders.length > 0
      ? userOrders.reduce((latest, o) => {
          const t = o.createdAt?.toDate?.() || new Date(0);
          return t > latest ? t : latest;
        }, new Date(0))
      : null;
    return {
      ...u,
      orderCount,
      appointmentCount,
      totalPaid,
      lastOrderDate: lastOrder,
      isRegular: orderCount + appointmentCount >= 3,
    };
  });
}

// ─── Customer Perks ─────────────────────────────────────

export async function updateCustomerPerks(uid, perks) {
  const ref = doc(db, 'users', uid);
  return updateDoc(ref, { tierPerks: perks });
}

// ─── Service Discounts ──────────────────────────────────

export async function fetchServiceDiscounts() {
  const snap = await getDocs(collection(db, 'serviceDiscounts'));
  const map = {};
  snap.docs.forEach((d) => { map[d.id] = d.data(); });
  return map;
}

export async function setServiceDiscount(serviceId, data) {
  const ref = doc(db, 'serviceDiscounts', serviceId);
  return setDoc(ref, data, { merge: true });
}

export async function removeServiceDiscount(serviceId) {
  const ref = doc(db, 'serviceDiscounts', serviceId);
  return deleteDoc(ref);
}

// ─── Service Category + Service Item CRUD ───────────────

export async function addServiceCategory(id, data) {
  const ref = doc(db, 'serviceCategories', id);
  const snap = await getDocs(collection(db, 'serviceCategories'));
  return setDoc(ref, { ...data, services: data.services || [], order: snap.size });
}

export async function updateServiceCategory(id, updates) {
  const ref = doc(db, 'serviceCategories', id);
  return updateDoc(ref, updates);
}

export async function deleteServiceCategory(id) {
  const ref = doc(db, 'serviceCategories', id);
  return deleteDoc(ref);
}

export async function addServiceItem(categoryId, item) {
  const ref = doc(db, 'serviceCategories', categoryId);
  await runTransaction(db, async (transaction) => {
    const snap = await transaction.get(ref);
    if (!snap.exists()) throw new Error(`Category ${categoryId} not found`);
    const services = [...(snap.data().services || [])];
    services.push({ ...item, id: item.id || crypto.randomUUID() });
    transaction.update(ref, { services });
  });
}

export async function updateServiceItem(categoryId, serviceId, updates) {
  const ref = doc(db, 'serviceCategories', categoryId);
  await runTransaction(db, async (transaction) => {
    const snap = await transaction.get(ref);
    if (!snap.exists()) throw new Error(`Category ${categoryId} not found`);
    const services = (snap.data().services || []).map((s) =>
      s.id === serviceId ? { ...s, ...updates } : s
    );
    transaction.update(ref, { services });
  });
}

export async function deleteServiceItem(categoryId, serviceId) {
  const ref = doc(db, 'serviceCategories', categoryId);
  await runTransaction(db, async (transaction) => {
    const snap = await transaction.get(ref);
    if (!snap.exists()) throw new Error(`Category ${categoryId} not found`);
    const services = (snap.data().services || []).filter((s) => s.id !== serviceId);
    transaction.update(ref, { services });
  });
}

// ─── Stats ──────────────────────────────────────────────

const REVENUE_STATUSES = ['confirmed', 'received', 'completed'];

export function computeDashboardStats(orders) {
  const total = orders.length;
  const revenue = orders
    .filter((o) => REVENUE_STATUSES.includes(o.status))
    .reduce((sum, o) => sum + (o.total || 0) + (o.extraCharge || 0), 0);
  const pending = orders.filter((o) => o.status === 'pending').length;
  const confirmed = orders.filter((o) => o.status === 'confirmed').length;
  const production = orders.filter((o) => o.status === 'production').length;
  const received = orders.filter((o) => o.status === 'received').length;
  return { total, revenue, pending, confirmed, production, received };
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
