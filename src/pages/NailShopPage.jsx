import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Container,
  Card,
  CardContent,
  Grid,
  Button,
  Chip,
  IconButton,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import ShoppingBagOutlinedIcon from '@mui/icons-material/ShoppingBagOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import StorefrontOutlinedIcon from '@mui/icons-material/StorefrontOutlined';
import ImageNotSupportedOutlinedIcon from '@mui/icons-material/ImageNotSupportedOutlined';
import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined';
import ScrollReveal from '../components/ScrollReveal';
import useRetailCategories from '../hooks/useRetailCategories';
import { decrementStockBatch } from '../lib/stockService';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { saveOrder } from '../lib/orderService';
import { hasDiscount, getEffectivePrice, getDiscountLabel } from '../lib/discountUtils';

const sectionColors = ['#FFF0F5', '#FCE4EC', '#F3E5F6', '#F8E8F0', '#FFF5F8', '#FFF0F5'];

function formatNaira(amount) {
  return `\u20A6${amount.toLocaleString()}`;
}

const confirmButtonSx = {
  border: '2px solid #E91E8C',
  borderRadius: '30px',
  color: '#000',
  backgroundColor: 'transparent',
  px: 5,
  py: 1.5,
  fontSize: '1rem',
  fontFamily: '"Georgia", serif',
  fontWeight: 600,
  transition: 'all 0.3s ease',
  '&:hover': {
    backgroundColor: '#E91E8C',
    color: '#fff',
    borderColor: '#E91E8C',
  },
};

const textFieldSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: 2,
    '& fieldset': { borderColor: '#F0C0D0' },
    '&:hover fieldset': { borderColor: '#E91E8C' },
    '&.Mui-focused fieldset': { borderColor: '#E91E8C' },
  },
};

export default function NailShopPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [cart, setCart] = useState({});
  const [customerName, setCustomerName] = useState('');

  useEffect(() => {
    if (user?.displayName && !customerName) setCustomerName(user.displayName);
  }, [user]);
  const [modalOpen, setModalOpen] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const { addProduct: addToGlobalCart } = useCart();
  const { categories: retailCategories, loading, error } = useRetailCategories();

  const allProducts = retailCategories.flatMap((cat) =>
    cat.products
      .filter((p) => !p.hidden && (p.stock === undefined || p.stock > 0))
      .map((p) => ({ ...p, category: cat.title, categoryId: cat.id }))
  );

  const getQty = (productId) => cart[productId] || 0;

  const handleAdd = (productId) => {
    const product = allProducts.find((p) => p.id === productId);
    if (!product) return;
    setCart((prev) => {
      const current = prev[productId] || 0;
      if (current >= product.stock) return prev;
      return { ...prev, [productId]: current + 1 };
    });
  };

  const handleRemove = (productId) => {
    setCart((prev) => {
      const current = prev[productId] || 0;
      if (current <= 0) return prev;
      const updated = { ...prev };
      if (current === 1) {
        delete updated[productId];
      } else {
        updated[productId] = current - 1;
      }
      return updated;
    });
  };

  const cartItems = Object.entries(cart).filter(([, qty]) => qty > 0);
  const totalItems = cartItems.reduce((sum, [, qty]) => sum + qty, 0);
  const totalPrice = cartItems.reduce((sum, [id, qty]) => {
    const product = allProducts.find((p) => p.id === id);
    return sum + (product ? getEffectivePrice(product) : 0) * qty;
  }, 0);

  const isFormValid = customerName.trim() && cartItems.length > 0;

  const handleConfirmPurchase = () => {
    setModalOpen(true);
  };

  const handleCompletePurchase = async () => {
    setCheckoutLoading(true);
    try {
      // Decrement stock in Firestore
      const stockItems = cartItems
        .map(([id, qty]) => {
          const product = allProducts.find((p) => p.id === id);
          if (!product || product.stock === undefined) return null;
          return { collection: 'retailCategories', categoryId: product.categoryId, productId: id, quantity: qty };
        })
        .filter(Boolean);

      if (stockItems.length > 0) {
        await decrementStockBatch(stockItems);
      }
    } catch (err) {
      console.error('Stock decrement failed:', err);
      // Continue with checkout even if stock decrement fails
    }

    setCheckoutLoading(false);
    setModalOpen(false);

    const orderLines = cartItems.map(([id, qty], i) => {
      const product = allProducts.find((p) => p.id === id);
      const price = product ? getEffectivePrice(product) : 0;
      const subtotal = price * qty;
      return `${i + 1}. ${product?.name || 'Product'} x${qty} — ${formatNaira(subtotal)}`;
    });

    const message = `Hi! I'd like to purchase nail care products.\n\nName: ${customerName}\n\nItems (${totalItems}):\n${orderLines.join('\n')}\n\nTotal: ${formatNaira(totalPrice)}\n\nPlease confirm availability and payment details. Thank you!`;
    const encoded = encodeURIComponent(message);
    window.open(
      `https://api.whatsapp.com/send?phone=2349053714197&text=${encoded}`,
      '_blank'
    );

    if (user) {
      saveOrder(user.uid, {
        type: 'retail',
        total: totalPrice,
        customerName: customerName.trim(),
        email: user.email || '',
        items: cartItems.map(([id, qty]) => {
          const product = allProducts.find((p) => p.id === id);
          const price = product ? getEffectivePrice(product) : 0;
          return { kind: 'retail', name: product?.name || '', price, quantity: qty };
        }),
      }).catch(() => {});
    }

    navigate('/');
  };

  const handleAddToCart = () => {
    cartItems.forEach(([id, qty]) => {
      const product = allProducts.find((p) => p.id === id);
      if (product) {
        const effectivePrice = getEffectivePrice(product);
        addToGlobalCart({
          productId: product.id,
          name: product.name,
          price: effectivePrice,
          originalPrice: hasDiscount(product) ? product.price : undefined,
          discountLabel: hasDiscount(product) ? getDiscountLabel(product) : undefined,
          quantity: qty,
          stock: product.stock,
          categoryId: product.categoryId,
          customerName: customerName.trim(),
        });
      }
    });
    setCart({});
  };

  return (
    <Box sx={{ pt: 12 }}>
      {/* Page Header */}
      <Box sx={{ textAlign: 'center', py: 6, backgroundColor: '#fff' }}>
        <ScrollReveal direction="up">
          <StorefrontOutlinedIcon sx={{ fontSize: 48, color: '#E91E8C', mb: 1 }} />
          <Typography
            variant="h3"
            sx={{
              fontFamily: '"Georgia", serif',
              fontWeight: 700,
              color: '#000',
              mb: 2,
              fontSize: { xs: '1.8rem', sm: '2.4rem', md: '3rem' },
            }}
          >
            Nail Care Shop
          </Typography>
        </ScrollReveal>
        <ScrollReveal direction="up" delay={0.15}>
          <Typography
            sx={{
              maxWidth: 620,
              mx: 'auto',
              color: '#555',
              fontSize: '1.1rem',
              lineHeight: 1.7,
              px: 2,
            }}
          >
            Professional nail care products to maintain and elevate your nail
            journey at home. From aftercare essentials to creative art supplies
            — everything you need between appointments.
          </Typography>
        </ScrollReveal>

        {/* Sticky Name Field */}
        <ScrollReveal direction="up" delay={0.25}>
          <Box sx={{ maxWidth: 420, mx: 'auto', mt: 4, px: 2 }}>
            <Typography
              sx={{
                fontFamily: '"Georgia", serif',
                fontWeight: 700,
                color: '#4A0E4E',
                mb: 1,
                fontSize: '1.05rem',
                textAlign: 'left',
              }}
            >
              Your Name
            </Typography>
            <TextField
              fullWidth
              placeholder="Enter your full name"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              size="small"
              sx={textFieldSx}
            />
          </Box>
        </ScrollReveal>
      </Box>

      {/* Loading / Error */}
      {loading && (
        <Box sx={{ textAlign: 'center', py: 10 }}>
          <CircularProgress sx={{ color: '#E91E8C' }} />
          <Typography sx={{ mt: 2, color: '#999' }}>Loading products…</Typography>
        </Box>
      )}
      {error && !loading && (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography sx={{ color: '#d32f2f', fontSize: '0.9rem' }}>
            Could not load products from the server. Showing cached data.
          </Typography>
        </Box>
      )}

      {/* Product Sections */}
      {retailCategories.filter(cat => cat.products.some(p => !p.hidden && (p.stock === undefined || p.stock > 0))).map((category, index) => (
        <Box
          key={category.id}
          sx={{
            backgroundColor: sectionColors[index % sectionColors.length],
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
                  color: '#000',
                  mb: 1,
                  textAlign: 'center',
                  fontSize: { xs: '1.3rem', sm: '1.7rem', md: '2.1rem' },
                  px: 1,
                }}
              >
                {category.title}
              </Typography>
            </ScrollReveal>
            <ScrollReveal direction="up" delay={0.1}>
              <Typography
                sx={{
                  textAlign: 'center',
                  color: '#555',
                  mb: 4,
                  maxWidth: 580,
                  mx: 'auto',
                  lineHeight: 1.6,
                }}
              >
                {category.description}
              </Typography>
            </ScrollReveal>

            <Grid container spacing={3}>
              {category.products.filter(p => !p.hidden && (p.stock === undefined || p.stock > 0)).map((product, pIdx) => {
                const qty = getQty(product.id);
                const outOfStock = product.stock <= 0;
                const atMax = qty >= product.stock;

                return (
                  <Grid item xs={12} sm={6} md={4} key={product.id}>
                    <ScrollReveal direction="up" delay={pIdx * 0.08}>
                      <Card
                        elevation={0}
                        sx={{
                          borderRadius: 3, 
                          border: qty > 0 ? '2px solid #E91E8C' : '1px solid #F0C0D0',
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          overflow: 'hidden',
                          transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                          '&:hover': {
                            transform: 'translateY(-4px)',
                            boxShadow: '0 8px 24px rgba(233,30,140,0.12)',
                          },
                        }}
                      >
                        {/* Product Image */}
                        <Box
                          sx={{
                            width: '100%',
                            height: 120,
                            backgroundColor: '#FCE4EC',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            overflow: 'hidden',
                            position: 'relative',
                          }}
                        >
                          <Box
                            component="img"
                            src={product.image}
                            alt={product.name}
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                            sx={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                            }}
                          />
                          {/* Fallback placeholder */}
                          <Box
                            sx={{
                              display: 'none',
                              position: 'absolute',
                              inset: 0,
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexDirection: 'column',
                              gap: 0.5,
                              backgroundColor: '#FCE4EC',
                            }}
                          >
                            <ImageNotSupportedOutlinedIcon
                              sx={{ fontSize: 28, color: '#E91E8C', opacity: 0.5 }}
                            />
                            <Typography
                              sx={{
                                fontSize: '0.65rem',
                                color: '#E91E8C',
                                opacity: 0.6,
                                fontStyle: 'italic',
                              }}
                            >
                              Photo coming soon
                            </Typography>
                          </Box>
                          {hasDiscount(product) && (
                            <Chip
                              label={getDiscountLabel(product)}
                              size="small"
                              sx={{
                                position: 'absolute',
                                top: 8,
                                left: 8,
                                backgroundColor: '#2e7d32',
                                color: '#fff',
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                height: 22,
                              }}
                            />
                          )}
                        </Box>
                        <CardContent sx={{ flex: 1, p: 2.5 }}>
                          <Typography
                            variant="h6"
                            sx={{
                              fontFamily: '"Georgia", serif',
                              fontWeight: 700,
                              color: '#000',
                              fontSize: '0.95rem',
                              mb: 0.5,
                            }}
                          >
                            {product.name}
                          </Typography>
                          <Typography
                            sx={{
                              color: '#666',
                              fontSize: '0.82rem',
                              lineHeight: 1.5,
                              mb: 1.5,
                              minHeight: 36,
                            }}
                          >
                            {product.description}
                          </Typography>

                          {/* Price & Stock */}
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              mb: 2,
                            }}
                          >
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              {hasDiscount(product) ? (
                                <>
                                  <Chip
                                    label={formatNaira(getEffectivePrice(product))}
                                    sx={{
                                      backgroundColor: '#2e7d32',
                                      color: '#fff',
                                      fontFamily: '"Georgia", serif',
                                      fontWeight: 700,
                                      fontSize: '0.9rem',
                                    }}
                                  />
                                  <Typography
                                    component="span"
                                    sx={{
                                      textDecoration: 'line-through',
                                      color: '#999',
                                      fontSize: '0.78rem',
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
                                    backgroundColor: '#E91E8C',
                                    color: '#fff',
                                    fontFamily: '"Georgia", serif',
                                    fontWeight: 700,
                                    fontSize: '0.9rem',
                                  }}
                                />
                              )}
                            </Box>
                            <Typography
                              sx={{
                                color: outOfStock
                                  ? '#d32f2f'
                                  : product.stock <= 3
                                    ? '#E91E8C'
                                    : '#999',
                                fontSize: '0.78rem',
                                fontWeight: outOfStock || product.stock <= 3 ? 600 : 400,
                                fontStyle: 'italic',
                              }}
                            >
                              {outOfStock ? 'Out of stock' : `${product.stock} in stock`}
                            </Typography>
                          </Box>

                          {/* Quantity Controls */}
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: 1.5,
                              p: 1,
                              borderRadius: 2,
                              backgroundColor: qty > 0 ? '#FFF0F5' : '#FAFAFA',
                              border: '1px solid #F0C0D0',
                            }}
                          >
                            <IconButton
                              size="small"
                              onClick={() => handleRemove(product.id)}
                              disabled={qty <= 0}
                              sx={{
                                color: '#E91E8C',
                                border: '1.5px solid #E91E8C',
                                width: 32,
                                height: 32,
                                '&:hover': {
                                  backgroundColor: '#E91E8C',
                                  color: '#fff',
                                },
                                '&.Mui-disabled': {
                                  borderColor: '#ddd',
                                  color: '#ddd',
                                },
                              }}
                            >
                              <RemoveIcon sx={{ fontSize: 18 }} />
                            </IconButton>
                            <Typography
                              sx={{
                                fontFamily: '"Georgia", serif',
                                fontWeight: 700,
                                fontSize: '1.1rem',
                                color: qty > 0 ? '#E91E8C' : '#999',
                                minWidth: 30,
                                textAlign: 'center',
                              }}
                            >
                              {qty}
                            </Typography>
                            <IconButton
                              size="small"
                              onClick={() => handleAdd(product.id)}
                              disabled={outOfStock || atMax}
                              sx={{
                                color: '#E91E8C',
                                border: '1.5px solid #E91E8C',
                                width: 32,
                                height: 32,
                                '&:hover': {
                                  backgroundColor: '#E91E8C',
                                  color: '#fff',
                                },
                                '&.Mui-disabled': {
                                  borderColor: '#ddd',
                                  color: '#ddd',
                                },
                              }}
                            >
                              <AddIcon sx={{ fontSize: 18 }} />
                            </IconButton>
                          </Box>
                          {atMax && qty > 0 && (
                            <Typography
                              sx={{
                                textAlign: 'center',
                                color: '#E91E8C',
                                fontSize: '0.72rem',
                                mt: 0.5,
                                fontWeight: 600,
                              }}
                            >
                              Max available reached
                            </Typography>
                          )}
                        </CardContent>
                      </Card>
                    </ScrollReveal>
                  </Grid>
                );
              })}
            </Grid>
          </Container>
        </Box>
      ))}

      {/* Spacer for sticky bar */}
      {allProducts.length > 0 && <Box sx={{ height: 100 }} />}

      {/* Sticky Cart Bar */}
      {allProducts.length > 0 && (
      <Box
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1100,
          backgroundColor: 'rgba(255, 240, 245, 0.95)',
          backdropFilter: 'blur(8px)',
          borderTop: '1px solid #F0C0D0',
          py: 2,
          textAlign: 'center',
        }}
      >
        {cartItems.length > 0 && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1,
              mb: 0.5,
            }}
          >
            <ShoppingBagOutlinedIcon sx={{ fontSize: 18, color: '#E91E8C' }} />
            <Typography
              sx={{
                fontSize: '0.85rem',
                color: '#E91E8C',
                fontWeight: 600,
              }}
            >
              {totalItems} item{totalItems > 1 ? 's' : ''} — {formatNaira(totalPrice)}
            </Typography>
          </Box>
        )}
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
          <Button
            sx={{
              ...confirmButtonSx,
              opacity: isFormValid ? 1 : 0.5,
            }}
            onClick={handleConfirmPurchase}
            disabled={!isFormValid}
          >
            Confirm Purchase
          </Button>
          <Button
            startIcon={<ShoppingCartOutlinedIcon />}
            sx={{
              ...confirmButtonSx,
              borderColor: '#4A0E4E',
              color: '#4A0E4E',
              opacity: cartItems.length > 0 ? 1 : 0.5,
              '&:hover': {
                backgroundColor: '#4A0E4E',
                color: '#fff',
                borderColor: '#4A0E4E',
              },
            }}
            onClick={handleAddToCart}
            disabled={cartItems.length === 0}
          >
            Add to Cart
          </Button>
        </Box>
      </Box>
      )}

      {/* Success Modal */}
      <Dialog
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        PaperProps={{
          sx: {
            borderRadius: 4,
            p: 2,
            textAlign: 'center',
            maxWidth: 420,
          },
        }}
      >
        <DialogTitle sx={{ pb: 0 }}>
          <CheckCircleOutlineIcon sx={{ fontSize: 60, color: '#E91E8C', mb: 1 }} />
          <Typography
            variant="h5"
            sx={{ fontFamily: '"Georgia", serif', fontWeight: 700 }}
          >
            Purchase Confirmed!
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ color: '#555', mt: 1, lineHeight: 1.7 }}>
            We will navigate you to WhatsApp to confirm availability, payment,
            and delivery details for your items.
          </Typography>
          {cartItems.length > 0 && (
            <Box sx={{ mt: 2, textAlign: 'left' }}>
              <Typography
                sx={{
                  fontWeight: 600,
                  color: '#4A0E4E',
                  fontSize: '0.95rem',
                  mb: 0.5,
                }}
              >
                Your items:
              </Typography>
              {cartItems.map(([id, qty]) => {
                const product = allProducts.find((p) => p.id === id);
                return (
                  <Typography
                    key={id}
                    sx={{ color: '#555', fontSize: '0.9rem', pl: 1 }}
                  >
                    • {product?.name || 'Product'} x{qty} —{' '}
                    {formatNaira((product?.price || 0) * qty)}
                  </Typography>
                );
              })}
              <Typography
                sx={{
                  fontWeight: 700,
                  color: '#E91E8C',
                  fontSize: '1rem',
                  mt: 1.5,
                  fontFamily: '"Georgia", serif',
                }}
              >
                Total: {formatNaira(totalPrice)}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
          <Button
            onClick={handleCompletePurchase}
            sx={{
              backgroundColor: '#E91E8C',
              color: '#fff',
              borderRadius: '30px',
              px: 4,
              py: 1.2,
              fontFamily: '"Georgia", serif',
              fontWeight: 600,
              fontSize: '0.95rem',
              '&:hover': {
                backgroundColor: '#C2185B',
              },
            }}
          >
            Complete Purchase
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
