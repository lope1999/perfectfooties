import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Button,
  Chip,
  Skeleton,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Switch,
  FormControlLabel,
  Divider,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AddIcon from '@mui/icons-material/Add';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import ProductFormDialog from './ProductFormDialog';
import {
  addProduct,
  updateProduct,
  deleteProduct,
  addCategory,
  updateCategory,
  deleteCategory,
} from '../../lib/adminService';

const fontFamily = '"Georgia", serif';

export default function ProductsSection({ collectionName, categories, loading, onRefresh, type }) {
  const [editProduct, setEditProduct] = useState(null);
  const [editCategoryId, setEditCategoryId] = useState(null);
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [catDialog, setCatDialog] = useState(null); // { mode: 'add'|'edit', id, title }
  const [catForm, setCatForm] = useState({ id: '', title: '' });
  const [deleteCatDialog, setDeleteCatDialog] = useState(null);
  const [deleteProductDialog, setDeleteProductDialog] = useState(null);
  const [busy, setBusy] = useState(false);
  const [optionInput, setOptionInput] = useState({});



  const title = type === 'presson' ? 'Press-On Products' : 'Retail Products';

  const handleSaveProduct = async (data) => {
    setBusy(true);
    try {
      if (editProduct?.id) {
        await updateProduct(collectionName, editCategoryId, editProduct.id, data);
      } else {
        await addProduct(collectionName, editCategoryId, data);
      }
      await onRefresh();
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteProduct = async () => {
    if (!deleteProductDialog) return;
    setBusy(true);
    try {
      await deleteProduct(collectionName, deleteProductDialog.categoryId, deleteProductDialog.productId);
      setDeleteProductDialog(null);
      await onRefresh();
    } finally {
      setBusy(false);
    }
  };

  const handleSaveCategory = async () => {
    if (catDialog.mode === 'add' && !catForm.id.trim()) return;
    if (!catForm.title.trim()) return;
    setBusy(true);
    try {
      if (catDialog.mode === 'add') {
        await addCategory(collectionName, catForm.id.trim(), { title: catForm.title.trim() });
      } else {
        await updateCategory(collectionName, catDialog.id, { title: catForm.title.trim() });
      }
      setCatDialog(null);
      await onRefresh();
    } catch (err) {
      console.error('Category save error:', err);
    } finally {
      setBusy(false);
    }
  };

  const handleDeleteCategory = async () => {
    if (!deleteCatDialog) return;
    setBusy(true);
    try {
      await deleteCategory(collectionName, deleteCatDialog);
      setDeleteCatDialog(null);
      await onRefresh();
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <Box>
        <Skeleton variant="rounded" height={40} sx={{ mb: 2 }} />
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} variant="rounded" height={60} sx={{ mb: 1 }} />
        ))}
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="h5" sx={{ fontFamily, fontWeight: 700 }}>
          {title}
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            setCatForm({ id: '', title: '' });
            setCatDialog({ mode: 'add' });
          }}
          sx={{ fontFamily, backgroundColor: '#007a7a', '&:hover': { backgroundColor: '#005a5a' } }}
        >
          Add Category
        </Button>
      </Box>

      {categories.length === 0 && (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography sx={{ fontFamily, color: '#777' }}>No categories yet. Add one to get started.</Typography>
        </Paper>
      )}

      {categories.map((cat) => (
        <Accordion key={cat.id} sx={{ mb: 1, borderRadius: 1, '&:before': { display: 'none' } }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1 }}>
              <Typography sx={{ fontFamily, fontWeight: 700, flex: 1 }}>
                {cat.title || cat.id}
              </Typography>
              <Chip label={`${(cat.products || []).length} products`} size="small" />
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  setCatForm({ id: cat.id, title: cat.title || '' });
                  setCatDialog({ mode: 'edit', id: cat.id });
                }}
              >
                <EditIcon fontSize="small" />
              </IconButton>
              <IconButton
                size="small"
                onClick={(e) => {
                  e.stopPropagation();
                  setDeleteCatDialog(cat.id);
                }}
              >
                <DeleteOutlineIcon fontSize="small" sx={{ color: '#d32f2f' }} />
              </IconButton>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            {!cat.readyMade && (
              <>
                {/* Field Visibility Toggles */}
                <Box sx={{ mb: 2, p: 2, borderRadius: 2, backgroundColor: '#F9F0FF', border: '1px solid #CE93D8' }}>
                  <Typography sx={{ fontFamily, fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-purple)', mb: 1 }}>
                    Field Visibility
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    <FormControlLabel
                      control={<Switch size="small" checked={cat.showSetIncludes !== false} onChange={async (e) => { await updateCategory(collectionName, cat.id, { showSetIncludes: e.target.checked }); onRefresh(); }} />}
                      label={<Typography sx={{ fontFamily, fontSize: '0.82rem' }}>Set Includes?</Typography>}
                    />
                    <FormControlLabel
                      control={<Switch size="small" checked={cat.showInspirations !== false} onChange={async (e) => { await updateCategory(collectionName, cat.id, { showInspirations: e.target.checked }); onRefresh(); }} />}
                      label={<Typography sx={{ fontFamily, fontSize: '0.82rem' }}>Inspirations?</Typography>}
                    />
                    <FormControlLabel
                      control={<Switch size="small" checked={cat.showNotesField !== false} onChange={async (e) => { await updateCategory(collectionName, cat.id, { showNotesField: e.target.checked }); onRefresh(); }} />}
                      label={<Typography sx={{ fontFamily, fontSize: '0.82rem' }}>Notes Field?</Typography>}
                    />
                  </Box>
                </Box>

                {/* Set Includes Options */}
                <Box sx={{ mb: 2, p: 2, borderRadius: 2, backgroundColor: '#FFF8E1', border: '1px solid #FFE082' }}>
                  <Typography sx={{ fontFamily, fontWeight: 700, fontSize: '0.88rem', color: '#7A5800', mb: 1 }}>
                    &ldquo;Set Includes?&rdquo; Options
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1.5 }}>
                    {(cat.setIncludesOptions || []).map((opt) => (
                      <Chip
                        key={opt}
                        label={opt}
                        size="small"
                        onDelete={async () => {
                          const newOpts = (cat.setIncludesOptions || []).filter((o) => o !== opt);
                          await updateCategory(collectionName, cat.id, { setIncludesOptions: newOpts });
                          onRefresh();
                        }}
                        sx={{ fontSize: '0.72rem' }}
                      />
                    ))}
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <TextField
                      size="small"
                      placeholder="Add option…"
                      value={optionInput[cat.id]?.setIncludes || ''}
                      onChange={(e) => setOptionInput((prev) => ({ ...prev, [cat.id]: { ...prev[cat.id], setIncludes: e.target.value } }))}
                      onKeyDown={async (e) => {
                        if (e.key !== 'Enter') return;
                        const val = (optionInput[cat.id]?.setIncludes || '').trim();
                        if (!val) return;
                        await updateCategory(collectionName, cat.id, { setIncludesOptions: [...(cat.setIncludesOptions || []), val] });
                        setOptionInput((prev) => ({ ...prev, [cat.id]: { ...prev[cat.id], setIncludes: '' } }));
                        onRefresh();
                      }}
                      sx={{ flex: 1, '& .MuiOutlinedInput-root': { fontFamily } }}
                    />
                    <Button
                      size="small"
                      variant="contained"
                      onClick={async () => {
                        const val = (optionInput[cat.id]?.setIncludes || '').trim();
                        if (!val) return;
                        await updateCategory(collectionName, cat.id, { setIncludesOptions: [...(cat.setIncludesOptions || []), val] });
                        setOptionInput((prev) => ({ ...prev, [cat.id]: { ...prev[cat.id], setIncludes: '' } }));
                        onRefresh();
                      }}
                      sx={{ fontFamily, backgroundColor: '#007a7a', '&:hover': { backgroundColor: '#005a5a' } }}
                    >
                      Add
                    </Button>
                  </Box>
                </Box>

                {/* Inspiration Options */}
                <Box sx={{ mb: 2, p: 2, borderRadius: 2, backgroundColor: '#EDE7F6', border: '1px solid #CE93D8' }}>
                  <Typography sx={{ fontFamily, fontWeight: 700, fontSize: '0.88rem', color: '#5E35B1', mb: 1 }}>
                    Inspiration Options
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1.5 }}>
                    {(cat.inspirationOptions || []).map((opt) => (
                      <Chip
                        key={opt}
                        label={opt}
                        size="small"
                        onDelete={async () => {
                          const newOpts = (cat.inspirationOptions || []).filter((o) => o !== opt);
                          await updateCategory(collectionName, cat.id, { inspirationOptions: newOpts });
                          onRefresh();
                        }}
                        sx={{ fontSize: '0.72rem', backgroundColor: '#D1C4E9', color: '#4527A0' }}
                      />
                    ))}
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <TextField
                      size="small"
                      placeholder="Add option…"
                      value={optionInput[cat.id]?.inspiration || ''}
                      onChange={(e) => setOptionInput((prev) => ({ ...prev, [cat.id]: { ...prev[cat.id], inspiration: e.target.value } }))}
                      onKeyDown={async (e) => {
                        if (e.key !== 'Enter') return;
                        const val = (optionInput[cat.id]?.inspiration || '').trim();
                        if (!val) return;
                        await updateCategory(collectionName, cat.id, { inspirationOptions: [...(cat.inspirationOptions || []), val] });
                        setOptionInput((prev) => ({ ...prev, [cat.id]: { ...prev[cat.id], inspiration: '' } }));
                        onRefresh();
                      }}
                      sx={{ flex: 1, '& .MuiOutlinedInput-root': { fontFamily } }}
                    />
                    <Button
                      size="small"
                      variant="contained"
                      onClick={async () => {
                        const val = (optionInput[cat.id]?.inspiration || '').trim();
                        if (!val) return;
                        await updateCategory(collectionName, cat.id, { inspirationOptions: [...(cat.inspirationOptions || []), val] });
                        setOptionInput((prev) => ({ ...prev, [cat.id]: { ...prev[cat.id], inspiration: '' } }));
                        onRefresh();
                      }}
                      sx={{ fontFamily, backgroundColor: '#5E35B1', '&:hover': { backgroundColor: '#4527A0' } }}
                    >
                      Add
                    </Button>
                  </Box>
                </Box>
                <Divider sx={{ mb: 2, borderColor: '#E8D5B0' }} />
              </>
            )}
            <Box sx={{ display: 'flex', justifyContent: !cat.readyMade ? 'space-between' : 'flex-end', alignItems: 'center', mb: 1 }}>
              {!cat.readyMade && (
                <Typography sx={{ fontFamily, fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-muted)' }}>Length Variants</Typography>
              )}
              <Button
                size="small"
                startIcon={<AddIcon />}
                onClick={() => {
                  setEditProduct(null);
                  setEditCategoryId(cat.id);
                  setProductDialogOpen(true);
                }}
                sx={{ fontFamily, color: 'var(--text-purple)' }}
              >
                {cat.readyMade ? 'Add Product' : 'Add Variant'}
              </Button>
            </Box>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                    {(cat.readyMade ? ['Image', 'Name', 'Price', 'Stock', 'Actions'] : ['Name', 'Price', 'Actions']).map((h) => (
                      <TableCell key={h} sx={{ fontFamily, fontWeight: 700 }}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(cat.products || []).map((p) => {
                    const isHidden = !!p.hidden;
                    const isOutOfStock = p.stock !== undefined && p.stock <= 0;
                    if (!cat.readyMade) return (
                      <TableRow key={p.id} hover>
                        <TableCell sx={{ fontFamily }}>{p.name}</TableCell>
                        <TableCell sx={{ fontFamily }}>₦{(p.price || 0).toLocaleString()}</TableCell>
                        <TableCell>
                          <IconButton size="small" onClick={() => { setEditProduct(p); setEditCategoryId(cat.id); setProductDialogOpen(true); }}>
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton size="small" onClick={() => setDeleteProductDialog({ categoryId: cat.id, productId: p.id, name: p.name })}>
                            <DeleteOutlineIcon fontSize="small" sx={{ color: '#d32f2f' }} />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    );
                    return (
                    <TableRow key={p.id} hover sx={isHidden ? { opacity: 0.5 } : undefined}>
                      <TableCell>
                        {p.image ? (
                          <Box
                            component="img"
                            src={p.image}
                            alt={p.name}
                            sx={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 1 }}
                          />
                        ) : '—'}
                      </TableCell>
                      <TableCell sx={{ fontFamily }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {p.name}
                          {isHidden && <Chip label="Hidden" size="small" variant="outlined" color="default" />}
                          {p.discountEnabled && p.discountLabel && (
                            <Chip label={p.discountLabel} size="small" sx={{ backgroundColor: '#e8f5e9', color: '#2e7d32', fontWeight: 600, fontSize: '0.7rem' }} />
                          )}
                        </Box>
                      </TableCell>
                      <TableCell sx={{ fontFamily }}>
                        {p.discountEnabled && p.discountPrice != null ? (
                          <Box>
                            <Typography component="span" sx={{ textDecoration: 'line-through', color: '#999', fontSize: '0.8rem', mr: 0.5 }}>
                              ₦{(p.price || 0).toLocaleString()}
                            </Typography>
                            <Typography component="span" sx={{ color: '#2e7d32', fontWeight: 700, fontSize: '0.85rem' }}>
                              ₦{(p.discountPrice || 0).toLocaleString()}
                            </Typography>
                          </Box>
                        ) : (
                          `₦${(p.price || 0).toLocaleString()}`
                        )}
                      </TableCell>
                      <TableCell>
                        {p.stock !== undefined ? (
                          isOutOfStock ? (
                            <Chip label="Out of stock" size="small" color="error" />
                          ) : (
                            <Chip
                              label={p.stock}
                              size="small"
                              color={p.stock <= 5 ? 'error' : p.stock <= 15 ? 'warning' : 'success'}
                            />
                          )
                        ) : '—'}
                      </TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={async () => {
                            setBusy(true);
                            try {
                              await updateProduct(collectionName, cat.id, p.id, { hidden: !isHidden });
                              await onRefresh();
                            } finally {
                              setBusy(false);
                            }
                          }}
                          title={isHidden ? 'Show on storefront' : 'Hide from storefront'}
                        >
                          {isHidden ? (
                            <VisibilityOffIcon fontSize="small" sx={{ color: '#999' }} />
                          ) : (
                            <VisibilityIcon fontSize="small" sx={{ color: 'var(--text-purple)' }} />
                          )}
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => {
                            setEditProduct(p);
                            setEditCategoryId(cat.id);
                            setProductDialogOpen(true);
                          }}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => setDeleteProductDialog({ categoryId: cat.id, productId: p.id, name: p.name })}
                        >
                          <DeleteOutlineIcon fontSize="small" sx={{ color: '#d32f2f' }} />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                    );
                  })}
                  {(cat.products || []).length === 0 && (
                    <TableRow>
                      <TableCell colSpan={cat.readyMade ? 5 : 3} sx={{ textAlign: 'center', fontFamily, py: 2, color: '#777' }}>
                        {cat.readyMade ? 'No products in this category' : 'No length variants yet'}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </AccordionDetails>
        </Accordion>
      ))}

      {/* Product Form Dialog */}
      <ProductFormDialog
        open={productDialogOpen}
        onClose={() => { setProductDialogOpen(false); setEditProduct(null); }}
        onSave={handleSaveProduct}
        product={editProduct}
        type={type}
      />

      {/* Category Dialog */}
      <Dialog open={!!catDialog} onClose={() => setCatDialog(null)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontFamily, fontWeight: 700 }}>
          {catDialog?.mode === 'add' ? 'Add Category' : 'Edit Category'}
        </DialogTitle>
        <DialogContent>
          {catDialog?.mode === 'add' && (
            <TextField
              fullWidth
              label="Category ID (slug)"
              value={catForm.id}
              onChange={(e) => setCatForm((prev) => ({ ...prev, id: e.target.value }))}
              sx={{ mt: 1, mb: 2 }}
              InputProps={{ sx: { fontFamily } }}
              InputLabelProps={{ sx: { fontFamily } }}
            />
          )}
          <TextField
            fullWidth
            label="Category Title"
            value={catForm.title}
            onChange={(e) => setCatForm((prev) => ({ ...prev, title: e.target.value }))}
            sx={{ mt: catDialog?.mode === 'edit' ? 1 : 0 }}
            InputProps={{ sx: { fontFamily } }}
            InputLabelProps={{ sx: { fontFamily } }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCatDialog(null)} sx={{ fontFamily }}>Cancel</Button>
          <Button
            onClick={handleSaveCategory}
            variant="contained"
            disabled={busy || !catForm.title.trim() || (catDialog?.mode === 'add' && !catForm.id.trim())}
            sx={{ fontFamily, backgroundColor: '#007a7a', '&:hover': { backgroundColor: '#005a5a' } }}
          >
            {catDialog?.mode === 'add' ? 'Create' : 'Update'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Category Confirmation */}
      <Dialog open={!!deleteCatDialog} onClose={() => setDeleteCatDialog(null)}>
        <DialogTitle sx={{ fontFamily, fontWeight: 700 }}>Delete Category?</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontFamily }}>
            This will permanently delete the category <strong>{deleteCatDialog}</strong> and all its products.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteCatDialog(null)} sx={{ fontFamily }}>Cancel</Button>
          <Button onClick={handleDeleteCategory} variant="contained" color="error" disabled={busy} sx={{ fontFamily }}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Product Confirmation */}
      <Dialog open={!!deleteProductDialog} onClose={() => setDeleteProductDialog(null)}>
        <DialogTitle sx={{ fontFamily, fontWeight: 700 }}>Delete Product?</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontFamily }}>
            Are you sure you want to delete <strong>{deleteProductDialog?.name}</strong>?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteProductDialog(null)} sx={{ fontFamily }}>Cancel</Button>
          <Button onClick={handleDeleteProduct} variant="contained" color="error" disabled={busy} sx={{ fontFamily }}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
