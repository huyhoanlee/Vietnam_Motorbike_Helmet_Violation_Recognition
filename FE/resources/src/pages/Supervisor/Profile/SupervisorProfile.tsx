import { useEffect, useState } from "react";
import {
  Box, Button, TextField, Typography, Dialog, DialogTitle,
  DialogContent, DialogActions, Snackbar, Alert, Paper
} from "@mui/material";
import axiosInstance from "../../../services/axiosInstance.tsx";
import config from "../../../config.tsx";

const API_BASE_URL = config.API_URL;


const SupervisorProfile = () => {
  const [user, setUser] = useState({ username: "", role: "", email: "" });
  const [_loading, setLoading] = useState(true);
  const [openEmailDialog, setOpenEmailDialog] = useState(false);
  const [openPassDialog, setOpenPassDialog] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [notification, setNotification] = useState({ open: false, type: "", message: "" });
  const [confirmPassword, setConfirmPassword] = useState("");

  const userId = localStorage.getItem("user_id");

  useEffect(() => {
    if (!userId) return;
    axiosInstance.get(`${API_BASE_URL}accounts/profile/${userId}/`)
      .then(res => setUser(res.data))
      .catch(() => setNotification({ open: true, type: "error", message: "Unable to load user information." }))
      .finally(() => setLoading(false));
  }, [userId]);

  const handleEmailUpdate = () => {
  // Regex kiểm tra định dạng email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(newEmail)) {
    setNotification({ open: true, type: "error", message: "Invalid email." });
    return;
  }

  if (!password) {
    setNotification({ open: true, type: "error", message: "Please enter current password." });
    return;
  }

  axiosInstance.patch(`${API_BASE_URL}accounts/update/${userId}/`, {
    email: newEmail,
    password: password,
  })
    .then(res => {
      setNotification({ open: true, type: "success", message: res.data.message });
      setUser(prev => ({ ...prev, email: newEmail }));
      setOpenEmailDialog(false);
      setPassword("");
    })
    .catch(err => {
      setNotification({ open: true, type: "error", message: err.response?.data?.message || "Change fails." });
    });
};

  const handlePasswordUpdate = () => {
  if (!password || !newPassword || !confirmPassword) {
    setNotification({ open: true, type: "error", message: "Please fill in all information." });
    return;
  }

  if (newPassword !== confirmPassword) {
    setNotification({ open: true, type: "error", message: "New password does not match." });
    return;
  }

  const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+{}\[\]:;<>,.?~\\/-]).{8,}$/;

  if (!strongPasswordRegex.test(newPassword)) {
    setNotification({
      open: true,
      type: "error",
      message: "Password must be at least 8 characters, including uppercase, lowercase, numbers and special characters."
    });
    return;
  }

  axiosInstance.patch(`${API_BASE_URL}accounts/update/${userId}/`, {
    password: password,
    new_password: newPassword,
  })
    .then(res => {
      setNotification({ open: true, type: "success", message: res.data.message });
      setOpenPassDialog(false);
      setPassword("");
      setNewPassword("");
      setConfirmPassword("");
    })
    .catch(err => {
      setNotification({ open: true, type: "error", message: err.response?.data?.message || "Incorrect password." });
    });
};


  return (
    <Box maxWidth="600px" mx="auto" mt={5}>
      <Typography variant="h5" gutterBottom fontWeight="bold">
        Account Profile
      </Typography>
      <Paper elevation={3} sx={{ p: 3 }}>
        <TextField fullWidth label="Username" value={user.username} disabled margin="normal" />
        <TextField fullWidth label="Role" value={user.role} disabled margin="normal" />
        <TextField fullWidth label="Email" value={user.email} disabled margin="normal" />

        <Box mt={3} display="flex" justifyContent="space-between" gap={2}>
          <Button variant="contained" onClick={() => setOpenEmailDialog(true)}>Change Email</Button>
          <Button variant="outlined" onClick={() => setOpenPassDialog(true)}>Change Password</Button>
        </Box>
      </Paper>

      {/* Email Dialog */}
      <Dialog open={openEmailDialog} onClose={() => setOpenEmailDialog(false)}>
        <DialogTitle>Change Email</DialogTitle>
        <DialogContent>
          <TextField fullWidth label="New Email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} margin="normal" />
          <TextField fullWidth label="Current Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} margin="normal" />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEmailDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleEmailUpdate}>Confirm</Button>
        </DialogActions>
      </Dialog>

      {/* Password Dialog */}
      <Dialog open={openPassDialog} onClose={() => setOpenPassDialog(false)}>
      <DialogTitle>Change Password</DialogTitle>
      <DialogContent>
        <TextField fullWidth label="Current Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} margin="normal" />
        <TextField fullWidth label="New Password" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} margin="normal" />
        <TextField fullWidth label="Confirm new password" type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} margin="normal" />
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setOpenPassDialog(false)}>Cancel</Button>
        <Button variant="contained" onClick={handlePasswordUpdate}>Confirm</Button>
      </DialogActions>
    </Dialog>

      {/* Notification */}
      <Snackbar open={notification.open} autoHideDuration={3000} onClose={() => setNotification({ ...notification, open: false })}>
        <Alert severity={notification.type as any}>{notification.message}</Alert>
      </Snackbar>
    </Box>
  );
};

export default SupervisorProfile;
