import { useMemo } from 'react';
import OrdersSection from './OrdersSection';

export default function AppointmentsSection({ orders, loading, onRefresh }) {
  const serviceOrders = useMemo(
    () => orders.filter((o) => o.type === 'service'),
    [orders]
  );

  return (
    <OrdersSection
      orders={serviceOrders}
      loading={loading}
      onRefresh={onRefresh}
      filterType="service"
    />
  );
}
