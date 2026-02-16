import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  useScrollTrigger,
  Drawer,
  List,
  ListItemButton,
  ListItemText,
  Divider,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import InstagramIcon from '@mui/icons-material/Instagram';
import YouTubeIcon from '@mui/icons-material/YouTube';
import MusicNoteIcon from '@mui/icons-material/MusicNote';

const navButtonSx = {
  color: '#000',
  border: '1px solid #E91E8C',
  borderRadius: '25px',
  px: 2.5,
  py: 0.8,
  fontSize: '0.85rem',
  fontFamily: '"Georgia", serif',
  backgroundColor: 'transparent',
  transition: 'all 0.3s ease',
  whiteSpace: 'nowrap',
  '&:hover': {
    backgroundColor: '#E91E8C',
    color: '#fff',
  },
};

const navItems = [
  { label: 'Service Menu', path: '/services' },
  { label: 'Products Menu', path: '/products' },
  { label: 'Contact Us', path: 'contact' },
  { label: 'Testimonials', path: '/testimonials' },
  { label: 'Our Story', path: '/our-story' },
];

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [hovered, setHovered] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const trigger = useScrollTrigger({
    disableHysteresis: true,
    threshold: 50,
  });

  const handleContactClick = () => {
    setDrawerOpen(false);
    if (location.pathname !== '/') {
      navigate('/');
      setTimeout(() => {
        document.getElementById('contact-section')?.scrollIntoView({ behavior: 'smooth' });
      }, 300);
    } else {
      document.getElementById('contact-section')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleNavClick = (item) => {
    if (item.path === 'contact') {
      handleContactClick();
    } else {
      setDrawerOpen(false);
      navigate(item.path);
    }
  };

  return (
    <>
      <AppBar
        position="fixed"
        elevation={trigger ? 2 : 0}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        sx={{
          backgroundColor: hovered || trigger ? '#FFC0CB' : 'transparent',
          transition: 'background-color 0.4s ease',
          zIndex: 1200,
        }}
      >
        <Toolbar sx={{ justifyContent: 'space-between', py: 1 }}>
          {/* Left — Logo + Name */}
          <Box
            sx={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: 1 }}
            onClick={() => navigate('/')}
          >
            <AddIcon sx={{ color: '#E91E8C', fontSize: { xs: 28, md: 32 } }} />
            <Typography
              variant="h6"
              sx={{
                fontFamily: '"Georgia", serif',
                fontWeight: 700,
                color: '#000',
                letterSpacing: 1,
                fontSize: { xs: '1rem', md: '1.25rem' },
              }}
            >
              Chizzystyles
            </Typography>
          </Box>

          {/* Center — Nav Buttons (desktop only) */}
          <Box
            sx={{
              display: { xs: 'none', lg: 'flex' },
              gap: 1.5,
              alignItems: 'center',
            }}
          >
            {navItems.map((item) => (
              <Button
                key={item.label}
                sx={navButtonSx}
                onClick={() => handleNavClick(item)}
              >
                {item.label}
              </Button>
            ))}
          </Box>

          {/* Right — Social Icons (desktop) + Hamburger (mobile) */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 0.5 }}>
              <IconButton
                href="https://instagram.com"
                target="_blank"
                sx={{ color: '#E91E8C', '&:hover': { color: '#4A0E4E' } }}
              >
                <InstagramIcon />
              </IconButton>
              <IconButton
                href="https://tiktok.com"
                target="_blank"
                sx={{ color: '#E91E8C', '&:hover': { color: '#4A0E4E' } }}
              >
                <MusicNoteIcon />
              </IconButton>
              <IconButton
                href="https://youtube.com"
                target="_blank"
                sx={{ color: '#E91E8C', '&:hover': { color: '#4A0E4E' } }}
              >
                <YouTubeIcon />
              </IconButton>
            </Box>

            {/* Hamburger for tablet/mobile */}
            <IconButton
              onClick={() => setDrawerOpen(true)}
              sx={{
                display: { xs: 'flex', lg: 'none' },
                color: '#E91E8C',
              }}
            >
              <MenuIcon sx={{ fontSize: 28 }} />
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Mobile Drawer */}
      <Drawer
        anchor="right"
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        PaperProps={{
          sx: {
            width: 280,
            backgroundColor: '#FFF0F5',
            pt: 2,
          },
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', px: 2, mb: 1 }}>
          <Typography
            sx={{
              fontFamily: '"Georgia", serif',
              fontWeight: 700,
              color: '#000',
              fontSize: '1.1rem',
            }}
          >
            Menu
          </Typography>
          <IconButton onClick={() => setDrawerOpen(false)} sx={{ color: '#E91E8C' }}>
            <CloseIcon />
          </IconButton>
        </Box>
        <Divider sx={{ borderColor: '#F0C0D0' }} />
        <List>
          {navItems.map((item) => (
            <ListItemButton
              key={item.label}
              onClick={() => handleNavClick(item)}
              sx={{
                py: 1.5,
                '&:hover': { backgroundColor: '#FCE4EC' },
              }}
            >
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{
                  fontFamily: '"Georgia", serif',
                  fontWeight: 600,
                  color: '#000',
                }}
              />
            </ListItemButton>
          ))}
        </List>
        <Divider sx={{ borderColor: '#F0C0D0', my: 1 }} />
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, py: 2 }}>
          <IconButton href="https://instagram.com" target="_blank" sx={{ color: '#E91E8C' }}>
            <InstagramIcon />
          </IconButton>
          <IconButton href="https://tiktok.com" target="_blank" sx={{ color: '#E91E8C' }}>
            <MusicNoteIcon />
          </IconButton>
          <IconButton href="https://youtube.com" target="_blank" sx={{ color: '#E91E8C' }}>
            <YouTubeIcon />
          </IconButton>
        </Box>
      </Drawer>
    </>
  );
}
