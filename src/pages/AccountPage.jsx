import { useState, useEffect, useMemo } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
	Box,
	Typography,
	Container,
	Button,
	Avatar,
	Tabs,
	Tab,
	Chip,
	CircularProgress,
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	TextField,
	IconButton,
	Tooltip,
	Divider,
	Snackbar,
	Alert,
	Select,
	MenuItem,
	FormControl,
	InputLabel,
} from "@mui/material";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import EventNoteIcon from "@mui/icons-material/EventNote";
import FavoriteIcon from "@mui/icons-material/Favorite";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import ShoppingCartOutlinedIcon from "@mui/icons-material/ShoppingCartOutlined";
import VisibilityOutlinedIcon from "@mui/icons-material/VisibilityOutlined";
import LogoutIcon from "@mui/icons-material/Logout";
import StarIcon from "@mui/icons-material/Star";
import StarBorderIcon from "@mui/icons-material/StarBorder";
import EditIcon from "@mui/icons-material/Edit";
import PhoneIcon from "@mui/icons-material/Phone";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import ContentCutIcon from "@mui/icons-material/ContentCut";
import NailBedSizeInput from "../components/NailBedSizeInput";
import RateReviewIcon from "@mui/icons-material/RateReview";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import ShoppingBagIcon from "@mui/icons-material/ShoppingBag";
import CardGiftcardIcon from "@mui/icons-material/CardGiftcard";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import ReplayIcon from "@mui/icons-material/Replay";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import {
	fetchOrders,
	updateOrderStatus,
	updateOrderDetails,
} from "../lib/orderService";
import { addCancellationRequest } from "../lib/cancellationService";
import { useNotifications } from "../context/NotificationContext";
import {
	saveTestimonial,
	getReviewedOrderIds,
} from "../lib/testimonialService";
import {
	getLoyaltyData,
	ensureReferralCode,
	savePendingLoyaltyReward,
	POINTS_PER_REFERRAL,
	REDEMPTION_UNIT, REDEMPTION_VALUE,
} from "../lib/loyaltyService";

const TABS = ["profile", "orders", "appointments", "wishlist"];
const ff = '"Georgia", serif';

function formatNaira(amount) {
	return `\u20A6${Number(amount).toLocaleString()}`;
}
function formatDate(ts) {
	if (!ts) return "";
	const d = ts.toDate ? ts.toDate() : new Date(ts);
	return d.toLocaleDateString("en-GB", {
		day: "numeric",
		month: "short",
		year: "numeric",
	});
}
function memberSince(ts) {
	if (!ts) return "";
	const d = ts.toDate ? ts.toDate() : new Date(ts);
	return d.toLocaleDateString("en-GB", { month: "long", year: "numeric" });
}

// Auto-compute preset tip size (XS/S/M/L) from nail bed sizes in mm.
// Uses the same data as PresetSizeGuide: tip 0 = ~18mm, tip 9 = ~9mm.
// Tiebreaker: per the guide, "choose the larger size for a more comfortable fit" → L > M > S > XS.
function computePresetSize(nailBedSizeStr) {
	if (!nailBedSizeStr) return "";
	const tipToMm = (tip) => 18 - tip;
	// finger key suffix → { XS, S, M, L } tip numbers (from PresetSizeGuide table)
	const fingerTips = {
		T: { XS: 3, S: 2, M: 1, L: 0 },
		I: { XS: 7, S: 6, M: 5, L: 4 },
		M: { XS: 5, S: 4, M: 3, L: 2 },
		R: { XS: 6, S: 5, M: 4, L: 3 },
		P: { XS: 9, S: 8, M: 7, L: 6 },
	};
	// Larger sizes rank higher — used as tiebreaker
	const sizeRank = { XS: 0, S: 1, M: 2, L: 3 };
	const scores = { XS: 0, S: 0, M: 0, L: 0 };
	let count = 0;
	nailBedSizeStr.split(",").forEach((part) => {
		const [key, val] = part.trim().split(":");
		if (!key || !val) return;
		const mm = parseFloat(val.trim());
		if (isNaN(mm)) return;
		const suffix = key.trim().slice(1); // 'RT' → 'T', 'LM' → 'M'
		const tipMap = fingerTips[suffix];
		if (!tipMap) return;
		count++;
		Object.entries(tipMap).forEach(([size, tip]) => {
			scores[size] += Math.abs(mm - tipToMm(tip));
		});
	});
	if (count === 0) return "";
	return Object.entries(scores).reduce(
		(best, [size, score]) => {
			if (score < best.score) return { size, score };
			// On a tie, prefer the larger size (more comfortable fit per the guide)
			if (score === best.score && sizeRank[size] > sizeRank[best.size])
				return { size, score };
			return best;
		},
		{ size: "", score: Infinity },
	).size;
}

// Normalize presetSize values from order data ('XS (Extra Small)' → 'XS')
function normalizePresetSize(str) {
	if (!str) return "";
	return str.split(" ")[0];
}

// Client loyalty tiers — 1 review per level, brand-aligned
const CLIENT_TIERS = [
	{ min: 5, label: 'Diamond Diva',  emoji: '💎', color: '#4A0E4E', bg: '#F3E5F5', border: '#CE93D8', desc: 'The absolute elite — top of the nail game!' },
	{ min: 4, label: 'Star Client',   emoji: '⭐', color: '#B8860B', bg: '#FFFDE7', border: '#FFD54F', desc: 'Proven loyal — a true Chizzys star!' },
	{ min: 3, label: 'Nail Lover',    emoji: '💅', color: '#C2185B', bg: '#FCE4EC', border: '#F48FB1', desc: 'Three visits strong — dedicated to the craft!' },
	{ min: 2, label: 'Glam Client',   emoji: '✨', color: '#6A1B9A', bg: '#EDE7F6', border: '#B39DDB', desc: "You came back — we love your loyalty!" },
	{ min: 1, label: 'Fresh Darling', emoji: '🌸', color: '#2E7D32', bg: '#F1F8E9', border: '#A5D6A7', desc: 'Brand new — welcome to Chizzys Nails!' },
	{ min: 0, label: 'New Member',    emoji: '🌟', color: '#E91E8C', bg: '#FFF0F5', border: '#F0C0D0', desc: 'Welcome! Leave your first review to start your loyalty journey.' },
];

function getClientTier(reviewCount) {
	return CLIENT_TIERS.find((t) => reviewCount >= t.min) || CLIENT_TIERS[CLIENT_TIERS.length - 1];
}

function getNextTier(reviewCount) {
	// CLIENT_TIERS is ordered high→low; next tier is the one whose min is just above current count
	return [...CLIENT_TIERS].reverse().find((t) => t.min > reviewCount) || null;
}

const inputSx = {
	mb: 2,
	"& .MuiOutlinedInput-root": { borderRadius: 2, fontFamily: ff },
};
const statBtnSx = {
	flex: 1,
	minWidth: 0,
	p: 1.5,
	borderRadius: 2,
	backgroundColor: "#fff",
	border: "1px solid #F0C0D0",
	textAlign: "center",
	cursor: "pointer",
	transition: "all 0.2s ease",
	"&:hover": {
		borderColor: "#E91E8C",
		boxShadow: "0 2px 8px rgba(233,30,140,0.12)",
	},
};

export default function AccountPage() {
	const { user, loading: authLoading, signInWithGoogle, signOut } = useAuth();
	const { wishlist, removeFromWishlist } = useWishlist();
	const { addProduct, addPressOn } = useCart();
	const { showToast } = useNotifications();
	const location = useLocation();
	const navigate = useNavigate();

	const hashTab = location.hash.replace("#", "");
	const tabIndex = TABS.indexOf(hashTab) >= 0 ? TABS.indexOf(hashTab) : 0;

	const [orders, setOrders] = useState([]);
	const [ordersLoading, setOrdersLoading] = useState(false);
	const [ratedOrders, setRatedOrders] = useState({});
	const [rateDialog, setRateDialog] = useState(null);
	const [cancelDialog, setCancelDialog] = useState(null);
	const [cancelReason, setCancelReason] = useState("");
	const [cancelReasonOther, setCancelReasonOther] = useState("");
	const [cancelLoading, setCancelLoading] = useState(false);
	const [cancelError, setCancelError] = useState(false);

	// Edit pending order state
	const [editOrderDialog, setEditOrderDialog] = useState(null);
	const [editOrderForm, setEditOrderForm] = useState({});
	const [editOrderSaving, setEditOrderSaving] = useState(false);

	// Loyalty & referral state (from Firestore)
	const [firestorePoints, setFirestorePoints] = useState(null); // null = loading
	const [referralUses, setReferralUses] = useState(0);
	const [myReferralCode, setMyReferralCode] = useState('');
	const [redeemDialogOpen, setRedeemDialogOpen] = useState(false);
	const [redeemAmount, setRedeemAmount] = useState(REDEMPTION_UNIT);
	const [redeemLoading, setRedeemLoading] = useState(false);
	const [redeemSuccess, setRedeemSuccess] = useState(false);

	// Profile UI state
	const [editOpen, setEditOpen] = useState(false);
	const [nailSizesOpen, setNailSizesOpen] = useState(false);
	const [profile, setProfile] = useState({
		phone: "",
		address: "",
		displayName: "",
	});
	const [editForm, setEditForm] = useState({
		phone: "",
		address: "",
		displayName: "",
	});
	const [nailForm, setNailForm] = useState({
		nailBedSize: "",
		nailTipSize: "",
	});

	useEffect(() => {
		if (!user) return;
		setOrdersLoading(true);
		fetchOrders(user.uid)
			.then(async (fetched) => {
				setOrders(fetched);
				const completedIds = fetched
					.filter(
						(o) => o.status === "received" || o.status === "completed",
					)
					.map((o) => o.id);
				if (completedIds.length > 0) {
					const reviewedSet = await getReviewedOrderIds(completedIds);
					const map = {};
					reviewedSet.forEach((id) => {
						map[id] = true;
					});
					setRatedOrders(map);
				}
			})
			.catch(() => {})
			.finally(() => setOrdersLoading(false));
	}, [user]);

	// Load loyalty points and referral stats from Firestore
	useEffect(() => {
		if (!user) return;
		Promise.all([
			getLoyaltyData(user.uid),
			ensureReferralCode(user.uid, user.displayName || ''),
		])
			.then(([loyalty, refData]) => {
				console.log(
					"[Loyalty Debug] Firestore user doc loyalty fields:",
					loyalty,
				);
				console.log(
					"[Loyalty Debug] loyaltyPoints from Firestore:",
					loyalty.loyaltyPoints,
				);
				setFirestorePoints(loyalty.loyaltyPoints);
				setMyReferralCode(refData.code);
				setReferralUses(refData.totalUses);
			})
			.catch((err) => {
				console.error("[Loyalty Debug] Error loading loyalty data:", err);
			});
	}, [user]);

	const handleRedeem = () => {
		if (!user) return;
		// Save reward to localStorage — actual Firestore deduction happens when the order is placed
		savePendingLoyaltyReward(redeemAmount);
		setRedeemSuccess(true);
	};

	// Load saved profile from localStorage
	useEffect(() => {
		if (!user) return;
		const saved = JSON.parse(
			localStorage.getItem(`profile_${user.uid}`) || "{}",
		);
		setProfile({
			phone: saved.phone || "",
			address: saved.address || "",
			displayName: saved.displayName || user.displayName || "",
		});
		setNailForm({
			nailBedSize: saved.nailBedSize || "",
			nailTipSize: saved.nailTipSize || "",
		});
	}, [user]);

	const handleTabChange = (_, newVal) => {
		navigate(`/account#${TABS[newVal]}`, { replace: true });
	};

	const handleCancelAppointment = async () => {
		if (!cancelDialog || !cancelReason) return;
		const id = cancelDialog.id;
		const prevStatus = cancelDialog.status;
		const finalReason =
			cancelReason === "Other" ? cancelReasonOther.trim() : cancelReason;
		if (!finalReason) return;
		setCancelLoading(true);
		setCancelError(false);
		// Optimistic update — card reflects cancelled immediately
		setOrders((prev) =>
			prev.map((o) => (o.id === id ? { ...o, status: "cancelled" } : o)),
		);
		setCancelDialog(null);
		try {
			await updateOrderStatus(user.uid, id, "cancelled");
			showToast("Your cancellation has been submitted.", "info");
			// Save cancellation reason to Firestore for admin review
			await addCancellationRequest({
				orderId: id,
				uid: user.uid,
				customerName: cancelDialog.customerName || user.displayName || "",
				customerEmail: user.email || "",
				orderType: cancelDialog.type || "",
				serviceName:
					cancelDialog.items?.[0]?.serviceName ||
					cancelDialog.items?.[0]?.name ||
					"",
				appointmentDate: cancelDialog.appointmentDate || "",
				reason: finalReason,
			});
		} catch (_) {
			// Revert if Firestore write fails
			setOrders((prev) =>
				prev.map((o) => (o.id === id ? { ...o, status: prevStatus } : o)),
			);
			setCancelError(true);
		} finally {
			setCancelLoading(false);
			setCancelReason("");
			setCancelReasonOther("");
		}
	};

	const handleOpenEditOrder = (order) => {
		const firstItem = order.items?.[0] || {};
		setEditOrderForm({
			customerName: order.customerName || "",
			notes: order.notes || "",
			nailShape: firstItem.nailShape || "",
			nailBedSize: firstItem.nailBedSize || "",
			presetSize: firstItem.presetSize || "",
			phone: order.phone || "",
		});
		setEditOrderDialog(order);
	};

	const handleReorder = (order) => {
		const pressOnItems = order.items?.filter((i) => i.kind === 'pressOn') || [];
		if (!pressOnItems.length) return;
		pressOnItems.forEach((item) => {
			addPressOn({
				name: item.name,
				price: item.price,
				quantity: item.quantity || 1,
				nailShape: item.nailShape || '',
				nailBedSize: item.nailBedSize || '',
				presetSize: item.presetSize || '',
				type: item.type || '',
				stock: 99,
			});
		});
		showToast(`${pressOnItems.length} item(s) added to cart`, 'success');
		navigate('/cart');
	};

	const handleEditOrderSave = async () => {
		if (!editOrderDialog || !user) return;
		setEditOrderSaving(true);
		try {
			const updates = {};
			if (editOrderForm.customerName.trim())
				updates.customerName = editOrderForm.customerName.trim();
			if (editOrderForm.notes !== undefined)
				updates.notes = editOrderForm.notes;
			if (editOrderForm.phone !== undefined)
				updates.phone = editOrderForm.phone;
			const isService =
				editOrderDialog.type === "service" ||
				editOrderDialog.type === "mixed";
			const isPressOn = !isService && editOrderDialog.items?.[0];
			if (isPressOn) {
				updates.items = editOrderDialog.items.map((item, i) =>
					i === 0
						? {
								...item,
								nailShape:
									editOrderForm.nailShape !== undefined
										? editOrderForm.nailShape
										: item.nailShape,
								nailBedSize:
									editOrderForm.nailBedSize !== undefined
										? editOrderForm.nailBedSize
										: item.nailBedSize,
								presetSize:
									editOrderForm.presetSize !== undefined
										? editOrderForm.presetSize
										: item.presetSize,
							}
						: item,
				);
			}
			await updateOrderDetails(user.uid, editOrderDialog.id, updates);
			setOrders((prev) =>
				prev.map((o) =>
					o.id === editOrderDialog.id ? { ...o, ...updates } : o,
				),
			);
			setEditOrderDialog(null);
			showToast("Order updated successfully.", "success");
		} catch {
			showToast("Could not save changes. Please try again.", "error");
		} finally {
			setEditOrderSaving(false);
		}
	};

	const serviceOrders = orders.filter(
		(o) => o.type === "service" || o.type === "mixed",
	);
	const otherOrders = orders.filter((o) => o.type !== "service");
	const reviewCount = Object.keys(ratedOrders).length;
	const giftCardOrders = orders.filter((o) =>
		o.items?.some((i) =>
			(i.name || i.serviceName || "").toLowerCase().includes("gift card"),
		),
	);

	// Loyalty points — from Firestore (null while loading, falls back to order-computed)
	const computedPoints = orders.reduce((total, o) => {
		const earnedForService = o.type === "service" && o.status === "completed";
		const earnedForOrder = o.type !== "service" && o.status === "received";
		if (!earnedForService && !earnedForOrder) return total;
		return total + (o.type === "service" ? 20 : 15);
	}, 0);
	console.log(
		"[Loyalty Debug] orders:",
		orders.map((o) => ({ id: o.id, type: o.type, status: o.status })),
	);
	console.log(
		"[Loyalty Debug] computedPoints (from orders):",
		computedPoints,
		"| firestorePoints:",
		firestorePoints,
	);
	const loyaltyPoints =
		firestorePoints !== null ? firestorePoints : computedPoints;
	const redeemableNaira =
		Math.floor(loyaltyPoints / REDEMPTION_UNIT) * REDEMPTION_VALUE;
	const maxRedeemableUnits = Math.floor(loyaltyPoints / REDEMPTION_UNIT);

	const referralCode = myReferralCode || (user?.uid ? `CHIZZYS-${user.uid.slice(0, 8).toUpperCase()}` : '');
	const referralLink = `${window.location.origin}/?ref=${referralCode}`;

	// Re-booking prompt logic
	const hasCompletedAppt = serviceOrders.some(
		(o) => o.status === "completed" || o.status === "received",
	);
	const hasActiveAppt = serviceOrders.some((o) =>
		["pending", "confirmed", "in progress"].includes(o.status),
	);
	const showRebookPrompt = hasCompletedAppt && !hasActiveAppt;

	// Extract phone/address from orders if not saved in profile
	const phoneFromOrders = useMemo(() => {
		for (const o of orders) {
			if (o.phone) return o.phone;
			if (o.shipping?.phone) return o.shipping.phone;
		}
		return "";
	}, [orders]);

	const shippingFromOrders = useMemo(() => {
		for (const o of orders) {
			if (o.shipping?.address) return o.shipping;
		}
		return null;
	}, [orders]);

	// Latest nail sizes from orders (auto-populate if not saved)
	const nailSizesFromOrders = useMemo(() => {
		const sorted = [...orders].sort(
			(a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0),
		);
		for (const o of sorted) {
			for (const item of o.items || []) {
				if (item.nailBedSize || item.presetSize) {
					return {
						nailBedSize: item.nailBedSize || "",
						nailTipSize: normalizePresetSize(item.presetSize),
					};
				}
			}
		}
		return null;
	}, [orders]);

	const displayPhone = profile.phone || phoneFromOrders;
	const displayAddress =
		profile.address ||
		(shippingFromOrders
			? [
					shippingFromOrders.address,
					shippingFromOrders.lga,
					shippingFromOrders.state,
				]
					.filter(Boolean)
					.join(", ")
			: "");

	const openEditProfile = () => {
		setEditForm({
			phone: profile.phone || phoneFromOrders,
			address: profile.address || "",
			displayName: profile.displayName,
		});
		setEditOpen(true);
	};

	const saveEditProfile = () => {
		const updated = {
			...profile,
			phone: editForm.phone.trim(),
			address: editForm.address.trim(),
			displayName: editForm.displayName.trim() || user.displayName,
		};
		setProfile(updated);
		const existing = JSON.parse(
			localStorage.getItem(`profile_${user.uid}`) || "{}",
		);
		localStorage.setItem(
			`profile_${user.uid}`,
			JSON.stringify({ ...existing, ...updated }),
		);
		setEditOpen(false);
	};

	const openNailSizes = () => {
		const base = nailSizesFromOrders || { nailBedSize: "", nailTipSize: "" };
		setNailForm({
			nailBedSize: nailForm.nailBedSize || base.nailBedSize,
			nailTipSize: nailForm.nailTipSize || base.nailTipSize,
		});
		setNailSizesOpen(true);
	};

	const saveNailSizes = () => {
		const saved = JSON.parse(
			localStorage.getItem(`profile_${user.uid}`) || "{}",
		);
		localStorage.setItem(
			`profile_${user.uid}`,
			JSON.stringify({
				...saved,
				nailBedSize: nailForm.nailBedSize,
				nailTipSize: nailForm.nailTipSize,
			}),
		);
		setNailSizesOpen(false);
	};

	// Parse nail bed size string to count filled fingers
	const filledFingers = useMemo(() => {
		const str =
			nailForm.nailBedSize || nailSizesFromOrders?.nailBedSize || "";
		if (!str) return 0;
		return str.split(",").filter((p) => p.includes(":")).length;
	}, [nailForm.nailBedSize, nailSizesFromOrders]);

	if (authLoading) {
		return (
			<Box sx={{ pt: 16, textAlign: "center" }}>
				<CircularProgress sx={{ color: "#E91E8C" }} />
			</Box>
		);
	}

	if (!user) {
		return (
			<Box
				sx={{
					pt: { xs: 12, md: 14 },
					pb: 10,
					minHeight: "100vh",
					backgroundColor: "#FFF0F5",
				}}
			>
				<Container maxWidth="sm" sx={{ textAlign: "center" }}>
					<PersonOutlineIcon
						sx={{ fontSize: 64, color: "#E91E8C", mb: 2 }}
					/>
					<Typography
						variant="h4"
						sx={{ fontFamily: ff, fontWeight: 700, mb: 2 }}
					>
						Sign in to your account
					</Typography>
					<Typography sx={{ color: "#555", mb: 4, lineHeight: 1.7 }}>
						Sign in with Google to view your order history, track
						appointments, and manage your profile.
					</Typography>
					<Button
						onClick={() => signInWithGoogle().catch(() => {})}
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
						Sign in with Google
					</Button>
				</Container>
			</Box>
		);
	}

	return (
		<Box
			sx={{
				pt: { xs: 10, md: 12 },
				pb: 10,
				minHeight: "100vh",
				backgroundColor: "#FFF0F5",
			}}
		>
			<Container maxWidth="md">
				<Typography
					variant="h3"
					sx={{
						fontFamily: ff,
						fontWeight: 700,
						color: "#000",
						mb: 3,
						textAlign: "center",
						fontSize: { xs: "1.8rem", sm: "2.4rem", md: "3rem" },
					}}
				>
					My Account
				</Typography>

				<Tabs
					value={tabIndex}
					onChange={handleTabChange}
					centered
					sx={{
						mb: 4,
						"& .MuiTab-root": {
							fontFamily: ff,
							fontWeight: 600,
							textTransform: "none",
							fontSize: "0.95rem",
						},
						"& .Mui-selected": { color: "#E91E8C" },
						"& .MuiTabs-indicator": { backgroundColor: "#E91E8C" },
					}}
				>
					<Tab label="Profile" />
					<Tab label="Orders" />
					<Tab label="Appointments" />
					<Tab
						icon={<FavoriteIcon sx={{ fontSize: 18 }} />}
						iconPosition="start"
						label="Wishlist"
					/>
				</Tabs>

				{/* ── Profile Tab ── */}
				{tabIndex === 0 && (
					<Box>
						{/* Avatar + Identity */}
						<Box sx={{ textAlign: "center", mb: 3 }}>
							<Box
								sx={{
									position: "relative",
									display: "inline-block",
									mb: 2,
								}}
							>
								<Avatar
									src={user.photoURL}
									alt={user.displayName}
									sx={{
										width: 90,
										height: 90,
										border: "3px solid #E91E8C",
									}}
								/>
							</Box>
							<Typography
								sx={{
									fontFamily: ff,
									fontWeight: 700,
									fontSize: "1.4rem",
								}}
							>
								{profile.displayName || user.displayName}
							</Typography>
							<Typography
								sx={{ color: "#777", fontSize: "0.9rem", mb: 0.5 }}
							>
								{user.email}
							</Typography>
							{user.metadata?.creationTime && (
								<Typography sx={{ color: "#aaa", fontSize: "0.78rem" }}>
									Member since{" "}
									{memberSince({
										toDate: () =>
											new Date(user.metadata.creationTime),
									})}
								</Typography>
							)}
							<Button
								startIcon={<EditIcon sx={{ fontSize: 16 }} />}
								onClick={openEditProfile}
								size="small"
								sx={{
									mt: 1.5,
									border: "1.5px solid #E91E8C",
									borderRadius: "20px",
									color: "#E91E8C",
									px: 2.5,
									py: 0.6,
									fontFamily: ff,
									fontWeight: 600,
									fontSize: "0.82rem",
									textTransform: "none",
									"&:hover": {
										backgroundColor: "#E91E8C",
										color: "#fff",
									},
								}}
							>
								Edit Profile
							</Button>
						</Box>

						{/* Stats Row */}
						<Box
							sx={{ display: "flex", gap: 1.5, mb: 3, flexWrap: "wrap" }}
						>
							<Box sx={statBtnSx} onClick={() => navigate("/products")}>
								<ShoppingBagIcon
									sx={{ fontSize: 24, color: "#4A0E4E", mb: 0.5 }}
								/>
								<Typography
									sx={{
										fontFamily: ff,
										fontWeight: 700,
										fontSize: "1.4rem",
										color: "#4A0E4E",
										lineHeight: 1,
									}}
								>
									{otherOrders.length}
								</Typography>
								<Typography
									sx={{ fontSize: "0.72rem", color: "#777", mt: 0.3 }}
								>
									Orders
								</Typography>
							</Box>
							<Box sx={statBtnSx} onClick={() => navigate("/services")}>
								<CalendarTodayIcon
									sx={{ fontSize: 24, color: "#E91E8C", mb: 0.5 }}
								/>
								<Typography
									sx={{
										fontFamily: ff,
										fontWeight: 700,
										fontSize: "1.4rem",
										color: "#E91E8C",
										lineHeight: 1,
									}}
								>
									{serviceOrders.length}
								</Typography>
								<Typography
									sx={{ fontSize: "0.72rem", color: "#777", mt: 0.3 }}
								>
									Appointments
								</Typography>
							</Box>
							<Box
								sx={statBtnSx}
								onClick={() => navigate("/testimonials")}
							>
								<RateReviewIcon
									sx={{ fontSize: 24, color: "#2e7d32", mb: 0.5 }}
								/>
								<Typography
									sx={{
										fontFamily: ff,
										fontWeight: 700,
										fontSize: "1.4rem",
										color: "#2e7d32",
										lineHeight: 1,
									}}
								>
									{reviewCount}
								</Typography>
								<Typography
									sx={{ fontSize: "0.72rem", color: "#777", mt: 0.3 }}
								>
									Reviews
								</Typography>
							</Box>
							<Box
								sx={statBtnSx}
								onClick={() => navigate("/account#wishlist")}
							>
								<FavoriteIcon
									sx={{ fontSize: 24, color: "#E91E8C", mb: 0.5 }}
								/>
								<Typography
									sx={{
										fontFamily: ff,
										fontWeight: 700,
										fontSize: "1.4rem",
										color: "#E91E8C",
										lineHeight: 1,
									}}
								>
									{wishlist.length}
								</Typography>
								<Typography
									sx={{ fontSize: "0.72rem", color: "#777", mt: 0.3 }}
								>
									Wishlist
								</Typography>
							</Box>
							{giftCardOrders.length > 0 && (
								<Box sx={statBtnSx}>
									<CardGiftcardIcon
										sx={{ fontSize: 24, color: "#7B1FA2", mb: 0.5 }}
									/>
									<Typography
										sx={{
											fontFamily: ff,
											fontWeight: 700,
											fontSize: "1.4rem",
											color: "#7B1FA2",
											lineHeight: 1,
										}}
									>
										{giftCardOrders.length}
									</Typography>
									<Typography
										sx={{
											fontSize: "0.72rem",
											color: "#777",
											mt: 0.3,
										}}
									>
										Gift Cards
									</Typography>
								</Box>
							)}
						</Box>

						{/* Client Status */}
						{reviewCount > 0 &&
							(() => {
								const tier = getClientTier(reviewCount);
								const next = getNextTier(reviewCount);
								return (
									<Box
										sx={{
											mb: 3,
											p: 2.5,
											borderRadius: 3,
											background: `linear-gradient(135deg, ${tier.bg} 0%, #fff 100%)`,
											border: `1.5px solid ${tier.border}`,
										}}
									>
										<Box
											sx={{
												display: "flex",
												alignItems: "center",
												gap: 1.5,
											}}
										>
											<Typography
												sx={{ fontSize: "2rem", lineHeight: 1 }}
											>
												{tier.emoji}
											</Typography>
											<Box sx={{ flex: 1 }}>
												<Typography
													sx={{
														fontFamily: ff,
														fontWeight: 700,
														fontSize: "1rem",
														color: tier.color,
													}}
												>
													{tier.label}
												</Typography>
												<Typography
													sx={{
														fontSize: "0.78rem",
														color: "#666",
														mt: 0.2,
													}}
												>
													{tier.desc}
												</Typography>
											</Box>
											<Box sx={{ textAlign: "right" }}>
												<Typography
													sx={{
														fontFamily: ff,
														fontWeight: 700,
														fontSize: "1.3rem",
														color: tier.color,
														lineHeight: 1,
													}}
												>
													{reviewCount}
												</Typography>
												<Typography
													sx={{
														fontSize: "0.68rem",
														color: "#999",
													}}
												>
													{reviewCount === 1
														? "review"
														: "reviews"}
												</Typography>
											</Box>
										</Box>
										{next && (
											<Box sx={{ mt: 1.8 }}>
												<Box
													sx={{
														display: "flex",
														justifyContent: "space-between",
														mb: 0.5,
													}}
												>
													<Typography
														sx={{
															fontSize: "0.7rem",
															color: "#999",
														}}
													>
														{next.min - reviewCount} more{" "}
														{next.min - reviewCount === 1
															? "review"
															: "reviews"}{" "}
														to reach
													</Typography>
													<Typography
														sx={{
															fontSize: "0.7rem",
															fontWeight: 700,
															color: next.color,
														}}
													>
														{next.emoji} {next.label}
													</Typography>
												</Box>
												<Box
													sx={{
														height: 5,
														borderRadius: 10,
														backgroundColor: "#eee",
														overflow: "hidden",
													}}
												>
													<Box
														sx={{
															height: "100%",
															borderRadius: 10,
															width: `${(reviewCount / next.min) * 100}%`,
															background: `linear-gradient(90deg, ${tier.border}, ${tier.color})`,
															transition: "width 0.6s ease",
														}}
													/>
												</Box>
											</Box>
										)}
										{!next && (
											<Typography
												sx={{
													mt: 1.2,
													fontSize: "0.75rem",
													color: tier.color,
													fontWeight: 600,
													textAlign: "center",
												}}
											>
												🎉 Maximum tier reached — you&apos;re a
												Chizzys legend!
											</Typography>
										)}
									</Box>
								);
							})()}

						{/* Loyalty Points Card */}
						<Box
							sx={{
								mb: 3,
								p: 2.5,
								borderRadius: 3,
								background:
									"linear-gradient(135deg, #FFF8E1 0%, #FFF0F5 100%)",
								border: "1.5px solid #FFD54F",
							}}
						>
							<Box
								sx={{
									display: "flex",
									alignItems: "center",
									justifyContent: "space-between",
									mb: 1.5,
								}}
							>
								<Box
									sx={{
										display: "flex",
										alignItems: "center",
										gap: 1,
									}}
								>
									<Typography
										sx={{ fontSize: "1.4rem", lineHeight: 1 }}
									>
										🏆
									</Typography>
									<Box>
										<Typography
											sx={{
												fontFamily: ff,
												fontWeight: 700,
												fontSize: "0.95rem",
												color: "#4A0E4E",
											}}
										>
											Loyalty Points
										</Typography>
										<Typography
											sx={{ fontSize: "0.72rem", color: "#777" }}
										>
											Earn points on every completed order &
											appointment
										</Typography>
									</Box>
								</Box>
								<Box sx={{ textAlign: "right" }}>
									<Typography
										sx={{
											fontFamily: ff,
											fontWeight: 700,
											fontSize: "1.6rem",
											color: "#B8860B",
											lineHeight: 1,
										}}
									>
										{loyaltyPoints}
									</Typography>
									<Typography
										sx={{ fontSize: "0.68rem", color: "#999" }}
									>
										points
									</Typography>
								</Box>
							</Box>
							<Box
								sx={{
									height: 6,
									borderRadius: 10,
									backgroundColor: "#FDE68A",
									overflow: "hidden",
									mb: 1,
								}}
							>
								<Box
									sx={{
										height: "100%",
										borderRadius: 10,
										width: `${Math.min(100, (loyaltyPoints % 50) * 2)}%`,
										background:
											"linear-gradient(90deg, #FFD54F, #B8860B)",
										transition: "width 0.6s ease",
									}}
								/>
							</Box>
							<Box
								sx={{
									display: "flex",
									justifyContent: "space-between",
									alignItems: "center",
								}}
							>
								<Typography sx={{ fontSize: "0.72rem", color: "#777" }}>
									{loyaltyPoints % 50} / 50 pts to next ₦1,000 reward
								</Typography>
								{redeemableNaira > 0 && (
									<Box
										sx={{
											backgroundColor: "#E91E8C",
											borderRadius: "14px",
											px: 1.5,
											py: 0.4,
										}}
									>
										<Typography
											sx={{
												fontSize: "0.72rem",
												fontWeight: 700,
												color: "#fff",
											}}
										>
											{formatNaira(redeemableNaira)} redeemable!
										</Typography>
									</Box>
								)}
							</Box>
							{redeemableNaira > 0 && (
								<Button
									fullWidth
									onClick={() => {
										setRedeemAmount(REDEMPTION_UNIT);
										setRedeemSuccess(false);
										setRedeemDialogOpen(true);
									}}
									sx={{
										mt: 1.5,
										backgroundColor: "#B8860B",
										color: "#fff",
										borderRadius: "20px",
										py: 0.8,
										fontFamily: ff,
										fontWeight: 700,
										fontSize: "0.82rem",
										textTransform: "none",
										"&:hover": { backgroundColor: "#996600" },
									}}
								>
									🎁 Redeem {formatNaira(redeemableNaira)} in Rewards
								</Button>
							)}
							<Box
								sx={{
									mt: 1.5,
									pt: 1.5,
									borderTop: "1px solid #FDE68A",
								}}
							>
								<Typography
									sx={{
										fontSize: "0.7rem",
										color: "#999",
										lineHeight: 1.8,
									}}
								>
									💅 <strong>15 pts</strong> per press-on order ·{" "}
									<strong>20 pts</strong> per appointment ·{" "}
									<strong>50 pts = ₦1,000 off</strong>
								</Typography>
							</Box>
						</Box>

						{/* Referral Code Card */}
						<Box
							sx={{
								mb: 3,
								p: 2.5,
								borderRadius: 3,
								background:
									"linear-gradient(135deg, #EDE7F6 0%, #FFF0F5 100%)",
								border: "1.5px solid #CE93D8",
							}}
						>
							<Box
								sx={{
									display: "flex",
									alignItems: "center",
									justifyContent: "space-between",
									mb: 1.5,
								}}
							>
								<Box
									sx={{
										display: "flex",
										alignItems: "center",
										gap: 1,
									}}
								>
									<Typography
										sx={{ fontSize: "1.4rem", lineHeight: 1 }}
									>
										🎀
									</Typography>
									<Box>
										<Typography
											sx={{
												fontFamily: ff,
												fontWeight: 700,
												fontSize: "0.95rem",
												color: "#4A0E4E",
											}}
										>
											Refer a Friend
										</Typography>
										<Typography
											sx={{ fontSize: "0.72rem", color: "#777" }}
										>
											Share your code — everyone you refer gets
											₦1,000 off
										</Typography>
									</Box>
								</Box>
								{referralUses > 0 && (
									<Box sx={{ textAlign: "right" }}>
										<Typography
											sx={{
												fontFamily: ff,
												fontWeight: 700,
												fontSize: "0.88rem",
												color: "#6A1B9A",
											}}
										>
											{referralUses}× used
										</Typography>
										<Typography
											sx={{ fontSize: "0.65rem", color: "#999" }}
										>
											{referralUses * POINTS_PER_REFERRAL} pts earned
										</Typography>
									</Box>
								)}
							</Box>
							{referralUses > 0 && (
								<Box
									sx={{
										mb: 1.5,
										p: 1.2,
										borderRadius: 2,
										background:
											"linear-gradient(135deg, #EDE7F6, #F3E5F5)",
										border: "1px solid #CE93D8",
										display: "flex",
										alignItems: "center",
										justifyContent: "space-between",
									}}
								>
									<Box>
										<Typography
											sx={{
												fontWeight: 700,
												fontSize: "0.82rem",
												color: "#6A1B9A",
											}}
										>
											🏆 {referralUses * POINTS_PER_REFERRAL} pts
											earned from referrals
										</Typography>
										<Typography
											sx={{ fontSize: "0.7rem", color: "#888" }}
										>
											{referralUses} friend
											{referralUses !== 1 ? "s" : ""} used your code
											· added to loyalty balance
										</Typography>
									</Box>
									<Typography
										sx={{
											fontFamily: ff,
											fontWeight: 700,
											fontSize: "0.82rem",
											color: "#B8860B",
										}}
									>
										≡{" "}
										{formatNaira(
											Math.floor(
												(referralUses * POINTS_PER_REFERRAL) /
													REDEMPTION_UNIT,
											) * REDEMPTION_VALUE,
										)}
									</Typography>
								</Box>
							)}
							<Box
								sx={{
									display: "flex",
									alignItems: "center",
									gap: 1,
									p: 1.2,
									borderRadius: 2,
									backgroundColor: "#fff",
									border: "1px solid #CE93D8",
									mb: 1.5,
								}}
							>
								<Typography
									sx={{
										fontFamily: ff,
										fontWeight: 700,
										fontSize: "0.95rem",
										color: "#4A0E4E",
										flex: 1,
										letterSpacing: 1,
									}}
								>
									{referralCode}
								</Typography>
								<Button
									size="small"
									onClick={() =>
										navigator.clipboard
											.writeText(referralCode)
											.catch(() => {})
									}
									sx={{
										color: "#6A1B9A",
										fontFamily: ff,
										fontWeight: 600,
										fontSize: "0.72rem",
										textTransform: "none",
										px: 1.5,
										py: 0.4,
										border: "1px solid #CE93D8",
										borderRadius: "14px",
										"&:hover": { backgroundColor: "#EDE7F6" },
									}}
								>
									Copy
								</Button>
							</Box>
							<Button
								fullWidth
								onClick={() => {
									const msg = encodeURIComponent(
										`💅 Hey! I use Chizzys Nails for my press-ons & appointments — they're amazing! Use my code *${referralCode}* to get ₦1,000 off your first order: ${referralLink}`,
									);
									window.open(
										`https://api.whatsapp.com/send?text=${msg}`,
										"_blank",
									);
								}}
								sx={{
									backgroundColor: "#25D366",
									color: "#fff",
									borderRadius: "20px",
									py: 0.8,
									fontFamily: ff,
									fontWeight: 600,
									fontSize: "0.82rem",
									textTransform: "none",
									"&:hover": { backgroundColor: "#1da851" },
								}}
							>
								💬 Share via WhatsApp
							</Button>
							<Typography
								sx={{
									fontSize: "0.68rem",
									color: "#999",
									mt: 1,
									textAlign: "center",
								}}
							>
								Referral points go into your loyalty balance — redeem at
								checkout on any order or appointment
							</Typography>
						</Box>

						{/* Quick Actions */}
						<Box
							sx={{ display: "flex", gap: 1.5, mb: 3, flexWrap: "wrap" }}
						>
							<Button
								startIcon={<ContentCutIcon />}
								onClick={openNailSizes}
								sx={{
									flex: 1,
									minWidth: 140,
									border: "1.5px solid #E91E8C",
									borderRadius: "20px",
									color: "#E91E8C",
									py: 1,
									fontFamily: ff,
									fontWeight: 600,
									fontSize: "0.85rem",
									textTransform: "none",
									"&:hover": {
										backgroundColor: "#E91E8C",
										color: "#fff",
									},
								}}
							>
								View Nail Sizes
							</Button>
							<Button
								startIcon={<RateReviewIcon />}
								onClick={() => navigate("/testimonials")}
								sx={{
									flex: 1,
									minWidth: 140,
									border: "1.5px solid #4A0E4E",
									borderRadius: "20px",
									color: "#4A0E4E",
									py: 1,
									fontFamily: ff,
									fontWeight: 600,
									fontSize: "0.85rem",
									textTransform: "none",
									"&:hover": {
										backgroundColor: "#4A0E4E",
										color: "#fff",
									},
								}}
							>
								All Reviews
							</Button>
							<Button
								startIcon={<EventNoteIcon />}
								onClick={() => navigate("/services")}
								sx={{
									flex: 1,
									minWidth: 140,
									border: "1.5px solid #4A0E4E",
									borderRadius: "20px",
									color: "#4A0E4E",
									py: 1,
									fontFamily: ff,
									fontWeight: 600,
									fontSize: "0.85rem",
									textTransform: "none",
									"&:hover": {
										backgroundColor: "#4A0E4E",
										color: "#fff",
									},
								}}
							>
								Book Appointment
							</Button>
						</Box>

						{/* Contact & Address Details */}
						{(displayPhone || displayAddress) && (
							<Box
								sx={{
									mb: 3,
									p: 2.5,
									borderRadius: 3,
									backgroundColor: "#fff",
									border: "1px solid #F0C0D0",
								}}
							>
								<Box
									sx={{
										display: "flex",
										alignItems: "center",
										justifyContent: "space-between",
										mb: 1.5,
									}}
								>
									<Typography
										sx={{
											fontFamily: ff,
											fontWeight: 700,
											fontSize: "0.85rem",
											color: "#4A0E4E",
											textTransform: "uppercase",
											letterSpacing: 0.5,
										}}
									>
										Contact Details
									</Typography>
									<Tooltip title="Edit contact details">
										<IconButton
											size="small"
											onClick={openEditProfile}
											sx={{ color: "#E91E8C" }}
										>
											<EditIcon sx={{ fontSize: 16 }} />
										</IconButton>
									</Tooltip>
								</Box>
								{displayPhone && (
									<Box
										sx={{
											display: "flex",
											alignItems: "center",
											gap: 1,
											mb: 1,
										}}
									>
										<PhoneIcon
											sx={{ fontSize: 18, color: "#E91E8C" }}
										/>
										<Typography
											sx={{
												fontFamily: ff,
												fontSize: "0.88rem",
												color: "#333",
											}}
										>
											{displayPhone}
										</Typography>
									</Box>
								)}
								{displayAddress && (
									<Box
										sx={{
											display: "flex",
											alignItems: "flex-start",
											gap: 1,
										}}
									>
										<LocationOnIcon
											sx={{
												fontSize: 18,
												color: "#E91E8C",
												mt: 0.1,
											}}
										/>
										<Typography
											sx={{
												fontFamily: ff,
												fontSize: "0.88rem",
												color: "#333",
											}}
										>
											{displayAddress}
										</Typography>
									</Box>
								)}
							</Box>
						)}

						{/* Nail Sizes Preview */}
						{(filledFingers > 0 ||
							nailForm.nailTipSize ||
							nailSizesFromOrders) && (
							<Box
								onClick={openNailSizes}
								sx={{
									mb: 3,
									p: 2.5,
									borderRadius: 3,
									backgroundColor: "#fff",
									border: "1px solid #F0C0D0",
									cursor: "pointer",
									"&:hover": { borderColor: "#E91E8C" },
									transition: "all 0.2s ease",
								}}
							>
								<Box
									sx={{
										display: "flex",
										alignItems: "center",
										justifyContent: "space-between",
									}}
								>
									<Box
										sx={{
											display: "flex",
											alignItems: "center",
											gap: 1,
										}}
									>
										<ContentCutIcon
											sx={{ fontSize: 18, color: "#E91E8C" }}
										/>
										<Typography
											sx={{
												fontFamily: ff,
												fontWeight: 700,
												fontSize: "0.85rem",
												color: "#4A0E4E",
												textTransform: "uppercase",
												letterSpacing: 0.5,
											}}
										>
											My Nail Sizes
										</Typography>
									</Box>
									<ChevronRightIcon sx={{ color: "#ccc" }} />
								</Box>
								<Box
									sx={{
										display: "flex",
										gap: 1,
										mt: 1.5,
										flexWrap: "wrap",
									}}
								>
									{filledFingers > 0 && (
										<Chip
											label={`Nail Bed: ${filledFingers}/10 fingers measured`}
											size="small"
											sx={{
												backgroundColor: "#FFF0F5",
												color: "#4A0E4E",
												fontWeight: 600,
												fontSize: "0.78rem",
											}}
										/>
									)}
									{!filledFingers &&
										nailSizesFromOrders?.nailBedSize && (
											<Chip
												label={`Nail Bed: from last order`}
												size="small"
												sx={{
													backgroundColor: "#FFF0F5",
													color: "#4A0E4E",
													fontWeight: 600,
													fontSize: "0.78rem",
												}}
											/>
										)}
									{(nailForm.nailTipSize ||
										nailSizesFromOrders?.nailTipSize) && (
										<Chip
											label={`Tip Size: ${nailForm.nailTipSize || nailSizesFromOrders?.nailTipSize}`}
											size="small"
											sx={{
												backgroundColor: "#FFF0F5",
												color: "#E91E8C",
												fontWeight: 600,
												fontSize: "0.78rem",
											}}
										/>
									)}
								</Box>
							</Box>
						)}

						<Divider sx={{ borderColor: "#F0C0D0", mb: 3 }} />

						{/* Sign Out */}
						<Box sx={{ textAlign: "center" }}>
							<Button
								startIcon={<LogoutIcon />}
								onClick={signOut}
								sx={{
									border: "2px solid #E91E8C",
									borderRadius: "30px",
									color: "#E91E8C",
									px: 3,
									py: 1,
									fontFamily: ff,
									fontWeight: 600,
									"&:hover": {
										backgroundColor: "#E91E8C",
										color: "#fff",
									},
								}}
							>
								Sign Out
							</Button>
						</Box>
					</Box>
				)}

				{/* ── Orders Tab ── */}
				{tabIndex === 1 && (
					<Box>
						{ordersLoading ? (
							<Box sx={{ textAlign: "center", py: 6 }}>
								<CircularProgress sx={{ color: "#E91E8C" }} />
							</Box>
						) : otherOrders.length === 0 ? (
							<Box sx={{ textAlign: "center", py: 6 }}>
								<ReceiptLongOutlinedIcon
									sx={{ fontSize: 48, color: "#ccc", mb: 1 }}
								/>
								<Typography sx={{ color: "#999" }}>
									No orders yet.
								</Typography>
								<Typography
									sx={{ color: "#aaa", fontSize: "0.85rem", mt: 0.5 }}
								>
									Orders placed while signed in will appear here.
								</Typography>
								<Button
									onClick={() => navigate("/products")}
									sx={{
										mt: 2,
										border: "2px solid #E91E8C",
										borderRadius: "30px",
										color: "#E91E8C",
										px: 3,
										py: 1,
										fontFamily: ff,
										fontWeight: 600,
										"&:hover": {
											backgroundColor: "#E91E8C",
											color: "#fff",
										},
									}}
								>
									Browse Products
								</Button>
							</Box>
						) : (
							otherOrders.map((order) => (
								<OrderCard
									key={order.id}
									order={order}
									rated={!!ratedOrders[order.id]}
									onRate={() => setRateDialog(order)}
									onReorder={() => handleReorder(order)}
								/>
							))
						)}
					</Box>
				)}

				{/* ── Appointments Tab ── */}
				{tabIndex === 2 && (
					<Box>
						{/* Re-booking prompt */}
						{showRebookPrompt && (
							<Box
								sx={{
									mb: 3,
									p: 2.5,
									borderRadius: 3,
									background:
										"linear-gradient(135deg, #FCE4EC 0%, #F8BBD9 100%)",
									border: "1.5px solid #F48FB1",
									display: "flex",
									alignItems: "center",
									gap: 2,
									flexWrap: "wrap",
								}}
							>
								<Box sx={{ flex: 1, minWidth: 200 }}>
									<Typography
										sx={{
											fontFamily: ff,
											fontWeight: 700,
											fontSize: "1rem",
											color: "#C2185B",
											mb: 0.3,
										}}
									>
										💅 Ready for your next appointment?
									</Typography>
									<Typography
										sx={{
											fontSize: "0.85rem",
											color: "#555",
											lineHeight: 1.5,
										}}
									>
										You’ve completed a session — treat yourself again
										and keep your nails looking amazing!
									</Typography>
								</Box>
								<Button
									onClick={() => navigate("/services")}
									sx={{
										backgroundColor: "#E91E8C",
										color: "#fff",
										borderRadius: "30px",
										px: 3,
										py: 1,
										fontFamily: ff,
										fontWeight: 600,
										fontSize: "0.88rem",
										whiteSpace: "nowrap",
										"&:hover": { backgroundColor: "#C2185B" },
									}}
								>
									Book Again
								</Button>
							</Box>
						)}
						{ordersLoading ? (
							<Box sx={{ textAlign: "center", py: 6 }}>
								<CircularProgress sx={{ color: "#E91E8C" }} />
							</Box>
						) : serviceOrders.length === 0 ? (
							<Box sx={{ textAlign: "center", py: 6 }}>
								<EventNoteIcon
									sx={{ fontSize: 48, color: "#ccc", mb: 1 }}
								/>
								<Typography sx={{ color: "#999" }}>
									No appointments yet.
								</Typography>
								<Typography
									sx={{ color: "#aaa", fontSize: "0.85rem", mt: 0.5 }}
								>
									Appointments booked while signed in will appear here.
								</Typography>
								<Button
									onClick={() => navigate("/services")}
									sx={{
										mt: 2,
										border: "2px solid #E91E8C",
										borderRadius: "30px",
										color: "#E91E8C",
										px: 3,
										py: 1,
										fontFamily: ff,
										fontWeight: 600,
										"&:hover": {
											backgroundColor: "#E91E8C",
											color: "#fff",
										},
									}}
								>
									Browse Nail Services
								</Button>
							</Box>
						) : (
							serviceOrders.map((order) => (
								<OrderCard
									key={order.id}
									order={order}
									rated={!!ratedOrders[order.id]}
									onRate={() => setRateDialog(order)}
									onReschedule={() =>
										navigate("/reschedule", {
											state: { orderId: order.id },
										})
									}
									onCancel={() => setCancelDialog(order)}
									onEdit={() => handleOpenEditOrder(order)}
								/>
							))
						)}
					</Box>
				)}

				{/* ── Wishlist Tab ── */}
				{tabIndex === 3 && (
					<Box>
						{wishlist.length === 0 ? (
							<Box sx={{ textAlign: "center", py: 6 }}>
								<FavoriteIcon
									sx={{ fontSize: 48, color: "#ccc", mb: 1 }}
								/>
								<Typography sx={{ color: "#999" }}>
									Your wishlist is empty
								</Typography>
								<Typography
									sx={{
										color: "#aaa",
										fontSize: "0.85rem",
										mt: 0.5,
										mb: 2,
									}}
								>
									Tap the heart icon on products to save them here.
								</Typography>
								<Button
									onClick={() => navigate("/products")}
									sx={{
										border: "2px solid #E91E8C",
										borderRadius: "30px",
										color: "#E91E8C",
										px: 3,
										py: 1,
										fontFamily: ff,
										fontWeight: 600,
										"&:hover": {
											backgroundColor: "#E91E8C",
											color: "#fff",
										},
									}}
								>
									Browse Products
								</Button>
							</Box>
						) : (
							wishlist.map((item) => (
								<Box
									key={item.productId}
									sx={{
										display: "flex",
										alignItems: "center",
										gap: 2,
										p: 2,
										mb: 1.5,
										borderRadius: 3,
										border: "1px solid #F0C0D0",
										backgroundColor: "#fff",
										transition: "box-shadow 0.2s ease",
										"&:hover": {
											boxShadow: "0 2px 12px rgba(233,30,140,0.1)",
										},
									}}
								>
									<Box
										onClick={() =>
											navigate("/products", {
												state: { categoryId: item.categoryId },
											})
										}
										sx={{
											display: "flex",
											alignItems: "center",
											gap: 2,
											flex: 1,
											minWidth: 0,
											cursor: "pointer",
										}}
									>
										<Box
											component="img"
											src={item.image}
											alt={item.name}
											sx={{
												width: 60,
												height: 60,
												borderRadius: 2,
												objectFit: "cover",
												flexShrink: 0,
											}}
										/>
										<Box sx={{ flex: 1, minWidth: 0 }}>
											<Typography
												sx={{
													fontFamily: ff,
													fontWeight: 700,
													fontSize: "0.95rem",
													overflow: "hidden",
													textOverflow: "ellipsis",
													whiteSpace: "nowrap",
												}}
											>
												{item.name}
											</Typography>
											<Chip
												label={formatNaira(item.price)}
												size="small"
												sx={{
													mt: 0.5,
													backgroundColor: "#E91E8C",
													color: "#fff",
													fontFamily: ff,
													fontWeight: 700,
													fontSize: "0.8rem",
												}}
											/>
										</Box>
									</Box>
									<Tooltip title="View product">
										<IconButton
											onClick={() =>
												navigate("/products", {
													state: { categoryId: item.categoryId },
												})
											}
											sx={{
												color: "#999",
												"&:hover": { color: "#4A0E4E" },
											}}
										>
											<VisibilityOutlinedIcon />
										</IconButton>
									</Tooltip>
									<Tooltip title="Add to cart">
										<IconButton
											onClick={() => {
												addProduct({
													productId: item.productId,
													name: item.name,
													price: item.price,
													quantity: 1,
													stock: item.stock ?? 999,
													categoryId: item.categoryId,
												});
												showToast(
													`${item.name} added to cart`,
													"success",
												);
											}}
											sx={{
												color: "#999",
												"&:hover": { color: "#E91E8C" },
											}}
										>
											<ShoppingCartOutlinedIcon />
										</IconButton>
									</Tooltip>
									<Tooltip title="Remove from wishlist">
										<IconButton
											onClick={() =>
												removeFromWishlist(item.productId)
											}
											sx={{
												color: "#ccc",
												"&:hover": { color: "#E91E8C" },
											}}
										>
											<DeleteOutlineIcon />
										</IconButton>
									</Tooltip>
								</Box>
							))
						)}
					</Box>
				)}

				{/* ── Cancel error snackbar ── */}
				<Snackbar
					open={cancelError}
					autoHideDuration={4000}
					onClose={() => setCancelError(false)}
					anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
				>
					<Alert
						severity="error"
						onClose={() => setCancelError(false)}
						sx={{ fontFamily: ff }}
					>
						Could not cancel — please try again.
					</Alert>
				</Snackbar>

				{/* ── Cancel Appointment Dialog ── */}
				<Dialog
					open={!!cancelDialog}
					onClose={() => {
						setCancelDialog(null);
						setCancelReason("");
						setCancelReasonOther("");
					}}
					PaperProps={{ sx: { borderRadius: 4, p: 1, maxWidth: 420 } }}
				>
					<DialogTitle sx={{ pb: 0 }}>
						<Typography
							variant="h6"
							sx={{ fontFamily: ff, fontWeight: 700, color: "#d32f2f" }}
						>
							Cancel{" "}
							{cancelDialog?.type === "service"
								? "Appointment"
								: "Order"}
							?
						</Typography>
					</DialogTitle>
					<DialogContent>
						<Typography
							sx={{ color: "#555", fontSize: "0.9rem", mt: 1, mb: 2.5 }}
						>
							You are cancelling{" "}
							<strong>
								{cancelDialog?.items?.[0]?.serviceName ||
									cancelDialog?.items?.[0]?.name ||
									"this item"}
							</strong>
							{cancelDialog?.appointmentDate ? (
								<>
									{" "}
									on <strong>{cancelDialog.appointmentDate}</strong>
								</>
							) : null}
							. This action cannot be undone. Please tell us why:
						</Typography>
						<FormControl
							fullWidth
							size="small"
							sx={{ mb: cancelReason === "Other" ? 2 : 0 }}
						>
							<InputLabel sx={{ fontFamily: ff }}>
								Reason for cancelling
							</InputLabel>
							<Select
								value={cancelReason}
								label="Reason for cancelling"
								onChange={(e) => {
									setCancelReason(e.target.value);
									setCancelReasonOther("");
								}}
								sx={{ fontFamily: ff, borderRadius: 2 }}
							>
								<MenuItem
									value="Wrong order / appointment booked"
									sx={{ fontFamily: ff }}
								>
									Wrong order / appointment booked
								</MenuItem>
								<MenuItem
									value="Price too high"
									sx={{ fontFamily: ff }}
								>
									Price too high
								</MenuItem>
								<MenuItem
									value="Schedule conflict"
									sx={{ fontFamily: ff }}
								>
									Schedule conflict / can't make it
								</MenuItem>
								<MenuItem
									value="Changed my mind"
									sx={{ fontFamily: ff }}
								>
									Changed my mind
								</MenuItem>
								<MenuItem
									value="Booked by mistake"
									sx={{ fontFamily: ff }}
								>
									Booked by mistake
								</MenuItem>
								<MenuItem
									value="Found a better option"
									sx={{ fontFamily: ff }}
								>
									Found a better option
								</MenuItem>
								<MenuItem
									value="Personal emergency"
									sx={{ fontFamily: ff }}
								>
									Personal emergency
								</MenuItem>
								<MenuItem value="Other" sx={{ fontFamily: ff }}>
									Other
								</MenuItem>
							</Select>
						</FormControl>
						{cancelReason === "Other" && (
							<TextField
								fullWidth
								size="small"
								multiline
								minRows={2}
								placeholder="Please describe your reason..."
								value={cancelReasonOther}
								onChange={(e) => setCancelReasonOther(e.target.value)}
								inputProps={{ maxLength: 500 }}
								sx={{
									"& .MuiOutlinedInput-root": {
										borderRadius: 2,
										fontFamily: ff,
									},
								}}
							/>
						)}
					</DialogContent>
					<DialogActions sx={{ px: 3, pb: 2.5, gap: 1 }}>
						<Button
							onClick={() => {
								setCancelDialog(null);
								setCancelReason("");
								setCancelReasonOther("");
							}}
							sx={{
								color: "#777",
								fontFamily: ff,
								fontWeight: 600,
								textTransform: "none",
							}}
						>
							Keep{" "}
							{cancelDialog?.type === "service"
								? "Appointment"
								: "Order"}
						</Button>
						<Button
							onClick={handleCancelAppointment}
							disabled={
								cancelLoading ||
								!cancelReason ||
								(cancelReason === "Other" && !cancelReasonOther.trim())
							}
							sx={{
								backgroundColor: "#d32f2f",
								color: "#fff",
								borderRadius: "20px",
								px: 3,
								fontFamily: ff,
								fontWeight: 600,
								textTransform: "none",
								"&:hover": { backgroundColor: "#b71c1c" },
								"&.Mui-disabled": {
									backgroundColor: "#ffcdd2",
									color: "#fff",
								},
							}}
						>
							{cancelLoading ? "Cancelling…" : "Yes, Cancel"}
						</Button>
					</DialogActions>
				</Dialog>

				{/* ── Redeem Points Dialog ── */}
				<Dialog
					open={redeemDialogOpen}
					onClose={() => setRedeemDialogOpen(false)}
					maxWidth="xs"
					fullWidth
					PaperProps={{ sx: { borderRadius: 3 } }}
				>
					<DialogTitle sx={{ fontFamily: ff, fontWeight: 700, pb: 0 }}>
						Redeem Loyalty Points
						<Typography
							sx={{
								fontSize: "0.82rem",
								color: "#777",
								fontFamily: ff,
								fontWeight: 400,
								mt: 0.3,
							}}
						>
							{redeemSuccess
								? "Redemption confirmed!"
								: `Balance: ${loyaltyPoints} pts — ${maxRedeemableUnits} unit${maxRedeemableUnits !== 1 ? "s" : ""} redeemable`}
						</Typography>
					</DialogTitle>
					<DialogContent sx={{ pt: "12px !important" }}>
						{redeemSuccess ? (
							<Box sx={{ textAlign: "center", py: 2 }}>
								<Typography sx={{ fontSize: "2.5rem", mb: 1 }}>
									🎉
								</Typography>
								<Typography
									sx={{
										fontFamily: ff,
										fontWeight: 700,
										fontSize: "1rem",
										color: "#2e7d32",
										mb: 0.5,
									}}
								>
									{formatNaira(
										Math.floor(redeemAmount / REDEMPTION_UNIT) *
											REDEMPTION_VALUE,
									)}{" "}
									redeemed!
								</Typography>
								<Typography
									sx={{
										fontSize: "0.82rem",
										color: "#555",
										mb: 2,
										lineHeight: 1.6,
									}}
								>
									Your reward is saved and will be automatically
									applied at your next checkout — just proceed to any
									order page.
								</Typography>
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
											fontSize: "0.78rem",
											color: "#B8860B",
											fontWeight: 600,
										}}
									>
										🎁{" "}
										{formatNaira(
											Math.floor(redeemAmount / REDEMPTION_UNIT) *
												REDEMPTION_VALUE,
										)}{" "}
										reward ready to use at checkout
									</Typography>
								</Box>
							</Box>
						) : (
							<Box>
								<Typography
									sx={{ fontSize: "0.82rem", color: "#555", mb: 2 }}
								>
									Each unit = <strong>50 pts = ₦1,000 off</strong>.
									Select how many units to redeem:
								</Typography>
								<Box
									sx={{
										display: "flex",
										alignItems: "center",
										gap: 2,
										p: 2,
										borderRadius: 2,
										border: "1.5px solid #FFD54F",
										backgroundColor: "#FFFDE7",
										mb: 1,
									}}
								>
									<IconButton
										size="small"
										onClick={() =>
											setRedeemAmount((a) =>
												Math.max(
													REDEMPTION_UNIT,
													a - REDEMPTION_UNIT,
												),
											)
										}
										disabled={redeemAmount <= REDEMPTION_UNIT}
										sx={{
											border: "1px solid #FFD54F",
											color: "#B8860B",
										}}
									>
										<RemoveIcon fontSize="small" />
									</IconButton>
									<Box sx={{ flex: 1, textAlign: "center" }}>
										<Typography
											sx={{
												fontFamily: ff,
												fontWeight: 700,
												fontSize: "1.3rem",
												color: "#B8860B",
												lineHeight: 1,
											}}
										>
											{redeemAmount} pts
										</Typography>
										<Typography
											sx={{
												fontSize: "0.72rem",
												color: "#888",
												mt: 0.3,
											}}
										>
											={" "}
											{formatNaira(
												Math.floor(redeemAmount / REDEMPTION_UNIT) *
													REDEMPTION_VALUE,
											)}{" "}
											discount
										</Typography>
									</Box>
									<IconButton
										size="small"
										onClick={() =>
											setRedeemAmount((a) =>
												Math.min(
													maxRedeemableUnits * REDEMPTION_UNIT,
													a + REDEMPTION_UNIT,
												),
											)
										}
										disabled={
											redeemAmount >=
											maxRedeemableUnits * REDEMPTION_UNIT
										}
										sx={{
											border: "1px solid #FFD54F",
											color: "#B8860B",
										}}
									>
										<AddIcon fontSize="small" />
									</IconButton>
								</Box>
								<Typography
									sx={{
										fontSize: "0.72rem",
										color: "#999",
										textAlign: "center",
									}}
								>
									Remaining after redemption:{" "}
									{loyaltyPoints - redeemAmount} pts
								</Typography>
							</Box>
						)}
					</DialogContent>
					<DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
						<Button
							onClick={() => setRedeemDialogOpen(false)}
							sx={{
								color: "#777",
								fontFamily: ff,
								textTransform: "none",
							}}
						>
							{redeemSuccess ? "Close" : "Cancel"}
						</Button>
						{!redeemSuccess && (
							<Button
								onClick={handleRedeem}
								disabled={false}
								sx={{
									backgroundColor: "#B8860B",
									color: "#fff",
									borderRadius: "20px",
									px: 3,
									fontFamily: ff,
									fontWeight: 700,
									textTransform: "none",
									"&:hover": { backgroundColor: "#996600" },
									"&.Mui-disabled": {
										backgroundColor: "#FDE68A",
										color: "#fff",
									},
								}}
							>
								Redeem{" "}
								{formatNaira(
									Math.floor(redeemAmount / REDEMPTION_UNIT) *
										REDEMPTION_VALUE,
								)}
							</Button>
						)}
					</DialogActions>
				</Dialog>

				{/* ── Edit Pending Order Dialog ── */}
				<Dialog
					open={!!editOrderDialog}
					onClose={() => setEditOrderDialog(null)}
					maxWidth="xs"
					fullWidth
					PaperProps={{ sx: { borderRadius: 4 } }}
				>
					<DialogTitle sx={{ fontFamily: ff, fontWeight: 700, pb: 0.5 }}>
						Edit{" "}
						{editOrderDialog?.type === "service" ||
						editOrderDialog?.type === "mixed"
							? "Appointment"
							: "Order"}{" "}
						Details
						<Typography
							sx={{
								fontSize: "0.78rem",
								color: "#777",
								fontFamily: ff,
								fontWeight: 400,
								mt: 0.3,
							}}
						>
							You can update these details while your order is still
							pending.
						</Typography>
					</DialogTitle>
					<DialogContent
						sx={{
							pt: "12px !important",
							display: "flex",
							flexDirection: "column",
							gap: 2,
						}}
					>
						<TextField
							fullWidth
							label="Your Name"
							size="small"
							value={editOrderForm.customerName || ""}
							onChange={(e) =>
								setEditOrderForm((f) => ({
									...f,
									customerName: e.target.value,
								}))
							}
							sx={{
								"& .MuiOutlinedInput-root": {
									borderRadius: 2,
									fontFamily: ff,
								},
							}}
						/>
						<TextField
							fullWidth
							label="Phone Number"
							size="small"
							value={editOrderForm.phone || ""}
							onChange={(e) =>
								setEditOrderForm((f) => ({
									...f,
									phone: e.target.value,
								}))
							}
							sx={{
								"& .MuiOutlinedInput-root": {
									borderRadius: 2,
									fontFamily: ff,
								},
							}}
						/>
						<TextField
							fullWidth
							label="Notes / Special Requests"
							size="small"
							multiline
							minRows={2}
							value={editOrderForm.notes || ""}
							onChange={(e) =>
								setEditOrderForm((f) => ({
									...f,
									notes: e.target.value,
								}))
							}
							inputProps={{ maxLength: 500 }}
							sx={{
								"& .MuiOutlinedInput-root": {
									borderRadius: 2,
									fontFamily: ff,
								},
							}}
						/>
					</DialogContent>
					<DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
						<Button
							onClick={() => setEditOrderDialog(null)}
							sx={{
								fontFamily: ff,
								color: "#777",
								textTransform: "none",
							}}
						>
							Cancel
						</Button>
						<Button
							onClick={handleEditOrderSave}
							disabled={editOrderSaving}
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
							{editOrderSaving ? "Saving…" : "Save Changes"}
						</Button>
					</DialogActions>
				</Dialog>

				{/* ── Rate Dialog ── */}
				<RateDialog
					open={!!rateDialog}
					order={rateDialog}
					userName={user?.displayName || ""}
					onClose={() => setRateDialog(null)}
					onSubmitted={(orderId) => {
						setRatedOrders((prev) => ({ ...prev, [orderId]: true }));
						setRateDialog(null);
						showToast(
							"Thank you! Your review has been submitted.",
							"success",
						);
					}}
				/>

				{/* ── Edit Profile Dialog ── */}
				<Dialog
					open={editOpen}
					onClose={() => setEditOpen(false)}
					maxWidth="xs"
					fullWidth
					PaperProps={{ sx: { borderRadius: 3 } }}
				>
					<DialogTitle sx={{ fontFamily: ff, fontWeight: 700 }}>
						Edit Profile
					</DialogTitle>
					<DialogContent sx={{ pt: "8px !important" }}>
						<TextField
							fullWidth
							label="Display Name"
							value={editForm.displayName}
							onChange={(e) =>
								setEditForm((f) => ({
									...f,
									displayName: e.target.value,
								}))
							}
							size="small"
							sx={inputSx}
						/>
						<TextField
							fullWidth
							label="Phone Number"
							value={editForm.phone}
							onChange={(e) =>
								setEditForm((f) => ({ ...f, phone: e.target.value }))
							}
							size="small"
							placeholder="+234 xxx xxx xxxx"
							sx={inputSx}
						/>
						<TextField
							fullWidth
							label="Address"
							value={editForm.address}
							onChange={(e) =>
								setEditForm((f) => ({ ...f, address: e.target.value }))
							}
							size="small"
							multiline
							rows={2}
							placeholder="Your delivery / home address"
							sx={{ ...inputSx, mb: 0 }}
						/>
					</DialogContent>
					<DialogActions sx={{ px: 3, pb: 3 }}>
						<Button
							onClick={() => setEditOpen(false)}
							sx={{ fontFamily: ff, color: "#777" }}
						>
							Cancel
						</Button>
						<Button
							onClick={saveEditProfile}
							sx={{
								backgroundColor: "#E91E8C",
								color: "#fff",
								borderRadius: "20px",
								px: 3,
								fontFamily: ff,
								fontWeight: 600,
								"&:hover": { backgroundColor: "#C2185B" },
							}}
						>
							Save
						</Button>
					</DialogActions>
				</Dialog>

				{/* ── Nail Sizes Dialog ── */}
				<Dialog
					open={nailSizesOpen}
					onClose={() => setNailSizesOpen(false)}
					maxWidth="sm"
					fullWidth
					PaperProps={{ sx: { borderRadius: 3 } }}
				>
					<DialogTitle sx={{ fontFamily: ff, fontWeight: 700, pb: 0 }}>
						My Nail Sizes
						<Typography
							sx={{
								fontSize: "0.8rem",
								color: "#777",
								mt: 0.4,
								fontFamily: ff,
								fontWeight: 400,
								lineHeight: 1.5,
							}}
						>
							{nailSizesFromOrders
								? "Pulled from your last order — edit and save to update."
								: "Measure each nail bed at its widest point using a ruler or tape measure."}
						</Typography>
					</DialogTitle>
					<DialogContent sx={{ pt: "12px !important" }}>
						{/* Nail bed sizes — per finger in mm */}
						<NailBedSizeInput
							value={nailForm.nailBedSize}
							onChange={(val) => {
								const autoSize = computePresetSize(val);
								setNailForm((f) => ({
									...f,
									nailBedSize: val,
									nailTipSize: autoSize || f.nailTipSize,
								}));
							}}
						/>

						{/* Nail tip size */}
						<Box sx={{ mt: 2.5 }}>
							<Typography
								sx={{
									fontFamily: ff,
									fontWeight: 700,
									fontSize: "0.85rem",
									color: "#4A0E4E",
									mb: 1,
								}}
							>
								Nail Tip Size
							</Typography>
							<Typography
								sx={{ fontSize: "0.78rem", color: "#777", mb: 1.2 }}
							>
								Auto-calculated from your nail bed sizes above. You can
								override if needed.
							</Typography>
							<Box sx={{ display: "flex", gap: 1 }}>
								{["XS", "S", "M", "L"].map((size) => (
									<Box
										key={size}
										onClick={() =>
											setNailForm((f) => ({
												...f,
												nailTipSize:
													f.nailTipSize === size ? "" : size,
											}))
										}
										sx={{
											flex: 1,
											textAlign: "center",
											py: 1.2,
											borderRadius: 2,
											cursor: "pointer",
											border:
												nailForm.nailTipSize === size
													? "2px solid #E91E8C"
													: "2px solid #F0C0D0",
											backgroundColor:
												nailForm.nailTipSize === size
													? "#FFF0F5"
													: "#fff",
											transition: "all 0.2s ease",
											"&:hover": { borderColor: "#E91E8C" },
										}}
									>
										<Typography
											sx={{
												fontFamily: ff,
												fontWeight: 700,
												fontSize: "0.95rem",
												color:
													nailForm.nailTipSize === size
														? "#E91E8C"
														: "#333",
											}}
										>
											{size}
										</Typography>
									</Box>
								))}
							</Box>
						</Box>
					</DialogContent>
					<DialogActions sx={{ px: 3, pb: 3 }}>
						<Button
							onClick={() => setNailSizesOpen(false)}
							sx={{ fontFamily: ff, color: "#777" }}
						>
							Cancel
						</Button>
						<Button
							onClick={saveNailSizes}
							sx={{
								backgroundColor: "#E91E8C",
								color: "#fff",
								borderRadius: "20px",
								px: 3,
								fontFamily: ff,
								fontWeight: 600,
								"&:hover": { backgroundColor: "#C2185B" },
							}}
						>
							Save Sizes
						</Button>
					</DialogActions>
				</Dialog>
			</Container>
		</Box>
	);
}

function RateDialog({ open, order, userName, onClose, onSubmitted }) {
	const [name, setName] = useState(userName || "");
	const [rating, setRating] = useState(0);
	const [occupation, setOccupation] = useState("");
	const [review, setReview] = useState("");
	const [submitting, setSubmitting] = useState(false);

	useEffect(() => {
		if (open) {
			setName(userName || "");
			setRating(0);
			setOccupation("");
			setReview("");
		}
	}, [open, userName]);

	const handleSubmit = async () => {
		if (!order || rating === 0 || !review.trim()) return;
		setSubmitting(true);
		const resolvedName = name.trim() || userName;
		try {
			const serviceName =
				order.items?.[0]?.serviceName ||
				order.items?.[0]?.name ||
				"Service";
			await saveTestimonial({
				name: resolvedName,
				occupation: occupation.trim() || "Client",
				service: serviceName,
				type: (order.type === "service" || order.type === "mixed") ? "appointment" : "purchase",
				rating,
				testimonial: review.trim(),
				avatar: resolvedName.charAt(0).toUpperCase(),
				orderId: order.id,
			});
			onSubmitted(order.id);
		} catch (err) {
			console.error("Failed to save review:", err);
		} finally {
			setSubmitting(false);
			setRating(0);
			setOccupation("");
			setReview("");
		}
	};

	return (
		<Dialog
			open={open}
			onClose={onClose}
			maxWidth="sm"
			fullWidth
			PaperProps={{ sx: { borderRadius: 3 } }}
		>
			<DialogTitle
				sx={{ fontFamily: ff, fontWeight: 700, textAlign: "center", pb: 0.5 }}
			>
				Rate Your Experience
			</DialogTitle>
			<Box sx={{ display: 'flex', justifyContent: 'center', mb: 0.5 }}>
				<Chip
					label={order?.type === 'service' || order?.type === 'mixed' ? 'Appointment Review' : 'Product Order Review'}
					size="small"
					sx={{
						backgroundColor: order?.type === 'service' || order?.type === 'mixed' ? '#4A0E4E' : '#E91E8C',
						color: '#fff',
						fontFamily: ff,
						fontWeight: 600,
						fontSize: '0.72rem',
					}}
				/>
			</Box>
			<DialogContent>
				<Box
					sx={{
						display: "flex",
						justifyContent: "center",
						gap: 0.5,
						mb: 2,
						mt: 1,
					}}
				>
					{[1, 2, 3, 4, 5].map((star) => (
						<Box
							key={star}
							onClick={() => setRating(star)}
							sx={{ cursor: "pointer" }}
						>
							{star <= rating ? (
								<StarIcon sx={{ color: "#E91E8C", fontSize: 36 }} />
							) : (
								<StarBorderIcon
									sx={{ color: "#E91E8C", fontSize: 36 }}
								/>
							)}
						</Box>
					))}
				</Box>
				<TextField
					fullWidth
					label="Your Name"
					value={name}
					onChange={(e) => setName(e.target.value)}
					size="small"
					sx={{ mb: 2, "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
				/>
				<TextField
					fullWidth
					label="Your Occupation (optional)"
					value={occupation}
					onChange={(e) => setOccupation(e.target.value)}
					size="small"
					sx={{ mb: 2, "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
				/>
				<TextField
					fullWidth
					label="Your Review"
					value={review}
					onChange={(e) => setReview(e.target.value.slice(0, 350))}
					multiline
					rows={3}
					inputProps={{ maxLength: 350 }}
					helperText={`${review.length}/350`}
					sx={{ "& .MuiOutlinedInput-root": { borderRadius: 2 } }}
				/>
			</DialogContent>
			<DialogActions sx={{ justifyContent: "center", pb: 3 }}>
				<Button onClick={onClose} sx={{ fontFamily: ff, color: "#777" }}>
					Cancel
				</Button>
				<Button
					onClick={handleSubmit}
					disabled={submitting || rating === 0 || !review.trim()}
					sx={{
						backgroundColor: "#E91E8C",
						color: "#fff",
						borderRadius: "30px",
						px: 4,
						py: 1,
						fontFamily: ff,
						fontWeight: 600,
						"&:hover": { backgroundColor: "#C2185B" },
						"&.Mui-disabled": {
							backgroundColor: "#F0C0D0",
							color: "#fff",
						},
					}}
				>
					{submitting ? "Submitting…" : "Submit Review"}
				</Button>
			</DialogActions>
		</Dialog>
	);
}

const ORDER_STEPS = [
	{ key: 'pending',    label: 'Placed'         },
	{ key: 'confirmed',  label: 'Confirmed'       },
	{ key: 'production', label: 'In Production'   },
	{ key: 'shipping',   label: 'Shipped'         },
	{ key: 'received',   label: 'Delivered'       },
];

function OrderProgressTracker({ status, order }) {
	const activeIdx = (() => {
		if (status === 'completed' || status === 'received') return 4;
		if (status === 'shipping') return 3;
		if (status === 'production') return 2;
		if (status === 'confirmed') return 1;
		return 0;
	})();

	const deliveryText = (() => {
		if (!order || !['pending', 'confirmed', 'production'].includes(status)) return null;
		const isCustom = order.items?.some((i) => i.nailBedSize);
		const [dMin, dMax] = isCustom ? [4, 7] : [2, 3];
		const raw = order.createdAt?.toDate ? order.createdAt.toDate() : order.createdAt ? new Date(order.createdAt) : null;
		if (!raw) return null;
		const addBizDays = (date, n) => {
			const d = new Date(date);
			let count = 0;
			while (count < n) {
				d.setDate(d.getDate() + 1);
				if (d.getDay() !== 0 && d.getDay() !== 6) count++;
			}
			return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
		};
		return `${addBizDays(raw, dMin)} – ${addBizDays(raw, dMax)}`;
	})();

	return (
		<Box sx={{ mt: 2, mb: 1 }}>
			<Box sx={{ display: 'flex', alignItems: 'center' }}>
				{ORDER_STEPS.map((step, idx) => (
					<Box key={step.key} sx={{ display: 'flex', alignItems: 'center', flex: idx < ORDER_STEPS.length - 1 ? 1 : 0 }}>
						<Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
							<Box sx={{
								width: idx === activeIdx ? 14 : 10,
								height: idx === activeIdx ? 14 : 10,
								borderRadius: '50%',
								backgroundColor: idx <= activeIdx ? '#E91E8C' : '#e0e0e0',
								border: idx === activeIdx ? '2px solid #C2185B' : 'none',
								flexShrink: 0,
							}} />
						</Box>
						{idx < ORDER_STEPS.length - 1 && (
							<Box sx={{ flex: 1, height: 2, backgroundColor: idx < activeIdx ? '#E91E8C' : '#e0e0e0', mx: 0.3 }} />
						)}
					</Box>
				))}
			</Box>
			<Box sx={{ display: 'flex', mt: 0.8 }}>
				{ORDER_STEPS.map((step, idx) => (
					<Box key={step.key} sx={{ flex: idx < ORDER_STEPS.length - 1 ? 1 : 0, textAlign: idx === 0 ? 'left' : idx === ORDER_STEPS.length - 1 ? 'right' : 'center' }}>
						<Typography sx={{ fontSize: '0.62rem', fontWeight: idx === activeIdx ? 700 : 400, color: idx <= activeIdx ? '#E91E8C' : '#aaa', lineHeight: 1.2, whiteSpace: 'nowrap' }}>
							{step.label}
						</Typography>
					</Box>
				))}
			</Box>
			{deliveryText && (
				<Typography sx={{ fontSize: '0.68rem', color: '#888', mt: 0.6, textAlign: 'center' }}>
					Est. delivery: {deliveryText}
				</Typography>
			)}
		</Box>
	);
}

function OrderCard({ order, rated, onRate, onReschedule, onCancel, onEdit, onReorder }) {
	const statusColor = {
		pending: "#FF9800",
		confirmed: "#2196F3",
		production: "#9C27B0",
		shipping: "#1976D2",
		received: "#4CAF50",
		completed: "#4CAF50",
		"in progress": "#9C27B0",
		rescheduled: "#FF9800",
		cancelled: "#f44336",
		"no-show": "#9E9E9E",
	};
	return (
		<Box
			sx={{
				p: 2.5,
				mb: 2,
				borderRadius: 3,
				border: "1px solid #F0C0D0",
				backgroundColor: "#fff",
			}}
		>
			<Box
				sx={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
					mb: 1,
				}}
			>
				<Chip
					label={order.type}
					size="small"
					sx={{
						backgroundColor: "#4A0E4E",
						color: "#fff",
						fontWeight: 700,
						fontSize: "0.7rem",
						textTransform: "capitalize",
					}}
				/>
				<Chip
					label={order.status}
					size="small"
					sx={{
						backgroundColor: statusColor[order.status] || "#999",
						color: "#fff",
						fontWeight: 600,
						fontSize: "0.7rem",
						textTransform: "capitalize",
					}}
				/>
			</Box>
			<Typography sx={{ fontFamily: ff, fontWeight: 700, fontSize: "1rem" }}>
				{formatNaira(order.total)}
			</Typography>
			<Typography sx={{ color: "#777", fontSize: "0.82rem", mt: 0.3 }}>
				{formatDate(order.createdAt)}
			</Typography>
			{order.type !== "service" && !["cancelled","rescheduled","no-show"].includes(order.status) && (
				<OrderProgressTracker status={order.status} order={order} />
			)}
			{order.items?.length > 0 && (
				<Box sx={{ mt: 1 }}>
					{order.items.map((item, i) => (
						<Typography
							key={i}
							sx={{ color: "#555", fontSize: "0.82rem" }}
						>
							{item.name || item.serviceName || "Item"}
							{item.quantity > 1 ? ` x${item.quantity}` : ""}
						</Typography>
					))}
				</Box>
			)}
			{(order.status === "received" || order.status === "completed") && (
				<Box sx={{ mt: 1.5 }}>
					<Button
						size="small"
						onClick={onRate}
						disabled={rated}
						sx={{
							border: "1.5px solid #E91E8C",
							borderRadius: "20px",
							color: rated ? "#999" : "#E91E8C",
							borderColor: rated ? "#ccc" : "#E91E8C",
							px: 2,
							fontFamily: ff,
							fontWeight: 600,
							fontSize: "0.78rem",
							textTransform: "none",
							"&:hover": rated
								? {}
								: { backgroundColor: "#E91E8C", color: "#fff" },
						}}
					>
						{rated ? "Rated ✓" : "Rate this"}
					</Button>
				</Box>
			)}
		{onReorder && order.items?.some((i) => i.kind === 'pressOn') &&
		['confirmed', 'production', 'shipping', 'received', 'completed'].includes(order.status) && (
		<Box sx={{ mt: 1.5 }}>
			<Button
				size="small"
				startIcon={<ReplayIcon sx={{ fontSize: 14 }} />}
				onClick={onReorder}
				sx={{
					border: '1.5px solid #9C27B0',
					borderRadius: '20px',
					color: '#9C27B0',
					px: 2,
					fontFamily: ff,
					fontWeight: 600,
					fontSize: '0.78rem',
					textTransform: 'none',
					'&:hover': { backgroundColor: '#9C27B0', color: '#fff' },
				}}
			>
				Reorder
			</Button>
		</Box>
	)}
	{order.status === 'pending' && onEdit && (
		<Box sx={{ mt: 1.5 }}>
			<Button
				size="small"
				startIcon={<EditIcon sx={{ fontSize: 14 }} />}
				onClick={onEdit}
				sx={{
					border: '1.5px solid #E91E8C',
					borderRadius: '20px',
					color: '#E91E8C',
					px: 2,
					fontFamily: ff,
					fontWeight: 600,
					fontSize: '0.78rem',
					textTransform: 'none',
					'&:hover': { backgroundColor: '#E91E8C', color: '#fff' },
				}}
			>
				Edit Details
			</Button>
		</Box>
	)}
	{(order.type === 'service' || order.type === 'mixed') && (order.status === 'pending' || order.status === 'confirmed') && (
			<Box sx={{ mt: 1.5, display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
				{order.status === 'confirmed' && (
					<Button
						size="small"
						onClick={onReschedule}
						sx={{ border: '1.5px solid #4A0E4E', borderRadius: '20px', color: '#4A0E4E', px: 2, fontFamily: ff, fontWeight: 600, fontSize: '0.78rem', textTransform: 'none', '&:hover': { backgroundColor: '#4A0E4E', color: '#fff' } }}
					>
						Reschedule
					</Button>
				)}
				<Button
					size="small"
					onClick={onCancel}
					sx={{ border: '1.5px solid #d32f2f', borderRadius: '20px', color: '#d32f2f', px: 2, fontFamily: ff, fontWeight: 600, fontSize: '0.78rem', textTransform: 'none', '&:hover': { backgroundColor: '#d32f2f', color: '#fff' } }}
				>
					Cancel
				</Button>
			</Box>
		)}
		{/* Reschedule details */}
		{order.status === 'rescheduled' && (
			<Box sx={{ mt: 1.5, p: 1.2, borderRadius: 2, backgroundColor: '#FFF3E0', border: '1px solid #FFCC02' }}>
				{order.previousDate && (
					<Typography sx={{ fontSize: '0.75rem', color: '#777' }}>
						Originally: {order.previousDate}
					</Typography>
				)}
				{order.appointmentDate && (
					<Typography sx={{ fontSize: '0.82rem', fontWeight: 700, color: '#2e7d32', mt: 0.2 }}>
						New date: {order.appointmentDate}
					</Typography>
				)}
				{order.rescheduleReason && (
					<Typography sx={{ fontSize: '0.75rem', color: '#555', mt: 0.3 }}>
						Reason: {order.rescheduleReason}
					</Typography>
				)}
			</Box>
		)}
		</Box>
	);
}
