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
  DialogTitle,
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
import StraightenIcon from '@mui/icons-material/Straighten';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { fetchNicheCollections, incrementCollectionOrderCount } from '../lib/nicheCollectionService';
import { saveOrder } from '../lib/orderService';
import { confirmOrderDirectly, verifyPaystackDeposit } from '../lib/paymentService';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import SignInPrompt from '../components/SignInPrompt';
import NailShapeSelector from '../components/NailShapeSelector';
import NailLengthSelector from '../components/NailLengthSelector';
import NailBedSizeInput from '../components/NailBedSizeInput';

const ff = '"Georgia", serif';
const WHATSAPP_NUMBER = '2349053714197';
const BUSINESS_EMAIL = 'chizobaezeh338@gmail.com';

function formatNaira(amount) {
  return `₦${Number(amount).toLocaleString()}`;
}

const STATUS_CONFIG = {
  open: { label: 'Open for Orders', color: '#2e7d32', bg: '#e8f5e9' },
  upcoming: { label: 'Coming Soon', color: '#e65100', bg: '#fff3e0' },
  closed: { label: 'Orders Closed', color: '#616161', bg: '#f5f5f5' },
};

// ── How to Measure Modal ──────────────────────────────────
function HowToMeasureModal({ open, onClose }) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontFamily: ff, fontWeight: 700, color: 'var(--text-main)', pb: 1 }}>
        📏 How to Measure Your Nail Bed
      </DialogTitle>
      <DialogContent>
        <Typography sx={{ fontFamily: ff, fontSize: '0.9rem', color: 'var(--text-muted)', mb: 2 }}>
          Follow these steps to get the most accurate nail sizes for your custom set:
        </Typography>
        {[
          { step: '1', text: 'Cut a thin strip of paper or use a soft flexible tape measure.' },
          { step: '2', text: 'Wrap it snugly around the widest part of each nail bed — not the cuticle, but the widest point of the nail plate.' },
          { step: '3', text: 'Mark where the paper overlaps and measure the length in millimetres (mm).' },
          { step: '4', text: 'Measure all 10 fingers: both thumbs, index, middle, ring, and pinky.' },
          { step: '5', text: 'If between sizes, choose the larger size for a more comfortable fit.' },
        ].map(({ step, text }) => (
          <Box key={step} sx={{ display: 'flex', gap: 1.5, mb: 1.5 }}>
            <Box
              sx={{
                width: 28,
                height: 28,
                borderRadius: '50%',
                backgroundColor: '#E91E8C',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: ff,
                fontWeight: 700,
                fontSize: '0.82rem',
                flexShrink: 0,
              }}
            >
              {step}
            </Box>
            <Typography sx={{ fontFamily: ff, fontSize: '0.88rem', color: 'var(--text-main)', pt: 0.4 }}>
              {text}
            </Typography>
          </Box>
        ))}
        <Box
          sx={{
            mt: 2,
            p: 2,
            backgroundColor: '#FFF0F5',
            borderRadius: 2,
            border: '1px solid #F0C0D0',
          }}
        >
          <Typography sx={{ fontFamily: ff, fontWeight: 700, fontSize: '0.85rem', color: '#E91E8C', mb: 1 }}>
            General Size Reference (Thumb width)
          </Typography>
          {[
            { size: 'XS', mm: '~14–15mm' },
            { size: 'S',  mm: '~15–16mm' },
            { size: 'M',  mm: '~16–17mm' },
            { size: 'L',  mm: '~17–18mm+' },
          ].map(({ size, mm }) => (
            <Box key={size} sx={{ display: 'flex', gap: 2, mb: 0.5 }}>
              <Typography sx={{ fontFamily: ff, fontWeight: 700, fontSize: '0.82rem', minWidth: 30 }}>{size}</Typography>
              <Typography sx={{ fontFamily: ff, fontSize: '0.82rem', color: '#666' }}>{mm}</Typography>
            </Box>
          ))}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button
          onClick={onClose}
          sx={{ fontFamily: ff, color: '#E91E8C', textTransform: 'none', fontWeight: 600 }}
        >
          Got it, thanks!
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ── Post-Payment Contact Dialog ───────────────────────────
function PostPaymentDialog({ open, onClose, collectionName, customerName, orderId }) {
  const waMessage = encodeURIComponent(
    `Hi Chizzystyles! 🌸\n\nI just paid for my niche collection order and wanted to confirm the details.\n\nCollection: ${collectionName}\nOrder ID: ${orderId}\nName: ${customerName}\n\nPlease confirm my order. Thank you!`
  );
  const emailSubject = encodeURIComponent(`Niche Collection Order Confirmation — ${orderId}`);
  const emailBody = encodeURIComponent(
    `Hi Chizzystyles,\n\nI just paid for my niche collection order and wanted to confirm:\n\nCollection: ${collectionName}\nOrder ID: ${orderId}\nName: ${customerName}\n\nThank you!`
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogContent sx={{ textAlign: 'center', pt: 4, pb: 3 }}>
        <CheckCircleOutlineIcon sx={{ fontSize: 56, color: '#4CAF50', mb: 2 }} />
        <Typography sx={{ fontFamily: ff, fontWeight: 700, fontSize: '1.2rem', color: 'var(--text-main)', mb: 1 }}>
          Payment Successful! 🎉
        </Typography>
        <Typography sx={{ fontFamily: ff, fontSize: '0.88rem', color: 'var(--text-muted)', mb: 3 }}>
          Your order has been placed. Please reach out via WhatsApp or email so we can confirm your set details and get started!
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <Button
            fullWidth
            startIcon={<WhatsAppIcon />}
            href={`https://wa.me/${WHATSAPP_NUMBER}?text=${waMessage}`}
            target="_blank"
            rel="noopener noreferrer"
            sx={{
              backgroundColor: '#25D366',
              color: '#fff',
              borderRadius: '30px',
              py: 1.2,
              fontFamily: ff,
              fontWeight: 700,
              fontSize: '0.95rem',
              textTransform: 'none',
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
              backgroundColor: '#4A0E4E',
              color: '#fff',
              borderRadius: '30px',
              py: 1.2,
              fontFamily: ff,
              fontWeight: 700,
              fontSize: '0.95rem',
              textTransform: 'none',
              '&:hover': { backgroundColor: '#3a0b3e' },
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

// ── Main Page ─────────────────────────────────────────────
export default function NicheCollectionDetailPage() {
  const { collectionId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useNotifications();

  const [collection, setCollection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);

  // Order form
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [shape, setShape] = useState('');
  const [length, setLength] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [nailMeasurements, setNailMeasurements] = useState('');
  const [errors, setErrors] = useState({});

  // UI state
  const [measureOpen, setMeasureOpen] = useState(false);
  const [signInOpen, setSignInOpen] = useState(false);
  const [paying, setPaying] = useState(false);
  const [successDialog, setSuccessDialog] = useState(null); // { orderId }

  useEffect(() => {
    if (user?.displayName && !customerName) setCustomerName(user.displayName);
  }, [user]);

  useEffect(() => {
    fetchNicheCollections()
      .then((all) => {
        const found = all.find((c) => c.id === collectionId);
        setCollection(found || null);
      })
      .catch(() => setCollection(null))
      .finally(() => setLoading(false));
  }, [collectionId]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress sx={{ color: '#E91E8C' }} />
      </Box>
    );
  }

  if (!collection) {
    return (
      <Box sx={{ pt: 14, textAlign: 'center' }}>
        <Typography sx={{ color: 'var(--text-muted)' }}>Collection not found.</Typography>
        <Button onClick={() => navigate('/collections')} sx={{ mt: 2, color: '#E91E8C' }}>
          Back to Collections
        </Button>
      </Box>
    );
  }

  const statusCfg = STATUS_CONFIG[collection.status] || STATUS_CONFIG.closed;
  const images = Array.isArray(collection.images) && collection.images.length > 0 ? collection.images : [];

  const isAtOrderCap =
    collection.maxOrders != null && (collection.orderCount || 0) >= collection.maxOrders;
  const canOrder = collection.status === 'open' && !isAtOrderCap;

  const lengthSurcharges = collection.lengthSurcharges || {};
  const lengthSurcharge = length ? (lengthSurcharges[length] || 0) : 0;
  const adjustedBasePrice = collection.price + lengthSurcharge;
  const surchargesForSelector = Object.keys(lengthSurcharges).length > 0 ? lengthSurcharges : null;

  const discountApplied = canOrder && collection.multiSetDiscount && quantity >= 2;
  const discountPct = collection.multiSetDiscountPercent || 0;
  const pricePerSet = discountApplied
    ? Math.round(adjustedBasePrice * (1 - discountPct / 100))
    : adjustedBasePrice;
  const totalPrice = pricePerSet * quantity;

  const validate = () => {
    const e = {};
    if (!customerName.trim()) e.customerName = 'Please enter your name';
    if (!phone.trim()) e.phone = 'Please enter your phone number';
    if (!shape) e.shape = 'Please select a shape';
    if (!length) e.length = 'Please select a length';
    if (collection.requiresMeasurements) {
      const filled = nailMeasurements.split(',').filter((p) => p.includes(':')).length;
      if (filled < 10) e.measurements = 'Please enter all 10 nail measurements';
    }
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

    // Save a pending order first to get an orderId
    let orderId = null;
    try {
      const orderData = {
        type: 'nicheCollection',
        total: totalPrice,
        customerName: customerName.trim(),
        email: user.email || '',
        phone: phone.trim(),
        collectionId: collection.id,
        collectionName: collection.name,
        season: collection.season || '',
        shape,
        length,
        quantity,
        pricePerSet,
        nailMeasurements: collection.requiresMeasurements ? nailMeasurements : '',
        items: [{
          kind: 'nicheCollection',
          name: collection.name,
          price: pricePerSet,
          quantity,
          shape,
          length,
          ...(nailMeasurements && { nailMeasurements }),
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
      email: user.email || 'guest@chizzys.com',
      amount: totalPrice * 100,
      currency: 'NGN',
      ref: `CHIZZYS-NICHE-${orderId || Date.now()}`,
      metadata: { collectionId: collection.id, orderId },
      callback: async (response) => {
        try {
          if (orderId) {
            await confirmOrderDirectly(user.uid, orderId);
            verifyPaystackDeposit({ reference: response.reference, orderId, uid: user.uid }).catch(() => {});
          }
          incrementCollectionOrderCount(collection.id).catch(() => {});
          setCollection((prev) => prev ? { ...prev, orderCount: (prev.orderCount || 0) + 1 } : prev);
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
            onClick={() => navigate('/products')}
            sx={{ fontFamily: ff, fontSize: '0.82rem', color: 'var(--text-muted)', textTransform: 'none', p: 0, minWidth: 0, '&:hover': { color: '#E91E8C', backgroundColor: 'transparent' } }}
          >
            Press-ons Menu
          </Button>
          <Typography sx={{ color: '#ccc', fontSize: '0.82rem' }}>/</Typography>
          <Button
            startIcon={<ArrowBackIcon sx={{ fontSize: '0.8rem !important' }} />}
            onClick={() => navigate('/collections')}
            sx={{ fontFamily: ff, fontSize: '0.82rem', color: 'var(--text-muted)', textTransform: 'none', p: 0, minWidth: 0, '&:hover': { color: '#E91E8C', backgroundColor: 'transparent' } }}
          >
            All Collections
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
                  alt={collection.name}
                  sx={{ width: '100%', maxHeight: 480, objectFit: 'cover', borderRadius: 3, border: '1px solid #F0C0D0', display: 'block' }}
                />
                {images.length > 1 && (
                  <Box sx={{ display: 'flex', gap: 1, mt: 1.5, flexWrap: 'wrap' }}>
                    {images.map((img, i) => (
                      <Box
                        key={i}
                        component="img"
                        src={img}
                        alt={`${collection.name} ${i + 1}`}
                        onClick={() => setActiveImage(i)}
                        sx={{
                          width: 64, height: 64, objectFit: 'cover', borderRadius: 2,
                          border: `2px solid ${activeImage === i ? '#E91E8C' : '#F0C0D0'}`,
                          cursor: 'pointer', transition: 'border-color 0.15s', '&:hover': { borderColor: '#E91E8C' },
                        }}
                      />
                    ))}
                  </Box>
                )}
              </>
            ) : (
              <Box sx={{ width: '100%', height: 320, backgroundColor: '#FFF0F5', borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #F0C0D0' }}>
                <AutoAwesomeIcon sx={{ color: '#F0C0D0', fontSize: 64 }} />
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
                {collection.name}
              </Typography>
              <Chip
                label={statusCfg.label}
                size="small"
                sx={{ backgroundColor: statusCfg.bg, color: statusCfg.color, fontWeight: 700, fontSize: '0.7rem', flexShrink: 0, mt: 0.5 }}
              />
            </Box>

            {collection.season && (
              <Typography sx={{ color: '#E91E8C', fontWeight: 600, fontSize: '0.9rem', mb: 1.5 }}>
                {collection.season} Collection
              </Typography>
            )}

            <Typography sx={{ color: 'var(--text-muted)', lineHeight: 1.7, fontSize: '0.95rem', mb: 2.5 }}>
              {collection.description}
            </Typography>

            {/* Price */}
            <Box sx={{ mb: 3 }}>
              <Typography sx={{ fontFamily: ff, fontWeight: 700, fontSize: '1.7rem', color: 'var(--text-purple)' }}>
                {!length && surchargesForSelector ? (
                  <>
                    <Typography component="span" sx={{ fontSize: '0.85rem', fontWeight: 400, color: 'var(--text-muted)', mr: 0.5 }}>from</Typography>
                    {formatNaira(collection.price)}
                  </>
                ) : (
                  formatNaira(adjustedBasePrice)
                )}
                <Typography component="span" sx={{ fontSize: '0.85rem', fontWeight: 400, color: 'var(--text-muted)', ml: 0.5 }}>
                  per set
                </Typography>
              </Typography>
              {length && lengthSurcharge > 0 && (
                <Typography sx={{ fontSize: '0.78rem', color: '#888', mt: 0.3 }}>
                  Base {formatNaira(collection.price)} + {formatNaira(lengthSurcharge)} ({length})
                </Typography>
              )}
            </Box>

            {/* Production timeline notice */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3, p: 1.5, backgroundColor: '#FFF0F5', borderRadius: 2, border: '1px solid #F0C0D0' }}>
              <AccessTimeIcon sx={{ color: '#E91E8C', fontSize: 18, flexShrink: 0 }} />
              <Typography sx={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                <strong>Made to order</strong> — crafted fresh, ready in <strong>4–7 business days</strong> after payment confirmation.
              </Typography>
            </Box>

            {/* Ordering UI — only shown when open */}
            {canOrder && (
              <>
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

                {/* Shape */}
                <Box sx={{ mb: 3 }}>
                  <Typography sx={{ fontFamily: ff, fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)', mb: 1 }}>
                    Shape
                    {shape && <Typography component="span" sx={{ ml: 1, fontWeight: 400, color: '#E91E8C', fontSize: '0.85rem' }}>— {shape}</Typography>}
                  </Typography>
                  <NailShapeSelector
                    value={shape}
                    onChange={(s) => { setShape(s); setErrors((e) => ({ ...e, shape: '' })); }}
                    availableOnly={collection.availableShapes?.length > 0 ? collection.availableShapes : undefined}
                  />
                  {errors.shape && <Typography sx={{ color: '#d32f2f', fontSize: '0.78rem', mt: 0.5 }}>{errors.shape}</Typography>}
                </Box>

                {/* Length */}
                <Box sx={{ mb: 3 }}>
                  <Typography sx={{ fontFamily: ff, fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)', mb: 1 }}>
                    Length
                    {length && <Typography component="span" sx={{ ml: 1, fontWeight: 400, color: '#E91E8C', fontSize: '0.85rem' }}>— {length}</Typography>}
                  </Typography>
                  <NailLengthSelector
                    value={length}
                    onChange={(l) => { setLength(l); setErrors((e) => ({ ...e, length: '' })); }}
                    availableOnly={collection.availableLengths?.length > 0 ? collection.availableLengths : undefined}
                    surcharges={surchargesForSelector}
                  />
                  {errors.length && <Typography sx={{ color: '#d32f2f', fontSize: '0.78rem', mt: 0.5 }}>{errors.length}</Typography>}
                </Box>

                {/* Nail measurements */}
                {collection.requiresMeasurements && (
                  <Box sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                      <Typography sx={{ fontFamily: ff, fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)' }}>
                        Nail Measurements
                      </Typography>
                      <Button
                        size="small"
                        startIcon={<StraightenIcon sx={{ fontSize: '0.9rem !important' }} />}
                        onClick={() => setMeasureOpen(true)}
                        sx={{
                          fontFamily: ff, fontSize: '0.75rem', textTransform: 'none', color: '#E91E8C',
                          border: '1px solid #F0C0D0', borderRadius: '20px', px: 1.5, py: 0.4,
                          '&:hover': { backgroundColor: '#FFF0F5' },
                        }}
                      >
                        How to Measure
                      </Button>
                    </Box>
                    <NailBedSizeInput
                      value={nailMeasurements}
                      onChange={(v) => { setNailMeasurements(v); setErrors((e) => ({ ...e, measurements: '' })); }}
                      required
                    />
                    {errors.measurements && <Typography sx={{ color: '#d32f2f', fontSize: '0.78rem', mt: 0.5 }}>{errors.measurements}</Typography>}
                  </Box>
                )}

                {/* How to Measure link even without required measurements */}
                {!collection.requiresMeasurements && (
                  <Box sx={{ mb: 2.5 }}>
                    <Button
                      size="small"
                      startIcon={<StraightenIcon sx={{ fontSize: '0.9rem !important' }} />}
                      onClick={() => setMeasureOpen(true)}
                      sx={{
                        fontFamily: ff, fontSize: '0.8rem', textTransform: 'none', color: '#E91E8C',
                        border: '1px solid #F0C0D0', borderRadius: '20px', px: 2, py: 0.6,
                        '&:hover': { backgroundColor: '#FFF0F5' },
                      }}
                    >
                      How to Measure Your Nail Bed
                    </Button>
                  </Box>
                )}

                {/* Quantity */}
                <Box sx={{ mb: 3 }}>
                  <Typography sx={{ fontFamily: ff, fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)', mb: 1.5 }}>
                    Quantity (number of sets)
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <IconButton
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      disabled={quantity <= 1}
                      sx={{ border: '1.5px solid #F0C0D0', borderRadius: 2, width: 36, height: 36, '&:hover': { borderColor: '#E91E8C' }, '&.Mui-disabled': { opacity: 0.3 } }}
                    >
                      <RemoveIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                    <Typography sx={{ fontFamily: ff, fontWeight: 700, fontSize: '1.2rem', color: 'var(--text-main)', minWidth: 28, textAlign: 'center' }}>
                      {quantity}
                    </Typography>
                    <IconButton
                      onClick={() => setQuantity((q) => q + 1)}
                      sx={{ border: '1.5px solid #F0C0D0', borderRadius: 2, width: 36, height: 36, '&:hover': { borderColor: '#E91E8C' } }}
                    >
                      <AddIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                  </Box>
                </Box>

                {/* Multi-set discount */}
                {collection.multiSetDiscount && discountPct > 0 && (
                  <Box sx={{ mb: 2.5, p: 1.5, backgroundColor: discountApplied ? '#e8f5e9' : '#FFF0F5', borderRadius: 2, border: `1px solid ${discountApplied ? '#a5d6a7' : '#F0C0D0'}`, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LocalOfferIcon sx={{ fontSize: 16, color: discountApplied ? '#2e7d32' : '#E91E8C', flexShrink: 0 }} />
                    <Typography sx={{ fontSize: '0.82rem', color: discountApplied ? '#2e7d32' : '#E91E8C', fontWeight: 600 }}>
                      {discountApplied
                        ? `${discountPct}% multi-set discount applied — ${formatNaira(pricePerSet)} per set`
                        : `Order 2+ sets to unlock ${discountPct}% off each`}
                    </Typography>
                  </Box>
                )}

                {/* Total */}
                <Box sx={{ mb: 3, p: 1.5, backgroundColor: '#FFF0F5', borderRadius: 2, border: '1px solid #F0C0D0' }}>
                  <Typography sx={{ fontFamily: ff, fontWeight: 700, color: 'var(--text-purple)', fontSize: '1.1rem' }}>
                    Total: {formatNaira(totalPrice)}
                    {quantity > 1 && (
                      <Typography component="span" sx={{ fontSize: '0.78rem', fontWeight: 400, color: 'var(--text-muted)', ml: 0.5 }}>
                        ({quantity} sets × {formatNaira(pricePerSet)})
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
                    mt: 1, py: 1.5, borderRadius: '30px', backgroundColor: '#E91E8C', color: '#fff',
                    fontFamily: ff, fontWeight: 700, fontSize: '1rem', textTransform: 'none',
                    '&:hover': { backgroundColor: '#C2185B' }, '&.Mui-disabled': { backgroundColor: '#f0a0c8', color: '#fff' },
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
            {collection.status === 'upcoming' && (
              <Alert severity="info" icon={<AccessTimeIcon />} sx={{ borderRadius: 2, mt: 1 }}>
                This collection is not yet open for orders. Check back soon!
              </Alert>
            )}

            {/* Closed / cap reached state */}
            {(collection.status === 'closed' || (collection.status === 'open' && isAtOrderCap)) && (
              <Alert severity="warning" sx={{ borderRadius: 2, mt: 1 }}>
                {isAtOrderCap ? 'This collection has reached its order limit.' : 'Orders for this collection are currently closed.'}
              </Alert>
            )}
          </Box>
        </Box>
      </Container>

      {/* Modals */}
      <HowToMeasureModal open={measureOpen} onClose={() => setMeasureOpen(false)} />
      <SignInPrompt open={signInOpen} onClose={() => setSignInOpen(false)} />
      {successDialog && (
        <PostPaymentDialog
          open={!!successDialog}
          onClose={() => { setSuccessDialog(null); navigate('/collections'); }}
          collectionName={collection.name}
          customerName={customerName}
          orderId={successDialog.orderId || ''}
        />
      )}
    </Box>
  );
}
