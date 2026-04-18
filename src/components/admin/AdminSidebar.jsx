import {
  Box,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Drawer,
  IconButton,
  Tooltip,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import StorefrontIcon from '@mui/icons-material/Storefront';
import InventoryIcon from '@mui/icons-material/Inventory';
import CardGiftcardIcon from '@mui/icons-material/CardGiftcard';
import ArticleIcon from '@mui/icons-material/Article';
import PhotoLibraryIcon from '@mui/icons-material/PhotoLibrary';
import PeopleIcon from '@mui/icons-material/People';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import CloseIcon from '@mui/icons-material/Close';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import CollectionsIcon from '@mui/icons-material/CollectionsBookmark';
import CampaignIcon from '@mui/icons-material/Campaign';
import PrecisionManufacturingIcon from '@mui/icons-material/PrecisionManufacturing';

const SIDEBAR_WIDTH = 250;
const SIDEBAR_COLLAPSED_WIDTH = 68;

const sections = [
  { key: 'dashboard',        label: 'Dashboard',            icon: <DashboardIcon /> },
  { key: 'orders',           label: 'Orders',                icon: <ShoppingCartIcon /> },
  { key: 'production',       label: 'Production Queue',      icon: <PrecisionManufacturingIcon /> },
  { key: 'customers',        label: 'Customers',             icon: <PeopleIcon /> },
  { key: 'collections',      label: 'Collections',            icon: <CollectionsIcon /> },
  { key: 'loyalty',          label: 'Loyalty & Referrals',   icon: <EmojiEventsIcon /> },
  { key: 'blog',             label: 'Blog Posts',            icon: <ArticleIcon /> },
  { key: 'giftcards',        label: 'Gift Cards',            icon: <CardGiftcardIcon /> },
  { key: 'gallery',          label: 'Gallery',               icon: <PhotoLibraryIcon /> },
  { key: 'announcements',    label: 'Announcements',         icon: <CampaignIcon /> },
];

export default function AdminSidebar({ active, onSelect, mobileOpen, onMobileClose, collapsed, onToggleCollapse }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const currentWidth = collapsed && !isMobile ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH;

  const content = (
    <Box
      sx={{
        width: currentWidth,
        height: '100%',
        backgroundColor: '#007a7a',
        color: '#fff',
        display: 'flex',
        flexDirection: 'column',
        pt: isMobile ? 0 : '72px',
        transition: 'width 0.2s ease',
        overflowX: 'hidden',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed && !isMobile ? 'center' : 'space-between',
          px: collapsed && !isMobile ? 1 : 2,
          py: 2.5,
        }}
      >
        {!(collapsed && !isMobile) && (
          <Typography
            variant="h6"
            sx={{
              fontFamily: '"Georgia", serif',
              fontWeight: 700,
              fontSize: '1.1rem',
              whiteSpace: 'nowrap',
            }}
          >
            Admin Panel
          </Typography>
        )}
        {isMobile && (
          <IconButton onClick={onMobileClose} sx={{ color: '#fff' }}>
            <CloseIcon />
          </IconButton>
        )}
      </Box>
      <List sx={{ flex: 1, overflowY: 'auto' }}>
        {sections.map((s) => {
          const button = (
            <ListItemButton
              key={s.key}
              selected={active === s.key}
              onClick={() => {
                onSelect(s.key);
                if (isMobile) onMobileClose();
              }}
              sx={{
                py: 1.5,
                px: collapsed && !isMobile ? 0 : 2.5,
                justifyContent: collapsed && !isMobile ? 'center' : 'flex-start',
                '&.Mui-selected': { backgroundColor: 'rgba(255,255,255,0.15)' },
                '&:hover': { backgroundColor: 'rgba(255,255,255,0.1)' },
              }}
            >
              <ListItemIcon
                sx={{
                  color: '#fff',
                  minWidth: collapsed && !isMobile ? 0 : 40,
                  justifyContent: 'center',
                }}
              >
                {s.icon}
              </ListItemIcon>
              {!(collapsed && !isMobile) && (
                <ListItemText
                  primary={s.label}
                  primaryTypographyProps={{
                    fontFamily: '"Georgia", serif',
                    fontSize: '0.9rem',
                    fontWeight: active === s.key ? 700 : 400,
                    whiteSpace: 'nowrap',
                  }}
                />
              )}
            </ListItemButton>
          );

          return collapsed && !isMobile ? (
            <Tooltip key={s.key} title={s.label} placement="right" arrow>
              {button}
            </Tooltip>
          ) : (
            button
          );
        })}
      </List>
      {!isMobile && (
        <Box sx={{ p: 1, display: 'flex', justifyContent: 'center' }}>
          <IconButton onClick={onToggleCollapse} sx={{ color: '#fff' }}>
            {collapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
          </IconButton>
        </Box>
      )}
    </Box>
  );

  if (isMobile) {
    return (
      <Drawer
        open={mobileOpen}
        onClose={onMobileClose}
        PaperProps={{ sx: { width: SIDEBAR_WIDTH, backgroundColor: '#007a7a' } }}
      >
        {content}
      </Drawer>
    );
  }

  return (
    <Box sx={{ width: currentWidth, flexShrink: 0, position: 'fixed', top: 0, left: 0, height: '100vh', zIndex: 1100, transition: 'width 0.2s ease' }}>
      {content}
    </Box>
  );
}

export { SIDEBAR_WIDTH, SIDEBAR_COLLAPSED_WIDTH };
