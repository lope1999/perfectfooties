import {
  Box,
  Typography,
  Paper,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Skeleton,
  Alert,
} from '@mui/material';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { computeDashboardStats, findLowStockProducts } from '../../lib/adminService';

const fontFamily = '"Georgia", serif';

function StatCard({ title, value, icon, color }) {
  return (
    <Paper sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2, borderRadius: 2 }}>
      <Box
        sx={{
          width: 50,
          height: 50,
          borderRadius: '50%',
          backgroundColor: `${color}20`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color,
        }}
      >
        {icon}
      </Box>
      <Box>
        <Typography sx={{ fontFamily, fontSize: '0.85rem', color: '#777' }}>{title}</Typography>
        <Typography sx={{ fontFamily, fontWeight: 700, fontSize: '1.5rem' }}>{value}</Typography>
      </Box>
    </Paper>
  );
}

const statusColor = {
  pending: 'warning',
  confirmed: 'info',
  completed: 'success',
  cancelled: 'error',
};

export default function DashboardSection({ orders, pressOnCategories, retailCategories, loading }) {
  if (loading) {
    return (
      <Box>
        <Typography variant="h5" sx={{ fontFamily, fontWeight: 700, mb: 3 }}>
          Dashboard
        </Typography>
        <Grid container spacing={3}>
          {[1, 2, 3, 4].map((i) => (
            <Grid item xs={12} sm={6} md={3} key={i}>
              <Skeleton variant="rounded" height={100} />
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  }

  const stats = computeDashboardStats(orders);
  const allCategories = [...pressOnCategories, ...retailCategories];
  const lowStock = findLowStockProducts(allCategories);
  const recentOrders = orders.slice(0, 10);

  return (
    <Box>
      <Typography variant="h5" sx={{ fontFamily, fontWeight: 700, mb: 3 }}>
        Dashboard
      </Typography>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Total Orders" value={stats.total} icon={<ShoppingCartIcon />} color="#4A0E4E" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Revenue"
            value={`$${stats.revenue.toFixed(2)}`}
            icon={<AttachMoneyIcon />}
            color="#2e7d32"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard title="Pending" value={stats.pending} icon={<PendingActionsIcon />} color="#ed6c02" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatCard
            title="Low Stock Items"
            value={lowStock.length}
            icon={<WarningAmberIcon />}
            color="#d32f2f"
          />
        </Grid>
      </Grid>

      {lowStock.length > 0 && (
        <Alert severity="warning" sx={{ mb: 3, fontFamily }}>
          <strong>{lowStock.length} product(s)</strong> are low in stock:{' '}
          {lowStock.map((p) => `${p.name} (${p.stock} left)`).join(', ')}
        </Alert>
      )}

      <Typography variant="h6" sx={{ fontFamily, fontWeight: 700, mb: 2 }}>
        Recent Orders
      </Typography>
      <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ backgroundColor: '#4A0E4E' }}>
              {['Order ID', 'Customer', 'Type', 'Status', 'Total', 'Date'].map((h) => (
                <TableCell key={h} sx={{ color: '#fff', fontFamily, fontWeight: 700 }}>
                  {h}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {recentOrders.map((o) => (
              <TableRow key={o.id} hover>
                <TableCell sx={{ fontFamily, fontSize: '0.8rem' }}>{o.id.slice(0, 8)}...</TableCell>
                <TableCell sx={{ fontFamily }}>{o.customerName || o.name || '—'}</TableCell>
                <TableCell sx={{ fontFamily }}>
                  <Chip label={o.type || '—'} size="small" />
                </TableCell>
                <TableCell>
                  <Chip
                    label={o.status || 'pending'}
                    size="small"
                    color={statusColor[o.status] || 'default'}
                  />
                </TableCell>
                <TableCell sx={{ fontFamily }}>${(o.total || 0).toFixed(2)}</TableCell>
                <TableCell sx={{ fontFamily, fontSize: '0.8rem' }}>
                  {o.createdAt?.toDate ? o.createdAt.toDate().toLocaleDateString() : '—'}
                </TableCell>
              </TableRow>
            ))}
            {recentOrders.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} sx={{ textAlign: 'center', fontFamily, py: 3 }}>
                  No orders yet
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
