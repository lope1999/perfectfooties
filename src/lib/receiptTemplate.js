const TEAL = '#007a7a';
const TEAL_DARK = '#005f5f';
const TEAL_LIGHT = '#e8fff8';
const RED = '#e3242b';
const GOLD = '#e8d5b0';
const CREAM = '#f9f5ee';

function fmt(n) {
  return `₦${(n || 0).toLocaleString()}`;
}

function deliveryEstimate(type, shipping) {
  const isLeather = type === 'leather';
  const isIntl = shipping?.method === 'international' ||
    (shipping?.country && shipping?.country !== 'Nigeria') ||
    shipping?.zone;
  if (isLeather) return isIntl ? '10–14 days production + 5–10 days international shipping' : '10–14 days production + 2–5 days local shipping';
  if (isIntl) return '5–10 business days';
  return '2–5 business days';
}

const CSS = `
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: Georgia, serif; color: #1a1a1a; background: #f0ebe0; padding: 32px 20px; }
  .page { max-width: 580px; margin: 0 auto; background: #fff; border: 2px solid ${GOLD}; border-radius: 12px; overflow: hidden; box-shadow: 0 6px 32px rgba(0,122,122,0.12); }

  /* ── Header ── */
  .header { background: linear-gradient(135deg, ${TEAL_DARK} 0%, ${TEAL} 60%, #009494 100%); padding: 28px 24px 20px; text-align: center; }
  .logo { width: 120px; height: 120px; object-fit: contain; border-radius: 50%; background: rgba(255,255,255,0.15); padding: 10px; margin-bottom: 12px; display: block; margin-left: auto; margin-right: auto; }
  .brand { font-size: 21px; font-weight: 800; letter-spacing: 2.5px; color: #fff; }
  .brand-sub { font-size: 11px; color: rgba(255,255,255,0.7); margin-top: 3px; letter-spacing: 0.5px; }
  .doc-badge { display: inline-block; color: #fff; font-size: 10px; font-weight: 700; letter-spacing: 2px; padding: 4px 16px; border-radius: 20px; margin-top: 12px; border: 1.5px solid rgba(255,255,255,0.4); background: rgba(255,255,255,0.12); }
  .accent-bar { height: 4px; background: linear-gradient(90deg, ${RED}, ${TEAL}, ${RED}); }

  /* ── Body ── */
  .body { padding: 22px 24px; }
  .section { margin-bottom: 20px; }
  .section-title { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: ${TEAL}; border-left: 3px solid ${TEAL}; padding-left: 8px; margin-bottom: 10px; }

  /* ── Meta info ── */
  .meta-table { width: 100%; border-collapse: collapse; font-size: 12px; border: 1.5px solid ${GOLD}; border-radius: 8px; overflow: hidden; }
  .meta-table td { padding: 6px 12px; }
  .meta-table tr:nth-child(even) { background: ${CREAM}; }
  .meta-table tr:first-child td { padding-top: 10px; }
  .meta-table tr:last-child td { padding-bottom: 10px; }
  .meta-table .key { color: #888; width: 36%; font-size: 11px; }
  .meta-table .val { color: #1a1a1a; font-weight: 600; }
  .status-badge { display: inline-block; background: ${TEAL}; color: #fff; font-size: 10px; font-weight: 700; padding: 2px 10px; border-radius: 12px; letter-spacing: 0.3px; }

  /* ── Items table ── */
  .items-wrap { border: 1.5px solid ${GOLD}; border-radius: 8px; overflow: hidden; }
  .items-table { width: 100%; border-collapse: collapse; font-size: 13px; }
  .items-table thead tr { background: linear-gradient(135deg, ${TEAL_DARK}, ${TEAL}); }
  .items-table thead td { color: #fff; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; padding: 9px 12px; }
  .items-table thead td:last-child { text-align: right; }
  .items-table tbody tr { border-bottom: 1px solid #f0e8d8; }
  .items-table tbody tr:last-child { border-bottom: none; }
  .items-table tbody tr:nth-child(even) { background: #fdfaf5; }
  .items-table tbody td { padding: 10px 12px; vertical-align: top; }
  .item-name { font-weight: 700; color: #1a1a1a; font-size: 13px; }
  .item-detail { font-size: 11px; color: #888; margin-top: 3px; }
  .item-price { font-weight: 700; color: ${TEAL}; text-align: right; white-space: nowrap; font-size: 13px; }

  /* ── Totals ── */
  .totals-wrap { border: 1.5px solid ${GOLD}; border-radius: 8px; overflow: hidden; font-size: 13px; }
  .total-row { display: flex; justify-content: space-between; align-items: center; padding: 8px 14px; border-bottom: 1px solid #f0e8d8; }
  .total-row:last-of-type { border-bottom: none; }
  .total-row.even { background: ${CREAM}; }
  .total-row.discount span:last-child { color: ${RED}; font-weight: 600; }
  .total-row .label { color: #555; }
  .total-final { display: flex; justify-content: space-between; align-items: center; padding: 13px 14px; background: linear-gradient(135deg, ${TEAL_DARK}, ${TEAL}); color: #fff; font-size: 16px; font-weight: 800; border-top: 2px solid ${TEAL_DARK}; }

  /* ── Address ── */
  .address-box { background: ${CREAM}; border: 1.5px solid ${GOLD}; border-left: 4px solid ${TEAL}; border-radius: 0 8px 8px 0; padding: 14px 16px; font-size: 13px; line-height: 1.9; }
  .address-name { font-weight: 700; color: #1a1a1a; }
  .address-detail { color: #555; }

  /* ── Delivery estimate ── */
  .delivery-box { background: linear-gradient(135deg, ${TEAL_LIGHT}, #d4f5ee); border: 1.5px solid #b2f0e0; border-radius: 8px; padding: 14px 18px; display: flex; align-items: center; gap: 14px; }
  .delivery-icon { width: 38px; height: 38px; background: ${TEAL}; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 20px; flex-shrink: 0; }
  .delivery-label { font-size: 10px; text-transform: uppercase; color: ${TEAL_DARK}; font-weight: 700; letter-spacing: 1px; margin-bottom: 2px; }
  .delivery-val { font-size: 14px; font-weight: 700; color: ${TEAL_DARK}; }

  /* ── Footer ── */
  .footer { background: ${CREAM}; border-top: 2px solid ${GOLD}; padding: 18px 24px; text-align: center; }
  .footer-tagline { font-size: 13px; font-weight: 700; color: ${TEAL}; margin-bottom: 5px; }
  .footer-note { font-size: 11px; color: #999; line-height: 1.7; }

  @media print {
    body { background: #fff; padding: 0; }
    .page { border: none; border-radius: 0; box-shadow: none; max-width: 100%; }
  }
`;

export function generateReceiptHtml({
  orderId,
  customerName,
  email,
  status,
  paymentReference,
  items = [],
  giftCardDiscount = 0,
  referralDiscount = 0,
  loyaltyDiscount = 0,
  shipping = {},
  shippingFee = 0,
  extraCharge = 0,
  total = 0,
  finalTotal,
  type,
  createdAtLabel,
  logoUrl,
  docType = 'ORDER RECEIPT',
}) {
  const paidTotal = finalTotal ?? total;
  const est = deliveryEstimate(type, shipping);
  const now = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const statusLabels = { pending: 'Pending', confirmed: 'Confirmed', production: 'In Production', shipped: 'Shipped', shipping: 'Shipped', received: 'Delivered', delivered: 'Delivered', cancelled: 'Cancelled' };
  const statusLabel = statusLabels[status] || status;

  const itemRows = items
		.map(
			(i) => `
    <tr>
      <td>
        <div class="item-name">${i.serviceName || i.name || "Item"}</div>
        ${i.selectedColor ? `<div class="item-detail">Colour: ${i.selectedColor}${i.footLength ? ` · Length: ${i.footLength}cm` : ""}</div>` : ""}
        ${(i.quantity || 1) > 1 ? `<div class="item-detail">Qty: ${i.quantity}</div>` : ""}
        ${i.specialRequest ? `<div class="item-detail" style="color:#B8860B;">Made to order</div>` : ""}
        ${i.surcharge && i.surcharge > 0 ? `<div class="item-detail" style="color:${RED}; font-weight:700;">Size surcharge: ${fmt(i.surcharge)}</div>` : ""}
      </td>
      <td class="item-price">${fmt(i.price)}</td>
    </tr>`,
		)
		.join("");

  const discountRows = [
    giftCardDiscount > 0 && `<div class="total-row discount"><span class="label">Gift Card Discount</span><span>-${fmt(giftCardDiscount)}</span></div>`,
    referralDiscount > 0 && `<div class="total-row discount even"><span class="label">Referral Discount</span><span>-${fmt(referralDiscount)}</span></div>`,
    loyaltyDiscount > 0 && `<div class="total-row discount"><span class="label">Loyalty Points</span><span>-${fmt(loyaltyDiscount)}</span></div>`,
  ].filter(Boolean).join('');

  const shippingRow = shippingFee > 0
    ? `<div class="total-row even"><span class="label">Shipping${shipping.label ? ` (${shipping.label})` : ''}</span><span>${fmt(shippingFee)}</span></div>`
    : '';

  const extraRow =
		extraCharge > 0
			? `<div class="total-row"><span class="label">Size surcharge</span><span>${fmt(extraCharge)}</span></div>`
			: "";

  const addrLine = [shipping.address, shipping.lga, shipping.city, shipping.state, shipping.country && shipping.country !== 'Nigeria' ? shipping.country : ''].filter(Boolean).join(', ');

  const addressSection = addrLine ? `
    <div class="section">
      <div class="section-title">Delivery Address</div>
      <div class="address-box">
        ${shipping.name || customerName ? `<div class="address-name">${shipping.name || customerName}</div>` : ''}
        ${shipping.phone ? `<div class="address-detail">${shipping.phone}</div>` : ''}
        <div class="address-detail">${addrLine}</div>
      </div>
    </div>` : '';

  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>${docType} — ${orderId || ""}</title>
  <style>${CSS}</style>
</head>
<body>
<div class="page">

  <div class="header">
    ${logoUrl ? `<img src="${logoUrl}" alt="Perfect Footies" class="logo"/>` : ""}
    <div class="brand">PERFECT FOOTIES</div>
    <div class="brand-sub">perfectfooties.com &nbsp;·&nbsp; Lagos State</div>
    <div class="doc-badge">${docType}</div>
  </div>
  <div class="accent-bar"></div>

  <div class="body">

    <div class="section">
      <div class="section-title">Order Details</div>
      <table class="meta-table">
        <tr><td class="key">Order ID</td><td class="val">${orderId || "—"}</td></tr>
        ${createdAtLabel ? `<tr><td class="key">Date Placed</td><td class="val">${createdAtLabel}</td></tr>` : ""}
        <tr><td class="key">Printed</td><td class="val">${now}</td></tr>
        <tr><td class="key">Customer</td><td class="val">${customerName || "—"}</td></tr>
        ${email ? `<tr><td class="key">Email</td><td class="val">${email}</td></tr>` : ""}
        ${status ? `<tr><td class="key">Status</td><td class="val"><span class="status-badge">${statusLabel}</span></td></tr>` : ""}
        ${paymentReference ? `<tr><td class="key">Payment Ref</td><td class="val">${paymentReference}</td></tr>` : ""}
      </table>
    </div>

    <div class="section">
      <div class="section-title">Items Ordered</div>
      <div class="items-wrap">
        <table class="items-table">
          <thead>
            <tr>
              <td>Description</td>
              <td style="text-align:right;">Price</td>
            </tr>
          </thead>
          <tbody>${itemRows}</tbody>
        </table>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Payment Summary</div>
      <div class="totals-wrap">
        ${discountRows}
        ${shippingRow}
        ${extraRow}
        <div class="total-final">
          <span>Total Paid</span>
          <span>${fmt(paidTotal)}</span>
        </div>
      </div>
    </div>

    ${addressSection}

    <div class="section">
      <div class="section-title">Estimated Delivery</div>
      <div class="delivery-box">
        <div class="delivery-icon">&#128666;</div>
        <div>
          <div class="delivery-label">Expected Timeframe</div>
          <div class="delivery-val">${est}</div>
        </div>
      </div>
    </div>

  </div>

  <div class="footer">
    <div class="footer-tagline">Thank you for shopping with PerfectFooties!</div>
    <div class="footer-note">
      Handcrafted with care in Lagos, Nigeria.<br/>
      Questions? Reach us on WhatsApp or visit perfectfooties.com
    </div>
  </div>

</div>
</body>
</html>`;
}

export function openReceiptWindow(html) {
  const win = window.open('', '_blank', 'width=720,height=960');
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 500);
}
