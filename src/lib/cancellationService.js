import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { sanitizeString } from './validate';

/**
 * Save a cancellation request to Firestore.
 * Called by the user when cancelling an order/appointment.
 */
export async function addCancellationRequest(data) {
  const payload = {
    orderId: sanitizeString(data.orderId, 200),
    uid: sanitizeString(data.uid, 200),
    customerName: sanitizeString(data.customerName, 200),
    customerEmail: sanitizeString(data.customerEmail, 200),
    orderType: sanitizeString(data.orderType, 50),
    serviceName: sanitizeString(data.serviceName, 200),
    appointmentDate: sanitizeString(data.appointmentDate, 100),
    reason: sanitizeString(data.reason, 1000),
    createdAt: serverTimestamp(),
    reviewed: false,
  };
  await addDoc(collection(db, 'cancellationRequests'), payload);
}

/**
 * Fetch all cancellation requests (admin only).
 */
export async function fetchCancellationRequests() {
  const snap = await getDocs(
    query(collection(db, 'cancellationRequests'), orderBy('createdAt', 'desc')),
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}
