import { useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Typography,
  Container,
  Card,
  CardContent,
  Grid,
  Button,
  Chip,
  Tooltip,
  IconButton,
  CircularProgress,
  Collapse,
  Slider,
  MenuItem,
  TextField,
  Checkbox,
  FormControlLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
} from '@mui/material';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined';
import LoginIcon from '@mui/icons-material/Login';
import FilterListIcon from '@mui/icons-material/FilterList';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import CloseIcon from '@mui/icons-material/Close';
import ScrollReveal from '../components/ScrollReveal';
import PresetSizeGuide from '../components/PresetSizeGuide';
import ProductQuickView from '../components/ProductQuickView';
import useProductCategories from '../hooks/useProductCategories';
import { useAuth } from '../context/AuthContext';
import { useWishlist } from '../context/WishlistContext';
import { pressOnNailShapes } from '../data/products';
import { saveStockNotification } from '../lib/stockService';
import { hasDiscount, getEffectivePrice, getDiscountLabel } from '../lib/discountUtils';

const sectionColors = ['#FFF0F5', '#FCE4EC', '#F3E5F6', '#F8E8F0', '#FFF5F8'];

function formatNaira(amount) {
  return `₦${amount.toLocaleString()}`;
}

const orderButtonSx = {
  border: '2px solid #E91E8C',
  borderRadius: '30px',
  color: '#000',
  backgroundColor: 'transparent',
  px: 4,
  py: 1.2,
  fontSize: '0.95rem',
  fontFamily: '"Georgia", serif',
  fontWeight: 600,
  mt: 4,
  transition: 'all 0.3s ease',
  '&:hover': {
    backgroundColor: '#E91E8C',
    color: '#fff',
    borderColor: '#E91E8C',
  },
};

const lengthOptions = ['Short', 'Medium', 'Long'];

function isOutOfStock(product) {
  return product.stock !== undefined && product.stock <= 0;
}

export default function ProductsMenuPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signInWithGoogle } = useAuth();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  const [signingIn, setSigningIn] = useState(false);
  const { categories: productCategories, loading, error } = useProductCategories();

  // Quick-view state
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const [quickViewCategory, setQuickViewCategory] = useState(null);
  const [snackOpen, setSnackOpen] = useState(false);

  // Filter state
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [sortBy, setSortBy] = useState('default');
  const [shapeFilter, setShapeFilter] = useState('');
  const [lengthFilter, setLengthFilter] = useState('');
  const [priceRange, setPriceRange] = useState([0, 30000]);
  const [inStockOnly, setInStockOnly] = useState(false);

  // Notify Me dialog state
  const [notifyDialog, setNotifyDialog] = useState(null);
  const [notifyEmail, setNotifyEmail] = useState('');
  const [notifySubmitting, setNotifySubmitting] = useState(false);
  const [notifySuccess, setNotifySuccess] = useState(false);
  const [notifyError, setNotifyError] = useState('');

  const hasActiveFilters = sortBy !== 'default' || shapeFilter || lengthFilter || priceRange[0] > 0 || priceRange[1] < 30000 || inStockOnly;

  const clearFilters = () => {
    setSortBy('default');
    setShapeFilter('');
    setLengthFilter('');
    setPriceRange([0, 30000]);
    setInStockOnly(false);
  };

  const applyFilters = (products) => {
    let filtered = products.filter((p) => !p.hidden);

    if (inStockOnly) {
      filtered = filtered.filter((p) => p.stock === undefined || p.stock > 0);
    }
    if (shapeFilter) {
      filtered = filtered.filter((p) => p.shape === shapeFilter);
    }
    if (lengthFilter) {
      filtered = filtered.filter((p) => p.length === lengthFilter);
    }
    filtered = filtered.filter((p) => p.price >= priceRange[0] && p.price <= priceRange[1]);

    if (sortBy === 'price-asc') {
      filtered.sort((a, b) => a.price - b.price);
    } else if (sortBy === 'price-desc') {
      filtered.sort((a, b) => b.price - a.price);
    }

    return filtered;
  };

  const filteredCategories = useMemo(() => {
    return productCategories
      .map((cat) => ({ ...cat, filteredProducts: applyFilters(cat.products) }))
      .filter((cat) => cat.filteredProducts.length > 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productCategories, sortBy, shapeFilter, lengthFilter, priceRange, inStockOnly]);

  const handleSignIn = async () => {
    setSigningIn(true);
    try {
      await signInWithGoogle();
    } catch {
      // user closed popup
    } finally {
      setSigningIn(false);
    }
  };

  const handleContactClick = () => {
    if (location.pathname !== '/') {
      navigate('/');
      setTimeout(() => {
        document.getElementById('contact-section')?.scrollIntoView({ behavior: 'smooth' });
      }, 300);
    } else {
      document.getElementById('contact-section')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleCardClick = (product, category) => {
    if (!isOutOfStock(product)) {
      setQuickViewProduct(product);
      setQuickViewCategory(category);
    }
  };

  const handleWishlistToggle = (e, product, category) => {
    e.stopPropagation();
    if (isInWishlist(product.id)) {
      removeFromWishlist(product.id);
    } else {
      addToWishlist({
        productId: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        categoryId: category.id,
        stock: product.stock,
      });
    }
  };

  const handleNotifyOpen = (e, product) => {
    e.stopPropagation();
    setNotifyDialog(product);
    setNotifyEmail(user?.email || '');
    setNotifySuccess(false);
    setNotifyError('');
  };

  const handleNotifySubmit = async () => {
    if (!notifyEmail.trim() || !notifyDialog) return;
    setNotifySubmitting(true);
    setNotifyError('');
    try {
      await saveStockNotification({
        email: notifyEmail.trim(),
        productId: notifyDialog.id,
        productName: notifyDialog.name,
      });
      setNotifySuccess(true);
    } catch (err) {
      if (err.code === 'ALREADY_SUBSCRIBED') {
        setNotifyError(err.message);
      } else {
        setNotifyError('Something went wrong. Please try again.');
      }
    } finally {
      setNotifySubmitting(false);
    }
  };

  return (
    <Box sx={{ pt: 12 }}>
      {/* Page Header */}
      <Box sx={{ textAlign: "center", py: 6, backgroundColor: "#fff" }}>
        <ScrollReveal direction="up">
          <Typography
            variant="h3"
            sx={{
              fontFamily: '"Georgia", serif',
              fontWeight: 700,
              color: "#000",
              mb: 2,
              fontSize: { xs: "1.8rem", sm: "2.4rem", md: "3rem" },
            }}
          >
            Press-on Products Menu
          </Typography>
        </ScrollReveal>
        <ScrollReveal direction="up" delay={0.15}>
          <Typography
            sx={{
              maxWidth: 620,
              mx: "auto",
              color: "#555",
              fontSize: "1.1rem",
              lineHeight: 1.7,
              px: 2,
            }}
          >
            Shop our handmade press-on nails — salon-quality designs you
            can apply at home. Each set comes with a complimentary nail
            kit. Choose your style, customize your fit, and place your
            order below.
          </Typography>
        </ScrollReveal>
        <ScrollReveal direction="up" delay={0.25}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 1,
              mt: 2,
            }}
          >
            <LocalShippingOutlinedIcon
              sx={{ color: "#E91E8C", fontSize: 20 }}
            />
            <Typography
              sx={{
                color: "#E91E8C",
                fontSize: "0.9rem",
                fontWeight: 600,
              }}
            >
              Delivery available only within Nigeria
            </Typography>
          </Box>
        </ScrollReveal>
        {!user && (
          <ScrollReveal direction="up" delay={0.3}>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 1.5,
                mt: 3,
                py: 1.5,
                px: 3,
                mx: "auto",
                maxWidth: 480,
                backgroundColor: "#FFF0F5",
                borderRadius: 3,
                border: "1px solid #F0C0D0",
              }}
            >
              <Typography
                sx={{
                  fontFamily: '"Georgia", serif',
                  fontSize: "0.9rem",
                  color: "#555",
                }}
              >
                Sign in to track your orders
              </Typography>
              <Button
                size="small"
                startIcon={
                  signingIn ? (
                    <CircularProgress
                      size={16}
                      sx={{ color: "inherit" }}
                    />
                  ) : (
                    <LoginIcon sx={{ fontSize: 18 }} />
                  )
                }
                onClick={handleSignIn}
                disabled={signingIn}
                sx={{
                  fontFamily: '"Georgia", serif',
                  fontSize: "0.85rem",
                  fontWeight: 600,
                  color: "#E91E8C",
                  border: "1.5px solid #E91E8C",
                  borderRadius: "20px",
                  px: 2,
                  whiteSpace: "nowrap",
                  "&:hover": {
                    backgroundColor: "#E91E8C",
                    color: "#fff",
                  },
                }}
              >
                {signingIn ? "Signing In\u2026" : "Sign In"}
              </Button>
            </Box>
          </ScrollReveal>
        )}

        {/* Filter & Sort Toggle */}
        <Box sx={{ mt: 3 }}>
          <Button
            startIcon={<FilterListIcon />}
            onClick={() => setFiltersOpen(!filtersOpen)}
            sx={{
              fontFamily: '"Georgia", serif',
              fontWeight: 600,
              fontSize: '0.85rem',
              color: hasActiveFilters ? '#fff' : '#E91E8C',
              backgroundColor: hasActiveFilters ? '#E91E8C' : 'transparent',
              border: '1.5px solid #E91E8C',
              borderRadius: '20px',
              px: 2.5,
              '&:hover': { backgroundColor: '#E91E8C', color: '#fff' },
            }}
          >
            {filtersOpen ? 'Hide Filters' : 'Filter & Sort'}
          </Button>
        </Box>

        {/* Filter Controls */}
        <Collapse in={filtersOpen}>
          <Box
            sx={{
              mx: 'auto',
              maxWidth: 700,
              mt: 2,
              p: 3,
              backgroundColor: '#FFF0F5',
              borderRadius: 3,
              border: '1px solid #F0C0D0',
              textAlign: 'left',
            }}
          >
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={4}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Sort By"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                >
                  <MenuItem value="default">Default</MenuItem>
                  <MenuItem value="price-asc">Price: Low to High</MenuItem>
                  <MenuItem value="price-desc">Price: High to Low</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={6} sm={4}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Shape"
                  value={shapeFilter}
                  onChange={(e) => setShapeFilter(e.target.value)}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                >
                  <MenuItem value="">All Shapes</MenuItem>
                  {pressOnNailShapes.map((s) => (
                    <MenuItem key={s} value={s}>{s}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={6} sm={4}>
                <TextField
                  select
                  fullWidth
                  size="small"
                  label="Length"
                  value={lengthFilter}
                  onChange={(e) => setLengthFilter(e.target.value)}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                >
                  <MenuItem value="">All Lengths</MenuItem>
                  {lengthOptions.map((l) => (
                    <MenuItem key={l} value={l}>{l}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={8}>
                <Typography sx={{ fontSize: '0.8rem', color: '#555', mb: 0.5, fontFamily: '"Georgia", serif' }}>
                  Price Range: {formatNaira(priceRange[0])} — {formatNaira(priceRange[1])}
                </Typography>
                <Slider
                  value={priceRange}
                  onChange={(_, val) => setPriceRange(val)}
                  min={0}
                  max={30000}
                  step={500}
                  sx={{
                    color: '#E91E8C',
                    '& .MuiSlider-thumb': { width: 16, height: 16 },
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={inStockOnly}
                      onChange={(e) => setInStockOnly(e.target.checked)}
                      sx={{ color: '#E91E8C', '&.Mui-checked': { color: '#E91E8C' } }}
                    />
                  }
                  label={<Typography sx={{ fontSize: '0.85rem', fontFamily: '"Georgia", serif' }}>In Stock Only</Typography>}
                />
              </Grid>
            </Grid>

            {/* Active filter chips */}
            {hasActiveFilters && (
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mt: 2, alignItems: 'center' }}>
                {sortBy !== 'default' && (
                  <Chip label={sortBy === 'price-asc' ? 'Price: Low→High' : 'Price: High→Low'} size="small" onDelete={() => setSortBy('default')} sx={{ backgroundColor: '#FCE4EC' }} />
                )}
                {shapeFilter && (
                  <Chip label={shapeFilter} size="small" onDelete={() => setShapeFilter('')} sx={{ backgroundColor: '#FCE4EC' }} />
                )}
                {lengthFilter && (
                  <Chip label={lengthFilter} size="small" onDelete={() => setLengthFilter('')} sx={{ backgroundColor: '#FCE4EC' }} />
                )}
                {(priceRange[0] > 0 || priceRange[1] < 30000) && (
                  <Chip label={`${formatNaira(priceRange[0])}–${formatNaira(priceRange[1])}`} size="small" onDelete={() => setPriceRange([0, 30000])} sx={{ backgroundColor: '#FCE4EC' }} />
                )}
                {inStockOnly && (
                  <Chip label="In Stock" size="small" onDelete={() => setInStockOnly(false)} sx={{ backgroundColor: '#FCE4EC' }} />
                )}
                <Button size="small" onClick={clearFilters} sx={{ fontSize: '0.75rem', color: '#E91E8C', textTransform: 'none' }}>
                  Clear All
                </Button>
              </Box>
            )}
          </Box>
        </Collapse>
      </Box>

      {/* Loading / Error */}
      {loading && (
        <Box sx={{ textAlign: "center", py: 10 }}>
          <CircularProgress sx={{ color: "#E91E8C" }} />
          <Typography sx={{ mt: 2, color: "#999" }}>
            Loading products…
          </Typography>
        </Box>
      )}
      {error && !loading && (
        <Box sx={{ textAlign: "center", py: 4 }}>
          <Typography sx={{ color: "#d32f2f", fontSize: "0.9rem" }}>
            Could not load products from the server. Showing cached data.
          </Typography>
        </Box>
      )}

      {/* Product Sections */}
      {filteredCategories.map((category, index) => (
        <Box key={category.id}>
          <Box
            sx={{
              backgroundColor:
                sectionColors[index % sectionColors.length],
              py: 8,
            }}
          >
            <Container maxWidth="lg">
              <ScrollReveal direction="up">
                <Typography
                  variant="h4"
                  sx={{
                    fontFamily: '"Georgia", serif',
                    fontWeight: 700,
                    color: "#000",
                    mb: 1,
                    textAlign: "center",
                    fontSize: {
                      xs: "1.3rem",
                      sm: "1.7rem",
                      md: "2.1rem",
                    },
                    px: 1,
                  }}
                >
                  {category.title}
                </Typography>
              </ScrollReveal>
              <ScrollReveal direction="up" delay={0.1}>
                <Typography
                  sx={{
                    textAlign: "center",
                    color: "#555",
                    mb: 1,
                    maxWidth: 580,
                    mx: "auto",
                    lineHeight: 1.6,
                  }}
                >
                  {category.description}
                </Typography>

                {/* Preset sizes info for ready-made products */}
                {category.readyMade && (
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 1,
                      mt: 1,
                      mb: 0.5,
                      flexWrap: "wrap",
                    }}
                  >
                    <Typography
                      sx={{
                        color: "#4A0E4E",
                        fontSize: "0.9rem",
                        fontWeight: 600,
                      }}
                    >
                      XS, S, M & L preset nail sizes available
                    </Typography>
                    <Typography
                      onClick={() => setSizeGuideOpen(true)}
                      sx={{
                        color: "#E91E8C",
                        fontSize: "0.85rem",
                        fontWeight: 600,
                        cursor: "pointer",
                        textDecoration: "underline",
                        textUnderlineOffset: 2,
                        "&:hover": { color: "#C2185B" },
                      }}
                    >
                      What are preset sizes?
                    </Typography>
                    <Tooltip title="Contact us for help" arrow>
                      <IconButton
                        onClick={handleContactClick}
                        size="small"
                        sx={{
                          color: "#E91E8C",
                          border: "1.5px solid #E91E8C",
                          width: 30,
                          height: 30,
                          "&:hover": {
                            backgroundColor: "#E91E8C",
                            color: "#fff",
                          },
                        }}
                      >
                        <PhoneOutlinedIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                    </Tooltip>
                  </Box>
                )}

                {category.note && (
                  <Typography
                    sx={{
                      textAlign: "center",
                      color: "#E91E8C",
                      fontWeight: 600,
                      fontSize: "0.9rem",
                      mb: 4,
                    }}
                  >
                    {category.note}
                  </Typography>
                )}
                {!category.note && <Box sx={{ mb: 4 }} />}
              </ScrollReveal>

              <Grid container spacing={3}>
                {category.filteredProducts.map((product, pIdx) => {
                  const oos = isOutOfStock(product);
                  const wishlisted = isInWishlist(product.id);

                  return (
                    <Grid
                      item
                      xs={12}
                      sm={6}
                      md={category.readyMade ? 4 : 3}
                      key={product.id}
                    >
                      <ScrollReveal direction="up" delay={pIdx * 0.1}>
                        <Card
                          elevation={0}
                          onClick={() => handleCardClick(product, category)}
                          sx={{
                            borderRadius: 3,
                            border: "1px solid #F0C0D0",
                            height: "100%",
                            display: "flex",
                            flexDirection: "column",
                            overflow: "hidden",
                            cursor: oos ? 'default' : 'pointer',
                            transition:
                              "transform 0.3s ease, box-shadow 0.3s ease",
                            '& .hover-prompt': { opacity: 0, transition: 'opacity 0.2s ease' },
                            "&:hover": oos ? {} : {
                              transform: "translateY(-6px)",
                              boxShadow:
                                "0 12px 32px rgba(233,30,140,0.15)",
                              '& .hover-prompt': { opacity: 1 },
                            },
                          }}
                        >
                          <Box sx={{ position: "relative" }}>
                            <Box
                              component="img"
                              src={product.image}
                              alt={product.name}
                              sx={{
                                width: "100%",
                                height: 160,
                                objectFit: "cover",
                                opacity: oos ? 0.5 : 1,
                                filter: oos ? 'grayscale(40%)' : 'none',
                                transition: 'opacity 0.3s ease, filter 0.3s ease',
                              }}
                            />
                            {product.type && (
                              <Chip
                                label={product.type}
                                size="small"
                                sx={{
                                  position: "absolute",
                                  top: 8,
                                  left: 8,
                                  backgroundColor: "#4A0E4E",
                                  color: "#fff",
                                  fontSize: "0.7rem",
                                  fontWeight: 700,
                                  height: 22,
                                }}
                              />
                            )}
                            {product.stock !== undefined && product.stock > 0 && (
                              <Chip
                                label="Ready to ship"
                                size="small"
                                sx={{
                                  position: "absolute",
                                  top: 8,
                                  right: 8,
                                  backgroundColor: "#E91E8C",
                                  color: "#fff",
                                  fontSize: "0.7rem",
                                  fontWeight: 600,
                                  height: 22,
                                }}
                              />
                            )}
                            {hasDiscount(product) && (
                              <Chip
                                label={getDiscountLabel(product)}
                                size="small"
                                sx={{
                                  position: "absolute",
                                  bottom: 8,
                                  left: 8,
                                  backgroundColor: "#2e7d32",
                                  color: "#fff",
                                  fontSize: "0.7rem",
                                  fontWeight: 700,
                                  height: 22,
                                }}
                              />
                            )}

                            {/* Out of stock overlay */}
                            {oos && (
                              <Box
                                sx={{
                                  position: 'absolute',
                                  top: 0,
                                  left: 0,
                                  right: 0,
                                  bottom: 0,
                                  backgroundColor: 'rgba(0,0,0,0.45)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                }}
                              >
                                <Typography
                                  sx={{
                                    color: '#fff',
                                    fontFamily: '"Georgia", serif',
                                    fontWeight: 700,
                                    fontSize: '1rem',
                                    textTransform: 'uppercase',
                                    letterSpacing: 1,
                                  }}
                                >
                                  Out of Stock
                                </Typography>
                              </Box>
                            )}

                            {/* Click to view hover prompt */}
                            {!oos && (
                              <Box
                                className="hover-prompt"
                                sx={{
                                  position: 'absolute',
                                  top: 0,
                                  left: 0,
                                  right: 0,
                                  bottom: 0,
                                  backgroundColor: 'rgba(74, 14, 78, 0.35)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  pointerEvents: 'none',
                                }}
                              >
                                <Typography
                                  sx={{
                                    color: '#fff',
                                    fontFamily: '"Georgia", serif',
                                    fontWeight: 700,
                                    fontSize: '0.85rem',
                                    letterSpacing: 0.5,
                                    textTransform: 'uppercase',
                                  }}
                                >
                                  Click to View
                                </Typography>
                              </Box>
                            )}

                            {/* Wishlist heart */}
                            <IconButton
                              onClick={(e) => handleWishlistToggle(e, product, category)}
                              size="small"
                              sx={{
                                position: 'absolute',
                                bottom: 8,
                                right: 8,
                                backgroundColor: 'rgba(255,255,255,0.9)',
                                width: 32,
                                height: 32,
                                '&:hover': { backgroundColor: '#fff' },
                              }}
                            >
                              {wishlisted ? (
                                <FavoriteIcon sx={{ color: '#E91E8C', fontSize: 18 }} />
                              ) : (
                                <FavoriteBorderIcon sx={{ color: '#E91E8C', fontSize: 18 }} />
                              )}
                            </IconButton>
                          </Box>
                          <CardContent sx={{ flex: 1, p: 3, display: "flex", flexDirection: "column" }}>
                            <Typography
                              variant="h6"
                              sx={{
                                fontFamily: '"Georgia", serif',
                                fontWeight: 700,
                                color: "#000",
                                fontSize: "1rem",
                                mb: 0.5,
                              }}
                            >
                              {product.name}
                            </Typography>
                            {product.shape && product.length && (
                              <Typography
                                sx={{
                                  color: "#999",
                                  fontSize: "0.78rem",
                                  mb: 0.8,
                                }}
                              >
                                {product.shape} · {product.length}
                              </Typography>
                            )}
                            <Typography
                              sx={{
                                color: "#666",
                                fontSize: "0.85rem",
                                lineHeight: 1.5,
                                mb: 2,
                                display: "-webkit-box",
                                WebkitLineClamp: 3,
                                WebkitBoxOrient: "vertical",
                                overflow: "hidden",
                              }}
                            >
                              {product.description}
                            </Typography>
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                                flexWrap: "wrap",
                                mt: "auto",
                              }}
                            >
                              {hasDiscount(product) ? (
                                <>
                                  <Chip
                                    label={formatNaira(getEffectivePrice(product))}
                                    sx={{
                                      backgroundColor: "#2e7d32",
                                      color: "#fff",
                                      fontFamily: '"Georgia", serif',
                                      fontWeight: 700,
                                      fontSize: "0.9rem",
                                    }}
                                  />
                                  <Typography
                                    component="span"
                                    sx={{
                                      textDecoration: 'line-through',
                                      color: '#999',
                                      fontSize: '0.8rem',
                                      fontFamily: '"Georgia", serif',
                                    }}
                                  >
                                    {formatNaira(product.price)}
                                  </Typography>
                                </>
                              ) : (
                                <Chip
                                  label={formatNaira(product.price)}
                                  sx={{
                                    backgroundColor: "#E91E8C",
                                    color: "#fff",
                                    fontFamily: '"Georgia", serif',
                                    fontWeight: 700,
                                    fontSize: "0.9rem",
                                  }}
                                />
                              )}
                              {product.stock !== undefined && product.stock > 0 && (
                                <Typography
                                  sx={{
                                    color:
                                      product.stock <= 2
                                        ? "#E91E8C"
                                        : "#999",
                                    fontSize: "0.78rem",
                                    fontWeight:
                                      product.stock <= 2
                                        ? 600
                                        : 400,
                                    fontStyle: "italic",
                                  }}
                                >
                                  {product.stock} in stock
                                </Typography>
                              )}
                            </Box>

                            {/* Notify Me button for out-of-stock — disabled until EmailJS plan upgrade
                            {oos && (
                              <Button
                                size="small"
                                startIcon={<NotificationsActiveIcon sx={{ fontSize: 16 }} />}
                                onClick={(e) => handleNotifyOpen(e, product)}
                                sx={{
                                  mt: 2,
                                  border: '1.5px solid #E91E8C',
                                  borderRadius: '20px',
                                  color: '#E91E8C',
                                  fontFamily: '"Georgia", serif',
                                  fontWeight: 600,
                                  fontSize: '0.78rem',
                                  textTransform: 'none',
                                  '&:hover': { backgroundColor: '#E91E8C', color: '#fff' },
                                }}
                              >
                                Notify Me
                              </Button>
                            )}
                            */}
                          </CardContent>
                        </Card>
                      </ScrollReveal>
                    </Grid>
                  );
                })}
              </Grid>

              <ScrollReveal direction="up" delay={0.2}>
                <Box sx={{ textAlign: "center" }}>
                  <Button
                    sx={orderButtonSx}
                    onClick={() => navigate("/order", { state: { categoryId: category.id } })}
                  >
                    Place Order
                  </Button>
                </Box>
              </ScrollReveal>
            </Container>
          </Box>
        </Box>
      ))}

      {/* Preset Size Guide Modal */}
      <PresetSizeGuide
        open={sizeGuideOpen}
        onClose={() => setSizeGuideOpen(false)}
      />

      {/* Quick View Modal */}
      <ProductQuickView
        open={!!quickViewProduct}
        onClose={() => { setQuickViewProduct(null); setQuickViewCategory(null); }}
        product={quickViewProduct}
        category={quickViewCategory}
        onAddedToCart={() => setSnackOpen(true)}
      />

      {/* Added to cart snackbar */}
      <Snackbar
        open={snackOpen}
        autoHideDuration={3000}
        onClose={() => setSnackOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSnackOpen(false)} severity="success" sx={{ borderRadius: 2 }}>
          Added to cart!
        </Alert>
      </Snackbar>

      {/* Notify Me Dialog — disabled until EmailJS plan upgrade
      <Dialog
        open={!!notifyDialog}
        onClose={() => setNotifyDialog(null)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 4, overflow: 'hidden' } }}
      >
        <DialogTitle
          sx={{
            background: 'linear-gradient(135deg, #E91E8C 0%, #4A0E4E 100%)',
            color: '#fff',
            textAlign: 'center',
            position: 'relative',
          }}
        >
          <Typography sx={{ fontFamily: '"Georgia", serif', fontWeight: 700, fontSize: '1.1rem' }}>
            Get Notified
          </Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.82rem', mt: 0.5 }}>
            We'll email you when {notifyDialog?.name} is back in stock
          </Typography>
          <IconButton
            onClick={() => setNotifyDialog(null)}
            sx={{ position: 'absolute', right: 8, top: 8, color: 'rgba(255,255,255,0.8)' }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 3, pb: 1 }}>
          {notifySuccess ? (
            <Box sx={{ textAlign: 'center', py: 2 }}>
              <NotificationsActiveIcon sx={{ fontSize: 40, color: '#4CAF50', mb: 1 }} />
              <Typography sx={{ fontFamily: '"Georgia", serif', fontWeight: 600, color: '#333' }}>
                You're on the list!
              </Typography>
              <Typography sx={{ color: '#777', fontSize: '0.85rem', mt: 0.5 }}>
                We'll notify you when this product is restocked.
              </Typography>
            </Box>
          ) : (
            <>
              <TextField
                fullWidth
                label="Email Address"
                type="email"
                value={notifyEmail}
                onChange={(e) => setNotifyEmail(e.target.value)}
                size="small"
                sx={{ mt: 1, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
              {notifyError && (
                <Typography sx={{ color: '#d32f2f', fontSize: '0.82rem', mt: 1 }}>
                  {notifyError}
                </Typography>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
          {notifySuccess ? (
            <Button
              onClick={() => setNotifyDialog(null)}
              sx={{
                backgroundColor: '#E91E8C',
                color: '#fff',
                borderRadius: '30px',
                px: 4,
                py: 1,
                fontFamily: '"Georgia", serif',
                fontWeight: 600,
                '&:hover': { backgroundColor: '#C2185B' },
              }}
            >
              Done
            </Button>
          ) : (
            <>
              <Button onClick={() => setNotifyDialog(null)} sx={{ fontFamily: '"Georgia", serif', color: '#777' }}>
                Cancel
              </Button>
              <Button
                onClick={handleNotifySubmit}
                disabled={notifySubmitting || !notifyEmail.trim()}
                sx={{
                  backgroundColor: '#E91E8C',
                  color: '#fff',
                  borderRadius: '30px',
                  px: 4,
                  py: 1,
                  fontFamily: '"Georgia", serif',
                  fontWeight: 600,
                  '&:hover': { backgroundColor: '#C2185B' },
                  '&.Mui-disabled': { backgroundColor: '#F0C0D0', color: '#fff' },
                }}
              >
                {notifySubmitting ? 'Submitting\u2026' : 'Notify Me'}
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
      */}
    </Box>
  );
}
