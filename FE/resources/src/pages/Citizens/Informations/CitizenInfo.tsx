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
  Fade,
  Stepper,
  Step,
  StepLabel,
  Chip,
  Card,
  CardContent,
} from "@mui/material";
import { useState, useEffect } from "react";
import axios from "axios";
import config from "../../../config";
import EmailUpdateSection from "./EmailUpdateSection";
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import PersonIcon from '@mui/icons-material/Person';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import CameraCapture from "./CameraCapture";
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

  const [personImage, setPersonImage] = useState<string | null>(null);
  const [personImagePreview, setPersonImagePreview] = useState<string | null>(null);
  
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [snackbar, setSnackbar] = useState({ msg: "", type: "success" as "success" | "error" | "warning" });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"Draft" | "Submitted" | "Verified" | "Rejected">("Draft");
  const [displayStatus, setDisplayStatus] = useState<string>("Draft"); // Trạng thái hiển thị ở FE
  const [editCount, setEditCount] = useState<number>(0); // Đếm số lần chỉnh sửa
  const [awaitingConfirmEdit, setAwaitingConfirmEdit] = useState(false);
  const [isOcrConfirmed, setIsOcrConfirmed] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showSubmitConfirmDialog, setShowSubmitConfirmDialog] = useState(false); // Dialog xác nhận trước khi Submit
  const [showFormFields, setShowFormFields] = useState(false);
  const [openImageDialog, setOpenImageDialog] = useState(false);
  const [openPersonImageDialog, setOpenPersonImageDialog] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);

  const citizenId = Number(localStorage.getItem("user_id") || 1);
  const isVerified = status === "Verified";
  const isRejected = status === "Rejected";
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
        setFetchingData(true);
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
          setPersonImagePreview(data.person_image || null);
          setStatus(data.status || "Draft");
          setDisplayStatus(data.status || "Draft");
          setIsSubmitted(data.status === "Submitted" || data.status === "Verified");

          if (data.status === "Rejected") {
          setIsSubmitted(false);
          setDisplayStatus("Change Information");
        }

          setShowFormFields(true);
        }
      } catch (error) {
        console.error("Failed to fetch citizen info:", error);
        setSnackbar({ msg: "Unable to get citizen information.", type: "error" });
      } finally {
        setFetchingData(false);
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

  const handleCameraCapture = (base64Image: string) => {
  setPersonImage(base64Image);
  setPersonImagePreview(base64Image);
  setSnackbar({ msg: "Photo captured successfully!", type: "success" });
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

    if (!personImage && !personImagePreview) {
    setSnackbar({ msg: "Please take your photo for verification.", type: "error" });
    return false;
  }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      setSnackbar({ msg: "Please check the information again.", type: "error" });
      return;
    }

    if (!imageFile && !imagePreview) {
      setSnackbar({ msg: "Please upload ID photo.", type: "error" });
      return;
    }

    if (displayStatus === "Change Information") {
      setShowSubmitConfirmDialog(true); // Hiển thị dialog xác nhận trước khi Submit
      return;
    }


    if (!isOcrConfirmed) {
      setSnackbar({ msg: "Please confirm the extracted information before submitting.", type: "error" });
      return;
    }

    
    await handleFinalSubmit();
  };

  const handleFinalSubmit = async () => {
    setLoading(true);

    try {
      const base64Image = imageFile ? await fileToBase64(imageFile) : imagePreview || imageBase64;

      const trimmedForm = Object.fromEntries(
        Object.entries(form).map(([k, v]) => [k, typeof v === "string" ? v.trim() : v])
      );

      const payload = {
        full_name: trimmedForm.full_name,
        email: trimmedForm.email,
        phone_number: trimmedForm.phone,
        dob: trimmedForm.dob,
        place_of_birth: trimmedForm.birthPlace,
        gender: trimmedForm.gender,
        address: trimmedForm.address,
        citizen_identity_id: trimmedForm.citizen_identity_id,
        issue_date: trimmedForm.issueDate,
        place_of_issue: trimmedForm.issuePlace,
        nationality: trimmedForm.nationality,
        identity_card: base64Image,
        person_image: personImage || personImagePreview,
        status: "Submitted", // Gửi status là Submitted lên BE
      };

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
      setPersonImagePreview(data.person_image || null);
      setStatus(data.status || "Draft");
      
      // Cập nhật trạng thái hiển thị ở FE
      if (displayStatus === "Change Information") {
        const newEditCount = editCount + 1;
        setEditCount(newEditCount);
        setDisplayStatus(`Submit again [${newEditCount.toString().padStart(2, "0")}]`);
      } else {
        setDisplayStatus(data.status || "Draft");
      }
      
      setIsSubmitted(data.status === "Submitted" || data.status === "Verified");
      setAwaitingConfirmEdit(false);

      setSnackbar({ msg: "Information submitted successfully!", type: "success" });
    } catch (err: any) {
      const msg = err.response?.data?.error || "Failed to submit information.";
      setSnackbar({ msg, type: "error" });
    } finally {
      setLoading(false);
      setShowSubmitConfirmDialog(false);
    }
  };

  const handleBack = () => {
    if (isVerified) {
      setSnackbar({ msg: "Your information is verified and cannot be edited.", type: "warning" });
      return;
    }

    setImageFile(null);
    setPersonImage(null); 
    setIsSubmitted(false);
    setIsOcrConfirmed(false);
    setShowConfirmDialog(false);
    setAwaitingConfirmEdit(false);
    setDisplayStatus("Change Information"); // Trạng thái hiển thị ở FE
  };

  const renderStatusStepper = () => {
    const steps = ["Upload ID", "Submit Information", "Verification"];
    const activeStep = displayStatus === "Draft" || displayStatus === "Change Information" || isRejected ? 0 :
    displayStatus.startsWith("Submit again") || status === "Submitted" ? 1 : 2;

    return (
      <Fade in={!fetchingData}>
        <Card sx={{ mb: 3, border: isVerified ? '1px solid #4caf50' : isRejected ? '1px solid #f44336' : '1px solid #ff9800' }}>
          <CardContent>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              {isVerified ? (
                <CheckCircleIcon color="success" sx={{ mr: 1, fontSize: 28 }} />
              ) : isRejected ?(
                <ErrorOutlineIcon color="warning" sx={{ mr: 1, fontSize: 28 }} />
              ): (
              <ErrorOutlineIcon color="warning" sx={{ mr: 1, fontSize: 28 }} />
              )}
              <Typography variant="h6">
              {isVerified ? "Citizen Verified" : 
               isRejected ? "Information Rejected" :
               displayStatus === "Change Information" ? "Editing Information" : 
               displayStatus.startsWith("Submit again") ? "Verification Pending" : 
               status === "Submitted" ? "Verification Pending" : "Upload Your Information"}
            </Typography>
            </Box>

             {/* Add rejection message alert */}
            {isRejected && (
              <Alert severity="error" sx={{ mb: 2 }}>
                Your ID information and personal details do not match. Please review and update your information.
              </Alert>
            )}

            <Stepper activeStep={activeStep} alternativeLabel>
              {steps.map((label, index) => (
                <Step key={label}>
                  <StepLabel StepIconComponent={() => (
                    index === 0 ? <PersonIcon color={activeStep >= 0 ? "primary" : "disabled"} /> :
                    index === 1 ? <VerifiedUserIcon color={activeStep >= 1 ? "primary" : "disabled"} /> :
                    <CheckCircleIcon color={activeStep >= 2 ? "success" : "disabled"} />
                  )}>
                    {label}
                  </StepLabel>
                </Step>
              ))}
            </Stepper>

            {form.full_name && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2">
                  <strong>Full Name:</strong> {form.full_name}
                </Typography>
                <Typography variant="body2">
                  <strong>Citizen ID:</strong> {form.citizen_identity_id}
                </Typography>
                <Typography variant="body2">
                  <strong>Date of Birth:</strong> {form.dob ? new Date(form.dob).toLocaleDateString('vi-VN') : ""}
                </Typography>
                <Typography variant="body2">
                  <strong>Status:</strong>
                  <Chip
                  icon={isVerified ? <CheckCircleIcon /> : isRejected ? <ErrorOutlineIcon /> : <ErrorOutlineIcon />}
                  label={isRejected ? "Rejected" : displayStatus}
                  color={isVerified ? "success" : isRejected ? "error" : displayStatus === "Change Information" || displayStatus.startsWith("Submit again") || status === "Submitted" ? "warning" : "default"}
                  size="small"
                  sx={{ ml: 1 }}
                />
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
      <Typography variant="h4" fontWeight={700} mb={3} color="primary.main">
        Citizen Information
      </Typography>

      {fetchingData ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {renderStatusStepper()}

          <Fade in={!fetchingData}>
            <Paper sx={{ p: 3, border: '1px solid #e0e0e0', borderRadius: 2, boxShadow: 3 }}>
              <Typography variant="body1" mb={1} fontWeight={500}>
                Upload ID Photo
              </Typography>
              <input
                type="file"
                accept="image/*"
                disabled={isSubmitted || isVerified}
                onChange={handleImageChange}
                style={{
                  padding: "10px",
                  border: "1px solid #e0e0e0",
                  borderRadius: "4px",
                  width: "100%",
                  boxSizing: "border-box",
                  backgroundColor: isVerified ? "#f5f5f5" : "white",
                }}
              />
              {imagePreview && (
                <Box mt={2}>
                  <Avatar
                    src={imagePreview || ""}
                    variant="rounded"
                    sx={{ width: 160, height: 100, cursor: "pointer", transition: "transform 0.3s" }}
                    onClick={() => setOpenImageDialog(true)}
                    onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
                    onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                  />
                </Box>
              )}
              <Box mt={3} mb={2}>
              <Typography variant="body1" mb={1} fontWeight={500}>
                Take Your Photo for Verification
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <CameraCapture 
                  onImageCapture={handleCameraCapture} 
                  disabled={isSubmitted || isVerified}
                />
                {personImagePreview && (
                  <Avatar
                    src={personImagePreview}
                    alt="Person Photo"
                    sx={{ 
                      width: 100, 
                      height: 100, 
                      cursor: "pointer",
                      transition: "transform 0.3s",
                      border: '2px solid #1976d2'
                    }}
                    onClick={() => {
                      setOpenPersonImageDialog(true);
                      // You can add logic here to display the person image in the dialog
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.transform = "scale(1.05)")}
                    onMouseLeave={(e) => (e.currentTarget.style.transform = "scale(1)")}
                  />
                )}
              </Box>
              {!personImagePreview && !isVerified && (
                <Typography variant="caption" color="text.secondary">
                  Please take a clear photo of your face for verification purposes
                </Typography>
              )}
            </Box>

              {showFormFields && (
                <Grid container spacing={2} mt={2} sx={{ opacity: isVerified ? 0.6 : isSubmitted ? 0.8 : 1 }}>
                  {[
                    { label: "Full Name", name: "full_name" },
                    { label: "Email", name: "email" },
                    { label: "Phone Number", name: "phone" },
                    { label: "Place of Birth", name: "birthPlace" },
                    { label: "Permanent Address", name: "address" },
                    { label: "Citizen ID Number", name: "citizen_identity_id" },
                    { label: "Place of Issue of Citizen ID Card", name: "issuePlace" },
                  ].map(({ label, name }) => (
                    <Grid item xs={12} sm={6} key={name}>
                      <TextField
                        label={label}
                        name={name}
                        value={form[name as keyof typeof form]}
                        onChange={handleChange}
                        fullWidth
                        disabled={isSubmitted || isVerified}
                        error={!!errors[name]}
                        helperText={errors[name]}
                        variant="outlined"
                        sx={{
                          "& .MuiOutlinedInput-root": {
                            "&:hover fieldset": {
                              borderColor: isVerified ? "inherit" : "primary.main",
                            },
                            "&.Mui-focused fieldset": {
                              borderColor: isVerified ? "inherit" : "primary.main",
                            },
                            "&.Mui-disabled fieldset": {
                              borderColor: isVerified ? "rgba(0, 0, 0, 0.12)" : "inherit",
                            },
                          },
                          "& .MuiInputBase-root.Mui-disabled": {
                            backgroundColor: isVerified ? "#f5f5f5" : "inherit",
                          },
                        }}
                      />
                    </Grid>
                  ))}

                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Date of Birth"
                      name="dob"
                      type="date"
                      InputLabelProps={{ shrink: true }}
                      value={form.dob}
                      onChange={handleChange}
                      inputProps={{ max: todayISO }}
                      fullWidth
                      disabled={isSubmitted || isVerified}
                      error={!!errors.dob}
                      helperText={errors.dob}
                      variant="outlined"
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          "&:hover fieldset": {
                            borderColor: isVerified ? "inherit" : "primary.main",
                          },
                          "&.Mui-focused fieldset": {
                            borderColor: isVerified ? "inherit" : "primary.main",
                          },
                          "&.Mui-disabled fieldset": {
                            borderColor: isVerified ? "rgba(0, 0, 0, 0.12)" : "inherit",
                          },
                        },
                        "& .MuiInputBase-root.Mui-disabled": {
                          backgroundColor: isVerified ? "#f5f5f5" : "inherit",
                        },
                      }}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Date of Issue"
                      name="issueDate"
                      type="date"
                      InputLabelProps={{ shrink: true }}
                      value={form.issueDate}
                      onChange={handleChange}
                      inputProps={{ max: todayISO }}
                      fullWidth
                      disabled={isSubmitted || isVerified}
                      error={!!errors.issueDate}
                      helperText={errors.issueDate}
                      variant="outlined"
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          "&:hover fieldset": {
                            borderColor: isVerified ? "inherit" : "primary.main",
                          },
                          "&.Mui-focused fieldset": {
                            borderColor: isVerified ? "inherit" : "primary.main",
                          },
                          "&.Mui-disabled fieldset": {
                            borderColor: isVerified ? "rgba(0, 0, 0, 0.12)" : "inherit",
                          },
                        },
                        "& .MuiInputBase-root.Mui-disabled": {
                          backgroundColor: isVerified ? "#f5f5f5" : "inherit",
                        },
                      }}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6}>
                    <Typography variant="body2" mb={1}>Gender</Typography>
                    <RadioGroup row name="gender" value={form.gender} onChange={handleChange}>
                      <FormControlLabel
                        value="Male"
                        control={<Radio />}
                        label="Male"
                        disabled={isSubmitted || isVerified}
                      />
                      <FormControlLabel
                        value="Female"
                        control={<Radio />}
                        label="Female"
                        disabled={isSubmitted || isVerified}
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
                      disabled={isSubmitted || isVerified}
                      variant="outlined"
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          "&:hover fieldset": {
                            borderColor: isVerified ? "inherit" : "primary.main",
                          },
                          "&.Mui-focused fieldset": {
                            borderColor: isVerified ? "inherit" : "primary.main",
                          },
                          "&.Mui-disabled fieldset": {
                            borderColor: isVerified ? "rgba(0, 0, 0, 0.12)" : "inherit",
                          },
                        },
                        "& .MuiInputBase-root.Mui-disabled": {
                          backgroundColor: isVerified ? "#f5f5f5" : "inherit",
                        },
                      }}
                    >
                      <MenuItem value="Vietnam">Vietnam</MenuItem>
                      <MenuItem value="Other">Other</MenuItem>
                    </TextField>
                  </Grid>

                  <Grid item xs={12}>
                    {isSubmitted && !isVerified ? (
                      <Button
                        onClick={handleBack}
                        variant="contained"
                        color="secondary"
                        fullWidth
                        sx={{
                          py: 1.5,
                          transition: "all 0.3s",
                          "&:hover": {
                            transform: "translateY(-2px)",
                            boxShadow: 6,
                          },
                        }}
                      >
                        Back to Edit
                      </Button>
                    ) : (
                      !isVerified && (
                        <Button
                          onClick={handleSubmit}
                          variant="contained"
                          color="primary"
                          fullWidth
                          disabled={loading}
                          startIcon={loading && <CircularProgress size={20} />}
                          sx={{
                            py: 1.5,
                            transition: "all 0.3s",
                            "&:hover": {
                              transform: "translateY(-2px)",
                              boxShadow: 6,
                            },
                          }}
                        >
                          {loading ? "Sending..." : awaitingConfirmEdit ? "Confirm Resend" : "Submit Information"}
                        </Button>
                      )
                    )}
                  </Grid>
                </Grid>
              )}
            </Paper>
          </Fade>

          {isVerified && (
            <Fade in={isVerified}>
              <Box mt={4}>
                <EmailUpdateSection citizenId={citizenId} />
              </Box>
            </Fade>
          )}
        </>
      )}

      <Dialog open={showConfirmDialog} onClose={() => setShowConfirmDialog(false)}>
        <DialogTitle>Confirm Extracted Information</DialogTitle>
        <DialogContent>
          <Typography mb={2}>Please review the information below. Are you sure it is correct?</Typography>
          <Box>
            <Typography><strong>Full Name:</strong> {form.full_name}</Typography>
            <Typography><strong>Citizen ID:</strong> {form.citizen_identity_id}</Typography>
            <Typography><strong>Date of Birth:</strong> {form.dob}</Typography>
            <Typography><strong>Place of Birth:</strong> {form.birthPlace}</Typography>
            <Typography><strong>Gender:</strong> {form.gender}</Typography>
            <Typography><strong>Address:</strong> {form.address}</Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowConfirmDialog(false)} color="secondary">
            Cancel
          </Button>
          <Button onClick={handleConfirmOcr} color="primary">
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={showSubmitConfirmDialog} onClose={() => setShowSubmitConfirmDialog(false)}>
        <DialogTitle>Confirm Your Submission</DialogTitle>
        <DialogContent>
          <Typography mb={2}>
            You've Edited Your Information. Please Confirm that your Information is CORRECT and COMPLETE before submitting for review.
          </Typography>
          <Box>
            <Typography><strong>Full Name:</strong> {form.full_name}</Typography>
            <Typography><strong>Citizen ID:</strong> {form.citizen_identity_id}</Typography>
            <Typography><strong>Date of Birth:</strong> {form.dob}</Typography>
            <Typography><strong>Place of Birth:</strong> {form.birthPlace}</Typography>
            <Typography><strong>Gender:</strong> {form.gender}</Typography>
            <Typography><strong>Address:</strong> {form.address}</Typography>
          </Box>
        </DialogContent>
        {personImagePreview && (
        <Box mt={2} display="flex" flexDirection="column" alignItems="center">
          <Typography variant="subtitle2" gutterBottom>Your Photo</Typography>
          <Avatar
            src={personImagePreview}
            alt="Person Photo"
            onClick={() => setOpenPersonImageDialog(true)}
            sx={{ width: 100, height: 100, mb: 1 }}
          />
        </Box>
      )}
        <DialogActions>
          <Button onClick={() => setShowSubmitConfirmDialog(false)} color="secondary">
            Cancel
          </Button>
          <Button onClick={handleFinalSubmit} color="primary" disabled={loading}>
            {loading ? <CircularProgress size={20} /> : "Confirm and Submit"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openImageDialog} onClose={() => setOpenImageDialog(false)} maxWidth="md">
        <DialogTitle>Image ID Preview</DialogTitle>
        <DialogContent>
          <img
            src={imagePreview || ""}
            alt="ID Preview"
            style={{ maxWidth: "100%", maxHeight: "70vh", objectFit: "contain" }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenImageDialog(false)} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={openPersonImageDialog} onClose={() => setOpenPersonImageDialog(false)} maxWidth="md">
      <DialogTitle>Person Image Preview</DialogTitle>
      <DialogContent>
        <img
          src={personImagePreview || ""}
          alt="Person Image Preview"
          style={{ maxWidth: "100%", maxHeight: "70vh", objectFit: "contain" }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setOpenPersonImageDialog(false)} color="primary">
          Close
        </Button>
      </DialogActions>
    </Dialog>

      <Snackbar
        open={!!snackbar.msg}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, msg: "" })}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          severity={snackbar.type}
          variant="filled"
          onClose={() => setSnackbar({ ...snackbar, msg: "" })}
        >
          {snackbar.msg}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default CitizenInfoForm;