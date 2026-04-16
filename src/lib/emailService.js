import emailjs from '@emailjs/browser';

const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
const ORDER_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_ORDER_TEMPLATE_ID;

export async function sendConfirmationEmail(order) {
  if (!SERVICE_ID || !PUBLIC_KEY) {
    return { success: false, error: 'EmailJS is not configured. Add credentials to .env' };
  }

  const customerName = order.customerName || order.name || 'Customer';
  const customerEmail = order.email;

  if (!customerEmail) {
    return { success: false, error: 'No customer email available' };
  }

  if (!ORDER_TEMPLATE_ID) {
    return { success: false, error: 'No order template ID configured' };
  }

  const formatNaira = (amount) => `₦${(amount || 0).toLocaleString()}`;

  const templateParams = {
    customer_name: customerName,
    customer_email: customerEmail,
    order_id: order.id,
    status: order.status || 'confirmed',
    order_total: formatNaira(order.total),
    order_items: order.items
      ? order.items.map((i) => `${i.name || i.title} x${i.quantity || 1}`).join(', ')
      : 'N/A',
    shipping_name: order.shipping?.name || '',
    shipping_phone: order.shipping?.phone || '',
    shipping_address: order.shipping?.address || '',
    shipping_state: order.shipping?.state || '',
    shipping_lga: order.shipping?.lga || '',
  };

  try {
    await emailjs.send(SERVICE_ID, ORDER_TEMPLATE_ID, templateParams, PUBLIC_KEY);
    return { success: true };
  } catch (err) {
    return { success: false, error: err?.text || err?.message || 'Failed to send email' };
  }
}
