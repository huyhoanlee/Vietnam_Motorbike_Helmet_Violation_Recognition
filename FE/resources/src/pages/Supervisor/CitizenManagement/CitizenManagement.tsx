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
  ButtonGroup,
  Tabs,
  Tab,
  Badge as MuiBadge,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from "@mui/material";
import {
  Visibility,
  CheckCircle,
  DirectionsCar,
  Badge,
  ErrorOutline,
  CheckCircleOutline,
  CancelOutlined,
  Compare,
  ExpandMore,
  CarRental
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

// Interface for Vehicle/Car Parrot item
interface CarParrot {
  id: number;
  citizen_id: number;
  plate_number: string;
  image: string;
  status: string;
  owner: string;
  address: string;
  color: string;
  modelCode: string;
}

// Interface for Citizen
interface Citizen {
  id: number;
  citizen_id?: string;
  citizen_identity_id: string;
  full_name: string;
  phone_number: string;
  email: string;
  status: string;
  address: string;
  dob: string;
  gender: string;
  nationality: string;
  place_of_birth: string;
  place_of_issue: string;
  issue_date: string;
  identity_card: string | null;
  person_image: string | null;
  card_parrots?: CarParrot[];
}

const CitizenManagement: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [citizens, setCitizens] = useState<Citizen[]>([]);
  const [selectedCitizen, setSelectedCitizen] = useState<Citizen | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  const [verifyingIdentity, setVerifyingIdentity] = useState(false);
  const [rejectingIdentity, setRejectingIdentity] = useState(false);
  const [verifyingVehicle, setVerifyingVehicle] = useState(false);
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    type: 'verify-identity' | 'reject-identity' | 'verify-vehicle' | null;
    carParrotId?: number;
  }>({ type: null });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [compareImagesDialog, setCompareImagesDialog] = useState(false);
  const [selectedTabIndex, setSelectedTabIndex] = useState(0);
  const [selectedVehicleIndex, setSelectedVehicleIndex] = useState(0);

  useEffect(() => {
    fetchCitizens();
  }, []);

  const fetchCitizens = async () => {
    setLoading(true);
    try {
      // Fetch ALL citizens
      const citizensResponse = await axiosInstance.get(`${API_BASE_URL}citizens/get-all/`);
      let citizensData = citizensResponse.data || [];
      
      // Fetch car parrots data separately
      const carParrotsResponse = await axiosInstance.get(`${API_BASE_URL}car_parrots/get-all/`);
      const carParrotsData = carParrotsResponse.data || [];
      
      // Merge data to ensure we have complete citizen information
      const mergedData = citizensData.map((citizen: any) => {
        // Find matching citizen in car parrots data
        const matchingCarParrot = carParrotsData.find((cp: any) => 
          cp.citizen_id?.toString() === citizen.id?.toString() || 
          cp.citizen_identity_id === citizen.citizen_identity_id
        );
        
        // Include all car parrots for this citizen
        const cardParrots = matchingCarParrot?.card_parrots || [];
        
        return {
          ...citizen,
          card_parrots: cardParrots
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

  const handleViewDetails = (citizen: Citizen) => {
    setSelectedCitizen(citizen);
    setSelectedTabIndex(0);
    setSelectedVehicleIndex(0);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setSelectedCitizen(null);
    setOpenDialog(false);
  };

  const handleVerifyIdentity = () => {
    setConfirmAction({ type: 'verify-identity' });
    setOpenConfirmDialog(true);
  };

  const handleRejectIdentity = () => {
    setConfirmAction({ type: 'reject-identity' });
    setOpenConfirmDialog(true);
  };

  const handleVerifyVehicle = (carParrotId: number) => {
    setConfirmAction({ type: 'verify-vehicle', carParrotId });
    setOpenConfirmDialog(true);
  };

  const handleConfirmVerification = async () => {
    if (!selectedCitizen) return;
    
    try {
      if (confirmAction.type === 'verify-identity') {
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
      else if (confirmAction.type === 'reject-identity') {
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
      else if (confirmAction.type === 'verify-vehicle' && confirmAction.carParrotId) {
        setVerifyingVehicle(true);
        const carParrotId = confirmAction.carParrotId;
        await axiosInstance.put(`${API_BASE_URL}car_parrots/verified/${carParrotId}/`);
        
        // Update local state - update the specific car parrot
        if (selectedCitizen.card_parrots) {
          const updatedCardParrots = selectedCitizen.card_parrots.map(cp => 
            cp.id === carParrotId 
              ? { ...cp, status: "Verified" } 
              : cp
          );
          
          setCitizens(prevCitizens => 
            prevCitizens.map(citizen => 
              citizen.id === selectedCitizen.id 
                ? { ...citizen, card_parrots: updatedCardParrots } 
                : citizen
            )
          );
          
          setSelectedCitizen({
            ...selectedCitizen, 
            card_parrots: updatedCardParrots
          });
        }
        
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
      setConfirmAction({ type: null });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleCompareImages = () => {
    setCompareImagesDialog(true);
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setSelectedTabIndex(newValue);
  };

  // Count of vehicles that need verification
  const getPendingVehiclesCount = (citizen: Citizen): number => {
    if (!citizen.card_parrots) return 0;
    return citizen.card_parrots.filter(vehicle => vehicle.status === "Submitted").length;
  };

  // Get vehicle verification status
  const getVehicleVerificationStatus = (citizen: Citizen): React.ReactNode => {
    if (!citizen.card_parrots || citizen.card_parrots.length === 0) {
      return <Chip label="No Vehicles" color="default" size={isMobile ? "small" : "medium"} />;
    }
    
    const verifiedCount = citizen.card_parrots.filter(v => v.status === "Verified").length;
    const submittedCount = citizen.card_parrots.filter(v => v.status === "Submitted").length;
    
    if (verifiedCount === citizen.card_parrots.length) {
      return <Chip label="All Verified" color="success" size={isMobile ? "small" : "medium"} />;
    } else if (submittedCount > 0) {
      return (
        <Tooltip title={`${submittedCount} vehicle(s) pending verification`}>
          <Chip 
            label={`${verifiedCount}/${citizen.card_parrots.length} Verified`} 
            color="warning" 
            size={isMobile ? "small" : "medium"} 
          />
        </Tooltip>
      );
    } else {
      return (
        <Chip 
          label={`${verifiedCount}/${citizen.card_parrots.length} Verified`} 
          color="info" 
          size={isMobile ? "small" : "medium"} 
        />
      );
    }
  };

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
                  {["ID", "Citizen Identity ID", "Full Name", "Phone Number", "Email", "Identity Status", "Vehicle Status", "Actions"].map((header) => (
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
                          label={statusColors[citizen.status]?.label || "Unknown"}
                          color={statusColors[citizen.status]?.color || "default"}
                          size={isMobile ? "small" : "medium"}
                          sx={{ fontWeight: 'medium' }}
                        />
                      </TableCell>
                      <TableCell>
                        {getVehicleVerificationStatus(citizen)}
                      </TableCell>
                      <TableCell>
                        <Tooltip title="View Details">
                          <IconButton 
                            color="primary"
                            onClick={() => handleViewDetails(citizen)}
                            size={isMobile ? "small" : "medium"}
                          >
                            <MuiBadge 
                              badgeContent={getPendingVehiclesCount(citizen)} 
                              color="warning"
                              invisible={getPendingVehiclesCount(citizen) === 0}
                            >
                              <Visibility />
                            </MuiBadge>
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
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
                label={statusColors[selectedCitizen.status]?.label || "Unknown"}
                color={statusColors[selectedCitizen.status]?.color || "default"}
                size="small"
                sx={{ fontWeight: 'medium' }}
              />
            </DialogTitle>
            <DialogContent dividers sx={{ p: { xs: 2, md: 3 } }}>
              <Tabs 
                value={selectedTabIndex} 
                onChange={handleTabChange}
                variant="scrollable"
                scrollButtons="auto"
                sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}
              >
                <Tab 
                  icon={<Badge />} 
                  iconPosition="start" 
                  label="Personal Information" 
                />
                <Tab 
                  icon={<DirectionsCar />} 
                  iconPosition="start" 
                  label={
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      Vehicle Information
                      {selectedCitizen.card_parrots && selectedCitizen.card_parrots.length > 0 && (
                        <MuiBadge 
                          badgeContent={selectedCitizen.card_parrots.length} 
                          color="primary"
                          sx={{ ml: 1 }}
                        />
                      )}
                    </Box>
                  } 
                />
              </Tabs>

              {/* Personal Information Tab */}
              {selectedTabIndex === 0 && (
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
                              <strong>Identity Verification:</strong> {selectedCitizen.status}
                            </Typography>
                          </Grid>
                          <Grid item xs={12} sm={6}>
                            <Typography variant="body1">
                              <strong>Registered Vehicles:</strong> {selectedCitizen.card_parrots?.length || 0}
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

                  {/* Vehicle Registration Summary */}
                  <Grid item xs={12} md={6}>
                    <Card elevation={3} sx={{ height: '100%', borderRadius: 2 }}>
                      <CardContent>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <DirectionsCar sx={{ mr: 1 }} />
                            <Typography variant="h6" fontWeight="bold">
                              Vehicle Registration Summary
                            </Typography>
                          </Box>
                          {selectedCitizen.card_parrots && selectedCitizen.card_parrots.length > 0 && (
                            <Chip 
                              label={`${selectedCitizen.card_parrots.length} vehicles`} 
                              color="primary" 
                              size="small" 
                            />
                          )}
                        </Box>
                        <Divider sx={{ mb: 2 }} />
                        
                        {selectedCitizen.card_parrots && selectedCitizen.card_parrots.length > 0 ? (
                          <>
                            <Typography variant="body1" gutterBottom>
                              <strong>Total Vehicles:</strong> {selectedCitizen.card_parrots.length}
                            </Typography>
                            <Typography variant="body1" gutterBottom>
                              <strong>Verified Vehicles:</strong> {selectedCitizen.card_parrots.filter(v => v.status === "Verified").length}
                            </Typography>
                            <Typography variant="body1" gutterBottom>
                              <strong>Pending Verification:</strong> {selectedCitizen.card_parrots.filter(v => v.status === "Submitted").length}
                            </Typography>
                            
                            <Divider sx={{ my: 2 }} />
                            
                            <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                              Vehicle List:
                            </Typography>
                            <Box sx={{ maxHeight: 200, overflowY: 'auto', pr: 1 }}>
                              {selectedCitizen.card_parrots.map((vehicle, _index) => (
                                <Box 
                                  key={vehicle.id} 
                                  sx={{ 
                                    display: 'flex', 
                                    justifyContent: 'space-between', 
                                    alignItems: 'center',
                                    mb: 1,
                                    p: 1,
                                    borderRadius: 1,
                                    bgcolor: 'background.paper',
                                    boxShadow: 1
                                  }}
                                >
                                  <Box>
                                    <Typography variant="body2" fontWeight="bold">
                                      {vehicle.plate_number} - {vehicle.modelCode}
                                    </Typography>
                                    <Typography variant="caption" color="textSecondary">
                                      Owner: {vehicle.owner}
                                    </Typography>
                                  </Box>
                                  <Chip 
                                    label={vehicle.status} 
                                    color={statusColors[vehicle.status]?.color || "default"}
                                    size="small"
                                  />
                                </Box>
                              ))}
                            </Box>
                            
                            <Button
                              variant="outlined"
                              color="primary"
                              startIcon={<DirectionsCar />}
                              onClick={() => setSelectedTabIndex(1)}
                              sx={{ mt: 2, width: '100%' }}
                            >
                              View Vehicle Details
                            </Button>
                          </>
                        ) : (
                          <Alert severity="info">
                            No vehicle registrations available for this citizen.
                          </Alert>
                        )}
                        
                        {selectedCitizen.status !== "Verified" && (
                          <Alert severity="warning" sx={{ mt: 2 }}>
                            Citizen's identity must be verified before validating vehicle registrations.
                          </Alert>
                        )}
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              )}

              {/* Vehicle Information Tab */}
              {selectedTabIndex === 1 && (
                <Box>
                  {selectedCitizen.card_parrots && selectedCitizen.card_parrots.length > 0 ? (
                    selectedCitizen.card_parrots.map((vehicle, index) => (
                      <Accordion 
                        key={vehicle.id} 
                        expanded={selectedVehicleIndex === index}
                        onChange={() => setSelectedVehicleIndex(index)}
                        sx={{ mb: 2, boxShadow: 2, borderRadius: 1 }}
                      >
                      <AccordionSummary
                          expandIcon={<ExpandMore />}
                          sx={{ 
                            bgcolor: vehicle.status === "Verified" ? 'success.light' : 
                                    vehicle.status === "Rejected" ? 'error.light' : 'warning.light',
                            borderRadius: '4px 4px 0 0'
                          }}
                        >
                          <Box sx={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                              <CarRental sx={{ mr: 1 }} />
                              <Typography fontWeight="bold">
                                {vehicle.plate_number} - {vehicle.modelCode} ({vehicle.color})
                              </Typography>
                            </Box>
                            <Chip 
                              label={vehicle.status} 
                              color={statusColors[vehicle.status]?.color || "default"}
                              size="small"
                              sx={{ ml: 2 }}
                            />
                          </Box>
                        </AccordionSummary>
                        <AccordionDetails sx={{ p: 3 }}>
                          <Grid container spacing={3}>
                            {/* Vehicle Details */}
                            <Grid item xs={12} md={6}>
                              <Box>
                                <Typography variant="h6" fontWeight="bold" color="primary" gutterBottom>
                                  Vehicle Information
                                </Typography>
                                <Box sx={{ 
                                  bgcolor: 'background.paper', 
                                  p: 2, 
                                  borderRadius: 1, 
                                  boxShadow: 1,
                                  mb: 2
                                }}>
                                  <Typography variant="body1" gutterBottom>
                                    <strong>Plate Number:</strong> {vehicle.plate_number}
                                  </Typography>
                                  <Typography variant="body1" gutterBottom>
                                    <strong>Model:</strong> {vehicle.modelCode}
                                  </Typography>
                                  <Typography variant="body1" gutterBottom>
                                    <strong>Owner:</strong> {vehicle.owner}
                                  </Typography>
                                  <Typography variant="body1" gutterBottom>
                                    <strong>Color:</strong> {vehicle.color}
                                  </Typography>
                                  <Typography variant="body1" gutterBottom>
                                    <strong>Address:</strong> {vehicle.address}
                                  </Typography>
                                  <Typography variant="body1" gutterBottom>
                                    <strong>Status:</strong> {vehicle.status}
                                  </Typography>
                                </Box>
                              </Box>
                              
                              {/* Verification Actions */}
                              {selectedCitizen.status === "Verified" && vehicle.status === "Submitted" && (
                                <Button
                                  variant="contained"
                                  color="primary"
                                  startIcon={<CheckCircleOutline />}
                                  onClick={() => handleVerifyVehicle(vehicle.id)}
                                  disabled={verifyingVehicle}
                                  fullWidth
                                  sx={{ mt: 2 }}
                                >
                                  {verifyingVehicle && confirmAction.carParrotId === vehicle.id ? 
                                    <CircularProgress size={24} color="inherit" /> : 
                                    "Verify Vehicle Registration"
                                  }
                                </Button>
                              )}
                              
                              {selectedCitizen.status !== "Verified" && vehicle.status === "Submitted" && (
                                <Alert severity="warning" sx={{ mt: 2 }}>
                                  Citizen's identity must be verified before validating vehicle registrations.
                                </Alert>
                              )}
                            </Grid>
                            
                            {/* Vehicle Registration Image */}
                            <Grid item xs={12} md={6}>
                              <Box>
                                <Typography variant="h6" fontWeight="bold" color="primary" gutterBottom>
                                  Vehicle Registration Document
                                </Typography>
                                
                                {vehicle.image ? (
                                  <Box 
                                    sx={{ 
                                      position: 'relative',
                                      '&:hover .zoom-overlay': {
                                        opacity: 1
                                      }
                                    }}
                                  >
                                    <CardMedia
                                      component="img"
                                      image={formatImageSrc(vehicle.image)}
                                      alt="Vehicle Registration"
                                      sx={{
                                        width: '100%',
                                        borderRadius: 1,
                                        boxShadow: 2,
                                        maxHeight: 350,
                                        objectFit: 'contain',
                                        bgcolor: 'grey.100',
                                        transition: 'transform 0.3s ease-in-out',
                                        '&:hover': { transform: 'scale(1.02)' }
                                      }}
                                    />
                                    <Box 
                                      className="zoom-overlay"
                                      sx={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        right: 0,
                                        bottom: 0,
                                        display: 'flex',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        backgroundColor: 'rgba(0,0,0,0.3)',
                                        opacity: 0,
                                        transition: 'opacity 0.3s ease',
                                        borderRadius: 1,
                                      }}
                                    >
                                      <Tooltip title="Click to enlarge">
                                        <IconButton 
                                          color="primary" 
                                          sx={{ bgcolor: 'white', '&:hover': { bgcolor: 'white' } }}
                                          onClick={() => {
                                            // Open image in new tab for larger view
                                            const imageWindow = window.open('');
                                            if (imageWindow) {
                                              imageWindow.document.write(`
                                                <html>
                                                  <head>
                                                    <title>Vehicle Registration - ${vehicle.plate_number}</title>
                                                    <style>
                                                      body { margin: 0; display: flex; justify-content: center; align-items: center; background-color: #000; height: 100vh; }
                                                      img { max-width: 100%; max-height: 100vh; object-fit: contain; }
                                                    </style>
                                                  </head>
                                                  <body>
                                                    <img src="${formatImageSrc(vehicle.image)}" alt="Vehicle Registration" />
                                                  </body>
                                                </html>
                                              `);
                                            }
                                          }}
                                        >
                                          <Visibility />
                                        </IconButton>
                                      </Tooltip>
                                    </Box>
                                  </Box>
                                ) : (
                                  <Alert severity="info" sx={{ height: '100%' }}>
                                    No vehicle registration image available
                                  </Alert>
                                )}
                                
                                {vehicle.status === "Verified" && (
                                  <Alert severity="success" sx={{ mt: 2 }}>
                                    This vehicle registration has been verified.
                                  </Alert>
                                )}
                              </Box>
                            </Grid>
                          </Grid>
                        </AccordionDetails>
                      </Accordion>
                    ))
                  ) : (
                    <Alert severity="info">
                      This citizen has no registered vehicles.
                    </Alert>
                  )}
                </Box>
              )}
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2, bgcolor: 'background.paper' }}>
              <Button onClick={handleCloseDialog} variant="outlined" color="primary">
                Close
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Compare Images Dialog */}
      <Dialog
        open={compareImagesDialog}
        onClose={() => setCompareImagesDialog(false)}
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
            <DialogTitle sx={{ bgcolor: theme.palette.primary.main, color: 'white' }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Compare sx={{ mr: 1 }} />
                <Typography variant="h6" fontWeight="bold">
                  Image Comparison for Verification
                </Typography>
              </Box>
            </DialogTitle>
            <DialogContent dividers>
              <Typography variant="body1" paragraph>
                Compare the identity card photo with the personal photo to verify the citizen's identity.
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Card elevation={3}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Identity Card
                      </Typography>
                      {selectedCitizen.identity_card ? (
                        <CardMedia
                          component="img"
                          image={formatImageSrc(selectedCitizen.identity_card)}
                          alt="Identity Card"
                          sx={{
                            width: '100%',
                            maxHeight: 400,
                            objectFit: 'contain',
                            borderRadius: 1
                          }}
                        />
                      ) : (
                        <Alert severity="warning">Identity card image not available</Alert>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Card elevation={3}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>
                        Personal Photo
                      </Typography>
                      {selectedCitizen.person_image ? (
                        <CardMedia
                          component="img"
                          image={formatImageSrc(selectedCitizen.person_image)}
                          alt="Personal Photo"
                          sx={{
                            width: '100%',
                            maxHeight: 400,
                            objectFit: 'contain',
                            borderRadius: 1
                          }}
                        />
                      ) : (
                        <Alert severity="warning">Personal photo not available</Alert>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
              
              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
                <ButtonGroup variant="contained">
                  <Button 
                    startIcon={<CheckCircleOutline />}
                    color="primary"
                    onClick={handleVerifyIdentity}
                    disabled={verifyingIdentity || rejectingIdentity}
                  >
                    {verifyingIdentity ? <CircularProgress size={24} /> : "Verify Identity"}
                  </Button>
                  <Button 
                    startIcon={<CancelOutlined />}
                    color="error"
                    onClick={handleRejectIdentity}
                    disabled={verifyingIdentity || rejectingIdentity}
                  >
                    {rejectingIdentity ? <CircularProgress size={24} /> : "Reject Identity"}
                  </Button>
                </ButtonGroup>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setCompareImagesDialog(false)}>
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
        PaperProps={{
          sx: {
            borderRadius: 2
          }
        }}
      >
        <DialogTitle sx={{ fontWeight: 'bold' }}>
          {confirmAction.type === 'verify-identity' && "Verify Citizen Identity"}
          {confirmAction.type === 'reject-identity' && "Reject Citizen Identity"}
          {confirmAction.type === 'verify-vehicle' && "Verify Vehicle Registration"}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            {confirmAction.type === 'verify-identity' && 
              "Are you sure you want to verify this citizen's identity? This action will mark their identity as verified in the system."
            }
            {confirmAction.type === 'reject-identity' && 
              "Are you sure you want to reject this citizen's identity? This action will mark their identity as rejected in the system."
            }
            {confirmAction.type === 'verify-vehicle' && 
              "Are you sure you want to verify this vehicle registration? This action will mark the vehicle as verified in the system."
            }
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button 
            onClick={() => setOpenConfirmDialog(false)} 
            color="inherit"
            variant="outlined"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleConfirmVerification} 
            color={confirmAction.type === 'reject-identity' ? "error" : "primary"}
            variant="contained"
            autoFocus
          >
            Confirm
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
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* Toast notifications */}
      <ToastContainer position="bottom-right" />
    </Box>
  );
};

export default CitizenManagement;