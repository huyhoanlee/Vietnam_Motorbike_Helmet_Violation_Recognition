import React, { useState, useEffect } from "react";
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
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Pagination,
} from "@mui/material";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format, parseISO } from "date-fns";
import config from "../../config";
import axiosInstance from "../../services/axiosInstance";
import robotoBase64 from "../../fonts/rechange_to_vietnamese";

const API_BASE_URL = `${config.API_URL}violations/search-by-time/`;
const STATUS_API_URL = `${config.API_URL}violation_status/get-all/`;

interface Violation {
  violation_id: number;
  location: string;
  plate_number: string;
  status_name: string;
  detected_at: string;
}

interface Status {
  description: string;
  id: number;
  status_name: string;
}

interface StatusSelectProps {
  filterStatus: string;
  setFilterStatus: (value: string) => void;
}

const StatusSelect: React.FC<StatusSelectProps> = ({ filterStatus, setFilterStatus }) => {
  const [statuses, setStatuses] = useState<Status[]>([]);

  useEffect(() => {
    axiosInstance
      .get(STATUS_API_URL)
      .then((response) => {
        setStatuses(response.data.data);
      })
      .catch((error) => {
        console.error("Failed to fetch statuses:", error);
      });
  }, []);

  return (
    <FormControl size="small" sx={{ minWidth: 120 }}>
      <InputLabel>Filter Status</InputLabel>
      <Select
        value={filterStatus}
        onChange={(e) => setFilterStatus(e.target.value as string)}
        label="Filter Status"
      >
        <MenuItem value="All">All Status</MenuItem>
        {statuses.map((status, index) => (
          <MenuItem key={index} value={status.status_name}>
            {status.status_name}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

const ReportPage: React.FC = () => {
  const [violations, setViolations] = useState<Violation[]>([]);
  const [filteredViolations, setFilteredViolations] = useState<Violation[]>([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("All");
  const [loading, setLoading] = useState(false);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarType, setSnackbarType] = useState<"success" | "error" | "info">("info");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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
        params: { start_date: startDate, end_date: endDate },
      });

      const data = res.data?.data?.violations || [];
      setViolations(data);

      const filteredData = filterStatus === "All"
        ? data
        : data.filter((v: Violation) => v.status_name === filterStatus);
      setFilteredViolations(filteredData);
      setCurrentPage(1);

      if (data.length > 0) {
        setSnackbarMessage(
          filteredData.length > 0
            ? "Report data fetched successfully."
            : "No violations found for the selected status."
        );
        setSnackbarType(filteredData.length > 0 ? "success" : "info");
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

  useEffect(() => {
    const filteredData = filterStatus === "All"
      ? violations
      : violations.filter((v) => v.status_name === filterStatus);
    setFilteredViolations(filteredData);
    setCurrentPage(1);

    if (violations.length > 0) {
      setSnackbarMessage(
        filteredData.length > 0
          ? "Filtered violations updated successfully."
          : "No violations found for the selected status."
      );
      setSnackbarType(filteredData.length > 0 ? "success" : "info");
      setOpenSnackbar(true);
    }
  }, [filterStatus, violations]);

  const totalPages = Math.ceil(filteredViolations.length / itemsPerPage);
  const paginatedViolations = filteredViolations.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleExportPDF = () => {
    const doc = new jsPDF();

    // Nhúng font Roboto vào jsPDF
    doc.addFileToVFS("Roboto-Regular.ttf", robotoBase64);
    doc.addFont("Roboto-Regular.ttf", "Roboto", "normal");
    doc.setFont("Roboto", "normal");

    // Thêm tiêu đề và thông tin bộ lọc
    doc.setFontSize(16);
    doc.text("Traffic Violation Report", 14, 20);

    doc.setFontSize(10);
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 30);
    doc.text(`Date Range: ${startDate} to ${endDate}`, 14, 36);
    doc.text(`Status Filter: ${filterStatus === "All" ? "All Status" : filterStatus}`, 14, 42);

    // Cấu hình bảng với autoTable
    autoTable(doc, {
      head: [["ID", "Location", "License Plate", "Status", "Date"]],
      body: filteredViolations.map((v) => [
        v.violation_id.toString(),
        v.location || "N/A",
        v.plate_number || "N/A",
        v.status_name || "N/A",
        format(parseISO(v.detected_at), "dd/MM/yyyy"),
      ]),
      startY: 50,
      theme: "striped",
      headStyles: { fillColor: [63, 81, 181], textColor: 255, fontSize: 10 },
      bodyStyles: { fontSize: 9, font: "Roboto" }, // Sử dụng font Roboto
      margin: { top: 50, left: 14, right: 14 },
      styles: {
        font: "Roboto", // Sử dụng font Roboto
        fontSize: 9,
        overflow: "linebreak",
      },
      columnStyles: {
        0: { cellWidth: 20 },
        1: { cellWidth: 50 },
        2: { cellWidth: 40 },
        3: { cellWidth: 30 },
        4: { cellWidth: 30 },
      },
      didDrawPage: (data) => {
        const pageCount = doc.getNumberOfPages();
        const pageNumber = data.pageNumber;
        doc.setFontSize(10);
        doc.text(
          `Page ${pageNumber} of ${pageCount}`,
          data.settings.margin.left,
          doc.internal.pageSize.height - 10
        );
      },
    });

    doc.save(`Violation_Report_${startDate}_to_${endDate}.pdf`);
  };

  return (
    <>
      {/* Import font Roboto cho giao diện */}
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,100..900;1,100..900&display=swap');

          .roboto-report {
            font-family: "Roboto", sans-serif;
            font-optical-sizing: auto;
            font-weight: 400;
            font-style: normal;
            font-variation-settings: "wdth" 100;
          }
        `}
      </style>

      <Box sx={{ padding: { xs: 2, md: 4 } }} className="roboto-report">
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Traffic Violation Report
        </Typography>

        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", sm: "row" },
            gap: 2,
            mb: 3,
            alignItems: { sm: "center" },
          }}
        >
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
          <StatusSelect filterStatus={filterStatus} setFilterStatus={setFilterStatus} />
          <Button
            variant="contained"
            color="primary"
            onClick={fetchViolations}
            sx={{ whiteSpace: "nowrap", width: { xs: "100%", sm: "30%" } }}
          >
            Generate Report
          </Button>
        </Box>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
            <CircularProgress />
            <Typography variant="body2" ml={2}>
              Loading violations, please wait...
            </Typography>
          </Box>
        ) : filteredViolations.length > 0 ? (
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
                  {paginatedViolations.map((violation) => (
                    <TableRow key={violation.violation_id}>
                      <TableCell>{violation.violation_id}</TableCell>
                      <TableCell>{violation.location || "N/A"}</TableCell>
                      <TableCell>{violation.plate_number || "N/A"}</TableCell>
                      <TableCell
                        sx={{
                          color:
                            violation.status_name === "Verified"
                              ? "blue"
                              : violation.status_name === "Reported"
                              ? "orange"
                              : "default",
                        }}
                      >
                        {violation.status_name || "N/A"}
                      </TableCell>
                      <TableCell>
                        {format(parseISO(violation.detected_at), "dd/MM/yyyy")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mt: 2 }}>
              <Pagination
                count={totalPages}
                page={currentPage}
                onChange={(event, value) => setCurrentPage(value)}
                color="primary"
              />
              <Button variant="outlined" color="success" onClick={handleExportPDF}>
                Export as PDF
              </Button>
            </Box>
          </>
        ) : (
          <Alert severity="info">No violations found for the selected criteria.</Alert>
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
    </>
  );
};

export default ReportPage;