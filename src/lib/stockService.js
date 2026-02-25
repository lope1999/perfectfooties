import { doc, runTransaction, collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import { validateCollectionName, validateNumber } from './validate';

/**
 * Decrement stock for a single product inside a category document.
 *
 * @param {'productCategories' | 'retailCategories'} collectionName
 * @param {string} categoryId  — Firestore document ID (e.g. "available-pressons", "aftercare")
 * @param {string} productId   — Product id inside the products array
 * @param {number} quantity    — How many to decrement
 * @returns {Promise<void>}
 */
export async function decrementStock(collectionName, categoryId, productId, quantity = 1) {
  validateCollectionName(collectionName);
  validateNumber(quantity, { min: 1, label: 'quantity' });
  if (!Number.isInteger(quantity)) throw new Error('Quantity must be a whole number');

  const ref = doc(db, collectionName, categoryId);

  await runTransaction(db, async (transaction) => {
    const snap = await transaction.get(ref);
    if (!snap.exists()) throw new Error(`Category ${categoryId} not found`);

    const data = snap.data();
    const products = [...data.products];
    const idx = products.findIndex((p) => p.id === productId);
    if (idx === -1) throw new Error(`Product ${productId} not found in ${categoryId}`);

    const current = products[idx].stock;
    if (current === undefined) return; // No stock tracking for this product
    if (current < quantity) throw new Error(`Insufficient stock for ${productId} (have ${current}, need ${quantity})`);

    products[idx] = { ...products[idx], stock: current - quantity };
    transaction.update(ref, { products });
  });
}

/**
 * Batch-decrement stock for multiple items at once.
 *
 * @param {Array<{ collection: string, categoryId: string, productId: string, quantity: number }>} items
 * @returns {Promise<void>}
 */
export async function decrementStockBatch(items) {
  // Validate all items up front
  for (const item of items) {
    validateCollectionName(item.collection);
    validateNumber(item.quantity, { min: 1, label: 'quantity' });
  }

  // Group by collection + categoryId so we only run one transaction per document
  const grouped = {};
  for (const item of items) {
    const key = `${item.collection}::${item.categoryId}`;
    if (!grouped[key]) grouped[key] = { collection: item.collection, categoryId: item.categoryId, decrements: [] };
    grouped[key].decrements.push({ productId: item.productId, quantity: item.quantity });
  }

  for (const { collection: collName, categoryId, decrements } of Object.values(grouped)) {
    const ref = doc(db, collName, categoryId);

    await runTransaction(db, async (transaction) => {
      const snap = await transaction.get(ref);
      if (!snap.exists()) throw new Error(`Category ${categoryId} not found`);

      const data = snap.data();
      const products = [...data.products];

      for (const { productId, quantity } of decrements) {
        const idx = products.findIndex((p) => p.id === productId);
        if (idx === -1) continue;

        const current = products[idx].stock;
        if (current === undefined) continue;
        if (current < quantity) throw new Error(`Insufficient stock for ${productId} (have ${current}, need ${quantity})`);

        products[idx] = { ...products[idx], stock: current - quantity };
      }

      transaction.update(ref, { products });
    });
  }
}

/**
 * Save a stock notification request so the user is notified when a product is back in stock.
 * Throws with code 'ALREADY_SUBSCRIBED' if the same email+productId combo already exists.
 *
 * @param {{ email: string, productId: string, productName: string }} params
 * @returns {Promise<void>}
 */
export async function saveStockNotification({ email, productId, productName }) {
  const col = collection(db, 'stockNotifications');

  // Duplicate prevention
  const q = query(col, where('email', '==', email), where('productId', '==', productId));
  const existing = await getDocs(q);
  if (!existing.empty) {
    const err = new Error('You are already subscribed to notifications for this product.');
    err.code = 'ALREADY_SUBSCRIBED';
    throw err;
  }

  await addDoc(col, {
    email,
    productId,
    productName,
    createdAt: serverTimestamp(),
  });
}
