import { Box, Typography } from '@mui/material';

export const NAIL_SHAPE_PATHS = {
  Almond:    'M3,35 Q2,20 10,4 Q18,20 17,35 Q14,36 10,36 Q6,36 3,35 Z',
  Coffin:    'M2,35 L5,5 L15,5 L18,35 Z',
  Stiletto:  'M3,35 L7,16 L10,4 L13,16 L17,35 Z',
  Square:    'M2,35 L2,4 L18,4 L18,35 Z',
  Round:     'M2,35 L2,14 Q2,4 10,4 Q18,4 18,14 L18,35 Z',
  Oval:      'M2,35 Q2,22 10,4 Q18,22 18,35 Z',
  Ballerina: 'M2,35 L7,6 L13,6 L18,35 Z',
};

export default function NailShapeSelector({ value, onChange }) {
  return (
    <Box>
      <Typography sx={{ fontSize: '0.78rem', color: '#777', mb: 1.5 }}>
        Tap a shape to select it
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
        {Object.entries(NAIL_SHAPE_PATHS).map(([shape, path]) => {
          const selected = value === shape;
          return (
            <Box
              key={shape}
              onClick={() => onChange(shape)}
              sx={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 0.8,
                cursor: 'pointer',
                p: 1,
                borderRadius: 2,
                border: selected ? '2px solid #E91E8C' : '1.5px solid #F0C0D0',
                backgroundColor: selected ? '#FFF0F5' : '#fff',
                transition: 'all 0.15s',
                '&:hover': { borderColor: '#E91E8C', backgroundColor: '#FFF0F5' },
                minWidth: 52,
              }}
            >
              <svg viewBox="0 0 20 36" width="22" height="40" style={{ display: 'block' }}>
                <path
                  d={path}
                  fill={selected ? '#E91E8C' : '#F0C0D0'}
                  stroke={selected ? '#C2185B' : '#d48fa0'}
                  strokeWidth="0.8"
                />
              </svg>
              <Typography sx={{ fontSize: '0.65rem', fontWeight: selected ? 700 : 500, color: selected ? '#E91E8C' : '#555', lineHeight: 1, textAlign: 'center' }}>
                {shape}
              </Typography>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
