import { 
  Box,
  Typography,
  TextField,
  Button,
  Stack,
  Snackbar,
  Alert,
  CircularProgress,
  Paper,
  Fade,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar,
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
  Chip,
  Grid,
  useTheme
} from "@mui/material";
import { useEffect, useState } from "react";
import axios from "axios";
import config from "../../../config";
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DirectionsCarIcon from '@mui/icons-material/DirectionsCar';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

const API_BASE_URL = config.API_URL;

const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

const OCRLicenseForm = () => {
  const theme = useTheme();
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [snackbar, setSnackbar] = useState<{ msg: string; type: "success" | "error" | "warning" | "info" } | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [openImageDialog, setOpenImageDialog] = useState(false);

  const [owner, setOwner] = useState("");
  const [address, setAddress] = useState("");
  const [modelCode, setModelCode] = useState("");
  const [color, setColor] = useState("");
  const [plateNumber, setPlateNumber] = useState("");

  const [uploadedVehicles, setUploadedVehicles] = useState<any[]>([]);
  
  // Citizen verification states
  const [citizenData, setCitizenData] = useState<any>(null);
  const [fetchingIdentity, setFetchingIdentity] = useState(true);
  const [isVerified, setIsVerified] = useState(false);
  const [_registeredVehicles, setRegisteredVehicles] = useState<any[]>([]);

  useEffect(() => {
    const fetchCitizenData = async () => {
      try {
        setFetchingIdentity(true);
        const citizenId = localStorage.getItem("user_id");
        
        if (!citizenId) {
          setSnackbar({ msg: "User ID not found. Please log in again.", type: "error" });
          setFetchingIdentity(false);
          return;
        }
        
        // Lấy thông tin công dân
        const response = await axios.get(`${API_BASE_URL}citizens/information/${citizenId}/`);
        const citizenInfo = response.data.data || response.data;
        setCitizenData(citizenInfo);
        
        // Kiểm tra trạng thái xác thực
        if (citizenInfo.status === "Verified") {
          setIsVerified(true);
        } else {
          setIsVerified(false);
          setSnackbar({ 
            msg: "You have not been verified with your citizen ID, please come back later to register your vehicle documents", 
            type: "warning" 
          });
        }
        
        // Lấy thông tin xe đã đăng ký
        const vehiclesResponse = await axios.get(`${API_BASE_URL}citizens/get-applications/${citizenId}/`);
        if (vehiclesResponse.data?.applications) {
          setRegisteredVehicles(vehiclesResponse.data.applications);
          setUploadedVehicles(vehiclesResponse.data.applications);
        }
      } catch (error) {
        console.error("Error fetching citizen data:", error);
        setSnackbar({ 
          msg: "Citizen Information cannot be obtained. Please try again later.", 
          type: "error" 
        });
      } finally {
        setFetchingIdentity(false);
      }
    };
    
    fetchCitizenData();
  }, []);

  const handleExtract = async () => {
    if (!imageFile) {
      setSnackbar({ msg: "Please upload an Image.", type: "error" });
      return;
    }

    try {
      setLoading(true);
      const base64Image = await fileToBase64(imageFile);
      setImageBase64(base64Image);

      const res = await axios.post("https://huyhoanlee-ai-service.hf.space/extract-license-info", {
        image_base64: base64Image,
      });

      const { owner, address, model_code, color, license_plate } = res.data;

      // Tự động điền thông tin chủ xe từ CCCD nếu không nhận dạng được
      setOwner(owner || (citizenData ? citizenData.full_name : ""));
      setAddress(address || (citizenData ? citizenData.address : ""));
      setModelCode(model_code || "");
      setColor(color || "");
      setPlateNumber(license_plate || "");
      setShowConfirmation(true);

      setSnackbar({ msg: "The Information has been Extracted. Please Check and Edit if necessary.", type: "success" });
    } catch (err) {
      console.error("OCR error:", err);
      setSnackbar({ msg: "Extract Information failed. Please try again later.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmSubmit = () => {
    setOpenConfirmDialog(true);
  };

  const handleSave = async () => {
    if (!plateNumber || !imageBase64) {
      setSnackbar({ msg: "Please provide the License Plate and Upload a Photo.", type: "error" });
      return;
    }

    const citizenId = localStorage.getItem("user_id");

    if (!citizenId) {
      setSnackbar({ msg: "User ID not found. Please Log In again.", type: "error" });
      return;
    }

    try {
      setSaveLoading(true);
      const payload_check = {
        plate_number: plateNumber,
      };
      const checkResponse = await axios.patch(`${API_BASE_URL}citizens/check-car-parrot/`, payload_check);

      if (checkResponse.data?.is_owned) {
        setSnackbar({
          msg: "This License Plate has been Registered. If you are the owner or have any questions, please contact the Supervisor.",
          type: "error",
        });
        return;
      }

      const payload = {
        owner: owner,
        image: imageBase64,
        address: address,
        modelCode: modelCode,
        color: color,
        plate_number: plateNumber,
        citizen_id: Number(citizenId),
      };

      const response = await axios.post(`${API_BASE_URL}citizens/register-car-parrot/${citizenId}/`, payload);

      const getResponse = await axios.get(`${API_BASE_URL}citizens/get-applications/${citizenId}/`);
      const _applications = getResponse.data?.applications || [];
      const carParrotId = response.data?.id || null;

      setUploadedVehicles((prev) => [
        ...prev,
        {
          owner,
          address,
          modelCode,
          color,
          plateNumber,
          imageBase64,
          carParrotId,
          status: "Pending"
        },
      ]);

      setOwner("");
      setAddress("");
      setModelCode("");
      setColor("");
      setPlateNumber("");
      setImageFile(null);
      setPreview(null);
      setImageBase64(null);
      setShowConfirmation(false);
      setIsSubmitted(false);
      setOpenConfirmDialog(false);

      setSnackbar({ msg: "The Information has been Saved and Submitted for review.", type: "success" });
    } catch (err: any) {
      console.error("Save error:", err);
      let errorMsg = "An error has occurred. Please try again.";
      if (err.response?.data?.detail) errorMsg = err.response.data.detail;
      else if (err.message) errorMsg = err.message;
      setSnackbar({ msg: errorMsg, type: "error" });
    } finally {
      setSaveLoading(false);
    }
  };

  // Render verification status
  const renderVerificationStatus = () => {
    if (fetchingIdentity) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      );
    }
    
    return (
      <Fade in={!fetchingIdentity}>
        <Card sx={{ mb: 3, border: isVerified ? '1px solid #4caf50' : '1px solid #ff9800' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              {isVerified ? (
                <CheckCircleIcon color="success" sx={{ mr: 1, fontSize: 28 }} />
              ) : (
                <WarningAmberIcon color="warning" sx={{ mr: 1, fontSize: 28 }} />
              )}
              <Typography variant="h6">
                {isVerified ? 'Verified Citizen Identify' : 'Citizen Identify has not been verified'}
              </Typography>
            </Box>
            
            {!isVerified && (
              <Alert severity="warning" icon={<ErrorOutlineIcon />} sx={{ mb: 2 }}>
                You have not been verified with your Citizen Identify, please come back later to register your vehicle applications!
              </Alert>
            )}

            <Stepper activeStep={isVerified ? 1 : 0} alternativeLabel>
              <Step>
                <StepLabel StepIconComponent={() => <VerifiedUserIcon color={isVerified ? "success" : "disabled"} />}>
                  Verify Citizen Identity
                </StepLabel>
              </Step>
              <Step>
                <StepLabel StepIconComponent={() => <DirectionsCarIcon color={isVerified ? "primary" : "disabled"} />}>
                  Vehicle Registration
                </StepLabel>
              </Step>
            </Stepper>
            
            {citizenData && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2">
                  <strong>Full name:</strong> {citizenData.full_name}
                </Typography>
                <Typography variant="body2">
                  <strong>Citizen Identify:</strong> {citizenData.citizen_identity_id}
                </Typography>
                <Typography variant="body2">
                  <strong>Date of Birth:</strong> {new Date(citizenData.dob).toLocaleDateString('vi-VN')}
                </Typography>
                <Typography variant="body2">
                  <strong>Status:</strong> {citizenData.status === "Verified" ? "Verified" : "Verified Pending"}
                </Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      </Fade>
    );
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1000, mx: "auto" }}>
      <Typography variant="h4" 
          component="h1" 
          gutterBottom
          sx={{ 
            fontWeight: 'bold',
            color: theme.palette.primary.main,
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}
        >
        Registration of Vehicle Applications
      </Typography>

      {renderVerificationStatus()}

      <Fade in={!fetchingIdentity && isVerified}>
        <Box>
          <Paper sx={{ p: 3 }}>
            <Typography variant="body1" mb={1}>
              Upload a Vehicle Registration Image
            </Typography>
            {!isSubmitted && (
              <input
                type="file"
                accept="image/*"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setImageFile(file);
                    setPreview(URL.createObjectURL(file));
                    setShowConfirmation(false);
                  }
                }}
              />
            )}

            {preview && (
              <Box mt={2}>
                <Avatar
                  src={preview}
                  variant="rounded"
                  sx={{ width: 160, height: 100, cursor: "pointer" }}
                  onClick={() => setOpenImageDialog(true)}
                />
              </Box>
            )}

            {!isSubmitted && (
              <Box mt={3}>
                <Button
                  variant="contained"
                  onClick={handleExtract}
                  disabled={loading}
                  fullWidth
                  startIcon={loading && <CircularProgress size={20} />}
                  sx={{ py: 1.5 }}
                >
                  {loading ? "Extracting..." : "Extract Information"}
                </Button>
              </Box>
            )}

            {showConfirmation && (
              <Box mt={4}>
                <Typography variant="h6" fontWeight={600} mb={2}>
                  {isSubmitted ? "Submitted Information" : "Extract Information"}
                </Typography>

                <Stack spacing={2} sx={{ opacity: isSubmitted ? 0.6 : 1 }}>
                  {[
                    { label: "Owner's Full Name:", value: owner, setter: setOwner },
                    { label: "Address:", value: address, setter: setAddress },
                    { label: "Model Code:", value: modelCode, setter: setModelCode },
                    { label: "Color:", value: color, setter: setColor },
                    { label: "Plate Number:", value: plateNumber, setter: setPlateNumber },
                  ].map(({ label, value, setter }) => (
                    <TextField
                      key={label}
                      label={label}
                      fullWidth
                      value={value}
                      onChange={(e) => setter(e.target.value)}
                      disabled={isSubmitted}
                    />
                  ))}
                </Stack>

                {!isSubmitted && (
                  <Button
                    variant="contained"
                    onClick={handleConfirmSubmit}
                    disabled={saveLoading || !plateNumber}
                    fullWidth
                    sx={{ mt: 3, py: 1.5 }}
                    startIcon={saveLoading && <CircularProgress size={20} />}
                  >
                    {saveLoading ? "Sending..." : "Confirm and Submit"}
                  </Button>
                )}
              </Box>
            )}
          </Paper>

          {isSubmitted && (
            <Button
              variant="contained"
              onClick={() => {
                setIsSubmitted(false);
                setShowConfirmation(false);
                setImageFile(null);
                setPreview(null);
                setImageBase64(null);
                setOwner("");
                setAddress("");
                setModelCode("");
                setColor("");
                setPlateNumber("");
              }}
              fullWidth
              sx={{ mt: 2, py: 1.5 }}
            >
              Upload Another Registration
            </Button>
          )}

          {uploadedVehicles.length > 0 && (
            <Box sx={{ mt: 4 }}>
              <Typography variant="h6" fontWeight={600} mb={2}>
                Registered Vehicles
              </Typography>
              
              {uploadedVehicles.map((v, idx) => {
                const isVerifiedVehicle = v.status === "Verified";
                
                return (
                  <Paper 
                    key={idx} 
                    sx={{ 
                      p: 3, 
                      mt: 2, 
                      border: isVerifiedVehicle ? '1px solid #4caf50' : '1px solid #ff9800',
                      position: 'relative'
                    }}
                    elevation={3}
                  >
                    <Box sx={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      mb: 1,
                      flexWrap: 'wrap'
                    }}>
                      <Typography variant="subtitle1" fontWeight={600}>
                        {v.plateNumber || v.plate_number}
                      </Typography>
                      <Box>
                        <Chip 
                          icon={isVerifiedVehicle ? <CheckCircleIcon /> : <ErrorOutlineIcon />}
                          label={isVerifiedVehicle ? "Verified" : "Processing"} 
                          color={isVerifiedVehicle ? "success" : "warning"}
                          size="small"
                          sx={{ mr: 1 }}
                        />
                      </Box>
                    </Box>
                    
                    <Grid container spacing={2} sx={{ mt: 1 }}>
                      <Grid item xs={12} sm={6}>
                        <Typography>
                          <strong>Owner's Full Name:</strong> {v.owner}
                        </Typography>
                        <Typography>
                          <strong>Address:</strong> {v.address}
                        </Typography>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Typography>
                          <strong>Model Code:</strong> {v.modelCode || v.model_code}
                        </Typography>
                        <Typography>
                          <strong>Color:</strong> {v.color}
                        </Typography>
                      </Grid>
                    </Grid>
                    
                    <Box mt={2}>
                      <Avatar
                        src={v.imageBase64 || v.image}
                        variant="rounded"
                        sx={{ width: 160, height: 100, cursor: "pointer" }}
                        onClick={() => {
                          setPreview(v.imageBase64 || v.image);
                          setOpenImageDialog(true);
                        }}
                      />
                    </Box>
                    
                    {isVerifiedVehicle && (
                      <Box sx={{ 
                        position: 'absolute', 
                        top: 16, 
                        right: 16,
                        transform: 'rotate(15deg)'
                      }}>
                        <img 
                          src="data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQiIGhlaWdodD0iNjQiIHZpZXdCb3g9IjAgMCA2NCA2NCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNNTAuOTggMTIuOThjLTcuMi03LjItMTguOS03LjItMjYuMSAwTDEwLjk4IDI2Ljg4Yy03LjIgNy4yLTcuMiAxOC45IDAgMjYuMSA3LjEgNy4xIDE4LjYgNy4yIDI1LjggLjNsMTQuMS0xNC4xIDE0LTEgMC0xNC0xNC0xNC4yem0tMi44IDIzLjJsLTExIDExYy0zIDMtNy45IDMtMTAuOSAwLTMtMy0zLTcuOSAwLTEwLjlsMTEtMTFjMy0zIDcuOS0zIDEwLjkgMCAzIDMgMyA3LjkgMCAxMC45eiIgZmlsbD0iIzRjYWY1MCIgZmlsbC1vcGFjaXR5PSIwLjUiLz48L3N2Zz4=" 
                          alt="Verified" 
                          width="48" 
                          height="48"
                        />
                      </Box>
                    )}
                  </Paper>
                );
              })}
            </Box>
          )}
        </Box>
      </Fade>

      <Snackbar
        open={!!snackbar}
        autoHideDuration={6000}
        onClose={() => setSnackbar(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert severity={snackbar?.type || "success"} variant="filled" onClose={() => setSnackbar(null)}>
          {snackbar?.msg}
        </Alert>
      </Snackbar>

      <Dialog open={openConfirmDialog} onClose={() => setOpenConfirmDialog(false)}>
        <DialogTitle>Xác nhận thông tin</DialogTitle>
        <DialogContent>
          <Typography>Please check the Information below. You're sure the Information is CORRECT?</Typography>
          <Box mt={2}>
            <Typography>
              <strong>Owner Full Name:</strong> {owner}
            </Typography>
            <Typography>
              <strong>Address:</strong> {address}
            </Typography>
            <Typography>
              <strong>Model Code:</strong> {modelCode}
            </Typography>
            <Typography>
              <strong>Color:</strong> {color}
            </Typography>
            <Typography>
              <strong>Plate Number:</strong> {plateNumber}
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenConfirmDialog(false)} color="secondary">
            Cancel
          </Button>
          <Button onClick={handleSave} color="primary" disabled={saveLoading}>
            {saveLoading ? <CircularProgress size={20} /> : "Confirm"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openImageDialog} onClose={() => setOpenImageDialog(false)} maxWidth="md">
        <DialogTitle>Image View</DialogTitle>
        <DialogContent>
          <img
            src={preview || (uploadedVehicles[0] && (uploadedVehicles[0].imageBase64 || uploadedVehicles[0].image))}
            alt="Review"
            style={{ maxWidth: "100%", maxHeight: "70vh", objectFit: "contain" }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenImageDialog(false)} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default OCRLicenseForm;