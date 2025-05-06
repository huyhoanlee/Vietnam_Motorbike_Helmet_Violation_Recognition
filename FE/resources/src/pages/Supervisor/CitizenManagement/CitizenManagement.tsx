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
  Snackbar,
  ButtonGroup
} from "@mui/material";
import {
  Visibility,
  CheckCircle,
  DirectionsCar,
  Badge,
  ErrorOutline,
  CheckCircleOutline,
  CancelOutlined,
  Compare
} from "@mui/icons-material";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const API_BASE_URL = `${config.API_URL}`;

type ChipColor =
  | "default"
  | "primary"
  | "secondary"
  | "error"
  | "info"
  | "success"
  | "warning";
// Status configurations with corresponding colors and labels
const statusColors: Record<string, { label: string; color: ChipColor }> = {
  Submitted: { label: "Submitted", color: "warning" },
  Verified: { label: "Verified", color: "success" },
  Created: { label: "Created", color: "info" },
  Rejected: { label: "Rejected", color: "error" }
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
  const [rejectingIdentity, setRejectingIdentity] = useState(false);
  const [verifyingVehicle, setVerifyingVehicle] = useState(false);
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'verify-identity' | 'reject-identity' | 'verify-vehicle' | null>(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [compareImagesDialog, setCompareImagesDialog] = useState(false);

  useEffect(() => {
    fetchCitizens();
  }, []);

  const fetchCitizens = async () => {
    setLoading(true);
    try {
      // Fetch ALL citizens instead of only submitted ones
      const citizensResponse = await axiosInstance.get(`${API_BASE_URL}citizens/get-all/`);
      let citizensData = citizensResponse.data || [];
      
      // Fetch car parrots data separately
      const carParrotsResponse = await axiosInstance.get(`${API_BASE_URL}car_parrots/get-all/`);
      const carParrotsData = carParrotsResponse.data || [];
      
      // Merge data to ensure we have complete citizen information
      const mergedData = citizensData.map((citizen: any) => {
        // Find matching citizen in car parrots data
        const matchingCarParrot = carParrotsData.find((cp: any) => 
          cp.citizen_identity_id === citizen.citizen_identity_id
        );
        
        // Get first car info if available
        const firstCar = matchingCarParrot?.card_parrots?.[0] || {};
        
        return {
          ...citizen,
          citizen_id: citizen.id, // Use the actual ID as citizen_id
          card_parrot_image: firstCar?.image || null,
          plate_number: firstCar?.plate_number || "Not registered",
          car_parrot_id: firstCar?.id || null,
          car_verified: firstCar?.status === "Verified",
          car_status: firstCar?.status || null
        };
      });

      setCitizens(mergedData);
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
    setConfirmAction('verify-identity');
    setOpenConfirmDialog(true);
  };

  const handleRejectIdentity = () => {
    setConfirmAction('reject-identity');
    setOpenConfirmDialog(true);
  };

  const handleVerifyVehicle = () => {
    setConfirmAction('verify-vehicle');
    setOpenConfirmDialog(true);
  };

  const handleConfirmVerification = async () => {
    try {
      if (confirmAction === 'verify-identity') {
        setVerifyingIdentity(true);
        const citizenId = selectedCitizen.id.toString();
        await axiosInstance.patch(`${API_BASE_URL}citizens/verify/${citizenId}/`);
        
        // Update local state
        setCitizens(prevCitizens => 
          prevCitizens.map(citizen => 
            citizen.id === selectedCitizen.id 
              ? { ...citizen, status: "Verified" } 
              : citizen
          )
        );
        
        setSelectedCitizen({...selectedCitizen, status: "Verified"});
        setSnackbar({ open: true, message: 'Identity verification successful', severity: 'success' });
      } 
      else if (confirmAction === 'reject-identity') {
        setRejectingIdentity(true);
        const citizenId = selectedCitizen.id.toString();
        await axiosInstance.patch(`${API_BASE_URL}citizens/reject/${citizenId}/`);
        
        // Update local state
        setCitizens(prevCitizens => 
          prevCitizens.map(citizen => 
            citizen.id === selectedCitizen.id 
              ? { ...citizen, status: "Rejected" } 
              : citizen
          )
        );
        
        setSelectedCitizen({...selectedCitizen, status: "Rejected"});
        setSnackbar({ open: true, message: 'Identity rejected due to image mismatch', severity: 'success' });
      }
      else if (confirmAction === 'verify-vehicle') {
        setVerifyingVehicle(true);
        const carParrotId = selectedCitizen.car_parrot_id;
        await axiosInstance.put(`${API_BASE_URL}car_parrots/verified/${carParrotId}/`);
        
        // Update local state
        setCitizens(prevCitizens => 
          prevCitizens.map(citizen => 
            citizen.id === selectedCitizen.id 
              ? { ...citizen, car_verified: true, car_status: "Verified" } 
              : citizen
          )
        );
        
        setSelectedCitizen({...selectedCitizen, car_verified: true, car_status: "Verified"});
        setSnackbar({ open: true, message: 'Vehicle registration verification successful', severity: 'success' });
      }
    } catch (error) {
      console.error("Verification error:", error);
      setSnackbar({ open: true, message: 'Action failed. Please try again.', severity: 'error' });
    } finally {
      setVerifyingIdentity(false);
      setRejectingIdentity(false);
      setVerifyingVehicle(false);
      setOpenConfirmDialog(false);
      setConfirmAction(null);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleCompareImages = () => {
    setCompareImagesDialog(true);
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
                  {["ID", "Citizen Identity ID", "Full Name", "Phone Number", "Email", "Status", "Actions"].map((header) => (
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
                {citizens.length > 0 ? (
                  citizens.map((citizen) => (
                    <TableRow key={citizen.id} hover>
                      <TableCell>{citizen.id}</TableCell>
                      <TableCell>{citizen.citizen_identity_id}</TableCell>
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
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <Typography variant="body1" py={3}>
                        No citizens found
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
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
                            <strong>Date of Birth:</strong> {selectedCitizen.dob}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body1">
                            <strong>Gender:</strong> {selectedCitizen.gender}
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
                            <strong>Nationality:</strong> {selectedCitizen.nationality}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body1">
                            <strong>Place of Birth:</strong> {selectedCitizen.place_of_birth}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body1">
                            <strong>Issue Date:</strong> {selectedCitizen.issue_date}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body1">
                            <strong>Place of Issue:</strong> {selectedCitizen.place_of_issue}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body1">
                            <strong>Plate Number:</strong> {selectedCitizen.plate_number}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body1">
                            <strong>Identity Verification:</strong> {selectedCitizen.status}
                          </Typography>
                        </Grid>
                        <Grid item xs={12} sm={6}>
                          <Typography variant="body1">
                            <strong>Vehicle Verification:</strong> {selectedCitizen.car_verified ? "Verified" : (selectedCitizen.car_status || "Not Verified")}
                          </Typography>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>

                {/* Identity Card and Personal Photo Comparison */}
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
                        {selectedCitizen.status === "Rejected" && (
                          <Tooltip title="Rejected">
                            <ErrorOutline color="error" />
                          </Tooltip>
                        )}
                      </Box>
                      <Divider sx={{ mb: 2 }} />
                      {selectedCitizen.identity_card ? (
                        <>
                          <CardMedia
                            component="img"
                            image={formatImageSrc(selectedCitizen.identity_card)}
                            alt="Identity Card"
                            sx={{
                              width: '100%',
                              borderRadius: 1,
                              boxShadow: 1,
                              maxHeight: 250,
                              objectFit: 'contain',
                              transition: 'transform 0.3s ease-in-out',
                              '&:hover': { transform: 'scale(1.02)' }
                            }}
                          />
                          
                          {/* Personal Photo */}
                          <Box sx={{ mt: 2 }}>
                            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                              Personal Photo
                            </Typography>
                            {selectedCitizen.person_image ? (
                              <CardMedia
                                component="img"
                                image={formatImageSrc(selectedCitizen.person_image)}
                                alt="Personal Photo"
                                sx={{
                                  width: '100%',
                                  maxHeight: 200,
                                  objectFit: 'contain',
                                  borderRadius: 1,
                                  boxShadow: 1
                                }}
                              />
                            ) : (
                              <Alert severity="info">Personal photo not available</Alert>
                            )}
                          </Box>
                          
                          {/* Compare button */}
                          {selectedCitizen.identity_card && selectedCitizen.person_image && selectedCitizen.status === "Submitted" && (
                            <Button
                              variant="outlined"
                              startIcon={<Compare />}
                              onClick={handleCompareImages}
                              sx={{ mt: 2, mb: 1 }}
                              fullWidth
                            >
                              Compare Images
                            </Button>
                          )}
                          
                          {selectedCitizen.status === "Submitted" && selectedCitizen.identity_card && (
                            <ButtonGroup 
                              variant="contained" 
                              sx={{ mt: 1, width: '100%' }}
                              aria-label="identity verification button group"
                            >
                              <Button 
                                color="primary"
                                startIcon={<CheckCircleOutline />}
                                onClick={handleVerifyIdentity}
                                disabled={verifyingIdentity || rejectingIdentity}
                                sx={{ width: '50%' }}
                              >
                                {verifyingIdentity ? <CircularProgress size={24} /> : "Verify"}
                              </Button>
                              <Button 
                                color="error"
                                startIcon={<CancelOutlined />}
                                onClick={handleRejectIdentity}
                                disabled={verifyingIdentity || rejectingIdentity}
                                sx={{ width: '50%' }}
                              >
                                {rejectingIdentity ? <CircularProgress size={24} /> : "Reject"}
                              </Button>
                            </ButtonGroup>
                          )}
                        </>
                      ) : (
                        <Alert severity="info">Identity card not available</Alert>
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
                        <>
                          <CardMedia
                            component="img"
                            image={formatImageSrc(selectedCitizen.card_parrot_image)}
                            alt="Vehicle Registration"
                            sx={{
                              width: '100%',
                              maxHeight: 400,
                              objectFit: 'contain',
                              borderRadius: 1,
                              boxShadow: 1,
                              transition: 'transform 0.3s ease-in-out',
                              '&:hover': { transform: 'scale(1.02)' }
                            }}
                          />
                          {selectedCitizen.status === "Verified" && !selectedCitizen.car_verified && (
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
                        </>
                      ) : (
                        <Alert severity="info">Vehicle registration not available</Alert>
                      )}
                      {selectedCitizen.status === "Verified" && !selectedCitizen.card_parrot_image && (
                        <Alert severity="warning" sx={{ mt: 2 }}>
                          Citizen has not uploaded vehicle registration documents
                        </Alert>
                      )}
                      {selectedCitizen.status === "Rejected" && (
                        <Alert severity="error" sx={{ mt: 2 }}>
                          Citizen identity verification was rejected. Vehicle registration cannot be processed.
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

      {/* Image Comparison Dialog */}
      <Dialog
        open={compareImagesDialog}
        onClose={() => setCompareImagesDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>Image Comparison</DialogTitle>
        <DialogContent>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle1" align="center" gutterBottom>Identity Card Image</Typography>
              {selectedCitizen?.identity_card && (
                <CardMedia
                  component="img"
                  image={formatImageSrc(selectedCitizen.identity_card)}
                  alt="Identity Card"
                  sx={{
                    width: '100%',
                    borderRadius: 1,
                    maxHeight: 400,
                    objectFit: 'contain'
                  }}
                />
              )}
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle1" align="center" gutterBottom>Personal Photo</Typography>
              {selectedCitizen?.person_image && (
                <CardMedia
                  component="img"
                  image={formatImageSrc(selectedCitizen.person_image)}
                  alt="Personal Photo"
                  sx={{
                    width: '100%',
                    borderRadius: 1,
                    maxHeight: 400,
                    objectFit: 'contain'
                  }}
                />
              )}
            </Grid>
            <Grid item xs={12}>
              <Alert severity="info" sx={{ mt: 2 }}>
                Compare the person's appearance in both images. Verify that they appear to be the same person.
                If there is a significant mismatch, you should reject the identity verification.
              </Alert>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCompareImagesDialog(false)} variant="outlined">
            Close
          </Button>
          <ButtonGroup variant="contained">
            <Button 
              color="primary" 
              onClick={() => {
                setCompareImagesDialog(false);
                handleVerifyIdentity();
              }}
            >
              Verify Identity
            </Button>
            <Button 
              color="error" 
              onClick={() => {
                setCompareImagesDialog(false);
                handleRejectIdentity();
              }}
            >
              Reject Identity
            </Button>
          </ButtonGroup>
        </DialogActions>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog
        open={openConfirmDialog}
        onClose={() => setOpenConfirmDialog(false)}
      >
        <DialogTitle>Confirmation</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {confirmAction === 'verify-identity' 
              ? `Are you sure you want to verify ${selectedCitizen?.full_name}'s identity? This confirms that you have reviewed their information and identity card, and everything is correct.`
              : confirmAction === 'reject-identity'
                ? `Are you sure you want to REJECT ${selectedCitizen?.full_name}'s identity verification? This indicates that the person's photo doesn't match their identity card photo.`
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
            color={confirmAction === 'reject-identity' ? "error" : "primary"}
            variant="contained"
            disabled={verifyingIdentity || rejectingIdentity || verifyingVehicle}
          >
            {verifyingIdentity || rejectingIdentity || verifyingVehicle ? (
              <CircularProgress size={24} />
            ) : (
              confirmAction === 'reject-identity' ? "Confirm Rejection" : "Confirm Verification"
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