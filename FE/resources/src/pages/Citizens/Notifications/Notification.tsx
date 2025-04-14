import React, { useEffect, useState } from "react";
import {
  Typography, Box, CircularProgress, Paper, Button, Alert, Snackbar
} from "@mui/material";

const CitizenNotificattion = () => {
  interface Application {
    plate_number: string;
    status: string;
    image: string;
  }

  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasApproved, setHasApproved] = useState(false);
  const [email, setEmail] = useState<string>(""); // ✅ Thêm state lưu email
  const [notification, setNotification] = useState({ open: false, message: "", type: "info" });

  // ✅ Giả lập dữ liệu (mock)
  useEffect(() => {
    const mockFetchData = () => {
      // Giả lập data ứng dụng đã duyệt
      const mockApps: Application[] = [
        {
          plate_number: "59A-123.45",
          status: "approved",
          image: "https://via.placeholder.com/300x150.png?text=Giay+to+xe"
        },
        {
          plate_number: "50B-678.90",
          status: "pending",
          image: "https://via.placeholder.com/300x150.png?text=Giay+to+dang+cho"
        }
      ];

      const mockEmail = "mockuser@email.com";

      // Cập nhật state
      setApplications(mockApps);
      setEmail(mockEmail);
      setHasApproved(mockApps.some(app => app.status === "approved"));
      setLoading(false);
    };

    // Giả lập delay để giống API call
    setTimeout(mockFetchData, 1000);
  }, []);

  const handleEmailNotify = () => {
    setNotification({
      open: true,
      message: `Đã gửi thông báo tới ${email} (giả lập)`,
      type: "success"
    });
  };

  return (
    <Box p={4}>
      <Typography variant="h5" gutterBottom>📋 Danh sách biển số xe đã đăng ký</Typography>

      {loading ? (
        <CircularProgress />
      ) : hasApproved ? (
        <Box>
          <Typography variant="subtitle1" sx={{ mb: 2 }}>
            📨 Email nhận thông báo: <strong>{email}</strong>
          </Typography>

          {applications.map((app, idx) => (
            app.status === "approved" && (
              <Paper key={idx} sx={{ p: 3, mb: 2 }}>
                <Typography>🔢 Biển số: {app.plate_number}</Typography>
                <Typography>Status: ✅ Đã duyệt</Typography>
                <Box mt={1}>
                  <img
                    src={app.image}
                    alt="Car Document"
                    style={{ width: "100%", maxHeight: 200, borderRadius: 8 }}
                  />
                </Box>
              </Paper>
            )
          ))}

          <Button variant="contained" color="primary" onClick={handleEmailNotify}>
            📧 Nhận thông báo vi phạm qua Email
          </Button>
        </Box>
      ) : (
        <Alert severity="info" sx={{ mt: 3 }}>
          Bạn chưa có giấy tờ xe được duyệt hoặc đang chờ kiểm duyệt.
        </Alert>
      )}

      <Snackbar
        open={notification.open}
        autoHideDuration={4000}
        onClose={() => setNotification({ ...notification, open: false })}
        message={notification.message}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      />
    </Box>
  );
};

export default CitizenNotificattion;
