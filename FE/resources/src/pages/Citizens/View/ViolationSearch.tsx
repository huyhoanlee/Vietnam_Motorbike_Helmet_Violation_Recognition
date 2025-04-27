import React, { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
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
import axios from "axios";
import { ExpandLess, ExpandMore } from "@mui/icons-material";

import config from "../../../config";

const API_BASE_URL = `${config.API_URL}violations`;

// ------------------------
// 📌 Type Definitions
// ------------------------
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


const statusColors: Record<string, string> = {
  "AI Detected": "#FFD700",
  Approved: "#4CAF50",
  Rejected: "#F44336",
  Modified: "#2196F3",
  Provided: "#9C27B0",
};

const ViolationLookupPage: React.FC = () => {
  const [plateNumber, setPlateNumber] = useState("");
  const [searchResult, setSearchResult] = useState<Violation[] | null>(null);
  const [citizenViolations, setCitizenViolations] = useState<ViolationsByCitizen | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadCitizen, setLoadCitizen] = useState(true);
  const [notification, setNotification] = useState<NotificationState>({
    open: false,
    type: "info",
    message: "",
  });
  const [imageViewer, setImageViewer] = useState<string | null>(null);
const normalizeBase64Image = (data: string, format: "jpeg" | "png" = "jpeg") => {
  if (data.startsWith("data:image/")) {
    return data; 
  }
  return `data:image/${format};base64,${data}`; 
};
  useEffect(() => {
    axios
      .get(`${API_BASE_URL}/search-by-citizen/`)
      .then((res) => {
        setCitizenViolations(res.data?.data);
        setLoadCitizen(false);
      })
      .catch(() => {
        setNotification({
          open: true,
          type: "error",
          message: "Unable to fetch data from registered documents.",
        });
        setLoadCitizen(false);
      });
  }, []);

  const handleSearch = () => {
    if (!plateNumber) {
      setNotification({
        open: true,
        type: "warning",
        message: "Please enter a plate number!",
      });
      return;
    }

    setLoading(true);
    setSearchResult(null);

    axios
      .post(`${API_BASE_URL}/search-by-plate-number/`, {
        plate_number: plateNumber.trim()
      })
      .then((res) => {
        const data: Violation[] = res.data?.data?.violations || [];
        setSearchResult(data);
        setNotification({ open: true, type: "success", message: "Search successful!" });
      })
      .catch((err) => {
        setNotification({
          open: true,
          type: "error",
          message: err?.response?.data?.message || "Plate not found or server error!",
        });
      })
      .finally(() => setLoading(false));
  };

  return (
    <Container sx={{ mt: 6, mb: 10 }}>
      <Typography variant="h4" gutterBottom>
        Violation Lookup
      </Typography>

      {/* Section 1 - Search by plate number */}
      <Paper elevation={3} sx={{ p: 3, mb: 5 }}>
        <Typography variant="h6" gutterBottom>
          Search by Plate Number
        </Typography>
        <Box display="flex" gap={2} alignItems="center">
          <TextField
            label="Enter plate number"
            value={plateNumber}
            onChange={(e) => setPlateNumber(e.target.value)}
            fullWidth
          />
          <Button variant="contained" onClick={handleSearch}>
            Search
          </Button>
        </Box>

        {loading && <CircularProgress sx={{ mt: 2 }} />}
        {searchResult && (
          <Box mt={3}>
            {searchResult.length === 0 ? (
              <Alert severity="info">No violations found for this plate number.</Alert>
            ) : (
              searchResult.map((item: Violation, idx: number) => (
                <Paper key={idx} sx={{ p: 2, mt: 2 }}>
                  <Typography> Violation ID: {item.violation_id}</Typography>
                  <Typography> Location: {item.location}</Typography>
                  <Typography> Time: {item.detected_at}</Typography>
                  {/* <Typography sx={{ color: statusColors[item.violation_status] || "#000" }}>
                     Status: {item.violation_status}
                  </Typography> */}
                  <Typography> Images:</Typography>
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
                        cursor: "pointer"
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

      {/* Section 2 - Registered Document Violations */}
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Check Violations from Vehicle Registration
        </Typography>
        {loadCitizen ? (
          <Typography color="text.secondary">
             Checking for violations from registered data...
          </Typography>
        ) : !citizenViolations || Object.keys(citizenViolations).length === 0 ? (
          <Alert severity="info" sx={{ mt: 2 }}>
            No violations found from registered documents.
          </Alert>
        ) : (
          Object.entries(citizenViolations).map(([citizenId, vList]: [string, Violation[]]) => {
            const groupedByPlate: Record<string, Violation[]> = vList.reduce((acc, curr) => {
              if (!acc[curr.plate_number]) {
                acc[curr.plate_number] = [];
              }
              acc[curr.plate_number].push(curr);
              return acc;
            }, {} as Record<string, Violation[]>);

            return (
              <Box key={citizenId} mt={3}>
                <Typography fontWeight="bold" sx={{ mb: 1 }}>
                  Citizen ID: {citizenId}
                </Typography>

                {Object.entries(groupedByPlate).map(([plate, violations], index: number) => {
                  const [expanded, setExpanded] = useState(false);

                  return (
                    <Paper key={index} sx={{ p: 2, mt: 2 }}>
                      <Box
                        display="flex"
                        justifyContent="space-between"
                        alignItems="center"
                        sx={{ cursor: "pointer" }}
                        onClick={() => setExpanded(!expanded)}
                      >
                        <Typography variant="subtitle1">
                          Plate Number: {plate} ({violations.length} violation{violations.length > 1 ? "s" : ""})
                        </Typography>
                        <IconButton>{expanded ? <ExpandLess /> : <ExpandMore />}</IconButton>
                      </Box>

                      <Collapse in={expanded} timeout="auto" unmountOnExit>
                        <Grid container spacing={2} mt={2}>
                          {violations.map((v: Violation, idx: number) => (
                            <Grid item xs={12} md={6} key={idx}>
                              <Paper sx={{ p: 2 }}>
                                <Typography> Violation ID: {v.violation_id}</Typography>
                                <Typography> Plate Number: {v.plate_number}</Typography>
                                <Typography> Location: {v.location || "Unknown"}</Typography>
                                <Typography> Time: {v.detected_at}</Typography>
                                <Typography sx={{ color: statusColors[v.violation_status] || "#000" }}>
                                   Status: {v.violation_status}
                                </Typography>
                                <Typography> Images:</Typography>
                                {v.violation_image?.map((img: string, i: number) => (
                                  <img
                                    key={i}
                                    src={normalizeBase64Image(img, "png")}
                                    alt={`violation-${i}`}
                                    style={{
                                      maxWidth: "400px",   // 👈 fix chiều rộng tối đa
                                      width: "100%",
                                      borderRadius: 6,
                                      marginTop: 8,
                                      cursor: "pointer"
                                    }}
                                    onClick={() => setImageViewer(normalizeBase64Image(img, "png"))}
                                  />

                                ))}
                              </Paper>
                            </Grid>
                          ))}
                        </Grid>
                      </Collapse>
                    </Paper>
                  );
                })}
              </Box>
            );
          })
        )}
      </Paper>

      {/* Snackbar Notifications */}
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

      {/* Image Viewer Dialog */}
      <Dialog open={!!imageViewer} onClose={() => setImageViewer(null)} maxWidth="md">
        <DialogContent sx={{ p: 0 }}>
          <img src={imageViewer ?? ""} alt="Full size" style={{ width: "100%" }} />
        </DialogContent>
      </Dialog>
    </Container>
  );
};

export default ViolationLookupPage;
