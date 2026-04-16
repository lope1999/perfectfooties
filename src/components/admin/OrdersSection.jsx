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
  Switch,
  FormControlLabel,
} from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditIcon from '@mui/icons-material/Edit';
import NoteAddIcon from '@mui/icons-material/NoteAdd';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import AddIcon from '@mui/icons-material/Add';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import { updateOrderStatus, deleteOrder, addOrderNote, createAdminOrder, updateOrder } from '../../lib/adminService';
import { exportOrdersToCSV } from '../../lib/csvExport';
import { sendConfirmationEmail } from '../../lib/emailService';

const fontFamily = '"Georgia", serif';

const orderStatusOptions = ['pending', 'confirmed', 'production', 'shipped', 'delivered'];
const statusColor = {
  pending: 'warning',
  confirmed: 'info',
  production: 'secondary',
  shipped: 'primary',
  delivered: 'success',
};

export default function OrdersSection({ orders, loading, onRefresh, filterType }) {
  const statusOptions = orderStatusOptions;
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
  const [hideAbandonedPending, setHideAbandonedPending] = useState(true);
  const [bulkBusy, setBulkBusy] = useState(false);
  const [addForm, setAddForm] = useState({
    customerName: '', email: '', phone: '', status: 'pending',
    total: '', notes: '', createdAt: '',
    orderType: 'product', itemName: '', quantity: 1,
  });

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      // Hide abandoned product checkouts (saved before payment, never completed)
      if (hideAbandonedPending && (o.type === 'product' || o.type === 'nicheCollection') && o.status === 'pending') return false;
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
  }, [orders, typeFilter, statusFilter, search, hideAbandonedPending]);

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
    orderType: 'product', itemName: '', quantity: 1,
  });

  const handleAddSave = async () => {
    setBusy(true);
    try {
      const price = parseFloat(addForm.total) || 0;
      const items = [{
        kind: addForm.orderType,
        name: addForm.itemName,
        price,
        quantity: parseInt(addForm.quantity, 10) || 1,
      }];

      const orderData = {
        customerName: addForm.customerName,
        email: addForm.email,
        phone: addForm.phone,
        status: addForm.status,
        total: price,
        notes: addForm.notes,
        type: addForm.orderType,
        items,
        createdAt: addForm.createdAt ? new Date(addForm.createdAt + 'T00:00:00') : null,
      };

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

  const printShippingLabel = (o) => {
    const date = o.createdAt?.toDate ? o.createdAt.toDate().toLocaleDateString() : '—';
    const items = (o.items || [])
      .map((item, i) => {
        let line = `${i + 1}. ${item.name || 'Item'} × ${item.quantity || 1} — ₦${(item.price || 0).toLocaleString()}`;
        if (item.size) line += ` | Size: ${item.size}`;
        if (item.colour) line += ` | Colour: ${item.colour}`;
        return `<p style="margin:4px 0;">${line}</p>`;
      })
      .join('');
    const win = window.open('', '_blank', 'width=600,height=700');
    win.document.write(`<!DOCTYPE html><html><head><title>Shipping Label — ${o.id}</title>
      <style>
        body { font-family: Georgia, serif; padding: 32px; color: #222; }
        .border { border: 2px dashed #444; padding: 24px; max-width: 500px; margin: auto; }
        .brand { font-size: 1.4rem; font-weight: 700; color: #006666; text-align: center; letter-spacing: 1px; margin-bottom: 4px; }
        .sub { text-align: center; font-size: 0.8rem; color: #888; margin-bottom: 20px; }
        h3 { font-size: 0.75rem; text-transform: uppercase; color: #999; letter-spacing: 1px; margin: 16px 0 4px; }
        p { margin: 2px 0; font-size: 0.95rem; }
        .divider { border-top: 1px dashed #aaa; margin: 16px 0; }
        .total { font-size: 1.1rem; font-weight: 700; color: #006666; }
        @media print { body { padding: 0; } }
      </style></head><body>
      <div class="border">
        <div class="brand">PERFECTFOOTIES</div>
        <div class="sub">Handcrafted Leather Goods — Lagos, Nigeria</div>
        <div class="divider"></div>
        <h3>Ship To</h3>
        <p><strong>${o.customerName || '—'}</strong></p>
        <p>${o.phone || o.shipping?.phone || '—'}</p>
        <p>${o.email || '—'}</p>
        ${o.shipping ? `<p>${[o.shipping.address, o.shipping.lga, o.shipping.state].filter(Boolean).join(', ')}</p>` : ''}
        <div class="divider"></div>
        <h3>Order Details</h3>
        <p>Order ID: <strong>${o.id}</strong></p>
        <p>Date: ${date}</p>
        <p>Type: ${o.type || '—'}</p>
        <div class="divider"></div>
        <h3>Items</h3>
        ${items}
        <div class="divider"></div>
        <p class="total">Total: ₦${((o.total || 0) + (o.extraCharge || 0)).toLocaleString()}</p>
      </div>
      <script>window.onload = function(){ window.print(); window.close(); }</script>
      </body></html>`);
    win.document.close();
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
  const title = 'Orders';

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
            sx={{ fontFamily, backgroundColor: '#006666', '&:hover': { backgroundColor: '#3a0b3e' } }}
          >
            Add Order
          </Button>
          <Button
            variant="outlined"
            startIcon={<FileDownloadIcon />}
            onClick={() => exportOrdersToCSV(filtered, `${title.toLowerCase()}-export.csv`)}
            sx={{ fontFamily, borderColor: '#006666', color: 'var(--text-purple)', '&:hover': { backgroundColor: '#006666', color: '#fff' } }}
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
        <FormControlLabel
          control={
            <Switch
              checked={hideAbandonedPending}
              onChange={(e) => setHideAbandonedPending(e.target.checked)}
              size="small"
              sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#006666' }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#006666' } }}
            />
          }
          label={
            <Typography sx={{ fontFamily, fontSize: '0.82rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
              Hide abandoned checkouts
            </Typography>
          }
          sx={{ ml: 0.5 }}
        />
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
            sx={{ fontFamily, backgroundColor: '#006666', '&:hover': { backgroundColor: '#3a0b3e' }, fontWeight: 600, textTransform: 'none' }}
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
            <TableRow sx={{ backgroundColor: '#006666' }}>
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
                        <MailOutlineIcon fontSize="small" sx={{ color: o.email ? '#006666' : '#ccc' }} />
                      )}
                    </IconButton>
                    <IconButton size="small" onClick={() => handleEditOpen(o)} title="Edit order details">
                      <EditIcon fontSize="small" sx={{ color: '#1565C0' }} />
                    </IconButton>
                    <IconButton size="small" onClick={() => { setNoteDialog(o); setNoteText(''); }} title="Add note">
                      <NoteAddIcon fontSize="small" sx={{ color: 'var(--text-purple)' }} />
                    </IconButton>
                    <IconButton size="small" onClick={() => printShippingLabel(o)} title="Print shipping label">
                      <LocalShippingIcon fontSize="small" sx={{ color: '#2e7d32' }} />
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
                              <Box key={i} sx={{ pl: 2, mb: 1, borderLeft: '2px solid #E8D5B0', ml: 1 }}>
                                <Typography sx={{ fontFamily, fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-purple)' }}>
                                  {item.serviceName || item.name || item.title || 'Item'}
                                </Typography>
                                <Typography sx={{ fontFamily, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                                  {item.kind === 'product' ? 'Leather Product' : item.kind === 'retail' ? 'Retail Product' : item.kind === 'nicheCollection' ? 'Leather Product (Legacy)' : item.kind || '—'}
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
                                {item.size && (
                                  <Typography sx={{ fontFamily, fontSize: '0.78rem', color: '#777' }}>
                                    Size: {item.size}
                                  </Typography>
                                )}
                                {item.colour && (
                                  <Typography sx={{ fontFamily, fontSize: '0.78rem', color: '#777' }}>
                                    Colour: {item.colour}
                                  </Typography>
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
                          <Box sx={{ mt: 1.5, p: 1.5, backgroundColor: '#FFF8F0', borderRadius: 2, border: '1px solid #E8D5B0' }}>
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
          Edit Order Details
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
            sx={{ fontFamily, backgroundColor: '#006666', '&:hover': { backgroundColor: '#3a0b3e' } }}
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
          Add Legacy Order
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

          <>
            <Select
              value={addForm.orderType}
              onChange={(e) => setAddForm((f) => ({ ...f, orderType: e.target.value }))}
              size="small"
              fullWidth
              sx={{ fontFamily }}
            >
              <MenuItem value="product">Leather Product</MenuItem>
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
            disabled={busy || !addForm.customerName.trim() || !addForm.total || !addForm.itemName.trim()}
            sx={{ fontFamily, backgroundColor: '#006666', '&:hover': { backgroundColor: '#3a0b3e' } }}
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
