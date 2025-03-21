import React, { useEffect, useState } from "react";
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Switch, Snackbar, Alert, IconButton, CircularProgress,
  MenuItem, Tooltip, Typography, Slide, Fade
} from "@mui/material";
import { Edit, Delete, Add } from "@mui/icons-material";
import { useForm } from "react-hook-form";
import axios from "axios";

interface Device {
  id: string;
  device_name: string;
  location: string;
  status: "active" | "deactive";
  note: string;
  last_active: Date;
}

const API_BASE_URL = "https://hanaxuan-backend.hf.space/api/cameras/";

const axiosInstance = axios.create();
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const DeviceManagement: React.FC = () => {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const { register, handleSubmit, reset, formState: { errors } } = useForm<Device>({
    mode: "onChange",
  });

  useEffect(() => {
    const fetchDevices = async () => {
      try {
        const res = await axiosInstance.get(API_BASE_URL);
        setDevices(res.data);
      } catch (err) {
        setSnackbarMessage("Failed to fetch devices.");
        setOpenSnackbar(true);
      } finally {
        setLoading(false);
      }
    };
    fetchDevices();
  }, []);

  const handleOpenDialog = (device?: Device) => {
    setEditingDevice(device || null);
    reset(device || { id: "", device_name: "", location: "", status: "active", note: "" });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => setOpenDialog(false);

  const onSubmit = async (data: Device) => {
    try {
      if (editingDevice) {
        await axiosInstance.patch(`${API_BASE_URL}${editingDevice.id}/`, {
          ...data,
          last_active: new Date().toISOString(),
        });
        setDevices((prev) =>
          prev.map((d) => (d.id === editingDevice.id ? { ...d, ...data } : d))
        );
        setSnackbarMessage("Device updated successfully!");
      } else {
        const res = await axiosInstance.post(API_BASE_URL, data);
        setDevices((prev) => [...prev, res.data]);
        setSnackbarMessage("Device added successfully!");
      }
      setOpenSnackbar(true);
      handleCloseDialog();
    } catch (err) {
      setSnackbarMessage("Error processing request.");
      setOpenSnackbar(true);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await axiosInstance.delete(`${API_BASE_URL}${id}/`);
      setDevices((prev) => prev.filter((d) => d.id !== id));
      setSnackbarMessage("Device deleted successfully!");
      setOpenSnackbar(true);
    } catch (err) {
      setSnackbarMessage("Failed to delete device.");
      setOpenSnackbar(true);
    }
  };

  const handleStatusChange = async (device: Device) => {
    const updatedStatus = device.status === "active" ? "deactive" : "active";
    try {
      await axiosInstance.patch(`${API_BASE_URL}${device.id}/`, {
        ...device,
        status: updatedStatus,
        last_active: new Date().toISOString(),
      });
      setDevices((prev) =>
        prev.map((d) => (d.id === device.id ? { ...d, status: updatedStatus } : d))
      );
      setSnackbarMessage("Device status updated successfully!");
      setOpenSnackbar(true);
    } catch (err) {
      setSnackbarMessage("Failed to update device status.");
      setOpenSnackbar(true);
    }
  };

  return (
    <Paper sx={{ padding: 4, margin: 3, borderRadius: 3, boxShadow: 4 }}>
      <Typography variant="h5" fontWeight="bold" gutterBottom>
        Device Management
      </Typography>
      <Button
        variant="contained"
        color="primary"
        startIcon={<Add />}
        onClick={() => handleOpenDialog()}
        sx={{ borderRadius: 2, fontWeight: "bold", textTransform: "none" }}
      >
        Add Device
      </Button>

      {loading ? (
        <CircularProgress sx={{ display: "block", margin: "20px auto" }} />
      ) : (
        <TableContainer component={Paper} sx={{ marginTop: 3, borderRadius: 3 }}>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                <TableCell><b>Device ID</b></TableCell>
                <TableCell><b>Device Name</b></TableCell>
                <TableCell><b>Location</b></TableCell>
                <TableCell><b>Status</b></TableCell>
                <TableCell><b>Actions</b></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {devices.map((device) => (
                <TableRow key={device.id} hover>
                  <TableCell>{device.id}</TableCell>
                  <TableCell>{device.device_name}</TableCell>
                  <TableCell>{device.location}</TableCell>
                  <TableCell>
                    <Switch
                      checked={device.status === "active"}
                      onChange={() => handleStatusChange(device)}
                    />
                  </TableCell>
                  <TableCell>
                    <Tooltip title="Edit">
                      <IconButton color="primary" onClick={() => handleOpenDialog(device)}>
                        <Edit />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete">
                      <IconButton color="error" onClick={() => handleDelete(device.id)}>
                        <Delete />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={openDialog} onClose={handleCloseDialog} TransitionComponent={Fade}>
        <DialogTitle>{editingDevice ? "Edit Device" : "Add Device"}</DialogTitle>
        <DialogContent>
          <form onSubmit={handleSubmit(onSubmit)}>
            <TextField
              {...register("id", { required: "Camera ID is required" })}
              label="Camera ID (URL format)"
              fullWidth
              margin="normal"
              error={!!errors.id}
              helperText={errors.id?.message}
            />
            <TextField
              {...register("device_name", { required: "Device Name is required" })}
              label="Device Name"
              fullWidth
              margin="normal"
              error={!!errors.device_name}
              helperText={errors.device_name?.message}
            />
            <TextField
              {...register("location", { required: "Location is required" })}
              label="Location"
              fullWidth
              margin="normal"
              error={!!errors.location}
              helperText={errors.location?.message}
            />
            <TextField
              {...register("status", { required: "Status is required" })}
              label="Status"
              select
              fullWidth
              margin="normal"
            >
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="deactive">Deactive</MenuItem>
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

export default DeviceManagement;
