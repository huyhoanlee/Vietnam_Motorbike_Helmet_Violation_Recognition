import {
  Box,
  Typography,
  Grid,
  TextField,
  Button,
  MenuItem,
  Snackbar,
  Alert,
  Paper,
  Avatar,
  RadioGroup,
  FormControlLabel,
  Radio,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { useState, useEffect } from "react";
import axios from "axios";
import config from "../../../config";
import EmailUpdateSection from "./EmailUpdateSection"; // Thêm lại import

const API_BASE_URL = config.API_URL;

const fileToBase64 = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });

const CitizenInfoForm = () => {
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    dob: "",
    birthPlace: "",
    gender: "",
    address: "",
    citizen_identity_id: "",
    issueDate: "",
    issuePlace: "",
    nationality: "Vietnam",
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [snackbar, setSnackbar] = useState({ msg: "", type: "success" as "success" | "error" });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"Draft" | "Submitted" | "Verified">("Draft"); // Giữ Verified để tương thích với API
  const [awaitingConfirmEdit, setAwaitingConfirmEdit] = useState(false);
  const [isOcrConfirmed, setIsOcrConfirmed] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showFormFields, setShowFormFields] = useState(false);

  const citizenId = Number(localStorage.getItem("user_id") || 1);
  const isVerified = status === "Verified"; // Khôi phục logic cũ
  const today = new Date();
  const currentYear = today.getFullYear();
  const todayISO = today.toISOString().split("T")[0];

  const formatDateToISO = (dateStr: string): string => {
    if (!dateStr) return "";
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;

    const parts = dateStr.split(/[\/-]/);
    if (parts.length === 3) {
      const [day, month, year] = parts;
      return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    }

    return "";
  };

  useEffect(() => {
    const fetchCitizenInfo = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}citizens/information/${citizenId}/`);
        const data = response.data;

        if (data) {
          setForm({
            full_name: data.full_name || "",
            email: data.email || "",
            phone: data.phone_number || "",
            dob: data.dob || "",
            birthPlace: data.place_of_birth || "",
            gender: data.gender || "",
            address: data.address || "",
            citizen_identity_id: data.citizen_identity_id || "",
            issueDate: data.issue_date || "",
            issuePlace: data.place_of_issue || "",
            nationality: data.nationality || "Vietnam",
          });

          setImagePreview(data.identity_card || null);
          // API trả về status có thể là Verified, nhưng frontend chỉ xử lý Draft/Submitted
          setStatus(data.status || "Draft");
          setIsSubmitted(data.status === "Submitted" || data.status === "Verified");
          setShowFormFields(true);
        }
      } catch (error) {
        console.error("Failed to fetch citizen info:", error);
        setSnackbar({ msg: "Unable to get citizen information.", type: "error" });
      }
    };

    fetchCitizenInfo();
  }, [citizenId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      handleOcr(file);
    }
  };

  const handleOcr = async (file: File) => {
    try {
      setLoading(true);
      const base64Image = await fileToBase64(file);
      setImageBase64(base64Image);

      const response = await axios.post("https://huyhoanlee-ai-service.hf.space/extract-citizen-info", {
        image_base64: base64Image,
      });

      const ocrData = response.data;

      setForm((prev) => ({
        ...prev,
        full_name: ocrData.full_name || prev.full_name,
        dob: formatDateToISO(ocrData.date_of_birth) || prev.dob,
        birthPlace: ocrData.place_of_origin || prev.birthPlace,
        address: ocrData.place_of_residence || prev.address,
        gender: ocrData.gender || prev.gender,
        citizen_identity_id: ocrData.card_number || prev.citizen_identity_id,
      }));

      setShowFormFields(true);
      setShowConfirmDialog(true);
      setSnackbar({ msg: "Information extracted successfully. Please confirm the details.", type: "success" });
    } catch (err) {
      console.error("OCR error:", err);
      setSnackbar({ msg: "Failed to extract information. Please try again.", type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmOcr = () => {
    setIsOcrConfirmed(true);
    setShowConfirmDialog(false);
  };

  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    const requiredFields = [
      "full_name",
      "dob",
      "birthPlace",
      "address",
      "citizen_identity_id",
      "gender",
      "issueDate",
      "issuePlace",
    ];

    requiredFields.forEach((field) => {
      if (!form[field as keyof typeof form]?.trim()) {
        newErrors[field] = "This field is required";
      }
    });

    if (form.full_name) {
      if (/\d/.test(form.full_name)) {
        newErrors.full_name = "Name cannot contain numbers";
      }
      if (!/^[a-zA-Z\sÀ-ỹ]+$/u.test(form.full_name)) {
        newErrors.full_name = "Name can only contain letters and spaces";
      }
      if (form.full_name.length < 2 || form.full_name.length > 50) {
        newErrors.full_name = "Name must be between 2 and 50 characters";
      }
    }

    if (form.email && !/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(form.email)) {
      newErrors.email = "Invalid email format";
    }

    if (form.phone && !/^\d{10}$/.test(form.phone)) {
      newErrors.phone = "Phone number must be exactly 10 digits";
    }

    if (form.citizen_identity_id && !/^(\d{9}|\d{12})$/.test(form.citizen_identity_id)) {
      newErrors.citizen_identity_id = "ID number must be 9 or 12 digits";
    }

    if (form.dob) {
      const dobDate = new Date(form.dob);
      const age = currentYear - dobDate.getFullYear();
      if (isNaN(dobDate.getTime())) {
        newErrors.full_name = "Invalid date of birth";
      } else if (age < 18) {
        newErrors.dob = "You must be over 18 to register";
      } else if (dobDate > today) {
        newErrors.dob = "Date of birth cannot be in the future";
      }
    }

    if (form.issueDate) {
      const issueDate = new Date(form.issueDate);
      if (isNaN(issueDate.getTime())) {
        newErrors.issueDate = "Invalid issue date";
      } else if (issueDate > today) {
        newErrors.issueDate = "Issue date cannot be in the future";
      }
    }

    if (form.birthPlace && !/^[a-zA-Z\sÀ-ỹ,.]+$/u.test(form.birthPlace)) {
      newErrors.birthPlace = "Place of birth can only contain letters, spaces, commas, and periods";
    }
    if (form.address && !/^[a-zA-Z0-9\sÀ-ỹ,.]+$/u.test(form.address)) {
      newErrors.address = "Address can only contain letters, numbers, spaces, commas, and periods";
    }
    if (form.issuePlace && !/^[a-zA-Z\sÀ-ỹ,.]+$/u.test(form.issuePlace)) {
      newErrors.issuePlace = "Place of issue can only contain letters, spaces, commas, and periods";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      setSnackbar({ msg: "Please check the information again.", type: "error" });
      return;
    }

    if (!imageFile) {
      setSnackbar({ msg: "Please upload ID photo.", type: "error" });
      return;
    }

    if (status === "Submitted" && !awaitingConfirmEdit) {
      setSnackbar({
        msg: "You have already submitted. Click 'Confirm Resend' if you want to edit the information.",
        type: "error",
      });
      setAwaitingConfirmEdit(true);
      return;
    }

    if (!isOcrConfirmed) {
      setSnackbar({ msg: "Please confirm the extracted information before submitting.", type: "error" });
      return;
    }

    setLoading(true);

    try {
      const base64Image = await fileToBase64(imageFile);

      const trimmedForm = Object.fromEntries(
        Object.entries(form).map(([k, v]) => [k, typeof v === "string" ? v.trim() : v])
      );

      // Đảm bảo key trong payload khớp với API
      const payload = {
        full_name: trimmedForm.full_name,
        email: trimmedForm.email,
        phone_number: trimmedForm.phone, // API yêu cầu phone_number
        dob: trimmedForm.dob,
        place_of_birth: trimmedForm.birthPlace, // API yêu cầu place_of_birth
        gender: trimmedForm.gender,
        address: trimmedForm.address,
        citizen_identity_id: trimmedForm.citizen_identity_id,
        issue_date: trimmedForm.issueDate, // API yêu cầu issue_date
        place_of_issue: trimmedForm.issuePlace, // API yêu cầu place_of_issue
        nationality: trimmedForm.nationality,
        identity_card: base64Image,
        status: "Submitted", // Gửi status là Submitted
      };

      // Log payload để kiểm tra
      console.log("Payload gửi lên API:", payload);

      const updateResponse = await axios.patch(`${API_BASE_URL}citizens/update-info/${citizenId}/`, payload);
      console.log("Update response:", updateResponse.data);

      const getResponse = await axios.get(`${API_BASE_URL}citizens/information/${citizenId}/`);
      const data = getResponse.data;

      setForm({
        full_name: data.full_name || "",
        email: data.email || "",
        phone: data.phone_number || "",
        dob: data.dob || "",
        birthPlace: data.place_of_birth || "",
        gender: data.gender || "",
        address: data.address || "",
        citizen_identity_id: data.citizen_identity_id || "",
        issueDate: data.issue_date || "",
        issuePlace: data.place_of_issue || "",
        nationality: data.nationality || "Vietnam",
      });

      setImagePreview(data.identity_card || null);
      setStatus(data.status || "Draft"); // API có thể trả về Verified, nhưng frontend sẽ xử lý
      setIsSubmitted(data.status === "Submitted" || data.status === "Verified");
      setAwaitingConfirmEdit(false);

      setSnackbar({ msg: "Information submitted successfully!", type: "success" });
    } catch (err: any) {
      const msg = err.response?.data?.error || "Failed to submit information.";
      setSnackbar({ msg, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setImageFile(null);
    setImagePreview(null);
    setImageBase64(null);
    setForm({
      full_name: "",
      email: "",
      phone: "",
      dob: "",
      birthPlace: "",
      gender: "",
      address: "",
      citizen_identity_id: "",
      issueDate: "",
      issuePlace: "",
      nationality: "Vietnam",
    });
    setStatus("Draft");
    setIsSubmitted(false);
    setIsOcrConfirmed(false);
    setShowConfirmDialog(false);
    setAwaitingConfirmEdit(false);
    setShowFormFields(false);
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1000, mx: "auto" }}>
      <Typography variant="h4" fontWeight={700} mb={3}>
        Citizen Information
      </Typography>

      <Paper sx={{ p: 3 }}>
        <Typography variant="body1" mb={1}>
          Upload ID photo
        </Typography>
        <input
          type="file"
          accept="image/*"
          disabled={isSubmitted}
          onChange={handleImageChange}
        />
        {imagePreview && (
          <Box mt={2}>
            <Avatar src={imagePreview} variant="rounded" sx={{ width: 160, height: 100 }} />
          </Box>
        )}

        {showFormFields && (
          <Grid container spacing={2} mt={2} sx={{ opacity: isSubmitted ? 0.6 : 1 }}>
            {[
              { label: "Full name", name: "full_name" },
              { label: "Email", name: "email" },
              { label: "Phone number", name: "phone" },
              { label: "Place of birth", name: "birthPlace" },
              { label: "Permanent address", name: "address" },
              { label: "Citizen ID number", name: "citizen_identity_id" },
              { label: "Place of issue of citizen ID card", name: "issuePlace" },
            ].map(({ label, name }) => (
              <Grid item xs={12} sm={6} key={name}>
                <TextField
                  label={label}
                  name={name}
                  value={form[name as keyof typeof form]}
                  onChange={handleChange}
                  fullWidth
                  disabled={isSubmitted}
                  error={!!errors[name]}
                  helperText={errors[name]}
                />
              </Grid>
            ))}

            <Grid item xs={12} sm={6}>
              <TextField
                label="Date of birth"
                name="dob"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={form.dob}
                onChange={handleChange}
                inputProps={{ max: todayISO }}
                fullWidth
                disabled={isSubmitted}
                error={!!errors.dob}
                helperText={errors.dob}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label="Date of issue"
                name="issueDate"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={form.issueDate}
                onChange={handleChange}
                inputProps={{ max: todayISO }}
                fullWidth
                disabled={isSubmitted}
                error={!!errors.issueDate}
                helperText={errors.issueDate}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <RadioGroup row name="gender" value={form.gender} onChange={handleChange}>
                <FormControlLabel
                  value="Male"
                  control={<Radio />}
                  label="Male"
                  disabled={isSubmitted}
                />
                <FormControlLabel
                  value="Female"
                  control={<Radio />}
                  label="Female"
                  disabled={isSubmitted}
                />
              </RadioGroup>
              {errors.gender && (
                <Typography variant="caption" color="error">
                  {errors.gender}
                </Typography>
              )}
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label="Nationality"
                name="nationality"
                value={form.nationality}
                onChange={handleChange}
                select
                fullWidth
                disabled={isSubmitted}
              >
                <MenuItem value="Vietnam">Vietnam</MenuItem>
                <MenuItem value="Other">Other</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12}>
              <Typography>
                Status: <strong style={{ color: isVerified ? "green" : "orange" }}>{status}</strong>
              </Typography>
            </Grid>

            <Grid item xs={12}>
              {isSubmitted ? (
                <Button
                  onClick={handleBack}
                  variant="contained"
                  fullWidth
                  sx={{ bgcolor: "primary.main" }}
                >
                  Back to Edit
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  variant="contained"
                  fullWidth
                  disabled={loading}
                  startIcon={loading && <CircularProgress size={20} />}
                >
                  {loading ? "Sending..." : awaitingConfirmEdit ? "Confirm Resend" : "Submit Information"}
                </Button>
              )}
            </Grid>
          </Grid>
        )}
      </Paper>

      {isVerified && <EmailUpdateSection citizenId={citizenId} />} {/* Khôi phục EmailUpdateSection */}

      <Dialog open={showConfirmDialog} onClose={() => setShowConfirmDialog(false)}>
        <DialogTitle>Confirm Extracted Information</DialogTitle>
        <DialogContent>
          <Box mt={2}>
            <Typography><strong>Full Name:</strong> {form.full_name}</Typography>
            <Typography><strong>Citizen ID:</strong> {form.citizen_identity_id}</Typography>
            <Typography><strong>Date of Birth:</strong> {form.dob}</Typography>
            <Typography><strong>Place of Birth:</strong> {form.birthPlace}</Typography>
            <Typography><strong>Gender:</strong> {form.gender}</Typography>
            <Typography><strong>Address:</strong> {form.address}</Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowConfirmDialog(false)} color="secondary">Cancel</Button>
          <Button onClick={handleConfirmOcr} color="primary">Confirm</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={!!snackbar.msg}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, msg: "" })}
      >
        <Alert severity={snackbar.type}>{snackbar.msg}</Alert>
      </Snackbar>
    </Box>
  );
};

export default CitizenInfoForm;