function escapeCSV(value) {
  const str = String(value ?? '');
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function exportOrdersToCSV(orders, filename = 'orders.csv') {
  const headers = [
    'Order ID',
    'Customer Name',
    'User ID',
    'Type',
    'Status',
    'Total',
    'Items',
    'Admin Notes',
    'Date',
    'Ship Name',
    'Ship Phone',
    'Ship Address',
    'Ship State',
    'Ship LGA',
  ];

  const rows = orders.map((o) => [
    o.id,
    o.customerName || o.name || '',
    o.uid || '',
    o.type || '',
    o.status || '',
    o.total ?? '',
    (o.items || []).map((i) => `${i.name || i.title || ''} x${i.quantity || 1}`).join('; '),
    (o.adminNotes || []).map((n) => n.text).join('; '),
    o.createdAt?.toDate ? o.createdAt.toDate().toLocaleDateString() : '',
    o.shipping?.name || '',
    o.shipping?.phone || '',
    o.shipping?.address || '',
    o.shipping?.state || '',
    o.shipping?.lga || '',
  ]);

  const csv =
    '\uFEFF' +
    [headers, ...rows].map((row) => row.map(escapeCSV).join(',')).join('\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
