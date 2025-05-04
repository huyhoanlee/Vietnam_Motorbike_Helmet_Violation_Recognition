// HomePage.tsx
import { useState } from 'react';
import {
  Box, Typography, Button, TextField, Paper, CircularProgress, Alert, Snackbar, ImageList, ImageListItem,
  Container, Grid, Card, CardContent, Divider, useTheme, useMediaQuery
} from '@mui/material';
import { styled } from '@mui/material/styles';
import SearchIcon from '@mui/icons-material/Search';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import PersonIcon from '@mui/icons-material/Person';
import LabelIcon from '@mui/icons-material/Label';
import TwoWheelerIcon from '@mui/icons-material/TwoWheeler';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import config from "../../config";

const API_BASE_URL = `${config.API_URL}`;

// Styled components
const HeroSection = styled(Box)(({ theme }) => ({
  backgroundImage: 'linear-gradient(135deg, #3f51b5 10%, #2196f3 100%)',
  color: 'white',
  padding: theme.spacing(8, 2),
  borderRadius: theme.shape.borderRadius,
  marginBottom: theme.spacing(4),
  textAlign: 'center',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
}));

const LoginButton = styled(Button)(({ theme }) => ({
  padding: theme.spacing(1.5, 3),
  borderRadius: 12,
  fontWeight: 'bold',
  transition: 'transform 0.2s',
  '&:hover': {
    transform: 'translateY(-3px)',
    boxShadow: '0 6px 20px rgba(0, 0, 0, 0.15)',
  },
}));

const SearchButton = styled(Button)(({ theme }) => ({
  padding: theme.spacing(1.5, 3),
  minWidth: '120px',
  borderRadius: '0 8px 8px 0',
  height: '56px',
}));

const ResultCard = styled(Paper)(({ theme }) => ({
  borderRadius: 12,
  overflow: 'hidden',
  transition: 'transform 0.2s, box-shadow 0.2s',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: theme.shadows[6],
  },
  margin: theme.spacing(2, 0),
}));

interface Violation {
  violation_id: number;
  plate_number: string;
  vehicle_id?: string;
  location: string;
  detected_at: string;
  violation_image: string[];
  violation_status: string;
}

const statusColors: Record<string, string> = {
  "AI Detected": "#FFA726",
  "Approved": "#66BB6A",
  "Rejected": "#EF5350",
  "Modified": "#42A5F5",
  "Provided": "#AB47BC",
};

const StatusBadge = styled('span')<{ status: string }>(({ status }) => ({
  display: 'inline-block',
  padding: '4px 10px',
  borderRadius: '20px',
  fontWeight: 'bold',
  color: 'white',
  backgroundColor: statusColors[status] || '#757575',
  fontSize: '0.85rem',
}));

const ImageThumb = styled('img')({
  width: '100%',
  height: '100%',
  objectFit: 'cover',
  borderRadius: 8,
  cursor: 'pointer',
  transition: 'transform 0.2s',
  '&:hover': {
    transform: 'scale(1.05)',
  },
});

const HomePage = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const [plateNumber, setPlateNumber] = useState('');
  const [searchResult, setSearchResult] = useState<Violation[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState({ open: false, type: 'info', message: '' });
  const [imageViewer, setImageViewer] = useState<string | null>(null);

  const normalizeBase64Image = (data: string, format: "jpeg" | "png" = "jpeg") => {
    if (data.startsWith("data:image/")) {
      return data;
    }
    return `data:image/${format};base64,${data}`;
  };

  const handleSearch = () => {
    if (!plateNumber.trim()) {
      setNotification({
        open: true,
        type: "warning",
        message: "Please enter license plate number!",
      });
      return;
    }

    setLoading(true);
    setSearchResult(null);

    axios
      .post(`${API_BASE_URL}violations/search-by-plate-number/`, {
        plate_number: plateNumber.trim()
      })
      .then((res) => {
        const data = res.data?.data?.violations || [];
        setSearchResult(data);
        setNotification({ open: true, type: "success", message: "Search successful!" });
      })
      .catch((err) => {
        setNotification({
          open: true,
          type: "error",
          message: err?.response?.data?.message || "Not found or server error!",
        });
      })
      .finally(() => setLoading(false));
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    } catch (e) {
      return dateString;
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <HeroSection>
        <Typography variant="h3" component="h1" fontWeight="bold" gutterBottom>
          Helmet Violation Detection System
        </Typography>
        <Typography variant="h6" sx={{ mb: 4, opacity: 0.9, maxWidth: 800, mx: 'auto' }}>
          Search for violations, access administrator controls, or manage your citizen account
        </Typography>
        
        <Grid container spacing={3} justifyContent="center" sx={{ mt: 2 }}>
          <Grid item>
            <LoginButton 
              variant="contained" 
              color="secondary" 
              size="large" 
              startIcon={<AdminPanelSettingsIcon />}
              onClick={() => navigate('/admin/login')}
            >
              Administrator Login
            </LoginButton>
          </Grid>
          <Grid item>
            <LoginButton 
              variant="outlined" 
              sx={{ backgroundColor: 'rgba(255,255,255,0.1)', color: 'white' }}
              size="large" 
              startIcon={<PersonIcon />}
              onClick={() => navigate('/citizen/login')}
            >
              Citizen Login
            </LoginButton>
          </Grid>
        </Grid>
      </HeroSection>

      {/* Search Section */}
      <Card elevation={3} sx={{ borderRadius: 4, overflow: 'visible', mb: 6 }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h5" gutterBottom fontWeight="bold" sx={{ display: 'flex', alignItems: 'center' }}>
            <LabelIcon sx={{ mr: 1 }} /> 
            Look up violations by license plate
          </Typography>
          
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Enter a license plate number to check for any recorded traffic violations
          </Typography>
          
          <Box sx={{ 
            display: 'flex', 
            flexDirection: isMobile ? 'column' : 'row',
            gap: isMobile ? 2 : 0,
            mb: 2
          }}>
            <TextField
              label="License plate number"
              value={plateNumber}
              onChange={(e) => setPlateNumber(e.target.value)}
              fullWidth
              variant="outlined"
              placeholder="Example: 77A-12345"
              InputProps={{
                startAdornment: <TwoWheelerIcon color="action" sx={{ mr: 1 }} />,
                sx: { 
                  borderRadius: isMobile ? 2 : '8px 0 0 8px',
                  height: '56px'
                }
              }}
            />
            <SearchButton 
              variant="contained" 
              color="primary"
              onClick={handleSearch}
              disabled={loading}
              sx={{
                borderRadius: isMobile ? 2 : '0 8px 8px 0',
                width: isMobile ? '100%' : 'auto',
              }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : 
                <>
                  <SearchIcon sx={{ mr: 1 }} /> Search
                </>
              }
            </SearchButton>
          </Box>
        </CardContent>

        {/* Results Section */}
        {searchResult && (
          <Box sx={{ px: 4, pb: 4 }}>
            <Divider sx={{ mb: 3 }} />
            <Typography variant="h6" gutterBottom>
              Search Results
            </Typography>
            
            {searchResult.length === 0 ? (
              <Alert severity="info" sx={{ borderRadius: 2 }}>
                No violations found for this license plate.
              </Alert>
            ) : (
              searchResult.map((item: Violation, idx: number) => (
                <ResultCard key={idx} elevation={2}>
                  <CardContent>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={6}>
                        <Typography variant="subtitle1" fontWeight="bold">
                          Violation ID: #{item.violation_id}
                        </Typography>
                        <Typography variant="body1" sx={{ mt: 1 }}>
                          <strong>Location:</strong> {item.location || "Unknown location"}
                        </Typography>
                        <Typography variant="body1" sx={{ mt: 1 }}>
                          <strong>Time:</strong> {formatDate(item.detected_at)}
                        </Typography>
                        <Box sx={{ mt: 2 }}>
                          <StatusBadge status={item.violation_status}>
                            {item.violation_status}
                          </StatusBadge>
                        </Box>
                      </Grid>
                      
                      <Grid item xs={12} md={6}>
                        <Typography variant="subtitle2" gutterBottom>
                          Evidence Images:
                        </Typography>
                        <ImageList cols={isMobile ? 2 : 3} gap={8} sx={{ mt: 1 }}>
                          {item.violation_image?.filter(Boolean).map((img: string, i: number) => (
                            <ImageListItem key={i}>
                              <ImageThumb
                                src={normalizeBase64Image(img, "png")}
                                alt={`violation-${i}`}
                                onClick={() => setImageViewer(normalizeBase64Image(img, "png"))}
                              />
                            </ImageListItem>
                          ))}
                        </ImageList>
                      </Grid>
                    </Grid>
                  </CardContent>
                </ResultCard>
              ))
            )}
          </Box>
        )}
      </Card>

      {/* Snackbar */}
      <Snackbar
        open={notification.open}
        autoHideDuration={5000}
        onClose={() => setNotification({ ...notification, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          severity={notification.type as 'error' | 'success' | 'info' | 'warning'}
          onClose={() => setNotification({ ...notification, open: false })}
          sx={{ width: '100%', boxShadow: 3, borderRadius: 2 }}
        >
          {notification.message}
        </Alert>
      </Snackbar>

      {/* Image full view */}
      {imageViewer && (
        <Box
          onClick={() => setImageViewer(null)}
          sx={{
            position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
            backgroundColor: "rgba(0,0,0,0.85)", zIndex: 9999,
            display: "flex", justifyContent: "center", alignItems: "center",
            cursor: "pointer"
          }}
        >
          <img 
            src={imageViewer} 
            alt="full view" 
            style={{ 
              maxWidth: "90%", 
              maxHeight: "90%", 
              borderRadius: '8px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
            }} 
          />
          <Typography 
            variant="caption" 
            sx={{ 
              position: 'absolute', 
              bottom: '20px', 
              color: 'white',
              backgroundColor: 'rgba(0,0,0,0.5)',
              padding: '4px 12px',
              borderRadius: '20px'
            }}
          >
            Click anywhere to close
          </Typography>
        </Box>
      )}
    </Container>
  );
};

export default HomePage;