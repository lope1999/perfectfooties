import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  MenuItem,
} from '@mui/material';

import { pressOnNailShapes, pressOnLengths } from '../../data/products';

const fontFamily = '"Georgia", serif';

const initialState = {
  name: '',
  description: '',
  price: '',
  image: '',
  stock: '',
  type: '',
  shape: '',
  length: '',
};

export default function ProductFormDialog({ open, onClose, onSave, product, type }) {
  const [form, setForm] = useState(initialState);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (product) {
      setForm({
        name: product.name || '',
        description: product.description || '',
        price: product.price ?? '',
        image: product.image || '',
        stock: product.stock ?? '',
        type: product.type || '',
        shape: product.shape || '',
        length: product.length || '',
      });
    } else {
      setForm(initialState);
    }
  }, [product, open]);

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async () => {
    setBusy(true);
    try {
      const data = {
        name: form.name,
        description: form.description,
        price: parseFloat(form.price) || 0,
        image: form.image,
        stock: form.stock !== '' ? parseInt(form.stock, 10) : undefined,
      };
      if (type === 'presson') {
        if (form.type) data.type = form.type;
        if (form.shape) data.shape = form.shape;
        if (form.length) data.length = form.length;
      }
      if (form.type) data.type = form.type;
      if (product?.id) data.id = product.id;
      await onSave(data);
      onClose();
    } catch (err) {
      console.error('Product save error:', err);
    } finally {
      setBusy(false);
    }
  };

  const isPresson = type === 'presson';

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontFamily, fontWeight: 700 }}>
        {product ? 'Edit Product' : 'Add Product'}
      </DialogTitle>
      <DialogContent>
        <Grid container spacing={2} sx={{ mt: 0.5 }}>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Product Name"
              value={form.name}
              onChange={handleChange('name')}
              required
              InputProps={{ sx: { fontFamily } }}
              InputLabelProps={{ sx: { fontFamily } }}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Description"
              value={form.description}
              onChange={handleChange('description')}
              multiline
              rows={2}
              InputProps={{ sx: { fontFamily } }}
              InputLabelProps={{ sx: { fontFamily } }}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              fullWidth
              label="Price"
              type="number"
              value={form.price}
              onChange={handleChange('price')}
              required
              InputProps={{ sx: { fontFamily } }}
              InputLabelProps={{ sx: { fontFamily } }}
            />
          </Grid>
          <Grid item xs={6}>
            <TextField
              fullWidth
              label="Stock"
              type="number"
              value={form.stock}
              onChange={handleChange('stock')}
              InputProps={{ sx: { fontFamily } }}
              InputLabelProps={{ sx: { fontFamily } }}
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              label="Image URL"
              value={form.image}
              onChange={handleChange('image')}
              InputProps={{ sx: { fontFamily } }}
              InputLabelProps={{ sx: { fontFamily } }}
            />
          </Grid>
          {isPresson && (
            <>
              <Grid item xs={4}>
                <TextField
                  fullWidth
                  label="Type"
                  value={form.type}
                  onChange={handleChange('type')}
                  InputProps={{ sx: { fontFamily } }}
                  InputLabelProps={{ sx: { fontFamily } }}
                />
              </Grid>
              <Grid item xs={4}>
                <TextField
                  fullWidth
                  select
                  label="Shape"
                  value={form.shape}
                  onChange={handleChange('shape')}
                  InputProps={{ sx: { fontFamily } }}
                  InputLabelProps={{ sx: { fontFamily } }}
                >
                  <MenuItem value="">None</MenuItem>
                  {pressOnNailShapes.map((s) => (
                    <MenuItem key={s} value={s}>{s}</MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid item xs={4}>
                <TextField
                  fullWidth
                  select
                  label="Length"
                  value={form.length}
                  onChange={handleChange('length')}
                  InputProps={{ sx: { fontFamily } }}
                  InputLabelProps={{ sx: { fontFamily } }}
                >
                  <MenuItem value="">None</MenuItem>
                  {pressOnLengths.map((l) => (
                    <MenuItem key={l} value={l}>{l}</MenuItem>
                  ))}
                </TextField>
              </Grid>
            </>
          )}
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} sx={{ fontFamily }}>Cancel</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={busy || !form.name || !form.price}
          sx={{ fontFamily, backgroundColor: '#4A0E4E', '&:hover': { backgroundColor: '#3a0b3e' } }}
        >
          {product ? 'Update' : 'Add'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
