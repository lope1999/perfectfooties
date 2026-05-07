import { useState } from 'react';
import { Box, Typography, Button } from '@mui/material';

export const CALENDAR_MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
export const CALENDAR_DAYS = ['Su','Mo','Tu','We','Th','Fr','Sa'];
export const TIME_SLOTS_LIST = ['12:00 PM','1:00 PM','2:00 PM','3:00 PM','4:00 PM','5:00 PM'];

export default function CalendarWidget({ selectedDate, onDateChange, selectedTime, onTimeChange, minDate, bookedSlots, slotsLoading, onJoinWaitlist }) {
  const minDateObj = minDate ? new Date(minDate + 'T00:00:00') : new Date();
  const initYear = selectedDate ? new Date(selectedDate + 'T00:00:00').getFullYear() : minDateObj.getFullYear();
  const initMonth = selectedDate ? new Date(selectedDate + 'T00:00:00').getMonth() : minDateObj.getMonth();
  const [viewYear, setViewYear] = useState(initYear);
  const [viewMonth, setViewMonth] = useState(initMonth);

  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells = Array(firstDay).fill(null).concat(Array.from({ length: daysInMonth }, (_, i) => i + 1));

  const isWeekendDay = (d) => { const day = new Date(viewYear, viewMonth, d).getDay(); return day === 0 || day === 6; };
  const isBeforeMin = (d) => new Date(viewYear, viewMonth, d) < minDateObj;
  const isSelectable = (d) => d && isWeekendDay(d) && !isBeforeMin(d);
  const isSelected = (d) => {
    if (!d || !selectedDate) return false;
    const s = new Date(selectedDate + 'T00:00:00');
    return viewYear === s.getFullYear() && viewMonth === s.getMonth() && d === s.getDate();
  };

  const handleDay = (d) => {
    if (!isSelectable(d)) return;
    const mm = String(viewMonth + 1).padStart(2, '0');
    const dd = String(d).padStart(2, '0');
    onDateChange(`${viewYear}-${mm}-${dd}`);
    onTimeChange('');
  };

  const canPrev = () => {
    const now = new Date();
    return viewYear > now.getFullYear() || (viewYear === now.getFullYear() && viewMonth > now.getMonth());
  };
  const prevMonth = () => { if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); } else setViewMonth(m => m - 1); };
  const nextMonth = () => { if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); } else setViewMonth(m => m + 1); };

  return (
    <Box>
      {/* Month nav */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
        <Box onClick={() => canPrev() && prevMonth()} sx={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', cursor: canPrev() ? 'pointer' : 'default', color: canPrev() ? '#e3242b' : '#ccc', fontSize: '1.3rem', fontWeight: 700, userSelect: 'none', '&:hover': canPrev() ? { backgroundColor: '#FFF8F0' } : {} }}>‹</Box>
        <Typography sx={{ fontFamily: '"Georgia", serif', fontWeight: 700, color: 'var(--text-purple)', fontSize: '1rem' }}>{CALENDAR_MONTHS[viewMonth]} {viewYear}</Typography>
        <Box onClick={nextMonth} sx={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', cursor: 'pointer', color: '#e3242b', fontSize: '1.3rem', fontWeight: 700, userSelect: 'none', '&:hover': { backgroundColor: 'var(--bg-soft)' } }}>›</Box>
      </Box>

      {/* Day headers */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', mb: 0.5 }}>
        {CALENDAR_DAYS.map((h, i) => (
          <Typography key={h} sx={{ textAlign: 'center', fontSize: '0.72rem', fontWeight: 700, color: (i === 0 || i === 6) ? '#e3242b' : '#999', py: 0.5 }}>{h}</Typography>
        ))}
      </Box>

      {/* Day cells */}
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
        {cells.map((d, idx) => {
          if (!d) return <Box key={`e-${idx}`} sx={{ aspectRatio: '1' }} />;
          const sel = isSelected(d);
          const selectable = isSelectable(d);
          const weekend = isWeekendDay(d);
          return (
            <Box key={d} onClick={() => handleDay(d)} sx={{ aspectRatio: '1', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: '50%', cursor: selectable ? 'pointer' : 'default', backgroundColor: sel ? '#e3242b' : 'transparent', color: sel ? '#fff' : selectable ? '#333' : '#ccc', fontWeight: sel ? 700 : (weekend && selectable) ? 600 : 400, fontSize: '0.85rem', transition: 'all 0.15s', '&:hover': selectable ? { backgroundColor: sel ? '#b81b21' : 'var(--bg-soft)', color: sel ? '#fff' : '#e3242b' } : {} }}>
              {d}
            </Box>
          );
        })}
      </Box>

      {/* Time slots */}
      {selectedDate && (() => {
        const fullyBooked = !slotsLoading && bookedSlots.length >= TIME_SLOTS_LIST.length;
        return (
          <Box sx={{ mt: 2.5, pt: 2, borderTop: '1px solid #E8D5B0' }}>
            {slotsLoading ? (
              <>
                <Typography sx={{ fontFamily: '"Georgia", serif', fontWeight: 700, color: 'var(--text-purple)', mb: 1.5, fontSize: '0.95rem' }}>Checking availability…</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {TIME_SLOTS_LIST.map((s) => <Box key={s} sx={{ width: 90, height: 36, borderRadius: '18px', backgroundColor: '#f0f0f0' }} />)}
                </Box>
              </>
            ) : fullyBooked ? (
              <Box sx={{ textAlign: 'center', py: 1.5 }}>
                <Typography sx={{ fontFamily: '"Georgia", serif', fontWeight: 700, color: '#d32f2f', mb: 0.5, fontSize: '0.95rem' }}>This date is fully booked</Typography>
                <Typography sx={{ fontSize: '0.8rem', color: '#777', mb: 2 }}>All time slots are taken. Join the waitlist and we'll notify you if a spot opens up.</Typography>
                <Button onClick={() => onJoinWaitlist && onJoinWaitlist(selectedDate)} sx={{ border: '2px solid #e3242b', borderRadius: '30px', color: '#e3242b', px: 3, py: 0.8, fontFamily: '"Georgia", serif', fontWeight: 600, fontSize: '0.85rem', '&:hover': { backgroundColor: '#e3242b', color: '#fff' } }}>
                  Join Waitlist
                </Button>
              </Box>
            ) : (
              <>
                <Typography sx={{ fontFamily: '"Georgia", serif', fontWeight: 700, color: 'var(--text-purple)', mb: 1.5, fontSize: '0.95rem' }}>Select a Time</Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {TIME_SLOTS_LIST.map((slot) => {
                    const booked = bookedSlots.includes(slot);
                    const picked = selectedTime === slot;
                    return (
                      <Box key={slot} onClick={() => !booked && onTimeChange(slot)} sx={{ px: 2, py: 0.8, borderRadius: '20px', border: picked ? '2px solid #e3242b' : booked ? '1.5px solid #ddd' : '1.5px solid #E8D5B0', backgroundColor: picked ? '#e3242b' : booked ? 'var(--bg-soft)' : 'var(--bg-card)', color: picked ? '#fff' : booked ? '#bbb' : '#333', cursor: booked ? 'not-allowed' : 'pointer', fontSize: '0.82rem', fontWeight: picked ? 700 : 500, textDecoration: booked ? 'line-through' : 'none', transition: 'all 0.15s', userSelect: 'none', '&:hover': !booked ? { borderColor: '#e3242b', color: picked ? '#fff' : '#e3242b' } : {} }}>
                        {slot}{booked && <Typography component="span" sx={{ fontSize: '0.65rem', color: '#d32f2f', ml: 0.5, fontWeight: 700 }}>●</Typography>}
                      </Box>
                    );
                  })}
                </Box>
              </>
            )}
          </Box>
        );
      })()}
    </Box>
  );
}
