import { useState } from 'react';
import {
  Box,
  Typography,
  Container,
  Grid,
  Card,
  CardContent,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
  CircularProgress,
  Alert,
} from '@mui/material';
import CardGiftcardIcon from '@mui/icons-material/CardGiftcard';
import EmailIcon from '@mui/icons-material/Email';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import SearchIcon from '@mui/icons-material/Search';
import ScrollReveal from '../components/ScrollReveal';
import { useAuth } from '../context/AuthContext';
import { createGiftCard, lookupGiftCard, validateCardForRedemption } from '../lib/giftCardService';

const giftCardTypes = [
	{
		id: "electronic",
		title: "E-Gift Card",
		subtitle: "Instant digital delivery",
		description:
			"A digital gift card sent directly via WhatsApp or email. Perfect for last-minute gifts — delivered instantly with a personalized message.",
		icon: <EmailIcon sx={{ fontSize: 40, color: "#e3242b" }} />,
		image: "/images/gift-cards/gift-voucher.jpg",
		features: [
			"Instant delivery",
			"Sent via WhatsApp or email",
			"Custom message included",
			"No shipping needed",
		],
	},
	{
		id: "physical",
		title: "Physical Gift Card",
		subtitle: "Beautifully packaged & delivered",
		description:
			"A beautifully designed physical card packaged in a PerfectFooties branded envelope. Ideal for special occasions.",
		icon: <LocalShippingIcon sx={{ fontSize: 40, color: "#e3242b" }} />,
		image: "/images/gift-cards/gift-voucher.jpg",
		features: [
			"Premium card design",
			"Branded packaging",
			"Worldwide delivery",
			"Perfect for gifting in person",
		],
	},
];

const buttonSx = {
  border: '2px solid #e3242b',
  borderRadius: '30px',
  color: 'var(--text-main)',
  backgroundColor: 'transparent',
  px: 4,
  py: 1.2,
  fontSize: '0.95rem',
  fontFamily: '"Georgia", serif',
  fontWeight: 600,
  transition: 'all 0.3s ease',
  '&:hover': {
    backgroundColor: '#e3242b',
    color: '#fff',
    borderColor: '#e3242b',
  },
};

const textFieldSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: 2,
    '& fieldset': { borderColor: '#E8D5B0' },
    '&:hover fieldset': { borderColor: '#e3242b' },
    '&.Mui-focused fieldset': { borderColor: '#e3242b' },
  },
};

function formatNaira(amount) {
  return `₦${Number(amount).toLocaleString()}`;
}

export default function GiftCardPage() {
  const { user } = useAuth();
  const [selectedType, setSelectedType] = useState(null);
  const [formData, setFormData] = useState({
		senderName: "",
		giftedTo: "",
		amount: "",
		message: "",
  });
  const [modalOpen, setModalOpen] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [generatedCode, setGeneratedCode] = useState('');

  // Balance checker state
  const [balanceCode, setBalanceCode] = useState('');
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [balanceResult, setBalanceResult] = useState(null); // { card } or { error }

  const handleBuyClick = (type) => {
    setSelectedType(type);
    setFormData({ senderName: user?.displayName || "", giftedTo: "", amount: "", message: "" });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const senderName = formData.senderName.trim();
      const { code } = await createGiftCard({
        type: selectedType.id,
        giftedTo: formData.giftedTo.trim(),
        amount: Number(formData.amount),
        purchasedBy: user
          ? { uid: user.uid, name: senderName || user.displayName || '', email: user.email || '' }
          : { uid: null, name: senderName || 'Guest', email: '' },
      });
      setGeneratedCode(code);
      setModalOpen(false);
      setSuccessOpen(true);
    } catch (err) {
      console.error('Gift card creation error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCompleteOrder = () => {
    setSuccessOpen(false);
    const typeLabel = selectedType?.id === 'electronic' ? 'E-Gift Card (Digital)' : 'Physical Gift Card';
    const personalMsg = formData.message.trim();
		const senderLabel = formData.senderName.trim() || 'Guest';
		const message = `Hi! I'd like to purchase a PerfectFooties Gift Card.\n\nFrom: ${senderLabel}\nType: ${typeLabel}\nGifted To: ${formData.giftedTo}\nAmount: ${formatNaira(formData.amount)}\nGift Card Code: ${generatedCode}\nValidity: 1 year from purchase date${personalMsg ? `\nPersonal Message: "${personalMsg}"` : ""}\n\nPlease confirm and process this gift card order. Thank you!`;
    const encoded = encodeURIComponent(message);
    window.open(
			`https://api.whatsapp.com/send?phone=2348073637911&text=${encoded}`,
			"_blank",
		);
  };

  const handleBalanceCheck = async () => {
    if (!balanceCode.trim()) return;
    setBalanceLoading(true);
    setBalanceResult(null);
    try {
      const card = await lookupGiftCard(balanceCode.trim());
      if (!card) {
        setBalanceResult({ error: 'Gift card not found. Please check the code and try again.' });
      } else if (card.status === 'pending') {
        setBalanceResult({ error: 'This gift card has not been activated yet. Please contact us for assistance.' });
      } else if (card.status === 'expired') {
        setBalanceResult({ error: 'This gift card has expired.' });
      } else {
        setBalanceResult({ card });
      }
    } catch (err) {
      console.error('Balance check error:', err);
      setBalanceResult({ error: 'Something went wrong. Please try again.' });
    } finally {
      setBalanceLoading(false);
    }
  };

  const isFormValid = formData.senderName.trim() && formData.giftedTo.trim() && formData.amount && Number(formData.amount) > 0;

  return (
		<Box sx={{ pt: 12, pb: { xs: 14, md: 8 }, minHeight: "100vh" }}>
			{/* Header */}
			<Box sx={{ textAlign: "center", py: 6, backgroundColor: "#fff" }}>
				<ScrollReveal direction="up">
					<CardGiftcardIcon
						sx={{ fontSize: 50, color: "#e3242b", mb: 1 }}
					/>
					<Typography
						variant="h3"
						sx={{
							fontFamily: '"Georgia", serif',
							fontWeight: 700,
							color: "var(--text-main)",
							mb: 2,
							fontSize: { xs: "1.8rem", sm: "2.4rem", md: "3rem" },
						}}
					>
						Gift Cards
					</Typography>
				</ScrollReveal>
				<ScrollReveal direction="up" delay={0.15}>
					<Typography
						sx={{
							maxWidth: 600,
							mx: "auto",
							color: "var(--text-muted)",
							fontSize: "1.1rem",
							lineHeight: 1.7,
							px: 2,
						}}
					>
						Give the gift of handcrafted quality. Our gift cards let your loved ones choose any leather goods from our collection — the perfect present for any occasion.
					</Typography>
				</ScrollReveal>
			</Box>

			{/* Check Gift Card Balance */}
			<Box sx={{ py: 6, backgroundColor: "#fff" }}>
				<Container maxWidth="sm">
					<ScrollReveal direction="up">
						<Typography
							variant="h5"
							sx={{
								fontFamily: '"Georgia", serif',
								fontWeight: 700,
								color: "var(--text-main)",
								textAlign: "center",
								mb: 1,
							}}
						>
							Check Gift Card Balance
						</Typography>
						<Typography
							sx={{
								textAlign: "center",
								color: "#777",
								mb: 4,
								fontSize: "0.95rem",
							}}
						>
							Enter your gift card code to check remaining balance and
							expiry.
						</Typography>
					</ScrollReveal>
					<ScrollReveal direction="up" delay={0.1}>
						<Box sx={{ display: "flex", gap: 1.5, mb: 2 }}>
							<TextField
								fullWidth
								placeholder="Enter gift card code"
								value={balanceCode}
								onChange={(e) => {
									setBalanceCode(e.target.value.toUpperCase());
									setBalanceResult(null);
								}}
								size="small"
								inputProps={{
									style: { letterSpacing: "2px", fontWeight: 600 },
								}}
								sx={textFieldSx}
							/>
							<Button
								onClick={handleBalanceCheck}
								disabled={!balanceCode.trim() || balanceLoading}
								sx={{
									...buttonSx,
									minWidth: 130,
									px: 3,
								}}
								startIcon={
									balanceLoading ? (
										<CircularProgress size={18} />
									) : (
										<SearchIcon />
									)
								}
							>
								{balanceLoading ? "" : "Check"}
							</Button>
						</Box>
						{balanceResult?.error && (
							<Alert
								severity="error"
								sx={{ borderRadius: 2, fontFamily: '"Georgia", serif' }}
							>
								{balanceResult.error}
							</Alert>
						)}
						{balanceResult?.card && (
							<Box
								sx={{
									p: 3,
									borderRadius: 3,
									border: "1px solid #E8D5B0",
									backgroundColor: "#FFF8F0",
									textAlign: "center",
								}}
							>
								<Typography
									sx={{
										fontFamily: '"Georgia", serif',
										fontWeight: 700,
										fontSize: "1rem",
										color: "var(--text-main)",
										mb: 1,
									}}
								>
									Gift Card: {balanceResult.card.code}
								</Typography>
								<Typography
									sx={{
										fontFamily: '"Georgia", serif',
										fontWeight: 700,
										fontSize: "2rem",
										color: "#e3242b",
										mb: 1,
									}}
								>
									{formatNaira(balanceResult.card.balance)}
								</Typography>
								<Typography
									sx={{ color: "#777", fontSize: "0.85rem", mb: 0.5 }}
								>
									Original amount:{" "}
									{formatNaira(balanceResult.card.amount)}
								</Typography>
								<Typography
									sx={{ color: "#777", fontSize: "0.85rem", mb: 0.5 }}
								>
									Status:{" "}
									<span
										style={{
											fontWeight: 600,
											color:
												balanceResult.card.status === "active"
													? "#2e7d32"
													: "#e3242b",
										}}
									>
										{balanceResult.card.status.replace("_", " ")}
									</span>
								</Typography>
								{balanceResult.card.expiresAt && (
									<Typography
										sx={{ color: "#777", fontSize: "0.85rem" }}
									>
										Expires:{" "}
										{(balanceResult.card.expiresAt.toDate
											? balanceResult.card.expiresAt.toDate()
											: new Date(balanceResult.card.expiresAt)
										).toLocaleDateString("en-GB", {
											day: "numeric",
											month: "long",
											year: "numeric",
										})}
									</Typography>
								)}
							</Box>
						)}
					</ScrollReveal>
				</Container>
			</Box>

			{/* How It Works */}
			<Box sx={{ py: 6, backgroundColor: "#FFF8F0" }}>
				<Container maxWidth="md">
					<ScrollReveal direction="up">
						<Typography
							variant="h5"
							sx={{
								fontFamily: '"Georgia", serif',
								fontWeight: 700,
								color: "var(--text-main)",
								textAlign: "center",
								mb: 4,
							}}
						>
							How Gift Cards Work
						</Typography>
					</ScrollReveal>
					<Grid container spacing={3}>
						{[
							{
								step: "01",
								title: "Choose a Type",
								text: "Pick between an instant e-gift card or a beautifully packaged physical card.",
							},
							{
								step: "02",
								title: "Set the Amount",
								text: "Choose any amount you like. The recipient can use it towards any service or product.",
							},
							{
								step: "03",
								title: "We Deliver It",
								text: "Digital cards are sent instantly. Physical cards are delivered worldwide.",
							},
							{
								step: "04",
								title: "They Enjoy",
								text: "The recipient shops PerfectFooties leather goods, bags, and accessories using their gift card balance.",
							},
						].map((item, i) => (
							<Grid item xs={6} md={3} key={i}>
								<ScrollReveal direction="up" delay={i * 0.1}>
									<Box sx={{ textAlign: "center" }}>
										<Typography
											sx={{
												fontFamily: '"Georgia", serif',
												fontWeight: 700,
												fontSize: "2rem",
												color: "#e3242b",
												mb: 1,
											}}
										>
											{item.step}
										</Typography>
										<Typography
											sx={{
												fontFamily: '"Georgia", serif',
												fontWeight: 700,
												fontSize: "0.95rem",
												color: "var(--text-main)",
												mb: 0.5,
											}}
										>
											{item.title}
										</Typography>
										<Typography
											sx={{
												color: "#777",
												fontSize: "0.85rem",
												lineHeight: 1.5,
											}}
										>
											{item.text}
										</Typography>
									</Box>
								</ScrollReveal>
							</Grid>
						))}
					</Grid>
				</Container>
			</Box>

			{/* Gift Card Types */}
			<Box sx={{ py: 8, backgroundColor: "#fff" }}>
				<Container maxWidth="lg">
					<ScrollReveal direction="up">
						<Typography
							variant="h5"
							sx={{
								fontFamily: '"Georgia", serif',
								fontWeight: 700,
								color: "var(--text-main)",
								textAlign: "center",
								mb: 1,
							}}
						>
							Choose Your Gift Card
						</Typography>
						<Typography
							sx={{
								textAlign: "center",
								color: "#777",
								mb: 6,
								maxWidth: 500,
								mx: "auto",
							}}
						>
							Both options are valid for 1 year and can be used for any
							service or product.
						</Typography>
					</ScrollReveal>

					<Grid container spacing={4}>
						{giftCardTypes.map((type, index) => (
							<Grid item xs={12} md={6} key={type.id}>
								<ScrollReveal direction="up" delay={index * 0.15}>
									<Card
										elevation={0}
										onClick={() => handleBuyClick(type)}
										sx={{
											borderRadius: 4,
											border: "1px solid #E8D5B0",
											overflow: "hidden",
											height: "100%",
											display: "flex",
											flexDirection: "column",
											cursor: "pointer",
											transition:
												"transform 0.3s ease, box-shadow 0.3s ease",
											"& .hover-prompt": {
												opacity: 0,
												transition: "opacity 0.2s ease",
											},
											"&:hover": {
												transform: "translateY(-6px)",
												boxShadow:
													"0 16px 40px rgba(233,30,140,0.15)",
												"& .hover-prompt": { opacity: 1 },
											},
										}}
									>
										{/* Gift Card Image */}
										<Box sx={{ position: "relative" }}>
											<Box
												component="img"
												src={type.image}
												alt={type.title}
												sx={{
													width: "100%",
													height: 240,
													objectFit: "cover",
												}}
											/>
											<Box
												className="hover-prompt"
												sx={{
													position: "absolute",
													top: 0,
													left: 0,
													right: 0,
													bottom: 0,
													backgroundColor:
														"rgba(74, 14, 78, 0.35)",
													display: "flex",
													alignItems: "center",
													justifyContent: "center",
													pointerEvents: "none",
												}}
											>
												<Typography
													sx={{
														color: "#fff",
														fontFamily: '"Georgia", serif',
														fontWeight: 700,
														fontSize: "0.85rem",
														letterSpacing: 0.5,
														textTransform: "uppercase",
													}}
												>
													Click to View
												</Typography>
											</Box>
										</Box>

										<CardContent
											sx={{
												p: 4,
												flex: 1,
												display: "flex",
												flexDirection: "column",
											}}
										>
											<Box
												sx={{
													display: "flex",
													alignItems: "center",
													gap: 1.5,
													mb: 2,
												}}
											>
												{type.icon}
												<Box>
													<Typography
														variant="h5"
														sx={{
															fontFamily: '"Georgia", serif',
															fontWeight: 700,
															color: "var(--text-main)",
															fontSize: "1.3rem",
														}}
													>
														{type.title}
													</Typography>
													<Typography
														sx={{
															color: "#e3242b",
															fontSize: "0.85rem",
															fontWeight: 600,
														}}
													>
														{type.subtitle}
													</Typography>
												</Box>
											</Box>

											<Typography
												sx={{
													color: "var(--text-muted)",
													lineHeight: 1.7,
													mb: 3,
													flex: 1,
												}}
											>
												{type.description}
											</Typography>

											<Divider
												sx={{ borderColor: "#E8D5B0", mb: 2 }}
											/>

											{/* Features */}
											<Box sx={{ mb: 3 }}>
												{type.features.map((feature, fi) => (
													<Box
														key={fi}
														sx={{
															display: "flex",
															alignItems: "center",
															gap: 1,
															mb: 0.8,
														}}
													>
														<Box
															sx={{
																width: 6,
																height: 6,
																borderRadius: "50%",
																backgroundColor: "#e3242b",
																flexShrink: 0,
															}}
														/>
														<Typography
															sx={{
																color: "var(--text-muted)",
																fontSize: "0.88rem",
															}}
														>
															{feature}
														</Typography>
													</Box>
												))}
											</Box>

											<Button
												sx={buttonSx}
												fullWidth
												onClick={() => handleBuyClick(type)}
											>
												Buy {type.title}
											</Button>
										</CardContent>
									</Card>
								</ScrollReveal>
							</Grid>
						))}
					</Grid>
				</Container>
			</Box>

			{/* What Can They Use It For */}
			<Box sx={{ py: 6, backgroundColor: "#FFE8E8" }}>
				<Container maxWidth="md">
					<ScrollReveal direction="up">
						<Typography
							variant="h5"
							sx={{
								fontFamily: '"Georgia", serif',
								fontWeight: 700,
								color: "var(--text-main)",
								textAlign: "center",
								mb: 3,
							}}
						>
							What Can They Use It For?
						</Typography>
					</ScrollReveal>
					<Grid container spacing={2}>
						{[
							"Handmade footwear (female & male)",
							"Heirloom collection pieces",
							"Handmade bags & belts",
							"The Majesty Tote Bag (TMT)",
							"Any item across all collections",
							"Any future product we launch",
						].map((item, i) => (
							<Grid item xs={12} sm={6} key={i}>
								<ScrollReveal direction="up" delay={i * 0.08}>
									<Box
										sx={{
											display: "flex",
											alignItems: "center",
											gap: 1.5,
											p: 2,
											backgroundColor: "#fff",
											borderRadius: 2,
											border: "1px solid #E8D5B0",
										}}
									>
										<CardGiftcardIcon
											sx={{ color: "#e3242b", fontSize: 22 }}
										/>
										<Typography
											sx={{
												color: "var(--text-main)",
												fontWeight: 500,
												fontSize: "0.95rem",
											}}
										>
											{item}
										</Typography>
									</Box>
								</ScrollReveal>
							</Grid>
						))}
					</Grid>
				</Container>
			</Box>

			{/* Purchase Modal */}
			<Dialog
				open={modalOpen}
				onClose={() => !submitting && setModalOpen(false)}
				maxWidth="sm"
				fullWidth
				PaperProps={{
					sx: {
						borderRadius: 4,
					},
				}}
			>
				{selectedType && (
					<>
						{/* Modal Header */}
						<Box
							sx={{
								background:
									"linear-gradient(135deg, #e3242b 0%, #007a7a 100%)",
								p: 3,
								textAlign: "center",
							}}
						>
							<CardGiftcardIcon
								sx={{ fontSize: 44, color: "#fff", mb: 1 }}
							/>
							<Typography
								variant="h5"
								sx={{
									fontFamily: '"Georgia", serif',
									fontWeight: 700,
									color: "#fff",
									fontSize: "1.3rem",
								}}
							>
								Purchase {selectedType.title}
							</Typography>
							<Typography
								sx={{
									color: "rgba(255,255,255,0.8)",
									fontSize: "0.9rem",
									mt: 0.5,
								}}
							>
								Fill in the details below to place your gift card order
							</Typography>
						</Box>

						{/* Gift Card Image */}
						<Box
							component="img"
							src={selectedType.image}
							alt={selectedType.title}
							sx={{ width: "100%", maxHeight: 280, objectFit: "cover" }}
						/>

						{/* Form */}
						<Box sx={{ p: { xs: 3, sm: 4 } }}>
							<Box sx={{ mb: 3 }}>
								<Typography
									sx={{
										fontFamily: '"Georgia", serif',
										fontWeight: 600,
										fontSize: "0.9rem",
										color: "var(--text-main)",
										mb: 1,
									}}
								>
									Your Name
								</Typography>
								<TextField
									fullWidth
									placeholder="Who is this gift card from?"
									value={formData.senderName}
									onChange={(e) =>
										setFormData((prev) => ({
											...prev,
											senderName: e.target.value,
										}))
									}
									size="small"
									sx={textFieldSx}
								/>
							</Box>

							<Box sx={{ mb: 3 }}>
								<Typography
									sx={{
										fontFamily: '"Georgia", serif',
										fontWeight: 600,
										fontSize: "0.9rem",
										color: "var(--text-main)",
										mb: 1,
									}}
								>
									Gifted To
								</Typography>
								<TextField
									fullWidth
									placeholder="Recipient's name"
									value={formData.giftedTo}
									onChange={(e) =>
										setFormData((prev) => ({
											...prev,
											giftedTo: e.target.value,
										}))
									}
									size="small"
									sx={textFieldSx}
								/>
							</Box>

							<Box sx={{ mb: 3 }}>
								<Typography
									sx={{
										fontFamily: '"Georgia", serif',
										fontWeight: 600,
										fontSize: "0.9rem",
										color: "var(--text-main)",
										mb: 1,
									}}
								>
									Amount (₦)
								</Typography>
								<TextField
									fullWidth
									placeholder="e.g. 15000"
									value={formData.amount}
									onChange={(e) => {
										const val = e.target.value.replace(/[^0-9]/g, "");
										setFormData((prev) => ({ ...prev, amount: val }));
									}}
									size="small"
									inputProps={{ inputMode: "numeric" }}
									sx={textFieldSx}
								/>
							</Box>

							<Box sx={{ mb: 3 }}>
								<Typography
									sx={{
										fontFamily: '"Georgia", serif',
										fontWeight: 600,
										fontSize: "0.9rem",
										color: "var(--text-main)",
										mb: 1,
									}}
								>
									Time Limit
								</Typography>
								<TextField
									fullWidth
									value="1 year from purchase date"
									disabled
									size="small"
									sx={{
										...textFieldSx,
										"& .MuiOutlinedInput-root.Mui-disabled": {
											backgroundColor: "#F9F0F3",
											"& fieldset": { borderColor: "#E8D5B0" },
										},
									}}
								/>
							</Box>

							{selectedType?.id === "electronic" && (
								<Box sx={{ mb: 3 }}>
									<Typography
										sx={{
											fontFamily: '"Georgia", serif',
											fontWeight: 600,
											fontSize: "0.9rem",
											color: "var(--text-main)",
											mb: 1,
										}}
									>
										Personal Message (optional)
									</Typography>
									<TextField
										fullWidth
										multiline
										minRows={2}
										maxRows={4}
										placeholder="e.g. Happy Birthday! Treat yourself to something beautiful from PerfectFooties"
										value={formData.message}
										onChange={(e) =>
											setFormData((prev) => ({
												...prev,
												message: e.target.value,
											}))
										}
										size="small"
										inputProps={{ maxLength: 300 }}
										sx={textFieldSx}
									/>
									<Typography
										sx={{
											color: "#999",
											fontSize: "0.75rem",
											mt: 0.5,
											textAlign: "right",
										}}
									>
										{formData.message.length}/300
									</Typography>
								</Box>
							)}

							<Button
								fullWidth
								sx={{
									...buttonSx,
									opacity: isFormValid && !submitting ? 1 : 0.5,
								}}
								onClick={handleSubmit}
								disabled={!isFormValid || submitting}
							>
								{submitting ? (
									<CircularProgress size={22} />
								) : (
									"Submit Order"
								)}
							</Button>
						</Box>
					</>
				)}
			</Dialog>

			{/* Success Modal */}
			<Dialog
				open={successOpen}
				onClose={() => setSuccessOpen(false)}
				PaperProps={{
					sx: {
						borderRadius: 4,
						p: 2,
						textAlign: "center",
						maxWidth: 420,
					},
				}}
			>
				<DialogTitle sx={{ pb: 0 }}>
					<CheckCircleOutlineIcon
						sx={{ fontSize: 60, color: "#e3242b", mb: 1 }}
					/>
					<Typography
						variant="h5"
						sx={{ fontFamily: '"Georgia", serif', fontWeight: 700 }}
					>
						Gift Card Order Placed!
					</Typography>
				</DialogTitle>
				<DialogContent>
					{generatedCode && (
						<Box
							sx={{
								backgroundColor: "#FFF8F0",
								borderRadius: 2,
								p: 2,
								my: 2,
								border: "1px dashed #e3242b",
							}}
						>
							<Typography
								sx={{ color: "#777", fontSize: "0.8rem", mb: 0.5 }}
							>
								Gift Card Code
							</Typography>
							<Typography
								sx={{
									fontFamily: "monospace",
									fontWeight: 700,
									fontSize: "1.5rem",
									color: "#e3242b",
									letterSpacing: "3px",
								}}
							>
								{generatedCode}
							</Typography>
							<Typography
								sx={{ color: "#999", fontSize: "0.75rem", mt: 0.5 }}
							>
								Share this code with the recipient
							</Typography>
						</Box>
					)}
					<Typography sx={{ color: "var(--text-muted)", mt: 1, lineHeight: 1.7 }}>
						We will navigate you to WhatsApp to confirm your gift card
						order, payment, and delivery details.
					</Typography>
				</DialogContent>
				<DialogActions sx={{ justifyContent: "center", pb: 3 }}>
					<Button
						onClick={handleCompleteOrder}
						sx={{
							backgroundColor: "#e3242b",
							color: "#fff",
							borderRadius: "30px",
							px: 4,
							py: 1.2,
							fontFamily: '"Georgia", serif',
							fontWeight: 600,
							fontSize: "0.95rem",
							"&:hover": {
								backgroundColor: "#b81b21",
							},
						}}
					>
						Complete Order
					</Button>
				</DialogActions>
			</Dialog>
		</Box>
  );
}
