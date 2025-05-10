import React, { useEffect, useState } from "react";
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField,Snackbar, Alert, IconButton, 
  MenuItem, Tooltip, Typography, Box, Grid, Card, CardContent,
  Chip, Divider, Fade, useTheme, Skeleton,
  Pagination, FormControl, InputLabel, Select, InputAdornment
} from "@mui/material";
import {
  Edit, Add, FilterList, Search, Refresh, Check,
  CameraAlt, LocationOn, ToggleOn, Info,
} from "@mui/icons-material";
import { useForm, Controller } from "react-hook-form";
import config from "../../config.tsx";
import axiosInstance from "../../services/axiosInstance.tsx";
import { alpha } from "@mui/material/styles";

const API_BASE_URL = `${config.API_URL}`;

interface Device {
  url_input: string;
  camera_id: number;
  device_name: string;
  location_id: number;
  location?: string;
  status: "Active" | "Deactive";
  note: string;
  last_active: Date | null;
}

interface DeviceFormData {
  url_input: string;
  device_name: string;
  location: string | number;
  status: "Active" | "Deactive";
  note: string;
  camera_id?: string;
}

const DeviceManagement: React.FC = () => {
  const theme = useTheme();
  
  const [devices, setDevices] = useState<Device[]>([]);
  const [filteredDevices, setFilteredDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error" | "info" | "warning">("success");
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "deactive" | "inactive">("all");
  const [locations, setLocations] = useState<{ id: number; name: string }[]>([]);
  const [page, setPage] = useState(1);
  const [rowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  
  const { handleSubmit, reset, control, formState: { errors, isValid } } = useForm<DeviceFormData>({
    mode: "onChange",
    defaultValues: {
      url_input: "",
      device_name: "",
      location: "",
      status: "Active",
      note: "",
    }
  });

  // Fetch locations
  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const res = await axiosInstance.get(`${API_BASE_URL}locations/get-all/`);
        setLocations(res.data.data);
      } catch (err) {
        console.error("Failed to fetch locations", err);
        showSnackbar("Failed to fetch locations.", "error");
      }
    };

    fetchLocations();
  }, []);

  // Fetch devices
  const fetchDevices = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(`${API_BASE_URL}cameras/get-all/`);
      
      // Check if the response has the expected format
      if (res.data && Array.isArray(res.data.data)) {
        // Sort by camera_id (highest first)
        const sortedDevices = [...res.data.data].sort((a, b) => {
          // Sort devices by newest/highest camera_id first
          return b.camera_id - a.camera_id;
        });

        // Group devices by status after sorting by camera_id
        const activeDevices = sortedDevices.filter(device => 
          device.status === "Active"
        );
        const inactiveDevices = sortedDevices.filter(device => 
          device.status === "Deactive"
        );
        
        // Combine the filtered arrays with active devices first
        const groupedDevices = [...activeDevices, ...inactiveDevices];
        
        setDevices(groupedDevices);
        applyFilters(groupedDevices, searchTerm, statusFilter);
        setTotalCount(res.data.data.length);
      } else {
        setDevices([]);
        setFilteredDevices([]);
        setTotalCount(0);
        console.error("Invalid response format:", res.data);
      }
    } catch (err) {
      console.error("Failed to fetch devices", err);
      showSnackbar("Failed to fetch devices.", "error");
      setDevices([]);
      setFilteredDevices([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  // Apply filters to devices
  const applyFilters = (deviceList: Device[], search: string, status: string) => {
    let filtered = deviceList;
    
    if (search) {
      filtered = filtered.filter(device => 
        device.device_name.toLowerCase().includes(search.toLowerCase()) ||
        device.camera_id.toString().includes(search) ||
        (device.location && device.location.toLowerCase().includes(search.toLowerCase()))
      );
    }
    
    if (status !== "all") {
      filtered = filtered.filter(device => 
        (status === "active" && device.status === "Active") || 
        (status === "inactive" && device.status === "Deactive")
      );
    }
    
    // Group filtered devices by status (active first, then inactive)
    // while maintaining the camera_id sort within each group
    const activeFiltered = filtered.filter(device => 
      device.status === "Active"
    );
    const inactiveFiltered = filtered.filter(device => 
      device.status === "Deactive"
    );
    
    // Set the filtered devices with active first, then inactive
    setFilteredDevices([...activeFiltered, ...inactiveFiltered]);
  };

  useEffect(() => {
    applyFilters(devices, searchTerm, statusFilter);
  }, [searchTerm, statusFilter, devices]);

  const showSnackbar = (message: string, severity: "success" | "error" | "info" | "warning" = "success") => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setOpenSnackbar(true);
  };

  const handleOpenDialog = (device: Device | null = null) => {
    setEditingDevice(device);

    if (device) {
      reset({
        url_input: device.url_input || "",
        device_name: device.device_name || "",
        location: device.location_id || "",
        status: device.status || "Active",
        note: device.note || "",
        camera_id: device.camera_id.toString(),
      });
    } else {
      reset({
        url_input: "",
        device_name: "",
        location: "",
        status: "Active",
        note: "",
      });
    }

    setOpenDialog(true);
  };

  const handleCloseDialog = () => setOpenDialog(false);

  const refreshDevices = () => {
    setRefreshing(true);
    fetchDevices();
  };

  const handleStatusChange = async (device: Device) => {
    // Convert between active/inactive statuses
    // Keep the casing consistent with what's returned by the API
    const isActive = device.status === "Active";
    const updatedStatus = isActive ? "Deactive" : "Active";
      
    try {
      await axiosInstance.put(`${API_BASE_URL}cameras/change-status/${device.camera_id}/`, {
        status: updatedStatus,
      });
      
      // Update the device in the devices array
      const updatedDevices = devices.map(d => {
        if (d.camera_id === device.camera_id) {
          return { ...d, status: updatedStatus as "Active" | "Deactive" };
        }
        return d;
      });
      
      // Group devices by status
      const activeDevices = updatedDevices.filter(d => 
        d.status === "Active"
      );
      const inactiveDevices = updatedDevices.filter(d => 
        d.status === "Deactive"
      );
      
      // Combine with active first, maintaining camera_id sort within each group
      const sortedDevices = [...activeDevices, ...inactiveDevices];
      
      setDevices(sortedDevices);
      
      // Update filtered devices
      applyFilters(sortedDevices, searchTerm, statusFilter);
      
      showSnackbar(`Device ${device.device_name} is now ${updatedStatus === "Active" ? "active" : "inactive"}.`);
    } catch (err) {
      console.error("Failed to update device status", err);
      showSnackbar("Failed to update device status.", "error");
    }
  };

  const onSubmit = async (data: DeviceFormData) => {
    try {
      if (editingDevice) {
        // Editing existing device
        const changedFields: Partial<DeviceFormData> = {};
        
        if (data.device_name !== editingDevice.device_name) {
          changedFields.device_name = data.device_name;
        }
        
        if (data.url_input !== editingDevice.url_input) {
          changedFields.url_input = data.url_input;
        }
        
        if (data.location !== editingDevice.location_id) {
          changedFields.location = data.location;
        }
        
        if (data.status !== editingDevice.status) {
          changedFields.status = data.status;
        }
        
        if (data.note !== editingDevice.note) {
          changedFields.note = data.note;
        }

        if (Object.keys(changedFields).length === 0) {
          showSnackbar("No changes were made.", "info");
          handleCloseDialog();
          return;
        }

        const payload: Record<string, any> = {};
        if (changedFields.device_name) payload.device_name = changedFields.device_name;
        if (changedFields.url_input) payload.url_input = changedFields.url_input;
        if (changedFields.location) payload.location_id = Number(changedFields.location);
        if (changedFields.status) payload.status = changedFields.status;
        if (changedFields.note) payload.note = changedFields.note;

        await axiosInstance.patch(
          `${API_BASE_URL}cameras/update/${editingDevice.camera_id}/`, 
          payload
        );

        showSnackbar("Camera updated successfully!");
      } else {
        // Adding new device
        const existingDevice = devices.find(
          device => device.camera_id.toString() === data.camera_id || device.device_name === data.device_name
        );

        if (existingDevice) {
          showSnackbar("Camera with this ID or name already exists.", "error");
          return;
        }

        const response = await axiosInstance.post(`${API_BASE_URL}cameras/create/`, {
          ...data,
          location_id: Number(data.location),
        });

        // If we got a response with the new device, update the list directly
        if (response.data && response.data.data) {
          // Find the location name for the newly added device
          const locationObj = locations.find(loc => loc.id === Number(data.location));
          const locationName = locationObj ? locationObj.name : "";
          
          // Create a new device object
          const newDevice: Device = {
            ...response.data.data,
            location: locationName,
            status: response.data.data.status
          };
          
          // Add the new device and re-sort the array
          const updatedDevices = [newDevice, ...devices];
          
          // Group devices by status
          const activeDevices = updatedDevices.filter(d => 
            d.status === "Active"
          );
          const inactiveDevices = updatedDevices.filter(d => 
            d.status === "Deactive"
          );
          
          // Sort each group by camera_id (newest/highest first)
          activeDevices.sort((a, b) => b.camera_id - a.camera_id);
          inactiveDevices.sort((a, b) => b.camera_id - a.camera_id);
          
          // Combine the groups with active first
          const sortedDevices = [...activeDevices, ...inactiveDevices];
          
          setDevices(sortedDevices);
          
          // Update filtered devices
          applyFilters(sortedDevices, searchTerm, statusFilter);
          
          // Reset to first page to show the new device
          setPage(1);
        } else {
          // If we don't get the device back, refresh the full list
          await fetchDevices();
        }

        showSnackbar("Camera added successfully!");
      }
      
      handleCloseDialog();
      
      // Only do a full refresh if we're editing (the add case is handled above)
      if (editingDevice) {
        refreshDevices();
      }
    } catch (err) {
      console.error("Error processing device:", err);
      showSnackbar("Error processing request. Please try again.", "error");
    }
  };

  // Pagination
  const handleChangePage = (_event: React.ChangeEvent<unknown>, value: number) => {
    setPage(value);
  };

  const paginatedDevices = filteredDevices.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  const renderDeviceStatus = (status: string) => {
    return status === "Active" ? (
      <Chip
        label="Active"
        color="success"
        size="small"
        icon={<Check />}
        sx={{ 
          fontWeight: 'medium',
          '& .MuiChip-icon': { fontSize: 16 }
        }}
      />
    ) : (
      <Chip
        label="Inactive"
        color="error"
        size="small"
        variant="outlined"
        sx={{ fontWeight: 'medium' }}
      />
    );
  };

  return (
    <Paper 
      sx={{ 
        padding: { xs: 2, sm: 3, md: 4 }, 
        margin: { xs: 1, sm: 2, md: 3 }, 
        borderRadius: 3, 
        boxShadow: theme => `0 8px 24px ${alpha(theme.palette.primary.main, 0.1)}`,
        overflow: 'hidden',
      }}
    >
      {/* Header Section */}
      <Box 
        sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', sm: 'row' }, 
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', sm: 'center' },
          mb: 3
        }}
      >
        <Box sx={{ mb: { xs: 2, sm: 0 } }}>
          <Typography variant="h5" fontWeight="700" gutterBottom color="primary.main" sx={{ display: 'flex', alignItems: 'center' }}>
            <CameraAlt sx={{ mr: 1 }} /> Camera Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Monitor and manage your connected camera
          </Typography>
        </Box>
        
        <Button
          variant="contained"
          color="primary"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
          sx={{ 
            borderRadius: 2, 
            fontWeight: "bold", 
            textTransform: "none",
            boxShadow: 2,
            py: 1,
            px: 2
          }}
        >
          Add New Camera
        </Button>
      </Box>
      
      {/* Filter Section */}
      <Card 
        sx={{ 
          mb: 3, 
          borderRadius: 2,
          boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
          backgroundColor: theme => alpha(theme.palette.background.paper, 0.8),
        }}
      >
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={5}>
              <TextField
                fullWidth
                placeholder="Search by name, ID or location..."
                variant="outlined"
                size="small"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search color="action" />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel id="status-filter-label">Status</InputLabel>
                <Select
                  labelId="status-filter-label"
                  value={statusFilter}
                  label="Status"
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  startAdornment={
                    <InputAdornment position="start">
                      <FilterList fontSize="small" />
                    </InputAdornment>
                  }
                >
                  <MenuItem value="all">All Statuses</MenuItem>
                  <MenuItem value="active">Active</MenuItem>
                  <MenuItem value="inactive">Inactive</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={4} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Button
                variant="outlined"
                color="primary"
                startIcon={<Refresh />}
                onClick={refreshDevices}
                disabled={refreshing}
                sx={{ borderRadius: 2 }}
              >
                {refreshing ? 'Refreshing...' : 'Refresh'}
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* Devices Table Section */}
      {loading ? (
        <Box sx={{ mt: 2 }}>
          {[...Array(5)].map((_, idx) => (
            <Box key={idx} sx={{ display: 'flex', mb: 1 }}>
              <Skeleton variant="rectangular" width="100%" height={60} sx={{ borderRadius: 1 }} />
            </Box>
          ))}
        </Box>
      ) : filteredDevices.length === 0 ? (
        <Box sx={{ 
          textAlign: 'center', 
          py: 5, 
          backgroundColor: theme => alpha(theme.palette.background.paper, 0.5),
          borderRadius: 2
        }}>
          <Info sx={{ fontSize: 60, color: 'text.secondary', opacity: 0.4 }} />
          <Typography variant="h6" color="text.secondary" sx={{ mt: 2 }}>
            No devices found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {searchTerm || statusFilter !== 'all' 
              ? 'Try changing your search or filter criteria'
              : 'Start by adding a new camera'}
          </Typography>
        </Box>
      ) : (
        <>
          <TableContainer 
            component={Paper} 
            sx={{ 
              boxShadow: 'none',
              borderRadius: 2,
              overflow: 'hidden',
              border: '1px solid',
              borderColor: 'divider',
              '& .MuiTableCell-root': {
                borderColor: 'divider',
              }
            }}
          >
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: theme => alpha(theme.palette.primary.main, 0.05) }}>
                  <TableCell sx={{ fontWeight: 'bold' }}>Camera ID</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Camera Name</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', display: { xs: 'none', md: 'table-cell' } }}>Location</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedDevices.map((device) => (
                  <TableRow 
                    key={device.camera_id} 
                    hover 
                    sx={{
                      '&:hover': {
                        backgroundColor: theme => alpha(theme.palette.primary.main, 0.02),
                      }
                    }}
                  >
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {device.camera_id}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <CameraAlt fontSize="small" color="action" sx={{ mr: 1, opacity: 0.7 }} />
                        <Typography variant="body2">{device.device_name}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <LocationOn fontSize="small" color="action" sx={{ mr: 1, opacity: 0.7 }} />
                        <Tooltip title={device.location || "No location"} arrow placement="top">
                          <Typography 
                            variant="body2" 
                            sx={{ 
                              maxWidth: '250px',
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {device.location || "No location"}
                          </Typography>
                        </Tooltip>
                      </Box>
                    </TableCell>
                    <TableCell>
                      {renderDeviceStatus(device.status)}
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <Tooltip title={device.status === "Active" ? "Set as Inactive" : "Set as Active"}>
                          <IconButton 
                            size="small" 
                            color={device.status === "Active" ? "success" : "error"}
                            onClick={() => handleStatusChange(device)}
                            sx={{ 
                              border: 1, 
                              borderColor: 'divider',
                              '&:hover': {
                                backgroundColor: device.status === "Active" 
                                  ? alpha(theme.palette.error.main, 0.1)
                                  : alpha(theme.palette.success.main, 0.1)
                              }
                            }}
                          >
                            <ToggleOn />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit Camera">
                          <IconButton 
                            size="small" 
                            color="primary"
                            onClick={() => handleOpenDialog(device)}
                            sx={{ 
                              border: 1, 
                              borderColor: 'divider',
                              '&:hover': {
                                backgroundColor: alpha(theme.palette.primary.main, 0.1)
                              }
                            }}
                          >
                            <Edit />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          
          {/* Pagination */}
          {totalCount > rowsPerPage && (
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
              <Pagination 
                count={Math.ceil(filteredDevices.length / rowsPerPage)} 
                page={page} 
                onChange={handleChangePage}
                color="primary"
                shape="rounded"
                showFirstButton
                showLastButton
              />
            </Box>
          )}
          
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Showing {paginatedDevices.length} of {filteredDevices.length} devices
            </Typography>
            {searchTerm || statusFilter !== 'all' ? (
              <Button 
                size="small" 
                startIcon={<FilterList />}
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('all');
                }}
              >
                Clear filters
              </Button>
            ) : null}
          </Box>
        </>
      )}

      {/* Add/Edit Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog} 
        TransitionComponent={Fade}
        fullWidth
        maxWidth="sm"
        PaperProps={{
          elevation: 8,
          sx: {
            borderRadius: 2,
            px: { xs: 1, sm: 2 },
          }
        }}
      >
        <DialogTitle sx={{ 
          pb: 1, 
          pt: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          color: 'primary.main'
        }}>
          {editingDevice ? <Edit fontSize="small" /> : <Add fontSize="small" />}
          {editingDevice ? "Edit Camera" : "Add New Camera"}
        </DialogTitle>
        
        <Divider />
        
        <DialogContent sx={{ pt: 2 }}>
          <form id="device-form" onSubmit={handleSubmit(onSubmit)}>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Controller
                  name="url_input"
                  control={control}
                  rules={{ 
                    required: "Camera URL is required",
                    pattern: {
                      value: /^(https?:\/\/)?([\w.-]+)+(:\d+)?(\/([\w/_.-]+)?)*\/?(\?.*)?$/,
                      message: "Please enter a valid URL format"
                    }
                  }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Camera URL"
                      fullWidth
                      variant="outlined"
                      error={!!errors.url_input}
                      helperText={errors.url_input?.message}
                      placeholder="https://example.com/camera/stream"
                    />
                  )}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Controller
                  name="device_name"
                  control={control}
                  rules={{ required: "Camera name is required" }}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Camera Name"
                      fullWidth
                      variant="outlined"
                      error={!!errors.device_name}
                      helperText={errors.device_name?.message}
                      placeholder="Front Door Camera"
                    />
                  )}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <Controller
                  name="location"
                  control={control}
                  rules={{ required: "Location is required" }}
                  render={({ field }) => (
                    <FormControl fullWidth error={!!errors.location}>
                      <InputLabel id="location-label">Location</InputLabel>
                      <Select
                        {...field}
                        labelId="location-label"
                        label="Location"
                        displayEmpty
                        MenuProps={{
                          PaperProps: {
                            style: {
                              maxHeight: 300
                            }
                          }
                        }}
                      >
                        {locations.map((loc) => (
                          <MenuItem key={loc.id} value={loc.id}>
                            {loc.name}
                          </MenuItem>
                        ))}
                      </Select>
                      {errors.location && (
                        <Typography variant="caption" color="error">
                          {errors.location.message}
                        </Typography>
                      )}
                    </FormControl>
                  )}
                />
              </Grid>
              
              <Grid item xs={12}>
                <Controller
                  name="status"
                  control={control}
                  render={({ field }) => (
                    <FormControl fullWidth>
                      <InputLabel id="status-label">Status</InputLabel>
                      <Select
                        {...field}
                        labelId="status-label"
                        label="Status"
                      >
                        <MenuItem value="Active">Active</MenuItem>
                        <MenuItem value="Deactive">Inactive</MenuItem>
                      </Select>
                    </FormControl>
                  )}
                />
              </Grid>
              
              <Grid item xs={12}>
                <Controller
                  name="note"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Notes (Optional)"
                      fullWidth
                      variant="outlined"
                      multiline
                      rows={3}
                      placeholder="Additional information about this device..."
                    />
                  )}
                />
              </Grid>
            </Grid>
          </form>
        </DialogContent>
        
        <DialogActions sx={{ px: 3, pb: 2, pt: 1 }}>
          <Button 
            onClick={handleCloseDialog}
            variant="outlined"
            sx={{ borderRadius: 2 }}
          >
            Cancel
          </Button>
          <Button 
            type="submit"
            form="device-form"
            variant="contained"
            color="primary"
            sx={{ 
              borderRadius: 2,
              px: 3
            }}
            disabled={!isValid}
          >
            {editingDevice ? "Update" : "Add Device"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar 
        open={openSnackbar} 
        autoHideDuration={4000} 
        onClose={() => setOpenSnackbar(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setOpenSnackbar(false)} 
          severity={snackbarSeverity}
          variant="filled"
          sx={{ 
            width: '100%',
            boxShadow: 3,
            '& .MuiAlert-icon': {
              fontSize: '1.2rem'
            }
          }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Paper>
  );
};

export default DeviceManagement;