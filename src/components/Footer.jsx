import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Box, Typography, Container, Grid, Link as MuiLink } from '@mui/material';
import TermsModal from './TermsModal';

const linkSx = {
  color: '#4A0E4E',
  fontSize: '0.9rem',
  cursor: 'pointer',
  transition: 'color 0.2s ease',
  display: 'block',
  mb: 1.2,
  textDecoration: 'none',
  '&:hover': {
    color: '#E91E8C',
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
			<Box sx={{ backgroundColor: "#FFC0CB", py: 6 }}>
				<Container maxWidth="lg">
					<Grid container spacing={4}>
						{/* Column 1 — Brand */}
						<Grid item xs={12} sm={6} md={3}>
							<Typography
								variant="h6"
								sx={{
									fontFamily: '"Georgia", serif',
									fontWeight: 700,
									color: "#2c2c2c",
									mb: 2,
								}}
							>
								Chizzystyles
							</Typography>
							<Typography
								sx={{
									color: "#4d0051",
									fontSize: "0.85rem",
									lineHeight: 1.7,
								}}
							>
								Chizzysnails is a refined nail brand rooted in Gloss and
								Grace - where clean structure meets detailed minimal
								artistry.
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
								Services
							</Typography>
							<MuiLink sx={linkSx} onClick={() => navigate("/services")}>
								Products Menu
							</MuiLink>
							<MuiLink sx={linkSx} onClick={() => navigate("/book")}>
								Book Appointment
							</MuiLink>
							<MuiLink sx={linkSx} onClick={() => navigate("/products")}>
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
								chizobaezeh338@gmail.com
							</Typography>
							<Typography
								sx={{ color: "#1b1b1b", fontSize: "0.9rem", mb: 0.8 }}
							>
								+234 905 371 419 7
							</Typography>
							<Typography sx={{ color: "#1e1e1e", fontSize: "0.9rem" }}>
								Abule egba, Lagos
							</Typography>
						</Grid>
					</Grid>

					{/* Copyright */}
					<Box
						sx={{
							borderTop: "1px solid rgba(74, 14, 78, 0.3)",
							mt: 5,
							pt: 3,
							textAlign: "center",
						}}
					>
						<Typography sx={{ color: "#4d0051", fontSize: "0.85rem" }}>
							&copy; 2026 Made by Chizzy'sstyles. All rights reserved.
						</Typography>
					</Box>
				</Container>
			</Box>

			<TermsModal open={termsOpen} onClose={() => setTermsOpen(false)} />
		</>
  );
}
