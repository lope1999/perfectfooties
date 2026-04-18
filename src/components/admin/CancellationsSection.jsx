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
  Chip,
  IconButton,
  Tooltip,
  CircularProgress,
  TextField,
  InputAdornment,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import SearchIcon from '@mui/icons-material/Search';
import CancelIcon from '@mui/icons-material/Cancel';
import { fetchCancellationRequests } from '../../lib/cancellationService';

const ff = '"Georgia", serif';

function formatDate(ts) {
  if (!ts) return '—';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

const TYPE_LABEL = { service: 'Appointment', leather: 'Leather Goods', retail: 'Retail', mixed: 'Mixed' };

export default function CancellationsSection() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  const load = async (showSpinner = true) => {
    if (showSpinner) setLoading(true);
    else setRefreshing(true);
    try {
      const data = await fetchCancellationRequests();
      setRequests(data);
    } catch (e) {
      console.error('Failed to load cancellation requests', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = requests.filter((r) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      r.customerName?.toLowerCase().includes(q) ||
      r.customerEmail?.toLowerCase().includes(q) ||
      r.orderId?.toLowerCase().includes(q) ||
      r.reason?.toLowerCase().includes(q) ||
      r.serviceName?.toLowerCase().includes(q)
    );
  });

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <CancelIcon sx={{ color: '#d32f2f', fontSize: 28 }} />
          <Typography variant="h5" sx={{ fontFamily: ff, fontWeight: 700, color: '#2c1810' }}>
            Cancellation Requests
          </Typography>
          <Chip
            label={requests.length}
            size="small"
            sx={{ backgroundColor: '#fce4ec', color: '#c62828', fontFamily: ff, fontWeight: 700, fontSize: '0.75rem' }}
          />
        </Box>
        <Tooltip title="Refresh">
          <IconButton onClick={() => load(false)} disabled={refreshing}>
            <RefreshIcon sx={{ transition: 'transform 0.5s', transform: refreshing ? 'rotate(360deg)' : 'none' }} />
          </IconButton>
        </Tooltip>
      </Box>

      {/* Search */}
      <TextField
        size="small"
        placeholder="Search by name, email, order ID, reason…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        InputProps={{
          startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 18, color: '#aaa' }} /></InputAdornment>,
          sx: { borderRadius: 2, fontFamily: ff },
        }}
        sx={{ mb: 2.5, width: { xs: '100%', sm: 360 } }}
      />

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress sx={{ color: '#e3242b' }} />
        </Box>
      ) : filtered.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <CancelIcon sx={{ fontSize: 48, color: '#ddd', mb: 1 }} />
          <Typography sx={{ color: '#999', fontFamily: ff }}>
            {search ? 'No results found.' : 'No cancellation requests yet.'}
          </Typography>
        </Box>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: '0 2px 12px rgba(0,0,0,0.07)', border: '1px solid #f0e0e8' }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ backgroundColor: '#fce4ec' }}>
                {['Date', 'Customer', 'Type', 'Service / Item', 'Appt. Date', 'Reason'].map((h) => (
                  <TableCell key={h} sx={{ fontFamily: ff, fontWeight: 700, color: '#7b1fa2', whiteSpace: 'nowrap', py: 1.5 }}>
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((r, i) => (
                <TableRow
                  key={r.id}
                  sx={{
                    backgroundColor: i % 2 === 0 ? '#fff' : '#fafafa',
                    '&:hover': { backgroundColor: '#fff5f8' },
                  }}
                >
                  <TableCell sx={{ fontFamily: ff, fontSize: '0.8rem', whiteSpace: 'nowrap', color: 'var(--text-muted)' }}>
                    {formatDate(r.createdAt)}
                  </TableCell>
                  <TableCell sx={{ fontFamily: ff, fontSize: '0.85rem' }}>
                    <Typography sx={{ fontFamily: ff, fontWeight: 600, fontSize: '0.85rem', lineHeight: 1.3 }}>
                      {r.customerName || '—'}
                    </Typography>
                    {r.customerEmail && (
                      <Typography sx={{ fontFamily: ff, fontSize: '0.75rem', color: '#888' }}>
                        {r.customerEmail}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell sx={{ fontFamily: ff, fontSize: '0.8rem' }}>
                    <Chip
                      label={TYPE_LABEL[r.orderType] || r.orderType || '—'}
                      size="small"
                      sx={{
                        backgroundColor: r.orderType === 'service' ? '#e8f5e9' : '#e3f2fd',
                        color: r.orderType === 'service' ? '#2e7d32' : '#1565c0',
                        fontFamily: ff,
                        fontWeight: 600,
                        fontSize: '0.72rem',
                      }}
                    />
                  </TableCell>
                  <TableCell sx={{ fontFamily: ff, fontSize: '0.85rem', maxWidth: 160 }}>
                    {r.serviceName || '—'}
                  </TableCell>
                  <TableCell sx={{ fontFamily: ff, fontSize: '0.8rem', whiteSpace: 'nowrap', color: 'var(--text-muted)' }}>
                    {r.appointmentDate || '—'}
                  </TableCell>
                  <TableCell sx={{ fontFamily: ff, fontSize: '0.85rem', maxWidth: 220 }}>
                    <Typography sx={{ fontFamily: ff, fontSize: '0.85rem', wordBreak: 'break-word' }}>
                      {r.reason}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}
