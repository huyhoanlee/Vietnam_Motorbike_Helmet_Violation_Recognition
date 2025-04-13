// CitizenLogin.tsx
import React, { useState } from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  Snackbar,
  Alert,
  CircularProgress,
} from "@mui/material";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API_BASE = "https://hanaxuan-backend.hf.space/api/citizens/auth/";

const CitizenLogin = () => {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [showOtp, setShowOtp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState({ open: false, message: "", type: "info" });
  const navigate = useNavigate();

  const handleSendOtp = async () => {
    if (!phone.match(/^[0-9]{10,11}$/)) {
      setNotification({ open: true, message: "Invalid phone number!", type: "error" });
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(API_BASE, { phone_number: phone });
      setNotification({ open: true, message: res.data.message, type: "success" });
      setShowOtp(true);
    } catch (err: any) {
      setNotification({
        open: true,
        message: err?.response?.data?.message || "Error sending OTP!",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!otp) {
      setNotification({ open: true, message: "Please enter OTP code!", type: "warning" });
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(API_BASE, {
        phone_number: phone,
        code_authen: otp,
      });

      setNotification({ open: true, message: res.data.message, type: "success" });
      navigate("/citizen");
    } catch (err: any) {
      const error = err?.response?.data;
      setNotification({
        open: true,
        message: error?.non_field_errors?.[0] || error?.message || "OTP verification failed!",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 400, mx: "auto", mt: 8, p: 4, boxShadow: 3, borderRadius: 2 }}>
      <Typography variant="h5" gutterBottom>
        Đăng nhập công dân
      </Typography>

      <TextField
        fullWidth
        label="Phone Number"
        variant="outlined"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        sx={{ mb: 2 }}
      />

      {!showOtp && (
        <Button variant="contained" fullWidth onClick={handleSendOtp} disabled={loading}>
          {loading ? <CircularProgress size={24} /> : "Sent OTP"}
        </Button>
      )}

      {showOtp && (
        <>
          <TextField
            fullWidth
            label="Input OTP"
            variant="outlined"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            sx={{ my: 2 }}
          />
          <Button variant="contained" fullWidth onClick={handleVerify} disabled={loading}>
            {loading ? <CircularProgress size={24} /> : "Verify and login"}
          </Button>
        </>
      )}

      <Snackbar
        open={notification.open}
        autoHideDuration={3000}
        onClose={() => setNotification({ ...notification, open: false })}
      >
        <Alert severity={notification.type as any}>{notification.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default CitizenLogin;
