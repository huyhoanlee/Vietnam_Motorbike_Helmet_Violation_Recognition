import { Box, Grid, TextField, Typography, Button } from "@mui/material";
import { useState } from "react";
import config from "../../../config";
import axios from "axios";
const API_BASE_URL = config.API_URL;


const EmailUpdateSection = ({ citizenId }: { citizenId: number }) => {
  const [newEmail, setNewEmail] = useState("");
  const [code, setCode] = useState("");
  const [emailStep, setEmailStep] = useState<"Input" | "Sent">("Input");
  const [message, setMessage] = useState(""); 

  const handleRequestCode = async () => {
    try {
      await axios.post(`${API_BASE_URL}citizens/change-email/${citizenId}/`, {
        email: newEmail,
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
      const response = await axios.post(`${API_BASE_URL}citizens/change-email/${citizenId}/`, {
        email: newEmail, 
        code_authen: code,
      });
      setMessage(response.data.message); 
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