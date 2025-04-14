import { useState, useEffect } from "react";
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
const OTP_EXPIRE_TIME = 120; // 120 seconds = 2 phút

const CitizenLogin = () => {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [showOtp, setShowOtp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verifyDisabled, setVerifyDisabled] = useState(false);
  const [notification, setNotification] = useState({
    open: false,
    message: "",
    type: "info",
  });
  const [countdown, setCountdown] = useState<number | null>(null);

  const navigate = useNavigate();

  // Đếm ngược OTP
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (countdown && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => (prev ? prev - 1 : null));
      }, 1000);
    } else if (countdown === 0) {
      setNotification({
        open: true,
        message: "OTP đã hết hạn. Vui lòng gửi lại!",
        type: "warning",
      });
    }

    return () => clearInterval(timer);
  }, [countdown]);

  const handleSendOtp = async () => {
    if (!phone.match(/^[0-9]{10,11}$/)) {
      setNotification({
        open: true,
        message: "Số điện thoại không hợp lệ!",
        type: "error",
      });
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(API_BASE, { phone_number: phone });

      setNotification({
        open: true,
        message: res.data.message || "OTP đã được gửi!",
        type: "success",
      });

      setShowOtp(true);
      setOtp(""); // ✅ Reset OTP input
      setCountdown(OTP_EXPIRE_TIME); // ✅ Bắt đầu đếm ngược 2 phút
    } catch (err: any) {
      setNotification({
        open: true,
        message: err?.response?.data?.message || "Không thể gửi OTP!",
        type: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!otp) {
      setNotification({
        open: true,
        message: "Vui lòng nhập mã OTP!",
        type: "warning",
      });
      return;
    }

    setVerifyDisabled(true); // ✅ Chặn spam nút
    setLoading(true);

    try {
      const res = await axios.post(API_BASE, {
        phone_number: phone,
        code_authen: otp,
      });

      setNotification({
        open: true,
        message: res.data.message || "Đăng nhập thành công!",
        type: "success",
      });
      navigate("/citizen");
    } catch (err: any) {
      const error = err?.response?.data;
      setNotification({
        open: true,
        message:
          error?.non_field_errors?.[0] ||
          error?.message ||
          "Xác thực OTP thất bại!",
        type: "error",
      });
    } finally {
      setVerifyDisabled(false); // ✅ Cho phép nhấn lại
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        maxWidth: 400,
        mx: "auto",
        mt: 8,
        p: 4,
        boxShadow: 3,
        borderRadius: 2,
      }}
    >
      <Typography variant="h5" gutterBottom>
        Đăng nhập công dân
      </Typography>

      <TextField
        fullWidth
        label="Số điện thoại"
        variant="outlined"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        sx={{ mb: 2 }}
      />

      {!showOtp && (
        <Button
          variant="contained"
          fullWidth
          onClick={handleSendOtp}
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : "Gửi OTP"}
        </Button>
      )}

      {showOtp && (
        <>
          <TextField
            fullWidth
            label="Nhập mã OTP"
            variant="outlined"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            sx={{ my: 2 }}
          />

          <Button
            variant="contained"
            fullWidth
            onClick={handleVerify}
            disabled={loading || verifyDisabled || countdown === 0}
          >
            {loading ? <CircularProgress size={24} /> : "Xác thực & Đăng nhập"}
          </Button>

          <Typography align="center" sx={{ mt: 2 }}>
            {countdown !== null &&
              (countdown > 0
                ? `Mã OTP còn hiệu lực trong ${countdown} giây`
                : `Mã OTP đã hết hạn!`)}
          </Typography>

          <Button
            variant="text"
            fullWidth
            onClick={handleSendOtp}
            disabled={loading}
            sx={{ mt: 1 }}
          >
            Gửi lại OTP
          </Button>
        </>
      )}

      <Snackbar
        open={notification.open}
        autoHideDuration={3000}
        onClose={() => setNotification({ ...notification, open: false })}
      >
        <Alert severity={notification.type as any}>
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default CitizenLogin;
