import { useEffect, useState } from 'react';
import { Dialog, Box, IconButton, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';

export default function ImageLightbox({ open, onClose, images = [], initialIndex = 0 }) {
  const [idx, setIdx] = useState(initialIndex);

  useEffect(() => {
    if (open) setIdx(initialIndex);
  }, [open, initialIndex]);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (e.key === 'ArrowLeft') setIdx((i) => Math.max(0, i - 1));
      if (e.key === 'ArrowRight') setIdx((i) => Math.min(images.length - 1, i + 1));
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, images.length]);

  if (!images.length) return null;
  const multi = images.length > 1;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: 'transparent',
          boxShadow: 'none',
          overflow: 'visible',
        },
      }}
      slotProps={{ backdrop: { sx: { backgroundColor: 'rgba(0,0,0,0.92)' } } }}
    >
      {/* Close */}
      <IconButton
        onClick={onClose}
        sx={{
          position: 'fixed',
          top: 16,
          right: 16,
          color: '#fff',
          backgroundColor: 'rgba(255,255,255,0.1)',
          '&:hover': { backgroundColor: 'rgba(255,255,255,0.25)' },
          zIndex: 10,
        }}
      >
        <CloseIcon />
      </IconButton>

      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
        {/* Prev */}
        {multi && (
          <IconButton
            onClick={() => setIdx((i) => Math.max(0, i - 1))}
            disabled={idx === 0}
            sx={{ color: '#fff', flexShrink: 0, '&.Mui-disabled': { color: 'rgba(255,255,255,0.2)' } }}
          >
            <ArrowBackIosNewIcon />
          </IconButton>
        )}

        {/* Image */}
        <Box
          component="img"
          src={images[idx]}
          alt={`Preview ${idx + 1}`}
          sx={{
            maxWidth: '100%',
            maxHeight: '85vh',
            objectFit: 'contain',
            borderRadius: 2,
            display: 'block',
            userSelect: 'none',
          }}
        />

        {/* Next */}
        {multi && (
          <IconButton
            onClick={() => setIdx((i) => Math.min(images.length - 1, i + 1))}
            disabled={idx === images.length - 1}
            sx={{ color: '#fff', flexShrink: 0, '&.Mui-disabled': { color: 'rgba(255,255,255,0.2)' } }}
          >
            <ArrowForwardIosIcon />
          </IconButton>
        )}
      </Box>

      {/* Counter */}
      {multi && (
        <Typography
          sx={{ textAlign: 'center', color: 'rgba(255,255,255,0.6)', fontSize: '0.82rem', mt: 1.5 }}
        >
          {idx + 1} / {images.length}
        </Typography>
      )}
    </Dialog>
  );
}
