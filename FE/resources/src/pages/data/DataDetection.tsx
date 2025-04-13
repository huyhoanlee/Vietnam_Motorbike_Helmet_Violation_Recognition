import React, { useEffect, useState } from "react";
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, TextField, Button, Select, MenuItem, FormControl, InputLabel, Typography, Box, Dialog, DialogTitle, DialogContent
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import axios from "axios";

interface CameraData {
  camera_id: string;
  device_name: string;
  location: string;
  status: string;
  last_active: string;
}
const API_BASE_URL = "https://hanaxuan-backend.hf.space/api/cameras/";

const axiosInstance = axios.create();
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});
const DataDetection = () => {
  const [search, setSearch] = useState<string>("");
  const [filter, setFilter] = useState<string>("All");
  const [data, setData] = useState<CameraData[]>([]);
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const [selectedStream, setSelectedStream] = useState<string | null>(null);

  // Fetch dữ liệu từ API
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axiosInstance.get<{data: CameraData[] }>(`${API_BASE_URL}get-all/`);
        setData(response.data.data);
      } catch (error) {
        console.error("Error fetching cameras:", error);
      }
    };

    fetchData();
  }, []);
  const handleOpenDialog = async (camera_id: string) => {
  try {
    const res = await axiosInstance.get(`${API_BASE_URL}streaming/${camera_id}/`);
    const streamUrl = res.data.output_url;
    setSelectedStream(streamUrl);
    setOpenDialog(true);
  } catch (error) {
    console.error("Failed to load stream", error);
    setSelectedStream(null);
    setOpenDialog(true); // vẫn mở dialog để hiện lỗi nếu cần
  }
};

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  const handleFilterChange = (event: any) => {
    setFilter(event.target.value);
  };

  const filteredData = data.filter((item) =>
    (filter === "All" || item.device_name?.includes(filter)) &&
    item.device_name?.toLowerCase().includes(search.toLowerCase())
  );

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedStream(null);
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ mb: 2, fontWeight: "bold" }}>
        Camera Data Detection
      </Typography>

      {/* Thanh tìm kiếm và bộ lọc */}
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
          <InputLabel>Filter</InputLabel>
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

      {/* Bảng dữ liệu */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
              <TableCell><b>ID</b></TableCell>
              <TableCell><b>Device</b></TableCell>
              <TableCell><b>Location</b></TableCell>
              <TableCell align="center"><b>Action</b></TableCell>
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
                    View Stream
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="lg"
        fullWidth
        PaperProps={{ sx: { width: "66%", height: "auto" } }}  
      >
        <DialogTitle>Live Stream</DialogTitle>
        <DialogContent>
          {selectedStream ? (
            <img
              src={selectedStream}
              alt="Live Stream"
              style={{ width: "100%", height: "auto" }}
            />
          ) : (
            <Typography>Stream not available</Typography>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default DataDetection;
