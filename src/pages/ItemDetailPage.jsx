import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box, Typography, Container, Button, Chip,
  Grid, IconButton, CircularProgress, Divider,
  Dialog, DialogTitle, DialogContent, DialogActions,
  FormControl, InputLabel, Select, MenuItem,
  Table, TableBody, TableCell, TableHead, TableRow,
  Snackbar, Alert, Collapse, Menu, Tooltip,
} from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowBackIosIcon from '@mui/icons-material/ArrowBackIos';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import HandymanIcon from '@mui/icons-material/Handyman';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined';
import StraightenIcon from '@mui/icons-material/Straighten';
import AddShoppingCartIcon from '@mui/icons-material/AddShoppingCart';
import PrintIcon from '@mui/icons-material/Print';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import WaterDropOutlinedIcon from '@mui/icons-material/WaterDropOutlined';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import { getCollection, getItem } from '../lib/collectionService';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';

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

const COLORS_DEFAULT = ['Black', 'Brown', 'Tan', 'Nude', 'Burgundy', 'Navy'];

const COLOR_HEX = {
  'Black': '#1a1a1a',
  'Brown': '#7B4319',
  'Tan': '#C4965A',
  'Nude': '#D4A882',
  'Burgundy': '#800020',
  'Navy': '#001F5B',
  'White': '#d0d0d0',
  'Gold': '#B8860B',
  'Silver': '#A8A9AD',
  'Cognac': '#9C4A1A',
  'Red': '#e3242b',
  'Grey': '#808080',
  'Beige': '#F5DEB3',
  'Camel': '#C19A6B',
  'Chocolate Brown': '#5C3317',
  'Natural': '#E8D5B0',
};

// Shoe sizing is controlled per-collection via the admin panel (collection.requiresLength field)

const EU_SIZES = Array.from({ length: 19 }, (_, i) => 32 + i); // 32–50

const SIZE_GUIDE = [
  { eu: 35, uk: '2.5',        usM: '3',  usW: '4.5',  cm: '22.2', mm: '222' },
  { eu: 36, uk: '3.5',        usM: '4',  usW: '5.5',  cm: '22.9', mm: '229' },
  { eu: 37, uk: '4',          usM: '4.5',usW: '6',    cm: '23.6', mm: '236' },
  { eu: 38, uk: '5',          usM: '5.5',usW: '7',    cm: '24.3', mm: '243' },
  { eu: 39, uk: '6',          usM: '6.5',usW: '7.5',  cm: '25.0', mm: '250' },
  { eu: 40, uk: '6.5',        usM: '7',  usW: '8.5',  cm: '25.7', mm: '257' },
  { eu: 41, uk: '7.5',        usM: '8',  usW: '9.5',  cm: '26.4', mm: '264' },
  { eu: 42, uk: '8',          usM: '8.5',usW: '10',   cm: '27.1', mm: '271' },
  { eu: 43, uk: '9',          usM: '9.5',usW: '11',   cm: '27.9', mm: '279' },
  { eu: 44, uk: '9.5',        usM: '10', usW: '11.5', cm: '28.6', mm: '286' },
  { eu: 45, uk: '10.5',       usM: '11', usW: '12.5', cm: '29.3', mm: '293' },
  { eu: 46, uk: '11',         usM: '11.5',usW: '13',  cm: '30.0', mm: '300' },
  { eu: 47, uk: '12',         usM: '12.5',usW: '—',   cm: '30.7', mm: '307' },
  { eu: 48, uk: '12.5',       usM: '13', usW: '—',   cm: '31.4', mm: '314' },
  { eu: 49, uk: '13',         usM: '13.5',usW: '—',  cm: '32.1', mm: '321' },
  { eu: 50, uk: '14',         usM: '14', usW: '—',   cm: '32.8', mm: '328' },
];

function printSizeGuide() {
  const win = window.open('', '_blank', 'width=820,height=700');
  win.document.write(`<!DOCTYPE html><html><head><title>PerfectFooties — Shoe Size Guide</title>
<style>
  body{font-family:Georgia,serif;margin:40px;color:#333;max-width:720px}
  h1{color:#b81b21;border-bottom:2px solid #e3242b;padding-bottom:8px;font-size:1.5rem}
  h2{color:#444;font-size:1rem;margin-top:24px}
  table{border-collapse:collapse;width:100%;margin:16px 0}
  th{background:#FFF8F0;border:1px solid #E8D5B0;padding:8px 12px;text-align:left;font-weight:700;font-size:0.82rem}
  td{border:1px solid #E8D5B0;padding:7px 12px;font-size:0.82rem}
  tr:nth-child(even){background:#fafafa}
  ol{line-height:2.1;color:#555;padding-left:20px}
  .footer{margin-top:32px;font-size:0.78rem;color:#999;text-align:center}
  @media print{body{margin:20px}}
</style></head><body>
<h1>PerfectFooties — Shoe Size Guide</h1>
<h2>How to Measure Your Foot</h2>
<ol>
  <li>Place a blank sheet of paper on a hard floor against a wall.</li>
  <li>Stand barefoot with your heel touching the wall.</li>
  <li>Mark the tip of your longest toe with a pen.</li>
  <li>Measure from the wall to the mark in centimetres (cm).</li>
  <li>Use the CM column below to find your EU size.</li>
  <li>Measure both feet and use the larger measurement.</li>
</ol>
<h2>Size Conversion Table</h2>
<table>
  <tr><th>EU</th><th>UK</th><th>US (Men)</th><th>US (Women)</th><th>CM</th><th>MM</th></tr>
  ${SIZE_GUIDE.map(r => `<tr><td><strong>${r.eu}</strong></td><td>${r.uk}</td><td>${r.usM}</td><td>${r.usW}</td><td>${r.cm}</td><td>${r.mm}</td></tr>`).join('')}
</table>
<p class="footer">PerfectFooties — Handcrafted Leather Footwear &amp; Accessories · perfectfooties.com</p>
</body></html>`);
  win.document.close();
  win.focus();
  setTimeout(() => win.print(), 500);
}

function SizeGuideDialog({ open, onClose }) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth scroll="paper">
      <DialogTitle sx={{ fontFamily: ff, fontWeight: 700, fontSize: '1.1rem', borderBottom: '1px solid #E8D5B0' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <StraightenIcon sx={{ color: 'var(--accent-cyan)' }} />
          Shoe Size Guide
        </Box>
      </DialogTitle>
      <DialogContent sx={{ pt: 2 }}>
        <Typography sx={{ fontFamily: ff, fontWeight: 700, fontSize: '0.95rem', mb: 1, color: 'var(--text-main)' }}>
          How to Measure Your Foot
        </Typography>
        <Box component="ol" sx={{ color: 'var(--text-muted)', fontSize: '0.88rem', lineHeight: 1.9, pl: 2.5, mb: 3 }}>
          <li>Place a blank sheet of paper on a hard floor against a wall.</li>
          <li>Stand barefoot with your heel touching the wall.</li>
          <li>Mark the tip of your longest toe with a pen.</li>
          <li>Measure from the wall to the mark in centimetres (cm).</li>
          <li>Use the CM column below to find your EU size.</li>
          <li>Measure both feet and use the larger measurement.</li>
        </Box>
        <Typography sx={{ fontFamily: ff, fontWeight: 700, fontSize: '0.95rem', mb: 1, color: 'var(--text-main)' }}>
          Size Conversion Table
        </Typography>
        <Box sx={{ overflowX: 'auto' }}>
          <Table size="small" sx={{ '& th': { fontFamily: ff, fontWeight: 700, backgroundColor: 'var(--bg-soft)', fontSize: '0.8rem' }, '& td': { fontSize: '0.82rem' } }}>
            <TableHead>
              <TableRow>
                <TableCell>EU</TableCell>
                <TableCell>UK</TableCell>
                <TableCell>US (Men)</TableCell>
                <TableCell>US (Women)</TableCell>
                <TableCell>CM</TableCell>
                <TableCell>MM</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {SIZE_GUIDE.map((row) => (
                <TableRow key={row.eu} hover>
                  <TableCell sx={{ fontWeight: 700 }}>{row.eu}</TableCell>
                  <TableCell>{row.uk}</TableCell>
                  <TableCell>{row.usM}</TableCell>
                  <TableCell>{row.usW}</TableCell>
                  <TableCell>{row.cm}</TableCell>
                  <TableCell>{row.mm}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Box>
      </DialogContent>
      <DialogActions sx={{ borderTop: '1px solid #E8D5B0', px: 3, py: 1.5, justifyContent: 'space-between' }}>
        <Button
          startIcon={<PrintIcon sx={{ fontSize: '0.9rem !important' }} />}
          onClick={printSizeGuide}
          sx={{ fontFamily: ff, fontSize: '0.82rem', textTransform: 'none', color: 'var(--accent-cyan)', '&:hover': { backgroundColor: 'rgba(0,255,255,0.08)' } }}
        >
          Download / Print PDF
        </Button>
        <Button onClick={onClose} sx={{ fontFamily: ff, color: 'var(--text-muted)', textTransform: 'none' }}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}

export default function ItemDetailPage() {
  const { collectionId, itemId } = useParams();
  const navigate = useNavigate();
  const { addLeatherGood } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();

  const [col, setCol] = useState(null);
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);

  // Gallery state
  const [activeImg, setActiveImg] = useState(0);

  // Order form state
  const [selectedColor, setSelectedColor] = useState('');
  const [customColor, setCustomColor] = useState('');
  const [customColorHex, setCustomColorHex] = useState('#7B4319');
  const [customColorOpen, setCustomColorOpen] = useState(false);
  const [overflowMenuAnchor, setOverflowMenuAnchor] = useState(null);
  const [euSize, setEuSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [errors, setErrors] = useState({});

  // UI state
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  const [cartSnack, setCartSnack] = useState(false);
  const [wishlistSnack, setWishlistSnack] = useState({ open: false, added: false });
  const [careOpen, setCareOpen] = useState(false);

  const requiresLength = col?.requiresLength === true;

  useEffect(() => {
    const load = async () => {
      try {
        const [colData, itemData] = await Promise.allSettled([
          getCollection(collectionId),
          getItem(collectionId, itemId),
        ]);
        if (colData.status === 'fulfilled') setCol(colData.value);
        if (itemData.status === 'fulfilled') setItem(itemData.value);
        else console.error('getItem failed:', itemData.reason);
      } catch (err) {
        console.error('ItemDetailPage load error:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [collectionId, itemId]);

  if (loading) {
    return <Box sx={{ pt: 16, textAlign: 'center' }}><CircularProgress sx={{ color: 'var(--accent-cyan)' }} /></Box>;
  }

  if (!item) {
    return (
      <Box sx={{ pt: 16, textAlign: 'center' }}>
        <Typography sx={{ color: 'var(--text-muted)' }}>Item not found.</Typography>
        <Button onClick={() => navigate(`/shop/${collectionId}`)} sx={{ mt: 2 }}>Go Back</Button>
      </Box>
    );
  }

  const images = item.images?.length > 0 ? item.images : [];
  const colors = item.colors?.length > 0 ? item.colors : COLORS_DEFAULT;

  const activeColor = customColor || selectedColor;

  const validate = () => {
    const e = {};
    if (!activeColor) e.color = 'Please select a colour';
    if (requiresLength && !euSize) e.euSize = 'Please select your shoe size';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const buildCartItem = () => ({
    itemId: item.id,
    name: item.name,
    collectionId,
    collectionName: col?.name,
    price: item.price,
    image: images[0] || '',
    selectedColor: activeColor,
    euSize: requiresLength ? euSize : null,
    quantity,
  });

  const handleOrder = () => {
    if (!validate()) return;
    addLeatherGood(buildCartItem());
    navigate('/checkout');
  };

  const handleAddToCart = () => {
    if (!validate()) return;
    addLeatherGood(buildCartItem());
    setCartSnack(true);
  };

  const handleToggleWishlist = () => {
    const productId = item.id || itemId;
    if (isInWishlist(productId)) {
      removeFromWishlist(productId);
      setWishlistSnack({ open: true, added: false });
    } else {
      addToWishlist({
        productId,
        name: item.name,
        image: images[0] || '',
        categoryId: collectionId,
        collectionName: col?.name || '',
        price: item.price,
      });
      setWishlistSnack({ open: true, added: true });
    }
  };

  return (
    <Box sx={{ pt: 12, pb: { xs: 12, md: 8 } }}>
      <SizeGuideDialog open={sizeGuideOpen} onClose={() => setSizeGuideOpen(false)} />
      <Snackbar
        open={cartSnack}
        autoHideDuration={3000}
        onClose={() => setCartSnack(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setCartSnack(false)} severity="success" sx={{ fontFamily: ff, borderRadius: 2 }}>
          Added to cart! Continue shopping or go to checkout.
        </Alert>
      </Snackbar>
      <Snackbar
        open={wishlistSnack.open}
        autoHideDuration={2500}
        onClose={() => setWishlistSnack((s) => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setWishlistSnack((s) => ({ ...s, open: false }))} severity={wishlistSnack.added ? 'success' : 'info'} sx={{ fontFamily: ff, borderRadius: 2 }}>
          {wishlistSnack.added ? 'Saved to wishlist!' : 'Removed from wishlist.'}
        </Alert>
      </Snackbar>
      {/* Back */}
      <Box sx={{ px: { xs: 2, sm: 4 }, pb: 0 }}>
        <Button
          startIcon={<ArrowBackIosNewIcon sx={{ fontSize: '0.75rem !important' }} />}
          onClick={() => navigate(`/shop/${collectionId}`)}
          sx={{
            fontFamily: ff, fontWeight: 600, fontSize: '0.85rem',
            color: 'var(--text-muted)', textTransform: 'none',
            px: 1.5, py: 0.6, borderRadius: '20px',
            border: '1px solid #eee', backgroundColor: 'var(--bg-card)',
            '&:hover': { borderColor: '#e3242b', color: '#e3242b' },
          }}
        >
          {col?.name || 'Collection'}
        </Button>
      </Box>

      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Grid container spacing={6}>
          {/* ── Left: Image Gallery ── */}
          <Grid item xs={12} md={6}>
            {images.length > 0 ? (
              <Box>
                {/* Main image */}
                <Box sx={{ position: 'relative', borderRadius: 3, overflow: 'hidden', border: '1px solid #E8D5B0', mb: 2 }}>
                  <Box
                    component="img"
                    src={images[activeImg]}
                    alt={item.name}
                    sx={{ width: '100%', height: { xs: 320, md: 460 }, objectFit: 'cover', display: 'block' }}
                  />
                  {images.length > 1 && (
                    <>
                      <IconButton
                        onClick={() => setActiveImg((p) => (p - 1 + images.length) % images.length)}
                        sx={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', backgroundColor: 'rgba(0,0,0,0.4)', color: '#fff', '&:hover': { backgroundColor: 'rgba(0,0,0,0.65)' } }}
                        size="small"
                      >
                        <ArrowBackIosIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                      <IconButton
                        onClick={() => setActiveImg((p) => (p + 1) % images.length)}
                        sx={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', backgroundColor: 'rgba(0,0,0,0.4)', color: '#fff', '&:hover': { backgroundColor: 'rgba(0,0,0,0.65)' } }}
                        size="small"
                      >
                        <ArrowForwardIosIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </>
                  )}
                </Box>

                {/* Thumbnails */}
                {images.length > 1 && (
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    {images.map((img, i) => (
                      <Box
                        key={i}
                        component="img"
                        src={img}
                        alt={`${item.name} ${i + 1}`}
                        onClick={() => setActiveImg(i)}
                        sx={{
                          width: 72, height: 72, objectFit: 'cover', borderRadius: 2, cursor: 'pointer',
                          border: i === activeImg ? '2px solid var(--accent-cyan)' : '2px solid #E8D5B0',
                          transition: 'border-color 0.2s',
                          '&:hover': { borderColor: 'var(--accent-cyan)' },
                        }}
                      />
                    ))}
                  </Box>
                )}
              </Box>
            ) : (
              <Box sx={{ height: 400, backgroundColor: 'var(--bg-soft)', borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #E8D5B0' }}>
                <Typography sx={{ color: '#E8D5B0', fontFamily: ff }}>No images yet</Typography>
              </Box>
            )}
          </Grid>

          {/* ── Right: Info + Order Form ── */}
          <Grid item xs={12} md={6}>
            <Typography variant="h4" sx={{ fontFamily: ff, fontWeight: 700, color: 'var(--text-main)', mb: 0.5, fontSize: { xs: '1.5rem', md: '2rem' } }}>
              {item.name}
            </Typography>

            <Typography sx={{ color: 'var(--text-purple)', fontFamily: ff, fontWeight: 700, fontSize: '1.4rem', mb: 1 }}>
              ₦{Number(item.price).toLocaleString()}
            </Typography>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <CalendarMonthIcon sx={{ fontSize: 13, color: 'var(--text-muted)' }} />
                <Typography sx={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: ff, letterSpacing: 1, textTransform: 'uppercase' }}>Est. 2020</Typography>
              </Box>
              <Typography sx={{ color: '#E8D5B0', fontSize: '0.85rem' }}>|</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <HandymanIcon sx={{ fontSize: 13, color: 'var(--text-muted)' }} />
                <Typography sx={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: ff, letterSpacing: 1, textTransform: 'uppercase' }}>Made to Order</Typography>
              </Box>
            </Box>

            {item.description && (
              <Typography sx={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: 1.8, mb: 3 }}>
                {item.description}
              </Typography>
            )}

            <Divider sx={{ borderColor: '#E8D5B0', mb: 3 }} />

            {/* Colour selector */}
            <Box sx={{ mb: 3 }}>
              <Typography sx={{ fontFamily: ff, fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)', mb: 1.5 }}>
                Colour{activeColor && (
                  <span style={{ fontWeight: 400, color: COLOR_HEX[activeColor] || customColorHex || 'var(--accent-cyan)', marginLeft: 6 }}>
                    — {activeColor}
                  </span>
                )}
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {/* First 3 standard colors */}
                {colors.slice(0, 3).map((c) => {
                  const hex = COLOR_HEX[c] || '#888';
                  const isSelected = selectedColor === c && !customColor;
                  return (
                    <Chip
                      key={c}
                      label={c}
                      onClick={() => { setSelectedColor(c); setCustomColor(''); setCustomColorOpen(false); setErrors((e) => ({ ...e, color: undefined })); }}
                      icon={<Box sx={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: hex, border: hex === '#d0d0d0' || hex === '#E8D5B0' ? '1px solid #aaa' : 'none', flexShrink: 0 }} />}
                      sx={{
                        fontFamily: ff, fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer',
                        backgroundColor: isSelected ? 'rgba(0,255,255,0.12)' : 'transparent',
                        color: isSelected ? 'var(--accent-cyan)' : 'var(--text-main)',
                        border: `1.5px solid ${isSelected ? 'var(--accent-cyan)' : '#E8D5B0'}`,
                        '&:hover': { borderColor: 'var(--accent-cyan)', backgroundColor: 'rgba(0,255,255,0.08)' },
                        '& .MuiChip-icon': { ml: '8px', mr: '-4px' },
                      }}
                    />
                  );
                })}

                {/* Overflow chip: "+N more" */}
                {colors.length > 3 && (
                  <>
                    <Chip
                      label={`+${colors.length - 3} more`}
                      onClick={(e) => setOverflowMenuAnchor(e.currentTarget)}
                      sx={{
                        fontFamily: ff, fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer',
                        backgroundColor: colors.slice(3).includes(selectedColor) && !customColor ? 'rgba(0,255,255,0.12)' : 'transparent',
                        color: colors.slice(3).includes(selectedColor) && !customColor ? 'var(--accent-cyan)' : 'var(--text-muted)',
                        border: `1.5px solid ${colors.slice(3).includes(selectedColor) && !customColor ? 'var(--accent-cyan)' : '#E8D5B0'}`,
                        '&:hover': { borderColor: 'var(--accent-cyan)', backgroundColor: 'rgba(0,255,255,0.08)' },
                      }}
                    />
                    <Menu
                      anchorEl={overflowMenuAnchor}
                      open={Boolean(overflowMenuAnchor)}
                      onClose={() => setOverflowMenuAnchor(null)}
                      PaperProps={{ sx: { borderRadius: 2, border: '1px solid #E8D5B0', mt: 0.5 } }}
                    >
                      {colors.slice(3).map((c) => {
                        const hex = COLOR_HEX[c] || '#888';
                        return (
                          <MenuItem
                            key={c}
                            onClick={() => { setSelectedColor(c); setCustomColor(''); setCustomColorOpen(false); setOverflowMenuAnchor(null); setErrors((e) => ({ ...e, color: undefined })); }}
                            sx={{ fontFamily: ff, fontSize: '0.85rem', gap: 1.5, py: 1 }}
                          >
                            <Box sx={{ width: 14, height: 14, borderRadius: '50%', backgroundColor: hex, border: '1px solid #E8D5B0', flexShrink: 0 }} />
                            {c}
                          </MenuItem>
                        );
                      })}
                    </Menu>
                  </>
                )}

                {/* Custom color chip */}
                <Chip
                  label="Custom"
                  onClick={() => { setCustomColorOpen((v) => !v); setSelectedColor(''); }}
                  sx={{
                    fontFamily: ff, fontWeight: 600, fontSize: '0.8rem', cursor: 'pointer',
                    backgroundColor: customColor ? 'rgba(0,255,255,0.12)' : 'transparent',
                    color: customColor ? 'var(--accent-cyan)' : 'var(--text-muted)',
                    border: `1.5px dashed ${customColor ? 'var(--accent-cyan)' : '#E8D5B0'}`,
                    '&:hover': { borderColor: 'var(--accent-cyan)', backgroundColor: 'rgba(0,255,255,0.08)' },
                  }}
                />
              </Box>

              {/* Custom color input row */}
              <Collapse in={customColorOpen}>
                <Box sx={{ mt: 1.5, display: 'flex', gap: 1, alignItems: 'center' }}>
                  <Box
                    component="input"
                    type="text"
                    placeholder="e.g. Forest Green"
                    value={typeof customColor === 'string' && !customColor.startsWith('#') ? customColor : ''}
                    onChange={(e) => { const v = e.target.value; setCustomColor(v); const hex = resolveColorName(v); if (hex) setCustomColorHex(hex); setErrors((er) => ({ ...er, color: undefined })); }}
                    style={{
                      flex: 1, height: 36, borderRadius: 8, border: '1.5px solid #E8D5B0',
                      padding: '0 12px', fontFamily: ff, fontSize: '0.85rem',
                      outline: 'none', backgroundColor: '#fff',
                    }}
                  />
                  <Box
                    component="input"
                    type="color"
                    value={customColorHex}
                    onChange={(e) => { setCustomColorHex(e.target.value); setCustomColor(e.target.value); setErrors((er) => ({ ...er, color: undefined })); }}
                    style={{
                      width: 36, height: 36, borderRadius: 8, border: '1.5px solid #E8D5B0',
                      cursor: 'pointer', padding: 0, backgroundColor: 'transparent',
                    }}
                    title="Pick a colour"
                  />
                </Box>
                {customColor && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mt: 0.8 }}>
                    <Box sx={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: customColorHex, border: '1px solid #E8D5B0', flexShrink: 0 }} />
                    <Typography sx={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{customColor}</Typography>
                  </Box>
                )}
              </Collapse>

              {errors.color && <Typography sx={{ color: '#e3242b', fontSize: '0.78rem', mt: 0.5 }}>{errors.color}</Typography>}
            </Box>

            {/* Shoe size (footwear only) */}
            {requiresLength && (
              <Box sx={{ mb: 3 }}>
                <Typography sx={{ fontFamily: ff, fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)', mb: 1 }}>
                  Shoe Size (EU)
                </Typography>
                <FormControl size="small" error={!!errors.euSize} sx={{ width: 180 }}>
                  <InputLabel sx={{ fontFamily: ff }}>Select EU size</InputLabel>
                  <Select
                    value={euSize}
                    label="Select EU size"
                    onChange={(e) => { setEuSize(e.target.value); setErrors((er) => ({ ...er, euSize: undefined })); }}
                    sx={{ borderRadius: 2, fontFamily: ff, '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'var(--accent-cyan)' } }}
                  >
                    {EU_SIZES.map((s) => (
                      <MenuItem key={s} value={s} sx={{ fontFamily: ff }}>{s}</MenuItem>
                    ))}
                  </Select>
                  {errors.euSize && (
                    <Typography sx={{ color: '#e3242b', fontSize: '0.75rem', mt: 0.5 }}>{errors.euSize}</Typography>
                  )}
                </FormControl>
                <Box sx={{ mt: 1 }}>
                  <Button
                    size="small"
                    startIcon={<StraightenIcon sx={{ fontSize: '0.9rem !important' }} />}
                    onClick={() => setSizeGuideOpen(true)}
                    sx={{
                      fontFamily: ff, fontSize: '0.78rem', textTransform: 'none',
                      color: 'var(--accent-cyan)', px: 1, py: 0.3,
                      '&:hover': { backgroundColor: 'rgba(0,255,255,0.08)' },
                    }}
                  >
                    Size Guide
                  </Button>
                </Box>
              </Box>
            )}

            {/* Quantity */}
            <Box sx={{ mb: 3 }}>
              <Typography sx={{ fontFamily: ff, fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)', mb: 1 }}>
                Quantity
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <IconButton onClick={() => setQuantity((q) => Math.max(1, q - 1))} sx={{ border: '1.5px solid #E8D5B0', borderRadius: 2, p: 0.5 }}>
                  <ArrowBackIosIcon sx={{ fontSize: 14 }} />
                </IconButton>
                <Typography sx={{ fontFamily: ff, fontWeight: 700, fontSize: '1.1rem', minWidth: 24, textAlign: 'center' }}>{quantity}</Typography>
                <IconButton onClick={() => setQuantity((q) => q + 1)} sx={{ border: '1.5px solid #E8D5B0', borderRadius: 2, p: 0.5 }}>
                  <ArrowForwardIosIcon sx={{ fontSize: 14 }} />
                </IconButton>
              </Box>
            </Box>

            {/* Stock urgency badge */}
            {selectedColor && !customColor && (() => {
              const stock = item.colorStock?.[selectedColor];
              if (stock != null && stock <= 5 && stock > 0) {
                return (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, px: 1.5, py: 1, borderRadius: 2, backgroundColor: '#FFF3E0', border: '1px solid #FFCC80' }}>
                    <ErrorOutlineIcon sx={{ color: '#e65100', fontSize: 16 }} />
                    <Typography sx={{ fontSize: '0.82rem', color: '#e65100', fontWeight: 700 }}>
                      Only {stock} left in {selectedColor}!
                    </Typography>
                  </Box>
                );
              }
              if (stock === 0) {
                return (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, px: 1.5, py: 1, borderRadius: 2, backgroundColor: '#f5f5f5', border: '1px solid #ddd' }}>
                    <ErrorOutlineIcon sx={{ color: '#999', fontSize: 16 }} />
                    <Typography sx={{ fontSize: '0.82rem', color: '#999', fontWeight: 700 }}>
                      Out of stock in {selectedColor}
                    </Typography>
                  </Box>
                );
              }
              return null;
            })()}

            {/* Made-to-order note */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3, p: 1.5, borderRadius: 2, backgroundColor: 'rgba(227,36,43,0.05)', border: '1px solid rgba(227,36,43,0.18)' }}>
              <CheckCircleOutlineIcon sx={{ color: '#e3242b', fontSize: 18 }} />
              <Typography sx={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Made to order — 10–14 days production + 2–5 days shipping
              </Typography>
            </Box>

            {/* Care & Maintenance Guide */}
            {item.careGuide && (
              <Box sx={{ mb: 3, borderRadius: 2, border: '1px solid #E8D5B0', overflow: 'hidden' }}>
                <Box
                  onClick={() => setCareOpen((v) => !v)}
                  sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2, py: 1.2, cursor: 'pointer', backgroundColor: '#FFF8F0', '&:hover': { backgroundColor: '#FFF0E0' } }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <WaterDropOutlinedIcon sx={{ fontSize: 16, color: '#7B4319' }} />
                    <Typography sx={{ fontFamily: ff, fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-main)' }}>
                      Care & Maintenance
                    </Typography>
                  </Box>
                  <ExpandMoreIcon sx={{ fontSize: 18, color: 'var(--text-muted)', transform: careOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
                </Box>
                <Collapse in={careOpen}>
                  <Box sx={{ px: 2, py: 1.5, backgroundColor: '#fff' }}>
                    <Typography sx={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.8, whiteSpace: 'pre-line' }}>
                      {item.careGuide}
                    </Typography>
                  </Box>
                </Collapse>
              </Box>
            )}

            {/* Action Buttons */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {/* Order Now + heart always side-by-side */}
              <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                <Button
                  disabled={item.status === 'closed'}
                  onClick={handleOrder}
                  sx={{
                    flex: 1, borderRadius: '30px', fontFamily: ff, fontWeight: 700,
                    fontSize: '0.95rem', textTransform: 'none', py: 1.5,
                    backgroundColor: '#e3242b', color: '#fff',
                    '&:hover': { backgroundColor: '#b81b21' },
                    '&.Mui-disabled': { backgroundColor: '#eee', color: '#aaa' },
                  }}
                >
                  {item.status === 'open' ? `Order Now — ₦${(item.price * quantity).toLocaleString()}` : item.status === 'upcoming' ? 'Coming Soon' : 'Sold Out'}
                </Button>
                <Tooltip title={isInWishlist(item.id || itemId) ? 'Remove from wishlist' : 'Save to wishlist'} arrow>
                  <IconButton
                    onClick={handleToggleWishlist}
                    sx={{
                      border: '1.5px solid #E8D5B0',
                      borderRadius: '50%',
                      p: 1.2,
                      flexShrink: 0,
                      color: isInWishlist(item.id || itemId) ? '#e3242b' : 'var(--text-muted)',
                      '&:hover': { borderColor: '#e3242b', color: '#e3242b', backgroundColor: 'rgba(227,36,43,0.06)' },
                    }}
                  >
                    {isInWishlist(item.id || itemId)
                      ? <FavoriteIcon sx={{ fontSize: 22 }} />
                      : <FavoriteBorderIcon sx={{ fontSize: 22 }} />}
                  </IconButton>
                </Tooltip>
              </Box>
              {/* Add to Cart below */}
              {item.status === 'open' && (
                <Button
                  fullWidth
                  startIcon={<AddShoppingCartIcon />}
                  onClick={handleAddToCart}
                  sx={{
                    borderRadius: '30px', fontFamily: ff, fontWeight: 700,
                    fontSize: '0.9rem', textTransform: 'none', py: 1.5,
                    backgroundColor: 'transparent', color: 'var(--accent-cyan)',
                    border: '1.5px solid var(--accent-cyan)',
                    '&:hover': { backgroundColor: 'rgba(0,255,255,0.08)' },
                  }}
                >
                  Add to Cart
                </Button>
              )}
            </Box>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
