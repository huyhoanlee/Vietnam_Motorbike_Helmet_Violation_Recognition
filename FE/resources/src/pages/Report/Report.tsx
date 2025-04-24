import React, { useState } from "react";
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
import { format, parseISO } from "date-fns";
import config from "../../config";
import axiosInstance from "../../services/axiosInstance";

const API_BASE_URL = `${config.API_URL}violations/search-by-time/`;

interface Violation {
  violation_id: number;
  location: string;
  plate_number: string;
  status_name: string;
  detected_at: string;
}


const ReportPage: React.FC = () => {
  const [violations, setViolations] = useState<Violation[]>([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarType, setSnackbarType] = useState<"success" | "error" | "info">("info");

  const today = new Date().toISOString().split("T")[0]; 

  const fetchViolations = async () => {
    if (!startDate || !endDate) {
      setSnackbarMessage("Please select both start and end date.");
      setSnackbarType("info");
      setOpenSnackbar(true);
      return;
    }

    setLoading(true);
    try {
      const res = await axiosInstance.get(API_BASE_URL, {
        params: { start_date: startDate, end_date: endDate }
      });

      const data = res.data?.data?.violations || [];
      setViolations(data);

      if (data.length > 0) {
        setSnackbarMessage("Report data fetched successfully.");
        setSnackbarType("success");
      } else {
        setSnackbarMessage("No violations found in the selected period.");
        setSnackbarType("info");
      }
    } catch (error) {
      setSnackbarMessage("Failed to fetch data. Please try again.");
      setSnackbarType("error");
    } finally {
      setLoading(false);
      setOpenSnackbar(true);
    }
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.text("Violation Report", 14, 20);
    autoTable(doc, {
      head: [["ID", "Location", "License Plate", "Status", "Date"]],
      body: violations.map((v) => [
        v.violation_id,
        v.location,
        v.plate_number,
        v.status_name,
        format(parseISO(v.detected_at), "dd/MM/yyyy")
      ]),
      startY: 30,
    });
    doc.save(`Violation_Report_${startDate}_to_${endDate}.pdf`);
  };

  return (
    <Box sx={{ padding: { xs: 2, md: 4 } }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Traffic Violation Report
      </Typography>

      <Box sx={{ display: "flex", flexDirection: { xs: "column", sm: "row" }, gap: 2, mb: 3 }}>
        <TextField
          type="date"
          label="Start Date"
          InputLabelProps={{ shrink: true }}
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          fullWidth
          inputProps={{ max: today }}
        />
        <TextField
          type="date"
          label="End Date"
          InputLabelProps={{ shrink: true }}
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          fullWidth
          inputProps={{ max: today }}
        />
        <Button
          variant="contained"
          color="primary"
          onClick={fetchViolations}
          sx={{ whiteSpace: "nowrap" }}
        >
          Generate Report
        </Button>
      </Box>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
          <CircularProgress />
        </Box>
      ) : violations.length > 0 ? (
        <>
          <TableContainer component={Paper} sx={{ borderRadius: 2, mb: 2 }}>
            <Table>
              <TableHead sx={{ backgroundColor: "#f5f5f5" }}>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Location</TableCell>
                  <TableCell>License Plate</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Date</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {violations.map((violation) => (
                  <TableRow key={violation.violation_id}>
                    <TableCell>{violation.violation_id}</TableCell>
                    <TableCell>{violation.location}</TableCell>
                    <TableCell>{violation.plate_number}</TableCell>
                    <TableCell sx={{ color: violation.status_name === "Verified" ? "blue" : violation.status_name === "Reported" ? "orange" : "default" }}>
                      {violation.status_name}
                    </TableCell>
                    <TableCell>
                      {format(parseISO(violation.detected_at), "dd/MM/yyyy")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Box sx={{ textAlign: "right" }}>
            <Button variant="outlined" color="success" onClick={handleExportPDF}>
              Export as PDF
            </Button>
          </Box>
        </>
      ) : (
        <Alert severity="info">No violations found in the selected period.</Alert>
      )}

      <Snackbar
        open={openSnackbar}
        autoHideDuration={3000}
        onClose={() => setOpenSnackbar(false)}
      >
        <Alert severity={snackbarType} variant="filled" sx={{ width: "100%" }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ReportPage;
