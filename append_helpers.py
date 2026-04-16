import os

file_path = r"C:\Users\CHIZOBA-TEMP-PC\Documents\shoestore\perfectfooties-shop\src\pages\AccountPage.jsx"

with open(file_path, 'r', encoding='utf-8') as f:
    content = f.read()

append_text = r"""

// ─── Rate Dialog ──────────────────────────────────────────────────────────────
function RateDialog({ open, onClose, order, onSubmit }) {
	const [rating, setRating] = React.useState(0);
	const [comment, setComment] = React.useState('');
	const [submitting, setSubmitting] = React.useState(false);

	React.useEffect(() => {
		if (open) { setRating(0); setComment(''); }
	}, [open]);

	const handleSubmit = async () => {
		if (!rating) return;
		setSubmitting(true);
		await onSubmit({ orderId: order?.id, rating, comment, type: 'purchase' });
		setSubmitting(false);
		onClose();
	};

	return (
		<Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth
			PaperProps={{ sx: { borderRadius: 4, p: 1 } }}>
			<DialogTitle sx={{ fontFamily: '"Georgia", serif', fontWeight: 700 }}>
				Product Order Review
			</DialogTitle>
			<DialogContent>
				<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
					<Rating
						value={rating}
						onChange={(_, v) => setRating(v)}
						size="large"
						sx={{ color: '#e3242b' }}
					/>
					<TextField
						multiline
						rows={3}
						label="Your review (optional)"
						value={comment}
						onChange={(e) => setComment(e.target.value)}
						fullWidth
					/>
				</Box>
			</DialogContent>
			<DialogActions sx={{ px: 3, pb: 2 }}>
				<Button onClick={onClose} sx={{ color: '#999' }}>Cancel</Button>
				<Button
					onClick={handleSubmit}
					disabled={!rating || submitting}
					variant="contained"
					sx={{ backgroundColor: '#e3242b', borderRadius: 30, px: 3, fontFamily: '"Georgia", serif', fontWeight: 600, '&:hover': { backgroundColor: '#b81b21' } }}
				>
					{submitting ? 'Submitting...' : 'Submit'}
				</Button>
			</DialogActions>
		</Dialog>
	);
}

// ─── Order Steps ──────────────────────────────────────────────────────────────
const ORDER_STEPS = [
	{ key: 'pending',    label: 'Order Placed'  },
	{ key: 'confirmed',  label: 'Confirmed'     },
	{ key: 'production', label: 'In Production' },
	{ key: 'shipped',    label: 'Shipped'       },
	{ key: 'delivered',  label: 'Delivered'     },
];

// ─── Order Progress Tracker ───────────────────────────────────────────────────
function OrderProgressTracker({ status }) {
	const activeIdx = (() => {
		if (status === 'delivered' || status === 'received' || status === 'completed') return 4;
		if (status === 'shipped') return 3;
		if (status === 'production') return 2;
		if (status === 'confirmed') return 1;
		return 0;
	})();

	return (
		<Box sx={{ mt: 2 }}>
			<Stepper activeStep={activeIdx} alternativeLabel>
				{ORDER_STEPS.map((step, i) => (
					<Step key={step.key} completed={i <= activeIdx}>
						<StepLabel
							StepIconProps={{
								sx: {
									color: i <= activeIdx ? '#e3242b !important' : undefined,
									'&.Mui-completed': { color: '#e3242b' },
									'&.Mui-active':    { color: '#e3242b' },
								},
							}}
						>
							<Typography sx={{ fontSize: '0.7rem', color: i <= activeIdx ? '#e3242b' : '#aaa' }}>
								{step.label}
							</Typography>
						</StepLabel>
					</Step>
				))}
			</Stepper>

			{(status === 'shipped') && (
				<Typography sx={{ mt: 1, fontSize: '0.78rem', color: '#888', textAlign: 'center' }}>
					Estimated delivery: 5&ndash;10 business days after shipping
				</Typography>
			)}
		</Box>
	);
}

// ─── Order Card ───────────────────────────────────────────────────────────────
function OrderCard({ order, onCancel, onEdit, onRate }) {
	const isCancelled = order.status === 'cancelled';
	const isDelivered = ['delivered', 'received', 'completed'].includes(order.status);
	const isPending   = order.status === 'pending';

	const typeLabel = (() => {
		const t = order.type || '';
		if (t === 'nicheCollection' || t === 'product') return 'Leather Product';
		return 'Order';
	})();

	const statusColor = {
		pending:    '#f59e0b',
		confirmed:  '#3b82f6',
		production: '#8b5cf6',
		shipped:    '#06b6d4',
		delivered:  '#10b981',
		received:   '#10b981',
		completed:  '#10b981',
		cancelled:  '#ef4444',
	}[order.status] || '#999';

	return (
		<Box
			sx={{
				border: '1px solid #E8D5B0',
				borderRadius: 3,
				p: 2.5,
				mb: 2,
				backgroundColor: isCancelled ? '#fff5f5' : '#fff',
				opacity: isCancelled ? 0.85 : 1,
				transition: 'box-shadow 0.2s',
				'&:hover': { boxShadow: '0 4px 16px rgba(0,0,0,0.08)' },
			}}
		>
			{/* Header row */}
			<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5, flexWrap: 'wrap', gap: 1 }}>
				<Box>
					<Typography sx={{ fontFamily: '"Georgia", serif', fontWeight: 700, fontSize: '1rem', color: '#1a1a1a' }}>
						Order #{order.id?.slice(-6).toUpperCase()}
					</Typography>
					<Typography sx={{ fontSize: '0.78rem', color: '#888', mt: 0.3 }}>
						{order.createdAt?.toDate
							? order.createdAt.toDate().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
							: 'Date unknown'}
					</Typography>
				</Box>
				<Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
					<Chip
						label={typeLabel}
						size="small"
						sx={{ backgroundColor: '#FFF8F0', color: '#c9792e', fontWeight: 600, fontSize: '0.72rem', borderRadius: 2 }}
					/>
					<Chip
						label={order.status?.charAt(0).toUpperCase() + order.status?.slice(1) || 'Pending'}
						size="small"
						sx={{ backgroundColor: statusColor + '22', color: statusColor, fontWeight: 700, fontSize: '0.72rem', borderRadius: 2 }}
					/>
				</Box>
			</Box>

			{/* Items */}
			{Array.isArray(order.items) && order.items.length > 0 && (
				<Box sx={{ mb: 1.5 }}>
					{order.items.map((item, i) => (
						<Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', color: '#555', py: 0.3 }}>
							<Typography sx={{ fontSize: '0.85rem' }}>
								{item.name || item.productName || 'Item'}{item.quantity ? ` x${item.quantity}` : ''}
							</Typography>
							{item.price && (
								<Typography sx={{ fontSize: '0.85rem', fontWeight: 600 }}>
									\u20a6{Number(item.price).toLocaleString()}
								</Typography>
							)}
						</Box>
					))}
				</Box>
			)}

			{/* Total */}
			{order.total && (
				<Box sx={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #E8D5B0', pt: 1, mt: 1 }}>
					<Typography sx={{ fontWeight: 600, fontSize: '0.9rem' }}>Total</Typography>
					<Typography sx={{ fontWeight: 700, fontSize: '0.9rem', color: '#e3242b' }}>
						\u20a6{Number(order.total).toLocaleString()}
					</Typography>
				</Box>
			)}

			{/* Progress tracker */}
			{!isCancelled && <OrderProgressTracker status={order.status} />}

			{/* Action buttons */}
			<Box sx={{ display: 'flex', gap: 1.5, mt: 2, flexWrap: 'wrap' }}>
				{isPending && !isCancelled && (
					<>
						<Button
							size="small"
							variant="outlined"
							onClick={() => onEdit(order)}
							sx={{ borderRadius: 30, borderColor: '#e3242b', color: '#e3242b', fontSize: '0.78rem', '&:hover': { backgroundColor: '#fff0f0' } }}
						>
							Edit Order
						</Button>
						<Button
							size="small"
							variant="outlined"
							onClick={() => onCancel(order)}
							sx={{ borderRadius: 30, borderColor: '#ef4444', color: '#ef4444', fontSize: '0.78rem', '&:hover': { backgroundColor: '#fff5f5' } }}
						>
							Cancel Order
						</Button>
					</>
				)}
				{isDelivered && !order.rated && (
					<Button
						size="small"
						variant="contained"
						onClick={() => onRate(order)}
						sx={{ borderRadius: 30, backgroundColor: '#e3242b', fontSize: '0.78rem', '&:hover': { backgroundColor: '#b81b21' } }}
					>
						Rate Order
					</Button>
				)}
			</Box>
		</Box>
	);
}
"""

with open(file_path, 'a', encoding='utf-8') as f:
    f.write(append_text)

print("Done. Lines now:", len(open(file_path, encoding='utf-8').readlines()))
