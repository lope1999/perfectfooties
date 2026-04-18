import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box, Typography, Container, Button, Chip, Divider,
  CircularProgress, IconButton,
} from '@mui/material';
import ArrowBackIosNewIcon from '@mui/icons-material/ArrowBackIosNew';
import DownloadIcon from '@mui/icons-material/Download';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import RadioButtonUncheckedIcon from '@mui/icons-material/RadioButtonUnchecked';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { generateReceiptHtml, openReceiptWindow } from '../lib/receiptTemplate';

const ff = '"Georgia", serif';

const STATUS_STEPS = [
  { key: 'pending',    label: 'Order Placed',        color: '#f59e0b' },
  { key: 'confirmed',  label: 'Payment Confirmed',   color: '#3b82f6' },
  { key: 'production', label: 'In Production',       color: '#8b5cf6' },
  { key: 'shipped',    label: 'Shipped',             color: '#06b6d4' },
  { key: 'received',   label: 'Delivered',           color: '#10b981' },
];

const STATUS_COLOR = {
  pending: '#f59e0b', confirmed: '#3b82f6', production: '#8b5cf6',
  shipped: '#06b6d4', delivered: '#10b981', received: '#10b981',
  completed: '#10b981', cancelled: '#ef4444',
};

function fmt(n) {
  return `₦${Number(n || 0).toLocaleString()}`;
}

function fmtTs(ts) {
  if (!ts) return null;
  const d = ts.toDate ? ts.toDate() : (ts instanceof Date ? ts : new Date(ts));
  if (isNaN(d)) return null;
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) +
    ' · ' + d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
}

function printReceipt(order) {
  const shipping = order.shipping || {};
  const html = generateReceiptHtml({
    orderId: order.id,
    customerName: order.customerName,
    email: order.email,
    status: order.status,
    paymentReference: order.paymentReference,
    items: order.items || [],
    giftCardDiscount: order.giftCardDiscount || 0,
    referralDiscount: order.referralDiscount || 0,
    loyaltyDiscount: order.loyaltyDiscount || 0,
    shipping,
    shippingFee: order.shippingCost || shipping.fee || 0,
    extraCharge: order.extraCharge || 0,
    total: order.total,
    finalTotal: order.finalTotal,
    type: order.type,
    createdAtLabel: fmtTs(order.createdAt),
    logoUrl: `${window.location.origin}/images/logo.png`,
  });
  openReceiptWindow(html);
}

export default function OrderDetailPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) { navigate('/account'); return; }
    getDoc(doc(db, 'users', user.uid, 'orders', orderId))
      .then((snap) => {
        if (snap.exists()) setOrder({ id: snap.id, ...snap.data() });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user, orderId, navigate]);

  if (loading) {
    return <Box sx={{ pt: 16, textAlign: 'center' }}><CircularProgress sx={{ color: '#e3242b' }} /></Box>;
  }
  if (!order) {
    return (
      <Box sx={{ pt: 16, textAlign: 'center' }}>
        <Typography sx={{ color: '#999' }}>Order not found.</Typography>
        <Button onClick={() => navigate('/account#orders')} sx={{ mt: 2 }}>Back to Orders</Button>
      </Box>
    );
  }

  const isCancelled = order.status === 'cancelled';
  const statusColor = STATUS_COLOR[order.status] || '#999';

  // Build timeline: merge fixed steps with any statusHistory entries
  const historyMap = {};
  if (order.statusHistory?.length) {
    order.statusHistory.forEach((h) => { historyMap[h.status] = h.at; });
  }
  if (order.createdAt) historyMap['pending'] = historyMap['pending'] || order.createdAt;
  if (order.depositPaidAt) historyMap['confirmed'] = historyMap['confirmed'] || order.depositPaidAt;

  const stepsReached = STATUS_STEPS.filter((s) => historyMap[s.key] || s.key === order.status ||
    STATUS_STEPS.findIndex((x) => x.key === order.status) >= STATUS_STEPS.findIndex((x) => x.key === s.key));

  return (
    <Box sx={{ pt: 12, pb: { xs: 12, md: 8 } }}>
      <Container maxWidth="sm">

        {/* Back */}
        <Button
          startIcon={<ArrowBackIosNewIcon sx={{ fontSize: '0.75rem !important' }} />}
          onClick={() => navigate('/account#orders')}
          sx={{
            fontFamily: ff, fontWeight: 600, fontSize: '0.85rem',
            color: 'var(--text-muted)', textTransform: 'none',
            px: 1.5, py: 0.6, borderRadius: '20px',
            border: '1px solid #eee', backgroundColor: 'var(--bg-card)', mb: 3,
            '&:hover': { borderColor: '#e3242b', color: '#e3242b' },
          }}
        >
          My Orders
        </Button>

        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3, flexWrap: 'wrap', gap: 1 }}>
          <Box>
            <Typography sx={{ fontFamily: ff, fontWeight: 700, fontSize: '1.4rem', color: 'var(--text-main)' }}>
              Order #{order.id?.slice(-6).toUpperCase()}
            </Typography>
            <Typography sx={{ fontSize: '0.8rem', color: '#888', mt: 0.3 }}>
              Placed {fmtTs(order.createdAt) || '—'}
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', flexWrap: 'wrap' }}>
            <Chip
              label={(order.status?.charAt(0).toUpperCase() + order.status?.slice(1)) || 'Pending'}
              size="small"
              sx={{ backgroundColor: statusColor + '22', color: statusColor, fontWeight: 700, fontSize: '0.75rem', borderRadius: 2 }}
            />
            <Button
              size="small"
              startIcon={<DownloadIcon sx={{ fontSize: '0.9rem !important' }} />}
              onClick={() => printReceipt(order)}
              sx={{
                borderRadius: '20px', fontFamily: ff, fontWeight: 600, fontSize: '0.78rem',
                textTransform: 'none', color: 'var(--text-muted)', border: '1px solid #E8D5B0',
                px: 1.5, py: 0.5,
                '&:hover': { borderColor: '#e3242b', color: '#e3242b' },
              }}
            >
              Receipt
            </Button>
          </Box>
        </Box>

        {/* Items */}
        <Box sx={{ p: 2.5, border: '1px solid #E8D5B0', borderRadius: 3, backgroundColor: '#fff', mb: 2.5 }}>
          <Typography sx={{ fontFamily: ff, fontWeight: 700, fontSize: '0.85rem', color: '#e3242b', textTransform: 'uppercase', letterSpacing: 1, mb: 1.5 }}>
            Items Ordered
          </Typography>
          {(order.items || []).map((item, i) => (
            <Box key={i} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.8, borderBottom: i < order.items.length - 1 ? '1px solid #f5ece0' : 'none' }}>
              <Box>
                <Typography sx={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-main)' }}>
                  {item.name || 'Item'}{item.quantity > 1 ? ` ×${item.quantity}` : ''}
                </Typography>
                {item.selectedColor && (
                  <Typography sx={{ fontSize: '0.75rem', color: '#888' }}>Colour: {item.selectedColor}</Typography>
                )}
                {item.euSize && (
                  <Typography sx={{ fontSize: '0.75rem', color: '#888' }}>Size: EU {item.euSize}</Typography>
                )}
              </Box>
              <Typography sx={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-main)', whiteSpace: 'nowrap', ml: 1 }}>
                {fmt(item.price)}
              </Typography>
            </Box>
          ))}
          <Divider sx={{ my: 1.5, borderColor: '#E8D5B0' }} />
          {order.subtotal && order.shippingCost ? (
            <>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                <Typography sx={{ fontSize: '0.85rem', color: '#888' }}>Subtotal</Typography>
                <Typography sx={{ fontSize: '0.85rem', color: '#555' }}>{fmt(order.subtotal)}</Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography sx={{ fontSize: '0.85rem', color: '#888' }}>Shipping</Typography>
                <Typography sx={{ fontSize: '0.85rem', color: '#555' }}>{fmt(order.shippingCost)}</Typography>
              </Box>
            </>
          ) : null}
          {order.referralDiscount > 0 && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography sx={{ fontSize: '0.85rem', color: '#2e7d32' }}>Referral discount</Typography>
              <Typography sx={{ fontSize: '0.85rem', color: '#2e7d32' }}>−{fmt(order.referralDiscount)}</Typography>
            </Box>
          )}
          {order.loyaltyDiscount > 0 && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography sx={{ fontSize: '0.85rem', color: '#B8860B' }}>Loyalty reward</Typography>
              <Typography sx={{ fontSize: '0.85rem', color: '#B8860B' }}>−{fmt(order.loyaltyDiscount)}</Typography>
            </Box>
          )}
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Typography sx={{ fontWeight: 700, fontSize: '0.95rem' }}>Total Paid</Typography>
            <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: '#e3242b' }}>{fmt(order.total)}</Typography>
          </Box>
        </Box>

        {/* Status timeline */}
        {!isCancelled && (
          <Box sx={{ p: 2.5, border: '1px solid #E8D5B0', borderRadius: 3, backgroundColor: '#fff', mb: 2.5 }}>
            <Typography sx={{ fontFamily: ff, fontWeight: 700, fontSize: '0.85rem', color: '#e3242b', textTransform: 'uppercase', letterSpacing: 1, mb: 2 }}>
              Order Timeline
            </Typography>
            <Box sx={{ position: 'relative', pl: 3 }}>
              {/* Vertical line */}
              <Box sx={{ position: 'absolute', left: 9, top: 8, bottom: 8, width: 2, backgroundColor: '#E8D5B0' }} />
              {STATUS_STEPS.map((step) => {
                const ts = historyMap[step.key];
                const currentIdx = STATUS_STEPS.findIndex((s) => s.key === order.status);
                const stepIdx = STATUS_STEPS.findIndex((s) => s.key === step.key);
                const reached = stepIdx <= currentIdx;
                return (
                  <Box key={step.key} sx={{ display: 'flex', alignItems: 'flex-start', mb: 2.5, position: 'relative' }}>
                    <Box sx={{
                      position: 'absolute', left: -24, top: 2,
                      width: 18, height: 18, borderRadius: '50%',
                      backgroundColor: reached ? step.color : '#fff',
                      border: `2px solid ${reached ? step.color : '#E8D5B0'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      zIndex: 1,
                    }}>
                      {reached && <Box sx={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#fff' }} />}
                    </Box>
                    <Box>
                      <Typography sx={{ fontWeight: reached ? 700 : 400, fontSize: '0.88rem', color: reached ? 'var(--text-main)' : '#bbb' }}>
                        {step.label}
                      </Typography>
                      {ts && (
                        <Typography sx={{ fontSize: '0.75rem', color: '#aaa', mt: 0.2 }}>
                          {fmtTs(ts)}
                        </Typography>
                      )}
                      {!ts && reached && step.key === order.status && (
                        <Typography sx={{ fontSize: '0.75rem', color: '#aaa', mt: 0.2 }}>In progress</Typography>
                      )}
                    </Box>
                  </Box>
                );
              })}
            </Box>
          </Box>
        )}

        {isCancelled && (
          <Box sx={{ p: 2, mb: 2.5, borderRadius: 3, backgroundColor: '#fff5f5', border: '1px solid #fecaca' }}>
            <Typography sx={{ fontWeight: 700, color: '#ef4444', fontSize: '0.9rem' }}>
              This order was cancelled.
            </Typography>
            {historyMap['cancelled'] && (
              <Typography sx={{ fontSize: '0.78rem', color: '#aaa', mt: 0.3 }}>
                {fmtTs(historyMap['cancelled'])}
              </Typography>
            )}
          </Box>
        )}

        {/* Fez tracking */}
        {order.status === 'shipped' && order.trackingLink && (
          <Box sx={{ p: 2, mb: 2.5, borderRadius: 3, backgroundColor: '#f0faff', border: '1px solid #bae6fd', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 1, flexWrap: 'wrap' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <LocalShippingOutlinedIcon sx={{ color: '#0369a1', fontSize: 18 }} />
              <Typography sx={{ fontSize: '0.82rem', color: '#0369a1', fontWeight: 600 }}>Handled by Fez Delivery</Typography>
            </Box>
            <Button
              size="small"
              variant="contained"
              href={order.trackingLink}
              target="_blank"
              rel="noopener noreferrer"
              sx={{ borderRadius: 20, backgroundColor: '#0369a1', fontSize: '0.75rem', '&:hover': { backgroundColor: '#0284c7' } }}
            >
              Track Package
            </Button>
          </Box>
        )}

        {/* Delivery details */}
        {order.shipping && (
          <Box sx={{ p: 2.5, border: '1px solid #E8D5B0', borderRadius: 3, backgroundColor: '#fff', mb: 2.5 }}>
            <Typography sx={{ fontFamily: ff, fontWeight: 700, fontSize: '0.85rem', color: '#e3242b', textTransform: 'uppercase', letterSpacing: 1, mb: 1.5 }}>
              Delivery Details
            </Typography>
            {[
              ['Name',    order.shipping.name],
              ['Phone',   order.shipping.phone],
              ['Address', order.shipping.address],
              ['LGA',     order.shipping.lga],
              ['State',   order.shipping.state],
              ...(order.shipping.country && order.shipping.country !== 'Nigeria' ? [['Country', order.shipping.country]] : []),
            ].filter(([, v]) => v).map(([label, value]) => (
              <Box key={label} sx={{ display: 'flex', gap: 1.5, mb: 0.8 }}>
                <Typography sx={{ fontSize: '0.8rem', color: '#888', minWidth: 60 }}>{label}</Typography>
                <Typography sx={{ fontSize: '0.8rem', color: 'var(--text-main)', fontWeight: 500 }}>{value}</Typography>
              </Box>
            ))}
          </Box>
        )}

        {/* Payment reference */}
        {order.paymentReference && (
          <Box sx={{ px: 2, py: 1.5, border: '1px solid #E8D5B0', borderRadius: 2, mb: 2.5, backgroundColor: '#fafafa' }}>
            <Typography sx={{ fontSize: '0.75rem', color: '#aaa' }}>
              Payment ref: <span style={{ fontFamily: 'monospace', color: '#555' }}>{order.paymentReference}</span>
            </Typography>
          </Box>
        )}

        {/* Download receipt button (bottom) */}
        <Button
          fullWidth
          startIcon={<DownloadIcon />}
          onClick={() => printReceipt(order)}
          sx={{
            borderRadius: '30px', fontFamily: ff, fontWeight: 700, fontSize: '0.9rem',
            textTransform: 'none', py: 1.4,
            backgroundColor: 'transparent', color: '#e3242b',
            border: '1.5px solid #e3242b',
            '&:hover': { backgroundColor: '#e3242b', color: '#fff' },
          }}
        >
          Download Receipt
        </Button>

      </Container>
    </Box>
  );
}
