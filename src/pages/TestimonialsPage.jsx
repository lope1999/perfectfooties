import { useState, useEffect } from 'react';
import {
	Box,
	Typography,
	Container,
	Grid,
	Avatar,
	Chip,
	Dialog,
	DialogContent,
	DialogTitle,
	IconButton,
} from "@mui/material";
import StarIcon from '@mui/icons-material/Star';
import StarBorderIcon from '@mui/icons-material/StarBorder';
import CloseIcon from "@mui/icons-material/Close";
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';
import ScrollReveal from '../components/ScrollReveal';
import ScrollToTopFab from '../components/ScrollToTopFab';
import { testimonials as staticTestimonials } from '../data/testimonials';
import { fetchTestimonials } from '../lib/testimonialService';

const ff = '"Georgia", serif';

// Client tiers — 1 review per level, brand-aligned for a nail salon
// 1 → Fresh Darling · 2 → Glam Client · 3 → Nail Lover · 4 → Star Client · 5+ → Diamond Diva
function getClientTier(reviewCount) {
	if (reviewCount >= 5)
		return {
			label: "Diamond Diva",
			emoji: "💎",
			color: "var(--text-purple)",
			bg: "#F3E5F5",
			border: "#CE93D8",
		};
	if (reviewCount >= 4)
		return {
			label: "Star Client",
			emoji: "⭐",
			color: "#B8860B",
			bg: "#FFFDE7",
			border: "#FFD54F",
		};
	if (reviewCount >= 3)
		return {
			label: "Nail Lover",
			emoji: "💅",
			color: "#C2185B",
			bg: "#FCE4EC",
			border: "#F48FB1",
		};
	if (reviewCount >= 2)
		return {
			label: "Glam Client",
			emoji: "✨",
			color: "#6A1B9A",
			bg: "#EDE7F6",
			border: "#B39DDB",
		};
	return {
		label: "Fresh Darling",
		emoji: "🌸",
		color: "#2E7D32",
		bg: "#F1F8E9",
		border: "#A5D6A7",
	};
}

function StarRating({ rating }) {
  return (
    <Box sx={{ display: 'flex', gap: 0.3 }}>
      {[1, 2, 3, 4, 5].map((star) =>
        star <= rating ? (
          <StarIcon key={star} sx={{ color: '#E91E8C', fontSize: 22 }} />
        ) : (
          <StarBorderIcon key={star} sx={{ color: '#E91E8C', fontSize: 22 }} />
        )
      )}
    </Box>
  );
}

function groupByName(items) {
  const map = {};
  items.forEach((t) => {
    const key = t.name;
    if (!map[key]) {
      map[key] = {
        id: t.id || t.name,
        name: t.name,
        occupation: t.occupation || 'Client',
        type: t.type,
        avatar: t.avatar || t.name?.charAt(0)?.toUpperCase() || '?',
        reviews: [],
      };
    }
    map[key].reviews.push({
      service: t.service,
      rating: t.rating,
      review: t.review || t.testimonial,
      type: t.type,
    });
    // Always keep group type in sync with the most recent review
    map[key].type = t.type;
  });
  return Object.values(map);
}

const swiperDotStyles = {
  '& .swiper-pagination': { position: 'static', mt: 1 },
  '& .swiper-pagination-bullet': {
    backgroundColor: '#E91E8C',
    opacity: 0.4,
    width: 7,
    height: 7,
  },
  '& .swiper-pagination-bullet-active': { opacity: 1 },
};

export default function TestimonialsPage() {
	const [groups, setGroups] = useState(groupByName(staticTestimonials));
	const [selectedGroup, setSelectedGroup] = useState(null);

	useEffect(() => {
		fetchTestimonials()
			.then((firestoreItems) => {
				const mapped = firestoreItems.map((t) => ({
					id: t.id,
					name: t.name,
					occupation: t.occupation || "Client",
					service: t.service,
					type: t.type,
					rating: t.rating,
					review: t.testimonial || t.review,
					avatar: t.avatar || t.name?.charAt(0)?.toUpperCase() || "?",
				}));
				// Reverse so newest Firestore review is processed last → group.type = most recent type
			setGroups(groupByName([...staticTestimonials, ...mapped.slice().reverse()]));
			})
			.catch(() => {});
	}, []);

	const featured = groups[0];
	const rest = groups.slice(1);

	return (
		<Box
			sx={{ pt: 12, pb: 8, minHeight: "100vh", backgroundColor: "#FAFAFA" }}
		>
			{/* Header */}
			<Box sx={{ textAlign: "center", py: 6 }}>
				<ScrollReveal direction="up">
					<Typography
						variant="h3"
						sx={{
							fontFamily: '"Georgia", serif',
							fontWeight: 700,
							color: "var(--text-main)",
							mb: 1,
						}}
					>
						Client Testimonials
					</Typography>
				</ScrollReveal>
				<ScrollReveal direction="up" delay={0.15}>
					<Typography
						sx={{
							color: "#777",
							fontSize: "1.1rem",
							fontStyle: "italic",
							fontFamily: '"Georgia", serif',
							maxWidth: 520,
							mx: "auto",
						}}
					>
						Real reviews from real clients — hear what they have to say
						about their nail appointments and press-on purchases from
						Chizzy's Nails.
					</Typography>
				</ScrollReveal>
			</Box>

			<Container maxWidth="lg">
				{/* Featured Testimonial */}
				{featured && (
					<ScrollReveal direction="up">
						{(() => {
							const featuredTier = getClientTier(featured.reviews.length);
							return (
								<Box
									onClick={() => setSelectedGroup(featured)}
									sx={{
										mb: 6, borderRadius: 4, overflow: 'hidden',
										boxShadow: '0 8px 32px rgba(0,0,0,0.08)',
										backgroundColor: '#fff', cursor: 'pointer',
										display: 'flex', flexDirection: 'column',
										transition: 'box-shadow 0.3s ease',
										'& .view-btn': { opacity: 0, transition: 'opacity 0.25s ease' },
										'&:hover': {
											boxShadow: '0 16px 48px rgba(233,30,140,0.14)',
											'& .view-btn': { opacity: 1 },
										},
									}}
								>
									{/* Main content row */}
									<Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: 'stretch' }}>
										{/* Left panel */}
										<Box
											sx={{
												width: { xs: '100%', md: '40%' }, flexShrink: 0,
												backgroundColor: '#FFF0F5',
												display: 'flex', flexDirection: 'column',
												alignItems: 'center', justifyContent: 'center',
												py: { xs: 4, md: 6 }, px: 3,
											}}
										>
											<Avatar sx={{ width: 80, height: 80, backgroundColor: '#E91E8C', fontSize: '2rem', fontFamily: ff, fontWeight: 700, mb: 2 }}>
												{featured.avatar}
											</Avatar>
											<Typography sx={{ fontFamily: ff, fontWeight: 700, fontSize: '1.3rem', color: 'var(--text-main)' }}>
												{featured.name}
											</Typography>
											<Typography sx={{ color: '#888', fontSize: '0.9rem', mb: 1 }}>
												{featured.occupation}
											</Typography>
											<Chip
												label={featured.type === 'appointment' ? 'Appointment' : 'Purchase'}
												size="small"
												sx={{ backgroundColor: featured.type === 'appointment' ? '#4A0E4E' : '#E91E8C', color: '#fff', fontWeight: 600, fontFamily: ff, mb: 2 }}
											/>
											{featured.reviews.length === 1 && <StarRating rating={featured.reviews[0].rating} />}
											{/* Tier badge */}
											<Box
												sx={{
													display: 'inline-flex', alignItems: 'center', gap: 0.5, mt: 1.5,
													px: 1.2, py: 0.4, borderRadius: '20px',
													backgroundColor: featuredTier.bg, border: `1px solid ${featuredTier.border}`,
												}}
											>
												<Typography sx={{ fontSize: '0.75rem', lineHeight: 1 }}>{featuredTier.emoji}</Typography>
												<Typography sx={{ fontFamily: ff, fontWeight: 700, fontSize: '0.75rem', color: featuredTier.color }}>
													{featuredTier.label}
												</Typography>
											</Box>
										</Box>

										{/* Right panel */}
										<Box sx={{ flex: 1, width: '100%', display: 'flex', flexDirection: 'column', ...swiperDotStyles }}>
											<Box sx={{ flex: 1 }}>
												{featured.reviews.length === 1 ? (
													<Box sx={{ p: { xs: 3, md: 5 } }}>
														<Typography sx={{ fontFamily: ff, fontWeight: 700, color: 'var(--text-purple)', fontSize: '1rem', mb: 2 }}>
															{featured.reviews[0].service}
														</Typography>
														<Typography sx={{ color: 'var(--text-muted)', fontSize: '1.1rem', lineHeight: 1.9, fontStyle: 'italic' }}>
															"{featured.reviews[0].review}"
														</Typography>
													</Box>
												) : (
													<Swiper
														modules={[Autoplay, Pagination]}
														autoplay={{ delay: 4000, disableOnInteraction: false, pauseOnMouseEnter: true }}
														pagination={{ clickable: true }}
														loop speed={700} slidesPerView={1}
													>
														{featured.reviews.map((rev, i) => (
															<SwiperSlide key={i}>
																<Box sx={{ p: { xs: 3, md: 5 } }}>
																	<Typography sx={{ fontFamily: ff, fontWeight: 700, color: 'var(--text-purple)', fontSize: '1rem', mb: 2 }}>
																		{rev.service}
																	</Typography>
																	<Typography sx={{ color: 'var(--text-muted)', fontSize: '1.1rem', lineHeight: 1.9, fontStyle: 'italic' }}>
																		"{rev.review}"
																	</Typography>
																	<Box sx={{ mt: 2 }}><StarRating rating={rev.rating} /></Box>
																</Box>
															</SwiperSlide>
														))}
													</Swiper>
												)}
											</Box>
										</Box>
									</Box>

									{/* Hover-reveal footer — full card width */}
									<Box
										className="view-btn"
										sx={{ borderTop: '1px solid #F0C0D0', py: 1, textAlign: 'center' }}
									>
										<Typography sx={{ fontFamily: ff, fontSize: '0.72rem', fontWeight: 600, color: '#E91E8C', letterSpacing: 0.3 }}>
											View full review →
										</Typography>
									</Box>
								</Box>
							);
						})()}
					</ScrollReveal>
				)}

				{/* Grid of testimonials */}
				<Grid container spacing={3} alignItems="stretch">
					{rest.map((group, index) => (
						<Grid
							item
							xs={12}
							sm={6}
							md={4}
							key={group.id}
							sx={{ display: "flex" }}
						>
							<ScrollReveal
								direction="up"
								delay={index * 0.08}
								sx={{ height: "100%", width: "100%" }}
							>
								<Box
									onClick={() => setSelectedGroup(group)}
									sx={{
										borderRadius: 3,
										overflow: "hidden",
										backgroundColor: "#fff",
										boxShadow: "0 4px 16px rgba(0,0,0,0.06)",
										transition:
											"transform 0.3s ease, box-shadow 0.3s ease",
										height: "100%",
										display: "flex",
										flexDirection: "column",
										cursor: "pointer",
										"& .view-btn": {
											opacity: 0,
											transition: "opacity 0.25s ease",
										},
										"&:hover": {
											transform: "translateY(-6px)",
											boxShadow: "0 12px 32px rgba(233,30,140,0.12)",
											"& .view-btn": { opacity: 1 },
										},
									}}
								>
									{/* Card header */}
									{(() => {
										const tier = getClientTier(group.reviews.length);
										return (
											<Box
												sx={{
													backgroundColor: "#FFF0F5",
													px: 3,
													py: 2.5,
													display: "flex",
													alignItems: "flex-start",
													gap: 2,
												}}
											>
												<Avatar
													sx={{
														width: 48,
														height: 48,
														backgroundColor: "#E91E8C",
														fontFamily: ff,
														fontWeight: 700,
														fontSize: "1.1rem",
														flexShrink: 0,
													}}
												>
													{group.avatar}
												</Avatar>
												<Box sx={{ flex: 1, minWidth: 0 }}>
													<Typography
														sx={{
															fontFamily: ff,
															fontWeight: 700,
															fontSize: "1rem",
															color: "var(--text-main)",
														}}
													>
														{group.name}
													</Typography>
													<Typography
														sx={{
															color: "#888",
															fontSize: "0.8rem",
														}}
													>
														{group.occupation}
													</Typography>
													<Box
														sx={{
															display: "inline-flex",
															alignItems: "center",
															gap: 0.5,
															mt: 0.6,
															px: 1,
															py: 0.25,
															borderRadius: "20px",
															backgroundColor: tier.bg,
															border: `1px solid ${tier.border}`,
														}}
													>
														<Typography
															sx={{
																fontSize: "0.65rem",
																lineHeight: 1,
															}}
														>
															{tier.emoji}
														</Typography>
														<Typography
															sx={{
																fontFamily: ff,
																fontWeight: 700,
																fontSize: "0.68rem",
																color: tier.color,
																letterSpacing: 0.2,
															}}
														>
															{tier.label}
														</Typography>
													</Box>
												</Box>
												<Chip
													label={
														group.type === "appointment"
															? "Appointment"
															: "Purchase"
													}
													size="small"
													sx={{
														backgroundColor:
															group.type === "appointment"
																? "#4A0E4E"
																: "#E91E8C",
														color: "#fff",
														fontWeight: 600,
														fontSize: "0.7rem",
														fontFamily: ff,
														height: 24,
														flexShrink: 0,
													}}
												/>
											</Box>
										);
									})()}

									{/* Card body */}
									{group.reviews.length === 1 ? (
										<Box
											sx={{
												px: 3,
												py: 2.5,
												flex: 1,
												display: "flex",
												flexDirection: "column",
											}}
										>
											<Typography
												sx={{
													fontFamily: '"Georgia", serif',
													fontWeight: 700,
													color: "var(--text-purple)",
													fontSize: "0.85rem",
													mb: 1.5,
												}}
											>
												{group.reviews[0].service}
											</Typography>
											<Typography
												sx={{
													color: "var(--text-muted)",
													fontSize: "0.9rem",
													lineHeight: 1.7,
													fontStyle: "italic",
													flex: 1,
													mb: 2,
													display: "-webkit-box",
													WebkitLineClamp: 4,
													WebkitBoxOrient: "vertical",
													overflow: "hidden",
												}}
											>
												"{group.reviews[0].review}"
											</Typography>
											<StarRating rating={group.reviews[0].rating} />
										</Box>
									) : (
										<Box sx={{ flex: 1, ...swiperDotStyles }}>
											<Swiper
												modules={[Autoplay, Pagination]}
												autoplay={{
													delay: 4000,
													disableOnInteraction: false,
													pauseOnMouseEnter: true,
												}}
												pagination={{ clickable: true }}
												loop
												speed={700}
												slidesPerView={1}
											>
												{group.reviews.map((rev, i) => (
													<SwiperSlide key={i}>
														<Box sx={{ px: 3, py: 2.5 }}>
															<Typography
																sx={{
																	fontFamily:
																		'"Georgia", serif',
																	fontWeight: 700,
																	color: "var(--text-purple)",
																	fontSize: "0.85rem",
																	mb: 1.5,
																}}
															>
																{rev.service}
															</Typography>
															<Typography
																sx={{
																	color: "var(--text-muted)",
																	fontSize: "0.9rem",
																	lineHeight: 1.7,
																	fontStyle: "italic",
																	mb: 2,
																	display: "-webkit-box",
																	WebkitLineClamp: 4,
																	WebkitBoxOrient: "vertical",
																	overflow: "hidden",
																}}
															>
																"{rev.review}"
															</Typography>
															<StarRating rating={rev.rating} />
														</Box>
													</SwiperSlide>
												))}
											</Swiper>
										</Box>
									)}

									{/* Hover-reveal footer */}
									<Box
										className="view-btn"
										sx={{
											borderTop: "1px solid #F0C0D0",
											py: 1,
											textAlign: "center",
										}}
									>
										<Typography
											sx={{
												fontFamily: ff,
												fontSize: "0.72rem",
												fontWeight: 600,
												color: "#E91E8C",
												letterSpacing: 0.3,
											}}
										>
											View full review →
										</Typography>
									</Box>
								</Box>
							</ScrollReveal>
						</Grid>
					))}
				</Grid>
			</Container>

			{/* Review detail modal */}
			<ReviewDetailModal
				group={selectedGroup}
				onClose={() => setSelectedGroup(null)}
			/>
			<ScrollToTopFab />
		</Box>
	);
}

function ReviewDetailModal({ group, onClose }) {
	if (!group) return null;
	const tier = getClientTier(group.reviews.length);
	return (
		<Dialog
			open={!!group}
			onClose={onClose}
			maxWidth="sm"
			fullWidth
			scroll="paper"
			PaperProps={{ sx: { borderRadius: 3, overflow: "hidden" } }}
		>
			{/* Header */}
			<Box
				sx={{
					background: "linear-gradient(135deg, #FFF0F5 0%, #fff 100%)",
					px: 3,
					pt: 3,
					pb: 2,
					borderBottom: "1px solid #F0C0D0",
					position: "relative",
				}}
			>
				<IconButton
					onClick={onClose}
					size="small"
					sx={{ position: "absolute", top: 12, right: 12, color: "#999" }}
				>
					<CloseIcon fontSize="small" />
				</IconButton>
				<Box sx={{ display: "flex", alignItems: "center", gap: 2, pr: 4 }}>
					<Avatar
						sx={{
							width: 56,
							height: 56,
							backgroundColor: "#E91E8C",
							fontFamily: ff,
							fontWeight: 700,
							fontSize: "1.3rem",
							flexShrink: 0,
						}}
					>
						{group.avatar}
					</Avatar>
					<Box sx={{ flex: 1, minWidth: 0 }}>
						<Box
							sx={{
								display: "flex",
								alignItems: "center",
								gap: 1,
								flexWrap: "wrap",
							}}
						>
							<Typography
								sx={{
									fontFamily: ff,
									fontWeight: 700,
									fontSize: "1.1rem",
									color: "var(--text-main)",
								}}
							>
								{group.name}
							</Typography>
							<Chip
								label={
									group.type === "appointment"
										? "Appointment"
										: "Purchase"
								}
								size="small"
								sx={{
									backgroundColor:
										group.type === "appointment"
											? "#4A0E4E"
											: "#E91E8C",
									color: "#fff",
									fontWeight: 600,
									fontSize: "0.72rem",
									fontFamily: ff,
									height: 22,
								}}
							/>
						</Box>
						<Typography
							sx={{ color: "#888", fontSize: "0.82rem", mb: 0.6 }}
						>
							{group.occupation}
						</Typography>
						<Box
							sx={{
								display: "inline-flex",
								alignItems: "center",
								gap: 0.6,
								px: 1.2,
								py: 0.4,
								borderRadius: "20px",
								backgroundColor: tier.bg,
								border: `1px solid ${tier.border}`,
							}}
						>
							<Typography sx={{ fontSize: "0.75rem", lineHeight: 1 }}>
								{tier.emoji}
							</Typography>
							<Typography
								sx={{
									fontFamily: ff,
									fontWeight: 700,
									fontSize: "0.78rem",
									color: tier.color,
								}}
							>
								{tier.label}
							</Typography>
							<Typography
								sx={{
									fontSize: "0.7rem",
									color: tier.color,
									opacity: 0.7,
								}}
							>
								· {group.reviews.length}{" "}
								{group.reviews.length === 1 ? "review" : "reviews"}
							</Typography>
						</Box>
					</Box>
				</Box>
			</Box>

			<DialogContent sx={{ px: 3, py: 2.5 }}>
				{group.reviews.map((rev, i) => (
					<Box key={i} sx={{ mb: i < group.reviews.length - 1 ? 3 : 0 }}>
						{group.reviews.length > 1 && (
							<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
								<Typography
									sx={{
										fontFamily: ff,
										fontSize: "0.7rem",
										fontWeight: 700,
										color: "#E91E8C",
										textTransform: "uppercase",
										letterSpacing: 0.8,
									}}
								>
									Review {i + 1}
								</Typography>
								{rev.type && (
									<Chip
										label={rev.type === 'appointment' ? 'Appointment' : 'Purchase'}
										size="small"
										sx={{ backgroundColor: rev.type === 'appointment' ? '#4A0E4E' : '#E91E8C', color: '#fff', fontWeight: 600, fontSize: '0.62rem', fontFamily: ff, height: 18 }}
									/>
								)}
							</Box>
						)}
						<Typography
							sx={{
								fontFamily: ff,
								fontWeight: 700,
								color: "var(--text-purple)",
								fontSize: "0.9rem",
								mb: 1,
							}}
						>
							{rev.service}
						</Typography>
						<StarRating rating={rev.rating} />
						<Typography
							sx={{
								color: "var(--text-muted)",
								fontSize: "0.95rem",
								lineHeight: 1.85,
								fontStyle: "italic",
								mt: 1.5,
							}}
						>
							"{rev.review}"
						</Typography>
						{i < group.reviews.length - 1 && (
							<Box sx={{ mt: 2.5, borderBottom: "1px solid #F0C0D0" }} />
						)}
					</Box>
				))}
			</DialogContent>
		</Dialog>
	);
}
