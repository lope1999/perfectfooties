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
} from '@mui/material';
import PeopleIcon from '@mui/icons-material/People';
import StarIcon from '@mui/icons-material/Star';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import SearchIcon from '@mui/icons-material/Search';

const fontFamily = '"Georgia", serif';

function formatNaira(amount) {
  return `\u20A6${amount.toLocaleString()}`;
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
                Status
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

              return (
                <TableRow key={u.uid} sx={{ '&:hover': { bgcolor: '#f3e5f5' } }}>
                  <TableCell sx={{ fontFamily, fontSize: '0.78rem', color: '#999', width: 32 }}>{idx + 1}</TableCell>
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
                    {u.isRegular ? (
                      <Chip
                        icon={<StarIcon sx={{ fontSize: 14 }} />}
                        label="Regular"
                        size="small"
                        sx={{
                          backgroundColor: '#FCE4EC',
                          color: '#E91E8C',
                          fontFamily,
                          fontWeight: 600,
                          fontSize: '0.72rem',
                        }}
                      />
                    ) : (
                      <Chip
                        label="New"
                        size="small"
                        variant="outlined"
                        sx={{ fontFamily, fontSize: '0.72rem' }}
                      />
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} sx={{ textAlign: 'center', fontFamily, py: 4, color: '#777' }}>
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
