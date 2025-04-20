import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Button, Dialog, DialogTitle, DialogContent, DialogActions, Typography, Box, Chip
} from "@mui/material";
import { ExpandMore, CheckCircle, Cancel } from "@mui/icons-material";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const API_BASE = "https://hanaxuan-backend.hf.space/api/";

const axiosInstance = axios.create();
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const statusColors: any = {
  submitted: { label: "Submitted", color: "warning" },
  verified: { label: "Verified", color: "success" }
};

const CitizenPersonalInfoManagement: React.FC = () => {
  const [citizens, setCitizens] = useState<any[]>([]);
  const [selectedCitizen, setSelectedCitizen] = useState<any>(null);
  const [openDialog, setOpenDialog] = useState(false);

  useEffect(() => {
    const fetchCitizens = async () => {
      try {
        const response = await axiosInstance.get(`${API_BASE}citizens/get-all-submitted/`);
        setCitizens(response.data);
      } catch (error) {
        console.error("Failed to fetch submitted citizens", error);
        toast.error("Error loading data");
      }
    };

    fetchCitizens();
  }, []);

  const handleViewDetails = (citizen: any) => {
    setSelectedCitizen(citizen);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedCitizen(null);
  };

  const verifyCitizen = async () => {
    if (!selectedCitizen) return;

    try {
      await axiosInstance.patch(`${API_BASE}citizens/verify/${selectedCitizen.id}/`);
      setCitizens(prev =>
        prev.map(c =>
          c.id === selectedCitizen.id ? { ...c, status: "verified" } : c
        )
      );
      toast.success(`Citizen ${selectedCitizen.full_name} verified successfully`);
    } catch (error) {
      console.error("Verification failed:", error);
      toast.error("Verification failed");
    } finally {
      handleCloseDialog();
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3, color: "primary.main", fontWeight: "bold" }}>
        Citizen Identity Verification
      </Typography>

      <TableContainer component={Paper} sx={{ boxShadow: 3 }}>
        <Table>
          <TableHead sx={{ bgcolor: "grey.200" }}>
            <TableRow>
              {["Full Name", "Email", "DOB", "Status", "Actions"].map(header => (
                <TableCell key={header} sx={{ fontWeight: "bold" }}>{header}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {citizens.map(citizen => (
              <TableRow key={citizen.id} hover>
                <TableCell>{citizen.full_name}</TableCell>
                <TableCell>{citizen.email}</TableCell>
                <TableCell>{citizen.dob}</TableCell>
                <TableCell>
                  <Chip
                    label={statusColors[citizen.status?.toLowerCase()]?.label || "Unknown"}
                    color={statusColors[citizen.status?.toLowerCase()]?.color || "default"}
                    sx={{ fontWeight: "bold" }}
                  />
                </TableCell>
                <TableCell>
                  <Button
                    variant="contained"
                    startIcon={<ExpandMore />}
                    onClick={() => handleViewDetails(citizen)}
                  >
                    View Details
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialog for citizen detail view */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        {selectedCitizen && (
          <>
            <DialogTitle>
              <Typography variant="h6" fontWeight="bold">
                Citizen Details: {selectedCitizen.full_name}
              </Typography>
            </DialogTitle>
            <DialogContent dividers>
              <Typography><strong>📧 Email:</strong> {selectedCitizen.email}</Typography>
              <Typography><strong>🆔 ID Number:</strong> {selectedCitizen.citizen_identity_id}</Typography>
              <Typography><strong>📍 Address:</strong> {selectedCitizen.address}</Typography>
              <Typography><strong>📅 Date of Birth:</strong> {selectedCitizen.dob}</Typography>
              <Typography><strong>🌐 Place of Birth:</strong> {selectedCitizen.place_of_birth}</Typography>
              <Typography><strong>⚧ Gender:</strong> {selectedCitizen.gender}</Typography>
              <Typography><strong>📅 Issue Date:</strong> {selectedCitizen.issue_date}</Typography>
              <Typography><strong>🏢 Place of Issue:</strong> {selectedCitizen.place_of_issue}</Typography>
              <Typography><strong>🌎 Nationality:</strong> {selectedCitizen.nationality}</Typography>

              {selectedCitizen.identity_card && (
                <Box mt={3} sx={{ textAlign: "center" }}>
                  <Typography variant="subtitle1" fontWeight="bold">🪪 Identity Card</Typography>
                  <Box sx={{
                    mt: 1,
                    overflow: "hidden",
                    borderRadius: 2,
                    boxShadow: 3,
                    "& img": {
                      width: "100%",
                      maxWidth: 400,
                      transition: "transform 0.3s ease-in-out",
                      "&:hover": { transform: "scale(1.05)" }
                    }
                  }}>
                    <img src={`data:image/png;base64,${selectedCitizen.identity_card}`} alt="Identity Card" />
                  </Box>
                </Box>
              )}
            </DialogContent>
            <DialogActions>
              <Button
                variant="contained"
                color="success"
                startIcon={<CheckCircle />}
                onClick={verifyCitizen}
              >
                Verify
              </Button>
              <Button onClick={handleCloseDialog} color="secondary">
                Close
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      <ToastContainer />
    </Box>
  );
};

export default CitizenPersonalInfoManagement;
