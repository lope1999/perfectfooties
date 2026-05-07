import { useEffect, useState, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Container, Button, Divider, Chip,
  CircularProgress, Snackbar, Alert,
} from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import StoreIcon from '@mui/icons-material/Store';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import CardGiftcardIcon from '@mui/icons-material/CardGiftcard';
import LinkIcon from '@mui/icons-material/Link';
import ShoppingBagOutlinedIcon from '@mui/icons-material/ShoppingBagOutlined';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import StarOutlineIcon from '@mui/icons-material/StarOutline';
import EmailOutlinedIcon from '@mui/icons-material/EmailOutlined';
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import { fetchItems } from '../lib/collectionService';
import { sendConfirmationEmail } from '../lib/emailService';
import { generateReceiptHtml, openReceiptWindow } from '../lib/receiptTemplate';

const ff = '"Georgia", serif';

const ALL_COLLECTION_IDS = ['female-footwear', 'male-footwear', 'heirloom', 'bags-belts'];

function formatNaira(n) {
  return `₦${(n || 0).toLocaleString()}`;
}

function SummaryRow({ label, value, strike, icon: Icon }) {
  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 0.6 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
        {Icon && <Icon sx={{ fontSize: '0.85rem', color: 'var(--text-muted)' }} />}
        <Typography sx={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontFamily: ff }}>{label}</Typography>
      </Box>
      <Typography sx={{ fontSize: '0.84rem', fontWeight: 500, color: strike ? '#e3242b' : '#444', fontFamily: ff }}>
        {value}
      </Typography>
    </Box>
  );
}

function SuggestedItem({ item, collectionId, navigate }) {
  return (
    <Box
      onClick={() => navigate(`/shop/${collectionId}/${item.id}`)}
      sx={{
        flex: '0 0 160px', width: 160, borderRadius: 2, overflow: 'hidden',
        border: '1px solid #E8D5B0', backgroundColor: 'var(--bg-card)', cursor: 'pointer',
        transition: 'box-shadow 0.2s, transform 0.2s',
        '&:hover': { boxShadow: '0 4px 16px rgba(227,36,43,0.18)', transform: 'translateY(-2px)' },
      }}
    >
      <Box sx={{ height: 110, backgroundColor: 'var(--bg-soft)', overflow: 'hidden' }}>
        {item.images?.[0] ? (
          <Box component="img" src={item.images[0]} alt={item.name} sx={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        ) : (
          <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ShoppingBagOutlinedIcon sx={{ color: '#ddd', fontSize: 40 }} />
          </Box>
        )}
      </Box>
      <Box sx={{ p: 1.2 }}>
        <Typography sx={{ fontFamily: ff, fontWeight: 700, fontSize: '0.75rem', color: 'var(--text-main)', mb: 0.3, lineHeight: 1.3 }}>
          {item.name}
        </Typography>
        <Typography sx={{ fontFamily: ff, fontSize: '0.72rem', color: 'var(--text-purple)', fontWeight: 600 }}>
          {formatNaira(item.price)}
        </Typography>
      </Box>
    </Box>
  );
}

export default function ThankYouPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const state = location.state || (() => {
    try { return JSON.parse(sessionStorage.getItem('thankYouState') || '{}'); } catch { return {}; }
  })();
  const [show, setShow] = useState(false);
  const [waOpened, setWaOpened] = useState(false);
  const [emailSending, setEmailSending] = useState(false);
  const [emailSnack, setEmailSnack] = useState({ open: false, success: true });
  const [suggestions, setSuggestions] = useState([]);
  const [suggestColId, setSuggestColId] = useState('');

  const isReschedule = !!state.isReschedule;
  const isAppointment =
    isReschedule ||
    state.type === 'service' ||
    state.type === 'appointment' ||
    (state.appointmentDate && !state.items?.some?.((i) => i.kind !== 'service'));
  const isLeather = state.type === 'leather';

  const whatsappUrl = state.whatsappUrl || '';

  useEffect(() => {
    const t = setTimeout(() => setShow(true), 80);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    if (location.state && Object.keys(location.state).length > 0) {
      try { sessionStorage.setItem('thankYouState', JSON.stringify(location.state)); } catch {}
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-open WhatsApp only for appointments
  useEffect(() => {
    if (!whatsappUrl || waOpened || !isAppointment) return;
    const t = setTimeout(() => {
      window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
      setWaOpened(true);
    }, 600);
    return () => clearTimeout(t);
  }, [whatsappUrl, isAppointment]); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch "you might also like" items from a different collection
  useEffect(() => {
    const orderedColId = state.items?.find((i) => i.kind === 'leather')?.collectionId;
    const pool = ALL_COLLECTION_IDS.filter((id) => id !== orderedColId);
    const colId = pool[Math.floor(Math.random() * pool.length)];
    setSuggestColId(colId);
    fetchItems(colId)
      .then((items) => setSuggestions(items.filter((it) => it.status === 'open').slice(0, 4)))
      .catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleEmailReceipt = useCallback(async () => {
    if (!state.email) {
      setEmailSnack({ open: true, success: false });
      return;
    }
    setEmailSending(true);
    const result = await sendConfirmationEmail({
      id: state.orderId,
      customerName: state.customerName,
      email: state.email,
      items: state.items,
      total: state.finalTotal ?? state.total,
      shipping: state.shipping,
    });
    setEmailSending(false);
    setEmailSnack({ open: true, success: result.success });
  }, [state]);

  const handlePrintReceipt = () => {
    const shipping = state.shipping || {};
    const extraCharge = (state.items || []).reduce(
			(s, i) =>
				s +
				(i.surcharge ||
					(i.euSize && Number(i.euSize) >= 45
						? 2000 * Number(i.quantity || 1)
						: 0)),
			0,
		);
    const html = generateReceiptHtml({
			orderId: state.orderId,
			customerName: state.customerName,
			email: state.email,
			paymentReference: state.paymentReference,
			items: state.items || [],
			giftCardDiscount: state.giftCardDiscount || 0,
			referralDiscount: state.referralDiscount || 0,
			loyaltyDiscount: state.loyaltyDiscount || 0,
			tierDiscount: state.tierDiscount || 0,
			tierLabel: state.tierLabel || '',
			tierPerkText: state.tierPerkText || '',
			shipping,
			shippingFee: shipping.fee || 0,
			extraCharge,
			total: state.total,
			finalTotal: state.finalTotal,
			type: state.type,
			logoUrl: `${window.location.origin}/images/logo.png`,
		});
    openReceiptWindow(html);
  };

  // Derived values
  const customerName = state.customerName || '';
  const items = state.items || [];
  const total = state.total || 0;
  const finalTotal = state.finalTotal ?? total;
  const giftCardDiscount = state.giftCardDiscount || 0;
  const referralDiscount = state.referralDiscount || 0;
  const loyaltyDiscount = state.loyaltyDiscount || 0;
  const surchargeTotal = (state.items || []).reduce(
		(s, i) =>
			s +
			(i.surcharge ||
				(i.euSize && Number(i.euSize) >= 45
					? 2000 * Number(i.quantity || 1)
					: 0)),
		0,
  );
  const totalDiscount = giftCardDiscount + referralDiscount + loyaltyDiscount;
  const appointmentDate = state.appointmentDate || '';
  const depositAmount = state.depositAmount || 0;
  const serviceName = state.serviceName || items[0]?.serviceName || items[0]?.name || '';

  const cardSx = (delay = 0) => ({
    background: '#fff',
    borderRadius: 4,
    border: '1.5px solid #E8D5B0',
    p: 2.5,
    mb: 2.5,
    opacity: show ? 1 : 0,
    transform: show ? 'translateY(0)' : 'translateY(24px)',
    transition: `all 0.6s cubic-bezier(0.34,1.56,0.64,1) ${delay}s`,
  });

  return (
		<Box
			sx={{
				minHeight: "100vh",
				background:
					"linear-gradient(160deg, #fff8f0 0%, #f8f0ff 50%, #fff8f0 100%)",
				pt: { xs: 10, md: 12 },
				pb: { xs: 12, md: 8 },
			}}
		>
			<Container maxWidth="sm">
				{/* Hero success card */}
				<Box
					sx={{
						textAlign: "center",
						mb: 3,
						opacity: show ? 1 : 0,
						transform: show ? "translateY(0)" : "translateY(24px)",
						transition: "all 0.55s cubic-bezier(0.34,1.56,0.64,1)",
					}}
				>
					<Box
						sx={{
							width: 90,
							height: 90,
							borderRadius: "50%",
							background:
								"linear-gradient(135deg, rgba(227,36,43,0.1), rgba(184,27,33,0.06))",
							border: "2.5px solid rgba(227,36,43,0.5)",
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							mx: "auto",
							mb: 2,
							boxShadow: "0 8px 32px rgba(227,36,43,0.2)",
							animation: show
								? "pulse 2.5s ease-in-out infinite"
								: "none",
							"@keyframes pulse": {
								"0%, 100%": {
									boxShadow: "0 8px 32px rgba(227,36,43,0.2)",
								},
								"50%": { boxShadow: "0 8px 48px rgba(227,36,43,0.4)" },
							},
						}}
					>
						<CheckCircleOutlineIcon
							sx={{ fontSize: 52, color: "#e3242b" }}
						/>
					</Box>

					<Typography
						variant="h4"
						sx={{
							fontWeight: 800,
							fontFamily: ff,
							fontSize: { xs: "1.6rem", md: "2rem" },
							color: "#e3242b",
							mb: 0.5,
						}}
					>
						Order Placed!
					</Typography>
					<Typography
						sx={{
							fontSize: "0.92rem",
							color: "#777",
							px: 2,
							fontFamily: ff,
						}}
					>
						{customerName
							? `Thank you, ${customerName.split(" ")[0]}! We've received your order and our artisans will begin crafting your piece soon.`
							: `Thank you! We've received your order and will confirm via WhatsApp shortly.`}
					</Typography>
				</Box>

				{/* Summary card */}
				<Box
					sx={{
						background: "#fff",
						borderRadius: 4,
						border: "1.5px solid #E8D5B0",
						boxShadow: "0 4px 24px rgba(227,36,43,0.08)",
						overflow: "hidden",
						mb: 2.5,
						opacity: show ? 1 : 0,
						transform: show ? "translateY(0)" : "translateY(24px)",
						transition: "all 0.6s cubic-bezier(0.34,1.56,0.64,1) 0.1s",
					}}
				>
					<Box
						sx={{
							px: 2.5,
							py: 1.5,
							background:
								"linear-gradient(135deg, rgba(227,36,43,0.06), rgba(184,27,33,0.03))",
							borderBottom: "1px solid #E8D5B0",
							display: "flex",
							alignItems: "center",
							gap: 1,
						}}
					>
						<ShoppingBagOutlinedIcon
							sx={{ fontSize: 20, color: "#e3242b" }}
						/>
						<Typography
							sx={{
								fontWeight: 700,
								fontSize: "0.9rem",
								color: "var(--text-purple)",
								fontFamily: ff,
							}}
						>
							Order Summary
						</Typography>
					</Box>

					<Box sx={{ px: 2.5, py: 2 }}>
						{state.shipping?.shippingZone === 'pickup' && (
							<Box sx={{ mb: 1.5 }}>
								<Chip
									icon={<StoreIcon sx={{ fontSize: '15px !important' }} />}
									label="Pickup Order — No delivery fee"
									size="small"
									sx={{ backgroundColor: '#e8f5e9', color: '#2e7d32', fontWeight: 700, mb: 0.5 }}
								/>
								<Typography sx={{ fontSize: '0.78rem', color: '#888', mb: 1 }}>
									We'll contact you on WhatsApp when your order is ready for collection in Lagos.
								</Typography>
							</Box>
						)}
						{items.length > 0 ? (
							<Box sx={{ mb: 1.5 }}>
								{items.map((item, idx) => (
									<Box
										key={idx}
										sx={{ mb: idx < items.length - 1 ? 1.5 : 0 }}
									>
										<Box
											sx={{
												display: "flex",
												justifyContent: "space-between",
												alignItems: "flex-start",
											}}
										>
											<Box sx={{ flex: 1, pr: 1 }}>
												<Typography
													sx={{
														fontWeight: 600,
														fontSize: "0.88rem",
														color: "var(--text-main)",
														fontFamily: ff,
													}}
												>
													{item.serviceName || item.name || "Item"}
												</Typography>
												{item.selectedColor && (
													<Typography
														sx={{
															fontSize: "0.75rem",
															color: "#888",
															mt: 0.2,
															fontFamily: ff,
														}}
													>
														Colour: {item.selectedColor}
														{item.footLength
															? ` · Length: ${item.footLength}cm`
															: ""}
													</Typography>
												)}
												{item.selectedLength && (
													<Typography
														sx={{
															fontSize: "0.75rem",
															color: "#888",
															mt: 0.2,
														}}
													>
														Length: {item.selectedLength}
													</Typography>
												)}
												{item.quantity && item.quantity > 1 && (
													<Typography
														sx={{
															fontSize: "0.75rem",
															color: "#888",
															mt: 0.2,
														}}
													>
														Qty: {item.quantity}
													</Typography>
												)}
												{item.specialRequest && (
													<Chip
														label="Made to Order — 4–7 days"
														size="small"
														sx={{
															mt: 0.5,
															fontSize: "0.65rem",
															height: 18,
															backgroundColor: "#FFF8E1",
															color: "#B8860B",
															fontWeight: 700,
															border: "1px solid #FFD54F",
														}}
													/>
												)}
												{item.date && (
													<Box
														sx={{
															display: "flex",
															alignItems: "center",
															gap: 0.5,
															mt: 0.3,
														}}
													>
														<AccessTimeIcon
															sx={{
																fontSize: 13,
																color: "#e3242b",
															}}
														/>
														<Typography
															sx={{
																fontSize: "0.75rem",
																color: "var(--text-purple)",
																fontWeight: 600,
															}}
														>
															{item.date}
														</Typography>
													</Box>
												)}
											</Box>
											<Typography
												sx={{
													fontWeight: 600,
													fontSize: "0.88rem",
													color: "var(--text-main)",
													whiteSpace: "nowrap",
													fontFamily: ff,
												}}
											>
												{formatNaira(item.price)}
											</Typography>
										</Box>
										{idx < items.length - 1 && (
											<Divider
												sx={{ mt: 1.2, borderColor: "#E8D5B0" }}
											/>
										)}
									</Box>
								))}
							</Box>
						) : serviceName ? (
							<Box sx={{ mb: 1.5 }}>
								<Box
									sx={{
										display: "flex",
										justifyContent: "space-between",
									}}
								>
									<Typography
										sx={{
											fontWeight: 600,
											fontSize: "0.88rem",
											color: "var(--text-main)",
											fontFamily: ff,
										}}
									>
										{serviceName}
									</Typography>
									<Typography
										sx={{
											fontWeight: 600,
											fontSize: "0.88rem",
											color: "var(--text-main)",
											fontFamily: ff,
										}}
									>
										{formatNaira(total)}
									</Typography>
								</Box>
								{appointmentDate && (
									<Box
										sx={{
											display: "flex",
											alignItems: "center",
											gap: 0.5,
											mt: 0.4,
										}}
									>
										<AccessTimeIcon
											sx={{ fontSize: 13, color: "#e3242b" }}
										/>
										<Typography
											sx={{
												fontSize: "0.75rem",
												color: "var(--text-purple)",
												fontWeight: 600,
											}}
										>
											{appointmentDate}
										</Typography>
									</Box>
								)}
							</Box>
						) : null}

						<Divider sx={{ borderColor: "#E8D5B0", mb: 1.5 }} />

						{giftCardDiscount > 0 && (
							<SummaryRow
								icon={CardGiftcardIcon}
								label="Gift Card"
								value={`-${formatNaira(giftCardDiscount)}`}
								strike
							/>
						)}
						{referralDiscount > 0 && (
							<SummaryRow
								icon={LinkIcon}
								label="Referral Code"
								value={`-${formatNaira(referralDiscount)}`}
								strike
							/>
						)}
						{loyaltyDiscount > 0 && (
							<SummaryRow
								icon={StarOutlineIcon}
								label="Loyalty Points"
								value={`-${formatNaira(loyaltyDiscount)}`}
								strike
							/>
						)}
						{surchargeTotal > 0 && (
							<Box sx={{ mt: 1 }}>
								<SummaryRow
									label="Size surcharge"
									value={formatNaira(surchargeTotal)}
								/>
								<Divider sx={{ borderColor: "#E8D5B0", my: 1 }} />
							</Box>
						)}
						{totalDiscount > 0 && (
							<>
								<SummaryRow
									label="Subtotal"
									value={formatNaira(total + totalDiscount)}
								/>
								<SummaryRow
									label="Total Saved"
									value={`-${formatNaira(totalDiscount)}`}
									strike
								/>
								<Divider sx={{ borderColor: "#E8D5B0", my: 0.8 }} />
							</>
						)}
						<Box
							sx={{
								display: "flex",
								justifyContent: "space-between",
								alignItems: "center",
								mt: 0.5,
							}}
						>
							<Typography
								sx={{
									fontWeight: 800,
									fontSize: "1rem",
									color: "#1a1a1a",
									fontFamily: ff,
								}}
							>
								Total
							</Typography>
							<Typography
								sx={{
									fontWeight: 800,
									fontSize: "1.1rem",
									color: "var(--text-purple)",
									fontFamily: ff,
								}}
							>
								{formatNaira(finalTotal)}
							</Typography>
						</Box>
					</Box>
				</Box>

				{/* Order Progress Tracker */}
				{
					<Box sx={cardSx(0.15)}>
						<Typography
							sx={{
								fontWeight: 700,
								fontSize: "0.88rem",
								color: "var(--text-purple)",
								mb: 2,
								fontFamily: ff,
							}}
						>
							Order Progress
						</Typography>
						{(() => {
							const steps = [
								{ key: "pending", label: "Placed" },
								{ key: "confirmed", label: "Confirmed" },
								{ key: "production", label: "In Production" },
								{ key: "shipping", label: "Shipped" },
								{ key: "received", label: "Delivered" },
							];
							const activeIdx = 0;
							return (
								<>
									<Box sx={{ display: "flex", alignItems: "center" }}>
										{steps.map((step, idx) => (
											<Box
												key={step.key}
												sx={{
													display: "flex",
													alignItems: "center",
													flex: idx < steps.length - 1 ? 1 : 0,
												}}
											>
												<Box
													sx={{
														width: idx === activeIdx ? 14 : 10,
														height: idx === activeIdx ? 14 : 10,
														borderRadius: "50%",
														backgroundColor:
															idx <= activeIdx
																? "#e3242b"
																: "#e0e0e0",
														border:
															idx === activeIdx
																? "2px solid #b81b21"
																: "none",
														flexShrink: 0,
													}}
												/>
												{idx < steps.length - 1 && (
													<Box
														sx={{
															flex: 1,
															height: 2,
															backgroundColor:
																idx < activeIdx
																	? "#e3242b"
																	: "#e0e0e0",
															mx: 0.3,
														}}
													/>
												)}
											</Box>
										))}
									</Box>
									<Box sx={{ display: "flex", mt: 0.8 }}>
										{steps.map((step, idx) => (
											<Box
												key={step.key}
												sx={{
													flex: idx < steps.length - 1 ? 1 : 0,
													textAlign:
														idx === 0
															? "left"
															: idx === steps.length - 1
																? "right"
																: "center",
												}}
											>
												<Typography
													sx={{
														fontSize: "0.62rem",
														fontWeight:
															idx === activeIdx ? 700 : 400,
														color:
															idx <= activeIdx
																? "#e3242b"
																: "#aaa",
														lineHeight: 1.2,
														whiteSpace: "nowrap",
														fontFamily: ff,
													}}
												>
													{step.label}
												</Typography>
											</Box>
										))}
									</Box>
									<Typography
										sx={{
											fontSize: "0.72rem",
											color: "#888",
											mt: 1,
											textAlign: "center",
											fontFamily: ff,
										}}
									>
										{isLeather
											? "Handmade to order — 10–14 days production + 2–5 days shipping depending on location"
											: "We'll update your order as we prepare and dispatch your items."}
									</Typography>
								</>
							);
						})()}
					</Box>
				}

				{/* WhatsApp action section */}
				{whatsappUrl && (
					<Box
						sx={{
							...cardSx(0.2),
							background: "linear-gradient(135deg, #e8fff8, #f0fff8)",
							border: "1.5px solid rgba(37,211,102,0.35)",
						}}
					>
						<Typography
							sx={{
								fontWeight: 700,
								fontSize: "0.88rem",
								color: "var(--text-purple)",
								mb: 0.5,
								fontFamily: ff,
							}}
						>
							Send your order details to us on WhatsApp
						</Typography>
						<Typography
							sx={{
								fontSize: "0.78rem",
								color: "var(--text-muted)",
								mb: 1.5,
								fontFamily: ff,
							}}
						>
							Tap below to send your order summary to the PerfectFooties
							team so we can begin crafting your piece.
						</Typography>
						<Button
							fullWidth
							component="a"
							href={whatsappUrl}
							target="_blank"
							rel="noopener noreferrer"
							startIcon={<WhatsAppIcon />}
							sx={{
								py: 1.4,
								borderRadius: "50px",
								background: "linear-gradient(135deg, #25D366, #128C7E)",
								color: "#fff",
								fontWeight: 700,
								fontSize: "0.92rem",
								fontFamily: ff,
								textDecoration: "none",
								boxShadow: "0 4px 16px rgba(37,211,102,0.3)",
								"&:hover": {
									background:
										"linear-gradient(135deg, #1ebe5d, #0e7063)",
									boxShadow: "0 6px 20px rgba(37,211,102,0.45)",
								},
							}}
						>
							Send Order to WhatsApp
						</Button>
					</Box>
				)}

				{/* What happens next */}
				<Box sx={cardSx(0.25)}>
					<Typography
						sx={{
							fontWeight: 700,
							fontSize: "0.88rem",
							color: "var(--text-purple)",
							mb: 1.5,
							fontFamily: ff,
						}}
					>
						What happens next?
					</Typography>
					{[
						{
							icon: (
								<WhatsAppIcon sx={{ fontSize: 18, color: "#25D366" }} />
							),
							text: whatsappUrl
								? 'Tap "Send Order to WhatsApp" above to notify our team — they\'ll confirm production timelines and delivery.'
								: "You'll receive a WhatsApp message from us to confirm your order details.",
						},
						{
							icon: (
								<AccessTimeIcon
									sx={{ fontSize: 18, color: "#e3242b" }}
								/>
							),
							text: "Your handmade leather piece goes into production (10–14 days), then ships within 2–5 days depending on your location. We'll update your order status at each stage.",
						},
						{
							icon: (
								<StarOutlineIcon
									sx={{ fontSize: 18, color: "#FFB300" }}
								/>
							),
							text: "You'll earn loyalty points for this order once it's delivered — check your Account page.",
						},
					].map((step, i) => (
						<Box
							key={i}
							sx={{
								display: "flex",
								gap: 1.5,
								mb: i < 2 ? 1.2 : 0,
								alignItems: "flex-start",
							}}
						>
							<Box
								sx={{
									width: 32,
									height: 32,
									borderRadius: "50%",
									background: "rgba(227,36,43,0.08)",
									display: "flex",
									alignItems: "center",
									justifyContent: "center",
									flexShrink: 0,
									mt: 0.1,
								}}
							>
								{step.icon}
							</Box>
							<Typography
								sx={{
									fontSize: "0.8rem",
									color: "var(--text-muted)",
									lineHeight: 1.5,
									pt: 0.5,
									fontFamily: ff,
								}}
							>
								{step.text}
							</Typography>
						</Box>
					))}
				</Box>

				{/* Savings banner */}
				{totalDiscount > 0 && (
					<Box
						sx={{
							background: "linear-gradient(135deg, #FFF8E1, #FFF3CD)",
							border: "1.5px solid #FFD54F",
							borderRadius: 3,
							p: 1.5,
							mb: 2.5,
							display: "flex",
							alignItems: "center",
							gap: 1.5,
							opacity: show ? 1 : 0,
							transition: "opacity 0.7s 0.3s",
						}}
					>
						<LocalOfferIcon
							sx={{ fontSize: 22, color: "#F9A825", flexShrink: 0 }}
						/>
						<Box>
							<Typography
								sx={{
									fontWeight: 700,
									fontSize: "0.85rem",
									color: "#B8860B",
									fontFamily: ff,
								}}
							>
								You saved {formatNaira(totalDiscount)}!
							</Typography>
							<Typography
								sx={{
									fontSize: "0.74rem",
									color: "#888",
									fontFamily: ff,
								}}
							>
								Great job using your discounts on this order
							</Typography>
						</Box>
					</Box>
				)}

				{/* Quick actions row */}
				{
					<Box
						sx={{
							display: "flex",
							gap: 1.5,
							mb: 2.5,
							flexWrap: "wrap",
							opacity: show ? 1 : 0,
							transition: "opacity 0.7s 0.32s",
						}}
					>
						<Button
							onClick={handleEmailReceipt}
							disabled={emailSending}
							startIcon={
								emailSending ? (
									<CircularProgress
										size={14}
										sx={{ color: "#e3242b" }}
									/>
								) : (
									<EmailOutlinedIcon />
								)
							}
							sx={{
								flex: 1,
								minWidth: 130,
								py: 1,
								borderRadius: "50px",
								border: "1.5px solid #e3242b",
								color: "#e3242b",
								fontFamily: ff,
								fontWeight: 600,
								fontSize: "0.8rem",
								backgroundColor: "rgba(227,36,43,0.05)",
								"&:hover": { backgroundColor: "rgba(227,36,43,0.12)" },
							}}
						>
							{emailSending ? "Sending…" : "Email Receipt"}
						</Button>
						<Button
							onClick={handlePrintReceipt}
							startIcon={<DownloadOutlinedIcon />}
							sx={{
								flex: 1,
								minWidth: 130,
								py: 1,
								borderRadius: "50px",
								border: "1.5px solid #E8D5B0",
								color: "#555",
								fontFamily: ff,
								fontWeight: 600,
								fontSize: "0.8rem",
								"&:hover": { borderColor: "#e3242b", color: "#e3242b" },
							}}
						>
							Download Receipt
						</Button>
					</Box>
				}

				{/* You might also like */}
				{suggestions.length > 0 && (
					<Box
						sx={{
							mb: 2.5,
							opacity: show ? 1 : 0,
							transition: "opacity 0.8s 0.35s",
						}}
					>
						<Box
							sx={{
								display: "flex",
								justifyContent: "space-between",
								alignItems: "center",
								mb: 1.5,
							}}
						>
							<Typography
								sx={{
									fontFamily: ff,
									fontWeight: 700,
									fontSize: "0.95rem",
									color: "var(--text-main)",
								}}
							>
								You might also like
							</Typography>
							<Button
								endIcon={
									<ArrowForwardIosIcon
										sx={{ fontSize: "0.7rem !important" }}
									/>
								}
								onClick={() => navigate(`/shop/${suggestColId}`)}
								sx={{
									fontFamily: ff,
									fontSize: "0.75rem",
									color: "var(--text-purple)",
									textTransform: "none",
									p: 0,
									minWidth: 0,
									"&:hover": {
										background: "none",
										textDecoration: "underline",
									},
								}}
							>
								See all
							</Button>
						</Box>
						<Box
							sx={{
								display: "flex",
								gap: 1.5,
								overflowX: "auto",
								pb: 1,
								"&::-webkit-scrollbar": { display: "none" },
							}}
						>
							{suggestions.map((it) => (
								<SuggestedItem
									key={it.id}
									item={it}
									collectionId={suggestColId}
									navigate={navigate}
								/>
							))}
						</Box>
					</Box>
				)}

				{/* Action buttons */}
				<Box
					sx={{
						display: "flex",
						flexDirection: "column",
						gap: 1.5,
						opacity: show ? 1 : 0,
						transform: show ? "translateY(0)" : "translateY(16px)",
						transition: "all 0.7s cubic-bezier(0.34,1.56,0.64,1) 0.38s",
					}}
				>
					<Button
						fullWidth
						onClick={() => navigate("/shop")}
						sx={{
							py: 1.4,
							borderRadius: "50px",
							background: "linear-gradient(135deg, #e3242b, #b81b21)",
							color: "#fff",
							fontWeight: 700,
							fontSize: "0.9rem",
							fontFamily: ff,
							boxShadow: "0 4px 16px rgba(227,36,43,0.3)",
							"&:hover": {
								background: "linear-gradient(135deg, #c0181e, #8f1117)",
								boxShadow: "0 6px 20px rgba(227,36,43,0.4)",
							},
						}}
					>
						Continue Shopping
					</Button>
					<Button
						fullWidth
						onClick={() => navigate("/account")}
						sx={{
							py: 1.2,
							borderRadius: "50px",
							background: "transparent",
							color: "#888",
							fontWeight: 500,
							fontSize: "0.84rem",
							fontFamily: ff,
							border: "1.5px solid #E0E0E0",
							"&:hover": {
								background: "#FAFAFA",
								borderColor: "#e3242b",
							},
						}}
					>
						View My Account &amp; Orders
					</Button>
				</Box>
			</Container>

			<Snackbar
				open={emailSnack.open}
				autoHideDuration={4000}
				onClose={() => setEmailSnack((s) => ({ ...s, open: false }))}
				anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
			>
				<Alert
					severity={emailSnack.success ? "success" : "error"}
					sx={{ fontFamily: ff }}
				>
					{emailSnack.success
						? "Receipt emailed successfully!"
						: "Could not send email. Please try again."}
				</Alert>
			</Snackbar>
		</Box>
  );
}
