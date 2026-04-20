import { Box, Tooltip } from "@mui/material";
import WhatsAppIcon from "@mui/icons-material/WhatsApp";

export default function WhatsAppBubble() {
	const phone = "2348073637911";
	const message = encodeURIComponent(
		"Hi! I have a question about PerfectFooties",
	);

	return (
		<Tooltip title="Chat with us on WhatsApp" placement="left">
			<Box
				component="a"
				href={`https://api.whatsapp.com/send?phone=${phone}&text=${message}`}
				target="_blank"
				rel="noopener noreferrer"
				sx={{
					position: "fixed",
					bottom: { xs: 76, md: 28 }, // on mobile, above the bottom nav bar (which is 64px tall)
					right: { xs: 16, md: 24 },
					zIndex: 1300,
					width: 56,
					height: 56,
					borderRadius: "50%",
					backgroundColor: "#25D366",
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					boxShadow: "0 6px 26px rgba(37,211,102,0.45)",
					transition: "transform 0.2s ease, box-shadow 0.2s ease",
					textDecoration: "none",
					// Animations: bounce whole bubble and pulse the red dot
					"@keyframes wa-bounce": {
						"0%": { transform: "translateY(0)" },
						"30%": { transform: "translateY(-8px)" },
						"60%": { transform: "translateY(0)" },
						"100%": { transform: "translateY(0)" },
					},
					"@keyframes wa-pulse": {
						"0%": { transform: "scale(1)", opacity: 1 },
						"70%": { transform: "scale(1.6)", opacity: 0 },
						"100%": { transform: "scale(1.6)", opacity: 0 },
					},
					// subtle continuous bounce every 4s
					animation: "wa-bounce 4s ease-in-out infinite",
					"&:hover": {
						transform: "scale(1.08)",
						boxShadow: "0 8px 30px rgba(37,211,102,0.65)",
					},
				}}
			>
				<WhatsAppIcon sx={{ color: "#fff", fontSize: 28 }} />

				{/* Red notification dot */}
				<Box
					component="span"
					sx={{
						position: "absolute",
						top: 6,
						right: 6,
						width: 12,
						height: 12,
						borderRadius: "50%",
						backgroundColor: "#e3242b",
						border: "2px solid #fff",
						boxShadow: "0 4px 12px rgba(227,36,43,0.35)",
						"&::after": {
							content: '""',
							position: "absolute",
							left: "-6px",
							top: "-6px",
							width: 24,
							height: 24,
							borderRadius: "50%",
							backgroundColor: "#e3242b",
							opacity: 0.18,
							animation: "wa-pulse 1.8s ease-out infinite",
						},
					}}
				/>
			</Box>
		</Tooltip>
	);
}
