import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box, Typography, Container, Grid, Card, CardMedia,
  CardContent, Button, CircularProgress, Chip,
} from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import ScrollReveal from '../components/ScrollReveal';
import { fetchCollections } from '../lib/collectionService';
import { getActivePromo, formatPromoLabel } from '../lib/promoUtils';

const ff = '"Georgia", serif';

const FALLBACK_COLLECTIONS = [
	{
		id: "female-footwear",
		name: "Female Handmade Footwear",
		coverImage: "/images/products/platform.jpeg",
		description:
			"Elegantly crafted footwear for women — made to measure, made to last.",
	},
	{
		id: "male-footwear",
		name: "Male Handmade Footwear",
		coverImage: "/images/products/male-low-slides-1.jpeg",
		description:
			"Handcrafted leather footwear for men — built with precision and pride.",
	},
	{
		id: "heirloom",
		name: "Heirloom Collection",
		coverImage: "/images/products/heirloom-regal-1.jpg",
		description:
			"Timeless pieces designed to be passed down through generations.",
	},
	{
		id: "bags-belts",
		name: "Handmade Bags & Belts",
		coverImage: "/images/products/heirloom-tmt-1.jpg",
		description:
			"Full-grain leather bags and belts, finished by hand in Lagos State.",
	},
];

export default function ShopPage() {
  const navigate = useNavigate();
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCollections()
      .then((data) => setCollections(data.length > 0 ? data : FALLBACK_COLLECTIONS))
      .catch(() => setCollections(FALLBACK_COLLECTIONS))
      .finally(() => setLoading(false));
  }, []);

  return (
		<Box sx={{ pt: 12, pb: { xs: 12, md: 8 } }}>
			{/* Back */}
			<Box sx={{ px: { xs: 2, sm: 4 }, pb: 0 }}>
				<Button
					startIcon={
						<ArrowBackIosNewIcon
							sx={{ fontSize: "0.75rem !important" }}
						/>
					}
					onClick={() => navigate(-1)}
					sx={{
						fontFamily: ff,
						fontWeight: 600,
						fontSize: "0.85rem",
						color: "var(--text-muted)",
						textTransform: "none",
						px: 1.5,
						py: 0.6,
						borderRadius: "20px",
						border: "1px solid #eee",
						backgroundColor: "var(--bg-card)",
						"&:hover": { borderColor: "#e3242b", color: "#e3242b" },
					}}
				>
					Back
				</Button>
			</Box>

			{/* Header */}
			<Box sx={{ textAlign: "center", py: 6 }}>
				<ScrollReveal direction="up">
					<Box sx={{ display: "flex", justifyContent: "center", mb: 1 }}>
						<AutoAwesomeIcon
							sx={{ color: "var(--accent-cyan)", fontSize: 32 }}
						/>
					</Box>
					<Typography
						variant="h3"
						sx={{
							fontFamily: ff,
							fontWeight: 700,
							color: "var(--text-main)",
							mb: 2,
							fontSize: { xs: "1.8rem", sm: "2.4rem", md: "3rem" },
						}}
					>
						Shop Collections
					</Typography>
					<Typography
						sx={{
							maxWidth: 560,
							mx: "auto",
							color: "var(--text-muted)",
							fontSize: "1.05rem",
							lineHeight: 1.7,
							px: 2,
						}}
					>
						Handcrafted leather goods made to order in Lagos State. Select
						a collection to explore.
					</Typography>
					<Box
						sx={{
							width: 48,
							height: 3,
							backgroundColor: "var(--accent-cyan)",
							mx: "auto",
							mt: 2,
							borderRadius: 2,
						}}
					/>
				</ScrollReveal>
			</Box>

			<Container maxWidth="lg">
				{loading && (
					<Box sx={{ textAlign: "center", py: 10 }}>
						<CircularProgress sx={{ color: "var(--accent-cyan)" }} />
					</Box>
				)}

				{/* Custom Order Banner */}
				<Box
					sx={{
						borderRadius: 4,
						background:
							"linear-gradient(135deg, #e3242b 0%, #ff5c5c 100%)",
						p: { xs: 3, sm: 4 },
						mb: 5,
						display: "flex",
						flexDirection: { xs: "column", sm: "row" },
						alignItems: { xs: "flex-start", sm: "center" },
						justifyContent: "space-between",
						gap: 2,
					}}
				>
					<Box>
						<Chip
							label="Bespoke"
							size="small"
							sx={{
								backgroundColor: "rgba(255,213,79,0.2)",
								color: "#FFD54F",
								fontFamily: ff,
								fontWeight: 700,
								fontSize: "0.7rem",
								mb: 1,
								border: "1px solid rgba(255,213,79,0.4)",
							}}
						/>
						<Typography
							sx={{
								fontFamily: ff,
								fontWeight: 700,
								fontSize: { xs: "1.3rem", sm: "1.6rem" },
								color: "#fff",
								mb: 0.5,
							}}
						>
							Have something specific in mind?
						</Typography>
						<Typography
							sx={{
								color: "rgba(255,255,255,0.7)",
								fontSize: "0.9rem",
								lineHeight: 1.6,
								maxWidth: 480,
							}}
						>
							We craft custom leather goods to your exact specifications
							— your colour, your design, your size.
						</Typography>
					</Box>
					<Button
						onClick={() => navigate("/custom-order")}
						endIcon={
							<ArrowForwardIosIcon
								sx={{ fontSize: "0.8rem !important" }}
							/>
						}
						sx={{
							fontFamily: ff,
							fontWeight: 700,
							fontSize: "0.9rem",
							textTransform: "none",
							backgroundColor: "#fff",
							color: "#1a0000",
							borderRadius: "30px",
							px: 3,
							py: 1.2,
							whiteSpace: "nowrap",
							flexShrink: 0,
							"&:hover": { backgroundColor: "#FFD54F" },
						}}
					>
						Request Custom Order
					</Button>
				</Box>

				<Grid container spacing={4}>
					{collections.map((col, i) => (
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
											boxShadow: "0 8px 32px rgba(0,255,255,0.15)",
											borderColor: "var(--accent-cyan)",
										},
									}}
								>
									{col.coverImage ? (
										<CardMedia
											component="img"
											image={col.coverImage}
											alt={col.name}
											sx={{ height: 300, objectFit: "cover" }}
										/>
									) : (
										<Box
											sx={{
												height: 300,
												backgroundColor: "var(--bg-soft)",
												display: "flex",
												alignItems: "center",
												justifyContent: "center",
											}}
										>
											<AutoAwesomeIcon
												sx={{ color: "#E8D5B0", fontSize: 56 }}
											/>
										</Box>
									)}
									<CardContent sx={{ p: 3 }}>
										<Typography
											sx={{
												fontFamily: ff,
												fontWeight: 700,
												fontSize: "1.25rem",
												color: "var(--text-main)",
												mb: 1,
											}}
										>
											{col.name}
										</Typography>
										{col.description && (
											<Typography
												sx={{
													fontSize: "0.88rem",
													color: "var(--text-muted)",
													lineHeight: 1.6,
													mb: 2,
												}}
											>
												{col.description}
											</Typography>
										)}
										{(() => {
											const promo = getActivePromo(col);
											if (!promo) return null;
											return (
												<Chip
													icon={<LocalOfferIcon sx={{ fontSize: "14px !important", color: "#fff !important" }} />}
													label={`${promo.label} — ${formatPromoLabel(promo)}`}
													size="small"
													sx={{
														mb: 1.5,
														backgroundColor: "#e3242b",
														color: "#fff",
														fontFamily: ff,
														fontWeight: 700,
														fontSize: "0.7rem",
														borderRadius: "4px",
													}}
												/>
											);
										})()}
										<Box
											sx={{
												display: "flex",
												alignItems: "center",
												gap: 0.5,
												color: "#007c7c",
												fontFamily: ff,
												fontWeight: 700,
												fontSize: "0.9rem",
											}}
										>
											Explore Collection{" "}
											<ArrowForwardIosIcon sx={{ fontSize: 13 }} />
										</Box>
									</CardContent>
								</Card>
							</ScrollReveal>
						</Grid>
					))}
				</Grid>
			</Container>
		</Box>
  );
}
