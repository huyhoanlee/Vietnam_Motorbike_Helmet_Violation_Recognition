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
  const [emailStep, setEmailStep] = useState<"Input" | "Sent">("Input");
  const [message, setMessage] = useState(""); // Để hiển thị thông báo từ API

  const handleRequestCode = async () => {
    try {
      await axiosInstance.post(`${API_BASE_URL}/api/citizens/request-code/${citizenId}`, {
        new_email: newEmail,
      });
      setEmailStep("Sent");
      setMessage("Code sent to your new email. Please check and enter the confirmation code.");
    } catch (err) {
      setMessage("Unable to send code.");
      console.error(err);
    }
  };

  const handleUpdateEmail = async () => {
    try {
      const response = await axiosInstance.post(`${API_BASE_URL}/api/citizens/update-email/${citizenId}`, {
        email: newEmail, // API yêu cầu "email" thay vì "new_email"
        confirm_code: code,
      });
      setMessage(response.data.message); // Hiển thị thông báo từ API
      setEmailStep("Input");
      setNewEmail("");
      setCode("");
    } catch (err) {
      setMessage("Verification failed.");
      console.error(err);
    }
  };

  return (
    <Box mt={4}>
      <Typography variant="h6">Update New Email</Typography>
      {message && (
        <Typography color={message.includes("successfully") ? "green" : "red"} mb={2}>
          {message}
        </Typography>
      )}
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6}>
          <TextField
            label="New Email"
            fullWidth
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            disabled={emailStep === "Sent"}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <Button onClick={handleRequestCode} variant="outlined" sx={{ mt: 1 }} disabled={!newEmail}>
            Get Code
          </Button>
        </Grid>
        {emailStep === "Sent" && (
          <>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Confirmation Code"
                fullWidth
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Button onClick={handleUpdateEmail} variant="contained" sx={{ mt: 1 }} disabled={!code}>
                Update Email
              </Button>
            </Grid>
          </>
        )}
      </Grid>
    </Box>
  );
};

export default EmailUpdateSection;