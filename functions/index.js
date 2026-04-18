const { onDocumentUpdated } = require("firebase-functions/v2/firestore");
const { onCall, onRequest, HttpsError } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const { initializeApp } = require("firebase-admin/app");
const { logger } = require("firebase-functions");
const crypto = require("crypto");

const {
  sendOrderConfirmationEmail,
  sendProductionEmail,
  sendShippedEmail,
  sendDeliveredEmail,
  sendWelcomeEmail,
} = require("./lib/emailSender");

initializeApp();

// ── Secrets (set via: firebase functions:secrets:set SECRET_NAME) ─────────────
const PAYSTACK_SECRET = defineSecret("PAYSTACK_SECRET_KEY");
const MAILTRAP_TOKEN  = defineSecret("MAILTRAP_TOKEN");

const SHOP_URL = "https://perfectfooties.com";

// ── HTTP: Paystack webhook ─────────────────────────────────────────────────────
// Add this URL in Paystack Dashboard → Settings → API Keys & Webhooks
// URL: https://us-central1-perfect-footies.cloudfunctions.net/paystackWebhook
exports.paystackWebhook = onRequest(
  { rawBody: true, secrets: [PAYSTACK_SECRET, MAILTRAP_TOKEN] },
  async (req, res) => {
    if (req.method !== "POST") {
      res.status(405).send("Method Not Allowed");
      return;
    }

    const secretKey = PAYSTACK_SECRET.value();
    if (!secretKey) {
      logger.error("PAYSTACK_SECRET_KEY not configured");
      res.status(500).send("Server misconfiguration");
      return;
    }

    // Validate Paystack HMAC-SHA512 signature
    const signature = req.headers["x-paystack-signature"];
    const hash = crypto
      .createHmac("sha512", secretKey)
      .update(req.rawBody)
      .digest("hex");

    if (hash !== signature) {
      logger.warn("Invalid Paystack webhook signature");
      res.status(401).send("Invalid signature");
      return;
    }

    const event = req.body;
    logger.info(`Paystack event: ${event.event}`, { reference: event.data?.reference });

    if (event.event !== "charge.success") {
      res.status(200).send("OK");
      return;
    }

    const reference = event.data?.reference;
    if (!reference) {
      res.status(200).send("OK");
      return;
    }

    const db = getFirestore();
    const snap = await db
      .collectionGroup("orders")
      .where("paymentReference", "==", reference)
      .limit(1)
      .get();

    if (snap.empty) {
      logger.info(`Webhook: no order found for reference ${reference}`);
      res.status(200).send("OK");
      return;
    }

    const orderDoc = snap.docs[0];
    const order = orderDoc.data();

    if (order.depositVerified) {
      logger.info(`Webhook: order ${orderDoc.id} already verified, skipping`);
      res.status(200).send("OK");
      return;
    }

    await orderDoc.ref.update({
      status: "confirmed",
      depositVerified: true,
      depositPaidAt: FieldValue.serverTimestamp(),
      webhookVerified: true,
      statusHistory: FieldValue.arrayUnion({ status: "confirmed", at: new Date().toISOString() }),
    });

    logger.info(`Webhook: order ${orderDoc.id} confirmed (ref: ${reference})`);

    // Send confirmation email
    const token = MAILTRAP_TOKEN.value();
    if (token && order.email) {
      try {
        await sendOrderConfirmationEmail({
          token,
          email: order.email,
          customerName: order.customerName || "Customer",
          orderId: orderDoc.id,
          items: order.items || [],
          total: order.finalTotal ?? order.total ?? 0,
          shipping: order.shipping || null,
        });
        logger.info(`Confirmation email sent to ${order.email}`);
      } catch (err) {
        logger.error("Failed to send confirmation email:", err);
      }
    }

    res.status(200).send("OK");
  },
);

// ── Callable: verify Paystack deposit (manual payment verification fallback) ───
exports.verifyPaystackDeposit = onCall(
  { secrets: [PAYSTACK_SECRET] },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Must be signed in");
    }

    const uid = request.auth.uid;
    const { reference, orderId, expectedAmountKobo } = request.data;

    if (!reference || !orderId) {
      throw new HttpsError("invalid-argument", "reference and orderId are required");
    }

    const secretKey = PAYSTACK_SECRET.value();
    if (!secretKey) {
      throw new HttpsError("internal", "Paystack secret key not configured");
    }

    const res = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      { headers: { Authorization: `Bearer ${secretKey}` } },
    );
    const json = await res.json();

    if (!json.status || json.data?.status !== "success") {
      throw new HttpsError("failed-precondition", "Paystack payment not successful");
    }

    if (expectedAmountKobo && json.data.amount < expectedAmountKobo) {
      throw new HttpsError("failed-precondition", "Payment amount less than expected");
    }

    const db = getFirestore();
    await db.doc(`users/${uid}/orders/${orderId}`).update({
      status: "confirmed",
      depositVerified: true,
      depositPaidAt: FieldValue.serverTimestamp(),
    });

    logger.info(`Deposit verified for order ${orderId} (ref: ${reference})`);
    return { verified: true };
  },
);

// ── Trigger: order status changes → route to correct email template ───────────
exports.onOrderStatusChanged = onDocumentUpdated(
  { document: "users/{uid}/orders/{orderId}", secrets: [MAILTRAP_TOKEN] },
  async (event) => {
    const before = event.data.before.data();
    const after  = event.data.after.data();

    // Only fire when status actually changes
    if (before.status === after.status) return;

    if (!after.email) return;

    const token = MAILTRAP_TOKEN.value();
    if (!token) {
      logger.error("MAILTRAP_TOKEN not configured");
      return;
    }

    const orderId     = event.params.orderId;
    const customerName = after.customerName || "Customer";
    const itemName    = after.items?.[0]?.name || "";
    const items       = after.items || [];
    const total       = after.finalTotal ?? after.total ?? 0;

    switch (after.status) {
      // Template 1 — Order confirmed (webhook already sent this; trigger catches admin-confirmed orders)
      case "confirmed": {
        if (before.depositVerified) return; // already emailed by webhook
        try {
          await sendOrderConfirmationEmail({
            token, email: after.email, customerName, orderId,
            items, total, shipping: after.shipping || null,
          });
          logger.info(`[confirmed] confirmation email → ${after.email}`);
        } catch (err) {
          logger.error("sendOrderConfirmationEmail failed:", err);
        }
        break;
      }

      // In Production template
      case "production": {
        try {
          await sendProductionEmail({ token, email: after.email, customerName, orderId, itemName });
          logger.info(`[production] email → ${after.email}`);
        } catch (err) {
          logger.error("sendProductionEmail failed:", err);
        }
        break;
      }

      // Template 2 — Shipped
      case "shipped":
      case "shipping": {
        try {
          await sendShippedEmail({
            token, email: after.email, customerName, orderId,
            itemName, trackingLink: after.trackingLink || null,
          });
          logger.info(`[shipped] email → ${after.email}`);
        } catch (err) {
          logger.error("sendShippedEmail failed:", err);
        }
        break;
      }

      // Template 4 — Delivered / Received
      case "received":
      case "delivered": {
        try {
          await sendDeliveredEmail({ token, email: after.email, customerName, orderId, items, total });
          logger.info(`[received] email → ${after.email}`);
        } catch (err) {
          logger.error("sendDeliveredEmail failed:", err);
        }
        break;
      }

      default:
        break;
    }
  },
);

// ── Trigger: first confirmed order → send welcome email ───────────────────────
exports.onFirstOrderWelcome = onDocumentUpdated(
  { document: "users/{uid}/orders/{orderId}", secrets: [MAILTRAP_TOKEN] },
  async (event) => {
    const before = event.data.before.data();
    const after  = event.data.after.data();

    // Only fire when newly confirmed
    if (before.status === after.status) return;
    if (after.status !== "confirmed") return;
    if (!after.email || !after.welcomeEmailSent === false) return;

    // Check if this is their first ever confirmed order
    const db = getFirestore();
    const uid = event.params.uid;
    const snap = await db
      .collection("users").doc(uid).collection("orders")
      .where("status", "in", ["confirmed", "production", "shipped", "received", "delivered"])
      .limit(2)
      .get();

    if (snap.size > 1) return; // not their first order

    const token = MAILTRAP_TOKEN.value();
    if (!token) return;

    try {
      await sendWelcomeEmail({
        token,
        email: after.email,
        customerName: after.customerName || "Customer",
      });
      logger.info(`[welcome] email → ${after.email}`);
    } catch (err) {
      logger.error("sendWelcomeEmail failed:", err);
    }
  },
);

// ── Callable: admin sends confirmation email manually ─────────────────────────
exports.sendAdminEmail = onCall(
  { secrets: [MAILTRAP_TOKEN] },
  async (request) => {
    if (!request.auth) {
      throw new HttpsError("unauthenticated", "Must be signed in");
    }

    const { order } = request.data;
    if (!order?.email) {
      throw new HttpsError("invalid-argument", "Order must have an email address");
    }

    const token = MAILTRAP_TOKEN.value();
    if (!token) {
      throw new HttpsError("internal", "Email service not configured");
    }

    try {
      await sendOrderConfirmationEmail({
        token,
        email: order.email,
        customerName: order.customerName || "Customer",
        orderId: order.id || "—",
        items: order.items || [],
        total: order.finalTotal ?? order.total ?? 0,
        shipping: order.shipping || null,
      });
      logger.info(`Admin-triggered confirmation email sent to ${order.email}`);
      return { success: true };
    } catch (err) {
      logger.error("sendAdminEmail failed:", err);
      throw new HttpsError("internal", err.message || "Failed to send email");
    }
  },
);
