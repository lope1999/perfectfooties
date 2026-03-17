import { Snackbar, Alert } from '@mui/material';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import RateReviewIcon from '@mui/icons-material/RateReview';
import CancelIcon from '@mui/icons-material/Cancel';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { useNotifications } from '../context/NotificationContext';

const fontFamily = '"Georgia", serif';

function getActionIcon(message = '') {
  const m = message.toLowerCase();
  if (m.includes('cart') || m.includes('added')) return <ShoppingCartIcon fontSize="small" />;
  if (m.includes('review') || m.includes('submitted')) return <RateReviewIcon fontSize="small" />;
  if (m.includes('cancel')) return <CancelIcon fontSize="small" />;
  return <CheckCircleOutlineIcon fontSize="small" />;
}

export default function StatusChangeToast() {
  const { currentToast, dismissToast } = useNotifications();

  if (!currentToast) return null;

  const isAction = currentToast.type === 'action';
  const severity = isAction
    ? (currentToast.severity || 'success')
    : (currentToast.status === 'cancelled' ? 'warning' : 'success');
  const icon = isAction
    ? getActionIcon(currentToast.message)
    : <LocalShippingIcon fontSize="small" />;

  return (
    <Snackbar
      open={Boolean(currentToast)}
      autoHideDuration={4000}
      onClose={dismissToast}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      sx={{ mb: { xs: 8, md: 2 } }}
    >
      <Alert
        onClose={dismissToast}
        severity={severity}
        icon={icon}
        sx={{
          fontFamily,
          fontSize: '0.85rem',
          '& .MuiAlert-message': { fontFamily },
        }}
      >
        {currentToast.title && <><strong>{currentToast.title}</strong><br /></>}
        {currentToast.message}
      </Alert>
    </Snackbar>
  );
}
