import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  Snackbar,
  Alert,
  CircularProgress,
  ImageList,
  ImageListItem,
  LinearProgress
} from '@mui/material';
import axios from 'axios';
import { useForm } from 'react-hook-form';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import { useDropzone } from 'react-dropzone';

const API_BASE_URL = 'https://hanaxuan-backend.hf.space/api';


interface UploadingImage {
  file: File;
  preview: string;
  progress: number;
}

const ReportViolation = () => {
  const { register, handleSubmit, reset } = useForm();
  const [uploadingImages, setUploadingImages] = useState<UploadingImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error'
  });

  const onDrop = (acceptedFiles: File[], rejectedFiles: any[]) => {
    const newImages: UploadingImage[] = [];

    acceptedFiles.forEach((file) => {
      if (!file.type.startsWith('image/')) {
        setSnackbar({ open: true, message: 'Only image formats supported.', severity: 'error' });
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setSnackbar({ open: true, message: 'Photo exceeds 5MB limit.', severity: 'error' });
        return;
      }

      newImages.push({
        file,
        preview: URL.createObjectURL(file),
        progress: 0
      });
    });

    setUploadingImages(prev => [...prev, ...newImages]);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': []
    },
    multiple: true
  });

  const convertToBase64 = (file: File): Promise<string> => {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const simulateProgress = (index: number) => {
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.floor(Math.random() * 10) + 5;
      setUploadingImages(prev => {
        const updated = [...prev];
        updated[index].progress = Math.min(progress, 100);
        return updated;
      });

      if (progress >= 100) {
        clearInterval(interval);
      }
    }, 200);
  };

  const onSubmit = async (data: any) => {
    if (uploadingImages.length === 0) {
      setSnackbar({
        open: true,
        message: 'Please upload at least one image.',
        severity: 'error'
      });
      return;
    }

    try {
      setLoading(true);

      const base64Images: string[] = [];

      for (let i = 0; i < uploadingImages.length; i++) {
        simulateProgress(i);
        const base64 = await convertToBase64(uploadingImages[i].file);
        base64Images.push(base64);
        await new Promise(resolve => setTimeout(resolve, 400)); // giả lập chờ upload
      }

      const payload = {
        image: base64Images,
        plate_number: data.plate_number,
        location: data.location
      };

      const response = await axios.post(`${API_BASE_URL}/violations/report/`, payload);

      setSnackbar({
        open: true,
        message: response.data?.message || 'Send successfully!',
        severity: 'success'
      });

      // reset form + ảnh
      reset();
      setUploadingImages([]);
    } catch (error: any) {
      const errMsg =
        error.response?.data?.detail ||
        error.response?.data?.message ||
        'An error occurred while submitting the violation.';
      setSnackbar({
        open: true,
        message: errMsg,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 4, maxWidth: 900, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>📤 Posting Violation Proofs</Typography>
      <Typography sx={{ mb: 3, color: 'gray' }}>
        You can report a vehicle violation without logging in. Please provide a clear photo, license plate number, and location of the violation.
      </Typography>

      <form onSubmit={handleSubmit(onSubmit)}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <TextField
              label="License plate number"
              fullWidth
              {...register('plate_number', { required: true })}
              required
            />
          </Grid>
          <Grid item xs={12}>
            <TextField
              label="Location of violation"
              fullWidth
              {...register('location', { required: true })}
              required
            />
          </Grid>

          <Grid item xs={12}>
            <Box
              {...getRootProps()}
              sx={{
                border: '2px dashed #aaa',
                borderRadius: 4,
                padding: 3,
                textAlign: 'center',
                backgroundColor: isDragActive ? '#f0f0f0' : '#fafafa',
                cursor: 'pointer'
              }}
            >
              <input {...getInputProps()} />
              <Typography color="textSecondary">
                {isDragActive ? 'Drop photo here...' : 'Drag & drop photos or tap to select photos'}
              </Typography>
              <AddPhotoAlternateIcon sx={{ fontSize: 48, color: 'gray', mt: 1 }} />
            </Box>
          </Grid>

          <Grid item xs={12}>
            <ImageList cols={3} rowHeight={180}>
              {uploadingImages.map((img, index) => (
                <ImageListItem key={index}>
                  <img
                    src={img.preview}
                    alt={`preview-${index}`}
                    loading="lazy"
                    style={{ borderRadius: 8 }}
                  />
                  <LinearProgress
                    variant="determinate"
                    value={img.progress}
                    sx={{ mt: 1 }}
                  />
                </ImageListItem>
              ))}
            </ImageList>
          </Grid>

          <Grid item xs={12}>
            <Button
              variant="contained"
              type="submit"
              fullWidth
              disabled={loading}
              sx={{ py: 1.5, fontWeight: 'bold' }}
            >
              {loading ? (
                <>
                  <CircularProgress size={20} sx={{ color: '#fff', mr: 1 }} />
                  Đang gửi...
                </>
              ) : (
                'Submit a Report'
              )}
            </Button>
          </Grid>
        </Grid>
      </form>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          iconMapping={{
            success: <CheckCircleIcon fontSize="inherit" />,
            error: <ErrorIcon fontSize="inherit" />
          }}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ReportViolation;
