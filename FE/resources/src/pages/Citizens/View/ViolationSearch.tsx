import React, { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CardMedia,
  Chip,
  CircularProgress,
  Collapse,
  Container,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  InputAdornment,
  Paper,
  Skeleton,
  Snackbar,
  Tab,
  Tabs,
  TextField,
  Tooltip,
  Typography,
  useTheme
} from "@mui/material";
import TwoWheelerIcon from '@mui/icons-material/TwoWheeler';
import { 
  Search as SearchIcon, 
  Close as CloseIcon,
  ExpandLess, 
  ExpandMore,
  AccessTime as TimeIcon,
  LocationOn as LocationIcon,
  Visibility as VisibilityIcon,
  PhotoLibrary as PhotoLibraryIcon,
  Info as InfoIcon
} from "@mui/icons-material";
import axios from "axios";
import config from "../../../config";
import { motion } from "framer-motion";

const API_BASE_URL = `${config.API_URL}violations`;
interface Violation {
  violation_id: number;
  plate_number: string;
  vehicle_id?: string;
  location: string;
  detected_at: string;
  violation_image: string[];
  violation_status: string;
}

type ViolationsByCitizen = Record<string, Violation[]>;

interface NotificationState {
  open: boolean;
  type: "success" | "error" | "info" | "warning";
  message: string;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`violation-tabpanel-${index}`}
      aria-labelledby={`violation-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

const statusColors: Record<string, string> = {
  "AI Detected": "#FFD700",
  "Reported": "#FF9800",
  "Verified": "#4CAF50",
  "Approved": "#4CAF50",
  "Rejected": "#F44336",
  "Modified": "#2196F3",
  "Provided": "#9C27B0",
};

const StatusChip = ({ status }: { status: string }) => {
  const getStatusColor = () => {
    return statusColors[status] || "#757575";
  };

  return (
    <Chip 
      label={status} 
      size="small"
      sx={{ 
        bgcolor: `${getStatusColor()}20`, 
        color: getStatusColor(),
        fontWeight: 'medium',
        borderColor: getStatusColor(),
        '& .MuiChip-label': {
          px: 1
        }
      }}
      variant="outlined"
    />
  );
};

const ViolationLookupPage: React.FC = () => {
  const theme = useTheme();
  const [tabValue, setTabValue] = useState(0);
  const [plateNumber, setPlateNumber] = useState("");
  const [searchResult, setSearchResult] = useState<Violation[] | null>(null);
  const [citizenViolations, setCitizenViolations] = useState<ViolationsByCitizen | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadCitizen, setLoadCitizen] = useState(true);
  const [expandedPlates, setExpandedPlates] = useState<Record<string, boolean>>({});
  const [notification, setNotification] = useState<NotificationState>({
    open: false,
    type: "info",
    message: "",
  });
  const [imageViewer, setImageViewer] = useState<{url: string, title: string} | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const normalizeBase64Image = (data: string, format: "jpeg" | "png" = "jpeg") => {
    if (data.startsWith("data:image/")) {
      return data; 
    }
    return `data:image/${format};base64,${data}`; 
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

  useEffect(() => {
    fetchCitizenViolations();
  }, []);

  const fetchCitizenViolations = async () => {
    setLoadCitizen(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/search-by-citizen/`);
      setCitizenViolations(response.data?.data || {});
    } catch (error) {
      setNotification({
        open: true,
        type: "error",
        message: "Unable to fetch data from registered vehicles.",
      });
    } finally {
      setLoadCitizen(false);
    }
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleSearch = async () => {
  if (!plateNumber.trim()) {
    setNotification({
      open: true,
      type: "warning",
      message: "Please enter a license plate number",
    });
    return;
  }

  setLoading(true);
  setSearchResult(null);
  setHasSearched(true);

  try {
    // Không cần phải chuẩn hóa phía client vì BE đã xử lý normalize
    // Gửi plate number nguyên bản tới API
    const response = await axios.post(`${API_BASE_URL}/search-by-plate-number/`, {
      plate_number: plateNumber.trim()
    });
    
    const data: Violation[] = response.data?.data?.violations || [];
    
    // Sort violations with the most recent ones first
    const sortedData = [...data].sort((a, b) => 
      new Date(b.detected_at).getTime() - new Date(a.detected_at).getTime()
    );
    
    setSearchResult(sortedData);
    
    if (sortedData.length > 0) {
      setNotification({ 
        open: true, 
        type: "success", 
        message: `Found ${sortedData.length} violation${sortedData.length !== 1 ? 's' : ''} for plate ${plateNumber}` 
      });
    } else {
      setNotification({ 
        open: true, 
        type: "info", 
        message: "No violations found for this plate number" 
      });
    }
  } catch (error: any) {
    setNotification({
      open: true,
      type: "error",
      message: error?.response?.data?.message || "Error searching for violations",
    });
  } finally {
    setLoading(false);
  }
};

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      handleSearch();
    }
  };

  const toggleExpand = (plateNumber: string) => {
    setExpandedPlates(prev => ({
      ...prev,
      [plateNumber]: !prev[plateNumber]
    }));
  };

  const getViolationCountByCitizen = () => {
    if (!citizenViolations) return 0;
    
    return Object.values(citizenViolations).reduce((total, violations) => 
      total + violations.length, 0
    );
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography 
          variant="h4" 
          component="h1" 
          gutterBottom
          sx={{ 
            fontWeight: 'bold',
            color: theme.palette.primary.main,
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}
        >
          <TwoWheelerIcon fontSize="large" />
          Violation Lookup
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Search for traffic violations by license plate number or view violations for your registered vehicles
        </Typography>
      </Box>

      <Paper 
        elevation={2} 
        sx={{ 
          borderRadius: 2,
          overflow: 'hidden',
          mb: 4
        }}
      >
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{ 
            borderBottom: 1, 
            borderColor: 'divider',
            bgcolor: theme.palette.background.default
          }}
        >
          <Tab 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <SearchIcon fontSize="small" />
                <span>Search by Plate Number</span>
              </Box>
            } 
          />
          <Tab 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TwoWheelerIcon fontSize="small" />
                <span>My Registered Vehicles</span>
                {!loadCitizen && citizenViolations && getViolationCountByCitizen() > 0 && (
                  <Chip 
                    label={getViolationCountByCitizen()} 
                    size="small" 
                    color="primary" 
                    sx={{ ml: 1, height: 20 }}
                  />
                )}
              </Box>
            } 
          />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <Box sx={{ px: 3 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={8}>
                <TextField
                  fullWidth
                  label="License Plate Number"
                  variant="outlined"
                  value={plateNumber}
                  onChange={(e) => setPlateNumber(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Enter license plate (e.g., 59A-12345, 59A 12345, 59A12345)"
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <TwoWheelerIcon color="action" />
                      </InputAdornment>
                    ),
                    endAdornment: plateNumber && (
                      <InputAdornment position="end">
                        <IconButton
                          aria-label="clear input"
                          onClick={() => setPlateNumber('')}
                          edge="end"
                          size="small"
                        >
                          <CloseIcon fontSize="small" />
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <Button
                  variant="contained"
                  fullWidth
                  size="large"
                  onClick={handleSearch}
                  disabled={loading || !plateNumber.trim()}
                  startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <SearchIcon />}
                  sx={{ 
                    height: '56px',
                    boxShadow: 2
                  }}
                >
                  {loading ? "Searching..." : "Search Violations"}
                </Button>
              </Grid>
            </Grid>

            {loading && (
              <Box sx={{ mt: 4 }}>
                <Grid container spacing={3}>
                  {[1, 2].map((item) => (
                    <Grid item xs={12} md={6} key={item}>
                      <Card>
                        <Skeleton variant="rectangular" height={200} />
                        <CardContent>
                          <Skeleton variant="text" width="60%" height={30} />
                          <Skeleton variant="text" width="40%" />
                          <Skeleton variant="text" width="70%" />
                        </CardContent>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}

            {hasSearched && !loading && searchResult !== null && (
              <Box sx={{ mt: 4 }}>
                {searchResult.length === 0 ? (
                  <Paper 
                    elevation={0} 
                    sx={{ 
                      p: 4, 
                      textAlign: 'center',
                      bgcolor: 'background.default',
                      borderRadius: 2
                    }}
                  >
                    <InfoIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" gutterBottom>
                      No violations found
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      No violation records were found for license plate "{plateNumber}"
                    </Typography>
                  </Paper>
                ) : (
                  <Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6">
                        Results for: <Typography component="span" fontWeight="bold" color="primary.main">{plateNumber}</Typography>
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Found {searchResult.length} violation{searchResult.length !== 1 ? 's' : ''}
                      </Typography>
                    </Box>
                    
                    <Grid container spacing={3}>
                      {searchResult.map((violation, index) => (
                        <Grid item xs={12} md={6} key={violation.violation_id || index} component={motion.div}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.3, delay: index * 0.1 }}
                        >
                          <Card 
                            sx={{ 
                              height: '100%',
                              display: 'flex',
                              flexDirection: 'column',
                              transition: 'transform 0.2s, box-shadow 0.2s',
                              '&:hover': {
                                transform: 'translateY(-4px)',
                                boxShadow: 4
                              }
                            }}
                          >
                            {violation.violation_image && violation.violation_image.length > 0 && (
                              <Box sx={{ position: 'relative' }}>
                                <CardMedia
                                  component="img"
                                  height={200}
                                  image={normalizeBase64Image(violation.violation_image[0], "png")}
                                  alt={`Violation ${violation.violation_id}`}
                                  sx={{ objectFit: 'cover' }}
                                />
                                {violation.violation_image.length > 1 && (
                                  <Tooltip title="View all images">
                                    <Chip
                                      icon={<PhotoLibraryIcon />}
                                      label={`${violation.violation_image.length} photos`}
                                      size="small"
                                      onClick={() => setImageViewer({
                                        url: normalizeBase64Image(violation.violation_image[0], "png"),
                                        title: `Violation #${violation.violation_id} - ${violation.plate_number}`
                                      })}
                                      sx={{
                                        position: 'absolute',
                                        bottom: 8,
                                        right: 8,
                                        bgcolor: 'rgba(0,0,0,0.6)',
                                        color: 'white',
                                        '& .MuiChip-icon': {
                                          color: 'white'
                                        }
                                      }}
                                    />
                                  </Tooltip>
                                )}
                              </Box>
                            )}
                            <CardContent sx={{ flexGrow: 1 }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                                <Typography variant="h6" component="div" gutterBottom>
                                  ID: {violation.violation_id}
                                </Typography>
                                <StatusChip status={violation.violation_status || "Reported"} />
                              </Box>
                              
                              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                                <LocationIcon fontSize="small" color="action" sx={{ mr: 1 }} />
                                <Typography variant="body2" color="text.secondary">
                                  {violation.location || "Location not specified"}
                                </Typography>
                              </Box>
                              
                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                <TimeIcon fontSize="small" color="action" sx={{ mr: 1 }} />
                                <Typography variant="body2" color="text.secondary">
                                  {formatDate(violation.detected_at)}
                                </Typography>
                              </Box>
                              
                              {violation.violation_image && violation.violation_image.length > 0 && (
                                <Box sx={{ mt: 2 }}>
                                  <Button
                                    variant="outlined"
                                    size="small"
                                    startIcon={<VisibilityIcon />}
                                    onClick={() => setImageViewer({
                                      url: normalizeBase64Image(violation.violation_image[0], "png"),
                                      title: `Violation #${violation.violation_id} - ${violation.plate_number}`
                                    })}
                                    fullWidth
                                  >
                                    View Image
                                  </Button>
                                </Box>
                              )}
                            </CardContent>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                )}
              </Box>
            )}
          </Box>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Box sx={{ px: 3 }}>
            {loadCitizen ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
                <CircularProgress />
              </Box>
            ) : !citizenViolations || Object.keys(citizenViolations).length === 0 ? (
              <Paper 
                elevation={0} 
                sx={{ 
                  p: 4, 
                  textAlign: 'center',
                  bgcolor: 'background.default',
                  borderRadius: 2
                }}
              >
                <InfoIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                <Typography variant="h6" gutterBottom>
                  No registered vehicles found
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  You don't have any registered vehicles or there are no violations associated with your vehicles
                </Typography>
              </Paper>
            ) : (
              <Box>
                {Object.entries(citizenViolations).map(([citizenId, vList]: [string, Violation[]]) => {
                  const groupedByPlate: Record<string, Violation[]> = vList.reduce((acc, curr) => {
                    if (!acc[curr.plate_number]) {
                      acc[curr.plate_number] = [];
                    }
                    
                    // Sort violations by date (newest first)
                    acc[curr.plate_number].push(curr);
                    acc[curr.plate_number].sort((a, b) => 
                      new Date(b.detected_at).getTime() - new Date(a.detected_at).getTime()
                    );
                    
                    return acc;
                  }, {} as Record<string, Violation[]>);

                  return (
                    <Box key={citizenId} sx={{ mb: 4 }}>
                      <Paper
                        elevation={1}
                        sx={{
                          p: 3,
                          borderRadius: 2,
                          bgcolor: theme.palette.background.default
                        }}
                      >
                        <Typography 
                          variant="h6" 
                          sx={{ 
                            mb: 2, 
                            display: 'flex', 
                            alignItems: 'center',
                            gap: 1
                          }}
                        >
                          <TwoWheelerIcon color="primary" />
                          Your Registered Vehicles
                          <Chip 
                            label={`ID: ${citizenId}`} 
                            size="small" 
                            variant="outlined"
                            sx={{ ml: 1 }}
                          />
                        </Typography>

                        {Object.entries(groupedByPlate).map(([plate, violations], index: number) => (
                          <Paper
                            key={`${plate}-${index}`}
                            elevation={2}
                            sx={{
                              mt: 2,
                              borderRadius: 2,
                              overflow: 'hidden'
                            }}
                          >
                            <Box
                              sx={{
                                p: 2,
                                bgcolor: theme.palette.primary.main,
                                color: 'white',
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                cursor: 'pointer'
                              }}
                              onClick={() => toggleExpand(plate)}
                            >
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <TwoWheelerIcon />
                                <Typography variant="subtitle1" fontWeight="bold">
                                  {plate}
                                </Typography>
                              </Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Chip
                                  label={`${violations.length} violation${violations.length !== 1 ? 's' : ''}`}
                                  size="small"
                                  sx={{
                                    bgcolor: 'rgba(255,255,255,0.2)',
                                    color: 'white'
                                  }}
                                />
                                <IconButton
                                  sx={{ color: 'white' }}
                                  aria-label={expandedPlates[plate] ? 'collapse' : 'expand'}
                                >
                                  {expandedPlates[plate] ? <ExpandLess /> : <ExpandMore />}
                                </IconButton>
                              </Box>
                            </Box>

                            <Collapse in={expandedPlates[plate]} timeout="auto" unmountOnExit>
                              <Box sx={{ p: 2 }}>
                                <Grid container spacing={2}>
                                  {violations.map((violation, idx: number) => (
                                    <Grid item xs={12} key={`${violation.violation_id}-${idx}`}>
                                      <Card 
                                        sx={{ 
                                          display: 'flex',
                                          flexDirection: { xs: 'column', sm: 'row' },
                                          mb: 2
                                        }}
                                      >
                                        {violation.violation_image && violation.violation_image.length > 0 && (
                                          <CardMedia
                                            component="img"
                                            sx={{ 
                                              width: { xs: '100%', sm: 200 },
                                              height: { xs: 200, sm: 'auto' },
                                              objectFit: 'cover',
                                              cursor: 'pointer'
                                            }}
                                            image={normalizeBase64Image(violation.violation_image[0], "png")}
                                            alt={`Violation ${violation.violation_id}`}
                                            onClick={() => setImageViewer({
                                              url: normalizeBase64Image(violation.violation_image[0], "png"),
                                              title: `Violation #${violation.violation_id} - ${violation.plate_number}`
                                            })}
                                          />
                                        )}
                                        <CardContent sx={{ flex: 1 }}>
                                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                                            <Typography variant="subtitle1" component="div">
                                              Violation #{violation.violation_id}
                                            </Typography>
                                            <StatusChip status={violation.violation_status || "Reported"} />
                                          </Box>
                                          
                                          <Divider sx={{ my: 1 }} />
                                          
                                          <Grid container spacing={2}>
                                            <Grid item xs={12} sm={6}>
                                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                <LocationIcon fontSize="small" color="action" sx={{ mr: 1 }} />
                                                <Typography variant="body2" color="text.secondary">
                                                  {violation.location || "Location not specified"}
                                                </Typography>
                                              </Box>
                                            </Grid>
                                            <Grid item xs={12} sm={6}>
                                              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                                <TimeIcon fontSize="small" color="action" sx={{ mr: 1 }} />
                                                <Typography variant="body2" color="text.secondary">
                                                  {formatDate(violation.detected_at)}
                                                </Typography>
                                              </Box>
                                            </Grid>
                                          </Grid>
                                          
                                          {violation.violation_image && violation.violation_image.length > 1 && (
                                            <Box sx={{ mt: 2 }}>
                                              <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                                                All Evidence Photos:
                                              </Typography>
                                              <Box 
                                                sx={{ 
                                                  display: 'flex', 
                                                  gap: 1,
                                                  overflowX: 'auto',
                                                  pb: 1
                                                }}
                                              >
                                                {violation.violation_image.map((img, imgIdx) => (
                                                  <Box
                                                    key={imgIdx}
                                                    component="img"
                                                    src={normalizeBase64Image(img, "png")}
                                                    alt={`Violation evidence ${imgIdx + 1}`}
                                                    sx={{
                                                      width: 80,
                                                      height: 80,
                                                      objectFit: 'cover',
                                                      borderRadius: 1,
                                                      cursor: 'pointer',
                                                      transition: 'transform 0.2s',
                                                      '&:hover': {
                                                        transform: 'scale(1.05)'
                                                      }
                                                    }}
                                                    onClick={() => setImageViewer({
                                                      url: normalizeBase64Image(img, "png"),
                                                      title: `Violation #${violation.violation_id} - Photo ${imgIdx + 1}`
                                                    })}
                                                  />
                                                ))}
                                              </Box>
                                            </Box>
                                          )}
                                        </CardContent>
                                      </Card>
                                    </Grid>
                                  ))}
                                </Grid>
                              </Box>
                            </Collapse>
                          </Paper>
                        ))}
                      </Paper>
                    </Box>
                  );
                })}
              </Box>
            )}
          </Box>
        </TabPanel>
      </Paper>

      {/* Image Viewer Dialog */}
      <Dialog 
        open={!!imageViewer} 
        onClose={() => setImageViewer(null)} 
        maxWidth="lg"
        fullWidth
      >
        {imageViewer && (
          <>
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="h6">{imageViewer.title}</Typography>
              <IconButton edge="end" color="inherit" onClick={() => setImageViewer(null)} aria-label="close">
                <CloseIcon />
              </IconButton>
            </DialogTitle>
            <DialogContent dividers sx={{ p: 0, textAlign: 'center', bgcolor: 'black' }}>
              <img 
                src={imageViewer.url} 
                alt="Full size" 
                style={{ 
                  maxWidth: '100%', 
                  maxHeight: 'calc(90vh - 64px)',
                  objectFit: 'contain'
                }} 
              />
            </DialogContent>
          </>
        )}
      </Dialog>

      {/* Snackbar Notifications */}
      <Snackbar
        open={notification.open}
        autoHideDuration={4000}
        onClose={() => setNotification({ ...notification, open: false })}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert 
          severity={notification.type} 
          variant="filled"
          onClose={() => setNotification({ ...notification, open: false })}
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default ViolationLookupPage;