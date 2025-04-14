import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  Box,
  Typography,
  Button,
  Card,
  CardMedia,
  CardContent,
  Grid,
  MenuItem,
  Select,
  CircularProgress,
  Snackbar,
  Alert,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';


const axiosInstance = axios.create();
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});


interface ViolationDetailProps {
  violation: {
    id: number;
    location: string;
    camera_id: string;
    plate_number: string;
    status: string;
    detected_at: string;
    image_url: string;
  };
}

const ViolationDetail: React.FC<ViolationDetailProps> = ({ violation }) => {
  const [statusOptions, setStatusOptions] = useState<{ id: number, status_name: string }[]>([]);
  const [selectedStatusId, setSelectedStatusId] = useState<number | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>(violation.status);
  const [editing, setEditing] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: "", severity: "success" as "success" | "error" });
  // const userRole = localStorage.getItem("role");
   const userRole = "supervisor";
  useEffect(() => {
  if (statusOptions.length > 0) {
    const matched = statusOptions.find((s) => s.status_name === violation.status);
    if (matched) {
      setSelectedStatusId(matched.id);
    }
  }
}, [statusOptions]);

  useEffect(() => {
    if (userRole === "supervisor") {
      axiosInstance.get("https://hanaxuan-backend.hf.space/api/violation_status/get-all")
        .then(res => {
          setStatusOptions(res.data.data);
        const matched = res.data.data.find((s: any) => s.status_name === violation.status);
        if (matched) {
          setSelectedStatusId(matched.id); 
        }
      })
        .catch(() => {
          setSnackbar({ open: true, message: "Lỗi khi tải danh sách status", severity: "error" });
        });
    }
  }, []);

  const handleChangeStatus = () => {
    if (selectedStatus !== violation.status) {
      setConfirmOpen(true);
    }
  };

  const handleConfirmUpdate = () => {
    setLoading(true);
    axiosInstance.put(`https://hanaxuan-backend.hf.space/api/violations/change-status/${violation.id}/`, { status_id: selectedStatusId  })
      .then(() => {
        setSnackbar({ open: true, message: "Cập nhật trạng thái thành công", severity: "success" });
        setConfirmOpen(false);
        setEditing(false);
      })
      .catch((err) => {
        const message = err.response?.data?.message || "Đã xảy ra lỗi khi cập nhật trạng thái.";
        setSnackbar({ open: true, message, severity: "error" });
      })
      .finally(() => setLoading(false));
  };

  const handleCancel = () => {
    setSelectedStatus(violation.status);
    setEditing(false);
  };

  return (
    <Card sx={{ display: "flex", p: 2, boxShadow: 3, backgroundColor: "#fafafa", borderRadius: 3 }}>
      <CardMedia
        component="img"
        sx={{ width: 150, height: 150, borderRadius: 2, border: "1px solid #ddd" }}
        image={violation.image_url}
        alt="Violation Image"
      />

      <CardContent sx={{ flex: 1, ml: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Typography variant="subtitle1" fontWeight="bold">Address:</Typography>
            <Typography>{violation.location}</Typography>
          </Grid>

          <Grid item xs={6}>
            <Typography variant="subtitle1" fontWeight="bold">License Plate:</Typography>
            <Typography>{violation.plate_number}</Typography>
          </Grid>

          <Grid item xs={6}>
            <Typography variant="subtitle1" fontWeight="bold">Status:</Typography>
            {userRole === "supervisor" && editing ? (
              <Select
              fullWidth
              size="small"
              value={selectedStatusId ?? ""}
              onChange={(e) => {
                const id = Number(e.target.value);
                setSelectedStatusId(id);
                const statusObj = statusOptions.find(s => s.id === id);
                if (statusObj) setSelectedStatus(statusObj.status_name);
              }}
              displayEmpty
            >
              {statusOptions.map((status) => (
                <MenuItem key={status.id} value={status.id}>
                  {status.status_name}
                </MenuItem>
              ))}
            </Select>
            ) : (
              <Typography sx={{ color: violation.status === "Critical" ? "red" : "orange" }}>
                {selectedStatus}
              </Typography>
            )}
          </Grid>

          <Grid item xs={6}>
            <Typography variant="subtitle1" fontWeight="bold">Detected At:</Typography>
            <Typography>{violation.detected_at}</Typography>
          </Grid>

          <Grid item xs={12}>
            <Typography variant="subtitle1" fontWeight="bold">Camera:</Typography>
            <Typography>{violation.camera_id}</Typography>
          </Grid>
        </Grid>

        {/* Action Buttons */}
        {userRole === "supervisor" && (
          <Box sx={{ mt: 2, display: "flex", gap: 1 }}>
            {!editing ? (
              <Button
                variant="contained"
                startIcon={<NotificationsActiveIcon />}
                sx={{ backgroundColor: "#673ab7", "&:hover": { backgroundColor: "#512da8" } }}
                onClick={() => setEditing(true)}
              >
                Change Status
              </Button>
            ) : (
              <>
                <Button
                  variant="contained"
                  onClick={handleChangeStatus}
                  disabled={selectedStatus === violation.status}
                  sx={{
                    backgroundColor: "#4caf50",
                    "&:hover": { backgroundColor: "#388e3c" },
                  }}
                >
                  Confirm
                </Button>
                <Button
                  variant="outlined"
                  onClick={handleCancel}
                  sx={{ color: "#d32f2f", borderColor: "#d32f2f" }}
                >
                  Cancel
                </Button>
              </>
            )}
          </Box>
        )}
      </CardContent>

      {/* Confirm Dialog */}
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>Xác nhận cập nhật trạng thái</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Bạn có chắc chắn muốn cập nhật trạng thái vi phạm từ <strong>{violation.status}</strong> sang <strong>{selectedStatus}</strong>?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)}>Hủy</Button>
          <Button
            onClick={handleConfirmUpdate}
            variant="contained"
            disabled={loading}
            startIcon={loading && <CircularProgress color="inherit" size={20} />}
          >
            {loading ? "Đang cập nhật..." : "Xác nhận"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar Notification */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Card>
  );
};

export default ViolationDetail;
