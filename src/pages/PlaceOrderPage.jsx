import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Typography,
  Container,
  Card,
  CardContent,
  Checkbox,
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
  Chip,
  Tooltip,
  IconButton,
  Switch,
  CircularProgress,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import StarIcon from '@mui/icons-material/Star';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import PhoneOutlinedIcon from '@mui/icons-material/PhoneOutlined';
import ShoppingCartOutlinedIcon from "@mui/icons-material/ShoppingCartOutlined";
import {
  pressOnNailShapes,
  pressOnQuantities,
} from '../data/products';
import useProductCategories from '../hooks/useProductCategories';
import ScrollReveal from '../components/ScrollReveal';
import NailBedSizeInput from '../components/NailBedSizeInput';
import PresetSizeGuide from '../components/PresetSizeGuide';
import { useCart } from "../context/CartContext";
import { useAuth } from '../context/AuthContext';
import { saveNailBedSizes, fetchNailBedSizes } from '../lib/orderService';
import SignInPrompt from '../components/SignInPrompt';
import { hasDiscount, getEffectivePrice, getDiscountLabel } from '../lib/discountUtils';
import { validateReferralCode, getLoyaltyData, REDEMPTION_UNIT, REDEMPTION_VALUE, getPendingLoyaltyReward } from '../lib/loyaltyService';

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

const emptyForm = { nailShape: '', quantity: '', nailBedSize: '', orderingForOthers: false, otherPeople: [] };
const readyMadeForm = { quantity: '', presetSize: '' };
const presetSizes = ['XS (Extra Small)', 'S (Small)', 'M (Medium)', 'L (Large)'];

export default function PlaceOrderPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { addPressOn: addPressOnToCart } = useCart();
  const { user } = useAuth();
  const [customerName, setCustomerName] = useState('');
  const [savedNailSizes, setSavedNailSizes] = useState('');
  const [signInPromptOpen, setSignInPromptOpen] = useState(false);
  const [showRefField, setShowRefField] = useState(false);
  const [refCodeInput, setRefCodeInput] = useState('');
  const [referralValid, setReferralValid] = useState(false);
  const [referralChecking, setReferralChecking] = useState(false);
  const [referralMsg, setReferralMsg] = useState('');
  const [loyaltyBalance, setLoyaltyBalance] = useState(0);
  const [loyaltyUnits, setLoyaltyUnits] = useState(0);
  const [pendingReward] = useState(() => getPendingLoyaltyReward());

  useEffect(() => {
    if (user?.displayName && !customerName) setCustomerName(user.displayName);
    if (user?.uid) {
      fetchNailBedSizes(user.uid).then(setSavedNailSizes).catch(() => {});
    }
  }, [user]);

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
        setReferralMsg(valid ? '\u20a6500 off applied at checkout!' : '');
      }).catch(() => {});
    }
  }, [user]);

  const handleApplyReferral = async () => {
    if (!refCodeInput.trim()) return;
    setReferralChecking(true);
    setReferralMsg('');
    try {
      const referrerUid = await validateReferralCode(refCodeInput.trim());
      if (!referrerUid) { setReferralValid(false); setReferralMsg('Invalid code.'); }
      else if (referrerUid === user?.uid) { setReferralValid(false); setReferralMsg("You can't use your own referral code."); }
      else {
        setReferralValid(true);
        setReferralMsg('\u20a6500 off will be applied at checkout!');
        sessionStorage.setItem('pendingReferralCode', refCodeInput.trim());
      }
    } catch { setReferralValid(false); setReferralMsg('Could not verify code.'); }
    setReferralChecking(false);
  };

  const maxLoyaltyUnits = Math.floor(loyaltyBalance / REDEMPTION_UNIT);

  useEffect(() => {
    const categoryId = location.state?.categoryId;
    if (categoryId) {
      const timer = setTimeout(() => {
        document.getElementById(categoryId)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [location.state]);

  const [selectedProducts, setSelectedProducts] = useState({});
  const [modalOpen, setModalOpen] = useState(false);
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  const { categories: productCategories, loading, error } = useProductCategories();

  const handleContactClick = () => {
    if (location.pathname !== '/') {
      navigate('/');
      setTimeout(() => {
        document.getElementById('contact-section')?.scrollIntoView({ behavior: 'smooth' });
      }, 300);
    } else {
      document.getElementById('contact-section')?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const allProducts = productCategories.flatMap((cat) =>
    cat.products
      .filter((p) => !p.hidden && (p.stock === undefined || p.stock > 0))
      .map((p) => ({ ...p, category: cat.title, categoryId: cat.id, readyMade: !!cat.readyMade }))
  );

  const isReadyMade = (productId) => {
    const product = allProducts.find((p) => p.id === productId);
    return product?.readyMade;
  };

  const handleToggleProduct = (productId) => {
    setSelectedProducts((prev) => {
      const updated = { ...prev };
      if (updated[productId]) {
        delete updated[productId];
      } else {
        updated[productId] = isReadyMade(productId) ? { ...readyMadeForm } : { ...emptyForm, nailBedSize: savedNailSizes };
      }
      return updated;
    });
  };

  const handleFieldChange = (productId, field) => (event) => {
    setSelectedProducts((prev) => ({
      ...prev,
      [productId]: { ...prev[productId], [field]: event.target.value },
    }));
  };

  const handleNailBedChange = (productId, val) => {
    setSelectedProducts((prev) => ({
      ...prev,
      [productId]: { ...prev[productId], nailBedSize: val },
    }));
  };

  const handleToggleOthers = (productId) => {
    setSelectedProducts((prev) => {
      const current = prev[productId];
      const toggled = !current.orderingForOthers;
      return {
        ...prev,
        [productId]: {
          ...current,
          orderingForOthers: toggled,
          otherPeople: toggled && current.otherPeople.length === 0
            ? [{ name: '', nailShape: '', nailBedSize: '' }]
            : current.otherPeople,
        },
      };
    });
  };

  const handleAddPerson = (productId) => {
    setSelectedProducts((prev) => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        otherPeople: [...prev[productId].otherPeople, { name: '', nailShape: '', nailBedSize: '' }],
      },
    }));
  };

  const handleRemovePerson = (productId, index) => {
    setSelectedProducts((prev) => {
      const updated = [...prev[productId].otherPeople];
      updated.splice(index, 1);
      return {
        ...prev,
        [productId]: {
          ...prev[productId],
          otherPeople: updated,
          orderingForOthers: updated.length > 0,
        },
      };
    });
  };

  const handleOtherPersonField = (productId, index, field, value) => {
    setSelectedProducts((prev) => {
      const updated = [...prev[productId].otherPeople];
      updated[index] = { ...updated[index], [field]: value };
      return {
        ...prev,
        [productId]: { ...prev[productId], otherPeople: updated },
      };
    });
  };

  const handleConfirmOrder = () => {
    if (!user) { setSignInPromptOpen(true); return; }
    setModalOpen(true);
  };

  const handleCompleteOrder = () => {
    // Add all selected items to the global CartContext
    Object.keys(selectedProducts).forEach((id) => {
      const product = allProducts.find((p) => p.id === id);
      if (!product) return;
      const form = selectedProducts[id];
      addPressOnToCart({
        productId: product.id,
        name: product.name,
        price: getEffectivePrice(product),
        ...(hasDiscount(product) ? { originalPrice: product.price, discountLabel: getDiscountLabel(product) } : {}),
        type: product.type || '',
        nailShape: form.nailShape || product.shape || '',
        quantity: form.quantity || 1,
        nailBedSize: form.nailBedSize || '',
        presetSize: form.presetSize || '',
        orderingForOthers: form.orderingForOthers || false,
        otherPeople: form.otherPeople || [],
        customerName: customerName.trim(),
        categoryId: product.categoryId,
        readyMade: product.readyMade,
        stock: product.stock,
      });
    });

    // Save nail bed sizes to profile for reuse
    if (user) {
      const firstCustom = Object.keys(selectedProducts).find((id) => !isReadyMade(id));
      if (firstCustom) {
        const sizes = selectedProducts[firstCustom]?.nailBedSize;
        if (sizes) saveNailBedSizes(user.uid, sizes).catch(() => {});
      }
    }

    setSelectedProducts({});
    setModalOpen(false);
    navigate('/checkout', { state: { referralCode: referralValid ? refCodeInput : null, presetLoyaltyUnits: loyaltyUnits } });
  };

  const handleAddToCart = () => {
		if (!user) { setSignInPromptOpen(true); return; }
		Object.keys(selectedProducts).forEach((id) => {
			const product = allProducts.find((p) => p.id === id);
			if (!product) return;
			const form = selectedProducts[id];
			addPressOnToCart({
				productId: product.id,
				name: product.name,
				price: getEffectivePrice(product),
				...(hasDiscount(product) ? { originalPrice: product.price, discountLabel: getDiscountLabel(product) } : {}),
				type: product.type || "",
				nailShape: form.nailShape || product.shape || "",
				quantity: form.quantity || 1,
				nailBedSize: form.nailBedSize || "",
				presetSize: form.presetSize || "",
				orderingForOthers: form.orderingForOthers || false,
				otherPeople: form.otherPeople || [],
				customerName: customerName.trim(),
				categoryId: product.categoryId,
				readyMade: product.readyMade,
				stock: product.stock,
			});
		});
		setSelectedProducts({});
  };

  const hasAllNailSizes = (sizeStr) => {
    if (!sizeStr) return false;
    const parts = sizeStr.split(',').filter((p) => p.includes(':'));
    return parts.length >= 10;
  };

  const selectedIds = Object.keys(selectedProducts);
  const isFormValid =
    customerName.trim() &&
    selectedIds.length > 0 &&
    selectedIds.every((id) => {
      const f = selectedProducts[id];
      if (isReadyMade(id)) {
        return f.quantity && f.presetSize;
      }
      const ownValid = f.nailShape && f.quantity && hasAllNailSizes(f.nailBedSize);
      if (!ownValid) return false;
      if (f.orderingForOthers && f.otherPeople?.length > 0) {
        return f.otherPeople.every((p) => hasAllNailSizes(p.nailBedSize));
      }
      return true;
    });

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
								Place Your Order
							</Typography>
							<Typography
								sx={{
									color: "#555",
									fontSize: "1.05rem",
									maxWidth: 520,
									mx: "auto",
								}}
							>
								Select one or more press-on nail sets below, customize
								each, and confirm your order. We will connect you on
								WhatsApp to finalize.
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
									Order Policy: Full payment is required to confirm your press-on order. Production begins immediately after confirmation, so refunds are not available. Please review your selections carefully before placing your order. Processing time is 4–7 business days, depending on customization and stock. We will keep you updated throughout the process.
								</Typography>
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

					{/* Loading / Error */}
					{loading && (
						<Box sx={{ textAlign: 'center', py: 10 }}>
							<CircularProgress sx={{ color: '#E91E8C' }} />
							<Typography sx={{ mt: 2, color: '#999' }}>Loading products…</Typography>
						</Box>
					)}
					{error && !loading && (
						<Box sx={{ textAlign: 'center', py: 4 }}>
							<Typography sx={{ color: '#d32f2f', fontSize: '0.9rem' }}>
								Could not load products from the server. Showing cached data.
							</Typography>
						</Box>
					)}

					{/* Product Selection */}
					{productCategories.filter(cat => cat.products.some(p => !p.hidden && (p.stock === undefined || p.stock > 0))).map((category, catIdx) => (
						<ScrollReveal
							key={category.id}
							direction="up"
							delay={catIdx * 0.1}
						>
							<Box id={category.id} sx={{ mb: 4 }}>
								<Typography
									variant="h5"
									sx={{
										fontFamily: '"Georgia", serif',
										fontWeight: 700,
										color: "#4A0E4E",
										mb: 2,
									}}
								>
									{category.title}
								</Typography>

								{category.readyMade && (
									<Box
										sx={{
											display: "flex",
											alignItems: "center",
											gap: 1,
											mb: 1.5,
											flexWrap: "wrap",
										}}
									>
										<Typography
											sx={{
												color: "#4A0E4E",
												fontSize: "0.85rem",
												fontWeight: 600,
											}}
										>
											XS, S, M & L preset sizes available
										</Typography>
										<Typography
											onClick={() => setSizeGuideOpen(true)}
											sx={{
												color: "#E91E8C",
												fontSize: "0.82rem",
												fontWeight: 600,
												cursor: "pointer",
												textDecoration: "underline",
												textUnderlineOffset: 2,
												"&:hover": { color: "#C2185B" },
											}}
										>
											What are preset sizes?
										</Typography>
										<Tooltip title="Contact us for help" arrow>
											<IconButton
												onClick={handleContactClick}
												size="small"
												sx={{
													color: "#E91E8C",
													border: "1.5px solid #E91E8C",
													width: 28,
													height: 28,
													"&:hover": {
														backgroundColor: "#E91E8C",
														color: "#fff",
													},
												}}
											>
												<PhoneOutlinedIcon sx={{ fontSize: 14 }} />
											</IconButton>
										</Tooltip>
									</Box>
								)}

								{category.products.filter(p => !p.hidden && (p.stock === undefined || p.stock > 0)).map((product) => {
									const isSelected = !!selectedProducts[product.id];
									const formData =
										selectedProducts[product.id] ||
										(category.readyMade ? readyMadeForm : emptyForm);
									const isReady = !!category.readyMade;

									return (
										<Box key={product.id} sx={{ mb: 2 }}>
											<Card
												elevation={0}
												sx={{
													borderRadius: 3,
													border: isSelected
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
													handleToggleProduct(product.id)
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
															control={
																<Checkbox
																	checked={isSelected}
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
																	<Box
																		sx={{
																			display: "flex",
																			alignItems: "center",
																			gap: 1,
																			flexWrap: "wrap",
																		}}
																	>
																		<Typography
																			sx={{
																				fontFamily:
																					'"Georgia", serif',
																				fontWeight: 600,
																				fontSize: "1rem",
																			}}
																		>
																			{product.name}
																		</Typography>
																		{product.type && (
																			<Chip
																				label={product.type}
																				size="small"
																				sx={{
																					backgroundColor:
																						"#4A0E4E",
																					color: "#fff",
																					fontSize:
																						"0.65rem",
																					fontWeight: 700,
																					height: 20,
																				}}
																			/>
																		)}
																		{hasDiscount(product) && (
																			<Chip
																				label={getDiscountLabel(product)}
																				size="small"
																				sx={{
																					backgroundColor: "#e8f5e9",
																					color: "#2e7d32",
																					fontSize: "0.65rem",
																					fontWeight: 700,
																					height: 20,
																				}}
																			/>
																		)}
																	</Box>
																	<Typography
																		sx={{
																			color: "#777",
																			fontSize: "0.85rem",
																		}}
																	>
																		{product.description}
																	</Typography>
																	{isReady &&
																		product.shape &&
																		product.length && (
																			<Typography
																				sx={{
																					color: "#999",
																					fontSize:
																						"0.78rem",
																					mt: 0.3,
																				}}
																			>
																				{product.shape} ·{" "}
																				{product.length}
																				{product.stock !==
																					undefined && (
																					<Typography
																						component="span"
																						sx={{
																							color:
																								product.stock <=
																								2
																									? "#E91E8C"
																									: "#999",
																							fontSize:
																								"0.78rem",
																							fontWeight:
																								product.stock <=
																								2
																									? 600
																									: 400,
																							fontStyle:
																								"italic",
																							ml: 1.5,
																						}}
																					>
																						{
																							product.stock
																						}{" "}
																						in stock
																					</Typography>
																				)}
																			</Typography>
																		)}
																</Box>
															}
															sx={{ flex: 1, m: 0 }}
															onClick={(e) =>
																e.stopPropagation()
															}
															onChange={() =>
																handleToggleProduct(product.id)
															}
														/>
														{hasDiscount(product) ? (
															<Box sx={{ textAlign: 'right', ml: 2 }}>
																<Typography
																	sx={{
																		fontFamily: '"Georgia", serif',
																		fontWeight: 700,
																		color: "#2e7d32",
																		fontSize: "1.05rem",
																		whiteSpace: "nowrap",
																	}}
																>
																	{formatNaira(getEffectivePrice(product))}
																</Typography>
																<Typography
																	sx={{
																		fontFamily: '"Georgia", serif',
																		color: "#999",
																		fontSize: "0.78rem",
																		textDecoration: 'line-through',
																		whiteSpace: "nowrap",
																	}}
																>
																	{formatNaira(product.price)}
																</Typography>
															</Box>
														) : (
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
																{formatNaira(product.price)}
															</Typography>
														)}
													</Box>
												</CardContent>

												{/* Customization Form */}
												<Collapse in={isSelected}>
													<Box
														sx={{ px: 3, pb: 3, pt: 1 }}
														onClick={(e) => e.stopPropagation()}
													>
														{isReady ? (
															/* Ready-made: quantity + preset size */
															<Grid container spacing={2}>
																<Grid item xs={12} sm={4}>
																	<FormControl
																		fullWidth
																		size="small"
																	>
																		<InputLabel>
																			Quantity
																		</InputLabel>
																		<Select
																			value={
																				formData.quantity
																			}
																			label="Quantity"
																			onChange={handleFieldChange(
																				product.id,
																				"quantity",
																			)}
																			sx={{
																				borderRadius: 2,
																			}}
																		>
																			{Array.from(
																				{
																					length:
																						product.stock ||
																						5,
																				},
																				(_, i) => i + 1,
																			).map((q) => (
																				<MenuItem
																					key={q}
																					value={q}
																				>
																					{q} set
																					{q > 1
																						? "s"
																						: ""}
																				</MenuItem>
																			))}
																		</Select>
																	</FormControl>
																</Grid>
																<Grid item xs={12} sm={4}>
																	<FormControl
																		fullWidth
																		size="small"
																	>
																		<InputLabel>
																			Preset Size
																		</InputLabel>
																		<Select
																			value={
																				formData.presetSize
																			}
																			label="Preset Size"
																			onChange={handleFieldChange(
																				product.id,
																				"presetSize",
																			)}
																			sx={{
																				borderRadius: 2,
																			}}
																		>
																			{presetSizes.map(
																				(size) => (
																					<MenuItem
																						key={size}
																						value={size}
																					>
																						{size}
																					</MenuItem>
																				),
																			)}
																		</Select>
																	</FormControl>
																</Grid>
																<Grid item xs={12} sm={4}>
																	<Box
																		sx={{
																			display: "flex",
																			alignItems: "center",
																			height: "100%",
																			px: 1,
																		}}
																	>
																		<Typography
																			sx={{
																				color: "#999",
																				fontSize: "0.85rem",
																				fontStyle: "italic",
																			}}
																		>
																			Pre-made set — shape,
																			length & design are as
																			shown.
																		</Typography>
																	</Box>
																</Grid>
															</Grid>
														) : (
															/* Custom: full form */
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
																			value={
																				formData.nailShape
																			}
																			label="Nail Shape"
																			onChange={handleFieldChange(
																				product.id,
																				"nailShape",
																			)}
																			sx={{
																				borderRadius: 2,
																			}}
																		>
																			{pressOnNailShapes.map(
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
																			Quantity
																		</InputLabel>
																		<Select
																			value={
																				formData.quantity
																			}
																			label="Quantity"
																			onChange={handleFieldChange(
																				product.id,
																				"quantity",
																			)}
																			sx={{
																				borderRadius: 2,
																			}}
																		>
																			{pressOnQuantities.map(
																				(q) => (
																					<MenuItem
																						key={q}
																						value={q}
																					>
																						{q} set
																						{q > 1
																							? "s"
																							: ""}
																					</MenuItem>
																				),
																			)}
																		</Select>
																	</FormControl>
																</Grid>
																<Grid item xs={12}>
																	<NailBedSizeInput
																		value={
																			formData.nailBedSize
																		}
																		onChange={(val) =>
																			handleNailBedChange(
																				product.id,
																				val,
																			)
																		}
																		required
																	/>
																</Grid>

																{/* Ordering for others toggle */}
																<Grid item xs={12}>
																	<Box
																		sx={{
																			display: "flex",
																			alignItems: "center",
																			mt: 1,
																			p: 1.5,
																			borderRadius: 2,
																			border:
																				"1px solid #F0C0D0",
																			backgroundColor:
																				formData.orderingForOthers
																					? "#FFF0F5"
																					: "#fff",
																		}}
																	>
																		<Switch
																			checked={
																				formData.orderingForOthers ||
																				false
																			}
																			onChange={() =>
																				handleToggleOthers(
																					product.id,
																				)
																			}
																			sx={{
																				"& .MuiSwitch-switchBase.Mui-checked":
																					{
																						color: "#E91E8C",
																					},
																				"& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track":
																					{
																						backgroundColor:
																							"#E91E8C",
																					},
																			}}
																		/>
																		<Typography
																			sx={{
																				fontSize: "0.88rem",
																				color: "#4A0E4E",
																				fontWeight: 600,
																			}}
																		>
																			Also ordering for
																			another person
																		</Typography>
																	</Box>

																	<Collapse
																		in={
																			formData.orderingForOthers
																		}
																	>
																		<Box sx={{ mt: 2 }}>
																			{(
																				formData.otherPeople ||
																				[]
																			).map(
																				(person, pIdx) => (
																					<Box
																						key={pIdx}
																						sx={{
																							mb: 2,
																							p: 2,
																							borderRadius: 2,
																							border:
																								"1px solid #F0C0D0",
																							backgroundColor:
																								"#FFF8FA",
																						}}
																					>
																						<Box
																							sx={{
																								display:
																									"flex",
																								alignItems:
																									"center",
																								justifyContent:
																									"space-between",
																								mb: 1.5,
																							}}
																						>
																							<Typography
																								sx={{
																									fontSize:
																										"0.85rem",
																									fontWeight: 700,
																									color: "#4A0E4E",
																									fontFamily:
																										'"Georgia", serif',
																								}}
																							>
																								Person{" "}
																								{pIdx +
																									2}
																							</Typography>
																							<IconButton
																								size="small"
																								onClick={() =>
																									handleRemovePerson(
																										product.id,
																										pIdx,
																									)
																								}
																								sx={{
																									color: "#E91E8C",
																									"&:hover":
																										{
																											backgroundColor:
																												"rgba(233,30,140,0.08)",
																										},
																								}}
																							>
																								<DeleteOutlineIcon
																									sx={{
																										fontSize: 18,
																									}}
																								/>
																							</IconButton>
																						</Box>
																						<TextField
																							fullWidth
																							size="small"
																							placeholder="Their full name"
																							value={
																								person.name
																							}
																							onChange={(
																								e,
																							) =>
																								handleOtherPersonField(
																									product.id,
																									pIdx,
																									"name",
																									e
																										.target
																										.value,
																								)
																							}
																							sx={{
																								...textFieldSx,
																								mb: 1.5,
																							}}
																						/>
																						<FormControl
																							fullWidth
																							size="small"
																							sx={{
																								mb: 1.5,
																							}}
																						>
																							<InputLabel>
																								Nail
																								Shape
																							</InputLabel>
																							<Select
																								value={
																									person.nailShape ||
																									""
																								}
																								label="Nail Shape"
																								onChange={(
																									e,
																								) =>
																									handleOtherPersonField(
																										product.id,
																										pIdx,
																										"nailShape",
																										e
																											.target
																											.value,
																									)
																								}
																								sx={{
																									borderRadius: 2,
																								}}
																							>
																								{pressOnNailShapes.map(
																									(
																										shape,
																									) => (
																										<MenuItem
																											key={
																												shape
																											}
																											value={
																												shape
																											}
																										>
																											{
																												shape
																											}
																										</MenuItem>
																									),
																								)}
																							</Select>
																						</FormControl>
																						<NailBedSizeInput
																							value={
																								person.nailBedSize
																							}
																							onChange={(
																								val,
																							) =>
																								handleOtherPersonField(
																									product.id,
																									pIdx,
																									"nailBedSize",
																									val,
																								)
																							}
																							required
																						/>
																					</Box>
																				),
																			)}
																			<Button
																				size="small"
																				startIcon={
																					<AddIcon />
																				}
																				onClick={() =>
																					handleAddPerson(
																						product.id,
																					)
																				}
																				sx={{
																					color: "#E91E8C",
																					fontSize:
																						"0.82rem",
																					fontWeight: 600,
																					textTransform:
																						"none",
																					"&:hover": {
																						backgroundColor:
																							"rgba(233,30,140,0.06)",
																					},
																				}}
																			>
																				Add another person
																			</Button>
																		</Box>
																	</Collapse>
																</Grid>
															</Grid>
														)}
													</Box>
												</Collapse>
											</Card>
										</Box>
									);
								})}
							</Box>
						</ScrollReveal>
					))}

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
									{referralValid ? '₦1,000 off applied at checkout!' : 'Have a referral code?'}
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
											Loyalty — {loyaltyBalance} pts (redeemable at checkout)
										</Typography>
									</Box>
									<Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
										<IconButton size="small" onClick={() => setLoyaltyUnits((u) => Math.max(0, u - 1))} disabled={loyaltyUnits === 0} sx={{ border: '1.5px solid #F0C0D0', borderRadius: '50%', width: 28, height: 28 }}><RemoveIcon sx={{ fontSize: 14 }} /></IconButton>
										<Typography sx={{ fontFamily: '"Georgia", serif', fontWeight: 700, minWidth: 20, textAlign: 'center' }}>{loyaltyUnits}</Typography>
										<IconButton size="small" onClick={() => setLoyaltyUnits((u) => Math.min(maxLoyaltyUnits, u + 1))} disabled={loyaltyUnits >= maxLoyaltyUnits} sx={{ border: '1.5px solid #F0C0D0', borderRadius: '50%', width: 28, height: 28 }}><AddIcon sx={{ fontSize: 14 }} /></IconButton>
										<Typography sx={{ fontSize: '0.82rem', color: '#555' }}>units × ₦1,000 = <strong style={{ color: '#B8860B' }}>-₦{(loyaltyUnits * REDEMPTION_VALUE).toLocaleString()} off</strong></Typography>
									</Box>
								</Box>
							)}

							{(referralValid || loyaltyUnits > 0) && (
								<Typography sx={{ mt: 2, fontSize: '0.8rem', color: '#888', fontStyle: 'italic' }}>
									Discounts will be applied to your total at checkout.
								</Typography>
							)}
						</Box>
					)}

					{/* spacer so content doesn't hide behind sticky button */}
					{allProducts.length > 0 && <Box sx={{ height: 80 }} />}
				</Container>
			</Box>

			{/* Sticky Confirm Button */}
			{allProducts.length > 0 && (
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
				{selectedIds.length > 0 && (
					<Typography
						sx={{
							fontSize: "0.8rem",
							color: "#E91E8C",
							fontWeight: 600,
							mb: 0.5,
						}}
					>
						{selectedIds.length} product
						{selectedIds.length > 1 ? "s" : ""} selected
					</Typography>
				)}
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
						onClick={handleConfirmOrder}
						disabled={!isFormValid}
					>
						Confirm Order
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
			)}

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
						Looking good!
					</Typography>
				</DialogTitle>
				<DialogContent>
					<Typography sx={{ color: "#555", mt: 1, lineHeight: 1.7 }}>
						Next, you'll enter your shipping details to complete your order.
						We deliver within Nigeria only.
					</Typography>
					{selectedIds.length > 0 && (
						<Box sx={{ mt: 2, textAlign: "left" }}>
							<Typography
								sx={{
									fontWeight: 600,
									color: "#4A0E4E",
									fontSize: "0.95rem",
									mb: 0.5,
								}}
							>
								Products ordered:
							</Typography>
							{selectedIds.map((id) => {
								const product = allProducts.find((p) => p.id === id);
								return (
									<Typography
										key={id}
										sx={{ color: "#555", fontSize: "0.9rem", pl: 1 }}
									>
										• {product?.name || "Product"} —{" "}
										{product ? formatNaira(getEffectivePrice(product)) : ""}
										{product && hasDiscount(product) && (
											<Typography component="span" sx={{ ml: 1, fontSize: '0.8rem', color: '#999', textDecoration: 'line-through' }}>
												{formatNaira(product.price)}
											</Typography>
										)}
									</Typography>
								);
							})}
						</Box>
					)}
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
							"&:hover": { backgroundColor: "#C2185B" },
						}}
					>
						Proceed to Checkout
					</Button>
				</DialogActions>
			</Dialog>

			{/* Preset Size Guide Modal */}
			<PresetSizeGuide
				open={sizeGuideOpen}
				onClose={() => setSizeGuideOpen(false)}
			/>

			{/* Sign In Prompt */}
			<SignInPrompt
				open={signInPromptOpen}
				onClose={() => setSignInPromptOpen(false)}
			/>
		</Box>
  );
}
