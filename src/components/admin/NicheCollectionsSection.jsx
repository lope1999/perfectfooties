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
  Button,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Snackbar,
  Alert,
  Skeleton,
  Switch,
  Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import ImageUploadField from './ImageUploadField';
import {
  addNicheCollection,
  updateNicheCollection,
  deleteNicheCollection,
} from '../../lib/nicheCollectionService';

const fontFamily = '"Georgia", serif';

const ALL_SHAPES = ['Almond', 'Coffin', 'Stiletto', 'Square', 'Round', 'Oval', 'Ballerina'];
const ALL_LENGTHS = [
  'XS (Extra Short)',
  'S (Short)',
  'M (Medium)',
  'L (Long)',
  'XL (Extra Long)',
];
const SEASON_OPTIONS = ['Spring', 'Summer', 'Autumn', 'Winter', "Valentine's", 'Christmas', 'Custom'];
const STATUS_OPTIONS = [
  { value: 'upcoming', label: 'Upcoming' },
  { value: 'open', label: 'Open for Orders' },
  { value: 'closed', label: 'Closed' },
];

const STATUS_COLORS = {
  open: { color: '#2e7d32', bg: '#e8f5e9' },
  upcoming: { color: '#e65100', bg: '#fff3e0' },
  closed: { color: '#616161', bg: '#f5f5f5' },
};

const emptyForm = {
  name: '',
  season: '',
  customSeason: '',
  description: '',
  images: ['', '', ''],
  price: '',
  availableShapes: [],
  availableLengths: [],
  lengthSurcharges: {},
  status: 'upcoming',
  closesAt: '',
  maxOrders: '',
  requiresMeasurements: false,
  multiSetDiscount: false,
  multiSetDiscountPercent: '',
};

function formatNaira(n) {
  return `₦${Number(n).toLocaleString()}`;
}

export default function NicheCollectionsSection({ collections, loading, onRefresh }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteDialog, setDeleteDialog] = useState(null);
  const [busy, setBusy] = useState(false);
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' });

  const stats = useMemo(() => {
    const total = collections.length;
    const open = collections.filter((c) => c.status === 'open').length;
    const upcoming = collections.filter((c) => c.status === 'upcoming').length;
    const closed = collections.filter((c) => c.status === 'closed').length;
    return { total, open, upcoming, closed };
  }, [collections]);

  const showSnack = (message, severity = 'success') =>
    setSnack({ open: true, message, severity });

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (col) => {
    setEditingId(col.id);
    const imgs = Array.isArray(col.images) ? [...col.images] : [];
    while (imgs.length < 3) imgs.push('');
    const isCustomSeason = col.season && !SEASON_OPTIONS.includes(col.season);
    setForm({
      name: col.name || '',
      season: isCustomSeason ? 'Custom' : col.season || '',
      customSeason: isCustomSeason ? col.season : '',
      description: col.description || '',
      images: imgs,
      price: col.price ?? '',
      availableShapes: col.availableShapes || [],
      availableLengths: col.availableLengths || [],
      lengthSurcharges: col.lengthSurcharges || {},
      status: col.status || 'upcoming',
      closesAt: col.closesAt ? col.closesAt.toDate?.().toISOString().slice(0, 16) : '',
      maxOrders: col.maxOrders ?? '',
      requiresMeasurements: Boolean(col.requiresMeasurements),
      multiSetDiscount: Boolean(col.multiSetDiscount),
      multiSetDiscountPercent: col.multiSetDiscountPercent ?? '',
    });
    setDialogOpen(true);
  };

  const openDuplicate = (col) => {
    setEditingId(null);
    const imgs = Array.isArray(col.images) ? [...col.images] : [];
    while (imgs.length < 3) imgs.push('');
    const isCustomSeason = col.season && !SEASON_OPTIONS.includes(col.season);
    setForm({
      name: `${col.name || ''} (Copy)`,
      season: isCustomSeason ? 'Custom' : col.season || '',
      customSeason: isCustomSeason ? col.season : '',
      description: col.description || '',
      images: imgs,
      price: col.price ?? '',
      availableShapes: col.availableShapes || [],
      availableLengths: col.availableLengths || [],
      lengthSurcharges: col.lengthSurcharges || {},
      status: 'upcoming',
      closesAt: '',
      maxOrders: col.maxOrders ?? '',
      requiresMeasurements: Boolean(col.requiresMeasurements),
      multiSetDiscount: Boolean(col.multiSetDiscount),
      multiSetDiscountPercent: col.multiSetDiscountPercent ?? '',
    });
    setDialogOpen(true);
  };

  const handleShapeToggle = (shape) => {
    setForm((f) => ({
      ...f,
      availableShapes: f.availableShapes.includes(shape)
        ? f.availableShapes.filter((s) => s !== shape)
        : [...f.availableShapes, shape],
    }));
  };

  const handleLengthToggle = (length) => {
    setForm((f) => ({
      ...f,
      availableLengths: f.availableLengths.includes(length)
        ? f.availableLengths.filter((l) => l !== length)
        : [...f.availableLengths, length],
    }));
  };

  const handleSurchargeChange = (length, value) => {
    setForm((f) => ({
      ...f,
      lengthSurcharges: { ...f.lengthSurcharges, [length]: value },
    }));
  };

  const handleImageChange = (index, url) => {
    setForm((f) => {
      const imgs = [...f.images];
      imgs[index] = url;
      return { ...f, images: imgs };
    });
  };

  const handleSave = async () => {
    if (!form.name.trim()) { showSnack('Name is required', 'error'); return; }
    if (!form.price || isNaN(Number(form.price))) { showSnack('Enter a valid price', 'error'); return; }
    if (form.availableShapes.length === 0) { showSnack('Select at least one shape', 'error'); return; }
    if (form.availableLengths.length === 0) { showSnack('Select at least one length', 'error'); return; }

    setBusy(true);
    try {
      const resolvedSeason = form.season === 'Custom' ? form.customSeason.trim() : form.season;
      const payload = {
        name: form.name.trim(),
        season: resolvedSeason,
        description: form.description.trim(),
        images: form.images.filter(Boolean),
        price: Number(form.price),
        lengthSurcharges: Object.fromEntries(
          form.availableLengths.map((l) => [l, Number(form.lengthSurcharges[l]) || 0])
        ),
        availableShapes: form.availableShapes,
        availableLengths: form.availableLengths,
        status: form.status,
        closesAt: form.closesAt ? new Date(form.closesAt) : null,
        maxOrders: form.maxOrders ? Number(form.maxOrders) : null,
        requiresMeasurements: form.requiresMeasurements,
        multiSetDiscount: form.multiSetDiscount,
        multiSetDiscountPercent: form.multiSetDiscount ? Number(form.multiSetDiscountPercent) || 0 : 0,
      };

      if (editingId) {
        await updateNicheCollection(editingId, payload);
        showSnack('Collection updated');
      } else {
        await addNicheCollection(payload);
        showSnack('Collection created');
      }
      setDialogOpen(false);
      onRefresh();
    } catch (err) {
      console.error(err);
      showSnack('Something went wrong — please try again', 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog) return;
    setBusy(true);
    try {
      await deleteNicheCollection(deleteDialog.id);
      showSnack('Collection deleted');
      setDeleteDialog(null);
      onRefresh();
    } catch {
      showSnack('Failed to delete', 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleStatusToggle = async (col) => {
    const next = col.status === 'open' ? 'closed' : 'open';
    try {
      await updateNicheCollection(col.id, { status: next });
      showSnack(`Collection ${next === 'open' ? 'opened' : 'closed'}`);
      onRefresh();
    } catch {
      showSnack('Failed to update status', 'error');
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h5" sx={{ fontFamily, fontWeight: 700, color: 'var(--text-purple)' }}>
          Niche Collections
        </Typography>
        <Button
          startIcon={<AddIcon />}
          onClick={openAdd}
          sx={{
            backgroundColor: '#E91E8C',
            color: '#fff',
            borderRadius: '20px',
            fontFamily,
            fontWeight: 600,
            textTransform: 'none',
            px: 2.5,
            '&:hover': { backgroundColor: '#C2185B' },
          }}
        >
          New Collection
        </Button>
      </Box>

      {/* Stats */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        {[
          { label: 'Total', value: stats.total, color: '#4A0E4E' },
          { label: 'Open', value: stats.open, color: '#2e7d32' },
          { label: 'Upcoming', value: stats.upcoming, color: '#e65100' },
          { label: 'Closed', value: stats.closed, color: '#616161' },
        ].map((s) => (
          <Paper key={s.label} sx={{ p: 2, borderRadius: 2, minWidth: 100, textAlign: 'center' }}>
            <Typography sx={{ fontFamily, fontWeight: 700, fontSize: '1.4rem', color: s.color }}>{s.value}</Typography>
            <Typography sx={{ fontFamily, fontSize: '0.78rem', color: '#888' }}>{s.label}</Typography>
          </Paper>
        ))}
      </Box>

      {/* Table */}
      <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: 'none', border: '1px solid #eee' }}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: '#FFF0F5' }}>
              {['Collection', 'Season', 'Price', 'Status', 'Orders', 'Actions'].map((h) => (
                <TableCell key={h} sx={{ fontFamily, fontWeight: 700, fontSize: '0.8rem', color: '#888' }}>{h}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 6 }).map((__, j) => (
                    <TableCell key={j}><Skeleton /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : collections.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} sx={{ textAlign: 'center', py: 4, color: '#aaa', fontFamily }}>
                  No collections yet — create your first one above.
                </TableCell>
              </TableRow>
            ) : (
              collections.map((col) => {
                const scfg = STATUS_COLORS[col.status] || STATUS_COLORS.closed;
                const cover = Array.isArray(col.images) && col.images[0] ? col.images[0] : null;
                return (
                  <TableRow key={col.id} sx={{ '&:hover': { backgroundColor: '#FFFAFA' } }}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        {cover ? (
                          <Box
                            component="img"
                            src={cover}
                            alt={col.name}
                            sx={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 1.5, flexShrink: 0 }}
                          />
                        ) : (
                          <Box sx={{ width: 40, height: 40, borderRadius: 1.5, backgroundColor: '#FFF0F5', flexShrink: 0 }} />
                        )}
                        <Typography sx={{ fontFamily, fontWeight: 600, fontSize: '0.88rem' }}>{col.name}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ fontFamily, fontSize: '0.85rem', color: '#666' }}>{col.season || '—'}</TableCell>
                    <TableCell sx={{ fontFamily, fontWeight: 600, fontSize: '0.88rem' }}>{formatNaira(col.price)}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip
                          label={col.status}
                          size="small"
                          sx={{ backgroundColor: scfg.bg, color: scfg.color, fontWeight: 700, fontSize: '0.68rem', height: 20 }}
                        />
                        <Tooltip title={col.status === 'open' ? 'Close orders' : 'Open orders'}>
                          <Switch
                            size="small"
                            checked={col.status === 'open'}
                            onChange={() => handleStatusToggle(col)}
                            sx={{ '& .MuiSwitch-thumb': { backgroundColor: col.status === 'open' ? '#E91E8C' : '#bbb' } }}
                          />
                        </Tooltip>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ fontFamily, fontSize: '0.85rem' }}>
                      {col.orderCount || 0}{col.maxOrders ? ` / ${col.maxOrders}` : ''}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Tooltip title="Edit">
                          <IconButton size="small" onClick={() => openEdit(col)} sx={{ color: '#E91E8C' }}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Duplicate">
                          <IconButton size="small" onClick={() => openDuplicate(col)} sx={{ color: '#888' }}>
                            <ContentCopyIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton size="small" onClick={() => setDeleteDialog(col)} sx={{ color: '#d32f2f' }}>
                            <DeleteOutlineIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => !busy && setDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontFamily, fontWeight: 700 }}>
          {editingId ? 'Edit Collection' : 'New Niche Collection'}
        </DialogTitle>
        <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 2 }}>
          <TextField
            label="Collection Name *"
            fullWidth
            size="small"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            InputProps={{ sx: { fontFamily } }}
          />

          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              select
              label="Season / Theme"
              size="small"
              value={form.season}
              onChange={(e) => setForm((f) => ({ ...f, season: e.target.value }))}
              sx={{ flex: 1 }}
            >
              <MenuItem value="">— None —</MenuItem>
              {SEASON_OPTIONS.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
            </TextField>
            {form.season === 'Custom' && (
              <TextField
                label="Custom Season Name"
                size="small"
                value={form.customSeason}
                onChange={(e) => setForm((f) => ({ ...f, customSeason: e.target.value }))}
                sx={{ flex: 1 }}
                InputProps={{ sx: { fontFamily } }}
              />
            )}
          </Box>

          <TextField
            label="Description"
            fullWidth
            size="small"
            multiline
            rows={3}
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            InputProps={{ sx: { fontFamily } }}
          />

          {/* Images */}
          <Box>
            <Typography sx={{ fontFamily, fontWeight: 600, fontSize: '0.88rem', mb: 1, color: 'var(--text-purple)' }}>
              Collection Images (up to 3)
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {form.images.map((img, i) => (
                <ImageUploadField
                  key={i}
                  label={`Image ${i + 1}${i === 0 ? ' (Cover)' : ' (Optional)'}`}
                  value={img}
                  onChange={(url) => handleImageChange(i, url)}
                  folder="niche-collections"
                />
              ))}
            </Box>
          </Box>

          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              label="Price (₦) *"
              size="small"
              type="number"
              value={form.price}
              onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
              sx={{ flex: 1 }}
              inputProps={{ min: 0 }}
            />
            <TextField
              select
              label="Status"
              size="small"
              value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
              sx={{ flex: 1 }}
            >
              {STATUS_OPTIONS.map((s) => <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>)}
            </TextField>
          </Box>

          {/* Available Shapes */}
          <Box>
            <Typography sx={{ fontFamily, fontWeight: 600, fontSize: '0.88rem', mb: 0.5, color: 'var(--text-purple)' }}>
              Available Shapes * (select all that apply)
            </Typography>
            <FormGroup row>
              {ALL_SHAPES.map((s) => (
                <FormControlLabel
                  key={s}
                  control={
                    <Checkbox
                      size="small"
                      checked={form.availableShapes.includes(s)}
                      onChange={() => handleShapeToggle(s)}
                      sx={{ color: '#E91E8C', '&.Mui-checked': { color: '#E91E8C' } }}
                    />
                  }
                  label={<Typography sx={{ fontFamily, fontSize: '0.82rem' }}>{s}</Typography>}
                />
              ))}
            </FormGroup>
          </Box>

          {/* Available Lengths */}
          <Box>
            <Typography sx={{ fontFamily, fontWeight: 600, fontSize: '0.88rem', mb: 0.5, color: 'var(--text-purple)' }}>
              Available Lengths * (select all that apply)
            </Typography>
            <FormGroup row>
              {ALL_LENGTHS.map((l) => (
                <FormControlLabel
                  key={l}
                  control={
                    <Checkbox
                      size="small"
                      checked={form.availableLengths.includes(l)}
                      onChange={() => handleLengthToggle(l)}
                      sx={{ color: '#E91E8C', '&.Mui-checked': { color: '#E91E8C' } }}
                    />
                  }
                  label={<Typography sx={{ fontFamily, fontSize: '0.82rem' }}>{l}</Typography>}
                />
              ))}
            </FormGroup>
          </Box>

          {/* Length Surcharges */}
          {form.availableLengths.length > 0 && (
            <Box>
              <Typography sx={{ fontFamily, fontWeight: 600, fontSize: '0.88rem', mb: 0.5, color: 'var(--text-purple)' }}>
                Length Surcharges (₦ added on top of base price)
              </Typography>
              <Typography sx={{ fontFamily, fontSize: '0.75rem', color: '#888', mb: 1.5 }}>
                Leave 0 for the shortest length — that becomes the base price shown on the card.
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                {form.availableLengths.map((l) => (
                  <TextField
                    key={l}
                    label={l}
                    size="small"
                    type="number"
                    value={form.lengthSurcharges[l] ?? ''}
                    onChange={(e) => handleSurchargeChange(l, e.target.value)}
                    inputProps={{ min: 0, step: 500 }}
                    sx={{ width: 148 }}
                    InputProps={{
                      startAdornment: <Typography sx={{ fontSize: '0.8rem', color: '#888', mr: 0.3 }}>₦+</Typography>,
                    }}
                    helperText={
                      Number(form.lengthSurcharges[l]) === 0 || !form.lengthSurcharges[l]
                        ? 'Base price'
                        : `Total: ${formatNaira((Number(form.price) || 0) + (Number(form.lengthSurcharges[l]) || 0))}`
                    }
                  />
                ))}
              </Box>
            </Box>
          )}

          {/* Optional fields */}
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <TextField
              label="Max Orders (optional)"
              size="small"
              type="number"
              value={form.maxOrders}
              onChange={(e) => setForm((f) => ({ ...f, maxOrders: e.target.value }))}
              sx={{ flex: 1, minWidth: 160 }}
              inputProps={{ min: 1 }}
              helperText="Leave blank for unlimited"
            />
            <TextField
              label="Auto-Close Date (optional)"
              size="small"
              type="datetime-local"
              value={form.closesAt}
              onChange={(e) => setForm((f) => ({ ...f, closesAt: e.target.value }))}
              sx={{ flex: 1, minWidth: 200 }}
              InputLabelProps={{ shrink: true }}
            />
          </Box>

          {/* Toggles */}
          <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
            <FormControlLabel
              control={
                <Switch
                  checked={form.requiresMeasurements}
                  onChange={(e) => setForm((f) => ({ ...f, requiresMeasurements: e.target.checked }))}
                  sx={{ '& .MuiSwitch-thumb': { backgroundColor: form.requiresMeasurements ? '#E91E8C' : '#bbb' } }}
                />
              }
              label={<Typography sx={{ fontFamily, fontSize: '0.85rem' }}>Require nail measurements</Typography>}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={form.multiSetDiscount}
                  onChange={(e) => setForm((f) => ({ ...f, multiSetDiscount: e.target.checked }))}
                  sx={{ '& .MuiSwitch-thumb': { backgroundColor: form.multiSetDiscount ? '#E91E8C' : '#bbb' } }}
                />
              }
              label={<Typography sx={{ fontFamily, fontSize: '0.85rem' }}>Multi-set discount (2+ sets)</Typography>}
            />
          </Box>

          {form.multiSetDiscount && (
            <TextField
              label="Discount % for 2+ sets *"
              size="small"
              type="number"
              value={form.multiSetDiscountPercent}
              onChange={(e) => setForm((f) => ({ ...f, multiSetDiscountPercent: e.target.value }))}
              sx={{ maxWidth: 240 }}
              inputProps={{ min: 1, max: 50 }}
            />
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={() => setDialogOpen(false)} disabled={busy} sx={{ fontFamily, color: '#888', textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={busy}
            sx={{
              fontFamily,
              fontWeight: 700,
              backgroundColor: '#E91E8C',
              color: '#fff',
              borderRadius: '20px',
              textTransform: 'none',
              px: 3,
              '&:hover': { backgroundColor: '#C2185B' },
            }}
          >
            {busy ? 'Saving…' : editingId ? 'Save Changes' : 'Create Collection'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={Boolean(deleteDialog)} onClose={() => setDeleteDialog(null)} maxWidth="xs">
        <DialogTitle sx={{ fontFamily, fontWeight: 700 }}>Delete Collection?</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontFamily, fontSize: '0.9rem' }}>
            Delete <strong>{deleteDialog?.name}</strong>? This cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={() => setDeleteDialog(null)} sx={{ fontFamily, color: '#888', textTransform: 'none' }}>
            Cancel
          </Button>
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
