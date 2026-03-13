import { useState, useMemo, useEffect } from 'react';
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
  Tooltip,
} from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import NoteAddIcon from '@mui/icons-material/NoteAdd';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import AddIcon from '@mui/icons-material/Add';
import HomeIcon from '@mui/icons-material/Home';
import StoreIcon from '@mui/icons-material/Store';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import EventNoteIcon from '@mui/icons-material/EventNote';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { updateOrderStatus, deleteOrder, addOrderNote, createAdminOrder } from '../../lib/adminService';
import { exportOrdersToCSV } from '../../lib/csvExport';
import { sendConfirmationEmail } from '../../lib/emailService';
import { fetchAllWaitlist } from '../../lib/bookedSlotsService';

const fontFamily = '"Georgia", serif';

const statusOptions = ['pending', 'confirmed', 'in progress', 'completed', 'rescheduled', 'cancelled'];
const statusColor = {
  pending: 'warning',
  confirmed: 'info',
  'in progress': 'secondary',
  completed: 'success',
  rescheduled: 'warning',
  cancelled: 'error',
};

const inputSx = { '& .MuiOutlinedInput-root': { fontFamily } };

function getHomeDetails(o) {
  // Check order root level first, then fall back to items
  const item = o.items?.find((i) => i.isHomeService);
  return {
    isHome: !!(o.isHomeService || item?.isHomeService),
    homeAddress: o.homeAddress || item?.homeAddress || '',
    homeLocation: o.homeLocation || item?.homeLocation || '',
    hasTableArea: o.hasTableArea || item?.hasTableArea || '',
    transportRange: o.transportRange || item?.transportRange || '',
  };
}

function StatCard({ icon, label, value, color }) {
  return (
    <Box
      sx={{
        flex: 1,
        minWidth: 120,
        p: 2,
        borderRadius: 2,
        backgroundColor: '#fff',
        border: '1px solid #F0C0D0',
        display: 'flex',
        alignItems: 'center',
        gap: 1.5,
      }}
    >
      <Box sx={{ color, fontSize: 28 }}>{icon}</Box>
      <Box>
        <Typography sx={{ fontFamily, fontWeight: 700, fontSize: '1.4rem', color, lineHeight: 1 }}>
          {value}
        </Typography>
        <Typography sx={{ fontFamily, fontSize: '0.78rem', color: '#777', mt: 0.3 }}>
          {label}
        </Typography>
      </Box>
    </Box>
  );
}

export default function AppointmentsSection({ orders, loading, onRefresh }) {
  const serviceOrders = useMemo(() => orders.filter((o) => o.type === 'service'), [orders]);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [locationFilter, setLocationFilter] = useState('all'); // 'all' | 'salon' | 'home'
  const [expandedId, setExpandedId] = useState(null);
  const [noteDialog, setNoteDialog] = useState(null);
  const [noteText, setNoteText] = useState('');
  const [deleteDialog, setDeleteDialog] = useState(null);
  const [busy, setBusy] = useState(false);
  const [emailPrompt, setEmailPrompt] = useState(null);
  const [emailFeedback, setEmailFeedback] = useState(null);
  const [sendingEmailId, setSendingEmailId] = useState(null);
  const [addDialog, setAddDialog] = useState(false);
  const [copiedId, setCopiedId] = useState(null);
  const [waitlist, setWaitlist] = useState([]);
  const [waitlistLoading, setWaitlistLoading] = useState(false);
  const [showWaitlist, setShowWaitlist] = useState(false);

  useEffect(() => {
    if (!showWaitlist || waitlist.length > 0) return;
    setWaitlistLoading(true);
    fetchAllWaitlist()
      .then(setWaitlist)
      .catch(() => {})
      .finally(() => setWaitlistLoading(false));
  }, [showWaitlist]);
  const [addForm, setAddForm] = useState({
    customerName: '', email: '', phone: '', status: 'pending',
    total: '', notes: '', createdAt: '',
    serviceName: '', appointmentDate: '', appointmentTime: '',
    serviceType: 'salon',
    homeAddress: '', homeLocation: '', hasTableArea: '',
  });

  const filtered = useMemo(() => {
    return serviceOrders.filter((o) => {
      if (statusFilter !== 'all' && o.status !== statusFilter) return false;
      if (locationFilter !== 'all') {
        const { isHome } = getHomeDetails(o);
        if (locationFilter === 'home' && !isHome) return false;
        if (locationFilter === 'salon' && isHome) return false;
      }
      if (search) {
        const s = search.toLowerCase();
        const name = (o.customerName || o.name || '').toLowerCase();
        const id = o.id.toLowerCase();
        const email = (o.email || '').toLowerCase();
        if (!name.includes(s) && !id.includes(s) && !email.includes(s)) return false;
      }
      return true;
    });
  }, [serviceOrders, statusFilter, locationFilter, search]);

  // Stats
  const stats = useMemo(() => {
    const total = serviceOrders.length;
    const pending = serviceOrders.filter((o) => o.status === 'pending').length;
    const confirmed = serviceOrders.filter((o) => o.status === 'confirmed').length;
    const homeCount = serviceOrders.filter((o) => getHomeDetails(o).isHome).length;
    return { total, pending, confirmed, homeCount };
  }, [serviceOrders]);

  const handleStatusChange = async (uid, orderId, newStatus) => {
    setBusy(true);
    try {
      await updateOrderStatus(uid, orderId, newStatus);
      await onRefresh();
      if (newStatus === 'confirmed') {
        const order = orders.find((o) => o.id === orderId);
        if (order?.email) setEmailPrompt({ ...order, status: newStatus });
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
    setEmailFeedback(
      result.success
        ? { severity: 'success', message: 'Confirmation email sent!' }
        : { severity: 'error', message: result.error || 'Failed to send' }
    );
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
    serviceType: 'salon',
    homeAddress: '', homeLocation: '', hasTableArea: '',
  });

  const handleAddSave = async () => {
    setBusy(true);
    try {
      const price = parseFloat(addForm.total) || 0;
      let appointmentDate = '';
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

      const isHome = addForm.serviceType === 'home';
      const orderData = {
        customerName: addForm.customerName,
        email: addForm.email,
        phone: addForm.phone,
        status: addForm.status,
        total: price,
        notes: addForm.notes,
        type: 'service',
        appointmentDate,
        ...(isHome && {
          isHomeService: true,
          homeAddress: addForm.homeAddress,
          homeLocation: addForm.homeLocation,
          hasTableArea: addForm.hasTableArea,
        }),
        items: [{
          kind: 'service',
          serviceName: addForm.serviceName,
          name: addForm.serviceName,
          price,
          date: appointmentDate,
          quantity: 1,
          ...(isHome && {
            isHomeService: true,
            homeAddress: addForm.homeAddress,
            homeLocation: addForm.homeLocation,
            hasTableArea: addForm.hasTableArea,
          }),
        }],
        createdAt: addForm.createdAt ? new Date(addForm.createdAt + 'T00:00:00') : null,
      };

      await createAdminOrder(orderData);
      await onRefresh();
      setAddDialog(false);
      resetAddForm();
    } catch (err) {
      console.error('Add appointment error:', err);
    } finally {
      setBusy(false);
    }
  };

  const handleCopyAddress = (address) => {
    navigator.clipboard.writeText(address).then(() => {
      setCopiedId(address);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  if (loading) {
    return (
      <Box>
        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} variant="rounded" height={72} sx={{ flex: 1, minWidth: 120 }} />)}
        </Box>
        <Skeleton variant="rounded" height={40} sx={{ mb: 2 }} />
        <Skeleton variant="rounded" height={400} />
      </Box>
    );
  }

  return (
    <Box>
      {/* Stats */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <StatCard icon={<EventNoteIcon fontSize="inherit" />} label="Total Appointments" value={stats.total} color="#4A0E4E" />
        <StatCard icon={<PendingActionsIcon fontSize="inherit" />} label="Pending" value={stats.pending} color="#E91E8C" />
        <StatCard icon={<CheckCircleOutlineIcon fontSize="inherit" />} label="Confirmed" value={stats.confirmed} color="#2e7d32" />
        <StatCard icon={<HomeIcon fontSize="inherit" />} label="Home Service" value={stats.homeCount} color="#1565C0" />
      </Box>

      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="h5" sx={{ fontFamily, fontWeight: 700 }}>
          Appointments ({filtered.length})
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setAddDialog(true)}
            sx={{ fontFamily, backgroundColor: '#4A0E4E', '&:hover': { backgroundColor: '#3a0b3e' } }}
          >
            Add Appointment
          </Button>
          <Button
            variant="outlined"
            startIcon={<FileDownloadIcon />}
            onClick={() => exportOrdersToCSV(filtered, 'appointments-export.csv')}
            sx={{ fontFamily, borderColor: '#4A0E4E', color: '#4A0E4E', '&:hover': { backgroundColor: '#4A0E4E', color: '#fff' } }}
          >
            Export CSV
          </Button>
        </Box>
      </Box>

      {/* Filters */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
        <TextField
          size="small"
          placeholder="Search by name, ID, email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ minWidth: 220, ...inputSx }}
        />
        <Select
          size="small"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          sx={{ minWidth: 150, fontFamily }}
        >
          <MenuItem value="all">All Statuses</MenuItem>
          {statusOptions.map((s) => (
            <MenuItem key={s} value={s}>{s}</MenuItem>
          ))}
        </Select>
        <Select
          size="small"
          value={locationFilter}
          onChange={(e) => setLocationFilter(e.target.value)}
          sx={{ minWidth: 150, fontFamily }}
        >
          <MenuItem value="all">All Locations</MenuItem>
          <MenuItem value="salon">Salon Visit</MenuItem>
          <MenuItem value="home">Home Service</MenuItem>
        </Select>
      </Box>

      {/* Table */}
      <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ backgroundColor: '#4A0E4E' }}>
              <TableCell sx={{ color: '#fff', fontFamily, fontWeight: 700, width: 40 }} />
              {['#', 'ID', 'Customer', 'Location', 'Status', 'Price', 'Appointment Date', 'Time', 'Booked On', 'Actions'].map((h) => (
                <TableCell key={h} sx={{ color: '#fff', fontFamily, fontWeight: 700 }}>{h}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.map((o, idx) => {
              const { isHome, homeLocation } = getHomeDetails(o);
              return (
                <>
                  <TableRow
                    key={o.id}
                    hover
                    sx={{ backgroundColor: isHome ? 'rgba(21, 101, 192, 0.04)' : 'inherit' }}
                  >
                    <TableCell>
                      <IconButton size="small" onClick={() => setExpandedId(expandedId === o.id ? null : o.id)}>
                        {expandedId === o.id ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                      </IconButton>
                    </TableCell>
                    <TableCell sx={{ fontFamily, fontSize: '0.78rem', color: '#999', width: 32 }}>{idx + 1}</TableCell>
                    <TableCell sx={{ fontFamily, fontSize: '0.8rem' }}>{o.id.slice(0, 8)}…</TableCell>
                    <TableCell sx={{ fontFamily }}>{o.customerName || o.name || '—'}</TableCell>
                    <TableCell>
                      {isHome ? (
                        <Chip
                          icon={<HomeIcon sx={{ fontSize: '14px !important' }} />}
                          label={homeLocation || 'Home'}
                          size="small"
                          sx={{ backgroundColor: '#E3F2FD', color: '#1565C0', fontWeight: 600, fontSize: '0.72rem' }}
                        />
                      ) : (
                        <Chip
                          icon={<StoreIcon sx={{ fontSize: '14px !important' }} />}
                          label="Salon"
                          size="small"
                          sx={{ backgroundColor: '#F3E5F5', color: '#6A1B9A', fontWeight: 600, fontSize: '0.72rem' }}
                        />
                      )}
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
                        const dateStr = raw ? raw.split(' at ')[0] : '—';
                        return (
                          <Box>
                            {dateStr}
                            {o.status === 'rescheduled' && (
                              <Chip label="rescheduled" size="small" sx={{ ml: 0.5, fontSize: '0.65rem', height: 18, backgroundColor: '#FFF3E0', color: '#E65100', fontWeight: 700 }} />
                            )}
                          </Box>
                        );
                      })()}
                    </TableCell>
                    <TableCell sx={{ fontFamily, fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                      {(() => {
                        const raw = o.appointmentDate || o.items?.[0]?.date;
                        return raw ? raw.split(' at ')[1]?.trim() || '—' : '—';
                      })()}
                    </TableCell>
                    <TableCell sx={{ fontFamily, fontSize: '0.8rem' }}>
                      {o.createdAt?.toDate ? o.createdAt.toDate().toLocaleDateString() : '—'}
                    </TableCell>
                    <TableCell>
                      <Tooltip title={o.email ? 'Send confirmation email' : 'No email on file'}>
                        <span>
                          <IconButton
                            size="small"
                            onClick={() => handleSendEmail(o)}
                            disabled={!o.email || !!sendingEmailId}
                          >
                            {sendingEmailId === o.id
                              ? <CircularProgress size={18} sx={{ color: '#4A0E4E' }} />
                              : <MailOutlineIcon fontSize="small" sx={{ color: o.email ? '#4A0E4E' : '#ccc' }} />}
                          </IconButton>
                        </span>
                      </Tooltip>
                      <Tooltip title="Add admin note">
                        <IconButton size="small" onClick={() => { setNoteDialog(o); setNoteText(''); }}>
                          <NoteAddIcon fontSize="small" sx={{ color: '#4A0E4E' }} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete appointment">
                        <IconButton size="small" onClick={() => setDeleteDialog(o)}>
                          <DeleteOutlineIcon fontSize="small" sx={{ color: '#d32f2f' }} />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>

                  {/* Expanded Detail Row */}
                  <TableRow key={`${o.id}-detail`}>
                    <TableCell colSpan={11} sx={{ p: 0, border: 0 }}>
                      <Collapse in={expandedId === o.id}>
                        <Box sx={{ p: 2.5, backgroundColor: '#fafafa', display: 'flex', gap: 3, flexWrap: 'wrap' }}>

                          {/* Left: Appointment Info */}
                          <Box sx={{ flex: 1, minWidth: 220 }}>
                            <Typography sx={{ fontFamily, fontSize: '0.8rem', fontWeight: 700, color: '#4A0E4E', mb: 1, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                              Appointment Info
                            </Typography>
                            {o.appointmentDate && (
                              <Typography sx={{ fontFamily, fontSize: '0.85rem', mb: 0.5 }}>
                                <strong>Date & Time:</strong> {o.appointmentDate}
                              </Typography>
                            )}
                            {o.email && (
                              <Typography sx={{ fontFamily, fontSize: '0.85rem', mb: 0.5 }}>
                                <strong>Email:</strong> {o.email}
                              </Typography>
                            )}
                            {o.phone && (
                              <Typography sx={{ fontFamily, fontSize: '0.85rem', mb: 0.5 }}>
                                <strong>Phone:</strong> {o.phone}
                              </Typography>
                            )}
                            {o.items?.map((item, i) => (
                              <Box key={i} sx={{ mt: 1, pl: 1.5, borderLeft: '3px solid #E91E8C' }}>
                                <Typography sx={{ fontFamily, fontSize: '0.85rem', fontWeight: 700, color: '#4A0E4E' }}>
                                  {item.serviceName || item.name || 'Service'}
                                </Typography>
                                {item.nailShape && (
                                  <Typography sx={{ fontFamily, fontSize: '0.78rem', color: '#555' }}>
                                    Shape: {item.nailShape}{item.nailLength ? ` · Length: ${item.nailLength}` : ''}
                                  </Typography>
                                )}
                                <Typography sx={{ fontFamily, fontSize: '0.78rem', color: '#777' }}>
                                  ₦{(item.price || 0).toLocaleString()}
                                </Typography>
                              </Box>
                            ))}
                          </Box>

                          {/* Middle: Location Details */}
                          <Box sx={{ flex: 1, minWidth: 220 }}>
                            <Typography sx={{ fontFamily, fontSize: '0.8rem', fontWeight: 700, color: '#4A0E4E', mb: 1, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                              Service Location
                            </Typography>
                            {(() => {
                              const { isHome, homeAddress, homeLocation, hasTableArea, transportRange } = getHomeDetails(o);
                              return isHome ? (
                                <Box sx={{ p: 1.5, borderRadius: 2, backgroundColor: '#E3F2FD', border: '1px solid #90CAF9' }}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1 }}>
                                    <HomeIcon sx={{ fontSize: 16, color: '#1565C0' }} />
                                    <Typography sx={{ fontFamily, fontSize: '0.85rem', fontWeight: 700, color: '#1565C0' }}>
                                      Home Service — {homeLocation || 'Location TBC'}
                                    </Typography>
                                  </Box>
                                  {homeAddress && (
                                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.5, mb: 0.5 }}>
                                      <Typography sx={{ fontFamily, fontSize: '0.82rem', color: '#333', flex: 1 }}>
                                        <strong>Address:</strong> {homeAddress}
                                      </Typography>
                                      <Tooltip title={copiedId === homeAddress ? 'Copied!' : 'Copy address'}>
                                        <IconButton size="small" onClick={() => handleCopyAddress(homeAddress)} sx={{ p: 0.3 }}>
                                          <ContentCopyIcon sx={{ fontSize: 14, color: copiedId === homeAddress ? '#2e7d32' : '#1565C0' }} />
                                        </IconButton>
                                      </Tooltip>
                                    </Box>
                                  )}
                                  {hasTableArea && (
                                    <Typography sx={{ fontFamily, fontSize: '0.82rem', color: '#333', mb: 0.5 }}>
                                      <strong>Table / Work Area:</strong> {hasTableArea}
                                    </Typography>
                                  )}
                                  {transportRange && (
                                    <Typography sx={{ fontFamily, fontSize: '0.82rem', color: '#1565C0', fontWeight: 600 }}>
                                      Est. Transport: {transportRange}
                                    </Typography>
                                  )}
                                </Box>
                              ) : (
                                <Box sx={{ p: 1.5, borderRadius: 2, backgroundColor: '#F3E5F5', border: '1px solid #CE93D8' }}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                    <StoreIcon sx={{ fontSize: 16, color: '#6A1B9A' }} />
                                    <Typography sx={{ fontFamily, fontSize: '0.85rem', fontWeight: 700, color: '#6A1B9A' }}>
                                      Salon Visit
                                    </Typography>
                                  </Box>
                                  <Typography sx={{ fontFamily, fontSize: '0.78rem', color: '#555', mt: 0.5 }}>
                                    Client comes to the studio
                                  </Typography>
                                </Box>
                              );
                            })()}
                          </Box>

                          {/* Reschedule Details (if rescheduled) */}
                          {o.status === 'rescheduled' && (
                            <Box sx={{ flex: 1, minWidth: 220 }}>
                              <Typography sx={{ fontFamily, fontSize: '0.8rem', fontWeight: 700, color: '#E65100', mb: 1, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                Reschedule Info
                              </Typography>
                              <Box sx={{ p: 1.5, borderRadius: 2, backgroundColor: '#FFF3E0', border: '1px solid #FFCC02' }}>
                                {o.previousDate && (
                                  <Typography sx={{ fontFamily, fontSize: '0.82rem', mb: 0.5 }}>
                                    <strong>Original Date:</strong> {o.previousDate}
                                  </Typography>
                                )}
                                {o.appointmentDate && (
                                  <Typography sx={{ fontFamily, fontSize: '0.82rem', mb: 0.5, color: '#2e7d32', fontWeight: 600 }}>
                                    <strong>New Date:</strong> {o.appointmentDate}
                                  </Typography>
                                )}
                                {o.rescheduleReason && (
                                  <Typography sx={{ fontFamily, fontSize: '0.82rem', mb: 0.5 }}>
                                    <strong>Reason:</strong> {o.rescheduleReason}
                                  </Typography>
                                )}
                                {o.rescheduledAt?.toDate && (
                                  <Typography sx={{ fontFamily, fontSize: '0.78rem', color: '#777' }}>
                                    Rescheduled on: {o.rescheduledAt.toDate().toLocaleDateString()}
                                  </Typography>
                                )}
                              </Box>
                            </Box>
                          )}

                          {/* Right: Notes */}
                          <Box sx={{ flex: 1, minWidth: 180 }}>
                            <Typography sx={{ fontFamily, fontSize: '0.8rem', fontWeight: 700, color: '#4A0E4E', mb: 1, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                              Notes
                            </Typography>
                            {o.notes ? (
                              <Typography sx={{ fontFamily, fontSize: '0.82rem', color: '#555', mb: 1 }}>
                                {o.notes}
                              </Typography>
                            ) : (
                              <Typography sx={{ fontFamily, fontSize: '0.78rem', color: '#aaa', mb: 1 }}>No customer notes</Typography>
                            )}
                            {o.adminNotes?.length > 0 && (
                              <Box>
                                <Typography sx={{ fontFamily, fontSize: '0.78rem', fontWeight: 700, color: '#4A0E4E', mb: 0.5 }}>
                                  Admin Notes:
                                </Typography>
                                {o.adminNotes.map((n, i) => (
                                  <Typography key={i} sx={{ fontFamily, fontSize: '0.78rem', color: '#4A0E4E', pl: 1, borderLeft: '2px solid #E91E8C', mb: 0.5 }}>
                                    [{n.timestamp}] {n.text}
                                  </Typography>
                                ))}
                              </Box>
                            )}
                          </Box>
                        </Box>
                      </Collapse>
                    </TableCell>
                  </TableRow>
                </>
              );
            })}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={11} sx={{ textAlign: 'center', fontFamily, py: 6, color: '#777' }}>
                  No appointments found
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
            fullWidth multiline rows={3}
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Enter note…"
            sx={{ mt: 1, ...inputSx }}
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

      {/* Delete Dialog */}
      <Dialog open={!!deleteDialog} onClose={() => setDeleteDialog(null)}>
        <DialogTitle sx={{ fontFamily, fontWeight: 700 }}>Delete Appointment?</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontFamily }}>
            This cannot be undone. Delete appointment for <strong>{deleteDialog?.customerName || deleteDialog?.name || 'this customer'}</strong>?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(null)} sx={{ fontFamily }}>Cancel</Button>
          <Button onClick={handleDelete} variant="contained" color="error" disabled={busy} sx={{ fontFamily }}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Appointment Dialog */}
      <Dialog open={addDialog} onClose={() => setAddDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontFamily, fontWeight: 700 }}>Add Legacy Appointment</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '8px !important' }}>
          <TextField label="Customer Name" required value={addForm.customerName}
            onChange={(e) => setAddForm((f) => ({ ...f, customerName: e.target.value }))}
            fullWidth size="small" sx={inputSx} />
          <TextField label="Email" value={addForm.email}
            onChange={(e) => setAddForm((f) => ({ ...f, email: e.target.value }))}
            fullWidth size="small" sx={inputSx} />
          <TextField label="Phone" value={addForm.phone}
            onChange={(e) => setAddForm((f) => ({ ...f, phone: e.target.value }))}
            fullWidth size="small" sx={inputSx} />
          <TextField label="Service Name" required value={addForm.serviceName}
            onChange={(e) => setAddForm((f) => ({ ...f, serviceName: e.target.value }))}
            fullWidth size="small" sx={inputSx} />
          <TextField label="Price (₦)" required type="number" value={addForm.total}
            onChange={(e) => setAddForm((f) => ({ ...f, total: e.target.value }))}
            fullWidth size="small" sx={inputSx} />
          <TextField label="Appointment Date" type="date" value={addForm.appointmentDate}
            onChange={(e) => setAddForm((f) => ({ ...f, appointmentDate: e.target.value }))}
            fullWidth size="small" slotProps={{ inputLabel: { shrink: true } }} sx={inputSx} />
          <TextField label="Appointment Time" type="time" value={addForm.appointmentTime}
            onChange={(e) => setAddForm((f) => ({ ...f, appointmentTime: e.target.value }))}
            fullWidth size="small" slotProps={{ inputLabel: { shrink: true } }} sx={inputSx} />

          {/* Service Type */}
          <Box>
            <Typography sx={{ fontFamily, fontSize: '0.85rem', fontWeight: 600, color: '#4A0E4E', mb: 0.8 }}>
              Service Type
            </Typography>
            <Box sx={{ display: 'flex', gap: 1.5 }}>
              {[{ value: 'salon', label: 'Salon Visit', icon: <StoreIcon sx={{ fontSize: 16 }} /> },
                { value: 'home', label: 'Home Service', icon: <HomeIcon sx={{ fontSize: 16 }} /> }].map(({ value, label, icon }) => (
                <Box
                  key={value}
                  onClick={() => setAddForm((f) => ({ ...f, serviceType: value }))}
                  sx={{
                    flex: 1, border: addForm.serviceType === value ? '2px solid #E91E8C' : '2px solid #F0C0D0',
                    borderRadius: 2, px: 2, py: 1, cursor: 'pointer',
                    backgroundColor: addForm.serviceType === value ? '#FFF0F5' : '#fff',
                    display: 'flex', alignItems: 'center', gap: 0.8, transition: 'all 0.2s ease',
                    '&:hover': { borderColor: '#E91E8C' },
                  }}
                >
                  <Box sx={{ color: addForm.serviceType === value ? '#E91E8C' : '#777' }}>{icon}</Box>
                  <Typography sx={{ fontFamily, fontSize: '0.88rem', fontWeight: 600, color: addForm.serviceType === value ? '#E91E8C' : '#555' }}>
                    {label}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>

          {/* Home service fields */}
          {addForm.serviceType === 'home' && (
            <>
              <TextField label="Home Address" multiline rows={2} value={addForm.homeAddress}
                onChange={(e) => setAddForm((f) => ({ ...f, homeAddress: e.target.value }))}
                fullWidth size="small" sx={inputSx} />
              <Select
                value={addForm.homeLocation}
                onChange={(e) => setAddForm((f) => ({ ...f, homeLocation: e.target.value }))}
                size="small" displayEmpty fullWidth sx={{ fontFamily }}
              >
                <MenuItem value="" disabled>Select Location</MenuItem>
                <MenuItem value="Lagos Island">Lagos Island</MenuItem>
                <MenuItem value="Lagos Mainland">Lagos Mainland</MenuItem>
              </Select>
              <Box sx={{ display: 'flex', gap: 1 }}>
                {['Yes', 'No'].map((opt) => (
                  <Box
                    key={opt}
                    onClick={() => setAddForm((f) => ({ ...f, hasTableArea: opt }))}
                    sx={{
                      flex: 1, border: addForm.hasTableArea === opt ? '2px solid #E91E8C' : '2px solid #F0C0D0',
                      borderRadius: 2, px: 2, py: 1, cursor: 'pointer', textAlign: 'center',
                      backgroundColor: addForm.hasTableArea === opt ? '#FFF0F5' : '#fff',
                      '&:hover': { borderColor: '#E91E8C' },
                    }}
                  >
                    <Typography sx={{ fontFamily, fontSize: '0.85rem', fontWeight: 600, color: addForm.hasTableArea === opt ? '#E91E8C' : '#555' }}>
                      Table Area: {opt}
                    </Typography>
                  </Box>
                ))}
              </Box>
            </>
          )}

          <Select value={addForm.status}
            onChange={(e) => setAddForm((f) => ({ ...f, status: e.target.value }))}
            size="small" fullWidth sx={{ fontFamily }}
          >
            {statusOptions.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
          </Select>
          <TextField label="Notes" multiline rows={2} value={addForm.notes}
            onChange={(e) => setAddForm((f) => ({ ...f, notes: e.target.value }))}
            fullWidth size="small" sx={inputSx} />
          <TextField label="Date Occurred" type="date" value={addForm.createdAt}
            onChange={(e) => setAddForm((f) => ({ ...f, createdAt: e.target.value }))}
            fullWidth size="small" slotProps={{ inputLabel: { shrink: true } }}
            helperText="Historical date this appointment took place"
            sx={inputSx} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setAddDialog(false); resetAddForm(); }} sx={{ fontFamily }}>Cancel</Button>
          <Button
            onClick={handleAddSave}
            variant="contained"
            disabled={busy || !addForm.customerName.trim() || !addForm.total || !addForm.serviceName.trim()}
            sx={{ fontFamily, backgroundColor: '#4A0E4E', '&:hover': { backgroundColor: '#3a0b3e' } }}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Waitlist Section */}
      <Box sx={{ mt: 4 }}>
        <Box
          sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, cursor: 'pointer' }}
          onClick={() => setShowWaitlist((v) => !v)}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PendingActionsIcon sx={{ color: '#e65100' }} />
            <Typography sx={{ fontFamily, fontWeight: 700, fontSize: '1.1rem' }}>Waitlist</Typography>
          </Box>
          <Button size="small" sx={{ fontFamily, textTransform: 'none', color: '#e65100' }}>
            {showWaitlist ? 'Hide' : 'Show'}
          </Button>
        </Box>
        {showWaitlist && (
          waitlistLoading ? (
            <CircularProgress size={24} sx={{ color: '#e65100', display: 'block', mx: 'auto' }} />
          ) : waitlist.length === 0 ? (
            <Typography sx={{ fontFamily, color: '#999', fontSize: '0.9rem' }}>No one on the waitlist.</Typography>
          ) : (
            <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#e65100' }}>
                    {['Name', 'Phone', 'Email', 'Requested Date', 'Joined'].map((h) => (
                      <TableCell key={h} sx={{ color: '#fff', fontFamily, fontWeight: 700 }}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {waitlist.map((w) => (
                    <TableRow key={w.id} hover>
                      <TableCell sx={{ fontFamily }}>{w.name || '—'}</TableCell>
                      <TableCell sx={{ fontFamily }}>{w.phone || '—'}</TableCell>
                      <TableCell sx={{ fontFamily, fontSize: '0.8rem' }}>{w.email || '—'}</TableCell>
                      <TableCell sx={{ fontFamily }}>{w.date || '—'}</TableCell>
                      <TableCell sx={{ fontFamily, fontSize: '0.8rem' }}>
                        {w.createdAt?.toDate ? w.createdAt.toDate().toLocaleDateString() : '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )
        )}
      </Box>

      {/* Email Prompt Snackbar */}
      <Snackbar
        open={!!emailPrompt}
        autoHideDuration={10000}
        onClose={() => setEmailPrompt(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        message={`Send confirmation email to ${emailPrompt?.customerName || emailPrompt?.name || 'customer'}?`}
        action={
          <>
            <Button color="primary" size="small" onClick={() => handleSendEmail(emailPrompt)} sx={{ fontFamily }}>Send</Button>
            <Button color="inherit" size="small" onClick={() => setEmailPrompt(null)} sx={{ fontFamily }}>Dismiss</Button>
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
        <Alert onClose={() => setEmailFeedback(null)} severity={emailFeedback?.severity || 'info'} sx={{ fontFamily }}>
          {emailFeedback?.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
