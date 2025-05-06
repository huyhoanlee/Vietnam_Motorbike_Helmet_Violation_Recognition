import React, { useState, useEffect } from 'react';
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
  LinearProgress,
  Tabs,
  Tab,
  Paper,
  Card,
  CardContent,
  CardMedia,
  Chip,
  Divider,
  Container,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
} from '@mui/material';
import axios from 'axios';
import { useForm } from 'react-hook-form';
import AddPhotoAlternateIcon from '@mui/icons-material/AddPhotoAlternate';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';
import VerifiedIcon from '@mui/icons-material/Verified';
import PendingIcon from '@mui/icons-material/Pending';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { useDropzone } from 'react-dropzone';
import config from "../../../config";

const API_BASE_URL = `${config.API_URL}`;

interface UploadingImage {
  file: File;
  preview: string;
  progress: number;
}

// Cập nhật interface Violation để khớp với dữ liệu API
interface Violation {
  id: number; // Đổi từ string sang number
  plate_number: string;
  location: string;
  images: string[];
  status: 'Reported' | 'Verified';
  reported_at?: string; // Optional, vì API hiện tại không trả về
}

const StatusChip = ({ status }: { status: string }) => {
  if (status === 'Verified') {
    return (
      <Chip
        icon={<VerifiedIcon />}
        label="Verified"
        color="success"
        size="small"
        variant="outlined"
      />
    );
  }
  return (
    <Chip
      icon={<PendingIcon />}
      label="Reported"
      color="warning"
      size="small"
      variant="outlined"
    />
  );
};

const ReportViolation = () => {
  const { register, handleSubmit, reset, formState: { errors } } = useForm();
  const [uploadingImages, setUploadingImages] = useState<UploadingImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingReports, setLoadingReports] = useState(false);
  const [tabValue, setTabValue] = useState(0);
  const [myViolations, setMyViolations] = useState<Violation[]>([]);
  const [selectedViolation, setSelectedViolation] = useState<Violation | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success' as 'success' | 'error'
  });

  useEffect(() => {
    if (tabValue === 1) {
      fetchMyReports();
    }
  }, [tabValue]);

  const fetchMyReports = async () => {
    try {
      setLoadingReports(true);
      const userId = localStorage.getItem('user_id');
      
      if (!userId) {
        setSnackbar({
          open: true,
          message: 'Please Log In to view your reports',
          severity: 'error'
        });
        setLoadingReports(false);
        return;
      }

      const response = await axios.get(`${API_BASE_URL}violations/report/${userId}/`);
      
      // Kiểm tra dữ liệu trả về trước khi gán
      const reports = Array.isArray(response.data) ? response.data : [];
      if (reports.length === 0) {
        setMyViolations([]);
        return;
      }

      // Đảm bảo dữ liệu khớp với interface Violation
      const formattedReports: Violation[] = reports.map((report: any) => ({
        id: report.id,
        plate_number: report.plate_number,
        location: report.location,
        images: Array.isArray(report.images) ? report.images : [],
        status: report.status as 'Reported' | 'Verified',
        reported_at: report.reported_at // Có thể không có, đã để optional
      }));

      setMyViolations(formattedReports);
    } catch (error: any) {
      console.error('Error fetching reports:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Failed to load your reports',
        severity: 'error'
      });
      setMyViolations([]); // Đặt lại danh sách nếu có lỗi
    } finally {
      setLoadingReports(false);
    }
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleViewDetails = (violation: Violation) => {
    setSelectedViolation(violation);
    setDialogOpen(true);
  };

  const handleImageClick = (imageUrl: string) => {
    setImagePreviewUrl(imageUrl);
  };

  const closeImagePreview = () => {
    setImagePreviewUrl(null);
  };

  const onDrop = (acceptedFiles: File[], _rejectedFiles: any[]) => {
    if (uploadingImages.length + acceptedFiles.length > 5) {
      setSnackbar({
        open: true, 
        message: 'Maximum 5 images allowed per report', 
        severity: 'error'
      });
      return;
    }

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
    accept: { 'image/*': [] },
    multiple: true
  });

  const removeImage = (index: number) => {
    setUploadingImages(prev => {
      const updated = [...prev];
      URL.revokeObjectURL(updated[index].preview);
      updated.splice(index, 1);
      return updated;
    });
  };

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
        if (updated[index]) {
          updated[index].progress = Math.min(progress, 100);
        }
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
        message: 'Please upload at least one image of the helmet violation.',
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
        await new Promise(resolve => setTimeout(resolve, 400)); 
      }

      const userId = localStorage.getItem('user_id');
      
      const payload = {
        reported_by: userId,
        image: base64Images,
        plate_number: data.plate_number,
        reported_location: data.reported_location,
      };

      const response = await axios.post(`${API_BASE_URL}violations/report/`, payload);

      setSnackbar({
        open: true,
        message: response.data?.message || 'Violation reported successfully!',
        severity: 'success'
      });

      reset();
      setUploadingImages([]);

      if (userId) {
        fetchMyReports();
      }
    } catch (error: any) {
      const errMsg =
        error.response?.data?.detail ||
        error.response?.data?.message ||
        'An error occurred while submitting the violation report.';
      setSnackbar({
        open: true,
        message: errMsg,
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A'; // Trả về giá trị mặc định nếu không có reported_at
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1200, mx: 'auto' }}>
        <Paper elevation={0} sx={{ p: 3, borderRadius: 2, mb: 3, bgcolor: '#f8f9fa' }}>
          <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: '#1976d2' }}>
            Helmet Violation Reporting
          </Typography>
          <Typography sx={{ color: 'text.secondary' }}>
            Help improve road safety by reporting vehicles with riders not wearing helmets. Your reports will be verified by supervisors.
          </Typography>
        </Paper>

        <Paper elevation={2} sx={{ borderRadius: 2 }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            variant="fullWidth"
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab label="Report New Violation" />
            <Tab label="My Reports" />
          </Tabs>

          <Box sx={{ p: 3 }}>
            {tabValue === 0 ? (
              <form onSubmit={handleSubmit(onSubmit)}>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="License Plate Number"
                      fullWidth
                      {...register('plate_number', { 
                        required: 'License plate number is required',
                        pattern: {
                          value: /^[A-Z0-9-]+$/i,
                          message: 'Please enter a valid license plate number'
                        }
                      })}
                      error={!!errors.plate_number}
                      helperText={errors.plate_number?.message as string || ''}
                      variant="outlined"
                      placeholder="e.g. 59A-12345"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Location of Violation"
                      fullWidth
                      {...register('reported_location', { 
                        required: 'Location is required' 
                      })}
                      error={!!errors.reported_location}
                      helperText={errors.reported_location?.message as string || ''}
                      variant="outlined"
                      placeholder="e.g. Nguyen Hue Street, District 1"
                    />
                  </Grid>

                  <Grid item xs={12}>
                    <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'medium' }}>
                      Upload Photos of Violation
                    </Typography>
                    <Box
                      {...getRootProps()}
                      sx={{
                        border: '2px dashed',
                        borderColor: isDragActive ? 'primary.main' : 'grey.400',
                        borderRadius: 2,
                        padding: 3,
                        textAlign: 'center',
                        backgroundColor: isDragActive ? 'primary.50' : 'grey.50',
                        cursor: 'pointer',
                        transition: 'all 0.2s ease-in-out',
                        '&:hover': {
                          borderColor: 'primary.main',
                          backgroundColor: 'primary.50'
                        }
                      }}
                    >
                      <input {...getInputProps()} />
                      <Typography variant="body1" color="textSecondary">
                        {isDragActive 
                          ? 'Drop the photos here...' 
                          : 'Drag & drop photos or click to select'}
                      </Typography>
                      <Box sx={{ mt: 2, mb: 1 }}>
                        <AddPhotoAlternateIcon sx={{ fontSize: 48, color: 'primary.main' }} />
                      </Box>
                      <Typography variant="caption" color="textSecondary">
                        Maximum 5 photos, 5MB each (JPG, PNG)
                      </Typography>
                    </Box>
                  </Grid>

                  {uploadingImages.length > 0 && (
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" sx={{ mt: 1, mb: 2 }}>
                        {uploadingImages.length} {uploadingImages.length === 1 ? 'photo' : 'photos'} selected
                      </Typography>
                      <ImageList cols={uploadingImages.length > 2 ? 3 : uploadingImages.length} gap={16} sx={{ mb: 2 }}>
                        {uploadingImages.map((img, index) => (
                          <ImageListItem key={index} sx={{ position: 'relative' }}>
                            <img
                              src={img.preview}
                              alt={`preview-${index}`}
                              loading="lazy"
                              style={{ 
                                borderRadius: 8, 
                                height: 180, 
                                width: '100%', 
                                objectFit: 'cover' 
                              }}
                            />
                            <Box sx={{ position: 'absolute', top: 8, right: 8 }}>
                              <IconButton
                                size="small"
                                onClick={() => removeImage(index)}
                                sx={{
                                  bgcolor: 'rgba(0,0,0,0.6)',
                                  color: 'white',
                                  '&:hover': { bgcolor: 'rgba(0,0,0,0.8)' }
                                }}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Box>
                            <LinearProgress
                              variant="determinate"
                              value={img.progress}
                              sx={{ 
                                position: 'absolute', 
                                bottom: 0, 
                                left: 0, 
                                right: 0,
                                height: 4,
                                borderBottomLeftRadius: 8,
                                borderBottomRightRadius: 8
                              }}
                            />
                          </ImageListItem>
                        ))}
                      </ImageList>
                    </Grid>
                  )}

                  <Grid item xs={12}>
                    <Button
                      variant="contained"
                      type="submit"
                      fullWidth
                      disabled={loading}
                      sx={{ 
                        py: 1.5, 
                        fontWeight: 'bold',
                        boxShadow: 3,
                        '&:hover': {
                          boxShadow: 5
                        }
                      }}
                    >
                      {loading ? (
                        <>
                          <CircularProgress size={20} sx={{ color: '#fff', mr: 1 }} />
                          Submitting Report...
                        </>
                      ) : (
                        'Submit Violation Report'
                      )}
                    </Button>
                  </Grid>
                </Grid>
              </form>
            ) : (
              <Box>
                {loadingReports ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                    <CircularProgress />
                  </Box>
                ) : myViolations.length === 0 ? (
                  <Box sx={{ textAlign: 'center', py: 6 }}>
                    <Typography variant="h6" color="text.secondary" gutterBottom>
                      No reports found
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      You haven't submitted any violation reports yet.
                    </Typography>
                    <Button 
                      variant="outlined" 
                      sx={{ mt: 2 }}
                      onClick={() => setTabValue(0)}
                    >
                      Create Your First Report
                    </Button>
                  </Box>
                ) : (
                  <Grid container spacing={3}>
                    {myViolations.map((violation) => (
                      <Grid item xs={12} sm={6} md={4} key={violation.id}>
                        <Card 
                          sx={{ 
                            height: '100%', 
                            display: 'flex', 
                            flexDirection: 'column',
                            transition: 'transform 0.2s',
                            '&:hover': {
                              transform: 'translateY(-4px)',
                              boxShadow: 4
                            }
                          }}
                        >
                          <CardMedia
                            component="img"
                            height="160"
                            image={violation.images[0] || 'https://via.placeholder.com/160'} // Hình mặc định nếu không có ảnh
                            alt="Violation evidence"
                            sx={{ objectFit: 'cover' }}
                          />
                          <CardContent sx={{ flexGrow: 1 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                              <Typography variant="h6" component="div">
                                {violation.plate_number}
                              </Typography>
                              <StatusChip status={violation.status} />
                            </Box>
                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                              {violation.location}
                            </Typography>
                            {/* Bỏ hiển thị reported_at hoặc sử dụng giá trị mặc định */}
                            <Typography variant="caption" color="text.secondary" display="block">
                              Reported: {formatDate(violation.reported_at)}
                            </Typography>
                            <Button
                              variant="outlined"
                              size="small"
                              startIcon={<VisibilityIcon />}
                              sx={{ mt: 2 }}
                              onClick={() => handleViewDetails(violation)}
                            >
                              View Details
                            </Button>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                )}
              </Box>
            )}
          </Box>
        </Paper>

        {/* Violation Details Dialog */}
        <Dialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          maxWidth="md"
          fullWidth
        >
          {selectedViolation && (
            <>
              <DialogTitle sx={{ pb: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="h6">
                    Violation Report Details
                  </Typography>
                  <StatusChip status={selectedViolation.status} />
                  <IconButton
                    edge="end"
                    color="inherit"
                    onClick={() => setDialogOpen(false)}
                    aria-label="close"
                  >
                    <CloseIcon />
                  </IconButton>
                </Box>
              </DialogTitle>
              <DialogContent dividers>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      License Plate
                    </Typography>
                    <Typography variant="body1" gutterBottom sx={{ fontWeight: 'medium' }}>
                      {selectedViolation.plate_number}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Reported At
                    </Typography>
                    <Typography variant="body1" gutterBottom>
                      {formatDate(selectedViolation.reported_at)}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary">
                      Location
                    </Typography>
                    <Typography variant="body1" paragraph>
                      {selectedViolation.location}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Divider sx={{ my: 1 }} />
                    <Typography variant="subtitle1" gutterBottom sx={{ mt: 1 }}>
                      Evidence Photos
                    </Typography>
                    <ImageList cols={selectedViolation.images.length > 2 ? 3 : selectedViolation.images.length} gap={8}>
                      {selectedViolation.images.map((img, i) => (
                        <ImageListItem 
                          key={i} 
                          onClick={() => handleImageClick(img)}
                          sx={{ 
                            cursor: 'pointer',
                            '&:hover': { 
                              opacity: 0.9,
                              transform: 'scale(1.02)',
                              transition: 'all 0.2s'
                            }
                          }}
                        >
                          <img
                            src={img}
                            alt={`Violation evidence ${i+1}`}
                            loading="lazy"
                            style={{ borderRadius: 4 }}
                          />
                        </ImageListItem>
                      ))}
                    </ImageList>
                  </Grid>
                </Grid>
              </DialogContent>
            </>
          )}
        </Dialog>

        {/* Image Preview Dialog */}
        <Dialog
          open={!!imagePreviewUrl}
          onClose={closeImagePreview}
          maxWidth="lg"
          fullWidth
        >
          {imagePreviewUrl && (
            <DialogContent sx={{ p: 1, textAlign: 'center' }}>
              <IconButton
                sx={{ position: 'absolute', top: 8, right: 8, bgcolor: 'rgba(0,0,0,0.5)', color: 'white' }}
                onClick={closeImagePreview}
              >
                <CloseIcon />
              </IconButton>
              <img
                src={imagePreviewUrl}
                alt="Full size preview"
                style={{ maxWidth: '100%', maxHeight: '80vh' }}
              />
            </DialogContent>
          )}
        </Dialog>

        {/* Snackbar for notifications */}
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
    </Container>
  );
};

export default ReportViolation;