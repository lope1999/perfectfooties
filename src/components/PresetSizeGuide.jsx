import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';

const presetSizes = [
  { label: 'XS', thumb: 3, index: 6, middle: 5, ring: 7, pinky: 9 },
  { label: 'S', thumb: 2, index: 5, middle: 4, ring: 6, pinky: 8 },
  { label: 'M', thumb: 1, index: 4, middle: 3, ring: 5, pinky: 7 },
  { label: 'L', thumb: 0, index: 3, middle: 2, ring: 4, pinky: 6 },
];

const fingerWidths = {
  'Thumb': '~17mm',
  'Index': '~14mm',
  'Middle': '~15mm',
  'Ring': '~13mm',
  'Pinky': '~11mm',
};

const tipApprox = {
  0: '~18mm',
  1: '~17mm',
  2: '~16mm',
  3: '~15mm',
  4: '~14mm',
  5: '~13mm',
  6: '~12mm',
  7: '~11mm',
  8: '~10mm',
  9: '~9mm',
};

const headerSx = {
  fontFamily: '"Georgia", serif',
  fontWeight: 700,
  fontSize: '0.8rem',
  color: '#fff',
  borderBottom: 'none',
  py: 1.5,
  textAlign: 'center',
};

const cellSx = {
  textAlign: 'center',
  py: 1.3,
  fontSize: '0.9rem',
  borderBottom: '1px solid #F0C0D0',
};

export default function PresetSizeGuide({ open, onClose }) {
  return (
		<Dialog
			open={open}
			onClose={onClose}
			maxWidth="sm"
			fullWidth
			scroll="paper"
			PaperProps={{
				sx: {
					borderRadius: 4,
					overflow: "hidden",
				},
			}}
		>
			<DialogTitle
				sx={{
					background: "linear-gradient(135deg, #E91E8C 0%, #4A0E4E 100%)",
					color: "#fff",
					textAlign: "center",
					pb: 1,
				}}
			>
				<Typography
					variant="h6"
					sx={{
						fontFamily: '"Georgia", serif',
						fontWeight: 700,
						fontSize: "1.2rem",
					}}
				>
					Preset Nail Bed Size Guide
				</Typography>
				<Typography
					sx={{
						color: "rgba(255,255,255,0.8)",
						fontSize: "0.85rem",
						mt: 0.5,
					}}
				>
					Find your perfect fit — match your nail bed width to a preset
					size
				</Typography>
			</DialogTitle>

			<DialogContent sx={{ p: { xs: 2, sm: 3 }, pt: { xs: 3, sm: 3 } }}>
				<Typography
					sx={{
						color: "#555",
						fontSize: "0.88rem",
						lineHeight: 1.7,
						mb: 2,
					}}
				>
					Each number in the table represents a{" "}
					<strong>nail tip size (0–9)</strong>. Size 0 is the widest and
					size 9 is the narrowest. If your measurement falls between two
					sizes, we recommend choosing the larger size for a more
					comfortable fit.
				</Typography>

				<TableContainer
					sx={{
						borderRadius: 2,
						border: "1px solid #F0C0D0",
						overflow: "hidden",
					}}
				>
					<Table size="small">
						<TableHead>
							<TableRow sx={{ backgroundColor: "#4A0E4E" }}>
								<TableCell
									sx={{ ...headerSx, textAlign: "left", pl: 2 }}
								>
									Size
								</TableCell>
								{["Thumb", "Index", "Middle", "Ring", "Pinky"].map(
									(finger) => (
										<TableCell key={finger} sx={headerSx}>
											<Box>{finger}</Box>
											<Box
												sx={{
													fontSize: "0.65rem",
													fontWeight: 400,
													opacity: 0.8,
												}}
											>
												{fingerWidths[finger]}
											</Box>
										</TableCell>
									),
								)}
							</TableRow>
						</TableHead>
						<TableBody>
							{presetSizes.map((row, i) => (
								<TableRow
									key={row.label}
									sx={{
										backgroundColor: i % 2 === 0 ? "#FFF0F5" : "#fff",
										"&:hover": { backgroundColor: "#FCE4EC" },
									}}
								>
									<TableCell
										sx={{
											...cellSx,
											textAlign: "left",
											pl: 2,
											fontFamily: '"Georgia", serif',
											fontWeight: 700,
											color: "#E91E8C",
											fontSize: "1rem",
										}}
									>
										{row.label}
									</TableCell>
									{[
										row.thumb,
										row.index,
										row.middle,
										row.ring,
										row.pinky,
									].map((val, fi) => (
										<TableCell key={fi} sx={cellSx}>
											<Typography
												sx={{
													fontWeight: 600,
													color: "#000",
													fontSize: "0.95rem",
												}}
											>
												{val}
											</Typography>
											<Typography
												sx={{ fontSize: "0.65rem", color: "#999" }}
											>
												{tipApprox[val]}
											</Typography>
										</TableCell>
									))}
								</TableRow>
							))}
						</TableBody>
					</Table>
				</TableContainer>

				<Box
					sx={{
						mt: 2.5,
						p: 2,
						backgroundColor: "#FFF0F5",
						borderRadius: 2,
						border: "1px solid #F0C0D0",
					}}
				>
					<Typography
						sx={{ fontSize: "0.82rem", color: "#555", lineHeight: 1.7 }}
					>
						<strong>How to measure:</strong> To find your nail bed size,
						measure the widest part of each nail bed in millimetres using
						a tape measure or ruler. A simple method is to place a small
						piece of tape across your nail bed, mark the widest points
						with a pen, remove the tape, lay it flat, and measure the
						width in millimetres with a ruler or taperule... then compare
						with the table above to find your closest preset size.
					</Typography>
				</Box>
			</DialogContent>

			<DialogActions sx={{ justifyContent: "center", pb: 3 }}>
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
						fontSize: "0.9rem",
						"&:hover": { backgroundColor: "#C2185B" },
					}}
				>
					Got it
				</Button>
			</DialogActions>
		</Dialog>
  );
}
