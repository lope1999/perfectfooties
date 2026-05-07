import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Button,
} from '@mui/material';
import StarIcon from '@mui/icons-material/Star';
import { useAuth } from '../context/AuthContext';
import { fetchUnreviewedCompletedOrders } from '../lib/reviewReminderService';

const SESSION_KEY = 'perfectfooties-review-reminder-shown';
const fontFamily = '"Georgia", serif';

export default function ReviewReminderPopup() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(0);

  const [types, setTypes] = useState({ orders: 0, appointments: 0 });

  useEffect(() => {
    if (!user) return;
    const shownFor = sessionStorage.getItem(SESSION_KEY);
    if (shownFor === user.uid) return;

    fetchUnreviewedCompletedOrders(user.uid)
      .then((items) => {
        if (items.length > 0) {
          const orders = items.filter((i) => i.type !== 'appointment').length;
          const appointments = items.filter((i) => i.type === 'appointment').length;
          setCount(items.length);
          setTypes({ orders, appointments });
          setOpen(true);
          sessionStorage.setItem(SESSION_KEY, user.uid);
        }
      })
      .catch(() => {});
  }, [user]);

  if (!open) return null;

  const handleLeaveReview = () => {
    setOpen(false);
    navigate('/account', { state: { tab: 'orders' } });
  };

  return (
    <Dialog
      open={open}
      onClose={() => setOpen(false)}
      PaperProps={{
        sx: {
          borderRadius: 3,
          border: '2px solid #e3242b',
          maxWidth: 420,
          mx: 2,
        },
      }}
    >
      <DialogContent sx={{ textAlign: 'center', pt: 4, pb: 2 }}>
        <Box
          sx={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            backgroundColor: 'var(--bg-card)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mx: 'auto',
            mb: 2,
          }}
        >
          <StarIcon sx={{ fontSize: 36, color: '#e3242b' }} />
        </Box>

        <Typography sx={{ fontFamily, fontWeight: 700, fontSize: '1.2rem', mb: 1 }}>
          How was your experience?
        </Typography>

        <Typography sx={{ fontFamily, fontSize: '0.9rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
          You have{' '}
          <strong>
            {types.orders > 0 && types.appointments > 0
              ? `${types.orders} order${types.orders > 1 ? 's' : ''} and ${types.appointments} appointment${types.appointments > 1 ? 's' : ''}`
              : types.appointments > 0
              ? `${count} completed appointment${count > 1 ? 's' : ''}`
              : `${count} completed order${count > 1 ? 's' : ''}`}
          </strong>{' '}
          waiting for a review. Your feedback helps other customers and means a lot to us.
        </Typography>
      </DialogContent>

      <DialogActions sx={{ justifyContent: 'center', pb: 3, gap: 1.5, flexWrap: 'wrap' }}>
        <Button
          onClick={() => setOpen(false)}
          sx={{
            border: '1.5px solid #ddd',
            borderRadius: '30px',
            color: 'var(--text-muted)',
            backgroundColor: 'transparent',
            px: 3,
            py: 0.8,
            fontFamily,
            fontWeight: 600,
            fontSize: '0.88rem',
            textTransform: 'none',
            '&:hover': { borderColor: '#aaa' },
          }}
        >
          Maybe Later
        </Button>
        <Button
          onClick={handleLeaveReview}
          sx={{
            backgroundColor: '#e3242b',
            color: '#fff',
            borderRadius: '30px',
            px: 4,
            py: 0.8,
            fontFamily,
            fontWeight: 700,
            fontSize: '0.88rem',
            textTransform: 'none',
            '&:hover': { backgroundColor: '#b81b21' },
          }}
        >
          Leave a Review
        </Button>
      </DialogActions>
    </Dialog>
  );
}
