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
  CircularProgress,
} from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import NoteAddIcon from '@mui/icons-material/NoteAdd';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import AddIcon from '@mui/icons-material/Add';
import { updateOrderStatus, deleteOrder, addOrderNote, createAdminOrder } from '../../lib/adminService';
import { exportOrdersToCSV } from '../../lib/csvExport';
import { sendConfirmationEmail } from '../../lib/emailService';

const fontFamily = '"Georgia", serif';

const orderStatusOptions = ['pending', 'confirmed', 'production', 'shipping', 'received'];
const appointmentStatusOptions = ['pending', 'confirmed', 'in progress', 'completed', 'rescheduled', 'cancelled'];
const statusColor = {
  pending: 'warning',
  confirmed: 'info',
  production: 'secondary',
  shipping: 'primary',
  received: 'success',
  'in progress': 'secondary',
  completed: 'success',
  rescheduled: 'warning',
  cancelled: 'error',
};

export default function OrdersSection({ orders, loading, onRefresh, filterType }) {
  const statusOptions = filterType === 'service' ? appointmentStatusOptions : orderStatusOptions;
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedId, setExpandedId] = useState(null);
  const [noteDialog, setNoteDialog] = useState(null);
  const [noteText, setNoteText] = useState('');
  const [deleteDialog, setDeleteDialog] = useState(null);
  const [busy, setBusy] = useState(false);
  const [emailPrompt, setEmailPrompt] = useState(null);
  const [emailFeedback, setEmailFeedback] = useState(null);
  const [sendingEmailId, setSendingEmailId] = useState(null);
  const [addDialog, setAddDialog] = useState(false);
  const [addForm, setAddForm] = useState({
    customerName: '', email: '', phone: '', status: 'pending',
    total: '', notes: '', createdAt: '',
    // service fields
    serviceName: '', appointmentDate: '', appointmentTime: '',
    // order fields
    orderType: 'pressOn', itemName: '', quantity: 1,
  });

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
      if (newStatus === 'confirmed') {
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
    setSendingEmailId(order.id);
    setEmailPrompt(null);
    const result = await sendConfirmationEmail(order);
    setSendingEmailId(null);
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

  const resetAddForm = () => setAddForm({
    customerName: '', email: '', phone: '', status: 'pending',
    total: '', notes: '', createdAt: '',
    serviceName: '', appointmentDate: '', appointmentTime: '',
    orderType: 'pressOn', itemName: '', quantity: 1,
  });

  const handleAddSave = async () => {
    setBusy(true);
    try {
      const isService = filterType === 'service';
      const price = parseFloat(addForm.total) || 0;
      let appointmentDate = '';
      let items = [];

      if (isService) {
        // Build formatted appointment date string
        if (addForm.appointmentDate) {
          const d = new Date(addForm.appointmentDate + 'T00:00:00');
          const dayName = d.toLocaleDateString('en-US', { weekday: 'long' });
          const day = d.getDate();
          const month = d.toLocaleDateString('en-US', { month: 'long' });
          const year = d.getFullYear();
          let timePart = '';
          if (addForm.appointmentTime) {
            const [hh, mm] = addForm.appointmentTime.split(':');
            const h = parseInt(hh, 10);
            const ampm = h >= 12 ? 'PM' : 'AM';
            const h12 = h % 12 || 12;
            timePart = ` at ${h12}:${mm} ${ampm}`;
          }
          appointmentDate = `${dayName}, ${day} ${month} ${year}${timePart}`;
        }
        items = [{
          kind: 'service',
          serviceName: addForm.serviceName,
          name: addForm.serviceName,
          price,
          date: appointmentDate,
          quantity: 1,
        }];
      } else {
        items = [{
          kind: addForm.orderType,
          name: addForm.itemName,
          price,
          quantity: parseInt(addForm.quantity, 10) || 1,
        }];
      }

      const orderData = {
        customerName: addForm.customerName,
        email: addForm.email,
        phone: addForm.phone,
        status: addForm.status,
        total: price,
        notes: addForm.notes,
        type: isService ? 'service' : addForm.orderType,
        items,
        createdAt: addForm.createdAt ? new Date(addForm.createdAt + 'T00:00:00') : null,
      };
      if (appointmentDate) orderData.appointmentDate = appointmentDate;

      await createAdminOrder(orderData);
      await onRefresh();
      setAddDialog(false);
      resetAddForm();
    } catch (err) {
      console.error('Add order error:', err);
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
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setAddDialog(true)}
            sx={{ fontFamily, backgroundColor: '#4A0E4E', '&:hover': { backgroundColor: '#3a0b3e' } }}
          >
            Add {filterType === 'service' ? 'Appointment' : 'Order'}
          </Button>
          <Button
            variant="outlined"
            startIcon={<FileDownloadIcon />}
            onClick={() => exportOrdersToCSV(filtered, `${title.toLowerCase()}-export.csv`)}
            sx={{ fontFamily, borderColor: '#4A0E4E', color: '#4A0E4E', '&:hover': { backgroundColor: '#4A0E4E', color: '#fff' } }}
          >
            Export CSV
          </Button>
        </Box>
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
              {['Order ID', 'Customer', 'Type', 'Status', 'Total', 'Appointment Date', 'Time', 'Date Booked', 'Actions'].map((h) => (
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
                      disabled={!o.email || !!sendingEmailId}
                      title={o.email ? 'Send confirmation email' : 'No email available'}
                    >
                      {sendingEmailId === o.id ? (
                        <CircularProgress size={18} sx={{ color: '#4A0E4E' }} />
                      ) : (
                        <MailOutlineIcon fontSize="small" sx={{ color: o.email ? '#4A0E4E' : '#ccc' }} />
                      )}
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
                              <Box key={i} sx={{ pl: 2, mb: 1, borderLeft: '2px solid #F0C0D0', ml: 1 }}>
                                <Typography sx={{ fontFamily, fontSize: '0.85rem', fontWeight: 700, color: '#4A0E4E' }}>
                                  {item.serviceName || item.name || item.title || 'Item'}
                                </Typography>
                                <Typography sx={{ fontFamily, fontSize: '0.8rem', color: '#555' }}>
                                  {item.kind === 'service' ? 'Service Appointment' : item.kind === 'retail' ? 'Retail Product' : item.kind === 'pressOn' ? 'Press-On Nails' : item.kind || '—'}
                                  {' • '}Qty: {item.quantity || 1}
                                  {' • '}₦{(item.price || 0).toLocaleString()}
                                  {item.originalPrice && (
                                    <Typography component="span" sx={{ ml: 0.5, fontSize: '0.75rem', color: '#999', textDecoration: 'line-through' }}>
                                      ₦{item.originalPrice.toLocaleString()}
                                    </Typography>
                                  )}
                                  {item.discountLabel && (
                                    <Typography component="span" sx={{ ml: 0.5, fontSize: '0.7rem', color: '#2e7d32', fontWeight: 600 }}>
                                      ({item.discountLabel})
                                    </Typography>
                                  )}
                                </Typography>
                                {item.nailShape && (
                                  <Typography sx={{ fontFamily, fontSize: '0.78rem', color: '#777' }}>
                                    Shape: {item.nailShape}{item.nailLength ? ` • Length: ${item.nailLength}` : ''}
                                  </Typography>
                                )}
                                {item.presetSize && (
                                  <Typography sx={{ fontFamily, fontSize: '0.78rem', color: '#777' }}>
                                    Preset Size: {item.presetSize}
                                  </Typography>
                                )}
                                {item.nailBedSize && (
                                  <Typography sx={{ fontFamily, fontSize: '0.78rem', color: '#777' }}>
                                    Nail Bed Size: {item.nailBedSize}
                                  </Typography>
                                )}
                              </Box>
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

      {/* Add Order/Appointment Dialog */}
      <Dialog open={addDialog} onClose={() => setAddDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontFamily, fontWeight: 700 }}>
          Add Legacy {filterType === 'service' ? 'Appointment' : 'Order'}
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '8px !important' }}>
          <TextField
            label="Customer Name"
            required
            value={addForm.customerName}
            onChange={(e) => setAddForm((f) => ({ ...f, customerName: e.target.value }))}
            fullWidth
            size="small"
            sx={{ '& .MuiOutlinedInput-root': { fontFamily } }}
          />
          <TextField
            label="Email"
            value={addForm.email}
            onChange={(e) => setAddForm((f) => ({ ...f, email: e.target.value }))}
            fullWidth
            size="small"
            sx={{ '& .MuiOutlinedInput-root': { fontFamily } }}
          />
          <TextField
            label="Phone"
            value={addForm.phone}
            onChange={(e) => setAddForm((f) => ({ ...f, phone: e.target.value }))}
            fullWidth
            size="small"
            sx={{ '& .MuiOutlinedInput-root': { fontFamily } }}
          />
          <Select
            value={addForm.status}
            onChange={(e) => setAddForm((f) => ({ ...f, status: e.target.value }))}
            size="small"
            fullWidth
            sx={{ fontFamily }}
          >
            {statusOptions.map((s) => (
              <MenuItem key={s} value={s}>{s}</MenuItem>
            ))}
          </Select>
          <TextField
            label={filterType === 'service' ? 'Price' : 'Total'}
            required
            type="number"
            value={addForm.total}
            onChange={(e) => setAddForm((f) => ({ ...f, total: e.target.value }))}
            fullWidth
            size="small"
            sx={{ '& .MuiOutlinedInput-root': { fontFamily } }}
          />

          {filterType === 'service' ? (
            <>
              <TextField
                label="Service Name"
                required
                value={addForm.serviceName}
                onChange={(e) => setAddForm((f) => ({ ...f, serviceName: e.target.value }))}
                fullWidth
                size="small"
                sx={{ '& .MuiOutlinedInput-root': { fontFamily } }}
              />
              <TextField
                label="Appointment Date"
                type="date"
                value={addForm.appointmentDate}
                onChange={(e) => setAddForm((f) => ({ ...f, appointmentDate: e.target.value }))}
                fullWidth
                size="small"
                slotProps={{ inputLabel: { shrink: true } }}
                sx={{ '& .MuiOutlinedInput-root': { fontFamily } }}
              />
              <TextField
                label="Appointment Time"
                type="time"
                value={addForm.appointmentTime}
                onChange={(e) => setAddForm((f) => ({ ...f, appointmentTime: e.target.value }))}
                fullWidth
                size="small"
                slotProps={{ inputLabel: { shrink: true } }}
                sx={{ '& .MuiOutlinedInput-root': { fontFamily } }}
              />
            </>
          ) : (
            <>
              <Select
                value={addForm.orderType}
                onChange={(e) => setAddForm((f) => ({ ...f, orderType: e.target.value }))}
                size="small"
                fullWidth
                sx={{ fontFamily }}
              >
                <MenuItem value="pressOn">Press On</MenuItem>
                <MenuItem value="retail">Retail</MenuItem>
                <MenuItem value="mixed">Mixed</MenuItem>
              </Select>
              <TextField
                label="Item Name"
                required
                value={addForm.itemName}
                onChange={(e) => setAddForm((f) => ({ ...f, itemName: e.target.value }))}
                fullWidth
                size="small"
                sx={{ '& .MuiOutlinedInput-root': { fontFamily } }}
              />
              <TextField
                label="Quantity"
                type="number"
                value={addForm.quantity}
                onChange={(e) => setAddForm((f) => ({ ...f, quantity: e.target.value }))}
                fullWidth
                size="small"
                slotProps={{ input: { inputProps: { min: 1 } } }}
                sx={{ '& .MuiOutlinedInput-root': { fontFamily } }}
              />
            </>
          )}

          <TextField
            label="Notes"
            multiline
            rows={2}
            value={addForm.notes}
            onChange={(e) => setAddForm((f) => ({ ...f, notes: e.target.value }))}
            fullWidth
            size="small"
            sx={{ '& .MuiOutlinedInput-root': { fontFamily } }}
          />
          <TextField
            label="Date Occurred"
            type="date"
            value={addForm.createdAt}
            onChange={(e) => setAddForm((f) => ({ ...f, createdAt: e.target.value }))}
            fullWidth
            size="small"
            slotProps={{ inputLabel: { shrink: true } }}
            helperText="The historical date this order/appointment took place"
            sx={{ '& .MuiOutlinedInput-root': { fontFamily } }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setAddDialog(false); resetAddForm(); }} sx={{ fontFamily }}>Cancel</Button>
          <Button
            onClick={handleAddSave}
            variant="contained"
            disabled={busy || !addForm.customerName.trim() || !addForm.total || (filterType === 'service' ? !addForm.serviceName.trim() : !addForm.itemName.trim())}
            sx={{ fontFamily, backgroundColor: '#4A0E4E', '&:hover': { backgroundColor: '#3a0b3e' } }}
          >
            Save
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
