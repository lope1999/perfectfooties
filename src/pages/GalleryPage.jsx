import { useState, useEffect } from 'react';
import { Box, Typography, Container, CircularProgress } from '@mui/material';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import ScrollReveal from '../components/ScrollReveal';
import ScrollToTopFab from '../components/ScrollToTopFab';
import { fetchGalleryImages } from '../lib/galleryService';

const fontFamily = '"Georgia", serif';

function GalleryCarousel({ images }) {
  if (images.length === 0) {
    return (
      <Box sx={{ py: 6, textAlign: 'center' }}>
        <Typography sx={{ fontFamily, color: '#999', fontSize: '0.95rem' }}>
          No images yet — check back soon!
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        maxWidth: 720,
        mx: 'auto',
        '& .swiper-pagination-bullet': {
          backgroundColor: '#e3242b',
          opacity: 0.4,
          width: 10,
          height: 10,
        },
        '& .swiper-pagination-bullet-active': {
          opacity: 1,
        },
      }}
    >
      <Swiper
        modules={[Autoplay, Pagination]}
        autoplay={{ delay: 3500, disableOnInteraction: false, pauseOnMouseEnter: true }}
        pagination={{ clickable: true }}
        loop={images.length > 1}
        speed={800}
        slidesPerView={1}
        spaceBetween={0}
      >
        {images.map((img) => (
          <SwiperSlide key={img.id}>
            <Box sx={{ position: 'relative' }}>
              <Box
                component="img"
                src={img.imageUrl}
                alt={img.caption || 'Gallery image'}
                sx={{
                  width: '100%',
                  height: { xs: 360, sm: 460, md: 540 },
                  objectFit: 'cover',
                  borderRadius: 3,
                  display: 'block',
                }}
              />
              {img.caption && (
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    borderRadius: '0 0 12px 12px',
                    background: 'linear-gradient(transparent, rgba(0,0,0,0.55))',
                    py: 2,
                    px: 3,
                  }}
                >
                  <Typography
                    sx={{
                      fontFamily,
                      color: '#fff',
                      fontSize: { xs: '0.85rem', sm: '0.95rem' },
                      fontWeight: 600,
                    }}
                  >
                    {img.caption}
                  </Typography>
                </Box>
              )}
            </Box>
          </SwiperSlide>
        ))}
      </Swiper>
    </Box>
  );
}

export default function GalleryPage() {
  const [footwearImages, setFootwearImages] = useState([]);
  const [bagsImages, setBagsImages] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetchGalleryImages('footwear'),
      fetchGalleryImages('bags'),
    ])
      .then(([footwear, bags]) => {
        setFootwearImages(footwear);
        setBagsImages(bags);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress sx={{ color: '#e3242b' }} />
      </Box>
    );
  }

  return (
    <Box>
      {/* Hero header */}
      <Box
        sx={{
          py: { xs: 8, md: 10 },
          textAlign: 'center',
          background: 'linear-gradient(135deg, #FFF8F0 0%, #FFE8E8 100%)',
        }}
      >
        <ScrollReveal direction="up" duration={0.8}>
          <Typography
            variant="h3"
            sx={{
              fontFamily,
              fontWeight: 700,
              color: 'var(--text-purple)',
              fontSize: { xs: '1.8rem', sm: '2.4rem', md: '3rem' },
              mb: 1,
            }}
          >
            Our Gallery
          </Typography>
          <Typography
            sx={{
              fontFamily,
              color: 'var(--text-muted)',
              fontSize: { xs: '0.9rem', sm: '1.05rem' },
              maxWidth: 520,
              mx: 'auto',
            }}
          >
            A showcase of PerfectFooties craftsmanship — handmade footwear, leather bags, belts, and accessories.
          </Typography>
        </ScrollReveal>
      </Box>

      {/* Footwear section */}
      <Box sx={{ py: { xs: 6, md: 8 }, backgroundColor: '#fff' }}>
        <Container maxWidth="md">
          <ScrollReveal direction="up">
            <Typography
              variant="h4"
              sx={{
                fontFamily,
                fontWeight: 700,
                textAlign: 'center',
                color: 'var(--text-purple)',
                mb: 4,
                fontSize: { xs: '1.4rem', sm: '1.8rem' },
              }}
            >
              Footwear
            </Typography>
          </ScrollReveal>
          <ScrollReveal direction="up" delay={0.15}>
            <GalleryCarousel images={footwearImages} />
          </ScrollReveal>
        </Container>
      </Box>

      {/* Bags & Accessories section */}
      <Box sx={{ py: { xs: 6, md: 8 }, backgroundColor: '#FFF8F0' }}>
        <Container maxWidth="md">
          <ScrollReveal direction="up">
            <Typography
              variant="h4"
              sx={{
                fontFamily,
                fontWeight: 700,
                textAlign: 'center',
                color: 'var(--text-purple)',
                mb: 4,
                fontSize: { xs: '1.4rem', sm: '1.8rem' },
              }}
            >
              Bags & Accessories
            </Typography>
          </ScrollReveal>
          <ScrollReveal direction="up" delay={0.15}>
            <GalleryCarousel images={bagsImages} />
          </ScrollReveal>
        </Container>
      </Box>
      <ScrollToTopFab />
    </Box>
  );
}
