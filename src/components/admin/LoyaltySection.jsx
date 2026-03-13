import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Avatar,
  Chip,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Skeleton,
  Grid,
  InputAdornment,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import {
  fetchAllLoyaltyProfiles,
  adminAdjustPoints,
  fetchReferralLeaderboard,
  POINTS_PER_ORDER,
  POINTS_PER_APPOINTMENT,
  POINTS_PER_REFERRAL,
  REDEMPTION_UNIT, REDEMPTION_VALUE,
  REFERRAL_DISCOUNT,
} from '../../lib/loyaltyService';

const ff = '"Georgia", serif';

function StatCard({ title, value, icon, gradient, sub }) {
  return (
    <Paper
      sx={{
        p: 3,
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        borderRadius: 3,
        background: gradient,
        color: '#fff',
      }}
    >
      <Box
        sx={{
          width: 48,
          height: 48,
          borderRadius: '50%',
          backgroundColor: 'rgba(255,255,255,0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {icon}
      </Box>
      <Box>
        <Typography sx={{ fontFamily: ff, fontSize: '0.82rem', color: 'rgba(255,255,255,0.85)' }}>
          {title}
        </Typography>
        <Typography sx={{ fontFamily: ff, fontWeight: 700, fontSize: '1.5rem', lineHeight: 1.1 }}>
          {value}
        </Typography>
        {sub && (
          <Typography sx={{ fontFamily: ff, fontSize: '0.72rem', color: 'rgba(255,255,255,0.75)', mt: 0.2 }}>
            {sub}
          </Typography>
        )}
      </Box>
    </Paper>
  );
}

function AdjustDialog({ open, user, onClose, onSaved }) {
  const [delta, setDelta] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) { setDelta(''); setReason(''); setError(''); }
  }, [open]);

  const handleSave = async (sign) => {
    const num = parseInt(delta, 10);
    if (!num || num <= 0) { setError('Enter a positive number'); return; }
    setLoading(true);
    try {
      await adminAdjustPoints(user.uid, sign * num, reason.trim() || 'Admin adjustment');
      onSaved(user.uid, sign * num);
      onClose();
    } catch (e) {
      setError(e.message || 'Failed to adjust');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ fontFamily: ff, fontWeight: 700, pb: 0 }}>
        Adjust Points
        {user && (
          <Typography sx={{ fontSize: '0.82rem', color: '#777', fontFamily: ff, fontWeight: 400, mt: 0.3 }}>
            {user.displayName || user.email} — current: <strong>{user.loyaltyPoints} pts</strong>
          </Typography>
        )}
      </DialogTitle>
      <DialogContent sx={{ pt: '12px !important' }}>
        <TextField
          fullWidth
          label="Points"
          type="number"
          value={delta}
          onChange={(e) => { setDelta(e.target.value); setError(''); }}
          size="small"
          placeholder="e.g. 50"
          sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
          inputProps={{ min: 1 }}
        />
        <TextField
          fullWidth
          label="Reason (optional)"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          size="small"
          placeholder="e.g. Goodwill bonus, manual correction"
          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
        />
        {error && (
          <Typography sx={{ color: '#d32f2f', fontSize: '0.8rem', mt: 1 }}>{error}</Typography>
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
        <Button onClick={onClose} sx={{ color: '#777', fontFamily: ff, textTransform: 'none' }}>Cancel</Button>
        <Button
          onClick={() => handleSave(-1)}
          disabled={loading}
          startIcon={<RemoveIcon />}
          sx={{ borderRadius: 2, fontFamily: ff, textTransform: 'none', border: '1.5px solid #d32f2f', color: '#d32f2f', px: 2 }}
        >
          Deduct
        </Button>
        <Button
          onClick={() => handleSave(1)}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={14} /> : <AddIcon />}
          sx={{ borderRadius: 2, fontFamily: ff, textTransform: 'none', backgroundColor: '#2e7d32', color: '#fff', px: 2, '&:hover': { backgroundColor: '#1b5e20' } }}
        >
          Add
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default function LoyaltySection({ loading: pageLoading }) {
  const [profiles, setProfiles] = useState([]);
  const [referrals, setReferrals] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [search, setSearch] = useState('');
  const [adjustTarget, setAdjustTarget] = useState(null);
  const [tab, setTab] = useState('points'); // 'points' | 'referrals' | 'rules'

  useEffect(() => {
    Promise.all([fetchAllLoyaltyProfiles(), fetchReferralLeaderboard()])
      .then(([p, r]) => { setProfiles(p); setReferrals(r); setLoaded(true); })
      .catch(() => setLoaded(true));
  }, []);

  const handleAdjustSaved = (uid, delta) => {
    setProfiles((prev) =>
      prev
        .map((p) => p.uid === uid ? { ...p, loyaltyPoints: Math.max(0, p.loyaltyPoints + delta), loyaltyPointsEarned: delta > 0 ? p.loyaltyPointsEarned + delta : p.loyaltyPointsEarned } : p)
        .sort((a, b) => b.loyaltyPoints - a.loyaltyPoints)
    );
  };

  const filtered = profiles.filter((p) => {
    const q = search.toLowerCase();
    return !q || (p.displayName + p.email).toLowerCase().includes(q);
  });

  const totalPointsIssued = profiles.reduce((s, p) => s + p.loyaltyPointsEarned, 0);
  const totalRedeemed = profiles.reduce((s, p) => s + p.loyaltyPointsRedeemed, 0);
  const totalReferralUses = referrals.reduce((s, r) => s + (r.totalUses || 0), 0);

  if (pageLoading || !loaded) {
    return (
      <Box>
        <Skeleton variant="rounded" height={56} sx={{ mb: 3 }} />
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {[1, 2, 3].map((i) => <Grid item xs={12} sm={4} key={i}><Skeleton variant="rounded" height={90} sx={{ borderRadius: 3 }} /></Grid>)}
        </Grid>
        <Skeleton variant="rounded" height={300} sx={{ borderRadius: 3 }} />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography sx={{ fontFamily: ff, fontWeight: 700, fontSize: '1.6rem', color: '#4A0E4E' }}>
          Loyalty & Referrals
        </Typography>
        <Typography sx={{ fontFamily: ff, fontSize: '0.88rem', color: '#777', mt: 0.3 }}>
          Manage customer points balances, manual adjustments, and referral code tracking.
        </Typography>
      </Box>

      {/* Stats */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={4}>
          <StatCard
            title="Total Points Issued"
            value={totalPointsIssued.toLocaleString()}
            sub={`≡ ₦${Math.floor(totalPointsIssued / REDEMPTION_UNIT) * REDEMPTION_VALUE} redeemable`}
            icon={<EmojiEventsIcon />}
            gradient="linear-gradient(135deg, #B8860B 0%, #FFD54F 100%)"
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <StatCard
            title="Points Redeemed"
            value={totalRedeemed.toLocaleString()}
            sub={`≡ ₦${Math.floor(totalRedeemed / REDEMPTION_UNIT) * REDEMPTION_VALUE} in discounts`}
            icon={<EmojiEventsIcon />}
            gradient="linear-gradient(135deg, #E91E8C 0%, #F48FB1 100%)"
          />
        </Grid>
        <Grid item xs={12} sm={4}>
          <StatCard
            title="Referral Code Uses"
            value={totalReferralUses}
            sub={`${referrals.length} active referrers`}
            icon={<GroupAddIcon />}
            gradient="linear-gradient(135deg, #4A0E4E 0%, #7B1FA2 100%)"
          />
        </Grid>
      </Grid>

      {/* Tab buttons */}
      <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
        {[
          { key: 'points', label: '🏆 Points Ledger' },
          { key: 'referrals', label: '🎀 Referral Leaderboard' },
          { key: 'rules', label: '📋 Earn Rules' },
        ].map((t) => (
          <Button
            key={t.key}
            onClick={() => setTab(t.key)}
            sx={{
              fontFamily: ff,
              textTransform: 'none',
              borderRadius: 2,
              px: 2,
              py: 0.8,
              fontSize: '0.85rem',
              border: tab === t.key ? 'none' : '1.5px solid #E0E0E0',
              backgroundColor: tab === t.key ? '#4A0E4E' : 'transparent',
              color: tab === t.key ? '#fff' : '#555',
              '&:hover': { backgroundColor: tab === t.key ? '#4A0E4E' : '#F5F5F5' },
            }}
          >
            {t.label}
          </Button>
        ))}
      </Box>

      {/* Points Ledger */}
      {tab === 'points' && (
        <>
          <TextField
            fullWidth
            size="small"
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            InputProps={{
              startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: '#aaa', fontSize: 20 }} /></InputAdornment>,
              sx: { borderRadius: 2, backgroundColor: '#fff' },
            }}
            sx={{ mb: 2 }}
          />
          <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: '#4A0E4E' }}>
                  {['#', 'Customer', 'Points Balance', 'Earned (All-Time)', 'Redeemed', 'Actions'].map((h) => (
                    <TableCell key={h} sx={{ color: '#fff', fontFamily: ff, fontWeight: 700, py: 1.5 }}>
                      {h}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} sx={{ textAlign: 'center', py: 4, color: '#999', fontFamily: ff }}>
                      {search ? 'No customers match your search' : 'No loyalty data yet'}
                    </TableCell>
                  </TableRow>
                )}
                {filtered.map((p, idx) => {
                  const initials = (p.displayName || p.email || '?').split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
                  const redeemable = Math.floor(p.loyaltyPoints / REDEMPTION_UNIT) * REDEMPTION_VALUE;
                  return (
                    <TableRow key={p.uid} sx={{ '&:hover': { bgcolor: '#f3e5f5' } }}>
                      <TableCell sx={{ fontFamily: ff, fontSize: '0.78rem', color: '#999', width: 32 }}>{idx + 1}</TableCell>
                      <TableCell sx={{ fontFamily: ff }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Avatar sx={{ width: 34, height: 34, bgcolor: '#4A0E4E', fontSize: '0.78rem', fontFamily: ff, fontWeight: 700 }}>
                            {initials}
                          </Avatar>
                          <Box>
                            <Typography sx={{ fontFamily: ff, fontSize: '0.85rem', fontWeight: 600 }}>
                              {p.displayName || '—'}
                            </Typography>
                            <Typography sx={{ fontFamily: ff, fontSize: '0.72rem', color: '#999' }}>
                              {p.email}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography sx={{ fontFamily: ff, fontWeight: 700, fontSize: '1rem', color: '#B8860B' }}>
                            {p.loyaltyPoints}
                          </Typography>
                          {redeemable > 0 && (
                            <Chip
                              label={`₦${redeemable.toLocaleString()} ready`}
                              size="small"
                              sx={{ bgcolor: '#FFF8E1', color: '#B8860B', fontFamily: ff, fontSize: '0.68rem', fontWeight: 700 }}
                            />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell sx={{ fontFamily: ff, color: '#555' }}>{p.loyaltyPointsEarned}</TableCell>
                      <TableCell sx={{ fontFamily: ff, color: '#555' }}>{p.loyaltyPointsRedeemed}</TableCell>
                      <TableCell>
                        <Button
                          size="small"
                          onClick={() => setAdjustTarget(p)}
                          sx={{
                            fontFamily: ff,
                            textTransform: 'none',
                            fontSize: '0.78rem',
                            border: '1.5px solid #4A0E4E',
                            color: '#4A0E4E',
                            borderRadius: 2,
                            px: 1.5,
                            '&:hover': { bgcolor: '#4A0E4E', color: '#fff' },
                          }}
                        >
                          Adjust
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}

      {/* Referral Leaderboard */}
      {tab === 'referrals' && (
        <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ backgroundColor: '#4A0E4E' }}>
                {['#', 'Referral Code', 'Referrer UID', 'Total Uses', 'Points Earned'].map((h) => (
                  <TableCell key={h} sx={{ color: '#fff', fontFamily: ff, fontWeight: 700, py: 1.5 }}>
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {referrals.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} sx={{ textAlign: 'center', py: 4, color: '#999', fontFamily: ff }}>
                    No referrals recorded yet
                  </TableCell>
                </TableRow>
              )}
              {referrals.map((r, i) => (
                <TableRow key={r.id} sx={{ '&:hover': { bgcolor: '#f3e5f5' } }}>
                  <TableCell sx={{ fontFamily: ff, fontWeight: 700, color: i < 3 ? '#B8860B' : '#555' }}>
                    {i + 1}
                  </TableCell>
                  <TableCell>
                    <Typography sx={{ fontFamily: ff, fontWeight: 700, fontSize: '0.88rem', letterSpacing: 0.5 }}>
                      {r.code}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ fontFamily: ff, fontSize: '0.78rem', color: '#777' }}>
                    {r.uid?.slice(0, 12)}…
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={r.totalUses}
                      size="small"
                      sx={{ bgcolor: '#EDE7F6', color: '#4A0E4E', fontFamily: ff, fontWeight: 700 }}
                    />
                  </TableCell>
                  <TableCell sx={{ fontFamily: ff, color: '#2e7d32', fontWeight: 600 }}>
                    +{r.totalUses * POINTS_PER_REFERRAL} pts
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Earn Rules */}
      {tab === 'rules' && (
        <Paper sx={{ p: 3, borderRadius: 3 }}>
          <Typography sx={{ fontFamily: ff, fontWeight: 700, fontSize: '1rem', mb: 2, color: '#4A0E4E' }}>
            Current Earn & Redeem Rules
          </Typography>
          {[
            { label: 'Press-on order completed', value: `+${POINTS_PER_ORDER} pts`, color: '#4A0E4E' },
            { label: 'Appointment completed', value: `+${POINTS_PER_APPOINTMENT} pts`, color: '#E91E8C' },
            { label: 'Referral code used by a friend', value: `+${POINTS_PER_REFERRAL} pts (referrer)`, color: '#2e7d32' },
            { label: 'Referred friend discount', value: `₦${REFERRAL_DISCOUNT} off their first order`, color: '#e65100' },
            { label: 'Redemption rate', value: `${REDEMPTION_UNIT} pts = ₦1,000 discount`, color: '#B8860B' },
          ].map((r) => (
            <Box
              key={r.label}
              sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                py: 1.5,
                borderBottom: '1px solid #F5F5F5',
              }}
            >
              <Typography sx={{ fontFamily: ff, fontSize: '0.88rem', color: '#333' }}>{r.label}</Typography>
              <Chip
                label={r.value}
                size="small"
                sx={{ fontFamily: ff, fontWeight: 700, fontSize: '0.78rem', bgcolor: `${r.color}18`, color: r.color }}
              />
            </Box>
          ))}
          <Box sx={{ mt: 2.5, p: 2, borderRadius: 2, bgcolor: '#FFF8E1', border: '1px solid #FFD54F' }}>
            <Typography sx={{ fontFamily: ff, fontSize: '0.82rem', color: '#5D4037', lineHeight: 1.8 }}>
              <strong>Note:</strong> Points are awarded automatically when you mark an order as <em>received</em> in the Orders or Appointments section. Referral points are awarded to the referrer when the referred user places their first order with the code. You can manually adjust any customer&apos;s balance using the Points Ledger tab.
            </Typography>
          </Box>
        </Paper>
      )}

      <AdjustDialog
        open={!!adjustTarget}
        user={adjustTarget}
        onClose={() => setAdjustTarget(null)}
        onSaved={handleAdjustSaved}
      />
    </Box>
  );
}
