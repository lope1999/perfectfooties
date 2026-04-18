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
  Tooltip,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import CloseIcon from '@mui/icons-material/Close';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import CartIcon from "./CartIcon";
import WishlistIcon from "./WishlistIcon";
import NotificationBell from "./NotificationBell";
import UserMenu from "./UserMenu";
import { useAuth } from "../context/AuthContext";
import { useThemeMode } from "../context/ThemeContext";

const navButtonSx = {
  color: 'var(--text-main)',
  border: '1px solid #e3242b',
  borderRadius: '25px',
  px: 2.5,
  py: 0.8,
  fontSize: '0.85rem',
  fontFamily: '"Georgia", serif',
  backgroundColor: 'transparent',
  transition: 'all 0.3s ease',
  whiteSpace: 'nowrap',
  '&:hover': {
    backgroundColor: '#e3242b',
    color: '#fff',
  },
};

const navItems = [
  { label: "Shop", path: "/shop" },
  { label: "Our Story", path: "/our-story" },
  { label: "Gallery", path: "/gallery" },
  { label: "Testimonials", path: "/testimonials" },
  { label: "Contact Us", path: "contact" },
];

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, signInWithGoogle, signOut, isAdmin } = useAuth();
  const { mode, toggleMode } = useThemeMode();
  const [hovered, setHovered] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const isDark = mode === 'dark';

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
					backgroundColor:
						hovered || trigger
							? isDark
								? "#1a0505"
								: "#FFF8F0"
							: "transparent",
					transition: "background-color 0.4s ease",
					zIndex: 1200,
				}}
			>
				<Toolbar sx={{ justifyContent: "space-between", py: 1 }}>
					{/* Left — Logo + Name */}
					<Box
						sx={{
							display: "flex",
							alignItems: "center",
							cursor: "pointer",
							gap: 1,
						}}
						onClick={() => navigate("/")}
					>
						<Box
							component="img"
							src="/images/logo.png"
							alt="PerfectFooties"
							sx={{
								height: { xs: 38, md: 46 },
								width: "auto",
								objectFit: "contain",
								display: "block",
							}}
						/>
						<Typography
							sx={{
								display: { xs: "none", md: "block" },
								fontFamily: '"Dancing Script", "Pacifico", cursive',
								fontSize: { md: "1.3rem", lg: "1.5rem" },
								fontWeight: 700,
								color: "#e3242b",
								lineHeight: 1,
								letterSpacing: "0.02em",
								userSelect: "none",
							}}
						>
							PerfectFooties
						</Typography>
					</Box>

					{/* Center — Nav Buttons (desktop only) */}
					<Box
						sx={{
							display: { xs: "none", lg: "flex" },
							gap: 1.5,
							alignItems: "center",
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
						{isAdmin && (
							<Button
								sx={{
									...navButtonSx,
									borderColor: "#007a7a",
									color: "var(--text-purple)",
									"&:hover": {
										backgroundColor: "#007a7a",
										color: "#fff",
									},
								}}
								startIcon={<AdminPanelSettingsIcon />}
								onClick={() => navigate("/admin")}
							>
								Admin
							</Button>
						)}
					</Box>

					{/* Right — Cart + User + Social Icons (desktop) + Hamburger (mobile) */}
					<Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
						<Tooltip
							title={
								isDark ? "Switch to light mode" : "Switch to dark mode"
							}
						>
							<IconButton
								onClick={toggleMode}
								sx={{ color: "var(--accent-cyan)" }}
							>
								{isDark ? (
									<Brightness7Icon sx={{ fontSize: 22 }} />
								) : (
									<Brightness4Icon sx={{ fontSize: 22 }} />
								)}
							</IconButton>
						</Tooltip>
						<UserMenu />
						<WishlistIcon />
						<CartIcon />
						<NotificationBell />

						{/* Hamburger for tablet/mobile */}
						<IconButton
							onClick={() => setDrawerOpen(true)}
							sx={{
								display: { xs: "flex", lg: "none" },
								color: "#e3242b",
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
						backgroundColor: isDark ? "#120404" : "#FFF8F0",
						pt: 2,
					},
				}}
			>
				<Box
					sx={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
						px: 2,
						mb: 1,
					}}
				>
					<Typography
						sx={{
							fontFamily: '"Georgia", serif',
							fontWeight: 700,
							color: "var(--text-main)",
							fontSize: "1.1rem",
						}}
					>
						Menu
					</Typography>
					<IconButton
						onClick={() => setDrawerOpen(false)}
						sx={{ color: "#e3242b" }}
					>
						<CloseIcon />
					</IconButton>
				</Box>
				<Divider sx={{ borderColor: "#E8D5B0" }} />
				{/* Account Section — shown first */}
				<Box sx={{ px: 2, py: 1.5 }}>
					{user ? (
						<>
							<Box
								sx={{
									display: "flex",
									alignItems: "center",
									gap: 1.5,
									mb: 1.5,
								}}
							>
								<Box
									component="img"
									src={user.photoURL}
									alt={user.displayName}
									sx={{
										width: 36,
										height: 36,
										borderRadius: "50%",
										border: "2px solid #e3242b",
									}}
								/>
								<Box>
									<Typography
										sx={{
											fontFamily: '"Georgia", serif',
											fontWeight: 700,
											fontSize: "0.9rem",
											color: "var(--text-main)",
										}}
									>
										{user.displayName}
									</Typography>
									<Typography
										sx={{ fontSize: "0.75rem", color: "#777" }}
									>
										{user.email}
									</Typography>
								</Box>
							</Box>
							<ListItemButton
								onClick={() => {
									setDrawerOpen(false);
									navigate("/account");
								}}
								sx={{
									py: 1,
									borderRadius: 1,
									"&:hover": { backgroundColor: "#FFE8E8" },
								}}
							>
								<ListItemText
									primary="View Account"
									primaryTypographyProps={{
										fontFamily: '"Georgia", serif',
										fontWeight: 600,
										color: "#e3242b",
										fontSize: "0.9rem",
									}}
								/>
							</ListItemButton>
							<ListItemButton
								onClick={() => {
									setDrawerOpen(false);
									signOut();
								}}
								sx={{
									py: 1,
									borderRadius: 1,
									"&:hover": { backgroundColor: "#FFE8E8" },
								}}
							>
								<ListItemText
									primary="Sign Out"
									primaryTypographyProps={{
										fontFamily: '"Georgia", serif',
										fontWeight: 600,
										color: "#999",
										fontSize: "0.9rem",
									}}
								/>
							</ListItemButton>
						</>
					) : (
						<ListItemButton
							onClick={() => {
								setDrawerOpen(false);
								signInWithGoogle().catch(() => {});
							}}
							sx={{
								py: 1.5,
								borderRadius: 1,
								"&:hover": { backgroundColor: "#FFE8E8" },
							}}
						>
							<PersonOutlineIcon sx={{ color: "#e3242b", mr: 1 }} />
							<ListItemText
								primary="Sign In"
								primaryTypographyProps={{
									fontFamily: '"Georgia", serif',
									fontWeight: 600,
									color: "var(--text-main)",
								}}
							/>
						</ListItemButton>
					)}
				</Box>
				<Divider sx={{ borderColor: "#E8D5B0", my: 1 }} />
				{/* Navigation Items */}
				<List>
					{navItems.map((item) => (
						<ListItemButton
							key={item.label}
							onClick={() => handleNavClick(item)}
							sx={{
								py: 1.5,
								"&:hover": { backgroundColor: "#FFE8E8" },
							}}
						>
							<ListItemText
								primary={item.label}
								primaryTypographyProps={{
									fontFamily: '"Georgia", serif',
									fontWeight: 600,
									color: "var(--text-main)",
								}}
							/>
						</ListItemButton>
					))}
					<ListItemButton
						onClick={() => {
							setDrawerOpen(false);
							navigate("/cart");
						}}
						sx={{
							py: 1.5,
							"&:hover": { backgroundColor: "#FFE8E8" },
						}}
					>
						<ListItemText
							primary="Cart"
							primaryTypographyProps={{
								fontFamily: '"Georgia", serif',
								fontWeight: 600,
								color: "var(--text-main)",
							}}
						/>
					</ListItemButton>
					<ListItemButton
						onClick={() => {
							setDrawerOpen(false);
							navigate("/account#wishlist");
						}}
						sx={{
							py: 1.5,
							"&:hover": { backgroundColor: "#FFE8E8" },
						}}
					>
						<ListItemText
							primary="Wishlist"
							primaryTypographyProps={{
								fontFamily: '"Georgia", serif',
								fontWeight: 600,
								color: "var(--text-main)",
							}}
						/>
					</ListItemButton>
					{isAdmin && (
						<ListItemButton
							onClick={() => {
								setDrawerOpen(false);
								navigate("/admin");
							}}
							sx={{
								py: 1.5,
								"&:hover": { backgroundColor: "#FFE8E8" },
							}}
						>
							<ListItemText
								primary="Admin Dashboard"
								primaryTypographyProps={{
									fontFamily: '"Georgia", serif',
									fontWeight: 600,
									color: "var(--text-purple)",
								}}
							/>
						</ListItemButton>
					)}
				</List>
			</Drawer>
		</>
  );
}
