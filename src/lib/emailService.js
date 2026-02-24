import emailjs from '@emailjs/browser';

const SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID;
const PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;
const ORDER_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_ORDER_TEMPLATE_ID;
const APPOINTMENT_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_APPOINTMENT_TEMPLATE_ID;

export async function sendConfirmationEmail(order) {
  if (!SERVICE_ID || !PUBLIC_KEY) {
    return { success: false, error: 'EmailJS is not configured. Add credentials to .env' };
  }

  const customerName = order.customerName || order.name || 'Customer';
  const customerEmail = order.email;

  if (!customerEmail) {
    return { success: false, error: 'No customer email available' };
  }

  const isAppointment = order.type === 'service';
  const templateId = isAppointment ? APPOINTMENT_TEMPLATE_ID : ORDER_TEMPLATE_ID;

  if (!templateId) {
    return { success: false, error: `No template ID configured for ${isAppointment ? 'appointments' : 'orders'}` };
  }

  const baseParams = {
    customer_name: customerName,
    customer_email: customerEmail,
    order_id: order.id,
    status: order.status || 'confirmed',
  };

  const templateParams = isAppointment
    ? { ...baseParams, appointment_date: order.appointmentDate || 'TBD' }
    : {
        ...baseParams,
        order_total: `$${(order.total || 0).toFixed(2)}`,
        order_items: order.items
          ? order.items.map((i) => `${i.name || i.title} x${i.quantity || 1}`).join(', ')
          : 'N/A',
      };

  try {
    await emailjs.send(SERVICE_ID, templateId, templateParams, PUBLIC_KEY);
    return { success: true };
  } catch (err) {
    return { success: false, error: err?.text || err?.message || 'Failed to send email' };
  }
}
