import { useState } from 'react';
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
import { pressOnNailShapes, pressOnQuantities } from '../data/products';
import { useCart } from '../context/CartContext';
import NailBedSizeInput from './NailBedSizeInput';

const presetSizes = ['XS', 'S', 'M', 'L'];

export default function ProductQuickView({ open, onClose, product, category, onAddedToCart }) {
  const { addPressOn } = useCart();
  const [zoomOpen, setZoomOpen] = useState(false);
  const [presetSize, setPresetSize] = useState('');
  const [nailShape, setNailShape] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [nailBedSize, setNailBedSize] = useState('');
  const [error, setError] = useState('');

  if (!product || !category) return null;

  const isReadyMade = !!category.readyMade;
  const maxQty = isReadyMade ? (product.stock || 1) : 5;

  const handleClose = () => {
    setPresetSize('');
    setNailShape('');
    setQuantity(1);
    setNailBedSize('');
    setError('');
    onClose();
  };

  const handleAddToCart = () => {
    if (isReadyMade && !presetSize) {
      setError('Please select a preset size.');
      return;
    }
    if (!isReadyMade && !nailShape) {
      setError('Please select a nail shape.');
      return;
    }

    addPressOn({
      productId: product.id,
      name: product.name,
      price: product.price,
      type: product.type || '',
      nailShape: nailShape || product.shape || '',
      quantity,
      nailBedSize: nailBedSize || '',
      presetSize: presetSize || '',
      orderingForOthers: false,
      otherPeople: [],
      customerName: '',
      categoryId: category.id,
      readyMade: isReadyMade,
      stock: product.stock,
    });

    handleClose();
    onAddedToCart?.();
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
              <Chip
                label={`₦${product.price.toLocaleString()}`}
                sx={{ backgroundColor: '#E91E8C', color: '#fff', fontFamily: '"Georgia", serif', fontWeight: 700, fontSize: '0.95rem' }}
              />
            </Box>

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
                  Nail Bed Sizes (optional)
                </Typography>
                <NailBedSizeInput value={nailBedSize} onChange={setNailBedSize} />
              </Box>
            )}

            {error && (
              <Typography sx={{ color: '#d32f2f', fontSize: '0.85rem', mt: 1 }}>
                {error}
              </Typography>
            )}
          </Box>
        </DialogContent>

        <DialogActions sx={{ justifyContent: 'center', pb: 3, px: 3 }}>
          <Button onClick={handleClose} sx={{ fontFamily: '"Georgia", serif', color: '#777' }}>
            Cancel
          </Button>
          <Button
            onClick={handleAddToCart}
            sx={{
              backgroundColor: '#E91E8C',
              color: '#fff',
              borderRadius: '30px',
              px: 4,
              py: 1,
              fontFamily: '"Georgia", serif',
              fontWeight: 600,
              fontSize: '0.9rem',
              '&:hover': { backgroundColor: '#C2185B' },
            }}
          >
            Add to Cart
          </Button>
        </DialogActions>
      </Dialog>

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
