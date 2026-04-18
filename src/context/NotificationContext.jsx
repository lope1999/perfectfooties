import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from './AuthContext';

const NotificationContext = createContext(null);

const DISMISSED_KEY = 'perfectfooties-notifications-dismissed';

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
  return order.items?.[0]?.name || 'your order';
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

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const [statusChangeNotifications, setStatusChangeNotifications] = useState([]);
  const [toastQueue, setToastQueue] = useState([]);
  const [dismissed, setDismissed] = useState(getDismissed);
  const [loading] = useState(false);

  const statusMapRef = useRef({});
  const initialLoadDoneRef = useRef(false);

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

        // Only notify for leather orders
        if (!['leather', 'mixed', 'nicheCollection', 'product'].includes(docData.type)) {
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

  const showToast
 = useCallback((message, severity = 'success', title = '') => {
    setToastQueue((prev) => [
      ...prev,
      {
        id: `action-${Date.now()}-${Math.random()}`,
        type: 'action',
        severity,
        title,
        message,
        timestamp: Date.now(),
      },
    ]);
  }, []);

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

  const allNotifications = [...statusChangeNotifications];

  const dismissAll = useCallback(() => {
    setDismissed((prev) => {
      const next = [...new Set([...prev, ...allNotifications.map((n) => n.id)])];
      saveDismissed(next);
      return next;
    });
  }, [allNotifications]);

  const undismissedCount = allNotifications.filter((n) => !dismissed.includes(n.id)).length;
  const urgentNotifications = [];
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
        showToast,
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
