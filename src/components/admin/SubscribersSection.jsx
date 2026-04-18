import { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Skeleton, IconButton,
  Tooltip, Snackbar, Alert, Chip, TextField, InputAdornment,
} from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import SearchIcon from '@mui/icons-material/Search';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { collection, getDocs, deleteDoc, doc, orderBy, query } from 'firebase/firestore';
import { db } from '../../lib/firebase';

const fontFamily = '"Georgia", serif';

function fmtDate(ts) {
  if (!ts) return '—';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function SubscribersSection() {
  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' });

  const load = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(query(collection(db, 'subscribers'), orderBy('subscribedAt', 'desc')));
      setSubscribers(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch (err) {
      setSnack({ open: true, message: 'Failed to load subscribers', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleDelete = async (id, email) => {
    if (!window.confirm(`Remove ${email} from the newsletter list?`)) return;
    try {
      await deleteDoc(doc(db, 'subscribers', id));
      setSubscribers((prev) => prev.filter((s) => s.id !== id));
      setSnack({ open: true, message: 'Subscriber removed', severity: 'success' });
    } catch {
      setSnack({ open: true, message: 'Failed to remove subscriber', severity: 'error' });
    }
  };

  const copyAll = () => {
    const emails = filtered.map((s) => s.email).join(', ');
    navigator.clipboard.writeText(emails).then(() =>
      setSnack({ open: true, message: `${filtered.length} emails copied to clipboard`, severity: 'success' })
    );
  };

  const filtered = subscribers.filter((s) =>
    s.email?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <MailOutlineIcon sx={{ color: '#007a7a' }} />
          <Typography variant="h5" sx={{ fontFamily, fontWeight: 700 }}>
            Newsletter Subscribers
          </Typography>
          <Chip
            label={subscribers.length}
            size="small"
            sx={{ background: '#007a7a', color: '#fff', fontWeight: 700, fontFamily }}
          />
        </Box>
        <Tooltip title="Copy all visible emails to clipboard">
          <IconButton
            onClick={copyAll}
            disabled={filtered.length === 0}
            sx={{ border: '1px solid #e8d5b0', borderRadius: 2, gap: 0.5, px: 1.5, fontSize: '0.8rem', fontFamily }}
          >
            <ContentCopyIcon sx={{ fontSize: 18 }} />
            <Typography sx={{ fontFamily, fontSize: '0.8rem', ml: 0.5 }}>Copy Emails</Typography>
          </IconButton>
        </Tooltip>
      </Box>

      <TextField
        placeholder="Search by email…"
        size="small"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        sx={{ mb: 2, width: { xs: '100%', sm: 320 } }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start">
              <SearchIcon sx={{ fontSize: 18, color: '#aaa' }} />
            </InputAdornment>
          ),
        }}
      />

      {loading ? (
        <Box>
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} variant="rounded" height={48} sx={{ mb: 1, borderRadius: 2 }} />
          ))}
        </Box>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: 3, border: '1px solid #e8d5b0' }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ backgroundColor: '#007a7a' }}>
                {['#', 'Email', 'Subscribed', 'Remove'].map((h) => (
                  <TableCell key={h} sx={{ color: '#fff', fontFamily, fontWeight: 700, fontSize: '0.82rem' }}>
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((s, idx) => (
                <TableRow key={s.id} hover sx={{ '&:hover': { bgcolor: '#f9f5ee' } }}>
                  <TableCell sx={{ fontFamily, fontSize: '0.75rem', color: '#bbb', width: 32 }}>
                    {idx + 1}
                  </TableCell>
                  <TableCell sx={{ fontFamily, fontSize: '0.88rem' }}>{s.email}</TableCell>
                  <TableCell sx={{ fontFamily, fontSize: '0.82rem', color: '#888' }}>
                    {fmtDate(s.subscribedAt)}
                  </TableCell>
                  <TableCell>
                    <Tooltip title="Remove subscriber">
                      <IconButton size="small" onClick={() => handleDelete(s.id, s.email)} sx={{ color: '#e3242b' }}>
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} sx={{ textAlign: 'center', fontFamily, py: 4, color: '#bbb' }}>
                    {search ? 'No subscribers match your search' : 'No subscribers yet'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Snackbar open={snack.open} autoHideDuration={3500} onClose={() => setSnack((s) => ({ ...s, open: false }))}>
        <Alert severity={snack.severity} onClose={() => setSnack((s) => ({ ...s, open: false }))}>
          {snack.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
