import { Box, Typography, Container, Grid, Avatar, Chip } from '@mui/material';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import ScrollReveal from '../components/ScrollReveal';
import { testimonials } from '../data/testimonials';

function StarRating({ rating }) {
  return (
    <Box sx={{ display: 'flex', gap: 0.3 }}>
      {[1, 2, 3, 4, 5].map((star) =>
        star <= rating ? (
          <StarIcon key={star} sx={{ color: '#E91E8C', fontSize: 22 }} />
        ) : (
          <StarBorderIcon key={star} sx={{ color: '#E91E8C', fontSize: 22 }} />
        )
      )}
    </Box>
  );
}

export default function TestimonialsPage() {
  return (
    <Box sx={{ pt: 12, pb: 8, minHeight: '100vh', backgroundColor: '#FAFAFA' }}>
      {/* Header */}
      <Box sx={{ textAlign: 'center', py: 6 }}>
        <ScrollReveal direction="up">
          <Typography
            variant="h3"
            sx={{
              fontFamily: '"Georgia", serif',
              fontWeight: 700,
              color: '#000',
              mb: 1,
            }}
          >
            Client Testimonials
          </Typography>
        </ScrollReveal>
        <ScrollReveal direction="up" delay={0.15}>
          <Typography
            sx={{
              color: '#777',
              fontSize: '1.1rem',
              fontStyle: 'italic',
              fontFamily: '"Georgia", serif',
              maxWidth: 520,
              mx: 'auto',
            }}
          >
            Real reviews from real clients — hear what they have to say about
            their nail appointments and press-on purchases.
          </Typography>
        </ScrollReveal>
      </Box>

      <Container maxWidth="lg">
        {/* Featured Testimonial — first item */}
        <ScrollReveal direction="up">
          <Box
            sx={{
              mb: 6,
              borderRadius: 4,
              overflow: 'hidden',
              boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
              backgroundColor: '#fff',
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              alignItems: 'center',
            }}
          >
            <Box
              sx={{
                width: { xs: '100%', md: '40%' },
                backgroundColor: '#FFF0F5',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                py: { xs: 4, md: 6 },
                px: 3,
              }}
            >
              <Avatar
                sx={{
                  width: 80,
                  height: 80,
                  backgroundColor: '#E91E8C',
                  fontSize: '2rem',
                  fontFamily: '"Georgia", serif',
                  fontWeight: 700,
                  mb: 2,
                }}
              >
                {testimonials[0].avatar}
              </Avatar>
              <Typography
                sx={{
                  fontFamily: '"Georgia", serif',
                  fontWeight: 700,
                  fontSize: '1.3rem',
                  color: '#000',
                }}
              >
                {testimonials[0].name}
              </Typography>
              <Typography sx={{ color: '#888', fontSize: '0.9rem', mb: 1 }}>
                {testimonials[0].occupation}
              </Typography>
              <Chip
                label={testimonials[0].type === 'appointment' ? 'Appointment' : 'Purchase'}
                size="small"
                sx={{
                  backgroundColor:
                    testimonials[0].type === 'appointment' ? '#4A0E4E' : '#E91E8C',
                  color: '#fff',
                  fontWeight: 600,
                  fontFamily: '"Georgia", serif',
                  mb: 2,
                }}
              />
              <StarRating rating={testimonials[0].rating} />
            </Box>
            <Box sx={{ p: { xs: 3, md: 5 }, flex: 1 }}>
              <Typography
                sx={{
                  fontFamily: '"Georgia", serif',
                  fontWeight: 700,
                  color: '#4A0E4E',
                  fontSize: '1rem',
                  mb: 2,
                }}
              >
                {testimonials[0].service}
              </Typography>
              <Typography
                sx={{
                  color: '#444',
                  fontSize: '1.1rem',
                  lineHeight: 1.9,
                  fontStyle: 'italic',
                }}
              >
                "{testimonials[0].review}"
              </Typography>
            </Box>
          </Box>
        </ScrollReveal>

        {/* Grid of testimonials */}
        <Grid container spacing={3}>
          {testimonials.slice(1).map((item, index) => (
            <Grid item xs={12} sm={6} md={4} key={item.id}>
              <ScrollReveal direction="up" delay={index * 0.08}>
                <Box
                  sx={{
                    borderRadius: 3,
                    overflow: 'hidden',
                    backgroundColor: '#fff',
                    boxShadow: '0 4px 16px rgba(0,0,0,0.06)',
                    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    '&:hover': {
                      transform: 'translateY(-6px)',
                      boxShadow: '0 12px 32px rgba(233,30,140,0.12)',
                    },
                  }}
                >
                  {/* Header */}
                  <Box
                    sx={{
                      backgroundColor: '#FFF0F5',
                      px: 3,
                      py: 2.5,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 2,
                    }}
                  >
                    <Avatar
                      sx={{
                        width: 48,
                        height: 48,
                        backgroundColor: '#E91E8C',
                        fontFamily: '"Georgia", serif',
                        fontWeight: 700,
                        fontSize: '1.1rem',
                      }}
                    >
                      {item.avatar}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography
                        sx={{
                          fontFamily: '"Georgia", serif',
                          fontWeight: 700,
                          fontSize: '1rem',
                          color: '#000',
                        }}
                      >
                        {item.name}
                      </Typography>
                      <Typography sx={{ color: '#888', fontSize: '0.8rem' }}>
                        {item.occupation}
                      </Typography>
                    </Box>
                    <Chip
                      label={item.type === 'appointment' ? 'Appt' : 'Order'}
                      size="small"
                      sx={{
                        backgroundColor:
                          item.type === 'appointment' ? '#4A0E4E' : '#E91E8C',
                        color: '#fff',
                        fontWeight: 600,
                        fontSize: '0.7rem',
                        fontFamily: '"Georgia", serif',
                        height: 24,
                      }}
                    />
                  </Box>

                  {/* Body */}
                  <Box sx={{ px: 3, py: 2.5, flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <Typography
                      sx={{
                        fontFamily: '"Georgia", serif',
                        fontWeight: 700,
                        color: '#4A0E4E',
                        fontSize: '0.85rem',
                        mb: 1.5,
                      }}
                    >
                      {item.service}
                    </Typography>
                    <Typography
                      sx={{
                        color: '#555',
                        fontSize: '0.9rem',
                        lineHeight: 1.7,
                        fontStyle: 'italic',
                        flex: 1,
                        mb: 2,
                      }}
                    >
                      "{item.review}"
                    </Typography>
                    <StarRating rating={item.rating} />
                  </Box>
                </Box>
              </ScrollReveal>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}
