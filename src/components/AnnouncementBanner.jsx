import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Typography, Button, IconButton, Container, GlobalStyles } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import { fetchActiveAnnouncements } from '../lib/announcementService';
import { fetchProductById } from '../lib/productService';

const SLIDE_DURATION = 6000; // ms per announcement

export default function AnnouncementBanner() {
  const [announcements, setAnnouncements] = useState([]);
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [colImages, setColImages] = useState({}); // { [announcementId]: string[] }
  const navigate = useNavigate();

  // Load announcements + collection images on mount
  useEffect(() => {
    fetchActiveAnnouncements()
      .then((all) => {
        const visible = all.filter(
          (a) => !localStorage.getItem(`dismissed-announcement-${a.id}`)
        );
        setAnnouncements(visible);

        visible.forEach((a) => {
          const match = (a.ctaLink || '').match(/^\/shop\/(.+)$/);
          if (match) {
            fetchProductById(match[1])
              .then((col) => {
                if (col?.images?.length) {
                  setColImages((prev) => ({ ...prev, [a.id]: col.images.filter(Boolean) }));
                }
              })
              .catch(() => {});
          }
        });
      })
      .catch(() => {});
  }, []);

  // Auto-advance — resets every time index or paused changes
  const advance = useCallback(() => {
    setIndex((i) => (i + 1) % announcements.length);
  }, [announcements.length]);

  useEffect(() => {
    if (announcements.length <= 1 || paused) return;
    const t = setTimeout(advance, SLIDE_DURATION);
    return () => clearTimeout(t);
  }, [index, announcements.length, paused, advance]);

  const handleDismiss = () => {
    const current = announcements[index];
    if (current) localStorage.setItem(`dismissed-announcement-${current.id}`, '1');
    const next = announcements.filter((_, i) => i !== index);
    setAnnouncements(next);
    setIndex((i) => Math.min(i, Math.max(0, next.length - 1)));
  };

  if (announcements.length === 0) return null;

  const current = announcements[index];
  const images = colImages[current.id] || [];
  const marqueeImages = images.length > 0 ? [...images, ...images, ...images, ...images] : [];
  const hasImages = images.length > 0;
  const multi = announcements.length > 1;

  const handleCta = () => {
    const link = current.ctaLink || '';
    if (link.startsWith('http')) window.open(link, '_blank', 'noopener');
    else navigate(link);
  };

  return (
    <>
      <GlobalStyles
        styles={{
          '@keyframes bannerMarquee': {
            '0%': { transform: 'translateX(0)' },
            '100%': { transform: 'translateX(-50%)' },
          },
          '@keyframes ctaPulse': {
            '0%, 100%': { boxShadow: '0 0 0 0 rgba(255,255,255,0.5)' },
            '50%': { boxShadow: '0 0 0 8px rgba(255,255,255,0)' },
          },
          '@keyframes bannerFadeIn': {
            from: { opacity: 0, transform: 'translateY(18px)' },
            to: { opacity: 1, transform: 'translateY(0)' },
          },
          '@keyframes slideContentIn': {
            from: { opacity: 0, transform: 'translateX(16px)' },
            to: { opacity: 1, transform: 'translateX(0)' },
          },
          '@keyframes progressFill': {
            from: { width: '0%' },
            to: { width: '100%' },
          },
        }}
      />

      <Box
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
        sx={{
          background: 'linear-gradient(135deg, #FF6BB5 0%, #e3242b 55%, #b81b21 100%)',
          color: '#fff',
          position: 'relative',
          overflow: 'hidden',
          animation: 'bannerFadeIn 0.5s ease forwards',
        }}
      >
        {/* Shimmer overlay */}
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.04) 50%, transparent 100%)',
            pointerEvents: 'none',
          }}
        />

        {/* Dismiss */}
        <IconButton
          size="small"
          onClick={handleDismiss}
          sx={{
            position: 'absolute',
            top: 10,
            right: 12,
            color: '#fff',
            opacity: 0.5,
            p: 0.5,
            zIndex: 3,
            '&:hover': { opacity: 1, backgroundColor: 'rgba(255,255,255,0.12)' },
          }}
          aria-label="Dismiss"
        >
          <CloseIcon sx={{ fontSize: 16 }} />
        </IconButton>

        {/* Slide content — key forces re-mount + animation on each advance */}
        <Box key={`slide-${current.id}`} sx={{ animation: 'slideContentIn 0.35s ease forwards' }}>

          {/* Main content row */}
          <Container maxWidth="lg">
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: { xs: 2, md: 4 },
                py: { xs: 3, md: 4 },
                pr: { xs: 5, md: 6 },
                flexWrap: { xs: 'wrap', md: 'nowrap' },
              }}
            >
              {/* Featured image */}
              {current.imageUrl && (
                <Box
                  component="img"
                  src={current.imageUrl}
                  alt=""
                  sx={{
                    height: { xs: 140, sm: 160, md: 180 },
                    width: { xs: '100%', sm: 220, md: 240 },
                    objectFit: 'cover',
                    borderRadius: 3,
                    flexShrink: 0,
                    order: { xs: -1, md: 1 },
                    boxShadow: '0 8px 28px rgba(0,0,0,0.45)',
                    border: '2px solid rgba(255,255,255,0.2)',
                    display: 'block',
                  }}
                />
              )}

              {/* Text */}
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mb: 0.6 }}>
                  <AutoAwesomeIcon sx={{ fontSize: 13, color: 'rgba(255,255,255,0.9)', opacity: 0.9 }} />
                  <Typography sx={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.9)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1.2, opacity: 0.9 }}>
                    Announcement{multi ? ` · ${index + 1} of ${announcements.length}` : ''}
                  </Typography>
                </Box>
                <Typography
                  sx={{
                    fontFamily: '"Georgia", serif',
                    fontWeight: 700,
                    fontSize: { xs: '1.05rem', sm: '1.2rem', md: '1.3rem' },
                    color: '#fff',
                    mb: 0.5,
                    lineHeight: 1.3,
                  }}
                >
                  {current.title}
                </Typography>
                {current.message && (
                  <Typography
                    sx={{
                      fontSize: { xs: '0.82rem', md: '0.88rem' },
                      color: 'rgba(255,255,255,0.8)',
                      lineHeight: 1.6,
                      fontFamily: '"Georgia", serif',
                    }}
                  >
                    {current.message}
                  </Typography>
                )}
              </Box>

              {/* CTA */}
              {current.ctaLabel && current.ctaLink && (
                <Button
                  onClick={handleCta}
                  sx={{
                    background: 'rgba(255,255,255,0.95)',
                    color: '#b81b21',
                    borderRadius: '24px',
                    px: { xs: 2.5, md: 3.5 },
                    py: { xs: 1, md: 1.3 },
                    fontSize: { xs: '0.82rem', md: '0.88rem' },
                    fontFamily: '"Georgia", serif',
                    fontWeight: 700,
                    textTransform: 'none',
                    whiteSpace: 'nowrap',
                    flexShrink: 0,
                    boxShadow: '0 2px 14px rgba(0,0,0,0.15)',
                    animation: paused ? 'none' : 'ctaPulse 2.6s ease-in-out infinite',
                    '&:hover': {
                      background: '#fff',
                      boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                      animation: 'none',
                    },
                  }}
                >
                  {current.ctaLabel} →
                </Button>
              )}
            </Box>
          </Container>

          {/* Image marquee — only shown when no custom image is uploaded for this announcement */}
          {hasImages && !current.imageUrl && (
            <Box
              sx={{
                overflow: 'hidden',
                pb: multi ? 1 : { xs: 2, md: 2.5 },
                cursor: 'pointer',
                '&:hover .marquee-track': { animationPlayState: 'paused' },
              }}
              onClick={handleCta}
            >
              <Box
                sx={{
                  position: 'relative',
                  '&::before, &::after': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    bottom: 0,
                    width: { xs: 40, md: 80 },
                    zIndex: 2,
                    pointerEvents: 'none',
                  },
                  '&::before': { left: 0, background: 'linear-gradient(to right, #FF6BB5, transparent)' },
                  '&::after': { right: 0, background: 'linear-gradient(to left, #b81b21, transparent)' },
                }}
              >
                <Box
                  className="marquee-track"
                  sx={{
                    display: 'flex',
                    gap: 1.5,
                    width: 'max-content',
                    animation: `bannerMarquee ${Math.max(14, images.length * 4)}s linear infinite`,
                    animationPlayState: paused ? 'paused' : 'running',
                  }}
                >
                  {marqueeImages.map((src, i) => (
                    <Box
                      key={i}
                      component="img"
                      src={src}
                      alt=""
                      sx={{
                        height: { xs: 58, md: 68 },
                        width: { xs: 58, md: 68 },
                        objectFit: 'cover',
                        borderRadius: 2,
                        flexShrink: 0,
                        border: '1.5px solid rgba(255,255,255,0.2)',
                        boxShadow: '0 2px 10px rgba(0,0,0,0.35)',
                        transition: 'transform 0.2s ease',
                        '&:hover': { transform: 'scale(1.08)' },
                      }}
                    />
                  ))}
                </Box>
              </Box>
            </Box>
          )}
        </Box>

        {/* Navigation dots + progress bar (only when multiple announcements) */}
        {multi && (
          <Box sx={{ pb: 1.5, pt: hasImages ? 0.5 : 0 }}>
            {/* Dots */}
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 0.8, mb: 1 }}>
              {announcements.map((a, i) => (
                <Box
                  key={a.id}
                  onClick={() => setIndex(i)}
                  sx={{
                    width: i === index ? 20 : 7,
                    height: 7,
                    borderRadius: '4px',
                    backgroundColor: i === index ? '#e3242b' : 'rgba(255,255,255,0.3)',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease',
                    '&:hover': { backgroundColor: i === index ? '#e3242b' : 'rgba(255,255,255,0.6)' },
                  }}
                />
              ))}
            </Box>

            {/* Progress bar */}
            <Box sx={{ px: { xs: 2, md: 4 }, overflow: 'hidden' }}>
              <Box sx={{ height: 3, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 2, overflow: 'hidden' }}>
                <Box
                  key={`progress-${current.id}`}
                  sx={{
                    height: '100%',
                    backgroundColor: 'rgba(255,255,255,0.55)',
                    borderRadius: 2,
                    animation: `progressFill ${SLIDE_DURATION}ms linear forwards`,
                    animationPlayState: paused ? 'paused' : 'running',
                  }}
                />
              </Box>
            </Box>
          </Box>
        )}
      </Box>
    </>
  );
}
