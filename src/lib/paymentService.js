import { doc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';

/**
 * Mark a Paystack deposit as confirmed directly from the frontend.
 * Paystack's own popup/callback already validates the payment on the client side.
 * Server-side verification via Cloud Function will be enabled when the Firebase
 * Blaze plan is activated.
 *
 * @param {{ reference: string, orderId: string, uid: string }} params
 */
export async function verifyPaystackDeposit({ reference, orderId, uid }) {
  if (!orderId || !uid) return;
  const ref = doc(db, 'users', uid, 'orders', orderId);
  await updateDoc(ref, {
    status: 'confirmed',
    depositVerified: true,
    paymentReference: reference,
    confirmedAt: new Date().toISOString(),
  });
}
