import { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  TextField,
  Chip,
  Avatar,
  Skeleton,
  FormControlLabel,
  Switch,
  InputAdornment,
  Collapse,
  IconButton,
  Divider,
  CircularProgress,
} from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import StarIcon from '@mui/icons-material/Star';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import SearchIcon from '@mui/icons-material/Search';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { updateCustomerPerks } from '../../lib/adminService';

const fontFamily = '"Georgia", serif';

function formatNaira(amount) {
  return `\u20A6${amount.toLocaleString()}`;
}

// Mirror of AccountPage CLIENT_TIERS — review-count based
const CLIENT_TIERS = [
  { min: 5, label: 'Diamond Diva',  emoji: '💎', color: '#5E35B1', bg: '#EDE7F6', border: '#B39DDB' },
  { min: 4, label: 'Star Client',   emoji: '⭐', color: '#B8860B', bg: '#FFFDE7', border: '#FFD54F' },
  { min: 3, label: 'Nail Lover',    emoji: '💅', color: '#C2185B', bg: '#FCE4EC', border: '#F48FB1' },
  { min: 2, label: 'Glam Client',   emoji: '✨', color: '#6A1B9A', bg: '#EDE7F6', border: '#B39DDB' },
  { min: 1, label: 'Fresh Darling', emoji: '🌸', color: '#2E7D32', bg: '#F1F8E9', border: '#A5D6A7' },
  { min: 0, label: 'New Member',    emoji: '🌟', color: '#E91E8C', bg: '#FFF0F5', border: '#F0C0D0' },
];

const PERK_LABELS = {
  pressOnDiscount: '5% Press-On Discount',
  glamBadge: 'Glam Badge',
  earlyAccess: 'Early Access',
  priorityBooking: 'Priority Booking',
};

function getClientTier(reviewCount) {
  return CLIENT_TIERS.find((t) => (reviewCount || 0) >= t.min) || CLIENT_TIERS[CLIENT_TIERS.length - 1];
}

function StatCard({ title, value, icon, gradient }) {
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
          width: 50,
          height: 50,
          borderRadius: '50%',
          backgroundColor: 'rgba(255,255,255,0.2)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {icon}
      </Box>
      <Box>
        <Typography sx={{ fontFamily, fontSize: '0.85rem', color: 'rgba(255,255,255,0.85)' }}>
          {title}
        </Typography>
        <Typography sx={{ fontFamily, fontWeight: 700, fontSize: '1.5rem' }}>
          {value}
        </Typography>
      </Box>
    </Paper>
  );
}

export default function CustomersSection({ users, loading }) {
  const [search, setSearch] = useState('');
  const [orderBy, setOrderBy] = useState('totalPaid');
  const [orderDir, setOrderDir] = useState('desc');
  const [regularsOnly, setRegularsOnly] = useState(false);
  const [expandedUid, setExpandedUid] = useState(null);
  const [perkSaving, setPerkSaving] = useState({});
  const [localPerks, setLocalPerks] = useState({});

  const handleSort = (field) => {
    if (orderBy === field) {
      setOrderDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setOrderBy(field);
      setOrderDir('desc');
    }
  };

  const filtered = useMemo(() => {
    let list = users || [];
    if (regularsOnly) list = list.filter((u) => u.isRegular);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (u) =>
          (u.displayName || '').toLowerCase().includes(q) ||
          (u.email || '').toLowerCase().includes(q)
      );
    }
    list = [...list].sort((a, b) => {
      let aVal = a[orderBy] ?? 0;
      let bVal = b[orderBy] ?? 0;
      if (orderBy === 'displayName') {
        aVal = (a.displayName || '').toLowerCase();
        bVal = (b.displayName || '').toLowerCase();
        return orderDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      if (aVal instanceof Date) aVal = aVal.getTime();
      if (bVal instanceof Date) bVal = bVal.getTime();
      return orderDir === 'asc' ? aVal - bVal : bVal - aVal;
    });
    return list;
  }, [users, search, orderBy, orderDir, regularsOnly]);

  const totalCustomers = (users || []).length;
  const regularCount = (users || []).filter((u) => u.isRegular).length;
  const totalRevenue = (users || []).reduce((sum, u) => sum + (u.totalPaid || 0), 0);

  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const newThisMonth = (users || []).filter((u) => {
    const created = u.createdAt?.toDate?.() || u.createdAt;
    return created instanceof Date && created >= thisMonthStart;
  }).length;

  const getPerks = (u) => {
    const base = u.tierPerks || {};
    const overrides = localPerks[u.uid] || {};
    return { pressOnDiscount: false, glamBadge: false, earlyAccess: false, priorityBooking: false, ...base, ...overrides };
  };

  const handlePerkToggle = async (u, perkKey) => {
    const current = getPerks(u);
    const newVal = !current[perkKey];
    const newPerks = { ...current, [perkKey]: newVal };
    setLocalPerks((prev) => ({ ...prev, [u.uid]: newPerks }));
    setPerkSaving((prev) => ({ ...prev, [`${u.uid}-${perkKey}`]: true }));
    try {
      await updateCustomerPerks(u.uid, newPerks);
    } catch {
      // revert on error
      setLocalPerks((prev) => ({ ...prev, [u.uid]: { ...current } }));
    } finally {
      setPerkSaving((prev) => ({ ...prev, [`${u.uid}-${perkKey}`]: false }));
    }
  };

  if (loading) {
    return (
      <Box>
        <Skeleton variant="rounded" height={40} sx={{ mb: 2 }} />
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {[1, 2, 3, 4].map((i) => (
            <Grid item xs={6} sm={3} key={i}>
              <Skeleton variant="rounded" height={100} sx={{ borderRadius: 3 }} />
            </Grid>
          ))}
        </Grid>
        <Skeleton variant="rounded" height={300} sx={{ borderRadius: 3 }} />
      </Box>
    );
  }

  const sortableHead = (label, field) => (
    <TableSortLabel
      active={orderBy === field}
      direction={orderBy === field ? orderDir : 'asc'}
      onClick={() => handleSort(field)}
      sx={{ color: '#fff !important', '& .MuiTableSortLabel-icon': { color: '#fff !important' } }}
    >
      {label}
    </TableSortLabel>
  );

  return (
    <Box>
      <Typography variant="h5" sx={{ fontFamily, fontWeight: 700, mb: 3 }}>
        Customers
      </Typography>

      {/* Stat Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}>
          <StatCard
            title="Total Customers"
            value={totalCustomers}
            icon={<PeopleIcon />}
            gradient="linear-gradient(135deg, #4A0E4E 0%, #7B1FA2 100%)"
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard
            title="Regulars"
            value={regularCount}
            icon={<StarIcon />}
            gradient="linear-gradient(135deg, #E91E8C 0%, #F48FB1 100%)"
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard
            title="Total Revenue"
            value={formatNaira(totalRevenue)}
            icon={<AttachMoneyIcon />}
            gradient="linear-gradient(135deg, #2e7d32 0%, #66bb6a 100%)"
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatCard
            title="New This Month"
            value={newThisMonth}
            icon={<PersonAddIcon />}
            gradient="linear-gradient(135deg, #e65100 0%, #fb8c00 100%)"
          />
        </Grid>
      </Grid>

      {/* Search + Filter */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, flexWrap: 'wrap' }}>
        <TextField
          size="small"
          placeholder="Search by name or email"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: '#999' }} />
              </InputAdornment>
            ),
            sx: { fontFamily, borderRadius: 2 },
          }}
          sx={{ flex: 1, minWidth: 220 }}
        />
        <FormControlLabel
          control={
            <Switch
              checked={regularsOnly}
              onChange={(e) => setRegularsOnly(e.target.checked)}
              sx={{
                '& .MuiSwitch-switchBase.Mui-checked': { color: '#E91E8C' },
                '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#E91E8C' },
              }}
            />
          }
          label={
            <Typography sx={{ fontFamily, fontSize: '0.85rem', fontWeight: 600 }}>
              Regulars Only
            </Typography>
          }
        />
      </Box>

      {/* Table */}
      <TableContainer component={Paper} sx={{ borderRadius: 3 }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ backgroundColor: '#4A0E4E' }}>
              <TableCell sx={{ color: '#fff', fontFamily, fontWeight: 700, width: 32 }}>#</TableCell>
              <TableCell sx={{ color: '#fff', fontFamily, fontWeight: 700, width: 32 }} />
              <TableCell sx={{ color: '#fff', fontFamily, fontWeight: 700 }}>
                {sortableHead('Customer', 'displayName')}
              </TableCell>
              <TableCell sx={{ color: '#fff', fontFamily, fontWeight: 700 }}>
                {sortableHead('Joined', 'createdAt')}
              </TableCell>
              <TableCell sx={{ color: '#fff', fontFamily, fontWeight: 700 }} align="center">
                {sortableHead('Orders', 'orderCount')}
              </TableCell>
              <TableCell sx={{ color: '#fff', fontFamily, fontWeight: 700 }} align="center">
                {sortableHead('Appts', 'appointmentCount')}
              </TableCell>
              <TableCell sx={{ color: '#fff', fontFamily, fontWeight: 700 }} align="right">
                {sortableHead('Revenue', 'totalPaid')}
              </TableCell>
              <TableCell sx={{ color: '#fff', fontFamily, fontWeight: 700 }} align="center">
                Tier
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.map((u, idx) => {
              const name = u.displayName || u.email || 'Unknown';
              const initials = name
                .split(' ')
                .map((n) => n[0])
                .join('')
                .toUpperCase()
                .slice(0, 2);
              const joined = u.createdAt?.toDate?.()
                ? u.createdAt.toDate().toLocaleDateString()
                : '—';
              const tier = getClientTier(u.reviewCount);
              const perks = getPerks(u);
              const isExpanded = expandedUid === u.uid;

              return [
                <TableRow
                  key={u.uid}
                  sx={{
                    '&:hover': { bgcolor: '#f3e5f5' },
                    cursor: 'pointer',
                    backgroundColor: isExpanded ? '#fdf4ff' : 'inherit',
                  }}
                  onClick={() => setExpandedUid(isExpanded ? null : u.uid)}
                >
                  <TableCell sx={{ fontFamily, fontSize: '0.78rem', color: '#999', width: 32 }}>{idx + 1}</TableCell>
                  <TableCell sx={{ p: 0.5 }}>
                    <IconButton size="small">
                      {isExpanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                    </IconButton>
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Avatar
                        src={u.photoURL || undefined}
                        sx={{
                          width: 36,
                          height: 36,
                          bgcolor: 'var(--text-purple)',
                          fontSize: '0.75rem',
                          fontFamily,
                          fontWeight: 700,
                        }}
                      >
                        {initials}
                      </Avatar>
                      <Box>
                        <Typography sx={{ fontFamily, fontSize: '0.85rem', fontWeight: 600 }}>
                          {u.displayName || '—'}
                        </Typography>
                        <Typography sx={{ fontFamily, fontSize: '0.72rem', color: '#999' }}>
                          {u.email || ''}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ fontFamily, fontSize: '0.82rem' }}>{joined}</TableCell>
                  <TableCell align="center" sx={{ fontFamily }}>{u.orderCount || 0}</TableCell>
                  <TableCell align="center" sx={{ fontFamily }}>{u.appointmentCount || 0}</TableCell>
                  <TableCell align="right" sx={{ fontFamily, fontWeight: 600 }}>
                    {formatNaira(u.totalPaid || 0)}
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={`${tier.emoji} ${tier.label}`}
                      size="small"
                      sx={{
                        backgroundColor: tier.bg,
                        color: tier.color,
                        border: `1px solid ${tier.border}`,
                        fontFamily,
                        fontWeight: 700,
                        fontSize: '0.7rem',
                      }}
                    />
                  </TableCell>
                </TableRow>,

                <TableRow key={`${u.uid}-detail`}>
                  <TableCell colSpan={8} sx={{ p: 0, border: 0 }}>
                    <Collapse in={isExpanded}>
                      <Box sx={{ p: 2.5, backgroundColor: '#fdf4ff', borderBottom: '1px solid #F0C0D0' }}>
                        <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', mb: 2 }}>
                          {/* Tier info */}
                          <Box
                            sx={{
                              p: 2,
                              borderRadius: 2,
                              backgroundColor: tier.bg,
                              border: `1px solid ${tier.border}`,
                              minWidth: 200,
                            }}
                          >
                            <Typography sx={{ fontFamily, fontWeight: 700, fontSize: '1rem', color: tier.color, mb: 0.5 }}>
                              {tier.emoji} {tier.label}
                            </Typography>
                            <Typography sx={{ fontFamily, fontSize: '0.78rem', color: '#666', mb: 1 }}>
                              Reviews: {u.reviewCount || 0} &nbsp;|&nbsp; Points: {u.loyaltyPoints || 0}
                            </Typography>
                            <Typography sx={{ fontFamily, fontSize: '0.75rem', color: '#888' }}>
                              Orders: {u.orderCount || 0} &nbsp;|&nbsp; Appointments: {u.appointmentCount || 0}
                            </Typography>
                          </Box>

                          {/* Perk toggles */}
                          <Box sx={{ flex: 1 }}>
                            <Typography sx={{ fontFamily, fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-purple)', mb: 1 }}>
                              Activate Perks
                            </Typography>
                            <Grid container spacing={1}>
                              {Object.keys(PERK_LABELS).map((key) => {
                                const saving = !!perkSaving[`${u.uid}-${key}`];
                                return (
                                  <Grid item xs={12} sm={6} key={key}>
                                    <Box
                                      sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        p: 1,
                                        borderRadius: 2,
                                        border: '1px solid #E0B0D0',
                                        backgroundColor: '#fff',
                                      }}
                                    >
                                      <Typography sx={{ fontFamily, fontSize: '0.82rem', fontWeight: 600 }}>
                                        {PERK_LABELS[key]}
                                      </Typography>
                                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                        {saving && <CircularProgress size={14} sx={{ color: '#E91E8C' }} />}
                                        <Switch
                                          size="small"
                                          checked={!!perks[key]}
                                          onChange={() => handlePerkToggle(u, key)}
                                          disabled={saving}
                                          sx={{
                                            '& .MuiSwitch-switchBase.Mui-checked': { color: '#E91E8C' },
                                            '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#E91E8C' },
                                          }}
                                        />
                                      </Box>
                                    </Box>
                                  </Grid>
                                );
                              })}
                            </Grid>
                          </Box>
                        </Box>
                        <Divider sx={{ mt: 1 }} />
                        <Typography sx={{ fontFamily, fontSize: '0.72rem', color: '#aaa', mt: 1 }}>
                          UID: {u.uid}
                        </Typography>
                      </Box>
                    </Collapse>
                  </TableCell>
                </TableRow>,
              ];
            })}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={8} sx={{ textAlign: 'center', fontFamily, py: 4, color: '#777' }}>
                  {search ? 'No customers match your search' : 'No customers yet'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
