import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Typography,
  Container,
  Card,
  CardContent,
  Radio,
  RadioGroup,
  FormControlLabel,
  Collapse,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  IconButton,
} from '@mui/material';
import EventNoteIcon from '@mui/icons-material/EventNote';
import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined';
import { serviceCategories, nailLengths, removalNote } from '../data/services';
import useServiceDiscounts from '../hooks/useServiceDiscounts';
import { hasServiceDiscount, getServiceEffectivePrice, getServiceDiscountLabel } from '../lib/discountUtils';
import ScrollReveal from '../components/ScrollReveal';
import NailShapeSelector from '../components/NailShapeSelector';
import NailLengthSelector from '../components/NailLengthSelector';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { saveOrder } from '../lib/orderService';
import { fetchBookedSlots, saveBookedSlot, addToWaitlist } from '../lib/bookedSlotsService';
import SignInPrompt from '../components/SignInPrompt';
import CalendarWidget from '../components/CalendarWidget';
import { verifyPaystackDeposit } from '../lib/paymentService';
import { validateReferralCode, applyReferral, REFERRAL_DISCOUNT, getLoyaltyData, redeemLoyaltyPoints, REDEMPTION_UNIT, REDEMPTION_VALUE, getPendingLoyaltyReward, clearPendingLoyaltyReward } from '../lib/loyaltyService';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import StarIcon from '@mui/icons-material/Star';

function formatNaira(amount) {
  return `₦${amount.toLocaleString()}`;
}

const confirmButtonSx = {
  border: '2px solid #E91E8C',
  borderRadius: '30px',
  color: '#000',
  backgroundColor: 'transparent',
  px: 5,
  py: 1.5,
  fontSize: '1rem',
  fontFamily: '"Georgia", serif',
  fontWeight: 600,
  transition: 'all 0.3s ease',
  '&:hover': {
    backgroundColor: '#E91E8C',
    color: '#fff',
    borderColor: '#E91E8C',
  },
};

const textFieldSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: 2,
    '& fieldset': { borderColor: '#F0C0D0' },
    '&:hover fieldset': { borderColor: '#E91E8C' },
    '&.Mui-focused fieldset': { borderColor: '#E91E8C' },
  },
};


export default function BookAppointmentPage() {
	const navigate = useNavigate();
	const location = useLocation();
	const { addService: addServiceToCart } = useCart();
	const homeServiceEnabled = true; // Set to false to hide home service option
	const { user } = useAuth();
	const { discounts } = useServiceDiscounts();
	const { showToast } = useNotifications();
	const [customerName, setCustomerName] = useState("");
	const [signInPromptOpen, setSignInPromptOpen] = useState(false);

	useEffect(() => {
		if (user?.displayName && !customerName) setCustomerName(user.displayName);
	}, [user]);

	useEffect(() => {
		const categoryId = location.state?.categoryId;
		if (categoryId) {
			const timer = setTimeout(() => {
				document
					.getElementById(categoryId)
					?.scrollIntoView({ behavior: "smooth", block: "center" });
			}, 300);
			return () => clearTimeout(timer);
		}
	}, [location.state]);

	const [appointmentType, setAppointmentType] = useState("salon");
	const [selectedService, setSelectedService] = useState("");
	const [appointmentDate, setAppointmentDate] = useState("");
	const [appointmentTime, setAppointmentTime] = useState("");
	const [formData, setFormData] = useState({
		nailShape: "",
		nailLength: "",
	});

	// Home service — transport cost ranges (final cost confirmed at booking)
	const HOME_TRANSPORT_COSTS = {
		"Lagos Island": { min: 15000, max: 20000 },
		"Lagos Mainland": { min: 10000, max: 15000 },
	};
	const [homeAddress, setHomeAddress] = useState("");
	const [hasTableArea, setHasTableArea] = useState("");
	const [homeLocation, setHomeLocation] = useState("");
	const transportRange = homeLocation
		? HOME_TRANSPORT_COSTS[homeLocation]
		: null;

	const [paymentModalOpen, setPaymentModalOpen] = useState(false);
	const [homeDetailsModalOpen, setHomeDetailsModalOpen] = useState(false);
	const [pendingAction, setPendingAction] = useState(null); // 'confirm' | 'cart'
	const [bookedSlots, setBookedSlots] = useState([]);
	const [slotsLoading, setSlotsLoading] = useState(false);
	const [waitlistDialog, setWaitlistDialog] = useState(false);
	const [waitlistDate, setWaitlistDate] = useState('');
	const [waitlistName, setWaitlistName] = useState('');
	const [waitlistPhone, setWaitlistPhone] = useState('');
	const [waitlistSubmitting, setWaitlistSubmitting] = useState(false);
	const [waitlistSuccess, setWaitlistSuccess] = useState(false);
	const [calendarModalOpen, setCalendarModalOpen] = useState(false);

	// Referral code
	const [showRefField, setShowRefField] = useState(false);
	const [refCodeInput, setRefCodeInput] = useState('');
	const [referralValid, setReferralValid] = useState(false);
	const [referralChecking, setReferralChecking] = useState(false);
	const [referralMsg, setReferralMsg] = useState('');
	// Loyalty points
	const [loyaltyBalance, setLoyaltyBalance] = useState(0);
	const [loyaltyUnits, setLoyaltyUnits] = useState(0);
	const [pendingReward] = useState(() => getPendingLoyaltyReward());

	// Load loyalty balance + validate referral code from URL
	useEffect(() => {
		if (!user) return;
		getLoyaltyData(user.uid).then((d) => { const pts = d.loyaltyPoints || 0; setLoyaltyBalance(pts); const pr = getPendingLoyaltyReward(); if (pr && pr.units > 0) setLoyaltyUnits(Math.min(pr.units, Math.floor(pts / REDEMPTION_UNIT))); }).catch(() => {});
		const pending = sessionStorage.getItem('pendingReferralCode');
		if (pending) {
			setRefCodeInput(pending);
			setShowRefField(true);
			validateReferralCode(pending).then((referrerUid) => {
				const valid = !!referrerUid && referrerUid !== user.uid;
				setReferralValid(valid);
				setReferralMsg(valid ? '₦1,000 off applied!' : '');
			}).catch(() => {});
		}
	}, [user]);

	// Load Paystack inline script
	useEffect(() => {
		if (document.getElementById('paystack-js')) return;
		const s = document.createElement('script');
		s.id = 'paystack-js';
		s.src = 'https://js.paystack.co/v1/inline.js';
		s.async = true;
		document.body.appendChild(s);
	}, []);

	useEffect(() => {
		if (!appointmentDate || !isWeekend(appointmentDate)) {
			setBookedSlots([]);
			return;
		}
		setSlotsLoading(true);
		fetchBookedSlots(formatDate(appointmentDate))
			.then((slots) => {
				setBookedSlots(slots);
				setAppointmentTime((prev) => (slots.includes(prev) ? "" : prev));
			})
			.catch(() => setBookedSlots([]))
			.finally(() => setSlotsLoading(false));
	}, [appointmentDate]);

	const allServices = serviceCategories.flatMap((cat) =>
		cat.services.map((s) => ({ ...s, category: cat.title })),
	);

	const selectedServiceObj = allServices.find((s) => s.id === selectedService);
	const fullPrice = selectedServiceObj ? getServiceEffectivePrice(selectedServiceObj, discounts) : 0;
	const maxLoyaltyUnits = Math.floor(loyaltyBalance / REDEMPTION_UNIT);
	const referralDiscount = referralValid ? Math.min(REFERRAL_DISCOUNT, fullPrice) : 0;
	const loyaltyDiscount = Math.min(loyaltyUnits * REDEMPTION_VALUE, Math.max(0, fullPrice - referralDiscount));
	const finalBookingPrice = Math.max(0, fullPrice - referralDiscount - loyaltyDiscount);
	const depositAmount = Math.round(finalBookingPrice * 0.5);

	const handleApplyReferral = async () => {
		if (!refCodeInput.trim()) return;
		if (!user) { setSignInPromptOpen(true); return; }
		setReferralChecking(true); setReferralMsg('');
		try {
			const referrerUid = await validateReferralCode(refCodeInput.trim());
			const valid = !!referrerUid && referrerUid !== user.uid;
			setReferralValid(valid);
			setReferralMsg(valid ? '₦1,000 off applied!' : 'Code not found or not applicable');
		} catch { setReferralValid(false); setReferralMsg('Could not validate'); }
		finally { setReferralChecking(false); }
	};

	// Get tomorrow's date as minimum selectable date
	const getMinDate = () => {
		const tomorrow = new Date();
		tomorrow.setDate(tomorrow.getDate() + 1);
		return tomorrow.toISOString().split("T")[0];
	};

	const isWeekend = (dateString) => {
		if (!dateString) return true;
		const day = new Date(dateString).getDay();
		return day === 0 || day === 6; // Sunday or Saturday
	};

	const formatDate = (dateString) => {
		if (!dateString) return "";
		const date = new Date(dateString);
		return date.toLocaleDateString("en-GB", {
			weekday: "long",
			day: "numeric",
			month: "long",
			year: "numeric",
		});
	};

	const handleServiceChange = (event) => {
		setSelectedService(event.target.value);
		setFormData({ nailShape: "", nailLength: "" });
	};

	const handleFieldChange = (field) => (event) => {
		setFormData((prev) => ({ ...prev, [field]: event.target.value }));
	};

	const handleJoinWaitlist = async () => {
		setWaitlistSubmitting(true);
		try {
			await addToWaitlist({
				date: waitlistDate,
				name: waitlistName.trim(),
				phone: waitlistPhone.trim(),
				email: user?.email || '',
				uid: user?.uid || '',
			});
			setWaitlistSuccess(true);
		} catch (_) {
			// Still show success to not frustrate user
			setWaitlistSuccess(true);
		} finally {
			setWaitlistSubmitting(false);
		}
	};

	const handleConfirmBooking = () => {
		if (!user) {
			setSignInPromptOpen(true);
			return;
		}
		if (appointmentType === "home") {
			setPendingAction("confirm");
			setHomeDetailsModalOpen(true);
			return;
		}
		setPaymentModalOpen(true);
	};

	const handleHomeDetailsSubmit = () => {
		setHomeDetailsModalOpen(false);
		if (pendingAction === "confirm") {
			setPaymentModalOpen(true);
		} else if (pendingAction === "cart") {
			executeAddToCart();
		}
		setPendingAction(null);
	};

	const handleCompleteOrder = (paymentReference = '') => {
		setPaymentModalOpen(false);
		const selected = allServices.find((s) => s.id === selectedService);
		const fullDate = `${formatDate(appointmentDate)} at ${appointmentTime}`;
		const effectivePrice = selected
			? getServiceEffectivePrice(selected, discounts)
			: 0;
		const transportRangeStr = transportRange
			? `${formatNaira(transportRange.min)} – ${formatNaira(transportRange.max)}`
			: "";
		const homeServiceInfo =
			appointmentType === "home"
				? `\n\nHome Service Details:\n- Address: ${homeAddress}\n- Table Area: ${hasTableArea}\n- Location: ${homeLocation}\n- Est. Transport Fee: ${transportRangeStr} (confirmed on booking)`
				: "";
		const depositInfo = paymentReference
			? `\n\n✅ Deposit Paid: ${formatNaira(depositAmount)} (Paystack Ref: ${paymentReference})`
			: `\n\n⚠️ Deposit: To be paid via WhatsApp`;
		const discountLines = [];
		if (referralDiscount > 0) discountLines.push(`- Referral Code (${refCodeInput}): -${formatNaira(referralDiscount)}`);
		if (loyaltyDiscount > 0) discountLines.push(`- Loyalty Points (${loyaltyUnits * REDEMPTION_UNIT} pts): -${formatNaira(loyaltyDiscount)}`);
		const discountStr = discountLines.length > 0 ? `\n\nDiscounts:\n${discountLines.join('\n')}\nFinal Price: ${formatNaira(finalBookingPrice)}` : '';
		const message = `Hi! I'd like to book an appointment.\n\nName: ${customerName}\nType: ${appointmentType === "home" ? "Home Service" : "Salon Visit"}\nPreferred Date: ${fullDate}\nService: ${selected?.name || "a service"}\nPrice: ${formatNaira(effectivePrice)}${discountStr}${depositInfo}${homeServiceInfo}\n\nDetails:\n- Nail Shape: ${formData.nailShape}\n- Nail Length: ${formData.nailLength}\n\nPlease confirm availability for this request. Thank you!`;
		const encoded = encodeURIComponent(message);
		window.open(
			`https://api.whatsapp.com/send?phone=2349053714197&text=${encoded}`,
			"_blank",
		);

		if (user) {
			saveOrder(user.uid, {
				type: "service",
				total: effectivePrice,
				customerName: customerName.trim(),
				email: user.email || "",
				appointmentDate: fullDate,
				...(paymentReference && { depositPaid: true, paymentReference }),
				...(appointmentType === "home" && {
					isHomeService: true,
					homeLocation,
					homeAddress: homeAddress.trim(),
					hasTableArea,
					transportRange: transportRangeStr,
				}),
				items: [
					{
						kind: "service",
						serviceName: selected?.name || "",
						price: effectivePrice,
						date: fullDate,
						nailShape: formData.nailShape,
						nailLength: formData.nailLength,
						...(appointmentType === "home" && {
							isHomeService: true,
							homeLocation,
							homeAddress: homeAddress.trim(),
							hasTableArea,
							transportRange: transportRangeStr,
						}),
					},
				],
			})
				.then((orderRef) => {
					saveBookedSlot({
						date: formatDate(appointmentDate),
						time: appointmentTime,
						orderId: orderRef.id,
						uid: user.uid,
					}).catch(() => {});
					if (paymentReference) {
						verifyPaystackDeposit({ reference: paymentReference, orderId: orderRef.id, uid: user.uid }).catch(() => {});
					}
					if (referralValid && refCodeInput) {
						applyReferral(refCodeInput.trim(), user.uid).catch(() => {});
						sessionStorage.removeItem('pendingReferralCode');
					}
					if (loyaltyUnits > 0) {
						redeemLoyaltyPoints(user.uid, loyaltyUnits * REDEMPTION_UNIT).catch(() => {});
			clearPendingLoyaltyReward();
					}
				})
				.catch(() => {});
		}

		navigate("/thank-you", {
			state: {
				type: "service",
				customerName,
				serviceName: selected?.name || "",
				appointmentDate: fullDate,
				total: effectivePrice,
				finalTotal: finalBookingPrice,
				referralDiscount,
				loyaltyDiscount,
				depositAmount,
				items: [{
					kind: "service",
					serviceName: selected?.name || "",
					price: finalBookingPrice,
					date: fullDate,
					nailShape: formData.nailShape,
					nailLength: formData.nailLength,
				}],
			},
		});
	};

	const payWithPaystack = () => {
		const pk = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_PAYSTACK_PUBLIC_KEY) || '';
		if (!pk || !window.PaystackPop) {
			handleCompleteOrder('');
			return;
		}
		const handler = window.PaystackPop.setup({
			key: pk,
			email: user?.email || 'guest@chizzys.com',
			amount: depositAmount * 100,
			currency: 'NGN',
			ref: `CHIZZYS-${Date.now()}`,
			metadata: { serviceName: selectedServiceObj?.name || '', appointmentDate, appointmentTime },
			callback: (response) => {
				setPaymentModalOpen(false);
				handleCompleteOrder(response.reference);
			},
			onClose: () => {},
		});
		handler.openIframe();
	};

	const executeAddToCart = () => {
		const selected = allServices.find((s) => s.id === selectedService);
		if (!selected) return;
		const fullDate = `${formatDate(appointmentDate)} at ${appointmentTime}`;
		const effectivePrice = getServiceEffectivePrice(selected, discounts);
		addServiceToCart({
			serviceId: selected.id,
			name: selected.name,
			price: effectivePrice,
			originalPrice: hasServiceDiscount(selected.id, discounts)
				? selected.price
				: undefined,
			discountLabel: hasServiceDiscount(selected.id, discounts)
				? getServiceDiscountLabel(selected.id, discounts)
				: undefined,
			date: fullDate,
			nailShape: formData.nailShape,
			nailLength: formData.nailLength,
			customerName: customerName.trim(),
			...(appointmentType === "home" && {
				isHomeService: true,
				homeAddress: homeAddress.trim(),
				hasTableArea,
				homeLocation,
				transportRange: transportRange
					? `${formatNaira(transportRange.min)} – ${formatNaira(transportRange.max)}`
					: "",
			}),
		});
		showToast(`${selected.name} added to cart`, 'success');
		setSelectedService("");
		setAppointmentDate("");
		setAppointmentTime("");
		setFormData({ nailShape: "", nailLength: "" });
		if (appointmentType === "home") {
			setHomeAddress("");
			setHasTableArea("");
			setHomeLocation("");
		}
	};

	const handleAddToCart = () => {
		if (!user) {
			setSignInPromptOpen(true);
			return;
		}
		if (appointmentType === "home") {
			setPendingAction("cart");
			setHomeDetailsModalOpen(true);
			return;
		}
		executeAddToCart();
	};

	const isFormValid =
		customerName.trim() &&
		appointmentDate &&
		isWeekend(appointmentDate) &&
		appointmentTime &&
		selectedService &&
		formData.nailShape &&
		formData.nailLength;

	const isHomeDetailsValid =
		homeAddress.trim() && hasTableArea && homeLocation;

	return (
		<Box sx={{ pt: { xs: 7, md: 8 } }}>
			{/* Interstitial banner at top */}
			{/* <Interstitial
        image="https://images.unsplash.com/photo-1604654894610-df63bc536371?w=1920&q=80"
        text="Hope it's great so far"
        overlayColor="rgba(233, 30, 140, 0.45)"
      /> */}

			<Box sx={{ py: 8, backgroundColor: "#FFF0F5" }}>
				<Container maxWidth="md">
					{/* Header */}
					<ScrollReveal direction="up">
						<Box sx={{ textAlign: "center", mb: 5 }}>
							<Typography
								variant="h3"
								sx={{
									fontFamily: '"Georgia", serif',
									fontWeight: 700,
									color: "#000",
									mb: 2,
									fontSize: { xs: "1.8rem", sm: "2.4rem", md: "3rem" },
								}}
							>
								Book Appointment
							</Typography>
							<Typography
								sx={{
									color: "#555",
									fontSize: "1.05rem",
									maxWidth: 500,
									mx: "auto",
								}}
							>
								Select a service below, customize your preferences, and
								confirm your booking. We will connect you with a stylist
								on WhatsApp.
							</Typography>
							<Typography
								sx={{ color: "#7a0064", fontSize: "0.9rem", mt: 2 }}
							>
								Note: Appointments are only available on Saturdays and
								Sundays (12-6 PM). Please book at least 24 hours in
								advance.{" "}
							</Typography>
							<Box
								sx={{
									mt: 3,
									mx: "auto",
									maxWidth: 520,
									p: 2,
									borderRadius: 2,
									backgroundColor: "#FCE4EC",
									border: "1px solid #F0C0D0",
								}}
							>
								<Typography
									sx={{
										fontSize: "0.85rem",
										color: "#4A0E4E",
										fontWeight: 600,
										lineHeight: 1.6,
									}}
								>
									Booking Policy: A 50% non-refundable deposit is
									required to confirm your appointment. This covers
									material preparation and secures your time slot. The
									remaining balance is due on the day of your
									appointment.
								</Typography>
							</Box>
							<Box
								sx={{
									mt: 2,
									mx: "auto",
									maxWidth: 520,
									p: 2,
									borderRadius: 2,
									backgroundColor: "#FFF8E1",
									border: "1px solid #FFD54F",
								}}
							>
								<Typography
									sx={{
										fontSize: "0.85rem",
										color: "#5D4037",
										fontWeight: 600,
										lineHeight: 1.6,
									}}
								>
									{removalNote}
								</Typography>
							</Box>
						</Box>
					</ScrollReveal>

					{/* Appointment Type */}
					<ScrollReveal direction="up" delay={0.15}>
						<Box sx={{ mb: 3 }}>
							<Typography
								sx={{
									fontFamily: '"Georgia", serif',
									fontWeight: 700,
									color: "#4A0E4E",
									mb: 1,
									fontSize: "1.05rem",
								}}
							>
								Appointment Type
							</Typography>
							<Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap" }}>
								<Box
									onClick={() => setAppointmentType("salon")}
									sx={{
										border:
											appointmentType === "salon"
												? "2px solid #E91E8C"
												: "2px solid #F0C0D0",
										borderRadius: 2,
										px: 2.5,
										py: 1.2,
										cursor: "pointer",
										backgroundColor:
											appointmentType === "salon"
												? "#FFF0F5"
												: "#fff",
										transition: "all 0.2s ease",
										"&:hover": { borderColor: "#E91E8C" },
									}}
								>
									<Typography
										sx={{
											fontFamily: '"Georgia", serif',
											fontWeight: 600,
											fontSize: "0.9rem",
											color:
												appointmentType === "salon"
													? "#E91E8C"
													: "#333",
										}}
									>
										Salon Service
									</Typography>
									<Typography
										sx={{ fontSize: "0.75rem", color: "#777" }}
									>
										Visit us at our studio
									</Typography>
								</Box>
								<Box
									sx={{
										border: "2px dashed #ddd",
										borderRadius: 2,
										px: 2.5,
										py: 1.2,
										opacity: 0.5,
										cursor: "not-allowed",
									}}
								>
									<Typography sx={{ fontFamily: '"Georgia", serif', fontWeight: 600, fontSize: "0.9rem", color: "#999" }}>
										Home Service
									</Typography>
									<Typography sx={{ fontSize: "0.75rem", color: "#aaa" }}>
										Coming Soon
									</Typography>
								</Box>
							</Box>
						</Box>
					</ScrollReveal>

					{/* Sticky Name Field */}
					<Box
						sx={{
							position: "sticky",
							top: { xs: 56, md: 64 },
							zIndex: 10,
							backgroundColor: "#FFF0F5",
							pb: 2,
							pt: 1,
							mb: 2,
						}}
					>
						<Typography
							sx={{
								fontFamily: '"Georgia", serif',
								fontWeight: 700,
								color: "#4A0E4E",
								mb: 1,
								fontSize: "1.05rem",
							}}
						>
							Your Name
						</Typography>
						<TextField
							fullWidth
							placeholder="Enter your full name"
							value={customerName}
							onChange={(e) => setCustomerName(e.target.value)}
							size="small"
							sx={textFieldSx}
						/>

					</Box>

					{/* Calendar Date + Time Selection — compact field */}
					<Box sx={{ mb: 3 }}>
						<Typography sx={{ fontFamily: '"Georgia", serif', fontWeight: 700, color: '#4A0E4E', mb: 1, fontSize: '1.05rem' }}>
							Preferred Date &amp; Time
						</Typography>
						<Box
							onClick={() => setCalendarModalOpen(true)}
							sx={{
								display: 'flex',
								alignItems: 'center',
								gap: 1.5,
								px: 2,
								py: 1.4,
								borderRadius: 2,
								border: (appointmentDate && appointmentTime) ? '2px solid #E91E8C' : '1.5px solid #F0C0D0',
								backgroundColor: '#fff',
								cursor: 'pointer',
								transition: 'all 0.2s',
								'&:hover': { borderColor: '#E91E8C', backgroundColor: '#FFF8FC' },
							}}
						>
							<EventNoteIcon sx={{ color: '#E91E8C', fontSize: 20, flexShrink: 0 }} />
							<Typography sx={{ flex: 1, fontSize: '0.92rem', color: (appointmentDate && appointmentTime) ? '#222' : '#aaa', fontFamily: '"Georgia", serif' }}>
								{(appointmentDate && appointmentTime)
									? `${formatDate(appointmentDate)} · ${appointmentTime}`
									: 'Tap to select date & time'}
							</Typography>
							{(appointmentDate || appointmentTime) && (
								<Typography
									onClick={(e) => { e.stopPropagation(); setAppointmentDate(''); setAppointmentTime(''); }}
									sx={{ fontSize: '0.72rem', color: '#E91E8C', cursor: 'pointer', whiteSpace: 'nowrap', '&:hover': { textDecoration: 'underline' } }}
								>
									Clear
								</Typography>
							)}
						</Box>
						<Typography sx={{ fontSize: '0.72rem', color: '#7a0064', mt: 0.6, display: 'flex', alignItems: 'center', gap: 0.4 }}>
							<EventNoteIcon sx={{ fontSize: 12 }} /> Weekends only · 12 PM – 5 PM
						</Typography>
					</Box>

					{/* Calendar Dialog */}
					<Dialog open={calendarModalOpen} onClose={() => setCalendarModalOpen(false)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
						<DialogTitle sx={{ fontFamily: '"Georgia", serif', fontWeight: 700, pb: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
							Select Date &amp; Time
							<Box onClick={() => setCalendarModalOpen(false)} sx={{ cursor: 'pointer', color: '#aaa', fontSize: '1.3rem', lineHeight: 1, '&:hover': { color: '#555' } }}>✕</Box>
						</DialogTitle>
						<DialogContent sx={{ pt: '12px !important' }}>
							<CalendarWidget
								selectedDate={appointmentDate}
								onDateChange={setAppointmentDate}
								selectedTime={appointmentTime}
								onTimeChange={setAppointmentTime}
								minDate={getMinDate()}
								bookedSlots={bookedSlots}
								slotsLoading={slotsLoading}
								onJoinWaitlist={(date) => {
									setCalendarModalOpen(false);
									setWaitlistDate(date);
									setWaitlistDialog(true);
								}}
							/>
						</DialogContent>
						<DialogActions sx={{ px: 3, pb: 3 }}>
							<Button onClick={() => setCalendarModalOpen(false)} sx={{ color: '#777', fontFamily: '"Georgia", serif', textTransform: 'none' }}>Cancel</Button>
							<Button
								onClick={() => setCalendarModalOpen(false)}
								disabled={!appointmentDate || !appointmentTime}
								sx={{ backgroundColor: '#E91E8C', color: '#fff', borderRadius: '20px', px: 3, fontFamily: '"Georgia", serif', fontWeight: 600, textTransform: 'none', '&:hover': { backgroundColor: '#C2185B' }, '&.Mui-disabled': { backgroundColor: '#F0C0D0', color: '#fff' } }}
							>
								Confirm
							</Button>
						</DialogActions>
					</Dialog>

					{/* Home Service — details collected via modal before checkout */}
					{appointmentType === "home" && (
						<Box
							sx={{
								mb: 3,
								p: 2,
								borderRadius: 2,
								backgroundColor: "#FFF8E1",
								border: "1px solid #FFD54F",
							}}
						>
							<Typography
								sx={{
									fontSize: "0.85rem",
									color: "#5D4037",
									fontWeight: 600,
								}}
							>
								Your address, location & transport fee will be confirmed
								before checkout.
							</Typography>
						</Box>
					)}

					{/* Service Selection */}
					<RadioGroup
						value={selectedService}
						onChange={handleServiceChange}
					>
						{serviceCategories.map((category, catIdx) => (
							<ScrollReveal
								key={category.id}
								direction="up"
								delay={catIdx * 0.1}
							>
								<Box
									id={category.id}
									sx={{
										mb: 4,
										...(category.comingSoon && {
											opacity: 0.45,
											pointerEvents: "none",
										}),
									}}
								>
									<Box
										sx={{
											display: "flex",
											alignItems: "center",
											gap: 1.5,
											mb: 2,
										}}
									>
										<Typography
											variant="h5"
											sx={{
												fontFamily: '"Georgia", serif',
												fontWeight: 700,
												color: "#4A0E4E",
											}}
										>
											{category.title}
										</Typography>
										{category.comingSoon && (
											<Typography
												sx={{
													fontSize: "0.75rem",
													fontWeight: 700,
													color: "#E91E8C",
													border: "1.5px solid #E91E8C",
													borderRadius: "12px",
													px: 1.5,
													py: 0.3,
												}}
											>
												Coming Soon
											</Typography>
										)}
									</Box>

									{category.services.map((service) => (
										<Box key={service.id} sx={{ mb: 2 }}>
											<Card
												elevation={0}
												sx={{
													borderRadius: 3,
													border:
														selectedService === service.id
															? "2px solid #E91E8C"
															: "1px solid #F0C0D0",
													transition: "all 0.3s ease",
													cursor: "pointer",
													"&:hover": {
														borderColor: "#E91E8C",
														boxShadow:
															"0 4px 16px rgba(233,30,140,0.1)",
													},
												}}
												onClick={() =>
													handleServiceChange({
														target: { value: service.id },
													})
												}
											>
												<CardContent sx={{ p: 2.5 }}>
													<Box
														sx={{
															display: "flex",
															alignItems: "center",
															justifyContent: "space-between",
														}}
													>
														<FormControlLabel
															value={service.id}
															control={
																<Radio
																	sx={{
																		color: "#E91E8C",
																		"&.Mui-checked": {
																			color: "#E91E8C",
																		},
																	}}
																/>
															}
															label={
																<Box>
																	<Typography
																		sx={{
																			fontFamily:
																				'"Georgia", serif',
																			fontWeight: 600,
																			fontSize: "1rem",
																		}}
																	>
																		{service.name}
																	</Typography>
																	<Typography
																		sx={{
																			color: "#777",
																			fontSize: "0.85rem",
																		}}
																	>
																		{service.description}
																	</Typography>
																</Box>
															}
															sx={{ flex: 1, m: 0 }}
														/>
														{hasServiceDiscount(
															service.id,
															discounts,
														) ? (
															<Box
																sx={{
																	textAlign: "right",
																	ml: 2,
																}}
															>
																<Typography
																	sx={{
																		fontFamily:
																			'"Georgia", serif',
																		fontWeight: 700,
																		color: "#2e7d32",
																		fontSize: "1.05rem",
																		whiteSpace: "nowrap",
																	}}
																>
																	{formatNaira(
																		getServiceEffectivePrice(
																			service,
																			discounts,
																		),
																	)}
																</Typography>
																<Typography
																	sx={{
																		fontFamily:
																			'"Georgia", serif',
																		color: "#999",
																		fontSize: "0.78rem",
																		textDecoration:
																			"line-through",
																		whiteSpace: "nowrap",
																	}}
																>
																	{formatNaira(service.price)}
																</Typography>
															</Box>
														) : (
															<Typography
																sx={{
																	fontFamily:
																		'"Georgia", serif',
																	fontWeight: 700,
																	color: "#E91E8C",
																	fontSize: "1.05rem",
																	whiteSpace: "nowrap",
																	ml: 2,
																}}
															>
																{formatNaira(service.price)}
															</Typography>
														)}
													</Box>
												</CardContent>

												{/* Dropdown Form */}
												<Collapse
													in={selectedService === service.id}
												>
													<Box
														sx={{ px: 3, pb: 3, pt: 1 }}
														onClick={(e) => e.stopPropagation()}
													>
														<Grid container spacing={2}>
															<Grid item xs={12}>
																<Typography sx={{ fontFamily: '"Georgia", serif', fontWeight: 700, color: '#4A0E4E', mb: 1.5, fontSize: '0.9rem' }}>
																	Nail Shape
																</Typography>
																<NailShapeSelector
																	value={formData.nailShape}
																	onChange={(shape) =>
																		setFormData((prev) => ({ ...prev, nailShape: shape }))
																	}
																/>
															</Grid>
															<Grid item xs={12}>
																<Typography sx={{ fontFamily: '"Georgia", serif', fontWeight: 700, color: '#4A0E4E', mb: 1.5, fontSize: '0.9rem' }}>
																	Nail Length
																</Typography>
																<NailLengthSelector
																	value={formData.nailLength}
																	onChange={(len) => setFormData((prev) => ({ ...prev, nailLength: len }))}
																/>
															</Grid>
														</Grid>
													</Box>
												</Collapse>
											</Card>
										</Box>
									))}
								</Box>
							</ScrollReveal>
						))}
					</RadioGroup>

					{/* Discounts & Rewards */}
					{isFormValid && (
						<Box sx={{ mt: 4, p: 3, borderRadius: 3, backgroundColor: '#fff', border: '1px solid #F0C0D0' }}>
							<Typography sx={{ fontFamily: '"Georgia", serif', fontWeight: 700, color: '#4A0E4E', mb: 2, fontSize: '0.95rem' }}>
								Discounts &amp; Rewards
							</Typography>

							{/* Referral code */}
							<Box onClick={() => setShowRefField((v) => !v)} sx={{ display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer', mb: showRefField ? 1.5 : 0 }}>
								<LocalOfferIcon sx={{ fontSize: 16, color: referralValid ? '#2e7d32' : '#E91E8C' }} />
								<Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: referralValid ? '#2e7d32' : '#E91E8C', fontFamily: '"Georgia", serif' }}>
									{referralValid ? '₦1,000 off applied!' : 'Have a referral code?'}
								</Typography>
							</Box>
							<Collapse in={showRefField}>
								<Box sx={{ display: 'flex', gap: 1, mb: 0.5 }}>
									<TextField size="small" placeholder="e.g. CHIZZYS-ABC123" value={refCodeInput} onChange={(e) => { setRefCodeInput(e.target.value.toUpperCase()); setReferralValid(false); setReferralMsg(''); }} sx={{ flex: 1, '& .MuiOutlinedInput-root': { borderRadius: 2, '& fieldset': { borderColor: '#F0C0D0' }, '&.Mui-focused fieldset': { borderColor: '#E91E8C' } } }} inputProps={{ style: { fontFamily: 'monospace', letterSpacing: 1 } }} />
									<Button onClick={handleApplyReferral} disabled={!refCodeInput.trim() || referralChecking} sx={{ backgroundColor: '#E91E8C', color: '#fff', borderRadius: 2, px: 2.5, fontFamily: '"Georgia", serif', fontWeight: 600, fontSize: '0.82rem', whiteSpace: 'nowrap', '&:hover': { backgroundColor: '#C2185B' }, '&.Mui-disabled': { backgroundColor: '#F0C0D0', color: '#fff' } }}>
										{referralChecking ? <CircularProgress size={16} sx={{ color: '#fff' }} /> : 'Apply'}
									</Button>
								</Box>
								{referralMsg && <Typography sx={{ fontSize: '0.78rem', color: referralValid ? '#2e7d32' : '#d32f2f', mt: 0.3 }}>{referralMsg}</Typography>}
							</Collapse>

							{/* Loyalty points */}
							{user && maxLoyaltyUnits > 0 && (
								<Box sx={{ mt: 2 }}>
									<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
										<StarIcon sx={{ fontSize: 16, color: '#B8860B' }} />
										{/* Pending loyalty reward banner */}
										{/* Pending loyalty reward banner */}
										{pendingReward && loyaltyUnits === 0 && (
										  <Box sx={{ mb: 1.5, p: 1.2, borderRadius: 2, background: "linear-gradient(135deg, #FFF8E1, #FFF3E0)", border: "1.5px solid #FFD54F", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
										    <Box>
										      <Typography sx={{ fontWeight: 700, fontSize: "0.82rem", color: "#B8860B" }}>🎁 ₦{pendingReward.naira.toLocaleString()} loyalty reward ready</Typography>
										      <Typography sx={{ fontSize: "0.72rem", color: "#888" }}>{pendingReward.pts} pts saved — tap Apply to use</Typography>
										    </Box>
										    <Button size="small" onClick={() => setLoyaltyUnits(Math.min(pendingReward.units, maxLoyaltyUnits))} sx={{ border: "1.5px solid #E91E8C", borderRadius: "20px", color: "#E91E8C", px: 2, py: 0.4, fontSize: "0.78rem", fontWeight: 700, textTransform: "none", "&:hover": { backgroundColor: "#E91E8C", color: "#fff" } }}>Apply</Button>
										  </Box>
										)}
																				<Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#B8860B', fontFamily: '"Georgia", serif' }}>
											Loyalty — {loyaltyBalance} pts ({formatNaira(maxLoyaltyUnits * REDEMPTION_VALUE)} redeemable)
										</Typography>
									</Box>
									<Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
										<IconButton size="small" onClick={() => setLoyaltyUnits((u) => Math.max(0, u - 1))} disabled={loyaltyUnits === 0} sx={{ border: '1.5px solid #F0C0D0', borderRadius: '50%', width: 28, height: 28 }}><RemoveIcon sx={{ fontSize: 14 }} /></IconButton>
										<Typography sx={{ fontFamily: '"Georgia", serif', fontWeight: 700, minWidth: 20, textAlign: 'center' }}>{loyaltyUnits}</Typography>
										<IconButton size="small" onClick={() => setLoyaltyUnits((u) => Math.min(maxLoyaltyUnits, u + 1))} disabled={loyaltyUnits >= maxLoyaltyUnits} sx={{ border: '1.5px solid #F0C0D0', borderRadius: '50%', width: 28, height: 28 }}><AddIcon sx={{ fontSize: 14 }} /></IconButton>
										<Typography sx={{ fontSize: '0.82rem', color: '#555' }}>units × ₦1,000 = <strong style={{ color: '#B8860B' }}>{formatNaira(loyaltyDiscount)} off</strong></Typography>
									</Box>
								</Box>
							)}

							{/* Price summary */}
							{(referralDiscount > 0 || loyaltyDiscount > 0) && (
								<Box sx={{ mt: 2, p: 1.5, borderRadius: 2, backgroundColor: '#F1F8E9', border: '1px solid #C5E1A5' }}>
									{referralDiscount > 0 && <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.3 }}><Typography sx={{ fontSize: '0.82rem', color: '#2e7d32' }}>Referral discount</Typography><Typography sx={{ fontSize: '0.82rem', color: '#2e7d32', fontWeight: 700 }}>-{formatNaira(referralDiscount)}</Typography></Box>}
									{loyaltyDiscount > 0 && <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.3 }}><Typography sx={{ fontSize: '0.82rem', color: '#B8860B' }}>Loyalty redemption</Typography><Typography sx={{ fontSize: '0.82rem', color: '#B8860B', fontWeight: 700 }}>-{formatNaira(loyaltyDiscount)}</Typography></Box>}
									<Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 0.5, borderTop: '1px solid #C5E1A5' }}>
										<Typography sx={{ fontFamily: '"Georgia", serif', fontWeight: 700, fontSize: '0.9rem' }}>Deposit (50%)</Typography>
										<Typography sx={{ fontFamily: '"Georgia", serif', fontWeight: 700, fontSize: '0.9rem', color: '#E91E8C' }}>{formatNaira(depositAmount)}</Typography>
									</Box>
								</Box>
							)}
						</Box>
					)}

					{/* spacer so content doesn't hide behind sticky button */}
					<Box sx={{ height: { xs: 130, md: 80 } }} />
				</Container>
			</Box>

			{/* Sticky Confirm Button */}
			<Box
				sx={{
					position: "fixed",
					bottom: { xs: "64px", md: 0 },
					left: 0,
					right: 0,
					zIndex: 1100,
					backgroundColor: "rgba(255, 240, 245, 0.95)",
					backdropFilter: "blur(8px)",
					borderTop: "1px solid #F0C0D0",
					py: 2,
					textAlign: "center",
				}}
			>
				<Box
					sx={{
						display: "flex",
						justifyContent: "center",
						gap: 2,
						flexWrap: "wrap",
					}}
				>
					<Button
						sx={{
							...confirmButtonSx,
							opacity: isFormValid ? 1 : 0.5,
						}}
						onClick={handleConfirmBooking}
						disabled={!isFormValid}
					>
						Confirm Booking
					</Button>
					<Button
						startIcon={<ShoppingCartOutlinedIcon />}
						sx={{
							...confirmButtonSx,
							borderColor: "#4A0E4E",
							color: "#4A0E4E",
							opacity: isFormValid ? 1 : 0.5,
							"&:hover": {
								backgroundColor: "#4A0E4E",
								color: "#fff",
								borderColor: "#4A0E4E",
							},
						}}
						onClick={handleAddToCart}
						disabled={!isFormValid}
					>
						Add to Cart
					</Button>
				</Box>
			</Box>

			{/* Payment Modal */}
			<Dialog
				open={paymentModalOpen}
				onClose={() => setPaymentModalOpen(false)}
				PaperProps={{ sx: { borderRadius: 4, p: 2, textAlign: 'center', maxWidth: 420 } }}
			>
				<DialogTitle sx={{ pb: 0 }}>
					<Typography variant="h5" sx={{ fontFamily: '"Georgia", serif', fontWeight: 700 }}>
						Secure Your Appointment
					</Typography>
					<Typography sx={{ color: '#555', fontSize: '0.88rem', mt: 0.5 }}>
						A 50% deposit secures your slot. Balance due on appointment day.
					</Typography>
				</DialogTitle>
				<DialogContent>
					{selectedServiceObj && (
						<Box sx={{ my: 2, p: 2, borderRadius: 2, backgroundColor: '#FFF0F5', border: '1px solid #F0C0D0', textAlign: 'left' }}>
							<Typography sx={{ fontFamily: '"Georgia", serif', fontWeight: 700, fontSize: '1rem', color: '#4A0E4E' }}>
								{selectedServiceObj.name}
							</Typography>
							<Typography sx={{ color: '#777', fontSize: '0.82rem', mt: 0.3 }}>
								{appointmentDate ? `${formatDate(appointmentDate)} at ${appointmentTime}` : ''}
							</Typography>
							<Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1.5 }}>
								<Typography sx={{ color: '#777', fontSize: '0.85rem' }}>Full price:</Typography>
								<Typography sx={{ color: '#333', fontWeight: 600, fontSize: '0.85rem' }}>{formatNaira(fullPrice)}</Typography>
							</Box>
							<Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5, pt: 0.5, borderTop: '1px solid #F0C0D0' }}>
								<Typography sx={{ color: '#E91E8C', fontWeight: 700, fontSize: '0.95rem' }}>Deposit (50%):</Typography>
								<Typography sx={{ color: '#E91E8C', fontWeight: 700, fontSize: '0.95rem' }}>{formatNaira(depositAmount)}</Typography>
							</Box>
						</Box>
					)}
				</DialogContent>
				<DialogActions sx={{ justifyContent: 'center', pb: 3, flexDirection: 'column', gap: 1.5, alignItems: 'center' }}>
					<Button
						onClick={payWithPaystack}
						sx={{ backgroundColor: '#E91E8C', color: '#fff', borderRadius: '30px', px: 4, py: 1.2, fontFamily: '"Georgia", serif', fontWeight: 600, fontSize: '0.95rem', '&:hover': { backgroundColor: '#C2185B' }, width: '100%', maxWidth: 280 }}
					>
						Pay {formatNaira(depositAmount)} Deposit
					</Button>
					<Button
						onClick={() => handleCompleteOrder('')}
						sx={{ color: '#999', fontSize: '0.82rem', textTransform: 'none', fontFamily: '"Georgia", serif', '&:hover': { color: '#555' } }}
					>
						Continue on WhatsApp (pay later)
					</Button>
				</DialogActions>
			</Dialog>

			{/* Home Service Details Modal */}
			<Dialog
				open={homeDetailsModalOpen}
				onClose={() => setHomeDetailsModalOpen(false)}
				PaperProps={{
					sx: { borderRadius: 4, p: 1, maxWidth: 460, width: "100%" },
				}}
			>
				<DialogTitle sx={{ pb: 0 }}>
					<Typography
						variant="h6"
						sx={{
							fontFamily: '"Georgia", serif',
							fontWeight: 700,
							color: "#4A0E4E",
						}}
					>
						Home Service Details
					</Typography>
					<Typography sx={{ fontSize: "0.82rem", color: "#777", mt: 0.5 }}>
						We need a few details before we come to you.
					</Typography>
				</DialogTitle>
				<DialogContent sx={{ pt: 2 }}>
					<Typography
						sx={{
							fontSize: "0.88rem",
							color: "#555",
							fontWeight: 600,
							mb: 0.5,
						}}
					>
						Your Address
					</Typography>
					<TextField
						fullWidth
						placeholder="Enter your full home address"
						value={homeAddress}
						onChange={(e) => setHomeAddress(e.target.value)}
						size="small"
						multiline
						rows={2}
						sx={{ ...textFieldSx, mb: 2.5 }}
					/>
					<Typography
						sx={{
							fontSize: "0.88rem",
							color: "#555",
							fontWeight: 600,
							mb: 0.8,
						}}
					>
						Do you have a table / work area?
					</Typography>
					<Box sx={{ display: "flex", gap: 1.5, mb: 2.5 }}>
						{["Yes", "No"].map((option) => (
							<Box
								key={option}
								onClick={() => setHasTableArea(option)}
								sx={{
									border:
										hasTableArea === option
											? "2px solid #E91E8C"
											: "2px solid #F0C0D0",
									borderRadius: 2,
									px: 3,
									py: 1,
									cursor: "pointer",
									backgroundColor:
										hasTableArea === option ? "#FFF0F5" : "#fff",
									transition: "all 0.2s ease",
									"&:hover": { borderColor: "#E91E8C" },
								}}
							>
								<Typography
									sx={{
										fontSize: "0.9rem",
										fontWeight: 600,
										color:
											hasTableArea === option ? "#E91E8C" : "#555",
									}}
								>
									{option}
								</Typography>
							</Box>
						))}
					</Box>
					<Typography
						sx={{
							fontSize: "0.88rem",
							color: "#555",
							fontWeight: 600,
							mb: 0.8,
						}}
					>
						Location
					</Typography>
					<Box
						sx={{ display: "flex", gap: 1.5, mb: 1.5, flexWrap: "wrap" }}
					>
						{Object.entries(HOME_TRANSPORT_COSTS).map(([loc, range]) => (
							<Box
								key={loc}
								onClick={() => setHomeLocation(loc)}
								sx={{
									border:
										homeLocation === loc
											? "2px solid #E91E8C"
											: "2px solid #F0C0D0",
									borderRadius: 2,
									px: 2.5,
									py: 1.2,
									cursor: "pointer",
									backgroundColor:
										homeLocation === loc ? "#FFF0F5" : "#fff",
									transition: "all 0.2s ease",
									"&:hover": { borderColor: "#E91E8C" },
								}}
							>
								<Typography
									sx={{
										fontFamily: '"Georgia", serif',
										fontWeight: 600,
										fontSize: "0.9rem",
										color: homeLocation === loc ? "#E91E8C" : "#333",
									}}
								>
									{loc}
								</Typography>
								<Typography sx={{ fontSize: "0.75rem", color: "#777" }}>
									{formatNaira(range.min)} – {formatNaira(range.max)}{" "}
									transport
								</Typography>
							</Box>
						))}
					</Box>
					{homeLocation && (
						<Box
							sx={{
								p: 1.5,
								borderRadius: 2,
								backgroundColor: "#FFF8E1",
								border: "1px solid #FFD54F",
							}}
						>
							<Typography
								sx={{
									fontSize: "0.85rem",
									color: "#5D4037",
									fontWeight: 600,
								}}
							>
								Est. transport fee ({homeLocation}):{" "}
								{formatNaira(HOME_TRANSPORT_COSTS[homeLocation].min)} –{" "}
								{formatNaira(HOME_TRANSPORT_COSTS[homeLocation].max)}
							</Typography>
							<Typography
								sx={{ fontSize: "0.78rem", color: "#795548", mt: 0.3 }}
							>
								Final transport cost will be confirmed when we reach out
								to you.
							</Typography>
						</Box>
					)}
				</DialogContent>
				<DialogActions
					sx={{ justifyContent: "space-between", px: 3, pb: 3 }}
				>
					<Button
						onClick={() => setHomeDetailsModalOpen(false)}
						sx={{
							color: "#777",
							fontFamily: '"Georgia", serif',
							fontWeight: 600,
						}}
					>
						Cancel
					</Button>
					<Button
						onClick={handleHomeDetailsSubmit}
						disabled={!isHomeDetailsValid}
						sx={{
							backgroundColor: "#E91E8C",
							color: "#fff",
							borderRadius: "30px",
							px: 4,
							py: 1.2,
							fontFamily: '"Georgia", serif',
							fontWeight: 600,
							fontSize: "0.95rem",
							"&:hover": { backgroundColor: "#C2185B" },
							"&.Mui-disabled": {
								backgroundColor: "#f0a0cc",
								color: "#fff",
							},
						}}
					>
						Continue
					</Button>
				</DialogActions>
			</Dialog>
			{/* Waitlist Dialog */}
			<Dialog
				open={waitlistDialog}
				onClose={() => setWaitlistDialog(false)}
				PaperProps={{ sx: { borderRadius: 4, p: 2, maxWidth: 420, width: '100%' } }}
			>
				<DialogTitle sx={{ pb: 0 }}>
					<Typography variant="h6" sx={{ fontFamily: '"Georgia", serif', fontWeight: 700 }}>Join Waitlist</Typography>
					{waitlistDate && (
						<Typography sx={{ fontSize: '0.85rem', color: '#555', mt: 0.5 }}>
							{new Date(waitlistDate + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
						</Typography>
					)}
				</DialogTitle>
				<DialogContent>
					{waitlistSuccess ? (
						<Box sx={{ textAlign: 'center', py: 2 }}>
							<Typography sx={{ fontSize: '2rem', mb: 1 }}>🎉</Typography>
							<Typography sx={{ fontFamily: '"Georgia", serif', fontWeight: 700, fontSize: '1.1rem', mb: 1 }}>You're on the waitlist!</Typography>
							<Typography sx={{ fontSize: '0.88rem', color: '#555', lineHeight: 1.6 }}>We'll reach out as soon as a slot opens up on this date. Keep an eye on your phone!</Typography>
						</Box>
					) : (
						<Box sx={{ pt: 1 }}>
							<Typography sx={{ fontSize: '0.85rem', color: '#555', mb: 2, lineHeight: 1.6 }}>Enter your details below. We'll contact you if a slot becomes available.</Typography>
							<TextField
								fullWidth
								label="Your Name"
								value={waitlistName}
								onChange={(e) => setWaitlistName(e.target.value)}
								size="small"
								sx={{ mb: 2, ...textFieldSx }}
							/>
							<TextField
								fullWidth
								label="Phone Number"
								value={waitlistPhone}
								onChange={(e) => setWaitlistPhone(e.target.value)}
								size="small"
								type="tel"
								sx={textFieldSx}
							/>
						</Box>
					)}
				</DialogContent>
				<DialogActions sx={{ px: 3, pb: 3, justifyContent: waitlistSuccess ? 'center' : 'flex-end' }}>
					{waitlistSuccess ? (
						<Button onClick={() => setWaitlistDialog(false)} sx={{ backgroundColor: '#E91E8C', color: '#fff', borderRadius: '30px', px: 4, py: 1, fontFamily: '"Georgia", serif', fontWeight: 600, '&:hover': { backgroundColor: '#C2185B' } }}>Done</Button>
					) : (
						<>
							<Button onClick={() => setWaitlistDialog(false)} sx={{ mr: 1, color: '#777' }}>Cancel</Button>
							<Button
								onClick={handleJoinWaitlist}
								disabled={!waitlistName.trim() || !waitlistPhone.trim() || waitlistSubmitting}
								sx={{ backgroundColor: '#E91E8C', color: '#fff', borderRadius: '30px', px: 3, py: 0.8, fontFamily: '"Georgia", serif', fontWeight: 600, '&:hover': { backgroundColor: '#C2185B' }, '&.Mui-disabled': { backgroundColor: '#f0a0c8', color: '#fff' } }}
							>
								{waitlistSubmitting ? <CircularProgress size={20} sx={{ color: '#fff' }} /> : 'Join Waitlist'}
							</Button>
						</>
					)}
				</DialogActions>
			</Dialog>
			{/* Sign In Prompt */}
			<SignInPrompt
				open={signInPromptOpen}
				onClose={() => setSignInPromptOpen(false)}
			/>
		</Box>
	);
}
