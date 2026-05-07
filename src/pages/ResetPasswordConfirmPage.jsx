import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Container,
  Box,
  TextField,
  Button,
  Typography,
  CircularProgress,
  Alert,
  InputAdornment,
  IconButton,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

const ff = '"Georgia", serif';

const fieldSx = {
  '& .MuiOutlinedInput-root': { borderRadius: 2, fontFamily: ff },
  '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#e3242b' },
  '& .MuiInputLabel-root.Mui-focused': { color: '#e3242b' },
};

export default function ResetPasswordConfirmPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { verifyResetCode, applyPasswordReset } = useAuth();
  const { showToast } = useNotifications();

  const [phase, setPhase] = useState('verifying'); // verifying | invalid | ready | success
  const [accountEmail, setAccountEmail] = useState('');
  const [invalidReason, setInvalidReason] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const params = new URLSearchParams(location.search);
  const oobCode = params.get('oobCode');
  const mode = params.get('mode');

  useEffect(() => {
    if (!oobCode || mode !== 'resetPassword') {
      setInvalidReason('This link is missing required parameters. Please request a new password reset.');
      setPhase('invalid');
      return;
    }

    verifyResetCode(oobCode)
      .then((email) => {
        setAccountEmail(email);
        setPhase('ready');
      })
      .catch((err) => {
        if (err.code === 'auth/expired-action-code') {
          setInvalidReason('This reset link has expired. Please request a new one.');
        } else if (err.code === 'auth/invalid-action-code') {
          setInvalidReason('This reset link is invalid or has already been used.');
        } else {
          setInvalidReason('This reset link is no longer valid. Please request a new one.');
        }
        setPhase('invalid');
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setSubmitting(true);
    try {
      await applyPasswordReset(oobCode, newPassword);
      showToast('Password updated successfully!', 'success');
      setPhase('success');
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      let msg = 'Failed to reset password. Please try again.';
      if (err.code === 'auth/expired-action-code') {
        msg = 'This reset link has expired. Please request a new one.';
      } else if (err.code === 'auth/invalid-action-code') {
        msg = 'This reset link is invalid or has already been used.';
      } else if (err.code === 'auth/weak-password') {
        msg = 'Password is too weak (minimum 6 characters).';
      } else if (err.code === 'auth/user-disabled') {
        msg = 'This account has been disabled.';
      }
      setError(msg);
    } finally {
      setSubmitting(false);
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
        <Button
          onClick={() => navigate('/login')}
          startIcon={<ArrowBackIcon />}
          sx={{
            color: '#e3242b',
            mb: 3,
            textTransform: 'none',
            fontWeight: 600,
            '&:hover': { backgroundColor: 'rgba(227, 36, 43, 0.08)' },
          }}
        >
          Back to Sign In
        </Button>

        {/* Verifying */}
        {phase === 'verifying' && (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <CircularProgress sx={{ color: '#e3242b', mb: 3 }} />
            <Typography sx={{ fontFamily: ff, color: 'var(--text-muted)' }}>
              Verifying your reset link…
            </Typography>
          </Box>
        )}

        {/* Invalid / expired */}
        {phase === 'invalid' && (
          <Box sx={{ textAlign: 'center' }}>
            <ErrorOutlineIcon sx={{ fontSize: 64, color: '#e3242b', mb: 2 }} />
            <Typography variant="h5" sx={{ fontFamily: ff, fontWeight: 700, mb: 2, color: 'var(--text-main)' }}>
              Link Invalid or Expired
            </Typography>
            <Alert severity="error" sx={{ mb: 3, borderRadius: 2, textAlign: 'left' }}>
              {invalidReason}
            </Alert>
            <Button
              onClick={() => navigate('/password-reset')}
              sx={{
                backgroundColor: '#e3242b',
                color: '#fff',
                borderRadius: 2,
                py: 1.5,
                px: 4,
                fontFamily: ff,
                fontWeight: 600,
                '&:hover': { backgroundColor: '#b81b21' },
              }}
            >
              Request New Reset Link
            </Button>
          </Box>
        )}

        {/* New password form */}
        {phase === 'ready' && (
          <>
            <Typography variant="h4" sx={{ fontFamily: ff, fontWeight: 700, mb: 1, color: 'var(--text-main)' }}>
              Set New Password
            </Typography>
            <Typography sx={{ color: 'var(--text-muted)', mb: accountEmail ? 1.5 : 4, lineHeight: 1.6 }}>
              Choose a new password for your account
            </Typography>
            {accountEmail && (
              <Typography sx={{ color: 'var(--text-muted)', mb: 3, fontSize: '0.9rem' }}>
                Resetting password for <strong style={{ color: 'var(--text-main)' }}>{accountEmail}</strong>
              </Typography>
            )}

            {error && (
              <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                {error}
                {(error.includes('expired') || error.includes('invalid')) && (
                  <Box sx={{ mt: 1 }}>
                    <Button
                      size="small"
                      onClick={() => navigate('/password-reset')}
                      sx={{ color: '#e3242b', p: 0, textTransform: 'none', fontWeight: 600 }}
                    >
                      Request a new link →
                    </Button>
                  </Box>
                )}
              </Alert>
            )}

            <form onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label="New Password"
                type={showNew ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={submitting}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowNew((v) => !v)} edge="end" size="small" tabIndex={-1}>
                        {showNew ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 2, ...fieldSx }}
              />

              <TextField
                fullWidth
                label="Confirm New Password"
                type={showConfirm ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={submitting}
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowConfirm((v) => !v)} edge="end" size="small" tabIndex={-1}>
                        {showConfirm ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
                sx={{ mb: 3, ...fieldSx }}
              />

              <Button
                fullWidth
                type="submit"
                disabled={submitting}
                sx={{
                  backgroundColor: '#e3242b',
                  color: '#fff',
                  borderRadius: 2,
                  py: 1.5,
                  fontFamily: ff,
                  fontWeight: 600,
                  fontSize: '1rem',
                  '&:hover': { backgroundColor: '#b81b21' },
                  '&:disabled': { backgroundColor: '#ccc' },
                }}
              >
                {submitting ? <CircularProgress size={24} sx={{ color: '#fff' }} /> : 'Update Password'}
              </Button>
            </form>
          </>
        )}

        {/* Success */}
        {phase === 'success' && (
          <Box sx={{ textAlign: 'center' }}>
            <CheckCircleIcon sx={{ fontSize: 64, color: '#4caf50', mb: 2 }} />
            <Typography variant="h5" sx={{ fontFamily: ff, fontWeight: 700, mb: 2, color: 'var(--text-main)' }}>
              Password Updated!
            </Typography>
            <Typography sx={{ color: 'var(--text-muted)', mb: 4, lineHeight: 1.6 }}>
              Your password has been reset successfully. Redirecting you to sign in…
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
                '&:hover': { backgroundColor: '#b81b21' },
              }}
            >
              Go to Sign In
            </Button>
          </Box>
        )}
      </Container>
    </Box>
  );
}
