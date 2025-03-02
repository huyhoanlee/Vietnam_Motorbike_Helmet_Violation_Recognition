import React, { useEffect, useState } from "react";
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, TextField, Button, Select, MenuItem, FormControl, InputLabel, Typography, Box
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const DataDetection = () => {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("All");
  const [data, setData] = useState([]);
  const navigate = useNavigate();

  // Fetch danh sách camera từ API
  useEffect(() => {
    axios.get("https://binhdinh.ttgt.vn/api/cameras")
      .then(response => {
        setData(response.data); // Giả sử response.data là danh sách camera
      })
      .catch(error => console.error("Error fetching cameras:", error));
  }, []);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  const handleFilterChange = (event: any) => {
    setFilter(event.target.value);
  };

  // Lọc dữ liệu dựa trên tìm kiếm và bộ lọc
  const filteredData = data.filter((item: any) =>
    (filter === "All" || item.name.includes(filter)) &&
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h5" sx={{ mb: 2, fontWeight: "bold" }}>Data Detection</Typography>
      
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
            {data.map((camera: any) => (
              <MenuItem key={camera._id} value={camera.name}>{camera.name}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

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
            {filteredData.map((row: any) => (
              <TableRow key={row._id}>
                <TableCell>{row.id}</TableCell>
                <TableCell>
                  <span 
                    style={{ 
                      color: "#007bff", 
                      textDecoration: "underline", 
                      cursor: "pointer" 
                    }} 
                    onClick={() => navigate(`/device/${row._id}`)}
                  >
                    {row.name}
                  </span>
                </TableCell>
                <TableCell>{row.road || "N/A"}</TableCell>
                <TableCell align="center">
                  <Button variant="contained" color="error">Report</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};

export default DataDetection;
