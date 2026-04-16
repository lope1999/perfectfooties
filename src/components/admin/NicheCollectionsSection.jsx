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
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import ImageUploadField from './ImageUploadField';
import {
  addProduct,
  updateProduct,
  deleteProduct,
} from '../../lib/productService';
import { LEATHER_CATEGORIES, LEATHER_MATERIALS } from '../../data/products';

const fontFamily = '"Georgia", serif';

const STATUS_OPTIONS = [
  { value: 'upcoming', label: 'Coming Soon' },
  { value: 'open',     label: 'Available' },
  { value: 'closed',   label: 'Sold Out' },
];

const STATUS_COLORS = {
  open:     { color: '#2e7d32', bg: '#e8f5e9' },
  upcoming: { color: '#e65100', bg: '#fff3e0' },
  closed:   { color: '#616161', bg: '#f5f5f5' },
};

const emptyForm = {
  name: '',
  material: '',
  category: '',
  description: '',
  images: ['', '', ''],
  price: '',
  sizes: '',      // comma-separated string → array on save
  colours: '',    // comma-separated string → array on save
  status: 'upcoming',
  closesAt: '',
  maxOrders: '',
  requiresSize: false,
  allowEngraving: false,
  multiSetDiscount: false,
  multiSetDiscountPercent: '',
  hiddenFromStorefront: false,
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

  const toFormSizes = (arr) => (Array.isArray(arr) ? arr.join(', ') : arr || '');
  const toArray = (str) => str.split(',').map((s) => s.trim()).filter(Boolean);

  const openAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (col) => {
    setEditingId(col.id);
    const imgs = Array.isArray(col.images) ? [...col.images] : [];
    while (imgs.length < 3) imgs.push('');
    setForm({
      name: col.name || '',
      material: col.material || '',
      category: col.category || '',
      description: col.description || '',
      images: imgs,
      price: col.price ?? '',
      sizes: toFormSizes(col.sizes),
      colours: toFormSizes(col.colours),
      status: col.status || 'upcoming',
      closesAt: col.closesAt ? col.closesAt.toDate?.().toISOString().slice(0, 16) : '',
      maxOrders: col.maxOrders ?? '',
      requiresSize: Boolean(col.requiresSize),
      allowEngraving: Boolean(col.allowEngraving),
      multiSetDiscount: Boolean(col.multiSetDiscount),
      multiSetDiscountPercent: col.multiSetDiscountPercent ?? '',
      hiddenFromStorefront: Boolean(col.hiddenFromStorefront),
    });
    setDialogOpen(true);
  };

  const openDuplicate = (col) => {
    setEditingId(null);
    const imgs = Array.isArray(col.images) ? [...col.images] : [];
    while (imgs.length < 3) imgs.push('');
    setForm({
      name: `${col.name || ''} (Copy)`,
      material: col.material || '',
      category: col.category || '',
      description: col.description || '',
      images: imgs,
      price: col.price ?? '',
      sizes: toFormSizes(col.sizes),
      colours: toFormSizes(col.colours),
      status: 'upcoming',
      closesAt: '',
      maxOrders: col.maxOrders ?? '',
      requiresSize: Boolean(col.requiresSize),
      allowEngraving: Boolean(col.allowEngraving),
      multiSetDiscount: Boolean(col.multiSetDiscount),
      multiSetDiscountPercent: col.multiSetDiscountPercent ?? '',
      hiddenFromStorefront: false,
    });
    setDialogOpen(true);
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

    setBusy(true);
    try {
      const payload = {
        name: form.name.trim(),
        material: form.material.trim(),
        category: form.category,
        description: form.description.trim(),
        images: form.images.filter(Boolean),
        price: Number(form.price),
        sizes: toArray(form.sizes),
        colours: toArray(form.colours),
        status: form.status,
        closesAt: form.closesAt ? new Date(form.closesAt) : null,
        maxOrders: form.maxOrders ? Number(form.maxOrders) : null,
        requiresSize: form.requiresSize,
        allowEngraving: form.allowEngraving,
        multiSetDiscount: form.multiSetDiscount,
        multiSetDiscountPercent: form.multiSetDiscount ? Number(form.multiSetDiscountPercent) || 0 : 0,
        hiddenFromStorefront: form.hiddenFromStorefront,
      };

      if (editingId) {
        await updateProduct(editingId, payload);
        showSnack('Product updated');
      } else {
        await addProduct(payload);
        showSnack('Product created');
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
      await deleteProduct(deleteDialog.id);
      showSnack('Product deleted');
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
      await updateProduct(col.id, { status: next });
      showSnack(`Product ${next === 'open' ? 'set to available' : 'set to sold out'}`);
      onRefresh();
    } catch {
      showSnack('Failed to update status', 'error');
    }
  };

  const handleVisibilityToggle = async (col) => {
    const next = !col.hiddenFromStorefront;
    try {
      await updateProduct(col.id, { hiddenFromStorefront: next });
      showSnack(next ? 'Hidden from storefront' : 'Visible on storefront');
      onRefresh();
    } catch {
      showSnack('Failed to update visibility', 'error');
    }
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="h5" sx={{ fontFamily, fontWeight: 700, color: 'var(--text-purple)' }}>
          Shop Products
        </Typography>
        <Button
          startIcon={<AddIcon />}
          onClick={openAdd}
          sx={{
            backgroundColor: '#e3242b', color: '#fff', borderRadius: '20px',
            fontFamily, fontWeight: 600, textTransform: 'none', px: 2.5,
            '&:hover': { backgroundColor: '#b81b21' },
          }}
        >
          New Product
        </Button>
      </Box>

      {/* Stats */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        {[
          { label: 'Total',     value: stats.total,    color: '#006666' },
          { label: 'Available', value: stats.open,     color: '#2e7d32' },
          { label: 'Coming Soon', value: stats.upcoming, color: '#e65100' },
          { label: 'Sold Out',  value: stats.closed,   color: '#616161' },
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
            <TableRow sx={{ backgroundColor: '#FFF8F0' }}>
              {['Product', 'Category', 'Material', 'Price', 'Status', 'Orders', 'Actions'].map((h) => (
                <TableCell key={h} sx={{ fontFamily, fontWeight: 700, fontSize: '0.8rem', color: '#888' }}>{h}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  {Array.from({ length: 7 }).map((__, j) => (
                    <TableCell key={j}><Skeleton /></TableCell>
                  ))}
                </TableRow>
              ))
            ) : collections.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} sx={{ textAlign: 'center', py: 4, color: '#aaa', fontFamily }}>
                  No products yet — create your first one above.
                </TableCell>
              </TableRow>
            ) : (
              collections.map((col) => {
                const scfg = STATUS_COLORS[col.status] || STATUS_COLORS.closed;
                const cover = Array.isArray(col.images) && col.images[0] ? col.images[0] : null;
                const catLabel = LEATHER_CATEGORIES.find((c) => c.id === col.category)?.label || col.category || '—';
                return (
                  <TableRow key={col.id} sx={{ '&:hover': { backgroundColor: '#FFFAFA' } }}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        {cover ? (
                          <Box component="img" src={cover} alt={col.name}
                            sx={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 1.5, flexShrink: 0 }} />
                        ) : (
                          <Box sx={{ width: 40, height: 40, borderRadius: 1.5, backgroundColor: '#FFF8F0', flexShrink: 0 }} />
                        )}
                        <Typography sx={{ fontFamily, fontWeight: 600, fontSize: '0.88rem' }}>{col.name}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ fontFamily, fontSize: '0.85rem', color: '#666' }}>{catLabel}</TableCell>
                    <TableCell sx={{ fontFamily, fontSize: '0.85rem', color: '#666' }}>{col.material || '—'}</TableCell>
                    <TableCell sx={{ fontFamily, fontWeight: 600, fontSize: '0.88rem' }}>{formatNaira(col.price)}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                        <Chip
                          label={col.status}
                          size="small"
                          sx={{ backgroundColor: scfg.bg, color: scfg.color, fontWeight: 700, fontSize: '0.68rem', height: 20 }}
                        />
                        {col.hiddenFromStorefront && (
                          <Chip label="Hidden" size="small"
                            sx={{ backgroundColor: '#f5f5f5', color: '#888', fontWeight: 700, fontSize: '0.68rem', height: 20 }} />
                        )}
                        <Tooltip title={col.status === 'open' ? 'Mark as sold out' : 'Mark as available'}>
                          <Switch
                            size="small"
                            checked={col.status === 'open'}
                            onChange={() => handleStatusToggle(col)}
                            sx={{ '& .MuiSwitch-thumb': { backgroundColor: col.status === 'open' ? '#e3242b' : '#bbb' } }}
                          />
                        </Tooltip>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ fontFamily, fontSize: '0.85rem' }}>
                      {col.orderCount || 0}{col.maxOrders ? ` / ${col.maxOrders}` : ''}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 0.5 }}>
                        <Tooltip title={col.hiddenFromStorefront ? 'Show on storefront' : 'Hide from storefront'}>
                          <IconButton size="small" onClick={() => handleVisibilityToggle(col)}
                            sx={{ color: col.hiddenFromStorefront ? '#bbb' : '#006666' }}>
                            {col.hiddenFromStorefront ? <VisibilityOffIcon fontSize="small" /> : <VisibilityIcon fontSize="small" />}
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit">
                          <IconButton size="small" onClick={() => openEdit(col)} sx={{ color: '#e3242b' }}>
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
          {editingId ? 'Edit Product' : 'New Product'}
        </DialogTitle>
        <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 2 }}>
          <TextField
            label="Product Name *"
            fullWidth size="small"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            InputProps={{ sx: { fontFamily } }}
          />

          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              select label="Category" size="small"
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              sx={{ flex: 1 }}
            >
              <MenuItem value="">— None —</MenuItem>
              {LEATHER_CATEGORIES.map((c) => (
                <MenuItem key={c.id} value={c.id}>{c.label}</MenuItem>
              ))}
            </TextField>
            <TextField
              select label="Material" size="small"
              value={form.material}
              onChange={(e) => setForm((f) => ({ ...f, material: e.target.value }))}
              sx={{ flex: 1 }}
            >
              <MenuItem value="">— None —</MenuItem>
              {LEATHER_MATERIALS.map((m) => (
                <MenuItem key={m} value={m}>{m}</MenuItem>
              ))}
            </TextField>
          </Box>

          <TextField
            label="Description" fullWidth size="small" multiline rows={3}
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            InputProps={{ sx: { fontFamily } }}
          />

          {/* Images */}
          <Box>
            <Typography sx={{ fontFamily, fontWeight: 600, fontSize: '0.88rem', mb: 1, color: 'var(--text-purple)' }}>
              Product Images (up to 3)
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {form.images.map((img, i) => (
                <ImageUploadField
                  key={i}
                  label={`Image ${i + 1}${i === 0 ? ' (Cover)' : ' (Optional)'}`}
                  value={img}
                  onChange={(url) => handleImageChange(i, url)}
                  folder="shop-products"
                />
              ))}
            </Box>
          </Box>

          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              label="Price (₦) *" size="small" type="number"
              value={form.price}
              onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
              sx={{ flex: 1 }} inputProps={{ min: 0 }}
            />
            <TextField
              select label="Status" size="small"
              value={form.status}
              onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
              sx={{ flex: 1 }}
            >
              {STATUS_OPTIONS.map((s) => <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>)}
            </TextField>
          </Box>

          <TextField
            label="Available Sizes"
            fullWidth size="small"
            value={form.sizes}
            onChange={(e) => setForm((f) => ({ ...f, sizes: e.target.value }))}
            placeholder="e.g. 39, 40, 41, 42  or  S (30-32&quot;), M (32-34&quot;)"
            helperText="Comma-separated. Leave blank if size doesn't apply."
            InputProps={{ sx: { fontFamily } }}
          />

          <TextField
            label="Available Colours"
            fullWidth size="small"
            value={form.colours}
            onChange={(e) => setForm((f) => ({ ...f, colours: e.target.value }))}
            placeholder="e.g. Chocolate Brown, Tan, Black, Cognac"
            helperText="Comma-separated. Leave blank if colour doesn't apply."
            InputProps={{ sx: { fontFamily } }}
          />

          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <TextField
              label="Max Orders (optional)" size="small" type="number"
              value={form.maxOrders}
              onChange={(e) => setForm((f) => ({ ...f, maxOrders: e.target.value }))}
              sx={{ flex: 1, minWidth: 160 }}
              inputProps={{ min: 1 }}
              helperText="Leave blank for unlimited"
            />
            <TextField
              label="Auto-Close Date (optional)" size="small" type="datetime-local"
              value={form.closesAt}
              onChange={(e) => setForm((f) => ({ ...f, closesAt: e.target.value }))}
              sx={{ flex: 1, minWidth: 200 }}
              InputLabelProps={{ shrink: true }}
            />
          </Box>

          {/* Toggles */}
          <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
            {[
              { key: 'requiresSize',     label: 'Require size selection' },
              { key: 'allowEngraving',   label: 'Allow personalisation / engraving' },
              { key: 'multiSetDiscount', label: 'Multi-item discount (2+)' },
              { key: 'hiddenFromStorefront', label: 'Hide from storefront' },
            ].map(({ key, label }) => (
              <Box key={key} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Switch
                  size="small"
                  checked={Boolean(form[key])}
                  onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.checked }))}
                  sx={{ '& .MuiSwitch-thumb': { backgroundColor: form[key] ? '#e3242b' : '#bbb' } }}
                />
                <Typography sx={{ fontFamily, fontSize: '0.85rem' }}>{label}</Typography>
              </Box>
            ))}
          </Box>

          {form.multiSetDiscount && (
            <TextField
              label="Discount % for 2+ items *" size="small" type="number"
              value={form.multiSetDiscountPercent}
              onChange={(e) => setForm((f) => ({ ...f, multiSetDiscountPercent: e.target.value }))}
              sx={{ maxWidth: 240 }}
              inputProps={{ min: 1, max: 50 }}
            />
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={() => setDialogOpen(false)} disabled={busy}
            sx={{ fontFamily, color: '#888', textTransform: 'none' }}>
            Cancel
          </Button>
          <Button
            onClick={handleSave} disabled={busy}
            sx={{
              fontFamily, fontWeight: 700, backgroundColor: '#e3242b', color: '#fff',
              borderRadius: '20px', textTransform: 'none', px: 3,
              '&:hover': { backgroundColor: '#b81b21' },
            }}
          >
            {busy ? 'Saving…' : editingId ? 'Save Changes' : 'Create Product'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={Boolean(deleteDialog)} onClose={() => setDeleteDialog(null)} maxWidth="xs">
        <DialogTitle sx={{ fontFamily, fontWeight: 700 }}>Delete Product?</DialogTitle>
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
            onClick={handleDelete} disabled={busy}
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
