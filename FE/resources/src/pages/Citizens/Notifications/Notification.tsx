import React, { useEffect, useState } from "react";
import {
  Typography,
  Box,
  CircularProgress,
  Paper,
  Alert,
  Snackbar,
  Dialog,
  DialogContent,
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

interface Vehicle {
  vehicle_id: number;
  plate_number: string;
  violation_image: string[];
}

const CitizenNotification = () => {

  const [applications, setApplications] = useState<Application[]>([]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState({
    open: false,
    message: "",
    severity: "info" as "success" | "error" | "info",
  });
  const [imageViewer, setImageViewer] = useState<string | null>(null);
  const citizenId = Number(localStorage.getItem("user_id") || 1);
  const toBase64Image = (data: string, format: "jpeg" | "png" = "jpeg") =>
  `data:image/${format};base64,${data}`;
  useEffect(() => {
    const fetchApplicationsAndVehicles = async () => {
      try {
        const appRes = await axios.get(
          `${API_BASE_URL}citizens/get-applications/${citizenId}/`
        );
        const appData: Application[] = appRes.data.applications;
        setApplications(appData);

        const hasApproved = appData.some((app) => app.status === "Verified");

        if (!hasApproved) {
          setNotification({
            open: true,
            message:
              "You have not registered your vehicle documents or you have vehicle documents waiting for approval.",
            severity: "info",
          });
        } else {
          const vehicleRes = await axios.post(
            `${API_BASE_URL}vehicles/search-by-citizen/`,
            { citizen_id: citizenId }
          );
          setVehicles(vehicleRes.data.data);
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

    fetchApplicationsAndVehicles();
  }, [citizenId]);

  return (
    <Box p={4}>
      <Typography variant="h5" gutterBottom>
        📋 List of registered license plates
      </Typography>
        {applications.length > 0 && (
  <Box mt={4}>
    {applications.map((app, i) => (
      <Paper key={i} sx={{ p: 2, mb: 2 }}>
        <Typography>License plate: {app.plate_number}</Typography>
        <Typography>Status: {app.status}</Typography>
        {app.image && (
          <img
            src={app.image}
            alt={`application-${i}`}
            style={{
              maxWidth: "100px",
              width: "100%",
              borderRadius: 6,
              marginTop: 8,
              cursor: "pointer"
            }}
            onClick={() => setImageViewer(app.image)}
          />
        )}
      </Paper>
    ))}
  </Box>
)}
      {/* {loading ? (
        <CircularProgress />
      ) : vehicles.length > 0 ? (
        <Box>
          {vehicles.map((vehicle) => (
            <Paper key={vehicle.vehicle_id} sx={{ p: 3, mb: 2 }}>
              <Typography>🔢 Biển số: {vehicle.plate_number}</Typography>
              <Typography variant="body2" color="text.secondary">
                (Xe thuộc sở hữu của bạn)
              </Typography>
              <Typography> Images:</Typography>
                  {vehicle.violation_image?.map((img: string, i: number) => (
                    <img
                      key={i}
                      src={toBase64Image(img)}
                      alt={`violation-${i}`}
                      style={{
                        maxWidth: "100px",   
                        width: "100%",
                        borderRadius: 6,
                        marginTop: 8,
                        cursor: "pointer"
                      }}
                      onClick={() => setImageViewer(toBase64Image(img))}
                    />
                  ))}              
            </Paper>
          ))}
        </Box>
      ) : (
        <Alert severity="info" sx={{ mt: 3 }}>
          Không có biển số nào được hiển thị vì bạn chưa có giấy tờ xe được duyệt.
        </Alert>
      )} */}

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

      <Dialog open={!!imageViewer} onClose={() => setImageViewer(null)} maxWidth="md">
              <DialogContent sx={{ p: 0 }}>
                <img src={imageViewer ?? ""} alt="Full size" style={{ width: "100%" }} />
              </DialogContent>
            </Dialog>
    </Box>
  );
};

export default CitizenNotification;
