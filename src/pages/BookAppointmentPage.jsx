import { useState } from 'react';
import {
  Box,
  Typography,
  Container,
  Card,
  CardContent,
  Radio,
  RadioGroup,
  FormControlLabel,
  Collapse,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { serviceCategories, nailShapes, nailLengths, quantities } from '../data/services';
import ScrollReveal from '../components/ScrollReveal';
import Interstitial from '../components/Interstitial';
import NailBedSizeInput from '../components/NailBedSizeInput';

function formatNaira(amount) {
  return `₦${amount.toLocaleString()}`;
}

const confirmButtonSx = {
  border: '2px solid #E91E8C',
  borderRadius: '30px',
  color: '#000',
  backgroundColor: 'transparent',
  px: 5,
  py: 1.5,
  fontSize: '1rem',
  fontFamily: '"Georgia", serif',
  fontWeight: 600,
  transition: 'all 0.3s ease',
  '&:hover': {
    backgroundColor: '#E91E8C',
    color: '#fff',
    borderColor: '#E91E8C',
  },
};

export default function BookAppointmentPage() {
  const [selectedService, setSelectedService] = useState('');
  const [formData, setFormData] = useState({
    nailShape: '',
    nailLength: '',
    quantity: '',
    nailBedSize: '',
  });
  const [modalOpen, setModalOpen] = useState(false);

  const allServices = serviceCategories.flatMap((cat) =>
    cat.services.map((s) => ({ ...s, category: cat.title }))
  );

  const handleServiceChange = (event) => {
    setSelectedService(event.target.value);
    setFormData({ nailShape: '', nailLength: '', quantity: '', nailBedSize: '' });
  };

  const handleFieldChange = (field) => (event) => {
    setFormData((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleConfirmBooking = () => {
    setModalOpen(true);
  };

  const handleCompleteOrder = () => {
    setModalOpen(false);
    const selected = allServices.find((s) => s.id === selectedService);
    const message = `Hi! I'd like to book an appointment for ${selected?.name || 'a service'}.\n\nDetails:\n- Nail Shape: ${formData.nailShape}\n- Nail Length: ${formData.nailLength}\n- Quantity: ${formData.quantity}\n- Nail Bed Size: ${formData.nailBedSize}\n\nPlease confirm availability. Thank you!`;
    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/message/CHLIAKCZOF4TP1?text=${encoded}`, '_blank');
  };

  const isFormValid =
    selectedService && formData.nailShape && formData.nailLength && formData.quantity;

  return (
    <Box sx={{ pt: { xs: 7, md: 8 } }}>
      {/* Interstitial banner at top */}
      <Interstitial
        image="https://images.unsplash.com/photo-1604654894610-df63bc536371?w=1920&q=80"
        text="Hope it's great so far"
        overlayColor="rgba(233, 30, 140, 0.45)"
      />

      <Box sx={{ py: 8, backgroundColor: '#FFF0F5' }}>
        <Container maxWidth="md">
          {/* Header */}
          <ScrollReveal direction="up">
            <Box sx={{ textAlign: 'center', mb: 5 }}>
              <Typography
                variant="h3"
                sx={{
                  fontFamily: '"Georgia", serif',
                  fontWeight: 700,
                  color: '#000',
                  mb: 2,
                  fontSize: { xs: '1.8rem', sm: '2.4rem', md: '3rem' },
                }}
              >
                Book Appointment
              </Typography>
              <Typography sx={{ color: '#555', fontSize: '1.05rem', maxWidth: 500, mx: 'auto' }}>
                Select a service below, customize your preferences, and confirm your booking.
                We will connect you with a stylist on WhatsApp.
              </Typography>
            </Box>
          </ScrollReveal>

          {/* Service Selection */}
          <RadioGroup value={selectedService} onChange={handleServiceChange}>
            {serviceCategories.map((category, catIdx) => (
              <ScrollReveal key={category.id} direction="up" delay={catIdx * 0.1}>
                <Box sx={{ mb: 4 }}>
                  <Typography
                    variant="h5"
                    sx={{
                      fontFamily: '"Georgia", serif',
                      fontWeight: 700,
                      color: '#4A0E4E',
                      mb: 2,
                    }}
                  >
                    {category.title}
                  </Typography>

                  {category.services.map((service) => (
                    <Box key={service.id} sx={{ mb: 2 }}>
                      <Card
                        elevation={0}
                        sx={{
                          borderRadius: 3,
                          border:
                            selectedService === service.id
                              ? '2px solid #E91E8C'
                              : '1px solid #F0C0D0',
                          transition: 'all 0.3s ease',
                          cursor: 'pointer',
                          '&:hover': {
                            borderColor: '#E91E8C',
                            boxShadow: '0 4px 16px rgba(233,30,140,0.1)',
                          },
                        }}
                        onClick={() =>
                          handleServiceChange({ target: { value: service.id } })
                        }
                      >
                        <CardContent sx={{ p: 2.5 }}>
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                            }}
                          >
                            <FormControlLabel
                              value={service.id}
                              control={
                                <Radio
                                  sx={{
                                    color: '#E91E8C',
                                    '&.Mui-checked': { color: '#E91E8C' },
                                  }}
                                />
                              }
                              label={
                                <Box>
                                  <Typography
                                    sx={{
                                      fontFamily: '"Georgia", serif',
                                      fontWeight: 600,
                                      fontSize: '1rem',
                                    }}
                                  >
                                    {service.name}
                                  </Typography>
                                  <Typography sx={{ color: '#777', fontSize: '0.85rem' }}>
                                    {service.description}
                                  </Typography>
                                </Box>
                              }
                              sx={{ flex: 1, m: 0 }}
                            />
                            <Typography
                              sx={{
                                fontFamily: '"Georgia", serif',
                                fontWeight: 700,
                                color: '#E91E8C',
                                fontSize: '1.05rem',
                                whiteSpace: 'nowrap',
                                ml: 2,
                              }}
                            >
                              {formatNaira(service.price)}
                            </Typography>
                          </Box>
                        </CardContent>

                        {/* Dropdown Form */}
                        <Collapse in={selectedService === service.id}>
                          <Box sx={{ px: 3, pb: 3, pt: 1 }} onClick={(e) => e.stopPropagation()}>
                            <Grid container spacing={2}>
                              <Grid item xs={12} sm={4}>
                                <FormControl fullWidth size="small">
                                  <InputLabel>Nail Shape</InputLabel>
                                  <Select
                                    value={formData.nailShape}
                                    label="Nail Shape"
                                    onChange={handleFieldChange('nailShape')}
                                    sx={{ borderRadius: 2 }}
                                  >
                                    {nailShapes.map((shape) => (
                                      <MenuItem key={shape} value={shape}>
                                        {shape}
                                      </MenuItem>
                                    ))}
                                  </Select>
                                </FormControl>
                              </Grid>
                              <Grid item xs={12} sm={4}>
                                <FormControl fullWidth size="small">
                                  <InputLabel>Nail Length</InputLabel>
                                  <Select
                                    value={formData.nailLength}
                                    label="Nail Length"
                                    onChange={handleFieldChange('nailLength')}
                                    sx={{ borderRadius: 2 }}
                                  >
                                    {nailLengths.map((len) => (
                                      <MenuItem key={len} value={len}>
                                        {len}
                                      </MenuItem>
                                    ))}
                                  </Select>
                                </FormControl>
                              </Grid>
                              <Grid item xs={12} sm={4}>
                                <FormControl fullWidth size="small">
                                  <InputLabel>Quantity</InputLabel>
                                  <Select
                                    value={formData.quantity}
                                    label="Quantity"
                                    onChange={handleFieldChange('quantity')}
                                    sx={{ borderRadius: 2 }}
                                  >
                                    {quantities.map((q) => (
                                      <MenuItem key={q} value={q}>
                                        {q}
                                      </MenuItem>
                                    ))}
                                  </Select>
                                </FormControl>
                              </Grid>
                              <Grid item xs={12}>
                                <NailBedSizeInput
                                  value={formData.nailBedSize}
                                  onChange={(val) =>
                                    setFormData((prev) => ({ ...prev, nailBedSize: val }))
                                  }

/>
                              </Grid>
                            </Grid>
                          </Box>
                        </Collapse>
                      </Card>
                    </Box>
                  ))}
                </Box>
              </ScrollReveal>
            ))}
          </RadioGroup>

          {/* spacer so content doesn't hide behind sticky button */}
          <Box sx={{ height: 80 }} />
        </Container>
      </Box>

      {/* Sticky Confirm Button */}
      <Box
        sx={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 1100,
          backgroundColor: 'rgba(255, 240, 245, 0.95)',
          backdropFilter: 'blur(8px)',
          borderTop: '1px solid #F0C0D0',
          py: 2,
          textAlign: 'center',
        }}
      >
        <Button
          sx={{
            ...confirmButtonSx,
            opacity: isFormValid ? 1 : 0.5,
          }}
          onClick={handleConfirmBooking}
          disabled={!isFormValid}
        >
          Confirm Booking
        </Button>
      </Box>

      {/* Success Modal */}
      <Dialog
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        PaperProps={{
          sx: {
            borderRadius: 4,
            p: 2,
            textAlign: 'center',
            maxWidth: 420,
          },
        }}
      >
        <DialogTitle sx={{ pb: 0 }}>
          <CheckCircleOutlineIcon sx={{ fontSize: 60, color: '#E91E8C', mb: 1 }} />
          <Typography
            variant="h5"
            sx={{ fontFamily: '"Georgia", serif', fontWeight: 700 }}
          >
            Booking Successful!
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Typography sx={{ color: '#555', mt: 1, lineHeight: 1.7 }}>
            Your appointment is processing. We will navigate you to WhatsApp to talk
            with the stylist and confirm your design and payment.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
          <Button
            onClick={handleCompleteOrder}
            sx={{
              backgroundColor: '#E91E8C',
              color: '#fff',
              borderRadius: '30px',
              px: 4,
              py: 1.2,
              fontFamily: '"Georgia", serif',
              fontWeight: 600,
              fontSize: '0.95rem',
              '&:hover': {
                backgroundColor: '#C2185B',
              },
            }}
          >
            Complete Order
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
