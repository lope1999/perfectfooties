import { lazy, Suspense, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import { CircularProgress, Box } from '@mui/material';
import ScrollToTop from './components/ScrollToTop';
import Navbar from './components/Navbar';
import ReviewReminderPopup from './components/ReviewReminderPopup';
import StatusChangeToast from './components/StatusChangeToast';
import Footer from './components/Footer';
import WhatsAppBubble from './components/WhatsAppBubble';
import MobileBottomNav from './components/MobileBottomNav';
import HomePage from './pages/HomePage';
import OurStoryPage from './pages/OurStoryPage';
import BlogPage from './pages/BlogPage';
import TestimonialsPage from './pages/TestimonialsPage';
import GiftCardPage from './pages/GiftCardPage';
import OurTeamPage from './pages/OurTeamPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import AccountPage from './pages/AccountPage';
import GalleryPage from './pages/GalleryPage';
import ThankYouPage from './pages/ThankYouPage';
import ShopPage from './pages/ShopPage';
import CategoryPage from './pages/CategoryPage';

const AdminPage = lazy(() => import('./pages/AdminPage'));

const LazyFallback = (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
    <CircularProgress sx={{ color: '#e3242b' }} />
  </Box>
);

function App() {
  const location = useLocation();

  // Capture referral code from URL (?ref=PERFECTFOOTIES-XXXX) and persist in sessionStorage
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref) sessionStorage.setItem('pendingReferralCode', ref.toUpperCase().trim());
  }, []);

  return (
		<>
			<ScrollToTop />
			<Navbar />
			<ReviewReminderPopup />
			<StatusChangeToast />
			<Box sx={{ pb: { xs: "64px", md: 0 } }}>
				<Routes>
					<Route path="/" element={<HomePage />} />
					<Route path="/cart" element={<CartPage />} />
					<Route path="/checkout" element={<CheckoutPage />} />
					<Route path="/account" element={<AccountPage />} />
					<Route path="/our-story" element={<OurStoryPage />} />
					<Route path="/blog" element={<BlogPage />} />
					<Route path="/testimonials" element={<TestimonialsPage />} />
					<Route path="/gift-cards" element={<GiftCardPage />} />
					<Route path="/our-team" element={<OurTeamPage />} />
					<Route path="/gallery" element={<GalleryPage />} />
					<Route path="/thank-you" element={<ThankYouPage />} />
					<Route path="/shop" element={<ShopPage />} />
					<Route path="/shop/:categoryId" element={<CategoryPage />} />
					<Route
						path="/admin"
						element={
							<Suspense fallback={LazyFallback}>
								<AdminPage />
							</Suspense>
						}
					/>
				</Routes>
			</Box>
			<WhatsAppBubble />
			<MobileBottomNav />
			{location.pathname !== "/admin" && <Footer />}
			<Analytics />
		</>
  );
}

export default App;
