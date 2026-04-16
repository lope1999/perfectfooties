import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Container,
  Grid,
  Card,
  CardMedia,
  CardContent,
  Button,
  Chip,
  TextField,
  MenuItem,
  CircularProgress,
} from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ScrollReveal from '../components/ScrollReveal';
import { fetchProducts } from '../lib/productService';
import { LEATHER_CATEGORIES } from '../data/products';

function formatNaira(amount) {
  return `₦${Number(amount).toLocaleString()}`;
}

const STATUS_CONFIG = {
  open:     { label: 'Available',   color: '#2e7d32', bg: '#e8f5e9' },
  upcoming: { label: 'Coming Soon', color: '#e65100', bg: '#fff3e0' },
  closed:   { label: 'Sold Out',    color: '#616161', bg: '#f5f5f5' },
};

const categoryOptions = [
  { value: 'All', label: 'All Products' },
  ...LEATHER_CATEGORIES.map((c) => ({ value: c.id, label: c.label })),
];

const ff = '"Georgia", serif';

export default function ShopPage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState('All');

  useEffect(() => {
    fetchProducts({ activeOnly: true })
      .then(setProducts)
      .catch(() => setProducts([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (categoryFilter === 'All') return products;
    return products.filter((p) => p.category === categoryFilter);
  }, [products, categoryFilter]);

  const availableCategories = useMemo(() => {
    const seen = new Set(products.map((p) => p.category).filter(Boolean));
    return categoryOptions.filter((opt) => opt.value === 'All' || seen.has(opt.value));
  }, [products]);

  return (
    <Box sx={{ pt: 12, pb: { xs: 12, md: 6 } }}>
      {/* Back navigation */}
      <Box sx={{ px: { xs: 2, sm: 4 }, pt: 1, pb: 0 }}>
        <Button
          startIcon={<ArrowBackIosNewIcon sx={{ fontSize: '0.75rem !important' }} />}
          onClick={() => navigate('/')}
          sx={{
            fontFamily: ff,
            fontWeight: 600,
            fontSize: '0.85rem',
            color: 'var(--text-muted)',
            textTransform: 'none',
            px: 1.5,
            py: 0.6,
            borderRadius: '20px',
            border: '1px solid #eee',
            backgroundColor: '#fff',
            boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
            '&:hover': {
              backgroundColor: '#FFF8F0',
              borderColor: '#e3242b',
              color: '#e3242b',
            },
          }}
        >
          Home
        </Button>
      </Box>

      {/* Header */}
      <Box sx={{ textAlign: 'center', py: 6, backgroundColor: '#fff' }}>
        <ScrollReveal direction="up">
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 1 }}>
            <AutoAwesomeIcon sx={{ color: '#e3242b', fontSize: 32 }} />
          </Box>
          <Typography
            variant="h3"
            sx={{
              fontFamily: ff,
              fontWeight: 700,
              color: 'var(--text-main)',
              mb: 2,
              fontSize: { xs: '1.8rem', sm: '2.4rem', md: '3rem' },
            }}
          >
            Shop Leather Goods
          </Typography>
          <Typography
            sx={{
              maxWidth: 600,
              mx: 'auto',
              color: 'var(--text-muted)',
              fontSize: '1.05rem',
              lineHeight: 1.7,
              px: 2,
            }}
          >
            Handcrafted leather goods made to order in Lagos. Each piece is cut, stitched,
            and finished by hand — built to last and shaped to your preference.
          </Typography>
        </ScrollReveal>

        <ScrollReveal direction="up" delay={0.1}>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1,
              mt: 2,
            }}
          >
            <AccessTimeIcon sx={{ color: '#e3242b', fontSize: 18 }} />
            <Typography sx={{ color: '#e3242b', fontSize: '0.9rem', fontWeight: 600 }}>
              Made to order — 5–10 business day production
            </Typography>
          </Box>
        </ScrollReveal>
      </Box>

      <Container maxWidth="lg">
        {/* Category filter */}
        {availableCategories.length > 2 && (
          <Box sx={{ mb: 4, display: 'flex', justifyContent: 'center' }}>
            <TextField
              select
              size="small"
              label="Filter by Category"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              sx={{ minWidth: 200, '& .MuiOutlinedInput-root': { borderRadius: 3 } }}
            >
              {availableCategories.map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>
                  {opt.label}
                </MenuItem>
              ))}
            </TextField>
          </Box>
        )}

        {loading && (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <CircularProgress sx={{ color: '#e3242b' }} />
          </Box>
        )}

        {!loading && filtered.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography sx={{ color: 'var(--text-muted)', fontSize: '1rem' }}>
              No products available right now — check back soon.
            </Typography>
          </Box>
        )}

        <Grid container spacing={3}>
          {filtered.map((product, i) => {
            const statusCfg = STATUS_CONFIG[product.status] || STATUS_CONFIG.closed;
            const coverImage =
              Array.isArray(product.images) && product.images.length > 0
                ? product.images[0]
                : null;

            return (
              <Grid item xs={12} sm={6} md={4} key={product.id}>
                <ScrollReveal direction="up" delay={i * 0.06}>
                  <Card
                    onClick={() =>
                      product.status !== 'closed' && navigate(`/shop/${product.id}`)
                    }
                    sx={{
                      borderRadius: 3,
                      overflow: 'hidden',
                      boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
                      border: '1px solid #E8D5B0',
                      cursor: product.status !== 'closed' ? 'pointer' : 'default',
                      transition: 'all 0.25s ease',
                      '&:hover':
                        product.status !== 'closed'
                          ? { boxShadow: '0 6px 24px rgba(0,0,0,0.12)', transform: 'translateY(-3px)' }
                          : {},
                    }}
                  >
                    {coverImage ? (
                      <CardMedia
                        component="img"
                        image={coverImage}
                        alt={product.name}
                        sx={{ height: 240, objectFit: 'cover' }}
                      />
                    ) : (
                      <Box
                        sx={{
                          height: 240,
                          backgroundColor: '#FFF8F0',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <AutoAwesomeIcon sx={{ color: '#E8D5B0', fontSize: 48 }} />
                      </Box>
                    )}

                    <CardContent sx={{ p: 2.5 }}>
                      <Box
                        sx={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'flex-start',
                          mb: 1,
                        }}
                      >
                        <Typography
                          sx={{
                            fontFamily: ff,
                            fontWeight: 700,
                            fontSize: '1rem',
                            color: 'var(--text-main)',
                            flex: 1,
                            mr: 1,
                          }}
                        >
                          {product.name}
                        </Typography>
                        <Chip
                          label={statusCfg.label}
                          size="small"
                          sx={{
                            backgroundColor: statusCfg.bg,
                            color: statusCfg.color,
                            fontWeight: 700,
                            fontSize: '0.65rem',
                            height: 22,
                            flexShrink: 0,
                          }}
                        />
                      </Box>

                      {product.material && (
                        <Typography
                          sx={{ fontSize: '0.78rem', color: '#e3242b', fontWeight: 600, mb: 1 }}
                        >
                          {product.material}
                        </Typography>
                      )}

                      {product.description && (
                        <Typography
                          sx={{
                            fontSize: '0.82rem',
                            color: 'var(--text-muted)',
                            lineHeight: 1.5,
                            mb: 1.5,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}
                        >
                          {product.description}
                        </Typography>
                      )}

                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          mt: 1,
                        }}
                      >
                        <Typography
                          sx={{
                            fontFamily: ff,
                            fontWeight: 700,
                            fontSize: '1.1rem',
                            color: 'var(--text-purple)',
                          }}
                        >
                          {formatNaira(product.price)}
                        </Typography>

                        {product.maxOrders && (
                          <Typography sx={{ fontSize: '0.72rem', color: '#888' }}>
                            {product.maxOrders - (product.orderCount || 0)} left
                          </Typography>
                        )}
                      </Box>

                      <Button
                        fullWidth
                        disabled={product.status === 'closed'}
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/shop/${product.id}`);
                        }}
                        sx={{
                          mt: 2,
                          borderRadius: '20px',
                          fontFamily: ff,
                          fontWeight: 600,
                          fontSize: '0.85rem',
                          textTransform: 'none',
                          backgroundColor: product.status === 'open' ? '#e3242b' : 'transparent',
                          color:
                            product.status === 'open'
                              ? '#fff'
                              : product.status === 'upcoming'
                              ? '#e65100'
                              : '#aaa',
                          border: `1.5px solid ${
                            product.status === 'open'
                              ? '#e3242b'
                              : product.status === 'upcoming'
                              ? '#e65100'
                              : '#ddd'
                          }`,
                          '&:hover':
                            product.status !== 'closed'
                              ? {
                                  backgroundColor:
                                    product.status === 'open' ? '#b81b21' : '#fff3e0',
                                }
                              : {},
                          '&.Mui-disabled': {
                            color: '#aaa',
                            borderColor: '#ddd',
                            backgroundColor: 'transparent',
                          },
                        }}
                      >
                        {product.status === 'open'
                          ? 'Order Now'
                          : product.status === 'upcoming'
                          ? 'Coming Soon'
                          : 'Sold Out'}
                      </Button>
                    </CardContent>
                  </Card>
                </ScrollReveal>
              </Grid>
            );
          })}
        </Grid>
      </Container>
    </Box>
  );
}
