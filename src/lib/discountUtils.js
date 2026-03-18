// ─── Product discount helpers ────────────────────────────

function hasSaleExpired(product) {
  const endsAt = product?.saleEndsAt;
  if (!endsAt) return false;
  const end = typeof endsAt?.toDate === 'function' ? endsAt.toDate() : new Date(endsAt);
  return end <= new Date();
}

export function hasDiscount(product) {
  return !!(product?.discountEnabled && product.discountPrice != null && !hasSaleExpired(product));
}

export function getEffectivePrice(product) {
  return hasDiscount(product) ? product.discountPrice : product.price;
}

export function getDiscountLabel(product) {
  return hasDiscount(product) ? product.discountLabel || 'Sale' : '';
}

export function getSaleEndsAt(product) {
  if (!product?.saleEndsAt || hasSaleExpired(product)) return null;
  const endsAt = product.saleEndsAt;
  return typeof endsAt?.toDate === 'function' ? endsAt.toDate().toISOString() : String(endsAt);
}

// ─── Service discount helpers ────────────────────────────

export function hasServiceDiscount(serviceId, discountsMap) {
  const d = discountsMap?.[serviceId];
  return !!(d && d.enabled && d.discountPrice != null);
}

export function getServiceEffectivePrice(service, discountsMap) {
  return hasServiceDiscount(service.id, discountsMap)
    ? discountsMap[service.id].discountPrice
    : service.price;
}

export function getServiceDiscountLabel(serviceId, discountsMap) {
  const d = discountsMap?.[serviceId];
  return hasServiceDiscount(serviceId, discountsMap)
    ? d.discountLabel || 'Sale'
    : '';
}
