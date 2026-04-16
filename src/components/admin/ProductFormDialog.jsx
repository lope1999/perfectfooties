import { useState, useEffect, useRef } from 'react';
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
  CircularProgress,
  LinearProgress,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import ImageIcon from '@mui/icons-material/Image';
import ClearIcon from '@mui/icons-material/Clear';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '../../lib/firebase';
// Kept for admin until Phase 5 updates the product form for leather goods
const pressOnNailShapes = ['Almond', 'Coffin', 'Stiletto', 'Square', 'Round', 'Oval', 'Ballerina'];
const pressOnLengths = ['Short (S)', 'Medium (M)', 'Long (L)', 'XL (Extra Long)'];

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
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef(null);

  useEffect(() => {
    setError('');
    setUploading(false);
    setUploadProgress(0);
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

  const handleFileSelect = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('Image must be under 10 MB.');
      return;
    }
    setError('');
    setUploading(true);
    setUploadProgress(0);

    const ext = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).slice(2)}.${ext}`;
    const storageRef = ref(storage, `products/${fileName}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      'state_changed',
      (snap) => setUploadProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
      (err) => { setError('Upload failed: ' + err.message); setUploading(false); },
      async () => {
        const url = await getDownloadURL(uploadTask.snapshot.ref);
        setForm((prev) => ({ ...prev, image: url }));
        setUploading(false);
      },
    );
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileSelect(file);
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

          {/* Image upload */}
          <Grid item xs={12}>
            <Typography sx={{ fontFamily, fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-purple)', mb: 1 }}>
              Product Image
            </Typography>

            {/* Upload drop zone */}
            <Box
              onClick={() => !uploading && fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              sx={{
                border: '2px dashed',
                borderColor: uploading ? '#e3242b' : form.image ? '#006666' : '#E8D5B0',
                borderRadius: 2,
                p: 2,
                textAlign: 'center',
                cursor: uploading ? 'default' : 'pointer',
                backgroundColor: form.image ? '#FFF5F8' : '#FAFAFA',
                transition: 'all 0.2s',
                '&:hover': { borderColor: '#e3242b', backgroundColor: '#FFF5F8' },
                position: 'relative',
                minHeight: 100,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 1,
              }}
            >
              {form.image && !uploading ? (
                <>
                  <Box
                    component="img"
                    src={form.image}
                    alt="preview"
                    sx={{ maxHeight: 140, maxWidth: '100%', borderRadius: 1, objectFit: 'contain' }}
                    onError={(e) => { e.target.style.display = 'none'; }}
                  />
                  <Typography sx={{ fontFamily, fontSize: '0.75rem', color: '#888' }}>
                    Click or drag to replace
                  </Typography>
                </>
              ) : uploading ? (
                <>
                  <CircularProgress size={28} sx={{ color: '#e3242b' }} />
                  <Typography sx={{ fontFamily, fontSize: '0.82rem', color: '#e3242b' }}>
                    Uploading… {uploadProgress}%
                  </Typography>
                  <LinearProgress
                    variant="determinate"
                    value={uploadProgress}
                    sx={{ width: '80%', borderRadius: 1, '& .MuiLinearProgress-bar': { backgroundColor: '#e3242b' } }}
                  />
                </>
              ) : (
                <>
                  <CloudUploadIcon sx={{ fontSize: 36, color: '#E8D5B0' }} />
                  <Typography sx={{ fontFamily, fontSize: '0.85rem', color: '#888' }}>
                    Click or drag & drop to upload
                  </Typography>
                  <Typography sx={{ fontFamily, fontSize: '0.75rem', color: '#bbb' }}>
                    JPG, PNG, WEBP — max 10 MB
                  </Typography>
                </>
              )}
            </Box>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={(e) => handleFileSelect(e.target.files?.[0])}
            />

            {/* Clear button */}
            {form.image && !uploading && (
              <Button
                size="small"
                startIcon={<ClearIcon />}
                onClick={() => setForm((prev) => ({ ...prev, image: '' }))}
                sx={{ mt: 0.5, fontFamily, fontSize: '0.75rem', color: '#999', textTransform: 'none' }}
              >
                Remove image
              </Button>
            )}

            {/* URL fallback */}
            <TextField
              fullWidth
              label="Or paste image URL"
              value={form.image.startsWith('http') && !form.image.includes('firebasestorage') ? form.image : ''}
              onChange={(e) => setForm((prev) => ({ ...prev, image: e.target.value }))}
              placeholder="https://..."
              size="small"
              sx={{ mt: 1.5 }}
              InputProps={{ sx: { fontFamily, fontSize: '0.83rem' }, startAdornment: <ImageIcon sx={{ color: '#ccc', mr: 0.5, fontSize: 18 }} /> }}
              InputLabelProps={{ sx: { fontFamily, fontSize: '0.83rem' } }}
            />
          </Grid>

          <Grid item xs={12}>
            <Box sx={{ display: 'flex', alignItems: 'center', p: 1.5, borderRadius: 2, border: '1px solid #eee', backgroundColor: form.hidden ? '#FFF8F0' : '#fafafa' }}>
              <FormControlLabel
                control={
                  <Switch
                    checked={form.hidden}
                    onChange={(e) => setForm((prev) => ({ ...prev, hidden: e.target.checked }))}
                    sx={{
                      '& .MuiSwitch-switchBase.Mui-checked': { color: '#e3242b' },
                      '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#e3242b' },
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
          disabled={busy || uploading || !form.name || !form.price}
          sx={{ fontFamily, backgroundColor: '#006666', '&:hover': { backgroundColor: '#3a0b3e' } }}
        >
          {product ? 'Update' : 'Add'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
