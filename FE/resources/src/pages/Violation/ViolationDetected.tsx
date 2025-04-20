import React, { useEffect, useState } from "react";
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Checkbox, IconButton, Typography, Box, Button, Collapse, CircularProgress,
  Snackbar, Alert, Dialog, DialogActions, DialogContent, DialogContentText,
  DialogTitle, TextField, InputAdornment, Select, MenuItem, Grid, Pagination
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import SearchIcon from "@mui/icons-material/Search";
import axios from "axios";
import ViolationDetail from "./ViolationDetails";
import { format } from "date-fns";

const API_BASE_URL = "https://hanaxuan-backend.hf.space/api/violations/";
const NOTIFICATION_API_URL = "https://hanaxuan-backend.hf.space/api/notifications";

const axiosInstance = axios.create();
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

interface Violation {
  id: number;
  location: string;
  camera_id: string;
  plate_number: string;
  status: string;
  detected_at: string;
  violation_image: string[];
  notified?: boolean;
}

interface Citizen {
  plate_number: string;
  email?: string;
}

const ViolationDetected: React.FC = () => {
  const [violations, setViolations] = useState<Violation[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [selectedViolations, setSelectedViolations] = useState<number[]>([]);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<"notifyAll" | "notifySelected">("notifyAll");
  const [citizens, setCitizens] = useState<Citizen[]>([]);
  const [searchPlate, setSearchPlate] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [sortOrder, setSortOrder] = useState("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const normalizeBase64Image = (data: string, format: "jpeg" | "png" = "jpeg") => {
  if (data.startsWith("data:image/")) return data;
  return `data:image/${format};base64,${data}`;
};

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axiosInstance.get(`${API_BASE_URL}get-all/`);
        const mappedViolations = response.data.data.map((v: any) => ({
          id: v.violation_id,
          plate_number: v.plate_number,
          camera_id: v.camera_id,
          detected_at: v.detected_at,
          status: v.status,
          location: "Unknown",
          violation_image: v.violation_image?.map((img: string) => normalizeBase64Image(img)) || [],
        }));
        setViolations(mappedViolations);

        const citizenResponse = await axiosInstance.get(
          "https://hanaxuan-backend.hf.space/api/car_parrots/get-all/"
        );
        setCitizens(citizenResponse.data);
      } catch (err) {
        setError("Failed to fetch data, please try again later.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredViolations = violations
    .filter((v) =>
      v.plate_number.toLowerCase().includes(searchPlate.toLowerCase())
    )
    .filter((v) =>
      filterStatus === "All" ? true : v.status === filterStatus
    )
    .sort((a, b) => {
      const dateA = new Date(a.detected_at).getTime();
      const dateB = new Date(b.detected_at).getTime();
      return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
    });

  const totalPages = Math.ceil(filteredViolations.length / itemsPerPage);
  const paginatedViolations = filteredViolations.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const toggleRow = (id: number) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  const handleSelectViolation = (id: number) => {
    setSelectedViolations((prevSelected) =>
      prevSelected.includes(id)
        ? prevSelected.filter((violationId) => violationId !== id)
        : [...prevSelected, id]
    );
  };

  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      const allIds = paginatedViolations.map((v) => v.id);
      setSelectedViolations(allIds);
    } else {
      setSelectedViolations([]);
    }
  };

  const handleNotifyAll = () => {
    setActionType("notifyAll");
    setConfirmDialogOpen(true);
  };

  const handleNotifySelected = () => {
    setActionType("notifySelected");
    setConfirmDialogOpen(true);
  };

  const handleConfirmAction = async () => {
    setConfirmDialogOpen(false);
    try {
      let toNotify: Violation[] = [];

      if (actionType === "notifyAll") {
        toNotify = filteredViolations;
      } else {
        toNotify = violations.filter((v) => selectedViolations.includes(v.id));
      }

      for (let violation of toNotify) {
        const citizen = citizens.find(
          (c) => c.plate_number === violation.plate_number
        );
        if (!citizen?.email) {
          setError(`No email found for ${violation.plate_number}`);
          setOpenSnackbar(true);
          continue;
        }

        await axiosInstance.post(NOTIFICATION_API_URL, {
          violation_id: violation.id,
          email: citizen.email,
          status: "notified",
        });

        setViolations((prev) =>
          prev.map((v) =>
            v.id === violation.id ? { ...v, notified: true } : v
          )
        );
      }

      setSnackbar({ open: true, message: "Notifications sent", severity: "success" });
    } catch (err) {
      setError("Failed to send notifications.");
      setOpenSnackbar(true);
    }
  };

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error",
  });

  return (
    <Box sx={{ padding: 4 }}>
      <Typography variant="h4" sx={{ fontWeight: "bold", mb: 2 }}>
        Violation Management
      </Typography>

      {loading ? (
        <CircularProgress />
      ) : error ? (
        <Typography color="error">{error}</Typography>
      ) : (
        <>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                variant="outlined"
                label="Search Plate Number"
                value={searchPlate}
                onChange={(e) => setSearchPlate(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </Grid>
            <Grid item xs={6} md={4}>
              <Select
                fullWidth
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                displayEmpty
              >
                <MenuItem value="All">All Status</MenuItem>
                <MenuItem value="AI detected">AI detected</MenuItem>
                <MenuItem value="Approved">Approved</MenuItem>
              </Select>
            </Grid>
            <Grid item xs={6} md={4}>
              <Select
                fullWidth
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                displayEmpty
              >
                <MenuItem value="desc">Newest First</MenuItem>
                <MenuItem value="asc">Oldest First</MenuItem>
              </Select>
            </Grid>
          </Grid>

          {selectedViolations.length > 0 && (
            <Button
              variant="contained"
              color="secondary"
              sx={{ mb: 2, borderRadius: "20px" }}
              onClick={handleNotifySelected}
            >
              Notify Selected
            </Button>
          )}
          <Button
            variant="outlined"
            onClick={handleNotifyAll}
            sx={{ float: "right", borderRadius: "20px" }}
          >
            Notify All
          </Button>

          <TableContainer component={Paper} sx={{ borderRadius: 2, mt: 3 }}>
            <Table>
              <TableHead sx={{ backgroundColor: "#f0f0f0" }}>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox
                      indeterminate={
                        selectedViolations.length > 0 &&
                        selectedViolations.length < paginatedViolations.length
                      }
                      checked={
                        paginatedViolations.length > 0 &&
                        selectedViolations.length === paginatedViolations.length
                      }
                      onChange={handleSelectAll}
                    />
                  </TableCell>
                  <TableCell>ID</TableCell>
                  <TableCell>Detection Address</TableCell>
                  <TableCell>Plate Number</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedViolations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      No violations match your filter.
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedViolations.map((violation) => (
                    <React.Fragment key={violation.id}>
                      <TableRow
                        sx={{
                          backgroundColor: violation.notified ? "#d1ffd6" : undefined,
                        }}
                      >
                        <TableCell padding="checkbox">
                          <Checkbox
                            checked={selectedViolations.includes(violation.id)}
                            onChange={() => handleSelectViolation(violation.id)}
                          />
                        </TableCell>
                        <TableCell>{violation.id}</TableCell>
                        <TableCell>{violation.location}</TableCell>
                        <TableCell>{violation.plate_number}</TableCell>
                        <TableCell sx={{ color: violation.status === "Critical" ? "red" : "orange" }}>
                          {violation.status}
                        </TableCell>
                        <TableCell>{format(violation.detected_at, "dd/MM/yyyy")}</TableCell>
                        <TableCell align="center">
                          <IconButton onClick={() => toggleRow(violation.id)}>
                            <ExpandMoreIcon
                              sx={{
                                transform: expandedRow === violation.id ? "rotate(180deg)" : "rotate(0deg)",
                                transition: "0.3s",
                              }}
                            />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell colSpan={7} sx={{ padding: 0 }}>
                          <Collapse in={expandedRow === violation.id} timeout="auto" unmountOnExit>
                            <ViolationDetail 
                            violation={violation}
                            onStatusUpdate={(id, newStatus) => {
                              setViolations((prev) =>
                                prev.map((v) =>
                                  v.id === id ? { ...v, status: newStatus } : v
                                )
                              );
                            }}
                             />
                          </Collapse>
                        </TableCell>
                      </TableRow>
                    </React.Fragment>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <Box display="flex" justifyContent="center" mt={4}>
            <Pagination
              count={totalPages}
              page={currentPage}
              onChange={(_, page) => setCurrentPage(page)}
              color="primary"
            />
          </Box>

          <Snackbar
            open={openSnackbar}
            autoHideDuration={3000}
            onClose={() => setOpenSnackbar(false)}
          >
            <Alert severity="error">{error}</Alert>
          </Snackbar>
        </>
      )}

      {/* Confirm Dialog */}
      <Dialog open={confirmDialogOpen} onClose={() => setConfirmDialogOpen(false)}>
        <DialogTitle>Confirm Action</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {actionType === "notifyAll"
              ? "Are you sure you want to notify all filtered violations?"
              : `Are you sure you want to notify ${selectedViolations.length} selected violations?`}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleConfirmAction} color="primary">
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ViolationDetected;
