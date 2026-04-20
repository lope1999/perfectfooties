import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions();
const sendNewsletterFn = httpsCallable(functions, 'sendNewsletter');

/**
 * Sends a confirmation email for an order.
 * Note: Confirmation emails are sent server-side via the onOrderStatusChanged
 * Firestore trigger when the order status changes to 'confirmed'.
 */
export async function sendConfirmationEmail(order) {
	// Email is sent automatically when order status updates on the server.
	// Client does not send emails directly to avoid CORS issues.
	return { success: true };
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
