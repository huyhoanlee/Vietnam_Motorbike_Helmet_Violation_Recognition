import React, { useEffect, useState } from "react";
import {
  Box, Typography, Grid, Paper, CircularProgress,
  Alert, Card, CardMedia, CardContent, Chip
} from "@mui/material";
import axios from "axios";

const API = "https://hanaxuan-backend.hf.space/api/violations/search-by-location/";

const axiosInstance = axios.create();
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const ViolationByLocation = () => {
  const [violations, setViolations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    axiosInstance
      .get(API)
      .then((res) => {
        setViolations(res.data.data.violations || []);
      })
      .catch(() => {
        setError("Không thể tải dữ liệu vi phạm.");
      })
      .finally(() => setLoading(false));
  }, []);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "ai detected":
        return "info";
      case "approved":
        return "success";
      case "rejected":
        return "error";
      case "modified":
        return "warning";
      case "provided":
        return "secondary";
      default:
        return "default";
    }
  };

  return (
    <Box p={4}>
      <Typography variant="h4" gutterBottom fontWeight="bold">
        Thống kê vi phạm theo khu vực
      </Typography>

      {loading ? (
        <Box textAlign="center" mt={5}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Alert severity="error">{error}</Alert>
      ) : violations.length === 0 ? (
        <Alert severity="info">Không có dữ liệu vi phạm.</Alert>
      ) : (
        <Grid container spacing={3}>
          {violations.map((item) => (
            <Grid item xs={12} sm={6} md={4} key={item.violation_id}>
              <Card elevation={4}>
                {item.image.length > 0 && (
                  <CardMedia
                    component="img"
                    height="200"
                    image={`data:image/jpeg;base64,${item.image[0]}`}
                    alt="Violation"
                  />
                )}
                <CardContent>
                  <Typography variant="subtitle1">
                    <strong>Camera:</strong> #{item.camera_id}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Thời gian:</strong>{" "}
                    {new Date(item.detected_at).toLocaleString("vi-VN")}
                  </Typography>
                  <Typography variant="body2">
                    <strong>Khu vực:</strong> {item.location_name}
                  </Typography>
                  <Box mt={1}>
                    <Chip
                      label={item.violation_status}
                      color={getStatusColor(item.violation_status)}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default ViolationByLocation;
