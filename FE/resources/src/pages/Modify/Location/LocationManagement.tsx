import React, { useState } from "react";
import {
  Paper,
  Typography,
  TextField,
  Button,
  Snackbar,
  Alert,
  Grid,
  CircularProgress,
} from "@mui/material";
import { useForm } from "react-hook-form";
import axios from "axios";

interface LocationForm {
  name: string;
  road: string;
  district: string;
  city: string;
}

const LocationManager: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error",
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<LocationForm>();

  const showSnackbar = (message: string, severity: "success" | "error") => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  const validateLocationWithGoogle = async (fullAddress: string): Promise<boolean> => {
    try {
      const apiKey = "AIzaSyD-O6ITvNHAsVLC98NtG3lz8369vvMZjtA"; // 🔑 Replace with your actual key
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(fullAddress)}&key=${apiKey}`
      );
      return response.data.status === "OK";
    } catch (err) {
      return false;
    }
  };

  const onSubmit = async (data: LocationForm) => {
    const { name, road, district, city } = data;
    const fullAddress = `${road}, ${district}, ${city}`;

    setLoading(true);

    const isValidLocation = await validateLocationWithGoogle(fullAddress);

    if (!isValidLocation) {
      showSnackbar("Địa chỉ không hợp lệ trên Google Maps!", "error");
      setLoading(false);
      return;
    }

    try {
      await axios.post("/api/locations/create/", {
        name,
        road,
        district,
        city,
      });

      showSnackbar("Tạo địa điểm thành công!", "success");
      reset();
    } catch (error) {
      showSnackbar("Có lỗi xảy ra khi tạo địa điểm!", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper sx={{ p: 4, maxWidth: 700, mx: "auto", mt: 5, borderRadius: 3, boxShadow: 5 }}>
      <Typography variant="h5" fontWeight="bold" gutterBottom>
        Quản lý địa điểm
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Nhập đầy đủ thông tin và kiểm tra địa chỉ hợp lệ với Google Maps trước khi tạo mới.
      </Typography>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              label="Tên địa điểm"
              fullWidth
              {...register("name", { required: "Vui lòng nhập tên địa điểm" })}
              error={!!errors.name}
              helperText={errors.name?.message}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              label="Đường"
              fullWidth
              {...register("road", { required: "Vui lòng nhập tên đường" })}
              error={!!errors.road}
              helperText={errors.road?.message}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              label="Quận/Huyện"
              fullWidth
              {...register("district", { required: "Vui lòng nhập quận/huyện" })}
              error={!!errors.district}
              helperText={errors.district?.message}
            />
          </Grid>

          <Grid item xs={12}>
            <TextField
              label="Thành phố"
              fullWidth
              {...register("city", { required: "Vui lòng nhập thành phố" })}
              error={!!errors.city}
              helperText={errors.city?.message}
            />
          </Grid>

          <Grid item xs={12} display="flex" justifyContent="flex-end">
            <Button
              variant="contained"
              color="primary"
              type="submit"
              disabled={loading}
              sx={{ minWidth: 150, fontWeight: "bold", borderRadius: 2 }}
            >
              {loading ? <CircularProgress size={24} color="inherit" /> : "Tạo địa điểm"}
            </Button>
          </Grid>
        </Grid>
      </form>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: "100%" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Paper>
  );
};

export default LocationManager;
