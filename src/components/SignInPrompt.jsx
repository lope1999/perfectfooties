import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  CircularProgress,
} from '@mui/material';
import LoginIcon from '@mui/icons-material/Login';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

export default function SignInPrompt({ open, onClose }) {
  const { signInWithGoogle } = useAuth();
  const { showToast } = useNotifications();
  const [signingIn, setSigningIn] = useState(false);

  const handleSignIn = async () => {
    setSigningIn(true);
    try {
      const result = await signInWithGoogle();
      onClose();
      const name = result?.user?.displayName?.split(' ')[0] || 'back';
      showToast(`Welcome ${name}! You're now signed in.`, 'success');
    } catch {
      // user closed popup
    } finally {
      setSigningIn(false);
    }
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
          Please sign in to continue with your order. This helps us track your appointments, save your preferences, and provide a better experience.
        </Typography>
      </DialogContent>
      <DialogActions sx={{ justifyContent: 'center', pb: 3, flexDirection: 'column', gap: 1 }}>
        <Button
          onClick={handleSignIn}
          disabled={signingIn}
          startIcon={signingIn ? <CircularProgress size={18} sx={{ color: 'inherit' }} /> : <LoginIcon />}
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
          {signingIn ? 'Signing In\u2026' : 'Sign In with Google'}
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
