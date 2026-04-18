import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Container, Button, TextField,
  FormControl, InputLabel, Select, MenuItem,
  Divider, CircularProgress, LinearProgress, InputAdornment,
} from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import PaletteIcon from '@mui/icons-material/Palette';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { ref as storageRef, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { saveOrder } from '../lib/orderService';

const ff = '"Georgia", serif';
const MAX_PHOTOS = 5;

function resolveColorName(name) {
  const trimmed = name.trim();
  if (!trimmed) return null;
  try {
    const el = document.createElement('div');
    el.style.color = 'transparent';
    document.body.appendChild(el);
    el.style.color = trimmed;
    const computed = window.getComputedStyle(el).color;
    document.body.removeChild(el);
    if (computed === 'rgba(0, 0, 0, 0)') return null;
    const m = computed.match(/(\d+),\s*(\d+),\s*(\d+)/);
    if (!m) return null;
    return `#${[m[1], m[2], m[3]].map((n) => parseInt(n).toString(16).padStart(2, '0')).join('')}`;
  } catch { return null; }
}

const PRODUCT_TYPES = ['Footwear', 'Bag', 'Belt', 'Wallet', 'Accessory', 'Other'];
const EU_SIZES = Array.from({ length: 19 }, (_, i) => 32 + i);
const PRESET_SWATCHES = [
  { name: 'Black',    hex: '#1a1a1a' },
  { name: 'Brown',    hex: '#7B4319' },
  { name: 'Tan',      hex: '#C4965A' },
  { name: 'Nude',     hex: '#D4A882' },
  { name: 'Burgundy', hex: '#800020' },
  { name: 'Navy',     hex: '#001F5B' },
  { name: 'White',    hex: '#F5F5F5' },
  { name: 'Red',      hex: '#e3242b' },
];

async function uploadPhoto(file, uid, index) {
  const ext = file.name.split('.').pop();
  const path = `custom-orders/${uid || 'anon'}/${Date.now()}_${index}.${ext}`;
  const sRef = storageRef(storage, path);
  return new Promise((resolve, reject) => {
    const task = uploadBytesResumable(sRef, file);
    task.on('state_changed', null, reject, async () => {
      const url = await getDownloadURL(task.snapshot.ref);
      resolve(url);
    });
  });
}

export default function CustomOrderPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const fileInputRef = useRef(null);
  const dropRef = useRef(null);

  const [productType, setProductType] = useState('');
  const [colorText, setColorText]     = useState('');
  const [colorHex, setColorHex]       = useState('#7B4319');
  const [quantity, setQuantity]       = useState(1);
  const [euSize, setEuSize]           = useState('');
  const [notes, setNotes]             = useState('');
  const [name, setName]               = useState(user?.displayName || '');
  const [phone, setPhone]             = useState('');
  const [email, setEmail]             = useState(user?.email || '');
  const [photos, setPhotos]           = useState([]); // { file, preview }
  const [errors, setErrors]           = useState({});
  const [submitting, setSubmitting]   = useState(false);
  const [submitted, setSubmitted]     = useState(false);
  const [savedOrderId, setSavedOrderId] = useState(null);
  const [dragOver, setDragOver]       = useState(false);

  const isFootwear = productType === 'Footwear';

  const validate = () => {
    const e = {};
    if (!productType) e.productType = 'Please select a product type';
    if (!colorText.trim()) e.color = 'Please describe your colour preference';
    if (quantity < 1) e.quantity = 'Quantity must be at least 1';
    if (isFootwear && !euSize) e.euSize = 'Please select your shoe size';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const addFiles = useCallback((files) => {
    const remaining = MAX_PHOTOS - photos.length;
    if (remaining <= 0) return;
    const valid = Array.from(files)
      .filter((f) => f.type.startsWith('image/'))
      .slice(0, remaining);
    const newPhotos = valid.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));
    setPhotos((prev) => [...prev, ...newPhotos]);
  }, [photos.length]);

  const removePhoto = (index) => {
    setPhotos((prev) => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    addFiles(e.dataTransfer.files);
  }, [addFiles]);

  const handleDragOver = (e) => { e.preventDefault(); setDragOver(true); };
  const handleDragLeave = () => setDragOver(false);

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);

    try {
      // Upload photos to Firebase Storage
      const photoUrls = await Promise.all(
        photos.map((p, i) => uploadPhoto(p.file, user?.uid, i))
      );

      const colorDisplay = `${colorText.trim()} / ${colorHex}`;

      // Save order to Firestore if authenticated
      let orderId = null;
      if (user?.uid) {
        const orderData = {
          type: 'custom',
          customerName: name.trim() || user.displayName || 'Customer',
          email: email.trim() || user.email || '',
          phone: phone.trim(),
          productType,
          color: colorDisplay,
          quantity,
          ...(isFootwear && euSize ? { euSize } : {}),
          notes: notes.trim(),
          photoUrls,
          total: 0,
          items: [{ name: `Custom ${productType}`, quantity, color: colorDisplay }],
          status: 'pending',
        };
        const docRef = await saveOrder(user.uid, orderData);
        orderId = docRef.id;
        setSavedOrderId(orderId);
      }

      // Build WhatsApp message
      const lines = [
        'Hello PerfectFooties! I\u2019d like to place a custom order:',
        '',
      ];
      if (orderId) lines.push(`\u2022 Order Ref: ${orderId}`);
      if (name.trim()) lines.push(`\u2022 Name: ${name.trim()}`);
      if (phone.trim()) lines.push(`\u2022 Phone: ${phone.trim()}`);
      lines.push(
        `\u2022 Product Type: ${productType}`,
        `\u2022 Colour: ${colorDisplay}`,
        `\u2022 Quantity: ${quantity}`,
      );
      if (isFootwear && euSize) lines.push(`\u2022 Shoe Size (EU): ${euSize}`);
      if (notes.trim()) lines.push(`\u2022 Notes: ${notes.trim()}`);
      if (photoUrls.length > 0) {
        lines.push('', '\u2022 Reference Photos:');
        photoUrls.forEach((url, i) => lines.push(`  ${i + 1}. ${url}`));
      }
      lines.push('', 'Awaiting your guidance on measurements and payment. Thank you!');

      const message = lines.join('\n');
      const waUrl = `https://wa.me/2348073637911?text=${encodeURIComponent(message)}`;
      const a = document.createElement('a');
      a.href = waUrl;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      setSubmitted(true);
    } catch (err) {
      console.error('Custom order submission error:', err);
      setErrors({ submit: 'Something went wrong. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  const inputSx = {
    '& .MuiOutlinedInput-root': {
      borderRadius: 2,
      '& fieldset': { borderColor: '#E8D5B0' },
      '&:hover fieldset': { borderColor: '#e3242b' },
      '&.Mui-focused fieldset': { borderColor: '#e3242b' },
    },
    '& .MuiInputLabel-root.Mui-focused': { color: '#e3242b' },
  };

  if (submitted) {
    return (
      <Box sx={{ pt: 12, pb: 10, minHeight: '100vh', backgroundColor: '#FFF8F0', display: 'flex', alignItems: 'center' }}>
        <Container maxWidth="sm">
          <Box sx={{ textAlign: 'center', p: 4, backgroundColor: '#fff', borderRadius: 4, border: '1px solid #E8D5B0' }}>
            <CheckCircleIcon sx={{ fontSize: 64, color: '#e3242b', mb: 2 }} />
            <Typography sx={{ fontFamily: ff, fontWeight: 700, fontSize: '1.8rem', color: '#e3242b', mb: 1 }}>
              Order Submitted!
            </Typography>
            {savedOrderId && (
              <Typography sx={{ fontSize: '0.85rem', color: 'var(--text-muted)', mb: 1 }}>
                Order Reference: <strong>{savedOrderId}</strong>
              </Typography>
            )}
            <Typography sx={{ fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.7, mb: 3 }}>
              Your order details have been sent to our team on WhatsApp. We'll be in touch to confirm measurements, pricing, and payment.
            </Typography>
            <Button
              onClick={() => navigate('/shop')}
              sx={{
                fontFamily: ff, fontWeight: 700, textTransform: 'none',
                borderRadius: '30px', px: 4, py: 1.2,
                background: 'linear-gradient(135deg, #e3242b, #b81b21)', color: '#fff',
                '&:hover': { background: 'linear-gradient(135deg, #b81b21, #8a1218)' },
              }}
            >
              Continue Shopping
            </Button>
          </Box>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ pt: 12, pb: { xs: 14, md: 10 }, minHeight: '100vh', backgroundColor: '#FFF8F0' }}>
      {/* Back */}
      <Box sx={{ px: { xs: 2, sm: 4 }, mb: 2 }}>
        <Button
          startIcon={<ArrowBackIosNewIcon sx={{ fontSize: '0.75rem !important' }} />}
          onClick={() => navigate('/shop')}
          sx={{
            fontFamily: ff, fontWeight: 600, fontSize: '0.85rem',
            color: 'var(--text-muted)', textTransform: 'none',
            px: 1.5, py: 0.6, borderRadius: '20px',
            border: '1px solid #eee', backgroundColor: '#fff',
            '&:hover': { borderColor: '#e3242b', color: '#e3242b' },
          }}
        >
          Back to Shop
        </Button>
      </Box>

      <Container maxWidth="sm">
        {/* Hero banner */}
        <Box
          sx={{
            borderRadius: 4,
            background: 'linear-gradient(135deg, #1a0000 0%, #3d0000 50%, #e3242b 100%)',
            p: { xs: 3, sm: 4 },
            mb: 4,
            textAlign: 'center',
          }}
        >
          <AutoAwesomeIcon sx={{ color: '#FFD54F', fontSize: 32, mb: 1 }} />
          <Typography sx={{ fontFamily: ff, fontWeight: 700, fontSize: { xs: '1.6rem', sm: '2rem' }, color: '#fff', mb: 0.5 }}>
            Custom Order
          </Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.75)', fontSize: '0.92rem', lineHeight: 1.7 }}>
            Tell us what you have in mind. We'll handle the craftsmanship — you handle the vision.
          </Typography>
        </Box>

        {/* Form card */}
        <Box sx={{ backgroundColor: '#fff', borderRadius: 4, border: '1px solid #E8D5B0', p: { xs: 2.5, sm: 3.5 } }}>

          {/* Contact info */}
          <Typography sx={{ fontFamily: ff, fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)', mb: 2 }}>
            Your Contact Details
          </Typography>
          <TextField
            fullWidth size="small" label="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            sx={{ mb: 2, ...inputSx }}
          />
          <TextField
            fullWidth size="small" label="Phone Number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="e.g. 08012345678"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Typography sx={{ fontSize: '0.85rem', color: '#888', fontWeight: 600, mr: 0.5 }}>+234</Typography>
                </InputAdornment>
              ),
            }}
            sx={{ mb: 2, ...inputSx }}
          />
          <TextField
            fullWidth size="small" label="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            sx={{ mb: 3, ...inputSx }}
          />

          <Divider sx={{ borderColor: '#E8D5B0', mb: 3 }} />

          {/* Order details heading */}
          <Typography sx={{ fontFamily: ff, fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)', mb: 2 }}>
            Order Details
          </Typography>

          {/* Product Type */}
          <FormControl fullWidth size="small" sx={{ mb: 3, ...inputSx }}>
            <InputLabel sx={{ '&.Mui-focused': { color: '#e3242b' } }}>Product Type *</InputLabel>
            <Select
              value={productType}
              onChange={(e) => { setProductType(e.target.value); setErrors((er) => ({ ...er, productType: undefined, euSize: undefined })); }}
              label="Product Type *"
              sx={{ borderRadius: 2, fontFamily: ff }}
            >
              {PRODUCT_TYPES.map((t) => (
                <MenuItem key={t} value={t} sx={{ fontFamily: ff }}>{t}</MenuItem>
              ))}
            </Select>
            {errors.productType && <Typography sx={{ color: '#e3242b', fontSize: '0.75rem', mt: 0.5 }}>{errors.productType}</Typography>}
          </FormControl>

          {/* Colour */}
          <Box sx={{ mb: 3 }}>
            <Typography sx={{ fontFamily: ff, fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)', mb: 1, display: 'flex', alignItems: 'center', gap: 0.7 }}>
              <PaletteIcon sx={{ fontSize: 16, color: '#e3242b' }} />
              Colour Preference *
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1.5 }}>
              {PRESET_SWATCHES.map((s) => (
                <Box
                  key={s.name}
                  onClick={() => { setColorText(s.name); setColorHex(s.hex); setErrors((er) => ({ ...er, color: undefined })); }}
                  sx={{
                    width: 32, height: 32, borderRadius: '50%', cursor: 'pointer',
                    backgroundColor: s.hex,
                    border: colorHex === s.hex ? '3px solid #e3242b' : '2px solid #E8D5B0',
                    transition: 'border 0.15s',
                    '&:hover': { border: '3px solid #e3242b' },
                    ...(s.hex === '#F5F5F5' && { boxShadow: 'inset 0 0 0 1px #ccc' }),
                  }}
                  title={s.name}
                />
              ))}
            </Box>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
              <TextField
                fullWidth size="small"
                placeholder="e.g. Forest Green, Cobalt Blue…"
                value={colorText}
                onChange={(e) => { const v = e.target.value; setColorText(v); const hex = resolveColorName(v); if (hex) setColorHex(hex); setErrors((er) => ({ ...er, color: undefined })); }}
                error={!!errors.color}
                sx={inputSx}
              />
              <Box component="input"
                type="color"
                value={colorHex}
                onChange={(e) => { setColorHex(e.target.value); setColorText(e.target.value); setErrors((er) => ({ ...er, color: undefined })); }}
                sx={{
                  width: 40, height: 40, borderRadius: 2, border: '2px solid #E8D5B0',
                  cursor: 'pointer', padding: 0, backgroundColor: 'transparent', flexShrink: 0,
                  '&::-webkit-color-swatch-wrapper': { padding: 0 },
                  '&::-webkit-color-swatch': { borderRadius: '6px', border: 'none' },
                }}
                title="Pick a custom colour"
              />
            </Box>
            {colorText && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                <Box sx={{ width: 14, height: 14, borderRadius: '50%', backgroundColor: colorHex, border: '1px solid #E8D5B0', flexShrink: 0 }} />
                <Typography sx={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{colorText} · {colorHex}</Typography>
              </Box>
            )}
            {errors.color && <Typography sx={{ color: '#e3242b', fontSize: '0.75rem', mt: 0.5 }}>{errors.color}</Typography>}
          </Box>

          {/* Quantity */}
          <TextField
            fullWidth size="small" label="Quantity *" type="number"
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
            inputProps={{ min: 1 }}
            error={!!errors.quantity}
            helperText={errors.quantity || ''}
            sx={{ mb: 3, ...inputSx }}
          />

          {/* Shoe size */}
          {isFootwear && (
            <FormControl fullWidth size="small" sx={{ mb: 3, ...inputSx }}>
              <InputLabel sx={{ '&.Mui-focused': { color: '#e3242b' } }}>Foot Length / EU Size *</InputLabel>
              <Select
                value={euSize}
                onChange={(e) => { setEuSize(e.target.value); setErrors((er) => ({ ...er, euSize: undefined })); }}
                label="Foot Length / EU Size *"
                sx={{ borderRadius: 2, fontFamily: ff }}
              >
                {EU_SIZES.map((s) => (
                  <MenuItem key={s} value={s} sx={{ fontFamily: ff }}>EU {s}</MenuItem>
                ))}
              </Select>
              {errors.euSize && <Typography sx={{ color: '#e3242b', fontSize: '0.75rem', mt: 0.5 }}>{errors.euSize}</Typography>}
            </FormControl>
          )}

          {/* Notes */}
          <TextField
            fullWidth
            label="Special Requests / Notes"
            placeholder="Describe any specific design details, hardware preferences, monogram, references…"
            multiline rows={4}
            value={notes}
            onChange={(e) => setNotes(e.target.value.slice(0, 500))}
            sx={{ mb: 0.5, ...inputSx }}
          />
          <Typography sx={{ fontSize: '0.72rem', color: '#aaa', textAlign: 'right', mb: 3 }}>{notes.length}/500</Typography>

          <Divider sx={{ borderColor: '#E8D5B0', mb: 3 }} />

          {/* Photo upload */}
          <Typography sx={{ fontFamily: ff, fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-main)', mb: 0.5, display: 'flex', alignItems: 'center', gap: 0.7 }}>
            <AddPhotoAlternateIcon sx={{ fontSize: 18, color: '#e3242b' }} />
            Reference Photos (optional, up to {MAX_PHOTOS})
          </Typography>
          <Typography sx={{ fontSize: '0.78rem', color: 'var(--text-muted)', mb: 1.5, lineHeight: 1.6 }}>
            Upload inspiration images so our craftsmen understand your vision. You can also share more photos via WhatsApp after submitting.
          </Typography>

          {/* Drop zone */}
          {photos.length < MAX_PHOTOS && (
            <Box
              ref={dropRef}
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              sx={{
                border: `2px dashed ${dragOver ? '#e3242b' : '#E8D5B0'}`,
                borderRadius: 3, p: 3, textAlign: 'center', cursor: 'pointer',
                backgroundColor: dragOver ? 'rgba(227,36,43,0.04)' : 'rgba(232,213,176,0.08)',
                transition: 'all 0.2s',
                mb: 2,
                '&:hover': { borderColor: '#e3242b', backgroundColor: 'rgba(227,36,43,0.04)' },
              }}
            >
              <AddPhotoAlternateIcon sx={{ fontSize: 32, color: dragOver ? '#e3242b' : '#ccc', mb: 0.5 }} />
              <Typography sx={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Click or drag images here
              </Typography>
              <Typography sx={{ fontSize: '0.72rem', color: '#aaa', mt: 0.3 }}>
                {MAX_PHOTOS - photos.length} slot{MAX_PHOTOS - photos.length !== 1 ? 's' : ''} remaining
              </Typography>
            </Box>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            style={{ display: 'none' }}
            onChange={(e) => { addFiles(e.target.files); e.target.value = ''; }}
          />

          {/* Photo previews */}
          {photos.length > 0 && (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mb: 3 }}>
              {photos.map((p, i) => (
                <Box
                  key={i}
                  sx={{ position: 'relative', width: 80, height: 80, borderRadius: 2, overflow: 'hidden', border: '2px solid #E8D5B0' }}
                >
                  <Box
                    component="img"
                    src={p.preview}
                    alt={`ref ${i + 1}`}
                    sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                  <Box
                    onClick={() => removePhoto(i)}
                    sx={{
                      position: 'absolute', top: 2, right: 2,
                      width: 20, height: 20, borderRadius: '50%',
                      backgroundColor: 'rgba(0,0,0,0.6)', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      '&:hover': { backgroundColor: '#e3242b' },
                    }}
                  >
                    <CloseIcon sx={{ fontSize: 12, color: '#fff' }} />
                  </Box>
                </Box>
              ))}
            </Box>
          )}

          <Divider sx={{ borderColor: '#E8D5B0', mb: 3 }} />

          {/* Info note */}
          <Box sx={{ mb: 3, p: 2, borderRadius: 2, backgroundColor: 'rgba(227,36,43,0.05)', border: '1px solid rgba(227,36,43,0.18)' }}>
            <Typography sx={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.7 }}>
              After submitting, our team will reach out via WhatsApp to discuss measurements, confirm details, and arrange payment. Production begins once everything is confirmed.
            </Typography>
          </Box>

          {errors.submit && (
            <Typography sx={{ color: '#e3242b', fontSize: '0.82rem', mb: 2, textAlign: 'center' }}>{errors.submit}</Typography>
          )}

          <Button
            fullWidth
            onClick={handleSubmit}
            disabled={submitting}
            startIcon={submitting ? <CircularProgress size={18} sx={{ color: '#fff' }} /> : <WhatsAppIcon />}
            sx={{
              fontFamily: ff, fontWeight: 700, fontSize: '1rem',
              textTransform: 'none', borderRadius: '30px', py: 1.5,
              backgroundColor: '#25D366', color: '#fff',
              '&:hover': { backgroundColor: '#1dbd5c' },
              '&:disabled': { backgroundColor: '#a5d6b0', color: '#fff' },
            }}
          >
            {submitting ? 'Saving & Opening WhatsApp…' : 'Confirm Custom Order on WhatsApp'}
          </Button>

          <Typography sx={{ textAlign: 'center', fontSize: '0.75rem', color: '#aaa', mt: 1.5 }}>
            Opens WhatsApp with your order details pre-filled
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}
