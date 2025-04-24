import React, { useEffect, useState } from "react";
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
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import config from "../../config";
import axiosInstance from "../../services/axiosInstance";
import MJPEGStreamViewer from "./MJPEGStreamViewer";

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

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await axiosInstance.get<{ data: CameraData[] }>(`${API_BASE_URL}get-all/`);
        setData(res.data.data);
      } catch (err) {
        console.error("Error fetching cameras:", err);
      }
    };
    fetchData();
  }, []);

  const handleOpenDialog = async (camera_id: string) => {
    try {
      // await axiosInstance.patch(`${API_BASE_URL}streaming/${camera_id}/`);
      const fixedStreamUrl = "https://huyhoanlee-ai-service.hf.space/stream/a32be6e7";
      setSelectedStream(fixedStreamUrl);
      setOpenDialog(true);
    } catch (error) {
      console.error("Failed to load stream:", error);
      setSelectedStream(null);
      setOpenDialog(true);
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedStream(null);
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
            <MJPEGStreamViewer streamUrl={selectedStream} />
          ) : (
            <Typography>Không thể hiển thị luồng</Typography>
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default DataDetection;