import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Box, Typography, Container, Grid, Link as MuiLink, IconButton } from '@mui/material';
import InstagramIcon from '@mui/icons-material/Instagram';
import YouTubeIcon from '@mui/icons-material/YouTube';
import MusicNoteIcon from '@mui/icons-material/MusicNote';
import TermsModal from './TermsModal';

const linkSx = {
  color: 'var(--text-purple)',
  fontSize: '0.9rem',
  cursor: 'pointer',
  transition: 'color 0.2s ease',
  display: 'block',
  mb: 1.2,
  textDecoration: 'none',
  '&:hover': {
    color: '#e3242b',
  },
};

export default function Footer() {
  const navigate = useNavigate();
  const location = useLocation();
  const [termsOpen, setTermsOpen] = useState(false);

  const handleContactClick = () => {
    if (location.pathname !== '/') {
      navigate('/');
      setTimeout(() => {
        document.getElementById('contact-section')?.scrollIntoView({ behavior: 'smooth' });
      }, 300);
    } else {
      document.getElementById('contact-section')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleFaqClick = () => {
    if (location.pathname !== '/') {
      navigate('/');
      setTimeout(() => {
        document.getElementById('faq-section')?.scrollIntoView({ behavior: 'smooth' });
      }, 300);
    } else {
      document.getElementById('faq-section')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
		<>
			<Box sx={{ backgroundColor: "#FFF8F0", borderTop: "1px solid #E8D5B0", py: 6 }}>
				<Container maxWidth="lg">
					<Grid container spacing={4}>
						{/* Column 1 — Brand */}
						<Grid item xs={12} sm={6} md={3}>
							<Box
								component="img"
								src="/images/logo.png"
								alt="PerfectFooties"
								sx={{
									height: 48,
									width: "auto",
									objectFit: "contain",
									mb: 2,
									display: "block",
								}}
							/>
							<Typography
								sx={{
									color: "var(--text-muted)",
									fontSize: "0.85rem",
									lineHeight: 1.7,
								}}
							>
								PerfectFooties crafts handmade leather goods built to last.
								From shoes to bags and accessories — every piece is made
								with care, precision, and a passion for quality craftsmanship.
							</Typography>
						</Grid>

						{/* Column 2 — Services */}
						<Grid item xs={6} sm={3} md={2}>
							<Typography
								sx={{
									fontFamily: '"Georgia", serif',
									fontWeight: 700,
									color: "#0e0e0e",
									mb: 2,
									fontSize: "0.95rem",
								}}
							>
								Shop
							</Typography>
							<MuiLink sx={linkSx} onClick={() => navigate("/shop")}>
								Shop
							</MuiLink>
							<MuiLink
								sx={linkSx}
								onClick={() => navigate("/gift-cards")}
							>
								Gift Cards
							</MuiLink>
						</Grid>

						{/* Column 3 — Company */}
						<Grid item xs={6} sm={3} md={2}>
							<Typography
								sx={{
									fontFamily: '"Georgia", serif',
									fontWeight: 700,
									color: "#151515",
									mb: 2,
									fontSize: "0.95rem",
								}}
							>
								Company
							</Typography>
							<MuiLink
								sx={linkSx}
								onClick={() => navigate("/our-story")}
							>
								Our Story
							</MuiLink>
							<MuiLink sx={linkSx} onClick={() => navigate("/our-team")}>
								Our Team
							</MuiLink>
							<MuiLink sx={linkSx} onClick={() => navigate("/blog")}>
								Blog
							</MuiLink>
							<MuiLink sx={linkSx} onClick={() => navigate("/gallery")}>
								Gallery
							</MuiLink>
							<MuiLink sx={linkSx} onClick={handleContactClick}>
								Contact
							</MuiLink>
						</Grid>

						{/* Column 4 — Support */}
						<Grid item xs={6} sm={3} md={2}>
							<Typography
								sx={{
									fontFamily: '"Georgia", serif',
									fontWeight: 700,
									color: "#1a1a1a",
									mb: 2,
									fontSize: "0.95rem",
								}}
							>
								Support
							</Typography>
							<MuiLink sx={linkSx} onClick={handleFaqClick}>
								FAQ
							</MuiLink>
<MuiLink sx={linkSx} onClick={() => setTermsOpen(true)}>
								T&C
							</MuiLink>
						</Grid>

						{/* Column 5 — Contact */}
						<Grid item xs={6} sm={3} md={3}>
							<Typography
								sx={{
									fontFamily: '"Georgia", serif',
									fontWeight: 700,
									color: "#1e1e1e",
									mb: 2,
									fontSize: "0.95rem",
								}}
							>
								Get in Touch
							</Typography>
							<Typography
								sx={{ color: "#1b1b1b", fontSize: "0.9rem", mb: 0.8 }}
							>
								perfect.footies@gmail.com
							</Typography>
							<Typography
								sx={{ color: "#1b1b1b", fontSize: "0.9rem", mb: 0.8 }}
							>
								0807 363 7911
							</Typography>
						</Grid>
					</Grid>

					{/* Social Icons + Copyright */}
					<Box
						sx={{
							borderTop: "1px solid rgba(0, 102, 102, 0.25)",
							mt: 5,
							pt: 3,
							textAlign: "center",
						}}
					>
						<Box
							sx={{
								display: "flex",
								justifyContent: "center",
								gap: 1,
								mb: 2,
							}}
						>
							<IconButton
								href="https://www.instagram.com/perfect.footies"
								target="_blank"
								sx={{
									color: "var(--text-purple)",
									"&:hover": { color: "#e3242b" },
								}}
							>
								<InstagramIcon />
							</IconButton>
							<IconButton
								href="https://tiktok.com/@perfectfooties"
								target="_blank"
								sx={{
									color: "var(--text-purple)",
									"&:hover": { color: "#e3242b" },
								}}
							>
								<MusicNoteIcon />
							</IconButton>
							<IconButton
								href="https://youtube.com/@perfectfooties"
								target="_blank"
								sx={{
									color: "var(--text-purple)",
									"&:hover": { color: "#e3242b" },
								}}
							>
								<YouTubeIcon />
							</IconButton>
						</Box>
						<Typography sx={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
							&copy; 2026 PerfectFooties. All rights reserved.
						</Typography>
					</Box>
				</Container>
			</Box>

			<TermsModal open={termsOpen} onClose={() => setTermsOpen(false)} />
		</>
  );
}
