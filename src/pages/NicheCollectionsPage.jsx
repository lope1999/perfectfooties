import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
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
  TextField,
  MenuItem,
  CircularProgress,
} from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import ScrollReveal from '../components/ScrollReveal';
import { fetchNicheCollections } from '../lib/nicheCollectionService';

function formatNaira(amount) {
  return `₦${Number(amount).toLocaleString()}`;
}

const STATUS_CONFIG = {
  open: { label: 'Open for Orders', color: '#2e7d32', bg: '#e8f5e9' },
  upcoming: { label: 'Coming Soon', color: '#e65100', bg: '#fff3e0' },
  closed: { label: 'Orders Closed', color: '#616161', bg: '#f5f5f5' },
};

const seasonOptions = ['All', 'Spring', 'Summer', 'Autumn', 'Winter', "Valentine's", 'Christmas', 'Custom'];

export default function NicheCollectionsPage() {
  const navigate = useNavigate();
  const [collections, setCollections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [seasonFilter, setSeasonFilter] = useState('All');

  useEffect(() => {
    fetchNicheCollections({ activeOnly: true })
      .then(setCollections)
      .catch(() => setCollections([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    if (seasonFilter === 'All') return collections;
    return collections.filter((c) => c.season === seasonFilter);
  }, [collections, seasonFilter]);

  const availableSeasons = useMemo(() => {
    const seen = new Set(collections.map((c) => c.season).filter(Boolean));
    return ['All', ...seasonOptions.filter((s) => s !== 'All' && seen.has(s)), ...Array.from(seen).filter((s) => !seasonOptions.includes(s))];
  }, [collections]);

  return (
		<Box sx={{ pt: 12, pb: { xs: 12, md: 6 } }}>
			{/* Back navigation */}
			<Box sx={{ px: { xs: 2, sm: 4 }, pt: 1, pb: 0 }}>
				<Button
					startIcon={<ArrowBackIosNewIcon sx={{ fontSize: '0.75rem !important' }} />}
					onClick={() => navigate('/products')}
					sx={{
						fontFamily: '"Georgia", serif',
						fontWeight: 600,
						fontSize: '0.85rem',
						color: 'var(--text-muted)',
						textTransform: 'none',
						px: 1.5,
						py: 0.6,
						borderRadius: '20px',
						border: '1px solid #eee',
						backgroundColor: '#fff',
						boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
						'&:hover': {
							backgroundColor: '#FFF0F5',
							borderColor: '#E91E8C',
							color: '#E91E8C',
						},
					}}
				>
					Press-ons Menu
				</Button>
			</Box>

			{/* Header */}
			<Box sx={{ textAlign: "center", py: 6, backgroundColor: "#fff" }}>
				<ScrollReveal direction="up">
					<Box sx={{ display: "flex", justifyContent: "center", mb: 1 }}>
						<AutoAwesomeIcon sx={{ color: "#E91E8C", fontSize: 32 }} />
					</Box>
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
						Niche Collections
					</Typography>
					<Typography
						sx={{
							maxWidth: 600,
							mx: "auto",
							color: "var(--text-muted)",
							fontSize: "1.05rem",
							lineHeight: 1.7,
							px: 2,
						}}
					>
						Curated seasonal sets designed for the soft-glam,
						luxury-loving girlies who appreciate understated elegance.
						Each set features minimal yet intentional nail art, where
						every stroke and line is crafted with precision and
						expression. Customize your look by choosing your preferred
						shape, length, and quantity.
					</Typography>
				</ScrollReveal>

				<ScrollReveal direction="up" delay={0.1}>
					<Box
						sx={{
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							gap: 1,
							mt: 2,
						}}
					>
						<AccessTimeIcon sx={{ color: "#E91E8C", fontSize: 18 }} />
						<Typography
							sx={{
								color: "#E91E8C",
								fontSize: "0.9rem",
								fontWeight: 600,
							}}
						>
							Made to order — 4–7 business day production
						</Typography>
					</Box>
				</ScrollReveal>
			</Box>

			<Container maxWidth="lg">
				{/* Season filter */}
				{availableSeasons.length > 2 && (
					<Box sx={{ mb: 4, display: "flex", justifyContent: "center" }}>
						<TextField
							select
							size="small"
							label="Filter by Season"
							value={seasonFilter}
							onChange={(e) => setSeasonFilter(e.target.value)}
							sx={{
								minWidth: 200,
								"& .MuiOutlinedInput-root": { borderRadius: 3 },
							}}
						>
							{availableSeasons.map((s) => (
								<MenuItem key={s} value={s}>
									{s}
								</MenuItem>
							))}
						</TextField>
					</Box>
				)}

				{loading && (
					<Box sx={{ textAlign: "center", py: 8 }}>
						<CircularProgress sx={{ color: "#E91E8C" }} />
					</Box>
				)}

				{!loading && filtered.length === 0 && (
					<Box sx={{ textAlign: "center", py: 8 }}>
						<Typography
							sx={{ color: "var(--text-muted)", fontSize: "1rem" }}
						>
							No collections available right now — check back soon.
						</Typography>
					</Box>
				)}

				<Grid container spacing={3}>
					{filtered.map((col, i) => {
						const statusCfg =
							STATUS_CONFIG[col.status] || STATUS_CONFIG.closed;
						const coverImage =
							Array.isArray(col.images) && col.images.length > 0
								? col.images[0]
								: null;

						return (
							<Grid item xs={12} sm={6} md={4} key={col.id}>
								<ScrollReveal direction="up" delay={i * 0.06}>
									<Card
										onClick={() =>
											col.status !== "closed" &&
											navigate(`/collections/${col.id}`)
										}
										sx={{
											borderRadius: 3,
											overflow: "hidden",
											boxShadow: "0 2px 12px rgba(233,30,140,0.08)",
											border: "1px solid #F0C0D0",
											cursor:
												col.status !== "closed"
													? "pointer"
													: "default",
											transition: "all 0.25s ease",
											"&:hover":
												col.status !== "closed"
													? {
															boxShadow:
																"0 6px 24px rgba(233,30,140,0.18)",
															transform: "translateY(-3px)",
														}
													: {},
										}}
									>
										{coverImage ? (
											<CardMedia
												component="img"
												image={coverImage}
												alt={col.name}
												sx={{ height: 240, objectFit: "cover" }}
											/>
										) : (
											<Box
												sx={{
													height: 240,
													backgroundColor: "#FFF0F5",
													display: "flex",
													alignItems: "center",
													justifyContent: "center",
												}}
											>
												<AutoAwesomeIcon
													sx={{ color: "#F0C0D0", fontSize: 48 }}
												/>
											</Box>
										)}

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
														fontFamily: '"Georgia", serif',
														fontWeight: 700,
														fontSize: "1rem",
														color: "var(--text-main)",
														flex: 1,
														mr: 1,
													}}
												>
													{col.name}
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

											{col.season && (
												<Typography
													sx={{
														fontSize: "0.78rem",
														color: "#E91E8C",
														fontWeight: 600,
														mb: 1,
													}}
												>
													{col.season}
												</Typography>
											)}

											{col.description && (
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
													{col.description}
												</Typography>
											)}

											<Box
												sx={{
													display: "flex",
													alignItems: "center",
													justifyContent: "space-between",
													mt: 1,
												}}
											>
												<Typography
													sx={{
														fontFamily: '"Georgia", serif',
														fontWeight: 700,
														fontSize: "1.1rem",
														color: "var(--text-purple)",
													}}
												>
													{col.lengthSurcharges &&
														Object.values(
															col.lengthSurcharges,
														).some((v) => v > 0) && (
															<Typography
																component="span"
																sx={{
																	fontSize: "0.72rem",
																	fontWeight: 400,
																	color: "var(--text-muted)",
																	mr: 0.3,
																}}
															>
																from
															</Typography>
														)}
													{formatNaira(col.price)}
													<Typography
														component="span"
														sx={{
															fontSize: "0.75rem",
															fontWeight: 400,
															color: "var(--text-muted)",
															ml: 0.5,
														}}
													>
														/ set
													</Typography>
												</Typography>

												{col.maxOrders && (
													<Typography
														sx={{
															fontSize: "0.72rem",
															color: "#888",
														}}
													>
														{col.maxOrders -
															(col.orderCount || 0)}{" "}
														slots left
													</Typography>
												)}
											</Box>

											<Button
												fullWidth
												disabled={col.status === "closed"}
												onClick={(e) => {
													e.stopPropagation();
													navigate(`/collections/${col.id}`);
												}}
												sx={{
													mt: 2,
													borderRadius: "20px",
													fontFamily: '"Georgia", serif',
													fontWeight: 600,
													fontSize: "0.85rem",
													textTransform: "none",
													backgroundColor:
														col.status === "open"
															? "#E91E8C"
															: "transparent",
													color:
														col.status === "open"
															? "#fff"
															: col.status === "upcoming"
																? "#e65100"
																: "#aaa",
													border: `1.5px solid ${col.status === "open" ? "#E91E8C" : col.status === "upcoming" ? "#e65100" : "#ddd"}`,
													"&:hover":
														col.status !== "closed"
															? {
																	backgroundColor:
																		col.status === "open"
																			? "#C2185B"
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
												{col.status === "open"
													? "Shop This Set"
													: col.status === "upcoming"
														? "Coming Soon"
														: "Orders Closed"}
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
  );
}
