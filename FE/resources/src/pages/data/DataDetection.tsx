import React, { useEffect, useState, useRef } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Typography,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  CircularProgress,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import config from "../../config";
import axiosInstance from "../../services/axiosInstance";

const API_BASE_URL = `${config.API_URL}cameras/`;

interface CameraData {
  camera_id: string;
  device_name: string;
  location: string;
  status: string;
  last_active: string;
}

const DataDetection: React.FC = () => {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [data, setData] = useState<CameraData[]>([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedStream, setSelectedStream] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const lastFrameRef = useRef<string | null>(null); // Store last frame URL for pause

  // Fetch camera data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axiosInstance.get<{ data: CameraData[] }>(`${API_BASE_URL}get-all/`);
        setData(res.data.data);
      } catch (err) {
        console.error("Error fetching cameras:", err);
        setError("Failed to load camera data. Please try again.");
      }
    };
    fetchData();
  }, []);

  // Handle MJPEG stream
  useEffect(() => {
    if (!selectedStream || !openDialog) {
      setError(null);
      setIsPaused(false);
      setIsLoading(true);
      lastFrameRef.current = null;
      return;
    }

    const img = imgRef.current;
    if (!img) return;

    const handleLoad = () => {
      setIsLoading(false);
      setError(null);
    };

    const handleError = () => {
      setIsLoading(false);
      setError("Unable to load stream. Please check the connection or try again.");
    };

    if (!isPaused) {
      // Only update src if not paused
      const streamUrl = `${selectedStream}?t=${Date.now()}`;
      img.src = streamUrl;
      lastFrameRef.current = streamUrl; // Store last frame URL
      img.onload = handleLoad;
      img.onerror = handleError;
    }

    return () => {
      if (img) {
        img.onload = null;
        img.onerror = null;
        img.src = ""; // Clean up on unmount
      }
    };
  }, [selectedStream, openDialog, isPaused]);

  // Handle pause/resume
  const handlePauseResume = () => {
    setIsPaused((prev) => {
      const newPausedState = !prev;
      const img = imgRef.current;
      if (newPausedState && img) {
        // Pause: Keep last frame
        img.src = lastFrameRef.current || ""; // Preserve last frame
      } else if (!newPausedState && img && selectedStream) {
        // Resume: Reload stream
        img.src = `${selectedStream}?t=${Date.now()}`;
      }
      return newPausedState;
    });
  };

  const handleOpenDialog = async (camera_id: string) => {
    try {
      setIsLoading(true);
      const res = await axiosInstance.patch(`${API_BASE_URL}streaming/${camera_id}/`);
      console.log("API Response:", res.data);
      if (!res.data.output_url) {
        throw new Error("No output_url in API response");
      }
      const correctedStreamUrl = res.data.output_url.replace(/\/stream\/[^/]+$/, "/video");
      setSelectedStream(correctedStreamUrl);
      setIsPaused(false);
      setError(null);
      setOpenDialog(true);
    } catch (error) {
      console.error("Failed to load stream:", error);
      setSelectedStream(null);
      setOpenDialog(true);
      setError(
        error.response?.data?.message ||
        "Unable to load stream. Please check the connection or try again."
      );
      setIsLoading(false);
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedStream(null);
    setIsPaused(false);
    setError(null);
    setIsLoading(true);
    lastFrameRef.current = null;
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  const handleFilterChange = (e: React.ChangeEvent<{ value: unknown }>) => {
    setFilter(e.target.value as string);
  };

  const filteredData = data.filter(
    (item) =>
      (filter === "All" || item.device_name.includes(filter)) &&
      item.device_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ mb: 2, fontWeight: "bold" }}>
        Phát hiện dữ liệu camera
      </Typography>
      <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
        <TextField
          variant="outlined"
          placeholder="Search..."
          value={search}
          onChange={handleSearch}
          InputProps={{ startAdornment: <SearchIcon /> }}
          sx={{ flex: 1 }}
        />
        <FormControl sx={{ minWidth: 150 }}>
          <InputLabel>Bộ lọc</InputLabel>
          <Select value={filter} onChange={handleFilterChange}>
            <MenuItem value="All">All</MenuItem>
            {data.map((camera) => (
              <MenuItem key={camera.camera_id} value={camera.device_name}>
                {camera.device_name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
              <TableCell><b>ID</b></TableCell>
              <TableCell><b>Thiết bị</b></TableCell>
              <TableCell><b>Vị trí</b></TableCell>
              <TableCell align="center"><b>Hành động</b></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredData.map((row) => (
              <TableRow key={row.camera_id}>
                <TableCell>{row.camera_id}</TableCell>
                <TableCell>{row.device_name}</TableCell>
                <TableCell>{row.location}</TableCell>
                <TableCell align="center">
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => handleOpenDialog(row.camera_id)}
                  >
                    Luồng xem
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="lg" fullWidth>
        <DialogTitle>Phát trực tiếp</DialogTitle>
        <DialogContent>
          {selectedStream ? (
            <Box sx={{ position: "relative", textAlign: "center" }}>
              {isLoading && (
                <Box
                  sx={{
                    position: "absolute",
                    top: "50%",
                    left: "50%",
                    transform: "translate(-50%, -50%)",
                    zIndex: 2,
                  }}
                >
                  <CircularProgress />
                </Box>
              )}
              <Box sx={{ width: "100%", maxWidth: "1280px", margin: "auto" }}>
                <img
                  ref={imgRef}
                  alt="MJPEG Stream"
                  style={{
                    width: "100%",
                    height: "auto",
                    maxHeight: "640px",
                    borderRadius: 8,
                    objectFit: "contain",
                    opacity: isLoading ? 0.5 : 1,
                    transition: "opacity 0.2s ease-in-out",
                  }}
                />
              </Box>
              {error && (
                <Typography color="error" sx={{ mt: 2 }}>
                  {error}
                </Typography>
              )}
              <Box
                sx={{
                  position: "absolute",
                  top: 10,
                  right: 10,
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  background: "rgba(0,0,0,0.4)",
                  padding: "4px 10px",
                  borderRadius: 6,
                  color: "#fff",
                }}
              >
                <FiberManualRecordIcon sx={{ color: isPaused ? "gray" : "red" }} />
                <Typography variant="body2">{isPaused ? "Tạm dừng" : "Trực tiếp"}</Typography>
              </Box>
              <Button
                variant="contained"
                color={isPaused ? "success" : "secondary"}
                onClick={handlePauseResume}
                sx={{ position: "absolute", top: 10, left: 10 }}
              >
                {isPaused ? "Resume" : "Pause"}
              </Button>
            </Box>
          ) : (
            <Typography>Không thể hiển thị luồng</Typography>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default DataDetection;