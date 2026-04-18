import { useState, useEffect } from 'react';
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
	Card,
	CardMedia,
	CardContent,
} from "@mui/material";
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from "@mui/icons-material/Remove";
import ScrollReveal from '../components/ScrollReveal';
import { faqData } from '../data/faq';
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import HandymanIcon from '@mui/icons-material/Handyman';

const ff = '"Georgia", serif';

const HERO_IMAGES = [
	"/images/products/heirloom-regal-12.jpg",
	"/images/products/heirloom-regal-5.jpg",
	"/images/products/heirloom-royal-1.jpg",
	"/images/products/heirloom-tmt-1.jpg",
	"/images/products/heirloom-regal-1.jpg",
	"/images/products/heirloom-regal-2.jpg",
	"/images/products/heirloom-regal-3.jpg",
	"/images/products/heirloom-regal-4.jpg",
	"/images/products/heirloom-royal-5.jpg",
	"/images/products/heirloom-royal-3.jpg",
	"/images/products/heirloom-royal-2.jpg",
];

const HOME_COLLECTIONS = [
	{
		id: "female-footwear",
		name: "Female Handmade Footwear",
		coverImage: "/images/products/male-low-slides-1.jpeg",
		description:
			"Elegantly crafted footwear for women, made to measure, made to last.",
	},
	{
		id: "male-footwear",
		name: "Male Handmade Footwear",
		coverImage: "/images/products/male-low-slides-1.jpeg",
		description:
			"Handcrafted leather footwear for men, built with precision and pride.",
	},
];

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
	border: "1px solid #e3242b",
	backgroundColor: "#e3242b",
	color: "#fff",
	"&:hover": {
		backgroundColor: "transparent",
		color: "#e3242b",
	},
};

const outlineBtnSx = {
	...ctaButtonBase,
	border: "1px solid #fff",
	backgroundColor: "transparent",
	color: "#fff",
	"&:hover": {
		backgroundColor: "rgba(255,255,255,0.15)",
	},
};

export default function HomePage() {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = useState(null);
  const [heroIndex, setHeroIndex] = useState(0);

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % HERO_IMAGES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
		<Box>
			{/* Hero Section */}
			<Box
				sx={{
					minHeight: "100vh",
					display: "flex",
					flexDirection: "column",
					justifyContent: "center",
					alignItems: "center",
					textAlign: "center",
					position: "relative",
					px: 2,
					overflow: "hidden",
				}}
			>
				{/* Slideshow backgrounds */}
				{HERO_IMAGES.map((img, i) => (
					<Box
						key={img}
						sx={{
							position: "absolute",
							inset: 0,
							backgroundImage: `url("${img}")`,
							backgroundSize: "cover",
							backgroundPosition: "center",
							opacity: i === heroIndex ? 1 : 0,
							transition: "opacity 1.2s ease-in-out",
						}}
					/>
				))}
				<Box
					sx={{
						position: "absolute",
						inset: 0,
						backgroundColor: "rgba(109, 109, 109, 0.45)",
						zIndex: 1,
					}}
				/>
				{/* Dot indicators */}
				<Box
					sx={{
						position: "absolute",
						bottom: 28,
						left: 0,
						right: 0,
						display: "flex",
						justifyContent: "center",
						gap: 1,
						zIndex: 2,
					}}
				>
					{HERO_IMAGES.map((_, i) => (
						<Box
							key={i}
							onClick={() => setHeroIndex(i)}
							sx={{
								width: i === heroIndex ? 22 : 8,
								height: 8,
								borderRadius: 4,
								backgroundColor:
									i === heroIndex
										? "#e3242b"
										: "rgba(255,255,255,0.5)",
								cursor: "pointer",
								transition: "all 0.3s ease",
							}}
						/>
					))}
				</Box>

				<Box sx={{ position: "relative", zIndex: 2 }}>
					<ScrollReveal direction="up" duration={0.8}>
						<Typography
							variant="h2"
							sx={{
								fontFamily: '"Georgia", serif',
								fontWeight: 700,
								fontSize: { xs: "2rem", sm: "2.5rem", md: "3.5rem" },
								color: "#ededed",
								mb: 2,
								maxWidth: 800,
								lineHeight: 1.3,
							}}
						>
							Handmade footwears, bags and belts, built to last a
							lifetime.
						</Typography>
					</ScrollReveal>

					<ScrollReveal direction="up" delay={0.18} duration={0.7}>
						<Box
							sx={{
								display: "flex",
								justifyContent: "center",
								alignItems: "center",
								gap: 2,
								mb: 3.5,
							}}
						>
							<Box
								sx={{ display: "flex", alignItems: "center", gap: 0.6 }}
							>
								<CalendarMonthIcon
									sx={{
										fontSize: 13,
										color: "rgba(255,255,255,0.55)",
									}}
								/>
								<Typography
									sx={{
										fontSize: "0.72rem",
										color: "rgba(255,255,255,0.55)",
										fontFamily: '"Georgia", serif',
										letterSpacing: 1.2,
										textTransform: "uppercase",
									}}
								>
									Est. 2020
								</Typography>
							</Box>
							<Typography
								sx={{
									color: "rgba(255,255,255,0.25)",
									fontSize: "0.85rem",
								}}
							>
								|
							</Typography>
							<Box
								sx={{ display: "flex", alignItems: "center", gap: 0.6 }}
							>
								<HandymanIcon
									sx={{
										fontSize: 13,
										color: "rgba(255,255,255,0.55)",
									}}
								/>
								<Typography
									sx={{
										fontSize: "0.72rem",
										color: "rgba(255,255,255,0.55)",
										fontFamily: '"Georgia", serif',
										letterSpacing: 1.2,
										textTransform: "uppercase",
									}}
								>
									Made to Order
								</Typography>
							</Box>
						</Box>
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
							<Button sx={bookBtnSx} onClick={() => navigate("/shop")}>
								Shop Leather Goods
							</Button>
							<Button
								sx={outlineBtnSx}
								onClick={() => navigate("/our-story")}
							>
								Our Story
							</Button>
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

			{/* Shop by Collection */}
			<Box sx={{ py: 8, backgroundColor: "var(--bg-soft)" }}>
				<Container maxWidth="lg">
					<ScrollReveal direction="up">
						<Box sx={{ textAlign: "center", mb: 6 }}>
							<Typography
								variant="h3"
								sx={{
									fontFamily: ff,
									fontWeight: 700,
									color: "var(--text-main)",
									mb: 1.5,
									fontSize: {
										xs: "1.6rem",
										sm: "2.2rem",
										md: "2.8rem",
									},
								}}
							>
								Shop by Collection
							</Typography>
							<Typography
								sx={{
									color: "var(--text-muted)",
									fontSize: "1.05rem",
									lineHeight: 1.7,
									maxWidth: 520,
									mx: "auto",
								}}
							>
								Each piece is made to order by hand in Lagos State —
								cut, stitched, and finished to your preference.
							</Typography>
							<Box
								sx={{
									width: 48,
									height: 3,
									backgroundColor: "#e3242b",
									mx: "auto",
									mt: 2,
									borderRadius: 2,
								}}
							/>
						</Box>
					</ScrollReveal>

					<Grid container spacing={4}>
						{HOME_COLLECTIONS.map((col, i) => (
							<Grid item xs={12} sm={6} key={col.id}>
								<ScrollReveal direction="up" delay={i * 0.08}>
									<Card
										onClick={() => navigate(`/shop/${col.id}`)}
										sx={{
											borderRadius: 4,
											overflow: "hidden",
											cursor: "pointer",
											border: "1px solid #E8D5B0",
											boxShadow: "0 2px 14px rgba(0,0,0,0.06)",
											transition: "all 0.3s ease",
											"&:hover": {
												transform: "translateY(-5px)",
												boxShadow:
													"0 8px 32px rgba(227,36,43,0.12)",
												borderColor: "#e3242b",
											},
										}}
									>
										<CardMedia
											component="img"
											image={col.coverImage}
											alt={col.name}
											sx={{ height: 280, objectFit: "cover" }}
										/>
										<CardContent sx={{ p: 3 }}>
											<Typography
												sx={{
													fontFamily: ff,
													fontWeight: 700,
													fontSize: "1.2rem",
													color: "var(--text-main)",
													mb: 0.8,
												}}
											>
												{col.name}
											</Typography>
											<Typography
												sx={{
													fontSize: "0.87rem",
													color: "var(--text-muted)",
													lineHeight: 1.6,
													mb: 2,
												}}
											>
												{col.description}
											</Typography>
											<Box
												sx={{
													display: "flex",
													alignItems: "center",
													gap: 0.5,
													color: "#e3242b",
													fontFamily: ff,
													fontWeight: 700,
													fontSize: "0.88rem",
												}}
											>
												Explore{" "}
												<ArrowForwardIosIcon
													sx={{ fontSize: 12 }}
												/>
											</Box>
										</CardContent>
									</Card>
								</ScrollReveal>
							</Grid>
						))}
					</Grid>

					<ScrollReveal direction="up">
						<Box sx={{ textAlign: "center", mt: 5 }}>
							<Button
								onClick={() => navigate("/shop")}
								sx={{
									fontFamily: ff,
									fontWeight: 600,
									fontSize: "1rem",
									color: "#fff",
									backgroundColor: "#e3242b",
									borderRadius: "30px",
									px: 5,
									py: 1.4,
									textTransform: "none",
									"&:hover": { backgroundColor: "#c0181e" },
								}}
							>
								Browse All Collections
							</Button>
						</Box>
					</ScrollReveal>
				</Container>
			</Box>

			{/* Brand Video Section */}
			<Box
				sx={{
					py: { xs: 4, md: 6 },
					backgroundColor: "#0a0000",
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					gap: 2,
				}}
			>
				<Typography
					sx={{
						fontFamily: '"Georgia", serif',
						color: "#fff",
						fontSize: { xs: "1.1rem", md: "1.4rem" },
						fontWeight: 600,
						letterSpacing: "0.04em",
						textAlign: "center",
					}}
				>
					Crafted by Hand. Built to Last.
				</Typography>
				<Box
					component="video"
					autoPlay
					muted
					loop
					playsInline
					sx={{
						width: "100%",
						maxWidth: 900,
						borderRadius: 3,
						display: "block",
					}}
				>
					<source src="/videos/brand-reel.mp4" type="video/mp4" />
					<source src="/videos/brand-reel.mov" type="video/quicktime" />
				</Box>
			</Box>

			{/* Contact / Hours / Location Section */}
			<Box id="contact-section" sx={{ py: 8, backgroundColor: "#FFF8F0" }}>
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
										sx={{ fontSize: 40, color: "#e3242b", mb: 1 }}
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
											sx={{ fontSize: 18, color: "#e3242b" }}
										/>
										<Typography>+234 807 363 7911</Typography>
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
											sx={{ fontSize: 18, color: "#e3242b" }}
										/>
										<Typography>perfectfooties@gmail.com</Typography>
									</Box>
								</Box>
							</ScrollReveal>
						</Grid>

						<Grid item xs={12} md={4}>
							<ScrollReveal direction="up" delay={0.15}>
								<Box>
									<AccessTimeIcon
										sx={{ fontSize: 40, color: "#e3242b", mb: 1 }}
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
										Business Hours
									</Typography>
									<Typography>Open 24 Hours, 7 Days a Week</Typography>
								</Box>
							</ScrollReveal>
						</Grid>

						<Grid item xs={12} md={4}>
							<ScrollReveal direction="up" delay={0.3}>
								<Box>
									<LocationOnIcon
										sx={{ fontSize: 40, color: "#e3242b", mb: 1 }}
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
									<Typography>Lagos State</Typography>
									<Typography>Nigeria</Typography>
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
									border: "1px solid #E8D5B0",
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
											openFaq === index ? "#FFF8F0" : "#fff",
										transition: "background-color 0.3s ease",
										"&:hover": {
											backgroundColor: "#FFF8F0",
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
													? "#e3242b"
													: "transparent",
											border: "2px solid #e3242b",
											color: openFaq === index ? "#fff" : "#e3242b",
											transition: "all 0.3s ease",
											width: 36,
											height: 36,
											flexShrink: 0,
											"&:hover": {
												backgroundColor: "#e3242b",
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
											backgroundColor: "#FFF8F0",
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
									</Box>
								</Collapse>
							</Box>
						</ScrollReveal>
					))}
				</Container>
			</Box>
		</Box>
  );
}
