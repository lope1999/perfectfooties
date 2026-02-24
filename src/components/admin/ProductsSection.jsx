import { useState } from 'react';
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
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AddIcon from '@mui/icons-material/Add';
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
    setBusy(true);
    try {
      if (catDialog.mode === 'add') {
        await addCategory(collectionName, catForm.id, { title: catForm.title });
      } else {
        await updateCategory(collectionName, catDialog.id, { title: catForm.title });
      }
      setCatDialog(null);
      await onRefresh();
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
          sx={{ fontFamily, backgroundColor: '#4A0E4E', '&:hover': { backgroundColor: '#3a0b3e' } }}
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
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1 }}>
              <Button
                size="small"
                startIcon={<AddIcon />}
                onClick={() => {
                  setEditProduct(null);
                  setEditCategoryId(cat.id);
                  setProductDialogOpen(true);
                }}
                sx={{ fontFamily, color: '#4A0E4E' }}
              >
                Add Product
              </Button>
            </Box>
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                    {['Image', 'Name', 'Price', 'Stock', 'Actions'].map((h) => (
                      <TableCell key={h} sx={{ fontFamily, fontWeight: 700 }}>{h}</TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(cat.products || []).map((p) => (
                    <TableRow key={p.id} hover>
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
                      <TableCell sx={{ fontFamily }}>{p.name}</TableCell>
                      <TableCell sx={{ fontFamily }}>${(p.price || 0).toFixed(2)}</TableCell>
                      <TableCell>
                        {p.stock !== undefined ? (
                          <Chip
                            label={p.stock}
                            size="small"
                            color={p.stock <= 5 ? 'error' : p.stock <= 15 ? 'warning' : 'success'}
                          />
                        ) : '—'}
                      </TableCell>
                      <TableCell>
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
                  ))}
                  {(cat.products || []).length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} sx={{ textAlign: 'center', fontFamily, py: 2, color: '#777' }}>
                        No products in this category
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
            disabled={busy || (!catForm.title && catDialog?.mode === 'add' && !catForm.id)}
            sx={{ fontFamily, backgroundColor: '#4A0E4E', '&:hover': { backgroundColor: '#3a0b3e' } }}
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
