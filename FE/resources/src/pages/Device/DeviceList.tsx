import React, { useEffect, useState } from "react";
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Switch, Snackbar, Alert, IconButton, CircularProgress,
  MenuItem, Tooltip, Typography, Fade
} from "@mui/material";
import { Edit, Add } from "@mui/icons-material";
import { useForm } from "react-hook-form";
import config from "../../config";
import axiosInstance from "../../services/axiosInstance.tsx";
const API_BASE_URL = `${config.API_URL}`;

interface Device {
  url_input: string,
  camera_id: string;
  device_name: string;
  location_id: number;
  location?: string;
  status: "active" | "deactive";
  note: string;
  last_active: Date;
}
// interface DeviceFormData {
//   url_input: string;
//   device_name: string;
//   location: string; 
//   status: "active" | "deactive";
//   note: string;
//   camera_id: string;
// }


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
  const [locations, setLocations] = useState<{ id: number; name: string }[]>([]);
  
  useEffect(() => {
  const fetchLocations = async () => {
    try {
      const res = await axiosInstance.get(`${API_BASE_URL}locations/get-all/`);
      setLocations(res.data.data); 
    } catch (err) {
      console.error("Failed to fetch locations", err);
    }
  };

  fetchLocations();
}, []);

  useEffect(() => {
    const fetchDevices = async () => {
      try {
        const res = await axiosInstance.get(`${API_BASE_URL}cameras/get-all/`);
        setDevices(res.data.data);
      } catch (err) {
        setSnackbarMessage("Failed to fetch devices.");
        setOpenSnackbar(true);
      } finally {
        setLoading(false);
      }
    };
    fetchDevices();
  }, []);

const handleOpenDialog = (device: Device | null = null) => {
  console.log("Opening dialog", device); 
  setEditingDevice(device);

  if (device) {
    reset({
      ...device,
      location: device.location_id ? device.location_id.toString() : "",
    });
  } else {
    reset({
      url_input: "",
      device_name: "",
      location: "Location",
      status: "active",
      note: "",
      camera_id: "", 
    });
  }

  setOpenDialog(true);
};

  const handleCloseDialog = () => setOpenDialog(false);

  const onSubmit = async (data: Device) => {
    try {
       const existingDevice = devices.find(
        (device) => 
          device.camera_id === data.camera_id ||
          device.device_name == data.device_name
       );

       if (existingDevice && !editingDevice){
        setSnackbarMessage("Device already exists.");
        setOpenSnackbar(true);
        return;
       }

       const changes: Partial<Device> = {};
if (editingDevice) {
  const changes: Partial<Device> = {};

  if (data.device_name && data.device_name !== editingDevice.device_name) {
    changes.device_name = data.device_name;
  }
  if (data.camera_id && data.camera_id !== editingDevice.camera_id) {
    changes.camera_id = data.camera_id;
  }
  if (data.location && data.location !== editingDevice.location_id.toString()) {
    changes.location = data.location;
  }

  if (Object.keys(changes).length === 0) {
    setSnackbarMessage("No changes were made. Please modify at least one field.");
    setOpenSnackbar(true);
    return;
  }

  // Tạo payload chỉ gồm các trường thay đổi
  const payload: Record<string, any> = {};
  if (changes.device_name) payload.device_name = changes.device_name;
  if (changes.camera_id) payload.camera_id = changes.camera_id;
  if (changes.location) payload.location_id = Number(changes.location);

  await axiosInstance.patch(`${API_BASE_URL}cameras/update/${editingDevice.camera_id}/`, payload);

  // Update lại local state
  setDevices((prev) =>
    prev.map((d) =>
      d.camera_id === editingDevice.camera_id ? { ...d, ...payload } : d
    )
  );
  setSnackbarMessage("Device updated successfully!");
}else{
         await axiosInstance.post(`${API_BASE_URL}cameras/create/`, {
          ...data,
          location_id: Number(data.location),
          });
        const refreshed = await axiosInstance.get(`${API_BASE_URL}cameras/get-all/`);
        setDevices(refreshed.data.data);
        setSnackbarMessage("Device added successfully!");
       }
        setOpenSnackbar(true);
        handleCloseDialog();
      } catch (err) {
        console.error("Error adding/updating device: ", err);
        setSnackbarMessage("Error processing request.");
        setOpenSnackbar(true);
      }
  };

  // const handleDelete = async (id: string) => {
  //   try {
  //     await axiosInstance.delete(`${API_BASE_URL}${id}/`);
  //     setDevices((prev) => prev.filter((d) => d.id !== id));
  //     setSnackbarMessage("Device deleted successfully!");
  //     setOpenSnackbar(true);
  //   } catch (err) {
  //     setSnackbarMessage("Failed to delete device.");
  //     setOpenSnackbar(true);
  //   }
  // };

  const handleStatusChange = async (device: Device) => {
    const updatedStatus = device.status === "active" ? "deactive" : "active";
    try {
      await axiosInstance.put(`${API_BASE_URL}cameras/change-status/${device.camera_id}/`, {
        ...device,
        status: updatedStatus,
        last_active: new Date().toISOString(),
      });
      setDevices((prev) =>
        prev.map((d) => (d.camera_id === device.camera_id ? { ...d, status: updatedStatus } : d))
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
                {/* <TableCell><b>Actions</b></TableCell> */}
              </TableRow>
            </TableHead>
            <TableBody>
              {devices.map((device) => (
                <TableRow key={device.camera_id} hover>
                  <TableCell>{device.camera_id}</TableCell>
                  <TableCell>{device.device_name}</TableCell>
                  <TableCell>
                  {device.location}
                </TableCell>
                  <TableCell>
                    <Switch
                      checked={device.status === "active"}
                      onChange={() => handleStatusChange(device)}
                    />
                  </TableCell>
                  {/* <TableCell>
                    <Tooltip title="Edit">
                      <IconButton color="primary" onClick={() => handleOpenDialog(device)}>
                        <Edit />
                      </IconButton>
                    </Tooltip> */}
                    {/* <Tooltip title="Delete">
                      <IconButton color="error" onClick={() => handleDelete(device.id)}>
                        <Delete />
                      </IconButton>
                    </Tooltip> */}
                  {/* </TableCell> */}
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
              {...register("url_input", 
                { 
                  required: "Camera URL is required",  pattern: {
                    value: /^(https?:\/\/)?([\w.-]+)+(:\d+)?(\/([\w/_-]+)?)*\/?(\?.*)?$/,
                    message: "Invalid URL format",
                  },})}
              label="Camera URL format"
              fullWidth
              margin="normal"
              error={!!errors.url_input}
              helperText={errors.url_input?.message}
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
              select
              fullWidth
              margin="normal"
              error={!!errors.location}
              helperText={errors.location?.message}
            >
              {locations.map((loc) => (
                <MenuItem key={loc.id} value={loc.id}>
                  {loc.name}
                </MenuItem>
              ))}
            </TextField>
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
