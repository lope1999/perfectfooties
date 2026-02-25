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
									color: "#000",
									mb: 3,
									fontSize: { xs: "1.8rem", sm: "2.4rem", md: "3rem" },
								}}
							>
								Our Story
							</Typography>
							<Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
								<AutoAwesomeIcon
									sx={{
										color: "#E91E8C",
										fontSize: { xs: "1rem", sm: "1.1rem" },
										mr: 1,
									}}
								/>
								<Typography
									variant="subtitle2"
									sx={{
										fontFamily: '"Georgia", serif',
										fontWeight: 500,
										color: "#4b0050",
										fontSize: {
											xs: "0.80rem",
											sm: "0.90rem",
											md: "0.90rem",
										},
										letterSpacing: "0.02em",
									}}
								>
									Chizzysstyles is the parent brand of Chizzysnails, a
									nail art and beauty brand founded by Chizoba.
								</Typography>
							</Box>

							<Typography
								sx={{
									color: "#444",
									fontSize: "1.05rem",
									lineHeight: 1.9,
									mb: 3,
								}}
							>
								What began as a small interest in nail artistry has
								grown into a purpose-driven passion. Chizzysnails was
								created not just to design beautiful nails, but to help
								other women feel confident, polished, and proud of their
								hands — one set at a time. From humble beginnings
								experimenting with designs in a Lagos apartment, the
								vision has steadily evolved into a brand centered on
								beauty, self-expression, and confidence.
							</Typography>

							<Typography
								sx={{
									color: "#444",
									fontSize: "1.05rem",
									lineHeight: 1.9,
									mb: 3,
								}}
							>
								Chizoba, the founder, is a self-taught nail artist whose
								journey has been shaped by curiosity, consistency, and a
								genuine love for the craft. She continuously learns,
								practices, and refines her skills to stay current with
								trends and perfect every detail, believing that growth
								never stops in the beauty industry.
							</Typography>

							<Typography
								sx={{
									color: "#444",
									fontSize: "1.05rem",
									lineHeight: 1.9,
									mb: 3,
								}}
							>
								Today, Chizzysnails offers a full range of services —
								from Gel X and hard gel extensions to custom press-on
								nails. Every appointment is a personalised experience
								because nails are more than beauty — they are
								confidence, mood, personality, and style expressed at
								your fingertips.
							</Typography>

							<Typography
								sx={{
									color: "#E91E8C",
									fontSize: "1.15rem",
									lineHeight: 1.9,
									fontWeight: 600,
									fontFamily: '"Georgia", serif',
									fontStyle: "italic",
								}}
							>
								"Gloss and grace in every set — that is the Chizzystyles
								promise."
							</Typography>
						</ScrollReveal>
					</Grid>

					{/* Image Side */}
					<Grid item xs={12} md={6}>
						<ScrollReveal direction="right" delay={0.2}>
							<Box
								component="img"
								src="/images/story/founders-2.jpeg"
								alt="Woman planning with laptop"
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
