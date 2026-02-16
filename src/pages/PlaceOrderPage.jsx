import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Typography,
  Container,
  Card,
  CardContent,
  Checkbox,
  FormControlLabel,
  Collapse,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
  Tooltip,
  IconButton,
} from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined';
import {
  productCategories,
  pressOnNailShapes,
  pressOnLengths,
  pressOnQuantities,
} from '../data/products';
import ScrollReveal from '../components/ScrollReveal';
import NailBedSizeInput from '../components/NailBedSizeInput';
import PresetSizeGuide from '../components/PresetSizeGuide';

function formatNaira(amount) {
  return `₦${amount.toLocaleString()}`;
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

const emptyForm = { nailShape: '', nailLength: '', quantity: '', nailBedSize: '' };
const readyMadeForm = { quantity: '', presetSize: '' };
const presetSizes = ['XS (Extra Small)', 'S (Small)', 'M (Medium)', 'L (Large)'];

export default function PlaceOrderPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [customerName, setCustomerName] = useState('');
  const [selectedProducts, setSelectedProducts] = useState({});
  const [modalOpen, setModalOpen] = useState(false);
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);

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

  const allProducts = productCategories.flatMap((cat) =>
    cat.products.map((p) => ({ ...p, category: cat.title, readyMade: !!cat.readyMade }))
  );

  const isReadyMade = (productId) => {
    const product = allProducts.find((p) => p.id === productId);
    return product?.readyMade;
  };

  const handleToggleProduct = (productId) => {
    setSelectedProducts((prev) => {
      const updated = { ...prev };
      if (updated[productId]) {
        delete updated[productId];
      } else {
        updated[productId] = isReadyMade(productId) ? { ...readyMadeForm } : { ...emptyForm };
      }
      return updated;
    });
  };

  const handleFieldChange = (productId, field) => (event) => {
    setSelectedProducts((prev) => ({
      ...prev,
      [productId]: { ...prev[productId], [field]: event.target.value },
    }));
  };

  const handleNailBedChange = (productId, val) => {
    setSelectedProducts((prev) => ({
      ...prev,
      [productId]: { ...prev[productId], nailBedSize: val },
    }));
  };

  const handleConfirmOrder = () => {
    setModalOpen(true);
  };

  const handleCompleteOrder = () => {
    setModalOpen(false);

    const selectedIds = Object.keys(selectedProducts);
    const orderLines = selectedIds.map((id, i) => {
      const product = allProducts.find((p) => p.id === id);
      const form = selectedProducts[id];
      if (product?.readyMade) {
        return `${i + 1}. ${product?.name || 'Product'} — ${product ? formatNaira(product.price) : ''}\n   - Type: ${product.type || 'N/A'}\n   - Shape: ${product.shape || 'N/A'}\n   - Length: ${product.length || 'N/A'}\n   - Preset Size: ${form.presetSize}\n   - Quantity: ${form.quantity} set(s)\n   - (Ready-made — ready to ship)`;
      }
      return `${i + 1}. ${product?.name || 'Product'} — ${product ? formatNaira(product.price) : ''}\n   - Nail Shape: ${form.nailShape}\n   - Nail Length: ${form.nailLength}\n   - Quantity: ${form.quantity} set(s)\n   - Nail Bed Size: ${form.nailBedSize || 'Not provided'}`;
    });

    const total = selectedIds.reduce((sum, id) => {
      const product = allProducts.find((p) => p.id === id);
      return sum + (product?.price || 0);
    }, 0);

    const message = `Hi! I'd like to order press-on nails.\n\nName: ${customerName}\n\nProducts (${selectedIds.length}):\n${orderLines.join('\n\n')}\n\nEstimated Total: ${formatNaira(total)}\n\nPlease confirm availability and delivery details. Thank you!`;
    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/message/CHLIAKCZOF4TP1?text=${encoded}`, '_blank');
  };

  const selectedIds = Object.keys(selectedProducts);
  const isFormValid =
    customerName.trim() &&
    selectedIds.length > 0 &&
    selectedIds.every((id) => {
      const f = selectedProducts[id];
      if (isReadyMade(id)) {
        return f.quantity && f.presetSize;
      }
      return f.nailShape && f.nailLength && f.quantity;
    });

  return (
    <Box sx={{ pt: { xs: 7, md: 8 } }}>
      <Box sx={{ py: 8, backgroundColor: '#FFF0F5' }}>
        <Container maxWidth="md">
          {/* Header */}
          <ScrollReveal direction="up">
            <Box sx={{ textAlign: 'center', mb: 5 }}>
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
                Place Your Order
              </Typography>
              <Typography sx={{ color: '#555', fontSize: '1.05rem', maxWidth: 520, mx: 'auto' }}>
                Select one or more press-on nail sets below, customize each,
                and confirm your order. We will connect you on WhatsApp to finalize.
              </Typography>
            </Box>
          </ScrollReveal>

          {/* Sticky Name Field */}
          <Box
            sx={{
              position: 'sticky',
              top: { xs: 56, md: 64 },
              zIndex: 10,
              backgroundColor: '#FFF0F5',
              pb: 2,
              pt: 1,
              mb: 2,
            }}
          >
            <Typography
              sx={{
                fontFamily: '"Georgia", serif',
                fontWeight: 700,
                color: '#4A0E4E',
                mb: 1,
                fontSize: '1.05rem',
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

          {/* Product Selection */}
          {productCategories.map((category, catIdx) => (
            <ScrollReveal key={category.id} direction="up" delay={catIdx * 0.1}>
              <Box sx={{ mb: 4 }}>
                <Typography
                  variant="h5"
                  sx={{
                    fontFamily: '"Georgia", serif',
                    fontWeight: 700,
                    color: '#4A0E4E',
                    mb: 2,
                  }}
                >
                  {category.title}
                </Typography>

                {category.readyMade && (
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                      mb: 1.5,
                      flexWrap: 'wrap',
                    }}
                  >
                    <Typography
                      sx={{
                        color: '#4A0E4E',
                        fontSize: '0.85rem',
                        fontWeight: 600,
                      }}
                    >
                      XS, S, M & L preset sizes available
                    </Typography>
                    <Typography
                      onClick={() => setSizeGuideOpen(true)}
                      sx={{
                        color: '#E91E8C',
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        textDecoration: 'underline',
                        textUnderlineOffset: 2,
                        '&:hover': { color: '#C2185B' },
                      }}
                    >
                      What are preset sizes?
                    </Typography>
                    <Tooltip title="Contact us for help" arrow>
                      <IconButton
                        onClick={handleContactClick}
                        size="small"
                        sx={{
                          color: '#E91E8C',
                          border: '1.5px solid #E91E8C',
                          width: 28,
                          height: 28,
                          '&:hover': {
                            backgroundColor: '#E91E8C',
                            color: '#fff',
                          },
                        }}
                      >
                        <PhoneOutlinedIcon sx={{ fontSize: 14 }} />
                      </IconButton>
                    </Tooltip>
                  </Box>
                )}

                {category.products.map((product) => {
                  const isSelected = !!selectedProducts[product.id];
                  const formData = selectedProducts[product.id] || (category.readyMade ? readyMadeForm : emptyForm);
                  const isReady = !!category.readyMade;

                  return (
                    <Box key={product.id} sx={{ mb: 2 }}>
                      <Card
                        elevation={0}
                        sx={{
                          borderRadius: 3,
                          border: isSelected
                            ? '2px solid #E91E8C'
                            : '1px solid #F0C0D0',
                          transition: 'all 0.3s ease',
                          cursor: 'pointer',
                          '&:hover': {
                            borderColor: '#E91E8C',
                            boxShadow: '0 4px 16px rgba(233,30,140,0.1)',
                          },
                        }}
                        onClick={() => handleToggleProduct(product.id)}
                      >
                        <CardContent sx={{ p: 2.5 }}>
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                            }}
                          >
                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={isSelected}
                                  sx={{
                                    color: '#E91E8C',
                                    '&.Mui-checked': { color: '#E91E8C' },
                                  }}
                                />
                              }
                              label={
                                <Box>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                                    <Typography
                                      sx={{
                                        fontFamily: '"Georgia", serif',
                                        fontWeight: 600,
                                        fontSize: '1rem',
                                      }}
                                    >
                                      {product.name}
                                    </Typography>
                                    {product.type && (
                                      <Chip
                                        label={product.type}
                                        size="small"
                                        sx={{
                                          backgroundColor: '#4A0E4E',
                                          color: '#fff',
                                          fontSize: '0.65rem',
                                          fontWeight: 700,
                                          height: 20,
                                        }}
                                      />
                                    )}
                                  </Box>
                                  <Typography sx={{ color: '#777', fontSize: '0.85rem' }}>
                                    {product.description}
                                  </Typography>
                                  {isReady && product.shape && product.length && (
                                    <Typography sx={{ color: '#999', fontSize: '0.78rem', mt: 0.3 }}>
                                      {product.shape} · {product.length}
                                      {product.stock !== undefined && (
                                        <Typography
                                          component="span"
                                          sx={{
                                            color: product.stock <= 2 ? '#E91E8C' : '#999',
                                            fontSize: '0.78rem',
                                            fontWeight: product.stock <= 2 ? 600 : 400,
                                            fontStyle: 'italic',
                                            ml: 1.5,
                                          }}
                                        >
                                          {product.stock} in stock
                                        </Typography>
                                      )}
                                    </Typography>
                                  )}
                                </Box>
                              }
                              sx={{ flex: 1, m: 0 }}
                              onClick={(e) => e.stopPropagation()}
                              onChange={() => handleToggleProduct(product.id)}
                            />
                            <Typography
                              sx={{
                                fontFamily: '"Georgia", serif',
                                fontWeight: 700,
                                color: '#E91E8C',
                                fontSize: '1.05rem',
                                whiteSpace: 'nowrap',
                                ml: 2,
                              }}
                            >
                              {formatNaira(product.price)}
                            </Typography>
                          </Box>
                        </CardContent>

                        {/* Customization Form */}
                        <Collapse in={isSelected}>
                          <Box sx={{ px: 3, pb: 3, pt: 1 }} onClick={(e) => e.stopPropagation()}>
                            {isReady ? (
                              /* Ready-made: quantity + preset size */
                              <Grid container spacing={2}>
                                <Grid item xs={12} sm={4}>
                                  <FormControl fullWidth size="small">
                                    <InputLabel>Quantity</InputLabel>
                                    <Select
                                      value={formData.quantity}
                                      label="Quantity"
                                      onChange={handleFieldChange(product.id, 'quantity')}
                                      sx={{ borderRadius: 2 }}
                                    >
                                      {Array.from({ length: product.stock || 5 }, (_, i) => i + 1).map((q) => (
                                        <MenuItem key={q} value={q}>
                                          {q} set{q > 1 ? 's' : ''}
                                        </MenuItem>
                                      ))}
                                    </Select>
                                  </FormControl>
                                </Grid>
                                <Grid item xs={12} sm={4}>
                                  <FormControl fullWidth size="small">
                                    <InputLabel>Preset Size</InputLabel>
                                    <Select
                                      value={formData.presetSize}
                                      label="Preset Size"
                                      onChange={handleFieldChange(product.id, 'presetSize')}
                                      sx={{ borderRadius: 2 }}
                                    >
                                      {presetSizes.map((size) => (
                                        <MenuItem key={size} value={size}>
                                          {size}
                                        </MenuItem>
                                      ))}
                                    </Select>
                                  </FormControl>
                                </Grid>
                                <Grid item xs={12} sm={4}>
                                  <Box
                                    sx={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      height: '100%',
                                      px: 1,
                                    }}
                                  >
                                    <Typography sx={{ color: '#999', fontSize: '0.85rem', fontStyle: 'italic' }}>
                                      Pre-made set — shape, length & design are as shown.
                                    </Typography>
                                  </Box>
                                </Grid>
                              </Grid>
                            ) : (
                              /* Custom: full form */
                              <Grid container spacing={2}>
                                <Grid item xs={12} sm={4}>
                                  <FormControl fullWidth size="small">
                                    <InputLabel>Nail Shape</InputLabel>
                                    <Select
                                      value={formData.nailShape}
                                      label="Nail Shape"
                                      onChange={handleFieldChange(product.id, 'nailShape')}
                                      sx={{ borderRadius: 2 }}
                                    >
                                      {pressOnNailShapes.map((shape) => (
                                        <MenuItem key={shape} value={shape}>
                                          {shape}
                                        </MenuItem>
                                      ))}
                                    </Select>
                                  </FormControl>
                                </Grid>
                                <Grid item xs={12} sm={4}>
                                  <FormControl fullWidth size="small">
                                    <InputLabel>Nail Length</InputLabel>
                                    <Select
                                      value={formData.nailLength}
                                      label="Nail Length"
                                      onChange={handleFieldChange(product.id, 'nailLength')}
                                      sx={{ borderRadius: 2 }}
                                    >
                                      {pressOnLengths.map((len) => (
                                        <MenuItem key={len} value={len}>
                                          {len}
                                        </MenuItem>
                                      ))}
                                    </Select>
                                  </FormControl>
                                </Grid>
                                <Grid item xs={12} sm={4}>
                                  <FormControl fullWidth size="small">
                                    <InputLabel>Quantity</InputLabel>
                                    <Select
                                      value={formData.quantity}
                                      label="Quantity"
                                      onChange={handleFieldChange(product.id, 'quantity')}
                                      sx={{ borderRadius: 2 }}
                                    >
                                      {pressOnQuantities.map((q) => (
                                        <MenuItem key={q} value={q}>
                                          {q} set{q > 1 ? 's' : ''}
                                        </MenuItem>
                                      ))}
                                    </Select>
                                  </FormControl>
                                </Grid>
                                <Grid item xs={12}>
                                  <NailBedSizeInput
                                    value={formData.nailBedSize}
                                    onChange={(val) => handleNailBedChange(product.id, val)}
                                  />
                                </Grid>
                              </Grid>
                            )}
                          </Box>
                        </Collapse>
                      </Card>
                    </Box>
                  );
                })}
              </Box>
            </ScrollReveal>
          ))}

          {/* spacer so content doesn't hide behind sticky button */}
          <Box sx={{ height: 80 }} />
        </Container>
      </Box>

      {/* Sticky Confirm Button */}
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
        {selectedIds.length > 0 && (
          <Typography
            sx={{
              fontSize: '0.8rem',
              color: '#E91E8C',
              fontWeight: 600,
              mb: 0.5,
            }}
          >
            {selectedIds.length} product{selectedIds.length > 1 ? 's' : ''} selected
          </Typography>
        )}
        <Button
          sx={{
            ...confirmButtonSx,
            opacity: isFormValid ? 1 : 0.5,
          }}
          onClick={handleConfirmOrder}
          disabled={!isFormValid}
        >
          Confirm Order
        </Button>
      </Box>

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
            Order Placed!
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ color: '#555', mt: 1, lineHeight: 1.7 }}>
            Your press-on nail order is being processed. We will navigate you to
            WhatsApp to confirm your design, nail bed measurements, and delivery details.
          </Typography>
          {selectedIds.length > 0 && (
            <Box sx={{ mt: 2, textAlign: 'left' }}>
              <Typography sx={{ fontWeight: 600, color: '#4A0E4E', fontSize: '0.95rem', mb: 0.5 }}>
                Products ordered:
              </Typography>
              {selectedIds.map((id) => {
                const product = allProducts.find((p) => p.id === id);
                return (
                  <Typography key={id} sx={{ color: '#555', fontSize: '0.9rem', pl: 1 }}>
                    • {product?.name || 'Product'} — {product ? formatNaira(product.price) : ''}
                  </Typography>
                );
              })}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
          <Button
            onClick={handleCompleteOrder}
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
            Complete Order
          </Button>
        </DialogActions>
      </Dialog>

      {/* Preset Size Guide Modal */}
      <PresetSizeGuide open={sizeGuideOpen} onClose={() => setSizeGuideOpen(false)} />
    </Box>
  );
}
