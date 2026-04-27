import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Container,
  Button,
  IconButton,
  Divider,
  CircularProgress,
  Collapse,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
} from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import StarIcon from '@mui/icons-material/Star';
import CardGiftcardIcon from '@mui/icons-material/CardGiftcard';
import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { redeemGiftCard } from '../lib/giftCardService';
import { validateReferralCode, applyReferral, getLoyaltyData, redeemLoyaltyPoints, REFERRAL_DISCOUNT, REDEMPTION_UNIT, REDEMPTION_VALUE, getPendingLoyaltyReward, clearPendingLoyaltyReward } from '../lib/loyaltyService';
import GiftCardRedeemInput from '../components/GiftCardRedeemInput';
import { getRecentlyViewed } from '../lib/recentlyViewed';
import SignInPrompt from '../components/SignInPrompt';

function formatNaira(amount) {
  return `\u20A6${amount.toLocaleString()}`;
}

const sectionTitleSx = {
  fontFamily: '"Georgia", serif',
  fontWeight: 700,
  color: 'var(--text-purple)',
  fontSize: '1.2rem',
  mb: 2,
};

export default function CartPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useNotifications();
  const [checkoutLoading] = useState(false);
  const [appliedGiftCard, setAppliedGiftCard] = useState(() => {
    try {
      const s = sessionStorage.getItem('appliedGiftCard');
      return s ? JSON.parse(s) : null;
    } catch { return null; }
  });
  const [signInPromptOpen, setSignInPromptOpen] = useState(false);
  const [showRefField, setShowRefField] = useState(false);
  const [refCodeInput, setRefCodeInput] = useState('');
  const [referralValid, setReferralValid] = useState(false);
  const [referralChecking, setReferralChecking] = useState(false);
  const [referralMsg, setReferralMsg] = useState('');
  const [loyaltyBalance, setLoyaltyBalance] = useState(0);
  const [loyaltyUnits, setLoyaltyUnits] = useState(0);
  const [pendingReward] = useState(() => getPendingLoyaltyReward());
  const [recentlyViewed] = useState(() => getRecentlyViewed());
  const {
		cart,
		removeLeatherGood,
		updateLeatherGoodQty,
		clearCart,
		getCartTotal,
		getCartSurcharge,
  } = useCart();

  const { leatherGoods } = cart.items;
  const hasItems = leatherGoods.length > 0;
  const total = getCartTotal();
  const surchargeTotal = getCartSurcharge();
  const giftCardDiscount = appliedGiftCard ? Math.min(appliedGiftCard.balance, total) : 0;
  const maxLoyaltyUnits = Math.floor(loyaltyBalance / REDEMPTION_UNIT);
  const referralDiscount = referralValid ? Math.min(REFERRAL_DISCOUNT, total) : 0;
  const loyaltyDiscount = Math.min(loyaltyUnits * REDEMPTION_VALUE, Math.max(0, total - giftCardDiscount - referralDiscount));
  const finalTotal = Math.max(0, total - giftCardDiscount - referralDiscount - loyaltyDiscount);

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
        setReferralMsg(valid ? '\u20a6500 off applied!' : '');
      }).catch(() => {});
    }
  }, [user]);

  const handleApplyReferral = async () => {
    if (!refCodeInput.trim()) return;
    setReferralChecking(true);
    setReferralMsg('');
    try {
      const referrerUid = await validateReferralCode(refCodeInput.trim());
      if (!referrerUid) {
        setReferralValid(false);
        setReferralMsg('Invalid code.');
        showToast('Invalid referral code. Please check and try again.', 'error');
      } else if (referrerUid === user?.uid) {
        setReferralValid(false);
        setReferralMsg("You can't use your own referral code.");
        showToast("You can't apply your own referral code.", 'warning');
      } else {
        setReferralValid(true);
        setReferralMsg('\u20a6500 off applied!');
        showToast('Referral code applied! ₦500 discount added.', 'success');
      }
    } catch {
      setReferralValid(false);
      setReferralMsg('Could not verify code.');
      showToast('Could not verify referral code. Please try again.', 'error');
    }
    setReferralChecking(false);
  };

  const handleCheckout = () => {
    if (!user) { setSignInPromptOpen(true); return; }
    navigate('/checkout', { state: { appliedGiftCard, referralCode: referralValid ? refCodeInput : null, presetLoyaltyUnits: loyaltyUnits } });
  };

  return (
		<Box
			sx={{
				pt: { xs: 10, md: 12 },
				pb: { xs: 22, md: 16 },
				minHeight: "100vh",
				backgroundColor: "#FFF8F0",
			}}
		>
			<Container maxWidth="md">
				{/* Header */}
				<Box sx={{ textAlign: "center", mb: 4 }}>
					<ShoppingCartOutlinedIcon
						sx={{ fontSize: 48, color: "#e3242b", mb: 1 }}
					/>
					<Typography
						variant="h3"
						sx={{
							fontFamily: '"Georgia", serif',
							fontWeight: 700,
							color: "var(--text-main)",
							fontSize: { xs: "1.8rem", sm: "2.4rem", md: "3rem" },
						}}
					>
						Your Cart
					</Typography>
				</Box>

				{!hasItems ? (
					/* Empty state */
					<Box sx={{ textAlign: "center", py: 8 }}>
						<Typography sx={{ color: "#777", fontSize: "1.1rem", mb: 3 }}>
							Your cart is empty.
						</Typography>
						<Box
							sx={{
								display: "flex",
								gap: 2,
								justifyContent: "center",
								flexWrap: "wrap",
							}}
						>
							<Button
								onClick={() => navigate("/shop")}
								sx={{
									border: "2px solid #e3242b",
									borderRadius: "30px",
									color: "var(--text-main)",
									px: 3,
									py: 1,
									fontFamily: '"Georgia", serif',
									fontWeight: 600,
									"&:hover": {
										backgroundColor: "#e3242b",
										color: "#fff",
									},
								}}
							>
								Shop Products
							</Button>
						</Box>
					</Box>
				) : (
					<>
						{/* Leather Goods */}
						{leatherGoods.length > 0 && (
							<Box sx={{ mb: 4 }}>
								<Typography sx={sectionTitleSx}>Your Order</Typography>
								{leatherGoods.map((g) => (
									<Box
										key={g.cartId}
										sx={{
											display: "flex",
											alignItems: "flex-start",
											justifyContent: "space-between",
											p: 2,
											mb: 1.5,
											borderRadius: 2,
											border: "1px solid #E8D5B0",
											backgroundColor: "#fff",
										}}
									>
										{/* Thumbnail */}
										{g.image ? (
											<Box
												component="img"
												src={g.image}
												alt={g.name}
												sx={{
													width: 64,
													height: 64,
													objectFit: "cover",
													borderRadius: 2,
													border: "1px solid #E8D5B0",
													mr: 2,
													flexShrink: 0,
												}}
											/>
										) : (
											<Box
												sx={{
													width: 64,
													height: 64,
													borderRadius: 2,
													border: "1px dashed #E8D5B0",
													mr: 2,
													flexShrink: 0,
													display: "flex",
													alignItems: "center",
													justifyContent: "center",
													backgroundColor: "#f9f9f9",
												}}
											>
												<ShoppingCartOutlinedIcon
													sx={{ color: "#ddd", fontSize: 28 }}
												/>
											</Box>
										)}
										<Box sx={{ flex: 1 }}>
											<Typography
												sx={{
													fontFamily: '"Georgia", serif',
													fontWeight: 600,
													fontSize: "0.95rem",
												}}
											>
												{g.name}
											</Typography>
											<Typography
												sx={{
													color: "#777",
													fontSize: "0.82rem",
													mt: 0.3,
												}}
											>
												Colour: {g.selectedColor}
												{g.euSize ? ` · EU Size: ${g.euSize}` : ""}
												{g.footLength
													? ` · Foot Length: ${g.footLength}cm`
													: ""}
											</Typography>
											{g.selectedImageIndex && (
												<Typography
													sx={{
														color: "#777",
														fontSize: "0.78rem",
														mt: 0.2,
													}}
												>
													Selected design: Image{" "}
													{g.selectedImageIndex}
												</Typography>
											)}
											{g.orderNotes && (
												<Typography
													sx={{
														color: "#777",
														fontSize: "0.78rem",
														mt: 0.2,
														lineHeight: 1.6,
													}}
												>
													Notes: {g.orderNotes}
												</Typography>
											)}
											{g.collectionName && (
												<Typography
													sx={{
														color: "#aaa",
														fontSize: "0.75rem",
														mt: 0.2,
													}}
												>
													{g.collectionName}
												</Typography>
											)}
											{/* Quantity stepper */}
											<Box
												sx={{
													display: "flex",
													alignItems: "center",
													gap: 1,
													mt: 1,
												}}
											>
												<IconButton
													size="small"
													onClick={() =>
														updateLeatherGoodQty(
															g.cartId,
															g.quantity - 1,
														)
													}
													disabled={g.quantity <= 1}
													sx={{
														color: "var(--text-purple)",
														border: "1.5px solid #E8D5B0",
														width: 26,
														height: 26,
														"&:hover": {
															borderColor: "var(--accent-cyan)",
														},
														"&.Mui-disabled": {
															borderColor: "#eee",
															color: "#ccc",
														},
													}}
												>
													<RemoveIcon sx={{ fontSize: 14 }} />
												</IconButton>
												<Typography
													sx={{
														fontFamily: '"Georgia", serif',
														fontWeight: 700,
														minWidth: 22,
														textAlign: "center",
														fontSize: "0.9rem",
													}}
												>
													{g.quantity}
												</Typography>
												<IconButton
													size="small"
													onClick={() =>
														updateLeatherGoodQty(
															g.cartId,
															g.quantity + 1,
														)
													}
													sx={{
														color: "var(--text-purple)",
														border: "1.5px solid #E8D5B0",
														width: 26,
														height: 26,
														"&:hover": {
															borderColor: "var(--accent-cyan)",
														},
													}}
												>
													<AddIcon sx={{ fontSize: 14 }} />
												</IconButton>
											</Box>
										</Box>
										<Box
											sx={{
												display: "flex",
												flexDirection: "column",
												alignItems: "flex-end",
												gap: 0.5,
												ml: 2,
											}}
										>
											<Typography
												sx={{
													fontFamily: '"Georgia", serif',
													fontWeight: 700,
													color: "var(--text-purple)",
													whiteSpace: "nowrap",
												}}
											>
												{formatNaira(g.price * g.quantity)}
											</Typography>
											<IconButton
												size="small"
												onClick={() => {
													removeLeatherGood(g.cartId);
													showToast(
														`${g.name} removed from cart.`,
														"info",
													);
												}}
												sx={{ color: "#e3242b" }}
											>
												<DeleteOutlineIcon sx={{ fontSize: 20 }} />
											</IconButton>
										</Box>
									</Box>
								))}
								<Divider sx={{ borderColor: "#E8D5B0", mt: 2 }} />
							</Box>
						)}

						{/* Discounts & Rewards */}
						<Box
							sx={{
								mt: 2,
								mb: 3,
								p: 3,
								borderRadius: 3,
								backgroundColor: "#fff",
								border: "1px solid #E8D5B0",
							}}
						>
							<Typography
								sx={{
									fontFamily: '"Georgia", serif',
									fontWeight: 700,
									color: "var(--text-purple)",
									mb: 2,
									fontSize: "0.95rem",
								}}
							>
								Discounts &amp; Rewards
							</Typography>

							{/* Referral code */}
							<Box
								onClick={() => setShowRefField((v) => !v)}
								sx={{
									display: "flex",
									alignItems: "center",
									gap: 1,
									cursor: "pointer",
									mb: showRefField ? 1.5 : 0,
								}}
							>
								<LocalOfferIcon
									sx={{
										fontSize: 16,
										color: referralValid ? "#2e7d32" : "#e3242b",
									}}
								/>
								<Typography
									sx={{
										fontSize: "0.85rem",
										fontWeight: 600,
										color: referralValid ? "#2e7d32" : "#e3242b",
										fontFamily: '"Georgia", serif',
									}}
								>
									{referralValid
										? "\u20a6500 off applied!"
										: "Have a referral code?"}
								</Typography>
							</Box>
							<Collapse in={showRefField}>
								<Box sx={{ display: "flex", gap: 1, mb: 0.5 }}>
									<TextField
										size="small"
										placeholder="e.g. FOOTIES-ABC123"
										value={refCodeInput}
										onChange={(e) => {
											setRefCodeInput(e.target.value.toUpperCase());
											setReferralValid(false);
											setReferralMsg("");
										}}
										sx={{
											flex: 1,
											"& .MuiOutlinedInput-root": {
												borderRadius: 2,
												"& fieldset": { borderColor: "#E8D5B0" },
												"&.Mui-focused fieldset": {
													borderColor: "#e3242b",
												},
											},
										}}
										inputProps={{
											style: {
												fontFamily: "monospace",
												letterSpacing: 1,
											},
										}}
									/>
									<Button
										onClick={handleApplyReferral}
										disabled={
											!refCodeInput.trim() || referralChecking
										}
										sx={{
											backgroundColor: "#e3242b",
											color: "#fff",
											borderRadius: 2,
											px: 2.5,
											fontFamily: '"Georgia", serif',
											fontWeight: 600,
											fontSize: "0.82rem",
											whiteSpace: "nowrap",
											"&:hover": { backgroundColor: "#b81b21" },
											"&.Mui-disabled": {
												backgroundColor: "#E8D5B0",
												color: "#fff",
											},
										}}
									>
										{referralChecking ? (
											<CircularProgress
												size={16}
												sx={{ color: "#fff" }}
											/>
										) : (
											"Apply"
										)}
									</Button>
								</Box>
								{referralMsg && (
									<Typography
										sx={{
											fontSize: "0.78rem",
											color: referralValid ? "#2e7d32" : "#d32f2f",
											mt: 0.3,
										}}
									>
										{referralMsg}
									</Typography>
								)}
							</Collapse>

							{/* Loyalty points */}
							{user && maxLoyaltyUnits > 0 && (
								<Box sx={{ mt: 2 }}>
									{/* Pending loyalty reward banner */}
									{pendingReward && loyaltyUnits === 0 && (
										<Box
											sx={{
												mb: 1.5,
												p: 1.2,
												borderRadius: 2,
												background:
													"linear-gradient(135deg, #FFF8E1, #FFF3E0)",
												border: "1.5px solid #FFD54F",
												display: "flex",
												alignItems: "center",
												justifyContent: "space-between",
												gap: 1,
											}}
										>
											<Box>
												<Typography
													sx={{
														fontWeight: 700,
														fontSize: "0.82rem",
														color: "#B8860B",
														display: "flex",
														alignItems: "center",
														gap: 0.5,
													}}
												>
													<CardGiftcardIcon
														sx={{ fontSize: "0.95rem" }}
													/>{" "}
													₦{pendingReward.naira.toLocaleString()}{" "}
													loyalty reward ready
												</Typography>
												<Typography
													sx={{
														fontSize: "0.72rem",
														color: "#888",
													}}
												>
													{pendingReward.pts} pts saved — tap Apply
													to use
												</Typography>
											</Box>
											<Button
												size="small"
												onClick={() => {
													const u = Math.min(
														pendingReward.units,
														maxLoyaltyUnits,
													);
													setLoyaltyUnits(u);
													showToast(
														`Loyalty reward applied! ₦${(u * REDEMPTION_VALUE).toLocaleString()} off your order.`,
														"success",
													);
												}}
												sx={{
													border: "1.5px solid #e3242b",
													borderRadius: "20px",
													color: "#e3242b",
													px: 2,
													py: 0.4,
													fontSize: "0.78rem",
													fontWeight: 700,
													textTransform: "none",
													"&:hover": {
														backgroundColor: "#e3242b",
														color: "#fff",
													},
												}}
											>
												Apply
											</Button>
										</Box>
									)}
									<Box
										sx={{
											display: "flex",
											alignItems: "center",
											gap: 1,
											mb: 1,
										}}
									>
										<StarIcon
											sx={{ fontSize: 16, color: "#B8860B" }}
										/>
										<Typography
											sx={{
												fontSize: "0.85rem",
												fontWeight: 600,
												color: "#B8860B",
												fontFamily: '"Georgia", serif',
											}}
										>
											Loyalty &mdash; {loyaltyBalance} pts (
											{formatNaira(
												maxLoyaltyUnits * REDEMPTION_VALUE,
											)}{" "}
											redeemable)
										</Typography>
									</Box>
									<Box
										sx={{
											display: "flex",
											alignItems: "center",
											gap: 1.5,
										}}
									>
										<IconButton
											size="small"
											onClick={() =>
												setLoyaltyUnits((u) => Math.max(0, u - 1))
											}
											disabled={loyaltyUnits === 0}
											sx={{
												border: "1.5px solid #E8D5B0",
												borderRadius: "50%",
												width: 28,
												height: 28,
											}}
										>
											<RemoveIcon sx={{ fontSize: 14 }} />
										</IconButton>
										<Typography
											sx={{
												fontFamily: '"Georgia", serif',
												fontWeight: 700,
												minWidth: 20,
												textAlign: "center",
											}}
										>
											{loyaltyUnits}
										</Typography>
										<IconButton
											size="small"
											onClick={() =>
												setLoyaltyUnits((u) =>
													Math.min(maxLoyaltyUnits, u + 1),
												)
											}
											disabled={loyaltyUnits >= maxLoyaltyUnits}
											sx={{
												border: "1.5px solid #E8D5B0",
												borderRadius: "50%",
												width: 28,
												height: 28,
											}}
										>
											<AddIcon sx={{ fontSize: 14 }} />
										</IconButton>
										<Typography
											sx={{
												fontSize: "0.82rem",
												color: "var(--text-muted)",
											}}
										>
											units &times; &#8358;500 ={" "}
											<strong style={{ color: "#B8860B" }}>
												{formatNaira(loyaltyDiscount)} off
											</strong>
										</Typography>
									</Box>
								</Box>
							)}

							{/* Discount summary */}
							{(referralDiscount > 0 || loyaltyDiscount > 0) && (
								<Box
									sx={{
										mt: 2,
										p: 1.5,
										borderRadius: 2,
										backgroundColor: "#F1F8E9",
										border: "1px solid #C5E1A5",
									}}
								>
									{referralDiscount > 0 && (
										<Box
											sx={{
												display: "flex",
												justifyContent: "space-between",
												mb: 0.3,
											}}
										>
											<Typography
												sx={{
													fontSize: "0.82rem",
													color: "#2e7d32",
												}}
											>
												Referral discount
											</Typography>
											<Typography
												sx={{
													fontSize: "0.82rem",
													color: "#2e7d32",
													fontWeight: 700,
												}}
											>
												-{formatNaira(referralDiscount)}
											</Typography>
										</Box>
									)}
									{loyaltyDiscount > 0 && (
										<Box
											sx={{
												display: "flex",
												justifyContent: "space-between",
												mb: 0.3,
											}}
										>
											<Typography
												sx={{
													fontSize: "0.82rem",
													color: "#B8860B",
												}}
											>
												Loyalty redemption
											</Typography>
											<Typography
												sx={{
													fontSize: "0.82rem",
													color: "#B8860B",
													fontWeight: 700,
												}}
											>
												-{formatNaira(loyaltyDiscount)}
											</Typography>
										</Box>
									)}
								</Box>
							)}
						</Box>

						{/* Gift Card Redeem Input */}
						<GiftCardRedeemInput
							appliedCard={appliedGiftCard}
							onApplied={(card) => {
								setAppliedGiftCard(card);
								try { sessionStorage.setItem('appliedGiftCard', JSON.stringify(card)); } catch {}
							}}
							onRemoved={() => {
								setAppliedGiftCard(null);
								sessionStorage.removeItem('appliedGiftCard');
							}}
						/>
					</>
				)}

				{/* Recently Viewed */}
				{recentlyViewed.length > 0 && (
					<Box sx={{ mt: 4 }}>
						<Typography
							sx={{
								fontFamily: '"Georgia", serif',
								fontWeight: 700,
								color: "var(--text-purple)",
								mb: 1.5,
								fontSize: "1.1rem",
							}}
						>
							Recently Viewed
						</Typography>
						<Box
							sx={{
								display: "flex",
								gap: 1.5,
								overflowX: "auto",
								pb: 1,
								"&::-webkit-scrollbar": { height: 4 },
								"&::-webkit-scrollbar-thumb": {
									backgroundColor: "#E8D5B0",
									borderRadius: 2,
								},
							}}
						>
							{recentlyViewed.map((item) => (
								<Box
									key={`${item.categoryId}-${item.id}`}
									onClick={() =>
										(window.location.href = `/products/${item.categoryId}/${item.id}`)
									}
									sx={{
										minWidth: 130,
										maxWidth: 130,
										borderRadius: 2,
										border: "1px solid #E8D5B0",
										overflow: "hidden",
										cursor: "pointer",
										flexShrink: 0,
										backgroundColor: "#fff",
										transition: "all 0.2s",
										"&:hover": {
											borderColor: "#e3242b",
											boxShadow: "0 2px 8px rgba(233,30,140,0.15)",
										},
									}}
								>
									{item.image ? (
										<Box
											component="img"
											src={item.image}
											alt={item.name}
											sx={{
												width: "100%",
												height: 95,
												objectFit: "cover",
												display: "block",
											}}
										/>
									) : (
										<Box
											sx={{
												width: "100%",
												height: 95,
												backgroundColor: "#FFF8F0",
												display: "flex",
												alignItems: "center",
												justifyContent: "center",
											}}
										>
											<ShoppingCartOutlinedIcon
												sx={{ fontSize: 32, color: "#E8D5B0" }}
											/>
										</Box>
									)}
									<Box sx={{ p: 1 }}>
										<Typography
											sx={{
												fontSize: "0.72rem",
												fontWeight: 600,
												color: "var(--text-main)",
												lineHeight: 1.3,
												overflow: "hidden",
												textOverflow: "ellipsis",
												display: "-webkit-box",
												WebkitLineClamp: 2,
												WebkitBoxOrient: "vertical",
											}}
										>
											{item.name}
										</Typography>
										<Typography
											sx={{
												fontSize: "0.75rem",
												color: "#e3242b",
												fontWeight: 700,
												mt: 0.3,
											}}
										>
											₦{item.price?.toLocaleString()}
										</Typography>
									</Box>
								</Box>
							))}
						</Box>
					</Box>
				)}
			</Container>

			{/* Sticky Checkout Bar */}
			{hasItems && (
				<Box
					sx={{
						position: "fixed",
						bottom: { xs: "64px", md: 0 },
						left: 0,
						right: 0,
						zIndex: 1100,
						backgroundColor: "rgba(255, 240, 245, 0.95)",
						backdropFilter: "blur(8px)",
						borderTop: "1px solid #E8D5B0",
						py: 2,
						px: 3,
					}}
				>
					<Box
						sx={{
							maxWidth: "md",
							mx: "auto",
							display: "flex",
							alignItems: "center",
							justifyContent: "space-between",
							flexWrap: "wrap",
							gap: 1,
						}}
					>
						<Box>
							{surchargeTotal > 0 ||
							giftCardDiscount > 0 ||
							referralDiscount > 0 ||
							loyaltyDiscount > 0 ? (
								<>
									<Typography
										sx={{
											fontFamily: '"Georgia", serif',
											fontSize: "0.82rem",
											color: "#777",
											textDecoration: "line-through",
										}}
									>
										{formatNaira(total - surchargeTotal)}
									</Typography>
									{surchargeTotal > 0 && (
										<Typography
											sx={{
												fontFamily: '"Georgia", serif',
												fontSize: "0.75rem",
												color: "#e3242b",
											}}
										>
											Size surcharge: {formatNaira(surchargeTotal)}
										</Typography>
									)}
									{giftCardDiscount > 0 && (
										<Typography
											sx={{
												fontFamily: '"Georgia", serif',
												fontSize: "0.75rem",
												color: "#2e7d32",
											}}
										>
											Gift card: -{formatNaira(giftCardDiscount)}
										</Typography>
									)}
									{referralDiscount > 0 && (
										<Typography
											sx={{
												fontFamily: '"Georgia", serif',
												fontSize: "0.75rem",
												color: "#2e7d32",
											}}
										>
											Referral: -{formatNaira(referralDiscount)}
										</Typography>
									)}
									{loyaltyDiscount > 0 && (
										<Typography
											sx={{
												fontFamily: '"Georgia", serif',
												fontSize: "0.75rem",
												color: "#B8860B",
											}}
										>
											Loyalty: -{formatNaira(loyaltyDiscount)}
										</Typography>
									)}
									<Typography
										sx={{
											fontFamily: '"Georgia", serif',
											fontWeight: 700,
											fontSize: "1.15rem",
											color: "var(--text-main)",
										}}
									>
										Total:{" "}
										<span style={{ color: "#e3242b" }}>
											{formatNaira(finalTotal)}
										</span>
									</Typography>
								</>
							) : (
								<Typography
									sx={{
										fontFamily: '"Georgia", serif',
										fontWeight: 700,
										fontSize: "1.15rem",
										color: "var(--text-main)",
									}}
								>
									Total:{" "}
									<span style={{ color: "#e3242b" }}>
										{formatNaira(total)}
									</span>
								</Typography>
							)}
						</Box>
						<Button
							onClick={handleCheckout}
							disabled={checkoutLoading}
							sx={{
								backgroundColor: "#e3242b",
								color: "#fff",
								borderRadius: "30px",
								px: 3,
								py: 1,
								fontFamily: '"Georgia", serif',
								fontWeight: 700,
								"&:hover": { backgroundColor: "#b81b21" },
							}}
						>
							Total:{" "}
							<span style={{ color: "#e3242b" }}>
								{formatNaira(finalTotal)}
							</span>
						</Button>
					</Box>
				</Box>
			)}

			{/* Sign In Prompt */}
			<SignInPrompt
				open={signInPromptOpen}
				onClose={() => setSignInPromptOpen(false)}
			/>
		</Box>
  );
}
