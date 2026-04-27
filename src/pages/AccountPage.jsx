import React, { useState, useEffect, useMemo } from "react";
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
	Rating,
	Stepper,
	Step,
	StepLabel,
} from "@mui/material";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
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
import RateReviewIcon from "@mui/icons-material/RateReview";
import ShoppingBagIcon from "@mui/icons-material/ShoppingBag";
import CardGiftcardIcon from "@mui/icons-material/CardGiftcard";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import AddIcon from "@mui/icons-material/Add";
import RemoveIcon from "@mui/icons-material/Remove";
import ReplayIcon from "@mui/icons-material/Replay";
import CameraAltIcon from "@mui/icons-material/CameraAlt";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import AdjustIcon from "@mui/icons-material/Adjust";
import CelebrationIcon from "@mui/icons-material/Celebration";
import MilitaryTechIcon from "@mui/icons-material/MilitaryTech";
import RedeemIcon from "@mui/icons-material/Redeem";
import LockIcon from "@mui/icons-material/Lock";
import { ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../lib/firebase';
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import {
	fetchOrders,
	updateOrderStatus,
	updateOrderDetails,
	markOrderAsRated,
} from "../lib/orderService";
import { addCancellationRequest } from "../lib/cancellationService";
import { useNotifications } from "../context/NotificationContext";
import {
	saveTestimonial,
	getReviewedOrderIds,
	uploadReviewPhoto,
} from "../lib/testimonialService";
import {
	updateUserProfile,
	fetchUserProfile,
} from "../lib/userService";
import {
	getLoyaltyData,
	ensureReferralCode,
	savePendingLoyaltyReward,
	incrementUserReviewCount,
	backfillMissingPoints,
	POINTS_PER_REFERRAL,
	REDEMPTION_UNIT, REDEMPTION_VALUE,
	TIERS,
	getCustomerTier,
} from "../lib/loyaltyService";

const TABS = ["profile", "orders", "wishlist"];
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

const TIER_META = {
	'fresh':         { Icon: AdjustIcon,      border: '#90A4AE', desc: 'Welcome! Place your first order to begin your loyalty journey.' },
	'star-client':   { Icon: StarIcon,        border: '#4DB6AC', desc: 'Proven loyal — a true PerfectFooties star!' },
	'master-patron': { Icon: EmojiEventsIcon, border: '#F5BE00', desc: 'The absolute elite — our most loyal customer!' },
};

function getNextTier(orderCount) {
	return TIERS.find((t) => t.minOrders > orderCount) || null;
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
	backgroundColor: "var(--bg-card)",
	border: "1px solid var(--bg-soft3)",
	textAlign: "center",
	cursor: "pointer",
	transition: "all 0.2s ease",
	"&:hover": {
		borderColor: "#e3242b",
		boxShadow: "0 2px 8px rgba(233,30,140,0.12)",
	},
};

export default function AccountPage() {
	const { user, loading: authLoading, signInWithGoogle, signOut, updatePhotoURL } = useAuth();
	const { wishlist, removeFromWishlist } = useWishlist();
	const { addProduct } = useCart();
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
	const [firestorePointsRedeemed, setFirestorePointsRedeemed] = useState(0);
	const [referralUses, setReferralUses] = useState(0);
	const [myReferralCode, setMyReferralCode] = useState('');
	const [redeemDialogOpen, setRedeemDialogOpen] = useState(false);
	const [redeemAmount, setRedeemAmount] = useState(REDEMPTION_UNIT);
	const [redeemLoading, setRedeemLoading] = useState(false);
	const [redeemSuccess, setRedeemSuccess] = useState(false);

	// Profile photo upload
	const [photoUploading, setPhotoUploading] = useState(false);

	const handlePhotoUpload = async (file) => {
		if (!file || !user) return;
		setPhotoUploading(true);
		try {
			const path = `profile-photos/${user.uid}/${Date.now()}.${file.name.split('.').pop() || 'jpg'}`;
			const fileRef = storageRef(storage, path);
			await uploadBytes(fileRef, file);
			const url = await getDownloadURL(fileRef);
			await updatePhotoURL(url);
		} catch (err) {
			console.error('Profile photo upload failed:', err);
		} finally {
			setPhotoUploading(false);
		}
	};

	// Profile UI state
	const [editOpen, setEditOpen] = useState(false);
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

	useEffect(() => {
		if (!user) return;
		setOrdersLoading(true);
		fetchOrders(user.uid)
			.then(async (fetched) => {
				setOrders(fetched);
				const completedIds = fetched
					.filter(
						(o) => ['received', 'completed', 'delivered'].includes(o.status),
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
				setFirestorePointsRedeemed(loyalty.loyaltyPointsRedeemed || 0);
				setMyReferralCode(refData.code);
				setReferralUses(refData.totalUses);
			})
			.catch((err) => {
				console.error("[Loyalty Debug] Error loading loyalty data:", err);
			});
	}, [user]);

	// Total points earned as computed from order history (source of truth for display)
	const computedPoints = useMemo(() =>
		orders.reduce((total, o) => {
			if (!['received', 'completed', 'delivered'].includes(o.status)) return total;
			return total + 15;
		}, 0),
	[orders]);

	// Backfill Firestore if computed earned > what Firestore has recorded,
	// so that redemption works correctly for historical orders.
	useEffect(() => {
		if (!user || ordersLoading || firestorePoints === null) return;
		const expectedBalance = Math.max(0, computedPoints - firestorePointsRedeemed);
		if (expectedBalance <= firestorePoints) return;
		const delta = expectedBalance - firestorePoints;
		backfillMissingPoints(user.uid, delta)
			.then(() => setFirestorePoints(expectedBalance))
			.catch(() => {});
	}, [user, ordersLoading, firestorePoints, computedPoints, firestorePointsRedeemed]);

	const handleRedeem = () => {
		if (!user) return;
		savePendingLoyaltyReward(redeemAmount);
		setRedeemSuccess(true);
		showToast(`Loyalty reward saved! ₦${(redeemAmount * REDEMPTION_VALUE / REDEMPTION_UNIT).toLocaleString()} will apply at checkout.`, "success");
	};

	// Load saved profile from Firestore (with localStorage fallback)
	useEffect(() => {
		if (!user) return;
		
		// 1. Try local storage first for instant UI
		const saved = JSON.parse(
			localStorage.getItem(`profile_${user.uid}`) || "{}",
		);
		if (saved.phone || saved.address) {
			setProfile({
				phone: saved.phone || "",
				address: saved.address || "",
				displayName: saved.displayName || user.displayName || "",
			});
		}

		// 2. Fetch from Firestore for the latest source of truth
		fetchUserProfile(user.uid).then((fsProfile) => {
			if (fsProfile) {
				const merged = {
					phone: fsProfile.phone || "",
					address: fsProfile.address || "",
					displayName: fsProfile.displayName || fsProfile.name || user.displayName || "",
				};
				setProfile(merged);
				localStorage.setItem(`profile_${user.uid}`, JSON.stringify(merged));
			}
		}).catch(err => console.error("Error fetching user profile:", err));
	}, [user]);

	const handleTabChange = (_, newVal) => {
		navigate(`/account#${TABS[newVal]}`, { replace: true });
	};

	const handleCancelOrder = async () => {
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
				itemName: cancelDialog.items?.[0]?.name || "",
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
		setEditOrderForm({
			customerName: order.customerName || "",
			notes: order.notes || "",
			phone: order.phone || "",
		});
		setEditOrderDialog(order);
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

	const reviewCount = Object.keys(ratedOrders).length;
	const orderCount = orders.filter((o) => ['received', 'completed', 'delivered'].includes(o.status)).length;
	const giftCardOrders = orders.filter((o) =>
		o.items?.some((i) =>
			(i.name || "").toLowerCase().includes("gift card"),
		),
	);

	// Current balance = earned from orders − redeemed in Firestore.
	// Math.max ensures we show computedPoints when Firestore is stale (never got awardPointsForOrder calls).
	const loyaltyPoints = Math.max(
		firestorePoints ?? 0,
		computedPoints - firestorePointsRedeemed,
	);
	const redeemableNaira =
		Math.floor(loyaltyPoints / REDEMPTION_UNIT) * REDEMPTION_VALUE;
	const maxRedeemableUnits = Math.floor(loyaltyPoints / REDEMPTION_UNIT);

	const referralCode = myReferralCode || (user?.uid ? `FOOTIES-${user.uid.slice(0, 8).toUpperCase()}` : '');
	const referralLink = `${window.location.origin}/shop?ref=${referralCode}`;

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
			displayName: profile.displayName || user.displayName || "",
		});
		setEditOpen(true);
	};

	const saveEditProfile = async () => {
		const updated = {
			...profile,
			phone: editForm.phone.trim(),
			address: editForm.address.trim(),
			displayName: editForm.displayName.trim() || user.displayName,
		};
		
		setProfile(updated);
		localStorage.setItem(
			`profile_${user.uid}`,
			JSON.stringify(updated),
		);
		
		try {
			await updateUserProfile(user.uid, {
				phone: updated.phone,
				address: updated.address,
				displayName: updated.displayName
			});
			showToast("Profile updated successfully.", "success");
		} catch (err) {
			console.error("Error updating profile in Firestore:", err);
			showToast("Saved locally, but could not sync with server.", "warning");
		}
		
		setEditOpen(false);
	};

	const handleSignOut = () => {
		showToast("You've been signed out. See you soon!", "info");
		setTimeout(() => signOut(), 300);
	};

	const handleAccountSignIn = () => {
		navigate("/auth-method");
	};

	const handleAccountPageSignOut = () => {
		showToast("You've been signed out. See you soon!", "info");
		setTimeout(() => signOut(), 300);
	};

	if (authLoading) {
		return (
			<Box sx={{ pt: 16, textAlign: "center" }}>
				<CircularProgress sx={{ color: "#e3242b" }} />
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
					backgroundColor: "var(--bg-soft)",
				}}
			>
				<Container maxWidth="sm" sx={{ textAlign: "center" }}>
					<PersonOutlineIcon
						sx={{ fontSize: 64, color: "#e3242b", mb: 2 }}
					/>
					<Typography
						variant="h4"
						sx={{ fontFamily: ff, fontWeight: 700, mb: 2 }}
					>
						Sign in to your account
					</Typography>
					<Typography
						sx={{ color: "var(--text-muted)", mb: 4, lineHeight: 1.7 }}
					>
						Sign in with Google to view your order history, track
						deliveries, and manage your profile.
					</Typography>
					<Button
						onClick={handleAccountSignIn}
						sx={{
							backgroundColor: "#e3242b",
							color: "#fff",
							borderRadius: "30px",
							px: 4,
							py: 1.2,
							fontFamily: ff,
							fontWeight: 600,
							fontSize: "0.95rem",
							"&:hover": { backgroundColor: "#b81b21" },
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
				backgroundColor: "var(--bg-soft)",
			}}
		>
			<Container maxWidth="md">
				<Typography
					variant="h3"
					sx={{
						fontFamily: ff,
						fontWeight: 700,
						color: "var(--text-main)",
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
					variant="scrollable"
					scrollButtons="auto"
					allowScrollButtonsMobile
					sx={{
						mb: 4,
						"& .MuiTab-root": {
							fontFamily: ff,
							fontWeight: 600,
							textTransform: "none",
							fontSize: "0.95rem",
						},
						"& .Mui-selected": { color: "#e3242b" },
						"& .MuiTabs-indicator": { backgroundColor: "#e3242b" },
						"& .MuiTabs-scrollButtons": { color: "#e3242b" },
					}}
				>
					<Tab label="Profile" />
					<Tab label="Orders" />
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
							<Box sx={{ position: "relative", display: "inline-block", mb: 2 }}>
								<Avatar
									src={user.photoURL}
									alt={user.displayName}
									sx={{ width: 90, height: 90, border: "3px solid #e3242b" }}
								/>
								<Tooltip title="Upload profile photo">
									<IconButton
										component="label"
										disabled={photoUploading}
										sx={{
											position: "absolute", bottom: 0, right: 0,
											width: 28, height: 28,
											backgroundColor: "#e3242b",
											border: "2px solid #fff",
											"&:hover": { backgroundColor: "#b81b21" },
											"&.Mui-disabled": { backgroundColor: "#ccc" },
										}}
									>
										{photoUploading
											? <CircularProgress size={12} sx={{ color: "#fff" }} />
											: <CameraAltIcon sx={{ fontSize: 14, color: "#fff" }} />
										}
										<input
											type="file"
											accept="image/*"
											hidden
											onChange={(e) => {
												const f = e.target.files?.[0];
												if (f) handlePhotoUpload(f);
												e.target.value = '';
											}}
										/>
									</IconButton>
								</Tooltip>
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
									border: "1.5px solid #e3242b",
									borderRadius: "20px",
									color: "#e3242b",
									px: 2.5,
									py: 0.6,
									fontFamily: ff,
									fontWeight: 600,
									fontSize: "0.82rem",
									textTransform: "none",
									"&:hover": {
										backgroundColor: "#e3242b",
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
							<Box sx={statBtnSx} onClick={() => navigate('/account#orders')}>
								<ShoppingBagIcon
									sx={{
										fontSize: 24,
										color: "var(--text-purple)",
										mb: 0.5,
									}}
								/>
								<Typography
									sx={{
										fontFamily: ff,
										fontWeight: 700,
										fontSize: "1.4rem",
										color: "var(--text-purple)",
										lineHeight: 1,
									}}
								>
									{orders.length}
								</Typography>
								<Typography
									sx={{ fontSize: "0.72rem", color: "#777", mt: 0.3 }}
								>
									Orders
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
									sx={{ fontSize: 24, color: "#e3242b", mb: 0.5 }}
								/>
								<Typography
									sx={{
										fontFamily: ff,
										fontWeight: 700,
										fontSize: "1.4rem",
										color: "#e3242b",
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
						{(() => {
							const tier = getCustomerTier(orderCount);
							const meta = TIER_META[tier.key];
							const next = getNextTier(orderCount);
							return (
								<Box
									sx={{
										mb: 3,
										p: 2.5,
										borderRadius: 3,
										background: `linear-gradient(135deg, ${tier.bg} 0%, var(--bg-card) 100%)`,
										border: `1.5px solid ${meta.border}`,
									}}
								>
									<Box
										sx={{
											display: "flex",
											alignItems: "center",
											gap: 1.5,
										}}
									>
										<meta.Icon sx={{ fontSize: '2.2rem', color: tier.color }} />
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
													color: "var(--text-muted)",
													mt: 0.2,
												}}
											>
												{meta.desc}
											</Typography>
											{tier.perk && (
												<Box
													sx={{
														mt: 0.8,
														display: "inline-flex",
														alignItems: "center",
														gap: 0.5,
														px: 1,
														py: 0.3,
														borderRadius: "20px",
														backgroundColor: tier.bg,
														border: `1px solid ${meta.border}`,
													}}
												>
													<Typography
														sx={{
															fontSize: "0.7rem",
															fontWeight: 700,
															color: tier.color,
															display: 'flex',
															alignItems: 'center',
															gap: 0.5,
														}}
													>
														<CardGiftcardIcon sx={{ fontSize: '0.85rem' }} />
														{tier.perk}
													</Typography>
												</Box>
											)}
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
												{orderCount}
											</Typography>
											<Typography
												sx={{
													fontSize: "0.68rem",
													color: "#999",
												}}
											>
												{orderCount === 1
													? "order"
													: "orders"}
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
													{next.minOrders - orderCount} more{" "}
													{next.minOrders - orderCount === 1
														? "order"
														: "orders"}{" "}
													to reach
												</Typography>
												<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.4 }}>
													{(() => { const nm = TIER_META[next.key]; return <nm.Icon sx={{ fontSize: '0.85rem', color: next.color }} />; })()}
													<Typography sx={{ fontSize: "0.7rem", fontWeight: 700, color: next.color }}>
														{next.label}
													</Typography>
												</Box>
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
														width: `${Math.min((orderCount / next.minOrders) * 100, 100)}%`,
														background: `linear-gradient(90deg, ${meta.border}, ${tier.color})`,
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
											<CelebrationIcon sx={{ fontSize: '1rem', mr: 0.5, verticalAlign: 'middle' }} />
											Maximum tier reached — you're a PerfectFooties legend!
										</Typography>
									)}
								</Box>
							);
						})()}

						{/* Tier Perks Ladder */}
						<Box
							sx={{
								mb: 3,
								borderRadius: 3,
								border: "1.5px solid var(--bg-soft3)",
								overflow: "hidden",
							}}
						>
							<Box
								sx={{
									px: 2,
									py: 1.2,
									backgroundColor: "var(--bg-soft)",
									borderBottom: "1px solid var(--bg-soft3)",
								}}
							>
								<Typography
									sx={{
										fontFamily: ff,
										fontWeight: 700,
										fontSize: "0.85rem",
										color: "#e3242b",
									}}
								>
									<CardGiftcardIcon sx={{ fontSize: '1rem', mr: 0.5, verticalAlign: 'middle' }} />
													Loyalty Tier Perks
								</Typography>
							</Box>
							{[...TIERS].reverse().map((t) => {
								const unlocked = orderCount >= t.minOrders;
								const meta = TIER_META[t.key];
								return (
									<Box
										key={t.key}
										sx={{
											px: 2,
											py: 1.2,
											display: "flex",
											alignItems: "center",
											gap: 1.5,
											borderTop: "1px solid #F9E4EF",
											backgroundColor: unlocked ? t.bg : "transparent",
											opacity: unlocked ? 1 : 0.55,
										}}
									>
										{unlocked
											? <meta.Icon sx={{ fontSize: '1.3rem', color: t.color, flexShrink: 0 }} />
											: <LockIcon sx={{ fontSize: '1.3rem', color: '#bbb', flexShrink: 0 }} />}
										<Box sx={{ flex: 1, minWidth: 0 }}>
											<Typography
												sx={{
													fontFamily: ff,
													fontSize: "0.78rem",
													fontWeight: 700,
													color: unlocked ? t.color : "#bbb",
												}}
											>
												{t.label}
											</Typography>
											<Typography
												sx={{
													fontFamily: ff,
													fontSize: "0.72rem",
													color: unlocked ? "var(--text-muted)" : "#ccc",
													lineHeight: 1.3,
												}}
											>
												{t.perk}
											</Typography>
										</Box>
										{unlocked ? (
											<CheckCircleOutlineIcon
												sx={{ fontSize: "1rem", color: t.color, flexShrink: 0 }}
											/>
										) : (
											<LockOutlinedIcon
												sx={{ fontSize: "0.9rem", color: "#ddd", flexShrink: 0 }}
											/>
										)}
									</Box>
								);
							})}
						</Box>

						{/* Loyalty Points Card */}
						<Box
							sx={{
								mb: 3,
								p: 2.5,
								borderRadius: 3,
								backgroundColor: "var(--bg-soft)",
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
									<EmojiEventsIcon sx={{ fontSize: '1.6rem', color: '#B8860B' }} />
									<Box>
										<Typography
											sx={{
												fontFamily: ff,
												fontWeight: 700,
												fontSize: "0.95rem",
												color: "var(--text-purple)",
											}}
										>
											Loyalty Points
										</Typography>
										<Typography
											sx={{ fontSize: "0.72rem", color: "#777" }}
										>
											Earn points on every delivered order
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
									{loyaltyPoints % 50} / 50 pts to next ₦500 reward
								</Typography>
								{redeemableNaira > 0 && (
									<Box
										sx={{
											backgroundColor: "#e3242b",
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
									<CardGiftcardIcon sx={{ fontSize: '1rem', mr: 0.5 }} />
												Redeem {formatNaira(redeemableNaira)} in Rewards
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
									<MilitaryTechIcon sx={{ fontSize: '0.9rem', mr: 0.4, verticalAlign: 'middle' }} />
															<strong>15 pts</strong> per delivered order · <strong>50 pts = ₦500 off</strong>
								</Typography>
							</Box>
						</Box>

						{/* Referral Code Card */}
						<Box
							sx={{
								mb: 3,
								p: 2.5,
								borderRadius: 3,
								backgroundColor: "var(--bg-soft)",
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
									<RedeemIcon sx={{ fontSize: '1.6rem', color: 'var(--text-purple)' }} />
									<Box>
										<Typography
											sx={{
												fontFamily: ff,
												fontWeight: 700,
												fontSize: "0.95rem",
												color: "var(--text-purple)",
											}}
										>
											Refer a Friend
										</Typography>
										<Typography
											sx={{ fontSize: "0.72rem", color: "#777" }}
										>
											Share your code — everyone you refer gets
											₦500 off
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
											<EmojiEventsIcon sx={{ fontSize: '0.9rem', mr: 0.4, verticalAlign: 'middle', color: '#B8860B' }} />
											{referralUses * POINTS_PER_REFERRAL} pts earned from referrals
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
									backgroundColor: "var(--bg-card)",
									border: "1px solid #CE93D8",
									mb: 1.5,
								}}
							>
								<Typography
									sx={{
										fontFamily: ff,
										fontWeight: 700,
										fontSize: "0.95rem",
										color: "var(--text-purple)",
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
											.then(() => showToast("Referral code copied to clipboard!", "success"))
											.catch(() => showToast("Could not copy — try selecting manually.", "warning"))
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
										`Hey! I shop at PerfectFooties for handmade leather goods — they're amazing! Use my code *${referralCode}* to get ₦500 off your first order: ${referralLink}`,
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
								Share via WhatsApp
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
								checkout on any order
							</Typography>
						</Box>

						{/* Quick Actions */}
						<Box
							sx={{ display: "flex", gap: 1.5, mb: 3, flexWrap: "wrap" }}
						>
							<Button
								startIcon={<ShoppingBagIcon />}
								onClick={() => navigate("/shop")}
								sx={{
									flex: 1,
									minWidth: 140,
									border: "1.5px solid #e3242b",
									borderRadius: "20px",
									color: "#e3242b",
									py: 1,
									fontFamily: ff,
									fontWeight: 600,
									fontSize: "0.85rem",
									textTransform: "none",
									"&:hover": {
										backgroundColor: "#e3242b",
										color: "#fff",
									},
								}}
							>
								Shop Now
							</Button>
							<Button
								startIcon={<RateReviewIcon />}
								onClick={() => navigate("/testimonials")}
								sx={{
									flex: 1,
									minWidth: 140,
									border: "1.5px solid #007a7a",
									borderRadius: "20px",
									color: "var(--text-purple)",
									py: 1,
									fontFamily: ff,
									fontWeight: 600,
									fontSize: "0.85rem",
									textTransform: "none",
									"&:hover": {
										backgroundColor: "#007a7a",
										color: "#fff",
									},
								}}
							>
								All Reviews
							</Button>
						</Box>

						{/* Contact & Address Details */}
						{(displayPhone || displayAddress) && (
							<Box
								sx={{
									mb: 3,
									p: 2.5,
									borderRadius: 3,
									backgroundColor: "var(--bg-card)",
									border: "1px solid var(--bg-soft3)",
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
											color: "var(--text-purple)",
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
											sx={{ color: "#e3242b" }}
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
											sx={{ fontSize: 18, color: "#e3242b" }}
										/>
										<Typography
											sx={{
												fontFamily: ff,
												fontSize: "0.88rem",
												color: "var(--text-main)",
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
												color: "#e3242b",
												mt: 0.1,
											}}
										/>
										<Typography
											sx={{
												fontFamily: ff,
												fontSize: "0.88rem",
												color: "var(--text-main)",
											}}
										>
											{displayAddress}
										</Typography>
									</Box>
								)}
							</Box>
						)}



					<Divider sx={{ borderColor: "var(--bg-soft3)", mb: 3 }} />

						{/* Sign Out */}
						<Box sx={{ textAlign: "center" }}>
							<Button
								startIcon={<LogoutIcon />}
								onClick={handleSignOut}
								sx={{
									border: "2px solid #e3242b",
									borderRadius: "30px",
									color: "#e3242b",
									px: 3,
									py: 1,
									fontFamily: ff,
									fontWeight: 600,
									"&:hover": {
										backgroundColor: "#e3242b",
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
								<CircularProgress sx={{ color: "#e3242b" }} />
							</Box>
						) : orders.length === 0 ? (
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
									onClick={() => navigate("/shop")}
									sx={{
										mt: 2,
										border: "2px solid #e3242b",
										borderRadius: "30px",
										color: "#e3242b",
										px: 3,
										py: 1,
										fontFamily: ff,
										fontWeight: 600,
										"&:hover": {
											backgroundColor: "#e3242b",
											color: "#fff",
										},
									}}
								>
									Browse Products
								</Button>
							</Box>
						) : (
							orders.map((order) => (
								<OrderCard
									key={order.id}
									order={order}
									rated={!!ratedOrders[order.id]}
									onRate={() => setRateDialog(order)}
									onCancel={() => setCancelDialog(order)}
									onEdit={() => handleOpenEditOrder(order)}
									onViewDetail={(id) => navigate(`/account/orders/${id}`)}
								/>
							))
						)}
					</Box>
				)}

				{/* ── Wishlist Tab ── */}
				{tabIndex === 2 && (
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
									onClick={() => navigate("/shop")}
									sx={{
										border: "2px solid #e3242b",
										borderRadius: "30px",
										color: "#e3242b",
										px: 3,
										py: 1,
										fontFamily: ff,
										fontWeight: 600,
										"&:hover": {
											backgroundColor: "#e3242b",
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
										border: "1px solid var(--bg-soft3)",
										backgroundColor: "var(--bg-card)",
										transition: "box-shadow 0.2s ease",
										"&:hover": {
											boxShadow: "0 2px 12px rgba(233,30,140,0.1)",
										},
									}}
								>
									<Box
										onClick={() =>
											navigate("/shop", {
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
													backgroundColor: "#e3242b",
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
												navigate("/shop", {
													state: { categoryId: item.categoryId },
												})
											}
											sx={{
												color: "#999",
												"&:hover": { color: "var(--text-purple)" },
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
												"&:hover": { color: "#e3242b" },
											}}
										>
											<ShoppingCartOutlinedIcon />
										</IconButton>
									</Tooltip>
									<Tooltip title="Remove from wishlist">
										<IconButton
											onClick={() => {
												removeFromWishlist(item.productId);
												showToast(`${item.name} removed from wishlist.`, "info");
											}}
											sx={{
												color: "#ccc",
												"&:hover": { color: "#e3242b" },
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
							Cancel Order?
						</Typography>
					</DialogTitle>
					<DialogContent>
						<Typography
							sx={{
								color: "var(--text-muted)",
								fontSize: "0.9rem",
								mt: 1,
								mb: 2.5,
							}}
						>
							You are cancelling{" "}
							<strong>
								{cancelDialog?.items?.[0]?.serviceName ||
									cancelDialog?.items?.[0]?.name ||
									"this item"}
							</strong>
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
									value="Wrong item / order placed"
									sx={{ fontFamily: ff }}
								>
									Wrong item / order placed
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
							Keep Order
						</Button>
						<Button
							onClick={handleCancelOrder}
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
								<CelebrationIcon sx={{ fontSize: '3rem', color: '#2e7d32', display: 'block', mx: 'auto', mb: 1 }} />
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
										color: "var(--text-muted)",
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
										<CardGiftcardIcon sx={{ fontSize: '0.85rem', mr: 0.5, verticalAlign: 'middle' }} />
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
									sx={{
										fontSize: "0.82rem",
										color: "var(--text-muted)",
										mb: 2,
									}}
								>
									Each unit = <strong>50 pts = ₦500 off</strong>.
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
						Edit Order Details
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
								backgroundColor: "#e3242b",
								color: "#fff",
								borderRadius: "20px",
								px: 3,
								fontFamily: ff,
								fontWeight: 600,
								textTransform: "none",
								"&:hover": { backgroundColor: "#b81b21" },
								"&.Mui-disabled": {
									backgroundColor: "#E8D5B0",
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
					userName={profile.displayName || user?.displayName || ""}
					uid={user?.uid || ''}
					userEmail={user?.email || ''}
					onClose={() => setRateDialog(null)}
					onSubmitted={(orderId) => {
						setRatedOrders((prev) => ({ ...prev, [orderId]: true }));
						// Also update the local orders list so the button changes immediately
						setOrders((prev) => 
							prev.map(o => o.id === orderId ? { ...o, rated: true } : o)
						);
						setRateDialog(null);
						if (user?.uid) {
							markOrderAsRated(user.uid, orderId).catch(console.error);
							incrementUserReviewCount(user.uid).catch(() => {});
						}
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
								backgroundColor: "#e3242b",
								color: "#fff",
								borderRadius: "20px",
								px: 3,
								fontFamily: ff,
								fontWeight: 600,
								"&:hover": { backgroundColor: "#b81b21" },
							}}
						>
							Save
						</Button>
					</DialogActions>
				</Dialog>

			</Container>
		</Box>
	);
}

// ─── Rate Dialog ──────────────────────────────────────────────────────────────
function RateDialog({ open, onClose, order, userName, uid, userEmail, onSubmitted }) {
	const [rating, setRating] = React.useState(0);
	const [reviewerName, setReviewerName] = React.useState('');
	const [occupation, setOccupation] = React.useState('');
	const [comment, setComment] = React.useState('');
	const [photos, setPhotos] = React.useState([]);
	const [photoPreviews, setPhotoPreviews] = React.useState([]);
	const [submitting, setSubmitting] = React.useState(false);
	const [submitError, setSubmitError] = React.useState('');

	React.useEffect(() => {
		if (open) {
			setRating(0);
			setReviewerName(userName || '');
			setOccupation('');
			setComment('');
			setPhotos([]);
			setPhotoPreviews([]);
			setSubmitError('');
		}
	}, [open, userName]);

	const handlePhotoChange = (e) => {
		const file = e.target.files?.[0];
		if (!file) return;
		if (photos.length >= 2) { setSubmitError('Maximum 2 photos allowed.'); return; }
		if (file.size > 5 * 1024 * 1024) { setSubmitError('Each photo must be under 5 MB.'); return; }
		setPhotos((prev) => [...prev, file]);
		setPhotoPreviews((prev) => [...prev, URL.createObjectURL(file)]);
		setSubmitError('');
		e.target.value = '';
	};

	const removePhoto = (idx) => {
		setPhotos((prev) => prev.filter((_, i) => i !== idx));
		setPhotoPreviews((prev) => prev.filter((_, i) => i !== idx));
	};

	const handleSubmit = async () => {
		console.log("[Review Debug] Starting submission:", { rating, reviewerName, comment, photosCount: photos.length });
		if (!rating) {
			console.log("[Review Debug] Submission aborted: No rating provided.");
			return;
		}
		if (!reviewerName.trim()) {
			console.log("[Review Debug] Submission aborted: No reviewer name provided.");
			setSubmitError('Please provide a name for the review.');
			return;
		}
		setSubmitting(true);
		setSubmitError('');
		try {
			const photoURLs = [];
			for (const photo of photos) {
				if (uid) {
					try { 
						console.log("[Review Debug] Uploading photo:", photo.name);
						const url = await uploadReviewPhoto(uid, photo);
						console.log("[Review Debug] Photo uploaded successfully:", url);
						photoURLs.push(url); 
					} catch (e) { 
						console.error("[Review Debug] Photo upload failed:", e);
						/* skip */ 
					}
				}
			}
			const firstItem = order?.items?.[0];
			const resolvedProductId = firstItem?.productId || firstItem?.id || '';
			const resolvedProductName = firstItem?.name || firstItem?.serviceName || '';
			const payload = {
				orderId: order?.id || '',
				uid: uid || '',
				productId: resolvedProductId,
				...(firstItem?.collectionId && { collectionId: firstItem.collectionId }),
				...(firstItem?.collectionName && { collectionName: firstItem.collectionName }),
				...(resolvedProductName && { productName: resolvedProductName }),
				service: resolvedProductName || firstItem?.collectionName || '',
				rating,
				testimonial: comment,
				name: reviewerName.trim(),
				...(occupation.trim() && { occupation: occupation.trim() }),
				email: userEmail || '',
				type: 'purchase',
				...(photoURLs.length > 0 && { photoURLs }),
			};
			console.log("[Review Debug] Saving testimonial with payload:", payload);
			await saveTestimonial(payload);
			console.log("[Review Debug] Testimonial saved successfully!");
			onSubmitted?.(order?.id);
		} catch (err) {
			console.error("[Review Debug] Error in handleSubmit:", err);
			setSubmitError('Could not submit review. Please try again.');
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth
			PaperProps={{ sx: { borderRadius: 4, p: 1 } }}>
			<DialogTitle sx={{ fontFamily: '"Georgia", serif', fontWeight: 700 }}>
				Leave a Review
			</DialogTitle>
			<DialogContent>
				<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
					<Rating
						value={rating}
						onChange={(_, v) => setRating(v)}
						size="large"
						sx={{ color: '#e3242b' }}
					/>
					<TextField
						label="Your Name"
						value={reviewerName}
						onChange={(e) => setReviewerName(e.target.value)}
						fullWidth
						size="small"
						sx={{ '& .MuiOutlinedInput-root.Mui-focused fieldset': { borderColor: '#e3242b' } }}
					/>
					<TextField
						label="Occupation / Role (optional)"
						value={occupation}
						onChange={(e) => setOccupation(e.target.value)}
						fullWidth
						size="small"
						placeholder="e.g. Fashion Designer, Nurse…"
						sx={{ '& .MuiOutlinedInput-root.Mui-focused fieldset': { borderColor: '#e3242b' } }}
					/>
					<TextField
						multiline
						rows={3}
						label="Your review (optional)"
						value={comment}
						onChange={(e) => setComment(e.target.value)}
						fullWidth
						sx={{ '& .MuiOutlinedInput-root.Mui-focused fieldset': { borderColor: '#e3242b' } }}
					/>
					{/* Photo upload — max 2 */}
					<Box>
						<Typography sx={{ fontFamily: 'Georgia, serif', fontSize: '0.82rem', color: '#777', mb: 1 }}>
							Add up to 2 photos of your purchase (optional, max 5 MB each)
						</Typography>
						<Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
							{photoPreviews.map((src, i) => (
								<Box key={i} sx={{ position: 'relative' }}>
									<Box component="img" src={src} alt={`preview ${i + 1}`}
										sx={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 2, border: '1px solid var(--bg-soft3)', display: 'block' }} />
									<IconButton
										size="small"
										onClick={() => removePhoto(i)}
										sx={{ position: 'absolute', top: -8, right: -8, backgroundColor: 'var(--bg-card)', border: '1px solid var(--bg-soft3)', p: 0.2, '&:hover': { backgroundColor: '#ffe0e0' } }}
									>
										<DeleteOutlineIcon sx={{ fontSize: 14, color: '#e3242b' }} />
									</IconButton>
								</Box>
							))}
							{photos.length < 2 && (
								<Button
									component="label"
									size="small"
									sx={{ border: '1.5px solid var(--bg-soft3)', borderRadius: '20px', fontSize: '0.78rem', textTransform: 'none', color: 'var(--text-muted)', '&:hover': { borderColor: '#e3242b', color: '#e3242b' } }}
								>
									{photos.length === 0 ? 'Add Photo' : 'Add 2nd Photo'}
									<input type="file" accept="image/*" hidden onChange={handlePhotoChange} />
								</Button>
							)}
						</Box>
					</Box>
					{submitError && <Typography sx={{ color: '#d32f2f', fontSize: '0.78rem' }}>{submitError}</Typography>}
				</Box>
			</DialogContent>
			<DialogActions sx={{ px: 3, pb: 2 }}>
				<Button onClick={onClose} sx={{ color: '#999' }}>Cancel</Button>
				<Button
					onClick={handleSubmit}
					disabled={!rating || submitting}
					variant="contained"
					sx={{ backgroundColor: '#e3242b', borderRadius: 30, px: 3, fontFamily: '"Georgia", serif', fontWeight: 600, '&:hover': { backgroundColor: '#b81b21' } }}
				>
					{submitting ? 'Submitting…' : 'Submit Review'}
				</Button>
			</DialogActions>
		</Dialog>
	);
}

// ─── Order Steps ──────────────────────────────────────────────────────────────
const ORDER_STEPS = [
	{ key: 'pending',    label: 'Order Placed'  },
	{ key: 'confirmed',  label: 'Confirmed'     },
	{ key: 'production', label: 'In Production' },
	{ key: 'shipped',    label: 'Shipped'       },
	{ key: 'delivered',  label: 'Delivered'     },
];

// ─── Order Progress Tracker ───────────────────────────────────────────────────
function OrderProgressTracker({ status }) {
	const activeIdx = (() => {
		if (status === 'delivered' || status === 'received' || status === 'completed') return 4;
		if (status === 'shipped') return 3;
		if (status === 'production') return 2;
		if (status === 'confirmed') return 1;
		return 0;
	})();

	return (
		<Box sx={{ mt: 2 }}>
			<Stepper activeStep={activeIdx} alternativeLabel>
				{ORDER_STEPS.map((step, i) => (
					<Step key={step.key} completed={i <= activeIdx}>
						<StepLabel
							StepIconProps={{
								sx: {
									color: i <= activeIdx ? '#e3242b !important' : undefined,
									'&.Mui-completed': { color: '#e3242b' },
									'&.Mui-active':    { color: '#e3242b' },
								},
							}}
						>
							<Typography sx={{ fontSize: '0.7rem', color: i <= activeIdx ? '#e3242b' : '#aaa' }}>
								{step.label}
							</Typography>
						</StepLabel>
					</Step>
				))}
			</Stepper>

			{(status === 'shipped') && (
				<Typography sx={{ mt: 1, fontSize: '0.78rem', color: '#888', textAlign: 'center' }}>
					Estimated delivery: 10–14 days after dispatch
				</Typography>
			)}
		</Box>
	);
}

// ─── Order Card ───────────────────────────────────────────────────────────────
function OrderCard({ order, rated, onCancel, onEdit, onRate, onViewDetail }) {
	const isCancelled = order.status === 'cancelled';
	const isDelivered = ['delivered', 'received', 'completed'].includes(order.status);
	const isPending   = order.status === 'pending';

	const typeLabel = (() => {
		const t = order.type || '';
		if (t === 'nicheCollection' || t === 'product') return 'Leather Product';
		return 'Order';
	})();

	const statusColor = {
		pending:    '#f59e0b',
		confirmed:  '#3b82f6',
		production: '#8b5cf6',
		shipped:    '#06b6d4',
		delivered:  '#10b981',
		received:   '#10b981',
		completed:  '#10b981',
		cancelled:  '#ef4444',
	}[order.status] || '#999';

	return (
		<Box
			onClick={() => onViewDetail(order.id)}
			sx={{
				border: "1px solid var(--bg-soft3)",
				borderRadius: 3,
				p: 2.5,
				mb: 2,
				backgroundColor: isCancelled ? "var(--bg-soft)" : "var(--bg-card)",
				opacity: isCancelled ? 0.85 : 1,
				transition: "box-shadow 0.2s, border-color 0.2s",
				cursor: "pointer",
				"&:hover": {
					boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
					borderColor: "#e3242b",
				},
			}}
		>
			{/* Header row */}
			<Box
				sx={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "flex-start",
					mb: 1.5,
					flexWrap: "wrap",
					gap: 1,
				}}
			>
				<Box>
					<Typography
						sx={{
							fontFamily: '"Georgia", serif',
							fontWeight: 700,
							fontSize: "1rem",
							color: "#1a1a1a",
						}}
					>
						Order #{order.id?.slice(-6).toUpperCase()}
					</Typography>
					<Typography sx={{ fontSize: "0.78rem", color: "#888", mt: 0.3 }}>
						{order.createdAt?.toDate
							? order.createdAt
									.toDate()
									.toLocaleDateString("en-GB", {
										day: "numeric",
										month: "short",
										year: "numeric",
									})
							: "Date unknown"}
					</Typography>
				</Box>
				<Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
					<Chip
						label={typeLabel}
						size="small"
						sx={{
							backgroundColor: "var(--bg-soft)",
							color: "#c9792e",
							fontWeight: 600,
							fontSize: "0.72rem",
							borderRadius: 2,
						}}
					/>
					<Chip
						label={
							order.status?.charAt(0).toUpperCase() +
								order.status?.slice(1) || "Pending"
						}
						size="small"
						sx={{
							backgroundColor: statusColor + "22",
							color: statusColor,
							fontWeight: 700,
							fontSize: "0.72rem",
							borderRadius: 2,
						}}
					/>
				</Box>
			</Box>

			{/* Items */}
			{Array.isArray(order.items) && order.items.length > 0 && (
				<Box sx={{ mb: 1.5 }}>
					{order.items.map((item, i) => (
						<Box
							key={i}
							sx={{
								display: "flex",
								justifyContent: "space-between",
								fontSize: "0.85rem",
								color: "#555",
								py: 0.3,
							}}
						>
							<Typography sx={{ fontSize: "0.85rem" }}>
								{item.name || item.productName || "Item"}
								{item.quantity ? ` x${item.quantity}` : ""}
							</Typography>
							{item.price && (
								<Typography
									sx={{ fontSize: "0.85rem", fontWeight: 600 }}
								>
									{formatNaira(item.price)}
								</Typography>
							)}
							{((item.surcharge || 0) > 0 ||
								(item.euSize && Number(item.euSize) >= 45)) && (
								<Typography
									sx={{ fontSize: "0.78rem", color: "#e3242b" }}
								>
									+
									{formatNaira(
										item.surcharge ||
											(Number(item.euSize) >= 45
												? 2000 * (item.quantity || 1)
												: 0),
									)}
								</Typography>
							)}
						</Box>
					))}
				</Box>
			)}

			{/* Total */}
			{order.total && (
				<Box
					sx={{
						display: "flex",
						justifyContent: "space-between",
						borderTop: "1px solid var(--bg-soft3)",
						pt: 1,
						mt: 1,
					}}
				>
					<Typography sx={{ fontWeight: 600, fontSize: "0.9rem" }}>
						Total
					</Typography>
					<Typography
						sx={{ fontWeight: 700, fontSize: "0.9rem", color: "#e3242b" }}
					>
						{formatNaira(order.total)}
					</Typography>
				</Box>
			)}

			{/* Progress tracker */}
			{!isCancelled && <OrderProgressTracker status={order.status} />}

			{/* Fez Delivery tracking */}
			{order.status === "shipped" && order.trackingLink && (
				<Box
					sx={{
						mt: 1.5,
						p: 1.5,
						borderRadius: 2,
						background: "#f0faff",
						border: "1px solid #bae6fd",
						display: "flex",
						alignItems: "center",
						justifyContent: "space-between",
						gap: 1,
						flexWrap: "wrap",
					}}
				>
					<Typography
						sx={{
							fontSize: "0.78rem",
							color: "#0369a1",
							fontWeight: 600,
						}}
					>
						Handled by Fez Delivery
					</Typography>
					<Button
						size="small"
						variant="contained"
						href={order.trackingLink}
						target="_blank"
						rel="noopener noreferrer"
						sx={{
							borderRadius: 20,
							backgroundColor: "#0369a1",
							fontSize: "0.75rem",
							"&:hover": { backgroundColor: "#0284c7" },
						}}
					>
						Track My Package
					</Button>
				</Box>
			)}

			{/* Action buttons */}
			<Box
				sx={{
					display: "flex",
					gap: 1.5,
					mt: 2,
					flexWrap: "wrap",
					alignItems: "center",
				}}
				onClick={(e) => e.stopPropagation()}
			>
				<Button
					size="small"
					variant="outlined"
					onClick={() => onViewDetail(order.id)}
					endIcon={<span style={{ fontSize: "0.7rem" }}>→</span>}
					sx={{
						borderRadius: 30,
						borderColor: "#007a7a",
						color: "#007a7a",
						fontSize: "0.78rem",
						"&:hover": {
							backgroundColor: "#e8fff8",
							borderColor: "#005f5f",
						},
					}}
				>
					View Details
				</Button>
				{isPending && !isCancelled && (
					<>
						<Button
							size="small"
							variant="outlined"
							onClick={() => onEdit(order)}
							sx={{
								borderRadius: 30,
								borderColor: "#e3242b",
								color: "#e3242b",
								fontSize: "0.78rem",
								"&:hover": { backgroundColor: "#fff0f0" },
							}}
						>
							Edit Order
						</Button>
						<Button
							size="small"
							variant="outlined"
							onClick={() => onCancel(order)}
							sx={{
								borderRadius: 30,
								borderColor: "#ef4444",
								color: "#ef4444",
								fontSize: "0.78rem",
								"&:hover": { backgroundColor: "#fff5f5" },
							}}
						>
							Cancel Order
						</Button>
					</>
				)}
				{isDelivered && (
					<Button
						size="small"
						variant="contained"
						onClick={() => onRate(order)}
						disabled={rated || order.rated}
						sx={{
							borderRadius: 30,
							backgroundColor: (rated || order.rated) ? "#E8D5B0" : "#e3242b",
							color: "#fff",
							fontSize: "0.78rem",
							"&:hover": { backgroundColor: (rated || order.rated) ? "#E8D5B0" : "#b81b21" },
							"&.Mui-disabled": {
								backgroundColor: "#E8D5B0",
								color: "#fff",
							}
						}}
					>
						{(rated || order.rated) ? "Rated" : "Rate Order"}
					</Button>
				)}
			</Box>
		</Box>
	);
}
