import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Container,
  Box,
  Button,
  Typography,
  Divider,
  CircularProgress,
  Card,
  styled,
} from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';
import EmailIcon from '@mui/icons-material/Email';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';

const MethodButton = styled(Card)(({ theme }) => ({
  padding: theme.spacing(4),
  borderRadius: theme.spacing(2),
  cursor: 'pointer',
  border: '2px solid transparent',
  transition: 'all 0.3s ease',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: theme.spacing(2),
  '&:hover': {
    borderColor: '#e3242b',
    boxShadow: '0 8px 24px rgba(227, 36, 43, 0.15)',
    transform: 'translateY(-4px)',
  },
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(3),
  },
}));

export default function AuthMethodPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signInWithGoogle } = useAuth();
  const { showToast } = useNotifications();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    try {
      const result = await signInWithGoogle();
      const name = result?.user?.displayName?.split(' ')[0] || 'back';
      showToast(`Welcome ${name}! You're now signed in.`, 'success');
      navigate(location.state?.from || '/account');
    } catch (error) {
      // User closed popup
      console.error(error);
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
		<Box
			sx={{
				pt: { xs: 12, md: 16 },
				pb: 10,
				minHeight: "100vh",
				backgroundColor: "var(--bg-page)",
			}}
		>
			<Container maxWidth="sm">
				<Typography
					variant="h4"
					sx={{
						fontFamily: '"Georgia", serif',
						fontWeight: 700,
						mb: 1,
						textAlign: "center",
						color: "var(--text-main)",
					}}
				>
					How would you like to Log in?
				</Typography>
				<Typography
					sx={{
						color: "var(--text-muted)",
						textAlign: "center",
						mb: 4,
						lineHeight: 1.6,
					}}
				>
					Choose your preferred sign-in method to access your
					PerfectFooties account.
				</Typography>

				<Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
					{/* Google Sign-In */}
					<MethodButton
						onClick={handleGoogleSignIn}
						disabled={isGoogleLoading}
					>
						{isGoogleLoading ? (
							<CircularProgress size={32} sx={{ color: "#e3242b" }} />
						) : (
							<>
								<GoogleIcon sx={{ fontSize: 48, color: "#1f2937" }} />
								<Typography
									variant="h6"
									sx={{
										fontFamily: '"Georgia", serif',
										fontWeight: 600,
										color: "var(--text-main)",
									}}
								>
									Continue with Google
								</Typography>
								<Typography
									sx={{
										fontSize: "0.875rem",
										color: "var(--text-muted)",
										textAlign: "center",
									}}
								>
									Fast and secure login with your Google account
								</Typography>
							</>
						)}
					</MethodButton>

					<Divider sx={{ my: 1 }}>
						<Typography
							sx={{ color: "var(--text-muted)", fontSize: "0.875rem" }}
						>
							OR
						</Typography>
					</Divider>

					{/* Email/Password Sign-In */}
					<MethodButton
						onClick={() => navigate("/login", { state: { from: location.state?.from } })}
						sx={{
							backgroundColor: "var(--bg-card)",
							border: "2px solid #E8D5B0",
							"&:hover": {
								borderColor: "#e3242b",
							},
						}}
					>
						<EmailIcon sx={{ fontSize: 48, color: "#e3242b" }} />
						<Typography
							variant="h6"
							sx={{
								fontFamily: '"Georgia", serif',
								fontWeight: 600,
								color: "var(--text-main)",
							}}
						>
							Continue with Email
						</Typography>
						<Typography
							sx={{
								fontSize: "0.875rem",
								color: "var(--text-muted)",
								textAlign: "center",
							}}
						>
							Sign in with your email and password
						</Typography>
					</MethodButton>
				</Box>

				{/* Don't have account? Sign up */}
				<Box sx={{ textAlign: "center", mt: 6 }}>
					<Typography sx={{ color: "var(--text-muted)", mb: 1 }}>
						Don't have an account?
					</Typography>
					<Button
						onClick={() => navigate("/signup")}
						sx={{
							color: "#e3242b",
							fontWeight: 600,
							textTransform: "none",
							fontSize: "1rem",
							"&:hover": {
								backgroundColor: "rgba(227, 36, 43, 0.08)",
							},
						}}
					>
						Sign up here
					</Button>
				</Box>
			</Container>
		</Box>
  );
}
