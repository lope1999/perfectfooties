import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  Snackbar,
  Alert,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { db } from "../lib/firebase";
import {
	collection,
	addDoc,
	serverTimestamp,
	query,
	where,
	getDocs,
	doc,
	updateDoc,
} from "firebase/firestore";
import { sendNewsletterWelcome } from "../lib/emailService";
import { useAuth } from "../context/AuthContext";
const LS_SUBSCRIBED = "pf_newsletter_subscribed_v1";
const LS_SHOWN = 'pf_newsletter_shown_v1';

const isValidEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

export default function NewsletterPopup() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [status, setStatus] = useState('idle'); // idle | loading | success | duplicate | error
    const { user } = useAuth();
  const [snack, setSnack] = useState({ open: false, message: '', severity: 'info' });

  useEffect(() => {
    try {
      const subscribed = localStorage.getItem(LS_SUBSCRIBED);
      const shown = localStorage.getItem(LS_SHOWN);
      if (!subscribed && !shown) {
        // show after small delay so it doesn't interrupt immediate render
        const t = setTimeout(() => setOpen(true), 800);
        return () => clearTimeout(t);
      }
    } catch (err) {
      // ignore localStorage errors
    }
  }, []);

  const close = (markShown = true) => {
    setOpen(false);
    if (markShown) {
      try { localStorage.setItem(LS_SHOWN, '1'); } catch (e) {}
    }
  };

  const handleSubscribe = async () => {
    if (!isValidEmail(email)) {
      setSnack({ open: true, message: 'Please enter a valid email', severity: 'error' });
      return;
    }
    const trimmedName = (name || '').trim();
    setStatus('loading');
    try {
			const subsRef = collection(db, "subscribers");
			const dup = await getDocs(
				query(subsRef, where("email", "==", email.toLowerCase())),
			);
			if (!dup.empty) {
				setStatus("duplicate");
				setSnack({
					open: true,
					message: "You're already subscribed",
					severity: "info",
				});
				localStorage.setItem(LS_SUBSCRIBED, "1");
				close(true);
				return;
			}
			// create subscriber record (attach uid when available)
			const docRef = await addDoc(subsRef, {
				uid: user?.uid || null,
				name: trimmedName || null,
				email: email.toLowerCase(),
				subscribedAt: serverTimestamp(),
			});
			// sendNewsletterWelcome is a no-op in-browser; pass name for future server usage
			// Mark user's Firestore profile as subscribed when logged in
			if (user?.uid) {
				try {
					const userRef = doc(db, "users", user.uid);
					await updateDoc(userRef, { newsletterSubscribed: true }).catch(
						() => {},
					);
				} catch (e) {}
			}
			setStatus("success");
			setSnack({
				open: true,
				message: "Thanks — check your inbox!",
				severity: "success",
			});
			try {
				localStorage.setItem(LS_SUBSCRIBED, "1");
				localStorage.setItem(LS_SHOWN, "1");
			} catch (e) {}
			setTimeout(() => close(true), 700);
		} catch (err) {
      setStatus('error');
      setSnack({ open: true, message: 'Subscription failed — try again later', severity: 'error' });
    }
  };

  return (
    <>
      <Dialog open={open} onClose={() => close(true)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Box component="img" src="/images/logo.png" alt="PerfectFooties" sx={{ width: 54, height: 57, objectFit: 'contain' }} />
              <Typography sx={{ fontFamily: '"Georgia", serif', fontWeight: 700 }}>PerfectFooties</Typography>
            </Box>
            <IconButton onClick={() => close(true)}><CloseIcon /></IconButton>
          </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', gap: 3, alignItems: 'center', flexWrap: 'wrap' }}>
            <Box component="img" src="/images/logo.png" alt="PerfectFooties logo" sx={{ width: 200, height: 200, objectFit: 'contain', borderRadius: 1, display: { xs: 'none', md: 'block' } }} />
            <Box sx={{ flex: 1 }}>
              <Typography sx={{ fontFamily: '\"Georgia\", serif', fontSize: '1.25rem', fontWeight: 700, mb: 1 }}>Be the first to meet new solemates, sign up for early matches!</Typography>
              <Typography sx={{ color: 'var(--text-muted)', mb: 2 }}>
                Join our list for first access to handcrafted footwear, bags, and belts — plus exclusive deals and curated styling tips.
              </Typography>

              <TextField
                placeholder="Your name (optional)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                fullWidth
                size="small"
                sx={{ mb: 1 }}
                onKeyDown={(e) => e.key === 'Enter' && handleSubscribe()}
              />

              <TextField
                placeholder="Your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                fullWidth
                size="small"
                sx={{ mb: 2 }}
                onKeyDown={(e) => e.key === 'Enter' && handleSubscribe()}
              />

              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button variant="contained" onClick={handleSubscribe} disabled={status === 'loading'} sx={{ backgroundColor: 'var(--text-purple)' }}>
                  {status === 'loading' ? 'Saving…' : 'Sign Up'}
                </Button>
                <Button onClick={() => close(true)}>Maybe later</Button>
              </Box>
            </Box>
          </Box>
        </DialogContent>
      </Dialog>

      <Snackbar open={snack.open} autoHideDuration={3000} onClose={() => setSnack((s) => ({ ...s, open: false }))}>
        <Alert severity={snack.severity} onClose={() => setSnack((s) => ({ ...s, open: false }))}>{snack.message}</Alert>
      </Snackbar>
    </>
  );
}
