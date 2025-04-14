import {
  Box, Typography, Grid, TextField, Button,
  MenuItem, Snackbar, Alert, Paper, Avatar,
  RadioGroup, FormControlLabel, Radio, CircularProgress
} from "@mui/material";
import { useState } from "react";
import EmailUpdateSection from "./EmailUpdateSection";
import axios from "axios";

const API_BASE_URL = "https://hanaxuan-backend.hf.space/api/";

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
    gender: "Male",
    address: "",
    citizen_identity_id: "",
    issueDate: "",
    issuePlace: "",
    nationality: "Vietnam",
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [snackbar, setSnackbar] = useState({ msg: "", type: "success" as "success" | "error" });
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<"Draft" | "Submitted" | "Verified">("Draft");
  const [awaitingConfirmEdit, setAwaitingConfirmEdit] = useState(false);

  const citizenId = Number(localStorage.getItem("citizen_id") || 1);
  const isVerified = status === "Verified";
  const today = new Date().toISOString().split("T")[0];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    const requiredFields = [
      "full_name", "email", "phone", "dob", "birthPlace",
      "citizen_identity_id", "issueDate", "issuePlace",
    ];

    requiredFields.forEach((field) => {
      if (!form[field as keyof typeof form]?.trim()) {
        newErrors[field] = "Trường này là bắt buộc";
      }
    });

    if (form.full_name && /\d/.test(form.full_name)) {
      newErrors.full_name = "Họ tên không được chứa số";
    }

    if (form.email && !/^[\w-.]+@([\w-]+\.)+[\w-]{2,4}$/.test(form.email)) {
      newErrors.email = "Email không hợp lệ";
    }

    if (form.phone && !/^\d{10}$/.test(form.phone)) {
      newErrors.phone = "Số điện thoại phải gồm 10 chữ số";
    }

    if (form.citizen_identity_id && !/^(\d{9}|\d{12})$/.test(form.citizen_identity_id)) {
      newErrors.citizen_identity_id = "Số CCCD phải gồm 9 hoặc 12 chữ số";
    }

    const dobDate = new Date(form.dob);
    const age = new Date().getFullYear() - dobDate.getFullYear();
    if (form.dob && age < 18) {
      newErrors.dob = "Bạn phải trên 18 tuổi để đăng ký";
    }

    if (form.issueDate && new Date(form.issueDate) > new Date()) {
      newErrors.issueDate = "Ngày cấp không hợp lệ";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      setSnackbar({ msg: "Vui lòng kiểm tra lại thông tin.", type: "error" });
      return;
    }

    if (!imageFile) {
      setSnackbar({ msg: "Vui lòng tải ảnh CCCD.", type: "error" });
      return;
    }

    if (isVerified) return;

    if (status === "Submitted" && !awaitingConfirmEdit) {
    setSnackbar({
      msg: "Bạn đã gửi trước đó. Nhấn 'Xác nhận gửi lại' nếu muốn sửa thông tin.",
      type: "error"
    });
    setAwaitingConfirmEdit(true);
    return;
  }

    setLoading(true);

    try {
      const base64Image = await fileToBase64(imageFile);

      const trimmedForm = Object.fromEntries(
        Object.entries(form).map(([k, v]) => [k, typeof v === "string" ? v.trim() : v])
      );

      const payload = {
        ...trimmedForm,
        identity_card: base64Image,
      };

      await axios.patch(`${API_BASE_URL}citizens/update-info/${citizenId}/`, payload);

      setSnackbar({ msg: "Thông tin đã được gửi thành công!", type: "success" });
      setStatus("Submitted");
      setAwaitingConfirmEdit(false);
    } catch (err: any) {
      const msg = err.response?.data?.error || "Gửi thông tin thất bại.";
      setSnackbar({ msg, type: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1000, mx: "auto" }}>
      <Typography variant="h4" fontWeight={700} mb={3}>
        Thông tin công dân
      </Typography>

      <Paper sx={{ p: 3 }}>
        <Grid container spacing={2}>
          {[{ label: "Họ và tên", name: "full_name" },
            { label: "Email", name: "email" },
            { label: "Số điện thoại", name: "phone" },
            { label: "Nơi sinh", name: "birthPlace" },
            { label: "Địa chỉ thường trú", name: "address" },
            { label: "Số CCCD", name: "citizen_identity_id" },
            { label: "Nơi cấp", name: "issuePlace" },
          ].map(({ label, name }) => (
            <Grid item xs={12} sm={6} key={name}>
              <TextField
                label={label}
                name={name}
                value={form[name as keyof typeof form]}
                onChange={handleChange}
                fullWidth
                disabled={isVerified}
                error={!!errors[name]}
                helperText={errors[name]}
              />
            </Grid>
          ))}

          <Grid item xs={12} sm={6}>
            <TextField
              label="Ngày sinh"
              name="dob"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={form.dob}
              onChange={handleChange}
              inputProps={{ max: today }}
              fullWidth
              disabled={isVerified}
              error={!!errors.dob}
              helperText={errors.dob}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              label="Ngày cấp"
              name="issueDate"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={form.issueDate}
              onChange={handleChange}
              inputProps={{ max: today }}
              fullWidth
              disabled={isVerified}
              error={!!errors.issueDate}
              helperText={errors.issueDate}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <RadioGroup row name="gender" value={form.gender} onChange={handleChange}>
              <FormControlLabel value="Male" control={<Radio />} label="Nam" disabled={isVerified} />
              <FormControlLabel value="Female" control={<Radio />} label="Nữ" disabled={isVerified} />
            </RadioGroup>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              label="Quốc tịch"
              name="nationality"
              value={form.nationality}
              onChange={handleChange}
              fullWidth
              disabled={isVerified}
              select
            >
              <MenuItem value="Vietnam">Việt Nam</MenuItem>
              <MenuItem value="Other">Khác</MenuItem>
            </TextField>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Typography variant="body1" mb={1}>
              Tải ảnh CCCD
            </Typography>
            <input type="file" accept="image/*" disabled={isVerified} onChange={handleImageChange} />
            {imagePreview && (
              <Box mt={2}>
                <Avatar src={imagePreview} variant="rounded" sx={{ width: 160, height: 100 }} />
              </Box>
            )}
          </Grid>

          <Grid item xs={12}>
            <Typography>
              Trạng thái:{" "}
              <strong style={{ color: status === "Verified" ? "green" : "orange" }}>{status}</strong>
            </Typography>
          </Grid>

          {!isVerified && (
            <Grid item xs={12}>
              <Button
                onClick={handleSubmit}
                variant="contained"
                fullWidth
                disabled={loading}
                startIcon={loading && <CircularProgress size={20} />}
              >
                {loading ? "Đang gửi..." : awaitingConfirmEdit ? "Xác nhận gửi lại" : "Gửi thông tin"}
              </Button>
            </Grid>
          )}
        </Grid>
      </Paper>

      {isVerified && <EmailUpdateSection citizenId={citizenId} />}

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
