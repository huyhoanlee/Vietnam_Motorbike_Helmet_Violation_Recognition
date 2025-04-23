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
} from "@mui/material";
import { useState } from "react";
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

  // Form fields
  const [owner, setOwner] = useState("");
  const [address, setAddress] = useState("");
  const [modelCode, setModelCode] = useState("");
  const [color, setColor] = useState("");
  const [plateNumber, setPlateNumber] = useState("");

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

      const res = await axios.post("https://huyhoanlee-ocr-license.hf.space/extract-license-info", {
        image_base64: base64Image,
      });

      const { owner, address, model_code, color, license_plate } = res.data;

      setOwner(owner || "");
      setAddress(address || "");
      setModelCode(model_code || "");
      setColor(color || "");
      setPlateNumber(license_plate || "");
      setShowConfirmation(true);

      setSnackbar({ msg: "Information extracted successfully.", type: "success" });
    } catch (err) {
      console.error("OCR error:", err);
      setSnackbar({ msg: "Failed to extract information. Please try again.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault(); // Prevent form submission or page reload

    // Log localStorage state for debugging
    console.log("localStorage before save:", {
      user_id: localStorage.getItem("user_id"),
      is_citizen_authenticated: localStorage.getItem("is_citizen_authenticated"),
      user_role: localStorage.getItem("user_role"),
    });

    if (!plateNumber || !imageBase64) {
      setSnackbar({ msg: "Please provide a license plate number and upload an image.", type: "error" });
      return;
    }

    try {
      setSaveLoading(true);

      // Fetch car_parrot_id (placeholder; replace with actual logic)
      const carParrotId = localStorage.getItem("car_parrot_id") || "1"; // TODO: Fetch from API

      const payload = {
        owner,
        image: imageBase64,
        address,
        modelCode,
        color,
        plate_number: plateNumber,
        status: "Verified", // Use "verified" as per input format
      };

      // Update car parrot data
      const patchResponse = await axios.patch(`${API_BASE_URL}car_parrots/update/${carParrotId}/`, payload);
      console.log("PATCH response:", patchResponse.data);

      // Fetch updated citizen data if user_id exists
      const citizenId = localStorage.getItem("user_id");
      if (citizenId) {
        const getResponse = await axios.get(`${API_BASE_URL}car_parrots/get-all/`);
        const citizens = getResponse.data; // Adjust if response is nested (e.g., res.data.data)
        console.log("GET response:", citizens);

        const userData = citizens.find((citizen: any) => citizen.citizen_id === citizenId);

        if (userData) {
          localStorage.setItem("citizen_data", JSON.stringify(userData));
          setSnackbar({ msg: "Information saved successfully.", type: "success" });
        } else {
          setSnackbar({ msg: "Information saved, but no user data found.", type: "success" });
        }
      } else {
        setSnackbar({ msg: "Information saved successfully.", type: "success" });
      }

      // Verify localStorage after save
      console.log("localStorage after save:", {
        user_id: localStorage.getItem("user_id"),
        is_citizen_authenticated: localStorage.getItem("is_citizen_authenticated"),
        user_role: localStorage.getItem("user_role"),
        citizen_data: localStorage.getItem("citizen_data"),
      });
    } catch (err: any) {
      console.error("Save error:", err);
      let errorMsg = "Failed to save information. Please try again.";
      if (err.response?.data?.status) {
        errorMsg = `Invalid status: ${err.response.data.status.join(", ")}`;
      } else if (err.response?.data?.detail) {
        errorMsg = err.response.data.detail;
      } else if (err.response?.status === 400) {
        errorMsg = "Invalid data provided. Please check your inputs.";
      }
      setSnackbar({ msg: errorMsg, type: "error" });
    } finally {
      setSaveLoading(false);
    }
  };

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
        Upload your vehicle registration image to extract and submit details.
      </Typography>

      <Stack spacing={3}>
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
            style={{
              padding: "10px 0",
              border: "1px solid #ccc",
              borderRadius: "4px",
              width: "100%",
            }}
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

        {/* Extracted Information Form */}
        {showConfirmation && (
          <Typography variant="body1" color="primary.main" sx={{ mt: 2, fontStyle: "italic" }}>
            Please verify the extracted information and correct any missing or inaccurate details.
          </Typography>
        )}
        <Box mt={3}>
          <Typography variant="h6" fontWeight={600} mb={2}>
            Extracted Information
          </Typography>
          <Stack spacing={2}>
            <TextField
              label="Owner Name"
              fullWidth
              value={owner}
              onChange={(e) => setOwner(e.target.value)}
              variant="outlined"
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Address"
              fullWidth
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              variant="outlined"
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Model Code"
              fullWidth
              value={modelCode}
              onChange={(e) => setModelCode(e.target.value)}
              variant="outlined"
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="Color"
              fullWidth
              value={color}
              onChange={(e) => setColor(e.target.value)}
              variant="outlined"
              InputLabelProps={{ shrink: true }}
            />
            <TextField
              label="License Plate"
              fullWidth
              value={plateNumber}
              onChange={(e) => setPlateNumber(e.target.value)}
              variant="outlined"
              InputLabelProps={{ shrink: true }}
              required
            />
          </Stack>

          <Button
            variant="contained"
            color="success"
            onClick={handleSave}
            disabled={saveLoading || !plateNumber}
            sx={{ mt: 3, py: 1.5, fontWeight: 600 }}
            type="button" // Prevent form submission
          >
            {saveLoading ? <CircularProgress size={24} color="inherit" /> : "Save Information"}
          </Button>
        </Box>
      </Stack>

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
    </Box>
  );
};

export default OCRLicenseForm;