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
  InputAdornment,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import MarkEmailReadIcon from '@mui/icons-material/MarkEmailRead';
import CloseIcon from '@mui/icons-material/Close';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

const ff = '"Georgia", serif';

function LegalModal({ open, onClose, title, children }) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth scroll="paper"
      PaperProps={{ sx: { borderRadius: 3, maxHeight: '80vh', backgroundColor: 'var(--bg-card)', color: 'var(--text-main)' } }}>
      <DialogTitle sx={{ fontFamily: ff, fontWeight: 700, color: 'var(--text-purple)', pr: 6 }}>
        {title}
        <IconButton onClick={onClose} size="small"
          sx={{ position: 'absolute', right: 16, top: 14, color: '#888' }}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </DialogTitle>
      <Divider />
      <DialogContent sx={{ px: 4, py: 3 }}>
        {children}
      </DialogContent>
      <Divider />
      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose}
          sx={{ backgroundColor: '#e3242b', color: '#fff', borderRadius: '20px', px: 4,
            fontFamily: ff, fontWeight: 600, textTransform: 'none',
            '&:hover': { backgroundColor: '#b81b21' } }}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function Section({ title, children }) {
  return (
    <Box sx={{ mb: 3 }}>
      <Typography sx={{ fontFamily: ff, fontWeight: 700, fontSize: '1rem', color: 'var(--text-purple)', mb: 1 }}>
        {title}
      </Typography>
      <Typography sx={{ color: 'var(--text-muted)', lineHeight: 1.9, fontSize: '0.92rem' }}>
        {children}
      </Typography>
    </Box>
  );
}

const fieldSx = {
  '& .MuiOutlinedInput-root': { borderRadius: 2, fontFamily: ff },
  '& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#e3242b' },
};

export default function SignUpPage() {
  const navigate = useNavigate();
  const { signUpWithEmail, resendVerificationEmail } = useAuth();
  const { showToast } = useNotifications();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [verified, setVerified] = useState(false);
  const [resending, setResending] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);
  const [privacyOpen, setPrivacyOpen] = useState(false);

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
    if (!validateForm()) return;

    setLoading(true);
    try {
      await signUpWithEmail(email, password, name);
      setVerified(true);
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

  const handleResend = async () => {
    setResending(true);
    try {
      await resendVerificationEmail();
      showToast('Verification email resent!', 'success');
    } catch {
      showToast('Could not resend. Try again in a moment.', 'error');
    } finally {
      setResending(false);
    }
  };

  const passwordStrength = () => {
    if (!password) return '';
    if (password.length < 8) return 'Weak';
    if (/[A-Z]/.test(password) && /[0-9]/.test(password)) return 'Strong';
    return 'Medium';
  };

  if (verified) {
    return (
      <Box sx={{ pt: { xs: 12, md: 16 }, pb: 10, minHeight: '100vh', backgroundColor: 'var(--bg-page)' }}>
        <Container maxWidth="sm">
          <Box sx={{ textAlign: 'center', py: 6 }}>
            <MarkEmailReadIcon sx={{ fontSize: 72, color: '#e3242b', mb: 2 }} />
            <Typography variant="h5" sx={{ fontFamily: ff, fontWeight: 700, mb: 1.5, color: 'var(--text-main)' }}>
              Check your inbox!
            </Typography>
            <Typography sx={{ color: 'var(--text-muted)', lineHeight: 1.8, mb: 1, fontSize: '0.95rem' }}>
              We sent a verification link to <strong>{email}</strong>.
            </Typography>
            <Typography sx={{ color: 'var(--text-muted)', lineHeight: 1.8, mb: 4, fontSize: '0.95rem' }}>
              Click the link in the email to verify your account, then sign in.
            </Typography>
            <Button
              onClick={() => navigate('/login')}
              sx={{
                backgroundColor: '#e3242b', color: '#fff', borderRadius: '30px',
                px: 5, py: 1.3, fontFamily: ff, fontWeight: 600, fontSize: '0.95rem',
                mb: 2, '&:hover': { backgroundColor: '#b81b21' },
              }}
            >
              Go to Sign In
            </Button>
            <Box>
              <Typography sx={{ fontSize: '0.82rem', color: 'var(--text-muted)', mb: 0.5 }}>
                Didn't receive it?
              </Typography>
              <Button
                onClick={handleResend}
                disabled={resending}
                sx={{ fontFamily: ff, color: '#e3242b', fontSize: '0.85rem', textTransform: 'none', fontWeight: 600 }}
              >
                {resending ? <CircularProgress size={16} sx={{ color: '#e3242b' }} /> : 'Resend verification email'}
              </Button>
            </Box>
          </Box>
        </Container>
      </Box>
    );
  }

  return (
    <Box sx={{ pt: { xs: 12, md: 16 }, pb: 10, minHeight: '100vh', backgroundColor: 'var(--bg-page)' }}>
      <Container maxWidth="sm">
        <Button
          onClick={() => navigate('/auth-method')}
          startIcon={<ArrowBackIcon />}
          sx={{ color: '#e3242b', mb: 3, textTransform: 'none', fontWeight: 600, '&:hover': { backgroundColor: 'rgba(227, 36, 43, 0.08)' } }}
        >
          Back
        </Button>

        <Typography variant="h4" sx={{ fontFamily: ff, fontWeight: 700, mb: 1, color: 'var(--text-main)' }}>
          Create Account
        </Typography>
        <Typography sx={{ color: 'var(--text-muted)', mb: 4, lineHeight: 1.6 }}>
          Sign up to start shopping at PerfectFooties
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}

        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth label="Full Name" value={name}
            onChange={(e) => setName(e.target.value)} disabled={loading}
            sx={{ mb: 2, ...fieldSx }}
          />

          <TextField
            fullWidth type="email" label="Email Address" value={email}
            onChange={(e) => setEmail(e.target.value)} disabled={loading}
            sx={{ mb: 2, ...fieldSx }}
          />

          <TextField
            fullWidth label="Password" value={password}
            type={showPassword ? 'text' : 'password'}
            onChange={(e) => setPassword(e.target.value)} disabled={loading}
            helperText={password && `Strength: ${passwordStrength()}`}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowPassword((v) => !v)} edge="end" size="small" tabIndex={-1}>
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{ mb: 2, ...fieldSx }}
          />

          <TextField
            fullWidth label="Confirm Password" value={confirmPassword}
            type={showConfirm ? 'text' : 'password'}
            onChange={(e) => setConfirmPassword(e.target.value)} disabled={loading}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => setShowConfirm((v) => !v)} edge="end" size="small" tabIndex={-1}>
                    {showConfirm ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{ mb: 2, ...fieldSx }}
          />

          <FormControlLabel
            control={
              <Checkbox checked={agreeTerms} onChange={(e) => setAgreeTerms(e.target.checked)} disabled={loading}
                sx={{ color: '#e3242b', '&.Mui-checked': { color: '#e3242b' } }}
              />
            }
            label={
              <Typography sx={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                I agree to the{' '}
                <Link component="button" type="button" onClick={(e) => { e.preventDefault(); setTermsOpen(true); }}
                  sx={{ color: '#e3242b', fontWeight: 600, textDecoration: 'none', cursor: 'pointer', verticalAlign: 'baseline', '&:hover': { textDecoration: 'underline' } }}>
                  Terms & Conditions
                </Link>{' '}
                and{' '}
                <Link component="button" type="button" onClick={(e) => { e.preventDefault(); setPrivacyOpen(true); }}
                  sx={{ color: '#e3242b', fontWeight: 600, textDecoration: 'none', cursor: 'pointer', verticalAlign: 'baseline', '&:hover': { textDecoration: 'underline' } }}>
                  Privacy Policy
                </Link>
              </Typography>
            }
            sx={{ mb: 3 }}
          />

          <Button
            fullWidth type="submit" disabled={loading}
            sx={{
              backgroundColor: '#e3242b', color: '#fff', borderRadius: 2,
              py: 1.5, fontFamily: ff, fontWeight: 600, fontSize: '1rem', mb: 3,
              '&:hover': { backgroundColor: '#b81b21' }, '&:disabled': { backgroundColor: '#ccc' },
            }}
          >
            {loading ? <CircularProgress size={24} sx={{ color: '#fff' }} /> : 'Create Account'}
          </Button>
        </form>

        <Box sx={{ textAlign: 'center' }}>
          <Typography sx={{ color: 'var(--text-muted)', mb: 1 }}>Already have an account?</Typography>
          <Link
            component="button"
            onClick={(e) => { e.preventDefault(); navigate('/login'); }}
            sx={{ color: '#e3242b', fontWeight: 600, textDecoration: 'none', fontSize: '1rem', cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
          >
            Sign in here
          </Link>
        </Box>
      </Container>

      {/* Terms & Conditions Modal */}
      <LegalModal open={termsOpen} onClose={() => setTermsOpen(false)} title="Terms & Conditions">
        <Typography sx={{ fontSize: '0.8rem', color: 'var(--text-muted)', mb: 3 }}>Last updated: April 2026</Typography>
        <Section title="1. Acceptance of Terms">
          By creating an account or placing an order on PerfectFooties, you agree to be bound by these Terms & Conditions. If you do not agree, please do not use our services.
        </Section>
        <Section title="2. Products & Orders">
          All products displayed are subject to availability. We reserve the right to cancel or refuse any order at our discretion. Custom and made-to-order items (press-ons, leather goods) are non-refundable once production has begun.
        </Section>
        <Section title="3. Pricing & Payment">
          All prices are listed in Nigerian Naira (₦) unless otherwise stated. We accept payment via Paystack (card) and WhatsApp-confirmed bank transfers. Prices may change without notice, but confirmed orders will not be affected.
        </Section>
        <Section title="4. Shipping & Delivery">
          Domestic orders are shipped via Fez Delivery. Estimated delivery timelines are 2–5 business days after dispatch. International orders are quoted individually via WhatsApp before production begins. PerfectFooties is not liable for delays caused by third-party couriers or customs.
        </Section>
        <Section title="5. Returns & Refunds">
          Ready-made items may be returned within 7 days of delivery if unused and in original condition. Custom orders (made-to-order press-ons and leather goods) are non-refundable. To initiate a return, contact us via WhatsApp or email.
        </Section>
        <Section title="6. Intellectual Property">
          All images, designs, and content on PerfectFooties are the property of PerfectFooties. You may not reproduce, distribute, or use our content without written permission.
        </Section>
        <Section title="7. Limitation of Liability">
          PerfectFooties shall not be liable for any indirect, incidental, or consequential damages arising from use of our products or services beyond the amount paid for the specific order in question.
        </Section>
        <Section title="8. Changes to Terms">
          We reserve the right to update these Terms at any time. Continued use of our services after changes constitutes acceptance of the new Terms.
        </Section>
        <Section title="9. Contact">
          For questions about these Terms, contact us via WhatsApp at +234 807 363 7911 or email perfectfooties@gmail.com.
        </Section>
      </LegalModal>

      {/* Privacy Policy Modal */}
      <LegalModal open={privacyOpen} onClose={() => setPrivacyOpen(false)} title="Privacy Policy">
        <Typography sx={{ fontSize: '0.8rem', color: 'var(--text-muted)', mb: 3 }}>Last updated: April 2026</Typography>
        <Section title="1. Information We Collect">
          When you create an account or place an order, we collect your name, email address, phone number, and shipping address. We may also collect device and usage data to improve your experience.
        </Section>
        <Section title="2. How We Use Your Information">
          We use your information to process and fulfil orders, send order confirmations and shipping updates, respond to customer service enquiries, and send promotional communications (only with your consent).
        </Section>
        <Section title="3. Data Storage & Security">
          Your data is stored securely using Firebase (Google Cloud infrastructure). We use industry-standard encryption and access controls. We do not store payment card details — all payments are processed securely by Paystack.
        </Section>
        <Section title="4. Sharing Your Information">
          We do not sell or rent your personal data to third parties. We share your shipping details with our delivery partner (Fez Delivery) solely to fulfil your order. We may share data with service providers (e.g. Firebase, Paystack, Mailtrap) strictly to operate our services.
        </Section>
        <Section title="5. Cookies">
          Our website may use cookies and local storage to maintain your session and shopping cart. You can disable cookies in your browser settings, though some features may not function properly.
        </Section>
        <Section title="6. Your Rights">
          You have the right to access, correct, or delete the personal data we hold about you. To make a request, contact us via WhatsApp or email and we will respond within 14 days.
        </Section>
        <Section title="7. Data Retention">
          We retain your account and order data for as long as your account is active or as needed to fulfil legal obligations. You may request account deletion at any time.
        </Section>
        <Section title="8. Changes to This Policy">
          We may update this Privacy Policy from time to time. We will notify you of significant changes via email or a notice on our website.
        </Section>
        <Section title="9. Contact">
          For privacy-related enquiries, contact us at perfectfooties@gmail.com or via WhatsApp at +234 807 363 7911.
        </Section>
      </LegalModal>
    </Box>
  );
}
