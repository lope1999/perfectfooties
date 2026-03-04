import { useState, useRef } from 'react';
import { Box, Button, Typography, LinearProgress, TextField } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { ref as storageRef, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '../../lib/firebase';

const fontFamily = '"Georgia", serif';
const MAX_WIDTH = 1200;
const QUALITY = 0.8;

function compressImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > MAX_WIDTH) {
        height = Math.round(height * (MAX_WIDTH / width));
        width = MAX_WIDTH;
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      canvas.getContext('2d').drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Compression failed'));
        },
        'image/webp',
        QUALITY,
      );
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(file);
  });
}

export default function ImageUploadField({ value, onChange, folder = 'images', label = 'Image' }) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  const handleFile = async (file) => {
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('Image must be under 10MB');
      return;
    }

    setError('');
    setUploading(true);
    setProgress(0);

    try {
      const compressed = await compressImage(file);
      const name = file.name.replace(/\.[^.]+$/, '.webp');
      const filename = `${folder}/${Date.now()}-${name}`;
      const fileRef = storageRef(storage, filename);
      const task = uploadBytesResumable(fileRef, compressed, { contentType: 'image/webp' });

      // Timeout — if no progress after 30s, likely a rules/config issue
      let lastProgress = Date.now();
      const timeout = setInterval(() => {
        if (Date.now() - lastProgress > 30000) {
          clearInterval(timeout);
          task.cancel();
          setError('Upload timed out — have you deployed Firebase Storage rules? Run: firebase deploy --only storage');
          setUploading(false);
        }
      }, 5000);

      task.on(
        'state_changed',
        (snap) => {
          lastProgress = Date.now();
          setProgress(Math.round((snap.bytesTransferred / snap.totalBytes) * 100));
        },
        (err) => {
          clearInterval(timeout);
          console.error('Upload error:', err);
          const msg = err.code === 'storage/unauthorized'
            ? 'Permission denied — deploy Storage rules: firebase deploy --only storage'
            : 'Upload failed — please try again';
          setError(msg);
          setUploading(false);
        },
        async () => {
          clearInterval(timeout);
          const url = await getDownloadURL(task.snapshot.ref);
          onChange(url);
          setUploading(false);
        },
      );
    } catch (err) {
      console.error('Compression error:', err);
      setError('Failed to process image');
      setUploading(false);
    }
  };

  return (
    <Box>
      <Typography sx={{ fontFamily, fontSize: '0.85rem', fontWeight: 600, mb: 0.5 }}>
        {label}
      </Typography>

      {/* Preview */}
      {value && (
        <Box
          component="img"
          src={value}
          alt="Preview"
          sx={{
            width: '100%',
            maxHeight: 200,
            objectFit: 'cover',
            borderRadius: 2,
            border: '1px solid #eee',
            mb: 1.5,
            display: 'block',
          }}
        />
      )}

      {/* Upload button */}
      <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center', mb: 1 }}>
        <Button
          variant="outlined"
          startIcon={<CloudUploadIcon />}
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          sx={{
            fontFamily,
            fontSize: '0.82rem',
            textTransform: 'none',
            borderColor: '#E91E8C',
            color: '#E91E8C',
            '&:hover': { borderColor: '#C2185B', backgroundColor: '#FFF0F5' },
          }}
        >
          {uploading ? 'Uploading…' : 'Choose File'}
        </Button>
        <Typography sx={{ fontFamily, fontSize: '0.75rem', color: '#999' }}>
          or paste a URL below
        </Typography>
      </Box>

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => {
          handleFile(e.target.files?.[0]);
          e.target.value = '';
        }}
      />

      {/* Progress bar */}
      {uploading && (
        <Box sx={{ mb: 1.5 }}>
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{
              height: 6,
              borderRadius: 3,
              backgroundColor: '#FCE4EC',
              '& .MuiLinearProgress-bar': { backgroundColor: '#E91E8C' },
            }}
          />
          <Typography sx={{ fontFamily, fontSize: '0.72rem', color: '#999', mt: 0.3 }}>
            {progress}%
          </Typography>
        </Box>
      )}

      {/* Error */}
      {error && (
        <Typography sx={{ fontFamily, fontSize: '0.78rem', color: '#d32f2f', mb: 1 }}>
          {error}
        </Typography>
      )}

      {/* URL fallback field */}
      <TextField
        fullWidth
        size="small"
        placeholder="https://..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={uploading}
        InputProps={{ sx: { fontFamily, fontSize: '0.85rem' } }}
      />
    </Box>
  );
}
