import { useState, useEffect } from 'react';
import { Fab, Zoom, Tooltip } from '@mui/material';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';

export default function ScrollToTopFab({ threshold = 400 }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > threshold);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [threshold]);

  return (
    <Zoom in={visible}>
      <Tooltip title="Back to top" placement="left">
        <Fab
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          size="small"
          aria-label="scroll to top"
          sx={{
            position: 'fixed',
            bottom: { xs: 80, md: 24 },
            right: 16,
            backgroundColor: '#e3242b',
            color: '#fff',
            zIndex: 1300,
            boxShadow: '0 4px 16px rgba(233,30,140,0.4)',
            '&:hover': {
              backgroundColor: '#b81b21',
              boxShadow: '0 6px 20px rgba(233,30,140,0.55)',
            },
          }}
        >
          <KeyboardArrowUpIcon />
        </Fab>
      </Tooltip>
    </Zoom>
  );
}
