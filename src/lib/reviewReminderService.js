import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from './firebase';
import { getReviewedOrderIds } from './testimonialService';

const MIN_AGE_HOURS = 24;

/**
 * Returns unreviewed completed/received orders AND completed appointments
 * that are at least 24 hours old. Each item has a `type` field: 'order' | 'appointment'.
 */
export async function fetchUnreviewedCompletedOrders(uid) {
  const cutoff = new Date(Date.now() - MIN_AGE_HOURS * 60 * 60 * 1000);

  // Fetch completed/received orders
  const ordersSnap = await getDocs(
    query(collection(db, 'users', uid, 'orders'), where('status', 'in', ['completed', 'received'])),
  );
  const agedOrders = ordersSnap.docs
    .map((d) => ({ id: d.id, type: 'order', ...d.data() }))
    .filter((o) => {
      const created = o.createdAt?.toDate?.() ?? new Date(o.createdAt ?? 0);
      return created < cutoff;
    });

  // Fetch completed appointments from bookedSlots (query by uid, filter status client-side)
  const slotsSnap = await getDocs(
    query(collection(db, 'bookedSlots'), where('uid', '==', uid)),
  );
  const agedAppointments = slotsSnap.docs
    .map((d) => ({ id: d.id, type: 'appointment', ...d.data() }))
    .filter((s) => {
      if (s.status !== 'completed') return false;
      const created = s.createdAt?.toDate?.() ?? new Date(s.createdAt ?? 0);
      return created < cutoff;
    });

  const combined = [...agedOrders, ...agedAppointments];
  if (combined.length === 0) return [];

  const reviewed = await getReviewedOrderIds(combined.map((o) => o.id));
  return combined.filter((o) => !reviewed.has(o.id));
}
