import { useState } from 'react';
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
} from '@mui/material';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined';
import ScrollReveal from '../components/ScrollReveal';
import PresetSizeGuide from '../components/PresetSizeGuide';
import { productCategories } from '../data/products';

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

export default function ProductsMenuPage() {
  const navigate = useNavigate();
  const location = useLocation();
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
            Shop our handmade press-on nails — salon-quality designs you
            can apply at home. Each set comes with a complimentary nail
            kit. Choose your style, customize your fit, and place your
            order below.
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
            <LocalShippingOutlinedIcon
              sx={{ color: '#E91E8C', fontSize: 20 }}
            />
            <Typography
              sx={{
                color: '#E91E8C',
                fontSize: '0.9rem',
                fontWeight: 600,
              }}
            >
              Delivery only available only in lagos
            </Typography>
          </Box>
        </ScrollReveal>
      </Box>

      {/* Product Sections */}
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
                    fontSize: {
                      xs: '1.3rem',
                      sm: '1.7rem',
                      md: '2.1rem',
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

                {/* Preset sizes info for ready-made products */}
                {category.readyMade && (
                  <Box
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 1,
                      mt: 1,
                      mb: 0.5,
                      flexWrap: 'wrap',
                    }}
                  >
                    <Typography
                      sx={{
                        color: '#4A0E4E',
                        fontSize: '0.9rem',
                        fontWeight: 600,
                      }}
                    >
                      XS, S, M & L preset nail sizes available
                    </Typography>
                    <Typography
                      onClick={() => setSizeGuideOpen(true)}
                      sx={{
                        color: '#E91E8C',
                        fontSize: '0.85rem',
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
                          width: 30,
                          height: 30,
                          '&:hover': {
                            backgroundColor: '#E91E8C',
                            color: '#fff',
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
                  <Grid item xs={12} sm={6} md={category.readyMade ? 4 : 3} key={product.id}>
                    <ScrollReveal direction="up" delay={pIdx * 0.1}>
                      <Card
                        elevation={0}
                        sx={{
                          borderRadius: 3,
                          border: '1px solid #F0C0D0',
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          overflow: 'hidden',
                          transition:
                            'transform 0.3s ease, box-shadow 0.3s ease',
                          '&:hover': {
                            transform: 'translateY(-6px)',
                            boxShadow:
                              '0 12px 32px rgba(233,30,140,0.15)',
                          },
                        }}
                      >
                        <Box sx={{ position: 'relative' }}>
                          <Box
                            component="img"
                            src={product.image}
                            alt={product.name}
                            sx={{
                              width: '100%',
                              height: 160,
                              objectFit: 'cover',
                            }}
                          />
                          {product.type && (
                            <Chip
                              label={product.type}
                              size="small"
                              sx={{
                                position: 'absolute',
                                top: 8,
                                left: 8,
                                backgroundColor: '#4A0E4E',
                                color: '#fff',
                                fontSize: '0.7rem',
                                fontWeight: 700,
                                height: 22,
                              }}
                            />
                          )}
                          {product.stock !== undefined && (
                            <Chip
                              label="Ready to ship"
                              size="small"
                              sx={{
                                position: 'absolute',
                                top: 8,
                                right: 8,
                                backgroundColor: '#E91E8C',
                                color: '#fff',
                                fontSize: '0.7rem',
                                fontWeight: 600,
                                height: 22,
                              }}
                            />
                          )}
                        </Box>
                        <CardContent sx={{ flex: 1, p: 3 }}>
                          <Typography
                            variant="h6"
                            sx={{
                              fontFamily: '"Georgia", serif',
                              fontWeight: 700,
                              color: '#000',
                              fontSize: '1rem',
                              mb: 0.5,
                            }}
                          >
                            {product.name}
                          </Typography>
                          {product.shape && product.length && (
                            <Typography
                              sx={{
                                color: '#999',
                                fontSize: '0.78rem',
                                mb: 0.8,
                              }}
                            >
                              {product.shape} · {product.length}
                            </Typography>
                          )}
                          <Typography
                            sx={{
                              color: '#666',
                              fontSize: '0.85rem',
                              lineHeight: 1.5,
                              mb: 2,
                            }}
                          >
                            {product.description}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
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
                            {product.stock !== undefined && (
                              <Typography
                                sx={{
                                  color: product.stock <= 2 ? '#E91E8C' : '#999',
                                  fontSize: '0.78rem',
                                  fontWeight: product.stock <= 2 ? 600 : 400,
                                  fontStyle: 'italic',
                                }}
                              >
                                {product.stock} in stock
                              </Typography>
                            )}
                          </Box>
                        </CardContent>
                      </Card>
                    </ScrollReveal>
                  </Grid>
                ))}
              </Grid>

              <ScrollReveal direction="up" delay={0.2}>
                <Box sx={{ textAlign: 'center' }}>
                  <Button sx={orderButtonSx} onClick={() => navigate('/order')}>
                    Place Order
                  </Button>
                </Box>
              </ScrollReveal>
            </Container>
          </Box>
        </Box>
      ))}

      {/* Preset Size Guide Modal */}
      <PresetSizeGuide open={sizeGuideOpen} onClose={() => setSizeGuideOpen(false)} />
    </Box>
  );
}
