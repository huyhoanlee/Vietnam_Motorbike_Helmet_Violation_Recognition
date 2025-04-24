import React, { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Collapse,
  Container,
  Dialog,
  DialogContent,
  Grid,
  IconButton,
  Paper,
  Snackbar,
  TextField,
  Typography,
} from "@mui/material";
import { ExpandLess, ExpandMore } from "@mui/icons-material";

// ------------------------
// 📌 Type Definitions
// ------------------------
interface Violation {
  violation_id: number;
  plate_number: string;
  vehicle_id?: string;
  location: string;
  detected_at: string;
  violation_image: string;
  violation_status: string;
}

type ViolationsByCitizen = Record<string, Violation[]>;

interface NotificationState {
  open: boolean;
  type: "success" | "error" | "info" | "warning";
  message: string;
}

// ------------------------
// 🎨 Status color mapping
// ------------------------
const statusColors: Record<string, string> = {
  "AI Detected": "#FFD700",
  Approved: "#4CAF50",
  Rejected: "#F44336",
  Modified: "#2196F3",
  Provided: "#9C27B0",
  default: "#9E9E9E",
};

// ------------------------
// 📦 Sample Data (Mock)
// ------------------------
const mockCitizenViolations: ViolationsByCitizen = {
  "01": [
    {
      violation_id: 1,
      plate_number: "77B-3134523",
      location: "3123 Trần Hưng Đạo, phường Nhơn Bình, Quy Nhơn",
      detected_at: "2025-02-20 14:30:00",
      violation_image: "https://via.placeholder.com/400,https://via.placeholder.com/410",
      violation_status: "AI Detected",
    },
    {
      violation_id: 2,
      plate_number: "77B-3134523",
      location: "305 Lê Hồng Phong, Quy Nhơn",
      detected_at: "2025-03-01 10:10:00",
      violation_image: "https://via.placeholder.com/420",
      violation_status: "Approved",
    },
  ],
  "02": [
    {
      violation_id: 3,
      plate_number: "77A-1111111",
      location: "Nguyễn Huệ, Quy Nhơn",
      detected_at: "2025-01-10 08:45:00",
      violation_image: "https://via.placeholder.com/450",
      violation_status: "Rejected",
    },
  ],
};

// ------------------------
// ✅ Component
// ------------------------
const ViolationLookupPageHardCode: React.FC = () => {
  const [expandedPlates, setExpandedPlates] = useState<Record<string, boolean>>({});
  const [imageViewer, setImageViewer] = useState<string | null>(null);
  const [notification, setNotification] = useState<NotificationState>({
    open: false,
    type: "info",
    message: "",
  });

  const toggleExpand = (plate: string) => {
    setExpandedPlates((prev) => ({ ...prev, [plate]: !prev[plate] }));
  };

  return (
    <Container sx={{ mt: 6, mb: 10 }}>
      <Typography variant="h4" gutterBottom>
        🚔 Violation Lookup (Mock Data)
      </Typography>

      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          🔍 Violations from Registered Documents
        </Typography>

        {Object.entries(mockCitizenViolations).map(([citizenId, violations]) => {
          const groupedByPlate: Record<string, Violation[]> = violations.reduce((acc, curr) => {
            if (!acc[curr.plate_number]) acc[curr.plate_number] = [];
            acc[curr.plate_number].push(curr);
            return acc;
          }, {} as Record<string, Violation[]>);

          return (
            <Box key={citizenId} mt={3}>
              <Typography fontWeight="bold" sx={{ mb: 1 }}>
                👤 Citizen ID: {citizenId}
              </Typography>

              {Object.entries(groupedByPlate).map(([plate, vList]) => (
                <Paper key={plate} sx={{ p: 2, mt: 2 }}>
                  <Box
                    display="flex"
                    justifyContent="space-between"
                    alignItems="center"
                    sx={{ cursor: "pointer" }}
                    onClick={() => toggleExpand(plate)}
                  >
                    <Typography variant="subtitle1">
                      Plate Number: {plate} ({vList.length} violation{vList.length > 1 ? "s" : ""})
                    </Typography>
                    <IconButton>{expandedPlates[plate] ? <ExpandLess /> : <ExpandMore />}</IconButton>
                  </Box>

                  <Collapse in={expandedPlates[plate]} timeout="auto" unmountOnExit>
                    <Grid container spacing={2} mt={1}>
                      {vList.map((v: Violation, idx: number) => (
                        <Grid item xs={12} md={6} key={idx}>
                          <Paper sx={{ p: 2 }}>
                            <Typography>📋 Violation ID: {v.violation_id}</Typography>
                            <Typography>📍 Location: {v.location}</Typography>
                            <Typography>🕒 Time: {v.detected_at}</Typography>
                            <Typography sx={{ color: statusColors[v.violation_status] || statusColors["default"] }}>
                              📁 Status: {v.violation_status}
                            </Typography>
                            <Typography>🖼 Images:</Typography>
                            {v.violation_image.split(",").map((img: string, i: number) => (
                              <img
                                key={i}
                                src={img.trim()}
                                alt={`violation-${i}`}
                                style={{
                                  width: "100%",
                                  borderRadius: 6,
                                  marginTop: 8,
                                  cursor: "pointer",
                                }}
                                onClick={() => setImageViewer(img.trim())}
                              />
                            ))}
                          </Paper>
                        </Grid>
                      ))}
                    </Grid>
                  </Collapse>
                </Paper>
              ))}
            </Box>
          );
        })}
      </Paper>

      {/* Image Viewer Dialog */}
      <Dialog open={!!imageViewer} onClose={() => setImageViewer(null)} maxWidth="md">
        <DialogContent sx={{ p: 0 }}>
          <img src={imageViewer ?? ""} alt="Full-size" style={{ width: "100%" }} />
        </DialogContent>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={notification.open}
        autoHideDuration={3000}
        onClose={() => setNotification({ ...notification, open: false })}
        anchorOrigin={{ vertical: "top", horizontal: "right" }}
      >
        <Alert severity={notification.type} variant="filled">
          {notification.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default ViolationLookupPageHardCode;
