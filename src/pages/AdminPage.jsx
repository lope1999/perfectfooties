import { useState, useEffect, useCallback } from 'react';
import { Box, IconButton, useMediaQuery, useTheme } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import AdminGuard from '../components/admin/AdminGuard';
import AdminSidebar, { SIDEBAR_WIDTH, SIDEBAR_COLLAPSED_WIDTH } from '../components/admin/AdminSidebar';
import DashboardSection from '../components/admin/DashboardSection';
import OrdersSection from '../components/admin/OrdersSection';
import ProductsSection from '../components/admin/ProductsSection';
import CustomersSection from '../components/admin/CustomersSection';
import GiftCardsSection from '../components/admin/GiftCardsSection';
import BlogPostsSection from '../components/admin/BlogPostsSection';
import GallerySection from '../components/admin/GallerySection';
import LoyaltySection from '../components/admin/LoyaltySection';
import CollectionsSection from '../components/admin/CollectionsSection';
import ReviewsSection from "../components/admin/ReviewsSection";
import AnnouncementsSection from '../components/admin/AnnouncementsSection';
import ProductionTrackerSection from '../components/admin/ProductionTrackerSection';
import NewsletterSection from '../components/admin/NewsletterSection';
import {
	fetchAllOrders,
	fetchAllUsers,
	computeUserStats,
	subscribeToAllOrders,
} from "../lib/adminService";
import { fetchProducts } from '../lib/productService';
import { fetchGalleryImages } from '../lib/galleryService';
import { fetchAllGiftCards } from '../lib/giftCardService';
import { seedAndFetchBlogPosts } from '../lib/blogService';
import { blogPosts as staticBlogPosts } from '../data/blog';

export default function AdminPage() {
	const [section, setSection] = useState("dashboard");
	const [mobileOpen, setMobileOpen] = useState(false);
	const [collapsed, setCollapsed] = useState(false);
	const [orders, setOrders] = useState([]);
	const [rawUsers, setRawUsers] = useState([]);
	const [blogPosts, setBlogPosts] = useState([]);
	const [galleryImages, setGalleryImages] = useState([]);
	const [giftCards, setGiftCards] = useState([]);
	const [users, setUsers] = useState([]);
	const [shopProducts, setShopProducts] = useState([]);
	const [loading, setLoading] = useState(true);

	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down("md"));

	const loadData = useCallback(async () => {
		setLoading(true);
		try {
			const [o, gc, uf, bp, gi, sp] = await Promise.allSettled([
				fetchAllOrders(),
				fetchAllGiftCards(),
				fetchAllUsers(),
				seedAndFetchBlogPosts(staticBlogPosts),
				fetchGalleryImages(),
				fetchProducts(),
			]);

			if (o.status === "fulfilled") {
				setOrders(o.value);
			} else {
				console.error("Orders load error:", o.reason);
				setOrders([]);
			}

			setGiftCards(gc.status === "fulfilled" ? gc.value : []);
			setBlogPosts(bp.status === "fulfilled" ? bp.value : staticBlogPosts);
			setGalleryImages(gi.status === "fulfilled" ? gi.value : []);

			const fetchedUsers = uf.status === "fulfilled" ? uf.value : [];
			setRawUsers(fetchedUsers);
			setShopProducts(sp.status === "fulfilled" ? sp.value : []);
		} catch (err) {
			console.error("Admin data load error:", err);
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		loadData();
	}, [loadData]);

	useEffect(() => {
		const unsubscribe = subscribeToAllOrders(setOrders, (error) =>
			console.error("Admin orders snapshot error:", error),
		);
		return unsubscribe;
	}, []);

	useEffect(() => {
		setUsers(computeUserStats(rawUsers, orders));
	}, [rawUsers, orders]);

	// Listen for lightweight navigation events from dashboard cards (e.g. Manage buttons)
	useEffect(() => {
		const handler = (e) => {
			try {
				const d = e.detail || {};
				if (d.section) setSection(d.section);
			} catch (err) {}
		};
		window.addEventListener("admin:navigate", handler);
		return () => window.removeEventListener("admin:navigate", handler);
	}, []);

	const renderSection = () => {
		switch (section) {
			case "dashboard":
				return (
					<DashboardSection
						orders={orders}
						pressOnCategories={[]}
						retailCategories={[]}
						customerCount={users.length}
						loading={loading}
						onNavigate={setSection}
					/>
				);
			case "orders":
				return (
					<OrdersSection
						orders={orders}
						loading={loading}
						onRefresh={loadData}
					/>
				);
			case "production":
				return <ProductionTrackerSection />;
			case "collections":
				return <CollectionsSection />;
			case "reviews":
				return <ReviewsSection />;
			case "customers":
				return <CustomersSection users={users} loading={loading} />;
			case "blog":
				return (
					<BlogPostsSection
						blogPosts={blogPosts}
						loading={loading}
						onRefresh={loadData}
					/>
				);
			case "giftcards":
				return (
					<GiftCardsSection
						giftCards={giftCards}
						loading={loading}
						onRefresh={loadData}
					/>
				);
			case "gallery":
				return (
					<GallerySection
						galleryImages={galleryImages}
						loading={loading}
						onRefresh={loadData}
					/>
				);
			case "loyalty":
				return <LoyaltySection loading={loading} />;
			case "announcements":
				return <AnnouncementsSection />;
			case "subscribers":
				return <NewsletterSection />;
			default:
				return null;
		}
	};

	return (
		<AdminGuard>
			<Box
				sx={{
					display: "flex",
					minHeight: "100vh",
					minWidth: "fit-content",
					backgroundColor: "#f5f5f5",
				}}
			>
				<AdminSidebar
					active={section}
					onSelect={setSection}
					mobileOpen={mobileOpen}
					onMobileClose={() => setMobileOpen(false)}
					collapsed={collapsed}
					onToggleCollapse={() => setCollapsed((c) => !c)}
				/>
				<Box
					sx={{
						flex: 1,
						ml: isMobile
							? 0
							: `${collapsed ? SIDEBAR_COLLAPSED_WIDTH : SIDEBAR_WIDTH}px`,
						p: { xs: 2, md: 3 },
						pt: { xs: 10, md: 11 },
						minHeight: "100vh",
						minWidth: 0,
					}}
				>
					{isMobile && (
						<IconButton
							onClick={() => setMobileOpen(true)}
							sx={{ mb: 1, color: "var(--text-purple)" }}
						>
							<MenuIcon />
						</IconButton>
					)}
					{renderSection()}
				</Box>
			</Box>
		</AdminGuard>
	);
}
