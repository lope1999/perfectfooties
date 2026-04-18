import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Chip,
  Button,
  CircularProgress,
  LinearProgress,
  Tooltip,
} from '@mui/material';
import PrecisionManufacturingIcon from '@mui/icons-material/PrecisionManufacturing';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import { collectionGroup, getDocs } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { updateOrderStatus } from '../../lib/adminService';

const ff = '"Georgia", serif';
const PRODUCTION_DAYS = 14;
const QUEUE_STATUSES = new Set(['confirmed', 'production', 'in-progress']);

function getDisplayStatus(status) {
  return status === 'production' || status === 'in-progress' ? 'production' : status;
}

function getDaysRemaining(order) {
  const start = order.depositPaidAt?.toDate?.() || order.createdAt?.toDate?.() || new Date(order.createdAt || Date.now());
  const deadline = new Date(start);
  deadline.setDate(deadline.getDate() + PRODUCTION_DAYS);
  const now = new Date();
  return Math.ceil((deadline - now) / (1000 * 60 * 60 * 24));
}

function getUrgency(days) {
  if (days < 0) return 'overdue';
  if (days <= 2) return 'due-soon';
  return 'on-track';
}

const urgencyConfig = {
  'on-track':  { label: 'On Track',  color: '#10b981', bg: '#ecfdf5', border: '#a7f3d0' },
  'due-soon':  { label: 'Due Soon',  color: '#f59e0b', bg: '#fffbeb', border: '#fde68a' },
  'overdue':   { label: 'Overdue',   color: '#ef4444', bg: '#fff5f5', border: '#fca5a5' },
};

export default function ProductionTrackerSection() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [markingId, setMarkingId] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      // No where() on collectionGroup — filter client-side to avoid needing a composite index
      const snap = await getDocs(collectionGroup(db, 'orders'));
      const docs = snap.docs
        .map((d) => {
          const parentPath = d.ref.parent.parent?.path || '';
          const uid = parentPath.startsWith('users/') ? parentPath.split('/')[1] : d.data().uid || null;
          return { id: d.id, uid, ...d.data() };
        })
        .filter((o) => QUEUE_STATUSES.has(o.status));
      // Sort: overdue first, then due-soon, then on-track; within each group, least days first
      docs.sort((a, b) => {
        const da = getDaysRemaining(a);
        const db2 = getDaysRemaining(b);
        const ua = getUrgency(da);
        const ub = getUrgency(db2);
        const order = ['overdue', 'due-soon', 'on-track'];
        const diff = order.indexOf(ua) - order.indexOf(ub);
        if (diff !== 0) return diff;
        return da - db2;
      });
      setOrders(docs);
    } catch (err) {
      console.error('ProductionTracker load error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleMarkShipped = async (order) => {
    setMarkingId(order.id);
    try {
      await updateOrderStatus(order.uid, order.id, 'shipped');
      await load();
    } catch (err) {
      console.error(err);
    } finally {
      setMarkingId(null);
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
        <PrecisionManufacturingIcon sx={{ color: '#e3242b', fontSize: 28 }} />
        <Box>
          <Typography sx={{ fontFamily: ff, fontWeight: 700, fontSize: '1.4rem', color: 'var(--text-main)' }}>
            Production Queue
          </Typography>
          <Typography sx={{ color: '#999', fontSize: '0.82rem' }}>
            Orders in progress — 14-day production window
          </Typography>
        </Box>
      </Box>

      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress sx={{ color: '#e3242b' }} />
        </Box>
      )}

      {!loading && orders.length === 0 && (
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <CheckCircleOutlineIcon sx={{ fontSize: 48, color: '#10b981', mb: 1 }} />
          <Typography sx={{ fontFamily: ff, fontWeight: 700, color: '#10b981', fontSize: '1.1rem' }}>
            Queue is clear!
          </Typography>
          <Typography sx={{ color: '#999', fontSize: '0.88rem' }}>
            No confirmed or in-production orders.
          </Typography>
        </Box>
      )}

      {!loading && orders.map((order) => {
        const displayStatus = getDisplayStatus(order.status);
        const daysLeft = getDaysRemaining(order);
        const urgency = getUrgency(daysLeft);
        const cfg = urgencyConfig[urgency];
        const progressPct = Math.max(0, Math.min(100, ((PRODUCTION_DAYS - daysLeft) / PRODUCTION_DAYS) * 100));
        const start = order.depositPaidAt?.toDate?.() || order.createdAt?.toDate?.() || new Date();
        const itemName = order.items?.[0]?.name || order.customerName || 'Order';
        const isMarking = markingId === order.id;

        return (
          <Box
            key={order.id}
            sx={{
              mb: 2,
              p: 2.5,
              borderRadius: 3,
              border: `1px solid ${cfg.border}`,
              backgroundColor: cfg.bg,
            }}
          >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 1, mb: 1 }}>
              <Box>
                <Typography sx={{ fontFamily: ff, fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)' }}>
                  {order.customerName || 'Unknown'}
                </Typography>
                <Typography sx={{ fontSize: '0.78rem', color: '#888' }}>
                  #{order.id.slice(0, 8)} · {itemName}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Chip
                  label={displayStatus === 'confirmed' ? 'Confirmed' : 'In Production'}
                  size="small"
                  sx={{ backgroundColor: displayStatus === 'confirmed' ? '#dbeafe' : '#ede9fe', color: displayStatus === 'confirmed' ? '#1d4ed8' : '#6d28d9', fontSize: '0.72rem', fontWeight: 700 }}
                />
                <Chip
                  icon={urgency === 'overdue' ? <WarningAmberIcon sx={{ fontSize: '0.9rem !important' }} /> : undefined}
                  label={cfg.label}
                  size="small"
                  sx={{ backgroundColor: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`, fontSize: '0.72rem', fontWeight: 700 }}
                />
              </Box>
            </Box>

            <Box sx={{ mb: 1 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography sx={{ fontSize: '0.75rem', color: '#666' }}>
                  Started: {start.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                </Typography>
                <Typography sx={{ fontSize: '0.75rem', fontWeight: 700, color: cfg.color }}>
                  {daysLeft < 0 ? `${Math.abs(daysLeft)} day${Math.abs(daysLeft) !== 1 ? 's' : ''} overdue` : daysLeft === 0 ? 'Due today!' : `${daysLeft} day${daysLeft !== 1 ? 's' : ''} left`}
                </Typography>
              </Box>
              <Tooltip title={`${Math.round(progressPct)}% of 14-day window used`}>
                <LinearProgress
                  variant="determinate"
                  value={progressPct}
                  sx={{
                    height: 6,
                    borderRadius: 3,
                    backgroundColor: '#e5e7eb',
                    '& .MuiLinearProgress-bar': { backgroundColor: cfg.color, borderRadius: 3 },
                  }}
                />
              </Tooltip>
            </Box>

            <Box sx={{ display: 'flex', gap: 1, mt: 1.5, flexWrap: 'wrap' }}>
              <Button
                size="small"
                variant="contained"
                startIcon={isMarking ? <CircularProgress size={12} sx={{ color: '#fff' }} /> : <LocalShippingIcon sx={{ fontSize: 14 }} />}
                disabled={isMarking}
                onClick={() => handleMarkShipped(order)}
                sx={{ borderRadius: 20, backgroundColor: '#e3242b', fontSize: '0.75rem', fontWeight: 700, fontFamily: ff, '&:hover': { backgroundColor: '#b81b21' } }}
              >
                Mark Shipped
              </Button>
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}
