import { useEffect, useRef, useState } from 'react';
import {
  Box, Typography, Paper, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, Skeleton, IconButton,
  Tooltip, Snackbar, Alert, Chip, TextField, InputAdornment,
  Tabs, Tab, Button, Dialog, DialogTitle, DialogContent,
  DialogActions, CircularProgress, LinearProgress, Divider,
  useMediaQuery, useTheme,
} from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import SearchIcon from '@mui/icons-material/Search';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import AddIcon from '@mui/icons-material/Add';
import SendIcon from '@mui/icons-material/Send';
import EditIcon from '@mui/icons-material/Edit';
import DraftsIcon from '@mui/icons-material/Drafts';
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined';
import CloseIcon from '@mui/icons-material/Close';
import LinkIcon from '@mui/icons-material/Link';
import { collection, getDocs, deleteDoc, doc, orderBy, query, addDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { ref as storageRef, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../../lib/firebase';
import { sendNewsletterBatch } from '../../lib/emailService';

const ff = '"Georgia", serif';
const BRAND_RED = '#e3242b';
const BRAND_TEAL = '#007a7a';

function fmtDate(ts) {
  if (!ts) return '—';
  const d = ts.toDate ? ts.toDate() : new Date(ts);
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

// ── Live email preview ─────────────────────────────────────────────────────────
function EmailPreview({ draft }) {
  const paragraphs = (draft.bodyText || '').split('\n\n').filter(Boolean);

  return (
    <Box sx={{ bgcolor: '#f0ece6', p: { xs: 1.5, md: 2 }, borderRadius: 2, minHeight: 400 }}>
      {/* inbox preview hint */}
      {draft.subject && (
        <Box sx={{ mb: 1.5, p: 1.5, bgcolor: '#fff', borderRadius: 1.5, border: '1px solid #e0d5c8' }}>
          <Typography sx={{ fontFamily: ff, fontWeight: 700, fontSize: '0.82rem', color: '#333' }}>
            {draft.subject || '(no subject)'}
          </Typography>
          {draft.previewText && (
            <Typography sx={{ fontFamily: ff, fontSize: '0.74rem', color: '#888', mt: 0.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {draft.previewText}
            </Typography>
          )}
        </Box>
      )}

      {/* Email card */}
      <Box sx={{ bgcolor: '#fff', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 16px rgba(0,0,0,0.10)' }}>

        {/* Dark header */}
        <Box sx={{ background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)', p: '24px 20px', textAlign: 'center' }}>
          <Box sx={{ width: 60, height: 60, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.1)', mx: 'auto', mb: 1.2, display: 'flex', alignItems: 'center', justifyContent: 'center', p: '8px', overflow: 'hidden' }}>
            <Box component="img" src="/images/logo.png" alt="PF" sx={{ width: '100%', objectFit: 'contain' }} onError={(e) => { e.target.style.display = 'none'; }} />
          </Box>
          <Typography sx={{ fontFamily: ff, fontSize: '18px', fontWeight: 800, color: '#fff', letterSpacing: 1 }}>PerfectFooties</Typography>
          <Typography sx={{ fontFamily: ff, fontSize: '11px', color: BRAND_RED, fontStyle: 'italic', mt: 0.5 }}>Handcrafted leather goods, built to last</Typography>
        </Box>

        {/* Red accent bar */}
        <Box sx={{ height: 4, background: `linear-gradient(90deg, #b81b21, ${BRAND_RED}, #b81b21)` }} />

        {/* Email body */}
        <Box sx={{ p: '24px 20px' }}>
          {draft.previewText && (
            <Typography sx={{ fontFamily: 'Arial, sans-serif', fontSize: '12px', color: '#888', fontStyle: 'italic', mb: 1.5, pb: 1.5, borderBottom: '1px solid #E8D5B0' }}>
              {draft.previewText}
            </Typography>
          )}

          {draft.headline && (
            <Typography sx={{ fontFamily: ff, fontSize: '19px', fontWeight: 700, color: '#1a1a1a', mb: 2, lineHeight: 1.4 }}>
              {draft.headline}
            </Typography>
          )}

          {draft.imageUrl && (
            <Box component="img"
              src={draft.imageUrl}
              alt="Newsletter image"
              sx={{ width: '100%', borderRadius: '8px', mb: 2, display: 'block', maxHeight: 280, objectFit: 'cover' }}
              onError={(e) => { e.target.style.display = 'none'; }}
            />
          )}

          {paragraphs.length > 0
            ? paragraphs.map((p, i) => (
                <Typography key={i} sx={{ fontFamily: 'Arial, sans-serif', fontSize: '13.5px', color: '#444', lineHeight: 1.8, mb: 1.5 }}>
                  {p}
                </Typography>
              ))
            : (
                <Typography sx={{ fontFamily: 'Arial, sans-serif', fontSize: '13.5px', color: '#ccc', fontStyle: 'italic' }}>
                  Your message will appear here…
                </Typography>
              )
          }

          {draft.ctaText && (
            <Box sx={{ textAlign: 'center', mt: 2.5, mb: 1 }}>
              <Box component="span" sx={{ display: 'inline-block', background: BRAND_RED, color: '#fff', fontFamily: ff, fontSize: '13px', fontWeight: 700, px: 3, py: 1.4, borderRadius: '30px', cursor: 'default' }}>
                {draft.ctaText}
              </Box>
            </Box>
          )}
        </Box>

        {/* Footer */}
        <Box sx={{ bgcolor: '#FAFAFA', borderTop: '1px solid #E8D5B0', p: '16px 20px', textAlign: 'center' }}>
          <Typography sx={{ fontFamily: ff, fontSize: '12px', fontWeight: 700, color: '#1a1a1a', mb: 0.4 }}>PerfectFooties</Typography>
          <Typography sx={{ fontFamily: 'Arial, sans-serif', fontSize: '11px', color: '#999' }}>Instagram · perfectfooties.com</Typography>
          <Typography sx={{ fontFamily: 'Arial, sans-serif', fontSize: '10px', color: '#bbb', mt: 0.5, lineHeight: 1.6 }}>
            © 2026 PerfectFooties. You're receiving this because you subscribed.
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}

// ── Image uploader ─────────────────────────────────────────────────────────────
function ImageField({ imageUrl, onChange, onSnack }) {
  const [mode, setMode] = useState(imageUrl && !imageUrl.startsWith('blob') ? 'url' : 'upload');
  const [urlInput, setUrlInput] = useState(imageUrl || '');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const inputRef = useRef();

  const handleFile = (file) => {
    if (!file || !file.type.startsWith('image/')) {
      onSnack('Please select an image file', 'warning');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      onSnack('Image must be under 5 MB', 'warning');
      return;
    }
    setUploading(true);
    const path = `newsletters/${Date.now()}-${file.name}`;
    const sRef = storageRef(storage, path);
    const task = uploadBytesResumable(sRef, file);
    task.on('state_changed',
      (snap) => setProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100)),
      (err) => {
        console.error('Newsletter image upload error:', err);
        const message = err.code === 'storage/unauthorized'
          ? 'Permission denied for newsletter uploads. Check the Storage path, rules, and signed-in admin account.'
          : 'Upload failed';
        onSnack(message, 'error');
        setUploading(false);
      },
      async () => {
        const url = await getDownloadURL(task.snapshot.ref);
        onChange(url);
        setUploading(false);
        setProgress(0);
        onSnack('Image uploaded', 'success');
      }
    );
  };

  const handleDrop = (e) => {
    e.preventDefault();
    handleFile(e.dataTransfer.files[0]);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
        <Typography sx={{ fontFamily: ff, fontSize: '0.82rem', fontWeight: 700, color: '#555' }}>Newsletter Image</Typography>
        <Chip label="optional" size="small" sx={{ fontFamily: ff, fontSize: '0.68rem', bgcolor: '#f5f5f5', color: '#aaa' }} />
        <Box sx={{ flex: 1 }} />
        <Box sx={{ display: 'flex', border: '1px solid #e0d5c8', borderRadius: 1.5, overflow: 'hidden' }}>
          {[['upload', 'Upload File'], ['url', 'Paste URL']].map(([val, label]) => (
            <Box key={val} onClick={() => setMode(val)}
              sx={{ px: 1.5, py: 0.5, cursor: 'pointer', fontSize: '0.74rem', fontFamily: ff, bgcolor: mode === val ? BRAND_TEAL : 'transparent', color: mode === val ? '#fff' : '#888', transition: '0.2s' }}>
              {label}
            </Box>
          ))}
        </Box>
      </Box>

      {mode === 'upload' ? (
        <Box>
          {imageUrl ? (
            <Box sx={{ position: 'relative', borderRadius: 2, overflow: 'hidden', border: '1.5px solid #E8D5B0' }}>
              <Box component="img" src={imageUrl} alt="Newsletter image" sx={{ width: '100%', height: 140, objectFit: 'cover', display: 'block' }} />
              <Box sx={{ position: 'absolute', top: 6, right: 6, display: 'flex', gap: 0.5 }}>
                <IconButton size="small" onClick={() => inputRef.current?.click()}
                  sx={{ bgcolor: 'rgba(255,255,255,0.92)', '&:hover': { bgcolor: '#fff' } }}>
                  <EditIcon sx={{ fontSize: 15 }} />
                </IconButton>
                <IconButton size="small" onClick={() => onChange('')}
                  sx={{ bgcolor: 'rgba(255,255,255,0.92)', color: BRAND_RED, '&:hover': { bgcolor: '#fff' } }}>
                  <CloseIcon sx={{ fontSize: 15 }} />
                </IconButton>
              </Box>
            </Box>
          ) : (
            <Box
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => !uploading && inputRef.current?.click()}
              sx={{
                border: '2px dashed #e0d5c8', borderRadius: 2, p: 3, textAlign: 'center',
                cursor: uploading ? 'default' : 'pointer', bgcolor: '#faf8f5',
                '&:hover': { borderColor: BRAND_TEAL, bgcolor: '#f5faf9' }, transition: '0.2s',
              }}
            >
              {uploading ? (
                <Box>
                  <CircularProgress size={28} sx={{ color: BRAND_TEAL, mb: 1 }} />
                  <LinearProgress variant="determinate" value={progress} sx={{ borderRadius: 4, height: 6, bgcolor: '#e8d5b0', '& .MuiLinearProgress-bar': { bgcolor: BRAND_TEAL } }} />
                  <Typography sx={{ fontFamily: ff, fontSize: '0.78rem', color: '#888', mt: 1 }}>{progress}% uploaded…</Typography>
                </Box>
              ) : (
                <>
                  <ImageOutlinedIcon sx={{ fontSize: 36, color: '#ccc', mb: 1 }} />
                  <Typography sx={{ fontFamily: ff, fontSize: '0.82rem', color: '#888' }}>
                    Drag & drop or <span style={{ color: BRAND_TEAL, fontWeight: 700 }}>click to upload</span>
                  </Typography>
                  <Typography sx={{ fontFamily: ff, fontSize: '0.72rem', color: '#bbb', mt: 0.5 }}>JPG, PNG, WebP — max 5 MB</Typography>
                </>
              )}
            </Box>
          )}
          <input ref={inputRef} type="file" accept="image/*" hidden onChange={(e) => handleFile(e.target.files[0])} />
        </Box>
      ) : (
        <Box>
          <TextField
            fullWidth size="small"
            placeholder="https://example.com/image.jpg"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onBlur={() => onChange(urlInput.trim())}
            InputProps={{ startAdornment: <InputAdornment position="start"><LinkIcon sx={{ fontSize: 16, color: '#bbb' }} /></InputAdornment> }}
            sx={{ mb: urlInput ? 1.5 : 0 }}
          />
          {urlInput && (
            <Box sx={{ position: 'relative', borderRadius: 2, overflow: 'hidden', border: '1.5px solid #E8D5B0' }}>
              <Box component="img" src={urlInput} alt="Preview" sx={{ width: '100%', height: 130, objectFit: 'cover', display: 'block' }} onError={(e) => { e.target.style.display = 'none'; }} />
              <IconButton size="small" onClick={() => { setUrlInput(''); onChange(''); }}
                sx={{ position: 'absolute', top: 6, right: 6, bgcolor: 'rgba(255,255,255,0.92)', color: BRAND_RED }}>
                <CloseIcon sx={{ fontSize: 15 }} />
              </IconButton>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
}

// ── Compose dialog ─────────────────────────────────────────────────────────────
const EMPTY_DRAFT = {
  subject: '',
  previewText: '',
  headline: '',
  bodyText: '',
  imageUrl: '',
  ctaText: 'Shop Now',
  ctaUrl: 'https://perfectfooties.com/shop',
};

function ComposeDialog({ open, onClose, initial, onSaved, onSnack }) {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const [draft, setDraft] = useState(EMPTY_DRAFT);
  const [tab, setTab] = useState(0); // mobile only: 0=form, 1=preview
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setDraft(initial ? { ...EMPTY_DRAFT, ...initial } : EMPTY_DRAFT);
  }, [open, initial]);

  const set = (field) => (e) => setDraft((d) => ({ ...d, [field]: e.target.value }));

  const save = async (andSend = false) => {
    if (!draft.subject.trim()) { onSnack('Subject is required', 'warning'); return; }
    if (!draft.headline.trim()) { onSnack('Headline is required', 'warning'); return; }
    if (!draft.bodyText.trim()) { onSnack('Body text is required', 'warning'); return; }
    setSaving(true);
    try {
      const data = {
        subject: draft.subject,
        previewText: draft.previewText,
        headline: draft.headline,
        bodyText: draft.bodyText,
        imageUrl: draft.imageUrl || '',
        ctaText: draft.ctaText,
        ctaUrl: draft.ctaUrl,
        updatedAt: serverTimestamp(),
      };
      let id = draft.id;
      if (id) {
        await updateDoc(doc(db, 'newsletters', id), data);
      } else {
        const docRef = await addDoc(collection(db, 'newsletters'), { ...data, status: 'draft', sentCount: 0, createdAt: serverTimestamp() });
        id = docRef.id;
      }
      onSaved(id, andSend);
      onClose();
    } catch {
      onSnack('Failed to save draft', 'error');
    } finally {
      setSaving(false);
    }
  };

  const FormPanel = (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, p: { xs: 2, md: 3 }, overflowY: 'auto', flex: isDesktop ? '0 0 400px' : 1 }}>
      <Box>
        <Typography sx={{ fontFamily: ff, fontSize: '0.78rem', fontWeight: 700, color: '#555', mb: 0.6 }}>Subject Line <span style={{ color: BRAND_RED }}>*</span></Typography>
        <TextField fullWidth size="small" placeholder="e.g. New arrivals — The Heirloom Series" value={draft.subject} onChange={set('subject')} />
        <Typography sx={{ fontFamily: ff, fontSize: '0.7rem', color: '#aaa', mt: 0.5 }}>Shown in the recipient's inbox as the email subject.</Typography>
      </Box>

      <Box>
        <Typography sx={{ fontFamily: ff, fontSize: '0.78rem', fontWeight: 700, color: '#555', mb: 0.6 }}>Preview Text</Typography>
        <TextField fullWidth size="small" placeholder="e.g. Handcrafted for those who value quality…" value={draft.previewText} onChange={set('previewText')} />
        <Typography sx={{ fontFamily: ff, fontSize: '0.7rem', color: '#aaa', mt: 0.5 }}>Short teaser shown in the inbox before opening the email.</Typography>
      </Box>

      <Divider sx={{ borderColor: '#f0e8d8' }} />

      <Box>
        <Typography sx={{ fontFamily: ff, fontSize: '0.78rem', fontWeight: 700, color: '#555', mb: 0.6 }}>Headline <span style={{ color: BRAND_RED }}>*</span></Typography>
        <TextField fullWidth size="small" placeholder="e.g. The Heirloom Series Is Here" value={draft.headline} onChange={set('headline')} />
        <Typography sx={{ fontFamily: ff, fontSize: '0.7rem', color: '#aaa', mt: 0.5 }}>Large title at the top of the email body.</Typography>
      </Box>

      <ImageField
        imageUrl={draft.imageUrl}
        onChange={(url) => setDraft((d) => ({ ...d, imageUrl: url }))}
        onSnack={(msg, sev) => onSnack(msg, sev)}
      />

      <Box>
        <Typography sx={{ fontFamily: ff, fontSize: '0.78rem', fontWeight: 700, color: '#555', mb: 0.6 }}>Body Text <span style={{ color: BRAND_RED }}>*</span></Typography>
        <TextField
          fullWidth multiline rows={7}
          placeholder={"Write your message here.\n\nLeave a blank line between paragraphs — each becomes a new paragraph in the email.\n\nNo HTML needed."}
          value={draft.bodyText}
          onChange={set('bodyText')}
          inputProps={{ style: { fontFamily: 'Georgia, serif', fontSize: '0.88rem', lineHeight: 1.7 } }}
        />
        <Typography sx={{ fontFamily: ff, fontSize: '0.7rem', color: '#aaa', mt: 0.5 }}>Press Enter twice to start a new paragraph.</Typography>
      </Box>

      <Divider sx={{ borderColor: '#f0e8d8' }} />

      <Box>
        <Typography sx={{ fontFamily: ff, fontSize: '0.78rem', fontWeight: 700, color: '#555', mb: 1 }}>Call-to-Action Button</Typography>
        <Box sx={{ display: 'flex', gap: 1.5, flexDirection: 'column' }}>
          <TextField fullWidth size="small" label="Button text" placeholder="Shop Now" value={draft.ctaText} onChange={set('ctaText')} />
          {draft.ctaText && (
            <TextField fullWidth size="small" label="Button link (URL)" placeholder="https://perfectfooties.com/shop" value={draft.ctaUrl} onChange={set('ctaUrl')} />
          )}
        </Box>
        <Typography sx={{ fontFamily: ff, fontSize: '0.7rem', color: '#aaa', mt: 0.5 }}>Optional. Leave button text blank to omit the button.</Typography>
      </Box>
    </Box>
  );

  const PreviewPanel = (
    <Box sx={{ flex: 1, overflowY: 'auto', bgcolor: '#f7f3ee', p: { xs: 1.5, md: 2 }, borderLeft: isDesktop ? '1px solid #e8d5b0' : 'none' }}>
      <Typography sx={{ fontFamily: ff, fontSize: '0.75rem', fontWeight: 700, color: '#aaa', textTransform: 'uppercase', letterSpacing: 1, mb: 1.5, textAlign: 'center' }}>
        Live Preview
      </Typography>
      <EmailPreview draft={draft} />
    </Box>
  );

  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth PaperProps={{ sx: { borderRadius: 3, height: { md: '90vh' }, maxHeight: '95vh' } }}>
      <DialogTitle sx={{ fontFamily: ff, fontWeight: 700, borderBottom: '1px solid #E8D5B0', pb: 1.5, display: 'flex', alignItems: 'center', gap: 1 }}>
        <MailOutlineIcon sx={{ color: BRAND_TEAL, fontSize: 20 }} />
        {draft.id ? 'Edit Campaign' : 'New Campaign'}
        <Box sx={{ flex: 1 }} />
        {!isDesktop && (
          <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ minHeight: 0, '& .MuiTab-root': { minHeight: 0, py: 0.5, fontFamily: ff, fontSize: '0.78rem', textTransform: 'none' }, '& .Mui-selected': { color: BRAND_TEAL }, '& .MuiTabs-indicator': { bgcolor: BRAND_TEAL } }}>
            <Tab label="Edit" />
            <Tab label="Preview" />
          </Tabs>
        )}
      </DialogTitle>

      <DialogContent sx={{ p: 0, display: 'flex', overflow: 'hidden' }}>
        {isDesktop ? (
          <>
            {FormPanel}
            {PreviewPanel}
          </>
        ) : (
          <Box sx={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
            {tab === 0 ? FormPanel : <Box sx={{ p: 1.5 }}><EmailPreview draft={draft} /></Box>}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ borderTop: '1px solid #E8D5B0', px: 3, py: 1.5, gap: 1 }}>
        <Button onClick={onClose} sx={{ fontFamily: ff, textTransform: 'none', color: '#888' }}>Cancel</Button>
        <Box sx={{ flex: 1 }} />
        <Button onClick={() => save(false)} disabled={saving} startIcon={saving ? <CircularProgress size={14} /> : <DraftsIcon />}
          variant="outlined" sx={{ fontFamily: ff, textTransform: 'none', borderColor: BRAND_TEAL, color: BRAND_TEAL, '&:hover': { bgcolor: '#f0faf9' } }}>
          Save Draft
        </Button>
        <Button onClick={() => save(true)} disabled={saving}
          variant="contained" sx={{ fontFamily: ff, textTransform: 'none', bgcolor: BRAND_RED, '&:hover': { bgcolor: '#b81b21' } }}>
          Save & Send
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ── Subscribers tab ────────────────────────────────────────────────────────────
function SubscribersTab() {
  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' });

  const load = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(query(collection(db, 'subscribers'), orderBy('subscribedAt', 'desc')));
      setSubscribers(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch {
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

  const filtered = subscribers.filter((s) => s.email?.toLowerCase().includes(search.toLowerCase()));

  const copyAll = () => {
    navigator.clipboard.writeText(filtered.map((s) => s.email).join(', ')).then(() =>
      setSnack({ open: true, message: `${filtered.length} emails copied`, severity: 'success' })
    );
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="h6" sx={{ fontFamily: ff, fontWeight: 700 }}>Subscribers</Typography>
          <Chip label={subscribers.length} size="small" sx={{ bgcolor: BRAND_TEAL, color: '#fff', fontWeight: 700, fontFamily: ff }} />
        </Box>
        <Tooltip title="Copy all visible emails to clipboard">
          <IconButton onClick={copyAll} disabled={filtered.length === 0}
            sx={{ border: '1px solid #e8d5b0', borderRadius: 2, gap: 0.5, px: 1.5 }}>
            <ContentCopyIcon sx={{ fontSize: 18 }} />
            <Typography sx={{ fontFamily: ff, fontSize: '0.8rem', ml: 0.5 }}>Copy Emails</Typography>
          </IconButton>
        </Tooltip>
      </Box>

      <TextField
        placeholder="Search by email…"
        size="small"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        sx={{ mb: 2, width: { xs: '100%', sm: 320 } }}
        InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ fontSize: 18, color: '#aaa' }} /></InputAdornment> }}
      />

      {loading ? (
        <Box>{[1, 2, 3, 4].map((i) => <Skeleton key={i} variant="rounded" height={48} sx={{ mb: 1, borderRadius: 2 }} />)}</Box>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: 3, border: '1px solid #e8d5b0' }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: BRAND_TEAL }}>
                {['#', 'Email', 'Subscribed', 'Remove'].map((h) => (
                  <TableCell key={h} sx={{ color: '#fff', fontFamily: ff, fontWeight: 700, fontSize: '0.82rem' }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((s, idx) => (
                <TableRow key={s.id} hover sx={{ '&:hover': { bgcolor: '#f9f5ee' } }}>
                  <TableCell sx={{ fontFamily: ff, fontSize: '0.75rem', color: '#bbb', width: 32 }}>{idx + 1}</TableCell>
                  <TableCell sx={{ fontFamily: ff, fontSize: '0.88rem' }}>{s.email}</TableCell>
                  <TableCell sx={{ fontFamily: ff, fontSize: '0.82rem', color: '#888' }}>{fmtDate(s.subscribedAt)}</TableCell>
                  <TableCell>
                    <Tooltip title="Remove subscriber">
                      <IconButton size="small" onClick={() => handleDelete(s.id, s.email)} sx={{ color: BRAND_RED }}>
                        <DeleteOutlineIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} sx={{ textAlign: 'center', fontFamily: ff, py: 4, color: '#bbb' }}>
                    {search ? 'No subscribers match your search' : 'No subscribers yet'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Snackbar open={snack.open} autoHideDuration={3500} onClose={() => setSnack((s) => ({ ...s, open: false }))}>
        <Alert severity={snack.severity} onClose={() => setSnack((s) => ({ ...s, open: false }))}>{snack.message}</Alert>
      </Snackbar>
    </Box>
  );
}

// ── Campaigns tab ──────────────────────────────────────────────────────────────
function CampaignsTab() {
  const [campaigns, setCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [composeOpen, setComposeOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [sending, setSending] = useState(false);
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'success' });

  const loadCampaigns = async () => {
    setLoading(true);
    try {
      const snap = await getDocs(query(collection(db, 'newsletters'), orderBy('createdAt', 'desc')));
      setCampaigns(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    } catch {
      setSnack({ open: true, message: 'Failed to load campaigns', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadCampaigns(); }, []);

  const openCompose = (campaign = null) => {
    setEditTarget(campaign);
    setComposeOpen(true);
  };

  const handleSaved = async (id, andSend) => {
    await loadCampaigns();
    if (andSend) handleSendNow(id);
  };

  const handleSendNow = async (id) => {
    if (!window.confirm('Send this newsletter to all subscribers now? This cannot be undone.')) return;
    setSending(id);
    setSnack({ open: true, message: 'Sending newsletter to all subscribers…', severity: 'info' });
    const result = await sendNewsletterBatch(id);
    setSending(false);
    if (result.success) {
      setSnack({ open: true, message: `Sent to ${result.sentCount} subscribers!`, severity: 'success' });
      await loadCampaigns();
    } else {
      setSnack({ open: true, message: result.error || 'Send failed', severity: 'error' });
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this campaign?')) return;
    try {
      await deleteDoc(doc(db, 'newsletters', id));
      setCampaigns((prev) => prev.filter((c) => c.id !== id));
      setSnack({ open: true, message: 'Campaign deleted', severity: 'success' });
    } catch {
      setSnack({ open: true, message: 'Failed to delete', severity: 'error' });
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6" sx={{ fontFamily: ff, fontWeight: 700 }}>Email Campaigns</Typography>
        <Button startIcon={<AddIcon />} onClick={() => openCompose()} variant="contained"
          sx={{ bgcolor: BRAND_RED, fontFamily: ff, textTransform: 'none', borderRadius: 2, '&:hover': { bgcolor: '#b81b21' } }}>
          New Campaign
        </Button>
      </Box>

      {loading ? (
        <Box>{[1, 2, 3].map((i) => <Skeleton key={i} variant="rounded" height={64} sx={{ mb: 1, borderRadius: 2 }} />)}</Box>
      ) : campaigns.length === 0 ? (
        <Box sx={{ textAlign: 'center', py: 8, color: '#bbb', border: '2px dashed #e8d5b0', borderRadius: 3 }}>
          <DraftsIcon sx={{ fontSize: 52, mb: 1, opacity: 0.25 }} />
          <Typography sx={{ fontFamily: ff, fontSize: '0.92rem' }}>No campaigns yet</Typography>
          <Typography sx={{ fontFamily: ff, fontSize: '0.78rem', mt: 0.5 }}>Create your first newsletter to get started</Typography>
          <Button onClick={() => openCompose()} startIcon={<AddIcon />} variant="contained"
            sx={{ mt: 2, bgcolor: BRAND_RED, fontFamily: ff, textTransform: 'none', borderRadius: 2, '&:hover': { bgcolor: '#b81b21' } }}>
            New Campaign
          </Button>
        </Box>
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: 3, border: '1px solid #e8d5b0' }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: BRAND_TEAL }}>
                {['Campaign', 'Status', 'Sent', 'Date', 'Actions'].map((h) => (
                  <TableCell key={h} sx={{ color: '#fff', fontFamily: ff, fontWeight: 700, fontSize: '0.82rem' }}>{h}</TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {campaigns.map((c) => (
                <TableRow key={c.id} hover sx={{ '&:hover': { bgcolor: '#f9f5ee' } }}>
                  <TableCell sx={{ maxWidth: 240 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {c.imageUrl && <Box component="img" src={c.imageUrl} sx={{ width: 36, height: 36, borderRadius: 1, objectFit: 'cover', flexShrink: 0, border: '1px solid #e8d5b0' }} onError={(e) => { e.target.style.display = 'none'; }} />}
                      <Box sx={{ minWidth: 0 }}>
                        <Typography noWrap sx={{ fontFamily: ff, fontSize: '0.88rem', fontWeight: 700 }}>{c.headline || c.subject}</Typography>
                        <Typography noWrap sx={{ fontFamily: ff, fontSize: '0.74rem', color: '#999' }}>{c.subject}</Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={c.status === 'sent' ? 'Sent' : 'Draft'}
                      size="small"
                      sx={{ bgcolor: c.status === 'sent' ? 'rgba(0,150,80,0.1)' : '#FFF3CD', color: c.status === 'sent' ? '#006B38' : '#856404', fontWeight: 700, fontFamily: ff, fontSize: '0.72rem' }}
                    />
                  </TableCell>
                  <TableCell sx={{ fontFamily: ff, fontSize: '0.82rem', color: '#555' }}>
                    {c.status === 'sent' ? c.sentCount || 0 : '—'}
                  </TableCell>
                  <TableCell sx={{ fontFamily: ff, fontSize: '0.78rem', color: '#888', whiteSpace: 'nowrap' }}>
                    {fmtDate(c.sentAt || c.createdAt)}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      {c.status !== 'sent' && (
                        <>
                          <Tooltip title="Edit">
                            <IconButton size="small" onClick={() => openCompose(c)} sx={{ color: BRAND_TEAL }}>
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="Send to all subscribers">
                            <IconButton size="small" onClick={() => handleSendNow(c.id)} disabled={sending === c.id} sx={{ color: BRAND_RED }}>
                              {sending === c.id ? <CircularProgress size={16} /> : <SendIcon fontSize="small" />}
                            </IconButton>
                          </Tooltip>
                        </>
                      )}
                      <Tooltip title="Delete">
                        <IconButton size="small" onClick={() => handleDelete(c.id)} sx={{ color: '#ddd', '&:hover': { color: BRAND_RED } }}>
                          <DeleteOutlineIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <ComposeDialog
        open={composeOpen}
        onClose={() => setComposeOpen(false)}
        initial={editTarget}
        onSaved={handleSaved}
        onSnack={(msg, sev) => setSnack({ open: true, message: msg, severity: sev || 'success' })}
      />

      <Snackbar open={snack.open} autoHideDuration={4500} onClose={() => setSnack((s) => ({ ...s, open: false }))}>
        <Alert severity={snack.severity} onClose={() => setSnack((s) => ({ ...s, open: false }))}>{snack.message}</Alert>
      </Snackbar>
    </Box>
  );
}

// ── Main export ────────────────────────────────────────────────────────────────
export default function NewsletterSection() {
  const [tab, setTab] = useState(0);

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
        <MailOutlineIcon sx={{ color: BRAND_TEAL }} />
        <Typography variant="h5" sx={{ fontFamily: ff, fontWeight: 700 }}>Newsletter</Typography>
      </Box>

      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        sx={{
          mb: 3,
          borderBottom: '1px solid #E8D5B0',
          '& .MuiTab-root': { fontFamily: ff, textTransform: 'none', fontWeight: 600 },
          '& .Mui-selected': { color: BRAND_TEAL },
          '& .MuiTabs-indicator': { bgcolor: BRAND_TEAL },
        }}
      >
        <Tab label="Subscribers" />
        <Tab label="Campaigns" />
      </Tabs>

      {tab === 0 && <SubscribersTab />}
      {tab === 1 && <CampaignsTab />}
    </Box>
  );
}
