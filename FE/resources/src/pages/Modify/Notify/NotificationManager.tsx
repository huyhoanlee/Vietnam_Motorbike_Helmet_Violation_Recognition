import React, { useEffect, useState } from "react";
import {
  Box, Typography, Paper, Button, Snackbar, Alert, Dialog,
  DialogTitle, DialogContent, DialogActions, MenuItem, Select, FormControl, InputLabel
} from "@mui/material";
import axios from "axios";
import { DataGrid, GridColDef } from "@mui/x-data-grid";

const API_BASE = "https://hanaxuan-backend.hf.space/api/notifications/";

const axiosInstance = axios.create();
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const NotificationManager = () => {
  const [notifications, setNotifications] = useState([]);
  const [filterType, setFilterType] = useState("all");
  const [filterValue, setFilterValue] = useState("");
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" });
  const [confirmDialog, setConfirmDialog] = useState({ open: false, notificationId: null });

  useEffect(() => {
    fetchNotifications();
  }, [filterType, filterValue]);

  const fetchNotifications = async () => {
    let url = API_BASE;
    if (filterType === "violation") {
      url += "search-by-violation/";
    } else if (filterType === "status") {
      url += "search-by-status/";
    } else {
      url += "view_all/";
    }

    try {
      const response = await axiosInstance.get(url);
      setNotifications(response.data.data);
    } catch (error) {
      setSnackbar({ open: true, message: "Lỗi khi tải dữ liệu.", severity: "error" });
    }
  };

  const handleResend = async (id) => {
    try {
      const response = await axiosInstance.post(`${API_BASE}re-sent/${id}`);
      setSnackbar({ open: true, message: response.data.message, severity: "success" });
    } catch (error) {
      setSnackbar({ open: true, message: "Gửi lại thất bại.", severity: "error" });
    }
    setConfirmDialog({ open: false, notificationId: null });
  };

  const columns: GridColDef[] = [
    { field: "notification_id", headerName: "ID", width: 90 },
    { field: "status", headerName: "Trạng thái", width: 150 },
    {
      field: "created_at",
      headerName: "Ngày tạo",
      width: 200,
      valueFormatter: (params) => new Date(params.value).toLocaleString("vi-VN"),
    },
    {
      field: "actions",
      headerName: "Hành động",
      width: 150,
      renderCell: (params) => (
        <Button
          variant="contained"
          color="primary"
          onClick={() => setConfirmDialog({ open: true, notificationId: params.row.notification_id })}
        >
          Gửi lại
        </Button>
      ),
    },
  ];

  return (
    <Box p={4}>
      <Typography variant="h4" gutterBottom>
        Quản lý Thông báo Vi phạm
      </Typography>

      <Box mb={2} display="flex" gap={2}>
        <FormControl>
          <InputLabel>Lọc theo</InputLabel>
          <Select
            value={filterType}
            label="Lọc theo"
            onChange={(e) => setFilterType(e.target.value)}
            style={{ width: 200 }}
          >
            <MenuItem value="all">Tất cả</MenuItem>
            <MenuItem value="violation">Vi phạm</MenuItem>
            <MenuItem value="status">Trạng thái</MenuItem>
          </Select>
        </FormControl>
        {(filterType === "violation" || filterType === "status") && (
          <TextField
            label={filterType === "violation" ? "ID Vi phạm" : "Trạng thái"}
            value={filterValue}
            onChange={(e) => setFilterValue(e.target.value)}
          />
        )}
      </Box>

      <Paper style={{ height: 500, width: "100%" }}>
        <DataGrid rows={notifications} columns={columns} pageSize={10} />
      </Paper>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>

      <Dialog
        open={confirmDialog.open}
        onClose={() => setConfirmDialog({ open: false, notificationId: null })}
      >
        <DialogTitle>Xác nhận gửi lại</DialogTitle>
        <DialogContent>
          Bạn có chắc chắn muốn gửi lại thông báo này?
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog({ open: false, notificationId: null })}>
            Hủy
          </Button>
          <Button
            onClick={() => handleResend(confirmDialog.notificationId)}
            variant="contained"
            color="primary"
          >
            Gửi lại
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default NotificationManager;
