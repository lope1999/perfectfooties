/**
 * Send a back-in-stock email via the EmailJS REST API (server-side).
 *
 * @param {object} opts
 * @param {string} opts.serviceId   — EmailJS service ID
 * @param {string} opts.templateId  — EmailJS template ID
 * @param {string} opts.publicKey   — EmailJS public key
 * @param {string} opts.privateKey  — EmailJS private key (used as accessToken for server auth)
 * @param {object} opts.templateParams — Template variables (to_email, product_name, shop_url, …)
 * @returns {Promise<void>}
 */
async function sendBackInStockEmail({ serviceId, templateId, publicKey, privateKey, templateParams }) {
  const res = await fetch("https://api.emailjs.com/api/v1.6/email/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      service_id: serviceId,
      template_id: templateId,
      user_id: publicKey,
      accessToken: privateKey,
      template_params: templateParams,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`EmailJS send failed (${res.status}): ${body}`);
  }
}

/**
 * Send an appointment confirmation email via the EmailJS REST API (server-side).
 */
async function sendAppointmentConfirmationEmail({ serviceId, templateId, publicKey, privateKey, templateParams }) {
  const res = await fetch("https://api.emailjs.com/api/v1.6/email/send", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      service_id: serviceId,
      template_id: templateId,
      user_id: publicKey,
      accessToken: privateKey,
      template_params: templateParams,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`EmailJS send failed (${res.status}): ${body}`);
  }
}

module.exports = { sendBackInStockEmail, sendAppointmentConfirmationEmail };
