const { onDocumentUpdated } = require("firebase-functions/v2/firestore");
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const { initializeApp } = require("firebase-admin/app");
const { logger } = require("firebase-functions");

const { findRestockedProducts } = require("./lib/stockDiff");
const { sendBackInStockEmail, sendAppointmentConfirmationEmail } = require("./lib/emailSender");

initializeApp();

const SHOP_URL = "https://chizzystyles.com";

// ── Back-in-stock handler ─────────────────────────────────────────────────────
async function handleCategoryUpdate(event) {
  const beforeProducts = event.data.before.data().products || [];
  const afterProducts = event.data.after.data().products || [];

  const restocked = findRestockedProducts(beforeProducts, afterProducts);
  if (restocked.length === 0) return;

  logger.info(`Restocked products detected: ${restocked.map((p) => p.name).join(", ")}`);

  const db = getFirestore();
  const serviceId = process.env.EMAILJS_SERVICE_ID;
  const publicKey = process.env.EMAILJS_PUBLIC_KEY;
  const privateKey = process.env.EMAILJS_PRIVATE_KEY;
  const templateId = process.env.EMAILJS_STOCK_TEMPLATE_ID;

  for (const product of restocked) {
    const snap = await db
      .collection("stockNotifications")
      .where("productId", "==", product.id)
      .get();

    if (snap.empty) {
      logger.info(`No subscribers for "${product.name}" (${product.id})`);
      continue;
    }

    logger.info(`Sending back-in-stock email to ${snap.size} subscriber(s) for "${product.name}"`);

    for (const doc of snap.docs) {
      const { email } = doc.data();
      try {
        await sendBackInStockEmail({
          serviceId,
          templateId,
          publicKey,
          privateKey,
          templateParams: {
            to_email: email,
            product_name: product.name,
            shop_url: SHOP_URL,
          },
        });
        logger.info(`Email sent to ${email} for "${product.name}"`);
        await doc.ref.delete();
      } catch (err) {
        logger.error(`Failed to send email to ${email} for "${product.name}":`, err);
      }
    }
  }
}

// ── Triggers: product restocking ──────────────────────────────────────────────
exports.onProductCategoryUpdated = onDocumentUpdated(
  "productCategories/{categoryId}",
  handleCategoryUpdate,
);

exports.onRetailCategoryUpdated = onDocumentUpdated(
  "retailCategories/{categoryId}",
  handleCategoryUpdate,
);

// ── Callable: verify Paystack deposit ─────────────────────────────────────────
exports.verifyPaystackDeposit = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Must be signed in to verify payment");
  }

  const uid = request.auth.uid;
  const { reference, orderId, expectedAmountKobo } = request.data;

  if (!reference || !orderId) {
    throw new HttpsError("invalid-argument", "reference and orderId are required");
  }

  const secretKey = process.env.PAYSTACK_SECRET_KEY;
  if (!secretKey) {
    throw new HttpsError("internal", "Paystack secret key not configured");
  }

  // Verify with Paystack
  const res = await fetch(
    `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
    { headers: { Authorization: `Bearer ${secretKey}` } },
  );
  const json = await res.json();

  if (!json.status || json.data?.status !== "success") {
    throw new HttpsError("failed-precondition", "Paystack payment not successful");
  }

  if (expectedAmountKobo && json.data.amount < expectedAmountKobo) {
    throw new HttpsError("failed-precondition", "Payment amount is less than expected");
  }

  // Mark order confirmed — triggers onAppointmentConfirmed → sends email
  const db = getFirestore();
  await db.doc(`users/${uid}/orders/${orderId}`).update({
    status: "confirmed",
    depositVerified: true,
    depositPaidAt: FieldValue.serverTimestamp(),
  });

  logger.info(`Deposit verified for order ${orderId} (ref: ${reference})`);
  return { verified: true };
});

// ── Trigger: send confirmation email when appointment is confirmed ─────────────
exports.onAppointmentConfirmed = onDocumentUpdated(
  "users/{uid}/orders/{orderId}",
  async (event) => {
    const before = event.data.before.data();
    const after = event.data.after.data();

    // Only fire for service orders transitioning to confirmed
    if (
      after.type !== "service" ||
      before.status === "confirmed" ||
      after.status !== "confirmed"
    ) return;

    if (!after.email) {
      logger.warn(`No email on order ${event.params.orderId} — skipping confirmation email`);
      return;
    }

    const depositStr = `₦${Math.round((after.total || 0) * 0.5).toLocaleString()}`;

    try {
      await sendAppointmentConfirmationEmail({
        serviceId: process.env.EMAILJS_SERVICE_ID,
        templateId: process.env.EMAILJS_APPOINTMENT_TEMPLATE_ID,
        publicKey: process.env.EMAILJS_PUBLIC_KEY,
        privateKey: process.env.EMAILJS_PRIVATE_KEY,
        templateParams: {
          to_email: after.email,
          customer_name: after.customerName || "Customer",
          order_id: event.params.orderId,
          status: "confirmed",
          appointment_date: after.appointmentDate || after.items?.[0]?.date || "TBD",
          deposit: depositStr,
        },
      });
      logger.info(`Confirmation email sent to ${after.email} for order ${event.params.orderId}`);
    } catch (err) {
      logger.error(`Failed to send confirmation email for order ${event.params.orderId}:`, err);
    }
  },
);
