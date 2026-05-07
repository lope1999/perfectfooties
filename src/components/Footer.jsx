import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
	Box,
	Typography,
	Container,
	Grid,
	Link as MuiLink,
	IconButton,
	TextField,
	Button,
	CircularProgress,
	Snackbar,
	Alert,
} from "@mui/material";
import InstagramIcon from "@mui/icons-material/Instagram";
import FacebookIcon from "@mui/icons-material/Facebook";
import MusicNoteIcon from "@mui/icons-material/MusicNote";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import TermsModal from "./TermsModal";
import { db } from "../lib/firebase";
import {
	collection,
	addDoc,
	serverTimestamp,
	doc,
	getDoc,
	updateDoc,
} from "firebase/firestore";
import { useAuth } from "../context/AuthContext";
import { sendNewsletterWelcome } from "../lib/emailService";

const linkSx = {
	color: "var(--text-purple)",
	fontSize: "0.9rem",
	cursor: "pointer",
	transition: "color 0.2s ease",
	display: "block",
	mb: 1.2,
	textDecoration: "none",
	"&:hover": {
		color: "#e3242b",
	},
};

const isValidEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

export default function Footer() {
	const { user } = useAuth();
	const navigate = useNavigate();
	const location = useLocation();
	const [userSubscribed, setUserSubscribed] = useState(false);
	const [termsOpen, setTermsOpen] = useState(false);
	const [nlEmail, setNlEmail] = useState("");
	const [nlStatus, setNlStatus] = useState("idle"); // idle | loading | success | error | duplicate
	const [snackOpen, setSnackOpen] = useState(false);

	// If the user is logged in, check whether they're subscribed and hide the footer form
	useEffect(() => {
		let mounted = true;
		if (!user?.uid) return;
		(async () => {
			try {
				const userRef = doc(db, "users", user.uid);
				const usnap = await getDoc(userRef);
				if (usnap.exists() && usnap.data()?.newsletterSubscribed) {
					if (mounted) setUserSubscribed(true);
					return;
				}

			} catch (e) {
				// ignore
			}
		})();
		return () => {
			mounted = false;
		};
	}, [user]);

	const handleSubscribe = async () => {
		if (!isValidEmail(nlEmail)) return;
		setNlStatus("loading");
		try {
			const subsRef = collection(db, "subscribers");
			// Create subscriber record directly. Rules allow create without auth.
			await addDoc(subsRef, {
				email: nlEmail.toLowerCase(),
				subscribedAt: serverTimestamp(),
			});
			sendNewsletterWelcome(nlEmail).catch(() => {});
			setNlStatus("success");
			setNlEmail("");
			setSnackOpen(true);
		} catch {
			setNlStatus("error");
			setSnackOpen(true);
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

	const handleFaqClick = () => {
		if (location.pathname !== "/") {
			navigate("/");
			setTimeout(() => {
				document
					.getElementById("faq-section")
					?.scrollIntoView({ behavior: "smooth" });
			}, 300);
		} else {
			document
				.getElementById("faq-section")
				?.scrollIntoView({ behavior: "smooth" });
		}
	};

	return (
		<>
			<Box
				sx={{
					backgroundColor: "var(--bg-soft)",
					borderTop: "1px solid #E8D5B0",
					py: 6,
				}}
			>
				<Container maxWidth="lg">
					<Grid container spacing={4}>
						{/* Column 1 — Brand */}
						<Grid item xs={12} sm={6} md={3}>
							<Box
								sx={{
									display: "flex",
									alignItems: "center",
									gap: 1,
									mb: 2,
								}}
							>
								<Box
									component="img"
									src="/images/logo.png"
									alt="PerfectFooties"
									sx={{
										height: 80,
										width: "auto",
										objectFit: "contain",
										display: "block",
									}}
								/>
								<Typography
									sx={{
										fontFamily:
											'"Dancing Script", "Pacifico", cursive',
										fontSize: "1.5rem",
										fontWeight: 700,
										color: "#e3242b",
										lineHeight: 1,
										letterSpacing: "0.02em",
										userSelect: "none",
									}}
								>
									PerfectFooties
								</Typography>
							</Box>
							<Typography
								sx={{
									color: "var(--text-muted)",
									fontSize: "0.85rem",
									lineHeight: 1.7,
								}}
							>
								PerfectFooties crafts handmade leather goods built to
								last. From shoes to bags and accessories — every piece
								is made with care, precision, and a passion for quality
								craftsmanship.
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
							<MuiLink sx={linkSx} onClick={() => navigate("/testimonials")}>
								Testimonials
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
								perfectfooties@gmail.com
							</Typography>
							<Typography
								sx={{ color: "#1b1b1b", fontSize: "0.9rem", mb: 0.8 }}
							>
								0807 363 7911
							</Typography>
						</Grid>
					</Grid>

					{/* Newsletter */}
					<Box sx={{ borderTop: "1px solid #E8D5B0", mt: 5, pt: 4 }}>
						<Box
							sx={{
								maxWidth: 480,
								mx: "auto",
								textAlign: "center",
								mb: 3,
							}}
						>
							<Box
								sx={{
									display: "flex",
									alignItems: "center",
									justifyContent: "center",
									gap: 1,
									mb: 0.8,
								}}
							>
								<EmailOutlinedIcon
									sx={{ color: "var(--text-purple)", fontSize: 20 }}
								/>
								<Typography
									sx={{
										fontFamily: '"Georgia", serif',
										fontWeight: 700,
										fontSize: "1rem",
										color: "#0e0e0e",
									}}
								>
									Stay in the loop
								</Typography>
							</Box>
							<Typography
								sx={{
									color: "var(--text-muted)",
									fontSize: "0.85rem",
									mb: 2,
									lineHeight: 1.6,
								}}
							>
								New collections, exclusive deals, and behind-the-scenes
								stories — delivered to your inbox.
							</Typography>
							{!userSubscribed && nlStatus !== "success" ? (
								<Box
									sx={{
										display: "flex",
										gap: 1,
										maxWidth: 400,
										mx: "auto",
									}}
								>
									<TextField
										size="small"
										fullWidth
										placeholder="Your email address"
										value={nlEmail}
										onChange={(e) => setNlEmail(e.target.value)}
										onKeyDown={(e) =>
											e.key === "Enter" && handleSubscribe()
										}
										sx={{
											"& .MuiOutlinedInput-root": {
												borderRadius: "50px",
												fontSize: "0.85rem",
												"& fieldset": { borderColor: "#E8D5B0" },
												"&:hover fieldset": {
													borderColor: "var(--accent-cyan)",
												},
												"&.Mui-focused fieldset": {
													borderColor: "var(--accent-cyan)",
												},
											},
										}}
									/>
									<Button
										onClick={handleSubscribe}
										disabled={
											nlStatus === "loading" ||
											!isValidEmail(nlEmail)
										}
										sx={{
											borderRadius: "50px",
											px: 2.5,
											py: 1,
											backgroundColor: "var(--text-purple)",
											color: "#fff",
											fontFamily: '"Georgia", serif',
											fontWeight: 700,
											fontSize: "0.82rem",
											whiteSpace: "nowrap",
											"&:hover": {
												backgroundColor: "var(--accent-cyan-hover)",
											},
											"&.Mui-disabled": {
												backgroundColor: "#E8D5B0",
												color: "#fff",
											},
										}}
									>
										{nlStatus === "loading" ? (
											<CircularProgress
												size={16}
												sx={{ color: "#fff" }}
											/>
										) : (
											"Subscribe"
										)}
									</Button>
								</Box>
							) : (
								<Typography
									sx={{
										color: "var(--text-purple)",
										fontWeight: 700,
										fontSize: "0.88rem",
										fontFamily: '"Georgia", serif',
										display: "flex",
										alignItems: "center",
										gap: 0.5,
									}}
								>
									<CheckCircleOutlineIcon sx={{ fontSize: "1rem" }} />
									You're subscribed! Welcome to the PerfectFooties
									family.
								</Typography>
							)}
						</Box>
					</Box>

					{/* Social Icons + Copyright */}
					<Box
						sx={{
							borderTop: "1px solid rgba(0, 102, 102, 0.25)",
							mt: 2,
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
								href="https://www.tiktok.com/@perfect.footies?_r=1&_t=ZS-95ioxsOqw1F"
								target="_blank"
								sx={{
									color: "var(--text-purple)",
									"&:hover": { color: "#e3242b" },
								}}
							>
								<MusicNoteIcon />
							</IconButton>
							<IconButton
								href="https://www.facebook.com/perfect.footies"
								target="_blank"
								sx={{
									color: "var(--text-purple)",
									"&:hover": { color: "#e3242b" },
								}}
							>
								<FacebookIcon />
							</IconButton>
						</Box>
						<Typography
							sx={{ color: "var(--text-muted)", fontSize: "0.85rem" }}
						>
							&copy; 2026 PerfectFooties. All rights reserved.
						</Typography>
						<Typography sx={{ color: "#5e5e5e", fontSize: "0.70rem" }}>
							Designed with ♥ by Chizzy's Styles
						</Typography>
					</Box>
				</Container>
			</Box>

			<TermsModal open={termsOpen} onClose={() => setTermsOpen(false)} />

			<Snackbar
				open={snackOpen}
				autoHideDuration={4000}
				onClose={() => setSnackOpen(false)}
				anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
			>
				<Alert
					severity={
						nlStatus === "success"
							? "success"
							: nlStatus === "duplicate"
								? "info"
								: "error"
					}
					onClose={() => setSnackOpen(false)}
				>
					{nlStatus === "success"
						? "You're subscribed! Check your inbox."
						: nlStatus === "duplicate"
							? "This email is already subscribed."
							: "Something went wrong. Please try again."}
				</Alert>
			</Snackbar>
		</>
	);
}
