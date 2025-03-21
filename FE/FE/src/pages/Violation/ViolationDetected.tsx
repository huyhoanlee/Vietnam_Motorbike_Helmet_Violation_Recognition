import React, { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Checkbox,
  IconButton,
  Typography,
  Box,
  Button,
  Collapse,
  CircularProgress,
  Snackbar,
  Alert,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import axios from "axios";
import ViolationDetail from "./ViolationDetails";
import { format } from "date-fns";

const API_BASE_URL = "https://hanaxuan-backend.hf.space/api/violations";

const axiosInstance = axios.create();
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Interface cho dữ liệu vi phạm
interface Violation {
  id: number;
  location: string;
  camera_id: string
  plate_number: string;
  status: string;
  detected_at: string;
  image_url: string;
}

const ViolationDetected: React.FC = () => {
  const [violations, setViolations] = useState<Violation[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openSnackbar, setOpenSnackbar] = useState(false);

  // Fetch dữ liệu từ API
  useEffect(() => {
    const fetchViolations = async () => {
      try {
        const response = await axiosInstance.get(API_BASE_URL);
        setViolations(response.data);
      } catch (err) {
        setError("Failed to fetch violation data."); 
      } finally {
        setLoading(false);
      }
    };

    fetchViolations();
  }, []);

  // Mở rộng/Thu gọn chi tiết
  const toggleRow = (id: number) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  return (
    <Box sx={{ padding: 4 }}>
      <Typography variant="h4" sx={{ fontWeight: "bold", mb: 2 }}>
        Violation 
      </Typography>

      {loading ? (
        <CircularProgress />
      ) : error ? (
        <Typography color="error">{error}</Typography>
      ) : (
        <>
          <Typography variant="subtitle1" sx={{ mb: 2, color: "#666" }}>
            {violations.length} Violations Detected By AI
          </Typography>

          <Button
            variant="outlined"
            sx={{
              borderRadius: "20px",
              float: "right",
              borderColor: "#555",
              color: "#555",
              "&:hover": { backgroundColor: "#eee" },
            }}
          >
            Notify All Violations
          </Button>

          <TableContainer component={Paper} sx={{ borderRadius: "10px", mt: 4 }}>
            <Table>
              <TableHead sx={{ backgroundColor: "#f0e6ff" }}>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox />
                  </TableCell>
                  <TableCell>ID</TableCell>
                  <TableCell>Detection Address</TableCell>
                  <TableCell>License Plate</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Date</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {violations.map((violation) => (
                  <React.Fragment key={violation.id}>
                    {/* Hàng chính */}
                    <TableRow
                      sx={{
                        "&:hover": { backgroundColor: "#f9f9f9" },
                        transition: "0.3s",
                      }}
                    >
                      <TableCell padding="checkbox">
                        <Checkbox />
                      </TableCell>
                      <TableCell>{violation.id}</TableCell>
                      <TableCell>{violation.location}</TableCell>
                      <TableCell>{violation.plate_number}</TableCell>
                      <TableCell
                        sx={{
                          color: violation.status === "Critical" ? "red" : "orange",
                        }}
                      >
                        {violation.status}
                      </TableCell>
                      <TableCell>{format(violation.detected_at, "dd/MM/yyyy")}</TableCell>
                      <TableCell align="center">
                        <IconButton onClick={() => toggleRow(violation.id)}>
                          <ExpandMoreIcon
                            sx={{
                              transform:
                                expandedRow === violation.id
                                  ? "rotate(180deg)"
                                  : "rotate(0deg)",
                              transition: "0.3s",
                            }}
                          />
                        </IconButton>
                      </TableCell>
                    </TableRow>

                    {/* Hàng mở rộng hiển thị ViolationDetail */}
                    <TableRow>
                      <TableCell colSpan={7} sx={{ paddingBottom: 0, paddingTop: 0 }}>
                        <Collapse in={expandedRow === violation.id} timeout="auto" unmountOnExit>
                          <ViolationDetail violation={violation} />
                        </Collapse>
                      </TableCell>
                    </TableRow>
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          <Snackbar
            open={openSnackbar}
            autoHideDuration={3000}
            onClose={() => setOpenSnackbar(false)}
          >
            <Alert severity="error">{error}</Alert>
          </Snackbar>
        </>
      )}
    </Box>
  );
};

export default ViolationDetected;
