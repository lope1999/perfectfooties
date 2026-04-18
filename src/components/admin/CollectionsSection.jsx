import { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Paper, Button, Grid, Chip,
  CircularProgress, Divider, Alert, Snackbar,
  Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, IconButton, Collapse,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, FormControl, InputLabel, Select, MenuItem,
  FormControlLabel, Switch, Tooltip,
} from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined';
import {
  fetchItems, addCollection, addItem, getCollection, updateCollection, updateItem, deleteItem,
} from '../../lib/collectionService';
import ImageUploadField from './ImageUploadField';

const ff = '"Georgia", serif';

const STATUS_CONFIG = {
  open:     { label: 'Available',   color: '#2e7d32', bg: '#e8f5e9' },
  upcoming: { label: 'Coming Soon', color: '#e65100', bg: '#fff3e0' },
  closed:   { label: 'Sold Out',    color: '#616161', bg: '#f5f5f5' },
};


const EMPTY_FORM = {
  name: '',
  description: '',
  price: '',
  colors: '',
  status: 'open',
  requiresLength: false,
  images: [''],
  careGuide: '',
  colorStock: {},
};

function itemToForm(item) {
  return {
    name: item.name || '',
    description: item.description || '',
    price: item.price != null ? String(item.price) : '',
    colors: (item.colors || []).join(', '),
    status: item.status || 'open',
    requiresLength: !!item.requiresLength,
    images: item.images?.length > 0 ? [...item.images, ''] : [''],
    careGuide: item.careGuide || '',
    colorStock: item.colorStock || {},
  };
}

function formToData(form) {
  return {
    name: form.name.trim(),
    description: form.description.trim(),
    price: Number(form.price) || 0,
    colors: form.colors.split(',').map((c) => c.trim()).filter(Boolean),
    status: form.status,
    requiresLength: form.requiresLength,
    images: form.images.map((u) => u.trim()).filter(Boolean),
    careGuide: form.careGuide.trim(),
    colorStock: form.colorStock,
  };
}

// ── Item edit / add dialog ────────────────────────────────────

function ItemDialog({ open, onClose, onSaved, collectionId, item }) {
  const isEdit = !!item;
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) setForm(item ? itemToForm(item) : EMPTY_FORM);
    setError('');
  }, [open, item]);

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const setImage = (idx, val) =>
    setForm((f) => {
      const imgs = [...f.images];
      imgs[idx] = val;
      // auto-add a blank slot when user fills the last one
      if (idx === imgs.length - 1 && val.trim()) imgs.push('');
      return { ...f, images: imgs };
    });

  const removeImage = (idx) =>
    setForm((f) => ({ ...f, images: f.images.filter((_, i) => i !== idx) }));

  const handleSave = async () => {
    if (!form.name.trim()) { setError('Name is required'); return; }
    if (!form.price || isNaN(form.price)) { setError('Valid price is required'); return; }
    setSaving(true);
    setError('');
    try {
      const data = formToData(form);
      if (isEdit) {
        await updateItem(collectionId, item.id, data);
      } else {
        await addItem(collectionId, data);
      }
      onSaved(isEdit ? 'Item updated.' : 'Item added.');
    } catch (e) {
      setError(e.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ fontFamily: ff, fontWeight: 700, color: 'var(--text-purple)', pb: 1 }}>
        {isEdit ? 'Edit Item' : 'Add New Item'}
      </DialogTitle>
      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '12px !important' }}>
        <TextField label="Name *" value={form.name} onChange={set('name')} size="small" fullWidth
          sx={{ '& .MuiOutlinedInput-root.Mui-focused fieldset': { borderColor: 'var(--accent-cyan)' } }} />

        <TextField label="Description" value={form.description} onChange={set('description')}
          size="small" fullWidth multiline rows={3}
          sx={{ '& .MuiOutlinedInput-root.Mui-focused fieldset': { borderColor: 'var(--accent-cyan)' } }} />

        <Box sx={{ display: 'flex', gap: 2 }}>
          <TextField label="Price (₦) *" value={form.price} onChange={set('price')}
            size="small" type="number" sx={{ flex: 1, '& .MuiOutlinedInput-root.Mui-focused fieldset': { borderColor: 'var(--accent-cyan)' } }} />

          <FormControl size="small" sx={{ flex: 1 }}>
            <InputLabel>Status</InputLabel>
            <Select value={form.status} onChange={set('status')} label="Status"
              sx={{ '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: 'var(--accent-cyan)' } }}>
              <MenuItem value="open">Available</MenuItem>
              <MenuItem value="upcoming">Coming Soon</MenuItem>
              <MenuItem value="closed">Sold Out</MenuItem>
            </Select>
          </FormControl>
        </Box>

        <TextField label="Colours (comma-separated)" value={form.colors} onChange={set('colors')}
          size="small" fullWidth placeholder="e.g. Black, Brown, Tan"
          sx={{ '& .MuiOutlinedInput-root.Mui-focused fieldset': { borderColor: 'var(--accent-cyan)' } }} />

        <FormControlLabel
          control={<Switch checked={form.requiresLength} onChange={(e) => setForm((f) => ({ ...f, requiresLength: e.target.checked }))}
            sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: 'var(--accent-cyan)' }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: 'var(--accent-cyan-dark)' } }} />}
          label={<Typography sx={{ fontFamily: ff, fontSize: '0.88rem' }}>Requires foot length measurement</Typography>}
        />

        {/* Product Images — device upload */}
        <Box>
          <Typography sx={{ fontFamily: ff, fontWeight: 700, fontSize: '0.82rem', color: '#555', mb: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <ImageOutlinedIcon sx={{ fontSize: 16 }} /> Product Images
          </Typography>
          {form.images.map((url, idx) => (
            <Box key={idx} sx={{ mb: 1.5, p: 1.5, border: '1px solid #E8D5B0', borderRadius: 2, position: 'relative' }}>
              <ImageUploadField
                value={url}
                onChange={(val) => setImage(idx, val)}
                folder={`collections/${collectionId}`}
                label={`Image ${idx + 1}`}
              />
              {form.images.length > 1 && (
                <IconButton size="small" onClick={() => removeImage(idx)}
                  sx={{ position: 'absolute', top: 6, right: 6, color: '#e3242b', backgroundColor: '#fff', '&:hover': { backgroundColor: '#fff0f0' } }}>
                  <DeleteOutlineIcon sx={{ fontSize: 16 }} />
                </IconButton>
              )}
            </Box>
          ))}
          <Button
            size="small"
            startIcon={<AddIcon />}
            onClick={() => setForm((f) => ({ ...f, images: [...f.images, ''] }))}
            sx={{ fontFamily: ff, fontSize: '0.78rem', color: '#555', borderColor: '#E8D5B0', border: '1px dashed', borderRadius: 2, px: 2 }}
          >
            Add another image
          </Button>
        </Box>

        {/* Care & Maintenance Guide */}
        <TextField label="Care & Maintenance Guide" value={form.careGuide} onChange={set('careGuide')}
          size="small" fullWidth multiline rows={3} placeholder="e.g. Wipe clean with a damp cloth. Apply leather conditioner monthly. Avoid prolonged exposure to water."
          sx={{ '& .MuiOutlinedInput-root.Mui-focused fieldset': { borderColor: 'var(--accent-cyan)' } }} />

        {/* Stock per colour */}
        {form.colors.trim() && (
          <Box>
            <Typography sx={{ fontFamily: ff, fontWeight: 700, fontSize: '0.82rem', color: '#555', mb: 1 }}>
              Stock Count per Colour (optional — shows "X left" when ≤ 5)
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {form.colors.split(',').map((c) => c.trim()).filter(Boolean).map((color) => (
                <TextField
                  key={color}
                  label={color}
                  value={form.colorStock[color] ?? ''}
                  onChange={(e) => {
                    const val = e.target.value === '' ? '' : Number(e.target.value);
                    setForm((f) => ({
                      ...f,
                      colorStock: { ...f.colorStock, [color]: val === '' ? undefined : val },
                    }));
                  }}
                  size="small"
                  type="number"
                  inputProps={{ min: 0 }}
                  sx={{ width: 110, '& .MuiOutlinedInput-root.Mui-focused fieldset': { borderColor: 'var(--accent-cyan)' } }}
                />
              ))}
            </Box>
          </Box>
        )}

        {error && <Alert severity="error" sx={{ py: 0.5, fontSize: '0.82rem' }}>{error}</Alert>}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
        <Button onClick={onClose} sx={{ fontFamily: ff, color: '#888', textTransform: 'none' }}>Cancel</Button>
        <Button onClick={handleSave} disabled={saving}
          startIcon={saving && <CircularProgress size={14} sx={{ color: '#fff' }} />}
          sx={{ fontFamily: ff, fontWeight: 700, textTransform: 'none', backgroundColor: 'var(--text-purple)', color: '#fff', borderRadius: '20px', px: 3, '&:hover': { backgroundColor: 'var(--accent-cyan-hover)' }, '&.Mui-disabled': { backgroundColor: '#ccc' } }}>
          {saving ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Item'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ── Delete confirm dialog ─────────────────────────────────────

function DeleteDialog({ open, item, onClose, onDeleted }) {
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteItem(item.collectionId, item.id);
      onDeleted(`"${item.name}" deleted.`);
    } catch (e) {
      console.error(e);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ fontFamily: ff, fontWeight: 700, color: '#b81b21', pb: 1 }}>Delete Item?</DialogTitle>
      <DialogContent>
        <Typography sx={{ fontFamily: ff, fontSize: '0.9rem', color: 'var(--text-muted)' }}>
          This will permanently remove <strong>{item?.name}</strong> from Firestore. This cannot be undone.
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
        <Button onClick={onClose} sx={{ fontFamily: ff, color: '#888', textTransform: 'none' }}>Cancel</Button>
        <Button onClick={handleDelete} disabled={deleting}
          sx={{ fontFamily: ff, fontWeight: 700, textTransform: 'none', backgroundColor: '#e3242b', color: '#fff', borderRadius: '20px', px: 3, '&:hover': { backgroundColor: '#b81b21' } }}>
          {deleting ? <CircularProgress size={14} sx={{ color: '#fff' }} /> : 'Delete'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ── Collection row (expandable, editable items table) ─────────

function CollectionRow({ colMeta, onAction }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);

  const [addOpen, setAddOpen] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const loadItems = useCallback(async (forceReload = false) => {
    if (loaded && !forceReload) { setOpen((o) => !o); return; }
    setLoading(true);
    try {
      const data = await fetchItems(colMeta.id);
      setItems(data);
      setLoaded(true);
      setOpen(true);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [colMeta.id, loaded]);

  const reload = () => loadItems(true);

  const handleSaved = (msg) => {
    setAddOpen(false);
    setEditItem(null);
    reload();
    onAction(msg);
  };

  const handleDeleted = (msg) => {
    setDeleteTarget(null);
    reload();
    onAction(msg);
  };

  return (
    <>
      <Paper sx={{ mb: 2, borderRadius: 3, overflow: 'hidden', border: '1px solid #E8D5B0' }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 3, py: 2, backgroundColor: open ? 'rgba(0,255,255,0.04)' : '#fff', '&:hover': { backgroundColor: 'rgba(0,255,255,0.06)' } }}>
          <Box onClick={() => open ? setOpen(false) : loadItems()} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, cursor: 'pointer', flex: 1 }}>
            <AutoAwesomeIcon sx={{ color: 'var(--accent-cyan)', fontSize: 20 }} />
            <Typography sx={{ fontFamily: ff, fontWeight: 700, fontSize: '1rem', color: 'var(--text-main)' }}>
              {colMeta.name}
            </Typography>
            {loaded && (
              <Chip label={`${items.length} item${items.length !== 1 ? 's' : ''}`} size="small"
                sx={{ fontSize: '0.68rem', fontFamily: ff, fontWeight: 600, backgroundColor: 'rgba(0,255,255,0.12)', color: 'var(--text-purple)' }} />
            )}
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {loading && <CircularProgress size={18} sx={{ color: 'var(--accent-cyan)' }} />}
            <Tooltip title="Add item to this collection">
              <IconButton size="small" onClick={(e) => { e.stopPropagation(); setAddOpen(true); }}
                sx={{ backgroundColor: 'rgba(0,255,255,0.1)', '&:hover': { backgroundColor: 'rgba(0,255,255,0.2)' } }}>
                <AddIcon sx={{ fontSize: 18, color: 'var(--text-purple)' }} />
              </IconButton>
            </Tooltip>
            <IconButton size="small" onClick={() => open ? setOpen(false) : loadItems()}>
              {open ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          </Box>
        </Box>

        <Collapse in={open}>
          <Divider sx={{ borderColor: '#E8D5B0' }} />
          {items.length === 0 ? (
            <Box sx={{ px: 3, py: 3, textAlign: 'center' }}>
              <Typography sx={{ color: '#aaa', fontFamily: ff, fontSize: '0.9rem', mb: 1.5 }}>
                No items yet — seed this collection or add items manually.
              </Typography>
              <Button startIcon={<AddIcon />} onClick={() => setAddOpen(true)}
                sx={{ fontFamily: ff, fontWeight: 700, textTransform: 'none', fontSize: '0.82rem', backgroundColor: 'var(--text-purple)', color: '#fff', borderRadius: '20px', px: 3, '&:hover': { backgroundColor: 'var(--accent-cyan-hover)' } }}>
                Add First Item
              </Button>
            </Box>
          ) : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f9f9f9' }}>
                    {['Image', 'Name', 'Price', 'Colours', 'Status', 'Length', 'Actions'].map((h) => (
                      <TableCell key={h} sx={{ fontFamily: ff, fontWeight: 700, fontSize: '0.75rem', color: '#555', py: 1.2 }}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {items.map((item) => {
                    const s = STATUS_CONFIG[item.status] || STATUS_CONFIG.closed;
                    return (
                      <TableRow key={item.id} sx={{ '&:hover': { backgroundColor: 'rgba(0,255,255,0.04)' } }}>
                        <TableCell sx={{ py: 1 }}>
                          {item.images?.[0] ? (
                            <Box component="img" src={item.images[0]} alt={item.name}
                              sx={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 1.5, border: '1px solid #E8D5B0' }} />
                          ) : (
                            <Box sx={{ width: 44, height: 44, borderRadius: 1.5, border: '1px dashed #E8D5B0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <ImageOutlinedIcon sx={{ fontSize: 18, color: '#ccc' }} />
                            </Box>
                          )}
                        </TableCell>
                        <TableCell sx={{ fontFamily: ff, fontWeight: 600, fontSize: '0.88rem' }}>{item.name}</TableCell>
                        <TableCell sx={{ fontFamily: ff, fontSize: '0.85rem' }}>₦{Number(item.price).toLocaleString()}</TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                            {(item.colors || []).slice(0, 3).map((c) => (
                              <Chip key={c} label={c} size="small" sx={{ fontSize: '0.6rem', height: 18 }} />
                            ))}
                            {(item.colors || []).length > 3 && (
                              <Chip label={`+${item.colors.length - 3}`} size="small" sx={{ fontSize: '0.6rem', height: 18 }} />
                            )}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip label={s.label} size="small"
                            sx={{ backgroundColor: s.bg, color: s.color, fontWeight: 700, fontSize: '0.65rem', height: 20 }} />
                        </TableCell>
                        <TableCell sx={{ fontFamily: ff, fontSize: '0.82rem', color: item.requiresLength ? '#2e7d32' : '#999' }}>
                          {item.requiresLength ? 'Yes' : 'No'}
                        </TableCell>
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                            <Tooltip title="Edit item">
                              <IconButton size="small" onClick={() => setEditItem(item)}
                                sx={{ color: 'var(--text-purple)', '&:hover': { backgroundColor: 'rgba(0,255,255,0.1)' } }}>
                                <EditIcon sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Delete item">
                              <IconButton size="small" onClick={() => setDeleteTarget(item)}
                                sx={{ color: '#e3242b', '&:hover': { backgroundColor: '#fff0f0' } }}>
                                <DeleteOutlineIcon sx={{ fontSize: 16 }} />
                              </IconButton>
                            </Tooltip>
                          </Box>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Collapse>
      </Paper>

      <ItemDialog
        open={addOpen || !!editItem}
        onClose={() => { setAddOpen(false); setEditItem(null); }}
        onSaved={handleSaved}
        collectionId={colMeta.id}
        item={editItem}
      />

      {deleteTarget && (
        <DeleteDialog
          open={!!deleteTarget}
          item={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onDeleted={handleDeleted}
        />
      )}
    </>
  );
}



// ── Main section ──────────────────────────────────────────────

const ALL_COLLECTIONS = [
  { id: 'female-footwear', name: 'Female Handmade Footwear' },
  { id: 'male-footwear',   name: 'Male Handmade Footwear' },
  { id: 'heirloom',        name: 'Heirloom Collection' },
  { id: 'bags-belts',      name: 'Handmade Bags & Belts' },
];

export default function CollectionsSection() {
  const [snackOpen, setSnackOpen] = useState(false);
  const [snackMsg, setSnackMsg] = useState('');

  const handleAction = (msg) => {
    setSnackMsg(msg);
    setSnackOpen(true);
  };

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography sx={{ fontFamily: ff, fontWeight: 700, fontSize: '1.6rem', color: 'var(--text-purple)' }}>
          Collections
        </Typography>
        <Typography sx={{ fontFamily: ff, fontSize: '0.88rem', color: '#777', mt: 0.3 }}>
          Expand any collection to view, add, edit, or remove items.
        </Typography>
      </Box>

      {/* Live editable collection rows */}
      <Typography sx={{ fontFamily: ff, fontWeight: 700, fontSize: '1rem', color: 'var(--text-main)', mb: 2 }}>
        Live Collection Data
      </Typography>
      {ALL_COLLECTIONS.map((c) => (
        <CollectionRow key={c.id} colMeta={c} onAction={handleAction} />
      ))}

      <Snackbar open={snackOpen} autoHideDuration={4000} onClose={() => setSnackOpen(false)}
        message={snackMsg} anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }} />
    </Box>
  );
}
