import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Container,
  Button,
  Chip,
  IconButton,
  CircularProgress,
  Alert,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import { fetchNicheCollections } from '../lib/nicheCollectionService';
import { useCart } from '../context/CartContext';
import { useNotifications } from '../context/NotificationContext';
import NailShapeSelector from '../components/NailShapeSelector';
import NailLengthSelector from '../components/NailLengthSelector';
import NailBedSizeInput from '../components/NailBedSizeInput';

function formatNaira(amount) {
  return `₦${Number(amount).toLocaleString()}`;
}

const STATUS_CONFIG = {
  open: { label: 'Open for Orders', color: '#2e7d32', bg: '#e8f5e9' },
  upcoming: { label: 'Coming Soon', color: '#e65100', bg: '#fff3e0' },
  closed: { label: 'Orders Closed', color: '#616161', bg: '#f5f5f5' },
};

export default function NicheCollectionDetailPage() {
  const { collectionId } = useParams();
  const navigate = useNavigate();
  const { addPressOn } = useCart();
  const { showToast } = useNotifications();

  const [collection, setCollection] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImage, setActiveImage] = useState(0);

  const [shape, setShape] = useState('');
  const [length, setLength] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [nailMeasurements, setNailMeasurements] = useState('');
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchNicheCollections()
      .then((all) => {
        const found = all.find((c) => c.id === collectionId);
        setCollection(found || null);
      })
      .catch(() => setCollection(null))
      .finally(() => setLoading(false));
  }, [collectionId]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress sx={{ color: '#E91E8C' }} />
      </Box>
    );
  }

  if (!collection) {
    return (
      <Box sx={{ pt: 14, textAlign: 'center' }}>
        <Typography sx={{ color: 'var(--text-muted)' }}>Collection not found.</Typography>
        <Button onClick={() => navigate('/collections')} sx={{ mt: 2, color: '#E91E8C' }}>
          Back to Collections
        </Button>
      </Box>
    );
  }

  const statusCfg = STATUS_CONFIG[collection.status] || STATUS_CONFIG.closed;
  const images = Array.isArray(collection.images) && collection.images.length > 0 ? collection.images : [];

  const isAtOrderCap =
    collection.maxOrders != null && (collection.orderCount || 0) >= collection.maxOrders;

  const canOrder = collection.status === 'open' && !isAtOrderCap;

  // Length-based pricing
  const lengthSurcharges = collection.lengthSurcharges || {};
  const lengthSurcharge = length ? (lengthSurcharges[length] || 0) : 0;
  const adjustedBasePrice = collection.price + lengthSurcharge;

  // Build surcharges map for the selector (show 0 as "base" for first, surcharge for rest)
  const surchargesForSelector = Object.keys(lengthSurcharges).length > 0 ? lengthSurcharges : null;

  // Multi-set discount applied on top of the length-adjusted price
  const discountApplied = canOrder && collection.multiSetDiscount && quantity >= 2;
  const discountPct = collection.multiSetDiscountPercent || 0;
  const pricePerSet = discountApplied
    ? Math.round(adjustedBasePrice * (1 - discountPct / 100))
    : adjustedBasePrice;
  const totalPrice = pricePerSet * quantity;

  const validate = () => {
    const e = {};
    if (!shape) e.shape = 'Please select a shape';
    if (!length) e.length = 'Please select a length';
    if (collection.requiresMeasurements) {
      const filled = nailMeasurements.split(',').filter((p) => p.includes(':')).length;
      if (filled < 10) e.measurements = 'Please enter all 10 nail measurements';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleAddToCart = () => {
    if (!validate()) return;

    addPressOn({
      nicheCollection: true,
      collectionId: collection.id,
      name: collection.name,
      season: collection.season || '',
      shape,
      length,
      quantity,
      price: pricePerSet,
      originalPrice: adjustedBasePrice,
      image: images[0] || '',
      nailMeasurements: collection.requiresMeasurements ? nailMeasurements : '',
      productionDays: '4-7',
    });

    showToast(`${collection.name} added to cart`, 'success');
    navigate('/cart');
  };

  return (
    <Box sx={{ pt: 12, pb: { xs: 12, md: 6 } }}>
      <Container maxWidth="lg">
        {/* Breadcrumb nav */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 3, flexWrap: 'wrap' }}>
          <Button
            onClick={() => navigate('/products')}
            sx={{
              fontFamily: '"Georgia", serif',
              fontSize: '0.82rem',
              color: 'var(--text-muted)',
              textTransform: 'none',
              p: 0,
              minWidth: 0,
              '&:hover': { color: '#E91E8C', backgroundColor: 'transparent' },
            }}
          >
            Press-ons Menu
          </Button>
          <Typography sx={{ color: '#ccc', fontSize: '0.82rem' }}>/</Typography>
          <Button
            startIcon={<ArrowBackIcon sx={{ fontSize: '0.8rem !important' }} />}
            onClick={() => navigate('/collections')}
            sx={{
              fontFamily: '"Georgia", serif',
              fontSize: '0.82rem',
              color: 'var(--text-muted)',
              textTransform: 'none',
              p: 0,
              minWidth: 0,
              '&:hover': { color: '#E91E8C', backgroundColor: 'transparent' },
            }}
          >
            All Collections
          </Button>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, gap: 5 }}>
          {/* Left — Images */}
          <Box sx={{ flex: '0 0 auto', width: { xs: '100%', md: '50%' } }}>
            {images.length > 0 ? (
              <>
                <Box
                  component="img"
                  src={images[activeImage]}
                  alt={collection.name}
                  sx={{
                    width: '100%',
                    maxHeight: 480,
                    objectFit: 'cover',
                    borderRadius: 3,
                    border: '1px solid #F0C0D0',
                    display: 'block',
                  }}
                />
                {images.length > 1 && (
                  <Box sx={{ display: 'flex', gap: 1, mt: 1.5, flexWrap: 'wrap' }}>
                    {images.map((img, i) => (
                      <Box
                        key={i}
                        component="img"
                        src={img}
                        alt={`${collection.name} ${i + 1}`}
                        onClick={() => setActiveImage(i)}
                        sx={{
                          width: 64,
                          height: 64,
                          objectFit: 'cover',
                          borderRadius: 2,
                          border: `2px solid ${activeImage === i ? '#E91E8C' : '#F0C0D0'}`,
                          cursor: 'pointer',
                          transition: 'border-color 0.15s',
                          '&:hover': { borderColor: '#E91E8C' },
                        }}
                      />
                    ))}
                  </Box>
                )}
              </>
            ) : (
              <Box
                sx={{
                  width: '100%',
                  height: 320,
                  backgroundColor: '#FFF0F5',
                  borderRadius: 3,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid #F0C0D0',
                }}
              >
                <AutoAwesomeIcon sx={{ color: '#F0C0D0', fontSize: 64 }} />
              </Box>
            )}
          </Box>

          {/* Right — Details & Ordering */}
          <Box sx={{ flex: 1 }}>
            {/* Title + status */}
            <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2, mb: 1 }}>
              <Typography
                variant="h4"
                sx={{
                  fontFamily: '"Georgia", serif',
                  fontWeight: 700,
                  color: 'var(--text-main)',
                  fontSize: { xs: '1.5rem', md: '1.9rem' },
                  flex: 1,
                }}
              >
                {collection.name}
              </Typography>
              <Chip
                label={statusCfg.label}
                size="small"
                sx={{
                  backgroundColor: statusCfg.bg,
                  color: statusCfg.color,
                  fontWeight: 700,
                  fontSize: '0.7rem',
                  flexShrink: 0,
                  mt: 0.5,
                }}
              />
            </Box>

            {collection.season && (
              <Typography sx={{ color: '#E91E8C', fontWeight: 600, fontSize: '0.9rem', mb: 1.5 }}>
                {collection.season} Collection
              </Typography>
            )}

            <Typography sx={{ color: 'var(--text-muted)', lineHeight: 1.7, fontSize: '0.95rem', mb: 2.5 }}>
              {collection.description}
            </Typography>

            {/* Price */}
            <Box sx={{ mb: 3 }}>
              <Typography
                sx={{
                  fontFamily: '"Georgia", serif',
                  fontWeight: 700,
                  fontSize: '1.7rem',
                  color: 'var(--text-purple)',
                }}
              >
                {!length && surchargesForSelector ? (
                  <>
                    <Typography component="span" sx={{ fontSize: '0.85rem', fontWeight: 400, color: 'var(--text-muted)', mr: 0.5 }}>from</Typography>
                    {formatNaira(collection.price)}
                  </>
                ) : (
                  formatNaira(adjustedBasePrice)
                )}
                <Typography component="span" sx={{ fontSize: '0.85rem', fontWeight: 400, color: 'var(--text-muted)', ml: 0.5 }}>
                  per set
                </Typography>
              </Typography>
              {length && lengthSurcharge > 0 && (
                <Typography sx={{ fontSize: '0.78rem', color: '#888', mt: 0.3 }}>
                  Base {formatNaira(collection.price)} + {formatNaira(lengthSurcharge)} ({length})
                </Typography>
              )}
            </Box>

            {/* Production timeline notice */}
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                mb: 3,
                p: 1.5,
                backgroundColor: '#FFF0F5',
                borderRadius: 2,
                border: '1px solid #F0C0D0',
              }}
            >
              <AccessTimeIcon sx={{ color: '#E91E8C', fontSize: 18, flexShrink: 0 }} />
              <Typography sx={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.4 }}>
                <strong>Made to order</strong> — your set will be crafted fresh. Ready in{' '}
                <strong>4–7 business days</strong> after order confirmation.
              </Typography>
            </Box>

            {/* Ordering UI — only shown when open */}
            {canOrder && (
              <>
                {/* Shape */}
                <Box sx={{ mb: 3 }}>
                  <Typography
                    sx={{
                      fontFamily: '"Georgia", serif',
                      fontWeight: 700,
                      fontSize: '0.95rem',
                      color: 'var(--text-main)',
                      mb: 1,
                    }}
                  >
                    Shape
                    {shape && (
                      <Typography component="span" sx={{ ml: 1, fontWeight: 400, color: '#E91E8C', fontSize: '0.85rem' }}>
                        — {shape}
                      </Typography>
                    )}
                  </Typography>
                  <NailShapeSelector
                    value={shape}
                    onChange={(s) => { setShape(s); setErrors((e) => ({ ...e, shape: '' })); }}
                    availableOnly={collection.availableShapes?.length > 0 ? collection.availableShapes : undefined}
                  />
                  {errors.shape && (
                    <Typography sx={{ color: '#d32f2f', fontSize: '0.78rem', mt: 0.5 }}>{errors.shape}</Typography>
                  )}
                </Box>

                {/* Length */}
                <Box sx={{ mb: 3 }}>
                  <Typography
                    sx={{
                      fontFamily: '"Georgia", serif',
                      fontWeight: 700,
                      fontSize: '0.95rem',
                      color: 'var(--text-main)',
                      mb: 1,
                    }}
                  >
                    Length
                    {length && (
                      <Typography component="span" sx={{ ml: 1, fontWeight: 400, color: '#E91E8C', fontSize: '0.85rem' }}>
                        — {length}
                      </Typography>
                    )}
                  </Typography>
                  <NailLengthSelector
                    value={length}
                    onChange={(l) => { setLength(l); setErrors((e) => ({ ...e, length: '' })); }}
                    availableOnly={collection.availableLengths?.length > 0 ? collection.availableLengths : undefined}
                    surcharges={surchargesForSelector}
                  />
                  {errors.length && (
                    <Typography sx={{ color: '#d32f2f', fontSize: '0.78rem', mt: 0.5 }}>{errors.length}</Typography>
                  )}
                </Box>

                {/* Nail measurements (optional) */}
                {collection.requiresMeasurements && (
                  <Box sx={{ mb: 3 }}>
                    <Typography
                      sx={{
                        fontFamily: '"Georgia", serif',
                        fontWeight: 700,
                        fontSize: '0.95rem',
                        color: 'var(--text-main)',
                        mb: 1,
                      }}
                    >
                      Nail Measurements
                    </Typography>
                    <NailBedSizeInput
                      value={nailMeasurements}
                      onChange={(v) => { setNailMeasurements(v); setErrors((e) => ({ ...e, measurements: '' })); }}
                      required
                    />
                    {errors.measurements && (
                      <Typography sx={{ color: '#d32f2f', fontSize: '0.78rem', mt: 0.5 }}>{errors.measurements}</Typography>
                    )}
                  </Box>
                )}

                {/* Quantity */}
                <Box sx={{ mb: 3 }}>
                  <Typography
                    sx={{
                      fontFamily: '"Georgia", serif',
                      fontWeight: 700,
                      fontSize: '0.95rem',
                      color: 'var(--text-main)',
                      mb: 1.5,
                    }}
                  >
                    Quantity (number of sets)
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <IconButton
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      disabled={quantity <= 1}
                      sx={{
                        border: '1.5px solid #F0C0D0',
                        borderRadius: 2,
                        width: 36,
                        height: 36,
                        '&:hover': { borderColor: '#E91E8C' },
                        '&.Mui-disabled': { opacity: 0.3 },
                      }}
                    >
                      <RemoveIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                    <Typography
                      sx={{
                        fontFamily: '"Georgia", serif',
                        fontWeight: 700,
                        fontSize: '1.2rem',
                        color: 'var(--text-main)',
                        minWidth: 28,
                        textAlign: 'center',
                      }}
                    >
                      {quantity}
                    </Typography>
                    <IconButton
                      onClick={() => setQuantity((q) => q + 1)}
                      sx={{
                        border: '1.5px solid #F0C0D0',
                        borderRadius: 2,
                        width: 36,
                        height: 36,
                        '&:hover': { borderColor: '#E91E8C' },
                      }}
                    >
                      <AddIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                  </Box>
                </Box>

                {/* Multi-set discount notice */}
                {collection.multiSetDiscount && discountPct > 0 && (
                  <Box
                    sx={{
                      mb: 2.5,
                      p: 1.5,
                      backgroundColor: discountApplied ? '#e8f5e9' : '#FFF0F5',
                      borderRadius: 2,
                      border: `1px solid ${discountApplied ? '#a5d6a7' : '#F0C0D0'}`,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1,
                    }}
                  >
                    <LocalOfferIcon sx={{ fontSize: 16, color: discountApplied ? '#2e7d32' : '#E91E8C', flexShrink: 0 }} />
                    <Typography sx={{ fontSize: '0.82rem', color: discountApplied ? '#2e7d32' : '#E91E8C', fontWeight: 600 }}>
                      {discountApplied
                        ? `${discountPct}% multi-set discount applied — ${formatNaira(pricePerSet)} per set`
                        : `Order 2+ sets to unlock ${discountPct}% off each`}
                    </Typography>
                  </Box>
                )}

                {/* Order total */}
                {quantity > 1 && (
                  <Box sx={{ mb: 2, p: 1.5, backgroundColor: '#FFF0F5', borderRadius: 2, border: '1px solid #F0C0D0' }}>
                    <Typography sx={{ fontFamily: '"Georgia", serif', fontWeight: 700, color: 'var(--text-purple)', fontSize: '1rem' }}>
                      Total: {formatNaira(totalPrice)}
                      <Typography component="span" sx={{ fontSize: '0.78rem', fontWeight: 400, color: 'var(--text-muted)', ml: 0.5 }}>
                        ({quantity} sets × {formatNaira(pricePerSet)})
                      </Typography>
                    </Typography>
                  </Box>
                )}

                {/* Add to Cart */}
                <Button
                  fullWidth
                  startIcon={<ShoppingCartOutlinedIcon />}
                  onClick={handleAddToCart}
                  sx={{
                    mt: 1,
                    py: 1.5,
                    borderRadius: '30px',
                    backgroundColor: '#E91E8C',
                    color: '#fff',
                    fontFamily: '"Georgia", serif',
                    fontWeight: 700,
                    fontSize: '1rem',
                    textTransform: 'none',
                    '&:hover': { backgroundColor: '#C2185B' },
                  }}
                >
                  Add to Cart
                </Button>
              </>
            )}

            {/* Upcoming state */}
            {collection.status === 'upcoming' && (
              <Alert severity="info" icon={<AccessTimeIcon />} sx={{ borderRadius: 2, mt: 1 }}>
                This collection is not yet open for orders. Check back soon!
              </Alert>
            )}

            {/* Closed / cap reached state */}
            {(collection.status === 'closed' || (collection.status === 'open' && isAtOrderCap)) && (
              <Alert severity="warning" sx={{ borderRadius: 2, mt: 1 }}>
                {isAtOrderCap
                  ? 'This collection has reached its order limit.'
                  : 'Orders for this collection are currently closed.'}
              </Alert>
            )}
          </Box>
        </Box>
      </Container>
    </Box>
  );
}
