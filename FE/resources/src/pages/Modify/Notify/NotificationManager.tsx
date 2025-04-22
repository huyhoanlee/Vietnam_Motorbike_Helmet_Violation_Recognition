import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Snackbar,
  Alert,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  TextField,
  SelectChangeEvent,
} from "@mui/material";
import { DataGrid, GridColDef, GridRowsProp } from "@mui/x-data-grid";
import axiosInstance from "../../../services/axiosInstance";
import config from "../../../config";
import dayjs from "dayjs";

const API_BASE = `${config.API_URL}notifications/`;

type Notification = {
  notification_id: number;
  status: string;
  created_at: string;
};

type SnackbarState = {
  open: boolean;
  message: string;
  severity: "success" | "error" | "info" | "warning";
};

const NotificationManager = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filterType, setFilterType] = useState<"all" | "violation" | "status">("all");
  const [filterValue, setFilterValue] = useState<string>("");
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: "",
    severity: "success",
  });

  useEffect(() => {
    fetchNotifications();
  }, [filterType, filterValue]);

  const fetchNotifications = async () => {
    try {
      let response;

      if (filterType === "violation") {
        if (!filterValue.trim()) {
          setNotifications([]);
          return;
        }

        response = await axiosInstance.get(`${API_BASE}search-by-violation/`, {
          params: { violation_id: filterValue },
        });
      } else if (filterType === "status") {
        response = await axiosInstance.get(`${API_BASE}search-by-status/`, {
          params: { status: filterValue },
        });
      } else {
        response = await axiosInstance.get(`${API_BASE}view_all/`);
      }

      const data: Notification[] = response.data.data || [];
      setNotifications(data);
    } catch (error) {
      console.error("Error fetching notifications:", error);
      setSnackbar({
        open: true,
        message: "Failed to load notifications.",
        severity: "error",
      });
    }
  };

 const columns: GridColDef[] = [
  { field: "notification_id", headerName: "Notification ID", width: 160 },
  { field: "status", headerName: "Status", width: 160 },
  {
    field: "created_at",
    headerName: "Created At",
    width: 220,
    valueFormatter: (params: { value: string }) =>
      dayjs(params.value).format("DD/MM/YYYY HH:mm:ss"),
  },
];

  const rows: GridRowsProp = notifications.map((item) => ({
    id: item.notification_id,
    ...item,
  }));

  const handleFilterChange = (event: SelectChangeEvent) => {
    const selected = event.target.value as "all" | "violation" | "status";
    setFilterType(selected);
    setFilterValue("");
  };

  return (
    <Box p={4}>
      <Typography variant="h4" gutterBottom>
        Notification Manager
      </Typography>

      <Box mb={3} display="flex" gap={2}>
        <FormControl size="small" style={{ minWidth: 160 }}>
          <InputLabel>Filter By</InputLabel>
          <Select value={filterType} label="Filter By" onChange={handleFilterChange}>
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="violation">Violation ID</MenuItem>
            <MenuItem value="status">Status</MenuItem>
          </Select>
        </FormControl>

        {(filterType === "violation" || filterType === "status") && (
          <TextField
            size="small"
            label={filterType === "violation" ? "Violation ID" : "Status"}
            value={filterValue}
            onChange={(e) => setFilterValue(e.target.value)}
          />
        )}
      </Box>

      <Paper elevation={3} style={{ height: 500, width: "100%" }}>
        <DataGrid
          rows={rows}
          columns={columns}
          paginationModel={{ pageSize: 10, page: 0 }}
          pageSizeOptions={[5, 10, 20]}
        />
      </Paper>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} variant="filled">
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default NotificationManager;
