import { useState, useMemo, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
	Box,
	Typography,
	Container,
	Card,
	CardContent,
	Grid,
	Button,
	Chip,
	Tooltip,
	IconButton,
	CircularProgress,
	Collapse,
	Slider,
	MenuItem,
	TextField,
	Checkbox,
	FormControlLabel,
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
} from "@mui/material";
import LocalShippingOutlinedIcon from "@mui/icons-material/LocalShippingOutlined";
import PhoneOutlinedIcon from "@mui/icons-material/PhoneOutlined";
import LoginIcon from "@mui/icons-material/Login";
import FilterListIcon from "@mui/icons-material/FilterList";
import FavoriteIcon from "@mui/icons-material/Favorite";
import FavoriteBorderIcon from "@mui/icons-material/FavoriteBorder";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import CloseIcon from "@mui/icons-material/Close";
import StraightenIcon from "@mui/icons-material/Straighten";
import PlayCircleOutlineIcon from "@mui/icons-material/PlayCircleOutline";
import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import ScrollReveal from "../components/ScrollReveal";
import PresetSizeGuide from "../components/PresetSizeGuide";
import useProductCategories from "../hooks/useProductCategories";
import { useAuth } from "../context/AuthContext";
import { useWishlist } from "../context/WishlistContext";
import { useNotifications } from "../context/NotificationContext";
import { pressOnNailShapes } from "../data/products";
import { saveStockNotification } from "../lib/stockService";
import { fetchNicheCollections } from "../lib/nicheCollectionService";
import {
	hasDiscount,
	getEffectivePrice,
	getDiscountLabel,
	getSaleEndsAt,
} from "../lib/discountUtils";
import FlashSaleCountdown from "../components/FlashSaleCountdown";

const sectionColors = ["#FFF0F5", "#FCE4EC", "#F3E5F6", "#F8E8F0", "#FFF5F8"];

function formatNaira(amount) {
	return `₦${amount.toLocaleString()}`;
}

const lengthOptions = ["Short", "Medium", "Long"];

function isOutOfStock(product) {
	return product.stock !== undefined && product.stock <= 0;
}

export default function ProductsMenuPage() {
	const navigate = useNavigate();
	const location = useLocation();
	const { user, signInWithGoogle } = useAuth();
	const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
	const { showToast } = useNotifications();
	const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
	const [signingIn, setSigningIn] = useState(false);
	const {
		categories: productCategories,
		loading,
		error,
	} = useProductCategories();

	// Filter state
	const [filtersOpen, setFiltersOpen] = useState(false);
	const [sortBy, setSortBy] = useState("default");
	const [shapeFilter, setShapeFilter] = useState("");
	const [lengthFilter, setLengthFilter] = useState("");
	const [priceRange, setPriceRange] = useState([0, 30000]);
	const [inStockOnly, setInStockOnly] = useState(false);

	// Niche collections preview
	const [nichePreview, setNichePreview] = useState([]);
	const [nicheLoading, setNicheLoading] = useState(true);

	useEffect(() => {
		fetchNicheCollections({ activeOnly: true })
			.then((cols) => setNichePreview(cols.slice(0, 4)))
			.catch(() => setNichePreview([]))
			.finally(() => setNicheLoading(false));
	}, []);

	// Custom nail info dialog state
	const [customInfoOpen, setCustomInfoOpen] = useState(false);

	// Notify Me dialog state
	const [notifyDialog, setNotifyDialog] = useState(null);
	const [notifyEmail, setNotifyEmail] = useState("");
	const [notifySubmitting, setNotifySubmitting] = useState(false);
	const [notifySuccess, setNotifySuccess] = useState(false);
	const [notifyError, setNotifyError] = useState("");

	const hasActiveFilters =
		sortBy !== "default" ||
		shapeFilter ||
		lengthFilter ||
		priceRange[0] > 0 ||
		priceRange[1] < 30000 ||
		inStockOnly;

	const clearFilters = () => {
		setSortBy("default");
		setShapeFilter("");
		setLengthFilter("");
		setPriceRange([0, 30000]);
		setInStockOnly(false);
	};

	const applyFilters = (products) => {
		let filtered = products.filter((p) => !p.hidden);

		if (inStockOnly) {
			filtered = filtered.filter(
				(p) => p.stock === undefined || p.stock > 0,
			);
		}
		if (shapeFilter) {
			filtered = filtered.filter((p) => p.shape === shapeFilter);
		}
		if (lengthFilter) {
			filtered = filtered.filter((p) => p.length === lengthFilter);
		}
		filtered = filtered.filter(
			(p) => p.price >= priceRange[0] && p.price <= priceRange[1],
		);

		if (sortBy === "price-asc") {
			filtered.sort((a, b) => a.price - b.price);
		} else if (sortBy === "price-desc") {
			filtered.sort((a, b) => b.price - a.price);
		}

		return filtered;
	};

	const filteredCategories = useMemo(() => {
		return productCategories
			.map((cat) => ({
				...cat,
				filteredProducts: applyFilters(cat.products),
			}))
			.filter((cat) => {
				if (!cat.readyMade) return true; // custom categories always show as single cards
				return cat.filteredProducts.length > 0;
			});
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [
		productCategories,
		sortBy,
		shapeFilter,
		lengthFilter,
		priceRange,
		inStockOnly,
	]);

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

	const handleContactClick = () => {
		if (location.pathname !== "/") {
			navigate("/");
			setTimeout(() => {
				document
					.getElementById("contact-section")
					?.scrollIntoView({ behavior: "smooth" });
			}, 300);
		} else {
			document
				.getElementById("contact-section")
				?.scrollIntoView({ behavior: "smooth" });
		}
	};

	const handleCardClick = (product, category) => {
		if (!isOutOfStock(product)) {
			navigate(`/products/${category.id}/${product.id}`);
		}
	};

	const handleWishlistToggle = (e, product, category) => {
		e.stopPropagation();
		if (isInWishlist(product.id)) {
			removeFromWishlist(product.id);
			showToast(`${product.name} removed from wishlist`, "info");
		} else {
			addToWishlist({
				productId: product.id,
				name: product.name,
				price: product.price,
				image: product.image,
				categoryId: category.id,
				stock: product.stock,
			});
			showToast(`${product.name} added to wishlist`, "success");
		}
	};

	const handleNotifyOpen = (e, product) => {
		e.stopPropagation();
		setNotifyDialog(product);
		setNotifyEmail(user?.email || "");
		setNotifySuccess(false);
		setNotifyError("");
	};

	const handleNotifySubmit = async () => {
		if (!notifyEmail.trim() || !notifyDialog) return;
		setNotifySubmitting(true);
		setNotifyError("");
		try {
			await saveStockNotification({
				email: notifyEmail.trim(),
				productId: notifyDialog.id,
				productName: notifyDialog.name,
			});
			setNotifySuccess(true);
		} catch (err) {
			if (err.code === "ALREADY_SUBSCRIBED") {
				setNotifyError(err.message);
			} else {
				setNotifyError("Something went wrong. Please try again.");
			}
		} finally {
			setNotifySubmitting(false);
		}
	};

	return (
		<Box sx={{ pt: 12, pb: { xs: 12, md: 6 } }}>
			{/* Page Header */}
			<Box sx={{ textAlign: "center", py: 6, backgroundColor: "#fff" }}>
				<ScrollReveal direction="up">
					<Typography
						variant="h3"
						sx={{
							fontFamily: 'Georgia", serif',
							fontWeight: 700,
							color: "var(--text-main)",
							mb: 2,
							fontSize: { xs: "1.8rem", sm: "2.4rem", md: "3rem" },
						}}
					>
						Press-on Nails Menu
					</Typography>
				</ScrollReveal>
				<ScrollReveal direction="up" delay={0.15}>
					<Typography
						sx={{
							maxWidth: 620,
							mx: "auto",
							color: "var(--text-muted)",
							fontSize: "1.1rem",
							lineHeight: 1.7,
							px: 2,
						}}
					>
						Shop our handmade press-on nails — salon-quality designs you
						can apply at home. Each set comes with a complimentary nail
						kit. Choose your style, customize your fit, and place your
						order below.
					</Typography>
				</ScrollReveal>
				<ScrollReveal direction="up" delay={0.25}>
					<Box
						sx={{
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							gap: 1,
							mt: 2,
						}}
					>
						<LocalShippingOutlinedIcon
							sx={{ color: "#E91E8C", fontSize: 20 }}
						/>
						<Typography
							sx={{
								color: "#E91E8C",
								fontSize: "0.9rem",
								fontWeight: 600,
							}}
						>
							Delivery available only within Nigeria
						</Typography>
					</Box>
				</ScrollReveal>

				{/* Images are visual guides note */}
				<ScrollReveal direction="up" delay={0.28}>
					<Box
						onClick={() => setCustomInfoOpen(true)}
						sx={{
							mx: "auto",
							maxWidth: 600,
							mt: 2.5,
							px: 2,
							cursor: "pointer",
						}}
					>
						<Box
							sx={{
								display: "flex",
								alignItems: "flex-start",
								gap: 1.5,
								p: 2,
								backgroundColor: "#FFFBF0",
								border: "1px solid #FFE082",
								borderRadius: 3,
								transition: "border-color 0.2s ease",
								"&:hover": { borderColor: "#FFB300" },
							}}
						>
							<InfoOutlinedIcon
								sx={{
									color: "#B8860B",
									fontSize: 18,
									mt: 0.15,
									flexShrink: 0,
								}}
							/>
							<Typography
								sx={{
									color: "#7A5800",
									fontSize: "0.85rem",
									lineHeight: 1.6,
								}}
							>
								<strong>Note:</strong> The images shown are visual
								guides only except the <b>"Niche Collections"</b> — not
								the actual products. They represent the style and vibe
								you&rsquo;re going for.{" "}
								<span
									style={{
										textDecoration: "underline",
										textUnderlineOffset: 2,
									}}
								>
									Tap to learn how to share your inspiration.
								</span>
							</Typography>
						</Box>
					</Box>
				</ScrollReveal>

				{!user && (
					<ScrollReveal direction="up" delay={0.3}>
						<Box
							sx={{
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								gap: 1.5,
								mt: 3,
								py: 1.5,
								px: 3,
								mx: "auto",
								maxWidth: 480,
								backgroundColor: "#FFF0F5",
								borderRadius: 3,
								border: "1px solid #F0C0D0",
							}}
						>
							<Typography
								sx={{
									fontFamily: '"Georgia", serif',
									fontSize: "0.9rem",
									color: "var(--text-muted)",
								}}
							>
								Sign in to track your orders
							</Typography>
							<Button
								size="small"
								startIcon={
									signingIn ? (
										<CircularProgress
											size={16}
											sx={{ color: "inherit" }}
										/>
									) : (
										<LoginIcon sx={{ fontSize: 18 }} />
									)
								}
								onClick={handleSignIn}
								disabled={signingIn}
								sx={{
									fontFamily: '"Georgia", serif',
									fontSize: "0.85rem",
									fontWeight: 600,
									color: "#E91E8C",
									border: "1.5px solid #E91E8C",
									borderRadius: "20px",
									px: 2,
									whiteSpace: "nowrap",
									"&:hover": {
										backgroundColor: "#E91E8C",
										color: "#fff",
									},
								}}
							>
								{signingIn ? "Signing In\u2026" : "Sign In"}
							</Button>
						</Box>
					</ScrollReveal>
				)}

				{/* Niche Collections Banner */}
				<ScrollReveal direction="up" delay={0.35}>
					<Box
						sx={{
							mt: 3,
							borderRadius: 3,
							overflow: "hidden",
							border: "1.5px solid #9C27B0",
							background:
								"linear-gradient(135deg, #8E24AA 0%, #D81B60 60%, #E91E8C 100%)",
							transition: "all 0.25s ease",
							"&:hover": {
								boxShadow: "0 8px 28px rgba(142,36,170,0.3)",
							},
							maxWidth: 940,
							mx: "auto",
						}}
					>
						{/* Header row */}
						<Box
							sx={{
								display: "flex",
								alignItems: "center",
								justifyContent: "space-between",
								px: { xs: 2.5, sm: 4 },
								pt: 2.5,
								pb: 1.5,
								gap: 2,
								flexWrap: "wrap",
								cursor: "pointer",
							}}
							onClick={() => navigate("/collections")}
						>
							<Box sx={{ maxWidth: 480 }}>
								{/* Badge pill */}
								<Box
									sx={{
										display: "inline-flex",
										alignItems: "center",
										gap: 0.7,
										mb: 1.2,
										backgroundColor: "rgba(255,255,255,0.15)",
										border: "1px solid rgba(255,255,255,0.25)",
										borderRadius: "20px",
										px: 1.4,
										py: 0.45,
										backdropFilter: "blur(6px)",
									}}
								>
									<AutoAwesomeIcon sx={{ color: "#FFD6EC", fontSize: 13 }} />
									<Typography
										sx={{
											color: "#FFD6EC",
											fontSize: "0.68rem",
											fontWeight: 700,
											textTransform: "uppercase",
											letterSpacing: 1.3,
										}}
									>
										Made to Order
									</Typography>
								</Box>

								{/* Title */}
								<Typography
									sx={{
										fontFamily: '"Georgia", serif',
										fontWeight: 700,
										fontSize: { xs: "1.4rem", sm: "1.65rem" },
										color: "#fff",
										mb: 1,
										lineHeight: 1.2,
										letterSpacing: "-0.01em",
									}}
								>
									Niche Collections
								</Typography>

								{/* Description */}
								<Typography
									sx={{
										color: "rgba(255,255,255,0.82)",
										fontSize: { xs: "0.82rem", sm: "0.88rem" },
										lineHeight: 1.65,
										mb: 1.8,
										fontFamily: '"Georgia", serif',
									}}
								>
									Curated seasonal sets designed for the soft-glam, luxury-loving girlies who appreciate understated elegance — every stroke and line crafted with precision and intention.
								</Typography>

								{/* Feature chips */}
								<Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
									{[
										{ icon: "✦", label: "Choose your shape & length" },
										{ icon: "✦", label: "Limited seasonal sets" },
										{ icon: "✦", label: "Ready in 4–7 days" },
									].map(({ icon, label }) => (
										<Box
											key={label}
											sx={{
												display: "flex",
												alignItems: "center",
												gap: 0.6,
												backgroundColor: "rgba(255,255,255,0.12)",
												border: "1px solid rgba(255,255,255,0.2)",
												borderRadius: "14px",
												px: 1.3,
												py: 0.5,
											}}
										>
											<Typography sx={{ color: "#FFD6EC", fontSize: "0.62rem", lineHeight: 1 }}>{icon}</Typography>
											<Typography sx={{ color: "rgba(255,255,255,0.9)", fontSize: "0.72rem", fontWeight: 600, whiteSpace: "nowrap" }}>
												{label}
											</Typography>
										</Box>
									))}
								</Box>
							</Box>
							<Button
								onClick={(e) => {
									e.stopPropagation();
									navigate("/collections");
								}}
								sx={{
									background:
										"linear-gradient(135deg, #E91E8C, #FF6BB5)",
									color: "#fff",
									borderRadius: "20px",
									fontFamily: '"Georgia", serif',
									fontWeight: 700,
									fontSize: "0.82rem",
									textTransform: "none",
									px: 2.5,
									py: 1,
									flexShrink: 0,
									boxShadow: "0 2px 10px rgba(233,30,140,0.4)",
									"&:hover": {
										background:
											"linear-gradient(135deg, #C2185B, #E91E8C)",
									},
								}}
							>
								Explore All →
							</Button>
						</Box>

						{/* Preview cards row */}
						<Box
							sx={{
								display: "flex",
								gap: 1.5,
								px: { xs: 2, sm: 4 },
								pb: 2.5,
								overflowX: "auto",
								"&::-webkit-scrollbar": { height: 4 },
								"&::-webkit-scrollbar-track": {
									background: "rgba(255,255,255,0.08)",
									borderRadius: 2,
								},
								"&::-webkit-scrollbar-thumb": {
									background: "rgba(255,255,255,0.28)",
									borderRadius: 2,
								},
							}}
						>
							{nicheLoading
								? [1, 2, 3].map((i) => (
										<Box
											key={i}
											sx={{
												width: 170,
												height: 210,
												flexShrink: 0,
												borderRadius: 2,
												backgroundColor: "rgba(255,255,255,0.1)",
												"@keyframes nichePulse": {
													"0%, 100%": { opacity: 0.5 },
													"50%": { opacity: 0.9 },
												},
												animation:
													"nichePulse 1.5s ease-in-out infinite",
											}}
										/>
									))
								: nichePreview.length === 0
									? null
									: [
											...nichePreview.map((col) => {
												const cover =
													Array.isArray(col.images) &&
													col.images[0]
														? col.images[0]
														: null;
												const statusColor =
													col.status === "open"
														? "#2e7d32"
														: col.status === "upcoming"
															? "#e65100"
															: "#616161";
												const statusBg =
													col.status === "open"
														? "#e8f5e9"
														: col.status === "upcoming"
															? "#fff3e0"
															: "#f5f5f5";
												const statusLabel =
													col.status === "open"
														? "Open"
														: col.status === "upcoming"
															? "Soon"
															: "Closed";
												const hasSurcharge =
													col.lengthSurcharges &&
													Object.values(col.lengthSurcharges).some(
														(v) => v > 0,
													);
												return (
													<Box
														key={col.id}
														onClick={() =>
															col.status !== "closed" &&
															navigate(`/collections/${col.id}`)
														}
														sx={{
															width: 170,
															flexShrink: 0,
															borderRadius: 2,
															overflow: "hidden",
															backgroundColor: "#fff",
															boxShadow:
																"0 2px 12px rgba(0,0,0,0.25)",
															cursor:
																col.status !== "closed"
																	? "pointer"
																	: "default",
															transition: "all 0.22s ease",
															"&:hover":
																col.status !== "closed"
																	? {
																			transform:
																				"translateY(-4px)",
																			boxShadow:
																				"0 10px 24px rgba(0,0,0,0.35)",
																		}
																	: {},
														}}
													>
														{cover ? (
															<Box
																component="img"
																src={cover}
																alt={col.name}
																sx={{
																	width: "100%",
																	height: 130,
																	objectFit: "cover",
																	display: "block",
																}}
															/>
														) : (
															<Box
																sx={{
																	width: "100%",
																	height: 130,
																	backgroundColor: "#FFF0F5",
																	display: "flex",
																	alignItems: "center",
																	justifyContent: "center",
																}}
															>
																<AutoAwesomeIcon
																	sx={{
																		color: "#F0C0D0",
																		fontSize: 32,
																	}}
																/>
															</Box>
														)}
														<Box sx={{ p: 1.2 }}>
															<Box
																sx={{
																	display: "flex",
																	justifyContent:
																		"space-between",
																	alignItems: "flex-start",
																	mb: 0.4,
																	gap: 0.5,
																}}
															>
																<Typography
																	noWrap
																	sx={{
																		fontFamily:
																			'"Georgia", serif',
																		fontWeight: 700,
																		fontSize: "0.76rem",
																		color: "#2D0845",
																		lineHeight: 1.2,
																		flex: 1,
																	}}
																>
																	{col.name}
																</Typography>
																<Chip
																	label={statusLabel}
																	size="small"
																	sx={{
																		backgroundColor: statusBg,
																		color: statusColor,
																		fontWeight: 700,
																		fontSize: "0.52rem",
																		height: 15,
																		flexShrink: 0,
																		"& .MuiChip-label": {
																			px: 0.5,
																		},
																	}}
																/>
															</Box>
															{col.season && (
																<Typography
																	sx={{
																		fontSize: "0.67rem",
																		color: "#E91E8C",
																		fontWeight: 600,
																		mb: 0.4,
																	}}
																>
																	{col.season}
																</Typography>
															)}
															<Typography
																sx={{
																	fontFamily:
																		'"Georgia", serif',
																	fontWeight: 700,
																	fontSize: "0.8rem",
																	color: "#6B1050",
																}}
															>
																{hasSurcharge && (
																	<Typography
																		component="span"
																		sx={{
																			fontWeight: 400,
																			fontSize: "0.62rem",
																			color: "#999",
																			mr: 0.3,
																		}}
																	>
																		from
																	</Typography>
																)}
																₦
																{Number(
																	col.price,
																).toLocaleString()}
															</Typography>
														</Box>
													</Box>
												);
											}),
											<Box
												key="view-all"
												onClick={() => navigate("/collections")}
												sx={{
													width: 90,
													flexShrink: 0,
													borderRadius: 2,
													border:
														"1.5px dashed rgba(255,255,255,0.35)",
													display: "flex",
													flexDirection: "column",
													alignItems: "center",
													justifyContent: "center",
													gap: 0.8,
													cursor: "pointer",
													py: 2,
													transition: "all 0.22s ease",
													"&:hover": {
														backgroundColor:
															"rgba(255,255,255,0.1)",
														borderColor: "rgba(255,255,255,0.6)",
													},
												}}
											>
												<AutoAwesomeIcon
													sx={{
														color: "rgba(255,255,255,0.55)",
														fontSize: 20,
													}}
												/>
												<Typography
													sx={{
														color: "rgba(255,255,255,0.8)",
														fontSize: "0.7rem",
														fontFamily: '"Georgia", serif',
														fontWeight: 600,
														textAlign: "center",
														lineHeight: 1.3,
													}}
												>
													View All
												</Typography>
												<Typography
													sx={{
														color: "rgba(255,255,255,0.5)",
														fontSize: "0.8rem",
													}}
												>
													→
												</Typography>
											</Box>,
										]}
						</Box>
					</Box>
				</ScrollReveal>

				{/* Filter & Sort Toggle */}
				<Box sx={{ mt: 3 }}>
					<Button
						startIcon={<FilterListIcon />}
						onClick={() => setFiltersOpen(!filtersOpen)}
						sx={{
							fontFamily: '"Georgia", serif',
							fontWeight: 600,
							fontSize: "0.85rem",
							color: hasActiveFilters ? "#fff" : "#E91E8C",
							backgroundColor: hasActiveFilters
								? "#E91E8C"
								: "transparent",
							border: "1.5px solid #E91E8C",
							borderRadius: "20px",
							px: 2.5,
							"&:hover": { backgroundColor: "#E91E8C", color: "#fff" },
						}}
					>
						{filtersOpen ? "Hide Filters" : "Filter & Sort"}
					</Button>
				</Box>

				{/* Filter Controls */}
				<Collapse in={filtersOpen}>
					<Box
						sx={{
							mx: "auto",
							maxWidth: 700,
							mt: 2,
							p: 3,
							backgroundColor: "#FFF0F5",
							borderRadius: 3,
							border: "1px solid #F0C0D0",
							textAlign: "left",
						}}
					>
						<Grid container spacing={2} alignItems="center">
							<Grid item xs={12} sm={4}>
								<TextField
									select
									fullWidth
									size="small"
									label="Sort By"
									value={sortBy}
									onChange={(e) => setSortBy(e.target.value)}
									sx={{
										"& .MuiOutlinedInput-root": { borderRadius: 2 },
									}}
								>
									<MenuItem value="default">Default</MenuItem>
									<MenuItem value="price-asc">
										Price: Low to High
									</MenuItem>
									<MenuItem value="price-desc">
										Price: High to Low
									</MenuItem>
								</TextField>
							</Grid>
							<Grid item xs={6} sm={4}>
								<TextField
									select
									fullWidth
									size="small"
									label="Shape"
									value={shapeFilter}
									onChange={(e) => setShapeFilter(e.target.value)}
									sx={{
										"& .MuiOutlinedInput-root": { borderRadius: 2 },
									}}
								>
									<MenuItem value="">All Shapes</MenuItem>
									{pressOnNailShapes.map((s) => {
										const paths = {
											Almond:
												"M3,35 Q2,20 10,4 Q18,20 17,35 Q14,36 10,36 Q6,36 3,35 Z",
											Coffin: "M2,35 L5,5 L15,5 L18,35 Z",
											Stiletto: "M3,35 L7,16 L10,4 L13,16 L17,35 Z",
											Square: "M2,35 L2,4 L18,4 L18,35 Z",
											Round: "M2,35 L2,14 Q2,4 10,4 Q18,4 18,14 L18,35 Z",
											Oval: "M2,35 Q2,22 10,4 Q18,22 18,35 Z",
											Ballerina: "M2,35 L7,6 L13,6 L18,35 Z",
										};
										return (
											<MenuItem
												key={s}
												value={s}
												sx={{
													display: "flex",
													alignItems: "center",
													gap: 1.5,
												}}
											>
												<svg
													viewBox="0 0 20 36"
													width="14"
													height="26"
													style={{ flexShrink: 0 }}
												>
													<path
														d={paths[s] || ""}
														fill="#F0C0D0"
														stroke="#d48fa0"
														strokeWidth="0.8"
													/>
												</svg>
												{s}
											</MenuItem>
										);
									})}
								</TextField>
							</Grid>
							<Grid item xs={6} sm={4}>
								<TextField
									select
									fullWidth
									size="small"
									label="Length"
									value={lengthFilter}
									onChange={(e) => setLengthFilter(e.target.value)}
									sx={{
										"& .MuiOutlinedInput-root": { borderRadius: 2 },
									}}
								>
									<MenuItem value="">All Lengths</MenuItem>
									{lengthOptions.map((l) => (
										<MenuItem key={l} value={l}>
											{l}
										</MenuItem>
									))}
								</TextField>
							</Grid>
							<Grid item xs={12} sm={8}>
								<Typography
									sx={{
										fontSize: "0.8rem",
										color: "var(--text-muted)",
										mb: 0.5,
										fontFamily: '"Georgia", serif',
									}}
								>
									Price Range: {formatNaira(priceRange[0])} —{" "}
									{formatNaira(priceRange[1])}
								</Typography>
								<Slider
									value={priceRange}
									onChange={(_, val) => setPriceRange(val)}
									min={0}
									max={30000}
									step={500}
									sx={{
										color: "#E91E8C",
										"& .MuiSlider-thumb": { width: 16, height: 16 },
									}}
								/>
							</Grid>
							<Grid item xs={12} sm={4}>
								<FormControlLabel
									control={
										<Checkbox
											checked={inStockOnly}
											onChange={(e) =>
												setInStockOnly(e.target.checked)
											}
											sx={{
												color: "#E91E8C",
												"&.Mui-checked": { color: "#E91E8C" },
											}}
										/>
									}
									label={
										<Typography
											sx={{
												fontSize: "0.85rem",
												fontFamily: '"Georgia", serif',
											}}
										>
											In Stock Only
										</Typography>
									}
								/>
							</Grid>
						</Grid>

						{/* Active filter chips */}
						{hasActiveFilters && (
							<Box
								sx={{
									display: "flex",
									gap: 1,
									flexWrap: "wrap",
									mt: 2,
									alignItems: "center",
								}}
							>
								{sortBy !== "default" && (
									<Chip
										label={
											sortBy === "price-asc"
												? "Price: Low→High"
												: "Price: High→Low"
										}
										size="small"
										onDelete={() => setSortBy("default")}
										sx={{ backgroundColor: "#FCE4EC" }}
									/>
								)}
								{shapeFilter && (
									<Chip
										label={shapeFilter}
										size="small"
										onDelete={() => setShapeFilter("")}
										sx={{ backgroundColor: "#FCE4EC" }}
									/>
								)}
								{lengthFilter && (
									<Chip
										label={lengthFilter}
										size="small"
										onDelete={() => setLengthFilter("")}
										sx={{ backgroundColor: "#FCE4EC" }}
									/>
								)}
								{(priceRange[0] > 0 || priceRange[1] < 30000) && (
									<Chip
										label={`${formatNaira(priceRange[0])}–${formatNaira(priceRange[1])}`}
										size="small"
										onDelete={() => setPriceRange([0, 30000])}
										sx={{ backgroundColor: "#FCE4EC" }}
									/>
								)}
								{inStockOnly && (
									<Chip
										label="In Stock"
										size="small"
										onDelete={() => setInStockOnly(false)}
										sx={{ backgroundColor: "#FCE4EC" }}
									/>
								)}
								<Button
									size="small"
									onClick={clearFilters}
									sx={{
										fontSize: "0.75rem",
										color: "#E91E8C",
										textTransform: "none",
									}}
								>
									Clear All
								</Button>
							</Box>
						)}
					</Box>
				</Collapse>
			</Box>

			{/* Loading / Error */}
			{loading && (
				<Box sx={{ textAlign: "center", py: 10 }}>
					<CircularProgress sx={{ color: "#E91E8C" }} />
					<Typography sx={{ mt: 2, color: "#999" }}>
						Loading products…
					</Typography>
				</Box>
			)}
			{error && !loading && (
				<Box sx={{ textAlign: "center", py: 4 }}>
					<Typography sx={{ color: "#d32f2f", fontSize: "0.9rem" }}>
						Could not load products from the server. Showing cached data.
					</Typography>
				</Box>
			)}

			{/* Ready-Made Product Sections — replaced by Niche Collections */}
			{filteredCategories.map((category, index) => {
				if (!category.readyMade || category.readyMade) {
					void index;
					return null;
				}
				return (
					<Box key={category.id}>
						<Box
							sx={{
								backgroundColor:
									sectionColors[index % sectionColors.length],
								py: 8,
							}}
						>
							<Container maxWidth="lg">
								<ScrollReveal direction="up">
									<Typography
										variant="h4"
										sx={{
											fontFamily: '"Georgia", serif',
											fontWeight: 700,
											color: "var(--text-main)",
											mb: 1,
											textAlign: "center",
											fontSize: {
												xs: "1.3rem",
												sm: "1.7rem",
												md: "2.1rem",
											},
											px: 1,
										}}
									>
										{category.title}
									</Typography>
								</ScrollReveal>
								<ScrollReveal direction="up" delay={0.1}>
									<Typography
										sx={{
											textAlign: "center",
											color: "var(--text-muted)",
											mb: 1,
											maxWidth: 580,
											mx: "auto",
											lineHeight: 1.6,
										}}
									>
										{category.description}
									</Typography>

									{/* Preset sizes info for ready-made products */}
									{category.readyMade && (
										<Box
											sx={{
												display: "flex",
												alignItems: "center",
												justifyContent: "center",
												gap: 1,
												mt: 1,
												mb: 0.5,
												flexWrap: "wrap",
											}}
										>
											<Typography
												sx={{
													color: "var(--text-purple)",
													fontSize: "0.9rem",
													fontWeight: 600,
												}}
											>
												XS, S, M & L preset nail sizes available
											</Typography>
											<Typography
												onClick={() => setSizeGuideOpen(true)}
												sx={{
													color: "#E91E8C",
													fontSize: "0.85rem",
													fontWeight: 600,
													cursor: "pointer",
													textDecoration: "underline",
													textUnderlineOffset: 2,
													"&:hover": { color: "#C2185B" },
												}}
											>
												What are preset sizes?
											</Typography>
											<Tooltip title="Contact us for help" arrow>
												<IconButton
													onClick={handleContactClick}
													size="small"
													sx={{
														color: "#E91E8C",
														border: "1.5px solid #E91E8C",
														width: 30,
														height: 30,
														"&:hover": {
															backgroundColor: "#E91E8C",
															color: "#fff",
														},
													}}
												>
													<PhoneOutlinedIcon
														sx={{ fontSize: 16 }}
													/>
												</IconButton>
											</Tooltip>
										</Box>
									)}

									{category.note && (
										<Typography
											sx={{
												textAlign: "center",
												color: "#E91E8C",
												fontWeight: 600,
												fontSize: "0.9rem",
												mb: 4,
											}}
										>
											{category.note}
										</Typography>
									)}
									{!category.note && <Box sx={{ mb: 4 }} />}
								</ScrollReveal>

								{!category.readyMade ? (
									<Box
										sx={{
											display: "flex",
											justifyContent: "center",
											mt: 2,
										}}
									>
										<Card
											elevation={0}
											onClick={() =>
												navigate(`/products/${category.id}`)
											}
											sx={{
												borderRadius: 3,
												border: "1px solid #F0C0D0",
												width: { xs: "100%", sm: 380 },
												maxWidth: 420,
												overflow: "hidden",
												cursor: "pointer",
												transition:
													"transform 0.3s ease, box-shadow 0.3s ease",
												"&:hover": {
													transform: "translateY(-6px)",
													boxShadow:
														"0 12px 32px rgba(233,30,140,0.15)",
												},
											}}
										>
											{category.filteredProducts[0]?.image && (
												<Box
													component="img"
													src={category.filteredProducts[0].image}
													alt={category.title}
													sx={{
														width: "100%",
														height: 220,
														objectFit: "cover",
													}}
												/>
											)}
											<CardContent sx={{ p: 3 }}>
												<Chip
													label="Custom Order"
													size="small"
													sx={{
														backgroundColor: "#4A0E4E",
														color: "#fff",
														fontSize: "0.7rem",
														fontWeight: 700,
														height: 22,
														mb: 1.5,
													}}
												/>
												<Typography
													sx={{
														fontFamily: '"Georgia", serif',
														fontWeight: 700,
														color: "var(--text-main)",
														fontSize: "1.1rem",
														mb: 0.5,
													}}
												>
													{category.title}
												</Typography>
												{category.filteredProducts.length > 0 && (
													<Typography
														sx={{
															fontFamily: '"Georgia", serif',
															fontWeight: 700,
															color: "#E91E8C",
															fontSize: "1rem",
															mb: 1,
														}}
													>
														From{" "}
														{formatNaira(
															Math.min(
																...category.filteredProducts.map(
																	(p) => getEffectivePrice(p),
																),
															),
														)}
													</Typography>
												)}
												<Typography
													sx={{
														color: "var(--text-muted)",
														fontSize: "0.9rem",
														lineHeight: 1.5,
														mb: 2,
													}}
												>
													{category.description}
												</Typography>
												<Button
													variant="contained"
													fullWidth
													sx={{
														backgroundColor: "#E91E8C",
														color: "#fff",
														fontFamily: '"Georgia", serif',
														fontWeight: 700,
														borderRadius: "24px",
														textTransform: "none",
														"&:hover": {
															backgroundColor: "#C2185B",
														},
													}}
												>
													View &amp; Order
												</Button>
											</CardContent>
										</Card>
									</Box>
								) : (
									<Grid container spacing={3}>
										{category.filteredProducts.map(
											(product, pIdx) => {
												const oos = isOutOfStock(product);
												const wishlisted = isInWishlist(product.id);

												return (
													<Grid
														item
														xs={12}
														sm={6}
														md={category.readyMade ? 4 : 3}
														key={product.id}
													>
														<ScrollReveal
															direction="up"
															delay={pIdx * 0.1}
														>
															<Card
																elevation={0}
																onClick={() =>
																	handleCardClick(
																		product,
																		category,
																	)
																}
																sx={{
																	borderRadius: 3,
																	border: "1px solid #F0C0D0",
																	height: "100%",
																	display: "flex",
																	flexDirection: "column",
																	overflow: "hidden",
																	cursor: oos
																		? "default"
																		: "pointer",
																	transition:
																		"transform 0.3s ease, box-shadow 0.3s ease",
																	"& .hover-prompt": {
																		opacity: 0,
																		transition:
																			"opacity 0.2s ease",
																	},
																	"&:hover": oos
																		? {}
																		: {
																				transform:
																					"translateY(-6px)",
																				boxShadow:
																					"0 12px 32px rgba(233,30,140,0.15)",
																				"& .hover-prompt": {
																					opacity: 1,
																				},
																			},
																}}
															>
																<Box
																	sx={{ position: "relative" }}
																>
																	<Box
																		component="img"
																		src={product.image}
																		alt={product.name}
																		sx={{
																			width: "100%",
																			height: 160,
																			objectFit: "cover",
																			opacity: oos ? 0.5 : 1,
																			filter: oos
																				? "grayscale(40%)"
																				: "none",
																			transition:
																				"opacity 0.3s ease, filter 0.3s ease",
																		}}
																	/>
																	{product.type && (
																		<Chip
																			label={product.type}
																			size="small"
																			sx={{
																				position:
																					"absolute",
																				top: 8,
																				left: 8,
																				backgroundColor:
																					"#4A0E4E",
																				color: "#fff",
																				fontSize: "0.7rem",
																				fontWeight: 700,
																				height: 22,
																			}}
																		/>
																	)}
																	{product.stock !==
																		undefined &&
																		product.stock > 0 && (
																			<Chip
																				label="Ready to ship"
																				size="small"
																				sx={{
																					position:
																						"absolute",
																					top: 8,
																					right: 8,
																					backgroundColor:
																						"#E91E8C",
																					color: "#fff",
																					fontSize:
																						"0.7rem",
																					fontWeight: 600,
																					height: 22,
																				}}
																			/>
																		)}
																	{category.readyMade && (
																		<Box
																			sx={{
																				position:
																					"absolute",
																				bottom: 8,
																				right: 8,
																				backgroundColor:
																					"rgba(74,14,78,0.85)",
																				color: "#fff",
																				borderRadius:
																					"10px",
																				px: 1,
																				py: 0.3,
																				display: "flex",
																				alignItems:
																					"center",
																				gap: 0.4,
																			}}
																		>
																			<Typography
																				sx={{
																					fontSize:
																						"0.62rem",
																					fontWeight: 700,
																					lineHeight: 1.2,
																				}}
																			>
																				Ships 4–7 days
																			</Typography>
																		</Box>
																	)}
																	{hasDiscount(product) && (
																		<Box
																			sx={{
																				position:
																					"absolute",
																				bottom: 8,
																				left: 8,
																				display: "flex",
																				flexDirection:
																					"column",
																				gap: 0.5,
																			}}
																		>
																			<Chip
																				label={getDiscountLabel(
																					product,
																				)}
																				size="small"
																				sx={{
																					backgroundColor:
																						"#2e7d32",
																					color: "#fff",
																					fontSize:
																						"0.7rem",
																					fontWeight: 700,
																					height: 22,
																				}}
																			/>
																			{getSaleEndsAt(
																				product,
																			) && (
																				<FlashSaleCountdown
																					endsAt={getSaleEndsAt(
																						product,
																					)}
																					compact
																				/>
																			)}
																		</Box>
																	)}

																	{/* Out of stock overlay */}
																	{oos && (
																		<Box
																			sx={{
																				position:
																					"absolute",
																				top: 0,
																				left: 0,
																				right: 0,
																				bottom: 0,
																				backgroundColor:
																					"rgba(0,0,0,0.45)",
																				display: "flex",
																				alignItems:
																					"center",
																				justifyContent:
																					"center",
																			}}
																		>
																			<Typography
																				sx={{
																					color: "#fff",
																					fontFamily:
																						'"Georgia", serif',
																					fontWeight: 700,
																					fontSize: "1rem",
																					textTransform:
																						"uppercase",
																					letterSpacing: 1,
																				}}
																			>
																				Out of Stock
																			</Typography>
																		</Box>
																	)}

																	{/* Click to view hover prompt */}
																	{!oos && (
																		<Box
																			className="hover-prompt"
																			sx={{
																				position:
																					"absolute",
																				top: 0,
																				left: 0,
																				right: 0,
																				bottom: 0,
																				backgroundColor:
																					"rgba(74, 14, 78, 0.35)",
																				display: "flex",
																				alignItems:
																					"center",
																				justifyContent:
																					"center",
																				pointerEvents:
																					"none",
																			}}
																		>
																			<Typography
																				sx={{
																					color: "#fff",
																					fontFamily:
																						'"Georgia", serif',
																					fontWeight: 700,
																					fontSize:
																						"0.85rem",
																					letterSpacing: 0.5,
																					textTransform:
																						"uppercase",
																				}}
																			>
																				View & Order
																			</Typography>
																		</Box>
																	)}

																	{/* Wishlist heart */}
																	<IconButton
																		onClick={(e) =>
																			handleWishlistToggle(
																				e,
																				product,
																				category,
																			)
																		}
																		size="small"
																		sx={{
																			position: "absolute",
																			bottom: 8,
																			right: 8,
																			backgroundColor:
																				"rgba(255,255,255,0.9)",
																			width: 32,
																			height: 32,
																			"&:hover": {
																				backgroundColor:
																					"#fff",
																			},
																		}}
																	>
																		{wishlisted ? (
																			<FavoriteIcon
																				sx={{
																					color: "#E91E8C",
																					fontSize: 18,
																				}}
																			/>
																		) : (
																			<FavoriteBorderIcon
																				sx={{
																					color: "#E91E8C",
																					fontSize: 18,
																				}}
																			/>
																		)}
																	</IconButton>
																</Box>
																<CardContent
																	sx={{
																		flex: 1,
																		p: 3,
																		display: "flex",
																		flexDirection: "column",
																	}}
																>
																	<Box
																		sx={{
																			display: "flex",
																			alignItems:
																				"flex-start",
																			justifyContent:
																				"space-between",
																			mb: 0.5,
																			gap: 0.5,
																		}}
																	>
																		<Typography
																			variant="h6"
																			sx={{
																				fontFamily:
																					'"Georgia", serif',
																				fontWeight: 700,
																				color: "var(--text-main)",
																				fontSize: "1rem",
																				flex: 1,
																			}}
																		>
																			{product.name}
																		</Typography>
																		{!category.readyMade && (
																			<Tooltip
																				title="About these images"
																				arrow
																				placement="top"
																			>
																				<IconButton
																					size="small"
																					onClick={(e) => {
																						e.stopPropagation();
																						setCustomInfoOpen(
																							true,
																						);
																					}}
																					sx={{
																						color: "#B8860B",
																						p: 0.3,
																						mt: 0.1,
																						flexShrink: 0,
																						"&:hover": {
																							backgroundColor:
																								"#FFF8E1",
																						},
																					}}
																				>
																					<InfoOutlinedIcon
																						sx={{
																							fontSize: 15,
																						}}
																					/>
																				</IconButton>
																			</Tooltip>
																		)}
																	</Box>
																	{product.shape &&
																		product.length && (
																			<Typography
																				sx={{
																					color: "#999",
																					fontSize:
																						"0.78rem",
																					mb: 0.8,
																				}}
																			>
																				{product.shape} ·{" "}
																				{product.length}
																			</Typography>
																		)}
																	<Typography
																		sx={{
																			color: "var(--text-muted)",
																			fontSize: "0.85rem",
																			lineHeight: 1.5,
																			mb: 2,
																			display: "-webkit-box",
																			WebkitLineClamp: 3,
																			WebkitBoxOrient:
																				"vertical",
																			overflow: "hidden",
																		}}
																	>
																		{product.description}
																	</Typography>
																	<Box
																		sx={{
																			display: "flex",
																			alignItems: "center",
																			gap: 1,
																			flexWrap: "wrap",
																			mt: "auto",
																		}}
																	>
																		{hasDiscount(product) ? (
																			<>
																				<Chip
																					label={formatNaira(
																						getEffectivePrice(
																							product,
																						),
																					)}
																					sx={{
																						backgroundColor:
																							"#2e7d32",
																						color: "#fff",
																						fontFamily:
																							'"Georgia", serif',
																						fontWeight: 700,
																						fontSize:
																							"0.9rem",
																					}}
																				/>
																				<Typography
																					component="span"
																					sx={{
																						textDecoration:
																							"line-through",
																						color: "#999",
																						fontSize:
																							"0.8rem",
																						fontFamily:
																							'"Georgia", serif',
																					}}
																				>
																					{formatNaira(
																						product.price,
																					)}
																				</Typography>
																			</>
																		) : (
																			<Chip
																				label={formatNaira(
																					product.price,
																				)}
																				sx={{
																					backgroundColor:
																						"#E91E8C",
																					color: "#fff",
																					fontFamily:
																						'"Georgia", serif',
																					fontWeight: 700,
																					fontSize:
																						"0.9rem",
																				}}
																			/>
																		)}
																		{product.stock !==
																			undefined &&
																			product.stock > 0 && (
																				<Typography
																					sx={{
																						color:
																							product.stock <=
																							2
																								? "#E91E8C"
																								: "#999",
																						fontSize:
																							"0.78rem",
																						fontWeight:
																							product.stock <=
																							2
																								? 600
																								: 400,
																						fontStyle:
																							"italic",
																					}}
																				>
																					{product.stock}{" "}
																					in stock
																				</Typography>
																			)}
																	</Box>

																	{!category.readyMade && (
																		<Button
																			size="small"
																			startIcon={
																				<StraightenIcon
																					sx={{
																						fontSize: 16,
																					}}
																				/>
																			}
																			onClick={(e) => {
																				e.stopPropagation();
																				setSizeGuideOpen(
																					true,
																				);
																			}}
																			sx={{
																				mt: 1.5,
																				border:
																					"1.5px solid #E91E8C",
																				borderRadius:
																					"20px",
																				color: "#E91E8C",
																				fontFamily:
																					'"Georgia", serif',
																				fontWeight: 600,
																				fontSize: "0.75rem",
																				textTransform:
																					"none",
																				px: 2,
																				py: 0.5,
																				"&:hover": {
																					backgroundColor:
																						"#E91E8C",
																					color: "#fff",
																				},
																			}}
																		>
																			Preset Size Guide
																		</Button>
																	)}

																	<Button
																		size="small"
																		startIcon={
																			<PlayCircleOutlineIcon
																				sx={{
																					fontSize: 16,
																				}}
																			/>
																		}
																		onClick={(e) => {
																			e.stopPropagation();
																			window.open(
																				"https://www.instagram.com/reel/DVdYNG7DFSy/?igsh=dDlvN2Z5ZzB3Y2l2",
																				"_blank",
																			);
																		}}
																		sx={{
																			mt: 1,
																			border:
																				"1.5px solid #4A0E4E",
																			borderRadius: "20px",
																			color: "var(--text-purple)",
																			fontFamily:
																				'"Georgia", serif',
																			fontWeight: 600,
																			fontSize: "0.75rem",
																			textTransform: "none",
																			px: 2,
																			py: 0.5,
																			"&:hover": {
																				backgroundColor:
																					"#4A0E4E",
																				color: "#fff",
																			},
																		}}
																	>
																		How to Apply
																	</Button>

																	{/* Notify Me button for out-of-stock — disabled until EmailJS plan upgrade
                            {oos && (
                              <Button
                                size="small"
                                startIcon={<NotificationsActiveIcon sx={{ fontSize: 16 }} />}
                                onClick={(e) => handleNotifyOpen(e, product)}
                                sx={{
                                  mt: 2,
                                  border: '1.5px solid #E91E8C',
                                  borderRadius: '20px',
                                  color: '#E91E8C',
                                  fontFamily: '"Georgia", serif',
                                  fontWeight: 600,
                                  fontSize: '0.78rem',
                                  textTransform: 'none',
                                  '&:hover': { backgroundColor: '#E91E8C', color: '#fff' },
                                }}
                              >
                                Notify Me
                              </Button>
                            )}
                            */}
																</CardContent>
															</Card>
														</ScrollReveal>
													</Grid>
												);
											},
										)}
									</Grid>
								)}
							</Container>
						</Box>
					</Box>
				);
			})}

			{/* Custom Press-On Section — all custom categories in a responsive 2-col grid */}
			{filteredCategories.some((c) => !c.readyMade) && (
				<Box sx={{ backgroundColor: "#FFF5F8", py: 8 }}>
					<Container maxWidth="lg">
						<ScrollReveal direction="up">
							<Typography
								variant="h4"
								sx={{
									fontFamily: '"Georgia", serif',
									fontWeight: 700,
									color: "var(--text-main)",
									mb: 1,
									textAlign: "center",
									fontSize: {
										xs: "1.3rem",
										sm: "1.7rem",
										md: "2.1rem",
									},
								}}
							>
								Custom Press-On Sets
							</Typography>
						</ScrollReveal>
						<ScrollReveal direction="up" delay={0.1}>
							<Typography
								sx={{
									textAlign: "center",
									color: "var(--text-muted)",
									mb: 5,
									maxWidth: 580,
									mx: "auto",
									lineHeight: 1.6,
								}}
							>
								Hand-crafted to your exact specifications and vision —
								choose your length, shape, and style.
							</Typography>
						</ScrollReveal>
						<Grid container spacing={3}>
							{filteredCategories
								.filter((c) => !c.readyMade)
								.map((cat, cIdx) => (
									<Grid item xs={12} sm={6} key={cat.id}>
										<ScrollReveal direction="up" delay={cIdx * 0.1}>
											<Card
												elevation={0}
												onClick={() =>
													navigate(`/products/${cat.id}`)
												}
												sx={{
													borderRadius: 3,
													border: "1px solid #F0C0D0",
													height: "100%",
													display: "flex",
													flexDirection: "column",
													overflow: "hidden",
													cursor: "pointer",
													transition:
														"transform 0.3s ease, box-shadow 0.3s ease",
													"&:hover": {
														transform: "translateY(-6px)",
														boxShadow:
															"0 12px 32px rgba(233,30,140,0.15)",
													},
												}}
											>
												{(cat.products || [])[0]?.image && (
													<Box
														component="img"
														src={(cat.products || [])[0].image}
														alt={cat.title}
														sx={{
															width: "100%",
															height: 220,
															objectFit: "cover",
														}}
													/>
												)}
												<CardContent
													sx={{
														p: 3,
														flex: 1,
														display: "flex",
														flexDirection: "column",
													}}
												>
													<Chip
														label="Custom Order"
														size="small"
														sx={{
															backgroundColor: "#4A0E4E",
															color: "#fff",
															fontSize: "0.7rem",
															fontWeight: 700,
															height: 22,
															mb: 1.5,
															alignSelf: "flex-start",
														}}
													/>
													<Typography
														sx={{
															fontFamily: '"Georgia", serif',
															fontWeight: 700,
															color: "var(--text-main)",
															fontSize: "1.1rem",
															mb: 0.5,
														}}
													>
														{cat.title}
													</Typography>
													{(cat.products || []).length > 0 && (
														<Typography
															sx={{
																fontFamily: '"Georgia", serif',
																fontWeight: 700,
																color: "#E91E8C",
																fontSize: "1rem",
																mb: 1,
															}}
														>
															From{" "}
															{formatNaira(
																Math.min(
																	...(cat.products || []).map(
																		(p) =>
																			getEffectivePrice(p),
																	),
																),
															)}
														</Typography>
													)}
													<Typography
														sx={{
															color: "var(--text-muted)",
															fontSize: "0.9rem",
															lineHeight: 1.5,
															mb: 2,
															flex: 1,
														}}
													>
														{cat.description}
													</Typography>
													{cat.note && (
														<Typography
															sx={{
																color: "#E91E8C",
																fontWeight: 600,
																fontSize: "0.82rem",
																mb: 1.5,
															}}
														>
															{cat.note}
														</Typography>
													)}
													<Button
														variant="contained"
														fullWidth
														sx={{
															backgroundColor: "#E91E8C",
															color: "#fff",
															fontFamily: '"Georgia", serif',
															fontWeight: 700,
															borderRadius: "24px",
															textTransform: "none",
															"&:hover": {
																backgroundColor: "#C2185B",
															},
														}}
													>
														View &amp; Order
													</Button>
												</CardContent>
											</Card>
										</ScrollReveal>
									</Grid>
								))}
						</Grid>
					</Container>
				</Box>
			)}

			{/* Custom Nail Info Dialog */}
			<Dialog
				open={customInfoOpen}
				onClose={() => setCustomInfoOpen(false)}
				maxWidth="xs"
				fullWidth
				PaperProps={{ sx: { borderRadius: 4, overflow: "hidden" } }}
			>
				<DialogTitle
					sx={{
						background:
							"linear-gradient(135deg, #FFF8E1 0%, #FFF3CD 100%)",
						borderBottom: "1px solid #FFE082",
						display: "flex",
						alignItems: "center",
						gap: 1,
						pb: 1.5,
					}}
				>
					<InfoOutlinedIcon sx={{ color: "#B8860B", fontSize: 22 }} />
					<Typography
						sx={{
							fontFamily: '"Georgia", serif',
							fontWeight: 700,
							fontSize: "1rem",
							color: "#7A5800",
						}}
					>
						About These Images
					</Typography>
				</DialogTitle>
				<DialogContent sx={{ pt: 2.5, pb: 1 }}>
					<Typography
						sx={{
							color: "var(--text-muted)",
							fontSize: "0.92rem",
							lineHeight: 1.7,
							mb: 1.5,
						}}
					>
						The images shown except the "Available Press-ons" are{" "}
						<strong>visual guides only — not the actual products.</strong>{" "}
						They&rsquo;re here to help you communicate the soft glam style
						and vibe you&rsquo;re envisioning.
					</Typography>
					<Typography
						sx={{
							color: "var(--text-purple)",
							fontSize: "0.9rem",
							fontWeight: 700,
							mb: 0.8,
							fontFamily: '"Georgia", serif',
						}}
					>
						For your custom order, send us your inspiration:
					</Typography>
					<Box
						component="ul"
						sx={{
							m: 0,
							pl: 2.5,
							color: "var(--text-muted)",
							fontSize: "0.88rem",
							lineHeight: 2,
						}}
					>
						<li>Mood boards or nail inspiration pictures</li>
						<li>Images from nature, favourite colours or textures</li>
						<li>Food, films, cartoons, or any subject you love</li>
						<li>
							Screenshots, Pinterest boards, or anything that inspires
							you
						</li>
					</Box>
					<Typography
						sx={{
							mt: 1.5,
							color: "#888",
							fontSize: "0.82rem",
							fontStyle: "italic",
						}}
					>
						Your nails will be handcrafted to match your unique soft glam
						vision!
					</Typography>
				</DialogContent>
				<DialogActions sx={{ justifyContent: "center", pb: 3 }}>
					<Button
						onClick={() => setCustomInfoOpen(false)}
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
						Got it!
					</Button>
				</DialogActions>
			</Dialog>

			{/* Preset Size Guide Modal */}
			<PresetSizeGuide
				open={sizeGuideOpen}
				onClose={() => setSizeGuideOpen(false)}
			/>

			{/* Notify Me Dialog — disabled until EmailJS plan upgrade
      <Dialog
        open={!!notifyDialog}
        onClose={() => setNotifyDialog(null)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: 4, overflow: 'hidden' } }}
      >
        <DialogTitle
          sx={{
            background: 'linear-gradient(135deg, #E91E8C 0%, #4A0E4E 100%)',
            color: '#fff',
            textAlign: 'center',
            position: 'relative',
          }}
        >
          <Typography sx={{ fontFamily: '"Georgia", serif', fontWeight: 700, fontSize: '1.1rem' }}>
            Get Notified
          </Typography>
          <Typography sx={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.82rem', mt: 0.5 }}>
            We'll email you when {notifyDialog?.name} is back in stock
          </Typography>
          <IconButton
            onClick={() => setNotifyDialog(null)}
            sx={{ position: 'absolute', right: 8, top: 8, color: 'rgba(255,255,255,0.8)' }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ pt: 3, pb: 1 }}>
          {notifySuccess ? (
            <Box sx={{ textAlign: 'center', py: 2 }}>
              <NotificationsActiveIcon sx={{ fontSize: 40, color: '#4CAF50', mb: 1 }} />
              <Typography sx={{ fontFamily: '"Georgia", serif', fontWeight: 600, color: 'var(--text-main)' }}>
                You're on the list!
              </Typography>
              <Typography sx={{ color: '#777', fontSize: '0.85rem', mt: 0.5 }}>
                We'll notify you when this product is restocked.
              </Typography>
            </Box>
          ) : (
            <>
              <TextField
                fullWidth
                label="Email Address"
                type="email"
                value={notifyEmail}
                onChange={(e) => setNotifyEmail(e.target.value)}
                size="small"
                sx={{ mt: 1, '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
              />
              {notifyError && (
                <Typography sx={{ color: '#d32f2f', fontSize: '0.82rem', mt: 1 }}>
                  {notifyError}
                </Typography>
              )}
            </>
          )}
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'center', pb: 3 }}>
          {notifySuccess ? (
            <Button
              onClick={() => setNotifyDialog(null)}
              sx={{
                backgroundColor: '#E91E8C',
                color: '#fff',
                borderRadius: '30px',
                px: 4,
                py: 1,
                fontFamily: '"Georgia", serif',
                fontWeight: 600,
                '&:hover': { backgroundColor: '#C2185B' },
              }}
            >
              Done
            </Button>
          ) : (
            <>
              <Button onClick={() => setNotifyDialog(null)} sx={{ fontFamily: '"Georgia", serif', color: '#777' }}>
                Cancel
              </Button>
              <Button
                onClick={handleNotifySubmit}
                disabled={notifySubmitting || !notifyEmail.trim()}
                sx={{
                  backgroundColor: '#E91E8C',
                  color: '#fff',
                  borderRadius: '30px',
                  px: 4,
                  py: 1,
                  fontFamily: '"Georgia", serif',
                  fontWeight: 600,
                  '&:hover': { backgroundColor: '#C2185B' },
                  '&.Mui-disabled': { backgroundColor: '#F0C0D0', color: '#fff' },
                }}
              >
                {notifySubmitting ? 'Submitting\u2026' : 'Notify Me'}
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
      */}
		</Box>
	);
}
