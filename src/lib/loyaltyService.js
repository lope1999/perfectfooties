import {
  doc,
  getDoc,
  updateDoc,
  setDoc,
  addDoc,
  collection,
  getDocs,
  increment,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';

export const POINTS_PER_ORDER = 15;
export const POINTS_PER_REFERRAL = 50;   // referrer bonus when their code is used
export const REFERRAL_DISCOUNT = 500;    // ₦500 off for the person using a referral code
export const REDEMPTION_UNIT = 50;       // every 50 pts = ₦500 redeemable
export const REDEMPTION_VALUE = 500;     // ₦ value per REDEMPTION_UNIT points
// ── Customer Tiers (based on number of completed orders) ──────
export const TIERS = [
	{
		key: "fresh",
		label: "Fresh",
		minOrders: 0,
		discount: 0,
		color: "#78909C",
		bg: "#ECEFF1",
		perk: "Welcome to PerfectFooties — your journey begins here.",
	},
	{
		key: "star-client",
		label: "Star Client",
		minOrders: 3,
		discount: 5,
		color: "#007a7a",
		bg: "#E0F7FA",
		perk: "5% loyalty discount on all orders + priority production queue.",
	},
	{
		key: "master-patron",
		label: "Master Patron",
		minOrders: 5,
		discount: 10,
		color: "#B8860B",
		bg: "#FFF8E1",
		perk: "10% loyalty discount + free custom engraving on every order.",
	},
];

export function getCustomerTier(orderCount) {
  for (let i = TIERS.length - 1; i >= 0; i--) {
    if (orderCount >= TIERS[i].minOrders) return TIERS[i];
  }
  return TIERS[0];
}

// ── Pending Loyalty Reward (saved from AccountPage, applied at checkout) ──────
const LOYALTY_REWARD_KEY = 'pendingLoyaltyReward';

export function savePendingLoyaltyReward(pts) {
  const units = Math.floor(pts / REDEMPTION_UNIT);
  if (units <= 0) return;
  localStorage.setItem(LOYALTY_REWARD_KEY, JSON.stringify({
    pts: units * REDEMPTION_UNIT,
    units,
    naira: units * REDEMPTION_VALUE,
  }));
}

export function getPendingLoyaltyReward() {
  try {
    const v = localStorage.getItem(LOYALTY_REWARD_KEY);
    return v ? JSON.parse(v) : null;
  } catch { return null; }
}

export function clearPendingLoyaltyReward() {
  localStorage.removeItem(LOYALTY_REWARD_KEY);
}

// ── User Loyalty ──────────────────────────────────────────────

export async function getLoyaltyData(uid) {
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return { loyaltyPoints: 0, loyaltyPointsEarned: 0, loyaltyPointsRedeemed: 0, reviewCount: 0 };
  const d = snap.data();
  return {
    loyaltyPoints: d.loyaltyPoints || 0,
    loyaltyPointsEarned: d.loyaltyPointsEarned || 0,
    loyaltyPointsRedeemed: d.loyaltyPointsRedeemed || 0,
    reviewCount: d.reviewCount || 0,
  };
}

export async function incrementUserReviewCount(uid) {
  if (!uid) return;
  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, { reviewCount: increment(1) }).catch(() =>
    setDoc(userRef, { reviewCount: 1 }, { merge: true })
  );
}

// Called by adminService when order status → 'received'
export async function awardPointsForOrder(uid, orderId, orderType) {
  if (!uid || uid === 'admin-legacy') return;
  const orderRef = doc(db, 'users', uid, 'orders', orderId);
  const snap = await getDoc(orderRef);
  if (!snap.exists() || snap.data()?.loyaltyPointsAwarded) return; // already awarded

  const points = POINTS_PER_ORDER;
  await Promise.all([
    updateDoc(doc(db, 'users', uid), {
      loyaltyPoints: increment(points),
      loyaltyPointsEarned: increment(points),
    }),
    updateDoc(orderRef, { loyaltyPointsAwarded: true }),
  ]);
  return points;
}

// Self-heal: called from AccountPage when computed earned > Firestore recorded earned
export async function backfillMissingPoints(uid, delta) {
  if (!uid || delta <= 0) return;
  const userRef = doc(db, 'users', uid);
  await updateDoc(userRef, {
    loyaltyPoints: increment(delta),
    loyaltyPointsEarned: increment(delta),
  });
}

// Admin: manually adjust points (delta can be positive or negative)
export async function adminAdjustPoints(uid, delta, reason) {
  const userRef = doc(db, 'users', uid);
  const snap = await getDoc(userRef);
  const current = snap.data()?.loyaltyPoints || 0;
  const newPoints = Math.max(0, current + delta);
  const updates = { loyaltyPoints: newPoints };
  if (delta > 0) updates.loyaltyPointsEarned = increment(delta);
  await updateDoc(userRef, updates);
  // log the admin adjustment
  await addDoc(collection(db, 'loyaltyAdjustments'), {
    uid,
    delta,
    reason: reason || '',
    balanceBefore: current,
    balanceAfter: newPoints,
    adjustedAt: serverTimestamp(),
  });
}

// User redeems points (deducts from balance)
export async function redeemLoyaltyPoints(uid, pointsToRedeem) {
  const userRef = doc(db, 'users', uid);
  const snap = await getDoc(userRef);
  const current = snap.data()?.loyaltyPoints || 0;
  if (current < pointsToRedeem) throw new Error('Insufficient points');
  await updateDoc(userRef, {
    loyaltyPoints: increment(-pointsToRedeem),
    loyaltyPointsRedeemed: increment(pointsToRedeem),
  });
}

// Fetch all users' loyalty data for admin
export async function fetchAllLoyaltyProfiles() {
  const snap = await getDocs(collection(db, 'users'));
  return snap.docs
    .filter((d) => d.id !== 'admin-legacy')
    .map((d) => ({
      uid: d.id,
      displayName: d.data().displayName || '',
      email: d.data().email || '',
      loyaltyPoints: d.data().loyaltyPoints || 0,
      loyaltyPointsEarned: d.data().loyaltyPointsEarned || 0,
      loyaltyPointsRedeemed: d.data().loyaltyPointsRedeemed || 0,
    }))
    .sort((a, b) => b.loyaltyPoints - a.loyaltyPoints);
}

// ── Referral Codes ───────────────────────────────────────────

export function buildReferralCode(uid, displayName) {
  const name = (displayName || '')
    .split(/\s+/)[0]          // first word only
    .replace(/[^a-zA-Z]/g, '') // letters only
    .slice(0, 8)
    .toUpperCase() || 'USER';
  const suffix = uid.slice(0, 5).toUpperCase();
  return `${name}-${suffix}`;
}

// Ensure user has a referral code registered in Firestore.
// Checks loyalty doc for an already-assigned code first (backward compat).
export async function ensureReferralCode(uid, displayName) {
  const loyaltyRef = doc(db, 'users', uid);
  const loyaltySnap = await getDoc(loyaltyRef);
  const stored = loyaltySnap.exists() ? loyaltySnap.data().referralCode : null;

  if (stored) {
    // Code already assigned — make sure the referralCodes doc still exists
    const codeRef = doc(db, 'referralCodes', stored);
    const codeSnap = await getDoc(codeRef);
    if (!codeSnap.exists()) {
      await setDoc(codeRef, { uid, code: stored, totalUses: 0, createdAt: serverTimestamp() });
    }
    return { uid, code: stored, totalUses: codeSnap.exists() ? codeSnap.data().totalUses || 0 : 0 };
  }

  // No stored code yet — generate a new name-based one
  const code = buildReferralCode(uid, displayName);
  const codeRef = doc(db, 'referralCodes', code);
  const codeSnap = await getDoc(codeRef);
  if (!codeSnap.exists()) {
    await setDoc(codeRef, { uid, code, totalUses: 0, createdAt: serverTimestamp() });
  }
  // Save to loyalty doc so it persists
  await updateDoc(loyaltyRef, { referralCode: code }).catch(() =>
    setDoc(loyaltyRef, { referralCode: code }, { merge: true })
  );
  return { uid, code, totalUses: codeSnap.exists() ? codeSnap.data().totalUses || 0 : 0 };
}

// Validate a referral code → returns referrer uid or null
export async function validateReferralCode(code) {
  if (!code) return null;
  const normalized = code.toUpperCase().trim();
  const snap = await getDoc(doc(db, 'referralCodes', normalized));
  if (!snap.exists()) return null;
  return snap.data().uid || null;
}

// Apply referral: award referrer 50 pts, track the use
// referredUid = the user who used the code
export async function applyReferral(referralCode, referredUid) {
  if (!referralCode || !referredUid) return;
  const normalized = referralCode.toUpperCase().trim();
  const codeRef = doc(db, 'referralCodes', normalized);
  const snap = await getDoc(codeRef);
  if (!snap.exists()) return;

  const referrerUid = snap.data().uid;
  if (referrerUid === referredUid) return; // no self-referral

  await Promise.all([
    updateDoc(codeRef, { totalUses: increment(1) }),
    updateDoc(doc(db, 'users', referrerUid), {
      loyaltyPoints: increment(POINTS_PER_REFERRAL),
      loyaltyPointsEarned: increment(POINTS_PER_REFERRAL),
    }),
    addDoc(collection(db, 'referralUses'), {
      referralCode: normalized,
      referrerUid,
      referredUid,
      awardedAt: serverTimestamp(),
    }),
  ]);
}

// Get referral code stats for a specific user
export async function getReferralStats(uid, code) {
  const resolvedCode = code || buildReferralCode(uid);
  const snap = await getDoc(doc(db, 'referralCodes', resolvedCode));
  return {
    code: resolvedCode,
    totalUses: snap.exists() ? snap.data().totalUses || 0 : 0,
  };
}

// Fetch referral leaderboard for admin
export async function fetchReferralLeaderboard() {
  const snap = await getDocs(collection(db, 'referralCodes'));
  return snap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((r) => r.totalUses > 0)
    .sort((a, b) => (b.totalUses || 0) - (a.totalUses || 0));
}
