import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  Button,
  Box,
} from '@mui/material';

export default function TermsModal({ open, onClose }) {
  return (
		<Dialog
			open={open}
			onClose={onClose}
			maxWidth="md"
			fullWidth
			PaperProps={{
				sx: { borderRadius: 4, maxHeight: "80vh" },
			}}
		>
			<DialogTitle sx={{ pb: 1 }}>
				<Typography
					variant="h4"
					sx={{
						fontFamily: '"Georgia", serif',
						fontWeight: 700,
						color: "var(--text-main)",
					}}
				>
					Terms & Conditions
				</Typography>
				<Typography sx={{ color: "#999", fontSize: "0.85rem", mt: 0.5 }}>
					Last updated: April 16, 2026
				</Typography>
			</DialogTitle>

			<DialogContent dividers sx={{ px: 4 }}>
				<Box sx={{ "& h6": { mt: 3, mb: 1 } }}>
					<Typography
						variant="h6"
						sx={{
							fontFamily: '"Georgia", serif',
							fontWeight: 700,
							color: "var(--text-purple)",
						}}
					>
						1. Orders & Production
					</Typography>
					<Typography sx={{ color: "var(--text-muted)", lineHeight: 1.8 }}>
						All orders must be placed through our website or WhatsApp. A
						confirmation message will be sent once your order is received and
						payment is confirmed. Production begins immediately after
						confirmation — standard orders take 10–14 days. Custom
						orders may take longer and a separate timeline will be communicated
						at the time of order.
					</Typography>

					<Typography
						variant="h6"
						sx={{
							fontFamily: '"Georgia", serif',
							fontWeight: 700,
							color: "var(--text-purple)",
						}}
					>
						2. Cancellation & Changes
					</Typography>
					<Typography sx={{ color: "var(--text-muted)", lineHeight: 1.8 }}>
						Order cancellations or changes must be requested before production
						begins. Once we have started working on your piece, we are unable
						to cancel or make significant changes. Please review your order
						carefully before confirming. To request a change, contact us
						immediately via WhatsApp or email.
					</Typography>

					<Typography
						variant="h6"
						sx={{
							fontFamily: '"Georgia", serif',
							fontWeight: 700,
							color: "var(--text-purple)",
						}}
					>
						3. Pricing & Payment
					</Typography>
					<Typography sx={{ color: "var(--text-muted)", lineHeight: 1.8 }}>
						All prices are listed in Nigerian Naira (₦) and are subject to
						change without prior notice. Full payment is required before
						production begins for standard orders. Custom orders require a
						50% deposit to confirm, with the balance due before delivery.
						Payment can be made via bank transfer or approved online payment
						methods.
					</Typography>

					<Typography
						variant="h6"
						sx={{
							fontFamily: '"Georgia", serif',
							fontWeight: 700,
							color: "var(--text-purple)",
						}}
					>
						4. Custom Orders
					</Typography>
					<Typography sx={{ color: "var(--text-muted)", lineHeight: 1.8 }}>
						Custom leather goods require accurate measurements and
						specifications provided by the client. PerfectFooties is not
						responsible for fit or sizing issues caused by incorrect
						measurements supplied by the customer. All custom orders are
						final sale and non-refundable once production has commenced.
						No two handmade pieces are identical — minor natural variations in
						leather grain and finish are characteristics of handcrafted work,
						not defects.
					</Typography>

					<Typography
						variant="h6"
						sx={{
							fontFamily: '"Georgia", serif',
							fontWeight: 700,
							color: "var(--text-purple)",
						}}
					>
						5. Returns & Quality Issues
					</Typography>
					<Typography sx={{ color: "var(--text-muted)", lineHeight: 1.8 }}>
						We do not accept returns on completed orders. However, if your
						item arrives with a genuine manufacturing defect, contact us within
						48 hours of receipt with photos and we will arrange a repair,
						replacement, or resolution at our discretion. Normal wear and
						cosmetic variation in natural leather is not considered a defect.
					</Typography>

					<Typography
						variant="h6"
						sx={{
							fontFamily: '"Georgia", serif',
							fontWeight: 700,
							color: "var(--text-purple)",
						}}
					>
						6. Intellectual Property
					</Typography>
					<Typography sx={{ color: "var(--text-muted)", lineHeight: 1.8 }}>
						All content on the PerfectFooties website — including images,
						text, and designs — is the property of PerfectFooties and may
						not be reproduced without written permission. Photos of your
						items may be shared on our social media pages unless you
						request otherwise at the time of ordering.
					</Typography>
				</Box>
			</DialogContent>

			<DialogActions sx={{ p: 3, justifyContent: "center" }}>
				<Button
					onClick={onClose}
					sx={{
						backgroundColor: "#e3242b",
						color: "#fff",
						borderRadius: "30px",
						px: 4,
						py: 1,
						fontFamily: '"Georgia", serif',
						fontWeight: 600,
						"&:hover": { backgroundColor: "#b81b21" },
					}}
				>
					I Understand
				</Button>
			</DialogActions>
		</Dialog>
  );
}
