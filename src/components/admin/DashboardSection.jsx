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
import { parseAppointmentDate, isWithinHours, isUpcoming, formatRelativeTime } from '../../lib/appointmentDateUtils';

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

  // Compute upcoming appointments from service orders
  const upcomingAppointments = orders
    .filter((o) => o.type === 'service' && o.status !== 'cancelled' && o.status !== 'completed')
    .map((o) => {
      const dateStr = o.appointmentDate || o.items?.[0]?.date;
      const parsed = parseAppointmentDate(dateStr);
      return parsed && isUpcoming(parsed) ? { ...o, parsedDate: parsed, dateStr } : null;
    })
    .filter(Boolean)
    .sort((a, b) => a.parsedDate - b.parsedDate);

  const imminentAppointments = upcomingAppointments.filter((a) => isWithinHours(a.parsedDate, 24));

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
            value={`₦${stats.revenue.toLocaleString()}`}
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

      {imminentAppointments.length > 0 && (
        <Alert severity="error" sx={{ mb: 2, fontFamily }}>
          <strong>{imminentAppointments.length} appointment(s) within 24 hours:</strong>
          <ul style={{ margin: '4px 0 0', paddingLeft: 20 }}>
            {imminentAppointments.map((a) => (
              <li key={a.id}>
                {a.customerName || a.name || 'Customer'} — {a.dateStr} ({formatRelativeTime(a.parsedDate)})
              </li>
            ))}
          </ul>
        </Alert>
      )}

      {upcomingAppointments.length > 0 && (
        <Alert severity="info" sx={{ mb: 3, fontFamily }}>
          <strong>{upcomingAppointments.length} upcoming appointment(s):</strong>
          <ul style={{ margin: '4px 0 0', paddingLeft: 20 }}>
            {upcomingAppointments.slice(0, 5).map((a) => (
              <li key={a.id}>
                {a.customerName || a.name || 'Customer'} — {a.dateStr} ({formatRelativeTime(a.parsedDate)})
              </li>
            ))}
            {upcomingAppointments.length > 5 && (
              <li>…and {upcomingAppointments.length - 5} more</li>
            )}
          </ul>
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
                <TableCell sx={{ fontFamily }}>₦{(o.total || 0).toLocaleString()}</TableCell>
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
