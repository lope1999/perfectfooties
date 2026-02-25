import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { fetchOrders } from '../lib/orderService';
import { parseAppointmentDate, isWithinHours, isUpcoming, formatRelativeTime } from '../lib/appointmentDateUtils';

const NotificationContext = createContext(null);

const DISMISSED_KEY = 'chizzystyles-notifications-dismissed';

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

  // Sort: reminders first, then by date ascending
  notifications.sort((a, b) => {
    if (a.type !== b.type) return a.type === 'appointment-reminder' ? -1 : 1;
    return a.date - b.date;
  });

  return notifications;
}

export function NotificationProvider({ children }) {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [dismissed, setDismissed] = useState(getDismissed);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      return;
    }

    let cancelled = false;
    setLoading(true);

    fetchOrders(user.uid, 'service')
      .then((orders) => {
        if (!cancelled) setNotifications(buildNotifications(orders));
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [user?.uid]);

  const dismiss = useCallback((id) => {
    setDismissed((prev) => {
      const next = [...prev, id];
      saveDismissed(next);
      return next;
    });
  }, []);

  const dismissAll = useCallback(() => {
    setDismissed((prev) => {
      const next = [...new Set([...prev, ...notifications.map((n) => n.id)])];
      saveDismissed(next);
      return next;
    });
  }, [notifications]);

  const undismissedCount = notifications.filter((n) => !dismissed.includes(n.id)).length;
  const urgentNotifications = notifications.filter((n) => n.type === 'appointment-reminder');

  return (
    <NotificationContext.Provider
      value={{ notifications, dismissed, undismissedCount, urgentNotifications, dismiss, dismissAll, loading }}
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
