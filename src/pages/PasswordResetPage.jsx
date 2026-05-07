import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  TextField,
  Button,
  Typography,
  CircularProgress,
  Alert,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

const ff = '"Georgia", serif';

export default function PasswordResetPage() {
  const navigate = useNavigate();
  const { resetPassword } = useAuth();
  const { showToast } = useNotifications();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');

    if (!email) {
      setError('Please enter your email address');
      return;
    }

    setLoading(true);
    try {
      await resetPassword(email);
      setSuccessMessage('Password reset email sent! Check your inbox for further instructions.');
      showToast('Password reset email sent!', 'success');
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      let errorMsg = 'Failed to send reset email';
      if (err.code === 'auth/user-not-found') {
        errorMsg = 'No account found with this email';
      } else if (err.code === 'auth/invalid-email') {
        errorMsg = 'Invalid email format';
      }
      setError(errorMsg);
      showToast(errorMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        pt: { xs: 12, md: 16 },
        pb: 10,
        minHeight: '100vh',
        backgroundColor: 'var(--bg-page)',
      }}
    >
      <Container maxWidth="sm">
        {/* Back Button */}
        <Button
          onClick={() => navigate('/login')}
          startIcon={<ArrowBackIcon />}
          sx={{
            color: '#e3242b',
            mb: 3,
            textTransform: 'none',
            fontWeight: 600,
            '&:hover': {
              backgroundColor: 'rgba(227, 36, 43, 0.08)',
            },
          }}
        >
          Back to Login
        </Button>

        {successMessage ? (
          <Box sx={{ textAlign: 'center' }}>
            <CheckCircleIcon
              sx={{
                fontSize: 64,
                color: '#4caf50',
                mb: 2,
              }}
            />
            <Typography
              variant="h5"
              sx={{
                fontFamily: ff,
                fontWeight: 700,
                mb: 2,
                color: 'var(--text-main)',
              }}
            >
              Check Your Email
            </Typography>
            <Alert severity="success" sx={{ mb: 3, borderRadius: 2 }}>
              {successMessage}
            </Alert>
            <Typography sx={{ color: 'var(--text-muted)', mb: 4, lineHeight: 1.6 }}>
              We've sent a password reset link to <strong>{email}</strong>. 
              Click the link in the email to reset your password.
            </Typography>
            <Button
              onClick={() => navigate('/login')}
              sx={{
                backgroundColor: '#e3242b',
                color: '#fff',
                borderRadius: 2,
                py: 1.5,
                px: 4,
                fontFamily: ff,
                fontWeight: 600,
                '&:hover': {
                  backgroundColor: '#b81b21',
                },
              }}
            >
              Back to Sign In
            </Button>
          </Box>
        ) : (
          <>
            <Typography
              variant="h4"
              sx={{
                fontFamily: ff,
                fontWeight: 700,
                mb: 1,
                color: 'var(--text-main)',
              }}
            >
              Reset Password
            </Typography>
            <Typography
              sx={{
                color: 'var(--text-muted)',
                mb: 4,
                lineHeight: 1.6,
              }}
            >
              Enter your email address and we'll send you a link to reset your password
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                {error}
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              {/* Email Input */}
              <TextField
                fullWidth
                type="email"
                label="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                sx={{
                  mb: 3,
                  '& .MuiOutlinedInput-root': {
                    borderRadius: 2,
                    fontFamily: ff,
                  },
                  '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: '#e3242b',
                  },
                }}
              />

              {/* Send Reset Link Button */}
              <Button
                fullWidth
                type="submit"
                disabled={loading}
                sx={{
                  backgroundColor: '#e3242b',
                  color: '#fff',
                  borderRadius: 2,
                  py: 1.5,
                  fontFamily: ff,
                  fontWeight: 600,
                  fontSize: '1rem',
                  '&:hover': {
                    backgroundColor: '#b81b21',
                  },
                  '&:disabled': {
                    backgroundColor: '#ccc',
                  },
                }}
              >
                {loading ? <CircularProgress size={24} sx={{ color: '#fff' }} /> : 'Send Reset Link'}
              </Button>
            </form>
          </>
        )}
      </Container>
    </Box>
  );
}
