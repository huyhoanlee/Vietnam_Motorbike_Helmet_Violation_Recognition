import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Button,
  Card,
  CardMedia,
  CardContent,
  Grid,
  MenuItem,
  Select,
  CircularProgress,
  Snackbar,
  Alert,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import axiosInstance from "../../services/axiosInstance.tsx";
import config from "../../config";

const API_BASE_URL = config.API_URL;

interface StatusOption {
  id: number;
  status_name: string;
}

interface Violation {
  id: number;
  location: string | null;
  camera_id?: string;
  plate_number: string;
  status?: string;
  status_name: string;
  detected_at: string;
  violation_image: string[];
}

interface ViolationDetailProps {
  violation: Violation;
  onStatusUpdate?: (id: number, newStatus: string) => void;
}

const ViolationDetail: React.FC<ViolationDetailProps> = ({ violation, onStatusUpdate }) => {
  const [statusOptions, setStatusOptions] = useState<StatusOption[]>([]);
  const [selectedStatusId, setSelectedStatusId] = useState<number | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>(violation.status_name || "Unknown");
  const [editing, setEditing] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [openImageDialog, setOpenImageDialog] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error"
  });
  const userRole = localStorage.getItem("user_role") || "user";

  const normalizeBase64Image = (data: string, format: "jpeg" | "png" = "png") => {
    if (!data) return "/placeholder-image.png";
    if (data.startsWith("data:image/")) return data;
    return `data:image/${format};base64,${data}`;
  };

  useEffect(() => {
    console.log("Violation props:", violation);
    console.log("User role:", userRole);
    console.log("Is supervisor:", userRole.toLowerCase() === "supervisor");

    if (userRole.toLowerCase() === "supervisor") {
      axiosInstance.get(`${API_BASE_URL}violation_status/get-all/`)
        .then(res => {
          const statuses = res.data?.data || [];
          console.log("Status options:", statuses);
          setStatusOptions(statuses);
          const matched = statuses.find((s: StatusOption) => 
            s.status_name.toLowerCase() === (violation.status_name || "Unknown").toLowerCase()
          );
          console.log("Matched status:", matched);
          if (matched) {
            setSelectedStatusId(matched.id);
            setSelectedStatus(matched.status_name); // Preserve original casing for display
          } else {
            setSelectedStatus(violation.status_name || "Unknown");
          }
        })
        .catch(err => {
          console.error("Error fetching status options:", err);
          setSnackbar({ 
            open: true, 
            message: "Failed to load status options", 
            severity: "error" 
          });
        });
    }
  }, [violation.status_name, userRole]);

  useEffect(() => {
    if (statusOptions.length > 0) {
      const matched = statusOptions.find((s) => 
        s.status_name.toLowerCase() === (violation.status_name || "Unknown").toLowerCase()
      );
      console.log("Matched status in second useEffect:", matched);
      if (matched) {
        setSelectedStatusId(matched.id);
      } else {
        setSelectedStatusId(null);
      }
    }
  }, [statusOptions, violation.status_name]);

  const handleChangeStatus = () => {
    if (selectedStatus.toLowerCase() !== (violation.status_name || "Unknown").toLowerCase() && selectedStatusId !== null) {
      setConfirmOpen(true);
    } else {
      setSnackbar({
        open: true,
        message: "Please select a different status",
        severity: "error"
      });
    }
  };

  const handleConfirmUpdate = () => {
    if (!selectedStatusId) {
      setSnackbar({
        open: true,
        message: "No status selected",
        severity: "error"
      });
      return;
    }

    setLoading(true);
    axiosInstance.put(`${API_BASE_URL}violations/change-status/${violation.id}/`, { 
      status_id: selectedStatusId 
    })
      .then(() => {
        setSnackbar({ 
          open: true, 
          message: "Status updated successfully", 
          severity: "success" 
        });
        setConfirmOpen(false);
        setEditing(false);
        if (onStatusUpdate) {
          onStatusUpdate(violation.id, selectedStatus);
        }
      })
      .catch(err => {
        const message = err.response?.data?.message || "Failed to update status";
        setSnackbar({ open: true, message, severity: "error" });
      })
      .finally(() => setLoading(false));
  };

  const handleCancel = () => {
    const matched = statusOptions.find(s => 
      s.status_name.toLowerCase() === (violation.status_name || "Unknown").toLowerCase()
    );
    setSelectedStatusId(matched ? matched.id : null);
    setSelectedStatus(violation.status_name || "Unknown");
    setEditing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "critical":
      case "rejected":
        return "red";
      case "ai_detected":
      case "reported":
      case "pending":
        return "orange";
      case "approved":
        return "green";
      default:
        return "grey";
    }
  };

  return (
    <Card sx={{ 
      display: "flex", 
      p: 2, 
      mb: 2, 
      boxShadow: 3, 
      backgroundColor: "#fafafa", 
      borderRadius: 3 
    }}>
      <CardMedia
        component="img"
        sx={{ 
          width: 150, 
          height: 150, 
          borderRadius: 2, 
          border: "1px solid #ddd",
          objectFit: "cover",
          cursor: "pointer"
        }}
        image={normalizeBase64Image(violation.violation_image?.[0])}
        alt="Violation Image"
        onClick={() => {
        setSelectedImage(normalizeBase64Image(violation.violation_image?.[0]));
        setOpenImageDialog(true);
      }}
        onError={(e) => {
          (e.target as HTMLImageElement).src = "/placeholder-image.png";
        }}
      />

      <CardContent sx={{ flex: 1, ml: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Typography variant="subtitle1" fontWeight="bold">Address:</Typography>
            <Typography>{violation.location || "Unknown"}</Typography>
          </Grid>

          <Grid item xs={6}>
            <Typography variant="subtitle1" fontWeight="bold">License Plate:</Typography>
            <Typography>{violation.plate_number || "N/A"}</Typography>
          </Grid>

          <Grid item xs={6}>
            <Typography variant="subtitle1" fontWeight="bold">Status:</Typography>
            {userRole.toLowerCase() === "supervisor" && editing ? (
              <Select
                fullWidth
                size="small"
                value={selectedStatusId ?? ""}
                onChange={(e) => {
                  const id = Number(e.target.value);
                  setSelectedStatusId(id);
                  const statusObj = statusOptions.find(s => s.id === id);
                  if (statusObj) setSelectedStatus(statusObj.status_name);
                }}
                displayEmpty
                renderValue={(value) => {
                  const status = statusOptions.find(s => s.id === value)?.status_name;
                  return status || "Select Status";
                }}
              >
                {statusOptions.map((status) => (
                  <MenuItem key={status.id} value={status.id}>
                    {status.status_name}
                  </MenuItem>
                ))}
              </Select>
            ) : (
              <Typography sx={{ color: getStatusColor(selectedStatus) }}>
                {selectedStatus}
              </Typography>
            )}
          </Grid>

          <Grid item xs={6}>
            <Typography variant="subtitle1" fontWeight="bold">Detected At:</Typography>
            <Typography>
              {violation.detected_at 
                ? new Date(violation.detected_at).toLocaleString() 
                : "N/A"}
            </Typography>
          </Grid>

          <Grid item xs={12}>
            <Typography variant="subtitle1" fontWeight="bold">Camera:</Typography>
            <Typography>{violation.camera_id || "Unknown"}</Typography>
          </Grid>

          {violation.violation_image?.length > 1 && (
            <Grid item xs={12}>
              <Typography variant="subtitle1" fontWeight="bold">Additional Images:</Typography>
              <Box sx={{ display: "flex", gap: 1, mt: 1, flexWrap: "wrap" }}>
                {violation.violation_image.slice(1).map((img, index) => (
                  <img
                    key={index}
                    src={normalizeBase64Image(img)}
                    alt={`violation-image-${index}`}
                    style={{
                      width: 100,
                      height: 100,
                      borderRadius: 4,
                      objectFit: "cover",
                      cursor: "pointer"
                    }}
                    onClick={() => {
                    setSelectedImage(normalizeBase64Image(img));
                    setOpenImageDialog(true);
                  }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/placeholder-image.png";
                    }}
                  />
                ))}
              </Box>
            </Grid>
          )}
        </Grid>

        {/* Action Buttons */}
        {userRole.toLowerCase() === "supervisor" ? (
          <Box sx={{ mt: 2, display: "flex", gap: 1 }}>
            {!editing ? (
              <Button
                variant="contained"
                startIcon={<NotificationsActiveIcon />}
                sx={{ 
                  backgroundColor: "#673ab7", 
                  "&:hover": { backgroundColor: "#512da8" } 
                }}
                onClick={() => setEditing(true)}
              >
                Change Status
              </Button>
            ) : (
              <>
                <Button
                  variant="contained"
                  onClick={handleChangeStatus}
                  disabled={selectedStatus.toLowerCase() === (violation.status_name || "Unknown").toLowerCase() || !selectedStatusId}
                  sx={{
                    backgroundColor: "#4caf50",
                    "&:hover": { backgroundColor: "#388e3c" },
                  }}
                >
                  Confirm
                </Button>
                <Button
                  variant="outlined"
                  onClick={handleCancel}
                  sx={{ 
                    color: "#d32f2f", 
                    borderColor: "#d32f2f",
                    "&:hover": { borderColor: "#b71c1c", color: "#b71c1c" }
                  }}
                >
                  Cancel
                </Button>
              </>
            )}
          </Box>
        ) : (
          <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
            Status change available for supervisors only
          </Typography>
        )}
      </CardContent>

      {/* Confirm Dialog */}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>Confirm Status Update</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to update the violation status from <strong>{violation.status_name || "Unknown"}</strong> to <strong>{selectedStatus}</strong>?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirmUpdate}
            variant="contained"
            disabled={loading}
            startIcon={loading && <CircularProgress color="inherit" size={20} />}
          >
            {loading ? "Updating..." : "Confirm"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar Notification */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert 
          severity={snackbar.severity} 
          onClose={() => setSnackbar({ ...snackbar, open: false })}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      <Dialog open={openImageDialog} onClose={() => setOpenImageDialog(false)} maxWidth="lg">
      <img 
        src={selectedImage || "/placeholder-image.png"} 
        alt="Zoomed Image"
        style={{ maxWidth: "100%", height: "auto" }}
      />
    </Dialog>
    </Card>
  );
};

export default ViolationDetail;