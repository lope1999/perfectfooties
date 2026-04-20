import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
} from '@mui/material';
import LoginIcon from '@mui/icons-material/Login';
import { useNavigate, useLocation } from 'react-router-dom';

export default function SignInPrompt({ open, onClose }) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleGoToSignIn = () => {
    onClose();
    navigate('/auth-method', { state: { from: location.pathname } });
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          borderRadius: 4,
          p: 2,
          textAlign: 'center',
          maxWidth: 400,
        },
      }}
    >
      <DialogTitle sx={{ pb: 0 }}>
        <LoginIcon sx={{ fontSize: 48, color: '#e3242b', mb: 1, display: 'block', mx: 'auto' }} />
        <Typography
          variant="h6"
          sx={{ fontFamily: '"Georgia", serif', fontWeight: 700 }}
        >
          Sign In Required
        </Typography>
      </DialogTitle>
      <DialogContent>
        <Typography sx={{ color: 'var(--text-muted)', mt: 1, lineHeight: 1.7, fontSize: '0.95rem' }}>
          Please sign in to continue with your order. This helps us track your orders, save your preferences, and provide a better experience.
        </Typography>
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'center', pb: 3, flexDirection: 'column', gap: 1 }}>
        <Button
          onClick={handleGoToSignIn}
          startIcon={<LoginIcon />}
          sx={{
            backgroundColor: '#e3242b',
            color: '#fff',
            borderRadius: '30px',
            px: 4,
            py: 1.2,
            fontFamily: '"Georgia", serif',
            fontWeight: 600,
            fontSize: '0.95rem',
            '&:hover': { backgroundColor: '#b81b21' },
          }}
        >
          Sign In
        </Button>
        <Button
          onClick={onClose}
          sx={{ fontFamily: '"Georgia", serif', color: '#777', fontSize: '0.85rem' }}
        >
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
}
