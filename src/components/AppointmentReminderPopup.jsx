import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Button,
} from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { formatRelativeTime } from '../lib/appointmentDateUtils';
import { useThemeMode } from '../context/ThemeContext';

const SESSION_KEY = 'perfectfooties-reminder-popup-shown';
const fontFamily = '"Georgia", serif';

export default function AppointmentReminderPopup() {
  const { mode } = useThemeMode();
  const isDark = mode === 'dark';
  const { user } = useAuth();
  const { urgentNotifications, loading } = useNotifications();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (loading || !user || urgentNotifications.length === 0) return;

    const shownFor = sessionStorage.getItem(SESSION_KEY);
    if (shownFor === user.uid) return;

    setOpen(true);
    sessionStorage.setItem(SESSION_KEY, user.uid);
  }, [loading, user, urgentNotifications]);

  if (!open || urgentNotifications.length === 0) return null;

  return (
    <Dialog
      open={open}
      onClose={() => setOpen(false)}
      PaperProps={{
        sx: {
          borderRadius: 3,
          border: '2px solid #ed6c02',
          maxWidth: 420, backgroundColor: 'var(--bg-card)', color: 'var(--text-main)',
          mx: 2,
        },
      }}
    >
      <DialogContent sx={{ textAlign: 'center', pt: 4, pb: 2 }}>
        <Box
          sx={{
            width: 64,
            height: 64,
            borderRadius: '50%',
            backgroundColor: isDark ? 'rgba(237,108,2,0.12)' : '#FFF3E0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            mx: 'auto',
            mb: 2,
          }}
        >
          <AccessTimeIcon sx={{ fontSize: 36, color: '#ed6c02' }} />
        </Box>

        <Typography sx={{ fontFamily, fontWeight: 700, fontSize: '1.2rem', mb: 1 }}>
          Appointment Reminder
        </Typography>

        <Typography sx={{ fontFamily, fontSize: '0.9rem', color: 'var(--text-muted)', mb: 2 }}>
          You have {urgentNotifications.length === 1 ? 'an appointment' : `${urgentNotifications.length} appointments`} coming up soon!
        </Typography>

        {urgentNotifications.map((n) => (
          <Box
            key={n.id}
            sx={{
              backgroundColor: isDark ? 'rgba(255,248,225,0.08)' : '#FFF8E1',
              border: '1px solid #FFE0B2',
              borderRadius: 2,
              p: 1.5,
              mb: 1,
              textAlign: 'left',
            }}
          >
            <Typography sx={{ fontFamily, fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-main)' }}>
              {n.serviceName}
            </Typography>
            <Typography sx={{ fontFamily, fontSize: '0.8rem', color: '#777' }}>
              {n.dateStr} — {formatRelativeTime(n.date)}
            </Typography>
          </Box>
        ))}
      </DialogContent>

      <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
        <Button
          onClick={() => setOpen(false)}
          sx={{
            border: '2px solid #ed6c02',
            borderRadius: '30px',
            color: '#ed6c02',
            backgroundColor: 'transparent',
            px: 5,
            py: 1,
            fontFamily,
            fontWeight: 600,
            textTransform: 'none',
            '&:hover': {
              backgroundColor: '#ed6c02',
              color: '#fff',
            },
          }}
        >
          Got it
        </Button>
      </DialogActions>
    </Dialog>
  );
}
