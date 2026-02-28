// Allowed Firestore collection names for category operations
const ALLOWED_COLLECTIONS = new Set(['productCategories', 'retailCategories']);

// Allowed order types
const ALLOWED_ORDER_TYPES = new Set(['pressOn', 'retail', 'service', 'mixed']);

// Allowed order statuses
const ALLOWED_ORDER_STATUSES = new Set([
  'pending',
  'confirmed',
  'production',
  'shipping',
  'in-progress',
  'completed',
  'cancelled',
  'received',
]);

// Allowed gift card statuses
const ALLOWED_GIFT_CARD_STATUSES = new Set([
  'pending',
  'active',
  'partially_used',
  'fully_redeemed',
  'expired',
]);

// Allowed appointment statuses
const ALLOWED_APPOINTMENT_STATUSES = new Set([
  'pending',
  'confirmed',
  'in progress',
  'completed',
  'rescheduled',
  'cancelled',
  'no-show',
]);

/**
 * Trim and limit string length. Returns empty string for non-string input.
 */
export function sanitizeString(value, maxLength = 500) {
  if (typeof value !== 'string') return '';
  return value.trim().slice(0, maxLength);
}

/**
 * Validate that a value is a finite number within an optional range.
 * Returns the number or throws.
 */
export function validateNumber(value, { min = -Infinity, max = Infinity, label = 'value' } = {}) {
  const n = Number(value);
  if (!Number.isFinite(n)) {
    throw new Error(`${label} must be a valid number`);
  }
  if (n < min || n > max) {
    throw new Error(`${label} must be between ${min} and ${max}`);
  }
  return n;
}

/**
 * Validate that a collection name is in the allowed whitelist.
 */
export function validateCollectionName(name) {
  if (!ALLOWED_COLLECTIONS.has(name)) {
    throw new Error(`Invalid collection name: ${name}`);
  }
  return name;
}

/**
 * Validate order type is one of the allowed values.
 */
export function validateOrderType(type) {
  if (!ALLOWED_ORDER_TYPES.has(type)) {
    throw new Error(`Invalid order type: ${type}`);
  }
  return type;
}

/**
 * Validate order status is one of the allowed values.
 * @param {'order' | 'appointment'} kind
 */
export function validateOrderStatus(status, kind = 'order') {
  const allowed = kind === 'appointment' ? ALLOWED_APPOINTMENT_STATUSES : ALLOWED_ORDER_STATUSES;
  if (!allowed.has(status)) {
    throw new Error(`Invalid ${kind} status: ${status}`);
  }
  return status;
}

/**
 * Validate gift card status is one of the allowed values.
 */
export function validateGiftCardStatus(status) {
  if (!ALLOWED_GIFT_CARD_STATUSES.has(status)) {
    throw new Error(`Invalid gift card status: ${status}`);
  }
  return status;
}

/**
 * Validate a basic email format (if provided).
 */
export function validateEmail(email) {
  if (!email) return '';
  const s = String(email).trim();
  if (s && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)) {
    throw new Error('Invalid email format');
  }
  return s;
}

/**
 * Validate that value is a non-empty string.
 */
export function requireString(value, label = 'value') {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${label} is required and must be a non-empty string`);
  }
  return value.trim();
}
