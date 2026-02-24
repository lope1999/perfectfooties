import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Container,
  Button,
  IconButton,
  Divider,
  CircularProgress,
} from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { decrementStockBatch } from '../lib/stockService';
import { saveOrder } from '../lib/orderService';

function formatNaira(amount) {
  return `\u20A6${amount.toLocaleString()}`;
}

const sectionTitleSx = {
  fontFamily: '"Georgia", serif',
  fontWeight: 700,
  color: '#4A0E4E',
  fontSize: '1.2rem',
  mb: 2,
};

export default function CartPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const {
    cart,
    removeService,
    removeProduct,
    updateProductQty,
    removePressOn,
    clearCart,
    getCartTotal,
  } = useCart();

  const { services, products, pressOns } = cart.items;
  const hasItems = services.length > 0 || products.length > 0 || pressOns.length > 0;
  const total = getCartTotal();

  const handleCheckout = async () => {
    setCheckoutLoading(true);

    try {
      // Build stock decrement items for retail products and ready-made press-ons
      const stockItems = [];

      products.forEach((p) => {
        if (p.categoryId && p.stock !== undefined) {
          stockItems.push({ collection: 'retailCategories', categoryId: p.categoryId, productId: p.productId, quantity: p.quantity });
        }
      });

      pressOns.forEach((p) => {
        if (p.readyMade && p.categoryId && p.stock !== undefined) {
          stockItems.push({ collection: 'productCategories', categoryId: p.categoryId, productId: p.productId, quantity: Number(p.quantity) || 1 });
        }
      });

      if (stockItems.length > 0) {
        await decrementStockBatch(stockItems);
      }
    } catch (err) {
      console.error('Stock decrement failed:', err);
    }

    setCheckoutLoading(false);

    const lines = [];

    if (services.length > 0) {
      lines.push('--- SERVICE APPOINTMENTS ---');
      services.forEach((s, i) => {
        let line = `${i + 1}. ${s.name} \u2014 ${formatNaira(s.price)}`;
        if (s.customerName) line += `\n   Name: ${s.customerName}`;
        line += `\n   Date: ${s.date}\n   Shape: ${s.nailShape} | Length: ${s.nailLength}`;
        lines.push(line);
      });
      lines.push('');
    }

    if (products.length > 0) {
      lines.push('--- NAIL CARE PRODUCTS ---');
      products.forEach((p, i) => {
        let line = `${i + 1}. ${p.name} x${p.quantity} \u2014 ${formatNaira(p.price * p.quantity)}`;
        if (p.customerName) line += `\n   Name: ${p.customerName}`;
        lines.push(line);
      });
      lines.push('');
    }

    if (pressOns.length > 0) {
      lines.push('--- PRESS-ON ORDERS ---');
      pressOns.forEach((p, i) => {
        let detail = `${i + 1}. ${p.name} \u2014 ${formatNaira(p.price)}`;
        if (p.customerName) detail += `\n   Name: ${p.customerName}`;
        if (p.type) detail += `\n   Type: ${p.type}`;
        detail += `\n   Shape: ${p.nailShape || 'N/A'}`;
        detail += `\n   Quantity: ${p.quantity} set(s)`;
        if (p.nailBedSize) detail += `\n   Nail Bed Size: ${p.nailBedSize}`;
        if (p.presetSize) detail += `\n   Preset Size: ${p.presetSize}`;
        if (p.orderingForOthers && p.otherPeople?.length > 0) {
          p.otherPeople.forEach((o) => {
            detail += `\n   Also for: ${o.name || 'N/A'} \u2014 Shape: ${o.nailShape || 'Same'} \u2014 Nail Bed: ${o.nailBedSize || 'N/A'}`;
          });
        }
        lines.push(detail);
      });
      lines.push('');
    }

    const message = `Hi! I'd like to place a combined order.\n\n${lines.join('\n')}\nEstimated Total: ${formatNaira(total)}\n\nPlease confirm availability and payment details. Thank you!`;
    const encoded = encodeURIComponent(message);
    window.open(
      `https://api.whatsapp.com/send?phone=2349053714197&text=${encoded}`,
      '_blank'
    );

    if (user) {
      const allItems = [
        ...services.map((s) => ({ kind: 'service', name: s.name, price: s.price, quantity: 1 })),
        ...products.map((p) => ({ kind: 'retail', name: p.name, price: p.price, quantity: p.quantity })),
        ...pressOns.map((p) => ({ kind: 'pressOn', name: p.name, price: p.price, quantity: p.quantity || 1 })),
      ];
      saveOrder(user.uid, {
        type: 'mixed',
        total,
        customerName: user.displayName || '',
        email: user.email || '',
        items: allItems,
      }).catch(() => {});
    }

    clearCart();
    navigate('/');
  };

  return (
    <Box sx={{ pt: { xs: 10, md: 12 }, pb: 16, minHeight: '100vh', backgroundColor: '#FFF0F5' }}>
      <Container maxWidth="md">
        {/* Header */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <ShoppingCartOutlinedIcon sx={{ fontSize: 48, color: '#E91E8C', mb: 1 }} />
          <Typography
            variant="h3"
            sx={{
              fontFamily: '"Georgia", serif',
              fontWeight: 700,
              color: '#000',
              fontSize: { xs: '1.8rem', sm: '2.4rem', md: '3rem' },
            }}
          >
            Your Cart
          </Typography>
        </Box>

        {!hasItems ? (
          /* Empty state */
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography sx={{ color: '#777', fontSize: '1.1rem', mb: 3 }}>
              Your cart is empty.
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Button
                onClick={() => navigate('/book')}
                sx={{
                  border: '2px solid #E91E8C',
                  borderRadius: '30px',
                  color: '#000',
                  px: 3,
                  py: 1,
                  fontFamily: '"Georgia", serif',
                  fontWeight: 600,
                  '&:hover': { backgroundColor: '#E91E8C', color: '#fff' },
                }}
              >
                Book a Service
              </Button>
              <Button
                onClick={() => navigate('/shop')}
                sx={{
                  border: '2px solid #E91E8C',
                  borderRadius: '30px',
                  color: '#000',
                  px: 3,
                  py: 1,
                  fontFamily: '"Georgia", serif',
                  fontWeight: 600,
                  '&:hover': { backgroundColor: '#E91E8C', color: '#fff' },
                }}
              >
                Shop Products
              </Button>
              <Button
                onClick={() => navigate('/order')}
                sx={{
                  border: '2px solid #E91E8C',
                  borderRadius: '30px',
                  color: '#000',
                  px: 3,
                  py: 1,
                  fontFamily: '"Georgia", serif',
                  fontWeight: 600,
                  '&:hover': { backgroundColor: '#E91E8C', color: '#fff' },
                }}
              >
                Order Press-Ons
              </Button>
            </Box>
          </Box>
        ) : (
          <>
            {/* Service Appointments */}
            {services.length > 0 && (
              <Box sx={{ mb: 4 }}>
                <Typography sx={sectionTitleSx}>Service Appointments</Typography>
                {services.map((s) => (
                  <Box
                    key={s.id}
                    sx={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      p: 2,
                      mb: 1.5,
                      borderRadius: 2,
                      border: '1px solid #F0C0D0',
                      backgroundColor: '#fff',
                    }}
                  >
                    <Box sx={{ flex: 1 }}>
                      <Typography
                        sx={{
                          fontFamily: '"Georgia", serif',
                          fontWeight: 600,
                          fontSize: '0.95rem',
                        }}
                      >
                        {s.name}
                      </Typography>
                      {s.customerName && (
                        <Typography sx={{ color: '#4A0E4E', fontSize: '0.82rem', fontWeight: 600 }}>
                          {s.customerName}
                        </Typography>
                      )}
                      <Typography sx={{ color: '#777', fontSize: '0.82rem' }}>
                        {s.date} &middot; {s.nailShape} &middot; {s.nailLength}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 2 }}>
                      <Typography
                        sx={{
                          fontFamily: '"Georgia", serif',
                          fontWeight: 700,
                          color: '#E91E8C',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {formatNaira(s.price)}
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={() => removeService(s.id)}
                        sx={{ color: '#E91E8C' }}
                      >
                        <DeleteOutlineIcon sx={{ fontSize: 20 }} />
                      </IconButton>
                    </Box>
                  </Box>
                ))}
                <Divider sx={{ borderColor: '#F0C0D0', mt: 2 }} />
              </Box>
            )}

            {/* Nail Care Products */}
            {products.length > 0 && (
              <Box sx={{ mb: 4 }}>
                <Typography sx={sectionTitleSx}>Nail Care Products</Typography>
                {products.map((p) => (
                  <Box
                    key={p.productId}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      p: 2,
                      mb: 1.5,
                      borderRadius: 2,
                      border: '1px solid #F0C0D0',
                      backgroundColor: '#fff',
                    }}
                  >
                    <Box sx={{ flex: 1 }}>
                      <Typography
                        sx={{
                          fontFamily: '"Georgia", serif',
                          fontWeight: 600,
                          fontSize: '0.95rem',
                        }}
                      >
                        {p.name}
                      </Typography>
                      {p.customerName && (
                        <Typography sx={{ color: '#4A0E4E', fontSize: '0.78rem', fontWeight: 600 }}>
                          {p.customerName}
                        </Typography>
                      )}
                      <Typography sx={{ color: '#999', fontSize: '0.78rem' }}>
                        {formatNaira(p.price)} each
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 2 }}>
                      <IconButton
                        size="small"
                        onClick={() => updateProductQty(p.productId, p.quantity - 1)}
                        disabled={p.quantity <= 1}
                        sx={{
                          color: '#E91E8C',
                          border: '1.5px solid #E91E8C',
                          width: 28,
                          height: 28,
                          '&:hover': { backgroundColor: '#E91E8C', color: '#fff' },
                          '&.Mui-disabled': { borderColor: '#ddd', color: '#ddd' },
                        }}
                      >
                        <RemoveIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                      <Typography
                        sx={{
                          fontFamily: '"Georgia", serif',
                          fontWeight: 700,
                          minWidth: 24,
                          textAlign: 'center',
                          color: '#E91E8C',
                        }}
                      >
                        {p.quantity}
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={() => updateProductQty(p.productId, p.quantity + 1)}
                        disabled={p.quantity >= p.stock}
                        sx={{
                          color: '#E91E8C',
                          border: '1.5px solid #E91E8C',
                          width: 28,
                          height: 28,
                          '&:hover': { backgroundColor: '#E91E8C', color: '#fff' },
                          '&.Mui-disabled': { borderColor: '#ddd', color: '#ddd' },
                        }}
                      >
                        <AddIcon sx={{ fontSize: 16 }} />
                      </IconButton>
                      <Typography
                        sx={{
                          fontFamily: '"Georgia", serif',
                          fontWeight: 700,
                          color: '#E91E8C',
                          minWidth: 70,
                          textAlign: 'right',
                        }}
                      >
                        {formatNaira(p.price * p.quantity)}
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={() => removeProduct(p.productId)}
                        sx={{ color: '#E91E8C' }}
                      >
                        <DeleteOutlineIcon sx={{ fontSize: 20 }} />
                      </IconButton>
                    </Box>
                  </Box>
                ))}
                <Divider sx={{ borderColor: '#F0C0D0', mt: 2 }} />
              </Box>
            )}

            {/* Press-On Orders */}
            {pressOns.length > 0 && (
              <Box sx={{ mb: 4 }}>
                <Typography sx={sectionTitleSx}>Press-On Orders</Typography>
                {pressOns.map((p) => (
                  <Box
                    key={p.id}
                    sx={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      p: 2,
                      mb: 1.5,
                      borderRadius: 2,
                      border: '1px solid #F0C0D0',
                      backgroundColor: '#fff',
                    }}
                  >
                    <Box sx={{ flex: 1 }}>
                      <Typography
                        sx={{
                          fontFamily: '"Georgia", serif',
                          fontWeight: 600,
                          fontSize: '0.95rem',
                        }}
                      >
                        {p.name}
                      </Typography>
                      {p.customerName && (
                        <Typography sx={{ color: '#4A0E4E', fontSize: '0.78rem', fontWeight: 600 }}>
                          {p.customerName}
                        </Typography>
                      )}
                      <Typography sx={{ color: '#777', fontSize: '0.82rem' }}>
                        {p.nailShape && `Shape: ${p.nailShape}`}
                        {p.quantity && ` \u00B7 ${p.quantity} set(s)`}
                        {p.presetSize && ` \u00B7 Size: ${p.presetSize}`}
                        {p.nailBedSize && ` \u00B7 Bed: ${p.nailBedSize}`}
                      </Typography>
                      {p.orderingForOthers && p.otherPeople?.length > 0 && (
                        <Typography sx={{ color: '#999', fontSize: '0.78rem', mt: 0.3 }}>
                          +{p.otherPeople.length} other person(s)
                        </Typography>
                      )}
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, ml: 2 }}>
                      <Typography
                        sx={{
                          fontFamily: '"Georgia", serif',
                          fontWeight: 700,
                          color: '#E91E8C',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {formatNaira(p.price)}
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={() => removePressOn(p.id)}
                        sx={{ color: '#E91E8C' }}
                      >
                        <DeleteOutlineIcon sx={{ fontSize: 20 }} />
                      </IconButton>
                    </Box>
                  </Box>
                ))}
                <Divider sx={{ borderColor: '#F0C0D0', mt: 2 }} />
              </Box>
            )}
          </>
        )}
      </Container>

      {/* Sticky Checkout Bar */}
      {hasItems && (
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
            px: 3,
          }}
        >
          <Box
            sx={{
              maxWidth: 'md',
              mx: 'auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 1,
            }}
          >
            <Typography
              sx={{
                fontFamily: '"Georgia", serif',
                fontWeight: 700,
                fontSize: '1.15rem',
                color: '#000',
              }}
            >
              Total: <span style={{ color: '#E91E8C' }}>{formatNaira(total)}</span>
            </Typography>
            <Button
              onClick={handleCheckout}
              disabled={checkoutLoading}
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
              {checkoutLoading ? <CircularProgress size={22} sx={{ color: '#fff' }} /> : 'Checkout via WhatsApp'}
            </Button>
          </Box>
        </Box>
      )}
    </Box>
  );
}
