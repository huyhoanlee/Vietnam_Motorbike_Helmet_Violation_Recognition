import React, { useEffect, useState, useMemo } from "react";
import {
  Grid,
  Typography,
  TextField,
  Button,
  Snackbar,
  Alert,
  List,
  ListItem,
  ListItemText,
  Divider,
  CircularProgress,
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  IconButton,
  Card,
  CardContent,
  CardHeader,
  Tooltip,
  Fade,
  useTheme,
  useMediaQuery,
  Chip,
} from "@mui/material";
import CameraAltIcon from "@mui/icons-material/CameraAlt";
import ReportIcon from "@mui/icons-material/Report";
import PeopleIcon from "@mui/icons-material/People";
import SearchIcon from "@mui/icons-material/Search";
import RefreshIcon from "@mui/icons-material/Refresh";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import TimelineIcon from "@mui/icons-material/Timeline";
import InfoIcon from "@mui/icons-material/Info";
import NotificationsIcon from "@mui/icons-material/Notifications";
import { Bar,  Line, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  LineElement,
  PointElement,
  Tooltip as ChartTooltip,
  Legend,
  TimeScale,
  Filler,
} from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";
import axiosInstance from "../../services/axiosInstance";
import config from "../../config";

const API_BASE_URL = config.API_URL;

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  LineElement,
  PointElement,
  ChartTooltip,
  Legend,
  TimeScale,
  Filler,
  ChartDataLabels
);

interface ViolationStatus {
  status: string;
  count: number;
}

interface CameraStatus {
  status: string;
  count: number;
}

interface CitizenStatus {
  status: string;
  count: number;
}

interface LocationCount {
  location_id: number;
  location_name: string;
  count: number;
}

interface TimeCount {
  time: string;
  date?: string;
  count: number;
}

interface Location {
  id: number;
  city: string;
  road: string;
  dist: string;
  name: string;
}

interface Violation {
  violation_id: number;
  plate_number: string;
  location: string;
  location_id?: number;
  location_name?: string;
  detected_at: string;
  status_name: string;
  violation_image: string[];
}

interface Notification {
  notification_id: number;
  status: string;
  created_at: string;
  message?: string;
}

const Dashboard: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const isSmall = useMediaQuery(theme.breakpoints.down("sm"));
  
  // Data states
  const [violationStatus, setViolationStatus] = useState<ViolationStatus[]>([]);
  const [cameraStatus, setCameraStatus] = useState<CameraStatus[]>([]);
  const [citizenStatus, setCitizenStatus] = useState<CitizenStatus[]>([]);
  const [locationCounts, setLocationCounts] = useState<LocationCount[]>([]);
  const [timeCounts, setTimeCounts] = useState<TimeCount[]>([]);
  const [_locations, setLocations] = useState<Location[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  // UI states
  const [plateNumber, setPlateNumber] = useState<string>("");
  const [searchResult, setSearchResult] = useState<Violation[] | null>(null);
  const [notification, setNotification] = useState<{
    open: boolean;
    type: "error" | "warning" | "info" | "success";
    message: string;
  }>({
    open: false,
    type: "info",
    message: "",
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [searchLoading, setSearchLoading] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [imageViewer, setImageViewer] = useState<string | null>(null);
  const [timeFilter, setTimeFilter] = useState<string>("30days");
  const [_selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [_selectedViolation, setSelectedViolation] = useState<Violation | null>(null);
  
  const pieChartHeight = 240;
  const barLineChartHeight = 300;

  const normalizeBase64Image = (data: string, format: "jpeg" | "png" = "jpeg") => {
    if (data.startsWith("data:image/")) {
      return data;
    }
    return `data:image/${format};base64,${data}`;
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  useEffect(() => {
    fetchViolationsByTime(timeFilter);
  }, [timeFilter]);

  const fetchAllData = async () => {
    try {
      setLoading(true);

      const [
        violationStatusRes,
        cameraStatusRes,
        citizenStatusRes,
        locationsRes,
        locationCountsRes,
        timeCountsRes,
        notificationsRes,
      ] = await Promise.all([
        axiosInstance.get(`${API_BASE_URL}violations/count-by-status/`),
        axiosInstance.get(`${API_BASE_URL}cameras/count-by-status/`),
        axiosInstance.get(`${API_BASE_URL}citizens/count-by-status/`),
        axiosInstance.get(`${API_BASE_URL}locations/get-all/`),
        axiosInstance.get(`${API_BASE_URL}violations/count-by-location/`),
        axiosInstance.get(`${API_BASE_URL}violations/count-by-time/?timeframe=${timeFilter}`),
        axiosInstance.get(`${API_BASE_URL}notifications/view_all/`),
      ]);

      setViolationStatus(violationStatusRes.data || []);
      setCameraStatus(cameraStatusRes.data || []);
      setCitizenStatus(citizenStatusRes.data || []);
      setLocations(locationsRes.data?.data || []);
      
      // Map location IDs to names
      const locationData = locationCountsRes.data || [];
      const mappedLocationCounts = locationData.map((item: any) => {
        const location = (locationsRes.data?.data || []).find(
          (loc: Location) => loc.id === item.location_id
        );
        return {
          ...item,
          location_name: location?.name || `Location ${item.location}`,
        };
      });
      setLocationCounts(mappedLocationCounts);
      
      setTimeCounts(timeCountsRes.data || []);
      
      // Sort notifications by created_at (newest first)
      const sortedNotifications = (notificationsRes.data?.data || []).sort(
        (a: Notification, b: Notification) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setNotifications(sortedNotifications);
      
    } catch (err) {
      console.error("Fetch error:", err);
      showAlert("error", "Failed to load data from the system");
    } finally {
      setLoading(false);
    }
  };

  const fetchViolationsByTime = async (timeframe: string) => {
    try {
      const response = await axiosInstance.get(
        `${API_BASE_URL}violations/count-by-time/?timeframe=${timeframe}`
      );
      
      // Transform the API response to match the expected TimeCount format
      const timeData = (response.data || []).map((item: any) => ({
        date: new Date(item.time).toLocaleDateString(), // Convert time to date string
        time: item.time,
        count: item.count
      }));
      
      setTimeCounts(timeData);
    } catch (err) {
      console.error("Failed to fetch time data:", err);
    }
  };

  const refreshData = async () => {
    setRefreshing(true);
    await fetchAllData();
    setRefreshing(false);
    showAlert("success", "Dashboard data refreshed successfully");
  };

  const showAlert = (type: any, message: string) => {
    setNotification({ open: true, type, message });
  };

  const handleSearch = async () => {
    if (!plateNumber.trim()) {
      showAlert("warning", "Please enter a plate number!");
      return;
    }
    
    setSearchLoading(true);
    setSearchResult(null);
    
    try {
      const res = await axiosInstance.post(
        `${API_BASE_URL}violations/search-by-plate-number/`,
        {
          plate_number: plateNumber.trim(),
        }
      );
      const data: Violation[] = res.data?.data?.violations || [];
      
      // Map location directly from the API response
      const mappedData = data.map((violation) => {
        return {
          ...violation,
          // Use location directly from the response
          location_name: violation.location || `Unknown Location`,
        };
      });
      
      // Sort by date (newest first)
      const sortedData = mappedData.sort(
        (a, b) => new Date(b.detected_at).getTime() - new Date(a.detected_at).getTime()
      );
      
      setSearchResult(sortedData);
      showAlert("success", "Search completed successfully");
    } catch (err: any) {
      showAlert(
        "error",
        err?.response?.data?.message || "Plate not found or server error!"
      );
    } finally {
      setSearchLoading(false);
    }
  };

  // Chart data preparations
  const getViolationStatusChartData = useMemo(() => {
    const total = violationStatus.reduce((sum, item) => sum + item.count, 0);
    const statusLabels = violationStatus.map(item => item.status);
    const statusCounts = violationStatus.map(item => item.count);
    
    const backgroundColors = [
      "#FF6384", "#36A2EB", "#FFCE56", "#4BC0C0", 
      "#9966FF", "#FF9F40", "#8BC34A", "#00ACC1"
    ];

    return {
      total,
      chartData: {
        labels: statusLabels,
        datasets: [
          {
            data: statusCounts,
            backgroundColor: backgroundColors.slice(0, statusLabels.length),
            borderWidth: 1,
            borderColor: theme.palette.background.paper,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '65%',
        plugins: {
          legend: {
            position: "bottom" as const,
            labels: {
              boxWidth: 12,
              padding: 15,
              usePointStyle: true,
            }
          },
          tooltip: {
            callbacks: {
              label: (context: any) => {
                const value = context.raw;
                const percentage = ((value / total) * 100).toFixed(1);
                return `${context.label}: ${value} (${percentage}%)`;
              },
            },
          },
          datalabels: {
            formatter: (value: number, _context: any) => {
              const percentage = ((value / total) * 100).toFixed(0);
              return parseFloat(percentage) > 5 ? `${percentage}%` : '';
            },
            color: '#fff',
            font: {
              weight: 'bold' as const,
              size: 11
            },
          },
        },
      },
    };
  }, [violationStatus, theme]);

  const getCameraStatusChartData = useMemo(() => {
    const total = cameraStatus.reduce((sum, item) => sum + item.count, 0);
    
    return {
      total,
      chartData: {
        labels: cameraStatus.map(item => item.status),
        datasets: [
          {
            data: cameraStatus.map(item => item.count),
            backgroundColor: ["#4caf50", "#f44336", "#ff9800", "#2196f3"],
            borderWidth: 1,
            borderColor: theme.palette.background.paper,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '65%',
        plugins: {
          legend: {
            position: "bottom" as const,
            labels: {
              boxWidth: 12,
              padding: 15,
              usePointStyle: true,
            }
          },
          tooltip: {
            callbacks: {
              label: (context: any) => {
                const value = context.raw;
                const percentage = ((value / total) * 100).toFixed(1);
                return `${context.label}: ${value} (${percentage}%)`;
              },
            },
          },
          datalabels: {
            formatter: (value: number, _context: any) => {
              const percentage = ((value / total) * 100).toFixed(0);
              return parseFloat(percentage) > 5 ? `${percentage}%` : '';
            },
            color: '#fff',
            font: {
              weight: 'bold' as const,
              size: 11
            },
          },
        },
      },
    };
  }, [cameraStatus, theme]);

  const getCitizenStatusChartData = useMemo(() => {
    const total = citizenStatus.reduce((sum, item) => sum + item.count, 0);
    
    return {
      total,
      chartData: {
        labels: citizenStatus.map(item => item.status),
        datasets: [
          {
            data: citizenStatus.map(item => item.count),
            backgroundColor: ["#2196f3", "#ff9800", "#4caf50", "#f44336"],
            borderWidth: 1,
            borderColor: theme.palette.background.paper,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '65%',
        plugins: {
          legend: {
            position: "bottom" as const,
            labels: {
              boxWidth: 12,
              padding: 15,
              usePointStyle: true,
            }
          },
          tooltip: {
            callbacks: {
              label: (context: any) => {
                const value = context.raw;
                const percentage = ((value / total) * 100).toFixed(1);
                return `${context.label}: ${value} (${percentage}%)`;
              },
            },
          },
          datalabels: {
            formatter: (value: number, _context: any) => {
              const percentage = ((value / total) * 100).toFixed(0);
              return parseFloat(percentage) > 5 ? `${percentage}%` : '';
            },
            color: '#fff',
            font: {
              weight: 'bold' as const,
              size: 11
            },
          },
        },
      },
    };
  }, [citizenStatus, theme]);

  const locationChartData = useMemo(() => {
    return {
      labels: locationCounts.map(item => item.location_name),
      datasets: [
        {
          label: "Violations",
          data: locationCounts.map(item => item.count),
          backgroundColor: "rgba(63, 81, 181, 0.7)",
          borderColor: "rgba(63, 81, 181, 1)",
          borderWidth: 1,
          borderRadius: 5,
          maxBarThickness: 50,
        },
      ],
    };
  }, [locationCounts]);

  const locationChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      datalabels: {
        color: 'white',
        anchor: 'center' as const,
        align: 'center' as const,
        formatter: (value: number) => (value > 0 ? value : ''),
        font: {
          weight: 'bold' as const
        }
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          drawBorder: false,
          color: theme.palette.mode === 'dark' 
            ? 'rgba(255, 255, 255, 0.1)' 
            : 'rgba(0, 0, 0, 0.1)',
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
  };

  const timeChartData = useMemo(() => ({
    labels: timeCounts.map(item => item.date || new Date(item.time).toLocaleDateString()),
    datasets: [
      {
        label: "Violations",
        data: timeCounts.map(item => item.count),
        borderColor: "#3f51b5",
        backgroundColor: "rgba(63, 81, 181, 0.2)",
        tension: 0.4,
        fill: true,
        pointBackgroundColor: "#3f51b5",
        pointRadius: 4,
        pointHoverRadius: 6,
      },
    ],
  }), [timeCounts]);

  const timeChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      datalabels: {
        display: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          drawBorder: false,
          color: theme.palette.mode === 'dark' 
            ? 'rgba(255, 255, 255, 0.1)' 
            : 'rgba(0, 0, 0, 0.1)',
        },
      },
      x: {
        grid: {
          display: false,
        },
      },
    },
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box sx={{ 
      p: isSmall ? 1 : 3, 
      backgroundColor: theme.palette.mode === 'dark' ? 'inherit' : '#f5f7fb',
      minHeight: '100vh'
    }}>
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          mb: 3
        }}
      >
        <Typography variant="h4" fontWeight={600} color="primary">
          Traffic Monitoring Dashboard
        </Typography>
        <Tooltip title="Refresh Data">
          <IconButton 
            onClick={refreshData} 
            disabled={refreshing}
            sx={{ bgcolor: 'background.paper', boxShadow: 1 }}
          >
            {refreshing ? (
              <CircularProgress size={24} />
            ) : (
              <RefreshIcon />
            )}
          </IconButton>
        </Tooltip>
      </Box>

      {/* Search Section */}
      <Card elevation={3} sx={{ mb: 3, overflow: 'visible' }}>
        <CardContent>
          <Typography variant="h6" fontWeight={500} sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
            <SearchIcon sx={{ mr: 1 }} /> Search by Plate Number
          </Typography>
          <Box 
            component="form" 
            onSubmit={(e) => {
              e.preventDefault();
              handleSearch();
            }}
            sx={{ 
              display: 'flex', 
              flexDirection: isMobile ? 'column' : 'row',
              gap: 2 
            }}
          >
            <TextField
              label="Enter plate number"
              value={plateNumber}
              onChange={(e) => setPlateNumber(e.target.value)}
              fullWidth
              variant="outlined"
              placeholder="Example: 75F1-12345"
              InputProps={{
                startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />,
              }}
            />
            <Button 
              variant="contained" 
              type="submit"
              disabled={searchLoading}
              startIcon={searchLoading ? <CircularProgress size={20} /> : null}
              sx={{ 
                minWidth: isMobile ? '100%' : '120px',
                height: isMobile ? 'auto' : '56px'
              }}
            >
              {searchLoading ? 'Searching...' : 'Search'}
            </Button>
          </Box>

          {searchResult && (
            <Fade in={!!searchResult} timeout={500}>
              <Box mt={3}>
                {searchResult.length === 0 ? (
                  <Alert severity="info" icon={<InfoIcon />} sx={{ mt: 2 }}>
                    No violations found for this plate number.
                  </Alert>
                ) : (
                  <Box>
                    <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                      {searchResult.length} Violation{searchResult.length > 1 ? 's' : ''} Found
                    </Typography>
                    <Grid container spacing={2}>
                      {searchResult.map((item: Violation) => (
                        <Grid item xs={12} md={6} lg={4} key={item.violation_id}>
                          <Card 
                            sx={{ 
                              height: '100%',
                              transition: 'transform 0.2s',
                              '&:hover': {
                                transform: 'translateY(-4px)',
                                boxShadow: 3
                              }
                            }}
                          >
                            <CardHeader
                              title={`Plate: ${item.plate_number}`}
                              subheader={`ID: ${item.violation_id}`}
                              action={
                                <Chip 
                                  label={item.status_name} 
                                  color={
                                    item.status_name === "AI detected" ? "warning" :
                                    item.status_name === "AI reliable" ? "success" : 
                                    "default"
                                  }
                                  size="small"
                                />
                              }
                            />
                            <CardContent>
                              <Typography variant="body2" color="text.secondary">
                                <LocationOnIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                                {item.location_name || item.location || `Unknown Location`}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                <TimelineIcon fontSize="small" sx={{ verticalAlign: 'middle', mr: 0.5 }} />
                                {new Date(item.detected_at).toLocaleString()}
                              </Typography>
                              
                              {item.violation_image && item.violation_image.length > 0 && (
                                <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                  {item.violation_image.map((img: string, i: number) => (
                                    <Box
                                      key={i}
                                      component="img"
                                      src={normalizeBase64Image(img, "png")}
                                      alt={`Violation ${i+1}`}
                                      sx={{
                                        width: '100px',
                                        height: '75px',
                                        objectFit: 'cover',
                                        borderRadius: 1,
                                        cursor: 'pointer',
                                        transition: 'transform 0.2s',
                                        '&:hover': {
                                          transform: 'scale(1.05)',
                                        },
                                      }}
                                      onClick={() => setImageViewer(normalizeBase64Image(img, "png"))}
                                    />
                                  ))}
                                </Box>
                              )}
                              
                              <Button 
                                variant="outlined" 
                                size="small" 
                                onClick={() => setSelectedViolation(item)}
                                sx={{ mt: 2 }}
                                fullWidth
                              >
                                View Details
                              </Button>
                            </CardContent>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                )}
              </Box>
            </Fade>
          )}
        </CardContent>
      </Card>

      {/* Stats Summary Row */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card 
            elevation={3} 
            sx={{ 
              height: '100%',
              transition: 'all 0.3s',
              '&:hover': { transform: 'translateY(-5px)', boxShadow: 6 }
            }}
          >
            <CardHeader
              title="Violations by Status"
              subheader={`Total: ${getViolationStatusChartData.total}`}
              avatar={<ReportIcon color="error" />}
            />
            <CardContent>
              <Box sx={{ height: pieChartHeight, position: 'relative' }}>
                <Doughnut
                  data={getViolationStatusChartData.chartData}
                  options={getViolationStatusChartData.options}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card 
            elevation={3} 
            sx={{ 
              height: '100%',
              transition: 'all 0.3s',
              '&:hover': { transform: 'translateY(-5px)', boxShadow: 6 }
            }}
          >
            <CardHeader
              title="Cameras by Status"
              subheader={`Total: ${getCameraStatusChartData.total}`}
              avatar={<CameraAltIcon color="primary" />}
            />
            <CardContent>
              <Box sx={{ height: pieChartHeight, position: 'relative' }}>
                <Doughnut
                  data={getCameraStatusChartData.chartData}
                  options={getCameraStatusChartData.options}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card 
            elevation={3} 
            sx={{ 
              height: '100%',
              transition: 'all 0.3s',
              '&:hover': { transform: 'translateY(-5px)', boxShadow: 6 }
            }}
          >
            <CardHeader
              title="Citizens by Status"
              subheader={`Total: ${getCitizenStatusChartData.total}`}
              avatar={<PeopleIcon color="success" />}
            />
            <CardContent>
              <Box sx={{ height: pieChartHeight, position: 'relative' }}>
                <Doughnut
                  data={getCitizenStatusChartData.chartData}
                  options={getCitizenStatusChartData.options}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Charts Section */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Card elevation={3}>
            <CardHeader
              title="Violations by Location"
              avatar={<LocationOnIcon color="primary" />}
            />
            <CardContent>
              <Box sx={{ height: barLineChartHeight }}>
                <Bar
                  data={locationChartData}
                  options={locationChartOptions}
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card elevation={3}>
            <CardHeader
              title="Violations Over Time"
              avatar={<TimelineIcon color="primary" />}
              action={
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>Time Range</InputLabel>
                  <Select
                    value={timeFilter}
                    onChange={(e) => setTimeFilter(e.target.value as string)}
                    label="Time Range"
                  >
                    <MenuItem value="7days">Last 7 Days</MenuItem>
                    <MenuItem value="30days">Last 30 Days</MenuItem>
                    <MenuItem value="all">All Time</MenuItem>
                  </Select>
                </FormControl>
              }
            />
            <CardContent>
              <Box sx={{ height: barLineChartHeight }}>
                <Line 
                  data={timeChartData} 
                  options={timeChartOptions} 
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Notifications and Details */}
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card elevation={3}>
            <CardHeader
              title="Recent Notifications"
              avatar={<NotificationsIcon color="primary" />}
            />
            <CardContent sx={{ p: 0 }}>
              {notifications.length === 0 ? (
                <Box p={3} textAlign="center">
                  <Typography color="text.secondary">No notifications available</Typography>
                </Box>
              ) : (
                <List>
                  {notifications.slice(0, 5).map((n) => (
                    <React.Fragment key={n.notification_id}>
                      <ListItem
                        onClick={() => setSelectedNotification(n)}
                        sx={{
                          transition: 'background-color 0.2s',
                        }}
                      >
                        <ListItemText
                          primary={
                            <Box display="flex" justifyContent="space-between">
                              <Typography variant="body1" fontWeight={500}>
                                Notification #{n.notification_id}
                              </Typography>
                              <Chip 
                                label={n.status} 
                                size="small"
                                color={
                                  n.status === "read" ? "default" : 
                                  n.status === "unread" ? "primary" : 
                                  "default"
                                }
                              />
                            </Box>
                          }
                          secondary={new Date(n.created_at).toLocaleString()}
                        />
                      </ListItem>
                      <Divider />
                    </React.Fragment>
              )
                )
              }       
            </List>
            )
             }
            {notifications.length > 5 && (
              <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 2 }}>
                + {notifications.length - 5} more
              </Typography>
            )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Dialog open={!!imageViewer} onClose={() => setImageViewer(null)} maxWidth="md">
        <DialogTitle>Violation Image</DialogTitle>
        <DialogContent>
          <img src={imageViewer || ""} alt="Violation" style={{ maxWidth: "100%", maxHeight: "70vh", objectFit: "contain" }} />
        </DialogContent>
      </Dialog>

      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={() => setNotification({ ...notification, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert severity={notification.type} sx={{ width: '100%' }}>
          {notification.message}
        </Alert>
      </Snackbar>
</Box>
  );
};

export default Dashboard;