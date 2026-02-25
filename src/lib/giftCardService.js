import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  query,
  where,
  orderBy,
  updateDoc,
  deleteDoc,
  runTransaction,
  serverTimestamp,
  Timestamp,
  arrayUnion,
} from 'firebase/firestore';
import { db } from './firebase';
import { validateGiftCardStatus } from './validate';

// Characters excluding ambiguous ones (O/0/I/1/l)
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function randomCode(length = 8) {
  let code = '';
  const arr = new Uint8Array(length);
  crypto.getRandomValues(arr);
  for (let i = 0; i < length; i++) {
    code += CODE_CHARS[arr[i] % CODE_CHARS.length];
  }
  return code;
}

/**
 * Generate a unique 8-char gift card code.
 */
export async function generateGiftCardCode() {
  const col = collection(db, 'giftCards');
  let code;
  let exists = true;
  while (exists) {
    code = randomCode();
    const snap = await getDocs(query(col, where('code', '==', code)));
    exists = !snap.empty;
  }
  return code;
}

/**
 * Create a new gift card document (purchase).
 */
export async function createGiftCard({ type, giftedTo, amount, purchasedBy }) {
  const code = await generateGiftCardCode();
  const col = collection(db, 'giftCards');
  const docRef = await addDoc(col, {
    code,
    type,
    amount,
    balance: amount,
    status: 'pending',
    giftedTo,
    purchasedBy: purchasedBy || { uid: null, name: 'Guest', email: '' },
    createdAt: serverTimestamp(),
    activatedAt: null,
    expiresAt: null,
    transactions: [],
  });
  return { id: docRef.id, code };
}

/**
 * Look up a gift card by code. Returns card data or null.
 */
export async function lookupGiftCard(code) {
  const col = collection(db, 'giftCards');
  const snap = await getDocs(query(col, where('code', '==', code.toUpperCase().trim())));
  if (snap.empty) return null;
  const d = snap.docs[0];
  return { id: d.id, ...d.data() };
}

/**
 * Validate that a card is usable for redemption.
 * Returns { valid, error, card }.
 */
export function validateCardForRedemption(card, requiredAmount = 0) {
  if (!card) return { valid: false, error: 'Gift card not found' };
  if (card.status === 'pending') return { valid: false, error: 'This gift card has not been activated yet' };
  if (card.status === 'fully_redeemed') return { valid: false, error: 'This gift card has been fully redeemed' };
  if (card.status === 'expired') return { valid: false, error: 'This gift card has expired' };
  if (card.status !== 'active' && card.status !== 'partially_used') {
    return { valid: false, error: 'This gift card is not active' };
  }
  if (card.expiresAt) {
    const expiry = card.expiresAt.toDate ? card.expiresAt.toDate() : new Date(card.expiresAt);
    if (expiry < new Date()) return { valid: false, error: 'This gift card has expired' };
  }
  if (card.balance <= 0) return { valid: false, error: 'This gift card has no remaining balance' };
  if (requiredAmount > 0 && card.balance < requiredAmount) {
    return { valid: false, error: `Insufficient balance (₦${card.balance.toLocaleString()} available)` };
  }
  return { valid: true, error: null, card };
}

/**
 * Redeem a gift card amount using a Firestore transaction.
 */
export async function redeemGiftCard(code, amount, orderId) {
  const col = collection(db, 'giftCards');
  const snap = await getDocs(query(col, where('code', '==', code.toUpperCase().trim())));
  if (snap.empty) throw new Error('Gift card not found');

  const cardRef = snap.docs[0].ref;

  await runTransaction(db, async (transaction) => {
    const cardSnap = await transaction.get(cardRef);
    if (!cardSnap.exists()) throw new Error('Gift card not found');

    const data = cardSnap.data();
    const validation = validateCardForRedemption(data, amount);
    if (!validation.valid) throw new Error(validation.error);

    const newBalance = data.balance - amount;
    const newStatus = newBalance <= 0 ? 'fully_redeemed' : 'partially_used';

    transaction.update(cardRef, {
      balance: newBalance,
      status: newStatus,
      transactions: arrayUnion({
        amount,
        orderId: orderId || null,
        date: new Date().toISOString(),
      }),
    });
  });
}

// ─── Admin Operations ────────────────────────────────────

/**
 * Fetch all gift cards, sorted by createdAt desc.
 */
export async function fetchAllGiftCards() {
  const col = collection(db, 'giftCards');
  const snap = await getDocs(query(col, orderBy('createdAt', 'desc')));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/**
 * Activate a pending gift card — sets status to active with 1-year expiry.
 */
export async function activateGiftCard(cardId) {
  const ref = doc(db, 'giftCards', cardId);
  const now = new Date();
  const expiresAt = new Date(now);
  expiresAt.setFullYear(expiresAt.getFullYear() + 1);
  return updateDoc(ref, {
    status: 'active',
    activatedAt: serverTimestamp(),
    expiresAt: Timestamp.fromDate(expiresAt),
  });
}

/**
 * Update gift card status (admin manual change).
 */
export async function updateGiftCardStatus(cardId, status) {
  validateGiftCardStatus(status);
  const ref = doc(db, 'giftCards', cardId);
  return updateDoc(ref, { status });
}

/**
 * Delete a gift card (admin).
 */
export async function deleteGiftCard(cardId) {
  const ref = doc(db, 'giftCards', cardId);
  return deleteDoc(ref);
}
