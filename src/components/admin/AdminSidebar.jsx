import {
  Box,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Drawer,
  IconButton,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import EventNoteIcon from '@mui/icons-material/EventNote';
import StorefrontIcon from '@mui/icons-material/Storefront';
import InventoryIcon from '@mui/icons-material/Inventory';
import CloseIcon from '@mui/icons-material/Close';

const SIDEBAR_WIDTH = 250;

const sections = [
  { key: 'dashboard', label: 'Dashboard', icon: <DashboardIcon /> },
  { key: 'orders', label: 'Orders', icon: <ShoppingCartIcon /> },
  { key: 'appointments', label: 'Appointments', icon: <EventNoteIcon /> },
  { key: 'pressons', label: 'Press-On Products', icon: <StorefrontIcon /> },
  { key: 'retail', label: 'Retail Products', icon: <InventoryIcon /> },
];

export default function AdminSidebar({ active, onSelect, mobileOpen, onMobileClose }) {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const content = (
		<Box
			sx={{
				width: SIDEBAR_WIDTH,
				height: "100%",
				backgroundColor: "#E61793",
				color: "#fff",
				display: "flex",
				flexDirection: "column",
				pt: isMobile ? 0 : "72px",
			}}
		>
			<Box
				sx={{
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
					px: 2,
					py: 2.5,
				}}
			>
				<Typography
					variant="h6"
					sx={{
						fontFamily: '"Georgia", serif',
						fontWeight: 700,
						fontSize: "1.1rem",
					}}
				>
					Admin Panel
				</Typography>
				{isMobile && (
					<IconButton onClick={onMobileClose} sx={{ color: "#fff" }}>
						<CloseIcon />
					</IconButton>
				)}
			</Box>
			<List sx={{ flex: 1 }}>
				{sections.map((s) => (
					<ListItemButton
						key={s.key}
						selected={active === s.key}
						onClick={() => {
							onSelect(s.key);
							if (isMobile) onMobileClose();
						}}
						sx={{
							py: 1.5,
							px: 2.5,
							"&.Mui-selected": {
								backgroundColor: "rgba(255,255,255,0.15)",
							},
							"&:hover": { backgroundColor: "rgba(255,255,255,0.1)" },
						}}
					>
						<ListItemIcon sx={{ color: "#fff", minWidth: 40 }}>
							{s.icon}
						</ListItemIcon>
						<ListItemText
							primary={s.label}
							primaryTypographyProps={{
								fontFamily: '"Georgia", serif',
								fontSize: "0.9rem",
								fontWeight: active === s.key ? 700 : 400,
							}}
						/>
					</ListItemButton>
				))}
			</List>
		</Box>
  );

  if (isMobile) {
    return (
      <Drawer
        open={mobileOpen}
        onClose={onMobileClose}
        PaperProps={{ sx: { width: SIDEBAR_WIDTH, backgroundColor: '#4A0E4E' } }}
      >
        {content}
      </Drawer>
    );
  }

  return (
    <Box sx={{ width: SIDEBAR_WIDTH, flexShrink: 0, position: 'fixed', top: 0, left: 0, height: '100vh', zIndex: 1100 }}>
      {content}
    </Box>
  );
}

export { SIDEBAR_WIDTH };
