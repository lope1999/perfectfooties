import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import ServiceMenuPage from './pages/ServiceMenuPage';
import BookAppointmentPage from './pages/BookAppointmentPage';
import OurStoryPage from './pages/OurStoryPage';
import BlogPage from './pages/BlogPage';
import ProductsMenuPage from './pages/ProductsMenuPage';
import PlaceOrderPage from './pages/PlaceOrderPage';
import TestimonialsPage from './pages/TestimonialsPage';
import GiftCardPage from './pages/GiftCardPage';
import OurTeamPage from './pages/OurTeamPage';
import RescheduleAppointmentPage from './pages/RescheduleAppointmentPage';

function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/services" element={<ServiceMenuPage />} />
        <Route path="/products" element={<ProductsMenuPage />} />
        <Route path="/book" element={<BookAppointmentPage />} />
        <Route path="/reschedule" element={<RescheduleAppointmentPage />} />
        <Route path="/order" element={<PlaceOrderPage />} />
        <Route path="/our-story" element={<OurStoryPage />} />
        <Route path="/blog" element={<BlogPage />} />
        <Route path="/testimonials" element={<TestimonialsPage />} />
        <Route path="/gift-cards" element={<GiftCardPage />} />
        <Route path="/our-team" element={<OurTeamPage />} />
      </Routes>
      <Footer />
    </>
  );
}

export default App;
