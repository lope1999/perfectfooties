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
  Menu,
  ListItemIcon,
  ListItemText,
  Tooltip,
  Switch,
  FormControlLabel,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import PlayCircleOutlineIcon from '@mui/icons-material/PlayCircleOutline';
import ShoppingCartOutlinedIcon from '@mui/icons-material/ShoppingCartOutlined';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import StarIcon from '@mui/icons-material/Star';
import ShareIcon from '@mui/icons-material/Share';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';
import { pressOnQuantities } from '../data/products';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
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
import PresetSizeGuide from '../components/PresetSizeGuide';
import useProductCategories from '../hooks/useProductCategories';
import { addRecentlyViewed, getRecentlyViewed } from '../lib/recentlyViewed';
import { getSaleEndsAt } from '../lib/discountUtils';
import FlashSaleCountdown from '../components/FlashSaleCountdown';

const presetSizes = ['XS', 'S', 'M', 'L'];

const presetSizeData = [
  { label: 'XS', thumb: 3, index: 7, middle: 5, ring: 6, pinky: 9 },
  { label: 'S',  thumb: 2, index: 6, middle: 4, ring: 5, pinky: 8 },
  { label: 'M',  thumb: 1, index: 5, middle: 3, ring: 4, pinky: 7 },
  { label: 'L',  thumb: 0, index: 4, middle: 2, ring: 3, pinky: 6 },
];

const tipApprox = {
  0: '~18mm', 1: '~17mm', 2: '~16mm', 3: '~15mm', 4: '~14mm',
  5: '~13mm', 6: '~12mm', 7: '~11mm', 8: '~10mm', 9: '~9mm',
};

function formatNaira(amount) {
  return `₦${Number(amount).toLocaleString()}`;
}

export default function PressOnDetailPage() {
  const { categoryId, productId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { addPressOn } = useCart();
  const { showToast } = useNotifications();
  const { categories, loading } = useProductCategories();

  // Find category and product
  const category = categories.find((c) => c.id === categoryId) || null;
  const product = category?.products?.find((p) => p.id === productId) || null;

  const isReadyMade = !!category?.readyMade;

  // Form state
  const [customerName, setCustomerName] = useState('');
  const [presetSize, setPresetSize] = useState('');
  const [nailShape, setNailShape] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [nailBedSize, setNailBedSize] = useState('');
  const [orderMore, setOrderMore] = useState(false);

  const maxQty = isReadyMade
    ? (orderMore ? 10 : (product?.stock || 1))
    : 5;
  const [error, setError] = useState('');
  const [signInPromptOpen, setSignInPromptOpen] = useState(false);
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);
  const [recentlyViewed, setRecentlyViewed] = useState([]);
  const [shareAnchor, setShareAnchor] = useState(null);

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

  // Reset quantity to stock cap when orderMore is turned off
  useEffect(() => {
    if (!orderMore && isReadyMade && product?.stock !== undefined) {
      setQuantity((q) => Math.min(q, product.stock || 1));
    }
  }, [orderMore]);

  useEffect(() => {
    if (!product || !category) return;
    addRecentlyViewed({
      id: product.id,
      categoryId: category.id,
      name: product.name,
      price: getEffectivePrice(product),
      image: product.images?.[0] || product.image || '',
      type: product.type || '',
    });
    setRecentlyViewed(
      getRecentlyViewed().filter(
        (p) => !(p.id === product.id && p.categoryId === category.id)
      )
    );
  }, [product?.id]);

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
    specialRequest: isReadyMade && orderMore,
  });

  const handleAddToCart = () => {
    if (!user) { setSignInPromptOpen(true); return; }
    if (!validate()) return;
    const item = buildCartItem();
    addPressOn(item);
    showToast(`${item.name} added to cart`, 'success');
    navigate('/products');
  };

  const handleCheckout = () => {
    if (!user) { setSignInPromptOpen(true); return; }
    if (!validate()) return;
    const item = buildCartItem();
    addPressOn(item);
    showToast(`${item.name} added to cart`, 'success');
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

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href).then(() => {
      showToast('Link copied to clipboard!', 'success');
    }).catch(() => {
      showToast('Could not copy link', 'error');
    });
    setShareAnchor(null);
  };

  const handleShareWhatsApp = () => {
    const text = `Check out this nail set from Chizzysstyles:\n${product?.name}\n${window.location.href}`;
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank');
    setShareAnchor(null);
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
        <Typography sx={{ color: 'var(--text-muted)', fontSize: '1.1rem' }}>Product not found.</Typography>
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
							color: "var(--text-purple)",
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
				{/* Product title + share button */}
				<Box
					sx={{
						display: "flex",
						alignItems: "flex-start",
						justifyContent: "space-between",
						mb: 1,
					}}
				>
					<Typography
						variant="h4"
						sx={{
							fontFamily: '"Georgia", serif',
							fontWeight: 700,
							color: "var(--text-main)",
							fontSize: { xs: "1.6rem", md: "2rem" },
							flex: 1,
						}}
					>
						{product.name}
					</Typography>
					<Tooltip title="Share this product">
						<IconButton
							onClick={(e) => setShareAnchor(e.currentTarget)}
							size="small"
							sx={{
								mt: 0.5,
								ml: 1,
								color: "#E91E8C",
								border: "1px solid #F0C0D0",
								borderRadius: 2,
								p: 0.8,
							}}
						>
							<ShareIcon sx={{ fontSize: 20 }} />
						</IconButton>
					</Tooltip>
				</Box>

				<Menu
					anchorEl={shareAnchor}
					open={Boolean(shareAnchor)}
					onClose={() => setShareAnchor(null)}
					PaperProps={{
						sx: {
							borderRadius: 2,
							minWidth: 180,
							boxShadow: "0 4px 20px rgba(0,0,0,0.12)",
						},
					}}
				>
					<MenuItem onClick={handleCopyLink} sx={{ py: 1.2 }}>
						<ListItemIcon>
							<ContentCopyIcon
								sx={{ fontSize: 18, color: "var(--text-purple)" }}
							/>
						</ListItemIcon>
						<ListItemText
							primaryTypographyProps={{
								fontFamily: '"Georgia", serif',
								fontSize: "0.88rem",
							}}
						>
							Copy link
						</ListItemText>
					</MenuItem>
					<MenuItem onClick={handleShareWhatsApp} sx={{ py: 1.2 }}>
						<ListItemIcon>
							<WhatsAppIcon sx={{ fontSize: 18, color: "#25D366" }} />
						</ListItemIcon>
						<ListItemText
							primaryTypographyProps={{
								fontFamily: '"Georgia", serif',
								fontSize: "0.88rem",
							}}
						>
							Share on WhatsApp
						</ListItemText>
					</MenuItem>
				</Menu>

				{/* Info chips */}
				<Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 2 }}>
					{product.shape && (
						<Chip
							label={product.shape}
							size="small"
							sx={{
								backgroundColor: "#F3E5F6",
								color: "var(--text-purple)",
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
								color: "var(--text-purple)",
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

				{/* Flash sale countdown */}
				{getSaleEndsAt(product) && (
					<Box sx={{ mt: 0.5 }}>
						<FlashSaleCountdown endsAt={getSaleEndsAt(product)} />
					</Box>
				)}

				{/* Description */}
				{product.description && (
					<Typography
						sx={{
							color: "var(--text-muted)",
							fontSize: "0.95rem",
							lineHeight: 1.7,
							mb: 2,
						}}
					>
						{product.description}
					</Typography>
				)}

				{/* Image guide note — only for custom press-ons */}
				{!isReadyMade && (
					<Box
						sx={{
							display: "flex",
							alignItems: "flex-start",
							gap: 1.5,
							p: 2,
							mb: 3,
							backgroundColor: "#FFFBF0",
							border: "1px solid #FFE082",
							borderRadius: 3,
						}}
					>
						<InfoOutlinedIcon
							sx={{
								color: "#B8860B",
								fontSize: 20,
								mt: 0.1,
								flexShrink: 0,
							}}
						/>
						<Box>
							<Typography
								sx={{
									fontFamily: '"Georgia", serif',
									fontWeight: 700,
									color: "#7A5800",
									fontSize: "0.9rem",
									mb: 0.5,
								}}
							>
								About this image
							</Typography>
							<Typography
								sx={{
									color: "#7A5800",
									fontSize: "0.85rem",
									lineHeight: 1.65,
								}}
							>
								The photo shown is a <strong>visual guide only</strong>{" "}
								— not the actual product. It&rsquo;s here to inspire
								your style. For your custom order, feel free to send us
								your <strong>mood board</strong>, inspiration pictures,
								or any images — from nature, your favourite colours,
								food, films, cartoons, or any subject you love!
							</Typography>
						</Box>
					</Box>
				)}

				<Box sx={{ borderTop: "1px solid #F0C0D0", pt: 3 }}>
					{/* Customer Name */}
					<Typography
						sx={{
							fontFamily: '"Georgia", serif',
							fontWeight: 700,
							color: "var(--text-purple)",
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
									color: "var(--text-purple)",
									mb: 1,
									fontSize: "1rem",
								}}
							>
								Select Preset Size
							</Typography>
							{orderMore && (
								<Typography sx={{ fontSize: "0.78rem", color: "#B8860B", fontStyle: "italic", mb: 1 }}>
									All sizes available via production — not limited to current stock.
								</Typography>
							)}
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

							{/* What are preset sizes button */}
							<Box sx={{ mb: 2, mt: -1.5 }}>
								<Button
									size="small"
									onClick={() => setSizeGuideOpen(true)}
									sx={{
										color: "#E91E8C",
										textTransform: "none",
										fontSize: "0.82rem",
										fontFamily: '"Georgia", serif',
										fontWeight: 600,
										p: 0,
										minWidth: 0,
										"&:hover": {
											backgroundColor: "transparent",
											textDecoration: "underline",
										},
									}}
								>
									What are preset sizes?
								</Button>
							</Box>

							{/* Selected preset size breakdown */}
							{presetSize &&
								(() => {
									const row = presetSizeData.find(
										(s) => s.label === presetSize,
									);
									const fingers = [
										{ label: "Thumb", key: "thumb" },
										{ label: "Index", key: "index" },
										{ label: "Middle", key: "middle" },
										{ label: "Ring", key: "ring" },
										{ label: "Pinky", key: "pinky" },
									];
									return (
										<Box
											sx={{
												mb: 3,
												p: 2,
												backgroundColor: "#FFF0F5",
												border: "1px solid #F0C0D0",
												borderRadius: 3,
											}}
										>
											<Typography
												sx={{
													fontFamily: '"Georgia", serif',
													fontWeight: 700,
													color: "var(--text-purple)",
													fontSize: "0.88rem",
													mb: 1.5,
												}}
											>
												Size {presetSize} &mdash; nail tip numbers
												&amp; approximate widths
											</Typography>
											<Box
												sx={{
													display: "grid",
													gridTemplateColumns: "repeat(5, 1fr)",
													gap: 0.8,
												}}
											>
												{fingers.map(({ label, key }) => {
													const tip = row ? row[key] : null;
													return (
														<Box
															key={key}
															sx={{
																textAlign: "center",
																p: 1,
																backgroundColor: "#fff",
																borderRadius: 2,
																border: "1px solid #F0C0D0",
															}}
														>
															<Typography
																sx={{
																	fontSize: "0.65rem",
																	color: "#999",
																	mb: 0.3,
																	lineHeight: 1.2,
																}}
															>
																{label}
															</Typography>
															<Typography
																sx={{
																	fontFamily:
																		'"Georgia", serif',
																	fontWeight: 700,
																	fontSize: "1rem",
																	color: "#E91E8C",
																	lineHeight: 1.2,
																}}
															>
																{tip}
															</Typography>
															<Typography
																sx={{
																	fontSize: "0.62rem",
																	color: "#888",
																	mt: 0.2,
																}}
															>
																{tip !== null
																	? tipApprox[tip]
																	: ""}
															</Typography>
														</Box>
													);
												})}
											</Box>
										</Box>
									);
								})()}

							<Typography
								sx={{
									fontFamily: '"Georgia", serif',
									fontWeight: 700,
									color: "var(--text-purple)",
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
									"& .MuiOutlinedInput-root": {
										borderRadius: 2,
										...(orderMore && {
											backgroundColor: '#FFFDE7',
											'& fieldset': { borderColor: '#FFB300' },
											'&:hover fieldset': { borderColor: '#F9A825' },
											'&.Mui-focused fieldset': { borderColor: '#F9A825' },
										}),
									},
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
										mb: 1.5,
										mt: -2,
									}}
								>
									{product.stock} in stock
								</Typography>
							)}

							{/* Order More Toggle */}
							{product.stock !== undefined && (
								<Box
									sx={{
										mb: 3,
										p: 2,
										borderRadius: 3,
										border: orderMore ? "1.5px solid #FFB300" : "1.5px solid #F0C0D0",
										backgroundColor: orderMore ? '#FFFDE7' : '#FAFAFA',
										transition: 'all 0.25s ease',
									}}
								>
									<FormControlLabel
										control={
											<Switch
												checked={orderMore}
												onChange={(e) => setOrderMore(e.target.checked)}
												size="small"
												sx={{
													'& .MuiSwitch-switchBase.Mui-checked': { color: '#FFB300' },
													'& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: '#FFB300' },
												}}
											/>
										}
										label={
											<Typography
												sx={{
													fontFamily: '"Georgia", serif',
													fontWeight: 600,
													fontSize: '0.9rem',
													color: orderMore ? '#B8860B' : 'var(--text-main)',
												}}
											>
												Order more of this set
											</Typography>
										}
									/>
									{orderMore && (
										<Box sx={{ mt: 1, display: 'flex', alignItems: 'flex-start', gap: 1 }}>
											<InfoOutlinedIcon sx={{ color: '#B8860B', fontSize: 17, mt: 0.15, flexShrink: 0 }} />
											<Typography sx={{ color: '#7A5800', fontSize: '0.82rem', lineHeight: 1.65 }}>
												We&rsquo;ll produce this set fresh for you at the{' '}
												<strong>same price</strong>.{' '}
												<strong>Production time: 4–7 days</strong> is factored
												in for this request. All sizes available — you&rsquo;re
												not limited to current stock.
											</Typography>
										</Box>
									)}
								</Box>
							)}
						</>
					) : (
						<>
							<Typography
								sx={{
									fontFamily: '"Georgia", serif',
									fontWeight: 700,
									color: "var(--text-purple)",
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
									color: "var(--text-purple)",
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
									color: "var(--text-purple)",
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
							<Box sx={{ mb: 3, mt: -2 }}>
								<Button
									size="small"
									onClick={() => setSizeGuideOpen(true)}
									sx={{
										color: "#E91E8C",
										textTransform: "none",
										fontSize: "0.82rem",
										fontFamily: '"Georgia", serif',
										fontWeight: 600,
										p: 0,
										minWidth: 0,
										"&:hover": {
											backgroundColor: "transparent",
											textDecoration: "underline",
										},
									}}
								>
									What are preset sizes?
								</Button>
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
									color: "var(--text-purple)",
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
											sx={{
												fontSize: "0.78rem",
												color: "var(--text-muted)",
											}}
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

			{/* Recently Viewed */}
			{recentlyViewed.length > 0 && (
				<Container maxWidth="sm" sx={{ mt: 4, mb: 2 }}>
					<Typography
						sx={{
							fontFamily: '"Georgia", serif',
							fontWeight: 700,
							color: "var(--text-purple)",
							mb: 1.5,
							fontSize: "1rem",
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
								backgroundColor: "#F0C0D0",
								borderRadius: 2,
							},
						}}
					>
						{recentlyViewed.map((item) => (
							<Box
								key={`${item.categoryId}-${item.id}`}
								onClick={() =>
									navigate(`/products/${item.categoryId}/${item.id}`)
								}
								sx={{
									minWidth: 120,
									maxWidth: 120,
									borderRadius: 2,
									border: "1px solid #F0C0D0",
									overflow: "hidden",
									cursor: "pointer",
									flexShrink: 0,
									transition: "all 0.2s",
									"&:hover": {
										borderColor: "#E91E8C",
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
											height: 90,
											objectFit: "cover",
											display: "block",
										}}
									/>
								) : (
									<Box
										sx={{
											width: "100%",
											height: 90,
											backgroundColor: "#FFF0F8",
											display: "flex",
											alignItems: "center",
											justifyContent: "center",
										}}
									>
										<Typography sx={{ fontSize: "1.5rem" }}>
											💅
										</Typography>
									</Box>
								)}
								<Box sx={{ p: 0.8 }}>
									<Typography
										sx={{
											fontSize: "0.7rem",
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
											fontSize: "0.72rem",
											color: "#E91E8C",
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
				</Container>
			)}

			{/* Nail Care Guide link */}
			<Container maxWidth="sm" sx={{ mt: 2, mb: 1, textAlign: "center" }}>
				<Typography
					component="a"
					href="/nail-care"
					sx={{
						fontFamily: '"Georgia", serif',
						fontSize: "0.82rem",
						color: "#E91E8C",
						textDecoration: "underline",
						cursor: "pointer",
						"&:hover": { color: "#C2185B" },
					}}
				>
					How to apply &amp; care for your press-ons →
				</Typography>
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
						color: "var(--text-purple)",
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
							color: "var(--text-purple)",
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

			<PresetSizeGuide
				open={sizeGuideOpen}
				onClose={() => setSizeGuideOpen(false)}
			/>

			<SignInPrompt
				open={signInPromptOpen}
				onClose={() => setSignInPromptOpen(false)}
			/>
		</Box>
  );
}
