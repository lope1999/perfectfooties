import { Box, Container, Typography, Grid, Card, CardContent, Divider } from '@mui/material';
import PaletteOutlinedIcon from '@mui/icons-material/PaletteOutlined';
import AutoFixHighOutlinedIcon from '@mui/icons-material/AutoFixHighOutlined';
import WaterDropOutlinedIcon from '@mui/icons-material/WaterDropOutlined';
import CleanHandsOutlinedIcon from '@mui/icons-material/CleanHandsOutlined';
import ContentCutOutlinedIcon from '@mui/icons-material/ContentCutOutlined';
import SpaOutlinedIcon from '@mui/icons-material/SpaOutlined';
import ScrollReveal from '../components/ScrollReveal';

const fontFamily = '"Georgia", serif';

const tips = [
	{
		icon: <PaletteOutlinedIcon sx={{ fontSize: "2rem", color: "#E91E8C" }} />,
		title: "Applying Your Press-Ons",
		color: "#FFF0F8",
		border: "#F0C0D0",
		steps: [
			"Clean your natural nails with alcohol or nail prep wipe to remove oils.",
			"Push back your cuticles gently.",
			"Select the correct size for each finger (snug fit, not too tight).",
			"Apply a thin layer of nail glue to the press-on, and your natural nail.",
			"Press firmly from the base down for 10–15 seconds per nail.",
			"Avoid water for at least 1–2 hours after application.",
		],
	},
	{
		icon: (
			<AutoFixHighOutlinedIcon sx={{ fontSize: "2rem", color: "#9C27B0" }} />
		),
		title: "Making Them Last Longer",
		color: "#F9F0FF",
		border: "#D9B3FF",
		steps: [
			"Avoid prolonged soaking in water (dishwashing, long baths).",
			"Wear rubber gloves when washing dishes or cleaning.",
			"Use the side of your fingers rather than nails to open things.",
			"Avoid picking or pulling at the edges if they start to lift.",
			"Apply a drop of glue under any lifting edge immediately.",
			"They typically last 1–3 weeks with good care.",
		],
	},
	{
		icon: (
			<WaterDropOutlinedIcon sx={{ fontSize: "2rem", color: "#2196F3" }} />
		),
		title: "Daily Nail Care",
		color: "#EFF6FF",
		border: "#BFDBFE",
		steps: [
			"Moisturise your cuticles daily with cuticle oil or hand cream.",
			"Keep hands hydrated — dry skin causes lifting.",
			"Avoid acetone-based products around the press-ons.",
			"Do not apply lotion or oil directly to the nail surface.",
			"Pat nails dry after washing; do not rub vigorously.",
		],
	},
	{
		icon: (
			<CleanHandsOutlinedIcon sx={{ fontSize: "2rem", color: "#E91E8C" }} />
		),
		title: "Safe Removal",
		color: "#FFF0F8",
		border: "#F0C0D0",
		steps: [
			"Never force or rip off press-ons — this damages your natural nail.",
			"Soak fingers in warm soapy water & any type of essential oils for 10–15 minutes to loosen glue.",
			"Alternatively, soak a cotton pad in acetone and hold over nail for 5 mins.",
			"Gently wiggle from the side using an orange stick or cuticle pusher.",
			"If resistance is felt, soak longer — do not force.",
			"Work slowly and patiently for a damage-free removal.",
		],
	},
	{
		icon: (
			<ContentCutOutlinedIcon sx={{ fontSize: "2rem", color: "#FF9800" }} />
		),
		title: "After Removal Care",
		color: "#FFFBEF",
		border: "#FFE082",
		steps: [
			"Buff away any remaining glue gently with a soft nail file.",
			"Wash hands thoroughly after using acetone.",
			"Apply cuticle oil generously to rehydrate nails and cuticles.",
			"Give your natural nails a 1–2 day break if they feel thin or sensitive.",
			"Apply a nail strengthener if your nails feel weak.",
		],
	},
	{
		icon: <SpaOutlinedIcon sx={{ fontSize: "2rem", color: "#4CAF50" }} />,
		title: "Nail Health Tips",
		color: "#F0FFF4",
		border: "#A7F3D0",
		steps: [
			"Keep natural nails trimmed and filed to avoid breakage under press-ons.",
			"A biotin supplement can help strengthen brittle nails over time.",
			"Stay hydrated — dehydration affects nail health.",
			"Never use press-ons over damaged, peeling, or infected nails.",
			"If you experience pain or unusual lifting, remove the nail gently.",
			"Allow nails to breathe naturally between sets.",
		],
	},
];

export default function NailCarePage() {
  return (
    <Box sx={{ minHeight: '100vh', background: 'linear-gradient(135deg, #FFF0F8 0%, #f8f4ff 50%, #FFF0F8 100%)', pb: 8 }}>
      {/* Hero */}
      <Box
        sx={{
          background: 'linear-gradient(135deg, #4A0E4E 0%, #7B1FA2 50%, #E91E8C 100%)',
          py: { xs: 6, md: 8 },
          textAlign: 'center',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Box
          sx={{
            position: 'absolute', inset: 0,
            backgroundImage: 'radial-gradient(circle at 20% 50%, rgba(255,255,255,0.05) 0%, transparent 50%), radial-gradient(circle at 80% 50%, rgba(255,255,255,0.05) 0%, transparent 50%)',
          }}
        />
        <Container maxWidth="md" sx={{ position: 'relative' }}>
          <Typography
            variant="h3"
            sx={{ fontFamily, fontWeight: 700, color: '#fff', mb: 1.5, fontSize: { xs: '1.8rem', md: '2.5rem' } }}
          >
            Nail Care Guide
          </Typography>
          <Typography
            sx={{ fontFamily, color: 'rgba(255,255,255,0.85)', fontSize: { xs: '0.95rem', md: '1.1rem' }, maxWidth: 520, mx: 'auto' }}
          >
            Everything you need to know to apply, maintain, and remove your press-ons safely — keeping your natural nails healthy and happy.
          </Typography>
        </Container>
      </Box>

      {/* Tips Grid */}
      <Container maxWidth="lg" sx={{ pt: 6 }}>
        <Grid container spacing={3}>
          {tips.map((tip, i) => (
            <Grid item xs={12} md={6} key={i}>
              <ScrollReveal>
                <Card
                  elevation={0}
                  sx={{
                    height: '100%',
                    borderRadius: 4,
                    border: `1.5px solid ${tip.border}`,
                    backgroundColor: tip.color,
                    transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                    '&:hover': { transform: 'translateY(-3px)', boxShadow: '0 8px 24px rgba(74,14,78,0.1)' },
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                      {tip.icon}
                      <Typography sx={{ fontFamily, fontWeight: 700, color: 'var(--text-purple)', fontSize: '1.05rem' }}>
                        {tip.title}
                      </Typography>
                    </Box>
                    <Divider sx={{ mb: 2, borderColor: tip.border }} />
                    <Box component="ol" sx={{ pl: 2.5, m: 0 }}>
                      {tip.steps.map((step, j) => (
                        <Box component="li" key={j} sx={{ mb: 1 }}>
                          <Typography sx={{ fontFamily, fontSize: '0.88rem', color: 'var(--text-main)', lineHeight: 1.6 }}>
                            {step}
                          </Typography>
                        </Box>
                      ))}
                    </Box>
                  </CardContent>
                </Card>
              </ScrollReveal>
            </Grid>
          ))}
        </Grid>

        {/* Bottom note */}
        <ScrollReveal>
          <Box
            sx={{
              mt: 5, p: 3, borderRadius: 4,
              background: 'linear-gradient(135deg, #4A0E4E 0%, #E91E8C 100%)',
              textAlign: 'center',
            }}
          >
            <Typography sx={{ fontFamily, fontWeight: 700, color: '#fff', mb: 1, fontSize: '1.05rem' }}>
              Need help or have questions?
            </Typography>
            <Typography sx={{ fontFamily, color: 'rgba(255,255,255,0.85)', fontSize: '0.9rem' }}>
              Reach us on WhatsApp at <strong>+234 905 371 4197</strong> — we're happy to guide you through your nail care journey.
            </Typography>
          </Box>
        </ScrollReveal>
      </Container>
    </Box>
  );
}
