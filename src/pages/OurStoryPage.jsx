import { Box, Typography, Container, Grid, Avatar } from "@mui/material";
import AutoAwesomeIcon from "@mui/icons-material/AutoAwesome";
import ScrollReveal from "../components/ScrollReveal";
import { teamMembers } from "../data/team";

function getInitials(name) {
	return name
		.split(" ")
		.filter(Boolean)
		.map((w) => w[0])
		.join("")
		.toUpperCase()
		.slice(0, 2);
}

export default function OurStoryPage() {
	const visibleTeam = teamMembers.filter((m) => m.name !== "TBD");
  const ceo = teamMembers.find((member) => member.id === "ceo");

	return (
		<Box sx={{ pt: 12 }}>
			<Container
				maxWidth="lg"
				sx={{ py: { xs: 4, md: 8 }, px: { xs: 2, md: 3 } }}
			>
				{/* Story Section */}
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
									PerfectFooties is a handcrafted leather goods brand
									rooted in quality, precision, and lasting style.
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
								What began as a personal need for better, longer-lasting
								leather pieces has grown into a purpose-driven brand.
								Perfect Footies was built not just to make beautiful
								goods, but to create pieces that carry meaning — built
								to last, made to be worn, and designed to tell a story.
								From a single vision rooted in Lagos, the brand has
								steadily evolved into a craft house centred on quality,
								self-expression, and enduring style.
							</Typography>

							<Typography
								sx={{
									color: "var(--text-muted)",
									fontSize: "1.05rem",
									lineHeight: 1.9,
									mb: 3,
								}}
							>
								Every piece — whether a pair of shoes, a belt, a bag, or
								a wallet — is handcrafted with care and intention. We
								source quality leather, work with skilled hands, and
								take time with every stitch and edge. We believe that
								true craftsmanship cannot be rushed, and that the
								details are what set a piece apart from the ordinary.
							</Typography>

							<Typography
								sx={{
									color: "var(--text-muted)",
									fontSize: "1.05rem",
									lineHeight: 1.9,
									mb: 3,
								}}
							>
								Today, Perfect Footies offers a growing range of
								handmade leather goods — from custom shoes and boots to
								bags, belts, and accessories. Every order is a personal
								experience, because leather goods are more than fashion;
								they are character, utility, and craftsmanship expressed
								in the things you carry every day.
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
								Perfect Footies promise."
							</Typography>
						</ScrollReveal>
					</Grid>

					{/* Image Side */}
					<Grid item xs={12} md={6}>
						<ScrollReveal direction="right" delay={0.2}>
							<Box
								component="img"
								src={ceo?.photo}
								alt={ceo ? `${ceo.name}, ${ceo.role}` : "Founder & Creative Director"}
								sx={{
									width: "100%",
									borderRadius: 4,
									boxShadow: "0 16px 48px rgba(74,14,78,0.15)",
									objectFit: "cover",
									maxHeight: 550,
								}}
							/>
							<Box sx={{ mt: 2, textAlign: "center" }}>
								<Typography
									sx={{
										fontFamily: '"Georgia", serif',
										fontWeight: 700,
										fontSize: "1.1rem",
										color: "var(--text-main)",
									}}
								>
									Suliat Titilope Alaga
								</Typography>
								<Typography
									sx={{
										color: "var(--text-muted)",
										fontSize: "0.9rem",
										fontStyle: "italic",
									}}
								>
									Founder &amp; Creative Director
								</Typography>
							</Box>
						</ScrollReveal>
					</Grid>
				</Grid>

				{/* Our Team Section */}
				{/* <Box sx={{ mt: { xs: 8, md: 12 } }}>
          <ScrollReveal direction="up">
            <Box sx={{ textAlign: "center", mb: 6 }}>
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
                Our Team
              </Typography>
              <Typography
                sx={{
                  color: "var(--text-muted)",
                  fontSize: "1.05rem",
                  maxWidth: 560,
                  mx: "auto",
                  lineHeight: 1.8,
                }}
              >
                The people behind every handcrafted piece.
              </Typography>
            </Box>
          </ScrollReveal>

          <Grid container spacing={4} justifyContent="center">
            {visibleTeam.map((member, i) => (
              <Grid item xs={12} sm={6} md={4} key={member.id}>
                <ScrollReveal direction="up" delay={i * 0.08}>
                  <Box
                    sx={{
                      textAlign: "center",
                      p: 3,
                      borderRadius: 3,
                      border: "1px solid #E8D5B0",
                      backgroundColor: "var(--bg-card)",
                      transition: "box-shadow 0.3s",
                      "&:hover": {
                        boxShadow: "0 8px 24px rgba(0,0,0,0.08)",
                      },
                    }}
                  >
                    {member.photo ? (
                      <Box
                        component="img"
                        src={member.photo}
                        alt={member.name}
                        sx={{
                          width: 96,
                          height: 96,
                          borderRadius: "50%",
                          objectFit: "cover",
                          objectPosition: "top",
                          border: "3px solid #E8D5B0",
                          mb: 2,
                        }}
                      />
                    ) : (
                      <Avatar
                        sx={{
                          width: 96,
                          height: 96,
                          bgcolor: "#007a7a",
                          fontSize: "2rem",
                          fontFamily: '"Georgia", serif',
                          fontWeight: 700,
                          mx: "auto",
                          mb: 2,
                          border: "3px solid #E8D5B0",
                        }}
                      >
                        {getInitials(member.name)}
                      </Avatar>
                    )}
                    <Typography
                      sx={{
                        fontFamily: '"Georgia", serif',
                        fontWeight: 700,
                        fontSize: "1rem",
                        color: "var(--text-main)",
                        mb: 0.5,
                      }}
                    >
                      {member.name}
                    </Typography>
                    <Typography
                      sx={{
                        color: "var(--text-purple)",
                        fontSize: "0.85rem",
                        fontStyle: "italic",
                      }}
                    >
                      {member.role}
                    </Typography>
                    {member.bio && (
                      <Typography
                        sx={{
                          color: "var(--text-muted)",
                          fontSize: "0.82rem",
                          lineHeight: 1.7,
                          mt: 1.5,
                        }}
                      >
                        {member.bio}
                      </Typography>
                    )}
                  </Box>
                </ScrollReveal>
              </Grid>
            ))}
          </Grid>
        </Box> */}
			</Container>
		</Box>
	);
}
