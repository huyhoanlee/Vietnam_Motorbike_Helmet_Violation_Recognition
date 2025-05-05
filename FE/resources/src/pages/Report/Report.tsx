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
  CircularProgress,
  Snackbar,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Pagination,
  Card,
  CardContent,
  Chip,
  useTheme,
  useMediaQuery,
  Tooltip,
  Fade,
  Grid,
  IconButton,
} from "@mui/material";
import {
  FileDownload as FileDownloadIcon,
  DateRange as DateRangeIcon,
  Refresh as RefreshIcon,
  FilterList as FilterListIcon,
  Info as InfoIcon,
} from "@mui/icons-material";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { format, parseISO, isValid } from "date-fns";
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
  disabled: boolean;
}

// Enhanced Status Select Component
const StatusSelect: React.FC<StatusSelectProps> = ({ 
  filterStatus, 
  setFilterStatus,
  disabled
}) => {
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchStatuses = async () => {
      setLoading(true);
      try {
        const response = await axiosInstance.get(STATUS_API_URL);
        setStatuses(response.data.data);
      } catch (error) {
        console.error("Failed to fetch statuses:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStatuses();
  }, []);

  return (
    <FormControl 
      size="small" 
      sx={{ minWidth: 150 }}
      disabled={disabled}
    >
      <InputLabel>Status Filter</InputLabel>
      <Select
        value={filterStatus}
        onChange={(e) => setFilterStatus(e.target.value as string)}
        label="Status Filter"
        startAdornment={<FilterListIcon fontSize="small" sx={{ mr: 1, opacity: 0.7 }} />}
      >
        <MenuItem value="All">
          <em>All Statuses</em>
        </MenuItem>
        {statuses.map((status) => (
          <MenuItem key={status.id} value={status.status_name}>
            {status.status_name}
          </MenuItem>
        ))}
      </Select>
      {loading && (
        <CircularProgress 
          size={20} 
          sx={{ 
            position: 'absolute', 
            right: 30, 
            top: '50%', 
            marginTop: '-10px' 
          }} 
        />
      )}
    </FormControl>
  );
};

// Status chip styled based on status
const StatusChip: React.FC<{ status: string }> = ({ status }) => {
  let color: "default" | "primary" | "secondary" | "error" | "info" | "success" | "warning" = "default";
  
  switch (status) {
    case "Verified":
      color = "success";
      break;
    case "Reported":
      color = "warning";
      break;
    case "Pending":
      color = "info";
      break;
    case "Rejected":
      color = "error";
      break;
    default:
      color = "default";
  }

  return (
    <Chip 
      label={status || "N/A"} 
      color={color} 
      size="small"
      sx={{ 
        minWidth: 80,
        fontWeight: 500 
      }} 
    />
  );
};

const ReportPage: React.FC = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));
  
  const [violations, setViolations] = useState<Violation[]>([]);
  const [filteredViolations, setFilteredViolations] = useState<Violation[]>([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("All");
  const [loading, setLoading] = useState(false);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarType, setSnackbarType] = useState<"success" | "error" | "info" | "warning">("info");

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [animateTable, setAnimateTable] = useState(false);

  // Stats
  const [totalViolations, setTotalViolations] = useState(0);
  const [reportGeneratedDate, setReportGeneratedDate] = useState<Date | null>(null);

  const today = new Date().toISOString().split("T")[0];

  // Fixed: Filter violations only when both date range and status are applied
  const fetchViolations = async () => {
    if (!startDate || !endDate) {
      setSnackbarMessage("Please select both start and end date");
      setSnackbarType("warning");
      setOpenSnackbar(true);
      return;
    }

    // Validate dates
    if (startDate > endDate) {
      setSnackbarMessage("Start date cannot be after end date");
      setSnackbarType("error");
      setOpenSnackbar(true);
      return;
    }

    setLoading(true);
    setAnimateTable(false);

    try {
      const res = await axiosInstance.get(API_BASE_URL, {
        params: { start_date: startDate, end_date: endDate },
      });

      const data = res.data?.data?.violations || [];
      setViolations(data);
      setTotalViolations(data.length);
      setReportGeneratedDate(new Date());

      // Filter data based on the selected status
      const filteredData = filterStatus === "All"
        ? data
        : data.filter((v: Violation) => v.status_name === filterStatus);
      
      setFilteredViolations(filteredData);
      setCurrentPage(1);

      // Set appropriate messages
      if (data.length > 0) {
        if (filteredData.length > 0) {
          setSnackbarMessage(`Successfully found ${filteredData.length} violations`);
          setSnackbarType("success");
        } else {
          setSnackbarMessage(`No violations found with status "${filterStatus}"`);
          setSnackbarType("info");
        }
      } else {
        setSnackbarMessage("No violations found in the selected date range");
        setSnackbarType("info");
      }

      // Add animation to table
      setTimeout(() => setAnimateTable(true), 100);
    } catch (error) {
      console.error("Error fetching violations:", error);
      setSnackbarMessage("Failed to fetch data. Please try again");
      setSnackbarType("error");
    } finally {
      setLoading(false);
      setOpenSnackbar(true);
    }
  };

  // Filter violations when status filter changes
  useEffect(() => {
    if (violations.length === 0) return;

    setAnimateTable(false);
    
    const filteredData = filterStatus === "All"
      ? violations
      : violations.filter((v) => v.status_name === filterStatus);
    
    setFilteredViolations(filteredData);
    setCurrentPage(1);

    if (violations.length > 0) {
      if (filteredData.length > 0) {
        setSnackbarMessage(`Found ${filteredData.length} violations with status "${filterStatus === 'All' ? 'All' : filterStatus}"`);
        setSnackbarType("success");
      } else {
        setSnackbarMessage(`No violations found with status "${filterStatus}"`);
        setSnackbarType("info");
      }
      setOpenSnackbar(true);
    }

    // Add animation to table
    setTimeout(() => setAnimateTable(true), 100);
  }, [filterStatus]);

  const totalPages = Math.ceil(filteredViolations.length / itemsPerPage);
  const paginatedViolations = filteredViolations.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const formatDateDisplay = (dateString: string) => {
    try {
      const date = parseISO(dateString);
      if (isValid(date)) {
        return format(date, "dd/MM/yyyy");
      }
      return "Invalid date";
    } catch (error) {
      return "Invalid date";
    }
  };

  const handleExportPDF = () => {
    const doc = new jsPDF();

    // Add Roboto font to jsPDF
    doc.addFileToVFS("Roboto-Regular.ttf", robotoBase64);
    doc.addFont("Roboto-Regular.ttf", "Roboto", "normal");
    doc.setFont("Roboto", "normal");

    // Enhanced PDF Header with styling
    doc.setFillColor(63, 81, 181);
    doc.rect(0, 0, 210, 25, "F");
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.text("Traffic Violation Report", 105, 15, { align: "center" });

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(10);
    
    // Add report metadata
    const metadataY = 35;
    doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, metadataY);
    doc.text(`Date Range: ${startDate} to ${endDate}`, 14, metadataY + 6);
    doc.text(`Status Filter: ${filterStatus === "All" ? "All Statuses" : filterStatus}`, 14, metadataY + 12);
    doc.text(`Total Records: ${filteredViolations.length}`, 14, metadataY + 18);

    // Add summary stats
    const statsByStatus = filteredViolations.reduce((acc: Record<string, number>, v) => {
      acc[v.status_name] = (acc[v.status_name] || 0) + 1;
      return acc;
    }, {});

    let statY = metadataY + 24;
    doc.setFontSize(12);
    doc.text("Summary by Status:", 14, statY);
    doc.setFontSize(10);
    
    statY += 6;
    Object.entries(statsByStatus).forEach(([status, count], index) => {
      doc.text(`• ${status}: ${count} violations`, 20, statY + (index * 6));
    });

    // Configure table with autoTable
    autoTable(doc, {
      head: [["ID", "Location", "License Plate", "Status", "Date"]],
      body: filteredViolations.map((v) => [
        v.violation_id.toString(),
        v.location || "N/A",
        v.plate_number || "N/A",
        v.status_name || "N/A",
        formatDateDisplay(v.detected_at),
      ]),
      startY: 80,
      theme: "grid",
      headStyles: { 
        fillColor: [63, 81, 181], 
        textColor: 255, 
        fontSize: 10,
        fontStyle: 'bold',
        halign: 'center'
      },
      bodyStyles: { 
        fontSize: 9, 
        font: "Roboto",
        lineColor: [230, 230, 230]
      },
      alternateRowStyles: {
        fillColor: [245, 245, 255]
      },
      margin: { top: 80, left: 14, right: 14 },
      styles: {
        font: "Roboto",
        fontSize: 9,
        overflow: "linebreak",
        cellPadding: 3,
      },
      columnStyles: {
        0: { cellWidth: 20, halign: 'center' },
        1: { cellWidth: 60 },
        2: { cellWidth: 30 },
        3: { cellWidth: 30, halign: 'center' },
        4: { cellWidth: 30, halign: 'center' },
      },
      didDrawPage: (_data) => {
        // Footer with page numbers
        const pageCount = doc.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
          doc.setPage(i);
          const pageSize = doc.internal.pageSize;
          const pageWidth = pageSize.width ? pageSize.width : pageSize.getWidth();
          const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight();
          
          // Draw footer with line
          doc.setDrawColor(200, 200, 200);
          doc.line(14, pageHeight - 20, pageWidth - 14, pageHeight - 20);
          
          doc.setFontSize(8);
          doc.text(
            `Page ${i} of ${pageCount} • Traffic Violation Report (${startDate} to ${endDate})`,
            pageWidth / 2,
            pageHeight - 10,
            { align: "center" }
          );
        }
      },
    });

    doc.save(`Traffic_Violations_${startDate}_to_${endDate}.pdf`);
    
    setSnackbarMessage("PDF exported successfully");
    setSnackbarType("success");
    setOpenSnackbar(true);
  };

  // Reset all filters
  const handleReset = () => {
    setStartDate("");
    setEndDate("");
    setFilterStatus("All");
    setViolations([]);
    setFilteredViolations([]);
    setTotalViolations(0);
    setReportGeneratedDate(null);
    setCurrentPage(1);
  };

  // Handle page size change
  const handlePageSizeChange = (newSize: number) => {
    setItemsPerPage(newSize);
    setCurrentPage(1);
  };

  return (
    <>
      {/* Import font Roboto for interface */}
      <style>
        {`
          @import url('https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,100..900;1,100..900&display=swap');

          .roboto-report {
            font-family: "Roboto", sans-serif;
            font-optical-sizing: auto;
            font-weight: 400;
            font-style: normal;
          }
          
          .report-table-container {
            transition: opacity 0.5s ease, transform 0.5s ease;
            opacity: 0;
            transform: translateY(10px);
          }
          
          .report-table-container.animate-in {
            opacity: 1;
            transform: translateY(0);
          }
          
          .report-table tbody tr {
            transition: background-color 0.2s ease;
          }
          
          .report-table tbody tr:hover {
            background-color: rgba(63, 81, 181, 0.05) !important;
          }
          
          .date-input-label {
            display: flex;
            align-items: center;
            gap: 5px;
          }
          
          .pagination-controls {
            display: flex;
            align-items: center;
            gap: 1rem;
          }
          
          .status-chip {
            transition: transform 0.2s ease;
          }
          
          .status-chip:hover {
            transform: scale(1.05);
          }
          
          @media (max-width: 600px) {
            .pagination-controls {
              flex-direction: column;
              align-items: flex-start;
              gap: 0.5rem;
            }
          }
        `}
      </style>

      <Box sx={{ 
        padding: { xs: 2, md: 3 },
        backgroundColor: "#fafafa", 
        minHeight: "100vh" 
      }} className="roboto-report">
        <Card elevation={3} sx={{ 
          borderRadius: 2, 
          overflow: 'hidden',
          mb: 3
        }}>
          <Box sx={{ 
            bgcolor: 'primary.main', 
            color: 'white', 
            py: 2, 
            px: 3,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap'
          }}>
            <Typography variant="h5" fontWeight="bold">
              Traffic Violation Report
            </Typography>
            
            {reportGeneratedDate && (
              <Chip 
                label={`Generated: ${format(reportGeneratedDate, "dd/MM/yyyy HH:mm")}`}
                size="small"
                sx={{ 
                  bgcolor: 'rgba(255,255,255,0.2)', 
                  color: 'white',
                  '& .MuiChip-label': {
                    px: 1
                  }
                }}
              />
            )}
          </Box>
          
          <CardContent>
            <Grid container spacing={2}>
              <Grid item xs={12} md={9}>
                <Box sx={{
                  display: "flex",
                  flexDirection: { xs: "column", sm: "row" },
                  gap: 2,
                  alignItems: { sm: "center" },
                }}>
                  <TextField
                    type="date"
                    label={
                      <span className="date-input-label">
                        <DateRangeIcon fontSize="small" sx={{ opacity: 0.7 }} />
                        Start Date
                      </span>
                    }
                    InputLabelProps={{ shrink: true }}
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    fullWidth
                    inputProps={{ max: today }}
                    size="small"
                  />
                  <TextField
                    type="date"
                    label={
                      <span className="date-input-label">
                        <DateRangeIcon fontSize="small" sx={{ opacity: 0.7 }} />
                        End Date
                      </span>
                    }
                    InputLabelProps={{ shrink: true }}
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    fullWidth
                    inputProps={{ max: today }}
                    size="small"
                  />
                  <StatusSelect 
                    filterStatus={filterStatus} 
                    setFilterStatus={setFilterStatus} 
                    disabled={violations.length === 0}
                  />
                </Box>
              </Grid>
              
              <Grid item xs={12} md={3}>
                <Box sx={{ 
                  display: "flex",
                  gap: 1,
                  height: '100%'
                }}>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={fetchViolations}
                    fullWidth
                    startIcon={<RefreshIcon />}
                    disabled={loading}
                  >
                    {loading ? "Loading..." : "Generate Report"}
                  </Button>
                  
                  <Tooltip title="Reset Filters">
                    <IconButton 
                      color="default" 
                      onClick={handleReset}
                      sx={{ border: '1px solid #e0e0e0' }}
                    >
                      <RefreshIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Grid>
            </Grid>
            
            {/* Stats row */}
            {totalViolations > 0 && (
              <Box sx={{ 
                mt: 3, 
                p: 2, 
                bgcolor: 'background.default', 
                borderRadius: 1,
                display: 'flex',
                flexWrap: 'wrap',
                gap: 2,
                justifyContent: 'space-around'
              }}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="caption" color="textSecondary">
                    Total Records
                  </Typography>
                  <Typography variant="h6" fontWeight="bold">
                    {totalViolations}
                  </Typography>
                </Box>
                
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="caption" color="textSecondary">
                    Filtered Records
                  </Typography>
                  <Typography variant="h6" fontWeight="bold">
                    {filteredViolations.length}
                  </Typography>
                </Box>
                
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="caption" color="textSecondary">
                    Date Range
                  </Typography>
                  <Typography variant="h6" fontWeight="bold">
                    {startDate} - {endDate}
                  </Typography>
                </Box>
                
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="caption" color="textSecondary">
                    Status Filter
                  </Typography>
                  <Typography variant="h6" fontWeight="bold">
                    {filterStatus}
                  </Typography>
                </Box>
              </Box>
            )}
          </CardContent>
        </Card>

        {loading ? (
          <Card elevation={2} sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
            <CircularProgress />
            <Typography variant="body2" mt={2} color="textSecondary">
              Loading violations data, please wait...
            </Typography>
          </Card>
        ) : filteredViolations.length > 0 ? (
          <Card 
            elevation={2} 
            sx={{ borderRadius: 2, overflow: 'hidden' }}
            className={`report-table-container ${animateTable ? 'animate-in' : ''}`}
          >
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              px: 2, 
              py: 1.5,
              bgcolor: '#f5f5f5',
              borderBottom: '1px solid #e0e0e0'
            }}>
              <Typography variant="subtitle1" fontWeight={500}>
                Violation Records {filteredViolations.length > 0 && 
                `(${(currentPage - 1) * itemsPerPage + 1}-${Math.min(currentPage * itemsPerPage, filteredViolations.length)} of ${filteredViolations.length})`}
              </Typography>
              
              <Button
                variant="outlined"
                color="primary"
                onClick={handleExportPDF}
                startIcon={<FileDownloadIcon />}
                size="small"
              >
                Export PDF
              </Button>
            </Box>
            
            <TableContainer sx={{ maxHeight: 'calc(100vh - 350px)' }}>
              <Table stickyHeader size={isMobile ? "small" : "medium"} className="report-table">
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold', bgcolor: "#f9f9f9" }}>ID</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', bgcolor: "#f9f9f9" }}>Location</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', bgcolor: "#f9f9f9" }}>License Plate</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', bgcolor: "#f9f9f9" }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', bgcolor: "#f9f9f9" }}>Date</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {paginatedViolations.map((violation, index) => (
                    <TableRow 
                      key={violation.violation_id}
                      sx={{ 
                        bgcolor: index % 2 === 0 ? 'inherit' : 'rgba(0, 0, 0, 0.02)',
                        transition: 'all 0.2s'
                      }}
                    >
                      <TableCell>{violation.violation_id}</TableCell>
                      <TableCell>
                        <Tooltip title={violation.location || "N/A"} arrow>
                          <Typography noWrap sx={{ maxWidth: isTablet ? 150 : 250 }}>
                            {violation.location || "N/A"}
                          </Typography>
                        </Tooltip>
                      </TableCell>
                      <TableCell sx={{ fontWeight: 500 }}>{violation.plate_number || "N/A"}</TableCell>
                      <TableCell>
                        <StatusChip status={violation.status_name} />
                      </TableCell>
                      <TableCell>{formatDateDisplay(violation.detected_at)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
            
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              px: 2, 
              py: 1.5,
              bgcolor: '#f5f5f5',
              borderTop: '1px solid #e0e0e0',
              flexDirection: isMobile ? 'column' : 'row',
              gap: isMobile ? 2 : 0
            }}>
              <Box className="pagination-controls">
                <Typography variant="body2" color="textSecondary">
                  Records per page:
                </Typography>
                <Select
                  value={itemsPerPage}
                  onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                  size="small"
                  sx={{ minWidth: 70 }}
                >
                  <MenuItem value={5}>5</MenuItem>
                  <MenuItem value={10}>10</MenuItem>
                  <MenuItem value={20}>20</MenuItem>
                  <MenuItem value={50}>50</MenuItem>
                </Select>
              </Box>
              
              <Pagination
                count={totalPages}
                page={currentPage}
                onChange={(_event, value) => setCurrentPage(value)}
                color="primary"
                size={isMobile ? "small" : "medium"}
              />
            </Box>
          </Card>
        ) : (
          violations.length > 0 ? (
            <Card elevation={2} sx={{ p: 3, borderRadius: 2 }}>
              <Alert 
                severity="info" 
                icon={<InfoIcon />}
                sx={{ 
                  alignItems: 'center',
                  '& .MuiAlert-message': { 
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    width: '100%'
                  }
                }}
              >
                <Typography variant="subtitle1" gutterBottom align="center">
                  No violations found for status "{filterStatus}"
                </Typography>
                <Typography variant="body2" color="textSecondary" align="center">
                  Try selecting a different status filter or date range
                </Typography>
                <Button 
                  variant="outlined" 
                  color="primary" 
                  size="small" 
                  onClick={() => setFilterStatus("All")}
                  sx={{ mt: 2 }}
                >
                  Show All Violations
                </Button>
              </Alert>
            </Card>
          ) : (
            <Card elevation={2} sx={{ p: 3, borderRadius: 2 }}>
              <Alert 
                severity="info"
                sx={{ 
                  alignItems: 'center',
                  '& .MuiAlert-message': {
                    width: '100%',
                    textAlign: 'center'
                  }
                }}
              >
                <Typography variant="subtitle1" gutterBottom>
                  No violations found for the selected criteria
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Please select a date range and generate the report
                </Typography>
              </Alert>
            </Card>
          )
        )}

        <Snackbar
          open={openSnackbar}
          autoHideDuration={4000}
          onClose={() => setOpenSnackbar(false)}
          TransitionComponent={Fade}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert 
            severity={snackbarType} 
            variant="filled" 
            sx={{ width: "100%" }}
            onClose={() => setOpenSnackbar(false)}
          >
            {snackbarMessage}
          </Alert>
        </Snackbar>
      </Box>
    </>
  );
};

export default ReportPage;