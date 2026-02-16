import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import ServiceMenuPage from './pages/ServiceMenuPage';
import BookAppointmentPage from './pages/BookAppointmentPage';
import OurStoryPage from './pages/OurStoryPage';
import BlogPage from './pages/BlogPage';
import ProductsMenuPage from './pages/ProductsMenuPage';
import TestimonialsPage from './pages/TestimonialsPage';

function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/services" element={<ServiceMenuPage />} />
        <Route path="/products" element={<ProductsMenuPage />} />
        <Route path="/book" element={<BookAppointmentPage />} />
        <Route path="/our-story" element={<OurStoryPage />} />
        <Route path="/blog" element={<BlogPage />} />
        <Route path="/testimonials" element={<TestimonialsPage />} />
      </Routes>
      <Footer />
    </>
  );
}

export default App;
