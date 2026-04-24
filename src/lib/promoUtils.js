function toDate(val) {
  if (!val) return null;
  if (val.toDate) return val.toDate();
  return new Date(val);
}

export function getActivePromo(collection) {
  const promo = collection?.promo;
  if (!promo?.enabled || !promo.discountValue) return null;
  const now = new Date();
  const start = toDate(promo.startDate);
  const end = toDate(promo.endDate);
  if (start && now < start) return null;
  if (end && now > end) return null;
  return promo;
}

export function applyPromoToPrice(price, promo) {
  if (!promo) return price;
  if (promo.discountType === 'percentage') {
    return Math.round(price * (1 - promo.discountValue / 100));
  }
  return Math.max(0, price - promo.discountValue);
}

export function getPromoSavings(price, promo) {
  return price - applyPromoToPrice(price, promo);
}

export function formatPromoLabel(promo) {
  if (!promo) return '';
  if (promo.discountType === 'percentage') return `${promo.discountValue}% OFF`;
  return `₦${Number(promo.discountValue).toLocaleString()} OFF`;
}

// Item-level promo takes precedence over collection-level promo.
// Returns the active promo for the item, falling back to the collection promo.
export function getActiveItemPromo(item, collection) {
  const itemPromo = getActivePromo(item);
  if (itemPromo) return itemPromo;
  return getActivePromo(collection);
}
