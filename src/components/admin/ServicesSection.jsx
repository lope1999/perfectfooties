import { useState, useEffect, useMemo } from 'react';
import {
  Box, Typography, Accordion, AccordionSummary, AccordionDetails,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Button, Chip, Skeleton, TextField, Dialog, DialogTitle,
  DialogContent, DialogActions, FormControlLabel, Switch, Grid,
  Snackbar, Alert, Tooltip, Paper,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AddIcon from '@mui/icons-material/Add';
import ContentCutIcon from '@mui/icons-material/ContentCut';
import {
  addServiceCategory, updateServiceCategory, deleteServiceCategory,
  addServiceItem, updateServiceItem, deleteServiceItem,
  setServiceDiscount, removeServiceDiscount,
  seedAndFetchCategories,
  fetchCategories,
} from '../../lib/adminService';
import { serviceCategories as staticServiceCategories } from '../../data/services';

const ff = '"Georgia", serif';
const inputSx = { '& .MuiOutlinedInput-root': { fontFamily: ff } };
function fmtNaira(n) { return `₦${Number(n || 0).toLocaleString()}`; }

// ── Service form dialog ──────────────────────────────────
function ServiceFormDialog({ open, onClose, onSave, service, discountData, busy }) {
  const [form, setForm] = useState({ name: '', description: '', price: '', image: '' });
  const [disc, setDisc] = useState({ enabled: false, discountPrice: '', discountLabel: '' });

  useEffect(() => {
    if (!open) return;
    setForm({
      name: service?.name || '',
      description: service?.description || '',
      price: service?.price ?? '',
      image: service?.image || '',
    });
    setDisc({
      enabled: !!discountData?.enabled,
      discountPrice: discountData?.discountPrice ?? '',
      discountLabel: discountData?.discountLabel ?? '',
    });
  }, [open, service, discountData]);

  const set = (f) => (e) => setForm((p) => ({ ...p, [f]: e.target.value }));

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ fontFamily: ff, fontWeight: 700, color: '#4A0E4E' }}>
        {service ? 'Edit Service' : 'Add Service'}
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid item xs={12}>
            <TextField fullWidth label="Service Name" required value={form.name} onChange={set('name')} size="small" sx={inputSx} InputLabelProps={{ sx: { fontFamily: ff } }} />
          </Grid>
          <Grid item xs={12}>
            <TextField fullWidth label="Description" value={form.description} onChange={set('description')} multiline rows={3} size="small" sx={inputSx} InputLabelProps={{ sx: { fontFamily: ff } }} />
          </Grid>
          <Grid item xs={12}>
            <TextField fullWidth label="Base Price (₦)" type="number" required value={form.price} onChange={set('price')} size="small" sx={inputSx} InputLabelProps={{ sx: { fontFamily: ff } }} />
          </Grid>
          <Grid item xs={12}>
            <TextField fullWidth label="Image URL" value={form.image} onChange={set('image')} size="small" sx={inputSx} InputLabelProps={{ sx: { fontFamily: ff } }} helperText="Paste the image path or URL" />
            {form.image && (
              <Box component="img" src={form.image} alt="preview"
                sx={{ mt: 1, height: 90, width: '100%', objectFit: 'cover', borderRadius: 1.5, border: '1px solid #F0C0D0' }}
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            )}
          </Grid>

          {/* Discount section */}
          <Grid item xs={12}>
            <Box sx={{ p: 1.5, borderRadius: 2, border: `1.5px solid ${disc.enabled ? '#a5d6a7' : '#eee'}`, backgroundColor: disc.enabled ? '#f1f8e9' : '#fafafa', transition: 'all 0.2s' }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={disc.enabled}
                    onChange={(e) => setDisc((p) => ({ ...p, enabled: e.target.checked }))}
                    sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#2e7d32' }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#2e7d32' } }}
                  />
                }
                label={<Typography sx={{ fontFamily: ff, fontSize: '0.9rem', fontWeight: 600, color: '#2e7d32' }}>Discount Active</Typography>}
              />
              {disc.enabled && (
                <Grid container spacing={1.5} sx={{ mt: 0.5 }}>
                  <Grid item xs={6}>
                    <TextField fullWidth label="Sale Price (₦)" type="number" value={disc.discountPrice}
                      onChange={(e) => setDisc((p) => ({ ...p, discountPrice: e.target.value }))}
                      size="small" sx={inputSx} InputLabelProps={{ sx: { fontFamily: ff } }} />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField fullWidth label="Label (e.g. Easter Sale)" value={disc.discountLabel}
                      onChange={(e) => setDisc((p) => ({ ...p, discountLabel: e.target.value }))}
                      size="small" sx={inputSx} InputLabelProps={{ sx: { fontFamily: ff } }} />
                  </Grid>
                </Grid>
              )}
            </Box>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose} sx={{ fontFamily: ff, color: '#777', textTransform: 'none' }}>Cancel</Button>
        <Button
          onClick={() => onSave(form, disc)}
          variant="contained"
          disabled={busy || !form.name.trim() || !String(form.price).trim()}
          sx={{ fontFamily: ff, backgroundColor: '#4A0E4E', borderRadius: '20px', px: 3, textTransform: 'none', '&:hover': { backgroundColor: '#3a0b3e' }, '&.Mui-disabled': { backgroundColor: '#ddd' } }}
        >
          {busy ? 'Saving…' : service ? 'Update Service' : 'Add Service'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ── Category form dialog ─────────────────────────────────
function CategoryFormDialog({ open, onClose, onSave, category, busy }) {
  const [form, setForm] = useState({ id: '', title: '', description: '', image: '', comingSoon: false });

  useEffect(() => {
    if (!open) return;
    setForm({
      id: category?.id || '',
      title: category?.title || '',
      description: category?.description || '',
      image: category?.image || '',
      comingSoon: !!category?.comingSoon,
    });
  }, [open, category]);

  const set = (f) => (e) => setForm((p) => ({ ...p, [f]: e.target.value }));

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
      <DialogTitle sx={{ fontFamily: ff, fontWeight: 700, color: '#4A0E4E' }}>
        {category ? 'Edit Category' : 'Add Category'}
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          {!category && (
            <Grid item xs={12}>
              <TextField fullWidth label="Category ID" required value={form.id} onChange={set('id')} size="small"
                helperText="Lowercase letters/hyphens only — e.g. hard-gel" sx={inputSx} InputLabelProps={{ sx: { fontFamily: ff } }} />
            </Grid>
          )}
          <Grid item xs={12}>
            <TextField fullWidth label="Title" required value={form.title} onChange={set('title')} size="small" sx={inputSx} InputLabelProps={{ sx: { fontFamily: ff } }} />
          </Grid>
          <Grid item xs={12}>
            <TextField fullWidth label="Description" value={form.description} onChange={set('description')} multiline rows={2} size="small" sx={inputSx} InputLabelProps={{ sx: { fontFamily: ff } }} />
          </Grid>
          <Grid item xs={12}>
            <TextField fullWidth label="Cover Image URL" value={form.image} onChange={set('image')} size="small" sx={inputSx} InputLabelProps={{ sx: { fontFamily: ff } }} />
            {form.image && (
              <Box component="img" src={form.image} alt="preview"
                sx={{ mt: 1, height: 90, width: '100%', objectFit: 'cover', borderRadius: 1.5, border: '1px solid #F0C0D0' }}
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            )}
          </Grid>
          <Grid item xs={12}>
            <Box sx={{ p: 1.5, borderRadius: 2, border: `1.5px solid ${form.comingSoon ? '#ffcc80' : '#eee'}`, backgroundColor: form.comingSoon ? '#fff8e1' : '#fafafa' }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={form.comingSoon}
                    onChange={(e) => setForm((p) => ({ ...p, comingSoon: e.target.checked }))}
                    sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#E65100' }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#E65100' } }}
                  />
                }
                label={<Typography sx={{ fontFamily: ff, fontSize: '0.9rem', fontWeight: 600, color: '#E65100' }}>Mark as Coming Soon</Typography>}
              />
            </Box>
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose} sx={{ fontFamily: ff, color: '#777', textTransform: 'none' }}>Cancel</Button>
        <Button
          onClick={() => onSave(form)}
          variant="contained"
          disabled={busy || !form.title.trim() || (!category && !form.id.trim())}
          sx={{ fontFamily: ff, backgroundColor: '#4A0E4E', borderRadius: '20px', px: 3, textTransform: 'none', '&:hover': { backgroundColor: '#3a0b3e' }, '&.Mui-disabled': { backgroundColor: '#ddd' } }}
        >
          {busy ? 'Saving…' : category ? 'Update Category' : 'Add Category'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ── Main section ─────────────────────────────────────────
export default function ServicesSection({ serviceCategories, serviceDiscounts, loading, onRefresh }) {
  const [catDialog, setCatDialog] = useState(null);
  const [svcDialog, setSvcDialog] = useState(null);
  const [deleteCatDlg, setDeleteCatDlg] = useState(null);
  const [deleteSvcDlg, setDeleteSvcDlg] = useState(null);
  const [busy, setBusy] = useState(false);
  const [snack, setSnack] = useState({ open: false, msg: '', severity: 'success' });

  const totalServices = useMemo(
    () => serviceCategories.reduce((s, c) => s + (c.services?.length || 0), 0),
    [serviceCategories],
  );

  const toast = (msg, severity = 'success') => setSnack({ open: true, msg, severity });

  // ── Category CRUD ────
  const handleSaveCat = async (form) => {
    setBusy(true);
    try {
      if (catDialog?.cat) {
        await updateServiceCategory(catDialog.cat.id, {
          title: form.title, description: form.description, image: form.image, comingSoon: form.comingSoon,
        });
        toast('Category updated');
      } else {
        await addServiceCategory(form.id, {
          title: form.title, description: form.description, image: form.image, comingSoon: form.comingSoon,
        });
        toast('Category added');
      }
      await onRefresh();
      setCatDialog(null);
    } catch (err) {
      toast(err.message || 'Error saving category', 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteCat = async () => {
    if (!deleteCatDlg) return;
    setBusy(true);
    try {
      await deleteServiceCategory(deleteCatDlg.id);
      await onRefresh();
      setDeleteCatDlg(null);
      toast('Category deleted');
    } catch (err) {
      toast(err.message || 'Error deleting category', 'error');
    } finally {
      setBusy(false);
    }
  };

  // ── Service CRUD ─────
  const handleSaveService = async (form, discForm) => {
    if (!svcDialog) return;
    const { catId, service } = svcDialog;
    setBusy(true);
    try {
      const data = {
        name: form.name.trim(),
        description: form.description.trim(),
        price: parseFloat(form.price) || 0,
        image: form.image.trim(),
      };
      let svcId;
      if (service) {
        data.id = service.id;
        svcId = service.id;
        await updateServiceItem(catId, service.id, data);
      } else {
        svcId = crypto.randomUUID();
        data.id = svcId;
        await addServiceItem(catId, data);
      }
      // Discount
      if (discForm.enabled) {
        await setServiceDiscount(svcId, {
          enabled: true,
          discountPrice: parseFloat(discForm.discountPrice) || 0,
          discountLabel: discForm.discountLabel || '',
        });
      } else {
        await removeServiceDiscount(svcId).catch(() => {});
      }
      await onRefresh();
      setSvcDialog(null);
      toast(service ? 'Service updated' : 'Service added');
    } catch (err) {
      toast(err.message || 'Error saving service', 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteService = async () => {
    if (!deleteSvcDlg) return;
    setBusy(true);
    try {
      await deleteServiceItem(deleteSvcDlg.catId, deleteSvcDlg.service.id);
      await removeServiceDiscount(deleteSvcDlg.service.id).catch(() => {});
      await onRefresh();
      setDeleteSvcDlg(null);
      toast('Service deleted');
    } catch (err) {
      toast(err.message || 'Error deleting service', 'error');
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <Box>
        <Skeleton variant="rounded" height={48} sx={{ mb: 2 }} />
        {[1, 2, 3].map((i) => <Skeleton key={i} variant="rounded" height={72} sx={{ mb: 1.5 }} />)}
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 1 }}>
        <Box>
          <Typography variant="h5" sx={{ fontFamily: ff, fontWeight: 700 }}>Services</Typography>
          <Typography sx={{ fontSize: '0.85rem', color: '#777', mt: 0.3 }}>
            {serviceCategories.length} {serviceCategories.length === 1 ? 'category' : 'categories'} · {totalServices} services
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCatDialog({ mode: 'add' })}
          sx={{ fontFamily: ff, backgroundColor: '#4A0E4E', borderRadius: '20px', px: 3, textTransform: 'none', '&:hover': { backgroundColor: '#3a0b3e' } }}
        >
          Add Category
        </Button>
      </Box>

      {/* Category accordions */}
      {serviceCategories.map((cat) => (
        <Accordion
          key={cat.id}
          sx={{ mb: 1.5, borderRadius: '12px !important', '&:before': { display: 'none' }, border: '1.5px solid #F0C0D0', boxShadow: 'none' }}
        >
          <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={{ px: 2.5, py: 0.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1, mr: 1 }}>
              {cat.image ? (
                <Box component="img" src={cat.image} alt={cat.title}
                  sx={{ width: 44, height: 44, borderRadius: 1.5, objectFit: 'cover', flexShrink: 0, border: '1px solid #F0C0D0' }} />
              ) : (
                <Box sx={{ width: 44, height: 44, borderRadius: 1.5, backgroundColor: '#FCE4EC', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <ContentCutIcon sx={{ color: '#E91E8C', fontSize: 22 }} />
                </Box>
              )}
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography sx={{ fontFamily: ff, fontWeight: 700, fontSize: '0.97rem' }}>{cat.title}</Typography>
                <Typography sx={{ fontSize: '0.73rem', color: '#888', mt: 0.1 }} noWrap>{cat.description}</Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 0.8, flexShrink: 0 }}>
                <Chip label={`${cat.services?.length || 0} services`} size="small" sx={{ fontSize: '0.72rem' }} />
                {cat.comingSoon && (
                  <Chip label="Coming Soon" size="small" sx={{ backgroundColor: '#FFF3E0', color: '#E65100', fontWeight: 700, fontSize: '0.7rem' }} />
                )}
              </Box>
            </Box>
          </AccordionSummary>

          <AccordionDetails sx={{ px: 2.5, pt: 0, pb: 2.5 }}>
            {/* Category action buttons */}
            <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
              <Button
                size="small" startIcon={<EditIcon sx={{ fontSize: 14 }} />}
                onClick={() => setCatDialog({ mode: 'edit', cat })}
                sx={{ fontFamily: ff, fontSize: '0.77rem', border: '1.5px solid #E91E8C', color: '#E91E8C', borderRadius: '20px', textTransform: 'none', px: 1.5, '&:hover': { backgroundColor: '#FFF0F5' } }}
              >
                Edit Category
              </Button>
              <Button
                size="small" startIcon={<DeleteOutlineIcon sx={{ fontSize: 14 }} />}
                onClick={() => setDeleteCatDlg(cat)}
                sx={{ fontFamily: ff, fontSize: '0.77rem', border: '1.5px solid #d32f2f', color: '#d32f2f', borderRadius: '20px', textTransform: 'none', px: 1.5, '&:hover': { backgroundColor: '#FFEBEE' } }}
              >
                Delete Category
              </Button>
            </Box>

            {/* Services table */}
            <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2, mb: 1.5, border: '1px solid #F0C0D0' }}>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#FFF0F5' }}>
                    {['', 'Service Name', 'Base Price', 'Discount', 'Actions'].map((h) => (
                      <TableCell key={h} sx={{ fontFamily: ff, fontWeight: 700, fontSize: '0.78rem', color: '#4A0E4E', py: 1.2, borderBottom: '1.5px solid #F0C0D0' }}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(cat.services || []).map((svc) => {
                    const disc = serviceDiscounts?.[svc.id];
                    return (
                      <TableRow key={svc.id} hover sx={{ '&:last-child td': { border: 0 } }}>
                        <TableCell sx={{ width: 50, p: 1 }}>
                          {svc.image ? (
                            <Box component="img" src={svc.image} alt={svc.name}
                              sx={{ width: 38, height: 38, objectFit: 'cover', borderRadius: 1, border: '1px solid #F0C0D0' }} />
                          ) : (
                            <Box sx={{ width: 38, height: 38, borderRadius: 1, backgroundColor: '#FFF0F5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <ContentCutIcon sx={{ fontSize: 16, color: '#E91E8C' }} />
                            </Box>
                          )}
                        </TableCell>
                        <TableCell sx={{ fontFamily: ff, fontWeight: 600, fontSize: '0.85rem', maxWidth: 220 }}>
                          {svc.name}
                          {svc.description && (
                            <Typography sx={{ fontSize: '0.72rem', color: '#888', mt: 0.2, display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                              {svc.description}
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell sx={{ fontFamily: ff, fontSize: '0.85rem', whiteSpace: 'nowrap', color: '#4A0E4E', fontWeight: 600 }}>
                          {fmtNaira(svc.price)}
                        </TableCell>
                        <TableCell>
                          {disc?.enabled ? (
                            <Box>
                              <Chip
                                label={fmtNaira(disc.discountPrice)}
                                size="small"
                                sx={{ backgroundColor: '#e8f5e9', color: '#2e7d32', fontWeight: 700, fontSize: '0.72rem', mb: 0.3 }}
                              />
                              {disc.discountLabel && (
                                <Typography sx={{ fontSize: '0.68rem', color: '#555' }}>{disc.discountLabel}</Typography>
                              )}
                            </Box>
                          ) : (
                            <Typography sx={{ fontSize: '0.8rem', color: '#ccc' }}>—</Typography>
                          )}
                        </TableCell>
                        <TableCell sx={{ whiteSpace: 'nowrap' }}>
                          <Tooltip title="Edit service">
                            <IconButton size="small" onClick={() => setSvcDialog({ mode: 'edit', catId: cat.id, service: svc })}>
                              <EditIcon fontSize="small" sx={{ color: '#4A0E4E' }} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Delete service">
                            <IconButton size="small" onClick={() => setDeleteSvcDlg({ catId: cat.id, service: svc })}>
                              <DeleteOutlineIcon fontSize="small" sx={{ color: '#d32f2f' }} />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {(!cat.services || cat.services.length === 0) && (
                    <TableRow>
                      <TableCell colSpan={5} sx={{ textAlign: 'center', color: '#bbb', fontFamily: ff, py: 3, fontSize: '0.85rem' }}>
                        No services yet — add one below.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            <Button
              size="small"
              startIcon={<AddIcon />}
              onClick={() => setSvcDialog({ mode: 'add', catId: cat.id })}
              sx={{ fontFamily: ff, fontSize: '0.82rem', color: '#4A0E4E', border: '1.5px dashed #CE93D8', borderRadius: '20px', px: 2, textTransform: 'none', '&:hover': { backgroundColor: '#F3E5F5' } }}
            >
              Add Service to {cat.title}
            </Button>
          </AccordionDetails>
        </Accordion>
      ))}

      {serviceCategories.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <ContentCutIcon sx={{ fontSize: 48, color: '#ccc', mb: 1 }} />
          <Typography sx={{ fontFamily: ff, color: '#999' }}>No service categories yet.</Typography>
          <Typography sx={{ fontSize: '0.85rem', color: '#bbb', mt: 0.5 }}>Click "Add Category" to get started.</Typography>
        </Box>
      )}

      {/* ── Dialogs ── */}
      <ServiceFormDialog
        open={!!svcDialog}
        onClose={() => setSvcDialog(null)}
        onSave={handleSaveService}
        service={svcDialog?.service}
        discountData={svcDialog?.service ? serviceDiscounts?.[svcDialog.service.id] : null}
        busy={busy}
      />

      <CategoryFormDialog
        open={!!catDialog}
        onClose={() => setCatDialog(null)}
        onSave={handleSaveCat}
        category={catDialog?.cat}
        busy={busy}
      />

      <Dialog open={!!deleteSvcDlg} onClose={() => setDeleteSvcDlg(null)} PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontFamily: ff, fontWeight: 700 }}>Delete Service?</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontFamily: ff }}>
            Delete <strong>{deleteSvcDlg?.service?.name}</strong>? This cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setDeleteSvcDlg(null)} sx={{ fontFamily: ff, textTransform: 'none', color: '#777' }}>Cancel</Button>
          <Button onClick={handleDeleteService} variant="contained" color="error" disabled={busy}
            sx={{ fontFamily: ff, borderRadius: '20px', px: 3, textTransform: 'none' }}>
            {busy ? 'Deleting…' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={!!deleteCatDlg} onClose={() => setDeleteCatDlg(null)} PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontFamily: ff, fontWeight: 700 }}>Delete Category?</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontFamily: ff }}>
            Delete <strong>{deleteCatDlg?.title}</strong> and all its services? This cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2.5 }}>
          <Button onClick={() => setDeleteCatDlg(null)} sx={{ fontFamily: ff, textTransform: 'none', color: '#777' }}>Cancel</Button>
          <Button onClick={handleDeleteCat} variant="contained" color="error" disabled={busy}
            sx={{ fontFamily: ff, borderRadius: '20px', px: 3, textTransform: 'none' }}>
            {busy ? 'Deleting…' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snack.open}
        autoHideDuration={3000}
        onClose={() => setSnack((p) => ({ ...p, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSnack((p) => ({ ...p, open: false }))} severity={snack.severity} sx={{ fontFamily: ff, borderRadius: 2 }}>
          {snack.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
}
