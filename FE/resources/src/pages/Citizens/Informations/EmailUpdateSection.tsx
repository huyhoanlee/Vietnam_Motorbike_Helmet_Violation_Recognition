// components/EmailUpdateSection.tsx
import { Box, Grid, TextField, Typography, Button } from "@mui/material";
import { useState } from "react";
import axios from "axios";


const API_BASE_URL = "https://hanaxuan-backend.hf.space";
const axiosInstance = axios.create();
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

const EmailUpdateSection = ({ citizenId }: { citizenId: number }) => {
  const [newEmail, setNewEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [emailStep, setEmailStep] = useState<"Input" | "Sent">("Input");

  const handleRequestCode = async () => {
    try {
      await axiosInstance.post(`${API_BASE_URL}/api/citizens/request-code/${citizenId}`, {
        new_email: newEmail,
      });
      setEmailStep("Sent");
    } catch (err) {
      alert("Unable to send code.");
      console.error(err);
    }
  };

  const handleVerifyEmail = async () => {
    try {
      await axiosInstance.post(`${API_BASE_URL}/api/citizens/verify-code/${citizenId}`, {
        new_email: newEmail,
        password,
        confirm_code: code,
      });
      alert("Email updated successfully!");
      setEmailStep("Input");
      setNewEmail("");
      setCode("");
      setPassword("");
    } catch (err) {
      alert("Verification failed.");
      console.error(err);
    }
  };

  return (
    <Box mt={4}>
      <Typography variant="h6">Update New Email</Typography>
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
  );
};

export default EmailUpdateSection;
