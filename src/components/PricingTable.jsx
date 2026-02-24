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
import { serviceCategories } from '../data/services';
import { productCategories } from '../data/products';

function formatNaira(amount) {
  return `\u20A6${amount.toLocaleString()}`;
}

function getCategoryPricing(items) {
  if (!items || items.length === 0) return null;
  const prices = items.map((i) => i.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);
  return { min, max };
}

const sectionHeadingSx = {
  fontFamily: '"Georgia", serif',
  fontWeight: 700,
  color: '#4A0E4E',
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
  '&:nth-of-type(odd)': {
    backgroundColor: '#FFF0F5',
  },
};

const nameSx = {
  fontFamily: '"Georgia", serif',
  fontWeight: 600,
  fontSize: '0.9rem',
  color: '#000',
  flex: 1,
  pr: 2,
};

const priceSx = {
  fontFamily: '"Georgia", serif',
  fontWeight: 700,
  fontSize: '0.9rem',
  color: '#E91E8C',
  whiteSpace: 'nowrap',
};

export default function PricingTable({ open, onClose }) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 4,
          maxHeight: '85vh',
        },
      }}
    >
      <DialogTitle
        sx={{
          textAlign: 'center',
          pb: 0,
          pt: 3,
          position: 'relative',
        }}
      >
        <IconButton
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 12,
            top: 12,
            color: '#E91E8C',
            border: '1.5px solid #E91E8C',
            width: 32,
            height: 32,
            '&:hover': { backgroundColor: '#E91E8C', color: '#fff' },
          }}
        >
          <CloseIcon sx={{ fontSize: 18 }} />
        </IconButton>
        <Typography
          variant="h5"
          sx={{
            fontFamily: '"Georgia", serif',
            fontWeight: 700,
            color: '#000',
            fontSize: { xs: '1.3rem', sm: '1.6rem' },
          }}
        >
          Price Guide
        </Typography>
        <Typography
          sx={{
            color: '#777',
            fontSize: '0.85rem',
            mt: 0.5,
            lineHeight: 1.5,
          }}
        >
          A quick overview of our service and press-on pricing to help you plan ahead.
        </Typography>
      </DialogTitle>

      <DialogContent sx={{ px: { xs: 2, sm: 3 }, pb: 4 }}>
        {/* SERVICE APPOINTMENTS */}
        <Typography sx={sectionHeadingSx}>Service Appointments</Typography>
        <Divider sx={{ borderColor: '#F0C0D0', mb: 1 }} />

        {serviceCategories.map((cat) => {
          const pricing = getCategoryPricing(cat.services);
          if (!pricing) return null;

          return (
            <Box key={cat.id}>
              <Typography
                sx={{
                  fontFamily: '"Georgia", serif',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  color: '#4A0E4E',
                  mt: 2,
                  mb: 0.5,
                  px: 1.5,
                }}
              >
                {cat.title}
              </Typography>
              {cat.services.map((service) => (
                <Box key={service.id} sx={rowSx}>
                  <Typography sx={nameSx}>{service.name}</Typography>
                  <Typography sx={priceSx}>{formatNaira(service.price)}</Typography>
                </Box>
              ))}
            </Box>
          );
        })}

        {/* PRESS-ON NAILS */}
        <Typography sx={{ ...sectionHeadingSx, mt: 4 }}>Press-On Nails</Typography>
        <Divider sx={{ borderColor: '#F0C0D0', mb: 1 }} />

        {productCategories
          .filter((cat) => !cat.readyMade)
          .map((cat) => {
            const pricing = getCategoryPricing(cat.products);
            if (!pricing) return null;

            return (
              <Box key={cat.id}>
                <Typography
                  sx={{
                    fontFamily: '"Georgia", serif',
                    fontWeight: 700,
                    fontSize: '0.95rem',
                    color: '#4A0E4E',
                    mt: 2,
                    mb: 0.5,
                    px: 1.5,
                  }}
                >
                  {cat.title}
                </Typography>
                {cat.products.map((product) => (
                  <Box key={product.id} sx={rowSx}>
                    <Typography sx={nameSx}>{product.name}</Typography>
                    <Typography sx={priceSx}>{formatNaira(product.price)}</Typography>
                  </Box>
                ))}
              </Box>
            );
          })}

        {/* READY-MADE PRESS-ONS */}
        {productCategories
          .filter((cat) => cat.readyMade)
          .map((cat) => {
            const activeProducts = cat.products;
            const pricing = getCategoryPricing(activeProducts);
            if (!pricing) return null;

            return (
              <Box key={cat.id}>
                <Typography
                  sx={{
                    fontFamily: '"Georgia", serif',
                    fontWeight: 700,
                    fontSize: '0.95rem',
                    color: '#4A0E4E',
                    mt: 2,
                    mb: 0.5,
                    px: 1.5,
                  }}
                >
                  {cat.title.length > 40 ? 'Available Press-Ons (Ready to Ship)' : cat.title}
                </Typography>
                <Box sx={rowSx}>
                  <Typography sx={nameSx}>Price range</Typography>
                  <Typography sx={priceSx}>
                    {formatNaira(pricing.min)} &ndash; {formatNaira(pricing.max)}
                  </Typography>
                </Box>
              </Box>
            );
          })}

        {/* REMOVAL NOTE */}
        <Box
          sx={{
            mt: 4,
            p: 2,
            borderRadius: 2,
            backgroundColor: '#FFF8E1',
            border: '1px solid #FFD54F',
          }}
        >
          <Typography
            sx={{
              fontSize: '0.82rem',
              color: '#5D4037',
              fontWeight: 600,
              lineHeight: 1.6,
            }}
          >
            Nail removal starts from {formatNaira(5000)} if you arrive with existing nails. The exact
            cost depends on the product type and nail length.
          </Typography>
        </Box>

        {/* NOTE */}
        <Typography
          sx={{
            mt: 2,
            color: '#999',
            fontSize: '0.78rem',
            textAlign: 'center',
            fontStyle: 'italic',
          }}
        >
          Prices are subject to change. Visit the full menu pages for the most up-to-date pricing.
        </Typography>
      </DialogContent>
    </Dialog>
  );
}
