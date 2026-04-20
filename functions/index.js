const {
	onDocumentUpdated,
	onDocumentCreated,
} = require("firebase-functions/v2/firestore");
const {
	onCall,
	onRequest,
	HttpsError,
} = require("firebase-functions/v2/https");
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
	sendSubscriberWelcomeEmail,
	sendNewsletterEmail,
} = require("./lib/emailSender");

initializeApp();

// ── Secrets ───────────────────────────────────────────────────────────────────
const PAYSTACK_SECRET = defineSecret("PAYSTACK_SECRET_KEY");
const MAILTRAP_TOKEN = defineSecret("MAILTRAP_TOKEN");

const SHOP_URL = "https://perfectfooties.com";

// ── Paystack Webhook ──────────────────────────────────────────────────────────
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
			statusHistory: FieldValue.arrayUnion({
				status: "confirmed",
				at: new Date().toISOString(),
			}),
		});

		logger.info(
			`Webhook: order ${orderDoc.id} confirmed (ref: ${reference})`,
		);

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

// ── Verify Deposit ────────────────────────────────────────────────────────────
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

		logger.info(`Deposit verified for order ${orderId}`);
		return { verified: true };
	},
);

// ── Order Status Trigger ──────────────────────────────────────────────────────
exports.onOrderStatusChanged = onDocumentUpdated(
	{ document: "users/{uid}/orders/{orderId}", secrets: [MAILTRAP_TOKEN] },
	async (event) => {
		const before = event.data.before.data();
		const after = event.data.after.data();

		if (before.status === after.status) return;
		if (!after.email) return;

		const token = MAILTRAP_TOKEN.value();
		if (!token) return;

		const orderId = event.params.orderId;
		const customerName = after.customerName || "Customer";
		const itemName = after.items?.[0]?.name || "";
		const items = after.items || [];
		const total = after.finalTotal ?? after.total ?? 0;

		switch (after.status) {
			case "confirmed": {
				if (before.depositVerified) return;
				await sendOrderConfirmationEmail({
					token,
					email: after.email,
					customerName,
					orderId,
					items,
					total,
					shipping: after.shipping || null,
				});
				break;
			}

			case "production":
				await sendProductionEmail({
					token,
					email: after.email,
					customerName,
					orderId,
					itemName,
				});
				break;

			case "shipped":
			case "shipping":
				await sendShippedEmail({
					token,
					email: after.email,
					customerName,
					orderId,
					itemName,
					trackingLink: after.trackingLink || null,
				});
				break;

			case "received":
			case "delivered":
				await sendDeliveredEmail({
					token,
					email: after.email,
					customerName,
					orderId,
					items,
					total,
				});
				break;
		}
	},
);

// ── Newsletter Sender (FIXED HERE) ────────────────────────────────────────────
const ADMIN_EMAILS = [
	"chizobaezeh338@gmail.com",
	"perfect.footies@gmail.com",
	"praiseolusegun19@gmail.com",
];

exports.sendNewsletter = onCall(
	{ secrets: [MAILTRAP_TOKEN] },
	async (request) => {
		if (!request.auth)
			throw new HttpsError("unauthenticated", "Must be signed in");
		if (!ADMIN_EMAILS.includes(request.auth.token.email)) {
			throw new HttpsError("permission-denied", "Admin only");
		}

		const { newsletterId } = request.data;
		if (!newsletterId)
			throw new HttpsError("invalid-argument", "newsletterId is required");

		const db = getFirestore();
		const newsletterRef = db.collection("newsletters").doc(newsletterId);
		const newsletterSnap = await newsletterRef.get();

		if (!newsletterSnap.exists) {
			throw new HttpsError("not-found", "Newsletter not found");
		}

		const newsletter = newsletterSnap.data();

		if (newsletter.status === "sent") {
			throw new HttpsError("failed-precondition", "Newsletter already sent");
		}

		const subscribersSnap = await db.collection("subscribers").get();
		const subscribers = subscribersSnap.docs.map((d) => ({
			id: d.id,
			...d.data(),
		}));

		const token = MAILTRAP_TOKEN.value();
		if (!token)
			throw new HttpsError("internal", "Email service not configured");

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
						.then(() => {
							sentCount++;
						})
						.catch((err) =>
							logger.error(`Newsletter failed for ${sub.email}:`, err),
						),
				),
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

		logger.info(`Newsletter sent to ${sentCount}`);
		return { success: true, sentCount };
	},
); // ✅ THIS was missing

// ── Trigger: Subscriber created — dedupe + send welcome email ───────────────
exports.onSubscriberCreated = onDocumentCreated(
	{ document: 'subscribers/{docId}', secrets: [MAILTRAP_TOKEN] },
	async (event) => {
		const data = event.data?.data();
		const newId = event.params?.docId;
		if (!data || !data.email) return;

		const db = getFirestore();
		try {
			// Find any existing subscriber with same email (excluding the newly created doc)
			const snaps = await db.collection('subscribers').where('email', '==', data.email).get();
			let other = null;
			for (const d of snaps.docs) {
				if (d.id !== newId) {
					other = d;
					break;
				}
			}

			// If another subscriber exists, merge useful fields into it and delete the new doc
			if (other) {
				const existing = other.data() || {};
				const updates = {};
				if ((!existing.name || existing.name === '') && data.name) updates.name = data.name;
				if ((!existing.uid || existing.uid === '') && data.uid) updates.uid = data.uid;
				if ((!existing.subscribedAt || existing.subscribedAt === null) && data.subscribedAt) updates.subscribedAt = data.subscribedAt;

				if (Object.keys(updates).length > 0) {
					await other.ref.update(updates);
				}

				// Remove the duplicate document we just created
				await db.collection('subscribers').doc(newId).delete();
				logger.info(`Subscriber dedup: merged ${newId} into ${other.id}`);

				// Do not send another welcome if the existing doc likely already received one
				logger.info(`Skipping welcome email for duplicate subscriber ${data.email}`);
				return;
			}

			// No duplicate found — send welcome email
			const token = MAILTRAP_TOKEN.value();
			if (!token) return;

			await sendSubscriberWelcomeEmail({ token, email: data.email, name: data.name || '' });
			logger.info(`Subscriber welcome sent to ${data.email}`);
		} catch (err) {
			logger.error('Failed processing subscriber create:', err);
		}
	}
);
