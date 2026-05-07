import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Container,
  Box,
  TextField,
  Button,
  Typography,
  CircularProgress,
  Link,
  Alert,
  InputAdornment,
  IconButton,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

const ff = '"Georgia", serif';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signInWithEmail } = useAuth();
  const { showToast } = useNotifications();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      await signInWithEmail(email, password);
      showToast('Successfully signed in!', 'success');
      navigate(location.state?.from || '/account');
    } catch (err) {
      let errorMsg = 'Failed to sign in';
      if (err.code === 'auth/user-not-found') {
        errorMsg = 'No account found with this email';
      } else if (err.code === 'auth/wrong-password') {
        errorMsg = 'Incorrect password';
      } else if (err.code === 'auth/invalid-email') {
        errorMsg = 'Invalid email format';
      } else if (err.code === 'auth/user-disabled') {
        errorMsg = 'This account has been disabled';
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
          onClick={() => navigate('/auth-method')}
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
          Back
        </Button>

        <Typography
          variant="h4"
          sx={{
            fontFamily: ff,
            fontWeight: 700,
            mb: 1,
            color: 'var(--text-main)',
          }}
        >
          Sign In
        </Typography>
        <Typography
          sx={{
            color: 'var(--text-muted)',
            mb: 4,
            lineHeight: 1.6,
          }}
        >
          Enter your email and password to access your account
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
              mb: 2,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                fontFamily: ff,
              },
              '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: '#e3242b',
              },
            }}
          />

          {/* Password Input */}
          <TextField
            fullWidth
            type={showPassword ? 'text' : 'password'}
            label="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword((v) => !v)}
                    edge="end"
                    size="small"
                    tabIndex={-1}
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{
              mb: 1,
              '& .MuiOutlinedInput-root': {
                borderRadius: 2,
                fontFamily: ff,
              },
              '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': {
                borderColor: '#e3242b',
              },
            }}
          />

          {/* Forgot Password Link */}
          <Link
            component="button"
            type="button"
            onClick={(e) => {
              e.preventDefault();
              navigate('/password-reset');
            }}
            sx={{
              display: 'block',
              mb: 4,
              color: '#e3242b',
              fontWeight: 600,
              textDecoration: 'none',
              fontSize: '0.9rem',
              '&:hover': {
                textDecoration: 'underline',
              },
            }}
          >
            Forgot your password?
          </Link>

          {/* Sign In Button */}
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
              mb: 3,
              '&:hover': {
                backgroundColor: '#b81b21',
              },
              '&:disabled': {
                backgroundColor: '#ccc',
              },
            }}
          >
            {loading ? <CircularProgress size={24} sx={{ color: '#fff' }} /> : 'Sign In'}
          </Button>
        </form>

        {/* Sign Up Link */}
        <Box sx={{ textAlign: 'center' }}>
          <Typography sx={{ color: 'var(--text-muted)', mb: 1 }}>
            Don't have an account?
          </Typography>
          <Link
            component="button"
            onClick={(e) => {
              e.preventDefault();
              navigate('/signup');
            }}
            sx={{
              color: '#e3242b',
              fontWeight: 600,
              textDecoration: 'none',
              fontSize: '1rem',
              cursor: 'pointer',
              '&:hover': {
                textDecoration: 'underline',
              },
            }}
          >
            Sign up here
          </Link>
        </Box>
      </Container>
    </Box>
  );
}
