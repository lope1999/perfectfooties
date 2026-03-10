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
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ZoomInIcon from '@mui/icons-material/ZoomIn';
import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined';
import { pressOnNailShapes, pressOnQuantities } from '../data/products';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { saveNailBedSizes, fetchNailBedSizes } from '../lib/orderService';
import NailBedSizeInput from './NailBedSizeInput';
import SignInPrompt from './SignInPrompt';
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

  useEffect(() => {
    if (user?.displayName && !customerName) setCustomerName(user.displayName);
    if (user?.uid && open) {
      fetchNailBedSizes(user.uid).then((saved) => {
        if (saved && !nailBedSize) setNailBedSize(saved);
      }).catch(() => {});
    }
  }, [user, open]);

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
    setOrderLoading(false);
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
    navigate('/checkout');
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
            <Typography sx={{ color: '#555', fontSize: '0.9rem', lineHeight: 1.7, mb: 2 }}>
              {product.description}
            </Typography>

            {/* Info chips */}
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 2 }}>
              {product.shape && (
                <Chip label={product.shape} size="small" sx={{ backgroundColor: '#F3E5F6', color: '#4A0E4E', fontWeight: 600 }} />
              )}
              {product.length && (
                <Chip label={product.length} size="small" sx={{ backgroundColor: '#F3E5F6', color: '#4A0E4E', fontWeight: 600 }} />
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
                <TextField
                  select
                  size="small"
                  fullWidth
                  value={nailShape}
                  onChange={(e) => { setNailShape(e.target.value); setError(''); }}
                  placeholder="Select shape"
                  sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                >
                  {pressOnNailShapes.map((shape) => (
                    <MenuItem key={shape} value={shape}>{shape}</MenuItem>
                  ))}
                </TextField>

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
              color: '#4A0E4E',
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
