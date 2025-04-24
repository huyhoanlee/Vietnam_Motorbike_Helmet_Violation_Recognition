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

      setSnackbar({ msg: "Information extracted successfully.", type: "success" });
    } catch (err) {
      console.error("OCR error:", err);
      setSnackbar({ msg: "Failed to extract information. Please try again later.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!plateNumber || !imageBase64) {
      setSnackbar({ msg: "Please provide a license plate number and upload an image.", type: "error" });
      return;
    }

    const carParrotId = localStorage.getItem("car_parrot_id") || "1";
    const citizenId = localStorage.getItem("user_id");

    if (!citizenId) {
      setSnackbar({ msg: "User ID not found. Please log in again.", type: "error" });
      return;
    }

    try {
      setSaveLoading(true);
      const payload = {
        owner,
        image: imageBase64,
        address,
        modelCode,
        color,
        plate_number: plateNumber,
        status: "Verified",
        citizen_id: Number(citizenId),
      };

      await axios.patch(`${API_BASE_URL}car_parrots/update/${carParrotId}/`, payload);

      const getResponse = await axios.get(`${API_BASE_URL}citizens/get-applications/${citizenId}/`);

      const applications = getResponse.data?.applications || [];
      const matchedApplication = applications.find((app: any) => `${app.car_parrot_id}` === `${carParrotId}`);

      if (!matchedApplication) {
        throw new Error("Submitted data not found in system.");
      }

      const userData = {
        owner,
        address,
        modelCode,
        color,
        plate_number: matchedApplication.plate_number,
      };

      localStorage.setItem("citizen_data", JSON.stringify(userData));

      setOwner(userData.owner);
      setAddress(userData.address);
      setModelCode(userData.modelCode);
      setColor(userData.color);
      setPlateNumber(userData.plate_number);

      setIsSubmitted(true);
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
        {isSubmitted
          ? "Your registration information has been submitted and locked for review."
          : "Upload your vehicle registration image to extract and submit details."}
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
              <TextField label="Owner Name" fullWidth value={owner} disabled />
              <TextField label="Address" fullWidth value={address} disabled />
              <TextField label="Model Code" fullWidth value={modelCode} disabled />
              <TextField label="Color" fullWidth value={color} disabled />
              <TextField label="License Plate" fullWidth value={plateNumber} disabled />
            </Stack>

            {!isSubmitted && (
              <Button
                variant="contained"
                color="success"
                onClick={handleSave}
                disabled={saveLoading || !plateNumber}
                sx={{ mt: 3, py: 1.5, fontWeight: 600 }}
              >
                {saveLoading ? <CircularProgress size={24} color="inherit" /> : "Save Information"}
              </Button>
            )}
          </>
        )}
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
