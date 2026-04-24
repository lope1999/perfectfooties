import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Typography,
  Container,
  Grid,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Divider,
  IconButton,
  Collapse,
  InputAdornment,
} from '@mui/material';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import CardGiftcardIcon from '@mui/icons-material/CardGiftcard';
import StarIcon from '@mui/icons-material/Star';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { saveOrder } from '../lib/orderService';
import { decrementStockBatch } from '../lib/stockService';
import { redeemGiftCard } from '../lib/giftCardService';
import { saveShippingDetails, fetchShippingDetails } from '../lib/shippingService';
import { validateReferralCode, applyReferral, getLoyaltyData, redeemLoyaltyPoints, REFERRAL_DISCOUNT, REDEMPTION_UNIT, REDEMPTION_VALUE, getPendingLoyaltyReward, clearPendingLoyaltyReward } from '../lib/loyaltyService';
import { nigerianStates } from '../data/nigerianStates';
import { COUNTRIES, COUNTRY_PHONE_CODES } from '../data/countries';
import SignInPrompt from '../components/SignInPrompt';

function formatNaira(amount) {
  return `\u20A6${Number(amount).toLocaleString()}`;
}

function addBusinessDays(date, days) {
  const result = new Date(date);
  let count = 0;
  while (count < days) {
    result.setDate(result.getDate() + 1);
    const d = result.getDay();
    if (d !== 0 && d !== 6) count++;
  }
  return result;
}

function formatDeliveryDate(date) {
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' });
}

const WHATSAPP_NUMBER = '2348073637911';

const textFieldSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: 2,
    '& fieldset': { borderColor: '#E8D5B0' },
    '&:hover fieldset': { borderColor: '#e3242b' },
    '&.Mui-focused fieldset': { borderColor: '#e3242b' },
  },
  '& .MuiInputLabel-root.Mui-focused': { color: '#e3242b' },
};

export default function CheckoutPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { showToast } = useNotifications();
  const { cart, clearCart, getCartTotal } = useCart();
  const { products, pressOns, leatherGoods } = cart.items;

  const appliedGiftCard = location.state?.appliedGiftCard || null;
  const subtotal = getCartTotal();
  const giftCardDiscount = appliedGiftCard ? Math.min(appliedGiftCard.balance, subtotal) : 0;

  // Referral code: pre-filled from CartPage or sessionStorage
  const [showRefField, setShowRefField] = useState(false);
  const [pendingReferralCode, setPendingReferralCode] = useState(() => location.state?.referralCode || sessionStorage.getItem('pendingReferralCode') || '');
  const [referralValid, setReferralValid] = useState(false);
  const [referralChecking, setReferralChecking] = useState(false);
  const [referralMsg, setReferralMsg] = useState('');
  const referralDiscount = referralValid ? Math.min(REFERRAL_DISCOUNT, subtotal) : 0;

  // Loyalty points redemption
  const [loyaltyBalance, setLoyaltyBalance] = useState(0);
  const [loyaltyUnits, setLoyaltyUnits] = useState(location.state?.presetLoyaltyUnits || 0);
  const [pendingReward] = useState(() => getPendingLoyaltyReward());
  const maxLoyaltyUnits = Math.floor(loyaltyBalance / REDEMPTION_UNIT);
  const loyaltyDiscount = Math.min(loyaltyUnits * REDEMPTION_VALUE, subtotal);

  const tierPerkDiscount = 0;

  const finalTotal = Math.max(0, subtotal - giftCardDiscount - referralDiscount - loyaltyDiscount - tierPerkDiscount);

  const hasDeliverables = products.length > 0 || pressOns.length > 0 || leatherGoods.length > 0;

  const [form, setForm] = useState({ country: 'Nigeria', name: '', phone: '', address: '', state: '', lga: '', city: '', province: '', postalCode: '' });
  const [submitting, setSubmitting] = useState(false);
  const [signInPromptOpen, setSignInPromptOpen] = useState(false);
  const [pendingShipping, setPendingShipping] = useState(null);

  // Fetch loyalty balance and review count for logged-in user
  useEffect(() => {
    if (!user) return;
    getLoyaltyData(user.uid).then((d) => { const pts = d.loyaltyPoints || 0; setLoyaltyBalance(pts); if (!location.state?.presetLoyaltyUnits) { const pr = getPendingLoyaltyReward(); if (pr && pr.units > 0) setLoyaltyUnits(Math.min(pr.units, Math.floor(pts / REDEMPTION_UNIT))); } }).catch(() => {});
  }, [user]);

  // Validate referral code on mount
  useEffect(() => {
    const code = location.state?.referralCode || sessionStorage.getItem('pendingReferralCode');
    if (!code || !user) return;
    setShowRefField(true);
    validateReferralCode(code).then((referrerUid) => {
      const valid = !!referrerUid && referrerUid !== user?.uid;
      setReferralValid(valid);
      setReferralMsg(valid ? '\u20a6500 off applied!' : '');
    }).catch(() => {});
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleApplyReferral = async () => {
    if (!pendingReferralCode.trim()) return;
    setReferralChecking(true);
    setReferralMsg('');
    try {
      const referrerUid = await validateReferralCode(pendingReferralCode.trim());
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
        showToast('Referral code applied! ₦500 discount added to your order.', 'success');
      }
    } catch {
      setReferralValid(false);
      setReferralMsg('Could not verify code.');
      showToast('Could not verify referral code. Please try again.', 'error');
    }
    setReferralChecking(false);
  };

  // Redirect if no deliverable items in cart
  useEffect(() => {
    if (!hasDeliverables) navigate('/cart', { replace: true });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Pre-fill name from auth, then overwrite with saved shipping details if available
  useEffect(() => {
    if (!user) return;
    setForm((prev) => ({ ...prev, name: prev.name || user.displayName || '' }));
    fetchShippingDetails(user.uid)
      .then((saved) => {
        if (saved) {
          setForm({
            country: saved.country || 'Nigeria',
            name: saved.name || user.displayName || '',
            phone: saved.phone || '',
            address: saved.address || '',
            state: saved.state || '',
            lga: saved.lga || '',
            city: saved.city || '',
            province: saved.province || '',
            postalCode: saved.postalCode || '',
          });
        }
      })
      .catch(() => {});
  }, [user]);

  const handleChange = (field) => (e) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const isDomestic = form.country === 'Nigeria';
  const isLagos = isDomestic && form.state === 'Lagos';
  const shippingCost = isDomestic ? (isLagos ? 3000 : 4000) : 0;
  const grandTotal = finalTotal + shippingCost;
  const phonePrefix = COUNTRY_PHONE_CODES[form.country] || '+';
  const isValidPhone = (p) => {
    const digits = p.replace(/[\s\-+()\u00A0]/g, '');
    if (isDomestic) return /^(0\d{10}|234\d{10})$/.test(digits);
    return digits.length >= 6;
  };

  const isFormValid = isDomestic
    ? form.name.trim() && isValidPhone(form.phone) && form.address.trim() && form.state && form.lga.trim()
    : form.name.trim() && isValidPhone(form.phone) && form.address.trim() && form.city.trim() && form.province.trim() && form.postalCode.trim();

  const handleCompleteOrder = async (paymentReference, shipping) => {
		setSubmitting(true);

		// Build WhatsApp message synchronously BEFORE any awaits — browsers block
		// window.open() when called after async operations break the user-gesture chain
		const lines = [];
		lines.push("--- SHIPPING DETAILS ---");
		lines.push(`Name: ${shipping.name}`);
		lines.push(`Phone: ${shipping.phone}`);
		lines.push(`Country: ${shipping.country}`);
		lines.push(`Address: ${shipping.address}`);
		if (shipping.shippingZone === "domestic") {
			lines.push(`State: ${shipping.state}`);
			lines.push(`LGA: ${shipping.lga}`);
		} else {
			lines.push(`City: ${shipping.city}`);
			lines.push(`State/Province: ${shipping.province}`);
			lines.push(`Postal Code: ${shipping.postalCode}`);
			lines.push(`[INTERNATIONAL ORDER — Shipping cost TBD via WhatsApp]`);
		}
		lines.push("");

		if (leatherGoods.length > 0) {
			lines.push("--- LEATHER GOODS ORDER ---");
			leatherGoods.forEach((g, i) => {
				let detail = `${i + 1}. ${g.name} x${g.quantity} \u2014 ${formatNaira(g.price * g.quantity)}`;
				if (g.originalPrice && g.originalPrice !== g.price) {
					const saved = (g.originalPrice - g.price) * g.quantity;
					detail += ` (${g.promoLabel || 'Promo'} \u2014 saved ${formatNaira(saved)})`;
				}
				if (g.selectedColor) detail += `\n   Colour: ${g.selectedColor}`;
				if (g.euSize) detail += ` | EU Size: ${g.euSize}`;
				if (g.footLength) detail += ` | Foot Length: ${g.footLength}cm`;
				if (g.collectionName)
					detail += `\n   Collection: ${g.collectionName}`;
				if (g.selectedImageIndex)
					detail += `\n   Selected Design: Image ${g.selectedImageIndex}`;
				if (g.orderNotes) detail += `\n   Notes: ${g.orderNotes}`;
				lines.push(detail);
			});
			lines.push("");
		}

		if (products.length > 0) {
			lines.push("--- NAIL CARE PRODUCTS ---");
			products.forEach((p, i) => {
				lines.push(
					`${i + 1}. ${p.name} x${p.quantity} \u2014 ${formatNaira(p.price * p.quantity)}`,
				);
			});
			lines.push("");
		}

		if (pressOns.length > 0) {
			lines.push("--- PRESS-ON ORDERS ---");
			pressOns.forEach((p, i) => {
				let detail = `${i + 1}. ${p.name} \u2014 ${formatNaira(p.price)}`;
				if (p.customerName) detail += `\n   Name: ${p.customerName}`;
				if (p.type) detail += `\n   Type: ${p.type}`;
				detail += `\n   Shape: ${p.nailShape || "N/A"}`;
				detail += `\n   Quantity: ${p.quantity} set(s)`;
				if (p.nailBedSize) detail += `\n   Nail Bed Size: ${p.nailBedSize}`;
				if (p.presetSize) detail += `\n   Preset Size: ${p.presetSize}`;
				if (p.selectedLength) detail += `\n   Length: ${p.selectedLength}`;
				if (p.setIncludes?.length > 0)
					detail += `\n   Set Includes: ${p.setIncludes.join(", ")}`;
				if (p.inspirationTags?.length > 0)
					detail += `\n   Inspiration: ${p.inspirationTags.join(", ")}`;
				if (p.nailNotes) detail += `\n   Notes: ${p.nailNotes}`;
				if (p.specialRequest)
					detail += `\n   [!] SPECIAL REQUEST — Made to Order (production: 10–14 days)`;
				if (p.orderingForOthers && p.otherPeople?.length > 0) {
					p.otherPeople.forEach((o) => {
						detail += `\n   Also for: ${o.name || "N/A"} \u2014 Shape: ${o.nailShape || "Same"} \u2014 Nail Bed: ${o.nailBedSize || "N/A"}`;
					});
				}
				lines.push(detail);
			});
			lines.push("");
		}

		let totalLine = `Estimated Total: ${formatNaira(subtotal)}`;
		if (appliedGiftCard && giftCardDiscount > 0) {
			totalLine += `\nGift Card Applied: ${appliedGiftCard.code} \u2014 Discount: ${formatNaira(giftCardDiscount)}`;
		}
		if (referralValid && referralDiscount > 0) {
			totalLine += `\nReferral Code Applied: ${pendingReferralCode} \u2014 Discount: ${formatNaira(referralDiscount)}`;
		}
		if (loyaltyUnits > 0 && loyaltyDiscount > 0) {
			totalLine += `\nLoyalty Points Applied: ${loyaltyUnits * REDEMPTION_UNIT} pts \u2014 Discount: ${formatNaira(loyaltyDiscount)}`;
		}
		if (tierPerkDiscount > 0) {
			totalLine += `\nStar Client Perk (5% off press-ons): -${formatNaira(tierPerkDiscount)}`;
		}
		if (
			giftCardDiscount > 0 ||
			referralDiscount > 0 ||
			loyaltyDiscount > 0 ||
			tierPerkDiscount > 0
		) {
			totalLine += `\nAmount Due: ${formatNaira(finalTotal)}`;
		}
		if (isDomestic && shippingCost > 0) {
			totalLine += `\nShipping (Fez Delivery${isLagos ? " — Lagos" : " — Outside Lagos"}): ${formatNaira(shippingCost)}`;
			totalLine += `\nGrand Total: ${formatNaira(grandTotal)}`;
		} else if (!isDomestic) {
			totalLine += `\nShipping: To be quoted via WhatsApp (international)`;
		}

		const message = `Hi! I\u2019d like to place an order.\n\n${lines.join("\n")}\n${totalLine}\n\nPlease confirm availability and payment details. Thank you!`;
		const waUrl = `https://api.whatsapp.com/send?phone=${WHATSAPP_NUMBER}&text=${encodeURIComponent(message)}`;
		if (!paymentReference && leatherGoods.length === 0)
			window.open(waUrl, "_blank");

		// Background async operations (save shipping, decrement stock, save order, redeem gift card)
		saveShippingDetails(user.uid, shipping).catch(() => {});

		// Decrement stock for retail products and ready-made press-ons
		try {
			const stockItems = [];
			products.forEach((p) => {
				if (p.categoryId && p.stock !== undefined) {
					stockItems.push({
						collection: "retailCategories",
						categoryId: p.categoryId,
						productId: p.productId,
						quantity: p.quantity,
					});
				}
			});
			pressOns.forEach((p) => {
				if (
					p.readyMade &&
					!p.specialRequest &&
					p.categoryId &&
					p.stock !== undefined
				) {
					stockItems.push({
						collection: "productCategories",
						categoryId: p.categoryId,
						productId: p.productId,
						quantity: Number(p.quantity) || 1,
					});
				}
			});
			if (stockItems.length > 0) await decrementStockBatch(stockItems);
		} catch (err) {
			console.error("Stock decrement failed:", err);
		}

		// Determine order type
		const hasProducts = products.length > 0;
		const hasPressOns = pressOns.length > 0;
		const hasLeatherGoods = leatherGoods.length > 0;
		const orderType =
			hasLeatherGoods && !hasProducts && !hasPressOns
				? "leather"
				: hasPressOns && !hasProducts
					? "pressOn"
					: hasProducts && !hasPressOns
						? "retail"
						: "mixed";

		// Save order to Firestore
		let orderId = null;
		try {
			const allItems = [
				...leatherGoods.map((g) => ({
					kind: "leather",
					name: g.name,
					price: g.price,
					quantity: g.quantity,
					selectedColor: g.selectedColor,
					...(g.euSize && { euSize: g.euSize }),
					...(g.footLength && { footLength: g.footLength }),
					...(g.selectedImage && { selectedImage: g.selectedImage }),
					...(g.selectedImageIndex && {
						selectedImageIndex: g.selectedImageIndex,
					}),
					...(g.orderNotes && { orderNotes: g.orderNotes }),
					collectionId: g.collectionId,
					collectionName: g.collectionName,
					surcharge:
						Number(g.euSize) >= 45 ? 2000 * Number(g.quantity || 0) : 0,
					...(g.originalPrice && g.originalPrice !== g.price && {
						originalPrice: g.originalPrice,
						promoLabel: g.promoLabel,
						promoSavings: (g.originalPrice - g.price) * g.quantity,
					}),
				})),
				...products.map((p) => ({
					kind: "retail",
					name: p.name,
					price: p.price,
					quantity: p.quantity,
				})),
				...pressOns.map((p) => ({
					kind: "pressOn",
					name: p.name,
					price: p.price,
					quantity: p.quantity || 1,
					...(p.nailShape && { nailShape: p.nailShape }),
					...(p.nailBedSize && { nailBedSize: p.nailBedSize }),
					...(p.presetSize && { presetSize: p.presetSize }),
					...(p.selectedLength && { selectedLength: p.selectedLength }),
					...(p.setIncludes?.length > 0 && { setIncludes: p.setIncludes }),
					...(p.inspirationTags?.length > 0 && {
						inspirationTags: p.inspirationTags,
					}),
					...(p.nailNotes && { nailNotes: p.nailNotes }),
					...(p.specialRequest && { specialRequest: true }),
					...(p.orderingForOthers &&
						p.otherPeople?.length > 0 && { otherPeople: p.otherPeople }),
				})),
			];
			const orderData = {
				type: orderType,
				status: "pending",
				total: grandTotal,
				subtotal: finalTotal,
				shippingCost,
				customerName: shipping.name,
				email: user.email || "",
				items: allItems,
				shipping,
				shippingZone: shipping.shippingZone || "domestic",
			};
			if (paymentReference) {
				orderData.paymentReference = paymentReference;
			}
			if (appliedGiftCard) {
				orderData.giftCardCode = appliedGiftCard.code;
				orderData.giftCardDiscount = giftCardDiscount;
			}
			if (referralValid && referralDiscount > 0) {
				orderData.referralCode = pendingReferralCode;
				orderData.referralDiscount = referralDiscount;
			}
			if (loyaltyUnits > 0) {
				orderData.loyaltyPointsUsed = loyaltyUnits * REDEMPTION_UNIT;
				orderData.loyaltyDiscount = loyaltyDiscount;
			}
			const docRef = await saveOrder(user.uid, orderData);
			orderId = docRef?.id || null;
		} catch (err) {
			console.error("Order save failed:", err);
			showToast("Order failed to save. Please contact support.", "error");
		}

		// Deduct redeemed loyalty points
		if (loyaltyUnits > 0) {
			redeemLoyaltyPoints(user.uid, loyaltyUnits * REDEMPTION_UNIT).catch(
				() => {},
			);
			clearPendingLoyaltyReward();
		}

		// Redeem gift card if applied
		if (appliedGiftCard && giftCardDiscount > 0) {
			try {
				await redeemGiftCard(
					appliedGiftCard.code,
					giftCardDiscount,
					orderId,
				);
				sessionStorage.removeItem('appliedGiftCard');
			} catch (err) {
				console.error("Gift card redemption failed:", err);
			}
		}

		// Apply referral: award referrer points and track usage
		if (referralValid && pendingReferralCode) {
			applyReferral(pendingReferralCode, user.uid).catch(() => {});
			sessionStorage.removeItem("pendingReferralCode");
		}

		setSubmitting(false);
		showToast(
			"Order placed successfully! Check your email for confirmation.",
			"success",
		);
		clearCart();
		navigate("/thank-you", {
			state: {
				type: orderType,
				customerName: shipping.name,
				email: user?.email || "",
				shipping,
				orderId,
				whatsappUrl: waUrl,
				paymentReference: paymentReference || null,
				items: [
					...leatherGoods.map((g) => ({
						kind: "leather",
						name: g.name,
						price: g.price * g.quantity,
						quantity: g.quantity,
						selectedColor: g.selectedColor,
						euSize: g.euSize,
						footLength: g.footLength,
						selectedImage: g.selectedImage,
						selectedImageIndex: g.selectedImageIndex,
						orderNotes: g.orderNotes,
						collectionId: g.collectionId,
						surcharge:
							Number(g.euSize) >= 45
								? 2000 * Number(g.quantity || 0)
								: 0,
					})),
					...products.map((p) => ({
						kind: "retail",
						name: p.name,
						price: p.price * (p.quantity || 1),
						quantity: p.quantity,
					})),
					...pressOns.map((p) => ({
						kind: "press-on",
						name: p.name,
						price: p.price * (p.quantity || 1),
						nailShape: p.nailShape,
						quantity: p.quantity || 1,
						selectedLength: p.selectedLength,
						setIncludes: p.setIncludes,
						inspirationTags: p.inspirationTags,
						nailNotes: p.nailNotes,
						specialRequest: p.specialRequest || false,
					})),
				],
				total:
					leatherGoods.reduce(
						(s, g) =>
							s +
							g.price * g.quantity +
							(Number(g.euSize) >= 45
								? 2000 * Number(g.quantity || 0)
								: 0),
						0,
					) +
					products.reduce((s, i) => s + i.price * (i.quantity || 1), 0) +
					pressOns.reduce((s, i) => s + i.price * (i.quantity || 1), 0),
				finalTotal: grandTotal,
				giftCardDiscount,
				referralDiscount,
				loyaltyDiscount,
				shippingCost,
			},
		});
  };

  const payWithPaystackFull = (shipping) => {
    const pk = import.meta.env?.VITE_PAYSTACK_PUBLIC_KEY || '';
    if (!pk || !window.PaystackPop) {
      alert('Payment unavailable. Please refresh and try again.');
      return;
    }
    window.PaystackPop.setup({
      key: pk,
      email: user?.email || 'customer@perfectfooties.com',
      amount: grandTotal * 100,
      currency: 'NGN',
      ref: `PF-${Date.now()}`,
      metadata: { itemCount: leatherGoods.length },
      callback: (response) => handleCompleteOrder(response.reference, shipping),
      onClose: () => {},
    }).openIframe();
  };

  const handleSubmit = async () => {
    if (!user) { setSignInPromptOpen(true); return; }
    if (!isFormValid) return;

    const shipping = isDomestic
      ? { country: 'Nigeria', name: form.name.trim(), phone: form.phone.trim(), address: form.address.trim(), state: form.state, lga: form.lga.trim(), shippingZone: 'domestic' }
      : { country: form.country, name: form.name.trim(), phone: form.phone.trim(), address: form.address.trim(), city: form.city.trim(), province: form.province.trim(), postalCode: form.postalCode.trim(), shippingZone: 'international' };

    if (leatherGoods.length > 0) {
      setPendingShipping(shipping);
      payWithPaystackFull(shipping);
    } else {
      handleCompleteOrder('', shipping);
    }
  };


  if (!hasDeliverables) return null;

  return (
		<Box
			sx={{
				pt: { xs: 10, md: 12 },
				pb: { xs: 16, md: 10 },
				minHeight: "100vh",
				backgroundColor: "#FFF8F0",
			}}
		>
			<Container maxWidth="lg">
				{/* Header */}
				<Typography
					variant="h3"
					sx={{
						fontFamily: '"Georgia", serif',
						fontWeight: 700,
						color: "var(--text-main)",
						mb: 5,
						textAlign: "center",
						fontSize: { xs: "1.8rem", sm: "2.4rem", md: "3rem" },
					}}
				>
					Checkout
				</Typography>

				<Grid container spacing={4} alignItems="flex-start">
					{/* ── Shipping Form ── */}
					<Grid item xs={12} md={7}>
						<Typography
							sx={{
								fontFamily: '"Georgia", serif',
								fontWeight: 700,
								color: "var(--text-purple)",
								mb: 2.5,
								fontSize: "1.15rem",
							}}
						>
							Shipping Details
						</Typography>

						{/* Country */}
						<FormControl fullWidth size="small" sx={{ mb: 2 }}>
							<InputLabel sx={{ "&.Mui-focused": { color: "#e3242b" } }}>
								Country *
							</InputLabel>
							<Select
								value={form.country}
								onChange={(e) =>
									setForm((prev) => ({
										...prev,
										country: e.target.value,
										state: "",
										lga: "",
										city: "",
										province: "",
										postalCode: "",
									}))
								}
								label="Country *"
								sx={{
									borderRadius: 2,
									"& .MuiOutlinedInput-notchedOutline": {
										borderColor: "#E8D5B0",
									},
									"&:hover .MuiOutlinedInput-notchedOutline": {
										borderColor: "#e3242b",
									},
									"&.Mui-focused .MuiOutlinedInput-notchedOutline": {
										borderColor: "#e3242b",
									},
								}}
							>
								{COUNTRIES.map((c) => (
									<MenuItem key={c} value={c}>
										{c}
									</MenuItem>
								))}
							</Select>
						</FormControl>

						{/* Fez Delivery card */}
						{isDomestic && (
							<Box
								sx={{
									mb: 2,
									p: 2,
									borderRadius: 2,
									background: "linear-gradient(135deg,#fff8f0,#fff)",
									border: "1px solid #E8D5B0",
									display: "flex",
									alignItems: "flex-start",
									gap: 1.5,
								}}
							>
								<LocalShippingOutlinedIcon
									sx={{
										color: "#e3242b",
										fontSize: 20,
										flexShrink: 0,
										mt: 0.2,
									}}
								/>
								<Box>
									<Typography
										sx={{
											fontWeight: 700,
											fontSize: "0.88rem",
											color: "var(--text-main)",
											mb: 0.3,
										}}
									>
										Shipped via{" "}
										<a
											href="https://fezdelivery.co"
											target="_blank"
											rel="noopener noreferrer"
											style={{
												color: "#e3242b",
												textDecoration: "none",
											}}
										>
											Fez Delivery
										</a>
									</Typography>
									<Typography
										sx={{
											fontSize: "0.8rem",
											color: "var(--text-muted)",
											lineHeight: 1.5,
										}}
									>
										{isLagos
											? "Lagos delivery — ₦3,000"
											: "Outside Lagos delivery — ₦4,000"}
									</Typography>
								</Box>
							</Box>
						)}

						{/* International shipping notice */}
						{!isDomestic && (
							<Box
								sx={{
									mb: 2,
									p: 2,
									backgroundColor: "rgba(0,255,255,0.06)",
									borderRadius: 2,
									border: "1px solid rgba(0,255,255,0.25)",
									display: "flex",
									alignItems: "flex-start",
									gap: 1.5,
								}}
							>
								<LocalShippingOutlinedIcon
									sx={{
										color: "var(--accent-cyan)",
										fontSize: 20,
										flexShrink: 0,
										mt: 0.2,
									}}
								/>
								<Box>
									<Typography
										sx={{
											color: "var(--text-muted)",
											fontSize: "0.88rem",
											lineHeight: 1.6,
										}}
									>
										<strong style={{ color: "var(--text-main)" }}>
											International order
										</strong>{" "}
										— shipping cost will be quoted and confirmed via
										WhatsApp before production begins.
									</Typography>
									<Typography
										sx={{
											fontSize: "0.78rem",
											color: "var(--text-muted)",
											mt: 0.5,
											lineHeight: 1.6,
										}}
									>
										<strong style={{ color: "var(--text-main)" }}>
											Ghana & Zone 2:
										</strong>{" "}
										~₦22,500 (0.5kg–2kg, 2–3 business days)
										<br />
										<strong style={{ color: "var(--text-main)" }}>
											South Africa, Kenya, Rwanda & Zone 5:
										</strong>{" "}
										from ₦66,000 (express)
										<br />
										Other rates: UK ₦8,500/kg · US ₦15,000/kg · Canada
										₦13,500/kg · Europe ₦12,500/kg ·
										Sweden/France/Italy/Netherlands ₦77,000 flat
										(≤2kg)
									</Typography>
								</Box>
							</Box>
						)}

						<TextField
							fullWidth
							label="Full Name *"
							value={form.name}
							onChange={handleChange("name")}
							size="small"
							sx={{ mb: 2, ...textFieldSx }}
						/>

						<TextField
							fullWidth
							label="Phone Number *"
							value={form.phone}
							onChange={handleChange("phone")}
							size="small"
							placeholder={isDomestic ? "08012345678" : "700 000 0000"}
							error={form.phone.length > 0 && !isValidPhone(form.phone)}
							helperText={
								form.phone.length > 0 && !isValidPhone(form.phone)
									? "Enter a valid phone number"
									: ""
							}
							InputProps={{
								startAdornment: (
									<InputAdornment position="start">
										<Typography
											sx={{
												fontSize: "0.85rem",
												color: "var(--text-muted)",
												fontWeight: 600,
												mr: 0.5,
											}}
										>
											{phonePrefix}
										</Typography>
									</InputAdornment>
								),
							}}
							sx={{ mb: 2, ...textFieldSx }}
						/>

						<TextField
							fullWidth
							label="Street Address *"
							value={form.address}
							onChange={handleChange("address")}
							multiline
							rows={2}
							placeholder={
								isDomestic
									? "House number, street, nearest landmark"
									: "House number and street name"
							}
							sx={{ mb: 2, ...textFieldSx }}
						/>

						{isDomestic ? (
							<>
								<FormControl fullWidth size="small" sx={{ mb: 2 }}>
									<InputLabel
										sx={{ "&.Mui-focused": { color: "#e3242b" } }}
									>
										State *
									</InputLabel>
									<Select
										value={form.state}
										onChange={handleChange("state")}
										label="State *"
										sx={{
											borderRadius: 2,
											"& .MuiOutlinedInput-notchedOutline": {
												borderColor: "#E8D5B0",
											},
											"&:hover .MuiOutlinedInput-notchedOutline": {
												borderColor: "#e3242b",
											},
											"&.Mui-focused .MuiOutlinedInput-notchedOutline":
												{ borderColor: "#e3242b" },
										}}
									>
										{nigerianStates.map((s) => (
											<MenuItem key={s} value={s}>
												{s}
											</MenuItem>
										))}
									</Select>
								</FormControl>
								<TextField
									fullWidth
									label="LGA (Local Government Area) *"
									value={form.lga}
									onChange={handleChange("lga")}
									size="small"
									sx={{ mb: 2, ...textFieldSx }}
								/>
							</>
						) : (
							<>
								<TextField
									fullWidth
									label="City *"
									value={form.city}
									onChange={handleChange("city")}
									size="small"
									sx={{ mb: 2, ...textFieldSx }}
								/>
								<TextField
									fullWidth
									label="State / Province *"
									value={form.province}
									onChange={handleChange("province")}
									size="small"
									sx={{ mb: 2, ...textFieldSx }}
								/>
								<TextField
									fullWidth
									label="Postal / ZIP Code *"
									value={form.postalCode}
									onChange={handleChange("postalCode")}
									size="small"
									sx={{ mb: 2, ...textFieldSx }}
								/>
							</>
						)}
					</Grid>

					{/* ── Order Summary ── */}
					<Grid item xs={12} md={5}>
						<Box
							sx={{
								backgroundColor: "#fff",
								borderRadius: 3,
								border: "1px solid #E8D5B0",
								p: 3,
								position: { md: "sticky" },
								top: { md: 90 },
							}}
						>
							<Typography
								sx={{
									fontFamily: '"Georgia", serif',
									fontWeight: 700,
									color: "var(--text-purple)",
									fontSize: "1.1rem",
									mb: 2,
								}}
							>
								Order Summary
							</Typography>

							{leatherGoods.length > 0 && (
								<Box sx={{ mb: 2 }}>
									<Typography
										sx={{
											color: "#aaa",
											fontSize: "0.72rem",
											fontWeight: 700,
											textTransform: "uppercase",
											letterSpacing: 0.8,
											mb: 1,
										}}
									>
										Leather Goods
									</Typography>
									{leatherGoods.map((g) => (
										<Box key={g.cartId} sx={{ mb: 0.8 }}>
											<Box
												sx={{
													display: "flex",
													justifyContent: "space-between",
												}}
											>
												<Typography
													sx={{
														fontSize: "0.88rem",
														color: "var(--text-muted)",
														flex: 1,
														mr: 1,
													}}
												>
													{g.name} &times;{g.quantity}
												</Typography>
												<Typography
													sx={{
														fontSize: "0.88rem",
														fontWeight: 600,
														color: "#e3242b",
														whiteSpace: "nowrap",
													}}
												>
													{formatNaira(g.price * g.quantity)}
												</Typography>
											</Box>
											{(() => {
												const eu = Number(g.euSize);
												const surcharge =
													eu && eu >= 45
														? 2000 * Number(g.quantity || 0)
														: 0;
												return (
													<Typography
														sx={{
															fontSize: "0.75rem",
															color: "#aaa",
														}}
													>
														{g.selectedColor}
														{g.footLength
															? ` · ${g.footLength}cm`
															: ""}
														{surcharge > 0
															? ` · Size surcharge: ${formatNaira(surcharge)}`
															: ""}
													</Typography>
												);
											})()}
										</Box>
									))}
								</Box>
							)}

							<Divider sx={{ borderColor: "#E8D5B0", my: 2 }} />

							{/* Referral code input */}
							<Box sx={{ mb: 1.5 }}>
								<Box
									onClick={() => setShowRefField((v) => !v)}
									sx={{
										display: "flex",
										alignItems: "center",
										gap: 1,
										cursor: "pointer",
										mb: showRefField ? 1 : 0,
									}}
								>
									<LocalOfferIcon
										sx={{
											fontSize: 15,
											color: referralValid ? "#2e7d32" : "#e3242b",
										}}
									/>
									<Typography
										sx={{
											fontSize: "0.82rem",
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
									<Box sx={{ display: "flex", gap: 1, mt: 0.5 }}>
										<TextField
											size="small"
											placeholder="e.g. FOOTIES-ABC123"
											value={pendingReferralCode}
											onChange={(e) => {
												setPendingReferralCode(
													e.target.value.toUpperCase(),
												);
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
													fontSize: "0.82rem",
												},
											}}
										/>
										<Button
											onClick={handleApplyReferral}
											disabled={
												!pendingReferralCode.trim() ||
												referralChecking
											}
											sx={{
												backgroundColor: "#e3242b",
												color: "#fff",
												borderRadius: 2,
												px: 2,
												fontFamily: '"Georgia", serif',
												fontWeight: 600,
												fontSize: "0.78rem",
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
													size={14}
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
												fontSize: "0.75rem",
												color: referralValid
													? "#2e7d32"
													: "#d32f2f",
												mt: 0.3,
											}}
										>
											{referralMsg}
										</Typography>
									)}
								</Collapse>
							</Box>

							<Box
								sx={{
									display: "flex",
									justifyContent: "space-between",
									mb: 0.5,
								}}
							>
								<Typography
									sx={{
										color: "var(--text-muted)",
										fontSize: "0.9rem",
									}}
								>
									Subtotal
								</Typography>
								<Typography
									sx={{ fontWeight: 600, fontSize: "0.9rem" }}
								>
									{formatNaira(subtotal)}
								</Typography>
							</Box>

							{giftCardDiscount > 0 && (
								<Box
									sx={{
										display: "flex",
										justifyContent: "space-between",
										mb: 0.5,
									}}
								>
									<Typography
										sx={{ color: "#2e7d32", fontSize: "0.9rem" }}
									>
										Gift card ({appliedGiftCard.code})
									</Typography>
									<Typography
										sx={{
											color: "#2e7d32",
											fontWeight: 600,
											fontSize: "0.9rem",
										}}
									>
										-{formatNaira(giftCardDiscount)}
									</Typography>
								</Box>
							)}

							{referralDiscount > 0 && (
								<Box
									sx={{
										display: "flex",
										justifyContent: "space-between",
										mb: 0.5,
									}}
								>
									<Typography
										sx={{ color: "#2e7d32", fontSize: "0.9rem" }}
									>
										Referral ({pendingReferralCode})
									</Typography>
									<Typography
										sx={{
											color: "#2e7d32",
											fontWeight: 600,
											fontSize: "0.9rem",
										}}
									>
										-{formatNaira(referralDiscount)}
									</Typography>
								</Box>
							)}

							{/* Loyalty Points */}
							{maxLoyaltyUnits > 0 && (
								<Box
									sx={{
										my: 1.5,
										p: 1.5,
										borderRadius: 2,
										backgroundColor: "#FFF8E1",
										border: "1px solid #FFD54F",
									}}
								>
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
											justifyContent: "space-between",
											alignItems: "center",
											mb: 1,
										}}
									>
										<Typography
											sx={{
												fontSize: "0.82rem",
												fontWeight: 700,
												color: "#B8860B",
												display: "flex",
												alignItems: "center",
												gap: 0.5,
											}}
										>
											<EmojiEventsIcon sx={{ fontSize: "1rem" }} />{" "}
											Loyalty Points
										</Typography>
										<Typography
											sx={{ fontSize: "0.72rem", color: "#888" }}
										>
											{loyaltyBalance} pts available
										</Typography>
									</Box>
									<Box
										sx={{
											display: "flex",
											alignItems: "center",
											gap: 1,
										}}
									>
										<IconButton
											size="small"
											onClick={() =>
												setLoyaltyUnits((u) => Math.max(0, u - 1))
											}
											disabled={loyaltyUnits === 0}
											sx={{
												border: "1px solid #FFD54F",
												color: "#B8860B",
												p: 0.3,
											}}
										>
											<RemoveIcon sx={{ fontSize: 16 }} />
										</IconButton>
										<Typography
											sx={{
												flex: 1,
												textAlign: "center",
												fontSize: "0.8rem",
												fontWeight: 600,
												color:
													loyaltyUnits > 0 ? "#B8860B" : "#aaa",
											}}
										>
											{loyaltyUnits === 0
												? "Not applied"
												: `${loyaltyUnits * REDEMPTION_UNIT} pts → -${formatNaira(loyaltyDiscount)}`}
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
												border: "1px solid #FFD54F",
												color: "#B8860B",
												p: 0.3,
											}}
										>
											<AddIcon sx={{ fontSize: 16 }} />
										</IconButton>
									</Box>
								</Box>
							)}
							{loyaltyDiscount > 0 && (
								<Box
									sx={{
										display: "flex",
										justifyContent: "space-between",
										mb: 0.5,
									}}
								>
									<Typography
										sx={{ color: "#B8860B", fontSize: "0.9rem" }}
									>
										Loyalty ({loyaltyUnits * REDEMPTION_UNIT} pts)
									</Typography>
									<Typography
										sx={{
											color: "#B8860B",
											fontWeight: 600,
											fontSize: "0.9rem",
										}}
									>
										-{formatNaira(loyaltyDiscount)}
									</Typography>
								</Box>
							)}

							{tierPerkDiscount > 0 && (
								<Box
									sx={{
										display: "flex",
										justifyContent: "space-between",
										mb: 0.5,
										p: 1,
										borderRadius: 2,
										backgroundColor: "#FFFDE7",
										border: "1px solid #FFD54F",
									}}
								>
									<Typography
										sx={{
											color: "#B8860B",
											fontSize: "0.82rem",
											fontWeight: 600,
											display: "flex",
											alignItems: "center",
											gap: 0.5,
										}}
									>
										<StarIcon sx={{ fontSize: "0.95rem" }} /> Star
										Client — 5% off
									</Typography>
									<Typography
										sx={{
											color: "#B8860B",
											fontWeight: 700,
											fontSize: "0.82rem",
										}}
									>
										-{formatNaira(tierPerkDiscount)}
									</Typography>
								</Box>
							)}

							{isDomestic && (
								<Box
									sx={{
										display: "flex",
										justifyContent: "space-between",
										mb: 0.5,
									}}
								>
									<Typography
										sx={{
											color: "var(--text-muted)",
											fontSize: "0.9rem",
											display: "flex",
											alignItems: "center",
											gap: 0.5,
										}}
									>
										<LocalShippingOutlinedIcon
											sx={{ fontSize: 14 }}
										/>{" "}
										Shipping (Fez)
									</Typography>
									<Typography
										sx={{ fontWeight: 600, fontSize: "0.9rem" }}
									>
										{formatNaira(shippingCost)}
									</Typography>
								</Box>
							)}
							{!isDomestic && (
								<Box
									sx={{
										display: "flex",
										justifyContent: "space-between",
										mb: 0.5,
									}}
								>
									<Typography
										sx={{
											color: "var(--text-muted)",
											fontSize: "0.9rem",
										}}
									>
										Shipping (intl.)
									</Typography>
									<Typography
										sx={{
											fontWeight: 600,
											fontSize: "0.85rem",
											color: "var(--accent-cyan)",
										}}
									>
										TBD
									</Typography>
								</Box>
							)}

							<Box
								sx={{
									display: "flex",
									justifyContent: "space-between",
									mt: 1.5,
								}}
							>
								<Typography
									sx={{
										fontFamily: '"Georgia", serif',
										fontWeight: 700,
										fontSize: "1.05rem",
									}}
								>
									Total
								</Typography>
								<Typography
									sx={{
										fontFamily: '"Georgia", serif',
										fontWeight: 700,
										fontSize: "1.05rem",
										color: "#e3242b",
									}}
								>
									{formatNaira(grandTotal)}
								</Typography>
							</Box>

							{/* Estimated delivery (leather goods only) */}
							{leatherGoods.length > 0 &&
								(() => {
									const earliest = addBusinessDays(new Date(), 10);
									const latest = addBusinessDays(new Date(), 14);
									return (
										<Box
											sx={{
												mt: 2,
												p: 1.5,
												borderRadius: 2,
												backgroundColor: "rgba(0,255,255,0.06)",
												border: "1px solid rgba(0,255,255,0.2)",
												display: "flex",
												alignItems: "flex-start",
												gap: 1,
											}}
										>
											<LocalShippingOutlinedIcon
												sx={{
													fontSize: 16,
													color: "#007a7a",
													flexShrink: 0,
													mt: 0.2,
												}}
											/>
											<Box>
												<Typography
													sx={{
														fontSize: "0.78rem",
														fontWeight: 700,
														color: "var(--text-main)",
													}}
												>
													Estimated Dispatch
												</Typography>
												<Typography
													sx={{
														fontSize: "0.75rem",
														color: "var(--text-muted)",
														lineHeight: 1.6,
													}}
												>
													Production: 10–14 days + shipping: 2–5
													days (local) after confirmation.
													<br />
													{isDomestic ? (
														<>
															Delivered via{" "}
															<strong>Fez Delivery</strong>{" "}
															approx.{" "}
															<strong>
																{formatDeliveryDate(earliest)} –{" "}
																{formatDeliveryDate(latest)}
															</strong>
															.
														</>
													) : (
														<strong style={{ color: "#e3242b" }}>
															International shipping cost will be
															confirmed via WhatsApp.
														</strong>
													)}
												</Typography>
											</Box>
										</Box>
									);
								})()}
						</Box>
					</Grid>
				</Grid>

				{/* Submit */}
				<Box sx={{ mt: 4, display: "flex", justifyContent: "center" }}>
					<Button
						onClick={handleSubmit}
						disabled={!isFormValid || submitting}
						sx={{
							backgroundColor: "#e3242b",
							color: "#fff",
							borderRadius: "30px",
							px: 6,
							py: 1.5,
							fontFamily: '"Georgia", serif',
							fontWeight: 600,
							fontSize: "1rem",
							"&:hover": { backgroundColor: "#b81b21" },
							"&.Mui-disabled": {
								backgroundColor: "#E8D5B0",
								color: "#fff",
							},
						}}
					>
						{submitting ? (
							<CircularProgress size={22} sx={{ color: "#fff" }} />
						) : leatherGoods.length > 0 ? (
							"Pay & Confirm Order"
						) : (
							"Place Order via WhatsApp"
						)}
					</Button>
				</Box>
			</Container>

			<SignInPrompt
				open={signInPromptOpen}
				onClose={() => setSignInPromptOpen(false)}
			/>
		</Box>
  );
}
