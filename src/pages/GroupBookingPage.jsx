import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box, Container, Typography, Button, Card, CardContent,
  TextField, Select, MenuItem, FormControl, IconButton,
  Avatar, Chip, Dialog, DialogTitle, DialogContent, DialogActions,
  CircularProgress, LinearProgress,
} from '@mui/material';
import GroupsIcon from '@mui/icons-material/Groups';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import EventNoteIcon from '@mui/icons-material/EventNote';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';

import { serviceCategories } from '../data/services';
import useServiceDiscounts from '../hooks/useServiceDiscounts';
import { getServiceEffectivePrice } from '../lib/discountUtils';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { saveOrder } from '../lib/orderService';
import { fetchBookedSlots, saveBookedSlot } from '../lib/bookedSlotsService';
import NailShapeSelector from '../components/NailShapeSelector';
import NailLengthSelector from '../components/NailLengthSelector';
import CalendarWidget from '../components/CalendarWidget';
import SignInPrompt from '../components/SignInPrompt';

const ff = '"Georgia", serif';
const PINK = '#E91E8C';
const PURPLE = 'var(--text-purple)';
const GROUP_DISCOUNT_PCT = 0.10;
const GROUP_DISCOUNT_MIN = 3;

const LENGTH_SURCHARGE = {
  'XS (Extra Short)': 0,
  'S (Short)':        500,
  'M (Medium)':       1000,
  'L (Long)':         1500,
  'XL (Extra Long)':  2000,
};

const OCCASIONS = [
  { id: 'bridal',    label: 'Bridal Party',   emoji: '💍', sub: 'Celebrate before the big day' },
  { id: 'birthday',  label: 'Birthday Girls',  emoji: '🎂', sub: 'Treat yourself & your crew' },
  { id: 'friends',   label: "Girls' Day Out",  emoji: '👯‍♀️', sub: 'Quality time together' },
  { id: 'corporate', label: 'Work Event',      emoji: '💼', sub: 'Team treat or corporate pampering' },
  { id: 'other',     label: 'Just for Fun',    emoji: '💅', sub: 'Because why not?' },
];

const AVATAR_COLORS = ['#E91E8C', '#9C27B0', '#2196F3', '#FF9800', '#4CAF50', '#F44336', '#00BCD4', '#FF5722'];

const STEPS = ['Occasion & Date', 'Build Your Group', 'Review & Book'];

function formatNaira(n) { return `₦${Number(n || 0).toLocaleString()}`; }

function getMinDate() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().split('T')[0];
}

function isWeekend(ds) {
  if (!ds) return false;
  const day = new Date(ds).getDay();
  return day === 0 || day === 6;
}

function formatDate(ds) {
  if (!ds) return '';
  return new Date(ds).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

const selectSx = {
  fontFamily: ff,
  fontSize: '0.8rem',
  '& fieldset': { borderColor: '#F0C0D0' },
  '&:hover fieldset': { borderColor: PINK },
  '&.Mui-focused fieldset': { borderColor: PINK },
};

// ── Step indicator ──────────────────────────────────────────────
function StepBar({ step }) {
  return (
    <Box sx={{ mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
        {STEPS.map((label, i) => (
          <Box key={i} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1 }}>
            <Box sx={{
              width: 32, height: 32, borderRadius: '50%',
              backgroundColor: i <= step ? PINK : '#F0C0D0',
              color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.82rem', fontWeight: 700, mb: 0.5, transition: 'all 0.3s',
              boxShadow: i === step ? '0 0 0 4px rgba(233,30,140,0.2)' : 'none',
            }}>
              {i < step ? <CheckCircleIcon sx={{ fontSize: '1rem' }} /> : i + 1}
            </Box>
            <Typography sx={{ fontFamily: ff, fontSize: '0.68rem', color: i <= step ? PINK : '#bbb', fontWeight: i === step ? 700 : 400, textAlign: 'center', lineHeight: 1.2 }}>
              {label}
            </Typography>
          </Box>
        ))}
      </Box>
      <LinearProgress
        variant="determinate"
        value={(step / (STEPS.length - 1)) * 100}
        sx={{ height: 4, borderRadius: 2, backgroundColor: '#F0C0D0', '& .MuiLinearProgress-bar': { backgroundColor: PINK } }}
      />
    </Box>
  );
}

// ── Person card in group builder ────────────────────────────────
function PersonCard({ person, index, isLead, allServices, discounts, onChangeName, onChangeService, onChangeNailShape, onChangeNailLength, onRemove }) {
  const service = allServices.find(s => s.id === person.serviceId);
  const surcharge = LENGTH_SURCHARGE[person.nailLength] ?? 0;
  const price = service ? getServiceEffectivePrice(service, discounts) + surcharge : 0;
  const initials = (person.name || (isLead ? 'You' : '?')).slice(0, 2).toUpperCase();
  const color = AVATAR_COLORS[index % AVATAR_COLORS.length];

  return (
    <Card elevation={0} sx={{
      borderRadius: 3,
      border: `1.5px solid ${person.serviceId && person.nailShape && person.nailLength ? PINK : '#F0C0D0'}`,
      backgroundColor: person.serviceId ? '#FFF8FC' : '#fafafa',
      mb: 1.5, transition: 'all 0.2s',
    }}>
      <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
          <Avatar sx={{ backgroundColor: color, width: 40, height: 40, fontSize: '0.85rem', fontWeight: 700, flexShrink: 0, mt: 0.5 }}>
            {initials}
          </Avatar>
          <Box sx={{ flex: 1, minWidth: 0 }}>
            {isLead ? (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.8 }}>
                <Typography sx={{ fontFamily: ff, fontSize: '0.88rem', fontWeight: 700, color: PURPLE }}>
                  {person.name || 'You (lead)'}
                </Typography>
                <Chip label="Lead" size="small" sx={{ backgroundColor: PINK, color: '#fff', fontSize: '0.65rem', height: 18, fontFamily: ff }} />
              </Box>
            ) : (
              <TextField
                size="small"
                placeholder={`Person ${index + 1} name`}
                value={person.name}
                onChange={e => onChangeName(e.target.value)}
                fullWidth
                sx={{ mb: 0.8, '& .MuiOutlinedInput-root': { borderRadius: 2, '& fieldset': { borderColor: '#F0C0D0' }, '&:hover fieldset': { borderColor: PINK }, '&.Mui-focused fieldset': { borderColor: PINK } } }}
                InputProps={{ sx: { fontFamily: ff, fontSize: '0.85rem' } }}
              />
            )}

            {/* Service picker */}
            <FormControl size="small" fullWidth>
              <Select
                value={person.serviceId}
                onChange={e => onChangeService(e.target.value)}
                displayEmpty
                sx={selectSx}
              >
                <MenuItem value="" disabled sx={{ fontFamily: ff, fontSize: '0.82rem', color: '#aaa' }}>
                  Select service…
                </MenuItem>
                {allServices.filter(s => !s.comingSoon).map(s => (
                  <MenuItem key={s.id} value={s.id} sx={{ fontFamily: ff, fontSize: '0.82rem' }}>
                    {s.name} — {formatNaira(getServiceEffectivePrice(s, discounts))}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Per-person nail shape + length — visual selectors, shown once a service is selected */}
            {person.serviceId && (
              <Box sx={{ mt: 1.5 }}>
                <Typography sx={{ fontFamily: ff, fontSize: '0.75rem', fontWeight: 700, color: PURPLE, mb: 0.6 }}>
                  Nail Shape
                </Typography>
                <NailShapeSelector value={person.nailShape} onChange={onChangeNailShape} />
                <Typography sx={{ fontFamily: ff, fontSize: '0.75rem', fontWeight: 700, color: PURPLE, mb: 0.6, mt: 1.5 }}>
                  Nail Length
                </Typography>
                <NailLengthSelector value={person.nailLength} onChange={onChangeNailLength} surcharges={LENGTH_SURCHARGE} />
              </Box>
            )}
          </Box>

          <Box sx={{ textAlign: 'right', flexShrink: 0 }}>
            {price > 0 && (
              <Box sx={{ mt: 0.5 }}>
                <Typography sx={{ fontFamily: ff, fontWeight: 700, color: PINK, fontSize: '0.95rem' }}>
                  {formatNaira(price)}
                </Typography>
                {surcharge > 0 && (
                  <Typography sx={{ fontFamily: ff, fontSize: '0.68rem', color: '#7b1fa2', lineHeight: 1.2 }}>
                    +{formatNaira(surcharge)} length
                  </Typography>
                )}
              </Box>
            )}
            {!isLead && (
              <IconButton size="small" onClick={onRemove} sx={{ color: '#ccc', '&:hover': { color: '#d32f2f' }, p: 0.5, mt: 0.3 }}>
                <DeleteOutlineIcon fontSize="small" />
              </IconButton>
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

// ── Main page ───────────────────────────────────────────────────
export default function GroupBookingPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { discounts } = useServiceDiscounts();
  const { showToast } = useNotifications();

  const allServices = serviceCategories
    .filter(cat => !cat.comingSoon)
    .flatMap(cat => cat.services.map(s => ({ ...s, category: cat.title })));

  // Step state
  const [step, setStep] = useState(0);

  // Step 1
  const [occasion, setOccasion] = useState('');
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('');
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [bookedSlots, setBookedSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);

  // Step 2 — lead + members each carry their own nail prefs
  const [leadName, setLeadName] = useState('');
  const [leadServiceId, setLeadServiceId] = useState('');
  const [leadNailShape, setLeadNailShape] = useState('');
  const [leadNailLength, setLeadNailLength] = useState('');
  const [members, setMembers] = useState([{ name: '', serviceId: '', nailShape: '', nailLength: '' }]);

  const [submitting, setSubmitting] = useState(false);
  const [signInOpen, setSignInOpen] = useState(false);

  // Pre-fill name from auth
  useEffect(() => {
    if (user?.displayName && !leadName) setLeadName(user.displayName);
  }, [user]);

  // Load booked slots when date changes
  useEffect(() => {
    if (!appointmentDate || !isWeekend(appointmentDate)) { setBookedSlots([]); return; }
    setSlotsLoading(true);
    fetchBookedSlots(formatDate(appointmentDate))
      .then(slots => { setBookedSlots(slots); setAppointmentTime(p => slots.includes(p) ? '' : p); })
      .catch(() => setBookedSlots([]))
      .finally(() => setSlotsLoading(false));
  }, [appointmentDate]);

  // ── Derived values ──
  const allPeople = [
    { name: leadName, serviceId: leadServiceId, nailShape: leadNailShape, nailLength: leadNailLength },
    ...members,
  ];
  const groupSize = allPeople.length;

  const subtotal = allPeople.reduce((sum, p) => {
    const svc = allServices.find(s => s.id === p.serviceId);
    return sum + (svc ? getServiceEffectivePrice(svc, discounts) : 0) + (LENGTH_SURCHARGE[p.nailLength] ?? 0);
  }, 0);

  const discountApplies = groupSize >= GROUP_DISCOUNT_MIN;
  const discountAmount = discountApplies ? Math.round(subtotal * GROUP_DISCOUNT_PCT) : 0;
  const total = subtotal - discountAmount;
  const deposit = Math.round(total * 0.5);
  const toDiscount = Math.max(0, GROUP_DISCOUNT_MIN - groupSize);

  // ── Validation ──
  const step1Valid = occasion && appointmentDate && isWeekend(appointmentDate) && appointmentTime;
  const step2Valid =
    leadName.trim() && leadServiceId && leadNailShape && leadNailLength &&
    members.every(m => m.name.trim() && m.serviceId && m.nailShape && m.nailLength);

  // ── Member helpers ──
  const addMember = () => setMembers(p => [...p, { name: '', serviceId: '', nailShape: '', nailLength: '' }]);
  const removeMember = i => setMembers(p => p.filter((_, idx) => idx !== i));
  const updateMember = (i, field, val) => setMembers(p => p.map((m, idx) => idx === i ? { ...m, [field]: val } : m));

  // ── Book handler ──
  const handleBook = async () => {
    if (!user) { setSignInOpen(true); return; }

    setSubmitting(true);
    const fullDate = `${formatDate(appointmentDate)} at ${appointmentTime}`;
    const occasionObj = OCCASIONS.find(o => o.id === occasion);

    const groupLines = allPeople.map((p, i) => {
      const svc = allServices.find(s => s.id === p.serviceId);
      const surcharge = LENGTH_SURCHARGE[p.nailLength] ?? 0;
      const personPrice = (svc ? getServiceEffectivePrice(svc, discounts) : 0) + surcharge;
      return `${i + 1}. ${p.name} — ${svc?.name || ''} (${formatNaira(personPrice)}${surcharge > 0 ? ` incl. +${formatNaira(surcharge)} length` : ''}) · Shape: ${p.nailShape}, Length: ${p.nailLength}`;
    }).join('\n');

    const message = `Hi! I'd like to book a GROUP appointment.

Occasion: ${occasionObj?.emoji} ${occasionObj?.label}
Lead: ${leadName}
Date: ${fullDate}

👥 GROUP (${groupSize} people):
${groupLines}${discountApplies ? `\n\n10% Group Discount: -${formatNaira(discountAmount)}\nGroup Total: ${formatNaira(total)}` : `\n\nSubtotal: ${formatNaira(subtotal)}`}

50% Deposit Required: ${formatNaira(deposit)}

Please confirm availability. Thank you!`;

    window.open(`https://api.whatsapp.com/send?phone=2349053714197&text=${encodeURIComponent(message)}`, '_blank');

    try {
      const orderItems = allPeople.map(p => {
        const svc = allServices.find(s => s.id === p.serviceId);
        const surcharge = LENGTH_SURCHARGE[p.nailLength] ?? 0;
        return { kind: 'service', serviceName: svc?.name || '', price: (svc ? getServiceEffectivePrice(svc, discounts) : 0) + surcharge, guestName: p.name, date: fullDate, nailShape: p.nailShape, nailLength: p.nailLength };
      });

      const orderRef = await saveOrder(user.uid, {
        type: 'service',
        total,
        customerName: leadName.trim(),
        email: user.email || '',
        appointmentDate: fullDate,
        isGroup: true,
        groupSize,
        occasion: occasionObj?.label || '',
        items: orderItems,
      });

      saveBookedSlot({ date: formatDate(appointmentDate), time: appointmentTime, orderId: orderRef.id, uid: user.uid }).catch(() => {});
    } catch (_) { /* WhatsApp message already sent */ }

    navigate('/thank-you', {
      state: {
        type: 'service',
        customerName: leadName,
        serviceName: `Group Booking — ${OCCASIONS.find(o => o.id === occasion)?.label || ''}`,
        appointmentDate: fullDate,
        total,
        finalTotal: total,
        depositAmount: deposit,
        isGroup: true,
        groupSize,
        items: allPeople.map(p => {
          const svc = allServices.find(s => s.id === p.serviceId);
          const surcharge = LENGTH_SURCHARGE[p.nailLength] ?? 0;
          return { kind: 'service', serviceName: svc?.name || '', price: (svc ? getServiceEffectivePrice(svc, discounts) : 0) + surcharge, guestName: p.name, date: fullDate, nailShape: p.nailShape, nailLength: p.nailLength };
        }),
      },
    });
    setSubmitting(false);
  };

  // ── Render ──
  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#FFF0F8', pt: { xs: 8, md: 9 }, pb: 12 }}>
      {/* Hero header */}
      <Box sx={{ background: `linear-gradient(135deg, ${PURPLE} 0%, #7B1FA2 60%, ${PINK} 100%)`, py: { xs: 5, md: 6 }, textAlign: 'center', mb: 4 }}>
        <Box sx={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 64, height: 64, borderRadius: '50%', backgroundColor: 'rgba(255,255,255,0.15)', mb: 1.5 }}>
          <GroupsIcon sx={{ fontSize: '2rem', color: '#fff' }} />
        </Box>
        <Typography variant="h3" sx={{ fontFamily: ff, fontWeight: 700, color: '#fff', fontSize: { xs: '1.7rem', md: '2.2rem' }, mb: 0.5 }}>
          Group & Bridal Booking
        </Typography>
        <Typography sx={{ fontFamily: ff, color: 'rgba(255,255,255,0.8)', fontSize: '0.95rem' }}>
          Book for multiple people · Groups of 3+ get 10% off
        </Typography>
      </Box>

      <Container maxWidth="sm">
        <StepBar step={step} />

        {/* ── Step 1: Occasion & Date ── */}
        {step === 0 && (
          <Box>
            <Typography sx={{ fontFamily: ff, fontWeight: 700, color: PURPLE, fontSize: '1.1rem', mb: 0.5 }}>
              What's the occasion?
            </Typography>
            <Typography sx={{ fontFamily: ff, fontSize: '0.85rem', color: '#888', mb: 2 }}>
              This helps us prepare the right experience for your group.
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 1.5, mb: 3 }}>
              {OCCASIONS.map(occ => (
                <Box
                  key={occ.id}
                  onClick={() => setOccasion(occ.id)}
                  sx={{
                    p: 2, borderRadius: 3, cursor: 'pointer', textAlign: 'center',
                    border: `2px solid ${occasion === occ.id ? PINK : '#F0C0D0'}`,
                    backgroundColor: occasion === occ.id ? '#FFF0F8' : '#fff',
                    transition: 'all 0.2s',
                    boxShadow: occasion === occ.id ? '0 4px 16px rgba(233,30,140,0.15)' : 'none',
                    '&:hover': { borderColor: PINK, backgroundColor: '#FFF0F8' },
                  }}
                >
                  <Typography sx={{ fontSize: '1.8rem', mb: 0.5, lineHeight: 1 }}>{occ.emoji}</Typography>
                  <Typography sx={{ fontFamily: ff, fontWeight: 700, color: PURPLE, fontSize: '0.85rem', mb: 0.3 }}>{occ.label}</Typography>
                  <Typography sx={{ fontFamily: ff, fontSize: '0.7rem', color: '#999', lineHeight: 1.3 }}>{occ.sub}</Typography>
                  {occasion === occ.id && (
                    <CheckCircleIcon sx={{ color: PINK, fontSize: '1rem', mt: 0.5 }} />
                  )}
                </Box>
              ))}
            </Box>

            <Typography sx={{ fontFamily: ff, fontWeight: 700, color: PURPLE, fontSize: '1.1rem', mb: 1.5 }}>
              Pick a date &amp; time
            </Typography>
            <Box
              onClick={() => setCalendarOpen(true)}
              sx={{
                display: 'flex', alignItems: 'center', gap: 1.5, p: 2, borderRadius: 2,
                border: `1.5px solid ${appointmentDate && appointmentTime ? PINK : '#F0C0D0'}`,
                backgroundColor: '#fff', cursor: 'pointer',
                '&:hover': { borderColor: PINK },
              }}
            >
              <EventNoteIcon sx={{ color: PINK, fontSize: 22 }} />
              <Box sx={{ flex: 1 }}>
                <Typography sx={{ fontFamily: ff, fontSize: '0.9rem', color: appointmentDate && appointmentTime ? '#222' : '#aaa' }}>
                  {appointmentDate && appointmentTime
                    ? `${formatDate(appointmentDate)} · ${appointmentTime}`
                    : 'Tap to select date & time'}
                </Typography>
                <Typography sx={{ fontFamily: ff, fontSize: '0.72rem', color: '#aaa' }}>
                  Weekends only · 12 PM – 5 PM
                </Typography>
              </Box>
              {(appointmentDate || appointmentTime) && (
                <Typography
                  onClick={e => { e.stopPropagation(); setAppointmentDate(''); setAppointmentTime(''); }}
                  sx={{ fontSize: '0.72rem', color: PINK, cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                >
                  Clear
                </Typography>
              )}
            </Box>

            {appointmentDate && !isWeekend(appointmentDate) && (
              <Typography sx={{ fontFamily: ff, fontSize: '0.8rem', color: '#d32f2f', mt: 1 }}>
                Please select a Saturday or Sunday.
              </Typography>
            )}
          </Box>
        )}

        {/* ── Step 2: Build Your Group ── */}
        {step === 1 && (
          <Box>
            <Typography sx={{ fontFamily: ff, fontWeight: 700, color: PURPLE, fontSize: '1.1rem', mb: 0.5 }}>
              Build your group
            </Typography>
            <Typography sx={{ fontFamily: ff, fontSize: '0.85rem', color: '#888', mb: 2 }}>
              Each person picks their own service, nail shape, and length.
            </Typography>

            {/* Lead name field */}
            <TextField
              size="small"
              label="Your Name"
              value={leadName}
              onChange={e => setLeadName(e.target.value)}
              fullWidth
              sx={{ mb: 1.5, '& .MuiOutlinedInput-root': { borderRadius: 2, '& fieldset': { borderColor: '#F0C0D0' }, '&:hover fieldset': { borderColor: PINK }, '&.Mui-focused fieldset': { borderColor: PINK } } }}
              InputProps={{ sx: { fontFamily: ff } }}
              InputLabelProps={{ sx: { fontFamily: ff } }}
            />

            {/* Person cards */}
            <PersonCard
              person={{ name: leadName, serviceId: leadServiceId, nailShape: leadNailShape, nailLength: leadNailLength }}
              index={0}
              isLead
              allServices={allServices}
              discounts={discounts}
              onChangeName={() => {}}
              onChangeService={v => setLeadServiceId(v)}
              onChangeNailShape={v => setLeadNailShape(v)}
              onChangeNailLength={v => setLeadNailLength(v)}
              onRemove={() => {}}
            />
            {members.map((m, i) => (
              <PersonCard
                key={i}
                person={m}
                index={i + 1}
                isLead={false}
                allServices={allServices}
                discounts={discounts}
                onChangeName={v => updateMember(i, 'name', v)}
                onChangeService={v => updateMember(i, 'serviceId', v)}
                onChangeNailShape={v => updateMember(i, 'nailShape', v)}
                onChangeNailLength={v => updateMember(i, 'nailLength', v)}
                onRemove={() => removeMember(i)}
              />
            ))}

            <Button
              startIcon={<AddIcon />}
              onClick={addMember}
              sx={{
                fontFamily: ff, fontSize: '0.85rem', color: PINK, border: `1.5px dashed ${PINK}`,
                borderRadius: 2, px: 2, py: 1, mt: 0.5, width: '100%',
                '&:hover': { backgroundColor: '#FFF0F8' },
              }}
            >
              Add Another Person
            </Button>

            {/* Discount progress nudge */}
            <Box sx={{ mt: 2, p: 2, borderRadius: 3, backgroundColor: discountApplies ? '#e8f5e9' : '#fff', border: `1.5px solid ${discountApplies ? '#a5d6a7' : '#F0C0D0'}`, transition: 'all 0.3s' }}>
              {discountApplies ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <LocalOfferIcon sx={{ color: '#2e7d32', fontSize: '1.1rem' }} />
                  <Typography sx={{ fontFamily: ff, fontSize: '0.88rem', color: '#2e7d32', fontWeight: 700 }}>
                    10% group discount unlocked! 🎉
                  </Typography>
                </Box>
              ) : (
                <>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.8 }}>
                    <Typography sx={{ fontFamily: ff, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      {toDiscount === 0 ? 'Almost there!' : `Add ${toDiscount} more ${toDiscount === 1 ? 'person' : 'people'} to unlock 10% off`}
                    </Typography>
                    <Typography sx={{ fontFamily: ff, fontSize: '0.82rem', color: PINK, fontWeight: 700 }}>
                      {groupSize}/{GROUP_DISCOUNT_MIN}
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min((groupSize / GROUP_DISCOUNT_MIN) * 100, 100)}
                    sx={{ height: 6, borderRadius: 3, backgroundColor: '#F0C0D0', '& .MuiLinearProgress-bar': { backgroundColor: PINK } }}
                  />
                </>
              )}
              {subtotal > 0 && (
                <Box sx={{ mt: 1.5, pt: 1.5, borderTop: '1px solid #eee', display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography sx={{ fontFamily: ff, fontSize: '0.82rem', color: 'var(--text-muted)' }}>Subtotal ({groupSize} people)</Typography>
                    <Typography sx={{ fontFamily: ff, fontSize: '0.82rem', color: 'var(--text-main)', fontWeight: 600 }}>{formatNaira(subtotal)}</Typography>
                  </Box>
                  {discountApplies && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography sx={{ fontFamily: ff, fontSize: '0.82rem', color: '#2e7d32', fontWeight: 600 }}>10% Discount</Typography>
                      <Typography sx={{ fontFamily: ff, fontSize: '0.82rem', color: '#2e7d32', fontWeight: 600 }}>-{formatNaira(discountAmount)}</Typography>
                    </Box>
                  )}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #ddd', pt: 0.5 }}>
                    <Typography sx={{ fontFamily: ff, fontSize: '0.9rem', fontWeight: 700, color: PURPLE }}>Total</Typography>
                    <Typography sx={{ fontFamily: ff, fontSize: '0.9rem', fontWeight: 700, color: PURPLE }}>{formatNaira(total)}</Typography>
                  </Box>
                </Box>
              )}
            </Box>
          </Box>
        )}

        {/* ── Step 3: Review & Book ── */}
        {step === 2 && (
          <Box>
            <Typography sx={{ fontFamily: ff, fontWeight: 700, color: PURPLE, fontSize: '1.1rem', mb: 0.5 }}>
              Review your booking
            </Typography>
            <Typography sx={{ fontFamily: ff, fontSize: '0.85rem', color: '#888', mb: 2 }}>
              Check everything looks right, then send your booking request.
            </Typography>

            {/* Occasion + Date summary */}
            <Card elevation={0} sx={{ borderRadius: 3, border: '1.5px solid #F0C0D0', backgroundColor: '#fff', mb: 2 }}>
              <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography sx={{ fontFamily: ff, fontSize: '0.75rem', color: '#aaa', mb: 0.3 }}>OCCASION</Typography>
                    <Typography sx={{ fontFamily: ff, fontWeight: 700, color: PURPLE, fontSize: '0.95rem' }}>
                      {OCCASIONS.find(o => o.id === occasion)?.emoji} {OCCASIONS.find(o => o.id === occasion)?.label}
                    </Typography>
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography sx={{ fontFamily: ff, fontSize: '0.75rem', color: '#aaa', mb: 0.3 }}>DATE & TIME</Typography>
                    <Typography sx={{ fontFamily: ff, fontWeight: 700, color: PURPLE, fontSize: '0.88rem' }}>
                      {formatDate(appointmentDate)}
                    </Typography>
                    <Typography sx={{ fontFamily: ff, fontSize: '0.82rem', color: PINK }}>{appointmentTime}</Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>

            {/* People + services */}
            <Typography sx={{ fontFamily: ff, fontWeight: 700, color: PURPLE, fontSize: '0.9rem', mb: 1 }}>
              Group ({groupSize} people)
            </Typography>
            {allPeople.map((p, i) => {
              const svc = allServices.find(s => s.id === p.serviceId);
              const surcharge = LENGTH_SURCHARGE[p.nailLength] ?? 0;
              const price = svc ? getServiceEffectivePrice(svc, discounts) + surcharge : 0;
              const color = AVATAR_COLORS[i % AVATAR_COLORS.length];
              return (
                <Box key={i} sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, mb: 1, p: 1.5, borderRadius: 2, backgroundColor: '#fff', border: '1px solid #F0C0D0' }}>
                  <Avatar sx={{ backgroundColor: color, width: 36, height: 36, fontSize: '0.8rem', fontWeight: 700, flexShrink: 0, mt: 0.25 }}>
                    {(p.name || '?').slice(0, 2).toUpperCase()}
                  </Avatar>
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontFamily: ff, fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-main)' }}>
                      {p.name} {i === 0 && <Chip label="Lead" size="small" sx={{ backgroundColor: PINK, color: '#fff', fontSize: '0.6rem', height: 16, ml: 0.5 }} />}
                    </Typography>
                    <Typography sx={{ fontFamily: ff, fontSize: '0.78rem', color: 'var(--text-muted)' }}>{svc?.name || '—'}</Typography>
                    {p.nailShape && p.nailLength && (
                      <Typography sx={{ fontFamily: ff, fontSize: '0.72rem', color: '#999', mt: 0.2 }}>
                        {p.nailShape} · {p.nailLength}
                      </Typography>
                    )}
                  </Box>
                  <Typography sx={{ fontFamily: ff, fontWeight: 700, color: PINK, fontSize: '0.9rem', flexShrink: 0 }}>
                    {formatNaira(price)}
                  </Typography>
                </Box>
              );
            })}

            {/* Price breakdown */}
            <Card elevation={0} sx={{ borderRadius: 3, border: `1.5px solid ${discountApplies ? '#a5d6a7' : '#F0C0D0'}`, backgroundColor: discountApplies ? '#f0fdf4' : '#fff', mt: 1.5, mb: 3 }}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.6 }}>
                  <Typography sx={{ fontFamily: ff, fontSize: '0.85rem', color: 'var(--text-muted)' }}>Subtotal</Typography>
                  <Typography sx={{ fontFamily: ff, fontSize: '0.85rem', color: 'var(--text-main)' }}>{formatNaira(subtotal)}</Typography>
                </Box>
                {discountApplies && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.6 }}>
                    <Typography sx={{ fontFamily: ff, fontSize: '0.85rem', color: '#2e7d32', fontWeight: 600 }}>10% Group Discount 🎉</Typography>
                    <Typography sx={{ fontFamily: ff, fontSize: '0.85rem', color: '#2e7d32', fontWeight: 600 }}>-{formatNaira(discountAmount)}</Typography>
                  </Box>
                )}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #e0e0e0', pt: 0.8, mt: 0.4 }}>
                  <Typography sx={{ fontFamily: ff, fontWeight: 700, color: PURPLE }}>Total</Typography>
                  <Typography sx={{ fontFamily: ff, fontWeight: 700, color: PURPLE }}>{formatNaira(total)}</Typography>
                </Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5, p: 1, borderRadius: 2, backgroundColor: '#FFF0F8' }}>
                  <Typography sx={{ fontFamily: ff, fontSize: '0.82rem', color: PINK, fontWeight: 600 }}>50% Deposit Required</Typography>
                  <Typography sx={{ fontFamily: ff, fontSize: '0.82rem', color: PINK, fontWeight: 700 }}>{formatNaira(deposit)}</Typography>
                </Box>
              </CardContent>
            </Card>

            <Box sx={{ p: 2, borderRadius: 2, backgroundColor: '#FFF8E1', border: '1px solid #FFD54F' }}>
              <Typography sx={{ fontFamily: ff, fontSize: '0.8rem', color: '#5D4037', lineHeight: 1.6 }}>
                Tapping "Send Booking Request" will open WhatsApp with your full group details. Our stylist will confirm availability and arrange the 50% deposit.
              </Typography>
            </Box>
          </Box>
        )}

        {/* ── Navigation buttons ── */}
        <Box sx={{ mt: 4, display: 'flex', gap: 1.5 }}>
          {step > 0 && (
            <Button
              startIcon={<ArrowBackIcon />}
              onClick={() => setStep(s => s - 1)}
              variant="outlined"
              sx={{ fontFamily: ff, flex: 1, py: 1.4, borderRadius: '30px', borderColor: '#F0C0D0', color: '#888', '&:hover': { borderColor: PINK, color: PINK, backgroundColor: '#FFF0F8' } }}
            >
              Back
            </Button>
          )}
          {step < STEPS.length - 1 ? (
            <Button
              endIcon={<ArrowForwardIcon />}
              onClick={() => setStep(s => s + 1)}
              disabled={step === 0 ? !step1Valid : !step2Valid}
              sx={{
                fontFamily: ff, fontWeight: 700, flex: 2, py: 1.4, borderRadius: '30px',
                background: `linear-gradient(135deg, ${PINK}, #9C27B0)`,
                color: '#fff', boxShadow: '0 4px 16px rgba(233,30,140,0.3)',
                '&:hover': { boxShadow: '0 6px 20px rgba(233,30,140,0.45)' },
                '&.Mui-disabled': { background: '#F0C0D0', color: '#fff', boxShadow: 'none' },
              }}
            >
              {step === 0 ? 'Build Your Group' : 'Review Booking'}
            </Button>
          ) : (
            <Button
              onClick={handleBook}
              disabled={submitting}
              sx={{
                fontFamily: ff, fontWeight: 700, flex: 2, py: 1.4, borderRadius: '30px',
                background: `linear-gradient(135deg, #25D366, #128C7E)`,
                color: '#fff', fontSize: '0.95rem',
                boxShadow: '0 4px 16px rgba(37,211,102,0.3)',
                '&:hover': { boxShadow: '0 6px 20px rgba(37,211,102,0.45)' },
                '&.Mui-disabled': { background: '#c8e6c9', color: '#fff', boxShadow: 'none' },
              }}
            >
              {submitting ? <CircularProgress size={20} sx={{ color: '#fff' }} /> : 'Send Booking Request'}
            </Button>
          )}
        </Box>
      </Container>

      {/* Calendar dialog */}
      <Dialog open={calendarOpen} onClose={() => setCalendarOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontFamily: ff, fontWeight: 700, pb: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          Select Date &amp; Time
          <Box onClick={() => setCalendarOpen(false)} sx={{ cursor: 'pointer', color: '#aaa', fontSize: '1.3rem', lineHeight: 1, '&:hover': { color: 'var(--text-muted)' } }}>✕</Box>
        </DialogTitle>
        <DialogContent sx={{ pt: '12px !important' }}>
          <CalendarWidget
            selectedDate={appointmentDate}
            onDateChange={setAppointmentDate}
            selectedTime={appointmentTime}
            onTimeChange={setAppointmentTime}
            minDate={getMinDate()}
            bookedSlots={bookedSlots}
            slotsLoading={slotsLoading}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setCalendarOpen(false)} sx={{ color: '#777', fontFamily: ff, textTransform: 'none' }}>Cancel</Button>
          <Button
            onClick={() => setCalendarOpen(false)}
            disabled={!appointmentDate || !appointmentTime}
            sx={{ backgroundColor: PINK, color: '#fff', borderRadius: '20px', px: 3, fontFamily: ff, fontWeight: 600, textTransform: 'none', '&:hover': { backgroundColor: '#C2185B' }, '&.Mui-disabled': { backgroundColor: '#F0C0D0', color: '#fff' } }}
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      <SignInPrompt open={signInOpen} onClose={() => setSignInOpen(false)} />
    </Box>
  );
}
