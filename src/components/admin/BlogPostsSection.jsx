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
  TextField,
  Select,
  MenuItem,
  IconButton,
  Button,
  Collapse,
  Skeleton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import RemoveCircleOutlineIcon from '@mui/icons-material/RemoveCircleOutline';
import { addBlogPost, updateBlogPost, deleteBlogPost } from '../../lib/blogService';
import ImageUploadField from './ImageUploadField';

const fontFamily = '"Georgia", serif';

const emptyForm = {
  title: '',
  category: '',
  author: 'PerfectFooties',
  date: '',
  readTime: '',
  image: '',
  excerpt: '',
  body: [''],
  sources: [''],
};

const categoryOptions = ['Leather Care', 'Craftsmanship', 'Leather Types', 'Style Guide'];

export default function BlogPostsSection({ blogPosts, loading, onRefresh }) {
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [expandedId, setExpandedId] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPost, setEditingPost] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteDialog, setDeleteDialog] = useState(null);
  const [busy, setBusy] = useState(false);
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' });

  const filtered = useMemo(() => {
    return blogPosts.filter((p) => {
      if (categoryFilter !== 'all' && p.category !== categoryFilter) return false;
      if (search) {
        const s = search.toLowerCase();
        const title = (p.title || '').toLowerCase();
        const author = (p.author || '').toLowerCase();
        if (!title.includes(s) && !author.includes(s)) return false;
      }
      return true;
    });
  }, [blogPosts, categoryFilter, search]);

  const stats = useMemo(() => {
    const total = blogPosts.length;
    const byCategory = {};
    for (const p of blogPosts) {
      byCategory[p.category] = (byCategory[p.category] || 0) + 1;
    }
    return { total, byCategory };
  }, [blogPosts]);

  const showSnack = (message, severity = 'success') => {
    setSnack({ open: true, message, severity });
  };

  const openAddDialog = () => {
    setEditingPost(null);
    setForm({ ...emptyForm, body: [''], sources: [''] });
    setDialogOpen(true);
  };

  const openEditDialog = (post) => {
    setEditingPost(post);
    setForm({
      title: post.title || '',
      category: post.category || '',
      author: post.author || 'PerfectFooties',
      date: post.date || '',
      readTime: post.readTime || '',
      image: post.image || '',
      excerpt: post.excerpt || '',
      body: post.body?.length > 0 ? [...post.body] : [''],
      sources: post.sources?.length > 0 ? [...post.sources] : [''],
    });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingPost(null);
    setForm(emptyForm);
  };

  const handleSave = async () => {
    if (!form.title.trim()) {
      showSnack('Title is required', 'error');
      return;
    }
    setBusy(true);
    try {
      const cleanBody = form.body.filter((p) => p.trim());
      const cleanSources = form.sources.filter((s) => s.trim());
      const data = { ...form, body: cleanBody, sources: cleanSources };

      if (editingPost) {
        await updateBlogPost(editingPost.id, data);
        showSnack('Blog post updated');
      } else {
        await addBlogPost(data);
        showSnack('Blog post created');
      }
      closeDialog();
      await onRefresh();
    } catch (err) {
      console.error('Save error:', err);
      showSnack(err.message || 'Failed to save blog post', 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog) return;
    setBusy(true);
    try {
      await deleteBlogPost(deleteDialog.id);
      setDeleteDialog(null);
      showSnack('Blog post deleted');
      await onRefresh();
    } catch (err) {
      console.error('Delete error:', err);
      showSnack(err.message || 'Failed to delete blog post', 'error');
    } finally {
      setBusy(false);
    }
  };

  // Dynamic list helpers
  const updateListItem = (field, index, value) => {
    setForm((prev) => {
      const list = [...prev[field]];
      list[index] = value;
      return { ...prev, [field]: list };
    });
  };
  const addListItem = (field) => {
    setForm((prev) => ({ ...prev, [field]: [...prev[field], ''] }));
  };
  const removeListItem = (field, index) => {
    setForm((prev) => {
      const list = prev[field].filter((_, i) => i !== index);
      return { ...prev, [field]: list.length > 0 ? list : [''] };
    });
  };

  if (loading) {
    return (
      <Box>
        <Skeleton variant="rounded" height={40} sx={{ mb: 2 }} />
        <Skeleton variant="rounded" height={400} />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Typography variant="h5" sx={{ fontFamily, fontWeight: 700 }}>
          Blog Posts ({filtered.length})
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={openAddDialog}
          sx={{ fontFamily, backgroundColor: '#006666', '&:hover': { backgroundColor: '#3a0b3e' } }}
        >
          Add Blog Post
        </Button>
      </Box>

      {/* Stats */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
        <Paper sx={{ px: 3, py: 2, borderRadius: 2, flex: '1 1 140px', minWidth: 140 }}>
          <Typography sx={{ fontFamily, fontSize: '0.78rem', color: '#777' }}>Total Posts</Typography>
          <Typography sx={{ fontFamily, fontWeight: 700, fontSize: '1.2rem', color: 'var(--text-purple)' }}>{stats.total}</Typography>
        </Paper>
        {Object.entries(stats.byCategory).map(([cat, count]) => (
          <Paper key={cat} sx={{ px: 3, py: 2, borderRadius: 2, flex: '1 1 140px', minWidth: 140 }}>
            <Typography sx={{ fontFamily, fontSize: '0.78rem', color: '#777' }}>{cat}</Typography>
            <Typography sx={{ fontFamily, fontWeight: 700, fontSize: '1.2rem', color: 'var(--text-purple)' }}>{count}</Typography>
          </Paper>
        ))}
      </Box>

      {/* Filters */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
        <TextField
          size="small"
          placeholder="Search by title or author…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          sx={{ minWidth: 220, '& .MuiOutlinedInput-root': { fontFamily } }}
        />
        <Select
          size="small"
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          sx={{ minWidth: 160, fontFamily }}
        >
          <MenuItem value="all">All Categories</MenuItem>
          {categoryOptions.map((c) => (
            <MenuItem key={c} value={c}>{c}</MenuItem>
          ))}
        </Select>
      </Box>

      {/* Table */}
      <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ backgroundColor: '#006666' }}>
              <TableCell sx={{ color: '#fff', fontFamily, fontWeight: 700, width: 40 }} />
              {['Title', 'Category', 'Author', 'Date', 'Read Time', 'Actions'].map((h) => (
                <TableCell key={h} sx={{ color: '#fff', fontFamily, fontWeight: 700 }}>
                  {h}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {filtered.map((post) => (
              <>
                <TableRow key={post.id} hover sx={{ cursor: 'pointer' }} onClick={() => setExpandedId(expandedId === post.id ? null : post.id)}>
                  <TableCell>
                    <IconButton size="small">
                      {expandedId === post.id ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    </IconButton>
                  </TableCell>
                  <TableCell sx={{ fontFamily, fontWeight: 600, maxWidth: 280 }}>
                    <Typography noWrap sx={{ fontFamily, fontSize: '0.85rem', fontWeight: 600 }}>{post.title}</Typography>
                  </TableCell>
                  <TableCell sx={{ fontFamily }}>{post.category}</TableCell>
                  <TableCell sx={{ fontFamily, fontSize: '0.8rem' }}>{post.author}</TableCell>
                  <TableCell sx={{ fontFamily, fontSize: '0.8rem' }}>{post.date}</TableCell>
                  <TableCell sx={{ fontFamily, fontSize: '0.8rem' }}>{post.readTime}</TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <IconButton size="small" onClick={() => openEditDialog(post)} title="Edit">
                      <EditIcon fontSize="small" sx={{ color: 'var(--text-purple)' }} />
                    </IconButton>
                    <IconButton size="small" onClick={() => setDeleteDialog(post)} title="Delete">
                      <DeleteOutlineIcon fontSize="small" sx={{ color: '#d32f2f' }} />
                    </IconButton>
                  </TableCell>
                </TableRow>
                <TableRow key={`${post.id}-detail`}>
                  <TableCell colSpan={7} sx={{ p: 0, border: 0 }}>
                    <Collapse in={expandedId === post.id}>
                      <Box sx={{ p: 2, backgroundColor: '#fafafa' }}>
                        <Typography sx={{ fontFamily, fontSize: '0.85rem', fontWeight: 700, mb: 0.5 }}>Excerpt:</Typography>
                        <Typography sx={{ fontFamily, fontSize: '0.82rem', color: 'var(--text-muted)', mb: 1 }}>{post.excerpt}</Typography>
                        {post.image && (
                          <Typography sx={{ fontFamily, fontSize: '0.8rem', color: '#777' }}>
                            Image: {post.image}
                          </Typography>
                        )}
                      </Box>
                    </Collapse>
                  </TableCell>
                </TableRow>
              </>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} sx={{ textAlign: 'center', fontFamily, py: 4 }}>
                  No blog posts found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={closeDialog} maxWidth="md" fullWidth scroll="paper">
        <DialogTitle sx={{ fontFamily, fontWeight: 700 }}>
          {editingPost ? 'Edit Blog Post' : 'Add Blog Post'}
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <TextField
              label="Title"
              fullWidth
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              InputProps={{ sx: { fontFamily } }}
              InputLabelProps={{ sx: { fontFamily } }}
            />
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Select
                size="small"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                displayEmpty
                sx={{ minWidth: 180, fontFamily, flex: 1 }}
              >
                <MenuItem value="" disabled>Select Category</MenuItem>
                {categoryOptions.map((c) => (
                  <MenuItem key={c} value={c}>{c}</MenuItem>
                ))}
              </Select>
              <TextField
                label="Author"
                size="small"
                value={form.author}
                onChange={(e) => setForm({ ...form, author: e.target.value })}
                sx={{ flex: 1, minWidth: 200 }}
                InputProps={{ sx: { fontFamily } }}
                InputLabelProps={{ sx: { fontFamily } }}
              />
            </Box>
            <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <TextField
                label="Date"
                size="small"
                placeholder="e.g. February 14, 2026"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                sx={{ flex: 1, minWidth: 180 }}
                InputProps={{ sx: { fontFamily } }}
                InputLabelProps={{ sx: { fontFamily } }}
              />
              <TextField
                label="Read Time"
                size="small"
                placeholder="e.g. 5 min read"
                value={form.readTime}
                onChange={(e) => setForm({ ...form, readTime: e.target.value })}
                sx={{ flex: 1, minWidth: 140 }}
                InputProps={{ sx: { fontFamily } }}
                InputLabelProps={{ sx: { fontFamily } }}
              />
            </Box>
            <ImageUploadField
              label="Blog Image"
              value={form.image}
              onChange={(url) => setForm({ ...form, image: url })}
              folder="blog"
            />
            <TextField
              label="Excerpt"
              fullWidth
              multiline
              minRows={2}
              value={form.excerpt}
              onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
              InputProps={{ sx: { fontFamily } }}
              InputLabelProps={{ sx: { fontFamily } }}
            />

            {/* Body paragraphs */}
            <Box>
              <Typography sx={{ fontFamily, fontWeight: 700, fontSize: '0.9rem', mb: 1 }}>Body Paragraphs</Typography>
              {form.body.map((para, i) => (
                <Box key={i} sx={{ display: 'flex', gap: 1, mb: 1, alignItems: 'flex-start' }}>
                  <TextField
                    fullWidth
                    multiline
                    minRows={2}
                    placeholder={`Paragraph ${i + 1}`}
                    value={para}
                    onChange={(e) => updateListItem('body', i, e.target.value)}
                    InputProps={{ sx: { fontFamily, fontSize: '0.85rem' } }}
                  />
                  <IconButton size="small" onClick={() => removeListItem('body', i)} sx={{ mt: 0.5 }}>
                    <RemoveCircleOutlineIcon fontSize="small" sx={{ color: '#d32f2f' }} />
                  </IconButton>
                </Box>
              ))}
              <Button size="small" startIcon={<AddIcon />} onClick={() => addListItem('body')} sx={{ fontFamily, color: 'var(--text-purple)' }}>
                Add Paragraph
              </Button>
            </Box>

            {/* Sources */}
            <Box>
              <Typography sx={{ fontFamily, fontWeight: 700, fontSize: '0.9rem', mb: 1 }}>Sources</Typography>
              {form.sources.map((src, i) => (
                <Box key={i} sx={{ display: 'flex', gap: 1, mb: 1, alignItems: 'center' }}>
                  <TextField
                    fullWidth
                    size="small"
                    placeholder={`Source ${i + 1}`}
                    value={src}
                    onChange={(e) => updateListItem('sources', i, e.target.value)}
                    InputProps={{ sx: { fontFamily, fontSize: '0.85rem' } }}
                  />
                  <IconButton size="small" onClick={() => removeListItem('sources', i)}>
                    <RemoveCircleOutlineIcon fontSize="small" sx={{ color: '#d32f2f' }} />
                  </IconButton>
                </Box>
              ))}
              <Button size="small" startIcon={<AddIcon />} onClick={() => addListItem('sources')} sx={{ fontFamily, color: 'var(--text-purple)' }}>
                Add Source
              </Button>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialog} sx={{ fontFamily }}>Cancel</Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={busy}
            sx={{ fontFamily, backgroundColor: '#006666', '&:hover': { backgroundColor: '#3a0b3e' } }}
          >
            {editingPost ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteDialog} onClose={() => setDeleteDialog(null)}>
        <DialogTitle sx={{ fontFamily, fontWeight: 700 }}>Delete Blog Post?</DialogTitle>
        <DialogContent>
          <Typography sx={{ fontFamily }}>
            Are you sure you want to delete <strong>{deleteDialog?.title}</strong>? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog(null)} sx={{ fontFamily }}>Cancel</Button>
          <Button
            onClick={handleDelete}
            variant="contained"
            color="error"
            disabled={busy}
            sx={{ fontFamily }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snack.open}
        autoHideDuration={4000}
        onClose={() => setSnack({ ...snack, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnack({ ...snack, open: false })}
          severity={snack.severity}
          sx={{ fontFamily }}
        >
          {snack.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
