import { useState, useEffect, useCallback } from 'react';
import { Box, IconButton, useMediaQuery, useTheme } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import AdminGuard from '../components/admin/AdminGuard';
import AdminSidebar, { SIDEBAR_WIDTH } from '../components/admin/AdminSidebar';
import DashboardSection from '../components/admin/DashboardSection';
import OrdersSection from '../components/admin/OrdersSection';
import AppointmentsSection from '../components/admin/AppointmentsSection';
import ProductsSection from '../components/admin/ProductsSection';
import { fetchAllOrders, fetchCategories, seedCategories } from '../lib/adminService';
import { productCategories as staticPressOns } from '../data/products';
import { retailCategories as staticRetail } from '../data/retailProducts';

export default function AdminPage() {
  const [section, setSection] = useState('dashboard');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [orders, setOrders] = useState([]);
  const [pressOnCategories, setPressOnCategories] = useState([]);
  const [retailCategories, setRetailCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      // Seed Firestore from static data if collections are empty (one-time)
      try {
        await Promise.all([
          seedCategories('productCategories', staticPressOns),
          seedCategories('retailCategories', staticRetail),
        ]);
      } catch (seedErr) {
        console.warn('Category seed skipped:', seedErr);
      }

      const [o, pc, rc] = await Promise.allSettled([
        fetchAllOrders(),
        fetchCategories('productCategories'),
        fetchCategories('retailCategories'),
      ]);

      if (o.status === 'fulfilled') {
        setOrders(o.value);
      } else {
        console.error('Orders load error:', o.reason);
        setOrders([]);
      }

      const pressOns = pc.status === 'fulfilled' ? pc.value : [];
      const retail = rc.status === 'fulfilled' ? rc.value : [];
      setPressOnCategories(pressOns.length > 0 ? pressOns : staticPressOns);
      setRetailCategories(retail.length > 0 ? retail : staticRetail);
    } catch (err) {
      console.error('Admin data load error:', err);
      setPressOnCategories(staticPressOns);
      setRetailCategories(staticRetail);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const renderSection = () => {
    switch (section) {
      case 'dashboard':
        return (
          <DashboardSection
            orders={orders}
            pressOnCategories={pressOnCategories}
            retailCategories={retailCategories}
            loading={loading}
          />
        );
      case 'orders':
        return <OrdersSection orders={orders} loading={loading} onRefresh={loadData} />;
      case 'appointments':
        return <AppointmentsSection orders={orders} loading={loading} onRefresh={loadData} />;
      case 'pressons':
        return (
          <ProductsSection
            collectionName="productCategories"
            categories={pressOnCategories}
            loading={loading}
            onRefresh={loadData}
            type="presson"
          />
        );
      case 'retail':
        return (
          <ProductsSection
            collectionName="retailCategories"
            categories={retailCategories}
            loading={loading}
            onRefresh={loadData}
            type="retail"
          />
        );
      default:
        return null;
    }
  };

  return (
    <AdminGuard>
      <Box sx={{ display: 'flex', minHeight: '100vh', minWidth: 'fit-content', backgroundColor: '#f5f5f5' }}>
        <AdminSidebar
          active={section}
          onSelect={setSection}
          mobileOpen={mobileOpen}
          onMobileClose={() => setMobileOpen(false)}
        />
        <Box
          sx={{
            flex: 1,
            ml: isMobile ? 0 : `${SIDEBAR_WIDTH}px`,
            p: { xs: 2, md: 3 },
            pt: { xs: 10, md: 11 },
            minHeight: '100vh',
            minWidth: 0,
          }}
        >
          {isMobile && (
            <IconButton onClick={() => setMobileOpen(true)} sx={{ mb: 1, color: '#4A0E4E' }}>
              <MenuIcon />
            </IconButton>
          )}
          {renderSection()}
        </Box>
      </Box>
    </AdminGuard>
  );
}
