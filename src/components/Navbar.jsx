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
import { useNotifications } from "../context/NotificationContext";

const navLinkSx = (isActive) => ({
  color: isActive ? '#e3242b' : 'var(--text-main)',
  px: 1.5,
  py: 0.5,
  fontSize: '0.87rem',
  fontFamily: '"Georgia", serif',
  fontWeight: 600,
  backgroundColor: 'transparent',
  border: 'none',
  borderRadius: 0,
  whiteSpace: 'nowrap',
  minWidth: 0,
  position: 'relative',
  transition: 'color 0.2s ease',
  '&::after': {
    content: '""',
    position: 'absolute',
    bottom: 0,
    left: '10%',
    width: isActive ? '80%' : '0%',
    height: '2px',
    background: '#e3242b',
    transition: 'width 0.25s ease',
    borderRadius: '2px',
  },
  '&:hover': {
    color: '#e3242b',
    backgroundColor: 'transparent',
  },
  '&:hover::after': {
    width: '80%',
  },
});

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
  const { user, signOut, isAdmin } = useAuth();
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
					overflow: "visible",
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
							overflow: "visible",
						}}
						onClick={() => navigate("/")}
					>
						<Box
							component="img"
							src="/images/logo.png"
							alt="PerfectFooties"
							sx={{
								height: { xs: 45, md: 65 },
								width: "auto",
								objectFit: "contain",
								display: "block",
								// visually enlarge on large screens without increasing toolbar height
								transform: { md: "scale(2.5)" },
								transformOrigin: "left center",
								// allow the image to overflow the toolbar area
								WebkitTransform: { md: "scale(2.5)" },
							}}
						/>
						<Typography
							sx={{
								fontFamily: '"Dancing Script", "Pacifico", cursive',
								fontSize: { xs: "1.15rem", md: "1.3rem", lg: "1.5rem" },
								fontWeight: 700,
								color: "#e3242b",
								lineHeight: 1,
								letterSpacing: "0.02em",
								userSelect: "none",
								display: { xs: "inline", md: "none" },
							}}
						>
							<Box component="span">PF</Box>
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
						{navItems.map((item) => {
							const isActive =
								item.path !== "contact" &&
								location.pathname === item.path;
							return (
								<Button
									key={item.label}
									sx={navLinkSx(isActive)}
									onClick={() => handleNavClick(item)}
								>
									{item.label}
								</Button>
							);
						})}
						{isAdmin && (
							<Button
								sx={{
									color: "#fff",
									backgroundColor: "#007a7a",
									borderRadius: "20px",
									px: 2,
									py: 0.6,
									fontSize: "0.85rem",
									fontFamily: '"Georgia", serif',
									fontWeight: 600,
									whiteSpace: "nowrap",
									"&:hover": { backgroundColor: "#005f5f" },
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
									showToast(
										"You've been signed out. See you soon!",
										"info",
									);
									setTimeout(() => signOut(), 300);
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
								navigate("/auth-method");
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
