import { useEffect, useState } from "react";
import {
  Typography,
  Box,
  CircularProgress,
  Alert,
  Snackbar,
  Dialog,
  DialogContent,
  Grid,
  Chip,
  Card,
  CardContent,
  CardMedia,
  Divider
} from "@mui/material";
import axios from "axios";
import config from "../../../config";

const API_BASE_URL = config.API_URL;

interface Application {
  car_parrot_id: number;
  plate_number: string;
  status: string;
  image: string;
}

const CitizenNotification = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState({
    open: false,
    message: "",
    severity: "info" as "success" | "error" | "info",
  });
  const [imageViewer, setImageViewer] = useState<string | null>(null);
  const citizenId = Number(localStorage.getItem("user_id") || 1);

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const appRes = await axios.get(
          `${API_BASE_URL}citizens/get-applications/${citizenId}/`
        );
        const appData: Application[] = appRes.data.applications;
        setApplications(appData);

        if (appData.length === 0) {
          setNotification({
            open: true,
            message: "You haven't registered any vehicle documents yet.",
            severity: "info",
          });
        } else if (!appData.some((app) => app.status === "Verified")) {
          setNotification({
            open: true,
            message: "You have vehicle documents waiting for approval.",
            severity: "info",
          });
        }
      } catch (err) {
        setNotification({
          open: true,
          message: "Unable to load data. Please try again later.",
          severity: "error",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchApplications();
  }, [citizenId]);

  // Helper function to get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case "Verified":
        return "success";
      case "Pending":
        return "warning";
      case "Rejected":
        return "error";
      default:
        return "default";
    }
  };

  return (
    <Box p={4}>
      <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
        📋 Registered Vehicle Applications
      </Typography>

      {loading ? (
        <Box display="flex" justifyContent="center" mt={4}>
          <CircularProgress />
        </Box>
      ) : applications.length > 0 ? (
        <Grid container spacing={3}>
          {applications.map((app, i) => (
            <Grid item xs={12} sm={6} md={4} key={i}>
              <Card elevation={3}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    License Plate: {app.plate_number}
                  </Typography>
                  <Divider sx={{ my: 1 }} />
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="body2" color="text.secondary">
                      Application ID: #{app.car_parrot_id}
                    </Typography>
                    <Chip 
                      label={app.status} 
                      color={getStatusColor(app.status) as "success" | "warning" | "error" | "default"}
                      size="small"
                    />
                  </Box>
                </CardContent>
                {app.image && (
                  <CardMedia
                    component="img"
                    image={app.image}
                    alt={`Application for ${app.plate_number}`}
                    sx={{ 
                      height: 180, 
                      objectFit: "cover",
                      cursor: "pointer" 
                    }}
                    onClick={() => setImageViewer(app.image)}
                  />
                )}
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Alert severity="info" sx={{ mt: 3 }}>
          No vehicle documents have been registered yet. Please register your vehicle documents.
        </Alert>
      )}

      {/* Notification */}
      <Snackbar
        open={notification.open}
        autoHideDuration={4000}
        onClose={() => setNotification({ ...notification, open: false })}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          severity={notification.severity}
          onClose={() => setNotification({ ...notification, open: false })}
        >
          {notification.message}
        </Alert>
      </Snackbar>

      {/* Image Viewer Dialog */}
      <Dialog 
        open={!!imageViewer} 
        onClose={() => setImageViewer(null)} 
        maxWidth="md"
        fullWidth
      >
        <DialogContent sx={{ p: 1 }}>
          <img 
            src={imageViewer ?? ""} 
            alt="Application Full Size" 
            style={{ width: "100%", display: "block" }} 
          />
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default CitizenNotification;