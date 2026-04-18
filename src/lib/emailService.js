import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions();
const sendAdminEmailFn = httpsCallable(functions, 'sendAdminEmail');
const sendNewsletterFn = httpsCallable(functions, 'sendNewsletter');

/**
 * Sends a confirmation email for an order via Cloud Function (avoids CORS).
 */
export async function sendConfirmationEmail(order) {
  if (!order?.email) return { success: false, error: 'No customer email on this order' };
  try {
    await sendAdminEmailFn({ order });
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message || 'Failed to send email' };
  }
}

/**
 * Newsletter welcome — kept as no-op in the browser; newsletter sends
 * should be triggered server-side when a subscriber record is created.
 */
export async function sendNewsletterWelcome(_email) {
  return { success: true };
}

export async function sendNewsletterBatch(newsletterId) {
  try {
    const result = await sendNewsletterFn({ newsletterId });
    return { success: true, sentCount: result.data.sentCount };
  } catch (err) {
    return { success: false, error: err.message || 'Failed to send newsletter' };
  }
}
