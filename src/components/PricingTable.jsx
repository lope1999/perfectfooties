import {
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Typography,
  Box,
  Divider,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import HandymanIcon from '@mui/icons-material/Handyman';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';

const sectionHeadingSx = {
  fontFamily: '"Georgia", serif',
  fontWeight: 700,
  color: 'var(--text-purple)',
  fontSize: '1.1rem',
  mt: 3,
  mb: 1.5,
};

const rowSx = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  py: 1.2,
  px: 1.5,
  borderRadius: 1.5,
  '&:nth-of-type(odd)': { backgroundColor: '#FFF8F0' },
};

const nameSx = {
  fontFamily: '"Georgia", serif',
  fontWeight: 600,
  fontSize: '0.9rem',
  color: 'var(--text-main)',
  flex: 1,
  pr: 2,
};

const priceSx = {
  fontFamily: '"Georgia", serif',
  fontWeight: 700,
  fontSize: '0.9rem',
  color: '#e3242b',
  whiteSpace: 'nowrap',
};

const COLLECTIONS = [
  { name: 'Female Handmade Footwear',  range: '₦45,000 – ₦120,000' },
  { name: 'Male Handmade Footwear',    range: '₦50,000 – ₦130,000' },
  { name: 'Heirloom Collection',       range: '₦60,000 – ₦200,000' },
  { name: 'Handmade Bags & Belts',     range: '₦35,000 – ₦95,000'  },
  { name: 'Custom Orders',             range: 'Quoted on WhatsApp'  },
];

const SHIPPING = [
  { label: 'Lagos (Fez Delivery)',       price: '₦3,000' },
  { label: 'Outside Lagos (Fez Delivery)', price: '₦4,000' },
  { label: 'UK',                         price: '₦8,500/kg' },
  { label: 'USA',                        price: '₦15,000/kg' },
  { label: 'Canada',                     price: '₦13,500/kg' },
  { label: 'Europe (general)',           price: '₦12,500/kg' },
  { label: 'Sweden / France / Italy / Netherlands', price: '₦77,000 flat (≤ 2kg)' },
];

export default function PricingTable({ open, onClose }) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{ sx: { borderRadius: 4, maxHeight: '85vh' } }}
    >
      <DialogTitle sx={{ textAlign: 'center', pb: 0, pt: 3, position: 'relative' }}>
        <IconButton
          onClick={onClose}
          sx={{ position: 'absolute', right: 12, top: 12, color: '#e3242b', border: '1.5px solid #e3242b', width: 32, height: 32, '&:hover': { backgroundColor: '#e3242b', color: '#fff' } }}
        >
          <CloseIcon sx={{ fontSize: 18 }} />
        </IconButton>
        <Typography variant="h5" sx={{ fontFamily: '"Georgia", serif', fontWeight: 700, color: 'var(--text-main)', fontSize: { xs: '1.3rem', sm: '1.6rem' } }}>
          Price Guide
        </Typography>
        <Typography sx={{ color: '#777', fontSize: '0.85rem', mt: 0.5, lineHeight: 1.5 }}>
          An overview of our handcrafted leather goods pricing. All items are made to order.
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ px: { xs: 2, sm: 3 }, pb: 4 }}>

        {/* COLLECTIONS */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 3, mb: 1.5 }}>
          <HandymanIcon sx={{ fontSize: 18, color: 'var(--text-purple)' }} />
          <Typography sx={{ ...sectionHeadingSx, mt: 0, mb: 0 }}>Leather Collections</Typography>
        </Box>
        <Divider sx={{ borderColor: '#E8D5B0', mb: 1 }} />
        {COLLECTIONS.map((c) => (
          <Box key={c.name} sx={rowSx}>
            <Typography sx={nameSx}>{c.name}</Typography>
            <Typography sx={priceSx}>{c.range}</Typography>
          </Box>
        ))}

        {/* SHIPPING */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 4, mb: 1.5 }}>
          <LocalShippingOutlinedIcon sx={{ fontSize: 18, color: 'var(--text-purple)' }} />
          <Typography sx={{ ...sectionHeadingSx, mt: 0, mb: 0 }}>Shipping Rates</Typography>
        </Box>
        <Divider sx={{ borderColor: '#E8D5B0', mb: 1 }} />
        {SHIPPING.map((s) => (
          <Box key={s.label} sx={rowSx}>
            <Typography sx={nameSx}>{s.label}</Typography>
            <Typography sx={priceSx}>{s.price}</Typography>
          </Box>
        ))}

        {/* NOTE */}
        <Box sx={{ mt: 3, p: 2, borderRadius: 2, backgroundColor: '#FFF8E1', border: '1px solid #FFD54F' }}>
          <Typography sx={{ fontSize: '0.82rem', color: '#5D4037', fontWeight: 600, lineHeight: 1.6 }}>
            All pieces are handcrafted to order in full-grain leather. Production takes 10–14 days. Prices may vary for complex custom orders — contact us on WhatsApp for a quote.
          </Typography>
        </Box>

        <Typography sx={{ mt: 2, color: '#999', fontSize: '0.78rem', textAlign: 'center', fontStyle: 'italic' }}>
          Prices are subject to change. Visit individual collection pages for the most up-to-date pricing.
        </Typography>
      </DialogContent>
    </Dialog>
  );
}
