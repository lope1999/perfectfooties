import { useState } from 'react';
import {
  IconButton,
  Badge,
  Tooltip,
  Popover,
  Box,
  Typography,
  Button,
  List,
  ListItemButton,
  ListItemText,
  Divider,
} from '@mui/material';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import EventNoteIcon from '@mui/icons-material/EventNote';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

const fontFamily = '"Georgia", serif';

export default function NotificationBell() {
  const { user } = useAuth();
  const { notifications, dismissed, undismissedCount, dismiss, dismissAll } = useNotifications();
  const [anchorEl, setAnchorEl] = useState(null);

  if (!user) return null;

  const open = Boolean(anchorEl);
  const hasNotifications = notifications.length > 0;

  return (
    <>
      <Tooltip title="Notifications" arrow>
        <IconButton
          onClick={(e) => setAnchorEl(e.currentTarget)}
          sx={{ color: '#E91E8C', '&:hover': { color: '#4A0E4E' } }}
        >
          <Badge
            badgeContent={undismissedCount || 0}
            invisible={undismissedCount === 0}
            sx={{
              '& .MuiBadge-badge': {
                backgroundColor: '#E91E8C',
                color: '#fff',
                fontSize: '0.7rem',
                fontWeight: 700,
                minWidth: 18,
                height: 18,
              },
            }}
          >
            <NotificationsNoneIcon />
          </Badge>
        </IconButton>
      </Tooltip>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
        PaperProps={{
          sx: {
            borderRadius: 2,
            width: 340,
            maxHeight: 420,
            boxShadow: '0 4px 20px rgba(0,0,0,0.12)',
          },
        }}
      >
        {/* Header */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            px: 2,
            py: 1.5,
            borderBottom: '1px solid #F0C0D0',
          }}
        >
          <Typography sx={{ fontFamily, fontWeight: 700, fontSize: '0.95rem' }}>
            Notifications
          </Typography>
          {undismissedCount > 0 && (
            <Button
              size="small"
              onClick={dismissAll}
              sx={{
                fontFamily,
                fontSize: '0.75rem',
                color: '#E91E8C',
                textTransform: 'none',
                '&:hover': { backgroundColor: '#FFF0F5' },
              }}
            >
              Mark all read
            </Button>
          )}
        </Box>

        {/* Notification list */}
        {hasNotifications ? (
          <List sx={{ py: 0, maxHeight: 340, overflowY: 'auto' }}>
            {notifications.map((n, i) => {
              const isDismissed = dismissed.includes(n.id);
              const isReminder = n.type === 'appointment-reminder';

              return (
                <Box key={n.id}>
                  <ListItemButton
                    onClick={() => { if (!isDismissed) dismiss(n.id); }}
                    sx={{
                      py: 1.5,
                      px: 2,
                      backgroundColor: isDismissed ? 'transparent' : '#FFF0F5',
                      opacity: isDismissed ? 0.55 : 1,
                      '&:hover': { backgroundColor: isDismissed ? '#fafafa' : '#FCE4EC' },
                    }}
                  >
                    <Box sx={{ mr: 1.5, color: isReminder ? '#ed6c02' : '#E91E8C', mt: 0.3 }}>
                      {isReminder ? <AccessTimeIcon fontSize="small" /> : <EventNoteIcon fontSize="small" />}
                    </Box>
                    <ListItemText
                      primary={n.title}
                      secondary={n.message}
                      primaryTypographyProps={{
                        fontFamily,
                        fontWeight: isDismissed ? 500 : 700,
                        fontSize: '0.85rem',
                        color: isReminder ? '#ed6c02' : '#000',
                      }}
                      secondaryTypographyProps={{
                        fontFamily,
                        fontSize: '0.78rem',
                        color: '#666',
                      }}
                    />
                  </ListItemButton>
                  {i < notifications.length - 1 && <Divider sx={{ borderColor: '#F0C0D0' }} />}
                </Box>
              );
            })}
          </List>
        ) : (
          <Box sx={{ py: 4, textAlign: 'center' }}>
            <Typography sx={{ fontFamily, fontSize: '0.85rem', color: '#999' }}>
              No notifications
            </Typography>
          </Box>
        )}
      </Popover>
    </>
  );
}
