import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
	Box,
	Typography,
	Container,
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
	Chip,
} from "@mui/material";
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import EventNoteIcon from "@mui/icons-material/EventNote";
import { serviceCategories } from '../data/services';
import ScrollReveal from '../components/ScrollReveal';
import { useAuth } from '../context/AuthContext';
import { fetchOrders, updateOrderStatus } from '../lib/orderService';
import { serverTimestamp } from 'firebase/firestore';
import CalendarWidget from '../components/CalendarWidget';
import { fetchBookedSlots, saveBookedSlot } from "../lib/bookedSlotsService";

const ff = '"Georgia", serif';

const confirmButtonSx = {
	border: "2px solid #E91E8C",
	borderRadius: "30px",
	color: "#000",
	backgroundColor: "transparent",
	px: 5,
	py: 1.5,
	fontSize: "1rem",
	fontFamily: ff,
	fontWeight: 600,
	transition: "all 0.3s ease",
	"&:hover": {
		backgroundColor: "#E91E8C",
		color: "#fff",
		borderColor: "#E91E8C",
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

function formatDate(dateString) {
	if (!dateString) return "";
	const date = new Date(dateString);
	return date.toLocaleDateString("en-GB", {
		weekday: "long",
		day: "numeric",
		month: "long",
		year: "numeric",
	});
}

function getMinDate() {
	const tomorrow = new Date();
	tomorrow.setDate(tomorrow.getDate() + 1);
	return tomorrow.toISOString().split("T")[0];
}

export default function RescheduleAppointmentPage() {
	const navigate = useNavigate();
	const location = useLocation();
	const { user } = useAuth();

	// Appointment selection
	const [appointments, setAppointments] = useState([]);
	const [loadingAppointments, setLoadingAppointments] = useState(false);
	const [selectedAppointmentId, setSelectedAppointmentId] = useState("");

	// Form fields
	const [customerName, setCustomerName] = useState("");
	const [selectedService, setSelectedService] = useState("");
	const [reason, setReason] = useState("");

	// New date/time
	const [preferredDate, setPreferredDate] = useState("");
	const [preferredTime, setPreferredTime] = useState("");
	const [calendarOpen, setCalendarOpen] = useState(false);
	const [bookedSlots, setBookedSlots] = useState([]);
	const [slotsLoading, setSlotsLoading] = useState(false);

	// Submit state
	const [confirmModalOpen, setConfirmModalOpen] = useState(false);
	const [submitting, setSubmitting] = useState(false);

	const allServices = serviceCategories.flatMap((cat) =>
		cat.services.map((s) => ({ ...s, category: cat.title })),
	);

	// Fetch confirmed appointments only
	useEffect(() => {
		if (!user) return;
		if (user.displayName && !customerName) setCustomerName(user.displayName);
		setLoadingAppointments(true);
		fetchOrders(user.uid)
			.then((orders) => {
				const confirmed = orders.filter(
					(o) => o.type === "service" && o.status === "confirmed",
				);
				setAppointments(confirmed);
			})
			.catch(() => {})
			.finally(() => setLoadingAppointments(false));
	}, [user]);

	// Pre-select appointment passed from account page
	useEffect(() => {
		if (
			location.state?.orderId &&
			appointments.length > 0 &&
			!selectedAppointmentId
		) {
			setSelectedAppointmentId(location.state.orderId);
		}
	}, [location.state, appointments]);

	// Auto-populate form when an appointment is selected
	useEffect(() => {
		if (!selectedAppointmentId) return;
		const appt = appointments.find((a) => a.id === selectedAppointmentId);
		if (!appt) return;
		if (appt.customerName) setCustomerName(appt.customerName);
		const serviceItem = appt.items?.[0];
		if (serviceItem?.serviceName) {
			const match = allServices.find(
				(s) => s.name === serviceItem.serviceName,
			);
			if (match) setSelectedService(match.id);
		}
	}, [selectedAppointmentId, appointments]);

	const selectedAppointment = appointments.find(
		(a) => a.id === selectedAppointmentId,
	);

	// Load booked slots when preferred date changes
	useEffect(() => {
		if (!preferredDate) {
			setBookedSlots([]);
			return;
		}
		setSlotsLoading(true);
		fetchBookedSlots(formatDate(preferredDate))
			.then((slots) => {
				setBookedSlots(slots);
				setPreferredTime((prev) => (slots.includes(prev) ? "" : prev));
			})
			.catch(() => setBookedSlots([]))
			.finally(() => setSlotsLoading(false));
	}, [preferredDate]);

	const handleComplete = async () => {
		const selected = allServices.find((s) => s.id === selectedService);
		const newDate = `${formatDate(preferredDate)} at ${preferredTime}`;
		const message = `Hi! I'd like to reschedule my appointment.\n\nName: ${customerName}\nOriginal Service: ${selected?.name || "N/A"}\nReason for Rescheduling: ${reason}\nPreferred New Date: ${newDate}\n\nPlease confirm the new slot. Thank you!`;

		if (user && selectedAppointmentId) {
			setSubmitting(true);
			try {
				const updatedItems = (
					selectedAppointment?.items || [
						{
							kind: "service",
							serviceName: selected?.name || "",
							price: selected?.price || 0,
						},
					]
				).map((item) => ({ ...item, date: newDate }));

				await updateOrderStatus(
					user.uid,
					selectedAppointmentId,
					"rescheduled",
					{
						appointmentDate: newDate,
						previousDate: selectedAppointment?.appointmentDate || "",
						rescheduleReason: reason.trim(),
						rescheduledAt: serverTimestamp(),
						items: updatedItems,
					},
				);
				// Book the new slot so it shows as unavailable on the calendar
				saveBookedSlot({
					date: formatDate(preferredDate),
					time: preferredTime,
					orderId: selectedAppointmentId,
					uid: user.uid,
				}).catch(() => {});
			} catch {
				// proceed to WhatsApp even if Firestore update fails
			} finally {
				setSubmitting(false);
			}
		}

		setConfirmModalOpen(false);
		window.open(
			`https://api.whatsapp.com/send?phone=2349053714197&text=${encodeURIComponent(message)}`,
			"_blank",
		);
		navigate("/thank-you", {
			state: {
				type: "service",
				customerName,
				serviceName: selected?.name || "",
				appointmentDate: newDate,
				isReschedule: true,
				items: [
					{
						kind: "service",
						serviceName: selected?.name || "",
						price: selected?.price || 0,
						date: newDate,
					},
				],
				total: selected?.price || 0,
				finalTotal: selected?.price || 0,
			},
		});
	};

	const isFormValid =
		customerName.trim() &&
		selectedService &&
		reason.trim() &&
		preferredDate &&
		preferredTime;

	return (
		<Box sx={{ pt: { xs: 7, md: 8 } }}>
			<Box sx={{ py: 8, backgroundColor: "#FFF0F5" }}>
				<Container maxWidth="md">
					{/* Header */}
					<ScrollReveal direction="up">
						<Box sx={{ textAlign: "center", mb: 5 }}>
							<Typography
								variant="h3"
								sx={{
									fontFamily: ff,
									fontWeight: 700,
									color: "#000",
									mb: 2,
									fontSize: { xs: "1.8rem", sm: "2.4rem", md: "3rem" },
								}}
							>
								Reschedule Appointment
							</Typography>
							<Typography
								sx={{
									color: "#555",
									fontSize: "1.05rem",
									maxWidth: 500,
									mx: "auto",
								}}
							>
								Need to change your appointment? Select your booking
								below and choose a new date — we'll confirm via
								WhatsApp.
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
									Rescheduling is free if done at least 12 hours before
									your original appointment. Your 50% booking deposit
									carries over — no additional deposit required.
									Repeated no-shows or last-minute changes may result
									in forfeiture of the deposit.
								</Typography>
							</Box>
						</Box>
					</ScrollReveal>

					{/* Appointment Selector — confirmed only */}
					{user && (
						<ScrollReveal direction="up">
							<Box sx={{ mb: 4 }}>
								<Typography
									sx={{
										fontFamily: ff,
										fontWeight: 700,
										color: "#4A0E4E",
										mb: 1,
										fontSize: "1.05rem",
									}}
								>
									Select Appointment to Reschedule
								</Typography>

								{loadingAppointments ? (
									<Box
										sx={{
											display: "flex",
											alignItems: "center",
											gap: 1,
											py: 1,
										}}
									>
										<CircularProgress
											size={20}
											sx={{ color: "#E91E8C" }}
										/>
										<Typography
											sx={{ fontSize: "0.9rem", color: "#555" }}
										>
											Loading your appointments…
										</Typography>
									</Box>
								) : appointments.length > 0 ? (
									<>
										<FormControl fullWidth size="small">
											<InputLabel>Choose an appointment</InputLabel>
											<Select
												value={selectedAppointmentId}
												label="Choose an appointment"
												onChange={(e) => {
													setSelectedAppointmentId(e.target.value);
													setPreferredDate("");
													setPreferredTime("");
												}}
												sx={{ borderRadius: 2 }}
											>
												{appointments.map((appt) => {
													const serviceName =
														appt.items?.[0]?.serviceName ||
														"Service";
													const date =
														appt.appointmentDate || "No date set";
													return (
														<MenuItem
															key={appt.id}
															value={appt.id}
														>
															{serviceName} — {date}
														</MenuItem>
													);
												})}
											</Select>
										</FormControl>

										{/* Selected appointment summary card */}
										{selectedAppointment && (
											<Box
												sx={{
													mt: 2,
													p: 2,
													borderRadius: 2,
													backgroundColor: "#fff",
													border: "1.5px solid #E91E8C",
													display: "flex",
													flexDirection: "column",
													gap: 0.8,
												}}
											>
												<Box
													sx={{
														display: "flex",
														alignItems: "center",
														justifyContent: "space-between",
														flexWrap: "wrap",
														gap: 1,
													}}
												>
													<Typography
														sx={{
															fontFamily: ff,
															fontWeight: 700,
															color: "#4A0E4E",
															fontSize: "0.95rem",
														}}
													>
														{selectedAppointment.items?.[0]
															?.serviceName || "Service"}
													</Typography>
													<Chip
														label="Confirmed"
														size="small"
														sx={{
															backgroundColor: "#e8f5e9",
															color: "#2e7d32",
															fontWeight: 700,
															fontSize: "0.72rem",
														}}
													/>
												</Box>
												<Box
													sx={{
														display: "flex",
														alignItems: "center",
														gap: 0.8,
													}}
												>
													<EventNoteIcon
														sx={{
															fontSize: 15,
															color: "#E91E8C",
														}}
													/>
													<Typography
														sx={{
															fontSize: "0.85rem",
															color: "#555",
														}}
													>
														<strong>Original date:</strong>{" "}
														{selectedAppointment.appointmentDate ||
															"Not set"}
													</Typography>
												</Box>
												{selectedAppointment.customerName && (
													<Typography
														sx={{
															fontSize: "0.82rem",
															color: "#777",
														}}
													>
														Booked for:{" "}
														{selectedAppointment.customerName}
													</Typography>
												)}
												{selectedAppointment.items?.[0]
													?.nailShape && (
													<Typography
														sx={{
															fontSize: "0.82rem",
															color: "#777",
														}}
													>
														Shape:{" "}
														{
															selectedAppointment.items[0]
																.nailShape
														}
														{selectedAppointment.items[0]
															.nailLength
															? ` · Length: ${selectedAppointment.items[0].nailLength}`
															: ""}
													</Typography>
												)}
											</Box>
										)}
									</>
								) : (
									<Box
										sx={{
											p: 2,
											borderRadius: 2,
											backgroundColor: "#FFF8E1",
											border: "1px solid #FFD54F",
										}}
									>
										<Typography
											sx={{ fontSize: "0.9rem", color: "#5D4037" }}
										>
											No confirmed appointments found. Only confirmed
											bookings can be rescheduled. If you have a
											pending booking, it will appear here once
											confirmed.
										</Typography>
									</Box>
								)}
							</Box>
						</ScrollReveal>
					)}

					{/* Your Name */}
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
								fontFamily: ff,
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

					{/* Original Service */}
					<ScrollReveal direction="up" delay={0.1}>
						<Box sx={{ mb: 3 }}>
							<Typography
								sx={{
									fontFamily: ff,
									fontWeight: 700,
									color: "#4A0E4E",
									mb: 1,
									fontSize: "1.05rem",
								}}
							>
								Original Service Booked
							</Typography>
							<FormControl fullWidth size="small">
								<InputLabel>Select your original service</InputLabel>
								<Select
									value={selectedService}
									label="Select your original service"
									onChange={(e) => setSelectedService(e.target.value)}
									sx={{ borderRadius: 2 }}
								>
									{serviceCategories.map((cat) => [
										<MenuItem
											key={`header-${cat.id}`}
											disabled
											sx={{ fontWeight: 700, color: "#4A0E4E" }}
										>
											{cat.title}
										</MenuItem>,
										...cat.services.map((service) => (
											<MenuItem
												key={service.id}
												value={service.id}
												sx={{ pl: 4 }}
											>
												{service.name}
											</MenuItem>
										)),
									])}
								</Select>
							</FormControl>
						</Box>
					</ScrollReveal>

					{/* Reason */}
					<ScrollReveal direction="up" delay={0.2}>
						<Box sx={{ mb: 3 }}>
							<Typography
								sx={{
									fontFamily: ff,
									fontWeight: 700,
									color: "#4A0E4E",
									mb: 1,
									fontSize: "1.05rem",
								}}
							>
								Reason for Rescheduling
							</Typography>
							<TextField
								fullWidth
								multiline
								rows={3}
								placeholder="Let us know why you need to reschedule"
								value={reason}
								onChange={(e) => setReason(e.target.value)}
								size="small"
								sx={textFieldSx}
							/>
						</Box>
					</ScrollReveal>

					{/* Preferred New Date & Time — click to open calendar modal */}
					<ScrollReveal direction="up" delay={0.3}>
						<Box sx={{ mb: 3 }}>
							<Typography
								sx={{
									fontFamily: ff,
									fontWeight: 700,
									color: "#4A0E4E",
									mb: 1,
									fontSize: "1.05rem",
								}}
							>
								Preferred New Date &amp; Time
							</Typography>
							<Box
								onClick={() => setCalendarOpen(true)}
								sx={{
									display: "flex",
									alignItems: "center",
									gap: 1.5,
									px: 2,
									py: 1.5,
									borderRadius: 2,
									border:
										preferredDate && preferredTime
											? "2px solid #E91E8C"
											: "1.5px solid #F0C0D0",
									backgroundColor: "#fff",
									cursor: "pointer",
									transition: "all 0.2s",
									"&:hover": {
										borderColor: "#E91E8C",
										backgroundColor: "#FFF8FC",
									},
								}}
							>
								<EventNoteIcon
									sx={{
										color: "#E91E8C",
										fontSize: 20,
										flexShrink: 0,
									}}
								/>
								<Typography
									sx={{
										flex: 1,
										fontSize: "0.92rem",
										color:
											preferredDate && preferredTime
												? "#222"
												: "#aaa",
										fontFamily: ff,
									}}
								>
									{preferredDate && preferredTime
										? `${formatDate(preferredDate)} · ${preferredTime}`
										: "Tap to select a new date & time"}
								</Typography>
								{(preferredDate || preferredTime) && (
									<Typography
										onClick={(e) => {
											e.stopPropagation();
											setPreferredDate("");
											setPreferredTime("");
										}}
										sx={{
											fontSize: "0.72rem",
											color: "#E91E8C",
											cursor: "pointer",
											whiteSpace: "nowrap",
											"&:hover": { textDecoration: "underline" },
										}}
									>
										Clear
									</Typography>
								)}
							</Box>
							<Typography
								sx={{
									fontSize: "0.72rem",
									color: "#7a0064",
									mt: 0.5,
									display: "flex",
									alignItems: "center",
									gap: 0.4,
								}}
							>
								<EventNoteIcon sx={{ fontSize: 11 }} /> Weekends only ·
								12 PM – 5 PM · At least 12 hrs in advance
							</Typography>
						</Box>
					</ScrollReveal>

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
				<Button
					sx={{ ...confirmButtonSx, opacity: isFormValid ? 1 : 0.5 }}
					onClick={() => setConfirmModalOpen(true)}
					disabled={!isFormValid}
				>
					Confirm Reschedule
				</Button>
			</Box>

			{/* Calendar Dialog */}
			<Dialog
				open={calendarOpen}
				onClose={() => setCalendarOpen(false)}
				maxWidth="xs"
				fullWidth
				PaperProps={{ sx: { borderRadius: 3 } }}
			>
				<DialogTitle
					sx={{
						fontFamily: ff,
						fontWeight: 700,
						pb: 0,
						display: "flex",
						alignItems: "center",
						justifyContent: "space-between",
					}}
				>
					Select New Date &amp; Time
					<Box
						onClick={() => setCalendarOpen(false)}
						sx={{
							cursor: "pointer",
							color: "#aaa",
							fontSize: "1.3rem",
							lineHeight: 1,
							"&:hover": { color: "#555" },
						}}
					>
						✕
					</Box>
				</DialogTitle>
				<DialogContent sx={{ pt: "12px !important" }}>
					<CalendarWidget
						selectedDate={preferredDate}
						onDateChange={setPreferredDate}
						selectedTime={preferredTime}
						onTimeChange={setPreferredTime}
						minDate={getMinDate()}
						bookedSlots={bookedSlots}
						slotsLoading={slotsLoading}
					/>
				</DialogContent>
				<DialogActions sx={{ px: 3, pb: 3 }}>
					<Button
						onClick={() => setCalendarOpen(false)}
						sx={{ color: "#777", fontFamily: ff, textTransform: "none" }}
					>
						Cancel
					</Button>
					<Button
						onClick={() => setCalendarOpen(false)}
						disabled={!preferredDate || !preferredTime}
						sx={{
							backgroundColor: "#E91E8C",
							color: "#fff",
							borderRadius: "20px",
							px: 3,
							fontFamily: ff,
							fontWeight: 600,
							textTransform: "none",
							"&:hover": { backgroundColor: "#C2185B" },
							"&.Mui-disabled": {
								backgroundColor: "#F0C0D0",
								color: "#fff",
							},
						}}
					>
						Confirm
					</Button>
				</DialogActions>
			</Dialog>

			{/* Confirm Reschedule Modal */}
			<Dialog
				open={confirmModalOpen}
				onClose={() => setConfirmModalOpen(false)}
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
						sx={{ fontFamily: ff, fontWeight: 700 }}
					>
						Confirm Reschedule?
					</Typography>
				</DialogTitle>
				<DialogContent>
					<Box
						sx={{
							mt: 1,
							p: 1.5,
							borderRadius: 2,
							backgroundColor: "#FFF0F5",
							border: "1px solid #F0C0D0",
							textAlign: "left",
						}}
					>
						<Typography
							sx={{
								fontSize: "0.85rem",
								color: "#4A0E4E",
								fontWeight: 600,
								mb: 0.5,
							}}
						>
							{allServices.find((s) => s.id === selectedService)?.name ||
								""}
						</Typography>
						<Typography sx={{ fontSize: "0.82rem", color: "#555" }}>
							New date:{" "}
							{preferredDate && preferredTime
								? `${formatDate(preferredDate)} at ${preferredTime}`
								: ""}
						</Typography>
						{selectedAppointment?.appointmentDate && (
							<Typography
								sx={{ fontSize: "0.78rem", color: "#999", mt: 0.3 }}
							>
								Original: {selectedAppointment.appointmentDate}
							</Typography>
						)}
					</Box>
					<Typography
						sx={{
							color: "#555",
							mt: 2,
							lineHeight: 1.7,
							fontSize: "0.9rem",
						}}
					>
						We'll open WhatsApp so your stylist can confirm the new slot.
					</Typography>
				</DialogContent>
				<DialogActions sx={{ justifyContent: "center", pb: 3, gap: 1 }}>
					<Button
						onClick={() => setConfirmModalOpen(false)}
						sx={{ fontFamily: ff, color: "#777", textTransform: "none" }}
					>
						Go Back
					</Button>
					<Button
						onClick={handleComplete}
						disabled={submitting}
						sx={{
							backgroundColor: "#E91E8C",
							color: "#fff",
							borderRadius: "30px",
							px: 4,
							py: 1.2,
							fontFamily: ff,
							fontWeight: 600,
							fontSize: "0.95rem",
							"&:hover": { backgroundColor: "#C2185B" },
						}}
					>
						{submitting ? (
							<CircularProgress size={22} sx={{ color: "#fff" }} />
						) : (
							"Proceed to WhatsApp"
						)}
					</Button>
				</DialogActions>
			</Dialog>
		</Box>
	);
}
