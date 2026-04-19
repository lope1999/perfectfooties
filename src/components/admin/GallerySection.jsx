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
import { addGalleryImage, updateGalleryImage, deleteGalleryImage } from '../../lib/galleryService';
import ImageUploadField from './ImageUploadField';

const fontFamily = '"Georgia", serif';

const categoryOptions = [
  { value: 'footwear', label: 'Footwear' },
  { value: 'bags', label: 'Bags & Accessories' },
  { value: 'lifestyle', label: 'Lifestyle' },
];

const emptyForm = {
  imageUrl: '',
  caption: '',
  category: 'footwear',
  order: 0,
};

export default function GallerySection({ galleryImages, loading, onRefresh }) {
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingImage, setEditingImage] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [deleteDialog, setDeleteDialog] = useState(null);
  const [busy, setBusy] = useState(false);
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' });

  const filtered = useMemo(() => {
    return galleryImages.filter((img) => {
      if (categoryFilter !== 'all' && img.category !== categoryFilter) return false;
      return true;
    });
  }, [galleryImages, categoryFilter]);

  const stats = useMemo(() => {
    const total = galleryImages.length;
    const footwear = galleryImages.filter((i) => i.category === 'footwear').length;
    const bags = galleryImages.filter((i) => i.category === 'bags').length;
    return { total, footwear, bags };
  }, [galleryImages]);

  const showSnack = (message, severity = 'success') => {
    setSnack({ open: true, message, severity });
  };

  const openAddDialog = () => {
    setEditingImage(null);
    setForm({ ...emptyForm });
    setDialogOpen(true);
  };

  const openEditDialog = (img) => {
    setEditingImage(img);
    setForm({
      imageUrl: img.imageUrl || '',
      caption: img.caption || '',
      category: img.category || 'footwear',
      order: img.order ?? 0,
    });
    setDialogOpen(true);
  };

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingImage(null);
    setForm(emptyForm);
  };

  const handleSave = async () => {
    if (!form.imageUrl.trim()) {
      showSnack('Image URL is required', 'error');
      return;
    }
    setBusy(true);
    try {
      if (editingImage) {
        await updateGalleryImage(editingImage.id, form);
        showSnack('Gallery image updated');
      } else {
        await addGalleryImage(form);
        showSnack('Gallery image added');
      }
      closeDialog();
      await onRefresh();
    } catch (err) {
      console.error('Save error:', err);
      showSnack(err.message || 'Failed to save', 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteDialog) return;
    setBusy(true);
    try {
      await deleteGalleryImage(deleteDialog.id);
      setDeleteDialog(null);
      showSnack('Gallery image deleted');
      await onRefresh();
    } catch (err) {
      console.error('Delete error:', err);
      showSnack(err.message || 'Failed to delete', 'error');
    } finally {
      setBusy(false);
    }
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
			<Box
				sx={{
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
					mb: 2,
					flexWrap: "wrap",
					gap: 1,
				}}
			>
				<Typography variant="h5" sx={{ fontFamily, fontWeight: 700 }}>
					Gallery ({filtered.length})
				</Typography>
				<Box sx={{ display: "flex", gap: 1 }}>
					<Button
						variant="contained"
						startIcon={<AddIcon />}
						onClick={openAddDialog}
						sx={{
							fontFamily,
							backgroundColor: "#007a7a",
							"&:hover": { backgroundColor: "#005a5a" },
						}}
					>
						Add Image
					</Button>
				</Box>
			</Box>

			{/* Stats */}
			<Box sx={{ display: "flex", gap: 2, mb: 3, flexWrap: "wrap" }}>
				<Paper
					sx={{
						px: 3,
						py: 2,
						borderRadius: 2,
						flex: "1 1 140px",
						minWidth: 140,
					}}
				>
					<Typography
						sx={{ fontFamily, fontSize: "0.78rem", color: "#777" }}
					>
						Total Images
					</Typography>
					<Typography
						sx={{
							fontFamily,
							fontWeight: 700,
							fontSize: "1.2rem",
							color: "var(--text-purple)",
						}}
					>
						{stats.total}
					</Typography>
				</Paper>
				<Paper
					sx={{
						px: 3,
						py: 2,
						borderRadius: 2,
						flex: "1 1 140px",
						minWidth: 140,
					}}
				>
					<Typography
						sx={{ fontFamily, fontSize: "0.78rem", color: "#777" }}
					>
						Footwear
					</Typography>
					<Typography
						sx={{
							fontFamily,
							fontWeight: 700,
							fontSize: "1.2rem",
							color: "var(--text-purple)",
						}}
					>
						{stats.footwear}
					</Typography>
				</Paper>
				<Paper
					sx={{
						px: 3,
						py: 2,
						borderRadius: 2,
						flex: "1 1 140px",
						minWidth: 140,
					}}
				>
					<Typography
						sx={{ fontFamily, fontSize: "0.78rem", color: "#777" }}
					>
						Bags & Accessories
					</Typography>
					<Typography
						sx={{
							fontFamily,
							fontWeight: 700,
							fontSize: "1.2rem",
							color: "var(--text-purple)",
						}}
					>
						{stats.bags}
					</Typography>
				</Paper>
			</Box>

			{/* Filter */}
			<Box sx={{ mb: 2 }}>
				<Select
					size="small"
					value={categoryFilter}
					onChange={(e) => setCategoryFilter(e.target.value)}
					sx={{ minWidth: 180, fontFamily }}
				>
					<MenuItem value="all">All Categories</MenuItem>
					{categoryOptions.map((c) => (
						<MenuItem key={c.value} value={c.value}>
							{c.label}
						</MenuItem>
					))}
				</Select>
			</Box>

			{/* Table */}
			<TableContainer component={Paper} sx={{ borderRadius: 2 }}>
				<Table size="small">
					<TableHead>
						<TableRow sx={{ backgroundColor: "#007a7a" }}>
							{[
								"Preview",
								"Caption",
								"Category",
								"Order",
								"Actions",
							].map((h) => (
								<TableCell
									key={h}
									sx={{ color: "#fff", fontFamily, fontWeight: 700 }}
								>
									{h}
								</TableCell>
							))}
						</TableRow>
					</TableHead>
					<TableBody>
						{filtered.map((img) => (
							<TableRow key={img.id} hover>
								<TableCell sx={{ width: 80 }}>
									<Box
										component="img"
										src={img.imageUrl}
										alt={img.caption || ""}
										sx={{
											width: 60,
											height: 60,
											objectFit: "cover",
											borderRadius: 1,
										}}
									/>
								</TableCell>
								<TableCell sx={{ fontFamily, fontSize: "0.85rem" }}>
									{img.caption || "—"}
								</TableCell>
								<TableCell sx={{ fontFamily, fontSize: "0.85rem" }}>
									{categoryOptions.find(
										(c) => c.value === img.category,
									)?.label || img.category}
								</TableCell>
								<TableCell sx={{ fontFamily, fontSize: "0.85rem" }}>
									{img.order}
								</TableCell>
								<TableCell>
									<IconButton
										size="small"
										onClick={() => openEditDialog(img)}
										title="Edit"
									>
										<EditIcon
											fontSize="small"
											sx={{ color: "var(--text-purple)" }}
										/>
									</IconButton>
									<IconButton
										size="small"
										onClick={() => setDeleteDialog(img)}
										title="Delete"
									>
										<DeleteOutlineIcon
											fontSize="small"
											sx={{ color: "#d32f2f" }}
										/>
									</IconButton>
								</TableCell>
							</TableRow>
						))}
						{filtered.length === 0 && (
							<TableRow>
								<TableCell
									colSpan={5}
									sx={{ textAlign: "center", fontFamily, py: 4 }}
								>
									No gallery images found
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</TableContainer>

			{/* Add/Edit Dialog */}
			<Dialog
				open={dialogOpen}
				onClose={closeDialog}
				maxWidth="sm"
				fullWidth
			>
				<DialogTitle sx={{ fontFamily, fontWeight: 700 }}>
					{editingImage ? "Edit Gallery Image" : "Add Gallery Image"}
				</DialogTitle>
				<DialogContent dividers>
					<Box
						sx={{
							display: "flex",
							flexDirection: "column",
							gap: 2,
							pt: 1,
						}}
					>
						<ImageUploadField
							label="Gallery Image"
							value={form.imageUrl}
							onChange={(url) => setForm({ ...form, imageUrl: url })}
							folder="gallery"
						/>
						<TextField
							label="Caption (optional)"
							fullWidth
							value={form.caption}
							onChange={(e) =>
								setForm({ ...form, caption: e.target.value })
							}
							InputProps={{ sx: { fontFamily } }}
							InputLabelProps={{ sx: { fontFamily } }}
						/>
						<Box sx={{ display: "flex", gap: 2 }}>
							<Select
								size="small"
								value={form.category}
								onChange={(e) =>
									setForm({ ...form, category: e.target.value })
								}
								sx={{ minWidth: 180, fontFamily, flex: 1 }}
							>
								{categoryOptions.map((c) => (
									<MenuItem key={c.value} value={c.value}>
										{c.label}
									</MenuItem>
								))}
							</Select>
							<TextField
								label="Display Order"
								type="number"
								size="small"
								value={form.order}
								onChange={(e) =>
									setForm({
										...form,
										order: Number(e.target.value) || 0,
									})
								}
								sx={{ width: 130 }}
								InputProps={{ sx: { fontFamily } }}
								InputLabelProps={{ sx: { fontFamily } }}
							/>
						</Box>
					</Box>
				</DialogContent>
				<DialogActions>
					<Button onClick={closeDialog} sx={{ fontFamily }}>
						Cancel
					</Button>
					<Button
						onClick={handleSave}
						variant="contained"
						disabled={busy}
						sx={{
							fontFamily,
							backgroundColor: "#007a7a",
							"&:hover": { backgroundColor: "#005a5a" },
						}}
					>
						{editingImage ? "Update" : "Add"}
					</Button>
				</DialogActions>
			</Dialog>

			{/* Delete Confirmation */}
			<Dialog open={!!deleteDialog} onClose={() => setDeleteDialog(null)}>
				<DialogTitle sx={{ fontFamily, fontWeight: 700 }}>
					Delete Gallery Image?
				</DialogTitle>
				<DialogContent>
					<Typography sx={{ fontFamily }}>
						Are you sure you want to delete this image? This action cannot
						be undone.
					</Typography>
				</DialogContent>
				<DialogActions>
					<Button
						onClick={() => setDeleteDialog(null)}
						sx={{ fontFamily }}
					>
						Cancel
					</Button>
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
				anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
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
