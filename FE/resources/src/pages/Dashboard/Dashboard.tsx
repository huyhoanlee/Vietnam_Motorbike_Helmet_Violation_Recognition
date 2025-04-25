import React, { useEffect, useState, useMemo } from "react";
import {
  Grid,
  Paper,
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
} from "@mui/material";
import CameraAltIcon from "@mui/icons-material/CameraAlt";
import ReportIcon from "@mui/icons-material/Report";
import PeopleIcon from "@mui/icons-material/People";
import { Bar, Pie, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
  TimeScale,
} from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";
import axiosInstance from "../../services/axiosInstance.tsx";
import config from "../../config";

const API_BASE_URL = config.API_URL;

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  LineElement,
  PointElement,
  Tooltip,
  Legend,
  TimeScale,
  ChartDataLabels
);

interface Violation {
  violation_id: number;
  plate_number: string;
  location: string | null;
  detected_at: string;
  status_name: string;
  violation_image: string[];
}

interface Camera {
  camera_id: number;
  device_name: string;
  status: string;
  last_active: string | null;
  location: string;
}

interface Citizen {
  id: number;
  citizen_identity_id: string;
  full_name: string;
  phone_number: string;
  address: string | null;
  dob: string | null;
  email: string;
  gender: string | null;
  status: string;
}

interface Notification {
  notification_id: number;
  status: string;
  created_at: string;
  message?: string; // Add message field for details
}

interface ViolationByDate {
  date: string;
  count: number;
}

const Dashboard: React.FC = () => {
  const [violations, setViolations] = useState<Violation[]>([]);
  const [cameras, setCameras] = useState<Camera[]>([]);
  const [citizens, setCitizens] = useState<Citizen[]>([]);
  const [locationViolations, setLocationViolations] = useState<Violation[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [violationByDate, setViolationByDate] = useState<ViolationByDate[]>([]);
  const [plateNumber, setPlateNumber] = useState<string>("");
  const [searchResult, setSearchResult] = useState<Violation[] | null>(null);
  const [notification, setNotification] = useState({
    open: false,
    type: "info",
    message: "",
  });
  const [loading, setLoading] = useState<boolean>(true);
  const [searchLoading, setSearchLoading] = useState<boolean>(false);
  const [imageViewer, setImageViewer] = useState<string | null>(null);
  const [timeFilter, setTimeFilter] = useState<string>("all"); // Time filter for Violations Over Time
  const [selectedNotification, setSelectedNotification] = useState<Notification | null>(null);
  const [selectedViolation, setSelectedViolation] = useState<Violation | null>(null);

  const pieChartHeight = 200;
  const barLineChartHeight = 250;

  const normalizeBase64Image = (data: string, format: "jpeg" | "png" = "jpeg") => {
    if (data.startsWith("data:image/")) {
      return data;
    }
    return `data:image/${format};base64,${data}`;
  };

  const normalizePlateNumber = (plate: string) => {
  return plate.toLowerCase().replace(/[\s\-.]/g, ""); 
};

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);

      const [
        violationsRes,
        camerasRes,
        citizensRes,
        locationViolationsRes,
        notificationsRes,
        timelineRes,
      ] = await Promise.all([
        axiosInstance.get(`${API_BASE_URL}violations/get-all/`),
        axiosInstance.get(`${API_BASE_URL}cameras/get-all/`),
        axiosInstance.get(`${API_BASE_URL}citizens/get-all/`),
        axiosInstance.get(`${API_BASE_URL}violations/get-all/`),
        axiosInstance.get(`${API_BASE_URL}notifications/view_all/`),
        axiosInstance.get(`${API_BASE_URL}violations/get-all/`),
      ]);

      setViolations(violationsRes.data?.data || []);
      setCameras(camerasRes.data?.data || []);
      setCitizens(
        Array.isArray(citizensRes.data)
          ? citizensRes.data
          : citizensRes.data?.data || []
      );

      // Sort locationViolations by detected_at (newest first)
      const sortedLocationViolations = (locationViolationsRes.data?.data || []).sort(
        (a: Violation, b: Violation) =>
          new Date(b.detected_at).getTime() - new Date(a.detected_at).getTime()
      );
      setLocationViolations(sortedLocationViolations);

      // Sort notifications by created_at (newest first)
      const sortedNotifications = (notificationsRes.data?.data || []).sort(
        (a: Notification, b: Notification) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      setNotifications(sortedNotifications);

      const timelineData = processTimelineData(timelineRes.data?.data || []);
      setViolationByDate(timelineData);
    } catch (err) {
      console.error("Fetch error:", err);
      showAlert("error", "Failed to load data from the system");
    } finally {
      setLoading(false);
    }
  };

  const processTimelineData = (violations: Violation[]): ViolationByDate[] => {
    const dateCounts: { [key: string]: number } = {};

    // Filter violations based on timeFilter
    const filteredViolations = violations.filter((v) => {
      if (!v.detected_at) return false;
      const violationDate = new Date(v.detected_at);
      const now = new Date();
      if (timeFilter === "7days") {
        const sevenDaysAgo = new Date(now.setDate(now.getDate() - 7));
        return violationDate >= sevenDaysAgo;
      } else if (timeFilter === "30days") {
        const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30));
        return violationDate >= thirtyDaysAgo;
      }
      return true; // "all"
    });

    filteredViolations.forEach((v) => {
      if (v.detected_at) {
        const date = new Date(v.detected_at).toISOString().split("T")[0];
        dateCounts[date] = (dateCounts[date] || 0) + 1;
      }
    });

    return Object.entries(dateCounts)
      .map(([date, count]) => ({
        date,
        count,
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
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
    
    const normalizedPlate = normalizePlateNumber(plateNumber);
    try {
      const res = await axiosInstance.post(
        `${API_BASE_URL}violations/search-by-plate-number/`,
        {
          plate_number: normalizedPlate.trim(),
        }
      );
      const data: Violation[] = res.data?.data?.violations || [];
      setSearchResult(data);
      showAlert("success", "Search successful!");
    } catch (err: any) {
      showAlert(
        "error",
        err?.response?.data?.message || "Plate not found or server error!"
      );
    } finally {
      setSearchLoading(false);
    }
  };

  const getViolationStatusPie = useMemo(() => {
    const statusCounts = violations.reduce((acc: { [key: string]: number }, v) => {
      if (v.status_name) {
        acc[v.status_name] = (acc[v.status_name] || 0) + 1;
      }
      return acc;
    }, {});

    const total = Object.values(statusCounts).reduce((sum, count) => sum + count, 0);

    return {
      total,
      chartData: {
        labels: Object.keys(statusCounts),
        datasets: [
          {
            data: Object.values(statusCounts),
            backgroundColor: [
              "#FF6384",
              "#36A2EB",
              "#FFCE56",
              "#4BC0C0",
              "#9966FF",
              "#FF9F40",
              "#8BC34A",
              "#00ACC1",
            ],
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "bottom" as const,
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
            formatter: (value: number) => value, // Display count
            color: "#fff",
            font: {
              weight: "bold" as const,
            },
          },
        },
      },
    };
  }, [violations]);

  const getCameraStatusPie = useMemo(() => {
    const active = cameras.filter(
      (cam) => cam.status.toLowerCase() === "active"
    ).length;
    const deactive = cameras.length - active;
    const total = cameras.length;

    return {
      total,
      chartData: {
        labels: ["Active", "Deactivated"],
        datasets: [
          {
            data: [active, deactive],
            backgroundColor: ["#4caf50", "#f44336"],
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "bottom" as const,
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
            formatter: (value: number) => value, // Display count
            color: "#fff",
            font: {
              weight: "bold" as const,
            },
          },
        },
      },
    };
  }, [cameras]);

  const getCitizenStatusPie = useMemo(() => {
    const statusCounts = citizens.reduce((acc: { [key: string]: number }, c) => {
      if (c.status) {
        acc[c.status] = (acc[c.status] || 0) + 1;
      }
      return acc;
    }, {});

    const total = Object.values(statusCounts).reduce((sum, count) => sum + count, 0);

    return {
      total,
      chartData: {
        labels: Object.keys(statusCounts).length
          ? Object.keys(statusCounts)
          : ["No Data"],
        datasets: [
          {
            data: Object.values(statusCounts).length
              ? Object.values(statusCounts)
              : [1],
            backgroundColor: ["#2196f3", "#ff9800", "#4caf50", "#f44336"],
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "bottom" as const,
          },
          tooltip: {
            callbacks: {
              label: (context: any) => {
                const value = context.raw;
                const percentage = total > 0 ? ((value / total) * 100).toFixed(1) : 0;
                return `${context.label}: ${value} (${percentage}%)`;
              },
            },
          },
          datalabels: {
            formatter: (value: number) => (total > 0 ? value : ""), // Display count
            color: "#fff",
            font: {
              weight: "bold" as const,
            },
          },
        },
      },
    };
  }, [citizens]);

  const locationChartData = useMemo(() => {
    const counts: { [key: string]: number } = {};
    locationViolations.forEach((v) => {
      const location = v.location || "Unknown";
      counts[location] = (counts[location] || 0) + 1;
    });

    return {
      labels: Object.keys(counts),
      datasets: [
        {
          label: "Violations",
          data: Object.values(counts),
          backgroundColor: "#3f51b5",
        },
      ],
    };
  }, [locationViolations]);

  const lineChartData = useMemo(() => ({
    labels: violationByDate.map((item) => item.date),
    datasets: [
      {
        label: "Violations Over Time",
        data: violationByDate.map((item) => item.count),
        borderColor: "#3f51b5",
        backgroundColor: "rgba(63, 81, 181, 0.2)",
        tension: 0.4,
        fill: true,
      },
    ],
  }), [violationByDate]);

  useEffect(() => {
    // Update violationByDate when timeFilter changes
    const timelineData = processTimelineData(violations);
    setViolationByDate(timelineData);
  }, [timeFilter, violations]);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Grid container spacing={3} padding={2}>
      <Grid item xs={12}>
        <Typography variant="h5" fontWeight={600}>
          Traffic Monitoring Dashboard
        </Typography>
        <Divider sx={{ mt: 1, mb: 2 }} />
      </Grid>

      {/* Search by Plate Number */}
      <Grid item xs={12}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Search by Plate Number
          </Typography>
          <Box display="flex" gap={2} alignItems="center" mb={2}>
            <TextField
              label="Enter plate number"
              value={plateNumber}
              onChange={(e) => setPlateNumber(e.target.value)}
              fullWidth
              size="small"
            />
            <Button variant="contained" onClick={handleSearch}>
              Search
            </Button>
          </Box>

          {searchLoading && <CircularProgress sx={{ mt: 2 }} />}
          {searchResult && (
            <Box mt={3}>
              {searchResult.length === 0 ? (
                <Alert severity="info">No violations found for this plate number.</Alert>
              ) : (
                searchResult.map((item: Violation, idx: number) => (
                  <Paper key={idx} sx={{ p: 2, mt: 2 }}>
                    <Typography>Violation ID: {item.violation_id}</Typography>
                    <Typography>Location: {item.location || "Unknown"}</Typography>
                    <Typography>
                      Time: {new Date(item.detected_at).toLocaleString()}
                    </Typography>
                    <Typography>Status: {item.status_name}</Typography>
                    <Typography>Images:</Typography>
                    {item.violation_image?.map((img: string, i: number) => (
                      <img
                        key={i}
                        src={normalizeBase64Image(img, "png")}
                        alt={`violation-${i}`}
                        style={{
                          maxWidth: "100px",
                          width: "100%",
                          borderRadius: 6,
                          marginTop: 8,
                          cursor: "pointer",
                        }}
                        onClick={() => setImageViewer(normalizeBase64Image(img, "png"))}
                      />
                    ))}
                  </Paper>
                ))
              )}
            </Box>
          )}
        </Paper>
      </Grid>

      {/* Pie Charts Summary */}
      <Grid item xs={12} md={4}>
        <Paper sx={{ p: 2, textAlign: "center" }}>
          <Typography variant="h6" gutterBottom>
            <ReportIcon color="error" sx={{ verticalAlign: "middle", mr: 1 }} />
            Violations by Status
          </Typography>
          <Typography variant="body2" color="textSecondary" gutterBottom>
            Total: {getViolationStatusPie.total}
          </Typography>
          <Box sx={{ height: pieChartHeight }}>
            <Pie
              data={getViolationStatusPie.chartData}
              options={getViolationStatusPie.options}
            />
          </Box>
        </Paper>
      </Grid>

      <Grid item xs={12} md={4}>
        <Paper sx={{ p: 2, textAlign: "center" }}>
          <Typography variant="h6" gutterBottom>
            <CameraAltIcon color="action" sx={{ verticalAlign: "middle", mr: 1 }} />
            Cameras by Status
          </Typography>
          <Typography variant="body2" color="textSecondary" gutterBottom>
            Total: {getCameraStatusPie.total}
          </Typography>
          <Box sx={{ height: pieChartHeight }}>
            <Pie
              data={getCameraStatusPie.chartData}
              options={getCameraStatusPie.options}
            />
          </Box>
        </Paper>
      </Grid>

      <Grid item xs={12} md={4}>
        <Paper sx={{ p: 2, textAlign: "center" }}>
          <Typography variant="h6" gutterBottom>
            <PeopleIcon color="primary" sx={{ verticalAlign: "middle", mr: 1 }} />
            Citizens by Status
          </Typography>
          <Typography variant="body2" color="textSecondary" gutterBottom>
            Total: {getCitizenStatusPie.total}
          </Typography>
          <Box sx={{ height: pieChartHeight }}>
            <Pie
              data={getCitizenStatusPie.chartData}
              options={getCitizenStatusPie.options}
            />
          </Box>
        </Paper>
      </Grid>

      {/* Charts Section */}
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6">Violations by Location</Typography>
          <Box sx={{ height: barLineChartHeight }}>
            <Bar
              data={locationChartData}
              options={{ responsive: true, plugins: { legend: { display: false } }, maintainAspectRatio: false, }}
            />
          </Box>
        </Paper>
      </Grid>

      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 2 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6">Violations Over Time</Typography>
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
          </Box>
          <Box sx={{ height: barLineChartHeight }}>
            <Line data={lineChartData} options={{ responsive: true, maintainAspectRatio: false, }} />
          </Box>
        </Paper>
      </Grid>

      {/* Notifications and Detail List */}
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6">Recent Notifications</Typography>
          <List dense>
            {notifications.slice(0, 5).map((n) => (
              <ListItem
                key={n.notification_id}
                button
                onClick={() => setSelectedNotification(n)}
                sx={{
                  "&:hover": { backgroundColor: "#f5f5f5", cursor: "pointer" },
                }}
              >
                <ListItemText
                  primary={`ID: ${n.notification_id}`}
                  secondary={`At: ${new Date(n.created_at).toLocaleString()} | Status: ${n.status}`}
                />
              </ListItem>
            ))}
          </List>
        </Paper>
      </Grid>

      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6">Violation Location Details</Typography>
          <List dense>
            {locationViolations.slice(0, 5).map((v) => (
              <ListItem
                key={v.violation_id}
                button
                onClick={() => setSelectedViolation(v)}
                sx={{
                  "&:hover": { backgroundColor: "#f5f5f5", cursor: "pointer" },
                }}
              >
                <ListItemText
                  primary={<Typography fontWeight={500}>{v.location || "Unknown"}</Typography>}
                  secondary={`At: ${new Date(v.detected_at).toLocaleString()} | Status: ${v.status_name}`}
                />
              </ListItem>
            ))}
          </List>
        </Paper>
      </Grid>

      {/* Notification Detail Dialog */}
      <Dialog
        open={!!selectedNotification}
        onClose={() => setSelectedNotification(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Notification Details</DialogTitle>
        <DialogContent>
          {selectedNotification && (
            <>
              <Typography>ID: {selectedNotification.notification_id}</Typography>
              <Typography>
                Time: {new Date(selectedNotification.created_at).toLocaleString()}
              </Typography>
              <Typography>Status: {selectedNotification.status}</Typography>
              <Typography>
                Message: {selectedNotification.message || "No message available"}
              </Typography>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Violation Detail Dialog */}
      <Dialog
        open={!!selectedViolation}
        onClose={() => setSelectedViolation(null)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Violation Details</DialogTitle>
        <DialogContent>
          {selectedViolation && (
            <>
              <Typography>ID: {selectedViolation.violation_id}</Typography>
              <Typography>Location: {selectedViolation.location || "Unknown"}</Typography>
              <Typography>
                Time: {new Date(selectedViolation.detected_at).toLocaleString()}
              </Typography>
              <Typography>Status: {selectedViolation.status_name}</Typography>
              <Typography>Plate Number: {selectedViolation.plate_number}</Typography>
              <Typography>Images:</Typography>
              {selectedViolation.violation_image?.map((img: string, i: number) => (
                <img
                  key={i}
                  src={normalizeBase64Image(img, "png")}
                  alt={`violation-${i}`}
                  style={{
                    maxWidth: "100px",
                    width: "100%",
                    borderRadius: 6,
                    marginTop: 8,
                    cursor: "pointer",
                  }}
                  onClick={() => setImageViewer(normalizeBase64Image(img, "png"))}
                />
              ))}
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Snackbar Notifications */}
      <Snackbar
        open={notification.open}
        autoHideDuration={3000}
        onClose={() => setNotification({ ...notification, open: false })}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert severity={notification.type as any} variant="filled">
          {notification.message}
        </Alert>
      </Snackbar>

      {/* Image Viewer Dialog */}
      <Dialog open={!!imageViewer} onClose={() => setImageViewer(null)} maxWidth="md">
        <DialogContent sx={{ p: 0 }}>
          <img src={imageViewer ?? ""} alt="Full size" style={{ width: "100%" }} />
        </DialogContent>
      </Dialog>
    </Grid>
  );
};

export default Dashboard;