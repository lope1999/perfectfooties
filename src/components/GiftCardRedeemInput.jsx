import { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Collapse,
} from '@mui/material';
import CardGiftcardIcon from '@mui/icons-material/CardGiftcard';
import CloseIcon from '@mui/icons-material/Close';
import { lookupGiftCard, validateCardForRedemption } from '../lib/giftCardService';

const textFieldSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: 2,
    '& fieldset': { borderColor: '#E8D5B0' },
    '&:hover fieldset': { borderColor: '#e3242b' },
    '&.Mui-focused fieldset': { borderColor: '#e3242b' },
  },
};

function formatNaira(amount) {
  return `₦${Number(amount).toLocaleString()}`;
}

export default function GiftCardRedeemInput({ onApplied, onRemoved, appliedCard }) {
  const [expanded, setExpanded] = useState(false);
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleApply = async () => {
    if (!code.trim()) return;
    setLoading(true);
    setError('');
    try {
      const card = await lookupGiftCard(code.trim());
      const validation = validateCardForRedemption(card);
      if (!validation.valid) {
        setError(validation.error);
      } else {
        onApplied({ code: card.code, balance: card.balance, cardId: card.id });
        setCode('');
        setError('');
      }
    } catch (err) {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = () => {
    onRemoved();
    setExpanded(false);
    setCode('');
    setError('');
  };

  const maskedCode = appliedCard ? `****${appliedCard.code.slice(-4)}` : '';

  return (
    <Box
      sx={{
        mb: 3,
        p: 2,
        borderRadius: 2,
        border: '1px solid #E8D5B0',
        backgroundColor: '#fff',
      }}
    >
      {appliedCard ? (
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <CardGiftcardIcon sx={{ color: '#e3242b', fontSize: 20 }} />
            <Typography sx={{ fontFamily: '"Georgia", serif', fontWeight: 600, fontSize: '0.9rem' }}>
              Gift Card Applied: <span style={{ letterSpacing: '1px' }}>{maskedCode}</span>
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Typography sx={{ fontFamily: '"Georgia", serif', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Balance: {formatNaira(appliedCard.balance)}
            </Typography>
            <Button
              size="small"
              onClick={handleRemove}
              startIcon={<CloseIcon sx={{ fontSize: 16 }} />}
              sx={{
                color: '#d32f2f',
                fontFamily: '"Georgia", serif',
                fontSize: '0.8rem',
                textTransform: 'none',
              }}
            >
              Remove
            </Button>
          </Box>
        </Box>
      ) : (
        <>
          <Box
            onClick={() => setExpanded(!expanded)}
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              cursor: 'pointer',
              '&:hover': { opacity: 0.8 },
            }}
          >
            <CardGiftcardIcon sx={{ color: '#e3242b', fontSize: 20 }} />
            <Typography
              sx={{
                fontFamily: '"Georgia", serif',
                fontWeight: 600,
                fontSize: '0.9rem',
                color: '#e3242b',
              }}
            >
              Have a gift card?
            </Typography>
          </Box>
          <Collapse in={expanded}>
            <Box sx={{ mt: 2 }}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  fullWidth
                  placeholder="Enter gift card code"
                  value={code}
                  onChange={(e) => {
                    setCode(e.target.value.toUpperCase());
                    setError('');
                  }}
                  size="small"
                  inputProps={{ style: { letterSpacing: '2px', fontWeight: 600 } }}
                  sx={textFieldSx}
                />
                <Button
                  onClick={handleApply}
                  disabled={!code.trim() || loading}
                  sx={{
                    border: '2px solid #e3242b',
                    borderRadius: 2,
                    color: '#e3242b',
                    fontFamily: '"Georgia", serif',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    px: 3,
                    whiteSpace: 'nowrap',
                    '&:hover': { backgroundColor: '#e3242b', color: '#fff' },
                  }}
                >
                  {loading ? <CircularProgress size={20} /> : 'Apply'}
                </Button>
              </Box>
              {error && (
                <Typography sx={{ color: '#d32f2f', fontSize: '0.8rem', mt: 1 }}>
                  {error}
                </Typography>
              )}
            </Box>
          </Collapse>
        </>
      )}
    </Box>
  );
}
