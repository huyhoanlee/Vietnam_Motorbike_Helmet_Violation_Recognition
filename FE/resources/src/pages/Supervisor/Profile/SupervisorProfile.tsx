import { useEffect, useState } from "react";
import {
  Box, Button, TextField, Typography, Dialog, DialogTitle,
  DialogContent, DialogActions, Snackbar, Alert, Paper
} from "@mui/material";
import axios from "axios";

const API_BASE_URL = "https://hanaxuan-backend.hf.space/api/accounts/";

const axiosInstance = axios.create();
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const SupervisorProfile = () => {
  const [user, setUser] = useState({ username: "", role: "", email: "" });
  const [loading, setLoading] = useState(true);
  const [openEmailDialog, setOpenEmailDialog] = useState(false);
  const [openPassDialog, setOpenPassDialog] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [notification, setNotification] = useState({ open: false, type: "", message: "" });

  const userId = localStorage.getItem("user_id");

  useEffect(() => {
    if (!userId) return;
    axiosInstance.get(`${API_BASE_URL}profile/${userId}/`)
      .then(res => setUser(res.data))
      .catch(() => setNotification({ open: true, type: "error", message: "Không thể tải thông tin người dùng." }))
      .finally(() => setLoading(false));
  }, [userId]);

  const handleEmailUpdate = () => {
    axiosInstance.patch(`${API_BASE_URL}update/${userId}/`, {
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
        setNotification({ open: true, type: "error", message: err.response?.data?.message || "Thay đổi thất bại." });
      });
  };

  const handlePasswordUpdate = () => {
    axiosInstance.patch(`${API_BASE_URL}update/${userId}/`, {
      password: password,
      new_password: newPassword,
    })
      .then(res => {
        setNotification({ open: true, type: "success", message: res.data.message });
        setOpenPassDialog(false);
        setPassword("");
        setNewPassword("");
      })
      .catch(err => {
        setNotification({ open: true, type: "error", message: err.response?.data?.message || "Mật khẩu sai." });
      });
  };

  return (
    <Box maxWidth="600px" mx="auto" mt={5}>
      <Typography variant="h5" gutterBottom fontWeight="bold">
        Thông tin Supervisor
      </Typography>
      <Paper elevation={3} sx={{ p: 3 }}>
        <TextField fullWidth label="Username" value={user.username} disabled margin="normal" />
        <TextField fullWidth label="Vai trò" value={user.role} disabled margin="normal" />
        <TextField fullWidth label="Email" value={user.email} disabled margin="normal" />

        <Box mt={3} display="flex" justifyContent="space-between" gap={2}>
          <Button variant="contained" onClick={() => setOpenEmailDialog(true)}>Thay đổi Email</Button>
          <Button variant="outlined" onClick={() => setOpenPassDialog(true)}>Thay đổi Mật khẩu</Button>
        </Box>
      </Paper>

      {/* Email Dialog */}
      <Dialog open={openEmailDialog} onClose={() => setOpenEmailDialog(false)}>
        <DialogTitle>Thay đổi Email</DialogTitle>
        <DialogContent>
          <TextField fullWidth label="Email mới" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} margin="normal" />
          <TextField fullWidth label="Mật khẩu hiện tại" type="password" value={password} onChange={(e) => setPassword(e.target.value)} margin="normal" />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEmailDialog(false)}>Huỷ</Button>
          <Button variant="contained" onClick={handleEmailUpdate}>Xác nhận</Button>
        </DialogActions>
      </Dialog>

      {/* Password Dialog */}
      <Dialog open={openPassDialog} onClose={() => setOpenPassDialog(false)}>
        <DialogTitle>Thay đổi Mật khẩu</DialogTitle>
        <DialogContent>
          <TextField fullWidth label="Mật khẩu hiện tại" type="password" value={password} onChange={(e) => setPassword(e.target.value)} margin="normal" />
          <TextField fullWidth label="Mật khẩu mới" type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} margin="normal" />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPassDialog(false)}>Huỷ</Button>
          <Button variant="contained" onClick={handlePasswordUpdate}>Xác nhận</Button>
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
