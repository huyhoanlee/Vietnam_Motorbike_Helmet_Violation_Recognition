import React, { useEffect, useState } from "react";
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Switch, Snackbar, Alert, IconButton, CircularProgress
} from "@mui/material";
import { Edit, Delete, Add } from "@mui/icons-material";
import { useForm } from "react-hook-form";
import axios from "axios";

interface Device {
  camera_id: string;
  device_name: string;
  location: string;
  status: boolean;
}

const API_BASE_URL = "https://hanaxuan-backend.hf.space/api/cameras";

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
    reset(device || { camera_id: "", device_name: "", location: "", status: true });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => setOpenDialog(false);

  const onSubmit = async (data: Device) => {
    try {
      if (editingDevice) {
        await axiosInstance.put(`${API_BASE_URL}`, { ...data, user_id: editingDevice.camera_id });
        setDevices((prev) => prev.map((d) => (d.camera_id === editingDevice.camera_id ? { ...d, ...data } : d)));
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
      await axiosInstance.delete(`${API_BASE_URL}`, { data: { camera_id: id } });
      setDevices((prev) => prev.filter((d) => d.camera_id !== id));
      setSnackbarMessage("Device deleted successfully!");
      setOpenSnackbar(true);
    } catch (err) {
      setSnackbarMessage("Failed to delete device.");
      setOpenSnackbar(true);
    }
  };

  return (
    <Paper sx={{ padding: 3, margin: 2 }}>
      <Button variant="contained" color="primary" startIcon={<Add />} onClick={() => handleOpenDialog()}>
        Add Device
      </Button>
      {loading ? (
        <CircularProgress />
      ) : (
        <TableContainer component={Paper} sx={{ marginTop: 2 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Camera ID</TableCell>
                <TableCell>Device Name</TableCell>
                <TableCell>Location</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {devices.map((device) => (
                <TableRow key={device.camera_id}>
                  <TableCell>{device.camera_id}</TableCell>
                  <TableCell>{device.device_name}</TableCell>
                  <TableCell>{device.location}</TableCell>
                  <TableCell>
                    <Switch
                      checked={device.status}
                      onChange={() =>
                        handleSubmit({ ...device, status: !device.status })
                      }
                    />
                  </TableCell>
                  <TableCell>
                    <IconButton color="primary" onClick={() => handleOpenDialog(device)}>
                      <Edit />
                    </IconButton>
                    <IconButton color="error" onClick={() => handleDelete(device.camera_id)}>
                      <Delete />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>{editingDevice ? "Edit Device" : "Add Device"}</DialogTitle>
        <DialogContent>
          <form onSubmit={handleSubmit(onSubmit)}>
            <TextField
              {...register("camera_id", { required: "Camera ID is required" })}
              label="Camera ID (URL format)"
              fullWidth
              margin="normal"
              error={!!errors.camera_id}
              helperText={errors.camera_id?.message}
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