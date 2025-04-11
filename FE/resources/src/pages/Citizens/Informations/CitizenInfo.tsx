import { useState } from "react";
import {
  Box, Typography, Grid, TextField, Button,
  MenuItem, Snackbar, Alert, Paper, FormControlLabel,
  RadioGroup, Radio, InputLabel, Select, FormControl,
  Avatar
} from "@mui/material";
import { useFormik } from "formik";
import * as Yup from "yup";

const CitizenInfoForm = () => {
  const [status, setStatus] = useState<"Draft" | "Submitted" | "Verified">("Draft");
  const [cccdFile, setCccdFile] = useState<File | null>(null);
  const [cccdPreview, setCccdPreview] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(false);

  const [newEmail, setNewEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [emailStep, setEmailStep] = useState<"Input" | "Sent">("Input");

  const userId = localStorage.getItem("userId");
  const isVerified = status === "Verified";
  const today = new Date().toISOString().split("T")[0];

  const handleFileChange = (
    event: React.ChangeEvent<HTMLInputElement>,
    setFile: (file: File | null) => void,
    setPreview: (url: string | null) => void
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      setFile(file);
      setPreview(URL.createObjectURL(file));
    }
  };

  const formik = useFormik({
    initialValues: {
      fullName: "",
      email: "",
      phone: "",
      dob: "",
      birthPlace: "",
      gender: "Male",
      address: "",
      cccd: "",
      issueDate: "",
      issuePlace: "",
      nationality: "Vietnam",
    },
    validationSchema: Yup.object({
      fullName: Yup.string().required("Required"),
      email: Yup.string().email("Invalid email").required("Required"),
      phone: Yup.string().matches(/^[0-9]{10}$/, "Invalid phone number").required("Required"),
      dob: Yup.date().max(new Date(), "Invalid date").required("Required"),
      birthPlace: Yup.string().required("Required"),
      cccd: Yup.string().required("Required"),
      issueDate: Yup.date().max(new Date(), "Invalid date").required("Required"),
      issuePlace: Yup.string().required("Required"),
    }),
    onSubmit: async (values) => {
      if (isVerified) return;

      if (!cccdFile) {
        setError(true);
        return;
      }

      if (status === "Submitted") {
        const confirmEdit = window.confirm(
          "Bạn sẽ xác nhận chỉnh sửa và dữ liệu cũ gửi sẽ không được lưu. Bạn có chắc chắn muốn chỉnh sửa không?"
        );
        if (!confirmEdit) return;
      }

      try {
        const formData = new FormData();
        Object.entries(values).forEach(([key, value]) => {
          formData.append(key, value);
        });
        formData.append("cccdFile", cccdFile);

        const res = await fetch(`/api/citizens/update-info/${userId}`, {
          method: "POST",
          body: formData,
        });

        if (res.ok) {
          setSuccess(true);
          setStatus("Submitted");
        } else {
          throw new Error("Failed to submit");
        }
      } catch (err) {
        setError(true);
        console.error("Error submitting info:", err);
      }
    },
  });

  const handleRequestCode = async () => {
    try {
      const res = await fetch(`/api/citizens/request-code/${userId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ new_email: newEmail }),
      });
      if (res.ok) setEmailStep("Sent");
      else throw new Error("Failed to request code");
    } catch (err) {
      alert("Không thể gửi mã xác nhận.");
    }
  };

  const handleVerifyEmail = async () => {
    try {
      const res = await fetch(`/api/citizens/verify-code/${userId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          new_email: newEmail,
          password,
          confirm_code: code,
        }),
      });

      if (res.ok) {
        alert("Email updated successfully!");
        setNewEmail("");
        setPassword("");
        setCode("");
        setEmailStep("Input");
      } else {
        alert("Xác thực thất bại. Kiểm tra lại thông tin.");
      }
    } catch (err) {
      console.error(err);
      alert("Đã có lỗi xảy ra.");
    }
  };
 type FormField = keyof typeof formik.values;
  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1000, mx: "auto" }}>
      <Typography variant="h4" fontWeight={600} gutterBottom>
        Citizen Information Form
      </Typography>

      <Paper elevation={3} sx={{ p: { xs: 2, md: 4 }, mt: 3 }}>
        <form onSubmit={formik.handleSubmit}>
          <Grid container spacing={3}>
            {/* Fields */}
            {[
              { label: "Full Name", name: "fullName" },
              { label: "Phone Number", name: "phone" },
              { label: "Place of Birth", name: "birthPlace" },
              { label: "ID Number", name: "cccd" },
              { label: "Place of Issue", name: "issuePlace" },
              { label: "Address", name: "address" },
            ].map(({ label, name }) => (
              <Grid item xs={12} sm={6} key={name}>
                <TextField
                  label={label}
                  fullWidth
                  disabled={isVerified}
                  {...formik.getFieldProps(name)}
                  error={formik.touched[name as FormField] && Boolean(formik.errors[name as FormField])}
                  helperText={formik.touched[name as FormField] && formik.errors[name as FormField]}
                />
              </Grid>
            ))}

            <Grid item xs={12} sm={6}>
              <TextField
                label="Email"
                fullWidth
                disabled={isVerified}
                {...formik.getFieldProps("email")}
                error={formik.touched.email && Boolean(formik.errors.email)}
                helperText={formik.touched.email && formik.errors.email}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label="Date of Birth"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                inputProps={{ max: today }}
                disabled={isVerified}
                {...formik.getFieldProps("dob")}
                error={formik.touched.dob && Boolean(formik.errors.dob)}
                helperText={formik.touched.dob && formik.errors.dob}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label="Issue Date"
                type="date"
                fullWidth
                InputLabelProps={{ shrink: true }}
                inputProps={{ max: today }}
                disabled={isVerified}
                {...formik.getFieldProps("issueDate")}
                error={formik.touched.issueDate && Boolean(formik.errors.issueDate)}
                helperText={formik.touched.issueDate && formik.errors.issueDate}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth disabled={isVerified}>
                <InputLabel>Nationality</InputLabel>
                <Select
                  value={formik.values.nationality}
                  onChange={(e) => formik.setFieldValue("nationality", e.target.value)}
                  label="Nationality"
                >
                  <MenuItem value="Vietnam">Vietnam</MenuItem>
                  <MenuItem value="Other">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <FormControl fullWidth disabled={isVerified}>
                <Typography sx={{ mb: 1 }}>Gender</Typography>
                <RadioGroup row {...formik.getFieldProps("gender")}>
                  <FormControlLabel value="Male" control={<Radio />} label="Male" />
                  <FormControlLabel value="Female" control={<Radio />} label="Female" />
                </RadioGroup>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <Typography gutterBottom>ID Image</Typography>
              <input
                type="file"
                accept="image/*"
                disabled={isVerified}
                onChange={(e) => handleFileChange(e, setCccdFile, setCccdPreview)}
              />
              {cccdPreview && (
                <Box mt={2}>
                  <Avatar variant="rounded" src={cccdPreview} sx={{ width: 150, height: 100 }} />
                </Box>
              )}
            </Grid>

            <Grid item xs={12}>
              <Typography color="primary" fontWeight={500}>
                Verification Status:{" "}
                <strong style={{ color: status === "Verified" ? "green" : "orange" }}>
                  {status}
                </strong>
              </Typography>
            </Grid>

            {!isVerified && (
              <Grid item xs={12}>
                <Button type="submit" variant="contained" size="large" fullWidth>
                  Submit Information
                </Button>
              </Grid>
            )}
          </Grid>
        </form>
      </Paper>

      {isVerified && (
        <Box mt={4}>
          <Typography variant="h6">Cập nhật Email mới</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="New Email"
                fullWidth
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Button onClick={handleRequestCode} variant="outlined" sx={{ mt: 1 }}>
                Get Code
              </Button>
            </Grid>
            {emailStep === "Sent" && (
              <>
                <Grid item xs={12} sm={4}>
                  <TextField
                    label="Confirmation Code"
                    fullWidth
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField
                    label="Password"
                    type="password"
                    fullWidth
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Button onClick={handleVerifyEmail} variant="contained" sx={{ mt: 1 }}>
                    Send
                  </Button>
                </Grid>
              </>
            )}
          </Grid>
        </Box>
      )}

      <Snackbar open={success} autoHideDuration={3000} onClose={() => setSuccess(false)}>
        <Alert severity="success">Information submitted successfully!</Alert>
      </Snackbar>
      <Snackbar open={error} autoHideDuration={3000} onClose={() => setError(false)}>
        <Alert severity="error">Please upload all required images!</Alert>
      </Snackbar>
    </Box>
  );
};

export default CitizenInfoForm;
