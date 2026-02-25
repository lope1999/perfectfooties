import { useState, useMemo } from 'react';
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
  Select,
  MenuItem,
  TextField,
  IconButton,
  Button,
  Collapse,
  Skeleton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import {
  activateGiftCard,
  updateGiftCardStatus,
  deleteGiftCard,
} from '../../lib/giftCardService';

const fontFamily = '"Georgia", serif';

const statusColorMap = {
  pending: 'warning',
  active: 'success',
  partially_used: 'info',
  fully_redeemed: 'default',
  expired: 'error',
};

const allStatuses = ['pending', 'active', 'partially_used', 'fully_redeemed', 'expired'];

function formatNaira(amount) {
  return `₦${Number(amount || 0).toLocaleString()}`;
}

function formatDate(ts) {
  if (!ts) return '—';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function GiftCardsSection({ giftCards, loading, onRefresh }) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedId, setExpandedId] = useState(null);
  const [deleteDialog, setDeleteDialog] = useState(null);
  const [busy, setBusy] = useState(false);

  const filtered = useMemo(() => {
    return giftCards.filter((gc) => {
      if (statusFilter !== 'all' && gc.status !== statusFilter) return false;
      if (search) {
        const s = search.toLowerCase();
        const code = (gc.code || '').toLowerCase();
        const recipient = (gc.giftedTo || '').toLowerCase();
        if (!code.includes(s) && !recipient.includes(s)) return false;
      }
      return true;
    });
  }, [giftCards, statusFilter, search]);

  // Stats
  const stats = useMemo(() => {
    const totalCards = giftCards.length;
    const totalIssued = giftCards.reduce((sum, gc) => sum + (gc.amount || 0), 0);
    const totalRedeemed = giftCards.reduce((sum, gc) => sum + ((gc.amount || 0) - (gc.balance || 0)), 0);
    const activeCount = giftCards.filter((gc) => gc.status === 'active' || gc.status === 'partially_used').length;
    return { totalCards, totalIssued, totalRedeemed, activeCount };
  }, [giftCards]);

  const handleActivate = async (cardId) => {
    setBusy(true);
    try {
      await activateGiftCard(cardId);
      await onRefresh();
    } catch (err) {
      console.error('Activate error:', err);
    } finally {
      setBusy(false);
    }
  };

  const handleStatusChange = async (cardId, newStatus) => {
    setBusy(true);
    try {
      await updateGiftCardStatus(cardId, newStatus);
      await onRefresh();
    } catch (err) {
      console.error('Status update error:', err);
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog) return;
    setBusy(true);
    try {
      await deleteGiftCard(deleteDialog.id);
      setDeleteDialog(null);
      await onRefresh();
    } catch (err) {
      console.error('Delete error:', err);
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <Box>
        <Skeleton variant="rounded" height={40} sx={{ mb: 2 }} />
        <Skeleton variant="rounded" height={400} />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h5" sx={{ fontFamily, fontWeight: 700, mb: 2 }}>
        Gift Cards ({filtered.length})
      </Typography>

      {/* Stats */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        {[
          { label: 'Total Cards', value: stats.totalCards },
          { label: 'Total Issued', value: formatNaira(stats.totalIssued) },
          { label: 'Total Redeemed', value: formatNaira(stats.totalRedeemed) },
          { label: 'Active Cards', value: stats.activeCount },
        ].map((s) => (
          <Paper
            key={s.label}
            sx={{
              px: 3,
              py: 2,
              borderRadius: 2,
              flex: '1 1 140px',
              minWidth: 140,
            }}
          >
            <Typography sx={{ fontFamily, fontSize: '0.78rem', color: '#777' }}>{s.label}</Typography>
            <Typography sx={{ fontFamily, fontWeight: 700, fontSize: '1.2rem', color: '#4A0E4E' }}>{s.value}</Typography>
          </Paper>
        ))}
      </Box>

      {/* Filters */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
        <TextField
          size="small"
          placeholder="Search by code or recipient…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ minWidth: 220, '& .MuiOutlinedInput-root': { fontFamily } }}
        />
        <Select
          size="small"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          sx={{ minWidth: 160, fontFamily }}
        >
          <MenuItem value="all">All Statuses</MenuItem>
          {allStatuses.map((s) => (
            <MenuItem key={s} value={s}>{s.replace('_', ' ')}</MenuItem>
          ))}
        </Select>
      </Box>

      {/* Table */}
      <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ backgroundColor: '#4A0E4E' }}>
              <TableCell sx={{ color: '#fff', fontFamily, fontWeight: 700, width: 40 }} />
              {['Code', 'Type', 'Recipient', 'Amount', 'Balance', 'Status', 'Created', 'Expires', 'Actions'].map((h) => (
                <TableCell key={h} sx={{ color: '#fff', fontFamily, fontWeight: 700 }}>
                  {h}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.map((gc) => (
              <>
                <TableRow key={gc.id} hover>
                  <TableCell>
                    <IconButton size="small" onClick={() => setExpandedId(expandedId === gc.id ? null : gc.id)}>
                      {expandedId === gc.id ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    </IconButton>
                  </TableCell>
                  <TableCell sx={{ fontFamily, fontWeight: 600, letterSpacing: '1px' }}>{gc.code}</TableCell>
                  <TableCell sx={{ fontFamily, textTransform: 'capitalize' }}>{gc.type}</TableCell>
                  <TableCell sx={{ fontFamily }}>{gc.giftedTo || '—'}</TableCell>
                  <TableCell sx={{ fontFamily }}>{formatNaira(gc.amount)}</TableCell>
                  <TableCell sx={{ fontFamily, fontWeight: 600 }}>{formatNaira(gc.balance)}</TableCell>
                  <TableCell>
                    <Chip
                      label={gc.status.replace('_', ' ')}
                      size="small"
                      color={statusColorMap[gc.status] || 'default'}
                    />
                  </TableCell>
                  <TableCell sx={{ fontFamily, fontSize: '0.8rem' }}>{formatDate(gc.createdAt)}</TableCell>
                  <TableCell sx={{ fontFamily, fontSize: '0.8rem' }}>{formatDate(gc.expiresAt)}</TableCell>
                  <TableCell>
                    {gc.status === 'pending' && (
                      <Button
                        size="small"
                        variant="contained"
                        startIcon={<CheckCircleIcon />}
                        onClick={() => handleActivate(gc.id)}
                        disabled={busy}
                        sx={{
                          fontFamily,
                          fontSize: '0.75rem',
                          backgroundColor: '#2e7d32',
                          mr: 0.5,
                          '&:hover': { backgroundColor: '#1b5e20' },
                        }}
                      >
                        Activate
                      </Button>
                    )}
                    <IconButton size="small" onClick={() => setDeleteDialog(gc)} title="Delete">
                      <DeleteOutlineIcon fontSize="small" sx={{ color: '#d32f2f' }} />
                    </IconButton>
                  </TableCell>
                </TableRow>
                <TableRow key={`${gc.id}-detail`}>
                  <TableCell colSpan={10} sx={{ p: 0, border: 0 }}>
                    <Collapse in={expandedId === gc.id}>
                      <Box sx={{ p: 2, backgroundColor: '#fafafa' }}>
                        {gc.purchasedBy && (
                          <Box sx={{ mb: 1 }}>
                            <Typography sx={{ fontFamily, fontSize: '0.85rem', fontWeight: 700 }}>Purchased By:</Typography>
                            <Typography sx={{ fontFamily, fontSize: '0.8rem', pl: 2 }}>
                              {gc.purchasedBy.name || 'Guest'}{gc.purchasedBy.email ? ` (${gc.purchasedBy.email})` : ''}
                            </Typography>
                          </Box>
                        )}
                        <Box sx={{ mb: 1 }}>
                          <Typography sx={{ fontFamily, fontSize: '0.85rem', fontWeight: 700 }}>Status Management:</Typography>
                          <Select
                            size="small"
                            value={gc.status}
                            onChange={(e) => handleStatusChange(gc.id, e.target.value)}
                            disabled={busy}
                            sx={{ fontFamily, fontSize: '0.8rem', minWidth: 180, mt: 0.5 }}
                          >
                            {allStatuses.map((s) => (
                              <MenuItem key={s} value={s}>
                                <Chip label={s.replace('_', ' ')} size="small" color={statusColorMap[s] || 'default'} />
                              </MenuItem>
                            ))}
                          </Select>
                        </Box>
                        {gc.transactions?.length > 0 && (
                          <Box sx={{ mt: 1 }}>
                            <Typography sx={{ fontFamily, fontSize: '0.85rem', fontWeight: 700 }}>
                              Transaction History:
                            </Typography>
                            {gc.transactions.map((tx, i) => (
                              <Typography key={i} sx={{ fontFamily, fontSize: '0.8rem', pl: 2, color: '#4A0E4E' }}>
                                [{new Date(tx.date).toLocaleDateString()}] Redeemed {formatNaira(tx.amount)}
                                {tx.orderId && ` — Order: ${tx.orderId.slice(0, 8)}…`}
                              </Typography>
                            ))}
                          </Box>
                        )}
                        {(!gc.transactions || gc.transactions.length === 0) && (
                          <Typography sx={{ fontFamily, fontSize: '0.8rem', color: '#999', mt: 1 }}>
                            No transactions yet.
                          </Typography>
                        )}
                      </Box>
                    </Collapse>
                  </TableCell>
                </TableRow>
              </>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={10} sx={{ textAlign: 'center', fontFamily, py: 4 }}>
                  No gift cards found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteDialog} onClose={() => setDeleteDialog(null)}>
        <DialogTitle sx={{ fontFamily, fontWeight: 700 }}>Delete Gift Card?</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontFamily }}>
            Are you sure you want to delete gift card{' '}
            <strong>{deleteDialog?.code}</strong>? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(null)} sx={{ fontFamily }}>Cancel</Button>
          <Button
            onClick={handleDelete}
            variant="contained"
            color="error"
            disabled={busy}
            sx={{ fontFamily }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
