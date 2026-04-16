import { Box, Typography, Container, Grid } from '@mui/material';
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import ScrollReveal from '../components/ScrollReveal';

export default function OurStoryPage() {
  return (
		<Box sx={{ pt: 12 }}>
			<Container
				maxWidth="lg"
				sx={{ py: { xs: 4, md: 8 }, px: { xs: 2, md: 3 } }}
			>
				<Grid container spacing={{ xs: 4, md: 8 }} alignItems="center">
					{/* Text Side */}
					<Grid item xs={12} md={6}>
						<ScrollReveal direction="left">
							<Typography
								variant="h3"
								sx={{
									fontFamily: '"Georgia", serif',
									fontWeight: 700,
									color: "var(--text-main)",
									mb: 3,
									fontSize: { xs: "1.8rem", sm: "2.4rem", md: "3rem" },
								}}
							>
								Our Story
							</Typography>
							<Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
								<AutoAwesomeIcon
									sx={{
										color: "#e3242b",
										fontSize: { xs: "1rem", sm: "1.1rem" },
										mr: 1,
									}}
								/>
								<Typography
									variant="subtitle2"
									sx={{
										fontFamily: '"Georgia", serif',
										fontWeight: 500,
										color: "var(--text-purple)",
										fontSize: {
											xs: "0.80rem",
											sm: "0.90rem",
											md: "0.90rem",
										},
										letterSpacing: "0.02em",
									}}
								>
									PerfectFooties is a handcrafted leather goods brand rooted
									in quality, precision, and lasting style.
								</Typography>
							</Box>

							<Typography
								sx={{
									color: "var(--text-muted)",
									fontSize: "1.05rem",
									lineHeight: 1.9,
									mb: 3,
								}}
							>
								What began as a deep appreciation for fine leatherwork has
								grown into a purpose-driven craft. PerfectFooties was built
								not just to make beautiful goods, but to create pieces that
								carry meaning — built to last, made to be worn, and designed
								to tell a story. From humble beginnings experimenting with
								leather in a Lagos workshop, the vision has steadily evolved
								into a brand centered on quality, self-expression, and
								enduring style.
							</Typography>

							<Typography
								sx={{
									color: "var(--text-muted)",
									fontSize: "1.05rem",
									lineHeight: 1.9,
									mb: 3,
								}}
							>
								Every piece — whether a pair of shoes, a belt, a bag, or a
								wallet — is handcrafted with care and intention. We source
								quality leather, work with skilled hands, and take time with
								every stitch and edge. We believe that true craftsmanship
								cannot be rushed, and that the details are what set a piece
								apart from the ordinary.
							</Typography>

							<Typography
								sx={{
									color: "var(--text-muted)",
									fontSize: "1.05rem",
									lineHeight: 1.9,
									mb: 3,
								}}
							>
								Today, PerfectFooties offers a growing range of handmade
								leather goods — from custom shoes and boots to bags, belts,
								and accessories. Every order is a personal experience because
								leather goods are more than fashion — they are character,
								utility, and craftsmanship expressed in the things you carry
								every day.
							</Typography>

							<Typography
								sx={{
									color: "#e3242b",
									fontSize: "1.15rem",
									lineHeight: 1.9,
									fontWeight: 600,
									fontFamily: '"Georgia", serif',
									fontStyle: "italic",
								}}
							>
								"Crafted with intention, built to last — that is the
								PerfectFooties promise."
							</Typography>
						</ScrollReveal>
					</Grid>

					{/* Image Side */}
					<Grid item xs={12} md={6}>
						<ScrollReveal direction="right" delay={0.2}>
							<Box
								component="img"
								src="/images/story/founders-2.jpeg"
								alt="Craftsman at work"
								sx={{
									width: "100%",
									borderRadius: 4,
									boxShadow: "0 16px 48px rgba(74,14,78,0.15)",
									objectFit: "cover",
									maxHeight: 550,
								}}
							/>
						</ScrollReveal>
					</Grid>
				</Grid>
			</Container>
		</Box>
  );
}
