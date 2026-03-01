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
} from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import EventNoteIcon from '@mui/icons-material/EventNote';
import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined';
import { serviceCategories, nailShapes, nailLengths, removalNote } from '../data/services';
import ScrollReveal from '../components/ScrollReveal';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { saveOrder } from '../lib/orderService';
import { fetchBookedSlots, saveBookedSlot } from '../lib/bookedSlotsService';
import SignInPrompt from '../components/SignInPrompt';

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
  const { user } = useAuth();
  const [customerName, setCustomerName] = useState('');
  const [signInPromptOpen, setSignInPromptOpen] = useState(false);

  useEffect(() => {
    if (user?.displayName && !customerName) setCustomerName(user.displayName);
  }, [user]);

  useEffect(() => {
    const categoryId = location.state?.categoryId;
    if (categoryId) {
      const timer = setTimeout(() => {
        document.getElementById(categoryId)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [location.state]);

  const [appointmentType, setAppointmentType] = useState('salon');
  const [selectedService, setSelectedService] = useState('');
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('');
  const [formData, setFormData] = useState({
    nailShape: '',
    nailLength: '',
  });

  const timeSlots = ['12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM'];
  const [modalOpen, setModalOpen] = useState(false);
  const [bookedSlots, setBookedSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);

  useEffect(() => {
    if (!appointmentDate || !isWeekend(appointmentDate)) {
      setBookedSlots([]);
      return;
    }
    setSlotsLoading(true);
    fetchBookedSlots(formatDate(appointmentDate))
      .then((slots) => {
        setBookedSlots(slots);
        setAppointmentTime((prev) => (slots.includes(prev) ? '' : prev));
      })
      .catch(() => setBookedSlots([]))
      .finally(() => setSlotsLoading(false));
  }, [appointmentDate]);

  const allServices = serviceCategories.flatMap((cat) =>
    cat.services.map((s) => ({ ...s, category: cat.title }))
  );

  // Get tomorrow's date as minimum selectable date
  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  const isWeekend = (dateString) => {
    if (!dateString) return true;
    const day = new Date(dateString).getDay();
    return day === 0 || day === 6; // Sunday or Saturday
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const handleServiceChange = (event) => {
    setSelectedService(event.target.value);
    setFormData({ nailShape: '', nailLength: '' });
  };

  const handleFieldChange = (field) => (event) => {
    setFormData((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const handleConfirmBooking = () => {
    if (!user) { setSignInPromptOpen(true); return; }
    setModalOpen(true);
  };

  const handleCompleteOrder = () => {
    setModalOpen(false);
    const selected = allServices.find((s) => s.id === selectedService);
    const fullDate = `${formatDate(appointmentDate)} at ${appointmentTime}`;
    const message = `Hi! I'd like to book an appointment.\n\nName: ${customerName}\nPreferred Date: ${fullDate}\nService: ${selected?.name || "a service"}\nPrice: ${selected ? formatNaira(selected.price) : ''}\n\nDetails:\n- Nail Shape: ${formData.nailShape}\n- Nail Length: ${formData.nailLength}\n\nPlease confirm availability for this request. Thank you!`;
    const encoded = encodeURIComponent(message);
    window.open(`https://api.whatsapp.com/send?phone=2349053714197&text=${encoded}`, '_blank');

    if (user) {
      saveOrder(user.uid, {
        type: 'service',
        total: selected?.price || 0,
        customerName: customerName.trim(),
        email: user.email || '',
        appointmentDate: fullDate,
        items: [{
          kind: 'service',
          serviceName: selected?.name || '',
          price: selected?.price || 0,
          date: fullDate,
          nailShape: formData.nailShape,
          nailLength: formData.nailLength,
        }],
      }).then((orderRef) => {
        saveBookedSlot({
          date: formatDate(appointmentDate),
          time: appointmentTime,
          orderId: orderRef.id,
          uid: user.uid,
        }).catch(() => {});
      }).catch(() => {});
    }

    navigate('/');
  };

  const handleAddToCart = () => {
    if (!user) { setSignInPromptOpen(true); return; }
    const selected = allServices.find((s) => s.id === selectedService);
    if (!selected) return;
    const fullDate = `${formatDate(appointmentDate)} at ${appointmentTime}`;
    addServiceToCart({
      serviceId: selected.id,
      name: selected.name,
      price: selected.price,
      date: fullDate,
      nailShape: formData.nailShape,
      nailLength: formData.nailLength,
      customerName: customerName.trim(),
    });
    setSelectedService('');
    setAppointmentDate('');
    setAppointmentTime('');
    setFormData({ nailShape: '', nailLength: '' });
  };

  const isFormValid =
    customerName.trim() && appointmentDate && isWeekend(appointmentDate) && appointmentTime && selectedService && formData.nailShape && formData.nailLength;

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
										border: appointmentType === "salon" ? "2px solid #E91E8C" : "2px solid #F0C0D0",
										borderRadius: 2,
										px: 2.5,
										py: 1.2,
										cursor: "pointer",
										backgroundColor: appointmentType === "salon" ? "#FFF0F5" : "#fff",
										transition: "all 0.2s ease",
										"&:hover": { borderColor: "#E91E8C" },
									}}
								>
									<Typography sx={{ fontFamily: '"Georgia", serif', fontWeight: 600, fontSize: "0.9rem", color: appointmentType === "salon" ? "#E91E8C" : "#333" }}>
										Salon Service
									</Typography>
									<Typography sx={{ fontSize: "0.75rem", color: "#777" }}>
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

						{/* Appointment Date */}
						<Typography
							sx={{
								fontFamily: '"Georgia", serif',
								fontWeight: 700,
								color: "#4A0E4E",
								mb: 1,
								mt: 2.5,
								fontSize: "1.05rem",
							}}
						>
							Preferred Date
						</Typography>
						<TextField
							fullWidth
							type="date"
							value={appointmentDate}
							onChange={(e) => setAppointmentDate(e.target.value)}
							size="small"
							inputProps={{ min: getMinDate() }}
							sx={textFieldSx}
						/>
						<Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mt: 0.8 }}>
							<EventNoteIcon sx={{ fontSize: 16, color: "#E91E8C" }} />
							<Typography
								sx={{
									fontSize: "0.78rem",
									color: "#7a0064",
									fontStyle: "italic",
								}}
							>
								Appointments are only on weekends (Sat & Sun), 12 PM – 6 PM
							</Typography>
						</Box>
						{appointmentDate && !isWeekend(appointmentDate) && (
							<Typography
								sx={{
									fontSize: "0.78rem",
									color: "#d32f2f",
									fontWeight: 600,
									mt: 0.5,
								}}
							>
								Please select a Saturday or Sunday.
							</Typography>
						)}

						{/* Time Slot */}
						<Typography
							sx={{
								fontFamily: '"Georgia", serif',
								fontWeight: 700,
								color: "#4A0E4E",
								mb: 1,
								mt: 2.5,
								fontSize: "1.05rem",
							}}
						>
							Preferred Time
						</Typography>
						<FormControl fullWidth size="small">
							<Select
								value={appointmentTime}
								onChange={(e) => setAppointmentTime(e.target.value)}
								displayEmpty
								disabled={slotsLoading}
								sx={{
									borderRadius: 2,
									'& fieldset': { borderColor: '#F0C0D0' },
									'&:hover fieldset': { borderColor: '#E91E8C' },
									'&.Mui-focused fieldset': { borderColor: '#E91E8C' },
								}}
							>
								<MenuItem value="" disabled>
									{slotsLoading ? 'Checking availability...' : 'Select a time slot'}
								</MenuItem>
								{timeSlots.map((slot) => {
									const isBooked = bookedSlots.includes(slot);
									return (
										<MenuItem key={slot} value={slot} disabled={isBooked}>
											<Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
												<span>{slot}</span>
												{isBooked && (
													<Typography component="span" sx={{ color: '#d32f2f', fontSize: '0.8rem', fontWeight: 600, ml: 2 }}>
														Booked
													</Typography>
												)}
											</Box>
										</MenuItem>
									);
								})}
							</Select>
						</FormControl>
						{slotsLoading && (
							<Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.8 }}>
								<CircularProgress size={14} sx={{ color: '#E91E8C' }} />
								<Typography sx={{ fontSize: '0.78rem', color: '#7a0064', fontStyle: 'italic' }}>
									Checking available time slots...
								</Typography>
							</Box>
						)}
					</Box>

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
								<Box id={category.id} sx={{ mb: 4, ...(category.comingSoon && { opacity: 0.45, pointerEvents: "none" }) }}>
									<Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 2 }}>
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
														<Typography
															sx={{
																fontFamily: '"Georgia", serif',
																fontWeight: 700,
																color: "#E91E8C",
																fontSize: "1.05rem",
																whiteSpace: "nowrap",
																ml: 2,
															}}
														>
															{formatNaira(service.price)}
														</Typography>
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
															<Grid item xs={12} sm={6}>
																<FormControl
																	fullWidth
																	size="small"
																>
																	<InputLabel>
																		Nail Shape
																	</InputLabel>
																	<Select
																		value={formData.nailShape}
																		label="Nail Shape"
																		onChange={handleFieldChange(
																			"nailShape",
																		)}
																		sx={{ borderRadius: 2 }}
																	>
																		{nailShapes.map(
																			(shape) => (
																				<MenuItem
																					key={shape}
																					value={shape}
																				>
																					{shape}
																				</MenuItem>
																			),
																		)}
																	</Select>
																</FormControl>
															</Grid>
															<Grid item xs={12} sm={6}>
																<FormControl
																	fullWidth
																	size="small"
																>
																	<InputLabel>
																		Nail Length
																	</InputLabel>
																	<Select
																		value={
																			formData.nailLength
																		}
																		label="Nail Length"
																		onChange={handleFieldChange(
																			"nailLength",
																		)}
																		sx={{ borderRadius: 2 }}
																	>
																		{nailLengths.map(
																			(len) => (
																				<MenuItem
																					key={len}
																					value={len}
																				>
																					{len}
																				</MenuItem>
																			),
																		)}
																	</Select>
																</FormControl>
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

					{/* spacer so content doesn't hide behind sticky button */}
					<Box sx={{ height: 80 }} />
				</Container>
			</Box>

			{/* Sticky Confirm Button */}
			<Box
				sx={{
					position: "fixed",
					bottom: 0,
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
				<Box sx={{ display: "flex", justifyContent: "center", gap: 2, flexWrap: "wrap" }}>
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

			{/* Success Modal */}
			<Dialog
				open={modalOpen}
				onClose={() => setModalOpen(false)}
				PaperProps={{
					sx: {
						borderRadius: 4,
						p: 2,
						textAlign: "center",
						maxWidth: 420,
					},
				}}
			>
				<DialogTitle sx={{ pb: 0 }}>
					<CheckCircleOutlineIcon
						sx={{ fontSize: 60, color: "#E91E8C", mb: 1 }}
					/>
					<Typography
						variant="h5"
						sx={{ fontFamily: '"Georgia", serif', fontWeight: 700 }}
					>
						Booking Successful!
					</Typography>
				</DialogTitle>
				<DialogContent>
					<Typography sx={{ color: "#555", mt: 1, lineHeight: 1.7 }}>
						Your appointment is processing. We will navigate you to
						WhatsApp to talk with the stylist and confirm your design and
						payment.
					</Typography>
				</DialogContent>
				<DialogActions sx={{ justifyContent: "center", pb: 3 }}>
					<Button
						onClick={handleCompleteOrder}
						sx={{
							backgroundColor: "#E91E8C",
							color: "#fff",
							borderRadius: "30px",
							px: 4,
							py: 1.2,
							fontFamily: '"Georgia", serif',
							fontWeight: 600,
							fontSize: "0.95rem",
							"&:hover": {
								backgroundColor: "#C2185B",
							},
						}}
					>
						Complete Order
					</Button>
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
