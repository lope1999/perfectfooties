import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Chip,
  MenuItem,
  TextField,
  IconButton,
  Collapse,
  CircularProgress,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import StarIcon from '@mui/icons-material/Star';
import { pressOnNailShapes, pressOnQuantities } from '../data/products';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { saveNailBedSizes, fetchNailBedSizes } from '../lib/orderService';
import { validateReferralCode, getLoyaltyData, REDEMPTION_UNIT, REDEMPTION_VALUE, getPendingLoyaltyReward } from '../lib/loyaltyService';
import NailBedSizeInput from './NailBedSizeInput';
import SignInPrompt from './SignInPrompt';
import NailShapeSelector from './NailShapeSelector';
import { hasDiscount, getEffectivePrice, getDiscountLabel } from '../lib/discountUtils';

const presetSizes = ['XS', 'S', 'M', 'L'];

function formatNaira(amount) {
  return `₦${amount.toLocaleString()}`;
}

export default function ProductQuickView({ open, onClose, product, category, onAddedToCart }) {
  const { addPressOn } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [zoomOpen, setZoomOpen] = useState(false);
  const [presetSize, setPresetSize] = useState('');
  const [nailShape, setNailShape] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [nailBedSize, setNailBedSize] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [error, setError] = useState('');
  const [signInPromptOpen, setSignInPromptOpen] = useState(false);
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
    if (user?.uid && open) {
      fetchNailBedSizes(user.uid).then((saved) => {
        if (saved && !nailBedSize) setNailBedSize(saved);
      }).catch(() => {});
      getLoyaltyData(user.uid).then((d) => { const pts = d.loyaltyPoints || 0; setLoyaltyBalance(pts); const pr = getPendingLoyaltyReward(); if (pr && pr.units > 0) setLoyaltyUnits(Math.min(pr.units, Math.floor(pts / REDEMPTION_UNIT))); }).catch(() => {});
      const pending = sessionStorage.getItem('pendingReferralCode');
      if (pending) {
        setRefCodeInput(pending);
        setShowRefField(true);
        validateReferralCode(pending).then((referrerUid) => {
          const valid = !!referrerUid && referrerUid !== user.uid;
          setReferralValid(valid);
          setReferralMsg(valid ? '\u20a6500 off applied at checkout!' : '');
        }).catch(() => {});
      }
    }
  }, [user, open]);

  const handleApplyReferral = async () => {
    if (!refCodeInput.trim()) return;
    setReferralChecking(true);
    setReferralMsg('');
    try {
      const referrerUid = await validateReferralCode(refCodeInput.trim());
      if (!referrerUid) { setReferralValid(false); setReferralMsg('Invalid code.'); }
      else if (referrerUid === user?.uid) { setReferralValid(false); setReferralMsg("You can't use your own referral code."); }
      else {
        setReferralValid(true);
        setReferralMsg('\u20a6500 off will be applied at checkout!');
        sessionStorage.setItem('pendingReferralCode', refCodeInput.trim());
      }
    } catch { setReferralValid(false); setReferralMsg('Could not verify code.'); }
    setReferralChecking(false);
  };

  const maxLoyaltyUnits = Math.floor(loyaltyBalance / REDEMPTION_UNIT);

  if (!product || !category) return null;

  const isReadyMade = !!category.readyMade;
  const maxQty = isReadyMade ? (product.stock || 1) : 5;

  const hasAllNailSizes = (sizeStr) => {
    if (!sizeStr) return false;
    const parts = sizeStr.split(',').filter((p) => p.includes(':'));
    return parts.length >= 10;
  };

  const isFormValid =
    customerName.trim() && (isReadyMade ? presetSize : (nailShape && hasAllNailSizes(nailBedSize)));

  const handleClose = () => {
    setPresetSize('');
    setNailShape('');
    setQuantity(1);
    setNailBedSize('');
    setError('');
    setShowRefField(false);
    setRefCodeInput('');
    setReferralValid(false);
    setReferralMsg('');
    setLoyaltyUnits(0);
    onClose();
  };

  const validate = () => {
    if (!customerName.trim()) {
      setError('Please enter your name.');
      return false;
    }
    if (isReadyMade && !presetSize) {
      setError('Please select a preset size.');
      return false;
    }
    if (!isReadyMade && !nailShape) {
      setError('Please select a nail shape.');
      return false;
    }
    if (!isReadyMade && !hasAllNailSizes(nailBedSize)) {
      setError('Please enter all 10 nail bed sizes.');
      return false;
    }
    return true;
  };

  const handleAddToCart = () => {
    if (!user) { setSignInPromptOpen(true); return; }
    if (!validate()) return;

    const effectivePrice = getEffectivePrice(product);
    addPressOn({
      productId: product.id,
      name: product.name,
      price: effectivePrice,
      originalPrice: hasDiscount(product) ? product.price : undefined,
      discountLabel: hasDiscount(product) ? getDiscountLabel(product) : undefined,
      type: product.type || '',
      nailShape: nailShape || product.shape || '',
      quantity,
      nailBedSize: nailBedSize || '',
      presetSize: presetSize || '',
      orderingForOthers: false,
      otherPeople: [],
      customerName: customerName.trim(),
      categoryId: category.id,
      readyMade: isReadyMade,
      stock: product.stock,
    });

    handleClose();
    onAddedToCart?.();
  };

  const handleConfirmOrder = () => {
    if (!user) { setSignInPromptOpen(true); return; }
    if (!validate()) return;

    // Add item to CartContext then go to checkout for shipping details
    addPressOn({
      productId: product.id,
      name: product.name,
      price: getEffectivePrice(product),
      originalPrice: hasDiscount(product) ? product.price : undefined,
      discountLabel: hasDiscount(product) ? getDiscountLabel(product) : undefined,
      type: product.type || '',
      nailShape: nailShape || product.shape || '',
      quantity,
      nailBedSize: nailBedSize || '',
      presetSize: presetSize || '',
      orderingForOthers: false,
      otherPeople: [],
      customerName: customerName.trim(),
      categoryId: category.id,
      readyMade: isReadyMade,
      stock: product.stock,
    });

    // Save nail bed sizes to profile for reuse
    if (!isReadyMade && nailBedSize) {
      saveNailBedSizes(user.uid, nailBedSize).catch(() => {});
    }

    handleClose();
    navigate('/checkout', { state: { referralCode: referralValid ? refCodeInput : null, presetLoyaltyUnits: loyaltyUnits } });
  };

  return (
    <>
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 4, overflow: 'hidden' } }}
      >
        <DialogTitle
          sx={{
            background: 'linear-gradient(135deg, #E91E8C 0%, #4A0E4E 100%)',
            color: '#fff',
            textAlign: 'center',
            pb: 1,
            position: 'relative',
          }}
        >
          <Typography
            variant="h6"
            sx={{ fontFamily: '"Georgia", serif', fontWeight: 700, fontSize: '1.1rem' }}
          >
            {product.name}
          </Typography>
          <IconButton
            onClick={handleClose}
            sx={{ position: 'absolute', right: 8, top: 8, color: 'rgba(255,255,255,0.8)' }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 0 }}>
          {/* Product Image */}
          <Box
            sx={{ position: 'relative', cursor: 'pointer' }}
            onClick={() => setZoomOpen(true)}
          >
            <Box
              component="img"
              src={product.image}
              alt={product.name}
              sx={{ width: '100%', height: 300, objectFit: 'cover' }}
            />
            <IconButton
              sx={{
                position: 'absolute',
                bottom: 8,
                right: 8,
                backgroundColor: 'rgba(255,255,255,0.85)',
                '&:hover': { backgroundColor: '#fff' },
              }}
            >
              <ZoomInIcon sx={{ color: '#E91E8C' }} />
            </IconButton>
          </Box>

          <Box sx={{ p: 3 }}>
            {/* Description */}
            <Typography sx={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.7, mb: 2 }}>
              {product.description}
            </Typography>

            {/* Info chips */}
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
              {product.shape && (
                <Chip label={product.shape} size="small" sx={{ backgroundColor: '#F3E5F6', color: 'var(--text-purple)', fontWeight: 600 }} />
              )}
              {product.length && (
                <Chip label={product.length} size="small" sx={{ backgroundColor: '#F3E5F6', color: 'var(--text-purple)', fontWeight: 600 }} />
              )}
              {product.type && (
                <Chip label={product.type} size="small" sx={{ backgroundColor: '#4A0E4E', color: '#fff', fontWeight: 600 }} />
              )}
              {hasDiscount(product) ? (
                <>
                  <Chip
                    label={formatNaira(getEffectivePrice(product))}
                    sx={{ backgroundColor: '#2e7d32', color: '#fff', fontFamily: '"Georgia", serif', fontWeight: 700, fontSize: '0.95rem' }}
                  />
                  <Typography
                    component="span"
                    sx={{ textDecoration: 'line-through', color: '#999', fontSize: '0.85rem', fontFamily: '"Georgia", serif' }}
                  >
                    {formatNaira(product.price)}
                  </Typography>
                  <Chip
                    label={getDiscountLabel(product)}
                    size="small"
                    sx={{ backgroundColor: '#e8f5e9', color: '#2e7d32', fontWeight: 700, fontSize: '0.7rem' }}
                  />
                </>
              ) : (
                <Chip
                  label={formatNaira(product.price)}
                  sx={{ backgroundColor: '#E91E8C', color: '#fff', fontFamily: '"Georgia", serif', fontWeight: 700, fontSize: '0.95rem' }}
                />
              )}
            </Box>

            {/* Customer Name field */}
            <Typography sx={{ fontFamily: '"Georgia", serif', fontWeight: 600, fontSize: '0.9rem', mb: 1 }}>
              Your Name
            </Typography>
            <TextField
              fullWidth
              size="small"
              placeholder="Enter your full name"
              value={customerName}
              onChange={(e) => { setCustomerName(e.target.value); setError(''); }}
              sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: 2, '& fieldset': { borderColor: '#F0C0D0' }, '&:hover fieldset': { borderColor: '#E91E8C' }, '&.Mui-focused fieldset': { borderColor: '#E91E8C' } } }}
            />

            {/* Conditional form */}
            {isReadyMade ? (
              <Box>
                <Typography sx={{ fontFamily: '"Georgia", serif', fontWeight: 600, fontSize: '0.9rem', mb: 1 }}>
                  Select Preset Size
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                  {presetSizes.map((size) => (
                    <Chip
                      key={size}
                      label={size}
                      onClick={() => { setPresetSize(size); setError(''); }}
                      sx={{
                        cursor: 'pointer',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        border: '2px solid',
                        borderColor: presetSize === size ? '#E91E8C' : '#F0C0D0',
                        backgroundColor: presetSize === size ? '#E91E8C' : 'transparent',
                        color: presetSize === size ? '#fff' : '#000',
                        '&:hover': { backgroundColor: presetSize === size ? '#C2185B' : '#FCE4EC' },
                      }}
                    />
                  ))}
                </Box>

                <Typography sx={{ fontFamily: '"Georgia", serif', fontWeight: 600, fontSize: '0.9rem', mb: 1 }}>
                  Quantity
                </Typography>
                <TextField
                  select
                  size="small"
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  sx={{ width: 100, mb: 1, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                >
                  {Array.from({ length: maxQty }, (_, i) => i + 1).map((q) => (
                    <MenuItem key={q} value={q}>{q}</MenuItem>
                  ))}
                </TextField>

                {product.stock !== undefined && (
                  <Typography sx={{ color: product.stock <= 2 ? '#E91E8C' : '#999', fontSize: '0.78rem', fontStyle: 'italic', mt: 0.5 }}>
                    {product.stock} in stock
                  </Typography>
                )}
              </Box>
            ) : (
              <Box>
                <Typography sx={{ fontFamily: '"Georgia", serif', fontWeight: 600, fontSize: '0.9rem', mb: 1 }}>
                  Nail Shape
                </Typography>
                <Box sx={{ mb: 2 }} onClick={() => setError('')}>
                  <NailShapeSelector value={nailShape} onChange={(s) => { setNailShape(s); setError(''); }} />
                </Box>

                <Typography sx={{ fontFamily: '"Georgia", serif', fontWeight: 600, fontSize: '0.9rem', mb: 1 }}>
                  Quantity
                </Typography>
                <TextField
                  select
                  size="small"
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  sx={{ width: 100, mb: 2, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                >
                  {pressOnQuantities.map((q) => (
                    <MenuItem key={q} value={q}>{q}</MenuItem>
                  ))}
                </TextField>

                <Typography sx={{ fontFamily: '"Georgia", serif', fontWeight: 600, fontSize: '0.9rem', mb: 1 }}>
                  Nail Bed Sizes
                </Typography>
                <NailBedSizeInput value={nailBedSize} onChange={setNailBedSize} required />
              </Box>
            )}

            {/* Discounts & Rewards */}
            {isFormValid && (
              <Box sx={{ mt: 3, p: 2.5, borderRadius: 3, backgroundColor: '#FFF0F5', border: '1px solid #F0C0D0' }}>
                <Typography sx={{ fontFamily: '"Georgia", serif', fontWeight: 700, color: 'var(--text-purple)', mb: 1.5, fontSize: '0.9rem' }}>
                  Discounts &amp; Rewards
                </Typography>

                {/* Referral code */}
                <Box onClick={() => setShowRefField((v) => !v)} sx={{ display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer', mb: showRefField ? 1.5 : 0 }}>
                  <LocalOfferIcon sx={{ fontSize: 15, color: referralValid ? '#2e7d32' : '#E91E8C' }} />
                  <Typography sx={{ fontSize: '0.82rem', fontWeight: 600, color: referralValid ? '#2e7d32' : '#E91E8C', fontFamily: '"Georgia", serif' }}>
                    {referralValid ? '\u20a6500 off applied at checkout!' : 'Have a referral code?'}
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
                    <Typography sx={{ fontSize: '0.75rem', color: referralValid ? '#2e7d32' : '#d32f2f', mt: 0.3 }}>{referralMsg}</Typography>
                  )}
                </Collapse>

                {/* Loyalty points */}
                {user && maxLoyaltyUnits > 0 && (
                  <Box sx={{ mt: 1.5 }}>
                    {/* Pending loyalty reward banner */}
                    {pendingReward && loyaltyUnits === 0 && (
                      <Box sx={{ mb: 1.5, p: 1.2, borderRadius: 2, background: "linear-gradient(135deg, #FFF8E1, #FFF3E0)", border: "1.5px solid #FFD54F", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
                        <Box>
                          <Typography sx={{ fontWeight: 700, fontSize: "0.82rem", color: "#B8860B" }}>🎁 ₦{pendingReward.naira.toLocaleString()} loyalty reward ready</Typography>
                          <Typography sx={{ fontSize: "0.72rem", color: "#888" }}>{pendingReward.pts} pts saved — tap Apply to use</Typography>
                        </Box>
                        <Button size="small" onClick={() => setLoyaltyUnits(Math.min(pendingReward.units, maxLoyaltyUnits))} sx={{ border: "1.5px solid #E91E8C", borderRadius: "20px", color: "#E91E8C", px: 2, py: 0.4, fontSize: "0.78rem", fontWeight: 700, textTransform: "none", "&:hover": { backgroundColor: "#E91E8C", color: "#fff" } }}>Apply</Button>
                      </Box>
                    )}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.8 }}>
                      <StarIcon sx={{ fontSize: 15, color: '#B8860B' }} />
                      <Typography sx={{ fontSize: '0.82rem', fontWeight: 600, color: '#B8860B', fontFamily: '"Georgia", serif' }}>
                        Loyalty &mdash; {loyaltyBalance} pts (redeemable at checkout)
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <IconButton size="small" onClick={() => setLoyaltyUnits((u) => Math.max(0, u - 1))} disabled={loyaltyUnits === 0} sx={{ border: '1.5px solid #F0C0D0', borderRadius: '50%', width: 26, height: 26 }}>
                        <RemoveIcon sx={{ fontSize: 13 }} />
                      </IconButton>
                      <Typography sx={{ fontFamily: '"Georgia", serif', fontWeight: 700, minWidth: 18, textAlign: 'center', fontSize: '0.9rem' }}>{loyaltyUnits}</Typography>
                      <IconButton size="small" onClick={() => setLoyaltyUnits((u) => Math.min(maxLoyaltyUnits, u + 1))} disabled={loyaltyUnits >= maxLoyaltyUnits} sx={{ border: '1.5px solid #F0C0D0', borderRadius: '50%', width: 26, height: 26 }}>
                        <AddIcon sx={{ fontSize: 13 }} />
                      </IconButton>
                      <Typography sx={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        units &times; &#8358;1,000 = <strong style={{ color: '#B8860B' }}>-&#8358;{(loyaltyUnits * REDEMPTION_VALUE).toLocaleString()} off</strong>
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
              <Typography sx={{ color: '#d32f2f', fontSize: '0.85rem', mt: 1 }}>
                {error}
              </Typography>
            )}
          </Box>
        </DialogContent>

        <DialogActions sx={{ justifyContent: 'center', pb: 3, px: 3, gap: 1, flexWrap: 'wrap' }}>
          <Button onClick={handleClose} sx={{ fontFamily: '"Georgia", serif', color: '#777' }}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirmOrder}
            disabled={!isFormValid}
            sx={{
              backgroundColor: '#E91E8C',
              color: '#fff',
              borderRadius: '30px',
              px: 3,
              py: 1,
              fontFamily: '"Georgia", serif',
              fontWeight: 600,
              fontSize: '0.85rem',
              '&:hover': { backgroundColor: '#C2185B' },
              '&.Mui-disabled': { backgroundColor: '#F0C0D0', color: '#fff' },
            }}
          >
            Proceed to Checkout
          </Button>
          <Button
            onClick={handleAddToCart}
            disabled={!isFormValid}
            startIcon={<ShoppingCartOutlinedIcon />}
            sx={{
              border: '2px solid #4A0E4E',
              borderRadius: '30px',
              color: 'var(--text-purple)',
              px: 3,
              py: 1,
              fontFamily: '"Georgia", serif',
              fontWeight: 600,
              fontSize: '0.85rem',
              '&:hover': { backgroundColor: '#4A0E4E', color: '#fff', borderColor: '#4A0E4E' },
              '&.Mui-disabled': { opacity: 0.5 },
            }}
          >
            Add to Cart
          </Button>
        </DialogActions>
      </Dialog>

      {/* Sign In Prompt */}
      <SignInPrompt
        open={signInPromptOpen}
        onClose={() => setSignInPromptOpen(false)}
      />

      {/* Full-screen zoom dialog */}
      <Dialog
        open={zoomOpen}
        onClose={() => setZoomOpen(false)}
        maxWidth={false}
        fullWidth
        PaperProps={{
          sx: {
            backgroundColor: '#000',
            borderRadius: 0,
            maxWidth: '100vw',
            maxHeight: '100vh',
            m: 0,
          },
        }}
      >
        <Box sx={{ position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '80vh' }}>
          <IconButton
            onClick={() => setZoomOpen(false)}
            sx={{ position: 'absolute', top: 16, right: 16, color: '#fff', zIndex: 1 }}
          >
            <CloseIcon sx={{ fontSize: 32 }} />
          </IconButton>
          <Box
            component="img"
            src={product.image}
            alt={product.name}
            sx={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain' }}
          />
        </Box>
      </Dialog>
    </>
  );
}
