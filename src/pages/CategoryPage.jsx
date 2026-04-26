import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Container,
  Button,
  Chip,
  IconButton,
  CircularProgress,
  Alert,
  Dialog,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import PaymentIcon from '@mui/icons-material/Payment';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { fetchProducts, incrementProductOrderCount } from '../lib/productService';
import { saveOrder } from '../lib/orderService';
import { confirmOrderDirectly, verifyPaystackDeposit } from '../lib/paymentService';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import SignInPrompt from '../components/SignInPrompt';

const ff = '"Georgia", serif';
const WHATSAPP_NUMBER = '2348073637911';
const BUSINESS_EMAIL = "perfectfooties@gmail.com";

function formatNaira(amount) {
  return `₦${Number(amount).toLocaleString()}`;
}

const STATUS_CONFIG = {
  open:     { label: 'Available',   color: '#2e7d32', bg: '#e8f5e9' },
  upcoming: { label: 'Coming Soon', color: '#e65100', bg: '#fff3e0' },
  closed:   { label: 'Sold Out',    color: '#616161', bg: '#f5f5f5' },
};

// ── Post-Payment Contact Dialog ───────────────────────────
function PostPaymentDialog({ open, onClose, productName, customerName, orderId }) {
  const waMessage = encodeURIComponent(
    `Hi PerfectFooties!\n\nI just paid for my order and wanted to confirm the details.\n\nProduct: ${productName}\nOrder ID: ${orderId}\nName: ${customerName}\n\nPlease confirm my order. Thank you!`
  );
  const emailSubject = encodeURIComponent(`Order Confirmation — ${orderId}`);
  const emailBody = encodeURIComponent(
    `Hi PerfectFooties,\n\nI just paid for my order and wanted to confirm:\n\nProduct: ${productName}\nOrder ID: ${orderId}\nName: ${customerName}\n\nThank you!`
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogContent sx={{ textAlign: 'center', pt: 4, pb: 3 }}>
        <CheckCircleOutlineIcon sx={{ fontSize: 56, color: '#4CAF50', mb: 2 }} />
        <Typography sx={{ fontFamily: ff, fontWeight: 700, fontSize: '1.2rem', color: 'var(--text-main)', mb: 1 }}>
          Payment Successful!
        </Typography>
        <Typography sx={{ fontFamily: ff, fontSize: '0.88rem', color: 'var(--text-muted)', mb: 3 }}>
          Your order has been placed. Please reach out via WhatsApp or email so we can confirm your size, colour, and get started on your piece!
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <Button
            fullWidth
            startIcon={<WhatsAppIcon />}
            href={`https://wa.me/${WHATSAPP_NUMBER}?text=${waMessage}`}
            target="_blank"
            rel="noopener noreferrer"
            sx={{
              backgroundColor: '#25D366', color: '#fff', borderRadius: '30px', py: 1.2,
              fontFamily: ff, fontWeight: 700, fontSize: '0.95rem', textTransform: 'none',
              '&:hover': { backgroundColor: '#1da851' },
            }}
          >
            Confirm via WhatsApp
          </Button>
          <Button
            fullWidth
            startIcon={<EmailOutlinedIcon />}
            href={`mailto:${BUSINESS_EMAIL}?subject=${emailSubject}&body=${emailBody}`}
            sx={{
              backgroundColor: '#007a7a', color: '#fff', borderRadius: '30px', py: 1.2,
              fontFamily: ff, fontWeight: 700, fontSize: '0.95rem', textTransform: 'none',
              '&:hover': { backgroundColor: '#005a5a' },
            }}
          >
            Confirm via Email
          </Button>
          <Button
            onClick={onClose}
            sx={{ fontFamily: ff, color: 'var(--text-muted)', textTransform: 'none', fontSize: '0.85rem' }}
          >
            I'll do it later
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
  );
}

// ── Size Selector ─────────────────────────────────────────
function SizeSelector({ sizes, selected, onSelect }) {
  if (!sizes || sizes.length === 0) return null;
  return (
    <Box sx={{ mb: 2.5 }}>
      <Typography sx={{ fontFamily: ff, fontWeight: 700, fontSize: '0.95rem', mb: 1 }}>
        Size
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {sizes.map((size) => (
          <Chip
            key={size}
            label={size}
            onClick={() => onSelect(size)}
            sx={{
              fontFamily: ff,
              fontWeight: 600,
              fontSize: '0.85rem',
              cursor: 'pointer',
              border: `2px solid ${selected === size ? '#e3242b' : '#E8D5B0'}`,
              backgroundColor: selected === size ? '#e3242b' : '#fff',
              color: selected === size ? '#fff' : 'var(--text-main)',
              '&:hover': { borderColor: '#e3242b', backgroundColor: selected === size ? '#b81b21' : 'var(--bg-soft)' },
            }}
          />
        ))}
      </Box>
    </Box>
  );
}

// ── Colour Selector ───────────────────────────────────────
const COLOUR_MAP = {
  'Chocolate Brown': '#5C3317',
  'Tan': '#D2B48C',
  'Black': '#1A1A1A',
  'Cognac': '#9A3B1B',
  'Navy': '#001F5B',
  'Burgundy': '#800020',
  'Natural': '#F5DEB3',
  'White': '#FFFFFF',
  'Red': '#e3242b',
  'Grey': '#808080',
};

function ColourSelector({ colours, selected, onSelect }) {
  if (!colours || colours.length === 0) return null;
  return (
    <Box sx={{ mb: 2.5 }}>
      <Typography sx={{ fontFamily: ff, fontWeight: 700, fontSize: '0.95rem', mb: 1 }}>
        Colour{selected ? ` — ${selected}` : ''}
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.2 }}>
        {colours.map((colour) => {
          const hex = COLOUR_MAP[colour] || '#E8D5B0';
          const isSelected = selected === colour;
          return (
            <Box
              key={colour}
              onClick={() => onSelect(colour)}
              title={colour}
              sx={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                backgroundColor: hex,
                border: `3px solid ${isSelected ? '#e3242b' : '#E8D5B0'}`,
                boxShadow: isSelected ? '0 0 0 2px #e3242b' : 'none',
                cursor: 'pointer',
                transition: 'all 0.15s',
                outline: hex === '#FFFFFF' || hex === '#F5DEB3' ? '1px solid #ccc' : 'none',
                '&:hover': { border: '3px solid #e3242b' },
              }}
            />
          );
        })}
      </Box>
    </Box>
  );
}

// ── Main Page ─────────────────────────────────────────────
export default function CategoryPage() {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useNotifications();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);

  // Order form
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColour, setSelectedColour] = useState('');
  const [engraving, setEngraving] = useState('');
  const [errors, setErrors] = useState({});

  // UI state
  const [signInOpen, setSignInOpen] = useState(false);
  const [paying, setPaying] = useState(false);
  const [successDialog, setSuccessDialog] = useState(null);

  useEffect(() => {
    if (user?.displayName && !customerName) setCustomerName(user.displayName);
  }, [user]);

  useEffect(() => {
    fetchProducts()
      .then((all) => {
        const found = all.find((p) => p.id === categoryId);
        setProduct(found || null);
      })
      .catch(() => setProduct(null))
      .finally(() => setLoading(false));
  }, [categoryId]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress sx={{ color: '#e3242b' }} />
      </Box>
    );
  }

  if (!product) {
    return (
      <Box sx={{ pt: 14, textAlign: 'center' }}>
        <Typography sx={{ color: 'var(--text-muted)' }}>Product not found.</Typography>
        <Button onClick={() => navigate('/shop')} sx={{ mt: 2, color: '#e3242b' }}>
          Back to Shop
        </Button>
      </Box>
    );
  }

  const statusCfg = STATUS_CONFIG[product.status] || STATUS_CONFIG.closed;
  const images = Array.isArray(product.images) && product.images.length > 0 ? product.images : [];

  const isAtOrderCap = product.maxOrders != null && (product.orderCount || 0) >= product.maxOrders;
  const canOrder = product.status === 'open' && !isAtOrderCap;

  const discountApplied = canOrder && product.multiSetDiscount && quantity >= 2;
  const discountPct = product.multiSetDiscountPercent || 0;
  const pricePerItem = discountApplied
    ? Math.round(product.price * (1 - discountPct / 100))
    : product.price;
  const totalPrice = pricePerItem * quantity;

  const validate = () => {
    const e = {};
    if (!customerName.trim()) e.customerName = 'Please enter your name';
    if (!phone.trim()) e.phone = 'Please enter your phone number';
    if (product.requiresSize && !selectedSize) e.size = 'Please select a size';
    if (product.colours?.length > 0 && !selectedColour) e.colour = 'Please select a colour';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handlePay = async () => {
    if (!user) { setSignInOpen(true); return; }
    if (!validate()) return;

    const pk = import.meta.env?.VITE_PAYSTACK_PUBLIC_KEY || '';
    if (!pk || !window.PaystackPop) {
      alert('Payment system unavailable. Please refresh the page and try again.');
      return;
    }

    setPaying(true);

    let orderId = null;
    try {
      const orderData = {
        type: 'product',
        total: totalPrice,
        customerName: customerName.trim(),
        email: user.email || '',
        phone: phone.trim(),
        productId: product.id,
        productName: product.name,
        quantity,
        pricePerItem,
        selectedSize: selectedSize || null,
        selectedColour: selectedColour || null,
        engraving: engraving.trim() || null,
        items: [{
          kind: 'product',
          name: product.name,
          price: pricePerItem,
          quantity,
          productId: product.id,
          size: selectedSize || null,
          colour: selectedColour || null,
        }],
      };
      const docRef = await saveOrder(user.uid, orderData);
      orderId = docRef?.id || null;
    } catch (err) {
      console.error('Order save error:', err);
      setPaying(false);
      showToast('Could not initiate order. Please try again.', 'error');
      return;
    }

    window.PaystackPop.setup({
      key: pk,
      email: user.email || 'guest@perfectfooties.com',
      amount: totalPrice * 100,
      currency: 'NGN',
      ref: `PERFECTFOOTIES-${orderId || Date.now()}`,
      metadata: { productId: product.id, orderId },
      callback: async (response) => {
        try {
          if (orderId) {
            await confirmOrderDirectly(user.uid, orderId);
            verifyPaystackDeposit({ reference: response.reference, orderId, uid: user.uid }).catch(() => {});
          }
          incrementProductOrderCount(product.id).catch(() => {});
          setProduct((prev) => prev ? { ...prev, orderCount: (prev.orderCount || 0) + 1 } : prev);
          setSuccessDialog({ orderId });
        } catch {
          showToast('Payment received but order confirmation failed. Please contact us.', 'warning');
        } finally {
          setPaying(false);
        }
      },
      onClose: () => setPaying(false),
    }).openIframe();
  };

  return (
    <Box sx={{ pt: 12, pb: { xs: 12, md: 6 } }}>
      <Container maxWidth="lg">
        {/* Breadcrumb nav */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 3, flexWrap: 'wrap' }}>
          <Button
            startIcon={<ArrowBackIcon sx={{ fontSize: '0.8rem !important' }} />}
            onClick={() => navigate('/shop')}
            sx={{ fontFamily: ff, fontSize: '0.82rem', color: 'var(--text-muted)', textTransform: 'none', p: 0, minWidth: 0, '&:hover': { color: '#e3242b', backgroundColor: 'transparent' } }}
          >
            Shop
          </Button>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 5 }}>
          {/* Left — Images */}
          <Box sx={{ flex: '0 0 auto', width: { xs: '100%', md: '50%' } }}>
            {images.length > 0 ? (
              <>
                <Box
                  component="img"
                  src={images[activeImage]}
                  alt={product.name}
                  sx={{ width: '100%', maxHeight: 480, objectFit: 'cover', borderRadius: 3, border: '1px solid var(--bg-soft3)', display: 'block' }}
                />
                {images.length > 1 && (
                  <Box sx={{ display: 'flex', gap: 1, mt: 1.5, flexWrap: 'wrap' }}>
                    {images.map((img, i) => (
                      <Box
                        key={i}
                        component="img"
                        src={img}
                        alt={`${product.name} ${i + 1}`}
                        onClick={() => setActiveImage(i)}
                        sx={{
                          width: 64, height: 64, objectFit: 'cover', borderRadius: 2,
                          border: `2px solid ${activeImage === i ? '#e3242b' : '#E8D5B0'}`,
                          cursor: 'pointer', transition: 'border-color 0.15s', '&:hover': { borderColor: '#e3242b' },
                        }}
                      />
                    ))}
                  </Box>
                )}
              </>
            ) : (
              <Box sx={{ width: '100%', height: 320, backgroundColor: 'var(--bg-soft)', borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--bg-soft3)' }}>
                <AutoAwesomeIcon sx={{ color: '#E8D5B0', fontSize: 64 }} />
              </Box>
            )}
          </Box>

          {/* Right — Details & Ordering */}
          <Box sx={{ flex: 1 }}>
            {/* Title + status */}
            <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2, mb: 1 }}>
              <Typography
                variant="h4"
                sx={{ fontFamily: ff, fontWeight: 700, color: 'var(--text-main)', fontSize: { xs: '1.5rem', md: '1.9rem' }, flex: 1 }}
              >
                {product.name}
              </Typography>
              <Chip
                label={statusCfg.label}
                size="small"
                sx={{ backgroundColor: statusCfg.bg, color: statusCfg.color, fontWeight: 700, fontSize: '0.7rem', flexShrink: 0, mt: 0.5 }}
              />
            </Box>

            {product.material && (
              <Typography sx={{ color: '#e3242b', fontWeight: 600, fontSize: '0.9rem', mb: 1.5 }}>
                {product.material}
              </Typography>
            )}

            <Typography sx={{ color: 'var(--text-muted)', lineHeight: 1.7, fontSize: '0.95rem', mb: 2.5 }}>
              {product.description}
            </Typography>

            {/* Price */}
            <Box sx={{ mb: 3 }}>
              <Typography sx={{ fontFamily: ff, fontWeight: 700, fontSize: '1.7rem', color: 'var(--text-purple)' }}>
                {formatNaira(product.price)}
              </Typography>
            </Box>

            {/* Production timeline notice */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3, p: 1.5, backgroundColor: 'var(--bg-soft)', borderRadius: 2, border: '1px solid var(--bg-soft3)' }}>
              <AccessTimeIcon sx={{ color: '#e3242b', fontSize: 18, flexShrink: 0 }} />
              <Typography sx={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                <strong>Made to order</strong> — crafted fresh, ready in <strong>10–14 days</strong> after payment confirmation.
              </Typography>
            </Box>

            {/* Ordering UI — only shown when open */}
            {canOrder && (
              <>
                {/* Size selector */}
                <SizeSelector
                  sizes={product.sizes}
                  selected={selectedSize}
                  onSelect={(s) => { setSelectedSize(s); setErrors((p) => ({ ...p, size: '' })); }}
                />
                {errors.size && (
                  <Typography sx={{ color: '#d32f2f', fontSize: '0.78rem', mt: -1.5, mb: 1.5 }}>{errors.size}</Typography>
                )}

                {/* Colour selector */}
                <ColourSelector
                  colours={product.colours}
                  selected={selectedColour}
                  onSelect={(c) => { setSelectedColour(c); setErrors((p) => ({ ...p, colour: '' })); }}
                />
                {errors.colour && (
                  <Typography sx={{ color: '#d32f2f', fontSize: '0.78rem', mt: -1.5, mb: 1.5 }}>{errors.colour}</Typography>
                )}

                {/* Engraving / personalisation */}
                {product.allowEngraving && (
                  <Box sx={{ mb: 2.5 }}>
                    <Typography sx={{ fontFamily: ff, fontWeight: 700, fontSize: '0.95rem', mb: 1 }}>
                      Personalisation / Engraving <Typography component="span" sx={{ fontWeight: 400, color: 'var(--text-muted)', fontSize: '0.85rem' }}>(optional)</Typography>
                    </Typography>
                    <TextField
                      fullWidth
                      size="small"
                      placeholder="e.g. initials, a name, or short message"
                      value={engraving}
                      onChange={(e) => setEngraving(e.target.value)}
                      inputProps={{ maxLength: 40 }}
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, fontFamily: ff } }}
                    />
                  </Box>
                )}

                {/* Customer name */}
                <Box sx={{ mb: 2.5 }}>
                  <Typography sx={{ fontFamily: ff, fontWeight: 700, fontSize: '0.95rem', mb: 1 }}>Your Name</Typography>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="Enter your full name"
                    value={customerName}
                    onChange={(e) => { setCustomerName(e.target.value); setErrors((p) => ({ ...p, customerName: '' })); }}
                    error={!!errors.customerName}
                    helperText={errors.customerName}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, fontFamily: ff } }}
                  />
                </Box>

                {/* Phone */}
                <Box sx={{ mb: 2.5 }}>
                  <Typography sx={{ fontFamily: ff, fontWeight: 700, fontSize: '0.95rem', mb: 1 }}>Phone Number</Typography>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder="e.g. 08012345678"
                    value={phone}
                    onChange={(e) => { setPhone(e.target.value); setErrors((p) => ({ ...p, phone: '' })); }}
                    error={!!errors.phone}
                    helperText={errors.phone}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, fontFamily: ff } }}
                  />
                </Box>

                {/* Quantity */}
                <Box sx={{ mb: 3 }}>
                  <Typography sx={{ fontFamily: ff, fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)', mb: 1.5 }}>
                    Quantity
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <IconButton
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      disabled={quantity <= 1}
                      sx={{ border: '1.5px solid #E8D5B0', borderRadius: 2, width: 36, height: 36, '&:hover': { borderColor: '#e3242b' }, '&.Mui-disabled': { opacity: 0.3 } }}
                    >
                      <RemoveIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                    <Typography sx={{ fontFamily: ff, fontWeight: 700, fontSize: '1.2rem', color: 'var(--text-main)', minWidth: 28, textAlign: 'center' }}>
                      {quantity}
                    </Typography>
                    <IconButton
                      onClick={() => setQuantity((q) => q + 1)}
                      sx={{ border: '1.5px solid #E8D5B0', borderRadius: 2, width: 36, height: 36, '&:hover': { borderColor: '#e3242b' } }}
                    >
                      <AddIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                  </Box>
                </Box>

                {/* Multi-item discount */}
                {product.multiSetDiscount && discountPct > 0 && (
                  <Box sx={{ mb: 2.5, p: 1.5, backgroundColor: discountApplied ? '#e8f5e9' : 'var(--bg-soft)', borderRadius: 2, border: `1px solid ${discountApplied ? '#a5d6a7' : '#E8D5B0'}`, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LocalOfferIcon sx={{ fontSize: 16, color: discountApplied ? '#2e7d32' : '#e3242b', flexShrink: 0 }} />
                    <Typography sx={{ fontSize: '0.82rem', color: discountApplied ? '#2e7d32' : '#e3242b', fontWeight: 600 }}>
                      {discountApplied
                        ? `${discountPct}% multi-item discount applied — ${formatNaira(pricePerItem)} each`
                        : `Order 2+ to unlock ${discountPct}% off each`}
                    </Typography>
                  </Box>
                )}

                {/* Total */}
                <Box sx={{ mb: 3, p: 1.5, backgroundColor: 'var(--bg-soft)', borderRadius: 2, border: '1px solid var(--bg-soft3)' }}>
                  <Typography sx={{ fontFamily: ff, fontWeight: 700, color: 'var(--text-purple)', fontSize: '1.1rem' }}>
                    Total: {formatNaira(totalPrice)}
                    {quantity > 1 && (
                      <Typography component="span" sx={{ fontSize: '0.78rem', fontWeight: 400, color: 'var(--text-muted)', ml: 0.5 }}>
                        ({quantity} × {formatNaira(pricePerItem)})
                      </Typography>
                    )}
                  </Typography>
                </Box>

                {/* Pay with Paystack */}
                <Button
                  fullWidth
                  startIcon={paying ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : <PaymentIcon />}
                  onClick={handlePay}
                  disabled={paying}
                  sx={{
                    mt: 1, py: 1.5, borderRadius: '30px', backgroundColor: '#e3242b', color: '#fff',
                    fontFamily: ff, fontWeight: 700, fontSize: '1rem', textTransform: 'none',
                    '&:hover': { backgroundColor: '#b81b21' }, '&.Mui-disabled': { backgroundColor: '#f0a0a0', color: '#fff' },
                  }}
                >
                  {paying ? 'Processing…' : `Pay ${formatNaira(totalPrice)} with Paystack`}
                </Button>
                <Typography sx={{ textAlign: 'center', fontSize: '0.75rem', color: '#aaa', mt: 1 }}>
                  Secure payment via Paystack. Full amount charged.
                </Typography>
              </>
            )}

            {/* Upcoming state */}
            {product.status === 'upcoming' && (
              <Alert severity="info" icon={<AccessTimeIcon />} sx={{ borderRadius: 2, mt: 1 }}>
                This product is not yet available for orders. Check back soon!
              </Alert>
            )}

            {/* Closed / cap reached state */}
            {(product.status === 'closed' || (product.status === 'open' && isAtOrderCap)) && (
              <Alert severity="warning" sx={{ borderRadius: 2, mt: 1 }}>
                {isAtOrderCap ? 'This product has reached its order limit.' : 'This product is currently sold out.'}
              </Alert>
            )}
          </Box>
        </Box>
      </Container>

      {/* Modals */}
      <SignInPrompt open={signInOpen} onClose={() => setSignInOpen(false)} />
      {successDialog && (
        <PostPaymentDialog
          open={!!successDialog}
          onClose={() => { setSuccessDialog(null); navigate('/shop'); }}
          productName={product.name}
          customerName={customerName}
          orderId={successDialog.orderId || ''}
        />
      )}
    </Box>
  );
}
