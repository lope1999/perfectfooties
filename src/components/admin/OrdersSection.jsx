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
  Checkbox,
  Toolbar,
} from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditIcon from '@mui/icons-material/Edit';
import NoteAddIcon from '@mui/icons-material/NoteAdd';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import AddIcon from '@mui/icons-material/Add';
import { updateOrderStatus, deleteOrder, addOrderNote, createAdminOrder, updateOrder } from '../../lib/adminService';
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
  const [editDialog, setEditDialog] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [selectedOrders, setSelectedOrders] = useState(new Set());
  const [bulkStatus, setBulkStatus] = useState('');
  const [bulkBusy, setBulkBusy] = useState(false);
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
      if (typeFilter === 'customPressOn') {
        const isCustom = (o.items || []).some((item) => item.setIncludes?.length > 0 || item.nailNotes || item.selectedLength);
        if (!isCustom) return false;
      } else if (typeFilter !== 'all' && o.type !== typeFilter) return false;
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

  const handleBulkStatusUpdate = async () => {
    if (!bulkStatus || selectedOrders.size === 0) return;
    setBulkBusy(true);
    try {
      const targets = filtered.filter((o) => selectedOrders.has(o.id));
      await Promise.all(targets.map((o) => updateOrderStatus(o.uid, o.id, bulkStatus)));
      await onRefresh();
      setSelectedOrders(new Set());
      setBulkStatus('');
    } catch (err) {
      console.error('Bulk update error:', err);
    } finally {
      setBulkBusy(false);
    }
  };

  const handleEditOpen = (order) => {
    setEditForm({
      customerName: order.customerName || order.name || '',
      email: order.email || '',
      phone: order.phone || '',
      notes: order.notes || '',
      total: order.total ?? '',
      appointmentDate: order.appointmentDate || '',
      extraCharge: order.extraCharge ?? '',
      extraChargeReason: order.extraChargeReason || '',
    });
    setEditDialog(order);
  };

  const handleEditSave = async () => {
    if (!editDialog) return;
    setBusy(true);
    try {
      const updates = {
        customerName: editForm.customerName.trim(),
        email: editForm.email.trim(),
        phone: editForm.phone.trim(),
        notes: editForm.notes,
        total: parseFloat(editForm.total) || editDialog.total,
        extraCharge: parseFloat(editForm.extraCharge) || 0,
        extraChargeReason: editForm.extraChargeReason || '',
      };
      if (editForm.appointmentDate) updates.appointmentDate = editForm.appointmentDate;
      await updateOrder(editDialog.uid, editDialog.id, updates);
      setEditDialog(null);
      await onRefresh();
    } catch (err) {
      console.error('Edit order error:', err);
    } finally {
      setBusy(false);
    }
  };

  const toggleSelect = (id) => {
    setSelectedOrders((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedOrders.size === filtered.length) {
      setSelectedOrders(new Set());
    } else {
      setSelectedOrders(new Set(filtered.map((o) => o.id)));
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
            sx={{ fontFamily, borderColor: '#4A0E4E', color: 'var(--text-purple)', '&:hover': { backgroundColor: '#4A0E4E', color: '#fff' } }}
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
            <MenuItem value="customPressOn">Custom Press-On</MenuItem>
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

      {/* Bulk action toolbar */}
      {selectedOrders.size > 0 && (
        <Toolbar
          sx={{
            mb: 1.5,
            borderRadius: 2,
            backgroundColor: '#EDE7F6',
            border: '1.5px solid #CE93D8',
            gap: 2,
            flexWrap: 'wrap',
            minHeight: '48px !important',
            px: 2,
          }}
        >
          <Typography sx={{ fontFamily, fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-purple)', flex: 1 }}>
            {selectedOrders.size} selected
          </Typography>
          <Select
            size="small"
            displayEmpty
            value={bulkStatus}
            onChange={(e) => setBulkStatus(e.target.value)}
            sx={{ fontFamily, minWidth: 140, backgroundColor: '#fff', borderRadius: 1 }}
          >
            <MenuItem value="" disabled>Set status…</MenuItem>
            {statusOptions.map((s) => (
              <MenuItem key={s} value={s}>{s}</MenuItem>
            ))}
          </Select>
          <Button
            variant="contained"
            size="small"
            disabled={!bulkStatus || bulkBusy}
            onClick={handleBulkStatusUpdate}
            sx={{ fontFamily, backgroundColor: '#4A0E4E', '&:hover': { backgroundColor: '#3a0b3e' }, fontWeight: 600, textTransform: 'none' }}
          >
            {bulkBusy ? <CircularProgress size={16} sx={{ color: '#fff' }} /> : 'Apply'}
          </Button>
          <Button
            size="small"
            onClick={() => setSelectedOrders(new Set())}
            sx={{ fontFamily, color: '#777', textTransform: 'none' }}
          >
            Clear
          </Button>
        </Toolbar>
      )}

      <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ backgroundColor: '#4A0E4E' }}>
              <TableCell sx={{ color: '#fff', width: 40, p: 0.5 }}>
                <Checkbox
                  size="small"
                  checked={filtered.length > 0 && selectedOrders.size === filtered.length}
                  indeterminate={selectedOrders.size > 0 && selectedOrders.size < filtered.length}
                  onChange={toggleSelectAll}
                  sx={{ color: 'rgba(255,255,255,0.7)', '&.Mui-checked': { color: '#fff' }, '&.MuiCheckbox-indeterminate': { color: '#fff' }, p: 0.5 }}
                />
              </TableCell>
              <TableCell sx={{ color: '#fff', fontFamily, fontWeight: 700, width: 40 }} />
              {['#', 'Order ID', 'Customer', 'Type', 'Status', 'Total', 'Discounts', 'Date Booked', 'Actions'].map((h) => (
                <TableCell key={h} sx={{ color: '#fff', fontFamily, fontWeight: 700 }}>
                  {h}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.map((o, idx) => (
              <>
                <TableRow key={o.id} hover selected={selectedOrders.has(o.id)} sx={{ '&.Mui-selected': { backgroundColor: '#f3e5f5' }, '&.Mui-selected:hover': { backgroundColor: '#ede0f5' } }}>
                  <TableCell sx={{ p: 0.5 }}>
                    <Checkbox
                      size="small"
                      checked={selectedOrders.has(o.id)}
                      onChange={() => toggleSelect(o.id)}
                      sx={{ color: '#CE93D8', '&.Mui-checked': { color: 'var(--text-purple)' }, p: 0.5 }}
                    />
                  </TableCell>
                  <TableCell>
                    <IconButton size="small" onClick={() => setExpandedId(expandedId === o.id ? null : o.id)}>
                      {expandedId === o.id ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    </IconButton>
                  </TableCell>
                  <TableCell sx={{ fontFamily, fontSize: '0.78rem', color: '#999', width: 32 }}>{idx + 1}</TableCell>
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
                  <TableCell sx={{ fontFamily }}>
                    ₦{((o.total || 0) + (o.extraCharge || 0)).toLocaleString()}
                    {o.extraCharge > 0 && (
                      <Box sx={{ fontSize: '0.7rem', color: '#E65100', mt: 0.3 }}>
                        +₦{o.extraCharge.toLocaleString()} extra
                      </Box>
                    )}
                  </TableCell>
                  <TableCell sx={{ fontFamily, fontSize: '0.78rem', maxWidth: 180 }}>
                    {(() => {
                      const parts = [];
                      if (o.referralCode) parts.push(`Referral: ${o.referralCode} (-₦${(o.referralDiscount || 0).toLocaleString()})`);
                      if (o.loyaltyPointsUsed) parts.push(`Loyalty: ${o.loyaltyPointsUsed} pts (-₦${(o.loyaltyDiscount || 0).toLocaleString()})`);
                      if (o.giftCardCode) parts.push(`Gift Card: ${o.giftCardCode} (-₦${(o.giftCardDiscount || 0).toLocaleString()})`);
                      if (parts.length === 0) return <span style={{ color: '#bbb' }}>—</span>;
                      return parts.map((p, i) => (
                        <Box key={i} sx={{ whiteSpace: 'nowrap', color: i === 0 && o.referralCode ? '#2e7d32' : i === parts.findIndex(x => x.startsWith('Loyalty')) ? '#B8860B' : '#555' }}>
                          {p}
                        </Box>
                      ));
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
                        <CircularProgress size={18} sx={{ color: 'var(--text-purple)' }} />
                      ) : (
                        <MailOutlineIcon fontSize="small" sx={{ color: o.email ? '#4A0E4E' : '#ccc' }} />
                      )}
                    </IconButton>
                    <IconButton size="small" onClick={() => handleEditOpen(o)} title="Edit order details">
                      <EditIcon fontSize="small" sx={{ color: '#1565C0' }} />
                    </IconButton>
                    <IconButton size="small" onClick={() => { setNoteDialog(o); setNoteText(''); }} title="Add note">
                      <NoteAddIcon fontSize="small" sx={{ color: 'var(--text-purple)' }} />
                    </IconButton>
                    <IconButton size="small" onClick={() => setDeleteDialog(o)} title="Delete">
                      <DeleteOutlineIcon fontSize="small" sx={{ color: '#d32f2f' }} />
                    </IconButton>
                  </TableCell>
                </TableRow>
                <TableRow key={`${o.id}-detail`}>
                  <TableCell colSpan={11} sx={{ p: 0, border: 0 }}>
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
                                <Typography sx={{ fontFamily, fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-purple)' }}>
                                  {item.serviceName || item.name || item.title || 'Item'}
                                </Typography>
                                <Typography sx={{ fontFamily, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
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
                                {item.selectedLength && (
                                  <Typography sx={{ fontFamily, fontSize: '0.78rem', color: '#777' }}>
                                    Length: {item.selectedLength}
                                  </Typography>
                                )}
                                {item.setIncludes?.length > 0 && (
                                  <Box sx={{ mt: 0.5 }}>
                                    <Typography sx={{ fontFamily, fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-purple)', mb: 0.3 }}>Set Includes:</Typography>
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.4 }}>
                                      {item.setIncludes.map((tag) => (
                                        <Chip key={tag} label={tag} size="small" sx={{ fontSize: '0.65rem', height: 18, backgroundColor: '#FCE4EC', color: '#C2185B', fontWeight: 600 }} />
                                      ))}
                                    </Box>
                                  </Box>
                                )}
                                {item.inspirationTags?.length > 0 && (
                                  <Box sx={{ mt: 0.5 }}>
                                    <Typography sx={{ fontFamily, fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-purple)', mb: 0.3 }}>Inspiration:</Typography>
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.4 }}>
                                      {item.inspirationTags.map((tag) => (
                                        <Chip key={tag} label={tag} size="small" sx={{ fontSize: '0.65rem', height: 18, backgroundColor: '#EDE7F6', color: '#5E35B1', fontWeight: 600 }} />
                                      ))}
                                    </Box>
                                  </Box>
                                )}
                                {item.nailNotes && (
                                  <Typography sx={{ fontFamily, fontSize: '0.78rem', color: '#888', mt: 0.4, fontStyle: 'italic' }}>
                                    Notes: &ldquo;{item.nailNotes}&rdquo;
                                  </Typography>
                                )}
                                {item.specialRequest && (
                                  <Chip
                                    label="⚠️ Special Request — Made to Order"
                                    size="small"
                                    sx={{ mt: 0.5, fontSize: '0.68rem', height: 20, backgroundColor: '#FFF8E1', color: '#B8860B', fontWeight: 700, border: '1px solid #FFD54F' }}
                                  />
                                )}
                                {item.otherPeople?.length > 0 && (
                                  <Box sx={{ mt: 0.5, pl: 1, borderLeft: '2px solid #E0B0C0', ml: 0.5 }}>
                                    <Typography sx={{ fontFamily, fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-purple)' }}>Also ordering for:</Typography>
                                    {item.otherPeople.map((person, pi) => (
                                      <Box key={pi} sx={{ mt: 0.25 }}>
                                        <Typography sx={{ fontFamily, fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                                          {person.name || `Person ${pi + 1}`}
                                          {person.nailShape ? ` • Shape: ${person.nailShape}` : ''}
                                        </Typography>
                                        {person.nailBedSize && (
                                          <Typography sx={{ fontFamily, fontSize: '0.75rem', color: '#777' }}>
                                            Nail Bed Size: {person.nailBedSize}
                                          </Typography>
                                        )}
                                      </Box>
                                    ))}
                                  </Box>
                                )}
                              </Box>
                            ))}
                          </Box>
                        )}
                        {(o.referralCode || o.loyaltyPointsUsed || o.giftCardCode) && (
                          <Box sx={{ mb: 1.5, p: 1.5, borderRadius: 2, backgroundColor: '#F1F8E9', border: '1px solid #C5E1A5' }}>
                            <Typography sx={{ fontFamily, fontSize: '0.85rem', fontWeight: 700, color: '#2e7d32', mb: 0.5 }}>Discounts Applied</Typography>
                            {o.referralCode && (
                              <Typography sx={{ fontFamily, fontSize: '0.82rem', color: '#2e7d32' }}>
                                Referral Code: <strong>{o.referralCode}</strong> — -₦{(o.referralDiscount || 0).toLocaleString()}
                              </Typography>
                            )}
                            {o.loyaltyPointsUsed && (
                              <Typography sx={{ fontFamily, fontSize: '0.82rem', color: '#B8860B' }}>
                                Loyalty Points: <strong>{o.loyaltyPointsUsed} pts</strong> — -₦{(o.loyaltyDiscount || 0).toLocaleString()}
                              </Typography>
                            )}
                            {o.giftCardCode && (
                              <Typography sx={{ fontFamily, fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                                Gift Card: <strong>{o.giftCardCode}</strong> — -₦{(o.giftCardDiscount || 0).toLocaleString()}
                              </Typography>
                            )}
                          </Box>
                        )}
                        {o.extraCharge > 0 && (
                          <Box sx={{ mb: 1.5, p: 1.5, borderRadius: 2, backgroundColor: '#FFF3E0', border: '1px solid #FFCC02' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                              <Typography sx={{ fontFamily, fontSize: '0.85rem', fontWeight: 700, color: '#E65100' }}>
                                Extra Charge
                              </Typography>
                              <Chip
                                label={`+₦${o.extraCharge.toLocaleString()}`}
                                size="small"
                                sx={{ backgroundColor: '#E65100', color: '#fff', fontWeight: 700, fontSize: '0.72rem' }}
                              />
                            </Box>
                            {o.extraChargeReason && (
                              <Typography sx={{ fontFamily, fontSize: '0.82rem', color: '#555' }}>
                                <strong>Reason:</strong> {o.extraChargeReason}
                              </Typography>
                            )}
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
                              <Typography key={i} sx={{ fontFamily, fontSize: '0.8rem', pl: 2, color: 'var(--text-purple)' }}>
                                [{n.timestamp}] {n.text}
                              </Typography>
                            ))}
                          </Box>
                        )}
                        {o.shipping && o.type !== 'service' && (
                          <Box sx={{ mt: 1.5, p: 1.5, backgroundColor: '#FFF0F5', borderRadius: 2, border: '1px solid #F0C0D0' }}>
                            <Typography sx={{ fontFamily, fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-purple)', mb: 0.5 }}>
                              Shipping Details
                            </Typography>
                            {o.shipping.name && (
                              <Typography sx={{ fontFamily, fontSize: '0.82rem', mb: 0.25 }}>
                                <strong>Name:</strong> {o.shipping.name}
                              </Typography>
                            )}
                            {o.shipping.phone && (
                              <Typography sx={{ fontFamily, fontSize: '0.82rem', mb: 0.25 }}>
                                <strong>Phone:</strong> {o.shipping.phone}
                              </Typography>
                            )}
                            {o.shipping.address && (
                              <Typography sx={{ fontFamily, fontSize: '0.82rem', mb: 0.25 }}>
                                <strong>Address:</strong> {o.shipping.address}
                              </Typography>
                            )}
                            {(o.shipping.state || o.shipping.lga) && (
                              <Typography sx={{ fontFamily, fontSize: '0.82rem' }}>
                                <strong>State / LGA:</strong> {[o.shipping.state, o.shipping.lga].filter(Boolean).join(' / ')}
                              </Typography>
                            )}
                          </Box>
                        )}
                      </Box>
                    </Collapse>
                  </TableCell>
                </TableRow>
              </>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={11} sx={{ textAlign: 'center', fontFamily, py: 4 }}>
                  No {title.toLowerCase()} found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Edit Order Dialog */}
      <Dialog open={!!editDialog} onClose={() => setEditDialog(null)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontFamily, fontWeight: 700 }}>
          Edit {editDialog?.type === 'service' ? 'Appointment' : 'Order'} Details
          <Typography sx={{ fontSize: '0.8rem', color: '#777', fontFamily, fontWeight: 400, mt: 0.3 }}>
            ID: {editDialog?.id?.slice(0, 12)}… — {editDialog?.customerName || editDialog?.name || ''}
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '8px !important' }}>
          <TextField
            label="Customer Name"
            size="small"
            fullWidth
            value={editForm.customerName || ''}
            onChange={(e) => setEditForm((f) => ({ ...f, customerName: e.target.value }))}
            sx={{ '& .MuiOutlinedInput-root': { fontFamily } }}
          />
          <TextField
            label="Email"
            size="small"
            fullWidth
            value={editForm.email || ''}
            onChange={(e) => setEditForm((f) => ({ ...f, email: e.target.value }))}
            sx={{ '& .MuiOutlinedInput-root': { fontFamily } }}
          />
          <TextField
            label="Phone"
            size="small"
            fullWidth
            value={editForm.phone || ''}
            onChange={(e) => setEditForm((f) => ({ ...f, phone: e.target.value }))}
            sx={{ '& .MuiOutlinedInput-root': { fontFamily } }}
          />
          {(editDialog?.type === 'service' || editDialog?.type === 'mixed') && (
            <TextField
              label="Appointment Date"
              size="small"
              fullWidth
              value={editForm.appointmentDate || ''}
              onChange={(e) => setEditForm((f) => ({ ...f, appointmentDate: e.target.value }))}
              placeholder="e.g. Monday, 20 March 2026 at 2:00 PM"
              sx={{ '& .MuiOutlinedInput-root': { fontFamily } }}
            />
          )}
          <TextField
            label="Total (₦)"
            size="small"
            fullWidth
            type="number"
            value={editForm.total ?? ''}
            onChange={(e) => setEditForm((f) => ({ ...f, total: e.target.value }))}
            sx={{ '& .MuiOutlinedInput-root': { fontFamily } }}
          />
          <TextField
            label="Extra Charge (₦)"
            size="small"
            fullWidth
            type="number"
            value={editForm.extraCharge ?? ''}
            onChange={(e) => setEditForm((f) => ({ ...f, extraCharge: e.target.value }))}
            sx={{ '& .MuiOutlinedInput-root': { fontFamily } }}
            helperText="Additional amount charged due to extra products/services"
          />
          <TextField
            label="Extra Charge Reason"
            size="small"
            fullWidth
            multiline
            minRows={2}
            value={editForm.extraChargeReason || ''}
            onChange={(e) => setEditForm((f) => ({ ...f, extraChargeReason: e.target.value }))}
            sx={{ '& .MuiOutlinedInput-root': { fontFamily } }}
            placeholder="e.g. Extra gel polish, additional nail art design..."
          />
          <TextField
            label="Notes"
            size="small"
            fullWidth
            multiline
            minRows={2}
            value={editForm.notes || ''}
            onChange={(e) => setEditForm((f) => ({ ...f, notes: e.target.value }))}
            sx={{ '& .MuiOutlinedInput-root': { fontFamily } }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialog(null)} sx={{ fontFamily }}>Cancel</Button>
          <Button
            onClick={handleEditSave}
            variant="contained"
            disabled={busy}
            sx={{ fontFamily, backgroundColor: '#1565C0', '&:hover': { backgroundColor: '#0d47a1' } }}
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

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
