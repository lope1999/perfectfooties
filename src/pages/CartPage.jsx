import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Container,
  Button,
  IconButton,
  Divider,
  CircularProgress,
  Collapse,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
} from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import StarIcon from '@mui/icons-material/Star';
import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { decrementStockBatch } from '../lib/stockService';
import { saveOrder } from '../lib/orderService';
import { redeemGiftCard } from '../lib/giftCardService';
import { validateReferralCode, applyReferral, getLoyaltyData, redeemLoyaltyPoints, REFERRAL_DISCOUNT, REDEMPTION_UNIT, REDEMPTION_VALUE, getPendingLoyaltyReward, clearPendingLoyaltyReward } from '../lib/loyaltyService';
import GiftCardRedeemInput from '../components/GiftCardRedeemInput';
import { getRecentlyViewed } from '../lib/recentlyViewed';
import SignInPrompt from '../components/SignInPrompt';

function formatNaira(amount) {
  return `\u20A6${amount.toLocaleString()}`;
}

const sectionTitleSx = {
  fontFamily: '"Georgia", serif',
  fontWeight: 700,
  color: 'var(--text-purple)',
  fontSize: '1.2rem',
  mb: 2,
};

export default function CartPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [appliedGiftCard, setAppliedGiftCard] = useState(null);
  const [signInPromptOpen, setSignInPromptOpen] = useState(false);
  const [showRefField, setShowRefField] = useState(false);
  const [refCodeInput, setRefCodeInput] = useState('');
  const [referralValid, setReferralValid] = useState(false);
  const [referralChecking, setReferralChecking] = useState(false);
  const [referralMsg, setReferralMsg] = useState('');
  const [loyaltyBalance, setLoyaltyBalance] = useState(0);
  const [loyaltyUnits, setLoyaltyUnits] = useState(0);
  const [pendingReward] = useState(() => getPendingLoyaltyReward());
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [recentlyViewed] = useState(() => getRecentlyViewed());
  const {
    cart,
    removeService,
    removeProduct,
    updateProductQty,
    removePressOn,
    clearCart,
    getCartTotal,
  } = useCart();

  const { services, products, pressOns } = cart.items;
  const hasItems = services.length > 0 || products.length > 0 || pressOns.length > 0;
  const total = getCartTotal();
  const giftCardDiscount = appliedGiftCard ? Math.min(appliedGiftCard.balance, total) : 0;
  const maxLoyaltyUnits = Math.floor(loyaltyBalance / REDEMPTION_UNIT);
  const referralDiscount = referralValid ? Math.min(REFERRAL_DISCOUNT, total) : 0;
  const loyaltyDiscount = Math.min(loyaltyUnits * REDEMPTION_VALUE, Math.max(0, total - giftCardDiscount - referralDiscount));
  const finalTotal = Math.max(0, total - giftCardDiscount - referralDiscount - loyaltyDiscount);
  const serviceSubtotal = services.reduce((sum, s) => sum + s.price, 0);
  const depositAmount = services.length > 0 ? Math.round(serviceSubtotal * 0.5) : 0;

  useEffect(() => {
    if (!user) return;
    getLoyaltyData(user.uid).then((d) => { const pts = d.loyaltyPoints || 0; setLoyaltyBalance(pts); const pr = getPendingLoyaltyReward(); if (pr && pr.units > 0) setLoyaltyUnits(Math.min(pr.units, Math.floor(pts / REDEMPTION_UNIT))); }).catch(() => {});
    const pending = sessionStorage.getItem('pendingReferralCode');
    if (pending) {
      setRefCodeInput(pending);
      setShowRefField(true);
      validateReferralCode(pending).then((referrerUid) => {
        const valid = !!referrerUid && referrerUid !== user.uid;
        setReferralValid(valid);
        setReferralMsg(valid ? '\u20a6500 off applied!' : '');
      }).catch(() => {});
    }
  }, [user]);

  const handleApplyReferral = async () => {
    if (!refCodeInput.trim()) return;
    setReferralChecking(true);
    setReferralMsg('');
    try {
      const referrerUid = await validateReferralCode(refCodeInput.trim());
      if (!referrerUid) { setReferralValid(false); setReferralMsg('Invalid code.'); }
      else if (referrerUid === user?.uid) { setReferralValid(false); setReferralMsg("You can't use your own referral code."); }
      else { setReferralValid(true); setReferralMsg('\u20a6500 off applied!'); }
    } catch { setReferralValid(false); setReferralMsg('Could not verify code.'); }
    setReferralChecking(false);
  };

  const handleCheckout = async () => {
    if (!user) { setSignInPromptOpen(true); return; }

    // Any product/press-on items need shipping details — go to checkout page
    if (products.length > 0 || pressOns.length > 0) {
      navigate('/checkout', { state: { appliedGiftCard, referralCode: referralValid ? refCodeInput : null, presetLoyaltyUnits: loyaltyUnits } });
      return;
    }

    // Services-only: show payment modal
    setPaymentModalOpen(true);
    return;
  };

  const handleCompleteServiceOrder = async (paymentReference = '') => {
    setPaymentModalOpen(false);
    setCheckoutLoading(true);

    // Build WhatsApp message synchronously BEFORE any awaits — browsers block
    // window.open() when called after async operations break the user-gesture chain
    const lines = [];

    lines.push('--- SERVICE APPOINTMENTS ---');
    services.forEach((s, i) => {
      let line = `${i + 1}. ${s.name} \u2014 ${formatNaira(s.price)}`;
      if (s.customerName) line += `\n   Name: ${s.customerName}`;
      if (s.isHomeService) {
        line += `\n   Type: Home Service`;
        if (s.homeLocation) line += `\n   Location: ${s.homeLocation}`;
        if (s.homeAddress) line += `\n   Address: ${s.homeAddress}`;
        if (s.hasTableArea) line += `\n   Table Area: ${s.hasTableArea}`;
        if (s.transportRange) line += `\n   Est. Transport Fee: ${s.transportRange}`;
      }
      line += `\n   Date: ${s.date}\n   Shape: ${s.nailShape} | Length: ${s.nailLength}`;
      lines.push(line);
    });
    lines.push('');

    let totalLine = `Estimated Total: ${formatNaira(total)}`;
    if (appliedGiftCard && giftCardDiscount > 0) {
      totalLine += `\nGift Card Applied: ${appliedGiftCard.code} \u2014 Discount: ${formatNaira(giftCardDiscount)}`;
    }
    if (referralValid && referralDiscount > 0) {
      totalLine += `\nReferral Code Applied: ${refCodeInput} \u2014 Discount: ${formatNaira(referralDiscount)}`;
    }
    if (loyaltyUnits > 0 && loyaltyDiscount > 0) {
      totalLine += `\nLoyalty Points Applied: ${loyaltyUnits * REDEMPTION_UNIT} pts \u2014 Discount: ${formatNaira(loyaltyDiscount)}`;
    }
    if (giftCardDiscount > 0 || referralDiscount > 0 || loyaltyDiscount > 0) {
      totalLine += `\nAmount Due: ${formatNaira(finalTotal)}`;
    }

    let depositLine = '';
    if (paymentReference) {
      depositLine = `\n\n\u2705 Appointment Deposit Paid: ${formatNaira(depositAmount)} (Paystack Ref: ${paymentReference})`;
    } else {
      depositLine = `\n\n\u26A0\uFE0F Appointment Deposit (50%): ${formatNaira(depositAmount)} \u2014 To be arranged via WhatsApp`;
    }

    const message = `Hi! I\u2019d like to place a combined order.\n\n${lines.join('\n')}\n${totalLine}${depositLine}\n\nPlease confirm availability and payment details. Thank you!`;
    const encoded = encodeURIComponent(message);
    const whatsAppUrl = `https://api.whatsapp.com/send?phone=2349053714197&text=${encoded}`;
    if (!paymentReference) return;

    // Async operations after window.open
    try {
      const stockItems = [];
      products.forEach((p) => {
        if (p.categoryId && p.stock !== undefined) {
          stockItems.push({ collection: 'retailCategories', categoryId: p.categoryId, productId: p.productId, quantity: p.quantity });
        }
      });
      pressOns.forEach((p) => {
        if (p.readyMade && !p.specialRequest && p.categoryId && p.stock !== undefined) {
          stockItems.push({ collection: 'productCategories', categoryId: p.categoryId, productId: p.productId, quantity: Number(p.quantity) || 1 });
        }
      });
      if (stockItems.length > 0) {
        await decrementStockBatch(stockItems);
      }
    } catch (err) {
      console.error('Stock decrement failed:', err);
    }

    let orderId = null;
    if (user) {
      const allItems = [
        ...services.map((s) => ({
          kind: 'service', name: s.name, price: s.price, quantity: 1,
          ...(s.isHomeService && {
            isHomeService: true,
            homeLocation: s.homeLocation,
            homeAddress: s.homeAddress,
            hasTableArea: s.hasTableArea,
            transportRange: s.transportRange,
          }),
        })),
        ...products.map((p) => ({ kind: 'retail', name: p.name, price: p.price, quantity: p.quantity })),
        ...pressOns.map((p) => ({
          kind: 'pressOn', name: p.name, price: p.price, quantity: p.quantity || 1,
          ...(p.nailBedSize && { nailBedSize: p.nailBedSize }),
          ...(p.presetSize && { presetSize: p.presetSize }),
          ...(p.selectedLength && { selectedLength: p.selectedLength }),
          ...(p.setIncludes?.length > 0 && { setIncludes: p.setIncludes }),
          ...(p.inspirationTags?.length > 0 && { inspirationTags: p.inspirationTags }),
          ...(p.nailNotes && { nailNotes: p.nailNotes }),
          ...(p.specialRequest && { specialRequest: true }),
        })),
      ];
      try {
        const homeService = services.find((s) => s.isHomeService);
        const orderData = {
          type: 'mixed',
          total: finalTotal,
          customerName: user.displayName || '',
          email: user.email || '',
          ...(homeService && {
            isHomeService: true,
            homeLocation: homeService.homeLocation,
            homeAddress: homeService.homeAddress,
            hasTableArea: homeService.hasTableArea,
            transportRange: homeService.transportRange,
          }),
          items: allItems,
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
          orderData.referralCode = refCodeInput;
          orderData.referralDiscount = referralDiscount;
        }
        if (loyaltyUnits > 0) {
          orderData.loyaltyPointsUsed = loyaltyUnits * REDEMPTION_UNIT;
          orderData.loyaltyDiscount = loyaltyDiscount;
        }
        const docRef = await saveOrder(user.uid, orderData);
        orderId = docRef?.id || null;
      } catch {
        // order save failed — continue with checkout
      }
    }

    if (appliedGiftCard && giftCardDiscount > 0) {
      try {
        await redeemGiftCard(appliedGiftCard.code, giftCardDiscount, orderId);
      } catch (err) {
        console.error('Gift card redemption failed:', err);
      }
    }

    if (referralValid && refCodeInput) {
      applyReferral(refCodeInput.trim(), user.uid).catch(() => {});
      sessionStorage.removeItem('pendingReferralCode');
    }
    if (loyaltyUnits > 0) {
      redeemLoyaltyPoints(user.uid, loyaltyUnits * REDEMPTION_UNIT).catch(() => {});
      clearPendingLoyaltyReward();
    }

    setCheckoutLoading(false);
    setAppliedGiftCard(null);
    clearCart();
    // Push /thank-you into history FIRST, then navigate to WhatsApp.
    // History stack becomes [..., /thank-you, whatsapp] so pressing back returns to thank-you page.
    navigate('/thank-you', {
      state: {
        type: services.length > 0 && products.length === 0 && pressOns.length === 0 ? 'service' : 'retail',
        items: [
          ...services.map((s) => ({ kind: 'service', serviceName: s.name, price: s.price, date: s.appointmentDate })),
          ...products.map((p) => ({ kind: 'product', name: p.name, price: p.price * (p.quantity || 1), quantity: p.quantity })),
          ...pressOns.map((p) => ({ kind: 'press-on', name: p.name, price: p.price * (p.quantity || 1), nailShape: p.nailShape, quantity: p.quantity, selectedLength: p.selectedLength, setIncludes: p.setIncludes, inspirationTags: p.inspirationTags, nailNotes: p.nailNotes, specialRequest: p.specialRequest || false })),
        ],
        total,
        finalTotal,
        giftCardDiscount,
        referralDiscount,
        loyaltyDiscount,
      },
    });
    if (paymentReference) window.location.href = whatsAppUrl;
  };

  const payWithPaystackCart = () => {
    const pk = import.meta.env?.VITE_PAYSTACK_PUBLIC_KEY || '';
    if (!pk || !window.PaystackPop) { alert('Payment is required to confirm your booking. Please refresh the page and try again.'); return; }
    const handler = window.PaystackPop.setup({
      key: pk,
      email: user?.email || 'guest@chizzys.com',
      amount: depositAmount * 100,
      currency: 'NGN',
      ref: `CHIZZYS-APT-${Date.now()}`,
      metadata: { appointmentCount: services.length },
      callback: (response) => handleCompleteServiceOrder(response.reference),
      onClose: () => {},
    });
    handler.openIframe();
  };

  return (
    <Box sx={{ pt: { xs: 10, md: 12 }, pb: { xs: 22, md: 16 }, minHeight: '100vh', backgroundColor: '#FFF0F5' }}>
      <Container maxWidth="md">
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <ShoppingCartOutlinedIcon sx={{ fontSize: 48, color: '#E91E8C', mb: 1 }} />
          <Typography
            variant="h3"
            sx={{
              fontFamily: '"Georgia", serif',
              fontWeight: 700,
              color: 'var(--text-main)',
              fontSize: { xs: '1.8rem', sm: '2.4rem', md: '3rem' },
            }}
          >
            Your Cart
          </Typography>
        </Box>

        {!hasItems ? (
          /* Empty state */
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography sx={{ color: '#777', fontSize: '1.1rem', mb: 3 }}>
              Your cart is empty.
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button
                onClick={() => navigate('/book')}
                sx={{
                  border: '2px solid #E91E8C',
                  borderRadius: '30px',
                  color: 'var(--text-main)',
                  px: 3,
                  py: 1,
                  fontFamily: '"Georgia", serif',
                  fontWeight: 600,
                  '&:hover': { backgroundColor: '#E91E8C', color: '#fff' },
                }}
              >
                Book a Service
              </Button>
              <Button
                onClick={() => navigate('/shop')}
                sx={{
                  border: '2px solid #E91E8C',
                  borderRadius: '30px',
                  color: 'var(--text-main)',
                  px: 3,
                  py: 1,
                  fontFamily: '"Georgia", serif',
                  fontWeight: 600,
                  '&:hover': { backgroundColor: '#E91E8C', color: '#fff' },
                }}
              >
                Shop Products
              </Button>
              <Button
                onClick={() => navigate('/order')}
                sx={{
                  border: '2px solid #E91E8C',
                  borderRadius: '30px',
                  color: 'var(--text-main)',
                  px: 3,
                  py: 1,
                  fontFamily: '"Georgia", serif',
                  fontWeight: 600,
                  '&:hover': { backgroundColor: '#E91E8C', color: '#fff' },
                }}
              >
                Order Press-Ons
              </Button>
            </Box>
          </Box>
        ) : (
          <>
            {/* Service Appointments */}
            {services.length > 0 && (
              <Box sx={{ mb: 4 }}>
                <Typography sx={sectionTitleSx}>Service Appointments</Typography>
                {services.map((s) => (
                  <Box
                    key={s.id}
                    sx={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      p: 2,
                      mb: 1.5,
                      borderRadius: 2,
                      border: '1px solid #F0C0D0',
                      backgroundColor: '#fff',
                    }}
                  >
                    <Box sx={{ flex: 1 }}>
                      <Typography
                        sx={{
                          fontFamily: '"Georgia", serif',
                          fontWeight: 600,
                          fontSize: '0.95rem',
                        }}
                      >
                        {s.name}
                      </Typography>
                      {s.customerName && (
                        <Typography sx={{ color: 'var(--text-purple)', fontSize: '0.82rem', fontWeight: 600 }}>
                          {s.customerName}
                        </Typography>
                      )}
                      {s.isHomeService && (
                        <Typography sx={{ color: '#7a0064', fontSize: '0.78rem', fontWeight: 600, mt: 0.2 }}>
                          Home Service &middot; {s.homeLocation}
                        </Typography>
                      )}
                      <Typography sx={{ color: '#777', fontSize: '0.82rem' }}>
                        {s.date} &middot; {s.nailShape} &middot; {s.nailLength}
                      </Typography>
                      {s.isHomeService && s.homeAddress && (
                        <Typography sx={{ color: '#777', fontSize: '0.78rem' }}>
                          {s.homeAddress}
                        </Typography>
                      )}
                      {s.isHomeService && s.hasTableArea && (
                        <Typography sx={{ color: '#777', fontSize: '0.78rem' }}>
                          Table area: {s.hasTableArea}
                        </Typography>
                      )}
                      {s.isHomeService && s.transportRange && (
                        <Typography sx={{ color: '#E91E8C', fontSize: '0.78rem', fontWeight: 600 }}>
                          + {s.transportRange} est. transport (confirmed on booking)
                        </Typography>
                      )}
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 2 }}>
                      <Box>
                        {s.originalPrice && (
                          <Typography
                            sx={{
                              fontFamily: '"Georgia", serif',
                              fontSize: '0.75rem',
                              color: '#999',
                              textDecoration: 'line-through',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {formatNaira(s.originalPrice)}
                          </Typography>
                        )}
                        <Typography
                          sx={{
                            fontFamily: '"Georgia", serif',
                            fontWeight: 700,
                            color: s.originalPrice ? '#2e7d32' : '#E91E8C',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {formatNaira(s.price)}
                        </Typography>
                      </Box>
                      <IconButton
                        size="small"
                        onClick={() => removeService(s.id)}
                        sx={{ color: '#E91E8C' }}
                      >
                        <DeleteOutlineIcon sx={{ fontSize: 20 }} />
                      </IconButton>
                    </Box>
                  </Box>
                ))}
                <Divider sx={{ borderColor: '#F0C0D0', mt: 2 }} />
              </Box>
            )}

            {/* Nail Care Products */}
            {products.length > 0 && (
              <Box sx={{ mb: 4 }}>
                <Typography sx={sectionTitleSx}>Nail Care Products</Typography>
                {products.map((p) => (
                  <Box
                    key={p.productId}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      p: 2,
                      mb: 1.5,
                      borderRadius: 2,
                      border: '1px solid #F0C0D0',
                      backgroundColor: '#fff',
                    }}
                  >
                    <Box sx={{ flex: 1 }}>
                      <Typography
                        sx={{
                          fontFamily: '"Georgia", serif',
                          fontWeight: 600,
                          fontSize: '0.95rem',
                        }}
                      >
                        {p.name}
                      </Typography>
                      {p.customerName && (
                        <Typography sx={{ color: 'var(--text-purple)', fontSize: '0.78rem', fontWeight: 600 }}>
                          {p.customerName}
                        </Typography>
                      )}
                      <Typography sx={{ color: '#999', fontSize: '0.78rem' }}>
                        {p.originalPrice ? (
                          <>
                            <span style={{ textDecoration: 'line-through' }}>{formatNaira(p.originalPrice)}</span>
                            {' '}{formatNaira(p.price)} each
                          </>
                        ) : (
                          `${formatNaira(p.price)} each`
                        )}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 2 }}>
                      <IconButton
                        size="small"
                        onClick={() => updateProductQty(p.productId, p.quantity - 1)}
                        disabled={p.quantity <= 1}
                        sx={{
                          color: '#E91E8C',
                          border: '1.5px solid #E91E8C',
                          width: 28,
                          height: 28,
                          '&:hover': { backgroundColor: '#E91E8C', color: '#fff' },
                          '&.Mui-disabled': { borderColor: '#ddd', color: '#ddd' },
                        }}
                      >
                        <RemoveIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                      <Typography
                        sx={{
                          fontFamily: '"Georgia", serif',
                          fontWeight: 700,
                          minWidth: 24,
                          textAlign: 'center',
                          color: '#E91E8C',
                        }}
                      >
                        {p.quantity}
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={() => updateProductQty(p.productId, p.quantity + 1)}
                        disabled={p.quantity >= p.stock}
                        sx={{
                          color: '#E91E8C',
                          border: '1.5px solid #E91E8C',
                          width: 28,
                          height: 28,
                          '&:hover': { backgroundColor: '#E91E8C', color: '#fff' },
                          '&.Mui-disabled': { borderColor: '#ddd', color: '#ddd' },
                        }}
                      >
                        <AddIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                      <Typography
                        sx={{
                          fontFamily: '"Georgia", serif',
                          fontWeight: 700,
                          color: '#E91E8C',
                          minWidth: 70,
                          textAlign: 'right',
                        }}
                      >
                        {formatNaira(p.price * p.quantity)}
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={() => removeProduct(p.productId)}
                        sx={{ color: '#E91E8C' }}
                      >
                        <DeleteOutlineIcon sx={{ fontSize: 20 }} />
                      </IconButton>
                    </Box>
                  </Box>
                ))}
                <Divider sx={{ borderColor: '#F0C0D0', mt: 2 }} />
              </Box>
            )}

            {/* Press-On Orders */}
            {pressOns.length > 0 && (
              <Box sx={{ mb: 4 }}>
                <Typography sx={sectionTitleSx}>Press-On Orders</Typography>
                {pressOns.map((p) => (
                  <Box
                    key={p.id}
                    sx={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      p: 2,
                      mb: 1.5,
                      borderRadius: 2,
                      border: '1px solid #F0C0D0',
                      backgroundColor: '#fff',
                    }}
                  >
                    <Box sx={{ flex: 1 }}>
                      <Typography
                        sx={{
                          fontFamily: '"Georgia", serif',
                          fontWeight: 600,
                          fontSize: '0.95rem',
                        }}
                      >
                        {p.name}
                      </Typography>
                      {p.customerName && (
                        <Typography sx={{ color: 'var(--text-purple)', fontSize: '0.78rem', fontWeight: 600 }}>
                          {p.customerName}
                        </Typography>
                      )}
                      <Typography sx={{ color: '#777', fontSize: '0.82rem' }}>
                        {p.nailShape && `Shape: ${p.nailShape}`}
                        {p.quantity && ` \u00B7 ${p.quantity} set(s)`}
                        {p.presetSize && ` \u00B7 Size: ${p.presetSize}`}
                        {p.nailBedSize && ` \u00B7 Bed: ${p.nailBedSize}`}
                      </Typography>
                      {p.selectedLength && (
                        <Typography sx={{ color: '#777', fontSize: '0.82rem', mt: 0.2 }}>
                          Length: {p.selectedLength}
                        </Typography>
                      )}
                      {p.setIncludes?.length > 0 && (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                          {p.setIncludes.map((tag) => (
                            <Chip key={tag} label={tag} size="small" sx={{ fontSize: '0.68rem', height: 20, backgroundColor: '#FCE4EC', color: '#C2185B', fontWeight: 600 }} />
                          ))}
                        </Box>
                      )}
                      {p.inspirationTags?.length > 0 && (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                          {p.inspirationTags.map((tag) => (
                            <Chip key={tag} label={tag} size="small" sx={{ fontSize: '0.68rem', height: 20, backgroundColor: '#EDE7F6', color: '#5E35B1', fontWeight: 600 }} />
                          ))}
                        </Box>
                      )}
                      {p.nailNotes && (
                        <Typography sx={{ color: '#888', fontSize: '0.78rem', mt: 0.4, fontStyle: 'italic' }}>
                          &ldquo;{p.nailNotes}&rdquo;
                        </Typography>
                      )}
                      {p.specialRequest && (
                        <Chip
                          label="Made to Order — 4–7 days"
                          size="small"
                          sx={{ mt: 0.5, fontSize: '0.68rem', height: 20, backgroundColor: '#FFF8E1', color: '#B8860B', fontWeight: 700, border: '1px solid #FFD54F' }}
                        />
                      )}
                      {p.orderingForOthers && p.otherPeople?.length > 0 && (
                        <Typography sx={{ color: '#999', fontSize: '0.78rem', mt: 0.3 }}>
                          +{p.otherPeople.length} other person(s)
                        </Typography>
                      )}
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 2 }}>
                      <Box>
                        {p.originalPrice && (
                          <Typography
                            sx={{
                              fontFamily: '"Georgia", serif',
                              fontSize: '0.75rem',
                              color: '#999',
                              textDecoration: 'line-through',
                              whiteSpace: 'nowrap',
                              textAlign: 'right',
                            }}
                          >
                            {formatNaira(p.originalPrice)}
                          </Typography>
                        )}
                        <Typography
                          sx={{
                            fontFamily: '"Georgia", serif',
                            fontWeight: 700,
                            color: p.originalPrice ? '#2e7d32' : '#E91E8C',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {formatNaira(p.price)}
                        </Typography>
                      </Box>
                      <IconButton
                        size="small"
                        onClick={() => removePressOn(p.id)}
                        sx={{ color: '#E91E8C' }}
                      >
                        <DeleteOutlineIcon sx={{ fontSize: 20 }} />
                      </IconButton>
                    </Box>
                  </Box>
                ))}
                <Divider sx={{ borderColor: '#F0C0D0', mt: 2 }} />
              </Box>
            )}

            {/* Appointment Deposit Info */}
            {services.length > 0 && (
              <Box sx={{ mb: 3, p: 2.5, borderRadius: 3, border: '1.5px solid #E91E8C', backgroundColor: '#FFF0F8' }}>
                <Typography sx={{ fontFamily: '"Georgia", serif', fontWeight: 700, color: 'var(--text-purple)', fontSize: '0.95rem', mb: 1.5 }}>
                  Appointment Deposit Required
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography sx={{ fontSize: '0.88rem', color: 'var(--text-muted)' }}>Appointment subtotal</Typography>
                  <Typography sx={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-muted)' }}>{formatNaira(serviceSubtotal)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.8 }}>
                  <Typography sx={{ fontSize: '0.88rem', fontWeight: 700, color: '#E91E8C' }}>50% deposit to secure slot</Typography>
                  <Typography sx={{ fontSize: '0.88rem', fontWeight: 700, color: '#E91E8C' }}>{formatNaira(depositAmount)}</Typography>
                </Box>
                <Typography sx={{ fontSize: '0.78rem', color: '#999' }}>
                  Remaining {formatNaira(serviceSubtotal - depositAmount)} is due on the day of your appointment
                </Typography>
              </Box>
            )}

            {/* Discounts & Rewards */}
            <Box sx={{ mt: 2, mb: 3, p: 3, borderRadius: 3, backgroundColor: '#fff', border: '1px solid #F0C0D0' }}>
              <Typography sx={{ fontFamily: '"Georgia", serif', fontWeight: 700, color: 'var(--text-purple)', mb: 2, fontSize: '0.95rem' }}>
                Discounts &amp; Rewards
              </Typography>

              {/* Referral code */}
              <Box onClick={() => setShowRefField((v) => !v)} sx={{ display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer', mb: showRefField ? 1.5 : 0 }}>
                <LocalOfferIcon sx={{ fontSize: 16, color: referralValid ? '#2e7d32' : '#E91E8C' }} />
                <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: referralValid ? '#2e7d32' : '#E91E8C', fontFamily: '"Georgia", serif' }}>
                  {referralValid ? '\u20a6500 off applied!' : 'Have a referral code?'}
                </Typography>
              </Box>
              <Collapse in={showRefField}>
                <Box sx={{ display: 'flex', gap: 1, mb: 0.5 }}>
                  <TextField size="small" placeholder="e.g. CHIZZYS-ABC123" value={refCodeInput}
                    onChange={(e) => { setRefCodeInput(e.target.value.toUpperCase()); setReferralValid(false); setReferralMsg(''); }}
                    sx={{ flex: 1, '& .MuiOutlinedInput-root': { borderRadius: 2, '& fieldset': { borderColor: '#F0C0D0' }, '&.Mui-focused fieldset': { borderColor: '#E91E8C' } } }}
                    inputProps={{ style: { fontFamily: 'monospace', letterSpacing: 1 } }}
                  />
                  <Button onClick={handleApplyReferral} disabled={!refCodeInput.trim() || referralChecking}
                    sx={{ backgroundColor: '#E91E8C', color: '#fff', borderRadius: 2, px: 2.5, fontFamily: '"Georgia", serif', fontWeight: 600, fontSize: '0.82rem', whiteSpace: 'nowrap', '&:hover': { backgroundColor: '#C2185B' }, '&.Mui-disabled': { backgroundColor: '#F0C0D0', color: '#fff' } }}>
                    {referralChecking ? <CircularProgress size={16} sx={{ color: '#fff' }} /> : 'Apply'}
                  </Button>
                </Box>
                {referralMsg && <Typography sx={{ fontSize: '0.78rem', color: referralValid ? '#2e7d32' : '#d32f2f', mt: 0.3 }}>{referralMsg}</Typography>}
              </Collapse>

              {/* Loyalty points */}
              {user && maxLoyaltyUnits > 0 && (
                <Box sx={{ mt: 2 }}>
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
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    <StarIcon sx={{ fontSize: 16, color: '#B8860B' }} />
                    <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#B8860B', fontFamily: '"Georgia", serif' }}>
                      Loyalty &mdash; {loyaltyBalance} pts ({formatNaira(maxLoyaltyUnits * REDEMPTION_VALUE)} redeemable)
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <IconButton size="small" onClick={() => setLoyaltyUnits((u) => Math.max(0, u - 1))} disabled={loyaltyUnits === 0} sx={{ border: '1.5px solid #F0C0D0', borderRadius: '50%', width: 28, height: 28 }}>
                      <RemoveIcon sx={{ fontSize: 14 }} />
                    </IconButton>
                    <Typography sx={{ fontFamily: '"Georgia", serif', fontWeight: 700, minWidth: 20, textAlign: 'center' }}>{loyaltyUnits}</Typography>
                    <IconButton size="small" onClick={() => setLoyaltyUnits((u) => Math.min(maxLoyaltyUnits, u + 1))} disabled={loyaltyUnits >= maxLoyaltyUnits} sx={{ border: '1.5px solid #F0C0D0', borderRadius: '50%', width: 28, height: 28 }}>
                      <AddIcon sx={{ fontSize: 14 }} />
                    </IconButton>
                    <Typography sx={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>units &times; &#8358;1,000 = <strong style={{ color: '#B8860B' }}>{formatNaira(loyaltyDiscount)} off</strong></Typography>
                  </Box>
                </Box>
              )}

              {/* Discount summary */}
              {(referralDiscount > 0 || loyaltyDiscount > 0) && (
                <Box sx={{ mt: 2, p: 1.5, borderRadius: 2, backgroundColor: '#F1F8E9', border: '1px solid #C5E1A5' }}>
                  {referralDiscount > 0 && <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.3 }}><Typography sx={{ fontSize: '0.82rem', color: '#2e7d32' }}>Referral discount</Typography><Typography sx={{ fontSize: '0.82rem', color: '#2e7d32', fontWeight: 700 }}>-{formatNaira(referralDiscount)}</Typography></Box>}
                  {loyaltyDiscount > 0 && <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.3 }}><Typography sx={{ fontSize: '0.82rem', color: '#B8860B' }}>Loyalty redemption</Typography><Typography sx={{ fontSize: '0.82rem', color: '#B8860B', fontWeight: 700 }}>-{formatNaira(loyaltyDiscount)}</Typography></Box>}
                </Box>
              )}
            </Box>

            {/* Gift Card Redeem Input */}
            <GiftCardRedeemInput
              appliedCard={appliedGiftCard}
              onApplied={setAppliedGiftCard}
              onRemoved={() => setAppliedGiftCard(null)}
            />
          </>
        )}

        {/* Recently Viewed */}
        {recentlyViewed.length > 0 && (
          <Box sx={{ mt: 4 }}>
            <Typography sx={{ fontFamily: '"Georgia", serif', fontWeight: 700, color: 'var(--text-purple)', mb: 1.5, fontSize: '1.1rem' }}>
              Recently Viewed
            </Typography>
            <Box sx={{ display: 'flex', gap: 1.5, overflowX: 'auto', pb: 1, '&::-webkit-scrollbar': { height: 4 }, '&::-webkit-scrollbar-thumb': { backgroundColor: '#F0C0D0', borderRadius: 2 } }}>
              {recentlyViewed.map((item) => (
                <Box
                  key={`${item.categoryId}-${item.id}`}
                  onClick={() => window.location.href = `/products/${item.categoryId}/${item.id}`}
                  sx={{ minWidth: 130, maxWidth: 130, borderRadius: 2, border: '1px solid #F0C0D0', overflow: 'hidden', cursor: 'pointer', flexShrink: 0, backgroundColor: '#fff', transition: 'all 0.2s', '&:hover': { borderColor: '#E91E8C', boxShadow: '0 2px 8px rgba(233,30,140,0.15)' } }}
                >
                  {item.image ? (
                    <Box component="img" src={item.image} alt={item.name} sx={{ width: '100%', height: 95, objectFit: 'cover', display: 'block' }} />
                  ) : (
                    <Box sx={{ width: '100%', height: 95, backgroundColor: '#FFF0F8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Typography sx={{ fontSize: '1.8rem' }}>💅</Typography>
                    </Box>
                  )}
                  <Box sx={{ p: 1 }}>
                    <Typography sx={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--text-main)', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                      {item.name}
                    </Typography>
                    <Typography sx={{ fontSize: '0.75rem', color: '#E91E8C', fontWeight: 700, mt: 0.3 }}>
                      ₦{item.price?.toLocaleString()}
                    </Typography>
                  </Box>
                </Box>
              ))}
            </Box>
          </Box>
        )}
      </Container>

      {/* Sticky Checkout Bar */}
      {hasItems && (
        <Box
          sx={{
            position: 'fixed',
            bottom: { xs: '64px', md: 0 },
            left: 0,
            right: 0,
            zIndex: 1100,
            backgroundColor: 'rgba(255, 240, 245, 0.95)',
            backdropFilter: 'blur(8px)',
            borderTop: '1px solid #F0C0D0',
            py: 2,
            px: 3,
          }}
        >
          <Box
            sx={{
              maxWidth: 'md',
              mx: 'auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 1,
            }}
          >
            <Box>
              {(giftCardDiscount > 0 || referralDiscount > 0 || loyaltyDiscount > 0) ? (
                <>
                  <Typography sx={{ fontFamily: '"Georgia", serif', fontSize: '0.82rem', color: '#777', textDecoration: 'line-through' }}>
                    {formatNaira(total)}
                  </Typography>
                  {giftCardDiscount > 0 && <Typography sx={{ fontFamily: '"Georgia", serif', fontSize: '0.75rem', color: '#2e7d32' }}>Gift card: -{formatNaira(giftCardDiscount)}</Typography>}
                  {referralDiscount > 0 && <Typography sx={{ fontFamily: '"Georgia", serif', fontSize: '0.75rem', color: '#2e7d32' }}>Referral: -{formatNaira(referralDiscount)}</Typography>}
                  {loyaltyDiscount > 0 && <Typography sx={{ fontFamily: '"Georgia", serif', fontSize: '0.75rem', color: '#B8860B' }}>Loyalty: -{formatNaira(loyaltyDiscount)}</Typography>}
                  <Typography sx={{ fontFamily: '"Georgia", serif', fontWeight: 700, fontSize: '1.15rem', color: 'var(--text-main)' }}>
                    Total: <span style={{ color: '#E91E8C' }}>{formatNaira(finalTotal)}</span>
                  </Typography>
                </>
              ) : (
                <Typography sx={{ fontFamily: '"Georgia", serif', fontWeight: 700, fontSize: '1.15rem', color: 'var(--text-main)' }}>
                  Total: <span style={{ color: '#E91E8C' }}>{formatNaira(total)}</span>
                </Typography>
              )}
            </Box>
            <Button
              onClick={handleCheckout}
              disabled={checkoutLoading}
              sx={{
                backgroundColor: '#E91E8C',
                color: '#fff',
                borderRadius: '30px',
                px: 4,
                py: 1.2,
                fontFamily: '"Georgia", serif',
                fontWeight: 600,
                fontSize: '0.95rem',
                '&:hover': {
                  backgroundColor: '#C2185B',
                },
              }}
            >
              {checkoutLoading ? <CircularProgress size={22} sx={{ color: '#fff' }} /> : 'Checkout via WhatsApp'}
            </Button>
          </Box>
        </Box>
      )}

      {/* Payment Modal */}
      <Dialog
        open={paymentModalOpen}
        onClose={() => setPaymentModalOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}
      >
        <DialogTitle sx={{ fontFamily: '"Georgia", serif', fontWeight: 700, color: 'var(--text-purple)', pb: 1 }}>
          Secure Your Appointment{services.length > 1 ? 's' : ''}
        </DialogTitle>
        <DialogContent>
          {/* Appointment list */}
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
          <Typography sx={{ fontSize: '0.78rem', color: '#999', mb: 2 }}>
            Balance {formatNaira(serviceSubtotal - depositAmount)} due on appointment day
          </Typography>

          <Typography sx={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
            Pay the 50% deposit via Paystack to confirm your booking.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5, gap: 1, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <Button
            onClick={payWithPaystackCart}
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

      {/* Sign In Prompt */}
      <SignInPrompt
        open={signInPromptOpen}
        onClose={() => setSignInPromptOpen(false)}
      />
    </Box>
  );
}
