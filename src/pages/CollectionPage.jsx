import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
	Box,
	Typography,
	Container,
	Grid,
	Card,
	CardMedia,
	CardContent,
	Button,
	Chip,
	CircularProgress,
	IconButton,
	Tooltip,
	Rating,
	Alert,
} from "@mui/material";
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import HandymanIcon from '@mui/icons-material/Handyman';
import FavoriteIcon from '@mui/icons-material/Favorite';
import FavoriteBorderIcon from '@mui/icons-material/FavoriteBorder';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import ScrollReveal from '../components/ScrollReveal';
import { getCollection, fetchItems } from '../lib/collectionService';
import { fetchTestimonialsByCollectionId } from "../lib/testimonialService";
import { useWishlist } from '../context/WishlistContext';
import { getActivePromo, getActiveItemPromo, applyPromoToPrice, formatPromoLabel } from '../lib/promoUtils';
import ImageLightbox from '../components/ImageLightbox';
import RatingBreakdown from '../components/RatingBreakdown';

const ff = '"Georgia", serif';

const STATUS_CONFIG = {
  open:     { label: 'Available',   color: '#2e7d32', bg: '#e8f5e9' },
  upcoming: { label: 'Coming Soon', color: '#e65100', bg: '#fff3e0' },
  closed:   { label: 'Sold Out',    color: '#616161', bg: '#f5f5f5' },
};

export default function CollectionPage() {
  const { collectionId } = useParams();
  const navigate = useNavigate();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const [col, setCol] = useState(null);
  const [items, setItems] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState({ open: false, images: [], index: 0 });

  useEffect(() => {
    let active = true;
		setLoading(true);

		Promise.all([
			getCollection(collectionId),
			fetchItems(collectionId),
			fetchTestimonialsByCollectionId(collectionId),
		])
			.then(([colData, itemData, reviewData]) => {
				if (!active) return;
				setCol(colData);
				setItems(itemData);
				setReviews(
					reviewData.filter((review) => review.published !== false && !review.productId),
				);
			})
			.catch(console.error)
			.finally(() => {
				if (!active) return;
				setLoading(false);
			});

		return () => {
			active = false;
		};
  }, [collectionId]);

  if (loading) {
    return (
      <Box sx={{ pt: 16, textAlign: 'center' }}>
        <CircularProgress sx={{ color: 'var(--accent-cyan)' }} />
      </Box>
    );
  }

  return (
		<>
		<Box sx={{ pt: 12, pb: { xs: 12, md: 8 } }}>
			{/* Breadcrumb */}
			<Box
				sx={{
					px: { xs: 2, sm: 4 },
					pb: 0,
					display: "flex",
					alignItems: "center",
					gap: 1,
					flexWrap: "wrap",
				}}
			>
				<Button
					startIcon={
						<ArrowBackIosNewIcon
							sx={{ fontSize: "0.75rem !important" }}
						/>
					}
					onClick={() => navigate("/shop")}
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
					All Collections
				</Button>
				{col?.name && (
					<>
						<Typography
							sx={{ color: "var(--text-muted)", fontSize: "0.85rem" }}
						>
							/
						</Typography>
						<Typography
							sx={{
								fontFamily: ff,
								fontWeight: 600,
								fontSize: "0.85rem",
								color: "var(--text-main)",
							}}
						>
							{col.name}
						</Typography>
					</>
				)}
			</Box>

			{/* Header */}
			<Box sx={{ textAlign: "center", py: 5 }}>
				<ScrollReveal direction="up">
					<Typography
						variant="h3"
						sx={{
							fontFamily: ff,
							fontWeight: 700,
							color: "var(--text-main)",
							mb: 1.5,
							fontSize: { xs: "1.6rem", sm: "2.2rem", md: "2.8rem" },
						}}
					>
						{col?.name || "Collection"}
					</Typography>
					{col?.description && (
						<Typography
							sx={{
								maxWidth: 540,
								mx: "auto",
								color: "var(--text-muted)",
								fontSize: "1rem",
								lineHeight: 1.7,
								px: 2,
							}}
						>
							{col.description}
						</Typography>
					)}
					<Box
						sx={{
							display: "flex",
							justifyContent: "center",
							alignItems: "center",
							gap: 2,
							mt: 2,
						}}
					>
						<Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
							<CalendarMonthIcon
								sx={{ fontSize: 13, color: "var(--text-muted)" }}
							/>
							<Typography
								sx={{
									fontSize: "0.72rem",
									color: "var(--text-muted)",
									fontFamily: ff,
									letterSpacing: 1,
									textTransform: "uppercase",
								}}
							>
								Est. 2020
							</Typography>
						</Box>
						<Typography sx={{ color: "#E8D5B0", fontSize: "0.85rem" }}>
							|
						</Typography>
						<Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
							<HandymanIcon
								sx={{ fontSize: 13, color: "var(--text-muted)" }}
							/>
							<Typography
								sx={{
									fontSize: "0.72rem",
									color: "var(--text-muted)",
									fontFamily: ff,
									letterSpacing: 1,
									textTransform: "uppercase",
								}}
							>
								Made to Order
							</Typography>
						</Box>
					</Box>
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
					{(() => {
						const promo = getActivePromo(col);
						if (!promo) return null;
						return (
							<Box sx={{ maxWidth: 560, mx: "auto", mt: 3, px: { xs: 2, sm: 0 } }}>
								<Alert
									icon={<LocalOfferIcon fontSize="small" />}
									severity="error"
									sx={{
										fontFamily: ff,
										borderRadius: 3,
										"& .MuiAlert-message": { fontFamily: ff },
									}}
								>
									<strong>{promo.label}</strong>
									{promo.description ? ` — ${promo.description}` : ` — ${formatPromoLabel(promo)} on all items`}
								</Alert>
							</Box>
						);
					})()}
				</ScrollReveal>
			</Box>

			<Container maxWidth="lg">
				{reviews.length > 0 && (
					<Box
						sx={{
							mb: 6,
							p: 4,
							borderRadius: 3,
							backgroundColor: "#fff",
							border: "1px solid #E8D5B0",
						}}
					>
						<Typography
							sx={{
								fontFamily: ff,
								fontWeight: 700,
								fontSize: "1.3rem",
								mb: 1,
								color: "var(--text-main)",
							}}
						>
							Customer reviews
						</Typography>
						<Typography sx={{ color: "var(--text-muted)", mb: 2 }}>
							{reviews.length} review{reviews.length === 1 ? "" : "s"}{" "}
							for this collection.
						</Typography>
						<RatingBreakdown reviews={reviews} />
						{reviews.some((review) => (review.photoURLs || []).length > 0) && (
							<Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 2 }}>
								{(() => {
									const allPhotos = reviews.flatMap((r) => r.photoURLs || []);
									return allPhotos.slice(0, 4).map((url, index) => (
										<Box
											key={index}
											component="img"
											src={url}
											alt="Review photo"
											onClick={() => setLightbox({ open: true, images: allPhotos, index })}
											sx={{
												width: 96,
												height: 96,
												objectFit: "cover",
												borderRadius: 2,
												border: "1px solid #E8D5B0",
												cursor: 'pointer',
												transition: 'transform 0.15s',
												'&:hover': { transform: 'scale(1.04)' },
											}}
										/>
									));
								})()}
							</Box>
						)}
						<Box sx={{ display: "grid", gap: 2, mt: 3 }}>
							{reviews.slice(0, 3).map((review, index) => (
								<Box
									key={review.id || index}
									sx={{
										p: 3,
										borderRadius: 3,
										border: "1px solid #F0E3CE",
										backgroundColor: "#FFF8F0",
									}}
								>
									<Box
										sx={{
											display: "flex",
											justifyContent: "space-between",
											alignItems: "flex-start",
											flexWrap: "wrap",
											gap: 1,
										}}
									>
										<Typography
											sx={{
												fontFamily: ff,
												fontWeight: 700,
												fontSize: "0.95rem",
												color: "var(--text-main)",
											}}
										>
											{review.name}
										</Typography>
										<Chip
											label={`${Number(review.rating) || 0} / 5`}
											size="small"
											sx={{
												fontWeight: 700,
												backgroundColor: "#FDEDEC",
												color: "#B71C1C",
											}}
										/>
									</Box>
									<Typography
										sx={{
											fontFamily: ff,
											fontWeight: 700,
											fontSize: "0.92rem",
											color: "var(--text-purple)",
											mb: 1,
										}}
									>
										{review.service ||
											review.productName ||
											review.collectionName ||
											"Customer review"}
									</Typography>
									<Typography
										sx={{
											color: "var(--text-muted)",
											fontSize: "0.9rem",
											lineHeight: 1.75,
										}}
									>
										{review.testimonial || review.review}
									</Typography>
									{(review.photoURLs || []).length > 0 && (
										<Box
											sx={{
												display: "flex",
												gap: 1,
												flexWrap: "wrap",
												mt: 2,
											}}
										>
											{review.photoURLs
												.slice(0, 3)
												.map((url, pi) => (
													<Box
														key={pi}
														component="img"
														src={url}
														alt={`Review photo ${pi + 1}`}
														onClick={() => setLightbox({ open: true, images: review.photoURLs, index: pi })}
														sx={{
															width: 88,
															height: 88,
															objectFit: "cover",
															borderRadius: 2,
															border: "1px solid #E8D5B0",
															cursor: 'pointer',
															transition: 'transform 0.15s',
															'&:hover': { transform: 'scale(1.04)' },
														}}
													/>
												))}
										</Box>
									)}
								</Box>
							))}
						</Box>
					</Box>
				)}
				{items.length === 0 && (
					<Box sx={{ textAlign: "center", py: 10 }}>
						<Typography
							sx={{ color: "var(--text-muted)", fontSize: "1rem" }}
						>
							No items in this collection yet — check back soon.
						</Typography>
					</Box>
				)}

				<Grid container spacing={3}>
					{items.map((item, i) => {
						const statusCfg =
							STATUS_CONFIG[item.status] || STATUS_CONFIG.closed;
						const cover = item.images?.[0] || null;
						return (
							<Grid item xs={12} sm={6} md={4} key={item.id}>
								<ScrollReveal direction="up" delay={i * 0.07}>
									<Card
										onClick={() =>
											item.status !== "closed" &&
											navigate(`/shop/${collectionId}/${item.id}`)
										}
										sx={{
											borderRadius: 3,
											overflow: "hidden",
											border: "1px solid #E8D5B0",
											boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
											cursor:
												item.status !== "closed"
													? "pointer"
													: "default",
											transition: "all 0.25s ease",
											"&:hover":
												item.status !== "closed"
													? {
															transform: "translateY(-3px)",
															boxShadow:
																"0 6px 24px rgba(0,255,255,0.12)",
															borderColor: "var(--accent-cyan)",
														}
													: {},
										}}
									>
										<Box sx={{ position: "relative" }}>
											{cover ? (
												<CardMedia
													component="img"
													image={cover}
													alt={item.name}
													sx={{ height: 260, objectFit: "cover" }}
												/>
											) : (
												<Box
													sx={{
														height: 260,
														backgroundColor: "var(--bg-soft)",
														display: "flex",
														alignItems: "center",
														justifyContent: "center",
													}}
												>
													<AutoAwesomeIcon
														sx={{
															color: "#E8D5B0",
															fontSize: 48,
														}}
													/>
												</Box>
											)}
											<Tooltip
												title={
													isInWishlist(item.id)
														? "Remove from wishlist"
														: "Save to wishlist"
												}
												arrow
											>
												<IconButton
													onClick={(e) => {
														e.stopPropagation();
														if (isInWishlist(item.id)) {
															removeFromWishlist(item.id);
														} else {
															addToWishlist({
																productId: item.id,
																name: item.name,
																image: cover || "",
																categoryId: collectionId,
																collectionName: col?.name || "",
																price: item.price,
															});
														}
													}}
													sx={{
														position: "absolute",
														top: 8,
														right: 8,
														backgroundColor:
															"rgba(255,255,255,0.88)",
														backdropFilter: "blur(4px)",
														p: 0.8,
														color: isInWishlist(item.id)
															? "#e3242b"
															: "#aaa",
														"&:hover": {
															backgroundColor: "#fff",
															color: "#e3242b",
														},
													}}
												>
													{isInWishlist(item.id) ? (
														<FavoriteIcon sx={{ fontSize: 18 }} />
													) : (
														<FavoriteBorderIcon
															sx={{ fontSize: 18 }}
														/>
													)}
												</IconButton>
											</Tooltip>
										</Box>

										<CardContent sx={{ p: 2.5 }}>
											<Box
												sx={{
													display: "flex",
													justifyContent: "space-between",
													alignItems: "flex-start",
													mb: 1,
												}}
											>
												<Typography
													sx={{
														fontFamily: ff,
														fontWeight: 700,
														fontSize: "1rem",
														color: "var(--text-main)",
														flex: 1,
														mr: 1,
													}}
												>
													{item.name}
												</Typography>
												<Chip
													label={statusCfg.label}
													size="small"
													sx={{
														backgroundColor: statusCfg.bg,
														color: statusCfg.color,
														fontWeight: 700,
														fontSize: "0.65rem",
														height: 22,
														flexShrink: 0,
													}}
												/>
											</Box>

											{item.description && (
												<Typography
													sx={{
														fontSize: "0.82rem",
														color: "var(--text-muted)",
														lineHeight: 1.5,
														mb: 1.5,
														display: "-webkit-box",
														WebkitLineClamp: 2,
														WebkitBoxOrient: "vertical",
														overflow: "hidden",
													}}
												>
													{item.description}
												</Typography>
											)}

											{item.colors?.length > 0 && (
												<Box
													sx={{
														display: "flex",
														gap: 0.5,
														flexWrap: "wrap",
														mb: 1.5,
													}}
												>
													{item.colors.slice(0, 4).map((c) => (
														<Chip
															key={c}
															label={c}
															size="small"
															sx={{
																fontSize: "0.65rem",
																height: 20,
																borderColor: "#E8D5B0",
																border: "1px solid",
															}}
														/>
													))}
													{item.colors.length > 4 && (
														<Chip
															label={`+${item.colors.length - 4}`}
															size="small"
															sx={{
																fontSize: "0.65rem",
																height: 20,
															}}
														/>
													)}
												</Box>
											)}

											{(() => {
												const promo = getActiveItemPromo(item, col);
												const effectivePrice = promo ? applyPromoToPrice(item.price, promo) : item.price;
												const hasPromo = promo && effectivePrice < item.price;
												return (
													<Box>
														{hasPromo && (
															<Typography sx={{ fontFamily: ff, fontSize: "0.82rem", color: "var(--text-muted)", textDecoration: "line-through" }}>
																₦{Number(item.price).toLocaleString()}
															</Typography>
														)}
														<Box sx={{ display: "flex", alignItems: "center", gap: 0.5, flexWrap: "wrap" }}>
															<Typography
																sx={{
																	fontFamily: ff,
																	fontWeight: 700,
																	fontSize: "1.05rem",
																	color: hasPromo ? "#e3242b" : "var(--text-main)",
																}}
															>
																₦{Number(effectivePrice).toLocaleString()}
															</Typography>
															{hasPromo && (
																<Chip
																	label={formatPromoLabel(promo)}
																	size="small"
																	sx={{ fontSize: "0.6rem", height: 18, backgroundColor: "rgba(227,36,43,0.1)", color: "#e3242b", fontWeight: 700 }}
																/>
															)}
														</Box>
													</Box>
												);
											})()}

											<Button
												fullWidth
												disabled={item.status === "closed"}
												onClick={(e) => {
													e.stopPropagation();
													navigate(
														`/shop/${collectionId}/${item.id}`,
													);
												}}
												sx={{
													mt: 2,
													borderRadius: "20px",
													fontFamily: ff,
													fontWeight: 600,
													fontSize: "0.85rem",
													textTransform: "none",
													backgroundColor:
														item.status === "open"
															? "#e3242b"
															: "transparent",
													color:
														item.status === "open"
															? "#fff"
															: item.status === "upcoming"
																? "#e65100"
																: "#aaa",
													border: `1.5px solid ${item.status === "open" ? "#e3242b" : item.status === "upcoming" ? "#e65100" : "#ddd"}`,
													"&:hover":
														item.status !== "closed"
															? {
																	backgroundColor:
																		item.status === "open"
																			? "#b81b21"
																			: "#fff3e0",
																}
															: {},
													"&.Mui-disabled": {
														color: "#aaa",
														borderColor: "#ddd",
														backgroundColor: "transparent",
													},
												}}
											>
												{item.status === "open"
													? "Order Now"
													: item.status === "upcoming"
														? "Coming Soon"
														: "Sold Out"}
											</Button>
										</CardContent>
									</Card>
								</ScrollReveal>
							</Grid>
						);
					})}
				</Grid>
			</Container>
		</Box>
		<ImageLightbox
			open={lightbox.open}
			onClose={() => setLightbox((s) => ({ ...s, open: false }))}
			images={lightbox.images}
			initialIndex={lightbox.index}
		/>
		</>
  );
}
