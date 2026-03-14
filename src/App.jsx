import { lazy, Suspense, useEffect } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import { CircularProgress, Box } from '@mui/material';
import ScrollToTop from './components/ScrollToTop';
import Navbar from './components/Navbar';
import AppointmentReminderPopup from './components/AppointmentReminderPopup';
import StatusChangeToast from './components/StatusChangeToast';
import Footer from './components/Footer';
import WhatsAppBubble from './components/WhatsAppBubble';
import MobileBottomNav from './components/MobileBottomNav';
import HomePage from './pages/HomePage';
import ServiceMenuPage from './pages/ServiceMenuPage';
import ServiceDetailPage from './pages/ServiceDetailPage';
import BookAppointmentPage from './pages/BookAppointmentPage';
import OurStoryPage from './pages/OurStoryPage';
import BlogPage from './pages/BlogPage';
import ProductsMenuPage from './pages/ProductsMenuPage';
import PlaceOrderPage from './pages/PlaceOrderPage';
import TestimonialsPage from './pages/TestimonialsPage';
import GiftCardPage from './pages/GiftCardPage';
import OurTeamPage from './pages/OurTeamPage';
import RescheduleAppointmentPage from './pages/RescheduleAppointmentPage';
import NailShopPage from './pages/NailShopPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import AccountPage from './pages/AccountPage';
import GalleryPage from './pages/GalleryPage';
import ThankYouPage from './pages/ThankYouPage';
import PressOnDetailPage from './pages/PressOnDetailPage';

const AdminPage = lazy(() => import('./pages/AdminPage'));

const LazyFallback = (
  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
    <CircularProgress sx={{ color: '#E91E8C' }} />
  </Box>
);

function App() {
  const location = useLocation();

  // Capture referral code from URL (?ref=CHIZZYS-XXXX) and persist in sessionStorage
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref) sessionStorage.setItem('pendingReferralCode', ref.toUpperCase().trim());
  }, []);

  return (
    <>
      <ScrollToTop />
      <Navbar />
      <AppointmentReminderPopup />
      <StatusChangeToast />
      <Box sx={{ pb: { xs: '64px', md: 0 } }}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/services" element={<ServiceMenuPage />} />
          <Route path="/services/:serviceId" element={<ServiceDetailPage />} />
          <Route path="/products" element={<ProductsMenuPage />} />
          <Route path="/products/:categoryId/:productId" element={<PressOnDetailPage />} />
          <Route path="/shop" element={<NailShopPage />} />
          <Route path="/book" element={<BookAppointmentPage />} />
          <Route path="/reschedule" element={<RescheduleAppointmentPage />} />
          <Route path="/order" element={<PlaceOrderPage />} />
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
      {location.pathname !== '/admin' && <Footer />}
      <Analytics />
    </>
  );
}

export default App;
