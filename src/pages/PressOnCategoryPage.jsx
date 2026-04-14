import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Container,
  Button,
  Chip,
  MenuItem,
  TextField,
  IconButton,
  Collapse,
  CircularProgress,
  Menu,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import StarIcon from '@mui/icons-material/Star';
import ShareIcon from '@mui/icons-material/Share';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import CheckIcon from '@mui/icons-material/Check';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import CardGiftcardIcon from '@mui/icons-material/CardGiftcard';
import {
  Dialog,
  DialogContent,
  Collapse as MuiCollapse,
  Switch,
  FormControlLabel,
  Rating,
} from '@mui/material';
import { pressOnQuantities } from '../data/products';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { saveNailBedSizes, fetchNailBedSizes } from '../lib/orderService';
import {
  validateReferralCode,
  getLoyaltyData,
  REDEMPTION_UNIT,
  REDEMPTION_VALUE,
  getPendingLoyaltyReward,
} from '../lib/loyaltyService';
import { hasDiscount, getEffectivePrice, getDiscountLabel } from '../lib/discountUtils';
import { fetchTestimonials } from '../lib/testimonialService';
import { storage } from '../lib/firebase';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import NailBedSizeInput from '../components/NailBedSizeInput';
import NailShapeSelector from '../components/NailShapeSelector';
import NailLengthSelector from '../components/NailLengthSelector';
import SignInPrompt from '../components/SignInPrompt';
import PresetSizeGuide from '../components/PresetSizeGuide';
import useProductCategories from '../hooks/useProductCategories';
import { DEFAULT_SET_INCLUDES_OPTIONS, DEFAULT_INSPIRATION_OPTIONS } from '../data/customPressOnOptions';

const WHATSAPP_NUMBER = '2349053714197';
const BUSINESS_EMAIL = 'chizobaezeh338@gmail.com';

function formatNaira(amount) {
  return `₦${Number(amount).toLocaleString()}`;
}

export default function PressOnCategoryPage() {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addPressOn } = useCart();
  const { showToast } = useNotifications();
  const { categories, loading } = useProductCategories();

  const category = categories.find((c) => c.id === categoryId) || null;

  useEffect(() => {
    if (!loading && category && category.readyMade) {
      navigate('/products', { replace: true });
    }
  }, [loading, category]);

  const [selectedProductId, setSelectedProductId] = useState('');
  const selectedProduct = category?.products?.find((p) => p.id === selectedProductId) || null;

  const [customerName, setCustomerName] = useState('');
  const [nailShape, setNailShape] = useState('');
  const [nailBedSize, setNailBedSize] = useState('');
  const [quantity, setQuantity] = useState(1);

  const [setIncludesSelected, setSetIncludesSelected] = useState([]);
  const [setIncludesOther, setSetIncludesOther] = useState('');
  const [inspirationsSelected, setInspirationsSelected] = useState([]);
  const [inspirationOther, setInspirationOther] = useState('');
  const [nailNotes, setNailNotes] = useState('');
  const MAX_NOTES = 500;

  const [error, setError] = useState('');
  const [signInPromptOpen, setSignInPromptOpen] = useState(false);
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  const [shareAnchor, setShareAnchor] = useState(null);

  // Order for Someone
  const [giftFor, setGiftFor] = useState({ enabled: false, name: '', nailBedSizes: '', nailShape: '', length: '' });

  // True to Photo image upload (max 2)
  const [refImages, setRefImages] = useState([]);
  const [uploading, setUploading] = useState(false);

  // Post-add contact dialog (for custom orders)
  const [contactDialog, setContactDialog] = useState(null); // { categoryTitle, cartItem }

  // Review cards
  const [testimonials, setTestimonials] = useState([]);

  const [showRefField, setShowRefField] = useState(false);
  const [refCodeInput, setRefCodeInput] = useState('');
  const [referralValid, setReferralValid] = useState(false);
  const [referralChecking, setReferralChecking] = useState(false);
  const [referralMsg, setReferralMsg] = useState('');
  const [loyaltyBalance, setLoyaltyBalance] = useState(0);
  const [loyaltyUnits, setLoyaltyUnits] = useState(0);
  const [pendingReward] = useState(() => getPendingLoyaltyReward());

  useEffect(() => {
    if (user?.displayName && !customerName) setCustomerName(user.displayName);
    if (user?.uid) {
      fetchNailBedSizes(user.uid)
        .then((saved) => { if (saved && !nailBedSize) setNailBedSize(saved); })
        .catch(() => {});
      getLoyaltyData(user.uid)
        .then((d) => {
          const pts = d.loyaltyPoints || 0;
          setLoyaltyBalance(pts);
          const pr = getPendingLoyaltyReward();
          if (pr && pr.units > 0) setLoyaltyUnits(Math.min(pr.units, Math.floor(pts / REDEMPTION_UNIT)));
        })
        .catch(() => {});
      const pending = sessionStorage.getItem('pendingReferralCode');
      if (pending) {
        setRefCodeInput(pending);
        setShowRefField(true);
        validateReferralCode(pending).then((referrerUid) => {
          const valid = !!referrerUid && referrerUid !== user.uid;
          setReferralValid(valid);
          setReferralMsg(valid ? '₦500 off applied at checkout!' : '');
        }).catch(() => {});
      }
    }
  }, [user]);

  const maxLoyaltyUnits = Math.floor(loyaltyBalance / REDEMPTION_UNIT);

  // Fetch review cards
  useEffect(() => {
    fetchTestimonials().then((t) => setTestimonials(t.slice(0, 6))).catch(() => {});
  }, []);

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const remaining = 2 - refImages.length;
    if (remaining <= 0) return;
    const toUpload = files.slice(0, remaining);
    setUploading(true);
    try {
      const urls = await Promise.all(
        toUpload.map(async (file) => {
          const path = `true-to-photo/${Date.now()}-${file.name}`;
          const snap = await uploadBytes(storageRef(storage, path), file);
          return getDownloadURL(snap.ref);
        })
      );
      setRefImages((prev) => [...prev, ...urls].slice(0, 2));
    } catch {
      showToast('Image upload failed. Please try again.', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleApplyReferral = async () => {
    if (!refCodeInput.trim()) return;
    setReferralChecking(true);
    setReferralMsg('');
    try {
      const referrerUid = await validateReferralCode(refCodeInput.trim());
      if (!referrerUid) {
        setReferralValid(false);
        setReferralMsg('Invalid code.');
      } else if (referrerUid === user?.uid) {
        setReferralValid(false);
        setReferralMsg("You can't use your own referral code.");
      } else {
        setReferralValid(true);
        setReferralMsg('₦500 off will be applied at checkout!');
        sessionStorage.setItem('pendingReferralCode', refCodeInput.trim());
      }
    } catch {
      setReferralValid(false);
      setReferralMsg('Could not verify code.');
    }
    setReferralChecking(false);
  };

  const hasAllNailSizes = (sizeStr) => {
    if (!sizeStr) return false;
    const parts = sizeStr.split(',').filter((p) => p.includes(':'));
    return parts.length >= 10;
  };

  const isFormValid =
    customerName.trim() &&
    selectedProductId &&
    nailShape &&
    hasAllNailSizes(nailBedSize);

  const validate = () => {
    if (!customerName.trim()) { setError('Please enter your name.'); return false; }
    if (!selectedProductId) { setError('Please select a length.'); return false; }
    if (!nailShape) { setError('Please select a nail shape.'); return false; }
    if (!hasAllNailSizes(nailBedSize)) { setError('Please enter all 10 nail bed sizes.'); return false; }
    return true;
  };

  const buildSetIncludes = () => {
    const result = setIncludesSelected.filter((s) => s !== 'Other');
    if (setIncludesSelected.includes('Other')) {
      result.push(setIncludesOther.trim() ? `Other: ${setIncludesOther.trim()}` : 'Other');
    }
    return result;
  };

  const buildInspirationTags = () => {
    const result = inspirationsSelected.filter((s) => s !== 'Other');
    if (inspirationsSelected.includes('Other')) {
      result.push(inspirationOther.trim() ? `Other: ${inspirationOther.trim()}` : 'Other');
    }
    return result;
  };

  const buildCartItem = () => {
    const price = selectedProduct ? getEffectivePrice(selectedProduct) : 0;
    const hasDisc = selectedProduct ? hasDiscount(selectedProduct) : false;
    const isTrueToPhoto = inspirationsSelected.includes('True to Photo / Replica');
    return {
      productId: selectedProduct?.id || '',
      name: `${category.title} — ${selectedProduct?.name || ''}`,
      price,
      originalPrice: hasDisc ? selectedProduct.price : undefined,
      discountLabel: hasDisc ? getDiscountLabel(selectedProduct) : undefined,
      type: selectedProduct?.type || category?.type || '',
      nailShape,
      nailBedSize,
      quantity,
      selectedLength: selectedProduct?.name || '',
      setIncludes: buildSetIncludes(),
      inspirationTags: buildInspirationTags(),
      nailNotes: nailNotes.trim(),
      orderingForOthers: giftFor.enabled,
      otherPeople: giftFor.enabled ? [{
        name: giftFor.name.trim(),
        nailBedSize: giftFor.nailBedSizes,
        nailShape: giftFor.nailShape,
        selectedLength: giftFor.length,
      }] : [],
      ...(isTrueToPhoto && refImages.length > 0 && { referenceImages: refImages }),
      customerName: customerName.trim(),
      categoryId: category.id,
      readyMade: false,
    };
  };

  const handleAddToCart = () => {
    if (!user) { setSignInPromptOpen(true); return; }
    if (!validate()) return;
    const item = buildCartItem();
    addPressOn(item);
    showToast(`${category.title} added to cart`, 'success');
    setContactDialog({ categoryTitle: category.title, item });
  };

  const handleCheckout = () => {
    if (!user) { setSignInPromptOpen(true); return; }
    if (!validate()) return;
    const item = buildCartItem();
    addPressOn(item);
    showToast(`${category.title} added to cart`, 'success');
    if (nailBedSize) saveNailBedSizes(user.uid, nailBedSize).catch(() => {});
    navigate('/checkout', {
      state: {
        referralCode: referralValid ? refCodeInput : null,
        presetLoyaltyUnits: loyaltyUnits,
      },
    });
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href)
      .then(() => showToast('Link copied to clipboard!', 'success'))
      .catch(() => showToast('Could not copy link', 'error'));
    setShareAnchor(null);
  };

  const handleShareWhatsApp = () => {
    const text = `Check out this nail set from Chizzysstyles:\n${category?.title}\n${window.location.href}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
    setShareAnchor(null);
  };

  const setIncludesOptions = category?.setIncludesOptions?.length > 0
    ? category.setIncludesOptions
    : DEFAULT_SET_INCLUDES_OPTIONS;

  const inspirationOptions = category?.inspirationOptions?.length > 0
    ? category.inspirationOptions
    : DEFAULT_INSPIRATION_OPTIONS;

  const showSetIncludes = category?.showSetIncludes !== false;
  const showInspirations = category?.showInspirations !== false;
  const showNotesField = category?.showNotesField !== false;

  const toggleSetIncludes = (opt) => {
    setSetIncludesSelected((prev) =>
      prev.includes(opt) ? prev.filter((o) => o !== opt) : [...prev, opt]
    );
  };

  const toggleInspiration = (opt) => {
    setInspirationsSelected((prev) =>
      prev.includes(opt) ? prev.filter((o) => o !== opt) : [...prev, opt]
    );
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', pt: 12 }}>
        <CircularProgress sx={{ color: '#E91E8C' }} />
      </Box>
    );
  }

  if (!category || category.readyMade) {
    return (
      <Box sx={{ pt: 12, textAlign: 'center', py: 10 }}>
        <Typography sx={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Category not found.</Typography>
        <Button onClick={() => navigate('/products')} sx={{ mt: 2, color: '#E91E8C', fontFamily: '"Georgia", serif' }}>
          Back to Products
        </Button>
      </Box>
    );
  }

  const visibleProducts = (category.products || []).filter((p) => !p.hidden);
  const startingPrice = visibleProducts.length > 0
    ? Math.min(...visibleProducts.map((p) => getEffectivePrice(p)))
    : 0;

  return (
    <Box sx={{ pt: { xs: 7, md: 8 }, pb: { xs: 18, md: 10 } }}>
      {/* Hero Image */}
      <Box sx={{ position: 'relative', width: '100%', maxHeight: { xs: 320, md: 420 }, overflow: 'hidden' }}>
        {category.image ? (
          <Box
            component="img"
            src={category.image}
            alt={category.title}
            sx={{ width: '100%', height: { xs: 280, md: 400 }, objectFit: 'cover', display: 'block' }}
          />
        ) : (
          <Box sx={{ width: '100%', height: { xs: 280, md: 400 }, backgroundColor: '#F3E5F6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Typography sx={{ fontSize: '4rem' }}>💅</Typography>
          </Box>
        )}
        <Box sx={{ position: 'absolute', top: 16, left: 16, display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton
            onClick={() => navigate('/products')}
            sx={{ backgroundColor: 'rgba(255,255,255,0.9)', '&:hover': { backgroundColor: '#fff' }, boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}
          >
            <ArrowBackIcon sx={{ color: '#E91E8C' }} />
          </IconButton>
          <Button
            startIcon={<PlayCircleOutlineIcon />}
            onClick={() => window.open('https://www.instagram.com/reel/DVdYNG7DFSy/?igsh=dDlvN2Z5ZzB3Y2l2', '_blank')}
            sx={{ color: 'var(--text-purple)', fontFamily: '"Georgia", serif', fontWeight: 600, fontSize: '0.82rem', textTransform: 'none', border: '1.5px solid #4A0E4E', borderRadius: '20px', px: 2, py: 0.5, backgroundColor: 'rgba(255,255,255,0.9)', '&:hover': { backgroundColor: '#4A0E4E', color: '#fff' } }}
          >
            How to Apply
          </Button>
        </Box>
      </Box>

      <Container maxWidth="sm" sx={{ py: 3 }}>
        {/* Title + share */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1 }}>
          <Typography variant="h4" sx={{ fontFamily: '"Georgia", serif', fontWeight: 700, color: 'var(--text-main)', fontSize: { xs: '1.6rem', md: '2rem' }, flex: 1 }}>
            {category.title}
          </Typography>
          <IconButton
            onClick={(e) => setShareAnchor(e.currentTarget)}
            size="small"
            sx={{ mt: 0.5, ml: 1, color: '#E91E8C', border: '1px solid #F0C0D0', borderRadius: 2, p: 0.8 }}
          >
            <ShareIcon sx={{ fontSize: 20 }} />
          </IconButton>
        </Box>

        <Menu
          anchorEl={shareAnchor}
          open={Boolean(shareAnchor)}
          onClose={() => setShareAnchor(null)}
          PaperProps={{ sx: { borderRadius: 2, minWidth: 180, boxShadow: '0 4px 20px rgba(0,0,0,0.12)' } }}
        >
          <MenuItem onClick={handleCopyLink} sx={{ py: 1.2 }}>
            <ListItemIcon><ContentCopyIcon sx={{ fontSize: 18, color: 'var(--text-purple)' }} /></ListItemIcon>
            <ListItemText primaryTypographyProps={{ fontFamily: '"Georgia", serif', fontSize: '0.88rem' }}>Copy link</ListItemText>
          </MenuItem>
          <MenuItem onClick={handleShareWhatsApp} sx={{ py: 1.2 }}>
            <ListItemIcon><WhatsAppIcon sx={{ fontSize: 18, color: '#25D366' }} /></ListItemIcon>
            <ListItemText primaryTypographyProps={{ fontFamily: '"Georgia", serif', fontSize: '0.88rem' }}>Share on WhatsApp</ListItemText>
          </MenuItem>
        </Menu>

        {/* Starting price */}
        {visibleProducts.length > 0 && (
          <Typography sx={{ fontFamily: '"Georgia", serif', color: '#E91E8C', fontWeight: 700, fontSize: '1.1rem', mb: 1.5 }}>
            From {formatNaira(startingPrice)}
          </Typography>
        )}

        {/* Description */}
        {category.description && (
          <Typography sx={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.7, mb: 2 }}>
            {category.description}
          </Typography>
        )}

        {/* Image guide note */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, p: 2, mb: 3, backgroundColor: '#FFFBF0', border: '1px solid #FFE082', borderRadius: 3 }}>
          <InfoOutlinedIcon sx={{ color: '#B8860B', fontSize: 20, mt: 0.1, flexShrink: 0 }} />
          <Box>
            <Typography sx={{ fontFamily: '"Georgia", serif', fontWeight: 700, color: '#7A5800', fontSize: '0.9rem', mb: 0.5 }}>
              About this image
            </Typography>
            <Typography sx={{ color: '#7A5800', fontSize: '0.85rem', lineHeight: 1.65 }}>
              The photo shown is a <strong>visual guide only</strong> — not the actual product. It&rsquo;s here to inspire your style. Feel free to send us your <strong>mood board</strong>, Inspiration pictures, or any inspiration images — from nature, your favourite colours, food, films, cartoons, or any subject you love!
            </Typography>
          </Box>
        </Box>

        <Box sx={{ borderTop: '1px solid #F0C0D0', pt: 3 }}>
          {/* Customer Name */}
          <Typography sx={{ fontFamily: '"Georgia", serif', fontWeight: 700, color: 'var(--text-purple)', mb: 1, fontSize: '1rem' }}>
            Your Name
          </Typography>
          <TextField
            fullWidth
            size="small"
            placeholder="Enter your full name"
            value={customerName}
            onChange={(e) => { setCustomerName(e.target.value); setError(''); }}
            sx={{ mb: 3, '& .MuiOutlinedInput-root': { borderRadius: 2, '& fieldset': { borderColor: '#F0C0D0' }, '&:hover fieldset': { borderColor: '#E91E8C' }, '&.Mui-focused fieldset': { borderColor: '#E91E8C' } } }}
          />

          {/* Length selector */}
          <Typography sx={{ fontFamily: '"Georgia", serif', fontWeight: 700, color: 'var(--text-purple)', mb: 1, fontSize: '1rem' }}>
            Select Length
          </Typography>
          {visibleProducts.length === 0 ? (
            <Typography sx={{ color: '#999', fontSize: '0.88rem', mb: 3 }}>
              No length options available yet.
            </Typography>
          ) : (
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(auto-fill, minmax(120px, 1fr))' }, gap: 1.5, mb: 3 }}>
              {visibleProducts.map((p) => {
                const pPrice = getEffectivePrice(p);
                const pHasDisc = hasDiscount(p);
                const isSelected = selectedProductId === p.id;
                return (
                  <Box
                    key={p.id}
                    onClick={() => { setSelectedProductId(p.id); setError(''); }}
                    sx={{
                      cursor: 'pointer',
                      borderRadius: 2,
                      border: '2px solid',
                      borderColor: isSelected ? '#E91E8C' : '#F0C0D0',
                      backgroundColor: isSelected ? '#FFF0F5' : '#fff',
                      px: 2.5,
                      py: 1.5,
                      textAlign: 'center',
                      transition: 'all 0.18s',
                      '&:hover': { borderColor: '#E91E8C', backgroundColor: '#FFF0F5' },
                    }}
                  >
                    <Typography sx={{ fontFamily: '"Georgia", serif', fontWeight: 700, color: isSelected ? '#E91E8C' : 'var(--text-main)', fontSize: '0.9rem' }}>
                      {p.name}
                    </Typography>
                    <Typography sx={{ fontFamily: '"Georgia", serif', fontWeight: 700, color: pHasDisc ? '#2e7d32' : '#E91E8C', fontSize: '1rem' }}>
                      {formatNaira(pPrice)}
                    </Typography>
                    {pHasDisc && (
                      <Typography sx={{ fontSize: '0.7rem', color: '#999', textDecoration: 'line-through' }}>
                        {formatNaira(p.price)}
                      </Typography>
                    )}
                  </Box>
                );
              })}
            </Box>
          )}

          {/* Nail Shape */}
          <Typography sx={{ fontFamily: '"Georgia", serif', fontWeight: 700, color: 'var(--text-purple)', mb: 1, fontSize: '1rem' }}>
            Nail Shape
          </Typography>
          <Box sx={{ mb: 3 }}>
            <NailShapeSelector value={nailShape} onChange={(s) => { setNailShape(s); setError(''); }} />
          </Box>

          {/* Quantity */}
          <Typography sx={{ fontFamily: '"Georgia", serif', fontWeight: 700, color: 'var(--text-purple)', mb: 1, fontSize: '1rem' }}>
            Quantity
          </Typography>
          <TextField
            select
            size="small"
            value={quantity}
            onChange={(e) => setQuantity(Number(e.target.value))}
            sx={{ width: 110, mb: 3, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          >
            {pressOnQuantities.map((q) => (
              <MenuItem key={q} value={q}>{q}</MenuItem>
            ))}
          </TextField>

          {/* Nail Bed Sizes */}
          <Typography sx={{ fontFamily: '"Georgia", serif', fontWeight: 700, color: 'var(--text-purple)', mb: 1, fontSize: '1rem' }}>
            Nail Bed Sizes
          </Typography>
          <Box sx={{ mb: 3 }}>
            <NailBedSizeInput value={nailBedSize} onChange={setNailBedSize} required />
          </Box>
          <Box sx={{ mb: 3, mt: -2 }}>
            <Button
              size="small"
              onClick={() => setSizeGuideOpen(true)}
              sx={{ color: '#E91E8C', textTransform: 'none', fontSize: '0.82rem', fontFamily: '"Georgia", serif', fontWeight: 600, p: 0, minWidth: 0, '&:hover': { backgroundColor: 'transparent', textDecoration: 'underline' } }}
            >
              What are preset sizes?
            </Button>
          </Box>

          {/* Set Includes */}
          {showSetIncludes && (
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mb: 0.5 }}>
                <Typography sx={{ fontFamily: '"Georgia", serif', fontWeight: 700, color: 'var(--text-purple)', fontSize: '1rem' }}>
                  Does your set include?
                </Typography>
                <Typography sx={{ fontSize: '0.8rem', color: '#999' }}>(optional)</Typography>
              </Box>
              <Typography sx={{ fontSize: '0.8rem', color: '#999', mb: 1.5 }}>
                Select all that you want included in your set
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {setIncludesOptions.map((opt) => {
                  const selected = setIncludesSelected.includes(opt);
                  return (
                    <Chip
                      key={opt}
                      label={opt}
                      onClick={() => toggleSetIncludes(opt)}
                      icon={selected ? <CheckIcon sx={{ fontSize: '14px !important' }} /> : undefined}
                      sx={{
                        cursor: 'pointer',
                        fontFamily: '"Georgia", serif',
                        fontSize: '0.78rem',
                        border: '1.5px solid',
                        borderColor: selected ? '#E91E8C' : '#F0C0D0',
                        backgroundColor: selected ? '#FFF0F5' : '#fff',
                        color: selected ? '#E91E8C' : 'var(--text-main)',
                        fontWeight: selected ? 700 : 400,
                        '&:hover': { borderColor: '#E91E8C', backgroundColor: '#FFF0F5' },
                      }}
                    />
                  );
                })}
              </Box>
              {setIncludesSelected.includes('Other') && (
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Describe what else you'd like included…"
                  value={setIncludesOther}
                  onChange={(e) => setSetIncludesOther(e.target.value)}
                  sx={{ mt: 1.5, '& .MuiOutlinedInput-root': { borderRadius: 2, '& fieldset': { borderColor: '#F0C0D0' }, '&.Mui-focused fieldset': { borderColor: '#E91E8C' } } }}
                />
              )}
            </Box>
          )}

          {/* Inspiration */}
          {showInspirations && (
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mb: 0.5 }}>
                <Typography sx={{ fontFamily: '"Georgia", serif', fontWeight: 700, color: 'var(--text-purple)', fontSize: '1rem' }}>
                  Inspiration / Aesthetic
                </Typography>
                <Typography sx={{ fontSize: '0.8rem', color: '#999' }}>(optional)</Typography>
              </Box>
              <Typography sx={{ fontSize: '0.8rem', color: '#999', mb: 1.5 }}>
                What vibe are you going for?
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {inspirationOptions.map((opt) => {
                  const selected = inspirationsSelected.includes(opt);
                  return (
                    <Chip
                      key={opt}
                      label={opt}
                      onClick={() => toggleInspiration(opt)}
                      icon={selected ? <CheckIcon sx={{ fontSize: '14px !important' }} /> : undefined}
                      sx={{
                        cursor: 'pointer',
                        fontFamily: '"Georgia", serif',
                        fontSize: '0.78rem',
                        border: '1.5px solid',
                        borderColor: selected ? '#9C27B0' : '#F0C0D0',
                        backgroundColor: selected ? '#F3E5F6' : '#fff',
                        color: selected ? '#9C27B0' : 'var(--text-main)',
                        fontWeight: selected ? 700 : 400,
                        '&:hover': { borderColor: '#9C27B0', backgroundColor: '#F3E5F6' },
                      }}
                    />
                  );
                })}
              </Box>
              {inspirationsSelected.includes('Other') && (
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Describe your aesthetic…"
                  value={inspirationOther}
                  onChange={(e) => setInspirationOther(e.target.value)}
                  sx={{ mt: 1.5, '& .MuiOutlinedInput-root': { borderRadius: 2, '& fieldset': { borderColor: '#F0C0D0' }, '&.Mui-focused fieldset': { borderColor: '#E91E8C' } } }}
                />
              )}
            </Box>
          )}

          {/* True to Photo image upload */}
          {inspirationsSelected.includes('True to Photo / Replica') && (
            <Box sx={{ mb: 3, p: 2, backgroundColor: '#F3E5F6', borderRadius: 3, border: '1px solid #CE93D8' }}>
              <Typography sx={{ fontFamily: '"Georgia", serif', fontWeight: 700, color: '#6A1B9A', fontSize: '0.95rem', mb: 0.5 }}>
                📸 Reference Photos (True to Photo)
              </Typography>
              <Typography sx={{ fontSize: '0.8rem', color: '#888', mb: 1.5 }}>
                Upload up to 2 reference photos. We'll recreate them as closely as possible.
              </Typography>
              <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', mb: 1 }}>
                {refImages.map((url, i) => (
                  <Box key={i} sx={{ position: 'relative' }}>
                    <Box component="img" src={url} sx={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 2, border: '2px solid #CE93D8' }} />
                    <Box
                      onClick={() => setRefImages((prev) => prev.filter((_, idx) => idx !== i))}
                      sx={{ position: 'absolute', top: -6, right: -6, width: 20, height: 20, borderRadius: '50%', backgroundColor: '#d32f2f', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', cursor: 'pointer', fontWeight: 700 }}
                    >
                      ×
                    </Box>
                  </Box>
                ))}
                {refImages.length < 2 && (
                  <Box
                    component="label"
                    sx={{
                      width: 80, height: 80, borderRadius: 2, border: '2px dashed #CE93D8',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      cursor: uploading ? 'wait' : 'pointer', backgroundColor: '#fff',
                      '&:hover': { borderColor: '#9C27B0', backgroundColor: '#F9F0FF' },
                    }}
                  >
                    {uploading ? <CircularProgress size={20} sx={{ color: '#9C27B0' }} /> : (
                      <>
                        <CloudUploadIcon sx={{ fontSize: 22, color: '#CE93D8' }} />
                        <Typography sx={{ fontSize: '0.6rem', color: '#999', mt: 0.3 }}>Upload</Typography>
                      </>
                    )}
                    <input type="file" accept="image/*" hidden onChange={handleImageUpload} disabled={uploading} />
                  </Box>
                )}
              </Box>
              <Typography sx={{ fontSize: '0.72rem', color: '#999' }}>
                {refImages.length}/2 photos uploaded
              </Typography>
            </Box>
          )}

          {/* Order for Someone Else */}
          <Box sx={{ mb: 3, p: 2, backgroundColor: '#FFF8FF', borderRadius: 3, border: '1px solid #F0C0D0' }}>
            <FormControlLabel
              control={
                <Switch
                  checked={giftFor.enabled}
                  onChange={(e) => setGiftFor((p) => ({ ...p, enabled: e.target.checked }))}
                  sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#E91E8C' }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#E91E8C' } }}
                />
              }
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
                  <CardGiftcardIcon sx={{ fontSize: 18, color: '#E91E8C' }} />
                  <Typography sx={{ fontFamily: '"Georgia", serif', fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-purple)' }}>
                    Ordering for someone else?
                  </Typography>
                </Box>
              }
            />
            <MuiCollapse in={giftFor.enabled}>
              <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  fullWidth
                  size="small"
                  label="Recipient's Name"
                  value={giftFor.name}
                  onChange={(e) => setGiftFor((p) => ({ ...p, name: e.target.value }))}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                />
                <Box>
                  <Typography sx={{ fontFamily: '"Georgia", serif', fontWeight: 600, fontSize: '0.85rem', mb: 1, color: 'var(--text-main)' }}>
                    Their Nail Bed Sizes
                  </Typography>
                  <NailBedSizeInput
                    value={giftFor.nailBedSizes}
                    onChange={(v) => setGiftFor((p) => ({ ...p, nailBedSizes: v }))}
                  />
                </Box>
                <Box>
                  <Typography sx={{ fontFamily: '"Georgia", serif', fontWeight: 600, fontSize: '0.85rem', mb: 1, color: 'var(--text-main)' }}>
                    Their Preferred Shape
                  </Typography>
                  <NailShapeSelector
                    value={giftFor.nailShape}
                    onChange={(s) => setGiftFor((p) => ({ ...p, nailShape: s }))}
                  />
                </Box>
                <Box>
                  <Typography sx={{ fontFamily: '"Georgia", serif', fontWeight: 600, fontSize: '0.85rem', mb: 1, color: 'var(--text-main)' }}>
                    Their Preferred Length
                  </Typography>
                  <NailLengthSelector
                    value={giftFor.length}
                    onChange={(l) => setGiftFor((p) => ({ ...p, length: l }))}
                  />
                </Box>
              </Box>
            </MuiCollapse>
          </Box>

          {/* Notes */}
          {showNotesField && (
            <Box sx={{ mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1, mb: 0.5 }}>
                <Typography sx={{ fontFamily: '"Georgia", serif', fontWeight: 700, color: 'var(--text-purple)', fontSize: '1rem' }}>
                  Additional Notes
                </Typography>
                <Typography sx={{ fontSize: '0.8rem', color: '#999' }}>(optional)</Typography>
              </Box>
              <TextField
                fullWidth
                multiline
                minRows={3}
                maxRows={6}
                placeholder="Describe your vision — colour palette, inspiration descriptions, anything specific you want. The more detail, the better!"
                value={nailNotes}
                onChange={(e) => { if (e.target.value.length <= MAX_NOTES) setNailNotes(e.target.value); }}
                helperText={`${nailNotes.length}/${MAX_NOTES}`}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, '& fieldset': { borderColor: '#F0C0D0' }, '&:hover fieldset': { borderColor: '#E91E8C' }, '&.Mui-focused fieldset': { borderColor: '#E91E8C' } } }}
              />
            </Box>
          )}

          {/* Discounts & Rewards */}
          {isFormValid && (
            <Box sx={{ p: 2.5, borderRadius: 3, backgroundColor: '#FFF0F5', border: '1px solid #F0C0D0', mb: 3 }}>
              <Typography sx={{ fontFamily: '"Georgia", serif', fontWeight: 700, color: 'var(--text-purple)', mb: 1.5, fontSize: '0.95rem' }}>
                Discounts &amp; Rewards
              </Typography>

              <Box onClick={() => setShowRefField((v) => !v)} sx={{ display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer', mb: showRefField ? 1.5 : 0 }}>
                <LocalOfferIcon sx={{ fontSize: 15, color: referralValid ? '#2e7d32' : '#E91E8C' }} />
                <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: referralValid ? '#2e7d32' : '#E91E8C', fontFamily: '"Georgia", serif' }}>
                  {referralValid ? '₦500 off applied at checkout!' : 'Have a referral code?'}
                </Typography>
              </Box>
              <Collapse in={showRefField}>
                <Box sx={{ display: 'flex', gap: 1, mb: 0.5 }}>
                  <TextField
                    size="small"
                    placeholder="e.g. CHIZZYS-ABC123"
                    value={refCodeInput}
                    onChange={(e) => { setRefCodeInput(e.target.value.toUpperCase()); setReferralValid(false); setReferralMsg(''); }}
                    sx={{ flex: 1, '& .MuiOutlinedInput-root': { borderRadius: 2, '& fieldset': { borderColor: '#F0C0D0' }, '&.Mui-focused fieldset': { borderColor: '#E91E8C' } } }}
                    inputProps={{ style: { fontFamily: 'monospace', letterSpacing: 1, fontSize: '0.82rem' } }}
                  />
                  <Button
                    onClick={handleApplyReferral}
                    disabled={!refCodeInput.trim() || referralChecking}
                    sx={{ backgroundColor: '#E91E8C', color: '#fff', borderRadius: 2, px: 2, fontFamily: '"Georgia", serif', fontWeight: 600, fontSize: '0.78rem', whiteSpace: 'nowrap', '&:hover': { backgroundColor: '#C2185B' }, '&.Mui-disabled': { backgroundColor: '#F0C0D0', color: '#fff' } }}
                  >
                    {referralChecking ? <CircularProgress size={14} sx={{ color: '#fff' }} /> : 'Apply'}
                  </Button>
                </Box>
                {referralMsg && (
                  <Typography sx={{ fontSize: '0.75rem', color: referralValid ? '#2e7d32' : '#d32f2f', mt: 0.3 }}>
                    {referralMsg}
                  </Typography>
                )}
              </Collapse>

              {user && maxLoyaltyUnits > 0 && (
                <Box sx={{ mt: 1.5 }}>
                  {pendingReward && loyaltyUnits === 0 && (
                    <Box sx={{ mb: 1.5, p: 1.2, borderRadius: 2, background: 'linear-gradient(135deg, #FFF8E1, #FFF3E0)', border: '1.5px solid #FFD54F', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1 }}>
                      <Box>
                        <Typography sx={{ fontWeight: 700, fontSize: '0.82rem', color: '#B8860B' }}>
                          🎁 ₦{pendingReward.naira.toLocaleString()} loyalty reward ready
                        </Typography>
                        <Typography sx={{ fontSize: '0.72rem', color: '#888' }}>
                          {pendingReward.pts} pts saved — tap Apply to use
                        </Typography>
                      </Box>
                      <Button
                        size="small"
                        onClick={() => setLoyaltyUnits(Math.min(pendingReward.units, maxLoyaltyUnits))}
                        sx={{ border: '1.5px solid #E91E8C', borderRadius: '20px', color: '#E91E8C', px: 2, py: 0.4, fontSize: '0.78rem', fontWeight: 700, textTransform: 'none', '&:hover': { backgroundColor: '#E91E8C', color: '#fff' } }}
                      >
                        Apply
                      </Button>
                    </Box>
                  )}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.8 }}>
                    <StarIcon sx={{ fontSize: 15, color: '#B8860B' }} />
                    <Typography sx={{ fontSize: '0.82rem', fontWeight: 600, color: '#B8860B', fontFamily: '"Georgia", serif' }}>
                      Loyalty — {loyaltyBalance} pts (redeemable at checkout)
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <IconButton size="small" onClick={() => setLoyaltyUnits((u) => Math.max(0, u - 1))} disabled={loyaltyUnits === 0} sx={{ border: '1.5px solid #F0C0D0', borderRadius: '50%', width: 28, height: 28 }}>
                      <RemoveIcon sx={{ fontSize: 14 }} />
                    </IconButton>
                    <Typography sx={{ fontFamily: '"Georgia", serif', fontWeight: 700, minWidth: 20, textAlign: 'center' }}>
                      {loyaltyUnits}
                    </Typography>
                    <IconButton size="small" onClick={() => setLoyaltyUnits((u) => Math.min(maxLoyaltyUnits, u + 1))} disabled={loyaltyUnits >= maxLoyaltyUnits} sx={{ border: '1.5px solid #F0C0D0', borderRadius: '50%', width: 28, height: 28 }}>
                      <AddIcon sx={{ fontSize: 14 }} />
                    </IconButton>
                    <Typography sx={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      units × ₦1,000 ={' '}
                      <strong style={{ color: '#B8860B' }}>
                        -₦{(loyaltyUnits * REDEMPTION_VALUE).toLocaleString()} off
                      </strong>
                    </Typography>
                  </Box>
                </Box>
              )}

              {(referralValid || loyaltyUnits > 0) && (
                <Typography sx={{ mt: 1.5, fontSize: '0.75rem', color: '#888', fontStyle: 'italic' }}>
                  Discounts will be applied to your total at checkout.
                </Typography>
              )}
            </Box>
          )}

          {error && (
            <Typography sx={{ color: '#d32f2f', fontSize: '0.88rem', mb: 2 }}>
              {error}
            </Typography>
          )}
        </Box>
      </Container>

      <Container maxWidth="sm" sx={{ mt: 2, mb: 1, textAlign: 'center' }}>
        <Typography
          component="a"
          href="/nail-care"
          sx={{ fontFamily: '"Georgia", serif', fontSize: '0.82rem', color: '#E91E8C', textDecoration: 'underline', cursor: 'pointer', '&:hover': { color: '#C2185B' } }}
        >
          How to apply &amp; care for your press-ons →
        </Typography>
      </Container>

      {/* Sticky action bar */}
      <Box sx={{ position: 'fixed', bottom: { xs: '64px', md: 0 }, left: 0, right: 0, zIndex: 1100, backgroundColor: 'rgba(255, 240, 245, 0.97)', backdropFilter: 'blur(8px)', borderTop: '1px solid #F0C0D0', py: 1.5, px: 2, display: 'flex', gap: 1.5, justifyContent: 'center', flexWrap: 'wrap' }}>
        <Button
          onClick={handleAddToCart}
          disabled={!isFormValid}
          startIcon={<ShoppingCartOutlinedIcon />}
          sx={{ border: '2px solid #4A0E4E', borderRadius: '30px', color: 'var(--text-purple)', px: 3, py: 1, fontFamily: '"Georgia", serif', fontWeight: 600, fontSize: '0.9rem', opacity: isFormValid ? 1 : 0.5, '&:hover': { backgroundColor: '#4A0E4E', color: '#fff' }, '&.Mui-disabled': { border: '2px solid #ccc', color: '#ccc' } }}
        >
          Add to Cart
        </Button>
        <Button
          onClick={handleCheckout}
          disabled={!isFormValid}
          sx={{ borderRadius: '30px', backgroundColor: isFormValid ? '#E91E8C' : '#F0C0D0', color: '#fff', px: 4, py: 1, fontFamily: '"Georgia", serif', fontWeight: 700, fontSize: '0.9rem', boxShadow: isFormValid ? '0 4px 16px rgba(233,30,140,0.3)' : 'none', '&:hover': { backgroundColor: '#C2185B' }, '&.Mui-disabled': { backgroundColor: '#F0C0D0', color: '#fff' } }}
        >
          Checkout
        </Button>
      </Box>

      <PresetSizeGuide open={sizeGuideOpen} onClose={() => setSizeGuideOpen(false)} />
      <SignInPrompt open={signInPromptOpen} onClose={() => setSignInPromptOpen(false)} message="Sign in to place your order and track it later." />

      {/* Post-add contact dialog */}
      {contactDialog && (() => {
        const item = contactDialog.item;
        const details = [
          `Category: ${contactDialog.categoryTitle}`,
          item.selectedLength ? `Length: ${item.selectedLength}` : '',
          item.nailShape ? `Shape: ${item.nailShape}` : '',
          item.nailBedSize ? `Nail Bed Size: ${item.nailBedSize}` : '',
          item.setIncludes?.length > 0 ? `Set Includes: ${item.setIncludes.join(', ')}` : '',
          item.inspirationTags?.length > 0 ? `Inspiration: ${item.inspirationTags.join(', ')}` : '',
          item.nailNotes ? `Notes: ${item.nailNotes}` : '',
          item.orderingForOthers && item.otherPeople?.[0]?.name ? `Gift For: ${item.otherPeople[0].name}` : '',
        ].filter(Boolean).join('\n');
        const waMsg = encodeURIComponent(`Hi Chizzystyles! 🌸\n\nI just added a custom press-on set to my cart and wanted to confirm:\n\n${details}\n\nPlease let me know if you need anything else. Thank you!`);
        const emailSubject = encodeURIComponent(`Custom Press-On Order — ${contactDialog.categoryTitle}`);
        const emailBody = encodeURIComponent(`Hi Chizzystyles,\n\nI've added a custom press-on set to my cart.\n\n${details}\n\nPlease confirm availability. Thank you!`);
        return (
          <Dialog open maxWidth="xs" fullWidth onClose={() => { setContactDialog(null); navigate('/products'); }}>
            <DialogContent sx={{ textAlign: 'center', pt: 3, pb: 3 }}>
              <Typography sx={{ fontFamily: '"Georgia", serif', fontWeight: 700, fontSize: '1.1rem', color: 'var(--text-main)', mb: 1 }}>
                Added to Cart! 🎉
              </Typography>
              <Typography sx={{ fontFamily: '"Georgia", serif', fontSize: '0.88rem', color: 'var(--text-muted)', mb: 3 }}>
                For custom orders we recommend confirming your design details via WhatsApp or email before checkout.
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                <Button
                  fullWidth
                  startIcon={<WhatsAppIcon />}
                  href={`https://wa.me/${WHATSAPP_NUMBER}?text=${waMsg}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{ backgroundColor: '#25D366', color: '#fff', borderRadius: '30px', py: 1.1, fontFamily: '"Georgia", serif', fontWeight: 700, textTransform: 'none', '&:hover': { backgroundColor: '#1da851' } }}
                >
                  Confirm via WhatsApp
                </Button>
                <Button
                  fullWidth
                  startIcon={<EmailOutlinedIcon />}
                  href={`mailto:${BUSINESS_EMAIL}?subject=${emailSubject}&body=${emailBody}`}
                  sx={{ backgroundColor: '#4A0E4E', color: '#fff', borderRadius: '30px', py: 1.1, fontFamily: '"Georgia", serif', fontWeight: 700, textTransform: 'none', '&:hover': { backgroundColor: '#3a0b3e' } }}
                >
                  Confirm via Email
                </Button>
                <Button
                  onClick={() => { setContactDialog(null); navigate('/cart'); }}
                  sx={{ fontFamily: '"Georgia", serif', color: '#E91E8C', textTransform: 'none', fontWeight: 600, fontSize: '0.85rem' }}
                >
                  Go to Cart
                </Button>
                <Button
                  onClick={() => { setContactDialog(null); navigate('/products'); }}
                  sx={{ fontFamily: '"Georgia", serif', color: 'var(--text-muted)', textTransform: 'none', fontSize: '0.82rem' }}
                >
                  Continue Shopping
                </Button>
              </Box>
            </DialogContent>
          </Dialog>
        );
      })()}

      {/* Review Cards */}
      {testimonials.length > 0 && (
        <Box sx={{ backgroundColor: '#FFF0F5', pt: 5, pb: { xs: 16, md: 8 }, mt: 2 }}>
          <Container maxWidth="lg">
            <Typography sx={{ fontFamily: '"Georgia", serif', fontWeight: 700, fontSize: '1.3rem', color: 'var(--text-main)', mb: 3, textAlign: 'center' }}>
              What Our Clients Say 💅
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, overflowX: 'auto', pb: 1, '&::-webkit-scrollbar': { height: 4 }, '&::-webkit-scrollbar-thumb': { backgroundColor: '#F0C0D0', borderRadius: 2 } }}>
              {testimonials.map((t) => (
                <Box
                  key={t.id}
                  sx={{
                    minWidth: 240,
                    maxWidth: 280,
                    p: 2.5,
                    backgroundColor: '#fff',
                    borderRadius: 3,
                    border: '1px solid #F0C0D0',
                    flexShrink: 0,
                    boxShadow: '0 2px 8px rgba(233,30,140,0.06)',
                  }}
                >
                  <Rating value={t.rating || 5} readOnly size="small" sx={{ color: '#E91E8C', mb: 1 }} />
                  <Typography sx={{ fontFamily: '"Georgia", serif', fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.6, mb: 1.5, display: '-webkit-box', WebkitLineClamp: 4, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    "{t.testimonial}"
                  </Typography>
                  <Typography sx={{ fontFamily: '"Georgia", serif', fontWeight: 700, fontSize: '0.82rem', color: 'var(--text-purple)' }}>
                    — {t.name?.split(' ')[0] || 'Client'}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Container>
        </Box>
      )}
    </Box>
  );
}
