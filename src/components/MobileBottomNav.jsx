import { useNavigate, useLocation } from 'react-router-dom';
import { Box, Typography } from '@mui/material';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import ShoppingBagOutlinedIcon from '@mui/icons-material/ShoppingBagOutlined';
import PhotoLibraryOutlinedIcon from '@mui/icons-material/PhotoLibraryOutlined';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';

const NAV_ITEMS = [
  { label: 'Home',    icon: HomeOutlinedIcon,            path: '/'        },
  { label: 'Shop',    icon: ShoppingBagOutlinedIcon,     path: '/shop'    },
  { label: 'Gallery', icon: PhotoLibraryOutlinedIcon,    path: '/gallery' },
  { label: 'Account', icon: PersonOutlineIcon,           path: '/account' },
];

export default function MobileBottomNav() {
  const navigate = useNavigate();
  const location = useLocation();

  // Hide on admin page
  if (location.pathname === '/admin') return null;

  return (
    <Box
      sx={{
        display: { xs: 'flex', md: 'none' },
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1200,
        height: 64,
        backgroundColor: '#fff',
        borderTop: '1px solid #E8D5B0',
        boxShadow: '0 -4px 20px rgba(233,30,140,0.08)',
        alignItems: 'center',
        justifyContent: 'space-around',
        px: 1,
      }}
    >
      {NAV_ITEMS.map(({ label, icon: Icon, path }) => {
        const active = location.pathname === path || (path !== '/' && location.pathname.startsWith(path));
        return (
          <Box
            key={path}
            onClick={() => navigate(path)}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 0.3,
              cursor: 'pointer',
              flex: 1,
              py: 1,
              borderRadius: 2,
              transition: 'all 0.15s',
              '&:active': { backgroundColor: '#FFF8F0' },
            }}
          >
            <Icon sx={{ fontSize: 24, color: active ? '#e3242b' : '#999', transition: 'color 0.15s' }} />
            <Typography sx={{ fontSize: '0.65rem', fontWeight: active ? 700 : 400, color: active ? '#e3242b' : '#999', lineHeight: 1, transition: 'all 0.15s' }}>
              {label}
            </Typography>
            {active && (
              <Box sx={{ width: 4, height: 4, borderRadius: '50%', backgroundColor: '#e3242b', mt: 0.2 }} />
            )}
          </Box>
        );
      })}
    </Box>
  );
}
