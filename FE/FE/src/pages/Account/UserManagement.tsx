import React, { useEffect, useState } from "react";
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, CircularProgress, IconButton, Snackbar, Alert
} from "@mui/material";
import { Edit, Delete, Add } from "@mui/icons-material";
import { useForm } from "react-hook-form";
import axios from "axios";

// Interface dữ liệu user
interface User {
  user_id: number;
  username: string;
  email: string;
  password: string;
  role_id: number;
  create_at: string;
}

const roles = [
  { id: 1, name: "Admin" },
  { id: 2, name: "Moderator" },
];

const API_BASE_URL = "https://hanaxuan-backend.hf.space/api/accounts";

// Tạo instance axios với token
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

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  const { register, handleSubmit, reset, formState: { errors } } = useForm<User>({
    mode: "onChange",
  });

  // Fetch danh sách users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await axiosInstance.get(API_BASE_URL);
        setUsers(res.data);
      } catch (err) {
        setError("Failed to fetch users.");
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  // Xử lý mở popup thêm/sửa user
  const handleOpenDialog = (user?: User) => {
    setEditingUser(user || null);
    reset(user || { username: "", email: "", password: "", role_id: 2 });
    setOpenDialog(true);
  };

  // Xử lý đóng popup
  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

 // Xử lý Submit Form (Thêm hoặc Sửa user)
const onSubmit = async (data: User) => {
  try {
    if (editingUser) {
      await axiosInstance.patch(`${API_BASE_URL}`, { ...data, user_id: editingUser.user_id });
      setUsers((prev) =>
        prev.map((u) => (u.user_id === editingUser.user_id ? { ...u, ...data } : u))
      );
      setSnackbarMessage("User updated successfully!");
    } else {
      const res = await axiosInstance.post(`${API_BASE_URL}/register`, data);
      setUsers((prev) => [...prev, res.data]);
      setSnackbarMessage("User added successfully!");
    }
    setOpenSnackbar(true);
    handleCloseDialog();
  } catch (err) {
    setSnackbarMessage("Error processing request.");
    setOpenSnackbar(true);
  }
};

// Xử lý xóa user
const handleDelete = async (id: number) => {
  try {
    await axiosInstance.delete(`${API_BASE_URL}`, { data: { user_id: id } });
    setUsers((prev) => prev.filter((u) => u.user_id !== id));
    setSnackbarMessage("User deleted successfully!");
    setOpenSnackbar(true);
  } catch (err) {
    setSnackbarMessage("Failed to delete user.");
    setOpenSnackbar(true);
  }
};

  return (
    <Paper sx={{ padding: 3, margin: 2 }}>
      <Button variant="contained" color="primary" startIcon={<Add />} onClick={() => handleOpenDialog()}>
        Add User
      </Button>
      {loading ? (
        <CircularProgress />
      ) : error ? (
        <p>{error}</p>
      ) : (
        <TableContainer component={Paper} sx={{ marginTop: 2 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Username</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.user_id}>
                  <TableCell>{user.username}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{roles.find((r) => r.id === user.role_id)?.name}</TableCell>
                  <TableCell>
                    <IconButton color="primary" onClick={() => handleOpenDialog(user)}>
                      <Edit />
                    </IconButton>
                    <IconButton color="error" onClick={() => handleDelete(user.user_id)}>
                      <Delete />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Popup Form */}
      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>{editingUser ? "Edit User" : "Add User"}</DialogTitle>
        <DialogContent>
          <form onSubmit={handleSubmit(onSubmit)}>
            <TextField
              {...register("username", { required: "Username is required" })}
              label="Username"
              fullWidth
              margin="normal"
              error={!!errors.username}
              helperText={errors.username?.message}
            />
            <TextField
              {...register("email", { required: "Email is required", pattern: /^\S+@\S+\.\S+$/ })}
              label="Email"
              fullWidth
              margin="normal"
              error={!!errors.email}
              helperText={errors.email?.message}
            />
            <TextField
              {...register("password", { required: "Password is required", minLength: 6 })}
              label="Password"
              type="password"
              fullWidth
              margin="normal"
              error={!!errors.password}
              helperText={errors.password?.message}
            />
            <TextField
              {...register("role_id", { required: "Role is required" })}
              select
              label="Role"
              fullWidth
              margin="normal"
            >
              {roles.map((role) => (
                <MenuItem key={role.id} value={role.id}>
                  {role.name}
                </MenuItem>
              ))}
            </TextField>
            <DialogActions>
              <Button onClick={handleCloseDialog}>Cancel</Button>
              <Button type="submit" variant="contained" color="primary">
                Save
              </Button>
            </DialogActions>
          </form>
        </DialogContent>
      </Dialog>

      <Snackbar open={openSnackbar} autoHideDuration={3000} onClose={() => setOpenSnackbar(false)}>
        <Alert severity="success">{snackbarMessage}</Alert>
      </Snackbar>
    </Paper>
  );
};

export default UserManagement;
