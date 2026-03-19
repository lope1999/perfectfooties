import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Container,
  Card,
  CardContent,
  Button,
  Grid,
  CircularProgress,
  Chip,
} from '@mui/material';
import LoginIcon from '@mui/icons-material/Login';
import GroupsIcon from '@mui/icons-material/Groups';
import useServiceCategories from '../hooks/useServiceCategories';
import { useAuth } from '../context/AuthContext';
import useServiceDiscounts from '../hooks/useServiceDiscounts';
import { hasServiceDiscount, getServiceEffectivePrice, getServiceDiscountLabel } from '../lib/discountUtils';
import ScrollReveal from '../components/ScrollReveal';

const sectionColors = ['#FFF0F5', '#FCE4EC', '#F3E5F6'];
const ff = '"Georgia", serif';

function formatNaira(amount) {
  return `₦${Number(amount).toLocaleString()}`;
}

export default function ServiceMenuPage() {
  const navigate = useNavigate();
  const { user, signInWithGoogle } = useAuth();
  const { discounts } = useServiceDiscounts();
  const { categories: serviceCategories } = useServiceCategories();
  const [signingIn, setSigningIn] = useState(false);

  const handleSignIn = async () => {
    setSigningIn(true);
    try { await signInWithGoogle(); } catch { /* user closed popup */ } finally { setSigningIn(false); }
  };

  return (
    <Box sx={{ pt: 12, pb: { xs: 12, md: 6 } }}>
      {/* Page Header */}
      <Box sx={{ textAlign: 'center', py: 6, backgroundColor: '#fff' }}>
        <ScrollReveal direction="up">
          <Typography variant="h3" sx={{ fontFamily: ff, fontWeight: 700, color: 'var(--text-main)', mb: 2, fontSize: { xs: '1.8rem', sm: '2.4rem', md: '3rem' } }}>
            Nail Services Menu
          </Typography>
        </ScrollReveal>
        <ScrollReveal direction="up" delay={0.15}>
          <Typography sx={{ maxWidth: 600, mx: 'auto', color: 'var(--text-muted)', fontSize: '1.1rem', lineHeight: 1.7, px: 2 }}>
            Explore our range of nail services. Click any service card to view details and book your appointment.
          </Typography>
        </ScrollReveal>
        {!user && (
          <ScrollReveal direction="up" delay={0.25}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1.5, mt: 3, py: 1.5, px: 3, mx: 'auto', maxWidth: 480, backgroundColor: '#FFF0F5', borderRadius: 3, border: '1px solid #F0C0D0' }}>
              <Typography sx={{ fontFamily: ff, fontSize: '0.9rem', color: 'var(--text-muted)' }}>Sign in to track your appointments</Typography>
              <Button
                size="small"
                startIcon={signingIn ? <CircularProgress size={16} sx={{ color: 'inherit' }} /> : <LoginIcon sx={{ fontSize: 18 }} />}
                onClick={handleSignIn}
                disabled={signingIn}
                sx={{ fontFamily: ff, fontSize: '0.85rem', fontWeight: 600, color: '#E91E8C', border: '1.5px solid #E91E8C', borderRadius: '20px', px: 2, whiteSpace: 'nowrap', '&:hover': { backgroundColor: '#E91E8C', color: '#fff' } }}
              >
                {signingIn ? 'Signing In…' : 'Sign In'}
              </Button>
            </Box>
          </ScrollReveal>
        )}
        <ScrollReveal direction="up" delay={0.3}>
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 3, flexWrap: 'wrap' }}>
            <Box sx={{ border: '2px solid #E91E8C', borderRadius: 3, px: 3, py: 1.5, backgroundColor: '#FFF0F5', textAlign: 'center', minWidth: 160 }}>
              <Typography sx={{ fontFamily: ff, fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-purple)' }}>Salon Service</Typography>
              <Typography sx={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Visit us at our studio</Typography>
            </Box>
            <Box sx={{ border: '2px dashed #ccc', borderRadius: 3, px: 3, py: 1.5, backgroundColor: '#fafafa', textAlign: 'center', opacity: 0.55, minWidth: 160 }}>
              <Typography sx={{ fontFamily: ff, fontWeight: 700, fontSize: '0.95rem', color: '#999' }}>Home Service</Typography>
              <Typography sx={{ fontSize: '0.78rem', color: '#aaa' }}>Coming Soon</Typography>
            </Box>
          </Box>
        </ScrollReveal>
      </Box>

      {/* Service Sections */}
      {serviceCategories.map((category, index) => (
        <Box key={category.id}>
          {category.id === 'pedicure' && (
            <Box sx={{ backgroundColor: '#4A0E4E', py: { xs: 6, md: 8 } }}>
              <Container maxWidth="md">
                <ScrollReveal direction="up">
                  <Box sx={{ textAlign: 'center' }}>
                    <Box sx={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 64, height: 64, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.1)', mb: 2 }}>
                      <GroupsIcon sx={{ fontSize: '2rem', color: '#fff' }} />
                    </Box>
                    <Typography variant="h4" sx={{ fontFamily: ff, fontWeight: 700, color: '#fff', mb: 1.5, fontSize: { xs: '1.4rem', md: '1.8rem' } }}>
                      Group / Bridal Booking
                    </Typography>
                    <Typography sx={{ fontFamily: ff, color: 'rgba(255,255,255,0.8)', fontSize: { xs: '0.95rem', md: '1.05rem' }, maxWidth: 520, mx: 'auto', mb: 1, lineHeight: 1.7 }}>
                      Planning a bridal party, birthday, or girls' day out? Book for multiple people at once. Groups of 3 or more get <strong style={{ color: '#F9A8D4' }}>10% off the total</strong>.
                    </Typography>
                    <Typography sx={{ fontFamily: ff, color: 'rgba(255,255,255,0.55)', fontSize: '0.85rem', mb: 3 }}>
                      Each person picks their own service · One date &amp; time for everyone · Single deposit payment
                    </Typography>
                    <Button
                      onClick={() => navigate('/group-booking')}
                      sx={{
                        fontFamily: ff,
                        fontWeight: 700,
                        fontSize: '1rem',
                        px: 5,
                        py: 1.5,
                        borderRadius: '30px',
                        backgroundColor: '#E91E8C',
                        color: '#fff',
                        boxShadow: '0 4px 20px rgba(233,30,140,0.4)',
                        '&:hover': { backgroundColor: '#C2185B', boxShadow: '0 6px 24px rgba(233,30,140,0.5)' },
                      }}
                    >
                      Book for a Group
                    </Button>
                  </Box>
                </ScrollReveal>
              </Container>
            </Box>
          )}
          <Box sx={{ backgroundColor: sectionColors[index % sectionColors.length], py: 8, ...(category.comingSoon && { position: 'relative' }) }}>
            {category.comingSoon && (
              <Box sx={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(255,255,255,0.55)', zIndex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                <Typography sx={{ fontFamily: ff, fontWeight: 700, fontSize: { xs: '1.4rem', md: '1.8rem' }, color: 'var(--text-purple)', backgroundColor: 'rgba(255,240,245,0.9)', px: 4, py: 1.5, borderRadius: 3, border: '2px solid #E91E8C' }}>
                  Coming Soon
                </Typography>
              </Box>
            )}
            <Container maxWidth="lg" sx={category.comingSoon ? { opacity: 0.45 } : undefined}>
              <ScrollReveal direction="up">
                <Typography variant="h4" sx={{ fontFamily: ff, fontWeight: 700, color: 'var(--text-main)', mb: 1, textAlign: 'center', fontSize: { xs: '1.4rem', sm: '1.8rem', md: '2.1rem' }, px: 1 }}>
                  {category.title}
                </Typography>
              </ScrollReveal>
              <ScrollReveal direction="up" delay={0.1}>
                <Typography sx={{ textAlign: 'center', color: 'var(--text-muted)', mb: 5, maxWidth: 550, mx: 'auto', lineHeight: 1.6 }}>
                  {category.description}
                </Typography>
              </ScrollReveal>

              <Grid container spacing={3}>
                {category.services.map((service, sIdx) => {
                  const discounted = hasServiceDiscount(service.id, discounts);
                  const price = getServiceEffectivePrice(service, discounts);
                  return (
                    <Grid item xs={12} sm={6} md={4} key={service.id}>
                      <ScrollReveal direction="up" delay={sIdx * 0.1}>
                        <Card
                          elevation={0}
                          onClick={() => !category.comingSoon && navigate(`/services/${service.id}`)}
                          sx={{
                            borderRadius: 3,
                            border: '1px solid #F0C0D0',
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            overflow: 'hidden',
                            transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                            cursor: category.comingSoon ? 'default' : 'pointer',
                            '&:hover': category.comingSoon ? {} : {
                              transform: 'translateY(-6px)',
                              boxShadow: '0 12px 32px rgba(233,30,140,0.15)',
                            },
                          }}
                        >
                          <Box sx={{ position: 'relative' }}>
                            <Box
                              component="img"
                              src={service.image}
                              alt={service.name}
                              sx={{ width: '100%', height: 180, objectFit: 'cover' }}
                            />
                            {discounted && (
                              <Chip
                                label={getServiceDiscountLabel(service.id, discounts)}
                                size="small"
                                sx={{ position: 'absolute', top: 8, left: 8, backgroundColor: '#2e7d32', color: '#fff', fontSize: '0.7rem', fontWeight: 700, height: 22 }}
                              />
                            )}
                            {!category.comingSoon && (
                              <Box sx={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(233,30,140,0)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.25s', '&:hover': { backgroundColor: 'rgba(233,30,140,0.18)' }, '&:hover .click-hint': { opacity: 1 } }}>
                                <Typography className="click-hint" sx={{ opacity: 0, transition: 'opacity 0.2s', backgroundColor: 'rgba(255,255,255,0.92)', px: 2, py: 0.8, borderRadius: '20px', fontSize: '0.78rem', fontWeight: 700, color: '#E91E8C', boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }}>
                                  View &amp; Book
                                </Typography>
                              </Box>
                            )}
                          </Box>
                          <CardContent sx={{ flex: 1, p: 3, display: 'flex', flexDirection: 'column' }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                              <Typography variant="h6" sx={{ fontFamily: ff, fontWeight: 700, color: 'var(--text-main)', fontSize: '1rem', flex: 1 }}>
                                {service.name}
                              </Typography>
                              {discounted ? (
                                <Box sx={{ textAlign: 'right', ml: 2 }}>
                                  <Typography sx={{ fontFamily: ff, fontWeight: 700, color: '#2e7d32', fontSize: '1rem', whiteSpace: 'nowrap' }}>{formatNaira(price)}</Typography>
                                  <Typography sx={{ fontFamily: ff, color: '#999', fontSize: '0.78rem', textDecoration: 'line-through', whiteSpace: 'nowrap' }}>{formatNaira(service.price)}</Typography>
                                </Box>
                              ) : (
                                <Typography sx={{ fontFamily: ff, fontWeight: 700, color: '#E91E8C', fontSize: '1rem', whiteSpace: 'nowrap', ml: 2 }}>{formatNaira(service.price)}</Typography>
                              )}
                            </Box>
                            <Typography sx={{ color: 'var(--text-muted)', fontSize: '0.9rem', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                              {service.description}
                            </Typography>
                          </CardContent>
                        </Card>
                      </ScrollReveal>
                    </Grid>
                  );
                })}
              </Grid>
            </Container>
          </Box>
        </Box>
      ))}

    </Box>
  );
}
