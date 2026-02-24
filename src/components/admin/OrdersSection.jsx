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
  Snackbar,
  Alert,
} from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import NoteAddIcon from '@mui/icons-material/NoteAdd';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { updateOrderStatus, deleteOrder, addOrderNote } from '../../lib/adminService';
import { exportOrdersToCSV } from '../../lib/csvExport';
import { sendConfirmationEmail } from '../../lib/emailService';

const fontFamily = '"Georgia", serif';

const statusOptions = ['pending', 'confirmed', 'in-progress', 'completed', 'cancelled'];
const statusColor = {
  pending: 'warning',
  confirmed: 'info',
  'in-progress': 'secondary',
  completed: 'success',
  cancelled: 'error',
};

export default function OrdersSection({ orders, loading, onRefresh, filterType }) {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState(filterType || 'all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedId, setExpandedId] = useState(null);
  const [noteDialog, setNoteDialog] = useState(null);
  const [noteText, setNoteText] = useState('');
  const [deleteDialog, setDeleteDialog] = useState(null);
  const [busy, setBusy] = useState(false);
  const [emailPrompt, setEmailPrompt] = useState(null);
  const [emailFeedback, setEmailFeedback] = useState(null);
  const [sendingEmail, setSendingEmail] = useState(false);

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      if (typeFilter !== 'all' && o.type !== typeFilter) return false;
      if (statusFilter !== 'all' && o.status !== statusFilter) return false;
      if (search) {
        const s = search.toLowerCase();
        const name = (o.customerName || o.name || '').toLowerCase();
        const id = o.id.toLowerCase();
        const email = (o.email || '').toLowerCase();
        if (!name.includes(s) && !id.includes(s) && !email.includes(s)) return false;
      }
      return true;
    });
  }, [orders, typeFilter, statusFilter, search]);

  const handleStatusChange = async (uid, orderId, newStatus) => {
    setBusy(true);
    try {
      await updateOrderStatus(uid, orderId, newStatus);
      await onRefresh();
      if (newStatus === 'confirmed' || newStatus === 'completed') {
        const order = orders.find((o) => o.id === orderId);
        if (order?.email) {
          setEmailPrompt({ ...order, status: newStatus });
        }
      }
    } catch (err) {
      console.error('Status update error:', err);
    } finally {
      setBusy(false);
    }
  };

  const handleSendEmail = async (order) => {
    setSendingEmail(true);
    setEmailPrompt(null);
    const result = await sendConfirmationEmail(order);
    setSendingEmail(false);
    if (result.success) {
      setEmailFeedback({ severity: 'success', message: 'Email sent!' });
    } else {
      setEmailFeedback({ severity: 'error', message: result.error || 'Failed to send' });
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog) return;
    setBusy(true);
    try {
      await deleteOrder(deleteDialog.uid, deleteDialog.id);
      setDeleteDialog(null);
      await onRefresh();
    } catch (err) {
      console.error('Delete error:', err);
    } finally {
      setBusy(false);
    }
  };

  const handleAddNote = async () => {
    if (!noteDialog || !noteText.trim()) return;
    setBusy(true);
    try {
      await addOrderNote(noteDialog.uid, noteDialog.id, noteText.trim());
      setNoteDialog(null);
      setNoteText('');
      await onRefresh();
    } catch (err) {
      console.error('Note error:', err);
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

  const orderTypes = [...new Set(orders.map((o) => o.type).filter(Boolean))];
  const title = filterType === 'service' ? 'Appointments' : 'Orders';

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="h5" sx={{ fontFamily, fontWeight: 700 }}>
          {title} ({filtered.length})
        </Typography>
        <Button
          variant="outlined"
          startIcon={<FileDownloadIcon />}
          onClick={() => exportOrdersToCSV(filtered, `${title.toLowerCase()}-export.csv`)}
          sx={{ fontFamily, borderColor: '#4A0E4E', color: '#4A0E4E', '&:hover': { backgroundColor: '#4A0E4E', color: '#fff' } }}
        >
          Export CSV
        </Button>
      </Box>

      <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
        <TextField
          size="small"
          placeholder="Search by name, ID, email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ minWidth: 220, '& .MuiOutlinedInput-root': { fontFamily } }}
        />
        {!filterType && (
          <Select
            size="small"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            sx={{ minWidth: 140, fontFamily }}
          >
            <MenuItem value="all">All Types</MenuItem>
            {orderTypes.map((t) => (
              <MenuItem key={t} value={t}>{t}</MenuItem>
            ))}
          </Select>
        )}
        <Select
          size="small"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          sx={{ minWidth: 140, fontFamily }}
        >
          <MenuItem value="all">All Statuses</MenuItem>
          {statusOptions.map((s) => (
            <MenuItem key={s} value={s}>{s}</MenuItem>
          ))}
        </Select>
      </Box>

      <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ backgroundColor: '#4A0E4E' }}>
              <TableCell sx={{ color: '#fff', fontFamily, fontWeight: 700, width: 40 }} />
              {['Order ID', 'Customer', 'Type', 'Status', 'Total', 'Appointment Date', 'Time', 'Date', 'Actions'].map((h) => (
                <TableCell key={h} sx={{ color: '#fff', fontFamily, fontWeight: 700 }}>
                  {h}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.map((o) => (
              <>
                <TableRow key={o.id} hover>
                  <TableCell>
                    <IconButton size="small" onClick={() => setExpandedId(expandedId === o.id ? null : o.id)}>
                      {expandedId === o.id ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    </IconButton>
                  </TableCell>
                  <TableCell sx={{ fontFamily, fontSize: '0.8rem' }}>{o.id.slice(0, 8)}…</TableCell>
                  <TableCell sx={{ fontFamily }}>{o.customerName || o.name || '—'}</TableCell>
                  <TableCell>
                    <Chip label={o.type || '—'} size="small" />
                  </TableCell>
                  <TableCell>
                    <Select
                      size="small"
                      value={o.status || 'pending'}
                      onChange={(e) => handleStatusChange(o.uid, o.id, e.target.value)}
                      disabled={busy}
                      sx={{ fontFamily, fontSize: '0.8rem', minWidth: 120 }}
                    >
                      {statusOptions.map((s) => (
                        <MenuItem key={s} value={s}>
                          <Chip label={s} size="small" color={statusColor[s] || 'default'} />
                        </MenuItem>
                      ))}
                    </Select>
                  </TableCell>
                  <TableCell sx={{ fontFamily }}>₦{(o.total || 0).toLocaleString()}</TableCell>
                  <TableCell sx={{ fontFamily, fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                    {(() => {
                      const raw = o.appointmentDate || o.items?.[0]?.date;
                      if (!raw) return '—';
                      const [datePart] = raw.split(' at ');
                      return datePart || '—';
                    })()}
                  </TableCell>
                  <TableCell sx={{ fontFamily, fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                    {(() => {
                      const raw = o.appointmentDate || o.items?.[0]?.date;
                      if (!raw) return '—';
                      const parts = raw.split(' at ');
                      return parts[1]?.trim() || '—';
                    })()}
                  </TableCell>
                  <TableCell sx={{ fontFamily, fontSize: '0.8rem' }}>
                    {o.createdAt?.toDate ? o.createdAt.toDate().toLocaleDateString() : '—'}
                  </TableCell>
                  <TableCell>
                    <IconButton
                      size="small"
                      onClick={() => handleSendEmail(o)}
                      disabled={!o.email || sendingEmail}
                      title={o.email ? 'Send confirmation email' : 'No email available'}
                    >
                      <MailOutlineIcon fontSize="small" sx={{ color: o.email ? '#4A0E4E' : '#ccc' }} />
                    </IconButton>
                    <IconButton size="small" onClick={() => { setNoteDialog(o); setNoteText(''); }} title="Add note">
                      <NoteAddIcon fontSize="small" sx={{ color: '#4A0E4E' }} />
                    </IconButton>
                    <IconButton size="small" onClick={() => setDeleteDialog(o)} title="Delete">
                      <DeleteOutlineIcon fontSize="small" sx={{ color: '#d32f2f' }} />
                    </IconButton>
                  </TableCell>
                </TableRow>
                <TableRow key={`${o.id}-detail`}>
                  <TableCell colSpan={10} sx={{ p: 0, border: 0 }}>
                    <Collapse in={expandedId === o.id}>
                      <Box sx={{ p: 2, backgroundColor: '#fafafa' }}>
                        {o.appointmentDate && (
                          <Typography sx={{ fontFamily, fontSize: '0.85rem', mb: 1 }}>
                            <strong>Appointment Date:</strong> {o.appointmentDate}
                          </Typography>
                        )}
                        {o.email && (
                          <Typography sx={{ fontFamily, fontSize: '0.85rem', mb: 1 }}>
                            <strong>Email:</strong> {o.email}
                          </Typography>
                        )}
                        {o.phone && (
                          <Typography sx={{ fontFamily, fontSize: '0.85rem', mb: 1 }}>
                            <strong>Phone:</strong> {o.phone}
                          </Typography>
                        )}
                        {o.items?.length > 0 && (
                          <Box sx={{ mb: 1 }}>
                            <Typography sx={{ fontFamily, fontSize: '0.85rem', fontWeight: 700 }}>Items:</Typography>
                            {o.items.map((item, i) => (
                              <Typography key={i} sx={{ fontFamily, fontSize: '0.8rem', pl: 2 }}>
                                • {item.name || item.title} × {item.quantity || 1} — ₦{(item.price || 0).toLocaleString()}
                              </Typography>
                            ))}
                          </Box>
                        )}
                        {o.notes && (
                          <Typography sx={{ fontFamily, fontSize: '0.85rem', mb: 1 }}>
                            <strong>Customer Notes:</strong> {o.notes}
                          </Typography>
                        )}
                        {o.adminNotes?.length > 0 && (
                          <Box sx={{ mt: 1 }}>
                            <Typography sx={{ fontFamily, fontSize: '0.85rem', fontWeight: 700 }}>Admin Notes:</Typography>
                            {o.adminNotes.map((n, i) => (
                              <Typography key={i} sx={{ fontFamily, fontSize: '0.8rem', pl: 2, color: '#4A0E4E' }}>
                                [{n.timestamp}] {n.text}
                              </Typography>
                            ))}
                          </Box>
                        )}
                        {o.address && (
                          <Typography sx={{ fontFamily, fontSize: '0.85rem', mt: 1 }}>
                            <strong>Address:</strong> {typeof o.address === 'string' ? o.address : JSON.stringify(o.address)}
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
                  No {title.toLowerCase()} found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add Note Dialog */}
      <Dialog open={!!noteDialog} onClose={() => setNoteDialog(null)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontFamily, fontWeight: 700 }}>Add Admin Note</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            multiline
            rows={3}
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Enter note…"
            sx={{ mt: 1, '& .MuiOutlinedInput-root': { fontFamily } }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNoteDialog(null)} sx={{ fontFamily }}>Cancel</Button>
          <Button
            onClick={handleAddNote}
            variant="contained"
            disabled={busy || !noteText.trim()}
            sx={{ fontFamily, backgroundColor: '#4A0E4E', '&:hover': { backgroundColor: '#3a0b3e' } }}
          >
            Save Note
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteDialog} onClose={() => setDeleteDialog(null)}>
        <DialogTitle sx={{ fontFamily, fontWeight: 700 }}>Delete Order?</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontFamily }}>
            This action cannot be undone. Are you sure you want to delete order{' '}
            <strong>{deleteDialog?.id.slice(0, 8)}…</strong>?
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

      {/* Email Prompt Snackbar */}
      <Snackbar
        open={!!emailPrompt}
        autoHideDuration={10000}
        onClose={() => setEmailPrompt(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        message={`Send confirmation email to ${emailPrompt?.customerName || emailPrompt?.name || 'customer'}?`}
        action={
          <>
            <Button color="primary" size="small" onClick={() => handleSendEmail(emailPrompt)} sx={{ fontFamily }}>
              Send
            </Button>
            <Button color="inherit" size="small" onClick={() => setEmailPrompt(null)} sx={{ fontFamily }}>
              Dismiss
            </Button>
          </>
        }
      />

      {/* Email Feedback Snackbar */}
      <Snackbar
        open={!!emailFeedback}
        autoHideDuration={4000}
        onClose={() => setEmailFeedback(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setEmailFeedback(null)}
          severity={emailFeedback?.severity || 'info'}
          sx={{ fontFamily }}
        >
          {emailFeedback?.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
