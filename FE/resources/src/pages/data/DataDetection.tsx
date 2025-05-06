import React, { useEffect, useState, useMemo } from "react";
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Chip,
  Fade,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  Tooltip,
  useMediaQuery,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  Alert,
  Skeleton,
  Badge,
  Snackbar
} from "@mui/material";

// Icons
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";
import PlayCircleOutlineIcon from "@mui/icons-material/PlayCircleOutline";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import VideocamIcon from "@mui/icons-material/Videocam";
import VideocamOffIcon from "@mui/icons-material/VideocamOff";
import FilterAltIcon from "@mui/icons-material/FilterAlt";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import RefreshIcon from "@mui/icons-material/Refresh";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import PauseIcon from "@mui/icons-material/Pause";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";

// Services
import config from "../../config";
import axiosInstance from "../../services/axiosInstance";

// Base URL for API calls
const API_BASE_URL = `${config.API_URL}cameras/`;

// Interface for camera data
interface CameraData {
  camera_id: string;
  device_name: string;
  location: string;
  status: string;
  last_active: string;
  input_url?: string;
  output_url?: string;
}

const DataDetection = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  // State for search and filters
  const [search, setSearch] = useState("");
  const [locationFilter, setLocationFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  
  // State for camera data
  const [data, setData] = useState<CameraData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // State for stream dialog
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedCamera, setSelectedCamera] = useState<CameraData | null>(null);
  const [streamUrl, setStreamUrl] = useState<string | null>(null);
  const [streamLoading, setStreamLoading] = useState(false);
  const [streamError, setStreamError] = useState<string | null>(null);
  
  // State for stream controls
  const [isPaused, setIsPaused] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  
  // Image capture handling
  const imgRef = React.useRef<HTMLImageElement>(null);
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  
  // Options for filters based on data
  const locationOptions = useMemo(() => {
    const locations = data.map(camera => camera.location);
    return ["All", ...Array.from(new Set(locations))];
  }, [data]);

  // Fetch data on component mount
  useEffect(() => {
    fetchCameras();
  }, []);

  // Function to fetch camera data
  const fetchCameras = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const res = await axiosInstance.get<{ data: CameraData[] }>(`${API_BASE_URL}get-all/`);
      setData(res.data.data);
    } catch (err) {
      console.error("Error fetching cameras:", err);
      setError("Failed to load camera data. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  // Refresh camera data
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchCameras();
    setRefreshing(false);
  };

  // Open stream dialog and initialize stream if camera is active
  const handleOpenStream = async (camera: CameraData) => {
    setSelectedCamera(camera);
    setOpenDialog(true);
    setCapturedImage(null);
    setIsPaused(false);
    
    if (camera.status !== "active") {
      setStreamUrl(null);
      setStreamError("This camera is currently inactive");
      return;
    }
    
    setStreamLoading(true);
    setStreamError(null);
    
    try {
      // Request stream URL from backend
      const response = await axiosInstance.patch(`${API_BASE_URL}streaming/${camera.camera_id}/`);
      setStreamUrl(response.data.output_url);
    } catch (error) {
      console.error("Failed to load stream:", error);
      setStreamError("Failed to initialize camera stream. Please try again.");
      setStreamUrl(null);
    } finally {
      setStreamLoading(false);
    }
  };

  // Close stream dialog and reset states
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedCamera(null);
    setStreamUrl(null);
    setStreamError(null);
    setCapturedImage(null);
    setIsPaused(false);
  };

  // Toggle pause/resume stream
  const togglePause = () => {
    if (!isPaused) {
      // About to pause - ensure we capture the current frame
      captureCurrentFrame();
    }
    setIsPaused(prev => !prev);
  };

  // Capture current frame from video stream
  const captureCurrentFrame = () => {
    const img = imgRef.current;
    if (!img || !img.complete || img.naturalWidth === 0) return false;

    if (!canvasRef.current) {
      canvasRef.current = document.createElement("canvas");
    }

    const canvas = canvasRef.current;
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(img, 0, 0);
      try {
        const imageDataUrl = canvas.toDataURL("image/jpeg");
        return imageDataUrl;
      } catch (e) {
        console.error("Error capturing frame:", e);
      }
    }
    return null;
  };

  // Handle capturing an image from the stream
  const handleCaptureImage = () => {
    const capturedImageData = captureCurrentFrame();
    if (capturedImageData) {
      setCapturedImage(capturedImageData);
    }
  };

  // Download captured image
  const downloadCapturedImage = () => {
    if (!capturedImage || !selectedCamera) return;
    
    const link = document.createElement('a');
    link.href = capturedImage;
    link.download = `${selectedCamera.device_name.replace(/\s+/g, '_')}_${new Date().toISOString().replace(/:/g, '-')}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  // Handle location filter change
  const handleLocationFilterChange = (e: any) => {
    setLocationFilter(e.target.value);
  };

  // Handle status filter change
  const handleStatusFilterChange = (e: any) => {
    setStatusFilter(e.target.value);
  };

  // Filter data based on search and filters
  const filteredData = useMemo(() => {
    return data.filter((camera) => {
      const matchesSearch = 
        camera.device_name.toLowerCase().includes(search.toLowerCase()) || 
        camera.location.toLowerCase().includes(search.toLowerCase()) ||
        camera.camera_id.toLowerCase().includes(search.toLowerCase());
      
      const matchesLocation = locationFilter === "All" || camera.location === locationFilter;
      const matchesStatus = statusFilter === "All" || camera.status === statusFilter;
      
      return matchesSearch && matchesLocation && matchesStatus;
    });
  }, [data, search, locationFilter, statusFilter]);

  // Get timestamp in human-readable format
  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }).format(date);
    } catch (e) {
      return 'Unknown';
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography 
          variant="h5" 
          sx={{ 
            mb: 1, 
            fontWeight: "bold", 
            color: "primary.main",
            display: "flex",
            alignItems: "center",
            gap: 1
          }}
        >
          <VideocamIcon /> 
          Camera Data Detection
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Monitor camera feeds in real-time and detect violations
        </Typography>
      </Box>

      {/* Search and Filters */}
      <Card 
        elevation={1} 
        sx={{ 
          mb: 3, 
          borderRadius: 2, 
          overflow: 'visible',
          transition: 'box-shadow 0.3s ease',
          '&:hover': {
            boxShadow: 3
          }
        }}
      >
        <CardContent sx={{ p: { xs: 2, md: 3 } }}>
          <Grid container spacing={2} alignItems="center">
            {/* Search */}
            <Grid item xs={12} md={5}>
              <TextField
                fullWidth
                variant="outlined"
                placeholder="Search by name, ID or location..."
                value={search}
                onChange={handleSearchChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color="action" />
                    </InputAdornment>
                  ),
                  sx: { borderRadius: 2 }
                }}
                size="small"
              />
            </Grid>
            
            {/* Filters */}
            <Grid item xs={12} md={7}>
              <Box sx={{ 
                display: 'flex', 
                gap: 2, 
                flexDirection: isMobile ? 'column' : 'row',
                alignItems: 'center'
              }}>
                <Box sx={{ display: 'flex', gap: 2, width: '100%' }}>
                  {/* Location Filter */}
                  <FormControl size="small" sx={{ flexGrow: 1 }}>
                    <InputLabel>Location</InputLabel>
                    <Select 
                      value={locationFilter} 
                      onChange={handleLocationFilterChange}
                      startAdornment={<LocationOnIcon sx={{ mr: 1, color: 'action.active' }} />}
                    >
                      {locationOptions.map((option) => (
                        <MenuItem key={option} value={option}>
                          {option}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  
                  {/* Status Filter */}
                  <FormControl size="small" sx={{ flexGrow: 1 }}>
                    <InputLabel>Status</InputLabel>
                    <Select 
                      value={statusFilter} 
                      onChange={handleStatusFilterChange}
                      startAdornment={
                        statusFilter === "active" ? 
                          <VideocamIcon sx={{ mr: 1, color: 'success.main' }} /> : 
                          <VideocamOffIcon sx={{ mr: 1, color: 'action.active' }} />
                      }
                    >
                      <MenuItem value="All">All</MenuItem>
                      <MenuItem value="active">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <FiberManualRecordIcon sx={{ fontSize: 12, color: 'success.main' }} />
                          Active
                        </Box>
                      </MenuItem>
                      <MenuItem value="inactive">
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <FiberManualRecordIcon sx={{ fontSize: 12, color: 'error.main' }} />
                          Inactive
                        </Box>
                      </MenuItem>
                    </Select>
                  </FormControl>
                </Box>
                
                {/* Refresh Button */}
                <Tooltip title="Refresh camera data">
                  <IconButton 
                    onClick={handleRefresh} 
                    color="primary"
                    disabled={refreshing || loading}
                    sx={{ 
                      minWidth: 40, 
                      height: 40,
                      animation: refreshing ? 'spin 1s linear infinite' : 'none',
                      '@keyframes spin': {
                        '0%': { transform: 'rotate(0deg)' },
                        '100%': { transform: 'rotate(360deg)' }
                      }
                    }}
                  >
                    <RefreshIcon />
                  </IconButton>
                </Tooltip>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Results */}
      {loading ? (
        <Box sx={{ mt: 2 }}>
          <Skeleton variant="rectangular" height={50} sx={{ mb: 1, borderRadius: 1 }} />
          {Array.from({ length: 4 }).map((_, index) => (
            <Skeleton 
              key={index} 
              variant="rectangular" 
              height={60} 
              sx={{ mb: 1, borderRadius: 1 }} 
            />
          ))}
        </Box>
      ) : error ? (
        <Alert 
          severity="error" 
          sx={{ 
            mt: 2,
            borderRadius: 2,
            boxShadow: 2
          }}
        >
          {error}
        </Alert>
      ) : (
        <Fade in={!loading} timeout={300}>
          <TableContainer 
            component={Paper} 
            sx={{ 
              borderRadius: 2, 
              boxShadow: 2,
              overflow: 'hidden',
              transition: 'all 0.3s ease'
            }}
          >
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: "primary.main" }}>
                  <TableCell sx={{ color: "white", fontWeight: "bold" }}>ID</TableCell>
                  <TableCell sx={{ color: "white", fontWeight: "bold" }}>Device Name</TableCell>
                  {!isMobile && (
                    <TableCell sx={{ color: "white", fontWeight: "bold" }}>Location</TableCell>
                  )}
                  <TableCell sx={{ color: "white", fontWeight: "bold" }}>Status</TableCell>
                  {!isMobile && (
                    <TableCell sx={{ color: "white", fontWeight: "bold" }}>Last Active</TableCell>
                  )}
                  <TableCell align="center" sx={{ color: "white", fontWeight: "bold" }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredData.length === 0 ? (
                  <TableRow>
                    <TableCell 
                      colSpan={isMobile ? 4 : 6} 
                      align="center" 
                      sx={{ py: 4 }}
                    >
                      <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
                        <FilterAltIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
                        No cameras found matching your criteria
                      </Typography>
                      <Button 
                        variant="outlined" 
                        size="small" 
                        onClick={() => {
                          setSearch("");
                          setLocationFilter("All");
                          setStatusFilter("All");
                        }}
                        startIcon={<RefreshIcon />}
                      >
                        Reset Filters
                      </Button>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredData.map((camera) => (
                    <TableRow 
                      key={camera.camera_id}
                      sx={{ 
                        '&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' },
                        transition: 'background-color 0.2s ease',
                        cursor: 'pointer'
                      }}
                      onClick={() => handleOpenStream(camera)}
                    >
                      <TableCell sx={{ fontSize: '0.875rem' }}>
                        {camera.camera_id}
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          {camera.status === 'active' ? (
                            <Badge
                              overlap="circular"
                              anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                              badgeContent={
                                <FiberManualRecordIcon 
                                  sx={{ 
                                    fontSize: 12, 
                                    color: 'success.main',
                                    animation: 'pulse 1.5s infinite ease-in-out',
                                    "@keyframes pulse": {
                                      "0%": { opacity: 1 },
                                      "50%": { opacity: 0.6 },
                                      "100%": { opacity: 1 },
                                    }
                                  }} 
                                />
                              }
                            >
                              <VideocamIcon sx={{ color: 'primary.main', mr: 1 }} />
                            </Badge>
                          ) : (
                            <VideocamOffIcon color="error" sx={{ mr: 1 }} />
                          )}
                          <Typography variant="body2" fontWeight="medium">
                            {camera.device_name}
                          </Typography>
                        </Box>
                      </TableCell>
                      {!isMobile && (
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                            <LocationOnIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary', mt: '2px' }} />
                            <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                              {camera.location}
                            </Typography>
                          </Box>
                        </TableCell>
                      )}
                      <TableCell>
                        <Chip 
                          label={camera.status === 'active' ? 'Active' : 'Inactive'} 
                          size="small"
                          sx={{
                            backgroundColor: camera.status === 'active' ? 'success.light' : 'error.light',
                            color: 'white',
                            fontWeight: 'medium',
                            minWidth: 70
                          }}
                        />
                      </TableCell>
                      {!isMobile && (
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <CalendarTodayIcon fontSize="small" sx={{ mr: 0.5, color: 'text.secondary' }} />
                            <Typography variant="body2" sx={{ fontSize: '0.875rem' }}>
                              {formatTimestamp(camera.last_active)}
                            </Typography>
                          </Box>
                        </TableCell>
                      )}
                      <TableCell align="center">
                        <Tooltip title="View Stream">
                          <IconButton 
                            color="primary" 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenStream(camera);
                            }}
                            sx={{ 
                              backgroundColor: 'primary.light', 
                              color: 'white',
                              '&:hover': { 
                                backgroundColor: 'primary.main',
                                transform: 'scale(1.05)'
                              },
                              transition: 'all 0.2s ease'
                            }}
                          >
                            <PlayCircleOutlineIcon />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Fade>
      )}
      
      {/* Stream Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog} 
        maxWidth="lg" 
        fullWidth
        fullScreen={isMobile}
        TransitionComponent={Fade}
        TransitionProps={{ timeout: 300 }}
        sx={{
          '& .MuiDialog-paper': {
            borderRadius: 2,
            overflow: 'hidden'
          }
        }}
      >
        <DialogTitle 
          sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            borderBottom: 1,
            borderColor: 'divider',
            pb: 2,
            bgcolor: 'primary.dark',
            color: 'white'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <PlayCircleOutlineIcon sx={{ mr: 1 }} />
            <Typography variant="h6">
              {selectedCamera?.device_name || 'Camera Stream'}
            </Typography>
            {selectedCamera?.status === 'active' && (
              <Chip 
                size="small" 
                label="Live" 
                color="error"
                icon={<FiberManualRecordIcon />}
                sx={{ ml: 2, '& .MuiChip-icon': { fontSize: 10 } }}
              />
            )}
          </Box>
          <IconButton onClick={handleCloseDialog} size="small" sx={{ color: 'white' }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        
        <DialogContent sx={{ p: 0, overflow: 'hidden', bgcolor: '#000' }}>
          <Box sx={{ position: 'relative', width: '100%', height: isMobile ? '70vh' : '540px' }}>
            {/* Loading indicator */}
            {streamLoading && (
              <Box
                sx={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  zIndex: 10,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 2,
                }}
              >
                <CircularProgress sx={{ color: '#fff' }} />
                <Typography variant="body2" sx={{ color: '#fff' }}>
                  Initializing stream...
                </Typography>
              </Box>
            )}
            
            {/* Error display */}
            {streamError && (
              <Box
                sx={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  zIndex: 10,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 2,
                  p: 3,
                  textAlign: 'center',
                }}
              >
                <ErrorOutlineIcon sx={{ fontSize: 60, color: '#f44336' }} />
                <Typography variant="h6" sx={{ color: '#fff' }}>
                  {streamError}
                </Typography>
                {selectedCamera?.status !== 'active' && (
                  <Typography variant="body2" sx={{ color: '#bbb', maxWidth: '80%' }}>
                    This camera is currently inactive. Please check the camera status or try again later.
                  </Typography>
                )}
              </Box>
            )}
            
            {/* Stream image */}
            {streamUrl && !streamError && (
              <Box sx={{ position: 'relative', width: '100%', height: '100%' }}>
                <img
                  ref={imgRef}
                  src={isPaused ? capturedImage || '' : `${streamUrl}?t=${Date.now()}`}
                  alt="Camera Stream"
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    opacity: streamLoading ? 0.7 : 1,
                    transition: 'opacity 0.3s ease',
                  }}
                  onLoad={() => setStreamLoading(false)}
                  onError={() => setStreamError("Failed to load stream")}
                />
                
                {/* Status indicator */}
                <Box
                  sx={{
                    position: 'absolute',
                    top: 16,
                    right: 16,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    background: 'rgba(0,0,0,0.6)',
                    padding: '6px 12px',
                    borderRadius: 6,
                    color: '#fff',
                    zIndex: 10,
                    backdropFilter: 'blur(4px)',
                  }}
                >
                  <FiberManualRecordIcon 
                    sx={{ 
                      color: isPaused ? 'gray' : '#f44336',
                      animation: isPaused ? 'none' : 'pulse 1.5s infinite ease-in-out',
                      "@keyframes pulse": {
                        "0%": { opacity: 1 },
                        "50%": { opacity: 0.5 },
                        "100%": { opacity: 1 },
                      }
                    }} 
                  />
                  <Typography variant="body2" fontWeight="medium">
                    {isPaused ? 'Paused' : 'Live'}
                  </Typography>
                </Box>
                
                {/* Control buttons */}
                <Box
                  sx={{
                    position: 'absolute',
                    bottom: 16,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    display: 'flex',
                    gap: 2,
                    background: 'rgba(0,0,0,0.6)',
                    padding: '8px 16px',
                    borderRadius: 8,
                    backdropFilter: 'blur(4px)',
                    zIndex: 10,
                  }}
                >
                  {/* Pause/Resume button */}
                  <Tooltip title={isPaused ? 'Resume stream' : 'Pause stream'}>
                    <IconButton 
                      onClick={togglePause}
                      sx={{ 
                        color: '#fff', 
                        backgroundColor: isPaused ? 'rgba(76, 175, 80, 0.2)' : 'rgba(244, 67, 54, 0.2)',
                        '&:hover': {
                          backgroundColor: isPaused ? 'rgba(76, 175, 80, 0.4)' : 'rgba(244, 67, 54, 0.4)'
                        },
                        transition: 'all 0.2s ease'
                      }}
                    >
                      {isPaused ? <PlayArrowIcon /> : <PauseIcon />}
                    </IconButton>
                  </Tooltip>
                  
                  {/* Capture button */}
                  <Tooltip title="Capture image">
                    <IconButton 
                      onClick={handleCaptureImage}
                      sx={{ 
                        color: '#fff', 
                        backgroundColor: 'rgba(33, 150, 243, 0.2)',
                        '&:hover': {
                          backgroundColor: 'rgba(33, 150, 243, 0.4)'
                        }
                      }}
                    >
                      <PhotoCameraIcon />
                    </IconButton>
                  </Tooltip>
                  
                  {/* Download button - only shown when image is captured */}
                  {capturedImage && (
                    <Tooltip title="Download captured image">
                      <IconButton 
                        onClick={downloadCapturedImage}
                        sx={{ 
                          color: '#fff', 
                          backgroundColor: 'rgba(255, 193, 7, 0.2)',
                          '&:hover': {
                            backgroundColor: 'rgba(255, 193, 7, 0.4)'
                          }
                        }}
                      >
                        <FileDownloadIcon />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
              </Box>
            )}
          </Box>
        </DialogContent>
        
        {/* Dialog footer with camera info */}
        <DialogActions sx={{ 
          p: 2,
          bgcolor: 'background.paper',
          borderTop: 1,
          borderColor: 'divider',
          display: 'block'
        }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Box>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  {selectedCamera?.device_name}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <LocationOnIcon fontSize="small" color="action" />
                  <Typography variant="body2" color="text.secondary">
                    {selectedCamera?.location}
                  </Typography>
                </Box>
              </Box>
            </Grid>
            <Grid item xs={12} md={6} sx={{ 
              display: 'flex', 
              justifyContent: { xs: 'flex-start', md: 'flex-end' }, 
              alignItems: 'center' 
            }}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 2
              }}>
              {selectedCamera?.status === 'active' ? (
                <Box 
                  sx={{ 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    px: 1.5, 
                    py: 0.5, 
                    borderRadius: 4,
                    backgroundColor: 'rgba(76, 175, 80, 0.1)',
                    color: 'success.main',
                    border: 1,
                    borderColor: 'success.light',
                  }}
                >
                  <FiberManualRecordIcon sx={{ fontSize: 12, mr: 0.5 }} />
                  <Typography variant="caption" fontWeight="medium">
                    Active
                  </Typography>
                </Box>
              ) : (
                <Box 
                  sx={{ 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    px: 1.5, 
                    py: 0.5, 
                    borderRadius: 4,
                    backgroundColor: 'rgba(244, 67, 54, 0.1)',
                    color: 'error.main',
                    border: 1,
                    borderColor: 'error.light',
                  }}
                >
                  <FiberManualRecordIcon sx={{ fontSize: 12, mr: 0.5 }} />
                  <Typography variant="caption" fontWeight="medium">
                    Inactive
                  </Typography>
                </Box>
              )}
            </Box>
          </Grid>
        </Grid>
      </DialogActions>
      
      {/* Notification snackbar */}
      <Snackbar 
        open={!!capturedImage} 
        autoHideDuration={3000} 
        onClose={() => {}} 
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        sx={{ bottom: { xs: 70, sm: 20 } }}
      >
        <Alert 
          severity="success" 
          variant="filled"
          action={
            <Button 
              color="inherit" 
              size="small" 
              onClick={downloadCapturedImage}
              startIcon={<FileDownloadIcon />}
            >
              Save
            </Button>
          }
        >
          Image captured successfully
        </Alert>
      </Snackbar>
    </Dialog>
    </Box>  
  );
};

export default DataDetection;