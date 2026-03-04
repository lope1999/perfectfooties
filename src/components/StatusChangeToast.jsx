import { Snackbar, Alert } from '@mui/material';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import { useNotifications } from '../context/NotificationContext';

const fontFamily = '"Georgia", serif';

export default function StatusChangeToast() {
  const { currentToast, dismissToast } = useNotifications();

  if (!currentToast) return null;

  const severity = currentToast.status === 'cancelled' ? 'warning' : 'success';

  return (
    <Snackbar
      open={Boolean(currentToast)}
      autoHideDuration={6000}
      onClose={dismissToast}
      anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      sx={{ mt: 7 }}
    >
      <Alert
        onClose={dismissToast}
        severity={severity}
        icon={<LocalShippingIcon fontSize="small" />}
        sx={{
          fontFamily,
          fontSize: '0.85rem',
          '& .MuiAlert-message': { fontFamily },
        }}
      >
        <strong>{currentToast.title}</strong>
        <br />
        {currentToast.message}
      </Alert>
    </Snackbar>
  );
}
