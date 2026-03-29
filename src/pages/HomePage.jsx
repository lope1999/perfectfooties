import { useState } from 'react';
import AnnouncementBanner from '../components/AnnouncementBanner';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Container,
  Grid,
  IconButton,
  Collapse,
  CircularProgress,
} from '@mui/material';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import StraightenIcon from '@mui/icons-material/Straighten';
import LoginIcon from '@mui/icons-material/Login';
import ScrollReveal from '../components/ScrollReveal';
import Interstitial from '../components/Interstitial';
import PresetSizeGuide from '../components/PresetSizeGuide';
import { useAuth } from '../context/AuthContext';
import { faqData } from '../data/faq';
import { Opacity } from "@mui/icons-material";

const ctaButtonBase = {
	borderRadius: "30px",
	px: 4,
	py: 1.5,
	fontSize: "1rem",
	fontFamily: '"Georgia", serif',
	fontWeight: 600,
	transition: "all 0.3s ease",
	minWidth: 220,
};

const bookBtnSx = {
	...ctaButtonBase,
	border: "1px solid #E91E8C",
	backgroundColor: "#E91E8C",
	color: "#fff",
	"&:hover": {
		backgroundColor: "transparent",
		color: "#E91E8C",
	},
};

const viewServicesBtnSx = {
	...ctaButtonBase,
	border: "1px solid #E91E8C",
	backgroundColor: "#fff",
	color: "var(--text-main)",
	"&:hover": {
		backgroundColor: "transparent",
	},
};

const signInBtnSx = {
	...ctaButtonBase,
	border: "2px solid #4A0E4E",
	backgroundColor: "transparent",
	color: "var(--text-purple)",
	"&:hover": {
		backgroundColor: "#4A0E4E",
		color: "#fff",
		borderColor: "#4A0E4E",
	},
};

export default function HomePage() {
  const navigate = useNavigate();
  const { user, signInWithGoogle } = useAuth();
  const [openFaq, setOpenFaq] = useState(null);
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  const [signingIn, setSigningIn] = useState(false);

  const handleSignIn = async () => {
    setSigningIn(true);
    try {
      await signInWithGoogle();
    } catch {
      // user closed popup
    } finally {
      setSigningIn(false);
    }
  };

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
		<Box>
			{/* Hero Section */}
			<Box
				sx={{
					minHeight: "100vh",
					backgroundImage: 'url("/images/hero/hero-bg.jpg.jpg")',
					backgroundSize: "cover",
					backgroundPosition: "center",
					display: "flex",
					flexDirection: "column",
					justifyContent: "center",
					alignItems: "center",
					textAlign: "center",
					position: "relative",
					px: 2,
				}}
			>
				<Box
					sx={{
						position: "absolute",
						inset: 0,
						backgroundColor: "rgba(255, 226, 255, 0.55)",
					}}
				/>

				<Box sx={{ position: "relative", zIndex: 1 }}>
					<ScrollReveal direction="up" duration={0.8}>
						<Typography
							variant="h2"
							sx={{
								fontFamily: '"Georgia", serif',
								fontWeight: 700,
								fontSize: { xs: "2rem", sm: "2.5rem", md: "3.5rem" },
								color: "#4e003f",
								mb: 4,
								maxWidth: 800,
								lineHeight: 1.3,
							}}
						>
							Chizzy's Nails is a refined nail brand rooted in Gloss and
							Grace
							{/* Welcome to Chizzy’s Nails, a signature nail experience
							under the Chizzy'sStyles beauty brand. */}
						</Typography>
					</ScrollReveal>

					<ScrollReveal direction="up" delay={0.3} duration={0.8}>
						<Box
							sx={{
								display: "flex",
								gap: 3,
								justifyContent: "center",
								flexWrap: "wrap",
							}}
						>
							{" "}
							<Button
								sx={viewServicesBtnSx}
								onClick={() => navigate("/services")}
							>
								View Nail Services
							</Button>
							<Button
								sx={bookBtnSx}
								onClick={() => navigate("/products")}
							>
								View Press-ons Menu
							</Button>
							{/* {!user && (
								<Button
									sx={signInBtnSx}
									startIcon={
										signingIn ? (
											<CircularProgress
												size={18}
												sx={{ color: "inherit" }}
											/>
										) : (
											<LoginIcon />
										)
									}
									onClick={handleSignIn}
									disabled={signingIn}
								>
									{signingIn ? "Signing In…" : "Sign In"}
								</Button>
							)} */}
						</Box>
					</ScrollReveal>
				</Box>
			</Box>

			{/* Announcement Banner — shown below hero */}
			<AnnouncementBanner />

			{/* Interstitial — between hero and info */}
			{/* <Interstitial
        image="https://images.unsplash.com/photo-1519014816548-bf5fe059798b?w=1920&q=80"
        text="Hope it's great so far"
        overlayColor="rgba(74, 14, 78, 0.6)"
      /> */}

			{/* Contact / Hours / Location Section */}
			<Box id="contact-section" sx={{ py: 8, backgroundColor: "#FFC0CB" }}>
				<Container maxWidth="lg">
					<Grid
						container
						spacing={6}
						justifyContent="center"
						textAlign="center"
					>
						<Grid item xs={12} md={4}>
							<ScrollReveal direction="up" delay={0}>
								<Box>
									<PhoneIcon
										sx={{ fontSize: 40, color: "#E91E8C", mb: 1 }}
									/>
									<Typography
										variant="h5"
										sx={{
											fontFamily: '"Georgia", serif',
											fontWeight: 700,
											mb: 2,
											color: "var(--text-purple)",
										}}
									>
										Contact Info
									</Typography>
									<Box
										sx={{
											display: "flex",
											alignItems: "center",
											justifyContent: "center",
											gap: 1,
											mb: 1,
										}}
									>
										<PhoneIcon
											sx={{ fontSize: 18, color: "#E91E8C" }}
										/>
										<Typography>+234 905 371 419 7</Typography>
									</Box>
									<Box
										sx={{
											display: "flex",
											alignItems: "center",
											justifyContent: "center",
											gap: 1,
										}}
									>
										<EmailIcon
											sx={{ fontSize: 18, color: "#E91E8C" }}
										/>
										<Typography>chizobaezeh338@gmail.com</Typography>
									</Box>
								</Box>
							</ScrollReveal>
						</Grid>

						<Grid item xs={12} md={4}>
							<ScrollReveal direction="up" delay={0.15}>
								<Box>
									<AccessTimeIcon
										sx={{ fontSize: 40, color: "#E91E8C", mb: 1 }}
									/>
									<Typography
										variant="h5"
										sx={{
											fontFamily: '"Georgia", serif',
											fontWeight: 700,
											mb: 2,
											color: "var(--text-purple)",
										}}
									>
										Service Hours
									</Typography>
									<Typography>
										Monday – Friday: 11:30 AM – 5:00 PM
									</Typography>
									<Typography>
										Saturdays & Sundays: 12:00 PM – 6:00 PM
									</Typography>
								</Box>
							</ScrollReveal>
						</Grid>

						<Grid item xs={12} md={4}>
							<ScrollReveal direction="up" delay={0.3}>
								<Box>
									<LocationOnIcon
										sx={{ fontSize: 40, color: "#E91E8C", mb: 1 }}
									/>
									<Typography
										variant="h5"
										sx={{
											fontFamily: '"Georgia", serif',
											fontWeight: 700,
											mb: 2,
											color: "var(--text-purple)",
										}}
									>
										Location
									</Typography>
									<Typography>Cornerstone A</Typography>
									<Typography>Labak Estate, Abule-egba,</Typography>
									<Typography>Lagos, Nigeria</Typography>
								</Box>
							</ScrollReveal>
						</Grid>
					</Grid>
				</Container>
			</Box>

			{/* FAQ Section */}
			<Box id="faq-section" sx={{ py: 8, backgroundColor: "#fff" }}>
				<Container maxWidth="md">
					<ScrollReveal direction="up">
						<Box sx={{ textAlign: "center", mb: 5 }}>
							<Typography
								variant="h3"
								sx={{
									fontFamily: '"Georgia", serif',
									fontWeight: 700,
									color: "var(--text-main)",
									mb: 2,
									fontSize: { xs: "1.6rem", sm: "2.2rem", md: "3rem" },
								}}
							>
								Frequently Asked Questions
							</Typography>
							<Typography
								sx={{
									color: "var(--text-muted)",
									fontSize: "1.05rem",
									lineHeight: 1.7,
									maxWidth: 560,
									mx: "auto",
								}}
							>
								Here you can find answers to frequently asked questions.
								If you cannot find the answer, feel free to contact us
								via email or phone.
							</Typography>
						</Box>
					</ScrollReveal>

					{/* FAQ Items */}
					{faqData.map((item, index) => (
						<ScrollReveal key={index} direction="up" delay={index * 0.1}>
							<Box
								sx={{
									mb: 2,
									border: "1px solid #F0C0D0",
									borderRadius: 3,
									overflow: "hidden",
									transition: "box-shadow 0.3s ease",
									"&:hover": {
										boxShadow: "0 4px 16px rgba(233,30,140,0.1)",
									},
								}}
							>
								{/* Question Row */}
								<Box
									onClick={() => toggleFaq(index)}
									sx={{
										display: "flex",
										alignItems: "center",
										justifyContent: "space-between",
										px: 3,
										py: 2.5,
										cursor: "pointer",
										backgroundColor:
											openFaq === index ? "#FFF0F5" : "#fff",
										transition: "background-color 0.3s ease",
										"&:hover": {
											backgroundColor: "#FFF0F5",
										},
									}}
								>
									<Typography
										sx={{
											fontFamily: '"Georgia", serif',
											fontWeight: 600,
											fontSize: "1.05rem",
											color: "var(--text-main)",
											flex: 1,
											pr: 2,
										}}
									>
										{item.question}
									</Typography>
									<IconButton
										size="small"
										sx={{
											backgroundColor:
												openFaq === index
													? "#E91E8C"
													: "transparent",
											border: "2px solid #E91E8C",
											color: openFaq === index ? "#fff" : "#E91E8C",
											transition: "all 0.3s ease",
											width: 36,
											height: 36,
											flexShrink: 0,
											"&:hover": {
												backgroundColor: "#E91E8C",
												color: "#fff",
											},
										}}
									>
										{openFaq === index ? (
											<RemoveIcon sx={{ fontSize: 20 }} />
										) : (
											<AddIcon sx={{ fontSize: 20 }} />
										)}
									</IconButton>
								</Box>

								{/* Answer */}
								<Collapse in={openFaq === index}>
									<Box
										sx={{
											px: 3,
											pb: 3,
											pt: 1,
											backgroundColor: "#FFF0F5",
										}}
									>
										<Typography
											sx={{
												color: "var(--text-muted)",
												fontSize: "0.95rem",
												lineHeight: 1.8,
											}}
										>
											{item.answer}
										</Typography>
										{item.hasRescheduleButton && (
											<Button
												onClick={() => navigate("/reschedule")}
												sx={{
													mt: 2,
													border: "2px solid #E91E8C",
													borderRadius: "30px",
													color: "var(--text-main)",
													backgroundColor: "transparent",
													px: 3,
													py: 1,
													fontSize: "0.85rem",
													fontFamily: '"Georgia", serif',
													fontWeight: 600,
													transition: "all 0.3s ease",
													"&:hover": {
														backgroundColor: "#E91E8C",
														color: "#fff",
														borderColor: "#E91E8C",
													},
												}}
											>
												Reschedule Appointment
											</Button>
										)}
										{item.hasSizeGuideButton && (
											<Button
												startIcon={<StraightenIcon />}
												onClick={() => setSizeGuideOpen(true)}
												sx={{
													mt: 2,
													border: "2px solid #E91E8C",
													borderRadius: "30px",
													color: "var(--text-main)",
													backgroundColor: "transparent",
													px: 3,
													py: 1,
													fontSize: "0.85rem",
													fontFamily: '"Georgia", serif',
													fontWeight: 600,
													transition: "all 0.3s ease",
													"&:hover": {
														backgroundColor: "#E91E8C",
														color: "#fff",
														borderColor: "#E91E8C",
													},
												}}
											>
												View Preset Size Guide
											</Button>
										)}
									</Box>
								</Collapse>
							</Box>
						</ScrollReveal>
					))}
				</Container>
			</Box>

			<PresetSizeGuide
				open={sizeGuideOpen}
				onClose={() => setSizeGuideOpen(false)}
			/>
		</Box>
  );
}
