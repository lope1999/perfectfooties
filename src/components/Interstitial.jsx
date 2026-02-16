import { Box, Typography } from '@mui/material';
import ScrollReveal from './ScrollReveal';

export default function Interstitial({
  image,
  text = "Hope it's great so far",
  overlayColor = 'rgba(74, 14, 78, 0.55)',
}) {
  return (
    <Box
      sx={{
        height: { xs: 220, sm: 280, md: 350 },
        backgroundImage: `url("${image}")`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
      }}
    >
      <Box sx={{ position: 'absolute', inset: 0, backgroundColor: overlayColor }} />
      <ScrollReveal direction="up" duration={0.9}>
        <Typography
          variant="h3"
          sx={{
            position: 'relative',
            zIndex: 1,
            fontFamily: '"Georgia", serif',
            fontWeight: 700,
            color: '#fff',
            textAlign: 'center',
            fontSize: { xs: '1.4rem', sm: '2rem', md: '3rem' },
            px: 3,
            textShadow: '0 2px 12px rgba(0,0,0,0.3)',
          }}
        >
          {text}
        </Typography>
      </ScrollReveal>
    </Box>
  );
}
