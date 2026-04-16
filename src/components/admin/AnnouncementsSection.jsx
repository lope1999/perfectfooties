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
  Button,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Snackbar,
  Alert,
  Skeleton,
  Switch,
  Tooltip,
  FormControlLabel,
  Select,
  InputLabel,
  FormControl,
  MenuItem,
  Divider,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CloseIcon from '@mui/icons-material/Close';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import {
  fetchAnnouncements,
  addAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} from '../../lib/announcementService';
import { fetchProducts } from '../../lib/productService';
import ImageUploadField from './ImageUploadField';

const fontFamily = '"Georgia", serif';

const emptyForm = {
  title: '',
  message: '',
  ctaLabel: '',
  ctaLink: '',
  imageUrl: '',
  active: false,
  expiresAt: '',
};

export default function AnnouncementsSection() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteDialog, setDeleteDialog] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' });
  const [products, setProducts] = useState([]);
  const [selectedCollectionId, setSelectedCollectionId] = useState('');

  const loadAnnouncements = () => {
    setLoading(true);
    fetchAnnouncements()
      .then(setAnnouncements)
      .catch(() => setAnnouncements([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadAnnouncements(); }, []);

  const showSnack = (message, severity = 'success') =>
    setSnack({ open: true, message, severity });

  const openDialog = () => {
    fetchProducts().then(setProducts).catch(() => setProducts([]));
  };

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setSelectedCollectionId('');
    openDialog();
    setDialogOpen(true);
  };

  const openEdit = (a) => {
    setEditingId(a.id);
    setForm({
      title: a.title || '',
      message: a.message || '',
      ctaLabel: a.ctaLabel || '',
      ctaLink: a.ctaLink || '',
      imageUrl: a.imageUrl || '',
      active: Boolean(a.active),
      expiresAt: a.expiresAt ? a.expiresAt.toDate?.().toISOString().slice(0, 16) : '',
    });
    // Pre-select product if ctaLink matches /shop/:id
    const match = (a.ctaLink || '').match(/^\/shop\/(.+)$/);
    setSelectedCollectionId(match ? match[1] : '');
    openDialog();
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.title.trim()) { showSnack('Title is required', 'error'); return; }

    setBusy(true);
    try {
      const payload = {
        title: form.title.trim(),
        message: form.message.trim(),
        ctaLabel: form.ctaLabel.trim(),
        ctaLink: form.ctaLink.trim(),
        imageUrl: form.imageUrl.trim(),
        active: form.active,
        expiresAt: form.expiresAt ? new Date(form.expiresAt) : null,
      };

      if (editingId) {
        await updateAnnouncement(editingId, payload);
        showSnack('Announcement updated');
      } else {
        await addAnnouncement(payload);
        showSnack('Announcement created');
      }
      setDialogOpen(false);
      loadAnnouncements();
    } catch {
      showSnack('Something went wrong — please try again', 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog) return;
    setBusy(true);
    try {
      await deleteAnnouncement(deleteDialog.id);
      showSnack('Announcement deleted');
      setDeleteDialog(null);
      loadAnnouncements();
    } catch {
      showSnack('Failed to delete', 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleToggleActive = async (a) => {
    try {
      await updateAnnouncement(a.id, { active: !a.active });
      showSnack(a.active ? 'Announcement deactivated' : 'Announcement activated');
      loadAnnouncements();
    } catch {
      showSnack('Failed to update', 'error');
    }
  };

  const formatDate = (ts) => {
    if (!ts) return '—';
    const d = ts.toDate?.() ?? new Date(ts);
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const activeCount = announcements.filter((a) => a.active).length;

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box>
          <Typography variant="h5" sx={{ fontFamily, fontWeight: 700, color: 'var(--text-purple)' }}>
            Announcements
          </Typography>
          <Typography sx={{ fontFamily, fontSize: '0.82rem', color: '#888', mt: 0.3 }}>
            Active announcements appear as a banner on the homepage.
            {activeCount > 1 && (
              <Typography component="span" sx={{ color: '#e65100', fontWeight: 600, ml: 1 }}>
                {activeCount} are currently active — only the newest will show.
              </Typography>
            )}
          </Typography>
        </Box>
        <Button
          startIcon={<AddIcon />}
          onClick={openAdd}
          sx={{
            backgroundColor: '#e3242b',
            color: '#fff',
            borderRadius: '20px',
            fontFamily,
            fontWeight: 600,
            textTransform: 'none',
            px: 2.5,
            '&:hover': { backgroundColor: '#b81b21' },
          }}
        >
          New Announcement
        </Button>
      </Box>

      {/* Table */}
      <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: 'none', border: '1px solid #eee' }}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: '#FFF8F0' }}>
              {['Title', 'Message', 'CTA', 'Expires', 'Active', 'Actions'].map((h) => (
                <TableCell key={h} sx={{ fontFamily, fontWeight: 700, fontSize: '0.8rem', color: '#888' }}>{h}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              Array.from({ length: 2 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 6 }).map((__, j) => (
                    <TableCell key={j}><Skeleton /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : announcements.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} sx={{ textAlign: 'center', py: 4, color: '#aaa', fontFamily }}>
                  No announcements yet.
                </TableCell>
              </TableRow>
            ) : (
              announcements.map((a) => (
                <TableRow key={a.id} sx={{ '&:hover': { backgroundColor: '#FFFAFA' } }}>
                  <TableCell sx={{ fontFamily, fontWeight: 600, fontSize: '0.88rem', maxWidth: 180 }}>
                    {a.title}
                    {a.active && (
                      <Chip label="Live" size="small" sx={{ ml: 1, backgroundColor: '#e8f5e9', color: '#2e7d32', fontWeight: 700, fontSize: '0.6rem', height: 18 }} />
                    )}
                  </TableCell>
                  <TableCell sx={{ fontFamily, fontSize: '0.82rem', color: '#666', maxWidth: 200 }}>
                    <Typography noWrap sx={{ fontSize: '0.82rem', color: '#666', maxWidth: 180 }}>{a.message || '—'}</Typography>
                  </TableCell>
                  <TableCell sx={{ fontFamily, fontSize: '0.82rem', color: '#666' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {a.imageUrl && (
                        <Box
                          component="img"
                          src={a.imageUrl}
                          alt=""
                          sx={{ height: 22, maxWidth: 50, objectFit: 'contain', borderRadius: 0.5, border: '1px solid #eee' }}
                        />
                      )}
                      <Typography noWrap sx={{ fontSize: '0.82rem', color: '#666', maxWidth: 140 }}>
                        {a.ctaLabel ? `${a.ctaLabel} → ${a.ctaLink}` : '—'}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ fontFamily, fontSize: '0.82rem', color: '#666' }}>
                    {formatDate(a.expiresAt)}
                  </TableCell>
                  <TableCell>
                    <Switch
                      size="small"
                      checked={Boolean(a.active)}
                      onChange={() => handleToggleActive(a)}
                      sx={{ '& .MuiSwitch-thumb': { backgroundColor: a.active ? '#e3242b' : '#bbb' } }}
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      <Tooltip title="Preview">
                        <IconButton size="small" onClick={() => { openEdit(a); setPreviewOpen(true); }} sx={{ color: '#888' }}>
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit">
                        <IconButton size="small" onClick={() => openEdit(a)} sx={{ color: '#e3242b' }}>
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton size="small" onClick={() => setDeleteDialog(a)} sx={{ color: '#d32f2f' }}>
                          <DeleteOutlineIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => { if (!busy) { setDialogOpen(false); setSelectedCollectionId(''); } }} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontFamily, fontWeight: 700 }}>
          {editingId ? 'Edit Announcement' : 'New Announcement'}
        </DialogTitle>
        <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 2 }}>
          {/* Preview strip */}
          {(form.title || form.message) && (
            <Box>
              <Typography sx={{ fontFamily, fontSize: '0.72rem', color: '#aaa', mb: 0.5 }}>BANNER PREVIEW</Typography>
              <Box
                sx={{
                  background: 'linear-gradient(135deg, #2D0845 0%, #6B1050 55%, #B5145E 100%)',
                  color: '#fff',
                  borderRadius: 2,
                  overflow: 'hidden',
                  display: 'flex',
                  alignItems: 'stretch',
                  gap: 0,
                  minHeight: form.imageUrl ? 90 : 'auto',
                }}
              >
                {/* Text + CTA side */}
                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', px: 2, py: 1.5, gap: 0.8 }}>
                  <Typography sx={{ fontSize: '0.78rem' }}>
                    <strong>{form.title}</strong>
                    {form.message && <span style={{ marginLeft: 6, opacity: 0.82, fontSize: '0.74rem' }}>{form.message}</span>}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {form.ctaLabel && (
                      <Chip
                        label={`${form.ctaLabel} →`}
                        size="small"
                        sx={{ backgroundColor: '#e3242b', color: '#fff', fontWeight: 700, fontSize: '0.62rem' }}
                      />
                    )}
                    <CloseIcon sx={{ fontSize: 12, opacity: 0.5 }} />
                  </Box>
                </Box>
                {/* Featured image side */}
                {form.imageUrl && (
                  <Box
                    component="img"
                    src={form.imageUrl}
                    alt=""
                    sx={{
                      width: 110,
                      height: '100%',
                      minHeight: 90,
                      objectFit: 'cover',
                      flexShrink: 0,
                      display: 'block',
                      borderLeft: '2px solid rgba(255,255,255,0.1)',
                    }}
                  />
                )}
              </Box>
            </Box>
          )}

          <TextField
            label="Title *"
            fullWidth
            size="small"
            value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
            inputProps={{ maxLength: 100 }}
            InputProps={{ sx: { fontFamily } }}
          />

          <TextField
            label="Message (supporting text)"
            fullWidth
            size="small"
            multiline
            rows={2}
            value={form.message}
            onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
            inputProps={{ maxLength: 200 }}
            InputProps={{ sx: { fontFamily } }}
          />

          {/* Announcement image */}
          <Box>
            <Divider sx={{ mb: 2 }}>
              <Typography sx={{ fontSize: '0.72rem', color: '#aaa', fontFamily, px: 1 }}>
                ANNOUNCEMENT IMAGE (optional)
              </Typography>
            </Divider>
            <Typography sx={{ fontFamily, fontSize: '0.78rem', color: '#888', mb: 1.5 }}>
              Add a logo or icon to display beside your announcement text — great for payment providers, partner logos, or product icons.
            </Typography>
            <ImageUploadField
              label=""
              value={form.imageUrl}
              onChange={(url) => setForm((f) => ({ ...f, imageUrl: url }))}
              folder="announcements"
            />
          </Box>

          {/* Collection Picker */}
          <Box>
            <Divider sx={{ mb: 2 }}>
              <Typography sx={{ fontSize: '0.72rem', color: '#aaa', fontFamily, px: 1 }}>
                LINK TO A COLLECTION (optional)
              </Typography>
            </Divider>
            <FormControl fullWidth size="small">
              <InputLabel sx={{ fontFamily }}>Link to Product</InputLabel>
              <Select
                value={selectedCollectionId}
                label="Link to Product"
                onChange={(e) => {
                  const colId = e.target.value;
                  setSelectedCollectionId(colId);
                  if (!colId) return;
                  const col = products.find((c) => c.id === colId);
                  if (!col) return;
                  setForm((f) => ({
                    ...f,
                    ctaLink: `/shop/${col.id}`,
                    ctaLabel: f.ctaLabel.trim() ? f.ctaLabel : 'Shop Now',
                  }));
                }}
                sx={{ fontFamily }}
                renderValue={(val) => {
                  if (!val) return <em style={{ color: '#aaa' }}>None — manual link below</em>;
                  const col = products.find((c) => c.id === val);
                  return col ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <AutoAwesomeIcon sx={{ fontSize: 14, color: '#e3242b' }} />
                      {col.name}
                      {col.material && <Typography component="span" sx={{ fontSize: '0.72rem', color: '#e3242b', ml: 0.5 }}>({col.material})</Typography>}
                    </Box>
                  ) : val;
                }}
              >
                <MenuItem value=""><em>None — manual link below</em></MenuItem>
                {products.map((col) => (
                  <MenuItem key={col.id} value={col.id}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <AutoAwesomeIcon sx={{ fontSize: 14, color: '#e3242b' }} />
                      <Typography sx={{ fontFamily, fontSize: '0.88rem' }}>{col.name}</Typography>
                      {col.material && (
                        <Typography sx={{ fontSize: '0.72rem', color: '#e3242b' }}>({col.material})</Typography>
                      )}
                      <Chip
                        label={col.status}
                        size="small"
                        sx={{
                          ml: 'auto',
                          height: 18,
                          fontSize: '0.6rem',
                          backgroundColor: col.status === 'open' ? '#e8f5e9' : col.status === 'upcoming' ? '#fff3e0' : '#f5f5f5',
                          color: col.status === 'open' ? '#2e7d32' : col.status === 'upcoming' ? '#e65100' : '#616161',
                          fontWeight: 700,
                        }}
                      />
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            {selectedCollectionId && (
              <Typography sx={{ fontSize: '0.72rem', color: '#888', mt: 0.5, fontFamily }}>
                CTA link auto-filled below — you can still edit it manually.
              </Typography>
            )}
          </Box>

          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              label="CTA Button Label (optional)"
              size="small"
              value={form.ctaLabel}
              onChange={(e) => setForm((f) => ({ ...f, ctaLabel: e.target.value }))}
              sx={{ flex: 1 }}
              placeholder="e.g. Shop Now"
              InputProps={{ sx: { fontFamily } }}
            />
            <TextField
              label="CTA Link (optional)"
              size="small"
              value={form.ctaLink}
              onChange={(e) => setForm((f) => ({ ...f, ctaLink: e.target.value }))}
              sx={{ flex: 1 }}
              placeholder="/collections"
              InputProps={{ sx: { fontFamily } }}
            />
          </Box>

          <TextField
            label="Auto-Expire Date (optional)"
            size="small"
            type="datetime-local"
            value={form.expiresAt}
            onChange={(e) => setForm((f) => ({ ...f, expiresAt: e.target.value }))}
            InputLabelProps={{ shrink: true }}
            fullWidth
          />

          <FormControlLabel
            control={
              <Switch
                checked={form.active}
                onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
                sx={{ '& .MuiSwitch-thumb': { backgroundColor: form.active ? '#e3242b' : '#bbb' } }}
              />
            }
            label={<Typography sx={{ fontFamily, fontSize: '0.88rem', fontWeight: 600 }}>Show on homepage now</Typography>}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={() => { setDialogOpen(false); setSelectedCollectionId(''); }} disabled={busy} sx={{ fontFamily, color: '#888', textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={busy}
            sx={{
              fontFamily,
              fontWeight: 700,
              backgroundColor: '#e3242b',
              color: '#fff',
              borderRadius: '20px',
              textTransform: 'none',
              px: 3,
              '&:hover': { backgroundColor: '#b81b21' },
            }}
          >
            {busy ? 'Saving…' : editingId ? 'Save Changes' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={Boolean(deleteDialog)} onClose={() => setDeleteDialog(null)} maxWidth="xs">
        <DialogTitle sx={{ fontFamily, fontWeight: 700 }}>Delete Announcement?</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontFamily, fontSize: '0.9rem' }}>
            Delete <strong>"{deleteDialog?.title}"</strong>? This cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={() => setDeleteDialog(null)} sx={{ fontFamily, color: '#888', textTransform: 'none' }}>Cancel</Button>
          <Button
            onClick={handleDelete}
            disabled={busy}
            sx={{ fontFamily, fontWeight: 700, backgroundColor: '#d32f2f', color: '#fff', borderRadius: '20px', textTransform: 'none', px: 2.5, '&:hover': { backgroundColor: '#b71c1c' } }}
          >
            {busy ? 'Deleting…' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack((s) => ({ ...s, open: false }))} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}>
        <Alert severity={snack.severity} onClose={() => setSnack((s) => ({ ...s, open: false }))} sx={{ borderRadius: 2 }}>
          {snack.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
