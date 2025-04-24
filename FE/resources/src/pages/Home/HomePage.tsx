// HomePage.tsx
import{ useState } from 'react';
import {
  Box, Typography, Button, TextField, Paper, CircularProgress, Alert, Snackbar, ImageList, ImageListItem
} from '@mui/material';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import config from "../../config";

const API_BASE_URL = `${config.API_URL}`;

interface Violation {
  violation_id: number;
  plate_number: string;
  vehicle_id?: string;
  location: string;
  detected_at: string;
  violation_image: string[];
  violation_status: string;
}
const statusColors: Record<string, string> = {
  "AI Detected": "#FFA726",
  "Approved": "#66BB6A",
  "Rejected": "#EF5350",
  "Modified": "#42A5F5",
  "Provided": "#AB47BC",
};

const HomePage = () => {
  const navigate = useNavigate();
  const [plateNumber, setPlateNumber] = useState('');
  const [searchResult, setSearchResult] = useState<Violation[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState({ open: false, type: 'info', message: '' });
  const [imageViewer, setImageViewer] = useState<string | null>(null);
  const normalizeBase64Image = (data: string, format: "jpeg" | "png" = "jpeg") => {
  if (data.startsWith("data:image/")) {
    return data; // Đã có prefix, giữ nguyên
  }
  return `data:image/${format};base64,${data}`; // Thêm prefix nếu thiếu
};
  const handleSearch = () => {
    if (!plateNumber.trim()) {
      setNotification({
        open: true,
        type: "warning",
        message: "Please enter license plate number!",
      });
      return;
    }

    setLoading(true);
    setSearchResult(null);

    axios
      .post(`${API_BASE_URL}violations/search-by-plate-number/`, {
        plate_number: plateNumber.trim()
      })
      .then((res) => {
        const data = res.data?.data?.violations || [];
        setSearchResult(data);
        setNotification({ open: true, type: "success", message: "Search successful!" });
      })
      .catch((err) => {
        setNotification({
          open: true,
          type: "error",
          message: err?.response?.data?.message || "Not found or server error!",
        });
      })
      .finally(() => setLoading(false));
  };

  return (
    <Box sx={{ p: 4, maxWidth: 1000, mx: "auto" }}>
      <Typography variant="h4" textAlign="center" fontWeight="bold" mb={4}>
         Violation lookup & System login
      </Typography>

      <Box display="flex" justifyContent="center" gap={3} mb={5} flexWrap="wrap">
        <Button variant="contained" color="primary" size="large" onClick={() => navigate('/admin/login')}>
          Log in as Administrator
        </Button>
        <Button variant="outlined" color="secondary" size="large" onClick={() => navigate('/citizen/login')}>
          Log in as Citizen
        </Button>
      </Box>

      {/* Search Section */}
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
           Look up violations by license plate number
        </Typography>
        <Box display="flex" gap={2} alignItems="center">
          <TextField
            label="Enter license plate number"
            value={plateNumber}
            onChange={(e) => setPlateNumber(e.target.value)}
            fullWidth
          />
          <Button variant="contained" onClick={handleSearch}>
            Search
          </Button>
        </Box>

        {loading && <CircularProgress sx={{ mt: 2 }} />}

        {searchResult && (
          <Box mt={3}>
            {searchResult.length === 0 ? (
              <Alert severity="info">There are no violations for this license plate..</Alert>
            ) : (
              searchResult.map((item: Violation, idx: number) => (
                <Paper key={idx} sx={{ p: 2, mt: 2 }}>
                  <Typography> Violation ID: {item.violation_id}</Typography>
                  <Typography> Location: {item.location || "Unknown"}</Typography>
                  <Typography> Time: {item.detected_at}</Typography>
                  <Typography sx={{ color: statusColors[item.violation_status] || "#000" }}>
                     Status: {item.violation_status}
                  </Typography>
                  <Typography> Images:</Typography>
                  <ImageList cols={3} rowHeight={140} sx={{ mt: 1 }}>
                    {item.violation_image?.filter(Boolean).map((img: string, i: number) => (
                    <ImageListItem key={i}>
                      <img
                        src={normalizeBase64Image(img, "png")}
                        alt={`violation-${i}`}
                        style={{ width: "100%", borderRadius: 6, marginTop: 8, cursor: "pointer" }}
                        onClick={() => setImageViewer(normalizeBase64Image(img, "png"))}
                      />
                      </ImageListItem>
                    ))}
                  </ImageList>
                </Paper>
              ))
            )}
          </Box>
        )}
      </Paper>

      {/* Snackbar */}
      <Snackbar
        open={notification.open}
        autoHideDuration={5000}
        onClose={() => setNotification({ ...notification, open: false })}
      >
        <Alert
          severity={notification.type as 'error' | 'success' | 'info' | 'warning'}
          onClose={() => setNotification({ ...notification, open: false })}
        >
          {notification.message}
        </Alert>
      </Snackbar>

      {/* Image full view (Optional) */}
      {imageViewer && (
        <Box
          onClick={() => setImageViewer(null)}
          sx={{
            position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
            backgroundColor: "rgba(0,0,0,0.7)", zIndex: 9999,
            display: "flex", justifyContent: "center", alignItems: "center",
            cursor: "pointer"
          }}
        >
          <img src={imageViewer} alt="full" style={{ maxWidth: "90%", maxHeight: "90%" }} />
        </Box>
      )}
    </Box>
  );
};

export default HomePage;
