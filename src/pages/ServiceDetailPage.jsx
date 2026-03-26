import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Container,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  CircularProgress,
  IconButton,
  Collapse,
  Switch,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EventNoteIcon from '@mui/icons-material/EventNote';
import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import StarIcon from '@mui/icons-material/Star';
import { nailLengths, removalNote } from '../data/services';
import useServiceCategories from '../hooks/useServiceCategories';
import useServiceDiscounts from '../hooks/useServiceDiscounts';
import { hasServiceDiscount, getServiceEffectivePrice, getServiceDiscountLabel } from '../lib/discountUtils';
import NailShapeSelector from '../components/NailShapeSelector';
import NailLengthSelector from '../components/NailLengthSelector';
import CalendarWidget from '../components/CalendarWidget';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { saveOrder } from '../lib/orderService';
import { fetchBookedSlots, saveBookedSlot, addToWaitlist } from '../lib/bookedSlotsService';
import { verifyPaystackDeposit, confirmOrderDirectly } from '../lib/paymentService';
import {
  validateReferralCode,
  applyReferral,
  REFERRAL_DISCOUNT,
  getLoyaltyData,
  redeemLoyaltyPoints,
  getPendingLoyaltyReward,
  clearPendingLoyaltyReward,
  REDEMPTION_UNIT, REDEMPTION_VALUE,
} from '../lib/loyaltyService';
import SignInPrompt from '../components/SignInPrompt';

const LENGTH_SURCHARGE = {
  'XS (Extra Short)': 0,
  'S (Short)': 500,
  'M (Medium)': 1000,
  'L (Long)': 1500,
  'XL (Extra Long)': 2000,
};

const ff = '"Georgia", serif';

function formatNaira(amount) {
  return `₦${Number(amount).toLocaleString()}`;
}

function formatDate(dateString) {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}

function getMinDate() {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  return tomorrow.toISOString().split('T')[0];
}

export default function ServiceDetailPage() {
  const { serviceId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addService: addServiceToCart } = useCart();
  const { discounts } = useServiceDiscounts();
  const { showToast } = useNotifications();

  const { categories, loading: categoriesLoading } = useServiceCategories();

  // Find service from all categories
  let service = null;
  let category = null;
  for (const cat of categories) {
    const found = (cat.services || []).find((s) => s.id === serviceId);
    if (found) { service = found; category = cat; break; }
  }

  // Booking form
  const [customerName, setCustomerName] = useState('');
  const [nailShape, setNailShape] = useState('');
  const [nailLength, setNailLength] = useState('');
  const [hasExtensions, setHasExtensions] = useState(false);
  const [extensionType, setExtensionType] = useState('');
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('');
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [bookedSlots, setBookedSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [signInPromptOpen, setSignInPromptOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paidReference, setPaidReference] = useState(null);

  // Referral code
  const [showRefField, setShowRefField] = useState(false);
  const [refCodeInput, setRefCodeInput] = useState('');
  const [referralValid, setReferralValid] = useState(false);
  const [referralChecking, setReferralChecking] = useState(false);
  const [referralMsg, setReferralMsg] = useState('');

  // Loyalty points
  const [loyaltyBalance, setLoyaltyBalance] = useState(0);
  const [loyaltyUnits, setLoyaltyUnits] = useState(0);
  const [pendingReward] = useState(() => getPendingLoyaltyReward());

  // Waitlist
  const [waitlistDialog, setWaitlistDialog] = useState(false);
  const [waitlistDate, setWaitlistDate] = useState('');
  const [waitlistName, setWaitlistName] = useState('');
  const [waitlistPhone, setWaitlistPhone] = useState('');
  const [waitlistSubmitting, setWaitlistSubmitting] = useState(false);
  const [waitlistSuccess, setWaitlistSuccess] = useState(false);

  useEffect(() => {
    if (user?.displayName && !customerName) setCustomerName(user.displayName);
  }, [user]);

  // Load loyalty balance + auto-validate pending referral code from URL
  useEffect(() => {
    if (!user) return;
    getLoyaltyData(user.uid).then((data) => { const pts = data.loyaltyPoints || 0; setLoyaltyBalance(pts); const pr = getPendingLoyaltyReward(); if (pr && pr.units > 0) setLoyaltyUnits(Math.min(pr.units, Math.floor(pts / REDEMPTION_UNIT))); }).catch(() => {});
    const pending = sessionStorage.getItem('pendingReferralCode');
    if (pending) {
      setRefCodeInput(pending);
      setShowRefField(true);
      validateReferralCode(pending).then((referrerUid) => {
        const valid = !!referrerUid && referrerUid !== user.uid;
        setReferralValid(valid);
        setReferralMsg(valid ? `₦1,000 off applied!` : 'Code is invalid or not applicable');
      }).catch(() => {});
    }
  }, [user]);

  // Load Paystack inline script
  useEffect(() => {
    if (document.getElementById('paystack-js')) return;
    const s = document.createElement('script');
    s.id = 'paystack-js';
    s.src = 'https://js.paystack.co/v1/inline.js';
    s.async = true;
    document.body.appendChild(s);
  }, []);

  useEffect(() => {
    if (!appointmentDate) { setBookedSlots([]); return; }
    setSlotsLoading(true);
    fetchBookedSlots(formatDate(appointmentDate))
      .then((slots) => {
        setBookedSlots(slots);
        setAppointmentTime((t) => (slots.includes(t) ? '' : t));
      })
      .catch(() => setBookedSlots([]))
      .finally(() => setSlotsLoading(false));
  }, [appointmentDate]);

  useEffect(() => {
    if (!paidReference || !service) return;
    const ep = getServiceEffectivePrice(service, discounts);
    const ls = nailLength ? (LENGTH_SURCHARGE[nailLength] ?? 0) : 0;
    const pwl = ep + ls;
    const rd = referralValid ? Math.min(REFERRAL_DISCOUNT, pwl) : 0;
    const ld = Math.min(loyaltyUnits * REDEMPTION_VALUE, Math.max(0, pwl - rd));
    const fp = Math.max(0, pwl - rd - ld);
    const dep = Math.round(fp * 0.5);
    const fullDate = `${formatDate(appointmentDate)} at ${appointmentTime}`;
    const depositInfo = `\n\n✅ Deposit Paid: ${formatNaira(dep)} (Paystack Ref: ${paidReference})`;
    const discountLines = [];
    if (ls > 0) discountLines.push(`- Length add-on (${nailLength}): +${formatNaira(ls)}`);
    if (rd > 0) discountLines.push(`- Referral Code (${refCodeInput.toUpperCase()}): -${formatNaira(rd)}`);
    if (ld > 0) discountLines.push(`- Loyalty Points (${loyaltyUnits * REDEMPTION_UNIT} pts): -${formatNaira(ld)}`);
    const discountStr = discountLines.length > 0 ? `\n\nDiscounts:\n${discountLines.join('\n')}\nFinal Price: ${formatNaira(fp)}` : '';
    const extensionLine = hasExtensions === true
      ? `\n- Existing Extensions: Yes (${extensionType || 'Type not specified'})`
      : hasExtensions === false ? '\n- Existing Extensions: No' : '';
    const msg = `Hi! I'd like to book an appointment.\n\nName: ${customerName}\nType: Salon Visit\nPreferred Date: ${fullDate}\nService: ${service.name}\nPrice: ${formatNaira(pwl)}${discountStr}${depositInfo}\n\nDetails:\n- Nail Shape: ${nailShape}\n- Nail Length: ${nailLength}${extensionLine}\n\nPlease confirm availability. Thank you!`;
    const waUrl = `https://api.whatsapp.com/send?phone=2349053714197&text=${encodeURIComponent(msg)}`;
    navigate('/thank-you', {
      state: {
        type: 'service',
        customerName,
        serviceName: service.name,
        appointmentDate: fullDate,
        total: ep,
        finalTotal: fp,
        referralDiscount: rd,
        loyaltyDiscount: ld,
        depositAmount: dep,
        paidDeposit: true,
        items: [{
          kind: 'service',
          serviceName: service.name,
          price: fp,
          date: fullDate,
          nailShape,
          nailLength,
          hasExtensions,
          extensionType: hasExtensions ? extensionType : '',
        }],
      },
    });
    window.open(waUrl, '_blank');
  }, [paidReference]);

  if (categoriesLoading) {
    return (
      <Box sx={{ pt: 14, display: 'flex', justifyContent: 'center', py: 8 }}>
        <CircularProgress sx={{ color: '#E91E8C' }} />
      </Box>
    );
  }

  if (!service || !category) {
    return (
      <Box sx={{ pt: 12, textAlign: 'center', py: 8 }}>
        <Typography sx={{ fontFamily: ff, fontSize: '1.2rem', color: 'var(--text-muted)' }}>Service not found.</Typography>
        <Button onClick={() => navigate('/services')} sx={{ mt: 2, color: '#E91E8C' }}>← Back to Services</Button>
      </Box>
    );
  }

  const effectivePrice = getServiceEffectivePrice(service, discounts);
  const discounted = hasServiceDiscount(service.id, discounts);
  const lengthSurcharge = nailLength ? (LENGTH_SURCHARGE[nailLength] ?? 0) : 0;
  const priceWithLength = effectivePrice + lengthSurcharge;
  const maxLoyaltyUnits = Math.floor(loyaltyBalance / REDEMPTION_UNIT);
  const referralDiscount = referralValid ? Math.min(REFERRAL_DISCOUNT, priceWithLength) : 0;
  const loyaltyDiscount = Math.min(loyaltyUnits * REDEMPTION_VALUE, Math.max(0, priceWithLength - referralDiscount));
  const finalPrice = Math.max(0, priceWithLength - referralDiscount - loyaltyDiscount);
  const depositAmount = Math.round(finalPrice * 0.5);

  const isFormValid = customerName.trim() && appointmentDate && appointmentTime && nailShape && nailLength;

  const handleApplyReferral = async () => {
    if (!refCodeInput.trim()) return;
    if (!user) { setSignInPromptOpen(true); return; }
    setReferralChecking(true);
    setReferralMsg('');
    try {
      const referrerUid = await validateReferralCode(refCodeInput.trim());
      const valid = !!referrerUid && referrerUid !== user.uid;
      setReferralValid(valid);
      setReferralMsg(valid ? '₦1,000 off applied!' : 'Code not found or already used');
    } catch {
      setReferralValid(false);
      setReferralMsg('Could not validate code — try again');
    } finally {
      setReferralChecking(false);
    }
  };

  const handleCompleteOrder = (paymentReference = '') => {
    if (!paymentReference) { setPaymentModalOpen(false); return; }
    setPaymentModalOpen(false);
    const fullDate = `${formatDate(appointmentDate)} at ${appointmentTime}`;
    if (user) {
      saveOrder(user.uid, {
        type: 'service',
        total: finalPrice,
        customerName: customerName.trim(),
        email: user.email || '',
        appointmentDate: fullDate,
        paymentReference,
        ...(referralDiscount > 0 && { referralCode: refCodeInput.toUpperCase(), referralDiscount }),
        ...(loyaltyDiscount > 0 && { loyaltyDiscount, loyaltyPointsUsed: loyaltyUnits * REDEMPTION_UNIT }),
        items: [{
          kind: 'service',
          serviceName: service.name,
          price: finalPrice,
          date: fullDate,
          nailShape,
          nailLength,
          hasExtensions,
          extensionType: hasExtensions ? extensionType : '',
        }],
      }).then(async (orderRef) => {
        saveBookedSlot({ date: formatDate(appointmentDate), time: appointmentTime, orderId: orderRef.id, uid: user.uid }).catch(() => {});
        if (referralValid && refCodeInput) {
          applyReferral(refCodeInput.trim(), user.uid).catch(() => {});
          sessionStorage.removeItem('pendingReferralCode');
        }
        if (loyaltyUnits > 0) {
          redeemLoyaltyPoints(user.uid, loyaltyUnits * REDEMPTION_UNIT).catch(() => {});
          clearPendingLoyaltyReward();
        }
        // Primary: confirm directly in Firestore (triggers email via onAppointmentConfirmed)
        await confirmOrderDirectly(user.uid, orderRef.id);
        // Background: verify payment with Paystack API (non-blocking)
        verifyPaystackDeposit({ reference: paymentReference, orderId: orderRef.id, uid: user.uid }).catch(() => {});
      }).catch((err) => console.error('[Booking] Order confirmation error:', err))
      .finally(() => setPaidReference(paymentReference));
    } else {
      setPaidReference(paymentReference);
    }
  };

  const payWithPaystack = () => {
    const pk = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_PAYSTACK_PUBLIC_KEY) || '';
    if (!pk || !window.PaystackPop) { alert('Payment is required to confirm your booking. Please refresh the page and try again.'); return; }
    const handler = window.PaystackPop.setup({
      key: pk,
      email: user?.email || 'guest@chizzys.com',
      amount: depositAmount * 100,
      currency: 'NGN',
      ref: `CHIZZYS-${Date.now()}`,
      metadata: { serviceName: service.name, appointmentDate, appointmentTime },
      callback: (response) => handleCompleteOrder(response.reference),
      onClose: () => {},
    });
    handler.openIframe();
  };

  const handleBookViaWhatsApp = () => {
    if (!user) { setSignInPromptOpen(true); return; }
    setPaymentModalOpen(true);
  };

  const handleAddToCart = () => {
    if (!user) { setSignInPromptOpen(true); return; }
    const fullDate = `${formatDate(appointmentDate)} at ${appointmentTime}`;
    showToast(`${service.name} added to cart`, 'success');
    addServiceToCart({
      serviceId: service.id,
      name: service.name,
      price: finalPrice,
      originalPrice: discounted ? service.price : undefined,
      discountLabel: discounted ? getServiceDiscountLabel(service.id, discounts) : undefined,
      date: fullDate,
      nailShape,
      nailLength,
      customerName: customerName.trim(),
      hasExtensions,
      extensionType: hasExtensions ? extensionType : '',
    });
    navigate('/services');
  };

  const handleJoinWaitlist = async () => {
    setWaitlistSubmitting(true);
    try {
      await addToWaitlist({ date: waitlistDate, name: waitlistName.trim(), phone: waitlistPhone.trim(), email: user?.email || '', uid: user?.uid || '' });
      setWaitlistSuccess(true);
    } catch { setWaitlistSuccess(true); }
    finally { setWaitlistSubmitting(false); }
  };

  const textFieldSx = {
    '& .MuiOutlinedInput-root': {
      borderRadius: 2,
      '& fieldset': { borderColor: '#F0C0D0' },
      '&:hover fieldset': { borderColor: '#E91E8C' },
      '&.Mui-focused fieldset': { borderColor: '#E91E8C' },
    },
    '& .MuiInputLabel-root.Mui-focused': { color: '#E91E8C' },
  };

  return (
    <Box sx={{ pt: { xs: 7, md: 8 }, pb: { xs: 12, md: 6 }, minHeight: '100vh', backgroundColor: '#FFF8FC' }}>
      {/* Back button */}
      <Container maxWidth="lg" sx={{ pt: 3 }}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/services')} sx={{ fontFamily: ff, color: '#E91E8C', textTransform: 'none', mb: 2, '&:hover': { backgroundColor: '#FFF0F5' } }}>
          Back to Services
        </Button>
      </Container>

      {/* Hero image */}
      <Box component="img" src={service.image} alt={service.name} sx={{ width: '100%', height: { xs: 240, md: 380 }, objectFit: 'cover' }} />

      <Container maxWidth="lg" sx={{ py: 5 }}>
        <Grid container spacing={5}>
          {/* Left: Service info */}
          <Grid item xs={12} md={5}>
            <Box sx={{ position: { md: 'sticky' }, top: { md: 100 } }}>
              {discounted && (
                <Chip label={getServiceDiscountLabel(service.id, discounts)} sx={{ mb: 2, backgroundColor: '#2e7d32', color: '#fff', fontWeight: 700 }} />
              )}
              <Typography variant="h4" sx={{ fontFamily: ff, fontWeight: 700, color: 'var(--text-main)', mb: 1, fontSize: { xs: '1.5rem', md: '2rem' } }}>
                {service.name}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                {discounted ? (
                  <>
                    <Typography sx={{ fontFamily: ff, fontWeight: 700, color: '#2e7d32', fontSize: '1.5rem' }}>{formatNaira(effectivePrice)}</Typography>
                    <Typography sx={{ fontFamily: ff, color: '#999', fontSize: '1rem', textDecoration: 'line-through' }}>{formatNaira(service.price)}</Typography>
                  </>
                ) : (
                  <Typography sx={{ fontFamily: ff, fontWeight: 700, color: '#E91E8C', fontSize: '1.5rem' }}>{formatNaira(service.price)}</Typography>
                )}
              </Box>
              <Typography sx={{ color: 'var(--text-muted)', fontSize: '1rem', lineHeight: 1.75, mb: 3 }}>{service.description}</Typography>

              <Box sx={{ p: 2, borderRadius: 2, backgroundColor: '#FCE4EC', border: '1px solid #F0C0D0', mb: 2 }}>
                <Typography sx={{ fontSize: '0.85rem', color: 'var(--text-purple)', fontWeight: 600, lineHeight: 1.6 }}>
                  A 50% deposit is required to confirm your booking. The remaining balance is due on the day of your appointment.
                </Typography>
              </Box>
              <Box sx={{ p: 2, borderRadius: 2, backgroundColor: '#F3E5F5', border: '1px solid #CE93D8', mb: 2 }}>
                <Typography sx={{ fontSize: '0.82rem', color: 'var(--text-purple)', lineHeight: 1.6 }}>
                  💡 Prices are base estimates — final price may vary depending on design complexity and nail length.
                </Typography>
              </Box>
              <Box sx={{ p: 2, borderRadius: 2, backgroundColor: '#FFF8E1', border: '1px solid #FFD54F' }}>
                <Typography sx={{ fontSize: '0.82rem', color: '#5D4037', lineHeight: 1.6 }}>{removalNote}</Typography>
              </Box>
              <Typography sx={{ mt: 2, fontSize: '0.8rem', color: '#7a0064', display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <EventNoteIcon sx={{ fontSize: 14 }} /> Weekends only · 12 PM – 5 PM · Book at least 24 hrs in advance
              </Typography>
            </Box>
          </Grid>

          {/* Right: Booking form */}
          <Grid item xs={12} md={7}>
            <Box sx={{ backgroundColor: '#fff', borderRadius: 3, border: '1px solid #F0C0D0', p: { xs: 3, md: 4 } }}>
              <Typography variant="h5" sx={{ fontFamily: ff, fontWeight: 700, color: 'var(--text-purple)', mb: 3, fontSize: '1.25rem' }}>
                Book This Service
              </Typography>

              {/* Customer name */}
              <Typography sx={{ fontFamily: ff, fontWeight: 600, fontSize: '0.9rem', mb: 0.8 }}>Your Name</Typography>
              <TextField fullWidth size="small" placeholder="Enter your full name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} sx={{ mb: 2.5, ...textFieldSx }} />

              {/* Date & time */}
              <Typography sx={{ fontFamily: ff, fontWeight: 600, fontSize: '0.9rem', mb: 0.8 }}>Date &amp; Time</Typography>
              <Box
                onClick={() => setCalendarOpen(true)}
                sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 2, py: 1.3, borderRadius: 2, border: (appointmentDate && appointmentTime) ? '2px solid #E91E8C' : '1.5px solid #F0C0D0', backgroundColor: '#fff', cursor: 'pointer', mb: 0.6, transition: 'all 0.2s', '&:hover': { borderColor: '#E91E8C', backgroundColor: '#FFF8FC' } }}
              >
                <EventNoteIcon sx={{ color: '#E91E8C', fontSize: 18, flexShrink: 0 }} />
                <Typography sx={{ flex: 1, fontSize: '0.88rem', color: (appointmentDate && appointmentTime) ? '#222' : '#aaa', fontFamily: ff }}>
                  {(appointmentDate && appointmentTime) ? `${formatDate(appointmentDate)} · ${appointmentTime}` : 'Tap to select date & time'}
                </Typography>
                {(appointmentDate || appointmentTime) && (
                  <Typography onClick={(e) => { e.stopPropagation(); setAppointmentDate(''); setAppointmentTime(''); }} sx={{ fontSize: '0.7rem', color: '#E91E8C', cursor: 'pointer', whiteSpace: 'nowrap', '&:hover': { textDecoration: 'underline' } }}>
                    Clear
                  </Typography>
                )}
              </Box>
              <Typography sx={{ fontSize: '0.7rem', color: '#7a0064', mb: 2.5, display: 'flex', alignItems: 'center', gap: 0.4 }}>
                <EventNoteIcon sx={{ fontSize: 11 }} /> Weekends only · 12 PM – 5 PM
              </Typography>

              {/* Nail Shape */}
              <Typography sx={{ fontFamily: ff, fontWeight: 600, fontSize: '0.9rem', mb: 0.8 }}>Nail Shape</Typography>
              <Box sx={{ mb: 2.5 }}>
                <NailShapeSelector value={nailShape} onChange={setNailShape} />
              </Box>

              {/* Nail Length */}
              <Typography sx={{ fontFamily: ff, fontWeight: 600, fontSize: '0.9rem', mb: 0.8 }}>Nail Length</Typography>
              <Box sx={{ mb: 3 }}>
                <NailLengthSelector value={nailLength} onChange={setNailLength} surcharges={LENGTH_SURCHARGE} />
              </Box>

              {nailLength && lengthSurcharge > 0 && (
                <Typography sx={{ fontSize: '0.78rem', color: 'var(--text-purple)', fontWeight: 600, mt: -2, mb: 3 }}>
                  + {formatNaira(lengthSurcharge)} length surcharge · Subtotal: {formatNaira(priceWithLength)}
                </Typography>
              )}

              {/* ── Existing Extensions ── */}
              <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography sx={{ fontFamily: ff, fontWeight: 600, fontSize: '0.9rem' }}>
                      Existing extensions?
                    </Typography>
                    <Typography sx={{ fontSize: '0.73rem', color: '#aaa' }}>
                      Toggle on if you&apos;re coming in with extensions
                    </Typography>
                  </Box>
                  <Switch
                    checked={hasExtensions}
                    onChange={(e) => { setHasExtensions(e.target.checked); if (!e.target.checked) setExtensionType(''); }}
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': { color: '#E91E8C' },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#E91E8C' },
                    }}
                  />
                </Box>

                <Collapse in={hasExtensions}>
                  <Box sx={{ mt: 1.5 }}>
                    <FormControl fullWidth size="small">
                      <InputLabel sx={{ '&.Mui-focused': { color: '#E91E8C' } }}>Type of extension</InputLabel>
                      <Select
                        value={extensionType}
                        label="Type of extension"
                        onChange={(e) => setExtensionType(e.target.value)}
                        sx={{ borderRadius: 2, '& .MuiOutlinedInput-notchedOutline': { borderColor: '#F0C0D0' }, '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#E91E8C' }, '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#E91E8C' } }}
                      >
                        {['Acrylic', 'Hard Gel', 'Gel X', 'Overlay'].map((ext) => (
                          <MenuItem key={ext} value={ext}>{ext}</MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                    <Box sx={{ mt: 1, p: 1.2, borderRadius: 2, backgroundColor: '#FFF8E1', border: '1px solid #FFD54F' }}>
                      <Typography sx={{ fontSize: '0.75rem', color: '#5D4037', lineHeight: 1.55 }}>
                        ⚠️ Removal of existing extensions may attract an additional fee. Our technician will advise you on the day.
                      </Typography>
                    </Box>
                  </Box>
                </Collapse>
              </Box>

              {/* ── Discounts section ── */}
              <Box sx={{ borderTop: '1px solid #F0C0D0', pt: 2.5, mb: 2.5 }}>

                {/* Referral code */}
                <Box
                  onClick={() => setShowRefField((v) => !v)}
                  sx={{ display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer', mb: showRefField ? 1.5 : 0 }}
                >
                  <LocalOfferIcon sx={{ fontSize: 16, color: referralValid ? '#2e7d32' : '#E91E8C' }} />
                  <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: referralValid ? '#2e7d32' : '#E91E8C', fontFamily: ff }}>
                    {referralValid ? `Referral code applied — ${formatNaira(referralDiscount)} off!` : 'Have a referral code?'}
                  </Typography>
                </Box>
                <Collapse in={showRefField}>
                  <Box sx={{ display: 'flex', gap: 1, mb: 0.5 }}>
                    <TextField
                      size="small"
                      placeholder="e.g. CHIZZYS-ABC123"
                      value={refCodeInput}
                      onChange={(e) => { setRefCodeInput(e.target.value.toUpperCase()); setReferralValid(false); setReferralMsg(''); }}
                      sx={{ flex: 1, ...textFieldSx }}
                      inputProps={{ style: { fontFamily: 'monospace', letterSpacing: 1 } }}
                    />
                    <Button
                      onClick={handleApplyReferral}
                      disabled={!refCodeInput.trim() || referralChecking}
                      sx={{ backgroundColor: '#E91E8C', color: '#fff', borderRadius: 2, px: 2.5, fontFamily: ff, fontWeight: 600, fontSize: '0.82rem', whiteSpace: 'nowrap', '&:hover': { backgroundColor: '#C2185B' }, '&.Mui-disabled': { backgroundColor: '#F0C0D0', color: '#fff' } }}
                    >
                      {referralChecking ? <CircularProgress size={16} sx={{ color: '#fff' }} /> : 'Apply'}
                    </Button>
                  </Box>
                  {referralMsg && (
                    <Typography sx={{ fontSize: '0.78rem', color: referralValid ? '#2e7d32' : '#d32f2f', mt: 0.3 }}>{referralMsg}</Typography>
                  )}
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
                      <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#B8860B', fontFamily: ff }}>
                        Loyalty Points — {loyaltyBalance} pts available ({formatNaira(maxLoyaltyUnits * REDEMPTION_VALUE)} redeemable)
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <IconButton size="small" onClick={() => setLoyaltyUnits((u) => Math.max(0, u - 1))} disabled={loyaltyUnits === 0} sx={{ border: '1.5px solid #F0C0D0', borderRadius: '50%', width: 28, height: 28 }}>
                        <RemoveIcon sx={{ fontSize: 14 }} />
                      </IconButton>
                      <Typography sx={{ fontFamily: ff, fontWeight: 700, fontSize: '0.95rem', minWidth: 20, textAlign: 'center' }}>{loyaltyUnits}</Typography>
                      <IconButton size="small" onClick={() => setLoyaltyUnits((u) => Math.min(maxLoyaltyUnits, u + 1))} disabled={loyaltyUnits >= maxLoyaltyUnits} sx={{ border: '1.5px solid #F0C0D0', borderRadius: '50%', width: 28, height: 28 }}>
                        <AddIcon sx={{ fontSize: 14 }} />
                      </IconButton>
                      <Typography sx={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                        units × ₦1,000 = <strong style={{ color: '#B8860B' }}>{formatNaira(loyaltyDiscount)} off</strong>
                      </Typography>
                    </Box>
                  </Box>
                )}

                {/* Price summary */}
                {(referralDiscount > 0 || loyaltyDiscount > 0 || lengthSurcharge > 0) && (
                  <Box sx={{ mt: 2, p: 1.5, borderRadius: 2, backgroundColor: '#F1F8E9', border: '1px solid #C5E1A5' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography sx={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Base price</Typography>
                      <Typography sx={{ fontSize: '0.82rem', color: 'var(--text-muted)', textDecoration: 'line-through' }}>{formatNaira(effectivePrice)}</Typography>
                    </Box>
                    {lengthSurcharge > 0 && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography sx={{ fontSize: '0.82rem', color: 'var(--text-purple)' }}>Length add-on ({nailLength.split(' ')[0]})</Typography>
                        <Typography sx={{ fontSize: '0.82rem', color: 'var(--text-purple)', fontWeight: 700 }}>+{formatNaira(lengthSurcharge)}</Typography>
                      </Box>
                    )}
                    {referralDiscount > 0 && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography sx={{ fontSize: '0.82rem', color: '#2e7d32' }}>Referral discount</Typography>
                        <Typography sx={{ fontSize: '0.82rem', color: '#2e7d32', fontWeight: 700 }}>-{formatNaira(referralDiscount)}</Typography>
                      </Box>
                    )}
                    {loyaltyDiscount > 0 && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography sx={{ fontSize: '0.82rem', color: '#B8860B' }}>Loyalty redemption</Typography>
                        <Typography sx={{ fontSize: '0.82rem', color: '#B8860B', fontWeight: 700 }}>-{formatNaira(loyaltyDiscount)}</Typography>
                      </Box>
                    )}
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 0.5, borderTop: '1px solid #C5E1A5' }}>
                      <Typography sx={{ fontFamily: ff, fontWeight: 700, fontSize: '0.9rem' }}>You pay</Typography>
                      <Typography sx={{ fontFamily: ff, fontWeight: 700, fontSize: '0.9rem', color: '#E91E8C' }}>{formatNaira(finalPrice)}</Typography>
                    </Box>
                    <Typography sx={{ fontSize: '0.75rem', color: 'var(--text-muted)', mt: 0.3 }}>50% deposit: {formatNaira(depositAmount)}</Typography>
                  </Box>
                )}
              </Box>

              {/* Action buttons */}
              <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                <Button
                  startIcon={<WhatsAppIcon />}
                  onClick={handleBookViaWhatsApp}
                  disabled={!isFormValid || submitting}
                  fullWidth
                  sx={{ backgroundColor: '#25D366', color: '#fff', borderRadius: '30px', py: 1.3, fontFamily: ff, fontWeight: 600, fontSize: '0.95rem', '&:hover': { backgroundColor: '#1ebe5d' }, '&.Mui-disabled': { backgroundColor: '#b2dfdb', color: '#fff' } }}
                >
                  Book via WhatsApp
                </Button>
                <Button
                  startIcon={<ShoppingCartOutlinedIcon />}
                  onClick={handleAddToCart}
                  disabled={!isFormValid}
                  fullWidth
                  sx={{ border: '2px solid #4A0E4E', color: 'var(--text-purple)', borderRadius: '30px', py: 1.3, fontFamily: ff, fontWeight: 600, fontSize: '0.95rem', '&:hover': { backgroundColor: '#4A0E4E', color: '#fff' }, '&.Mui-disabled': { borderColor: '#ddd', color: '#bbb' } }}
                >
                  Add to Cart
                </Button>
              </Box>
              <Typography sx={{ fontSize: '0.75rem', color: '#999', mt: 1.5, textAlign: 'center' }}>
                Add to Cart → proceeds to checkout where referral &amp; loyalty discounts also apply
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Container>

      {/* Calendar Dialog */}
      <Dialog open={calendarOpen} onClose={() => setCalendarOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontFamily: ff, fontWeight: 700, pb: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          Select Date &amp; Time
          <Box onClick={() => setCalendarOpen(false)} sx={{ cursor: 'pointer', color: '#aaa', fontSize: '1.3rem', lineHeight: 1, '&:hover': { color: 'var(--text-muted)' } }}>✕</Box>
        </DialogTitle>
        <DialogContent sx={{ pt: '12px !important' }}>
          <CalendarWidget
            selectedDate={appointmentDate} onDateChange={setAppointmentDate}
            selectedTime={appointmentTime} onTimeChange={setAppointmentTime}
            minDate={getMinDate()} bookedSlots={bookedSlots} slotsLoading={slotsLoading}
            onJoinWaitlist={(date) => { setWaitlistDate(date); setWaitlistName(customerName); setWaitlistPhone(''); setWaitlistSuccess(false); setCalendarOpen(false); setWaitlistDialog(true); }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setCalendarOpen(false)} sx={{ color: '#777', fontFamily: ff, textTransform: 'none' }}>Cancel</Button>
          <Button onClick={() => setCalendarOpen(false)} disabled={!appointmentDate || !appointmentTime} sx={{ backgroundColor: '#E91E8C', color: '#fff', borderRadius: '20px', px: 3, fontFamily: ff, fontWeight: 600, textTransform: 'none', '&:hover': { backgroundColor: '#C2185B' }, '&.Mui-disabled': { backgroundColor: '#F0C0D0', color: '#fff' } }}>
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      {/* Payment Modal */}
      <Dialog open={paymentModalOpen} onClose={() => setPaymentModalOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontFamily: ff, fontWeight: 700, color: 'var(--text-purple)' }}>Confirm Booking</DialogTitle>
        <DialogContent>
          <Box sx={{ p: 1.5, backgroundColor: '#FFF0F5', borderRadius: 2, border: '1px solid #F0C0D0', mb: 2 }}>
            <Typography sx={{ fontFamily: ff, fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-purple)', mb: 0.5 }}>{service.name}</Typography>
            <Typography sx={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>{formatDate(appointmentDate)} at {appointmentTime}</Typography>
            <Typography sx={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Shape: {nailShape} · Length: {nailLength}</Typography>
            {hasExtensions !== null && (
              <Typography sx={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Existing extensions: {hasExtensions ? `Yes — ${extensionType || 'type not specified'}` : 'No'}
              </Typography>
            )}
            {(referralDiscount > 0 || loyaltyDiscount > 0) && (
              <Box sx={{ mt: 1, pt: 1, borderTop: '1px dashed #F0C0D0' }}>
                {referralDiscount > 0 && <Typography sx={{ fontSize: '0.78rem', color: '#2e7d32' }}>Referral: -{formatNaira(referralDiscount)}</Typography>}
                {loyaltyDiscount > 0 && <Typography sx={{ fontSize: '0.78rem', color: '#B8860B' }}>Loyalty: -{formatNaira(loyaltyDiscount)}</Typography>}
              </Box>
            )}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
              <Typography sx={{ fontFamily: ff, fontWeight: 700, color: '#E91E8C', fontSize: '1.05rem' }}>Deposit (50%):</Typography>
              <Typography sx={{ fontFamily: ff, fontWeight: 700, color: '#E91E8C', fontSize: '1.05rem' }}>{formatNaira(depositAmount)}</Typography>
            </Box>
          </Box>
          <Typography sx={{ fontSize: '0.82rem', color: '#777', lineHeight: 1.6 }}>
            Pay the 50% deposit now via Paystack to secure your slot.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, flexWrap: 'wrap', gap: 1 }}>
          <Button onClick={payWithPaystack} sx={{ backgroundColor: '#E91E8C', color: '#fff', borderRadius: '20px', px: 3, fontFamily: ff, fontWeight: 600, textTransform: 'none', '&:hover': { backgroundColor: '#C2185B' } }}>
            Pay {formatNaira(depositAmount)} Deposit
          </Button>
        </DialogActions>
      </Dialog>

      {/* Waitlist Dialog */}
      <Dialog open={waitlistDialog} onClose={() => setWaitlistDialog(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontFamily: ff, fontWeight: 700, color: 'var(--text-purple)' }}>Join Waitlist</DialogTitle>
        <DialogContent>
          {waitlistSuccess ? (
            <Typography sx={{ color: '#2e7d32', fontWeight: 600, py: 2, textAlign: 'center' }}>
              ✓ You're on the waitlist! We'll contact you if a slot opens up.
            </Typography>
          ) : (
            <Box>
              <Typography sx={{ fontSize: '0.85rem', color: 'var(--text-muted)', mb: 2 }}>All slots for this date are taken. Leave your details and we'll notify you if a spot opens.</Typography>
              <TextField fullWidth size="small" label="Your name" value={waitlistName} onChange={(e) => setWaitlistName(e.target.value)} sx={{ mb: 2, ...textFieldSx }} />
              <TextField fullWidth size="small" label="Phone / WhatsApp" value={waitlistPhone} onChange={(e) => setWaitlistPhone(e.target.value)} sx={{ mb: 1, ...textFieldSx }} />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setWaitlistDialog(false)} sx={{ color: '#777', fontFamily: ff, textTransform: 'none' }}>Close</Button>
          {!waitlistSuccess && (
            <Button onClick={handleJoinWaitlist} disabled={!waitlistName.trim() || !waitlistPhone.trim() || waitlistSubmitting} sx={{ backgroundColor: '#E91E8C', color: '#fff', borderRadius: '20px', px: 3, fontFamily: ff, fontWeight: 600, textTransform: 'none', '&:hover': { backgroundColor: '#C2185B' }, '&.Mui-disabled': { backgroundColor: '#F0C0D0', color: '#fff' } }}>
              {waitlistSubmitting ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : 'Join Waitlist'}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      <SignInPrompt open={signInPromptOpen} onClose={() => setSignInPromptOpen(false)} />
    </Box>
  );
}
