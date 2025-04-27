import React, { useState, useEffect } from "react";
import axiosInstance from "../../../services/axiosInstance";
import config from "../../../config";
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
} from "@mui/material";
import { ExpandMore } from "@mui/icons-material";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";



const API_BASE_URL = `${config.API_URL}`;
const statusColors: any = {
  Submitted: { label: "Submitted", color: "warning" },
  Verified: { label: "Verified", color: "success" },
  Created: { label: "Created", color: "error" }
};

// Format ảnh base64 hoặc url
const formatImageSrc = (imageData: string | null): string | undefined  => {
  if (!imageData) return undefined ;
  if (imageData.startsWith("data:image")) return imageData;
  if (imageData.length > 100 && !imageData.startsWith("http")) {
    return `data:image/jpeg;base64,${imageData}`;
  }
  return imageData;
};

const CitizenManagement: React.FC = () => {
  const [citizens, setCitizens] = useState<any[]>([]);
  const [selectedCitizen, setSelectedCitizen] = useState<any>(null);
  const [openDialog, setOpenDialog] = useState(false);

  useEffect(() => {
    const fetchCitizens = async () => {
      try {
        const response = await axiosInstance.get(`${API_BASE_URL}car_parrots/get-all/`);
        const apiData = response.data;

        const formatted = apiData.map((citizen: any) => {
          const firstCar = citizen.card_parrots?.[0] || {};
          return {
            ...citizen,
            card_parrot_image: firstCar?.image || null,
            plate_number: firstCar?.plate_number || "Unknown",
            status: citizen.status || "Submitted"
          };
        });

        setCitizens(formatted);
      } catch (error) {
        console.error("Fetch error:", error);
        toast.error("Failed to load citizens");
      }
    };

    fetchCitizens();
  }, []);

  const handleViewDetails = (citizen: any) => {
    setSelectedCitizen(citizen);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setSelectedCitizen(null);
    setOpenDialog(false);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" fontWeight="bold" color="primary" mb={3}>
        Citizen Registration Management
      </Typography>

      <TableContainer component={Paper} sx={{ boxShadow: 3 }}>
        <Table>
          <TableHead sx={{ bgcolor: "grey.200" }}>
            <TableRow>
              {["Citizen ID", "Full Name", "Phone Number", "Email", "Status", "Actions"].map((header) => (
                <TableCell key={header} sx={{ fontWeight: "bold" }}>
                  {header}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {citizens.map((citizen) => (
              <TableRow key={citizen.citizen_id} hover>
                <TableCell>{citizen.citizen_id}</TableCell>
                <TableCell>{citizen.full_name}</TableCell>
                <TableCell>{citizen.phone_number}</TableCell>
                <TableCell>{citizen.email}</TableCell>
                <TableCell>
                  <Chip
                    label={statusColors[citizen.status]?.label || "Unknown"}
                    color={statusColors[citizen.status]?.color || "default"}
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

      {/* Dialog hiển thị chi tiết */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        {selectedCitizen && (
          <>
            <DialogTitle>
              <Typography variant="h6" fontWeight="bold">
                Citizen Details: {selectedCitizen.full_name}
              </Typography>
            </DialogTitle>
            <DialogContent dividers>
              <Typography><strong>📍 Address:</strong> {selectedCitizen.address || "Unknown"}</Typography>
              <Typography><strong>🆔 Citizen Identity ID:</strong> {selectedCitizen.citizen_identity_id}</Typography>
              <Typography><strong>🚗 Plate Number:</strong> {selectedCitizen.plate_number}</Typography>

              <Box sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                gap: 2,
                mt: 2
              }}>
                {/* Căn cước công dân */}
                <Box sx={{ textAlign: "center" }}>
                  <Typography fontWeight="bold">🪪 Identity Card</Typography>
                  {selectedCitizen.identity_card ? (
                    <Box
                      sx={{
                        overflow: "hidden",
                        borderRadius: 2,
                        boxShadow: 3,
                        "& img": {
                          width: "100%",
                          transition: "transform 0.3s ease-in-out",
                          "&:hover": { transform: "scale(1.05)" }
                        }
                      }}
                    >
                      <img
                        src={formatImageSrc(selectedCitizen.identity_card)}
                        alt="Identity Card"
                      />
                    </Box>
                  ) : (
                    <Typography color="text.secondary">Not available</Typography>
                  )}
                </Box>

                {/* Giấy tờ xe */}
                <Box sx={{ textAlign: "center" }}>
                  <Typography fontWeight="bold">🚙 Vehicle Registration</Typography>
                  {selectedCitizen.card_parrot_image ? (
                    <Box
                      sx={{
                        overflow: "hidden",
                        borderRadius: 2,
                        boxShadow: 3,
                        "& img": {
                          width: "100%",
                          transition: "transform 0.3s ease-in-out",
                          "&:hover": { transform: "scale(1.05)" }
                        }
                      }}
                    >
                      <img
                        src={formatImageSrc(selectedCitizen.card_parrot_image)}
                        alt="Vehicle Registration"
                      />
                    </Box>
                  ) : (
                    <Typography color="text.secondary">Not available</Typography>
                  )}
                </Box>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDialog} color="primary">Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      <ToastContainer />
    </Box>
  );
};

export default CitizenManagement;
