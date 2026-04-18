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
		logger.info(`Paystack event: ${event.event}`, {
			reference: event.data?.reference,
		});

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
			logger.info(
				`Webhook: order ${orderDoc.id} already verified, skipping`,
			);
			res.status(200).send("OK");
			return;
		}

		await orderDoc.ref.update({
			status: "confirmed",
			depositVerified: true,
			depositPaidAt: FieldValue.serverTimestamp(),
			webhookVerified: true,
		});

		logger.info(
			`Webhook: order ${orderDoc.id} confirmed (ref: ${reference})`,
		);

		// Send confirmation email for leather orders
		const token = MAILTRAP_TOKEN.value();
		if (token && order.email && order.type !== "service") {
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
	};
);

// ── Callable: verify Paystack deposit (for appointment 50% deposits) ──────────
exports.verifyPaystackDeposit = onCall(
	{ secrets: [PAYSTACK_SECRET] },
	async (request) => {
		if (!request.auth) {
			throw new HttpsError("unauthenticated", "Must be signed in");
		}

		const uid = request.auth.uid;
		const { reference, orderId, expectedAmountKobo } = request.data;

		if (!reference || !orderId) {
			throw new HttpsError(
				"invalid-argument",
				"reference and orderId are required",
			);
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
			throw new HttpsError(
				"failed-precondition",
				"Paystack payment not successful",
			);
		}

		if (expectedAmountKobo && json.data.amount < expectedAmountKobo) {
			throw new HttpsError(
				"failed-precondition",
				"Payment amount less than expected",
			);
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

// ── Trigger: leather/collection order status changes → send email ─────────────
exports.onLeatherOrderStatusChanged = onDocumentUpdated(
	{ document: "users/{uid}/orders/{orderId}", secrets: [MAILTRAP_TOKEN] },
	async (event) => {
		const before = event.data.before.data();
		const after = event.data.after.data();

		// Only handle leather/collection orders
		if (after.type === "service") return;

		// Only fire when status actually changes
		if (before.status === after.status) return;

		if (!after.email) {
			logger.warn(
				`No email on order ${event.params.orderId} — skipping status email`,
			);
			return;
		}

		const token = MAILTRAP_TOKEN.value();
		if (!token) {
			logger.error("MAILTRAP_TOKEN not configured");
			return;
		}

		const statusesToEmail = [
			"confirmed",
			"production",
			"shipped",
			"shipping",
			"received",
		];
		if (!statusesToEmail.includes(after.status)) return;

		const itemName = after.items?.[0]?.name || "";

		// confirmed: send full order confirmation (payment just verified)
		if (after.status === "confirmed" && !before.depositVerified) {
			try {
				await sendOrderConfirmationEmail({
					token,
					email: after.email,
					customerName: after.customerName || "Customer",
					orderId: event.params.orderId,
					items: after.items || [],
					total: after.finalTotal ?? after.total ?? 0,
					shipping: after.shipping || null,
				});
				logger.info(`Order confirmation email sent to ${after.email}`);
			} catch (err) {
				logger.error("sendOrderConfirmationEmail failed:", err);
			}
			return;
		}

		// production / shipped / received: send status update
		if (
			["production", "shipped", "shipping", "received"].includes(
				after.status,
			)
		) {
			try {
				await sendOrderStatusEmail({
					token,
					email: after.email,
					customerName: after.customerName || "Customer",
					orderId: event.params.orderId,
					status: after.status === "shipped" ? "shipping" : after.status,
					itemName,
					trackingLink: after.trackingLink || null,
				});
				logger.info(
					`Status email (${after.status}) sent to ${after.email}`,
				);
			} catch (err) {
				logger.error(`sendOrderStatusEmail(${after.status}) failed:`, err);
			}
		}
	};
);

// ── Trigger: appointment confirmed → send confirmation email ──────────────────
exports.onAppointmentConfirmed = onDocumentUpdated(
	{ document: "users/{uid}/orders/{orderId}", secrets: [MAILTRAP_TOKEN] },
	async (event) => {
		const before = event.data.before.data();
		const after = event.data.after.data();

		// Only service orders transitioning to confirmed
		if (after.type !== "service") return;
		if (before.status === "confirmed" || after.status !== "confirmed") return;

		if (!after.email) {
			logger.warn(
				`No email on order ${event.params.orderId} — skipping appointment email`,
			);
			return;
		}

		const token = MAILTRAP_TOKEN.value();
		if (!token) {
			logger.error("MAILTRAP_TOKEN not configured");
			return;
		}

		const deposit = after.total
			? `₦${Math.round(after.total * 0.5).toLocaleString()}`
			: null;

		try {
			await sendAppointmentConfirmationEmail({
				token,
				email: after.email,
				customerName: after.customerName || "Customer",
				orderId: event.params.orderId,
				appointmentDate:
					after.appointmentDate || after.items?.[0]?.date || "TBD",
				deposit,
			});
			logger.info(`Appointment confirmation sent to ${after.email}`);
		} catch (err) {
			logger.error("sendAppointmentConfirmationEmail failed:", err);
		}
	};
);
