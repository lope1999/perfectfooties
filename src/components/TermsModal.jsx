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
						color: "#000",
					}}
				>
					Terms & Conditions
				</Typography>
				<Typography sx={{ color: "#999", fontSize: "0.85rem", mt: 0.5 }}>
					Last updated: February 23, 2026
				</Typography>
			</DialogTitle>

			<DialogContent dividers sx={{ px: 4 }}>
				<Box sx={{ "& h6": { mt: 3, mb: 1 } }}>
					<Typography
						variant="h6"
						sx={{
							fontFamily: '"Georgia", serif',
							fontWeight: 700,
							color: "#4A0E4E",
						}}
					>
						1. Appointment Policy
					</Typography>
					<Typography sx={{ color: "#444", lineHeight: 1.8 }}>
						All appointments must be booked in advance through our website
						or WhatsApp. A confirmation message will be sent via WhatsApp
						once your appointment is confirmed. Please arrive on time —
						late arrivals may result in a shortened service or
						rescheduling.
					</Typography>

					<Typography
						variant="h6"
						sx={{
							fontFamily: '"Georgia", serif',
							fontWeight: 700,
							color: "#4A0E4E",
						}}
					>
						2. Cancellation & Rescheduling
					</Typography>
					<Typography sx={{ color: "#444", lineHeight: 1.8 }}>
						Cancellations must be made at least 12 hours before your
						scheduled appointment. Late cancellations or no-shows may
						incur a fee of up to 50% of the service cost. Rescheduling is
						free if done more than 12 hours in advance.
					</Typography>

					<Typography
						variant="h6"
						sx={{
							fontFamily: '"Georgia", serif',
							fontWeight: 700,
							color: "#4A0E4E",
						}}
					>
						3. Pricing & Payment
					</Typography>
					<Typography sx={{ color: "#444", lineHeight: 1.8 }}>
						All prices listed on the service menu are in Nigerian Naira
						(₦). Prices are subject to change without prior notice.
						Payment is due at the time of service and can be made via bank
						transfer, cash, or approved mobile payment methods. Custom
						nail art or additional embellishments may incur extra charges.
					</Typography>

					<Typography
						variant="h6"
						sx={{
							fontFamily: '"Georgia", serif',
							fontWeight: 700,
							color: "#4A0E4E",
						}}
					>
						4. Custom Press-On Orders
					</Typography>
					<Typography sx={{ color: "#444", lineHeight: 1.8 }}>
						Custom press-on nail orders require accurate nail bed
						measurements provided by the client. Chizzystyles is not
						responsible for sizing issues caused by incorrect
						measurements. All custom orders are final sale and
						non-refundable. Production time is 4–7 business days.
					</Typography>

					<Typography
						variant="h6"
						sx={{
							fontFamily: '"Georgia", serif',
							fontWeight: 700,
							color: "#4A0E4E",
						}}
					>
						5. Health & Safety
					</Typography>
					<Typography sx={{ color: "#444", lineHeight: 1.8 }}>
						All tools and equipment are sanitised between clients. If you
						have any nail conditions, allergies, or sensitivities, please
						inform your technician before the service begins. Chizzystyles
						reserves the right to refuse service if a nail condition is
						detected that may pose a health risk.
					</Typography>

					<Typography
						variant="h6"
						sx={{
							fontFamily: '"Georgia", serif',
							fontWeight: 700,
							color: "#4A0E4E",
						}}
					>
						6. Liability
					</Typography>
					<Typography sx={{ color: "#444", lineHeight: 1.8 }}>
						Chizzystyles is not liable for any damage to natural nails
						resulting from improper removal of extensions at home. We
						strongly recommend professional removal. Any concerns about
						your service should be raised within 24 hours for us to
						arrange a complimentary fix.
					</Typography>

					<Typography
						variant="h6"
						sx={{
							fontFamily: '"Georgia", serif',
							fontWeight: 700,
							color: "#4A0E4E",
						}}
					>
						7. Intellectual Property
					</Typography>
					<Typography sx={{ color: "#444", lineHeight: 1.8 }}>
						All content on the Chizzystyles website — including images,
						text, and designs — is the property of Chizzystyles and may
						not be reproduced without written permission. Photos of your
						nails may be shared on our social media pages unless you
						request otherwise.
					</Typography>
				</Box>
			</DialogContent>

			<DialogActions sx={{ p: 3, justifyContent: "center" }}>
				<Button
					onClick={onClose}
					sx={{
						backgroundColor: "#E91E8C",
						color: "#fff",
						borderRadius: "30px",
						px: 4,
						py: 1,
						fontFamily: '"Georgia", serif',
						fontWeight: 600,
						"&:hover": { backgroundColor: "#C2185B" },
					}}
				>
					I Understand
				</Button>
			</DialogActions>
		</Dialog>
  );
}
