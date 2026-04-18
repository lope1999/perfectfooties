import { useState, useRef } from 'react';
import { Box, Button, Typography, LinearProgress, TextField } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import { ref as storageRef, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '../../lib/firebase';

const fontFamily = '"Georgia", serif';
const MAX_WIDTH = 1200;
const QUALITY = 0.8;

function sanitizeBaseName(filename) {
  return filename.replace(/\.[^.]+$/, '').replace(/[^a-zA-Z0-9-_]+/g, '-');
}

function compressImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);
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
          URL.revokeObjectURL(objectUrl);
          if (blob) resolve(blob);
          else reject(new Error('Compression failed'));
        },
        'image/webp',
        QUALITY,
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('Failed to load image'));
    };
    img.src = objectUrl;
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
      let uploadFile = file;
      let contentType = file.type || 'application/octet-stream';
      let extension = file.name.includes('.') ? file.name.split('.').pop() : 'bin';

      try {
        const compressed = await compressImage(file);
        uploadFile = compressed;
        contentType = 'image/webp';
        extension = 'webp';
      } catch (compressionError) {
        console.warn('Image compression failed, uploading original file instead:', compressionError);
      }

      const name = `${sanitizeBaseName(file.name)}.${extension}`;
      const filename = `${folder}/${Date.now()}-${name}`;
      const fileRef = storageRef(storage, filename);
      const task = uploadBytesResumable(fileRef, uploadFile, { contentType });

      // Timeout — if no progress after 30s, likely a rules/config issue
      let lastProgress = Date.now();
      const timeout = setInterval(() => {
        if (Date.now() - lastProgress > 30000) {
          clearInterval(timeout);
          task.cancel();
          setError('Upload timed out. Check Firebase Storage bucket config and rules for this upload path.');
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
            ? 'Permission denied for this Storage path. Check the upload folder, Storage rules, and signed-in admin account.'
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
      console.error('Image preparation error:', err);
      setError('Failed to prepare image for upload');
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
            borderColor: '#e3242b',
            color: '#e3242b',
            '&:hover': { borderColor: '#b81b21', backgroundColor: '#FFF8F0' },
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
              backgroundColor: '#FFE8E8',
              '& .MuiLinearProgress-bar': { backgroundColor: '#e3242b' },
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
