import { useState, useEffect } from 'react';
import { Box, Typography, Chip } from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

function pad(n) { return String(n).padStart(2, '0'); }

export default function FlashSaleCountdown({ endsAt, compact = false }) {
  const [timeLeft, setTimeLeft] = useState(null);

  useEffect(() => {
    if (!endsAt) return;
    const end = new Date(endsAt).getTime();
    const tick = () => {
      const diff = end - Date.now();
      if (diff <= 0) { setTimeLeft(null); return; }
      setTimeLeft({
        d: Math.floor(diff / 86400000),
        h: Math.floor((diff % 86400000) / 3600000),
        m: Math.floor((diff % 3600000) / 60000),
        s: Math.floor((diff % 60000) / 1000),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endsAt]);

  if (!endsAt || !timeLeft) return null;

  if (compact) {
    const label = timeLeft.d > 0
      ? `${timeLeft.d}d ${pad(timeLeft.h)}h left`
      : timeLeft.h > 0
      ? `${pad(timeLeft.h)}h ${pad(timeLeft.m)}m left`
      : `${pad(timeLeft.m)}m ${pad(timeLeft.s)}s left`;
    return (
      <Chip
        icon={<AccessTimeIcon sx={{ fontSize: '12px !important' }} />}
        label={label}
        size="small"
        sx={{
          backgroundColor: '#FF3D00',
          color: '#fff',
          fontWeight: 700,
          fontSize: '0.65rem',
          height: 20,
          '& .MuiChip-icon': { color: '#fff' },
        }}
      />
    );
  }

  const parts = timeLeft.d > 0
    ? [{ v: timeLeft.d, l: 'days' }, { v: pad(timeLeft.h), l: 'hrs' }, { v: pad(timeLeft.m), l: 'min' }]
    : [{ v: pad(timeLeft.h), l: 'hrs' }, { v: pad(timeLeft.m), l: 'min' }, { v: pad(timeLeft.s), l: 'sec' }];

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1, flexWrap: 'wrap' }}>
      <AccessTimeIcon sx={{ fontSize: 15, color: '#FF3D00' }} />
      <Typography sx={{ fontSize: '0.78rem', fontWeight: 700, color: '#FF3D00' }}>
        Sale ends in:
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        {parts.map((p, i) => (
          <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
            <Box sx={{ background: '#FF3D00', color: '#fff', borderRadius: 1, px: 0.7, py: 0.2, fontFamily: 'monospace', fontWeight: 800, fontSize: '0.82rem', minWidth: 26, textAlign: 'center' }}>
              {p.v}
            </Box>
            <Typography sx={{ fontSize: '0.6rem', color: '#888' }}>{p.l}</Typography>
            {i < parts.length - 1 && (
              <Typography sx={{ color: '#FF3D00', fontWeight: 900, lineHeight: 1, mx: 0.1 }}>:</Typography>
            )}
          </Box>
        ))}
      </Box>
    </Box>
  );
}
