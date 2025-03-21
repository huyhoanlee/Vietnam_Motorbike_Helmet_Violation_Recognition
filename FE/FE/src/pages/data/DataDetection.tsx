import React, { useEffect, useState } from "react";
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, TextField, Button, Select, MenuItem, FormControl, InputLabel, Typography, Box, Dialog, DialogTitle, DialogContent
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import axios from "axios";

interface CameraData {
  id: string;
  device_name: string;
  location: string;
  status: string;
  last_active: string;
  url: string;
}

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
        const response = await axios.get<CameraData[]>(
          "https://hanaxuan-backend.hf.space/api/cameras/"
        );
        setData(response.data);
      } catch (error) {
        console.error("Error fetching cameras:", error);
      }
    };

    fetchData();
  }, []);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  const handleFilterChange = (event: any) => {
    setFilter(event.target.value);
  };

  const filteredData = data.filter((item) =>
    (filter === "All" || item.device_name.includes(filter)) &&
    item.device_name.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenDialog = (url: string) => {
    console.log("URL hình ảnh AI detect:", url); 
    setSelectedStream(url);
    setOpenDialog(true);
  };

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
              <MenuItem key={camera.id} value={camera.device_name}>
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
              <TableRow key={row.id}>
                <TableCell>{row.id}</TableCell>
                <TableCell>{row.device_name}</TableCell>
                <TableCell>{row.location}</TableCell>
                <TableCell align="center">
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={() => handleOpenDialog(row.url)}
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
