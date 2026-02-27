import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
} from '@mui/material';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import EventNoteIcon from '@mui/icons-material/EventNote';
import { serviceCategories } from '../data/services';
import ScrollReveal from '../components/ScrollReveal';
import { useAuth } from '../context/AuthContext';
import { fetchOrders, saveOrder, updateOrderStatus } from '../lib/orderService';

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

const RESCHEDULABLE_STATUSES = new Set(['pending', 'confirmed']);

export default function () {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [customerName, setCustomerName] = useState('');
  const [selectedService, setSelectedService] = useState('');
  const [reason, setReason] = useState('');
  const [preferredDate, setPreferredDate] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Appointment selection state (logged-in users)
  const [appointments, setAppointments] = useState([]);
  const [loadingAppointments, setLoadingAppointments] = useState(false);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState('');

  const allServices = serviceCategories.flatMap((cat) =>
    cat.services.map((s) => ({ ...s, category: cat.title }))
  );

  // Pre-fill name from auth and fetch reschedulable appointments
  useEffect(() => {
    if (!user) return;
    if (user.displayName && !customerName) setCustomerName(user.displayName);
    setLoadingAppointments(true);
    fetchOrders(user.uid, 'service')
      .then((orders) => {
        const reschedulable = orders.filter((o) => RESCHEDULABLE_STATUSES.has(o.status));
        setAppointments(reschedulable);
      })
      .catch(() => {})
      .finally(() => setLoadingAppointments(false));
  }, [user]);

  // Pre-fill form when an appointment is selected
  useEffect(() => {
    if (!selectedAppointmentId) return;
    const appt = appointments.find((a) => a.id === selectedAppointmentId);
    if (!appt) return;
    setCustomerName(appt.customerName || '');
    const serviceItem = appt.items?.[0];
    if (serviceItem) {
      const match = allServices.find((s) => s.name === serviceItem.serviceName);
      if (match) setSelectedService(match.id);
    }
  }, [selectedAppointmentId]);

  const selectedAppointment = appointments.find((a) => a.id === selectedAppointmentId);

  const getMinDate = () => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  };

  const isWeekend = (dateString) => {
    if (!dateString) return true;
    const day = new Date(dateString).getDay();
    return day === 0 || day === 6;
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

  const handleConfirm = () => {
    setModalOpen(true);
  };

  const handleComplete = async () => {
    const selected = allServices.find((s) => s.id === selectedService);
    const message = `Hi! I'd like to reschedule my appointment.\n\nName: ${customerName}\nOriginal Service: ${selected?.name || 'N/A'}\nReason for Rescheduling: ${reason}\nPreferred New Date: ${formatDate(preferredDate)}\n\nPlease confirm the new slot. Thank you!`;
    const encoded = encodeURIComponent(message);

    // Save to Firebase for logged-in users with a selected appointment
    if (user && selectedAppointmentId) {
      setSubmitting(true);
      try {
        await updateOrderStatus(user.uid, selectedAppointmentId, 'rescheduled');
        await saveOrder(user.uid, {
          type: 'service',
          total: selected?.price || 0,
          customerName: customerName.trim(),
          email: user.email || '',
          appointmentDate: formatDate(preferredDate),
          rescheduledFrom: selectedAppointmentId,
          rescheduleReason: reason.trim(),
          items: selectedAppointment?.items || [{
            kind: 'service',
            serviceName: selected?.name || '',
            price: selected?.price || 0,
            date: formatDate(preferredDate),
          }],
        });
      } catch {
        // Still proceed to WhatsApp even if Firebase save fails
      } finally {
        setSubmitting(false);
      }
    }

    setModalOpen(false);
    window.open(`https://api.whatsapp.com/send?phone=2349053714197&text=${encoded}`, '_blank');
    navigate('/');
  };

  const isFormValid =
    customerName.trim() && selectedService && reason.trim() && preferredDate.trim() && isWeekend(preferredDate);

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
									fontFamily: '"Georgia", serif',
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
								Need to change your appointment? Fill in the details
								below and we will connect you on WhatsApp to confirm a
								new time slot.
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

					{/* Appointment Selector (logged-in users only) */}
					{user && (
						<ScrollReveal direction="up">
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
									Select Appointment to Reschedule
								</Typography>
								{loadingAppointments ? (
									<Box sx={{ display: "flex", alignItems: "center", gap: 1, py: 1 }}>
										<CircularProgress size={20} sx={{ color: "#E91E8C" }} />
										<Typography sx={{ fontSize: "0.9rem", color: "#555" }}>
											Loading your appointments...
										</Typography>
									</Box>
								) : appointments.length > 0 ? (
									<>
										<FormControl fullWidth size="small">
											<InputLabel>Choose an appointment</InputLabel>
											<Select
												value={selectedAppointmentId}
												label="Choose an appointment"
												onChange={(e) => setSelectedAppointmentId(e.target.value)}
												sx={{ borderRadius: 2 }}
											>
												{appointments.map((appt) => {
													const serviceName = appt.items?.[0]?.serviceName || 'Service';
													const date = appt.appointmentDate || 'No date';
													return (
														<MenuItem key={appt.id} value={appt.id}>
															{serviceName} — {date}
														</MenuItem>
													);
												})}
											</Select>
										</FormControl>
										{selectedAppointment && (
											<Box
												sx={{
													mt: 1.5,
													p: 1.5,
													borderRadius: 2,
													backgroundColor: "#FCE4EC",
													border: "1px solid #F0C0D0",
												}}
											>
												<Typography sx={{ fontSize: "0.85rem", color: "#4A0E4E", fontWeight: 600 }}>
													Original Date: {selectedAppointment.appointmentDate || 'Not set'}
												</Typography>
											</Box>
										)}
									</>
								) : (
									<Typography sx={{ fontSize: "0.9rem", color: "#888", fontStyle: "italic" }}>
										No reschedulable appointments found. You can still fill in the form manually below.
									</Typography>
								)}
							</Box>
						</ScrollReveal>
					)}

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

					{/* Original Service Dropdown */}
					<ScrollReveal direction="up" delay={0.1}>
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

					{/* Reason for Rescheduling */}
					<ScrollReveal direction="up" delay={0.2}>
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

					{/* Preferred New Date */}
					<ScrollReveal direction="up" delay={0.3}>
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
								Preferred New Date
							</Typography>
							<TextField
								fullWidth
								type="date"
								value={preferredDate}
								onChange={(e) => setPreferredDate(e.target.value)}
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
							{preferredDate && !isWeekend(preferredDate) && (
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
						</Box>
					</ScrollReveal>

					{/* Spacer for sticky button */}
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
				<Button
					sx={{
						...confirmButtonSx,
						opacity: isFormValid ? 1 : 0.5,
					}}
					onClick={handleConfirm}
					disabled={!isFormValid}
				>
					Confirm Reschedule
				</Button>
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
						Reschedule Request Sent!
					</Typography>
				</DialogTitle>
				<DialogContent>
					<Typography sx={{ color: "#555", mt: 1, lineHeight: 1.7 }}>
						Your reschedule request is being processed. We will navigate
						you to WhatsApp to confirm the new appointment date with your
						stylist.
					</Typography>
				</DialogContent>
				<DialogActions sx={{ justifyContent: "center", pb: 3 }}>
					<Button
						onClick={handleComplete}
						disabled={submitting}
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
						{submitting ? <CircularProgress size={22} sx={{ color: "#fff" }} /> : 'Complete'}
					</Button>
				</DialogActions>
			</Dialog>
		</Box>
  );
}
