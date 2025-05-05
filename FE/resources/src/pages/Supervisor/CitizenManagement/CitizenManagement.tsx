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
  DialogContentText,
  DialogActions,
  Chip,
  Grid,
  Card,
  CardMedia,
  CardContent,
  Divider,
  CircularProgress,
  Fade,
  useTheme,
  useMediaQuery,
  Tooltip,
  IconButton,
  Alert,
  Snackbar
} from "@mui/material";
import {
  Visibility,
  CheckCircle,
  DirectionsCar,
  Badge,
  CheckCircleOutline
} from "@mui/icons-material";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import type { ChipProps } from '@mui/material';

const API_BASE_URL = `${config.API_URL}`;

// Status configurations with corresponding colors and labels
const statusColors: Record<string, { label: string; color: ChipProps['color'] }> = {
  Submitted: { label: "Submitted", color: "warning" },
  Verified: { label: "Verified", color: "success" },
  Created: { label: "Created", color: "error" }
};

// Format image source for display
const formatImageSrc = (imageData: string | null): string | undefined => {
  if (!imageData) return undefined;
  if (imageData.startsWith("data:image")) return imageData;
  if (imageData.length > 100 && !imageData.startsWith("http")) {
    return `data:image/jpeg;base64,${imageData}`;
  }
  return imageData;
};

const CitizenManagement: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [citizens, setCitizens] = useState<any[]>([]);
  const [selectedCitizen, setSelectedCitizen] = useState<any>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  const [verifyingIdentity, setVerifyingIdentity] = useState(false);
  const [verifyingVehicle, setVerifyingVehicle] = useState(false);
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'identity' | 'vehicle' | null>(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  useEffect(() => {
    fetchCitizens();
  }, []);

  const fetchCitizens = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get(`${API_BASE_URL}car_parrots/get-all/`);
      const apiData = response.data;

      const formatted = apiData.map((citizen: any) => {
        const firstCar = citizen.card_parrots?.[0] || {};
        return {
          ...citizen,
          card_parrot_image: firstCar?.image || null,
          plate_number: firstCar?.plate_number || "Not registered",
          car_parrot_id: firstCar?.id || null,
          car_verified: firstCar?.status || false,
          status: citizen.status || "Submitted"
        };
      });

      setCitizens(formatted);
    } catch (error) {
      console.error("Fetch error:", error);
      toast.error("Failed to load citizens data");
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (citizen: any) => {
    setSelectedCitizen(citizen);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setSelectedCitizen(null);
    setOpenDialog(false);
  };

  const handleVerifyIdentity = () => {
    setConfirmAction('identity');
    setOpenConfirmDialog(true);
  };

  const handleVerifyVehicle = () => {
    setConfirmAction('vehicle');
    setOpenConfirmDialog(true);
  };

  const handleConfirmVerification = async () => {
    try {
      if (confirmAction === 'identity') {
        setVerifyingIdentity(true);
        const citizenId = selectedCitizen.citizen_id.toString().replace(/\D/g, '');
        await axiosInstance.patch(`${API_BASE_URL}citizens/verify/${citizenId}/`);
        
        // Update local state
        setCitizens(prevCitizens => 
          prevCitizens.map(citizen => 
            citizen.citizen_id === selectedCitizen.citizen_id 
              ? { ...citizen, status: "Verified" } 
              : citizen
          )
        );
        
        setSelectedCitizen({...selectedCitizen, status: "Verified"});
        setSnackbar({ open: true, message: 'Identity verification successful', severity: 'success' });
      } else if (confirmAction === 'vehicle') {
        setVerifyingVehicle(true);
        const carParrotId = selectedCitizen.car_parrot_id;
        await axiosInstance.put(`${API_BASE_URL}car_parrots/verified/${carParrotId}/`);
        
        // Update local state
        setCitizens(prevCitizens => 
          prevCitizens.map(citizen => 
            citizen.citizen_id === selectedCitizen.citizen_id 
              ? { ...citizen, car_verified: true } 
              : citizen
          )
        );
        
        setSelectedCitizen({...selectedCitizen, car_verified: true});
        setSnackbar({ open: true, message: 'Vehicle registration verification successful', severity: 'success' });
      }
    } catch (error) {
      console.error("Verification error:", error);
      setSnackbar({ open: true, message: 'Verification failed. Please try again.', severity: 'error' });
    } finally {
      setVerifyingIdentity(false);
      setVerifyingVehicle(false);
      setOpenConfirmDialog(false);
      setConfirmAction(null);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const canVerifyVehicle = selectedCitizen?.status === "Verified" && selectedCitizen?.card_parrot_image;

  return (
    <Box sx={{ p: { xs: 2, md: 3 } }}>
      <Typography 
        variant="h4" 
        fontWeight="bold" 
        color="primary" 
        mb={3}
        sx={{ 
          fontSize: { xs: '1.5rem', sm: '2rem', md: '2.25rem' },
          borderBottom: `2px solid ${theme.palette.primary.main}`,
          pb: 1
        }}
      >
        Citizen Registration Management
      </Typography>

      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
          <CircularProgress />
        </Box>
      ) : (
        <Fade in={!loading} timeout={500}>
          <TableContainer 
            component={Paper} 
            sx={{ 
              boxShadow: 3, 
              borderRadius: 2,
              overflow: 'hidden',
              '& .MuiTableRow-root:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.04)'
              }
            }}
          >
            <Table>
              <TableHead sx={{ bgcolor: theme.palette.primary.main }}>
                <TableRow>
                  {["Citizen ID", "Full Name", "Phone Number", "Email", "Status", "Actions"].map((header) => (
                    <TableCell 
                      key={header} 
                      sx={{ 
                        fontWeight: "bold", 
                        color: 'white',
                        fontSize: { xs: '0.75rem', sm: '0.875rem', md: '1rem' }
                      }}
                    >
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
                        label={statusColors[citizen.status as keyof typeof statusColors]?.label || "Unknown"}
                        color={statusColors[citizen.status as keyof typeof statusColors]?.color || "default"}
                        size={isMobile ? "small" : "medium"}
                        sx={{ fontWeight: 'medium' }}
                      />
                    </TableCell>
                    <TableCell>
                      <Tooltip title="View Details">
                        <IconButton 
                          color="primary"
                          onClick={() => handleViewDetails(citizen)}
                          size={isMobile ? "small" : "medium"}
                        >
                          <Visibility />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Fade>
      )}

      {/* Details Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog} 
        maxWidth="md" 
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            overflow: 'hidden'
          }
        }}
      >
        {selectedCitizen && (
          <>
            <DialogTitle sx={{ 
              bgcolor: theme.palette.primary.main, 
              color: 'white',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <Typography variant="h6" fontWeight="bold">
                Citizen Details: {selectedCitizen.full_name}
              </Typography>
              <Chip
                label={statusColors[selectedCitizen.status as keyof typeof statusColors]?.label || "Unknown"}
                color={statusColors[selectedCitizen.status as keyof typeof statusColors]?.color || "default"}
                size="small"
                sx={{ fontWeight: 'medium' }}
              />
            </DialogTitle>
            <DialogContent dividers sx={{ p: { xs: 2, md: 3 } }}>
              <Grid container spacing={3}>
                {/* Citizen Information */}
                <Grid item xs={12}>
                  <Card elevation={2} sx={{ mb: 3, borderRadius: 2 }}>
                    <CardContent>
                      <Typography variant="h6" fontWeight="bold" color="primary" gutterBottom>
                        Personal Information
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body1">
                            <strong>Address:</strong> {selectedCitizen.address || "Not provided"}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body1">
                            <strong>Citizen Identity ID:</strong> {selectedCitizen.citizen_identity_id}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body1">
                            <strong>Phone:</strong> {selectedCitizen.phone_number}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body1">
                            <strong>Email:</strong> {selectedCitizen.email}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body1">
                            <strong>Plate Number:</strong> {selectedCitizen.plate_number}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body1">
                            <strong>Identity Verification:</strong> {selectedCitizen.status === "Verified" ? "Verified" : "Not Verified"}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body1">
                            <strong>Vehicle Verification:</strong> {selectedCitizen.car_verified ? "Verified" : "Not Verified"}
                          </Typography>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Identity Card */}
                <Grid item xs={12} md={6}>
                  <Card elevation={3} sx={{ height: '100%', borderRadius: 2 }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Badge sx={{ mr: 1 }} />
                          <Typography variant="h6" fontWeight="bold">
                            Identity Card
                          </Typography>
                        </Box>
                        {selectedCitizen.status === "Verified" && (
                          <Tooltip title="Verified">
                            <CheckCircle color="success" />
                          </Tooltip>
                        )}
                      </Box>
                      <Divider sx={{ mb: 2 }} />
                      {selectedCitizen.identity_card ? (
                        <CardMedia
                          component="img"
                          image={formatImageSrc(selectedCitizen.identity_card)}
                          alt="Identity Card"
                          sx={{
                            width: '100%',
                            borderRadius: 1,
                            boxShadow: 1,
                            transition: 'transform 0.3s ease-in-out',
                            '&:hover': { transform: 'scale(1.02)' }
                          }}
                        />
                      ) : (
                        <Alert severity="info">Identity card not available</Alert>
                      )}
                      {selectedCitizen.status !== "Verified" && selectedCitizen.identity_card && (
                        <Button 
                          variant="contained" 
                          color="primary"
                          startIcon={<CheckCircleOutline />}
                          onClick={handleVerifyIdentity}
                          disabled={verifyingIdentity}
                          sx={{ mt: 2, width: '100%' }}
                        >
                          {verifyingIdentity ? <CircularProgress size={24} /> : "Verify Identity"}
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                </Grid>

                {/* Vehicle Registration */}
                <Grid item xs={12} md={6}>
                  <Card elevation={3} sx={{ height: '100%', borderRadius: 2 }}>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <DirectionsCar sx={{ mr: 1 }} />
                          <Typography variant="h6" fontWeight="bold">
                            Vehicle Registration
                          </Typography>
                        </Box>
                        {selectedCitizen.car_verified && (
                          <Tooltip title="Verified">
                            <CheckCircle color="success" />
                          </Tooltip>
                        )}
                      </Box>
                      <Divider sx={{ mb: 2 }} />
                      {selectedCitizen.card_parrot_image ? (
                        <CardMedia
                          component="img"
                          image={formatImageSrc(selectedCitizen.card_parrot_image)}
                          alt="Vehicle Registration"
                          sx={{
                            width: '100%',
                            borderRadius: 1,
                            boxShadow: 1,
                            transition: 'transform 0.3s ease-in-out',
                            '&:hover': { transform: 'scale(1.02)' }
                          }}
                        />
                      ) : (
                        <Alert severity="info">Vehicle registration not available</Alert>
                      )}
                      {selectedCitizen.status === "Verified" && selectedCitizen.card_parrot_image && !selectedCitizen.car_verified && (
                        <Button 
                          variant="contained" 
                          color="primary"
                          startIcon={<CheckCircleOutline />}
                          onClick={handleVerifyVehicle}
                          disabled={verifyingVehicle || !canVerifyVehicle}
                          sx={{ mt: 2, width: '100%' }}
                        >
                          {verifyingVehicle ? <CircularProgress size={24} /> : "Verify Vehicle Registration"}
                        </Button>
                      )}
                      {selectedCitizen.status === "Verified" && !selectedCitizen.card_parrot_image && (
                        <Alert severity="warning" sx={{ mt: 2 }}>
                          Citizen has not uploaded vehicle registration documents
                        </Alert>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
              <Button 
                onClick={handleCloseDialog} 
                variant="outlined" 
                color="primary"
              >
                Close
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog
        open={openConfirmDialog}
        onClose={() => setOpenConfirmDialog(false)}
      >
        <DialogTitle>Confirmation</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {confirmAction === 'identity' 
              ? `Are you sure you want to verify ${selectedCitizen?.full_name}'s identity? This confirms that you have reviewed their information and identity card, and everything is correct.`
              : `Are you sure you want to verify ${selectedCitizen?.full_name}'s vehicle registration? This confirms that you have reviewed their vehicle documents and everything is correct.`
            }
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenConfirmDialog(false)} color="primary">
            Cancel
          </Button>
          <Button 
            onClick={handleConfirmVerification} 
            color="primary" 
            variant="contained"
            disabled={verifyingIdentity || verifyingVehicle}
          >
            {verifyingIdentity || verifyingVehicle ? (
              <CircularProgress size={24} />
            ) : (
              "Confirm Verification"
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      <ToastContainer position="bottom-right" />
    </Box>
  );
};

export default CitizenManagement;