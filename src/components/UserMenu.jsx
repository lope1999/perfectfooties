import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Tooltip,
  CircularProgress,
} from '@mui/material';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import AccountCircleOutlinedIcon from '@mui/icons-material/AccountCircleOutlined';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import EventNoteIcon from '@mui/icons-material/EventNote';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import LogoutIcon from '@mui/icons-material/Logout';
import { useAuth } from "../context/AuthContext";
import { useNotifications } from "../context/NotificationContext";

export default function UserMenu() {
  const { user, signOut, isAdmin } = useAuth();
  const { showToast } = useNotifications();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);

  const handleClick = async (e) => {
    if (user) {
      setAnchorEl(e.currentTarget);
    } else {
      navigate("/auth-method");
    }
  };

  const handleClose = () => setAnchorEl(null);

  const goTo = (path) => {
    handleClose();
    navigate(path);
  };

  const handleSignOut = () => {
    handleClose();
    showToast("You've been signed out. See you soon!", "info");
		setTimeout(() => signOut(), 300);
  };

  return (
		<>
			<Tooltip title={user ? "Account" : "Sign In"} arrow>
				<IconButton
					onClick={handleClick}
					sx={{ color: "#e3242b", ml: 0.5 }}
				>
					{user ? (
						<Avatar
							src={user.photoURL}
							alt={user.displayName}
							sx={{ width: 30, height: 30, border: "2px solid #e3242b" }}
						/>
					) : (
						<PersonOutlineIcon />
					)}
				</IconButton>
			</Tooltip>

			<Menu
				anchorEl={anchorEl}
				open={Boolean(anchorEl)}
				onClose={handleClose}
				PaperProps={{
					sx: {
						borderRadius: 2,
						minWidth: 200,
						boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
					},
				}}
				transformOrigin={{ horizontal: "right", vertical: "top" }}
				anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
			>
				<MenuItem onClick={() => goTo("/account#profile")}>
					<ListItemIcon>
						<AccountCircleOutlinedIcon sx={{ color: "#e3242b" }} />
					</ListItemIcon>
					<ListItemText
						primaryTypographyProps={{
							fontFamily: '"Georgia", serif',
							fontSize: "0.9rem",
						}}
					>
						My Account
					</ListItemText>
				</MenuItem>
				<MenuItem onClick={() => goTo("/account#orders")}>
					<ListItemIcon>
						<ReceiptLongOutlinedIcon sx={{ color: "#e3242b" }} />
					</ListItemIcon>
					<ListItemText
						primaryTypographyProps={{
							fontFamily: '"Georgia", serif',
							fontSize: "0.9rem",
						}}
					>
						Order History
					</ListItemText>
				</MenuItem>
				{isAdmin && (
					<MenuItem onClick={() => goTo("/admin")}>
						<ListItemIcon>
							<AdminPanelSettingsIcon
								sx={{ color: "var(--text-purple)" }}
							/>
						</ListItemIcon>
						<ListItemText
							primaryTypographyProps={{
								fontFamily: '"Georgia", serif',
								fontSize: "0.9rem",
							}}
						>
							Admin Dashboard
						</ListItemText>
					</MenuItem>
				)}
				<Divider />
				<MenuItem onClick={handleSignOut}>
					<ListItemIcon>
						<LogoutIcon sx={{ color: "#e3242b" }} />
					</ListItemIcon>
					<ListItemText
						primaryTypographyProps={{
							fontFamily: '"Georgia", serif',
							fontSize: "0.9rem",
						}}
					>
						Sign Out
					</ListItemText>
				</MenuItem>
			</Menu>
		</>
  );
}
