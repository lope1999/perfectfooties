import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Container, Button, TextField,
  FormControl, InputLabel, Select, MenuItem,
  Divider, Chip,
} from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import PaletteIcon from '@mui/icons-material/Palette';

const ff = '"Georgia", serif';

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

const EU_SIZES = Array.from({ length: 19 }, (_, i) => 32 + i); // 32–50

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

export default function CustomOrderPage() {
  const navigate = useNavigate();

  const [productType, setProductType] = useState('');
  const [colorText, setColorText]     = useState('');
  const [colorHex, setColorHex]       = useState('#7B4319');
  const [quantity, setQuantity]       = useState(1);
  const [euSize, setEuSize]           = useState('');
  const [notes, setNotes]             = useState('');
  const [errors, setErrors]           = useState({});

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

  const handleSubmit = () => {
    if (!validate()) return;

    const colorDisplay = `${colorText.trim()} / ${colorHex}`;

    const lines = [
      'Hello PerfectFooties! I\u2019d like to place a custom order:',
      '',
      `\u2022 Product Type: ${productType}`,
      `\u2022 Colour: ${colorDisplay}`,
      `\u2022 Quantity: ${quantity}`,
    ];

    if (isFootwear && euSize) {
      lines.push(`\u2022 Shoe Size (EU): ${euSize}`);
    }

    if (notes.trim()) {
      lines.push(`\u2022 Notes: ${notes.trim()}`);
    }

    lines.push('');
    lines.push('Awaiting your guidance on measurements, pictures and payment. Thank you!');

    const message = lines.join('\n');
    const url = `https://wa.me/2348073637911?text=${encodeURIComponent(message)}`;
    const a = document.createElement('a');
    a.href = url;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
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

            {/* Preset swatches */}
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

            {/* Text + color picker row */}
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
              <TextField
                fullWidth
                size="small"
                placeholder="e.g. Forest Green, Cobalt Blue…"
                value={colorText}
                onChange={(e) => { const v = e.target.value; setColorText(v); const hex = resolveColorName(v); if (hex) setColorHex(hex); setErrors((er) => ({ ...er, color: undefined })); }}
                error={!!errors.color}
                sx={inputSx}
              />
              <Box sx={{ position: 'relative', flexShrink: 0 }}>
                <Box
                  component="input"
                  type="color"
                  value={colorHex}
                  onChange={(e) => { setColorHex(e.target.value); setColorText(e.target.value); setErrors((er) => ({ ...er, color: undefined })); }}
                  sx={{
                    width: 40, height: 40, borderRadius: 2, border: '2px solid #E8D5B0',
                    cursor: 'pointer', padding: 0, backgroundColor: 'transparent',
                    '&::-webkit-color-swatch-wrapper': { padding: 0 },
                    '&::-webkit-color-swatch': { borderRadius: '6px', border: 'none' },
                  }}
                  title="Pick a custom colour"
                />
              </Box>
            </Box>
            {/* Live preview */}
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
            fullWidth
            size="small"
            label="Quantity *"
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
            inputProps={{ min: 1 }}
            error={!!errors.quantity}
            helperText={errors.quantity || ''}
            sx={{ mb: 3, ...inputSx }}
          />

          {/* Shoe size — footwear only */}
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
            multiline
            rows={4}
            value={notes}
            onChange={(e) => setNotes(e.target.value.slice(0, 500))}
            sx={{ mb: 0.5, ...inputSx }}
          />
          <Typography sx={{ fontSize: '0.72rem', color: '#aaa', textAlign: 'right', mb: 3 }}>{notes.length}/500</Typography>

          <Divider sx={{ borderColor: '#E8D5B0', mb: 3 }} />

          {/* Info note */}
          <Box sx={{ mb: 3, p: 2, borderRadius: 2, backgroundColor: 'rgba(0,255,255,0.06)', border: '1px solid rgba(0,255,255,0.2)' }}>
            <Typography sx={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.7 }}>
              After submitting, our team will reach out via WhatsApp to discuss measurements, reference photos, and payment. Production begins once details are confirmed.
            </Typography>
          </Box>

          <Button
            fullWidth
            onClick={handleSubmit}
            startIcon={<WhatsAppIcon />}
            sx={{
              fontFamily: ff, fontWeight: 700, fontSize: '1rem',
              textTransform: 'none', borderRadius: '30px', py: 1.5,
              backgroundColor: '#25D366', color: '#fff',
              '&:hover': { backgroundColor: '#1dbd5c' },
            }}
          >
            Confirm Custom Order on WhatsApp
          </Button>

          <Typography sx={{ textAlign: 'center', fontSize: '0.75rem', color: '#aaa', mt: 1.5 }}>
            Opens WhatsApp with your order details pre-filled
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}
