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
  FormControlLabel,
  Switch,
  Box,
  Typography,
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
  hidden: false,
  discountEnabled: false,
  discountPrice: '',
  discountLabel: '',
  saleEndsAt: '',
};

export default function ProductFormDialog({ open, onClose, onSave, product, type }) {
  const [form, setForm] = useState(initialState);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setError('');
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
        hidden: !!product.hidden,
        discountEnabled: !!product.discountEnabled,
        discountPrice: product.discountPrice ?? '',
        discountLabel: product.discountLabel ?? '',
        saleEndsAt: product.saleEndsAt ?? '',
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
    setError('');
    try {
      const data = {
        name: form.name,
        description: form.description,
        price: parseFloat(form.price) || 0,
        image: form.image,
        hidden: form.hidden,
        discountEnabled: form.discountEnabled,
        discountPrice: form.discountEnabled ? (parseFloat(form.discountPrice) || 0) : null,
        discountLabel: form.discountEnabled ? (form.discountLabel || '') : '',
        saleEndsAt: form.discountEnabled && form.saleEndsAt ? form.saleEndsAt : null,
      };
      // Only include stock if a value was provided (Firestore rejects undefined)
      if (form.stock !== '') {
        data.stock = parseInt(form.stock, 10);
      }
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
      setError(err.message || 'Failed to save product. Please try again.');
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
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', alignItems: 'center', p: 1.5, borderRadius: 2, border: '1px solid #eee', backgroundColor: form.hidden ? '#FFF0F5' : '#fafafa' }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={form.hidden}
                    onChange={(e) => setForm((prev) => ({ ...prev, hidden: e.target.checked }))}
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': { color: '#E91E8C' },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#E91E8C' },
                    }}
                  />
                }
                label={
                  <Typography sx={{ fontFamily, fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-purple)' }}>
                    Hidden from storefront
                  </Typography>
                }
              />
            </Box>
          </Grid>
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', alignItems: 'center', p: 1.5, borderRadius: 2, border: '1px solid #eee', backgroundColor: form.discountEnabled ? '#e8f5e9' : '#fafafa' }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={form.discountEnabled}
                    onChange={(e) => setForm((prev) => ({ ...prev, discountEnabled: e.target.checked }))}
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': { color: '#2e7d32' },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#2e7d32' },
                    }}
                  />
                }
                label={
                  <Typography sx={{ fontFamily, fontSize: '0.9rem', fontWeight: 600, color: '#2e7d32' }}>
                    Discount Active
                  </Typography>
                }
              />
            </Box>
          </Grid>
          {form.discountEnabled && (
            <>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Sale Price"
                  type="number"
                  value={form.discountPrice}
                  onChange={handleChange('discountPrice')}
                  InputProps={{ sx: { fontFamily } }}
                  InputLabelProps={{ sx: { fontFamily } }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Discount Label"
                  placeholder="e.g. Easter Sale"
                  value={form.discountLabel}
                  onChange={handleChange('discountLabel')}
                  InputProps={{ sx: { fontFamily } }}
                  InputLabelProps={{ sx: { fontFamily } }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Sale ends at (optional)"
                  type="datetime-local"
                  value={form.saleEndsAt}
                  onChange={handleChange('saleEndsAt')}
                  InputLabelProps={{ shrink: true, sx: { fontFamily } }}
                  InputProps={{ sx: { fontFamily } }}
                  helperText="Leave empty for no expiry. Timer shown on product cards."
                />
              </Grid>
            </>
          )}
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
        {error && (
          <Typography sx={{ color: '#d32f2f', fontSize: '0.85rem', mt: 2, fontFamily }}>
            {error}
          </Typography>
        )}
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
