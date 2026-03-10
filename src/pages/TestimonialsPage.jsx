import { useState, useEffect } from 'react';
import { Box, Typography, Container, Grid, Avatar, Chip } from '@mui/material';
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import ScrollReveal from '../components/ScrollReveal';
import { testimonials as staticTestimonials } from '../data/testimonials';
import { fetchTestimonials } from '../lib/testimonialService';

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

function groupByName(items) {
  const map = {};
  items.forEach((t) => {
    const key = t.name;
    if (!map[key]) {
      map[key] = {
        id: t.id || t.name,
        name: t.name,
        occupation: t.occupation || 'Client',
        type: t.type,
        avatar: t.avatar || t.name?.charAt(0)?.toUpperCase() || '?',
        reviews: [],
      };
    }
    map[key].reviews.push({
      service: t.service,
      rating: t.rating,
      review: t.review || t.testimonial,
    });
  });
  return Object.values(map);
}

const swiperDotStyles = {
  '& .swiper-pagination': { position: 'static', mt: 1 },
  '& .swiper-pagination-bullet': {
    backgroundColor: '#E91E8C',
    opacity: 0.4,
    width: 7,
    height: 7,
  },
  '& .swiper-pagination-bullet-active': { opacity: 1 },
};

export default function TestimonialsPage() {
  const [groups, setGroups] = useState(groupByName(staticTestimonials));

  useEffect(() => {
    fetchTestimonials()
      .then((firestoreItems) => {
        const mapped = firestoreItems.map((t) => ({
          id: t.id,
          name: t.name,
          occupation: t.occupation || 'Client',
          service: t.service,
          type: t.type,
          rating: t.rating,
          review: t.testimonial || t.review,
          avatar: t.avatar || t.name?.charAt(0)?.toUpperCase() || '?',
        }));
        setGroups(groupByName([...staticTestimonials, ...mapped]));
      })
      .catch(() => {});
  }, []);

  const featured = groups[0];
  const rest = groups.slice(1);

  return (
    <Box sx={{ pt: 12, pb: 8, minHeight: '100vh', backgroundColor: '#FAFAFA' }}>
      {/* Header */}
      <Box sx={{ textAlign: 'center', py: 6 }}>
        <ScrollReveal direction="up">
          <Typography
            variant="h3"
            sx={{ fontFamily: '"Georgia", serif', fontWeight: 700, color: '#000', mb: 1 }}
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
            Real reviews from real clients — hear what they have to say about their nail
            appointments and press-on purchases from Chizzys Nails.
          </Typography>
        </ScrollReveal>
      </Box>

      <Container maxWidth="lg">
        {/* Featured Testimonial */}
        {featured && (
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
              {/* Left panel */}
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
                  {featured.avatar}
                </Avatar>
                <Typography
                  sx={{ fontFamily: '"Georgia", serif', fontWeight: 700, fontSize: '1.3rem', color: '#000' }}
                >
                  {featured.name}
                </Typography>
                <Typography sx={{ color: '#888', fontSize: '0.9rem', mb: 1 }}>
                  {featured.occupation}
                </Typography>
                <Chip
                  label={featured.type === 'appointment' ? 'Appointment' : 'Purchase'}
                  size="small"
                  sx={{
                    backgroundColor: featured.type === 'appointment' ? '#4A0E4E' : '#E91E8C',
                    color: '#fff',
                    fontWeight: 600,
                    fontFamily: '"Georgia", serif',
                    mb: 2,
                  }}
                />
                {featured.reviews.length === 1 && <StarRating rating={featured.reviews[0].rating} />}
              </Box>

              {/* Right panel */}
              <Box sx={{ flex: 1, width: '100%', ...swiperDotStyles }}>
                {featured.reviews.length === 1 ? (
                  <Box sx={{ p: { xs: 3, md: 5 } }}>
                    <Typography
                      sx={{ fontFamily: '"Georgia", serif', fontWeight: 700, color: '#4A0E4E', fontSize: '1rem', mb: 2 }}
                    >
                      {featured.reviews[0].service}
                    </Typography>
                    <Typography sx={{ color: '#444', fontSize: '1.1rem', lineHeight: 1.9, fontStyle: 'italic' }}>
                      "{featured.reviews[0].review}"
                    </Typography>
                  </Box>
                ) : (
                  <Swiper
                    modules={[Autoplay, Pagination]}
                    autoplay={{ delay: 4000, disableOnInteraction: false, pauseOnMouseEnter: true }}
                    pagination={{ clickable: true }}
                    loop
                    speed={700}
                    slidesPerView={1}
                  >
                    {featured.reviews.map((rev, i) => (
                      <SwiperSlide key={i}>
                        <Box sx={{ p: { xs: 3, md: 5 } }}>
                          <Typography
                            sx={{ fontFamily: '"Georgia", serif', fontWeight: 700, color: '#4A0E4E', fontSize: '1rem', mb: 2 }}
                          >
                            {rev.service}
                          </Typography>
                          <Typography sx={{ color: '#444', fontSize: '1.1rem', lineHeight: 1.9, fontStyle: 'italic' }}>
                            "{rev.review}"
                          </Typography>
                          <Box sx={{ mt: 2 }}>
                            <StarRating rating={rev.rating} />
                          </Box>
                        </Box>
                      </SwiperSlide>
                    ))}
                  </Swiper>
                )}
              </Box>
            </Box>
          </ScrollReveal>
        )}

        {/* Grid of testimonials */}
        <Grid container spacing={3}>
          {rest.map((group, index) => (
            <Grid item xs={12} sm={6} md={4} key={group.id}>
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
                  {/* Card header */}
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
                      {group.avatar}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Typography
                        sx={{ fontFamily: '"Georgia", serif', fontWeight: 700, fontSize: '1rem', color: '#000' }}
                      >
                        {group.name}
                      </Typography>
                      <Typography sx={{ color: '#888', fontSize: '0.8rem' }}>
                        {group.occupation}
                      </Typography>
                    </Box>
                    <Chip
                      label={group.type === 'appointment' ? 'Appt' : 'Order'}
                      size="small"
                      sx={{
                        backgroundColor: group.type === 'appointment' ? '#4A0E4E' : '#E91E8C',
                        color: '#fff',
                        fontWeight: 600,
                        fontSize: '0.7rem',
                        fontFamily: '"Georgia", serif',
                        height: 24,
                      }}
                    />
                  </Box>

                  {/* Card body */}
                  {group.reviews.length === 1 ? (
                    <Box sx={{ px: 3, py: 2.5, flex: 1, display: 'flex', flexDirection: 'column' }}>
                      <Typography
                        sx={{ fontFamily: '"Georgia", serif', fontWeight: 700, color: '#4A0E4E', fontSize: '0.85rem', mb: 1.5 }}
                      >
                        {group.reviews[0].service}
                      </Typography>
                      <Typography
                        sx={{ color: '#555', fontSize: '0.9rem', lineHeight: 1.7, fontStyle: 'italic', flex: 1, mb: 2 }}
                      >
                        "{group.reviews[0].review}"
                      </Typography>
                      <StarRating rating={group.reviews[0].rating} />
                    </Box>
                  ) : (
                    <Box sx={{ flex: 1, ...swiperDotStyles }}>
                      <Swiper
                        modules={[Autoplay, Pagination]}
                        autoplay={{ delay: 4000, disableOnInteraction: false, pauseOnMouseEnter: true }}
                        pagination={{ clickable: true }}
                        loop
                        speed={700}
                        slidesPerView={1}
                      >
                        {group.reviews.map((rev, i) => (
                          <SwiperSlide key={i}>
                            <Box sx={{ px: 3, py: 2.5 }}>
                              <Typography
                                sx={{ fontFamily: '"Georgia", serif', fontWeight: 700, color: '#4A0E4E', fontSize: '0.85rem', mb: 1.5 }}
                              >
                                {rev.service}
                              </Typography>
                              <Typography
                                sx={{ color: '#555', fontSize: '0.9rem', lineHeight: 1.7, fontStyle: 'italic', mb: 2 }}
                              >
                                "{rev.review}"
                              </Typography>
                              <StarRating rating={rev.rating} />
                            </Box>
                          </SwiperSlide>
                        ))}
                      </Swiper>
                    </Box>
                  )}
                </Box>
              </ScrollReveal>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}
