const { onDocumentUpdated } = require("firebase-functions/v2/firestore");
const { defineSecret } = require("firebase-functions/params");
const { getFirestore } = require("firebase-admin/firestore");
const { initializeApp } = require("firebase-admin/app");
const { logger } = require("firebase-functions");

const { findRestockedProducts } = require("./lib/stockDiff");
const { sendBackInStockEmail } = require("./lib/emailSender");

initializeApp();

// ── Secrets ──────────────────────────────────────────────────────────────────
const EMAILJS_SERVICE_ID = defineSecret("EMAILJS_SERVICE_ID");
const EMAILJS_PUBLIC_KEY = defineSecret("EMAILJS_PUBLIC_KEY");
const EMAILJS_PRIVATE_KEY = defineSecret("EMAILJS_PRIVATE_KEY");
const EMAILJS_STOCK_TEMPLATE_ID = defineSecret("EMAILJS_STOCK_TEMPLATE_ID");

const SHOP_URL = "https://chizzystyles.com";

// ── Shared handler ───────────────────────────────────────────────────────────
async function handleCategoryUpdate(event) {
  const beforeProducts = event.data.before.data().products || [];
  const afterProducts = event.data.after.data().products || [];

  const restocked = findRestockedProducts(beforeProducts, afterProducts);
  if (restocked.length === 0) return;

  logger.info(`Restocked products detected: ${restocked.map((p) => p.name).join(", ")}`);

  const db = getFirestore();
  const serviceId = EMAILJS_SERVICE_ID.value();
  const publicKey = EMAILJS_PUBLIC_KEY.value();
  const privateKey = EMAILJS_PRIVATE_KEY.value();
  const templateId = EMAILJS_STOCK_TEMPLATE_ID.value();

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

// ── Triggers ─────────────────────────────────────────────────────────────────
exports.onProductCategoryUpdated = onDocumentUpdated(
  {
    document: "productCategories/{categoryId}",
    secrets: [EMAILJS_SERVICE_ID, EMAILJS_PUBLIC_KEY, EMAILJS_PRIVATE_KEY, EMAILJS_STOCK_TEMPLATE_ID],
  },
  handleCategoryUpdate,
);

exports.onRetailCategoryUpdated = onDocumentUpdated(
  {
    document: "retailCategories/{categoryId}",
    secrets: [EMAILJS_SERVICE_ID, EMAILJS_PUBLIC_KEY, EMAILJS_PRIVATE_KEY, EMAILJS_STOCK_TEMPLATE_ID],
  },
  handleCategoryUpdate,
);
