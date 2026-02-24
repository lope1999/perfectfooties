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
import { useAuth } from '../context/AuthContext';

export default function UserMenu() {
  const { user, signInWithGoogle, signOut, isAdmin } = useAuth();
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const [signingIn, setSigningIn] = useState(false);

  const handleClick = async (e) => {
    if (user) {
      setAnchorEl(e.currentTarget);
    } else {
      setSigningIn(true);
      try {
        await signInWithGoogle();
      } catch {
        // user closed popup
      } finally {
        setSigningIn(false);
      }
    }
  };

  const handleClose = () => setAnchorEl(null);

  const goTo = (path) => {
    handleClose();
    navigate(path);
  };

  const handleSignOut = () => {
    handleClose();
    signOut();
  };

  return (
    <>
      <Tooltip title={user ? 'Account' : 'Sign In'} arrow>
        <IconButton onClick={handleClick} disabled={signingIn} sx={{ color: '#E91E8C', ml: 0.5 }}>
          {signingIn ? (
            <CircularProgress size={24} sx={{ color: '#E91E8C' }} />
          ) : user ? (
            <Avatar
              src={user.photoURL}
              alt={user.displayName}
              sx={{ width: 30, height: 30, border: '2px solid #E91E8C' }}
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
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem onClick={() => goTo('/account#profile')}>
          <ListItemIcon><AccountCircleOutlinedIcon sx={{ color: '#E91E8C' }} /></ListItemIcon>
          <ListItemText primaryTypographyProps={{ fontFamily: '"Georgia", serif', fontSize: '0.9rem' }}>
            My Account
          </ListItemText>
        </MenuItem>
        <MenuItem onClick={() => goTo('/account#orders')}>
          <ListItemIcon><ReceiptLongOutlinedIcon sx={{ color: '#E91E8C' }} /></ListItemIcon>
          <ListItemText primaryTypographyProps={{ fontFamily: '"Georgia", serif', fontSize: '0.9rem' }}>
            Order History
          </ListItemText>
        </MenuItem>
        <MenuItem onClick={() => goTo('/account#appointments')}>
          <ListItemIcon><EventNoteIcon sx={{ color: '#E91E8C' }} /></ListItemIcon>
          <ListItemText primaryTypographyProps={{ fontFamily: '"Georgia", serif', fontSize: '0.9rem' }}>
            Appointments
          </ListItemText>
        </MenuItem>
        {isAdmin && (
          <MenuItem onClick={() => goTo('/admin')}>
            <ListItemIcon><AdminPanelSettingsIcon sx={{ color: '#4A0E4E' }} /></ListItemIcon>
            <ListItemText primaryTypographyProps={{ fontFamily: '"Georgia", serif', fontSize: '0.9rem' }}>
              Admin Dashboard
            </ListItemText>
          </MenuItem>
        )}
        <Divider />
        <MenuItem onClick={handleSignOut}>
          <ListItemIcon><LogoutIcon sx={{ color: '#E91E8C' }} /></ListItemIcon>
          <ListItemText primaryTypographyProps={{ fontFamily: '"Georgia", serif', fontSize: '0.9rem' }}>
            Sign Out
          </ListItemText>
        </MenuItem>
      </Menu>
    </>
  );
}
