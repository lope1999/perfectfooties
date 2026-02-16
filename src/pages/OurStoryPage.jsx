import { Box, Typography, Container, Grid } from '@mui/material';
import ScrollReveal from '../components/ScrollReveal';

export default function OurStoryPage() {
  return (
    <Box sx={{ pt: 12 }}>
      <Container maxWidth="lg" sx={{ py: { xs: 4, md: 8 }, px: { xs: 2, md: 3 } }}>
        <Grid container spacing={{ xs: 4, md: 8 }} alignItems="center">
          {/* Text Side */}
          <Grid item xs={12} md={6}>
            <ScrollReveal direction="left">
              <Typography
                variant="h3"
                sx={{
                  fontFamily: '"Georgia", serif',
                  fontWeight: 700,
                  color: '#000',
                  mb: 3,
                  fontSize: { xs: '1.8rem', sm: '2.4rem', md: '3rem' },
                }}
              >
                Our Story
              </Typography>
              <Typography
                sx={{ color: '#444', fontSize: '1.05rem', lineHeight: 1.9, mb: 3 }}
              >
                Chizzystyles was born out of a deep love for nail artistry and a desire to
                make every woman feel confident and beautiful. What started as a small
                passion project in a tiny Lagos apartment has grown into a trusted name in
                the beauty community.
              </Typography>
              <Typography
                sx={{ color: '#444', fontSize: '1.05rem', lineHeight: 1.9, mb: 3 }}
              >
                Our founder, Chizzy, spent years perfecting her craft — learning from the
                best nail technicians, experimenting with new techniques, and building a
                loyal clientele one set of nails at a time. She believed that nails are more
                than just an accessory; they are an expression of personality, mood, and
                style.
              </Typography>
              <Typography
                sx={{ color: '#444', fontSize: '1.05rem', lineHeight: 1.9, mb: 3 }}
              >
                Today, Chizzystyles offers a full range of services — from Gel X and hard
                gel extensions to luxurious pedicures and custom press-on nails. Every
                appointment is a personalised experience, because we believe you deserve
                nails that are as unique as you are.
              </Typography>
              <Typography
                sx={{
                  color: '#E91E8C',
                  fontSize: '1.15rem',
                  lineHeight: 1.9,
                  fontWeight: 600,
                  fontFamily: '"Georgia", serif',
                  fontStyle: 'italic',
                }}
              >
                "Gloss and grace in every set — that is the Chizzystyles promise."
              </Typography>
            </ScrollReveal>
          </Grid>

          {/* Image Side */}
          <Grid item xs={12} md={6}>
            <ScrollReveal direction="right" delay={0.2}>
              <Box
                component="img"
                src="https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=800&q=80"
                alt="Woman planning with laptop"
                sx={{
                  width: '100%',
                  borderRadius: 4,
                  boxShadow: '0 16px 48px rgba(74,14,78,0.15)',
                  objectFit: 'cover',
                  maxHeight: 550,
                }}
              />
            </ScrollReveal>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}
