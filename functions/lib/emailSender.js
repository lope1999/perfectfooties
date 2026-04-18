const SHOP_URL = 'https://perfectfooties.com';
const INSTAGRAM_URL = 'https://www.instagram.com/perfect.footies';
const FROM_EMAIL = 'noreply@perfectfooties.com';
const FROM_NAME = 'PerfectFooties';

function fmt(n) {
  return `\u20A6${(n || 0).toLocaleString()}`;
}

// ── Shared email shell ─────────────────────────────────────────────────────────
function baseHtml(body, footerNote) {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:24px 0;background:#f4f4f4;font-family:Arial,sans-serif">
  <div style="max-width:600px;margin:0 auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 16px rgba(0,0,0,0.08)">
    <div style="background:linear-gradient(135deg,#1a1a1a 0%,#2d2d2d 100%);padding:36px 32px 28px;text-align:center">
      <p style="font-family:Georgia,serif;font-size:26px;font-weight:bold;color:#ffffff;letter-spacing:1px;margin:0 0 4px">PerfectFooties</p>
      <p style="font-family:Georgia,serif;font-size:13px;color:#e3242b;margin:0;font-style:italic">Handcrafted leather goods, built to last</p>
    </div>
    <div style="height:4px;background:linear-gradient(90deg,#b81b21,#e3242b,#b81b21)"></div>
    <div style="padding:36px 32px 28px">
      ${body}
    </div>
    <div style="background:#FAFAFA;border-top:1px solid #E8D5B0;padding:24px 32px;text-align:center">
      <p style="font-family:Georgia,serif;font-size:13px;font-weight:bold;color:#1a1a1a;margin:0 0 6px">PerfectFooties</p>
      <p style="font-family:Arial,sans-serif;font-size:12px;color:#999;margin:4px 0">
        <a href="${INSTAGRAM_URL}" style="color:#999;text-decoration:none">Instagram</a>
        &nbsp;&middot;&nbsp;
        <a href="${SHOP_URL}" style="color:#999;text-decoration:none">Website</a>
      </p>
      <p style="font-family:Arial,sans-serif;font-size:12px;color:#999;margin:8px 0 0;line-height:1.6">
        &copy; 2026 PerfectFooties. All rights reserved.<br/>
        ${footerNote || "You're receiving this because you placed an order on our site."}
      </p>
    </div>
  </div>
</body>
</html>`;
}

function infoBox(title, rows) {
  const rowHtml = rows.map(([label, value]) => `
    <div style="display:flex;justify-content:space-between;align-items:baseline;padding:7px 0;border-bottom:1px solid #E8D5B0;font-size:14px">
      <span style="color:#888;font-family:Arial,sans-serif">${label}</span>
      <span style="color:#333;font-weight:bold;font-family:Georgia,serif;text-align:right;max-width:60%">${value}</span>
    </div>`).join('');
  return `
    <div style="background:#FFF8F0;border:1px solid #E8D5B0;border-radius:8px;padding:20px 24px;margin:20px 0">
      <p style="font-family:Georgia,serif;font-size:13px;font-weight:bold;color:#e3242b;text-transform:uppercase;letter-spacing:0.5px;margin:0 0 12px">${title}</p>
      ${rowHtml}
    </div>`;
}

function ctaBtn(label, href) {
  return `<div style="text-align:center;margin:28px 0 8px">
    <a href="${href}" style="display:inline-block;background:#e3242b;color:#ffffff;text-decoration:none;font-family:Georgia,serif;font-size:15px;font-weight:bold;padding:14px 32px;border-radius:30px">${label}</a>
  </div>`;
}

function note(text) {
  return `<p style="font-family:Arial,sans-serif;font-size:13px;color:#888;line-height:1.6;margin:16px 0 0;padding:12px 16px;border-left:3px solid #E8D5B0;background:#FAFAFA;border-radius:0 6px 6px 0">${text}</p>`;
}

function badge(text) {
  return `<div style="text-align:center;margin-bottom:20px">
    <span style="display:inline-block;background:#e3242b;color:#fff;font-family:Georgia,serif;font-size:13px;font-weight:bold;padding:4px 14px;border-radius:20px">${text}</span>
  </div>`;
}

async function sendMail({ token, to, toName, subject, html, text }) {
  const res = await fetch('https://send.api.mailtrap.io/api/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: { email: FROM_EMAIL, name: FROM_NAME },
      to: [{ email: to, name: toName || '' }],
      subject,
      html,
      text,
    }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`Mailtrap error ${res.status}: ${JSON.stringify(err)}`);
  }
}

// ── Template 1 — Order Confirmed (payment verified) ───────────────────────────

async function sendOrderConfirmationEmail({ token, email, customerName, orderId, items = [], total, shipping }) {
  const itemRows = items
    .map((i) => `
      <div style="display:flex;justify-content:space-between;align-items:baseline;padding:7px 0;border-bottom:1px solid #E8D5B0;font-size:14px">
        <span style="color:#888;font-family:Arial,sans-serif">${i.name || 'Item'}${i.selectedColor ? ` · ${i.selectedColor}` : ''}</span>
        <span style="color:#333;font-weight:bold;font-family:Georgia,serif">${fmt(i.price)}</span>
      </div>`)
    .join('');

  const shippingBlock = shipping
    ? infoBox('Shipping To', [
        ['Name',       shipping.name    || '—'],
        ['Address',    shipping.address || '—'],
        ['State / LGA', [shipping.state, shipping.lga].filter(Boolean).join(' / ') || '—'],
        ...(shipping.country && shipping.country !== 'Nigeria' ? [['Country', shipping.country]] : []),
      ])
    : '';

  const html = baseHtml(`
    <p style="font-family:Georgia,serif;font-size:20px;font-weight:bold;color:#1a1a1a;margin:0 0 12px">Hey ${customerName}!</p>
    <p style="font-family:Arial,sans-serif;font-size:15px;color:#444;line-height:1.7;margin:0 0 20px">
      We've received your order and it's now in our queue. Every piece is handcrafted with care — please allow
      <strong>5–10 business days</strong> for production before your order is shipped out. We'll keep you updated every step of the way!
    </p>

    <div style="background:#FFF8F0;border:1px solid #E8D5B0;border-radius:8px;padding:20px 24px;margin:20px 0">
      <p style="font-family:Georgia,serif;font-size:13px;font-weight:bold;color:#e3242b;text-transform:uppercase;letter-spacing:0.5px;margin:0 0 12px">Order Summary</p>
      <div style="display:flex;justify-content:space-between;padding:7px 0;border-bottom:1px solid #E8D5B0;font-size:14px">
        <span style="color:#888;font-family:Arial,sans-serif">Order ID</span>
        <span style="color:#333;font-weight:bold;font-family:Georgia,serif">#${orderId}</span>
      </div>
      ${itemRows}
      <div style="display:flex;justify-content:space-between;padding:7px 0;font-size:14px">
        <span style="color:#888;font-family:Arial,sans-serif">Order Total</span>
        <span style="color:#333;font-weight:bold;font-family:Georgia,serif">${fmt(total)}</span>
      </div>
    </div>

    ${shippingBlock}
    ${ctaBtn('Track My Order', `${SHOP_URL}/account`)}
    ${note("Have a question about your order? Reply to this email or send us a message on WhatsApp — we're always happy to help.")}
  `);

  const text = [
    `Order Confirmed — PerfectFooties #${orderId}`,
    '',
    `Hey ${customerName}!`,
    '',
    `We've received your order and it's now in our queue. Production takes 5–10 business days.`,
    '',
    'Items:',
    ...items.map((i) => `  - ${i.name}${i.selectedColor ? ` (${i.selectedColor})` : ''} — ${fmt(i.price)}`),
    '',
    `Total: ${fmt(total)}`,
    '',
    `Track your order: ${SHOP_URL}/account`,
    '',
    '— PerfectFooties Team',
  ].join('\n');

  return sendMail({
    token, to: email, toName: customerName,
    subject: `Order Confirmed — PerfectFooties #${orderId}`,
    html, text,
  });
}

// ── Template: In Production ───────────────────────────────────────────────────

async function sendProductionEmail({ token, email, customerName, orderId, itemName }) {
  const html = baseHtml(`
    <p style="font-family:Georgia,serif;font-size:20px;font-weight:bold;color:#1a1a1a;margin:0 0 12px">Your order is being crafted, ${customerName}!</p>
    <p style="font-family:Arial,sans-serif;font-size:15px;color:#444;line-height:1.7;margin:0 0 20px">
      Great news — our artisans have started handcrafting your order. Every stitch and cut is done by hand using
      premium full-grain leather. This stage typically takes <strong>5–10 business days</strong>.
    </p>

    ${infoBox('Production Details', [
      ['Order ID',   `#${orderId}`],
      ['Item',       itemName || 'Your leather piece'],
      ['Est. Time',  '5–10 business days'],
      ['Crafted in', 'Gbagada, Lagos, Nigeria'],
    ])}

    ${ctaBtn('View My Order', `${SHOP_URL}/account`)}
    ${note("We'll send you another email the moment your order ships. You can also track your order status any time from your account page.")}
  `);

  const text = [
    `In Production — PerfectFooties #${orderId}`,
    '',
    `Hey ${customerName}!`,
    '',
    `Our artisans have started handcrafting your order: ${itemName || 'your leather piece'}.`,
    `Production takes 5–10 business days. We'll email you when it ships.`,
    '',
    `Track your order: ${SHOP_URL}/account`,
    '',
    '— PerfectFooties Team',
  ].join('\n');

  return sendMail({
    token, to: email, toName: customerName,
    subject: `Your order is in production — PerfectFooties #${orderId}`,
    html, text,
  });
}

// ── Template 2 — Order Shipped ────────────────────────────────────────────────

async function sendShippedEmail({ token, email, customerName, orderId, itemName, trackingLink }) {
  const trackingRow = trackingLink
    ? `<div style="text-align:center;margin:12px 0">
        <a href="${trackingLink}" style="display:inline-block;background:transparent;color:#1a1a1a;text-decoration:none;font-family:Georgia,serif;font-size:14px;font-weight:bold;padding:12px 28px;border-radius:30px;border:2px solid #1a1a1a">Track My Package &rarr;</a>
      </div>`
    : '';

  const html = baseHtml(`
    ${badge('Your order is on its way!')}
    <p style="font-family:Georgia,serif;font-size:20px;font-weight:bold;color:#1a1a1a;margin:0 0 12px">Great news, ${customerName}!</p>
    <p style="font-family:Arial,sans-serif;font-size:15px;color:#444;line-height:1.7;margin:0 0 20px">
      Your PerfectFooties order has been dispatched via <strong>Fez Delivery</strong> and is now on its way to you.
      Sit tight — your handcrafted leather goods will be with you soon!
    </p>

    ${infoBox('Shipment Details', [
      ['Order ID',  `#${orderId}`],
      ['Item',      itemName || 'Your leather piece'],
      ['Carrier',   'Fez Delivery'],
    ])}

    ${trackingRow}
    ${ctaBtn('View My Order', `${SHOP_URL}/account`)}
    ${note('Once received, please inspect your item carefully. If anything is not right, reply to this email within 48 hours and we\'ll make it right.')}
  `);

  const text = [
    `Your order has shipped — PerfectFooties #${orderId}`,
    '',
    `Great news, ${customerName}!`,
    '',
    `Your order (${itemName || 'your leather piece'}) has shipped via Fez Delivery.`,
    trackingLink ? `Track your package: ${trackingLink}` : 'Delivery updates will be sent via WhatsApp.',
    '',
    `View your order: ${SHOP_URL}/account`,
    '',
    '— PerfectFooties Team',
  ].join('\n');

  return sendMail({
    token, to: email, toName: customerName,
    subject: `Your order has shipped — PerfectFooties #${orderId}`,
    html, text,
  });
}

// ── Template 4 — Order Received / Delivered ───────────────────────────────────

async function sendDeliveredEmail({ token, email, customerName, orderId, items = [], total }) {
  const itemList = items.map((i) => i.name || 'Item').join(', ') || 'Your leather piece';

  const html = baseHtml(`
    ${badge('Your order has arrived!')}
    <p style="font-family:Georgia,serif;font-size:20px;font-weight:bold;color:#1a1a1a;margin:0 0 12px">Hey ${customerName}!</p>
    <p style="font-family:Arial,sans-serif;font-size:15px;color:#444;line-height:1.7;margin:0 0 20px">
      Your order has been marked as <strong>received</strong> — we hope your new leather piece is everything you hoped for.
      Crafted with care, it's made to grow with you.
    </p>

    ${infoBox('Order Recap', [
      ['Order ID',   `#${orderId}`],
      ['Items',      itemList],
      ['Total Paid', fmt(total)],
    ])}

    <p style="font-family:Arial,sans-serif;font-size:15px;color:#444;line-height:1.7;margin:0 0 20px">
      Loved your order? A quick review means the world to us and helps other customers find the right piece. It only takes a minute!
    </p>

    ${ctaBtn('Leave a Review', `${SHOP_URL}/account`)}
    ${note('<strong>Leather care tip:</strong> Wipe your leather goods with a dry cloth after use and apply a leather conditioner every few months to keep them supple and long-lasting. Avoid prolonged exposure to direct sunlight or water.')}
  `);

  const text = [
    `Delivered! Your PerfectFooties order — #${orderId}`,
    '',
    `Hey ${customerName}!`,
    '',
    `Your order has been marked as received. We hope you love it!`,
    '',
    `Items: ${itemList}`,
    `Total paid: ${fmt(total)}`,
    '',
    `Leave a review: ${SHOP_URL}/account`,
    '',
    'Leather care tip: Wipe with a dry cloth after use. Apply leather conditioner every few months.',
    '',
    '— PerfectFooties Team',
  ].join('\n');

  return sendMail({
    token, to: email, toName: customerName,
    subject: `Delivered! Enjoy your PerfectFooties piece ✦`,
    html, text,
  });
}

// ── Template 3 — Welcome (new customer) ──────────────────────────────────────

async function sendWelcomeEmail({ token, email, customerName }) {
  const html = baseHtml(`
    <p style="font-family:Georgia,serif;font-size:20px;font-weight:bold;color:#1a1a1a;margin:0 0 12px">Welcome to PerfectFooties, ${customerName}!</p>
    <p style="font-family:Arial,sans-serif;font-size:15px;color:#444;line-height:1.7;margin:0 0 20px">
      We're glad you're here. You've joined a community that values quality craftsmanship, genuine leather, and pieces
      built to last a lifetime. Whether you're here for shoes, bags, belts, or accessories — every item is made with
      intention, just for you.
    </p>

    ${infoBox('What you can do on your account', [
      ['Shop',     'Browse handcrafted leather goods'],
      ['Track',    'Follow your orders in real time'],
      ['Wishlist', 'Save your favourite pieces'],
      ['Earn',     'Collect loyalty points on every order'],
    ])}

    ${ctaBtn('Shop Now', `${SHOP_URL}/shop`)}
    <div style="text-align:center">
      <a href="${SHOP_URL}/our-story" style="display:inline-block;background:transparent;color:#1a1a1a;text-decoration:none;font-family:Georgia,serif;font-size:14px;font-weight:bold;padding:12px 28px;border-radius:30px;border:2px solid #1a1a1a">Our Story</a>
    </div>
    ${note(`Follow us on Instagram <a href="${INSTAGRAM_URL}" style="color:#e3242b">@perfect.footies</a> for behind-the-scenes content, new arrivals, and craftsmanship highlights.`)}
  `, "You're receiving this because you created an account on our site.");

  const text = [
    `Welcome to PerfectFooties, ${customerName}!`,
    '',
    "We're glad you're here. Shop handcrafted leather goods, track your orders, save favourites, and earn loyalty points.",
    '',
    `Shop now: ${SHOP_URL}/shop`,
    `Our story: ${SHOP_URL}/our-story`,
    '',
    `Instagram: ${INSTAGRAM_URL}`,
    '',
    '— PerfectFooties Team',
  ].join('\n');

  return sendMail({
    token, to: email, toName: customerName,
    subject: `Welcome to PerfectFooties, ${customerName}!`,
    html, text,
  });
}

module.exports = {
  sendOrderConfirmationEmail,
  sendProductionEmail,
  sendShippedEmail,
  sendDeliveredEmail,
  sendWelcomeEmail,
};
