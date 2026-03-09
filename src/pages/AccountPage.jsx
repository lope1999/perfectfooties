import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Container,
  Button,
  Avatar,
  Tabs,
  Tab,
  Chip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Tooltip,
} from '@mui/material';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import EventNoteIcon from '@mui/icons-material/EventNote';
import FavoriteIcon from '@mui/icons-material/Favorite';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined';
import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined';
import LogoutIcon from '@mui/icons-material/Logout';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { fetchOrders } from '../lib/orderService';
import { saveTestimonial, getReviewedOrderIds } from '../lib/testimonialService';

const TABS = ['profile', 'orders', 'appointments', 'wishlist'];

function formatNaira(amount) {
  return `\u20A6${Number(amount).toLocaleString()}`;
}

function formatDate(ts) {
  if (!ts) return '';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function AccountPage() {
  const { user, loading: authLoading, signInWithGoogle, signOut } = useAuth();
  const { wishlist, removeFromWishlist } = useWishlist();
  const { addProduct } = useCart();
  const location = useLocation();
  const navigate = useNavigate();

  const hashTab = location.hash.replace('#', '');
  const tabIndex = TABS.indexOf(hashTab) >= 0 ? TABS.indexOf(hashTab) : 0;

  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [ratedOrders, setRatedOrders] = useState({});
  const [rateDialog, setRateDialog] = useState(null);

  useEffect(() => {
    if (!user) return;
    setOrdersLoading(true);
    fetchOrders(user.uid)
      .then(async (fetched) => {
        setOrders(fetched);
        // Batch-check which completed orders have already been rated (single query)
        const completedIds = fetched
          .filter((o) => o.status === 'received' || o.status === 'completed')
          .map((o) => o.id);
        if (completedIds.length > 0) {
          const reviewedSet = await getReviewedOrderIds(completedIds);
          const map = {};
          reviewedSet.forEach((id) => { map[id] = true; });
          setRatedOrders(map);
        }
      })
      .catch(() => {})
      .finally(() => setOrdersLoading(false));
  }, [user]);

  const handleTabChange = (_, newVal) => {
    navigate(`/account#${TABS[newVal]}`, { replace: true });
  };

  if (authLoading) {
    return (
      <Box sx={{ pt: 16, textAlign: 'center' }}>
        <CircularProgress sx={{ color: '#E91E8C' }} />
      </Box>
    );
  }

  if (!user) {
    return (
      <Box sx={{ pt: { xs: 12, md: 14 }, pb: 10, minHeight: '100vh', backgroundColor: '#FFF0F5' }}>
        <Container maxWidth="sm" sx={{ textAlign: 'center' }}>
          <PersonOutlineIcon sx={{ fontSize: 64, color: '#E91E8C', mb: 2 }} />
          <Typography
            variant="h4"
            sx={{ fontFamily: '"Georgia", serif', fontWeight: 700, mb: 2 }}
          >
            Sign in to your account
          </Typography>
          <Typography sx={{ color: '#555', mb: 4, lineHeight: 1.7 }}>
            Sign in with Google to view your order history, track appointments, and manage your profile.
          </Typography>
          <Button
            onClick={() => signInWithGoogle().catch(() => {})}
            sx={{
              backgroundColor: '#E91E8C',
              color: '#fff',
              borderRadius: '30px',
              px: 4,
              py: 1.2,
              fontFamily: '"Georgia", serif',
              fontWeight: 600,
              fontSize: '0.95rem',
              '&:hover': { backgroundColor: '#C2185B' },
            }}
          >
            Sign in with Google
          </Button>
        </Container>
      </Box>
    );
  }

  const serviceOrders = orders.filter((o) => o.type === 'service');
  const otherOrders = orders.filter((o) => o.type !== 'service');

  return (
    <Box sx={{ pt: { xs: 10, md: 12 }, pb: 10, minHeight: '100vh', backgroundColor: '#FFF0F5' }}>
      <Container maxWidth="md">
        <Typography
          variant="h3"
          sx={{
            fontFamily: '"Georgia", serif',
            fontWeight: 700,
            color: '#000',
            mb: 3,
            textAlign: 'center',
            fontSize: { xs: '1.8rem', sm: '2.4rem', md: '3rem' },
          }}
        >
          My Account
        </Typography>

        <Tabs
          value={tabIndex}
          onChange={handleTabChange}
          centered
          sx={{
            mb: 4,
            '& .MuiTab-root': {
              fontFamily: '"Georgia", serif',
              fontWeight: 600,
              textTransform: 'none',
              fontSize: '0.95rem',
            },
            '& .Mui-selected': { color: '#E91E8C' },
            '& .MuiTabs-indicator': { backgroundColor: '#E91E8C' },
          }}
        >
          <Tab label="Profile" />
          <Tab label="Orders" />
          <Tab label="Appointments" />
          <Tab icon={<FavoriteIcon sx={{ fontSize: 18 }} />} iconPosition="start" label="Wishlist" />
        </Tabs>

        {/* Profile Tab */}
        {tabIndex === 0 && (
          <Box sx={{ textAlign: 'center' }}>
            <Avatar
              src={user.photoURL}
              alt={user.displayName}
              sx={{ width: 80, height: 80, mx: 'auto', mb: 2, border: '3px solid #E91E8C' }}
            />
            <Typography sx={{ fontFamily: '"Georgia", serif', fontWeight: 700, fontSize: '1.3rem' }}>
              {user.displayName}
            </Typography>
            <Typography sx={{ color: '#777', mb: 3 }}>{user.email}</Typography>
            <Button
              startIcon={<LogoutIcon />}
              onClick={signOut}
              sx={{
                border: '2px solid #E91E8C',
                borderRadius: '30px',
                color: '#E91E8C',
                px: 3,
                py: 1,
                fontFamily: '"Georgia", serif',
                fontWeight: 600,
                '&:hover': { backgroundColor: '#E91E8C', color: '#fff' },
              }}
            >
              Sign Out
            </Button>
          </Box>
        )}

        {/* Orders Tab */}
        {tabIndex === 1 && (
          <Box>
            {ordersLoading ? (
              <Box sx={{ textAlign: 'center', py: 6 }}>
                <CircularProgress sx={{ color: '#E91E8C' }} />
              </Box>
            ) : otherOrders.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 6 }}>
                <ReceiptLongOutlinedIcon sx={{ fontSize: 48, color: '#ccc', mb: 1 }} />
                <Typography sx={{ color: '#999' }}>No orders yet.</Typography>
                <Typography sx={{ color: '#aaa', fontSize: '0.85rem', mt: 0.5 }}>
                  Orders placed while signed in will appear here.
                </Typography>
              </Box>
            ) : (
              otherOrders.map((order) => (
                <OrderCard key={order.id} order={order} rated={!!ratedOrders[order.id]} onRate={() => setRateDialog(order)} />
              ))
            )}
          </Box>
        )}

        {/* Appointments Tab */}
        {tabIndex === 2 && (
          <Box>
            {ordersLoading ? (
              <Box sx={{ textAlign: 'center', py: 6 }}>
                <CircularProgress sx={{ color: '#E91E8C' }} />
              </Box>
            ) : serviceOrders.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 6 }}>
                <EventNoteIcon sx={{ fontSize: 48, color: '#ccc', mb: 1 }} />
                <Typography sx={{ color: '#999' }}>No appointments yet.</Typography>
                <Typography sx={{ color: '#aaa', fontSize: '0.85rem', mt: 0.5 }}>
                  Appointments booked while signed in will appear here.
                </Typography>
              </Box>
            ) : (
              serviceOrders.map((order) => (
                <OrderCard key={order.id} order={order} rated={!!ratedOrders[order.id]} onRate={() => setRateDialog(order)} />
              ))
            )}
          </Box>
        )}
        {/* Wishlist Tab */}
        {tabIndex === 3 && (
          <Box>
            {wishlist.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 6 }}>
                <FavoriteIcon sx={{ fontSize: 48, color: '#ccc', mb: 1 }} />
                <Typography sx={{ color: '#999' }}>Your wishlist is empty</Typography>
                <Typography sx={{ color: '#aaa', fontSize: '0.85rem', mt: 0.5, mb: 2 }}>
                  Tap the heart icon on products to save them here.
                </Typography>
                <Button
                  onClick={() => navigate('/products')}
                  sx={{
                    border: '2px solid #E91E8C',
                    borderRadius: '30px',
                    color: '#E91E8C',
                    px: 3,
                    py: 1,
                    fontFamily: '"Georgia", serif',
                    fontWeight: 600,
                    '&:hover': { backgroundColor: '#E91E8C', color: '#fff' },
                  }}
                >
                  Browse Products
                </Button>
              </Box>
            ) : (
              wishlist.map((item) => (
                <Box
                  key={item.productId}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    p: 2,
                    mb: 1.5,
                    borderRadius: 3,
                    border: '1px solid #F0C0D0',
                    backgroundColor: '#fff',
                    transition: 'box-shadow 0.2s ease',
                    '&:hover': { boxShadow: '0 2px 12px rgba(233,30,140,0.1)' },
                  }}
                >
                  <Box
                    onClick={() => navigate('/products', { state: { categoryId: item.categoryId } })}
                    sx={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                      flex: 1,
                      minWidth: 0,
                      cursor: 'pointer',
                    }}
                  >
                    <Box
                      component="img"
                      src={item.image}
                      alt={item.name}
                      sx={{
                        width: 60,
                        height: 60,
                        borderRadius: 2,
                        objectFit: 'cover',
                        flexShrink: 0,
                      }}
                    />
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography
                        sx={{
                          fontFamily: '"Georgia", serif',
                          fontWeight: 700,
                          fontSize: '0.95rem',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {item.name}
                      </Typography>
                      <Chip
                        label={formatNaira(item.price)}
                        size="small"
                        sx={{
                          mt: 0.5,
                          backgroundColor: '#E91E8C',
                          color: '#fff',
                          fontFamily: '"Georgia", serif',
                          fontWeight: 700,
                          fontSize: '0.8rem',
                        }}
                      />
                    </Box>
                  </Box>
                  <Tooltip title="View product">
                    <IconButton
                      onClick={() => navigate('/products', { state: { categoryId: item.categoryId } })}
                      sx={{ color: '#999', '&:hover': { color: '#4A0E4E' } }}
                    >
                      <VisibilityOutlinedIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Add to cart">
                    <IconButton
                      onClick={() => addProduct({
                        productId: item.productId,
                        name: item.name,
                        price: item.price,
                        quantity: 1,
                        stock: item.stock ?? 999,
                        categoryId: item.categoryId,
                      })}
                      sx={{ color: '#999', '&:hover': { color: '#E91E8C' } }}
                    >
                      <ShoppingCartOutlinedIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Remove from wishlist">
                    <IconButton
                      onClick={() => removeFromWishlist(item.productId)}
                      sx={{ color: '#ccc', '&:hover': { color: '#E91E8C' } }}
                    >
                      <DeleteOutlineIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              ))
            )}
          </Box>
        )}

        {/* Rate Dialog */}
        <RateDialog
          open={!!rateDialog}
          order={rateDialog}
          userName={user?.displayName || ''}
          onClose={() => setRateDialog(null)}
          onSubmitted={(orderId) => {
            setRatedOrders((prev) => ({ ...prev, [orderId]: true }));
            setRateDialog(null);
          }}
        />
      </Container>
    </Box>
  );
}

function RateDialog({ open, order, userName, onClose, onSubmitted }) {
  const [rating, setRating] = useState(0);
  const [occupation, setOccupation] = useState('');
  const [review, setReview] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!order || rating === 0 || !review.trim()) return;
    setSubmitting(true);
    try {
      const serviceName = order.items?.[0]?.serviceName || order.items?.[0]?.name || 'Service';
      await saveTestimonial({
        name: userName,
        occupation: occupation.trim() || 'Client',
        service: serviceName,
        type: order.type === 'service' ? 'appointment' : 'purchase',
        rating,
        testimonial: review.trim(),
        avatar: userName.charAt(0).toUpperCase(),
        orderId: order.id,
      });
      onSubmitted(order.id);
    } catch (err) {
      console.error('Failed to save review:', err);
    } finally {
      setSubmitting(false);
      setRating(0);
      setOccupation('');
      setReview('');
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ fontFamily: '"Georgia", serif', fontWeight: 700, textAlign: 'center' }}>
        Rate Your Experience
      </DialogTitle>
      <DialogContent>
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.5, mb: 2, mt: 1 }}>
          {[1, 2, 3, 4, 5].map((star) => (
            <Box
              key={star}
              onClick={() => setRating(star)}
              sx={{ cursor: 'pointer' }}
            >
              {star <= rating ? (
                <StarIcon sx={{ color: '#E91E8C', fontSize: 36 }} />
              ) : (
                <StarBorderIcon sx={{ color: '#E91E8C', fontSize: 36 }} />
              )}
            </Box>
          ))}
        </Box>
        <TextField
          fullWidth
          label="Your Occupation (optional)"
          value={occupation}
          onChange={(e) => setOccupation(e.target.value)}
          size="small"
          sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
        />
        <TextField
          fullWidth
          label="Your Review"
          value={review}
          onChange={(e) => setReview(e.target.value)}
          multiline
          rows={3}
          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
        />
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
        <Button onClick={onClose} sx={{ fontFamily: '"Georgia", serif', color: '#777' }}>Cancel</Button>
        <Button
          onClick={handleSubmit}
          disabled={submitting || rating === 0 || !review.trim()}
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
          {submitting ? 'Submitting…' : 'Submit Review'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function OrderCard({ order, rated, onRate }) {
  const statusColor = {
    pending: '#FF9800',
    confirmed: '#2196F3',
    production: '#9C27B0',
    shipping: '#1976D2',
    received: '#4CAF50',
    completed: '#4CAF50',
    'in progress': '#9C27B0',
    rescheduled: '#FF9800',
    cancelled: '#f44336',
    'no-show': '#9E9E9E',
  };

  return (
    <Box
      sx={{
        p: 2.5,
        mb: 2,
        borderRadius: 3,
        border: '1px solid #F0C0D0',
        backgroundColor: '#fff',
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
        <Chip
          label={order.type}
          size="small"
          sx={{
            backgroundColor: '#4A0E4E',
            color: '#fff',
            fontWeight: 700,
            fontSize: '0.7rem',
            textTransform: 'capitalize',
          }}
        />
        <Chip
          label={order.status}
          size="small"
          sx={{
            backgroundColor: statusColor[order.status] || '#999',
            color: '#fff',
            fontWeight: 600,
            fontSize: '0.7rem',
            textTransform: 'capitalize',
          }}
        />
      </Box>
      <Typography sx={{ fontFamily: '"Georgia", serif', fontWeight: 700, fontSize: '1rem' }}>
        {formatNaira(order.total)}
      </Typography>
      <Typography sx={{ color: '#777', fontSize: '0.82rem', mt: 0.3 }}>
        {formatDate(order.createdAt)}
      </Typography>
      {order.items && order.items.length > 0 && (
        <Box sx={{ mt: 1 }}>
          {order.items.map((item, i) => (
            <Typography key={i} sx={{ color: '#555', fontSize: '0.82rem' }}>
              {item.name || item.serviceName || 'Item'}{item.quantity > 1 ? ` x${item.quantity}` : ''}
            </Typography>
          ))}
        </Box>
      )}
      {(order.status === 'received' || order.status === 'completed') && (
        <Box sx={{ mt: 1.5 }}>
          <Button
            size="small"
            onClick={onRate}
            disabled={rated}
            sx={{
              border: '1.5px solid #E91E8C',
              borderRadius: '20px',
              color: rated ? '#999' : '#E91E8C',
              borderColor: rated ? '#ccc' : '#E91E8C',
              px: 2,
              fontFamily: '"Georgia", serif',
              fontWeight: 600,
              fontSize: '0.78rem',
              textTransform: 'none',
              '&:hover': rated ? {} : { backgroundColor: '#E91E8C', color: '#fff' },
            }}
          >
            {rated ? 'Rated' : 'Rate'}
          </Button>
        </Box>
      )}
    </Box>
  );
}
