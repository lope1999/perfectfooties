import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  TextField,
  Button,
  Typography,
  CircularProgress,
  Link,
  Alert,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

const ff = '"Georgia", serif';

export default function SignUpPage() {
  const navigate = useNavigate();
  const { signUpWithEmail } = useAuth();
  const { showToast } = useNotifications();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const validateForm = () => {
    if (!name || !email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return false;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return false;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    if (!agreeTerms) {
      setError('You must agree to the Terms & Privacy');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      await signUpWithEmail(email, password, name);
      showToast('Account created successfully!', 'success');
      setTimeout(() => navigate('/account'), 500);
    } catch (err) {
      let errorMsg = 'Failed to create account';
      if (err.code === 'auth/email-already-in-use') {
        errorMsg = 'Email already registered. Please sign in instead.';
      } else if (err.code === 'auth/weak-password') {
        errorMsg = 'Password too weak (min 6 characters)';
      } else if (err.code === 'auth/invalid-email') {
        errorMsg = 'Invalid email format';
      }
      setError(errorMsg);
      showToast(errorMsg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const passwordStrength = () => {
    if (!password) return '';
    if (password.length < 8) return 'Weak';
    if (/[A-Z]/.test(password) && /[0-9]/.test(password)) return 'Strong';
    return 'Medium';
  };

  return (
    <Box
      sx={{
        pt: { xs: 12, md: 16 },
        pb: 10,
        minHeight: '100vh',
        backgroundColor: '#FFF8F0',
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
          Create Account
        </Typography>
        <Typography
          sx={{
            color: 'var(--text-muted)',
            mb: 4,
            lineHeight: 1.6,
          }}
        >
          Sign up to start shopping at PerfectFooties
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
            {error}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          {/* Name Input */}
          <TextField
            fullWidth
            label="Full Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
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
            type="password"
            label="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            helperText={password && `Strength: ${passwordStrength()}`}
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

          {/* Confirm Password Input */}
          <TextField
            fullWidth
            type="password"
            label="Confirm Password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
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

          {/* Terms Checkbox */}
          <FormControlLabel
            control={
              <Checkbox
                checked={agreeTerms}
                onChange={(e) => setAgreeTerms(e.target.checked)}
                disabled={loading}
                sx={{
                  color: '#e3242b',
                  '&.Mui-checked': {
                    color: '#e3242b',
                  },
                }}
              />
            }
            label={
              <Typography sx={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                I agree to the{' '}
                <Link
                  href="/terms"
                  sx={{
                    color: '#e3242b',
                    fontWeight: 600,
                    textDecoration: 'none',
                    '&:hover': { textDecoration: 'underline' },
                  }}
                >
                  Terms & Conditions
                </Link>{' '}
                and{' '}
                <Link
                  href="/privacy"
                  sx={{
                    color: '#e3242b',
                    fontWeight: 600,
                    textDecoration: 'none',
                    '&:hover': { textDecoration: 'underline' },
                  }}
                >
                  Privacy Policy
                </Link>
              </Typography>
            }
            sx={{ mb: 3 }}
          />

          {/* Sign Up Button */}
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
            {loading ? <CircularProgress size={24} sx={{ color: '#fff' }} /> : 'Create Account'}
          </Button>
        </form>

        {/* Sign In Link */}
        <Box sx={{ textAlign: 'center' }}>
          <Typography sx={{ color: 'var(--text-muted)', mb: 1 }}>
            Already have an account?
          </Typography>
          <Link
            component="button"
            onClick={(e) => {
              e.preventDefault();
              navigate('/login');
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
            Sign in here
          </Link>
        </Box>
      </Container>
    </Box>
  );
}
