import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Container,
  Button,
  Divider,
  Chip,
} from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ShoppingBagOutlinedIcon from '@mui/icons-material/ShoppingBagOutlined';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import StarOutlineIcon from '@mui/icons-material/StarOutline';

function formatNaira(n) {
  return `₦${(n || 0).toLocaleString()}`;
}

function SummaryRow({ label, value, highlight, strike }) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.6 }}>
      <Typography sx={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{label}</Typography>
      <Typography
        sx={{
          fontSize: '0.84rem',
          fontWeight: highlight ? 700 : 500,
          color: strike ? '#e3242b' : highlight ? '#1a1a1a' : '#444',
          textDecoration: strike ? 'none' : 'none',
        }}
      >
        {value}
      </Typography>
    </Box>
  );
}

export default function ThankYouPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state || {};
  const [show, setShow] = useState(false);
  const [waOpened, setWaOpened] = useState(false);

  const isReschedule = !!state.isReschedule;
  const isAppointment =
    isReschedule ||
    state.type === 'service' ||
    state.type === 'appointment' ||
    (state.appointmentDate && !state.items?.some?.((i) => i.kind !== 'service'));

  const whatsappUrl = state.whatsappUrl || '';

  useEffect(() => {
    const t = setTimeout(() => setShow(true), 80);
    return () => clearTimeout(t);
  }, []);

  // Attempt auto-redirect to WhatsApp once page is visible.
  // Works on most Android browsers; iOS Safari requires a direct user tap (button below handles that).
  useEffect(() => {
    if (!whatsappUrl || waOpened) return;
    const t = setTimeout(() => {
      window.location.href = whatsappUrl;
      setWaOpened(true);
    }, 600);
    return () => clearTimeout(t);
  }, [whatsappUrl]);

  // Derived values
  const customerName = state.customerName || '';
  const items = state.items || [];
  const total = state.total || 0;
  const finalTotal = state.finalTotal ?? total;
  const giftCardDiscount = state.giftCardDiscount || 0;
  const referralDiscount = state.referralDiscount || 0;
  const loyaltyDiscount = state.loyaltyDiscount || 0;
  const totalDiscount = giftCardDiscount + referralDiscount + loyaltyDiscount;
  const appointmentDate = state.appointmentDate || '';
  const depositAmount = state.depositAmount || 0;
  const serviceName = state.serviceName || items[0]?.serviceName || items[0]?.name || '';

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(160deg, #FFF0F8 0%, #F8F0FF 50%, #FFF8F0 100%)',
        pt: { xs: 10, md: 12 },
        pb: { xs: 12, md: 8 },
      }}
    >
      <Container maxWidth="sm">
        {/* Hero success card */}
        <Box
          sx={{
            textAlign: 'center',
            mb: 3,
            opacity: show ? 1 : 0,
            transform: show ? 'translateY(0)' : 'translateY(24px)',
            transition: 'all 0.55s cubic-bezier(0.34,1.56,0.64,1)',
          }}
        >
          {/* Animated checkmark ring */}
          <Box
            sx={{
              width: 90,
              height: 90,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #e3242b22, #9C27B022)',
              border: '2.5px solid #e3242b44',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              mb: 2,
              boxShadow: '0 8px 32px rgba(233,30,140,0.15)',
              animation: show ? 'pulse 2s ease-in-out infinite' : 'none',
              '@keyframes pulse': {
                '0%, 100%': { boxShadow: '0 8px 32px rgba(233,30,140,0.15)' },
                '50%': { boxShadow: '0 8px 48px rgba(233,30,140,0.35)' },
              },
            }}
          >
            <CheckCircleOutlineIcon sx={{ fontSize: 52, color: '#e3242b' }} />
          </Box>

          <Typography
            variant="h4"
            sx={{
              fontWeight: 800,
              fontSize: { xs: '1.6rem', md: '2rem' },
              background: 'linear-gradient(135deg, #e3242b, #9C27B0)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              mb: 0.5,
            }}
          >
            {isReschedule ? 'Appointment Rescheduled!' : isAppointment ? 'Appointment Booked!' : 'Order Placed!'}
          </Typography>
          <Typography sx={{ fontSize: '0.92rem', color: '#777', px: 2 }}>
            {customerName
              ? `Thank you, ${customerName.split(' ')[0]}! We've received your ${isReschedule ? 'reschedule request' : isAppointment ? 'booking' : 'order'} and will be in touch via WhatsApp shortly.`
              : `Thank you! We've received your ${isReschedule ? 'reschedule request' : isAppointment ? 'booking' : 'order'} and will be in touch via WhatsApp shortly.`}
          </Typography>
        </Box>

        {/* Summary card */}
        <Box
          sx={{
            background: '#fff',
            borderRadius: 4,
            border: '1.5px solid #F8D7E8',
            boxShadow: '0 4px 24px rgba(233,30,140,0.08)',
            overflow: 'hidden',
            mb: 2.5,
            opacity: show ? 1 : 0,
            transform: show ? 'translateY(0)' : 'translateY(24px)',
            transition: 'all 0.6s cubic-bezier(0.34,1.56,0.64,1) 0.1s',
          }}
        >
          {/* Card header */}
          <Box
            sx={{
              px: 2.5,
              py: 1.5,
              background: 'linear-gradient(135deg, #FFF0F8, #F8F0FF)',
              borderBottom: '1px solid #F0C8DC',
              display: 'flex',
              alignItems: 'center',
              gap: 1,
            }}
          >
            {isAppointment ? (
              <CalendarMonthIcon sx={{ fontSize: 20, color: '#e3242b' }} />
            ) : (
              <ShoppingBagOutlinedIcon sx={{ fontSize: 20, color: '#e3242b' }} />
            )}
            <Typography sx={{ fontWeight: 700, fontSize: '0.9rem', color: '#b81b21' }}>
              {isReschedule ? 'Reschedule Summary' : isAppointment ? 'Appointment Summary' : 'Order Summary'}
            </Typography>
          </Box>

          <Box sx={{ px: 2.5, py: 2 }}>
            {/* Items list */}
            {items.length > 0 ? (
              <Box sx={{ mb: 1.5 }}>
                {items.map((item, idx) => (
                  <Box key={idx} sx={{ mb: idx < items.length - 1 ? 1.5 : 0 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box sx={{ flex: 1, pr: 1 }}>
                        <Typography sx={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-main)' }}>
                          {item.serviceName || item.name || 'Item'}
                        </Typography>
                        {item.nailShape && (
                          <Typography sx={{ fontSize: '0.75rem', color: '#888', mt: 0.2 }}>
                            {item.nailShape}{item.nailLength ? ` · ${item.nailLength}` : ''}
                          </Typography>
                        )}
                        {item.selectedLength && (
                          <Typography sx={{ fontSize: '0.75rem', color: '#888', mt: 0.2 }}>
                            Length: {item.selectedLength}
                          </Typography>
                        )}
                        {item.setIncludes?.length > 0 && (
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.4, mt: 0.5 }}>
                            {item.setIncludes.map((tag) => (
                              <Chip key={tag} label={tag} size="small" sx={{ fontSize: '0.65rem', height: 18, backgroundColor: '#FFE8E8', color: '#b81b21', fontWeight: 600 }} />
                            ))}
                          </Box>
                        )}
                        {item.inspirationTags?.length > 0 && (
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.4, mt: 0.4 }}>
                            {item.inspirationTags.map((tag) => (
                              <Chip key={tag} label={tag} size="small" sx={{ fontSize: '0.65rem', height: 18, backgroundColor: '#EDE7F6', color: '#5E35B1', fontWeight: 600 }} />
                            ))}
                          </Box>
                        )}
                        {item.nailNotes && (
                          <Typography sx={{ fontSize: '0.73rem', color: '#888', mt: 0.4, fontStyle: 'italic' }}>
                            &ldquo;{item.nailNotes}&rdquo;
                          </Typography>
                        )}
                        {item.specialRequest && (
                          <Chip
                            label="Made to Order — 4–7 days"
                            size="small"
                            sx={{ mt: 0.5, fontSize: '0.65rem', height: 18, backgroundColor: '#FFF8E1', color: '#B8860B', fontWeight: 700, border: '1px solid #FFD54F' }}
                          />
                        )}
                        {item.date && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.3 }}>
                            <AccessTimeIcon sx={{ fontSize: 13, color: '#e3242b' }} />
                            <Typography sx={{ fontSize: '0.75rem', color: '#e3242b', fontWeight: 600 }}>
                              {item.date}
                            </Typography>
                          </Box>
                        )}
                        {item.quantity && item.quantity > 1 && (
                          <Typography sx={{ fontSize: '0.75rem', color: '#888', mt: 0.2 }}>
                            Qty: {item.quantity}
                          </Typography>
                        )}
                      </Box>
                      <Typography sx={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-main)', whiteSpace: 'nowrap' }}>
                        {formatNaira(item.price)}
                      </Typography>
                    </Box>
                    {idx < items.length - 1 && <Divider sx={{ mt: 1.2, borderColor: '#F8EEF4' }} />}
                  </Box>
                ))}
              </Box>
            ) : serviceName ? (
              <Box sx={{ mb: 1.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography sx={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-main)' }}>{serviceName}</Typography>
                  <Typography sx={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--text-main)' }}>{formatNaira(total)}</Typography>
                </Box>
                {appointmentDate && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.4 }}>
                    <AccessTimeIcon sx={{ fontSize: 13, color: '#e3242b' }} />
                    <Typography sx={{ fontSize: '0.75rem', color: '#e3242b', fontWeight: 600 }}>{appointmentDate}</Typography>
                  </Box>
                )}
              </Box>
            ) : null}

            <Divider sx={{ borderColor: '#F0C8DC', mb: 1.5 }} />

            {/* Discounts & totals */}
            {giftCardDiscount > 0 && (
              <SummaryRow label="🎁 Gift Card" value={`-${formatNaira(giftCardDiscount)}`} strike />
            )}
            {referralDiscount > 0 && (
              <SummaryRow label="🔗 Referral Code" value={`-${formatNaira(referralDiscount)}`} strike />
            )}
            {loyaltyDiscount > 0 && (
              <SummaryRow label="⭐ Loyalty Points" value={`-${formatNaira(loyaltyDiscount)}`} strike />
            )}
            {totalDiscount > 0 && (
              <>
                <SummaryRow label="Subtotal" value={formatNaira(total + totalDiscount)} />
                <SummaryRow label="Total Saved" value={`-${formatNaira(totalDiscount)}`} strike />
                <Divider sx={{ borderColor: '#F0C8DC', my: 0.8 }} />
              </>
            )}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 0.5 }}>
              <Typography sx={{ fontWeight: 800, fontSize: '1rem', color: '#1a1a1a' }}>
                {isAppointment && depositAmount > 0 ? 'Deposit' : 'Total'}
              </Typography>
              <Typography
                sx={{
                  fontWeight: 800,
                  fontSize: '1.1rem',
                  background: 'linear-gradient(135deg, #e3242b, #9C27B0)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                {isAppointment && depositAmount > 0
                  ? formatNaira(depositAmount)
                  : formatNaira(finalTotal)}
              </Typography>
            </Box>
            {isAppointment && depositAmount > 0 && (
              <Typography sx={{ fontSize: '0.73rem', color: '#888', mt: 0.3, textAlign: 'right' }}>
                Balance: {formatNaira(finalTotal - depositAmount)} due on the day
              </Typography>
            )}
          </Box>
        </Box>

        {/* Order Progress Tracker — product orders only */}
        {!isAppointment && (
          <Box
            sx={{
              background: '#fff',
              borderRadius: 4,
              border: '1.5px solid #F0C8DC',
              p: 2.5,
              mb: 2.5,
              opacity: show ? 1 : 0,
              transform: show ? 'translateY(0)' : 'translateY(24px)',
              transition: 'all 0.62s cubic-bezier(0.34,1.56,0.64,1) 0.15s',
            }}
          >
            <Typography sx={{ fontWeight: 700, fontSize: '0.88rem', color: '#b81b21', mb: 2 }}>
              Order Progress
            </Typography>
            {(() => {
              const steps = [
                { key: 'pending',    label: 'Placed'       },
                { key: 'confirmed',  label: 'Confirmed'    },
                { key: 'production', label: 'In Production'},
                { key: 'shipping',   label: 'Shipped'      },
                { key: 'received',   label: 'Delivered'    },
              ];
              const activeIdx = 0; // freshly placed
              return (
                <>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    {steps.map((step, idx) => (
                      <Box key={step.key} sx={{ display: 'flex', alignItems: 'center', flex: idx < steps.length - 1 ? 1 : 0 }}>
                        <Box
                          sx={{
                            width: idx === activeIdx ? 14 : 10,
                            height: idx === activeIdx ? 14 : 10,
                            borderRadius: '50%',
                            backgroundColor: idx <= activeIdx ? '#e3242b' : '#e0e0e0',
                            border: idx === activeIdx ? '2px solid #b81b21' : 'none',
                            flexShrink: 0,
                          }}
                        />
                        {idx < steps.length - 1 && (
                          <Box sx={{ flex: 1, height: 2, backgroundColor: idx < activeIdx ? '#e3242b' : '#e0e0e0', mx: 0.3 }} />
                        )}
                      </Box>
                    ))}
                  </Box>
                  <Box sx={{ display: 'flex', mt: 0.8 }}>
                    {steps.map((step, idx) => (
                      <Box key={step.key} sx={{ flex: idx < steps.length - 1 ? 1 : 0, textAlign: idx === 0 ? 'left' : idx === steps.length - 1 ? 'right' : 'center' }}>
                        <Typography sx={{ fontSize: '0.62rem', fontWeight: idx === activeIdx ? 700 : 400, color: idx <= activeIdx ? '#e3242b' : '#aaa', lineHeight: 1.2, whiteSpace: 'nowrap' }}>
                          {step.label}
                        </Typography>
                      </Box>
                    ))}
                  </Box>
                  <Typography sx={{ fontSize: '0.72rem', color: '#888', mt: 1, textAlign: 'center' }}>
                    {items.some((i) => i.nailBedSize)
                      ? 'Custom sets take 4–7 business days to make'
                      : 'Ready-made sets ship within 2–3 business days'}
                  </Typography>
                </>
              );
            })()}
          </Box>
        )}

        {/* What's next */}
        <Box
          sx={{
            background: '#fff',
            borderRadius: 4,
            border: '1.5px solid #F0C8DC',
            p: 2.5,
            mb: 3,
            opacity: show ? 1 : 0,
            transform: show ? 'translateY(0)' : 'translateY(24px)',
            transition: 'all 0.65s cubic-bezier(0.34,1.56,0.64,1) 0.2s',
          }}
        >
          <Typography sx={{ fontWeight: 700, fontSize: '0.88rem', color: '#b81b21', mb: 1.5 }}>
            What happens next?
          </Typography>
          {[
            {
              icon: <WhatsAppIcon sx={{ fontSize: 18, color: '#25D366' }} />,
              text: whatsappUrl
                ? 'Tap "Send Booking to WhatsApp" above to send your appointment details directly to our stylist.'
                : 'You\'ll receive a WhatsApp message from us to confirm details and arrange payment.',
            },
            {
              icon: <AccessTimeIcon sx={{ fontSize: 18, color: '#e3242b' }} />,
              text: isReschedule
                ? 'We\'ll confirm your new appointment slot on WhatsApp and update your booking.'
                : isAppointment
                ? 'We\'ll confirm your appointment slot and send a reminder before your visit.'
                : 'We\'ll update your order status as we prepare and dispatch your items.',
            },
            {
              icon: <StarOutlineIcon sx={{ fontSize: 18, color: '#FFB300' }} />,
              text: isReschedule
                ? 'Your appointment has been updated. View it in My Account → Appointments tab.'
                : `You'll earn loyalty points for this ${isAppointment ? 'appointment' : 'order'} once it's completed — check your Account page.`,
            },
          ].map((step, i) => (
            <Box key={i} sx={{ display: 'flex', gap: 1.5, mb: i < 2 ? 1.2 : 0, alignItems: 'flex-start' }}>
              <Box
                sx={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: '#FFF0F8',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  mt: 0.1,
                }}
              >
                {step.icon}
              </Box>
              <Typography sx={{ fontSize: '0.8rem', color: 'var(--text-muted)', lineHeight: 1.5, pt: 0.5 }}>
                {step.text}
              </Typography>
            </Box>
          ))}
        </Box>

        {/* Discount saved banner */}
        {totalDiscount > 0 && (
          <Box
            sx={{
              background: 'linear-gradient(135deg, #FFF8E1, #FFF3CD)',
              border: '1.5px solid #FFD54F',
              borderRadius: 3,
              p: 1.5,
              mb: 3,
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              opacity: show ? 1 : 0,
              transition: 'opacity 0.7s 0.3s',
            }}
          >
            <LocalOfferIcon sx={{ fontSize: 22, color: '#F9A825', flexShrink: 0 }} />
            <Box>
              <Typography sx={{ fontWeight: 700, fontSize: '0.85rem', color: '#B8860B' }}>
                You saved {formatNaira(totalDiscount)}!
              </Typography>
              <Typography sx={{ fontSize: '0.74rem', color: '#888' }}>
                Great job using your discounts on this order
              </Typography>
            </Box>
          </Box>
        )}

        {/* WhatsApp send button — shown for appointments so the stylist receives details */}
        {whatsappUrl && (
          <Box
            sx={{
              mb: 2.5,
              opacity: show ? 1 : 0,
              transform: show ? 'translateY(0)' : 'translateY(16px)',
              transition: 'all 0.65s cubic-bezier(0.34,1.56,0.64,1) 0.25s',
            }}
          >
            <Box
              sx={{
                p: 1.5,
                mb: 1.5,
                borderRadius: 3,
                background: 'linear-gradient(135deg, #E8F5E9, #F1F8E9)',
                border: '1.5px solid #A5D6A7',
                textAlign: 'center',
              }}
            >
              <Typography sx={{ fontSize: '0.8rem', color: '#2e7d32', fontWeight: 600, mb: 0.3 }}>
                📲 One more step — send your booking to our stylist!
              </Typography>
              <Typography sx={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                Tap below to open WhatsApp with your appointment details pre-filled.
              </Typography>
            </Box>
            <Button
              fullWidth
              component="a"
              href={whatsappUrl}
              startIcon={<WhatsAppIcon />}
              sx={{
                py: 1.5,
                borderRadius: '50px',
                background: 'linear-gradient(135deg, #25D366, #128C7E)',
                color: '#fff',
                fontWeight: 700,
                fontSize: '0.95rem',
                boxShadow: '0 4px 18px rgba(37,211,102,0.35)',
                textDecoration: 'none',
                '&:hover': {
                  background: 'linear-gradient(135deg, #1ebe5d, #0e7063)',
                  boxShadow: '0 6px 24px rgba(37,211,102,0.45)',
                },
              }}
            >
              Send Booking to WhatsApp
            </Button>
          </Box>
        )}

        {/* Action buttons */}
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            gap: 1.5,
            opacity: show ? 1 : 0,
            transform: show ? 'translateY(0)' : 'translateY(16px)',
            transition: 'all 0.7s cubic-bezier(0.34,1.56,0.64,1) 0.3s',
          }}
        >
          <Button
              fullWidth
              onClick={() => navigate('/shop')}
              sx={{
                py: 1.4,
                borderRadius: '50px',
                background: 'linear-gradient(135deg, #e3242b, #b81b21)',
                color: '#fff',
                fontWeight: 700,
                fontSize: '0.9rem',
                boxShadow: '0 4px 16px rgba(227,36,43,0.3)',
                '&:hover': { background: 'linear-gradient(135deg, #b81b21, #8a1318)', boxShadow: '0 6px 20px rgba(227,36,43,0.4)' },
              }}
            >
              Continue Shopping
            </Button>
          <Button
            fullWidth
            onClick={() => navigate('/account')}
            sx={{
              py: 1.2,
              borderRadius: '50px',
              background: 'transparent',
              color: '#888',
              fontWeight: 500,
              fontSize: '0.84rem',
              border: '1.5px solid #E0E0E0',
              '&:hover': { background: '#FAFAFA', borderColor: '#ccc' },
            }}
          >
            View My Account
          </Button>
        </Box>
      </Container>
    </Box>
  );
}
