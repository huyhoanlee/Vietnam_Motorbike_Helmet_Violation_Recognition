import React, { useState } from "react";
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
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ViolationDetail from "./ViolationDetails"; 

// Dữ liệu giả lập về vi phạm
const violations = [
  {
    id: 1234,
    address: "3910 Quy Nhon",
    plate: "77B-12345",
    status: "Critical",
    date: "11/01/2025",
    description: "Not wearing a helmet",
    image: "https://via.placeholder.com/100",
  },
  {
    id: 5678,
    address: "456 Nguyen Hue",
    plate: "77A-67890",
    status: "Warning",
    date: "12/02/2025",
    description: "Running a red light",
    image: "https://via.placeholder.com/100",
  },
];

const ViolationDetected: React.FC = () => {
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  const toggleRow = (id: number) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  return (
    <Box sx={{ padding: 4 }}>
      <Typography variant="h4" sx={{ fontWeight: "bold", mb: 2 }}>
        Violation Detected
      </Typography>

      <Typography variant="subtitle1" sx={{ mb: 2, color: "#666" }}>
        {violations.length} Anomalies to Correct
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
                  <TableCell>{violation.address}</TableCell>
                  <TableCell>{violation.plate}</TableCell>
                  <TableCell sx={{ color: violation.status === "Critical" ? "red" : "orange" }}>
                    {violation.status}
                  </TableCell>
                  <TableCell>{violation.date}</TableCell>
                  <TableCell align="center">
                    <IconButton onClick={() => toggleRow(violation.id)}>
                      <ExpandMoreIcon
                        sx={{
                          transform: expandedRow === violation.id ? "rotate(180deg)" : "rotate(0deg)",
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
    </Box>
  );
};

export default ViolationDetected;
