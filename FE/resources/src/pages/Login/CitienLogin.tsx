import { useState, useEffect, useRef } from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  Snackbar,
  Alert,
  CircularProgress,
  Paper,
  Container,
  InputAdornment,
  IconButton
} from "@mui/material";
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import axios from "axios";
import { useNavigate } from "react-router-dom";
import config from "../../config";
import PenguinCitizen from "../../pages/Login/Animation/PenguinCitizen";

const API_BASE_URL = `${config.API_URL}citizens/auth/`;
const OTP_EXPIRE_TIME = 120; // 120 seconds = 2 minutes

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
  
  // States for penguin animation
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [mousePosition, setMousePosition] = useState<{ x: number, y: number } | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  
  const phoneFieldRef = useRef<HTMLDivElement>(null);
  const otpFieldRef = useRef<HTMLDivElement>(null);

  const navigate = useNavigate();

  // Countdown timer for OTP
  useEffect(() => {
    let timer: ReturnType<typeof setInterval>;
    if (countdown && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((prev) => (prev ? prev - 1 : null));
      }, 1000);
    } else if (countdown === 0) {
      setNotification({
        open: true,
        message: "OTP has expired. Please resend!",
        type: "warning",
      });
    }

    return () => clearInterval(timer);
  }, [countdown]);
  
  // Update mouse position when moving over input fields
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!phoneFieldRef.current && !otpFieldRef.current) return;
    
    const activeRef = focusedField === 'otp' ? otpFieldRef.current : phoneFieldRef.current;
    if (!activeRef) return;
    
    const rect = activeRef.getBoundingClientRect();
    
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    
    setMousePosition({ x, y });
  };
  
  // Reset mouse position when leaving input fields
  const handleMouseLeave = () => {
    setMousePosition(null);
  };

  const handleSendOtp = async () => {
    if (!phone.match(/^[0-9]{10,11}$/)) {
      setNotification({
        open: true,
        message: "Invalid phone number!",
        type: "error",
      });
      return;
    }

    setLoading(true);
    try {
      const res = await axios.post(API_BASE_URL, { phone_number: phone });

      setNotification({
        open: true,
        message: res.data.message || "OTP has been sent!",
        type: "success",
      });

      setShowOtp(true);
      setOtp(""); // Reset OTP input
      setCountdown(OTP_EXPIRE_TIME); // Start 2 minute countdown
    } catch (err: any) {
      setNotification({
        open: true,
        message: err?.response?.data?.message || "Unable to send OTP!",
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
        message: "Please enter OTP code!",
        type: "warning",
      });
      return;
    }

    setVerifyDisabled(true); // Prevent spam clicks
    setLoading(true);

    try {
      const res = await axios.post(API_BASE_URL, {
        phone_number: phone,
        code_authen: otp,
      });
      const { role, id } = res.data.data;
      localStorage.setItem("user_id", String(id));
      localStorage.setItem('user_role', role);
      localStorage.setItem("is_citizen_authenticated", "true");

      setNotification({
        open: true,
        message: res.data.message || "Login successful!",
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
          "OTP authentication failed!",
        type: "error",
      });
    } finally {
      setVerifyDisabled(false);
      setLoading(false);
    }
  };
  
  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };
  
  return (
    <Container maxWidth="sm">
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Paper 
          elevation={6} 
          sx={{ 
            p: 4, 
            width: '100%', 
            borderRadius: '12px',
            transition: 'transform 0.3s ease-in-out',
            '&:hover': {
              transform: 'translateY(-5px)'
            }
          }}
        >
          <Box sx={{ mb: 4 }}>
            <PenguinCitizen 
              isPasswordField={focusedField === 'otp'} 
              isPasswordVisible={showPassword}
              inputPosition={mousePosition}
            />
          </Box>
          
          <Typography 
            variant="h4" 
            align="center" 
            fontWeight="bold" 
            gutterBottom
            sx={{ 
              color: '#2563EB',
              mb: 3
            }}
          >
            Citizen Login
          </Typography>

          <form>
            <Box 
              ref={phoneFieldRef}
              onMouseMove={handleMouseMove} 
              onMouseLeave={handleMouseLeave}
              onFocus={() => setFocusedField('phone')}
            >
              <TextField
                fullWidth
                label="Phone number"
                variant="outlined"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                sx={{ 
                  mb: 2,
                  '& .MuiOutlinedInput-root': {
                    '&.Mui-focused fieldset': {
                      borderColor: '#2563EB',
                    },
                  },
                }}
              />
            </Box>

            {!showOtp && (
              <Button
                variant="contained"
                fullWidth
                onClick={handleSendOtp}
                disabled={loading}
                sx={{ 
                  py: 1.5, 
                  bgcolor: '#10B981',
                  '&:hover': {
                    bgcolor: '#059669',
                  }
                }}
              >
                {loading ? <CircularProgress size={24} /> : "Send OTP"}
              </Button>
            )}

            {showOtp && (
              <>
                <Box 
                  ref={otpFieldRef}
                  onMouseMove={handleMouseMove} 
                  onMouseLeave={handleMouseLeave}
                  onFocus={() => setFocusedField('otp')}
                >
                  <TextField
                    fullWidth
                    label="Enter OTP code"
                    variant="outlined"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    type={showPassword ? 'text' : 'password'}
                    InputProps={{
                      endAdornment: (
                        <InputAdornment position="end">
                          <IconButton
                            aria-label="toggle OTP visibility"
                            onClick={handleClickShowPassword}
                            edge="end"
                          >
                            {showPassword ? <VisibilityOff /> : <Visibility />}
                          </IconButton>
                        </InputAdornment>
                      )
                    }}
                    sx={{ 
                      my: 2,
                      '& .MuiOutlinedInput-root': {
                        '&.Mui-focused fieldset': {
                          borderColor: '#2563EB',
                        },
                      },
                    }}
                  />
                </Box>

                <Button
                  variant="contained"
                  fullWidth
                  onClick={handleVerify}
                  disabled={loading || verifyDisabled || countdown === 0}
                  sx={{ 
                    py: 1.5, 
                    bgcolor: '#2563EB',
                    '&:hover': {
                      bgcolor: '#1D4ED8',
                    }
                  }}
                >
                  {loading ? <CircularProgress size={24} /> : "Authentication & Login"}
                </Button>

                <Typography align="center" sx={{ mt: 2, color: countdown === 0 ? '#EF4444' : '#6B7280' }}>
                  {countdown !== null &&
                    (countdown > 0
                      ? `OTP code is still valid for ${countdown} seconds`
                      : `OTP code has expired!`)}
                </Typography>

                <Button
                  variant="outlined"
                  fullWidth
                  onClick={handleSendOtp}
                  disabled={loading}
                  sx={{ 
                    mt: 2,
                    borderColor: '#10B981',
                    color: '#10B981',
                    '&:hover': {
                      borderColor: '#059669',
                      bgcolor: 'rgba(16, 185, 129, 0.1)',
                    }
                  }}
                >
                  Resend OTP
                </Button>
              </>
            )}
          </form>
          
          <Snackbar
            open={notification.open}
            autoHideDuration={3000}
            onClose={() => setNotification({ ...notification, open: false })}
          >
            <Alert severity={notification.type as any}>
              {notification.message}
            </Alert>
          </Snackbar>
        </Paper>
      </Box>
    </Container>
  );
};

export default CitizenLogin;