import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Typography,
  Container,
  Grid,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Divider,
  IconButton,
  Collapse,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { saveOrder } from '../lib/orderService';
import { decrementStockBatch } from '../lib/stockService';
import { redeemGiftCard } from '../lib/giftCardService';
import { saveShippingDetails, fetchShippingDetails } from '../lib/shippingService';
import { validateReferralCode, applyReferral, getLoyaltyData, redeemLoyaltyPoints, REFERRAL_DISCOUNT, REDEMPTION_UNIT, REDEMPTION_VALUE, PRESSONS_TIER_MIN, PRESSONS_TIER_DISCOUNT, getPendingLoyaltyReward, clearPendingLoyaltyReward } from '../lib/loyaltyService';
import { nigerianStates } from '../data/nigerianStates';
import SignInPrompt from '../components/SignInPrompt';

function formatNaira(amount) {
  return `\u20A6${Number(amount).toLocaleString()}`;
}

const WHATSAPP_NUMBER = '2349053714197';

const textFieldSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: 2,
    '& fieldset': { borderColor: '#F0C0D0' },
    '&:hover fieldset': { borderColor: '#E91E8C' },
    '&.Mui-focused fieldset': { borderColor: '#E91E8C' },
  },
  '& .MuiInputLabel-root.Mui-focused': { color: '#E91E8C' },
};

export default function CheckoutPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { cart, clearCart, getCartTotal } = useCart();
  const { services, products, pressOns } = cart.items;

  const appliedGiftCard = location.state?.appliedGiftCard || null;
  const subtotal = getCartTotal();
  const giftCardDiscount = appliedGiftCard ? Math.min(appliedGiftCard.balance, subtotal) : 0;

  // Referral code: pre-filled from CartPage or sessionStorage
  const [showRefField, setShowRefField] = useState(false);
  const [pendingReferralCode, setPendingReferralCode] = useState(() => location.state?.referralCode || sessionStorage.getItem('pendingReferralCode') || '');
  const [referralValid, setReferralValid] = useState(false);
  const [referralChecking, setReferralChecking] = useState(false);
  const [referralMsg, setReferralMsg] = useState('');
  const referralDiscount = referralValid ? Math.min(REFERRAL_DISCOUNT, subtotal) : 0;

  // Loyalty points redemption
  const [loyaltyBalance, setLoyaltyBalance] = useState(0);
  const [userReviewCount, setUserReviewCount] = useState(0);
  const [loyaltyUnits, setLoyaltyUnits] = useState(location.state?.presetLoyaltyUnits || 0);
  const [pendingReward] = useState(() => getPendingLoyaltyReward());
  const maxLoyaltyUnits = Math.floor(loyaltyBalance / REDEMPTION_UNIT);
  const loyaltyDiscount = Math.min(loyaltyUnits * REDEMPTION_VALUE, subtotal);

  // Tier perk: Glam Client (2+ reviews) gets 5% off press-ons
  const pressOnTotal = pressOns.reduce((sum, p) => sum + p.price * (p.quantity || 1), 0);
  const tierPerkActive = !!user && userReviewCount >= PRESSONS_TIER_MIN && pressOnTotal > 0;
  const tierPerkDiscount = tierPerkActive ? Math.round(pressOnTotal * PRESSONS_TIER_DISCOUNT) : 0;

  const finalTotal = Math.max(0, subtotal - giftCardDiscount - referralDiscount - loyaltyDiscount - tierPerkDiscount);

  const hasDeliverables = products.length > 0 || pressOns.length > 0;

  const serviceSubtotal = services.reduce((sum, s) => sum + s.price, 0);
  const depositAmount = services.length > 0 ? Math.round(serviceSubtotal * 0.5) : 0;

  const [form, setForm] = useState({ name: '', phone: '', address: '', state: '', lga: '' });
  const [submitting, setSubmitting] = useState(false);
  const [signInPromptOpen, setSignInPromptOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [pendingShipping, setPendingShipping] = useState(null);

  // Fetch loyalty balance and review count for logged-in user
  useEffect(() => {
    if (!user) return;
    getLoyaltyData(user.uid).then((d) => { const pts = d.loyaltyPoints || 0; setLoyaltyBalance(pts); setUserReviewCount(d.reviewCount || 0); if (!location.state?.presetLoyaltyUnits) { const pr = getPendingLoyaltyReward(); if (pr && pr.units > 0) setLoyaltyUnits(Math.min(pr.units, Math.floor(pts / REDEMPTION_UNIT))); } }).catch(() => {});
  }, [user]);

  // Validate referral code on mount
  useEffect(() => {
    const code = location.state?.referralCode || sessionStorage.getItem('pendingReferralCode');
    if (!code || !user) return;
    setShowRefField(true);
    validateReferralCode(code).then((referrerUid) => {
      const valid = !!referrerUid && referrerUid !== user?.uid;
      setReferralValid(valid);
      setReferralMsg(valid ? '\u20a6500 off applied!' : '');
    }).catch(() => {});
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleApplyReferral = async () => {
    if (!pendingReferralCode.trim()) return;
    setReferralChecking(true);
    setReferralMsg('');
    try {
      const referrerUid = await validateReferralCode(pendingReferralCode.trim());
      if (!referrerUid) { setReferralValid(false); setReferralMsg('Invalid code.'); }
      else if (referrerUid === user?.uid) { setReferralValid(false); setReferralMsg("You can't use your own referral code."); }
      else { setReferralValid(true); setReferralMsg('\u20a6500 off applied!'); }
    } catch { setReferralValid(false); setReferralMsg('Could not verify code.'); }
    setReferralChecking(false);
  };

  // Redirect if no deliverable items in cart
  useEffect(() => {
    if (!hasDeliverables) navigate('/cart', { replace: true });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Pre-fill name from auth, then overwrite with saved shipping details if available
  useEffect(() => {
    if (!user) return;
    setForm((prev) => ({ ...prev, name: prev.name || user.displayName || '' }));
    fetchShippingDetails(user.uid)
      .then((saved) => {
        if (saved) {
          setForm({
            name: saved.name || user.displayName || '',
            phone: saved.phone || '',
            address: saved.address || '',
            state: saved.state || '',
            lga: saved.lga || '',
          });
        }
      })
      .catch(() => {});
  }, [user]);

  const handleChange = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const isValidPhone = (p) => /^0\d{10}$/.test(p.replace(/[\s-]/g, ''));

  const isFormValid =
    form.name.trim() &&
    isValidPhone(form.phone) &&
    form.address.trim() &&
    form.state &&
    form.lga.trim();

  const handleCompleteOrder = async (paymentReference, shipping) => {
    setPaymentModalOpen(false);
    setSubmitting(true);

    // Build WhatsApp message synchronously BEFORE any awaits — browsers block
    // window.open() when called after async operations break the user-gesture chain
    const lines = [];
    lines.push('--- SHIPPING DETAILS ---');
    lines.push(`Name: ${shipping.name}`);
    lines.push(`Phone: ${shipping.phone}`);
    lines.push(`Address: ${shipping.address}`);
    lines.push(`State: ${shipping.state}`);
    lines.push(`LGA: ${shipping.lga}`);
    lines.push('');

    if (services.length > 0) {
      lines.push('--- SERVICE APPOINTMENTS ---');
      services.forEach((s, i) => {
        let line = `${i + 1}. ${s.name} \u2014 ${formatNaira(s.price)}`;
        if (s.customerName) line += `\n   Name: ${s.customerName}`;
        line += `\n   Date: ${s.date}\n   Shape: ${s.nailShape} | Length: ${s.nailLength}`;
        lines.push(line);
      });
      lines.push('');
    }

    if (products.length > 0) {
      lines.push('--- NAIL CARE PRODUCTS ---');
      products.forEach((p, i) => {
        lines.push(`${i + 1}. ${p.name} x${p.quantity} \u2014 ${formatNaira(p.price * p.quantity)}`);
      });
      lines.push('');
    }

    if (pressOns.length > 0) {
      lines.push('--- PRESS-ON ORDERS ---');
      pressOns.forEach((p, i) => {
        let detail = `${i + 1}. ${p.name} \u2014 ${formatNaira(p.price)}`;
        if (p.customerName) detail += `\n   Name: ${p.customerName}`;
        if (p.type) detail += `\n   Type: ${p.type}`;
        detail += `\n   Shape: ${p.nailShape || 'N/A'}`;
        detail += `\n   Quantity: ${p.quantity} set(s)`;
        if (p.nailBedSize) detail += `\n   Nail Bed Size: ${p.nailBedSize}`;
        if (p.presetSize) detail += `\n   Preset Size: ${p.presetSize}`;
        if (p.orderingForOthers && p.otherPeople?.length > 0) {
          p.otherPeople.forEach((o) => {
            detail += `\n   Also for: ${o.name || 'N/A'} \u2014 Shape: ${o.nailShape || 'Same'} \u2014 Nail Bed: ${o.nailBedSize || 'N/A'}`;
          });
        }
        lines.push(detail);
      });
      lines.push('');
    }

    let totalLine = `Estimated Total: ${formatNaira(subtotal)}`;
    if (appliedGiftCard && giftCardDiscount > 0) {
      totalLine += `\nGift Card Applied: ${appliedGiftCard.code} \u2014 Discount: ${formatNaira(giftCardDiscount)}`;
    }
    if (referralValid && referralDiscount > 0) {
      totalLine += `\nReferral Code Applied: ${pendingReferralCode} \u2014 Discount: ${formatNaira(referralDiscount)}`;
    }
    if (loyaltyUnits > 0 && loyaltyDiscount > 0) {
      totalLine += `\nLoyalty Points Applied: ${loyaltyUnits * REDEMPTION_UNIT} pts \u2014 Discount: ${formatNaira(loyaltyDiscount)}`;
    }
    if (tierPerkDiscount > 0) {
      totalLine += `\nStar Client Perk (5% off press-ons): -${formatNaira(tierPerkDiscount)}`;
    }
    if (giftCardDiscount > 0 || referralDiscount > 0 || loyaltyDiscount > 0 || tierPerkDiscount > 0) {
      totalLine += `\nAmount Due: ${formatNaira(finalTotal)}`;
    }

    let depositLine = '';
    if (services.length > 0) {
      if (paymentReference) {
        depositLine = `\n\n\u2705 Appointment Deposit Paid: ${formatNaira(depositAmount)} (Paystack Ref: ${paymentReference})`;
      } else {
        depositLine = `\n\n\u26A0\uFE0F Appointment Deposit (50%): ${formatNaira(depositAmount)} \u2014 To be arranged via WhatsApp`;
      }
    }

    const message = `Hi! I\u2019d like to place an order.\n\n${lines.join('\n')}\n${totalLine}${depositLine}\n\nPlease confirm availability and payment details. Thank you!`;
    const waUrl = `https://api.whatsapp.com/send?phone=${WHATSAPP_NUMBER}&text=${encodeURIComponent(message)}`;
    // Skip/no-payment path: still inside user gesture, open new tab before any awaits
    if (!paymentReference) window.open(waUrl, '_blank');

    // Background async operations (save shipping, decrement stock, save order, redeem gift card)
    saveShippingDetails(user.uid, shipping).catch(() => {});

    // Decrement stock for retail products and ready-made press-ons
    try {
      const stockItems = [];
      products.forEach((p) => {
        if (p.categoryId && p.stock !== undefined) {
          stockItems.push({ collection: 'retailCategories', categoryId: p.categoryId, productId: p.productId, quantity: p.quantity });
        }
      });
      pressOns.forEach((p) => {
        if (p.readyMade && p.categoryId && p.stock !== undefined) {
          stockItems.push({ collection: 'productCategories', categoryId: p.categoryId, productId: p.productId, quantity: Number(p.quantity) || 1 });
        }
      });
      if (stockItems.length > 0) await decrementStockBatch(stockItems);
    } catch (err) {
      console.error('Stock decrement failed:', err);
    }

    // Determine order type
    const hasServices = services.length > 0;
    const hasProducts = products.length > 0;
    const hasPressOns = pressOns.length > 0;
    const orderType =
      hasServices ? 'mixed' :
      hasPressOns && !hasProducts ? 'pressOn' :
      hasProducts && !hasPressOns ? 'retail' : 'mixed';

    // Save order to Firestore
    let orderId = null;
    try {
      const allItems = [
        ...services.map((s) => ({ kind: 'service', name: s.name, price: s.price, quantity: 1 })),
        ...products.map((p) => ({ kind: 'retail', name: p.name, price: p.price, quantity: p.quantity })),
        ...pressOns.map((p) => ({
          kind: 'pressOn', name: p.name, price: p.price, quantity: p.quantity || 1,
          ...(p.nailShape && { nailShape: p.nailShape }),
          ...(p.nailBedSize && { nailBedSize: p.nailBedSize }),
          ...(p.presetSize && { presetSize: p.presetSize }),
          ...(p.orderingForOthers && p.otherPeople?.length > 0 && { otherPeople: p.otherPeople }),
        })),
      ];
      const orderData = {
        type: orderType,
        total: finalTotal,
        customerName: shipping.name,
        email: user.email || '',
        items: allItems,
        shipping,
      };
      if (paymentReference) {
        orderData.paymentReference = paymentReference;
        orderData.depositPaid = depositAmount;
      }
      if (appliedGiftCard) {
        orderData.giftCardCode = appliedGiftCard.code;
        orderData.giftCardDiscount = giftCardDiscount;
      }
      if (referralValid && referralDiscount > 0) {
        orderData.referralCode = pendingReferralCode;
        orderData.referralDiscount = referralDiscount;
      }
      if (loyaltyUnits > 0) {
        orderData.loyaltyPointsUsed = loyaltyUnits * REDEMPTION_UNIT;
        orderData.loyaltyDiscount = loyaltyDiscount;
      }
      const docRef = await saveOrder(user.uid, orderData);
      orderId = docRef?.id || null;
    } catch {
      // continue even if order save fails
    }

    // Deduct redeemed loyalty points
    if (loyaltyUnits > 0) {
      redeemLoyaltyPoints(user.uid, loyaltyUnits * REDEMPTION_UNIT).catch(() => {});
      clearPendingLoyaltyReward();
    }

    // Redeem gift card if applied
    if (appliedGiftCard && giftCardDiscount > 0) {
      try {
        await redeemGiftCard(appliedGiftCard.code, giftCardDiscount, orderId);
      } catch (err) {
        console.error('Gift card redemption failed:', err);
      }
    }

    // Apply referral: award referrer points and track usage
    if (referralValid && pendingReferralCode) {
      applyReferral(pendingReferralCode, user.uid).catch(() => {});
      sessionStorage.removeItem('pendingReferralCode');
    }

    setSubmitting(false);
    clearCart();
    // Push /thank-you into history FIRST, then navigate to WhatsApp.
    // History stack becomes [..., /thank-you, whatsapp] so pressing back returns to thank-you page.
    navigate('/thank-you', {
      state: {
        type: orderType,
        customerName: shipping.name,
        items: [
          ...services.map((s) => ({ kind: 'service', serviceName: s.name, price: s.price })),
          ...products.map((p) => ({ kind: 'retail', name: p.name, price: p.price * (p.quantity || 1), quantity: p.quantity })),
          ...pressOns.map((p) => ({ kind: 'press-on', name: p.name, price: p.price * (p.quantity || 1), nailShape: p.nailShape, quantity: p.quantity || 1 })),
        ],
        total: services.reduce((s, i) => s + i.price, 0) + products.reduce((s, i) => s + i.price * (i.quantity || 1), 0) + pressOns.reduce((s, i) => s + i.price * (i.quantity || 1), 0),
        finalTotal,
        giftCardDiscount,
        referralDiscount,
        loyaltyDiscount,
      },
    });
    if (paymentReference) window.location.href = waUrl;
  };

  const handleSubmit = async () => {
    if (!user) { setSignInPromptOpen(true); return; }
    if (!isFormValid) return;

    const shipping = {
      name: form.name.trim(),
      phone: form.phone.trim(),
      address: form.address.trim(),
      state: form.state,
      lga: form.lga.trim(),
    };

    if (services.length > 0) {
      setPendingShipping(shipping);
      setPaymentModalOpen(true);
    } else {
      handleCompleteOrder('', shipping);
    }
  };

  const payWithPaystack = () => {
    const pk = import.meta.env?.VITE_PAYSTACK_PUBLIC_KEY || '';
    if (!pk || !window.PaystackPop) { handleCompleteOrder('', pendingShipping); return; }
    window.PaystackPop.setup({
      key: pk,
      email: user?.email || 'guest@chizzys.com',
      amount: depositAmount * 100,
      currency: 'NGN',
      ref: `CHIZZYS-CART-${Date.now()}`,
      metadata: { appointmentCount: services.length },
      callback: (response) => handleCompleteOrder(response.reference, pendingShipping),
      onClose: () => {},
    }).openIframe();
  };

  if (!hasDeliverables) return null;

  return (
    <Box sx={{ pt: { xs: 10, md: 12 }, pb: { xs: 16, md: 10 }, minHeight: '100vh', backgroundColor: '#FFF0F5' }}>
      <Container maxWidth="lg">
        {/* Header */}
        <Typography
          variant="h3"
          sx={{
            fontFamily: '"Georgia", serif',
            fontWeight: 700,
            color: 'var(--text-main)',
            mb: 5,
            textAlign: 'center',
            fontSize: { xs: '1.8rem', sm: '2.4rem', md: '3rem' },
          }}
        >
          Checkout
        </Typography>

        <Grid container spacing={4} alignItems="flex-start">
          {/* ── Shipping Form ── */}
          <Grid item xs={12} md={7}>
            {/* Nigeria-only delivery notice */}
            <Box
              sx={{
                mb: 3,
                p: 2,
                backgroundColor: '#FCE4EC',
                borderRadius: 2,
                border: '1px solid #F0C0D0',
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
              }}
            >
              <LocalShippingOutlinedIcon sx={{ color: 'var(--text-purple)', fontSize: 22, flexShrink: 0 }} />
              <Typography sx={{ color: 'var(--text-purple)', fontWeight: 600, fontSize: '0.9rem', lineHeight: 1.5 }}>
                We currently deliver within Nigeria only. Please provide a valid Nigerian delivery address.
              </Typography>
            </Box>

            <Typography
              sx={{
                fontFamily: '"Georgia", serif',
                fontWeight: 700,
                color: 'var(--text-purple)',
                mb: 2.5,
                fontSize: '1.15rem',
              }}
            >
              Shipping Details
            </Typography>

            <TextField
              fullWidth
              label="Full Name *"
              value={form.name}
              onChange={handleChange('name')}
              size="small"
              sx={{ mb: 2, ...textFieldSx }}
            />

            <TextField
              fullWidth
              label="Phone Number *"
              value={form.phone}
              onChange={handleChange('phone')}
              size="small"
              placeholder="e.g. 08012345678"
              error={form.phone.length > 0 && !isValidPhone(form.phone)}
              helperText={
                form.phone.length > 0 && !isValidPhone(form.phone)
                  ? 'Enter a valid 11-digit Nigerian phone number'
                  : ''
              }
              sx={{ mb: 2, ...textFieldSx }}
            />

            <TextField
              fullWidth
              label="Delivery Address *"
              value={form.address}
              onChange={handleChange('address')}
              multiline
              rows={2}
              placeholder="House number, street, nearest landmark"
              sx={{ mb: 2, ...textFieldSx }}
            />

            <FormControl fullWidth size="small" sx={{ mb: 2 }}>
              <InputLabel sx={{ '&.Mui-focused': { color: '#E91E8C' } }}>State *</InputLabel>
              <Select
                value={form.state}
                onChange={handleChange('state')}
                label="State *"
                sx={{
                  borderRadius: 2,
                  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#F0C0D0' },
                  '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#E91E8C' },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#E91E8C' },
                }}
              >
                {nigerianStates.map((s) => (
                  <MenuItem key={s} value={s}>{s}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="LGA (Local Government Area) *"
              value={form.lga}
              onChange={handleChange('lga')}
              size="small"
              sx={{ mb: 2, ...textFieldSx }}
            />
          </Grid>

          {/* ── Order Summary ── */}
          <Grid item xs={12} md={5}>
            <Box
              sx={{
                backgroundColor: '#fff',
                borderRadius: 3,
                border: '1px solid #F0C0D0',
                p: 3,
                position: { md: 'sticky' },
                top: { md: 90 },
              }}
            >
              <Typography
                sx={{
                  fontFamily: '"Georgia", serif',
                  fontWeight: 700,
                  color: 'var(--text-purple)',
                  fontSize: '1.1rem',
                  mb: 2,
                }}
              >
                Order Summary
              </Typography>

              {services.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography sx={{ color: '#aaa', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, mb: 1 }}>
                    Appointments
                  </Typography>
                  {services.map((s) => (
                    <Box key={s.id} sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography sx={{ fontSize: '0.88rem', color: 'var(--text-muted)', flex: 1, mr: 1 }}>{s.name}</Typography>
                      <Typography sx={{ fontSize: '0.88rem', fontWeight: 600, color: '#E91E8C', whiteSpace: 'nowrap' }}>{formatNaira(s.price)}</Typography>
                    </Box>
                  ))}
                </Box>
              )}

              {products.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography sx={{ color: '#aaa', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, mb: 1 }}>
                    Nail Care Products
                  </Typography>
                  {products.map((p) => (
                    <Box key={p.productId} sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography sx={{ fontSize: '0.88rem', color: 'var(--text-muted)', flex: 1, mr: 1 }}>{p.name} ×{p.quantity}</Typography>
                      <Typography sx={{ fontSize: '0.88rem', fontWeight: 600, color: '#E91E8C', whiteSpace: 'nowrap' }}>{formatNaira(p.price * p.quantity)}</Typography>
                    </Box>
                  ))}
                </Box>
              )}

              {pressOns.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography sx={{ color: '#aaa', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.8, mb: 1 }}>
                    Press-On Orders
                  </Typography>
                  {pressOns.map((p) => (
                    <Box key={p.id} sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography sx={{ fontSize: '0.88rem', color: 'var(--text-muted)', flex: 1, mr: 1 }}>
                        {p.name}{p.quantity > 1 ? ` ×${p.quantity}` : ''}
                      </Typography>
                      <Typography sx={{ fontSize: '0.88rem', fontWeight: 600, color: '#E91E8C', whiteSpace: 'nowrap' }}>{formatNaira(p.price)}</Typography>
                    </Box>
                  ))}
                </Box>
              )}

              {/* Appointment Deposit Info */}
              {services.length > 0 && (
                <Box sx={{ mb: 2, p: 2, borderRadius: 2, backgroundColor: '#FFF0F8', border: '1.5px solid #E91E8C' }}>
                  <Typography sx={{ fontFamily: '"Georgia", serif', fontWeight: 700, color: 'var(--text-purple)', fontSize: '0.82rem', mb: 1 }}>
                    Appointment Deposit
                  </Typography>
                  {services.map((s) => (
                    <Box key={s.id} sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.4 }}>
                      <Typography sx={{ fontSize: '0.82rem', color: 'var(--text-muted)', flex: 1, mr: 1 }}>{s.name}</Typography>
                      <Typography sx={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{formatNaira(s.price)}</Typography>
                    </Box>
                  ))}
                  <Divider sx={{ borderColor: '#F0C0D0', my: 1 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.4 }}>
                    <Typography sx={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Appointment subtotal</Typography>
                    <Typography sx={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)' }}>{formatNaira(serviceSubtotal)}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.4 }}>
                    <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: '#E91E8C' }}>50% deposit due now</Typography>
                    <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: '#E91E8C' }}>{formatNaira(depositAmount)}</Typography>
                  </Box>
                  <Typography sx={{ fontSize: '0.75rem', color: '#999' }}>
                    Balance {formatNaira(serviceSubtotal - depositAmount)} due on appointment day
                  </Typography>
                </Box>
              )}

              <Divider sx={{ borderColor: '#F0C0D0', my: 2 }} />

              {/* Referral code input */}
              <Box sx={{ mb: 1.5 }}>
                <Box onClick={() => setShowRefField((v) => !v)} sx={{ display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer', mb: showRefField ? 1 : 0 }}>
                  <LocalOfferIcon sx={{ fontSize: 15, color: referralValid ? '#2e7d32' : '#E91E8C' }} />
                  <Typography sx={{ fontSize: '0.82rem', fontWeight: 600, color: referralValid ? '#2e7d32' : '#E91E8C', fontFamily: '"Georgia", serif' }}>
                    {referralValid ? '\u20a6500 off applied!' : 'Have a referral code?'}
                  </Typography>
                </Box>
                <Collapse in={showRefField}>
                  <Box sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                    <TextField size="small" placeholder="e.g. CHIZZYS-ABC123" value={pendingReferralCode}
                      onChange={(e) => { setPendingReferralCode(e.target.value.toUpperCase()); setReferralValid(false); setReferralMsg(''); }}
                      sx={{ flex: 1, '& .MuiOutlinedInput-root': { borderRadius: 2, '& fieldset': { borderColor: '#F0C0D0' }, '&.Mui-focused fieldset': { borderColor: '#E91E8C' } } }}
                      inputProps={{ style: { fontFamily: 'monospace', fontSize: '0.82rem' } }}
                    />
                    <Button onClick={handleApplyReferral} disabled={!pendingReferralCode.trim() || referralChecking}
                      sx={{ backgroundColor: '#E91E8C', color: '#fff', borderRadius: 2, px: 2, fontFamily: '"Georgia", serif', fontWeight: 600, fontSize: '0.78rem', whiteSpace: 'nowrap', '&:hover': { backgroundColor: '#C2185B' }, '&.Mui-disabled': { backgroundColor: '#F0C0D0', color: '#fff' } }}>
                      {referralChecking ? <CircularProgress size={14} sx={{ color: '#fff' }} /> : 'Apply'}
                    </Button>
                  </Box>
                  {referralMsg && <Typography sx={{ fontSize: '0.75rem', color: referralValid ? '#2e7d32' : '#d32f2f', mt: 0.3 }}>{referralMsg}</Typography>}
                </Collapse>
              </Box>

              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography sx={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Subtotal</Typography>
                <Typography sx={{ fontWeight: 600, fontSize: '0.9rem' }}>{formatNaira(subtotal)}</Typography>
              </Box>

              {giftCardDiscount > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography sx={{ color: '#2e7d32', fontSize: '0.9rem' }}>
                    Gift card ({appliedGiftCard.code})
                  </Typography>
                  <Typography sx={{ color: '#2e7d32', fontWeight: 600, fontSize: '0.9rem' }}>
                    -{formatNaira(giftCardDiscount)}
                  </Typography>
                </Box>
              )}

              {referralDiscount > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography sx={{ color: '#2e7d32', fontSize: '0.9rem' }}>Referral ({pendingReferralCode})</Typography>
                  <Typography sx={{ color: '#2e7d32', fontWeight: 600, fontSize: '0.9rem' }}>-{formatNaira(referralDiscount)}</Typography>
                </Box>
              )}

              {/* Loyalty Points */}
              {maxLoyaltyUnits > 0 && (
                <Box sx={{ my: 1.5, p: 1.5, borderRadius: 2, backgroundColor: '#FFF8E1', border: '1px solid #FFD54F' }}>
                  {/* Pending loyalty reward banner */}
                  {pendingReward && loyaltyUnits === 0 && (
                    <Box sx={{ mb: 1.5, p: 1.2, borderRadius: 2, background: 'linear-gradient(135deg, #FFF8E1, #FFF3E0)', border: '1.5px solid #FFD54F', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                      <Box>
                        <Typography sx={{ fontWeight: 700, fontSize: '0.82rem', color: '#B8860B' }}>🎁 ₦{pendingReward.naira.toLocaleString()} loyalty reward ready</Typography>
                        <Typography sx={{ fontSize: '0.72rem', color: '#888' }}>{pendingReward.pts} pts saved — tap Apply to use</Typography>
                      </Box>
                      <Button size="small" onClick={() => setLoyaltyUnits(Math.min(pendingReward.units, maxLoyaltyUnits))} sx={{ border: '1.5px solid #E91E8C', borderRadius: '20px', color: '#E91E8C', px: 2, py: 0.4, fontSize: '0.78rem', fontWeight: 700, textTransform: 'none', '&:hover': { backgroundColor: '#E91E8C', color: '#fff' } }}>Apply</Button>
                    </Box>
                  )}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: '#B8860B' }}>
                      🏆 Loyalty Points
                    </Typography>
                    <Typography sx={{ fontSize: '0.72rem', color: '#888' }}>
                      {loyaltyBalance} pts available
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <IconButton
                      size="small"
                      onClick={() => setLoyaltyUnits((u) => Math.max(0, u - 1))}
                      disabled={loyaltyUnits === 0}
                      sx={{ border: '1px solid #FFD54F', color: '#B8860B', p: 0.3 }}
                    >
                      <RemoveIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                    <Typography sx={{ flex: 1, textAlign: 'center', fontSize: '0.8rem', fontWeight: 600, color: loyaltyUnits > 0 ? '#B8860B' : '#aaa' }}>
                      {loyaltyUnits === 0 ? 'Not applied' : `${loyaltyUnits * REDEMPTION_UNIT} pts → -${formatNaira(loyaltyDiscount)}`}
                    </Typography>
                    <IconButton
                      size="small"
                      onClick={() => setLoyaltyUnits((u) => Math.min(maxLoyaltyUnits, u + 1))}
                      disabled={loyaltyUnits >= maxLoyaltyUnits}
                      sx={{ border: '1px solid #FFD54F', color: '#B8860B', p: 0.3 }}
                    >
                      <AddIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  </Box>
                </Box>
              )}
              {loyaltyDiscount > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography sx={{ color: '#B8860B', fontSize: '0.9rem' }}>
                    Loyalty ({loyaltyUnits * REDEMPTION_UNIT} pts)
                  </Typography>
                  <Typography sx={{ color: '#B8860B', fontWeight: 600, fontSize: '0.9rem' }}>
                    -{formatNaira(loyaltyDiscount)}
                  </Typography>
                </Box>
              )}

              {tierPerkDiscount > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5, p: 1, borderRadius: 2, backgroundColor: '#FFFDE7', border: '1px solid #FFD54F' }}>
                  <Typography sx={{ color: '#B8860B', fontSize: '0.82rem', fontWeight: 600 }}>
                    ⭐ Star Client — 5% off press-ons
                  </Typography>
                  <Typography sx={{ color: '#B8860B', fontWeight: 700, fontSize: '0.82rem' }}>
                    -{formatNaira(tierPerkDiscount)}
                  </Typography>
                </Box>
              )}

              <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1.5 }}>
                <Typography sx={{ fontFamily: '"Georgia", serif', fontWeight: 700, fontSize: '1.05rem' }}>
                  Total
                </Typography>
                <Typography sx={{ fontFamily: '"Georgia", serif', fontWeight: 700, fontSize: '1.05rem', color: '#E91E8C' }}>
                  {formatNaira(finalTotal)}
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>

        {/* Submit */}
        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
          <Button
            onClick={handleSubmit}
            disabled={!isFormValid || submitting}
            sx={{
              backgroundColor: '#E91E8C',
              color: '#fff',
              borderRadius: '30px',
              px: 6,
              py: 1.5,
              fontFamily: '"Georgia", serif',
              fontWeight: 600,
              fontSize: '1rem',
              '&:hover': { backgroundColor: '#C2185B' },
              '&.Mui-disabled': { backgroundColor: '#F0C0D0', color: '#fff' },
            }}
          >
            {submitting
              ? <CircularProgress size={22} sx={{ color: '#fff' }} />
              : services.length > 0 ? 'Pay Deposit & Place Order' : 'Place Order via WhatsApp'}
          </Button>
        </Box>
      </Container>

      {/* Payment Modal */}
      <Dialog
        open={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontFamily: '"Georgia", serif', fontWeight: 700, color: 'var(--text-purple)', pb: 1 }}>
          Confirm &amp; Pay Appointment Deposit
        </DialogTitle>
        <DialogContent>
          {/* Service list */}
          <Box sx={{ mb: 2, p: 2, borderRadius: 2, backgroundColor: '#FFF0F8', border: '1px solid #F0C0D0' }}>
            {services.map((s) => (
              <Box key={s.id} sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.8 }}>
                <Box sx={{ flex: 1, mr: 1 }}>
                  <Typography sx={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-main)' }}>{s.name}</Typography>
                  <Typography sx={{ fontSize: '0.78rem', color: '#888' }}>{s.date}</Typography>
                </Box>
                <Typography sx={{ fontSize: '0.88rem', fontWeight: 600, color: '#E91E8C', whiteSpace: 'nowrap' }}>{formatNaira(s.price)}</Typography>
              </Box>
            ))}
          </Box>

          <Divider sx={{ borderColor: '#F0C0D0', mb: 2 }} />

          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography sx={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>Appointment total</Typography>
            <Typography sx={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-muted)' }}>{formatNaira(serviceSubtotal)}</Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.8 }}>
            <Typography sx={{ fontSize: '0.9rem', fontWeight: 700, color: '#E91E8C' }}>Deposit (50%)</Typography>
            <Typography sx={{ fontSize: '0.9rem', fontWeight: 700, color: '#E91E8C' }}>{formatNaira(depositAmount)}</Typography>
          </Box>
          <Typography sx={{ fontSize: '0.78rem', color: '#999', mb: 1.5 }}>
            Balance {formatNaira(serviceSubtotal - depositAmount)} due on appointment day
          </Typography>

          {(products.length > 0 || pressOns.length > 0) && (
            <Typography sx={{ fontSize: '0.82rem', color: '#777', mb: 1.5, p: 1.2, borderRadius: 2, backgroundColor: '#F5F5F5', border: '1px solid #E0E0E0' }}>
              Press-on &amp; product orders will be confirmed via WhatsApp after payment.
            </Typography>
          )}

          <Typography sx={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
            Pay the 50% deposit via Paystack to confirm your booking, or skip to arrange payment manually via WhatsApp.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <Button
            onClick={() => handleCompleteOrder('', pendingShipping)}
            sx={{ color: '#888', fontSize: '0.82rem', textTransform: 'none', fontFamily: '"Georgia", serif' }}
          >
            Skip — Arrange on WhatsApp
          </Button>
          <Button
            onClick={payWithPaystack}
            sx={{
              backgroundColor: '#E91E8C',
              color: '#fff',
              borderRadius: '30px',
              px: 3,
              py: 1,
              fontFamily: '"Georgia", serif',
              fontWeight: 600,
              fontSize: '0.88rem',
              whiteSpace: 'nowrap',
              '&:hover': { backgroundColor: '#C2185B' },
            }}
          >
            Pay {formatNaira(depositAmount)} Deposit
          </Button>
        </DialogActions>
      </Dialog>

      <SignInPrompt open={signInPromptOpen} onClose={() => setSignInPromptOpen(false)} />
    </Box>
  );
}
