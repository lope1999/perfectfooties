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
} from '@mui/material';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { saveOrder } from '../lib/orderService';
import { decrementStockBatch } from '../lib/stockService';
import { redeemGiftCard } from '../lib/giftCardService';
import { saveShippingDetails, fetchShippingDetails } from '../lib/shippingService';
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
  const finalTotal = subtotal - giftCardDiscount;

  const hasDeliverables = products.length > 0 || pressOns.length > 0;

  const [form, setForm] = useState({ name: '', phone: '', address: '', state: '', lga: '' });
  const [submitting, setSubmitting] = useState(false);
  const [signInPromptOpen, setSignInPromptOpen] = useState(false);

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

  const handleSubmit = async () => {
    if (!user) { setSignInPromptOpen(true); return; }
    if (!isFormValid) return;
    setSubmitting(true);

    const shipping = {
      name: form.name.trim(),
      phone: form.phone.trim(),
      address: form.address.trim(),
      state: form.state,
      lga: form.lga.trim(),
    };

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
      totalLine += `\nAmount Due: ${formatNaira(finalTotal)}`;
    }

    const message = `Hi! I\u2019d like to place an order.\n\n${lines.join('\n')}\n${totalLine}\n\nPlease confirm availability and payment details. Thank you!`;
    window.open(`https://api.whatsapp.com/send?phone=${WHATSAPP_NUMBER}&text=${encodeURIComponent(message)}`, '_blank');

    // Background async operations (save order, decrement stock, redeem gift card)
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
        ...pressOns.map((p) => ({ kind: 'pressOn', name: p.name, price: p.price, quantity: p.quantity || 1 })),
      ];
      const orderData = {
        type: orderType,
        total: finalTotal,
        customerName: shipping.name,
        email: user.email || '',
        items: allItems,
        shipping,
      };
      if (appliedGiftCard) {
        orderData.giftCardCode = appliedGiftCard.code;
        orderData.giftCardDiscount = giftCardDiscount;
      }
      const docRef = await saveOrder(user.uid, orderData);
      orderId = docRef?.id || null;
    } catch {
      // continue even if order save fails
    }

    // Redeem gift card if applied
    if (appliedGiftCard && giftCardDiscount > 0) {
      try {
        await redeemGiftCard(appliedGiftCard.code, giftCardDiscount, orderId);
      } catch (err) {
        console.error('Gift card redemption failed:', err);
      }
    }

    setSubmitting(false);
    clearCart();
    navigate('/');
  };

  if (!hasDeliverables) return null;

  return (
    <Box sx={{ pt: { xs: 10, md: 12 }, pb: 10, minHeight: '100vh', backgroundColor: '#FFF0F5' }}>
      <Container maxWidth="lg">
        {/* Header */}
        <Typography
          variant="h3"
          sx={{
            fontFamily: '"Georgia", serif',
            fontWeight: 700,
            color: '#000',
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
              <LocalShippingOutlinedIcon sx={{ color: '#4A0E4E', fontSize: 22, flexShrink: 0 }} />
              <Typography sx={{ color: '#4A0E4E', fontWeight: 600, fontSize: '0.9rem', lineHeight: 1.5 }}>
                We currently deliver within Nigeria only. Please provide a valid Nigerian delivery address.
              </Typography>
            </Box>

            <Typography
              sx={{
                fontFamily: '"Georgia", serif',
                fontWeight: 700,
                color: '#4A0E4E',
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
                  color: '#4A0E4E',
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
                      <Typography sx={{ fontSize: '0.88rem', color: '#444', flex: 1, mr: 1 }}>{s.name}</Typography>
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
                      <Typography sx={{ fontSize: '0.88rem', color: '#444', flex: 1, mr: 1 }}>{p.name} ×{p.quantity}</Typography>
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
                      <Typography sx={{ fontSize: '0.88rem', color: '#444', flex: 1, mr: 1 }}>
                        {p.name}{p.quantity > 1 ? ` ×${p.quantity}` : ''}
                      </Typography>
                      <Typography sx={{ fontSize: '0.88rem', fontWeight: 600, color: '#E91E8C', whiteSpace: 'nowrap' }}>{formatNaira(p.price)}</Typography>
                    </Box>
                  ))}
                </Box>
              )}

              <Divider sx={{ borderColor: '#F0C0D0', my: 2 }} />

              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography sx={{ color: '#666', fontSize: '0.9rem' }}>Subtotal</Typography>
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
              : 'Place Order via WhatsApp'}
          </Button>
        </Box>
      </Container>

      <SignInPrompt open={signInPromptOpen} onClose={() => setSignInPromptOpen(false)} />
    </Box>
  );
}
