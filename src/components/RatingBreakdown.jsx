import { Box, Typography, LinearProgress } from '@mui/material';
import { Rating } from '@mui/material';

const ff = '"Georgia", serif';

export default function RatingBreakdown({ reviews = [] }) {
  const total = reviews.length;
  if (!total) return null;

  const avg = reviews.reduce((s, r) => s + (Number(r.rating) || 0), 0) / total;
  const counts = [5, 4, 3, 2, 1].map((star) =>
    reviews.filter((r) => Number(r.rating) === star).length
  );

  return (
    <Box
      sx={{
        display: 'flex',
        gap: { xs: 2, sm: 4 },
        flexDirection: { xs: 'column', sm: 'row' },
        alignItems: { xs: 'flex-start', sm: 'center' },
        p: { xs: 2, sm: 3 },
        borderRadius: 3,
        border: '1px solid #E8D5B0',
        backgroundColor: 'var(--bg-soft)',
        mb: 3,
      }}
    >
      {/* Left — big score */}
      <Box sx={{ textAlign: 'center', minWidth: 100, flexShrink: 0 }}>
        <Typography sx={{ fontFamily: ff, fontWeight: 700, fontSize: '3.5rem', lineHeight: 1, color: 'var(--text-main)' }}>
          {avg.toFixed(1)}
        </Typography>
        <Rating value={avg} precision={0.5} readOnly size="small" sx={{ mt: 0.5, color: '#f59e0b' }} />
        <Typography sx={{ fontSize: '0.78rem', color: 'var(--text-muted)', mt: 0.5 }}>
          {total} {total === 1 ? 'rating' : 'ratings'}
        </Typography>
      </Box>

      {/* Right — bars */}
      <Box sx={{ flex: 1, width: '100%' }}>
        {[5, 4, 3, 2, 1].map((star, i) => {
          const count = counts[i];
          const pct = total > 0 ? (count / total) * 100 : 0;
          return (
            <Box key={star} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.75 }}>
              <Typography sx={{ fontSize: '0.75rem', color: 'var(--text-muted)', width: 24, textAlign: 'right', flexShrink: 0 }}>
                {star}★
              </Typography>
              <LinearProgress
                variant="determinate"
                value={pct}
                sx={{
                  flex: 1,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: 'var(--bg-soft)',
                  '& .MuiLinearProgress-bar': {
                    backgroundColor: '#f59e0b',
                    borderRadius: 4,
                  },
                }}
              />
              <Typography sx={{ fontSize: '0.75rem', color: 'var(--text-muted)', width: 28, flexShrink: 0 }}>
                {count}
              </Typography>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
