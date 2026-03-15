import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Container,
  Button,
  Chip,
  MenuItem,
  TextField,
  IconButton,
  Collapse,
  CircularProgress,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import StarIcon from '@mui/icons-material/Star';
import { pressOnQuantities } from '../data/products';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { saveNailBedSizes, fetchNailBedSizes } from '../lib/orderService';
import {
  validateReferralCode,
  getLoyaltyData,
  REDEMPTION_UNIT,
  REDEMPTION_VALUE,
  getPendingLoyaltyReward,
} from '../lib/loyaltyService';
import { hasDiscount, getEffectivePrice, getDiscountLabel } from '../lib/discountUtils';
import NailBedSizeInput from '../components/NailBedSizeInput';
import NailShapeSelector from '../components/NailShapeSelector';
import SignInPrompt from '../components/SignInPrompt';
import useProductCategories from '../hooks/useProductCategories';

const presetSizes = ['XS', 'S', 'M', 'L'];

function formatNaira(amount) {
  return `₦${Number(amount).toLocaleString()}`;
}

export default function PressOnDetailPage() {
  const { categoryId, productId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addPressOn } = useCart();
  const { categories, loading } = useProductCategories();

  // Find category and product
  const category = categories.find((c) => c.id === categoryId) || null;
  const product = category?.products?.find((p) => p.id === productId) || null;

  const isReadyMade = !!category?.readyMade;
  const maxQty = isReadyMade ? (product?.stock || 1) : 5;

  // Form state
  const [customerName, setCustomerName] = useState('');
  const [presetSize, setPresetSize] = useState('');
  const [nailShape, setNailShape] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [nailBedSize, setNailBedSize] = useState('');
  const [error, setError] = useState('');
  const [signInPromptOpen, setSignInPromptOpen] = useState(false);

  // Referral / loyalty
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
      fetchNailBedSizes(user.uid)
        .then((saved) => { if (saved && !nailBedSize) setNailBedSize(saved); })
        .catch(() => {});
      getLoyaltyData(user.uid)
        .then((d) => {
          const pts = d.loyaltyPoints || 0;
          setLoyaltyBalance(pts);
          const pr = getPendingLoyaltyReward();
          if (pr && pr.units > 0) setLoyaltyUnits(Math.min(pr.units, Math.floor(pts / REDEMPTION_UNIT)));
        })
        .catch(() => {});
      const pending = sessionStorage.getItem('pendingReferralCode');
      if (pending) {
        setRefCodeInput(pending);
        setShowRefField(true);
        validateReferralCode(pending).then((referrerUid) => {
          const valid = !!referrerUid && referrerUid !== user.uid;
          setReferralValid(valid);
          setReferralMsg(valid ? '₦500 off applied at checkout!' : '');
        }).catch(() => {});
      }
    }
  }, [user]);

  const maxLoyaltyUnits = Math.floor(loyaltyBalance / REDEMPTION_UNIT);

  const handleApplyReferral = async () => {
    if (!refCodeInput.trim()) return;
    setReferralChecking(true);
    setReferralMsg('');
    try {
      const referrerUid = await validateReferralCode(refCodeInput.trim());
      if (!referrerUid) {
        setReferralValid(false);
        setReferralMsg('Invalid code.');
      } else if (referrerUid === user?.uid) {
        setReferralValid(false);
        setReferralMsg("You can't use your own referral code.");
      } else {
        setReferralValid(true);
        setReferralMsg('₦500 off will be applied at checkout!');
        sessionStorage.setItem('pendingReferralCode', refCodeInput.trim());
      }
    } catch {
      setReferralValid(false);
      setReferralMsg('Could not verify code.');
    }
    setReferralChecking(false);
  };

  const hasAllNailSizes = (sizeStr) => {
    if (!sizeStr) return false;
    const parts = sizeStr.split(',').filter((p) => p.includes(':'));
    return parts.length >= 10;
  };

  const isFormValid =
    customerName.trim() &&
    (isReadyMade ? presetSize : nailShape && hasAllNailSizes(nailBedSize));

  const validate = () => {
    if (!customerName.trim()) { setError('Please enter your name.'); return false; }
    if (isReadyMade && !presetSize) { setError('Please select a preset size.'); return false; }
    if (!isReadyMade && !nailShape) { setError('Please select a nail shape.'); return false; }
    if (!isReadyMade && !hasAllNailSizes(nailBedSize)) { setError('Please enter all 10 nail bed sizes.'); return false; }
    return true;
  };

  const buildCartItem = () => ({
    productId: product.id,
    name: product.name,
    price: getEffectivePrice(product),
    originalPrice: hasDiscount(product) ? product.price : undefined,
    discountLabel: hasDiscount(product) ? getDiscountLabel(product) : undefined,
    type: product.type || '',
    nailShape: nailShape || product.shape || '',
    quantity,
    nailBedSize: nailBedSize || '',
    presetSize: presetSize || '',
    orderingForOthers: false,
    otherPeople: [],
    customerName: customerName.trim(),
    categoryId: category.id,
    readyMade: isReadyMade,
    stock: product.stock,
  });

  const handleAddToCart = () => {
    if (!user) { setSignInPromptOpen(true); return; }
    if (!validate()) return;
    addPressOn(buildCartItem());
    navigate('/products');
  };

  const handleCheckout = () => {
    if (!user) { setSignInPromptOpen(true); return; }
    if (!validate()) return;
    addPressOn(buildCartItem());
    if (!isReadyMade && nailBedSize) {
      saveNailBedSizes(user.uid, nailBedSize).catch(() => {});
    }
    navigate('/checkout', {
      state: {
        referralCode: referralValid ? refCodeInput : null,
        presetLoyaltyUnits: loyaltyUnits,
      },
    });
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', pt: 12 }}>
        <CircularProgress sx={{ color: '#E91E8C' }} />
      </Box>
    );
  }

  if (!product || !category) {
    return (
      <Box sx={{ pt: 12, textAlign: 'center', py: 10 }}>
        <Typography sx={{ color: '#555', fontSize: '1.1rem' }}>Product not found.</Typography>
        <Button onClick={() => navigate('/products')} sx={{ mt: 2, color: '#E91E8C', fontFamily: '"Georgia", serif' }}>
          Back to Products
        </Button>
      </Box>
    );
  }

  const effectivePrice = getEffectivePrice(product);

  return (
		<Box sx={{ pt: { xs: 7, md: 8 }, pb: { xs: 18, md: 10 } }}>
			{/* Hero Image */}
			<Box
				sx={{
					position: "relative",
					width: "100%",
					maxHeight: { xs: 320, md: 420 },
					overflow: "hidden",
				}}
			>
				<Box
					component="img"
					src={product.image}
					alt={product.name}
					sx={{
						width: "100%",
						height: { xs: 280, md: 400 },
						objectFit: "cover",
						display: "block",
					}}
				/>
				{/* Back button overlay */}
				<Box
					sx={{
						position: "absolute",
						top: 16,
						left: 16,
						display: "flex",
						alignItems: "center",
						gap: 2,
					}}
				>
					<IconButton
						onClick={() => navigate("/products")}
						sx={{
							backgroundColor: "rgba(255,255,255,0.9)",
							"&:hover": { backgroundColor: "#fff" },
							boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
						}}
					>
						<ArrowBackIcon sx={{ color: "#E91E8C" }} />
					</IconButton>
					<Button
						startIcon={<PlayCircleOutlineIcon />}
						onClick={() =>
							window.open(
								"https://www.instagram.com/reel/DVdYNG7DFSy/?igsh=dDlvN2Z5ZzB3Y2l2",
								"_blank",
							)
						}
						sx={{
							color: "#4A0E4E",
							fontFamily: '"Georgia", serif',
							fontWeight: 600,
							fontSize: "0.82rem",
							textTransform: "none",
							border: "1.5px solid #4A0E4E",
							borderRadius: "20px",
							px: 2,
							py: 0.5,
							backgroundColor: "rgba(255,255,255,0.9)",
							"&:hover": { backgroundColor: "#4A0E4E", color: "#fff" },
						}}
					>
						How to Apply
					</Button>
				</Box>
			</Box>

			<Container maxWidth="sm" sx={{ py: 3 }}>
				{/* Product title */}
				<Typography
					variant="h4"
					sx={{
						fontFamily: '"Georgia", serif',
						fontWeight: 700,
						color: "#000",
						mb: 1,
						fontSize: { xs: "1.6rem", md: "2rem" },
					}}
				>
					{product.name}
				</Typography>

				{/* Info chips */}
				<Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 2 }}>
					{product.shape && (
						<Chip
							label={product.shape}
							size="small"
							sx={{
								backgroundColor: "#F3E5F6",
								color: "#4A0E4E",
								fontWeight: 600,
							}}
						/>
					)}
					{product.length && (
						<Chip
							label={product.length}
							size="small"
							sx={{
								backgroundColor: "#F3E5F6",
								color: "#4A0E4E",
								fontWeight: 600,
							}}
						/>
					)}
					{product.type && (
						<Chip
							label={product.type}
							size="small"
							sx={{
								backgroundColor: "#4A0E4E",
								color: "#fff",
								fontWeight: 600,
							}}
						/>
					)}
					{isReadyMade && (
						<Chip
							label="Ready Made"
							size="small"
							sx={{
								backgroundColor: "#E91E8C",
								color: "#fff",
								fontWeight: 600,
							}}
						/>
					)}
					{hasDiscount(product) ? (
						<>
							<Chip
								label={formatNaira(effectivePrice)}
								sx={{
									backgroundColor: "#2e7d32",
									color: "#fff",
									fontFamily: '"Georgia", serif',
									fontWeight: 700,
								}}
							/>
							<Chip
								label={getDiscountLabel(product)}
								size="small"
								sx={{
									backgroundColor: "#e8f5e9",
									color: "#2e7d32",
									fontWeight: 700,
									fontSize: "0.7rem",
								}}
							/>
						</>
					) : (
						<Chip
							label={formatNaira(product.price)}
							sx={{
								backgroundColor: "#E91E8C",
								color: "#fff",
								fontFamily: '"Georgia", serif',
								fontWeight: 700,
							}}
						/>
					)}
					{hasDiscount(product) && (
						<Typography
							component="span"
							sx={{
								textDecoration: "line-through",
								color: "#999",
								fontSize: "0.85rem",
								fontFamily: '"Georgia", serif',
								alignSelf: "center",
							}}
						>
							{formatNaira(product.price)}
						</Typography>
					)}
				</Box>

				{/* Description */}
				{product.description && (
					<Typography
						sx={{
							color: "#555",
							fontSize: "0.95rem",
							lineHeight: 1.7,
							mb: 3,
						}}
					>
						{product.description}
					</Typography>
				)}

				<Box sx={{ borderTop: "1px solid #F0C0D0", pt: 3 }}>
					{/* Customer Name */}
					<Typography
						sx={{
							fontFamily: '"Georgia", serif',
							fontWeight: 700,
							color: "#4A0E4E",
							mb: 1,
							fontSize: "1rem",
						}}
					>
						Your Name
					</Typography>
					<TextField
						fullWidth
						size="small"
						placeholder="Enter your full name"
						value={customerName}
						onChange={(e) => {
							setCustomerName(e.target.value);
							setError("");
						}}
						sx={{
							mb: 3,
							"& .MuiOutlinedInput-root": {
								borderRadius: 2,
								"& fieldset": { borderColor: "#F0C0D0" },
								"&:hover fieldset": { borderColor: "#E91E8C" },
								"&.Mui-focused fieldset": { borderColor: "#E91E8C" },
							},
						}}
					/>

					{/* Conditional form fields */}
					{isReadyMade ? (
						<>
							<Typography
								sx={{
									fontFamily: '"Georgia", serif',
									fontWeight: 700,
									color: "#4A0E4E",
									mb: 1,
									fontSize: "1rem",
								}}
							>
								Select Preset Size
							</Typography>
							<Box
								sx={{
									display: "flex",
									gap: 1,
									flexWrap: "wrap",
									mb: 3,
								}}
							>
								{presetSizes.map((size) => (
									<Chip
										key={size}
										label={size}
										onClick={() => {
											setPresetSize(size);
											setError("");
										}}
										sx={{
											cursor: "pointer",
											fontWeight: 700,
											fontSize: "0.9rem",
											px: 1,
											border: "2px solid",
											borderColor:
												presetSize === size ? "#E91E8C" : "#F0C0D0",
											backgroundColor:
												presetSize === size
													? "#E91E8C"
													: "transparent",
											color: presetSize === size ? "#fff" : "#000",
											"&:hover": {
												backgroundColor:
													presetSize === size
														? "#C2185B"
														: "#FCE4EC",
											},
										}}
									/>
								))}
							</Box>

							<Typography
								sx={{
									fontFamily: '"Georgia", serif',
									fontWeight: 700,
									color: "#4A0E4E",
									mb: 1,
									fontSize: "1rem",
								}}
							>
								Quantity
							</Typography>
							<TextField
								select
								size="small"
								value={quantity}
								onChange={(e) => setQuantity(Number(e.target.value))}
								sx={{
									width: 110,
									mb: 3,
									"& .MuiOutlinedInput-root": { borderRadius: 2 },
								}}
							>
								{Array.from({ length: maxQty }, (_, i) => i + 1).map(
									(q) => (
										<MenuItem key={q} value={q}>
											{q}
										</MenuItem>
									),
								)}
							</TextField>

							{product.stock !== undefined && (
								<Typography
									sx={{
										color: product.stock <= 2 ? "#E91E8C" : "#999",
										fontSize: "0.8rem",
										fontStyle: "italic",
										mb: 3,
										mt: -2,
									}}
								>
									{product.stock} in stock
								</Typography>
							)}
						</>
					) : (
						<>
							<Typography
								sx={{
									fontFamily: '"Georgia", serif',
									fontWeight: 700,
									color: "#4A0E4E",
									mb: 1,
									fontSize: "1rem",
								}}
							>
								Nail Shape
							</Typography>
							<Box sx={{ mb: 3 }}>
								<NailShapeSelector
									value={nailShape}
									onChange={(s) => {
										setNailShape(s);
										setError("");
									}}
								/>
							</Box>

							<Typography
								sx={{
									fontFamily: '"Georgia", serif',
									fontWeight: 700,
									color: "#4A0E4E",
									mb: 1,
									fontSize: "1rem",
								}}
							>
								Quantity
							</Typography>
							<TextField
								select
								size="small"
								value={quantity}
								onChange={(e) => setQuantity(Number(e.target.value))}
								sx={{
									width: 110,
									mb: 3,
									"& .MuiOutlinedInput-root": { borderRadius: 2 },
								}}
							>
								{pressOnQuantities.map((q) => (
									<MenuItem key={q} value={q}>
										{q}
									</MenuItem>
								))}
							</TextField>

							<Typography
								sx={{
									fontFamily: '"Georgia", serif',
									fontWeight: 700,
									color: "#4A0E4E",
									mb: 1,
									fontSize: "1rem",
								}}
							>
								Nail Bed Sizes
							</Typography>
							<Box sx={{ mb: 3 }}>
								<NailBedSizeInput
									value={nailBedSize}
									onChange={setNailBedSize}
									required
								/>
							</Box>
						</>
					)}

					{/* Discounts & Rewards */}
					{isFormValid && (
						<Box
							sx={{
								p: 2.5,
								borderRadius: 3,
								backgroundColor: "#FFF0F5",
								border: "1px solid #F0C0D0",
								mb: 3,
							}}
						>
							<Typography
								sx={{
									fontFamily: '"Georgia", serif',
									fontWeight: 700,
									color: "#4A0E4E",
									mb: 1.5,
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
										fontSize: 15,
										color: referralValid ? "#2e7d32" : "#E91E8C",
									}}
								/>
								<Typography
									sx={{
										fontSize: "0.85rem",
										fontWeight: 600,
										color: referralValid ? "#2e7d32" : "#E91E8C",
										fontFamily: '"Georgia", serif',
									}}
								>
									{referralValid
										? "₦500 off applied at checkout!"
										: "Have a referral code?"}
								</Typography>
							</Box>
							<Collapse in={showRefField}>
								<Box sx={{ display: "flex", gap: 1, mb: 0.5 }}>
									<TextField
										size="small"
										placeholder="e.g. CHIZZYS-ABC123"
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
												"& fieldset": { borderColor: "#F0C0D0" },
												"&.Mui-focused fieldset": {
													borderColor: "#E91E8C",
												},
											},
										}}
										inputProps={{
											style: {
												fontFamily: "monospace",
												letterSpacing: 1,
												fontSize: "0.82rem",
											},
										}}
									/>
									<Button
										onClick={handleApplyReferral}
										disabled={
											!refCodeInput.trim() || referralChecking
										}
										sx={{
											backgroundColor: "#E91E8C",
											color: "#fff",
											borderRadius: 2,
											px: 2,
											fontFamily: '"Georgia", serif',
											fontWeight: 600,
											fontSize: "0.78rem",
											whiteSpace: "nowrap",
											"&:hover": { backgroundColor: "#C2185B" },
											"&.Mui-disabled": {
												backgroundColor: "#F0C0D0",
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
								<Box sx={{ mt: 1.5 }}>
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
													}}
												>
													🎁 ₦
													{pendingReward.naira.toLocaleString()}{" "}
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
												onClick={() =>
													setLoyaltyUnits(
														Math.min(
															pendingReward.units,
															maxLoyaltyUnits,
														),
													)
												}
												sx={{
													border: "1.5px solid #E91E8C",
													borderRadius: "20px",
													color: "#E91E8C",
													px: 2,
													py: 0.4,
													fontSize: "0.78rem",
													fontWeight: 700,
													textTransform: "none",
													"&:hover": {
														backgroundColor: "#E91E8C",
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
											mb: 0.8,
										}}
									>
										<StarIcon
											sx={{ fontSize: 15, color: "#B8860B" }}
										/>
										<Typography
											sx={{
												fontSize: "0.82rem",
												fontWeight: 600,
												color: "#B8860B",
												fontFamily: '"Georgia", serif',
											}}
										>
											Loyalty — {loyaltyBalance} pts (redeemable at
											checkout)
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
												border: "1.5px solid #F0C0D0",
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
												border: "1.5px solid #F0C0D0",
												borderRadius: "50%",
												width: 28,
												height: 28,
											}}
										>
											<AddIcon sx={{ fontSize: 14 }} />
										</IconButton>
										<Typography
											sx={{ fontSize: "0.78rem", color: "#555" }}
										>
											units × ₦1,000 ={" "}
											<strong style={{ color: "#B8860B" }}>
												-₦
												{(
													loyaltyUnits * REDEMPTION_VALUE
												).toLocaleString()}{" "}
												off
											</strong>
										</Typography>
									</Box>
								</Box>
							)}

							{(referralValid || loyaltyUnits > 0) && (
								<Typography
									sx={{
										mt: 1.5,
										fontSize: "0.75rem",
										color: "#888",
										fontStyle: "italic",
									}}
								>
									Discounts will be applied to your total at checkout.
								</Typography>
							)}
						</Box>
					)}

					{error && (
						<Typography
							sx={{ color: "#d32f2f", fontSize: "0.88rem", mb: 2 }}
						>
							{error}
						</Typography>
					)}
				</Box>
			</Container>

			{/* Sticky action bar */}
			<Box
				sx={{
					position: "fixed",
					bottom: { xs: "64px", md: 0 },
					left: 0,
					right: 0,
					zIndex: 1100,
					backgroundColor: "rgba(255, 240, 245, 0.97)",
					backdropFilter: "blur(8px)",
					borderTop: "1px solid #F0C0D0",
					py: 1.5,
					px: 2,
					display: "flex",
					gap: 1.5,
					justifyContent: "center",
					flexWrap: "wrap",
				}}
			>
				<Button
					onClick={handleAddToCart}
					disabled={!isFormValid}
					startIcon={<ShoppingCartOutlinedIcon />}
					sx={{
						border: "2px solid #4A0E4E",
						borderRadius: "30px",
						color: "#4A0E4E",
						px: 3,
						py: 1,
						fontFamily: '"Georgia", serif',
						fontWeight: 600,
						fontSize: "0.9rem",
						opacity: isFormValid ? 1 : 0.5,
						"&:hover": {
							backgroundColor: "#4A0E4E",
							color: "#fff",
							borderColor: "#4A0E4E",
						},
						"&.Mui-disabled": {
							opacity: 0.5,
							border: "2px solid #4A0E4E",
							color: "#4A0E4E",
						},
					}}
				>
					Add to Cart
				</Button>
				<Button
					onClick={handleCheckout}
					disabled={!isFormValid}
					sx={{
						backgroundColor: "#E91E8C",
						color: "#fff",
						borderRadius: "30px",
						px: 3,
						py: 1,
						fontFamily: '"Georgia", serif',
						fontWeight: 600,
						fontSize: "0.9rem",
						opacity: isFormValid ? 1 : 0.5,
						"&:hover": { backgroundColor: "#C2185B" },
						"&.Mui-disabled": {
							backgroundColor: "#F0C0D0",
							color: "#fff",
						},
					}}
				>
					Proceed to Checkout
				</Button>
			</Box>

			<SignInPrompt
				open={signInPromptOpen}
				onClose={() => setSignInPromptOpen(false)}
			/>
		</Box>
  );
}
