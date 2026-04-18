import React, { useState, useMemo } from 'react';
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
  Menu,
  ListItemIcon,
  ListItemText,
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
import MoreVertIcon from '@mui/icons-material/MoreVert';
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
  const [trackingDialog, setTrackingDialog] = useState(null); // { uid, orderId }
  const [trackingLink, setTrackingLink] = useState('');
  const [actionMenu, setActionMenu] = useState(null); // { anchor, order }
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
    if (newStatus === 'shipped') {
      setTrackingLink('');
      setTrackingDialog({ uid, orderId });
      return;
    }
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

  const handleConfirmShipped = async () => {
    if (!trackingDialog) return;
    const { uid, orderId } = trackingDialog;
    setBusy(true);
    setTrackingDialog(null);
    try {
      await updateOrderStatus(uid, orderId, 'shipped', { trackingLink: trackingLink.trim() || null });
      await onRefresh();
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
    const date = o.createdAt?.toDate ? o.createdAt.toDate().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '—';
    const sh = o.shipping || {};
    const addrParts = [sh.address, sh.lga, sh.city, sh.state, sh.country && sh.country !== 'Nigeria' ? sh.country : ''].filter(Boolean);
    const itemRows = (o.items || []).map((item, i) => `
      <tr>
        <td>${i + 1}. ${item.name || 'Item'}</td>
        <td style="text-align:center;">${item.quantity || 1}</td>
        <td style="text-align:right;">${item.selectedColor || item.colour || '—'}</td>
        <td style="text-align:right;font-weight:700;">₦${(item.price || 0).toLocaleString()}</td>
      </tr>`).join('');
    const logoUrl = `${window.location.origin}/images/logo.png`;
    const win = window.open('', '_blank', 'width=640,height=800');
    win.document.write(`<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8"/>
  <title>Shipping Label — ${o.id}</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family: Georgia, serif; color: #1a1a1a; background: #f0ebe0; padding: 28px 20px; }
    .page { max-width: 560px; margin: 0 auto; background: #fff; border: 2px solid #e8d5b0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,122,122,0.12); }
    .header { background: linear-gradient(135deg, #005f5f, #007a7a, #009494); padding: 22px 24px; text-align: center; }
    .logo { width: 64px; height: 64px; object-fit: contain; border-radius: 50%; background: rgba(255,255,255,0.15); padding: 6px; display: block; margin: 0 auto 8px; }
    .brand { font-size: 20px; font-weight: 800; letter-spacing: 2px; color: #fff; }
    .brand-sub { font-size: 11px; color: rgba(255,255,255,0.7); margin-top: 3px; }
    .doc-badge { display: inline-block; color: #fff; font-size: 10px; font-weight: 700; letter-spacing: 2px; padding: 4px 14px; border-radius: 20px; margin-top: 10px; border: 1.5px solid rgba(255,255,255,0.4); background: rgba(255,255,255,0.12); }
    .accent-bar { height: 4px; background: linear-gradient(90deg, #e3242b, #007a7a, #e3242b); }
    .body { padding: 20px 22px; }
    .section { margin-bottom: 18px; }
    .section-title { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; color: #007a7a; border-left: 3px solid #007a7a; padding-left: 8px; margin-bottom: 10px; }
    .to-box { background: #f9f5ee; border: 1.5px solid #e8d5b0; border-left: 4px solid #007a7a; border-radius: 0 8px 8px 0; padding: 14px 16px; font-size: 14px; line-height: 2; }
    .to-name { font-size: 16px; font-weight: 800; color: #1a1a1a; }
    .to-detail { color: #555; font-size: 13px; }
    .meta-table { width: 100%; border-collapse: collapse; font-size: 12px; border: 1.5px solid #e8d5b0; border-radius: 8px; overflow: hidden; }
    .meta-table td { padding: 6px 12px; }
    .meta-table tr:nth-child(even) { background: #f9f5ee; }
    .meta-table .key { color: #888; width: 36%; }
    .meta-table .val { font-weight: 600; }
    .items-wrap { border: 1.5px solid #e8d5b0; border-radius: 8px; overflow: hidden; }
    .items-table { width: 100%; border-collapse: collapse; font-size: 12px; }
    .items-table thead tr { background: linear-gradient(135deg, #005f5f, #007a7a); }
    .items-table thead td { color: #fff; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px; padding: 8px 10px; }
    .items-table tbody tr { border-bottom: 1px solid #f0e8d8; }
    .items-table tbody tr:last-child { border-bottom: none; }
    .items-table tbody tr:nth-child(even) { background: #fdfaf5; }
    .items-table tbody td { padding: 8px 10px; vertical-align: top; }
    .total-bar { background: linear-gradient(135deg, #005f5f, #007a7a); color: #fff; display: flex; justify-content: space-between; align-items: center; padding: 12px 14px; font-size: 15px; font-weight: 800; border-radius: 8px; margin-top: 14px; }
    .from-box { background: linear-gradient(135deg, #e8fff8, #d4f5ee); border: 1.5px solid #b2f0e0; border-radius: 8px; padding: 12px 16px; font-size: 12px; color: #555; line-height: 1.8; }
    .from-brand { font-weight: 700; color: #007a7a; font-size: 13px; }
    .footer { background: #f9f5ee; border-top: 2px solid #e8d5b0; padding: 14px 22px; text-align: center; font-size: 11px; color: #999; }
    @media print { body { background: #fff; padding: 0; } .page { border: none; border-radius: 0; box-shadow: none; max-width: 100%; } }
  </style>
</head>
<body>
<div class="page">
  <div class="header">
    <img src="${logoUrl}" alt="Perfect Footies" class="logo"/>
    <div class="brand">PERFECT FOOTIES</div>
    <div class="brand-sub">perfectfooties.com &nbsp;·&nbsp; Gbagada, Lagos</div>
    <div class="doc-badge">SHIPPING LABEL</div>
  </div>
  <div class="accent-bar"></div>

  <div class="body">
    <div class="section">
      <div class="section-title">Ship To</div>
      <div class="to-box">
        <div class="to-name">${o.customerName || '—'}</div>
        ${sh.phone || o.phone ? `<div class="to-detail">${sh.phone || o.phone}</div>` : ''}
        ${o.email ? `<div class="to-detail">${o.email}</div>` : ''}
        ${addrParts.length ? `<div class="to-detail">${addrParts.join(', ')}</div>` : ''}
      </div>
    </div>

    <div class="section">
      <div class="section-title">Order Reference</div>
      <table class="meta-table">
        <tr><td class="key">Order ID</td><td class="val">${o.id}</td></tr>
        <tr><td class="key">Date</td><td class="val">${date}</td></tr>
        <tr><td class="key">Type</td><td class="val">${o.type || '—'}</td></tr>
        <tr><td class="key">Status</td><td class="val">${o.status || '—'}</td></tr>
      </table>
    </div>

    <div class="section">
      <div class="section-title">Items</div>
      <div class="items-wrap">
        <table class="items-table">
          <thead><tr>
            <td>Item</td><td style="text-align:center;">Qty</td><td style="text-align:right;">Colour</td><td style="text-align:right;">Price</td>
          </tr></thead>
          <tbody>${itemRows}</tbody>
        </table>
      </div>
      <div class="total-bar">
        <span>Total</span>
        <span>₦${((o.total || 0) + (o.extraCharge || 0)).toLocaleString()}</span>
      </div>
    </div>

    <div class="section">
      <div class="section-title">Shipped From</div>
      <div class="from-box">
        <div class="from-brand">Perfect Footies</div>
        <div>Gbagada, Lagos, Nigeria</div>
        <div>perfectfooties.com</div>
      </div>
    </div>
  </div>

  <div class="footer">Handle with care &nbsp;·&nbsp; Handcrafted leather goods</div>
</div>
<script>window.onload = function(){ window.print(); }</script>
</body>
</html>`);
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
            sx={{ fontFamily, backgroundColor: '#007a7a', '&:hover': { backgroundColor: '#005a5a' } }}
          >
            Add Order
          </Button>
          <Button
            variant="outlined"
            startIcon={<FileDownloadIcon />}
            onClick={() => exportOrdersToCSV(filtered, `${title.toLowerCase()}-export.csv`)}
            sx={{ fontFamily, borderColor: '#007a7a', color: 'var(--text-purple)', '&:hover': { backgroundColor: '#007a7a', color: '#fff' } }}
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
              sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#007a7a' }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#007a7a' } }}
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
            sx={{ fontFamily, backgroundColor: '#007a7a', '&:hover': { backgroundColor: '#005a5a' }, fontWeight: 600, textTransform: 'none' }}
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
            <TableRow sx={{ backgroundColor: '#007a7a' }}>
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
              <React.Fragment key={o.id}>
                <TableRow hover selected={selectedOrders.has(o.id)} sx={{ '&.Mui-selected': { backgroundColor: '#f3e5f5' }, '&.Mui-selected:hover': { backgroundColor: '#ede0f5' } }}>
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
                      onClick={(e) => { e.stopPropagation(); setActionMenu({ anchor: e.currentTarget, order: o }); }}
                    >
                      {sendingEmailId === o.id
                        ? <CircularProgress size={18} sx={{ color: 'var(--text-purple)' }} />
                        : <MoreVertIcon fontSize="small" />}
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
              </React.Fragment>
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
            sx={{ fontFamily, backgroundColor: '#007a7a', '&:hover': { backgroundColor: '#005a5a' } }}
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
            sx={{ fontFamily, backgroundColor: '#007a7a', '&:hover': { backgroundColor: '#005a5a' } }}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Tracking Link Dialog */}
      <Dialog open={!!trackingDialog} onClose={() => setTrackingDialog(null)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontFamily, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
          <LocalShippingIcon sx={{ color: '#e3242b' }} /> Mark as Shipped
        </DialogTitle>
        <DialogContent sx={{ pt: '8px !important' }}>
          <Typography sx={{ color: 'var(--text-muted)', fontSize: '0.88rem', mb: 2 }}>
            Optionally paste the Fez Delivery tracking link. The customer will see a "Track My Package" button in their account.
          </Typography>
          <TextField
            fullWidth
            label="Fez Delivery Tracking Link (optional)"
            placeholder="https://fezdelivery.co/track/..."
            value={trackingLink}
            onChange={(e) => setTrackingLink(e.target.value)}
            size="small"
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, '& fieldset': { borderColor: '#E8D5B0' }, '&.Mui-focused fieldset': { borderColor: '#e3242b' } } }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setTrackingDialog(null)} sx={{ fontFamily }}>Cancel</Button>
          <Button onClick={handleConfirmShipped} variant="contained" sx={{ backgroundColor: '#e3242b', color: '#fff', borderRadius: '20px', fontFamily, fontWeight: 700, '&:hover': { backgroundColor: '#b81b21' } }}>
            Confirm Shipped
          </Button>
        </DialogActions>
      </Dialog>

      {/* Action overflow menu */}
      <Menu
        anchorEl={actionMenu?.anchor}
        open={Boolean(actionMenu)}
        onClose={() => setActionMenu(null)}
        PaperProps={{ sx: { borderRadius: 2, border: '1px solid #E8D5B0', minWidth: 200 } }}
      >
        <MenuItem
          disabled={!actionMenu?.order?.email || !!sendingEmailId}
          onClick={() => { const o = actionMenu.order; setActionMenu(null); handleSendEmail(o); }}
        >
          <ListItemIcon><MailOutlineIcon fontSize="small" sx={{ color: '#007a7a' }} /></ListItemIcon>
          <ListItemText primaryTypographyProps={{ fontSize: '0.85rem', fontFamily }}>Send Email</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { handleEditOpen(actionMenu.order); setActionMenu(null); }}>
          <ListItemIcon><EditIcon fontSize="small" sx={{ color: '#1565C0' }} /></ListItemIcon>
          <ListItemText primaryTypographyProps={{ fontSize: '0.85rem', fontFamily }}>Edit Order</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { setNoteDialog(actionMenu.order); setNoteText(''); setActionMenu(null); }}>
          <ListItemIcon><NoteAddIcon fontSize="small" sx={{ color: 'var(--text-purple)' }} /></ListItemIcon>
          <ListItemText primaryTypographyProps={{ fontSize: '0.85rem', fontFamily }}>Add Note</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { printShippingLabel(actionMenu.order); setActionMenu(null); }}>
          <ListItemIcon><LocalShippingIcon fontSize="small" sx={{ color: '#2e7d32' }} /></ListItemIcon>
          <ListItemText primaryTypographyProps={{ fontSize: '0.85rem', fontFamily }}>Print Label</ListItemText>
        </MenuItem>
        <MenuItem onClick={() => { setDeleteDialog(actionMenu.order); setActionMenu(null); }} sx={{ color: '#d32f2f' }}>
          <ListItemIcon><DeleteOutlineIcon fontSize="small" sx={{ color: '#d32f2f' }} /></ListItemIcon>
          <ListItemText primaryTypographyProps={{ fontSize: '0.85rem', fontFamily, color: '#d32f2f' }}>Delete</ListItemText>
        </MenuItem>
      </Menu>

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
