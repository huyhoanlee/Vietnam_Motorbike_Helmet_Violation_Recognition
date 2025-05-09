import React, { useEffect, useState, useMemo, useRef } from "react";
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
} from "@mui/material";
import { alpha } from "@mui/material/styles";

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
import CalendarTodayIcon from "@mui/icons-material/CalendarToday";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";

// Services
import config from "../../config";
import axiosInstance from "../../services/axiosInstance";

// Components
import MJPEGStreamViewer from "./MJPEGStreamViewer";

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
  const [statusFilter, setStatusFilter] = useState<"All" | "active" | "inactive">("All");

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
  const [streamPaused, setStreamPaused] = useState(false);
  const streamPauseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Options for filters based on data
  const locationOptions = useMemo(() => {
    const locations = data.map((camera) => camera.location);
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
      // Make sure we have the correct API endpoint
      const res = await axiosInstance.get<{ data: CameraData[] }>(`${API_BASE_URL}get-all/`);
      
      // Check if response has data and correct format
      if (res.data && Array.isArray(res.data.data)) {
        // Sort data by last_active timestamp (newest first)
        const sortedData = [...res.data.data].sort((a, b) => {
          if (!a.last_active && !b.last_active) return 0;
          if (!a.last_active) return 1;
          if (!b.last_active) return -1;
          return new Date(b.last_active).getTime() - new Date(a.last_active).getTime();
        });
        setData(sortedData);
      } else {
        console.error("Invalid response format:", res.data);
        setData([]);
        setError("Invalid data format received from the server");
      }
    } catch (err) {
      console.error("Error fetching cameras:", err);
      // Provide a fallback empty array to prevent UI errors
      setData([]);
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

  // Function to handle opening a stream dialog
  const handleOpenStream = async (camera: CameraData) => {
    setSelectedCamera(camera);
    setOpenDialog(true);
    setStreamPaused(false);
    
    if (camera.status !== "active") {
      setStreamUrl(null);
      setStreamError("This camera is currently inactive");
      return;
    }
    
    setStreamLoading(true);
    setStreamError(null);
    
    try {
      // For demo/testing, we use a fixed URL
      // In production, you would use the camera's output_url
      let streamingUrl = "https://huyhoanlee-simulate-streaming.hf.space/video";
      
      // In production, you would use: camera.output_url
      // If camera.output_url exists, use it instead of the fixed URL
      if (camera.output_url) {
        streamingUrl = camera.output_url;
        console.log(`Using camera's output URL: ${streamingUrl}`);
      } else {
        console.log(`Using demo stream URL: ${streamingUrl}`);
      }
      
      // Set the stream URL
      setStreamUrl(streamingUrl);
      
      // Optional: Notify the backend that we're starting to stream this camera
      try {
        await axiosInstance.patch(`${API_BASE_URL}streaming/${camera.camera_id}/`);
        console.log(`Notified backend that streaming started for camera ${camera.camera_id}`);
      } catch (error) {
        // Just log the error but continue as we already have the stream URL
        console.warn(`Failed to notify backend about streaming, but will continue anyway: ${error}`);
      }
    } catch (error) {
      console.error("Failed to load stream:", error);
      setStreamError("Failed to initialize the video stream. Please try again.");
    } finally {
      setStreamLoading(false);
    }
  };

  // Close stream dialog and reset states
  const handleCloseDialog = () => {
    setOpenDialog(false);
    
    // Clear any pending timeouts
    if (streamPauseTimeoutRef.current) {
      clearTimeout(streamPauseTimeoutRef.current);
      streamPauseTimeoutRef.current = null;
    }
    
    // Wait a bit before clearing the camera and URL to allow for a smooth transition
    setTimeout(() => {
      setSelectedCamera(null);
      setStreamUrl(null);
      setStreamError(null);
      setStreamPaused(false);
    }, 300);
  };

  // Handle pause with debounce to prevent rapid state changes
  const handlePause = () => {
    console.log("Parent component received pause notification");
    
    // Clear any existing timeout
    if (streamPauseTimeoutRef.current) {
      clearTimeout(streamPauseTimeoutRef.current);
    }
    
    // Debounce the state change
    streamPauseTimeoutRef.current = setTimeout(() => {
      setStreamPaused(true);
      console.log("Parent component updated pause state to true");
    }, 300); // Use a longer delay to ensure child component finishes its state change first
    
    // We don't manipulate the URL or do anything else - let the player handle it
  };

  // Handle resume with debounce
  const handleResume = async () => {
    console.log("Parent component received resume notification");
    
    // Clear any existing timeout
    if (streamPauseTimeoutRef.current) {
      clearTimeout(streamPauseTimeoutRef.current);
    }
    
    // Debounce the state change
    streamPauseTimeoutRef.current = setTimeout(() => {
      setStreamPaused(false);
      console.log("Parent component updated pause state to false");
    }, 300); // Use a longer delay to ensure child component finishes its state change first
    
    // No need to reinitialize the stream, as the MJPEGStreamViewer handles it internally
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
    setStatusFilter(e.target.value as "All" | "active" | "inactive");
  };

  // Filter data based on search and filters
  const filteredData = useMemo(() => {
    // Safety check to prevent filtering null/undefined data
    if (!data || !Array.isArray(data)) {
      console.warn("Attempted to filter invalid data:", data);
      return [];
    }
    
    try {
      return data
        .filter((camera) => {
          // Ensure camera properties exist before accessing
          const deviceName = camera?.device_name || "";
          const location = camera?.location || "";
          const cameraId = camera?.camera_id || "";
          const status = camera?.status || "";
          
          // Case-insensitive search for device name, location, and camera_id
          const matchesSearch = search 
            ? deviceName.toLowerCase().includes(search.toLowerCase()) ||
              location.toLowerCase().includes(search.toLowerCase()) ||
              cameraId.toLowerCase().includes(search.toLowerCase())
            : true;
          
          // Match location
          const matchesLocation = locationFilter === "All" || location === locationFilter;
          
          // Match status - handle different status naming variations
          const matchesStatus = 
            statusFilter === "All" || 
            (statusFilter === "active" && status === "active") || 
            (statusFilter === "inactive" && status !== "active");
          
          return matchesSearch && matchesLocation && matchesStatus;
        })
        // Sort by last_active timestamp (newest first)
        .sort((a, b) => {
          if (!a.last_active && !b.last_active) return 0;
          if (!a.last_active) return 1;
          if (!b.last_active) return -1;
          return new Date(b.last_active).getTime() - new Date(a.last_active).getTime();
        });
    } catch (err) {
      console.error("Error filtering data:", err);
      return [];
    }
  }, [data, search, locationFilter, statusFilter]);

  // Get timestamp in human-readable format
  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(date);
    } catch (e) {
      return "Unknown";
    }
  };

  // Clean up resources when component unmounts
  useEffect(() => {
    return () => {
      // Clear any pending timeouts
      if (streamPauseTimeoutRef.current) {
        clearTimeout(streamPauseTimeoutRef.current);
      }
    };
  }, []);

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
            gap: 1,
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
          overflow: "visible",
          transition: "box-shadow 0.3s ease",
          backgroundColor: theme => alpha(theme.palette.background.paper, 0.8),
          "&:hover": {
            boxShadow: 3,
          },
        }}
      >
        <CardContent sx={{ p: { xs: 2, md: 3 } }}>
          <Grid container spacing={2} alignItems="center">
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
                  sx: { borderRadius: 2 },
                }}
                size="small"
              />
            </Grid>
            <Grid item xs={12} md={7}>
              <Box
                sx={{
                  display: "flex",
                  gap: 2,
                  flexDirection: isMobile ? "column" : "row",
                  alignItems: "center",
                }}
              >
                <Box sx={{ display: "flex", gap: 2, width: "100%" }}>
                  <FormControl size="small" sx={{ flexGrow: 1 }}>
                    <InputLabel>Location</InputLabel>
                    <Select
                      value={locationFilter}
                      onChange={handleLocationFilterChange}
                      startAdornment={<LocationOnIcon sx={{ mr: 1, color: "action.active" }} />}
                      label="Location"
                    >
                      <MenuItem value="All">All Locations</MenuItem>
                      {locationOptions.map((option) => (
                        <MenuItem key={option} value={option}>
                          {option}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <FormControl size="small" sx={{ flexGrow: 1 }}>
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={statusFilter}
                      onChange={handleStatusFilterChange}
                      label="Status"
                      startAdornment={
                        statusFilter === "active" ? (
                          <VideocamIcon sx={{ mr: 1, color: "success.main" }} />
                        ) : (
                          <VideocamOffIcon sx={{ mr: 1, color: "action.active" }} />
                        )
                      }
                    >
                      <MenuItem value="All">All Statuses</MenuItem>
                      <MenuItem value="active">
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <FiberManualRecordIcon sx={{ fontSize: 12, color: "success.main" }} />
                          Active
                        </Box>
                      </MenuItem>
                      <MenuItem value="inactive">
                        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                          <FiberManualRecordIcon sx={{ fontSize: 12, color: "error.main" }} />
                          Inactive
                        </Box>
                      </MenuItem>
                    </Select>
                  </FormControl>
                </Box>
                <Tooltip title="Refresh camera data">
                  <IconButton
                    onClick={handleRefresh}
                    color="primary"
                    disabled={refreshing || loading}
                    sx={{
                      minWidth: 40,
                      height: 40,
                      animation: refreshing ? "spin 1s linear infinite" : "none",
                      "@keyframes spin": {
                        "0%": { transform: "rotate(0deg)" },
                        "100%": { transform: "rotate(360deg)" },
                      },
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
            boxShadow: 2,
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
              overflow: "hidden",
              transition: "all 0.3s ease",
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
                  <TableCell align="center" sx={{ color: "white", fontWeight: "bold" }}>
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {!filteredData || filteredData.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={isMobile ? 4 : 6} align="center" sx={{ py: 4 }}>
                      <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
                        <FilterAltIcon sx={{ verticalAlign: "middle", mr: 1 }} />
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
                        "&:hover": { backgroundColor: "rgba(0, 0, 0, 0.04)" },
                        transition: "background-color 0.2s ease",
                        cursor: "pointer",
                      }}
                      onClick={() => handleOpenStream(camera)}
                    >
                      <TableCell sx={{ fontSize: "0.875rem" }}>{camera.camera_id}</TableCell>
                      <TableCell>
                        <Box sx={{ display: "flex", alignItems: "center" }}>
                          {camera.status === "active" ? (
                            <Badge
                              overlap="circular"
                              anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                              badgeContent={
                                <FiberManualRecordIcon
                                  sx={{
                                    fontSize: 12,
                                    color: "success.main",
                                    animation: "pulse 1.5s infinite ease-in-out",
                                    "@keyframes pulse": {
                                      "0%": { opacity: 1 },
                                      "50%": { opacity: 0.6 },
                                      "100%": { opacity: 1 },
                                    },
                                  }}
                                />
                              }
                            >
                              <VideocamIcon sx={{ color: "primary.main", mr: 1 }} />
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
                          <Box sx={{ display: "flex", alignItems: "flex-start" }}>
                            <LocationOnIcon
                              fontSize="small"
                              sx={{ mr: 0.5, color: "text.secondary", mt: "2px" }}
                            />
                            <Typography variant="body2" sx={{ fontSize: "0.875rem" }}>
                              {camera.location}
                            </Typography>
                          </Box>
                        </TableCell>
                      )}
                      <TableCell>
                        <Chip
                          label={camera.status === "active" ? "Active" : "Inactive"}
                          size="small"
                          sx={{
                            backgroundColor: camera.status === "active" ? "success.light" : "error.light",
                            color: "white",
                            fontWeight: "medium",
                            minWidth: 70,
                          }}
                        />
                      </TableCell>
                      {!isMobile && (
                        <TableCell>
                          <Box sx={{ display: "flex", alignItems: "center" }}>
                            <CalendarTodayIcon
                              fontSize="small"
                              sx={{ mr: 0.5, color: "text.secondary" }}
                            />
                            <Typography variant="body2" sx={{ fontSize: "0.875rem" }}>
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
                              backgroundColor: "primary.light",
                              color: "white",
                              "&:hover": {
                                backgroundColor: "primary.main",
                                transform: "scale(1.05)",
                              },
                              transition: "all 0.2s ease",
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
          "& .MuiDialog-paper": {
            borderRadius: 2,
            overflow: "hidden",
          },
        }}
      >
        <DialogTitle
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: 1,
            borderColor: "divider",
            pb: 2,
            bgcolor: "primary.dark",
            color: "white",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <PlayCircleOutlineIcon sx={{ mr: 1 }} />
            <Typography variant="h6">{selectedCamera?.device_name || "Camera Stream"}</Typography>
            {selectedCamera?.status === "active" && !streamPaused && (
              <Chip
                size="small"
                label="Live"
                color="error"
                icon={<FiberManualRecordIcon />}
                sx={{ ml: 2, "& .MuiChip-icon": { fontSize: 10 } }}
              />
            )}
            {selectedCamera?.status === "active" && streamPaused && (
              <Chip
                size="small"
                label="Paused"
                color="default"
                sx={{ ml: 2 }}
              />
            )}
          </Box>
          <IconButton onClick={handleCloseDialog} size="small" sx={{ color: "white" }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 0, overflow: "hidden", bgcolor: "#000", height: isMobile ? "70vh" : "540px" }}>
          {streamLoading && !streamUrl && !streamError && (
            <Box
              sx={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 2,
              }}
            >
              <CircularProgress sx={{ color: "#fff" }} />
              <Typography variant="body2" sx={{ color: "#fff" }}>
                Initializing stream...
              </Typography>
            </Box>
          )}
          {streamError && (
            <Box
              sx={{
                height: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 2,
                p: 3,
                textAlign: "center",
              }}
            >
              <ErrorOutlineIcon sx={{ fontSize: 60, color: "#f44336" }} />
              <Typography variant="h6" sx={{ color: "#fff" }}>
                {streamError}
              </Typography>
              {selectedCamera?.status !== "active" && (
                <Typography variant="body2" sx={{ color: "#bbb", maxWidth: "80%" }}>
                  This camera is currently inactive. Please check the camera status or try again later.
                </Typography>
              )}
            </Box>
          )}
          {selectedCamera && streamUrl && (
            <MJPEGStreamViewer
              streamUrl={streamUrl}
              cameraName={selectedCamera.device_name}
              location={selectedCamera.location}
              status={selectedCamera.status}
              onPause={handlePause}
              onResume={handleResume}
            />
          )}
        </DialogContent>

        <DialogActions
          sx={{
            p: 2,
            bgcolor: "background.paper",
            borderTop: 1,
            borderColor: "divider",
            display: "block",
          }}
        >
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Box>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  {selectedCamera?.device_name}
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <LocationOnIcon fontSize="small" color="action" />
                  <Typography variant="body2" color="text.secondary">
                    {selectedCamera?.location}
                  </Typography>
                </Box>
              </Box>
            </Grid>
            <Grid
              item
              xs={12}
              md={6}
              sx={{
                display: "flex",
                justifyContent: { xs: "flex-start", md: "flex-end" },
                alignItems: "center",
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 2,
                }}
              >
                {selectedCamera?.status === "active" ? (
                  <Box
                    sx={{
                      display: "inline-flex",
                      alignItems: "center",
                      px: 1.5,
                      py: 0.5,
                      borderRadius: 4,
                      backgroundColor: "rgba(76, 175, 80, 0.1)",
                      color: "success.main",
                      border: 1,
                      borderColor: "success.light",
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
                      display: "inline-flex",
                      alignItems: "center",
                      px: 1.5,
                      py: 0.5,
                      borderRadius: 4,
                      backgroundColor: "rgba(244, 67, 54, 0.1)",
                      color: "error.main",
                      border: 1,
                      borderColor: "error.light",
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
      </Dialog>
    </Box>
  );
};

export default DataDetection;