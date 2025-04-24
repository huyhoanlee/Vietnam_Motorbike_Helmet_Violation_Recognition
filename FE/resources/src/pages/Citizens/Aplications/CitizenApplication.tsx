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
  InputLabel,
  FormControl,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { useEffect, useState } from "react";
import axios from "axios";
import config from "../../../config";

const API_BASE_URL = config.API_URL;

const OCRLicenseForm = () => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [snackbar, setSnackbar] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false); 

  const [owner, setOwner] = useState("");
  const [address, setAddress] = useState("");
  const [modelCode, setModelCode] = useState("");
  const [color, setColor] = useState("");
  const [plateNumber, setPlateNumber] = useState("");

  const [uploadedVehicles, setUploadedVehicles] = useState<any[]>([]);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleExtract = async () => {
    if (!imageFile) {
      setSnackbar({ msg: "Please upload an image.", type: "error" });
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

      setOwner(owner || "");
      setAddress(address || "");
      setModelCode(model_code || "");
      setColor(color || "");
      setPlateNumber(license_plate || "");
      setShowConfirmation(true);
      
      setSnackbar({ msg: "Information extracted successfully. Please review and edit if needed.", type: "success" });
    } catch (err) {
      console.error("OCR error:", err);
      setSnackbar({ msg: "Failed to extract information. Please try again later.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmSubmit = () => {
    setOpenConfirmDialog(true); 
  };

  const handleSave = async () => {
    if (!plateNumber || !imageBase64) {
      setSnackbar({ msg: "Please provide a license plate number and upload an image.", type: "error" });
      return;
    }

    const citizenId = localStorage.getItem("user_id");

    if (!citizenId) {
      setSnackbar({ msg: "User ID not found. Please log in again.", type: "error" });
      return;
    }

    try {
      setSaveLoading(true);
      const payload_check = {
        plate_number: plateNumber
      };
      const checkResponse = await axios.patch(`${API_BASE_URL}citizens/check-car-parrot/`, payload_check);

      if (checkResponse.data?.is_owned) {
        setSnackbar({
          msg: "The license plate has been registered, if you are the owner or have any confusion please contact Supervisor.",
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
        status: "Verified", 
        citizen_id: Number(citizenId),
      };

      const response = await axios.post(`${API_BASE_URL}citizens/register-car-parrot/${citizenId}/`, payload);

      const getResponse = await axios.get(`${API_BASE_URL}citizens/get-applications/${citizenId}/`);
      const applications = getResponse.data?.applications || [];
      const carParrotId = response.data?.id || null;

      const userData = {
        owner,
        address,
        modelCode,
        color,
        plate_number: plateNumber
      };

      localStorage.setItem("citizen_data", JSON.stringify(userData));

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

      setSnackbar({ msg: "Information saved and locked for review.", type: "success" });
    } catch (err: any) {
      console.error("Save error:", err);
      let errorMsg = "An error occurred. Please try again.";
      if (err.response?.data?.detail) errorMsg = err.response.data.detail;
      else if (err.message) errorMsg = err.message;
      setSnackbar({ msg: errorMsg, type: "error" });
    } finally {
      setSaveLoading(false);
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem("citizen_data");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setOwner(parsed.owner || "");
        setAddress(parsed.address || "");
        setModelCode(parsed.modelCode || "");
        setColor(parsed.color || "");
        setPlateNumber(parsed.plate_number || "");
        setIsSubmitted(true);
        setShowConfirmation(true);
      } catch (e) {
        console.error("Parse saved data error", e);
      }
    }
  }, []);

  return (
    <Box
      sx={{
        p: { xs: 2, sm: 3, md: 4 },
        maxWidth: 800,
        mx: "auto",
        bgcolor: "background.paper",
        borderRadius: 2,
        boxShadow: 3,
      }}
    >
      <Typography variant="h5" fontWeight={700} gutterBottom color="primary.main">
        Vehicle Registration OCR & Submission
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Upload multiple vehicle registration images to extract and submit details.
      </Typography>

      <Stack spacing={3}>
        {!isSubmitted && (
          <>
            <FormControl>
              <InputLabel shrink sx={{ bgcolor: "background.paper", px: 1, ml: -1 }}>
                Upload Image
              </InputLabel>
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
                style={{ padding: "10px 0", border: "1px solid #ccc", borderRadius: "4px", width: "100%" }}
              />
            </FormControl>

            {preview && (
              <Paper elevation={3} sx={{ overflow: "hidden", borderRadius: 2, maxHeight: 250 }}>
                <img src={preview} alt="License Preview" style={{ width: "100%", objectFit: "contain" }} />
              </Paper>
            )}

            <Button
              variant="contained"
              color="primary"
              onClick={handleExtract}
              disabled={loading}
              sx={{ py: 1.5, fontWeight: 600 }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : "Extract Information"}
            </Button>
          </>
        )}

        {showConfirmation && (
          <>
            <Typography variant="h6" fontWeight={600}>
              {isSubmitted ? "Submitted Information" : "Extracted Information"}
            </Typography>

            <Stack spacing={2} sx={{ opacity: isSubmitted ? 0.8 : 1 }}>
              <TextField
                label="Owner Name"
                fullWidth
                value={owner}
                onChange={(e) => setOwner(e.target.value)}
                disabled={isSubmitted}
              />
              <TextField
                label="Address"
                fullWidth
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                disabled={isSubmitted}
              />
              <TextField
                label="Model Code"
                fullWidth
                value={modelCode}
                onChange={(e) => setModelCode(e.target.value)}
                disabled={isSubmitted}
              />
              <TextField
                label="Color"
                fullWidth
                value={color}
                onChange={(e) => setColor(e.target.value)}
                disabled={isSubmitted}
              />
              <TextField
                label="License Plate"
                fullWidth
                value={plateNumber}
                onChange={(e) => setPlateNumber(e.target.value)}
                disabled={isSubmitted}
              />
            </Stack>

            {!isSubmitted && (
              <Button
                variant="contained"
                color="success"
                onClick={handleConfirmSubmit}
                disabled={saveLoading || !plateNumber}
                sx={{ mt: 3, py: 1.5, fontWeight: 600 }}
              >
                {saveLoading ? <CircularProgress size={24} color="inherit" /> : "Confirm and Submit"}
              </Button>
            )}
          </>
        )}
      </Stack>

      {isSubmitted && (
        <Button
          variant="outlined"
          color="primary"
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
          sx={{ mt: 2 }}
        >
          Upload another registration
        </Button>
      )}

      {uploadedVehicles.length > 0 && (
        <Box sx={{ mt: 4 }}>
          <Typography variant="h6" fontWeight={600}>Uploaded Registrations</Typography>
          {uploadedVehicles.map((v, idx) => (
            <Paper key={idx} sx={{ p: 2, mt: 2 }}>
              <Typography>
                <strong>Plate:</strong> {v.plateNumber}
              </Typography>
              <Typography>
                <strong>Owner:</strong> {v.owner}
              </Typography>
              <Typography>
                <strong>Model:</strong> {v.modelCode}
              </Typography>
              <img
                src={v.imageBase64}
                alt={`vehicle-${idx}`}
                style={{ width: "100%", maxHeight: 200, objectFit: "contain", marginTop: 8 }}
              />
            </Paper>
          ))}
        </Box>
      )}

      <Snackbar
        open={!!snackbar}
        autoHideDuration={4000}
        onClose={() => setSnackbar(null)}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          severity={snackbar?.type || "success"}
          sx={{ width: "100%", maxWidth: 600 }}
          onClose={() => setSnackbar(null)}
        >
          {snackbar?.msg}
        </Alert>
      </Snackbar>

      <Dialog open={openConfirmDialog} onClose={() => setOpenConfirmDialog(false)}>
        <DialogTitle>Confirm Submission</DialogTitle>
        <DialogContent>
          <Typography>Please review the information below. Are you sure it is correct?</Typography>
          <Typography>
            <strong>Owner:</strong> {owner}
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
            <strong>License Plate:</strong> {plateNumber}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenConfirmDialog(false)} color="primary">
            Cancel
          </Button>
          <Button onClick={handleSave} color="success" disabled={saveLoading}>
            {saveLoading ? <CircularProgress size={24} color="inherit" /> : "Submit"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default OCRLicenseForm;