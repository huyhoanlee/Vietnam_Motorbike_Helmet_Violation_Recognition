import React, { useEffect, useState } from "react";
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, CircularProgress, IconButton, Snackbar, Alert,
  InputAdornment, Switch
} from "@mui/material";
import { Add, Visibility, VisibilityOff  } from "@mui/icons-material";
import { useForm } from "react-hook-form";
import axiosInstance from "../../services/axiosInstance";
import config from "../../config";

// Interface dữ liệu user
interface User {
  user_id: number;
  username: string;
  email: string;
  password: string;
  confirm_password: string;
  role: string | undefined;
  status: boolean | "Active" | "Deactive";
  // created_at: Date;
}

const roles = [
  { id: "admin", name: "Admin" },
  { id: "supervisor", name: "Supervisor" },
];

const API_BASE_URL = `${config.API_URL}accounts/`;

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { register, handleSubmit, reset, watch, formState: { errors } } = useForm<User>({
    mode: "onChange",
  });
  // Fetch danh sách users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await axiosInstance.get(`${API_BASE_URL}get-all/`);
        console.log("Fetched users:", res.data);
        setUsers(res.data.map((user: { id: number; }) => ({ ...user, user_id: user.id })));
      } catch (err) {
        setError("Failed to fetch users.");
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);


  const handleToggleActive = async (user_id: number, status: boolean) => {
    const userToUpdate = users.find((u) => u.user_id === user_id);
    if (!userToUpdate) return;

    const payload = {
      username: userToUpdate.username,
      email: userToUpdate.email,
      status: !status ? "Active" : "Deactive",
    };

    try {
      await axiosInstance.patch(`${API_BASE_URL}status/${user_id}/`, payload);
      setUsers((prev) =>
        prev.map((user) => (user.user_id === user_id ? { ...user, status: !status } : user))
      );
      setSnackbarMessage(`User ${!status ? "Activated" : "Deactivated"} successfully.`);
      setOpenSnackbar(true);
    } catch (err) {
      console.error(err);
      setSnackbarMessage("Failed to update user status.");
      setOpenSnackbar(true);
    }
  };
    // Xử lý mở popup thêm/sửa user
  const handleOpenDialog = (user?: User) => {
    console.log("Opening dialog with user:", user);
    reset(user || { username: "", email: "", password: "", confirm_password: "", role: "Supervisor" });
    setOpenDialog(true);
  };

  // Xử lý đóng popup
  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

 // Xử lý Submit Form (Thêm hoặc Sửa user)
const onSubmit = async (data: User) => {
  try {
    const existingUser = users.find(
      (user) =>
        user.username === data.username ||
        user.email === data.email
    );

    if (existingUser) {
      setSnackbarMessage("User with this username or email already exists.");
      setOpenSnackbar(true);
      return;
    }

    // So sánh dữ liệu cũ với dữ liệu mới để xác định thay đổi
    // const changes: Partial<User> = {};
    // if (editingUser) {
    //   if (data.username && data.username !== editingUser.username) {
    //     changes.username = data.username;
    //   }
    //   if (data.email && data.email !== editingUser.email) {
    //     changes.email = data.email;
    //   }
    //   if (data.role && data.role !== editingUser.role) {
    //     changes.role = roles.find((role) => role.id === data.role)?.name || data.role;
    //   }
    //   if (data.password) {
    //     changes.password = data.password;
    //   }

    //   // Kiểm tra nếu không có thay đổi
    //   if (Object.keys(changes).length === 0) {
    //     setSnackbarMessage("No changes detected. No update performed.");
    //     setOpenSnackbar(true);
    //     return;
    //   }

    //   // Thực hiện cập nhật nếu có thay đổi
    //    console.log("Updating user with:", changes);
    //   await axiosInstance.patch(`${API_BASE_URL}users/${editingUser.user_id}/`, changes);
    //   setUsers((prev) =>
    //     prev.map((u) => (u.user_id === editingUser.user_id ? { ...u, ...changes } : u))
    //   );
    //   setSnackbarMessage("User updated successfully!");
    // } else {
      // Thêm mới user
      const submitData = {
        ...data,
        role: roles.find((role) => role.id === data.role)?.name,
      };

      await axiosInstance.post(`${API_BASE_URL}register/`, submitData);
      const res = await axiosInstance.get(`${API_BASE_URL}get-all/`);
      setUsers(res.data.map((user: { id: number }) => ({ ...user, user_id: user.id })));

      setSnackbarMessage("User added successfully!");
    // }

    setOpenSnackbar(true);
    handleCloseDialog();
  } catch (err) {
    console.error("Error adding user:", err);
    setSnackbarMessage("Error processing request.");
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
                <TableCell>Account ID</TableCell>
                <TableCell>Username</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Status</TableCell>   
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.user_id}>
                  <TableCell>{user.user_id}</TableCell>
                  <TableCell>{user.username}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>{roles.find((role) => role.id === user.role)?.name || user.role}</TableCell>
                    <TableCell>
                    <Switch
                      checked={user.status === true || user.status === "Active"}
                       onChange={() => handleToggleActive(user.user_id, user.status === true || user.status === "Active")}
                      color="primary"
                    />
                  </TableCell>
                  
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Popup Form */}
      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>{"Add User"}</DialogTitle>
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
              {...register("email", { 
                required: "Email is required", 
                pattern: {value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/, message: "Invalid email format"} 
              })}
              label="Email"
              fullWidth
              margin="normal"
              error={!!errors.email}
              helperText={errors.email?.message}
            />
            <TextField
              {...register("password", { 
                required: "Password is required", 
                minLength: { value: 6, message: "Password must be at least 6 characters long." },
                pattern: {
                value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{6,}$/,
                message: "Password must include uppercase, lowercase, and a number."
                }
               })}  
              label="Password"
              type={showPassword ? "text" : "password"}
              fullWidth
              margin="normal"
              error={!!errors.password}
                  helperText={ errors.password?.message}
              InputProps={{
                endAdornment: ( 
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <Visibility /> : <VisibilityOff />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
              <TextField
              {...register("confirm_password", { 
                required:"Confirm password is required", 
                validate: (value) => value === watch("password") || "Passwords do not match"
               })}  
              label="Confirm password"
              type={showConfirmPassword ? "text" : "password"}
              fullWidth
              margin="normal"
              error={!!errors.confirm_password}
                  helperText={errors.confirm_password?.message}
              InputProps={{
                endAdornment: ( 
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                      {showConfirmPassword ? <Visibility /> : <VisibilityOff />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              {...register("role", { required: "Role is required" })}
              select
              label="Role"
              fullWidth
              margin="normal"
              error={!!errors.role}
              helperText={errors.role?.message}
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
