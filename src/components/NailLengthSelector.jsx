import { Box, Typography } from '@mui/material';

// Nail paths for each length — all in viewBox "0 0 20 40"
// Bottom-aligned at y=34 (finger base), nail plate extends upward
const NAIL_LENGTH_PATHS = {
  'XS (Extra Short)': 'M3,34 L3,29 Q3,25 10,25 Q17,25 17,29 L17,34 Z',
  'S (Short)':        'M3,34 L3,26 Q3,20 10,20 Q17,20 17,26 L17,34 Z',
  'M (Medium)':       'M3,34 L3,21 Q3,13 10,13 Q17,13 17,21 L17,34 Z',
  'L (Long)':         'M3,34 L3,17 Q3,8  10,8  Q17,8  17,17 L17,34 Z',
  'XL (Extra Long)':  'M3,34 L3,11 Q3,4  10,4  Q17,4  17,11 L17,34 Z',
};

// Full label shown under each option
const FULL_LABEL = {
  'XS (Extra Short)': 'Extra Short',
  'S (Short)':        'Short',
  'M (Medium)':       'Medium',
  'L (Long)':         'Long',
  'XL (Extra Long)':  'Extra Long',
};

function formatNaira(amount) {
  return `₦${Number(amount).toLocaleString()}`;
}

export default function NailLengthSelector({ value, onChange, surcharges }) {
  return (
    <Box>
      <Typography sx={{ fontSize: '0.78rem', color: '#777', mb: 1.5 }}>
        Tap a length to select it
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
        {Object.entries(NAIL_LENGTH_PATHS).map(([length, path]) => {
          const selected = value === length;
          const surcharge = surcharges?.[length] ?? null;
          return (
            <Box
              key={length}
              onClick={() => onChange(length)}
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 0.5,
                cursor: 'pointer',
                p: 1,
                borderRadius: 2,
                border: selected ? '2px solid #E91E8C' : '1.5px solid #F0C0D0',
                backgroundColor: selected ? '#FFF0F5' : '#fff',
                transition: 'all 0.15s',
                '&:hover': { borderColor: '#E91E8C', backgroundColor: '#FFF0F5' },
                minWidth: 64,
              }}
            >
              <svg viewBox="0 0 20 40" width="22" height="44" style={{ display: 'block' }}>
                {/* Finger base */}
                <path
                  d="M3,34 L3,38 Q3,40 10,40 Q17,40 17,38 L17,34 Z"
                  fill={selected ? '#F8BBD0' : '#FFE4C4'}
                  stroke={selected ? '#E91E8C' : '#F0C0D0'}
                  strokeWidth="0.4"
                />
                {/* Nail plate */}
                <path
                  d={path}
                  fill={selected ? '#E91E8C' : '#F0C0D0'}
                  stroke={selected ? '#C2185B' : '#d48fa0'}
                  strokeWidth="0.8"
                />
              </svg>
              <Typography sx={{ fontSize: '0.65rem', fontWeight: selected ? 700 : 500, color: selected ? '#E91E8C' : '#555', lineHeight: 1.2, textAlign: 'center' }}>
                {FULL_LABEL[length]}
              </Typography>
              {surcharge !== null && (
                <Typography sx={{ fontSize: '0.6rem', color: surcharge > 0 ? '#7b1fa2' : '#888', fontWeight: surcharge > 0 ? 700 : 400, lineHeight: 1, textAlign: 'center' }}>
                  {surcharge > 0 ? `+${formatNaira(surcharge)}` : 'base'}
                </Typography>
              )}
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
