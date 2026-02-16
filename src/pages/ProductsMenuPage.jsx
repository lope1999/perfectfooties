import { useState } from 'react';
import {
  Box,
  Typography,
  Container,
  Card,
  CardContent,
  Grid,
  Button,
  Radio,
  RadioGroup,
  FormControlLabel,
  Collapse,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
} from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import ScrollReveal from '../components/ScrollReveal';
import Interstitial from '../components/Interstitial';
import NailBedSizeInput from '../components/NailBedSizeInput';
import {
  productCategories,
  pressOnNailShapes,
  pressOnLengths,
  pressOnQuantities,
} from '../data/products';

const sectionColors = ['#FFF0F5', '#FCE4EC', '#F3E5F6', '#F8E8F0'];

function formatNaira(amount) {
  return `₦${amount.toLocaleString()}`;
}

const orderButtonSx = {
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

export default function ProductsMenuPage() {
  const [selectedProduct, setSelectedProduct] = useState('');
  const [formData, setFormData] = useState({
    nailShape: '',
    nailLength: '',
    quantity: '',
    nailBedSize: '',
  });
  const [modalOpen, setModalOpen] = useState(false);

  const allProducts = productCategories.flatMap((cat) =>
    cat.products.map((p) => ({ ...p, category: cat.title }))
  );

  const handleProductChange = (event) => {
    setSelectedProduct(event.target.value);
    setFormData({ nailShape: '', nailLength: '', quantity: '', nailBedSize: '' });
  };

  const handleFieldChange = (field) => (event) => {
    setFormData((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handlePlaceOrder = () => {
    setModalOpen(true);
  };

  const handleCompleteOrder = () => {
    setModalOpen(false);
    const selected = allProducts.find((p) => p.id === selectedProduct);
    const message = `Hi! I'd like to order press-on nails:\n\nProduct: ${selected?.name || 'Press-on nails'}\nPrice: ${selected ? formatNaira(selected.price) : ''}\n\nDetails:\n- Nail Shape: ${formData.nailShape}\n- Nail Length: ${formData.nailLength}\n- Quantity: ${formData.quantity} set(s)\n- Nail Bed Size: ${formData.nailBedSize}\n\nPlease confirm availability and delivery details. Thank you!`;
    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/message/CHLIAKCZOF4TP1?text=${encoded}`, '_blank');
  };

  const isFormValid =
    selectedProduct && formData.nailShape && formData.nailLength && formData.quantity;

  return (
    <Box sx={{ pt: 12 }}>
      {/* Page Header */}
      <Box sx={{ textAlign: 'center', py: 6, backgroundColor: '#fff' }}>
        <ScrollReveal direction="up">
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
            Products Menu
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
            Shop our handmade press-on nails — salon-quality designs you can apply at home.
            Each set comes with a complimentary nail kit. Choose your style, customize your
            fit, and place your order below.
          </Typography>
        </ScrollReveal>
        <ScrollReveal direction="up" delay={0.25}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1,
              mt: 2,
            }}
          >
            <LocalShippingOutlinedIcon sx={{ color: '#E91E8C', fontSize: 20 }} />
            <Typography sx={{ color: '#E91E8C', fontSize: '0.9rem', fontWeight: 600 }}>
              Delivery available nationwide
            </Typography>
          </Box>
        </ScrollReveal>
      </Box>

      {/* Browse Categories */}
      {productCategories.map((category, index) => (
        <Box key={category.id}>
          <Box
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
                    mb: 1,
                    maxWidth: 580,
                    mx: 'auto',
                    lineHeight: 1.6,
                  }}
                >
                  {category.description}
                </Typography>
                {category.note && (
                  <Typography
                    sx={{
                      textAlign: 'center',
                      color: '#E91E8C',
                      fontWeight: 600,
                      fontSize: '0.9rem',
                      mb: 4,
                    }}
                  >
                    {category.note}
                  </Typography>
                )}
                {!category.note && <Box sx={{ mb: 4 }} />}
              </ScrollReveal>

              <Grid container spacing={3}>
                {category.products.map((product, pIdx) => (
                  <Grid item xs={12} sm={6} md={3} key={product.id}>
                    <ScrollReveal direction="up" delay={pIdx * 0.1}>
                      <Card
                        elevation={0}
                        sx={{
                          borderRadius: 3,
                          border: '1px solid #F0C0D0',
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                          '&:hover': {
                            transform: 'translateY(-6px)',
                            boxShadow: '0 12px 32px rgba(233,30,140,0.15)',
                          },
                        }}
                      >
                        <CardContent sx={{ flex: 1, p: 3 }}>
                          <Typography
                            variant="h6"
                            sx={{
                              fontFamily: '"Georgia", serif',
                              fontWeight: 700,
                              color: '#000',
                              fontSize: '1rem',
                              mb: 1,
                            }}
                          >
                            {product.name}
                          </Typography>
                          <Typography sx={{ color: '#666', fontSize: '0.85rem', lineHeight: 1.5, mb: 2 }}>
                            {product.description}
                          </Typography>
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
                        </CardContent>
                      </Card>
                    </ScrollReveal>
                  </Grid>
                ))}
              </Grid>
            </Container>
          </Box>

          {/* Interstitial between sections */}
          {index < productCategories.length - 1 && index % 2 === 0 && (
            <Interstitial
              image="https://images.unsplash.com/photo-1604654894610-df63bc536371?w=1920&q=80"
              text="Hope it's great so far"
              overlayColor="rgba(74, 14, 78, 0.55)"
            />
          )}
        </Box>
      ))}

      {/* Order Section */}
      <Box sx={{ py: 8, backgroundColor: '#fff' }}>
        <Container maxWidth="md">
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
                Select a press-on nail set below, customize your preferences,
                and we will connect you on WhatsApp to confirm your design and delivery.
              </Typography>
            </Box>
          </ScrollReveal>

          <RadioGroup value={selectedProduct} onChange={handleProductChange}>
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

                  {category.products.map((product) => (
                    <Box key={product.id} sx={{ mb: 2 }}>
                      <Card
                        elevation={0}
                        sx={{
                          borderRadius: 3,
                          border:
                            selectedProduct === product.id
                              ? '2px solid #E91E8C'
                              : '1px solid #F0C0D0',
                          transition: 'all 0.3s ease',
                          cursor: 'pointer',
                          '&:hover': {
                            borderColor: '#E91E8C',
                            boxShadow: '0 4px 16px rgba(233,30,140,0.1)',
                          },
                        }}
                        onClick={() =>
                          handleProductChange({ target: { value: product.id } })
                        }
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
                              value={product.id}
                              control={
                                <Radio
                                  sx={{
                                    color: '#E91E8C',
                                    '&.Mui-checked': { color: '#E91E8C' },
                                  }}
                                />
                              }
                              label={
                                <Box>
                                  <Typography
                                    sx={{
                                      fontFamily: '"Georgia", serif',
                                      fontWeight: 600,
                                      fontSize: '1rem',
                                    }}
                                  >
                                    {product.name}
                                  </Typography>
                                  <Typography sx={{ color: '#777', fontSize: '0.85rem' }}>
                                    {product.description}
                                  </Typography>
                                </Box>
                              }
                              sx={{ flex: 1, m: 0 }}
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
                        <Collapse in={selectedProduct === product.id}>
                          <Box
                            sx={{ px: 3, pb: 3, pt: 1 }}
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Grid container spacing={2}>
                              <Grid item xs={12} sm={4}>
                                <FormControl fullWidth size="small">
                                  <InputLabel>Nail Shape</InputLabel>
                                  <Select
                                    value={formData.nailShape}
                                    label="Nail Shape"
                                    onChange={handleFieldChange('nailShape')}
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
                                    onChange={handleFieldChange('nailLength')}
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
                                    onChange={handleFieldChange('quantity')}
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
                                  onChange={(val) =>
                                    setFormData((prev) => ({ ...prev, nailBedSize: val }))
                                  }
                                />
                              </Grid>
                            </Grid>
                          </Box>
                        </Collapse>
                      </Card>
                    </Box>
                  ))}
                </Box>
              </ScrollReveal>
            ))}
          </RadioGroup>

          {/* Place Order Button */}
          <ScrollReveal direction="up">
            <Box sx={{ textAlign: 'center', mt: 4 }}>
              <Button
                sx={{
                  ...orderButtonSx,
                  opacity: isFormValid ? 1 : 0.5,
                  pointerEvents: isFormValid ? 'auto' : 'none',
                }}
                onClick={handlePlaceOrder}
                disabled={!isFormValid}
              >
                Place Order
              </Button>
            </Box>
          </ScrollReveal>
        </Container>
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
    </Box>
  );
}
