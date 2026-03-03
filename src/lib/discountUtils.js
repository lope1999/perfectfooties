// ─── Product discount helpers ────────────────────────────

export function hasDiscount(product) {
  return !!(product?.discountEnabled && product.discountPrice != null);
}

export function getEffectivePrice(product) {
  return hasDiscount(product) ? product.discountPrice : product.price;
}

export function getDiscountLabel(product) {
  return hasDiscount(product) ? product.discountLabel || 'Sale' : '';
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
