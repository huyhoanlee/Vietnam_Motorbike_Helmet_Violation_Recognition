import React, { useState } from "react";
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField, IconButton, Collapse, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper } from "@mui/material";
import { ExpandMore, ExpandLess, Edit, Add } from "@mui/icons-material";

interface Device {
  id: string;
  name: string;
  location: string;
  status: string;
  lastActive: string;
  note: string;
}

const devicesData: Device[] = [
  { id: "C01", name: "Camera site A", location: "FPT University", status: "Active", lastActive: "Now", note: "Stable" },
  { id: "C02", name: "Camera site B", location: "FPT School", status: "Disconnected", lastActive: "17/01/2025", note: "Maintenance" },
];

const DeviceList: React.FC = () => {
  const [devices, setDevices] = useState(devicesData);
  const [openPopup, setOpenPopup] = useState(false);
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleEdit = (device: Device) => {
    setEditingDevice(device);
    setOpenPopup(true);
  };

  const handleAddNew = () => {
    setEditingDevice(null);
    setOpenPopup(true);
  };

  const handleClose = () => {
    setOpenPopup(false);
  };

  const handleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>List of Devices</h2>
      <Button variant="contained" color="primary" startIcon={<Add />} onClick={handleAddNew}>
        Add a Device
      </Button>
      <TableContainer component={Paper} style={{ marginTop: 20 }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Device ID</TableCell>
              <TableCell>Device Name</TableCell>
              <TableCell>Location</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Last Active</TableCell>
              <TableCell>Note</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {devices.map((device) => (
              <React.Fragment key={device.id}>
                <TableRow>
                  <TableCell>{device.id}</TableCell>
                  <TableCell>{device.name}</TableCell>
                  <TableCell>{device.location}</TableCell>
                  <TableCell>{device.status}</TableCell>
                  <TableCell>{device.lastActive}</TableCell>
                  <TableCell>{device.note}</TableCell>
                  <TableCell>
                    <IconButton onClick={() => handleExpand(device.id)}>
                      {expandedId === device.id ? <ExpandLess /> : <ExpandMore />}
                    </IconButton>
                    <IconButton onClick={() => handleEdit(device)}>
                      <Edit />
                    </IconButton>
                  </TableCell>
                </TableRow>
                <TableRow>
                  <TableCell colSpan={7} style={{ padding: 0 }}>
                    <Collapse in={expandedId === device.id} timeout="auto" unmountOnExit>
                      <Paper style={{ padding: 20, margin: 10, background: "#f5f5f5" }}>
                        <strong>Device Details</strong>
                        <p>Device ID: {device.id}</p>
                        <p>Device Name: {device.name}</p>
                        <p>Location: {device.location}</p>
                        <p>Status: {device.status}</p>
                        <Button variant="contained" onClick={() => handleEdit(device)}>
                          Edit Device
                        </Button>
                      </Paper>
                    </Collapse>
                  </TableCell>
                </TableRow>
              </React.Fragment>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Edit/Add Popup */}
      <Dialog open={openPopup} onClose={handleClose} fullWidth>
        <DialogTitle>{editingDevice ? "Edit Device" : "Add New Device"}</DialogTitle>
        <DialogContent>
          <TextField label="Device Name" fullWidth margin="dense" defaultValue={editingDevice?.name} />
          <TextField label="Location" fullWidth margin="dense" defaultValue={editingDevice?.location} />
          <TextField label="Status" fullWidth margin="dense" defaultValue={editingDevice?.status} />
          <TextField label="Last Active" fullWidth margin="dense" defaultValue={editingDevice?.lastActive} />
          <TextField label="Note" fullWidth margin="dense" defaultValue={editingDevice?.note} />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button variant="contained" color="primary">Save</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default DeviceList;
