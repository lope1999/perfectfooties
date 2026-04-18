const { onDocumentUpdated, onDocumentCreated } = require("firebase-functions/v2/firestore");
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
  sendNewsletterEmail,
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

// ── Trigger: first confirmed order → welcome email fallback for pre-existing users ─
// onUserCreated handles new signups. This catches users who signed up before that
// trigger existed and haven't received a welcome email yet.
exports.onFirstOrderWelcome = onDocumentUpdated(
  { document: "users/{uid}/orders/{orderId}", secrets: [MAILTRAP_TOKEN] },
  async (event) => {
    const before = event.data.before.data();
    const after  = event.data.after.data();

    if (before.status === after.status) return;
    if (after.status !== "confirmed") return;

    const db = getFirestore();
    const uid = event.params.uid;

    // Check the USER document (not the order) for welcomeEmailSent
    const userRef = db.collection("users").doc(uid);
    const userSnap = await userRef.get();
    const userData = userSnap.data() || {};

    if (!userData.email || userData.welcomeEmailSent) return;

    // Only send on their first ever confirmed order
    const ordersSnap = await db
      .collection("users").doc(uid).collection("orders")
      .where("status", "in", ["confirmed", "production", "shipped", "received", "delivered"])
      .limit(2)
      .get();

    if (ordersSnap.size > 1) return;

    const token = MAILTRAP_TOKEN.value();
    if (!token) return;

    try {
      await sendWelcomeEmail({
        token,
        email: userData.email,
        customerName: userData.displayName || after.customerName || "Customer",
      });
      await userRef.update({ welcomeEmailSent: true });
      logger.info(`[welcome] fallback email → ${userData.email}`);
    } catch (err) {
      logger.error("sendWelcomeEmail (onFirstOrderWelcome) failed:", err);
    }
  },
);

// ── Trigger: new user document created → send welcome email immediately ───────
exports.onUserCreated = onDocumentCreated(
  { document: "users/{uid}", secrets: [MAILTRAP_TOKEN] },
  async (event) => {
    const data = event.data.data();
    if (!data?.email || data?.welcomeEmailSent) return;
    const token = MAILTRAP_TOKEN.value();
    if (!token) return;
    try {
      await sendWelcomeEmail({
        token,
        email: data.email,
        customerName: data.displayName || "Customer",
      });
      await getFirestore().doc(`users/${event.params.uid}`).update({ welcomeEmailSent: true });
      logger.info(`[welcome] new user → ${data.email}`);
    } catch (err) {
      logger.error("sendWelcomeEmail (onUserCreated) failed:", err);
    }
  },
);

// ── Callable: admin broadcasts newsletter to all subscribers ─────────────────
const ADMIN_EMAILS = ["chizobaezeh338@gmail.com", "perfect.footies@gmail.com"];

exports.sendNewsletter = onCall(
  { secrets: [MAILTRAP_TOKEN] },
  async (request) => {
    if (!request.auth) throw new HttpsError("unauthenticated", "Must be signed in");
    if (!ADMIN_EMAILS.includes(request.auth.token.email)) {
      throw new HttpsError("permission-denied", "Admin only");
    }

    const { newsletterId } = request.data;
    if (!newsletterId) throw new HttpsError("invalid-argument", "newsletterId is required");

    const db = getFirestore();
    const newsletterRef = db.collection("newsletters").doc(newsletterId);
    const newsletterSnap = await newsletterRef.get();
    if (!newsletterSnap.exists) throw new HttpsError("not-found", "Newsletter not found");

    const newsletter = newsletterSnap.data();
    if (newsletter.status === "sent") throw new HttpsError("failed-precondition", "Newsletter already sent");

    const subscribersSnap = await db.collection("subscribers").get();
    const subscribers = subscribersSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

    const token = MAILTRAP_TOKEN.value();
    if (!token) throw new HttpsError("internal", "Email service not configured");

    let sentCount = 0;
    const BATCH_SIZE = 50;

    for (let i = 0; i < subscribers.length; i += BATCH_SIZE) {
      const batch = subscribers.slice(i, i + BATCH_SIZE);
      await Promise.allSettled(
        batch.map((sub) =>
          sendNewsletterEmail({
            token,
            email: sub.email,
            subject: newsletter.subject,
            previewText: newsletter.previewText || "",
            headline: newsletter.headline || "",
            bodyText: newsletter.bodyText || "",
            imageUrl: newsletter.imageUrl || "",
            ctaText: newsletter.ctaText || "",
            ctaUrl: newsletter.ctaUrl || "",
          })
            .then(() => { sentCount++; })
            .catch((err) => logger.error(`Newsletter failed for ${sub.email}:`, err))
        )
      );
      if (i + BATCH_SIZE < subscribers.length) {
        await new Promise((resolve) => setTimeout(resolve, 200));
      }
    }

    await newsletterRef.update({
      status: "sent",
      sentAt: FieldValue.serverTimestamp(),
      sentCount,
    });

    logger.info(`Newsletter ${newsletterId} sent to ${sentCount}/${subscribers.length} subscribers`);
    return { success: true, sentCount };
  }
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
