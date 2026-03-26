import { getFunctions, httpsCallable } from 'firebase/functions';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { app } from './firebase';
import { db } from './firebase';

const functions = getFunctions(app);
const verifyFn = httpsCallable(functions, 'verifyPaystackDeposit');

/**
 * Directly confirms an order in Firestore from the client side.
 * Requires the order to already have a paymentReference (set during saveOrder).
 * This is the primary confirmation path — fast, no server round-trip.
 */
export async function confirmOrderDirectly(uid, orderId) {
  if (!uid || !orderId) return;
  const orderRef = doc(db, 'users', uid, 'orders', orderId);
  await updateDoc(orderRef, {
    status: 'confirmed',
    depositVerified: true,
    depositPaidAt: serverTimestamp(),
  });
}

/**
 * Calls the server-side Firebase Function to verify a Paystack payment reference
 * with Paystack's API. Used as background verification after direct confirmation.
 *
 * @param {{ reference: string, orderId: string, uid: string, expectedAmountKobo?: number }} params
 */
export async function verifyPaystackDeposit({ reference, orderId, uid, expectedAmountKobo }) {
  if (!orderId || !uid || !reference) return;
  await verifyFn({ reference, orderId, expectedAmountKobo });
}
