import React, { useState} from "react";
import {
  Box,
  Typography,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Snackbar,
  Alert
} from "@mui/material";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import axios from "axios";
import { format } from 'date-fns';

interface Violation {
  id: number;
  location: string;
  plate_number: string;
  status: string;
  detected_at: string;
  description: string;
}

const API_BASE_URL = "https://hanaxuan-backend.hf.space/api/violations";

const axiosInstance = axios.create();
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const ReportPage: React.FC = () => {
  const [violations, setViolations] = useState<Violation[]>([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  // Fetch data từ API
  const fetchViolations = async () => {
    setLoading(true);
    try {
      const res = await axiosInstance.get(API_BASE_URL, {
        params: { start_date: startDate, end_date: endDate }
      });
      setViolations(res.data);
      setSnackbarMessage("Data fetched successfully!");
    } catch (error) {
      setSnackbarMessage("Failed to fetch data.");
    } finally {
      setLoading(false);
      setOpenSnackbar(true);
    }
  };

  // Xử lý xuất PDF
  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.text("Violation Report", 14, 20);

    autoTable(doc, {
      head: [["ID", "Location", "Plate Number", "Status", "Date", "Description"]],
      body: violations.map((v) => [
        v.id,
        v.location,
        v.plate_number,
        v.status,
        v.detected_at,
        v.description,
      ]),
      startY: 30,
    });

    doc.save(`Violation_Report_${startDate}_to_${endDate}.pdf`);
  };

  return (
    <Box sx={{ padding: 4 }}>
      <Typography variant="h4" sx={{ fontWeight: "bold", mb: 2 }}>
        Violation Report
      </Typography>

      <Box sx={{ display: "flex", gap: 2, mb: 3 }}>
        <TextField
          label="Start Date (YYYY-MM-DD)"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          fullWidth
        />
        <TextField
          label="End Date (YYYY-MM-DD)"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          fullWidth
        />
        <Button
          variant="contained"
          color="primary"
          onClick={fetchViolations}
        >
          Fetch Report
        </Button>
      </Box>

      {loading ? (
        <CircularProgress />
      ) : (
        <TableContainer component={Paper} sx={{ borderRadius: "10px" }}>
          <Table>
            <TableHead sx={{ backgroundColor: "#f0e6ff" }}>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Location</TableCell>
                <TableCell>License Plate</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Description</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {violations.map((violation) => (
                <TableRow key={violation.id}>
                  <TableCell>{violation.id}</TableCell>
                  <TableCell>{violation.location}</TableCell>
                  <TableCell>{violation.plate_number}</TableCell>
                  <TableCell sx={{ color: violation.status === "Critical" ? "red" : "orange" }}>
                    {violation.status}
                  </TableCell>
                  <TableCell>{format(violation.detected_at, "dd/MM/yyyy")}</TableCell>
                  <TableCell>{violation.description}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Box sx={{ textAlign: "right", mt: 3 }}>
        <Button
          variant="outlined"
          color="success"
          onClick={handleExportPDF}
        >
          Export as PDF
        </Button>
      </Box>

      {/* Thông báo */}
      <Snackbar
        open={openSnackbar}
        autoHideDuration={3000}
        onClose={() => setOpenSnackbar(false)}
      >
        <Alert severity={snackbarMessage.includes("successfully") ? "success" : "error"}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ReportPage;
