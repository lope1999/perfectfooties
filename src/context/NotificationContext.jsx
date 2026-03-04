import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './AuthContext';
import { fetchOrders } from '../lib/orderService';
import { parseAppointmentDate, isWithinHours, isUpcoming, formatRelativeTime } from '../lib/appointmentDateUtils';

const NotificationContext = createContext(null);

const DISMISSED_KEY = 'chizzystyles-notifications-dismissed';

const STATUS_LABELS = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  processing: 'Processing',
  shipped: 'Shipped',
  completed: 'Completed',
  cancelled: 'Cancelled',
  received: 'Received',
};

function getOrderLabel(order) {
  if (order.type === 'service') {
    return order.items?.[0]?.serviceName || 'your appointment';
  }
  return order.items?.[0]?.name || 'your press-on order';
}

function getDismissed() {
  try {
    return JSON.parse(localStorage.getItem(DISMISSED_KEY) || '[]');
  } catch {
    return [];
  }
}

function saveDismissed(ids) {
  localStorage.setItem(DISMISSED_KEY, JSON.stringify(ids));
}

function buildNotifications(orders) {
  const notifications = [];

  for (const order of orders) {
    if (order.status === 'received') continue;

    const dateStr = order.appointmentDate || order.items?.[0]?.date;
    if (!dateStr) continue;

    const parsed = parseAppointmentDate(dateStr);
    if (!parsed) continue;

    if (isWithinHours(parsed, 24.5)) {
      notifications.push({
        id: `reminder-${order.id}`,
        type: 'appointment-reminder',
        orderId: order.id,
        title: 'Appointment Soon',
        message: `Your appointment for ${order.items?.[0]?.serviceName || 'a service'} is ${formatRelativeTime(parsed)}`,
        date: parsed,
        dateStr,
        serviceName: order.items?.[0]?.serviceName || 'Service',
      });
    } else if (isUpcoming(parsed)) {
      notifications.push({
        id: `upcoming-${order.id}`,
        type: 'appointment-upcoming',
        orderId: order.id,
        title: 'Upcoming Appointment',
        message: `${order.items?.[0]?.serviceName || 'Service'} — ${dateStr}`,
        date: parsed,
        dateStr,
        serviceName: order.items?.[0]?.serviceName || 'Service',
      });
    }
  }

  notifications.sort((a, b) => {
    if (a.type !== b.type) return a.type === 'appointment-reminder' ? -1 : 1;
    return a.date - b.date;
  });

  return notifications;
}

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const [appointmentNotifications, setAppointmentNotifications] = useState([]);
  const [statusChangeNotifications, setStatusChangeNotifications] = useState([]);
  const [toastQueue, setToastQueue] = useState([]);
  const [dismissed, setDismissed] = useState(getDismissed);
  const [loading, setLoading] = useState(false);

  const statusMapRef = useRef({});
  const initialLoadDoneRef = useRef(false);

  // Fetch appointment-related notifications (existing logic)
  useEffect(() => {
    if (!user) {
      setAppointmentNotifications([]);
      return;
    }

    let cancelled = false;
    setLoading(true);

    fetchOrders(user.uid, 'service')
      .then((orders) => {
        if (!cancelled) setAppointmentNotifications(buildNotifications(orders));
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [user?.uid]);

  // Real-time listener for order status changes
  useEffect(() => {
    if (!user) {
      statusMapRef.current = {};
      initialLoadDoneRef.current = false;
      setStatusChangeNotifications([]);
      setToastQueue([]);
      return;
    }

    const ordersRef = collection(db, 'users', user.uid, 'orders');
    const q = query(ordersRef, orderBy('createdAt', 'desc'));

    const unsub = onSnapshot(q, (snapshot) => {
      if (!initialLoadDoneRef.current) {
        // First load — populate the status map, no notifications
        const map = {};
        snapshot.docs.forEach((doc) => {
          map[doc.id] = doc.data().status;
        });
        statusMapRef.current = map;
        initialLoadDoneRef.current = true;
        return;
      }

      // Subsequent updates — check for status changes
      const changes = snapshot.docChanges();
      const newNotifications = [];
      const newToasts = [];

      for (const change of changes) {
        if (change.type !== 'modified') {
          // Track newly added docs too
          if (change.type === 'added') {
            statusMapRef.current[change.doc.id] = change.doc.data().status;
          }
          continue;
        }

        const docData = change.doc.data();
        const orderId = change.doc.id;
        const oldStatus = statusMapRef.current[orderId];
        const newStatus = docData.status;

        // Only notify for pressOn and service order types
        if (docData.type !== 'pressOn' && docData.type !== 'service') {
          statusMapRef.current[orderId] = newStatus;
          continue;
        }

        if (oldStatus && oldStatus !== newStatus) {
          const label = getOrderLabel(docData);
          const statusText = STATUS_LABELS[newStatus] || newStatus;
          const notification = {
            id: `status-${orderId}-${Date.now()}`,
            type: 'status-change',
            orderId,
            title: `Order ${statusText}`,
            message: `Status of ${label} changed from ${STATUS_LABELS[oldStatus] || oldStatus} to ${statusText}`,
            status: newStatus,
            timestamp: Date.now(),
          };

          newNotifications.push(notification);
          newToasts.push(notification);
        }

        statusMapRef.current[orderId] = newStatus;
      }

      if (newNotifications.length > 0) {
        setStatusChangeNotifications((prev) => [...newNotifications, ...prev]);
      }
      if (newToasts.length > 0) {
        setToastQueue((prev) => [...prev, ...newToasts]);
      }
    });

    return () => {
      unsub();
      statusMapRef.current = {};
      initialLoadDoneRef.current = false;
    };
  }, [user?.uid]);

  const dismiss = useCallback((id) => {
    setDismissed((prev) => {
      const next = [...prev, id];
      saveDismissed(next);
      return next;
    });
  }, []);

  const dismissToast = useCallback(() => {
    setToastQueue((prev) => prev.slice(1));
  }, []);

  // Merge all notifications: reminders first, then upcoming, then status changes (newest first)
  const allNotifications = [
    ...appointmentNotifications,
    ...statusChangeNotifications,
  ];

  const dismissAll = useCallback(() => {
    setDismissed((prev) => {
      const next = [...new Set([...prev, ...allNotifications.map((n) => n.id)])];
      saveDismissed(next);
      return next;
    });
  }, [allNotifications]);

  const undismissedCount = allNotifications.filter((n) => !dismissed.includes(n.id)).length;
  const urgentNotifications = allNotifications.filter((n) => n.type === 'appointment-reminder');
  const currentToast = toastQueue[0] || null;

  return (
    <NotificationContext.Provider
      value={{
        notifications: allNotifications,
        dismissed,
        undismissedCount,
        urgentNotifications,
        dismiss,
        dismissAll,
        loading,
        currentToast,
        dismissToast,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications must be used within a NotificationProvider');
  return context;
}
