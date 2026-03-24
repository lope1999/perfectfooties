import { Box, Tooltip, Typography } from '@mui/material';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';

export default function WhatsAppBubble() {
  const phone = '2349053714197';
  const message = encodeURIComponent("Hi! I have a question about Chizzys Nails 💅");

  return (
    <Tooltip title="Chat with us on WhatsApp" placement="left">
      <Box
        component="a"
        href={`https://api.whatsapp.com/send?phone=${phone}&text=${message}`}
        target="_blank"
        rel="noopener noreferrer"
        sx={{
          position: 'fixed',
          bottom: { xs: 76, md: 28 },  // on mobile, above the bottom nav bar (which is 64px tall)
          right: { xs: 16, md: 24 },
          zIndex: 1300,
          width: 52,
          height: 52,
          borderRadius: '50%',
          backgroundColor: '#25D366',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 20px rgba(37,211,102,0.45)',
          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
          textDecoration: 'none',
          '&:hover': {
            transform: 'scale(1.1)',
            boxShadow: '0 6px 24px rgba(37,211,102,0.65)',
          },
        }}
      >
        <WhatsAppIcon sx={{ color: '#fff', fontSize: 28 }} />
      </Box>
    </Tooltip>
  );
}
