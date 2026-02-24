import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Container, Card, CardContent, Button, Grid, CircularProgress } from '@mui/material';
import LoginIcon from '@mui/icons-material/Login';
import { serviceCategories } from '../data/services';
import { useAuth } from '../context/AuthContext';
import ScrollReveal from '../components/ScrollReveal';

const sectionColors = ['#FFF0F5', '#FCE4EC', '#F3E5F6'];

const bookButtonSx = {
  border: '2px solid #E91E8C',
  borderRadius: '30px',
  color: '#000',
  backgroundColor: 'transparent',
  px: 4,
  py: 1.2,
  fontSize: '0.95rem',
  fontFamily: '"Georgia", serif',
  fontWeight: 600,
  mt: 4,
  transition: 'all 0.3s ease',
  '&:hover': {
    backgroundColor: '#E91E8C',
    color: '#fff',
    borderColor: '#E91E8C',
  },
};

function formatNaira(amount) {
  return `₦${amount.toLocaleString()}`;
}

export default function ServiceMenuPage() {
  const navigate = useNavigate();
  const { user, signInWithGoogle } = useAuth();
  const [signingIn, setSigningIn] = useState(false);

  const handleSignIn = async () => {
    setSigningIn(true);
    try {
      await signInWithGoogle();
    } catch {
      // user closed popup
    } finally {
      setSigningIn(false);
    }
  };

  return (
    <Box sx={{ pt: 12 }}>
      {/* Page Header */}
      <Box sx={{ textAlign: 'center', py: 6, backgroundColor: '#fff' }}>
        <ScrollReveal direction="up">
          <Typography
            variant="h3"
            sx={{
              fontFamily: '"Georgia", serif',
              fontWeight: 700,
              color: '#000',
              mb: 2,
              fontSize: { xs: '1.8rem', sm: '2.4rem', md: '3rem' },
            }}
          >
            Service Menu
          </Typography>
        </ScrollReveal>
        <ScrollReveal direction="up" delay={0.15}>
          <Typography
            sx={{
              maxWidth: 600,
              mx: 'auto',
              color: '#555',
              fontSize: '1.1rem',
              lineHeight: 1.7,
              px: 2,
            }}
          >
            Explore our range of nail services designed to give you the perfect look.
            From classic manicures to custom nail art, we have something for everyone.
            Book your appointment today and let us bring your nail vision to life.
          </Typography>
        </ScrollReveal>
        {!user && (
          <ScrollReveal direction="up" delay={0.25}>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1.5,
                mt: 3,
                py: 1.5,
                px: 3,
                mx: 'auto',
                maxWidth: 480,
                backgroundColor: '#FFF0F5',
                borderRadius: 3,
                border: '1px solid #F0C0D0',
              }}
            >
              <Typography
                sx={{ fontFamily: '"Georgia", serif', fontSize: '0.9rem', color: '#555' }}
              >
                Sign in to track your appointments
              </Typography>
              <Button
                size="small"
                startIcon={
                  signingIn ? (
                    <CircularProgress size={16} sx={{ color: 'inherit' }} />
                  ) : (
                    <LoginIcon sx={{ fontSize: 18 }} />
                  )
                }
                onClick={handleSignIn}
                disabled={signingIn}
                sx={{
                  fontFamily: '"Georgia", serif',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  color: '#E91E8C',
                  border: '1.5px solid #E91E8C',
                  borderRadius: '20px',
                  px: 2,
                  whiteSpace: 'nowrap',
                  '&:hover': { backgroundColor: '#E91E8C', color: '#fff' },
                }}
              >
                {signingIn ? 'Signing In…' : 'Sign In'}
              </Button>
            </Box>
          </ScrollReveal>
        )}
      </Box>

      {/* Service Sections */}
      {serviceCategories.map((category, index) => (
        <Box key={category.id}>
          <Box
            sx={{
              backgroundColor: sectionColors[index % sectionColors.length],
              py: 8,
            }}
          >
            <Container maxWidth="lg">
              <ScrollReveal direction="up">
                <Typography
                  variant="h4"
                  sx={{
                    fontFamily: '"Georgia", serif',
                    fontWeight: 700,
                    color: '#000',
                    mb: 1,
                    textAlign: 'center',
                    fontSize: { xs: '1.4rem', sm: '1.8rem', md: '2.1rem' },
                    px: 1,
                  }}
                >
                  {category.title}
                </Typography>
              </ScrollReveal>
              <ScrollReveal direction="up" delay={0.1}>
                <Typography
                  sx={{
                    textAlign: 'center',
                    color: '#555',
                    mb: 5,
                    maxWidth: 550,
                    mx: 'auto',
                    lineHeight: 1.6,
                  }}
                >
                  {category.description}
                </Typography>
              </ScrollReveal>

              <Grid container spacing={3}>
                {category.services.map((service, sIdx) => (
                  <Grid item xs={12} sm={6} md={4} key={service.id}>
                    <ScrollReveal direction="up" delay={sIdx * 0.1}>
                      <Card
                        elevation={0}
                        sx={{
                          borderRadius: 3,
                          border: '1px solid #F0C0D0',
                          height: '100%',
                          display: 'flex',
                          flexDirection: 'column',
                          overflow: 'hidden',
                          transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                          '&:hover': {
                            transform: 'translateY(-6px)',
                            boxShadow: '0 12px 32px rgba(233,30,140,0.15)',
                          },
                        }}
                      >
                        <Box
                          component="img"
                          src={service.image}
                          alt={service.name}
                          sx={{
                            width: '100%',
                            height: 180,
                            objectFit: 'cover',
                          }}
                        />
                        <CardContent sx={{ flex: 1, p: 3 }}>
                          <Box
                            sx={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'flex-start',
                              mb: 1.5,
                            }}
                          >
                            <Typography
                              variant="h6"
                              sx={{
                                fontFamily: '"Georgia", serif',
                                fontWeight: 700,
                                color: '#000',
                                fontSize: '1rem',
                                flex: 1,
                              }}
                            >
                              {service.name}
                            </Typography>
                            <Typography
                              sx={{
                                fontFamily: '"Georgia", serif',
                                fontWeight: 700,
                                color: '#E91E8C',
                                fontSize: '1rem',
                                whiteSpace: 'nowrap',
                                ml: 2,
                              }}
                            >
                              {formatNaira(service.price)}
                            </Typography>
                          </Box>
                          <Typography sx={{ color: '#666', fontSize: '0.9rem', lineHeight: 1.5 }}>
                            {service.description}
                          </Typography>
                        </CardContent>
                      </Card>
                    </ScrollReveal>
                  </Grid>
                ))}
              </Grid>

              <ScrollReveal direction="up" delay={0.2}>
                <Box sx={{ textAlign: 'center' }}>
                  <Button sx={bookButtonSx} onClick={() => navigate('/book')}>
                    Book Appointment
                  </Button>
                </Box>
              </ScrollReveal>
            </Container>
          </Box>
        </Box>
      ))}
    </Box>
  );
}
