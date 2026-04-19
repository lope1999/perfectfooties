import { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  Tooltip,
  Alert,
  Rating,
  Chip,
  Avatar,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import { fetchCollections, fetchItems } from '../../lib/collectionService';
import {
  fetchTestimonials,
  saveTestimonial,
  updateTestimonial,
  deleteTestimonial,
  uploadReviewPhoto,
} from '../../lib/testimonialService';

const ff = '"Georgia", serif';
const EMPTY_REVIEW = {
  id: '',
  name: '',
  occupation: '',
  email: '',
  rating: 5,
  testimonial: '',
  service: '',
  collectionId: '',
  collectionName: '',
  productId: '',
  productName: '',
  photoURLs: [],
  published: true,
};

function formatDate(value) {
  if (!value) return '-';
  const date = value?.toDate ? value.toDate() : new Date(value);
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function ReviewDialog({ open, onClose, onSaved, review, collections, productsByCollection }) {
  const isEdit = !!review;
  const [form, setForm] = useState(EMPTY_REVIEW);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [photoFiles, setPhotoFiles] = useState([]);
  const [photoPreviews, setPhotoPreviews] = useState([]);

  useEffect(() => {
    if (!open) return;
    if (review) {
      setForm({
        ...EMPTY_REVIEW,
        ...review,
        rating: review.rating || 5,
        testimonial: review.testimonial || review.review || '',
        service: review.service || review.productName || review.collectionName || '',
        photoURLs: Array.isArray(review.photoURLs) ? review.photoURLs : [],
      });
    } else {
      setForm(EMPTY_REVIEW);
    }
    setError('');
    setPhotoFiles([]);
    setPhotoPreviews([]);
  }, [open, review]);

  const productOptions = useMemo(() => {
    return Object.values(productsByCollection).flat();
  }, [productsByCollection]);

  const selectedCollectionItems = useMemo(() => {
    return productsByCollection[form.collectionId] || [];
  }, [form.collectionId, productsByCollection]);

  const setField = (field) => (event) => {
    const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const selectProduct = (productId) => {
    const product = productOptions.find((item) => item.id === productId);
    if (!product) {
      setForm((prev) => ({ ...prev, productId: '', productName: '', collectionId: '', collectionName: '' }));
      return;
    }
    setForm((prev) => ({
      ...prev,
      productId: product.id,
      productName: product.name,
      collectionId: product.collectionId,
      collectionName: product.collectionName,
      service: prev.service || product.name,
    }));
  };

  const handleCollectionChange = (event) => {
    const collectionId = event.target.value;
    const collection = collections.find((c) => c.id === collectionId);
    setForm((prev) => ({
      ...prev,
      collectionId,
      collectionName: collection?.name || '',
      productId: '',
      productName: '',
    }));
  };

  const handlePhotoChange = (event) => {
    const files = Array.from(event.target.files || []);
    const allowed = files.slice(0, 3 - form.photoURLs.length);
    setPhotoFiles(allowed);
    setPhotoPreviews(allowed.map((file) => URL.createObjectURL(file)));
  };

  const uploadPhotos = async () => {
    const uploaded = [];
    for (const file of photoFiles) {
      const url = await uploadReviewPhoto('admin', file);
      uploaded.push(url);
    }
    return [...form.photoURLs, ...uploaded];
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      setError('Customer name is required');
      return;
    }
    if (!form.testimonial.trim()) {
      setError('Review text is required');
      return;
    }
    if (!Number.isInteger(form.rating) || form.rating < 1 || form.rating > 5) {
      setError('Please select a rating between 1 and 5');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const photoURLs = await uploadPhotos();
      const payload = {
        name: form.name.trim(),
        occupation: form.occupation.trim(),
        email: form.email.trim(),
        rating: Number(form.rating),
        testimonial: form.testimonial.trim(),
        service: form.service.trim() || form.productName || form.collectionName || 'Customer review',
        collectionId: form.collectionId || '',
        collectionName: form.collectionName || '',
        productId: form.productId || '',
        productName: form.productName || '',
        published: !!form.published,
        source: 'admin',
        photoURLs,
      };

      if (isEdit) {
        await updateTestimonial(review.id, payload);
        onSaved('Review updated successfully.');
      } else {
        await saveTestimonial(payload);
        onSaved('Review added successfully.');
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Unable to save review');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle sx={{ fontFamily: ff, fontWeight: 700, color: 'var(--text-purple)' }}>
        {isEdit ? 'Edit Review' : 'Add Review'}
      </DialogTitle>
      <DialogContent sx={{ display: 'grid', gap: 2, pt: 1 }}>
        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: '1fr 1fr' }}>
          <TextField
            label="Customer Name"
            value={form.name}
            onChange={setField('name')}
            size="small"
            fullWidth
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="Occupation / Role"
            value={form.occupation}
            onChange={setField('occupation')}
            size="small"
            fullWidth
            InputLabelProps={{ shrink: true }}
          />
        </Box>
        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: '1fr 1fr' }}>
          <TextField
            label="Email (optional)"
            value={form.email}
            onChange={setField('email')}
            size="small"
            fullWidth
          />
          <FormControl size="small" fullWidth>
            <InputLabel>Collection</InputLabel>
            <Select
              value={form.collectionId}
              label="Collection"
              onChange={handleCollectionChange}
            >
              <MenuItem value="">None</MenuItem>
              {collections.map((collection) => (
                <MenuItem key={collection.id} value={collection.id}>
                  {collection.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
        <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: '1fr 1fr' }}>
          <FormControl size="small" fullWidth>
            <InputLabel>Product</InputLabel>
            <Select
              value={form.productId}
              label="Product"
              onChange={(event) => selectProduct(event.target.value)}
            >
              <MenuItem value="">None</MenuItem>
              {form.collectionId ? (
                selectedCollectionItems.map((item) => (
                  <MenuItem key={item.id} value={item.id}>
                    {item.name}
                  </MenuItem>
                ))
              ) : (
                collections.flatMap((collection) => [
                  <MenuItem key={`heading-${collection.id}`} disabled sx={{ fontWeight: '700', opacity: 1 }}>
                    {collection.name}
                  </MenuItem>,
                  ...(productsByCollection[collection.id] || []).map((item) => (
                    <MenuItem key={item.id} value={item.id} sx={{ pl: 4 }}>
                      {item.name}
                    </MenuItem>
                  )),
                ])
              )}
            </Select>
          </FormControl>
          <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: '1fr 1fr' }}>
            <TextField
              label="Review title / summary"
              value={form.service}
              onChange={setField('service')}
              size="small"
              fullWidth
            />
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography sx={{ fontFamily: ff, fontSize: '0.95rem' }}>Rating</Typography>
              <Rating
                name="review-rating"
                value={Number(form.rating)}
                onChange={(event, value) => setForm((prev) => ({ ...prev, rating: value || 0 }))}
              />
            </Box>
          </Box>
        </Box>
        <TextField
          label="Review text"
          value={form.testimonial}
          onChange={setField('testimonial')}
          size="small"
          multiline
          rows={4}
          fullWidth
        />
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}>
          <Button
            component="label"
            startIcon={<PhotoCameraIcon />}
            size="small"
          >
            Upload photos
            <input hidden accept="image/*" multiple type="file" onChange={handlePhotoChange} />
          </Button>
          <Typography sx={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            {form.photoURLs.length + photoFiles.length}/3 photos
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {form.photoURLs.map((url, index) => (
            <Avatar
              key={`existing-${index}`}
              src={url}
              variant="rounded"
              sx={{ width: 80, height: 80, border: '1px solid #E8D5B0' }}
            />
          ))}
          {photoPreviews.map((src, index) => (
            <Avatar
              key={`preview-${index}`}
              src={src}
              variant="rounded"
              sx={{ width: 80, height: 80, border: '1px dashed #ccc' }}
            />
          ))}
        </Box>
        <FormControlLabel
          control={<Switch checked={form.published} onChange={setField('published')} />}
          label="Published"
        />
        {error && <Alert severity="error">{error}</Alert>}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5 }}>
        <Button onClick={onClose} sx={{ fontFamily: ff, color: '#888', textTransform: 'none' }}>
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          disabled={loading}
          startIcon={loading ? <CircularProgress size={14} sx={{ color: '#fff' }} /> : <AddIcon />}
          sx={{
            fontFamily: ff,
            fontWeight: 700,
            textTransform: 'none',
            backgroundColor: 'var(--text-purple)',
            color: '#fff',
            borderRadius: '20px',
            px: 3,
            '&:hover': { backgroundColor: 'var(--accent-cyan-hover)' },
          }}
        >
          {isEdit ? 'Save Changes' : 'Add Review'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default function ReviewsSection() {
  const [reviews, setReviews] = useState([]);
  const [collections, setCollections] = useState([]);
  const [productsByCollection, setProductsByCollection] = useState({});
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingReview, setEditingReview] = useState(null);
  const [snack, setSnack] = useState({ open: false, message: '' });

  const loadData = async () => {
    setLoading(true);
    try {
      const [savedReviews, fetchedCollections] = await Promise.all([
        fetchTestimonials(),
        fetchCollections(),
      ]);

      const collectionItems = await Promise.all(
        fetchedCollections.map((collection) => fetchItems(collection.id).catch(() => [])),
      );

      const products = {};
      fetchedCollections.forEach((collection, index) => {
        products[collection.id] = collectionItems[index].map((item) => ({
          ...item,
          collectionName: collection.name,
          collectionId: collection.id,
        }));
      });

      setCollections(fetchedCollections);
      setProductsByCollection(products);
      setReviews(savedReviews);
    } catch (err) {
      console.error('Review section load error:', err);
      setReviews([]);
      setCollections([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaved = (message) => {
    setSnack({ open: true, message });
    loadData();
  };

  const handleDelete = async (reviewId) => {
    if (!window.confirm('Delete this review?')) return;
    try {
      await deleteTestimonial(reviewId);
      setSnack({ open: true, message: 'Review deleted' });
      loadData();
    } catch (err) {
      console.error('Delete review failed', err);
      setSnack({ open: true, message: 'Unable to delete review' });
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3, gap: 2 }}>
        <Box>
          <Typography sx={{ fontFamily: ff, fontWeight: 700, fontSize: '1.6rem', color: 'var(--text-purple)' }}>
            Reviews
          </Typography>
          <Typography sx={{ fontFamily: ff, color: '#777', mt: 0.5 }}>
            Add or manage legacy customer reviews, then surface them on testimonials and collection pages.
          </Typography>
        </Box>
        <Button
          startIcon={<AddIcon />}
          onClick={() => {
            setEditingReview(null);
            setDialogOpen(true);
          }}
          sx={{
            fontFamily: ff,
            textTransform: 'none',
            backgroundColor: 'var(--text-purple)',
            color: '#fff',
            borderRadius: '999px',
            px: 3,
            '&:hover': { backgroundColor: 'var(--accent-cyan-hover)' },
          }}
        >
          Add Review
        </Button>
      </Box>

      <Paper sx={{ p: 2, borderRadius: 3, border: '1px solid #E8D5B0' }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress sx={{ color: 'var(--accent-cyan)' }} />
          </Box>
        ) : reviews.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 8 }}>
            <Typography sx={{ fontFamily: ff, fontSize: '0.95rem', color: '#555' }}>
              No reviews yet — add your first admin-managed review.
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: '#F5F5F5' }}>
                  <TableCell sx={{ fontFamily: ff, fontWeight: 700 }}>Customer</TableCell>
                  <TableCell sx={{ fontFamily: ff, fontWeight: 700 }}>Product</TableCell>
                  <TableCell sx={{ fontFamily: ff, fontWeight: 700 }}>Collection</TableCell>
                  <TableCell sx={{ fontFamily: ff, fontWeight: 700 }}>Rating</TableCell>
                  <TableCell sx={{ fontFamily: ff, fontWeight: 700 }}>Published</TableCell>
                  <TableCell sx={{ fontFamily: ff, fontWeight: 700 }}>Photos</TableCell>
                  <TableCell sx={{ fontFamily: ff, fontWeight: 700 }}>Date</TableCell>
                  <TableCell sx={{ fontFamily: ff, fontWeight: 700 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {reviews.map((review) => (
                  <TableRow key={review.id} sx={{ '&:hover': { backgroundColor: 'rgba(0,255,255,0.04)' } }}>
                    <TableCell sx={{ fontFamily: ff }}> {review.name} </TableCell>
                    <TableCell sx={{ fontFamily: ff, color: 'var(--text-main)' }}>
                      {review.productName || review.service || 'General'}
                    </TableCell>
                    <TableCell>{review.collectionName || review.collectionId || '-'}</TableCell>
                    <TableCell>
                      <Rating value={Number(review.rating) || 0} readOnly size="small" />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={review.published === false ? 'Draft' : 'Published'}
                        size="small"
                        sx={{
                          backgroundColor: review.published === false ? '#faf2f2' : '#e8f5e9',
                          color: review.published === false ? '#b71c1c' : '#2e7d32',
                          fontWeight: 700,
                        }}
                      />
                    </TableCell>
                    <TableCell>{(review.photoURLs || []).length}</TableCell>
                    <TableCell>{formatDate(review.createdAt)}</TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Tooltip title="Edit review">
                          <IconButton
                            size="small"
                            onClick={() => {
                              setEditingReview(review);
                              setDialogOpen(true);
                            }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete review">
                          <IconButton
                            size="small"
                            onClick={() => handleDelete(review.id)}
                          >
                            <DeleteOutlineIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      <ReviewDialog
        open={dialogOpen}
        review={editingReview}
        onClose={() => setDialogOpen(false)}
        onSaved={handleSaved}
        collections={collections}
        productsByCollection={productsByCollection}
      />

      {snack.open && (
        <Box sx={{ position: 'fixed', bottom: 16, right: 16, zIndex: 2000 }}>
          <Alert severity="success" onClose={() => setSnack({ open: false, message: '' })}>
            {snack.message}
          </Alert>
        </Box>
      )}
    </Box>
  );
}
