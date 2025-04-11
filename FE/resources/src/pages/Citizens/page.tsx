import React from "react";
import {
  Box,
  Grid,
  Typography,
  Paper,
  Divider,
} from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";
import AssignmentIcon from "@mui/icons-material/Assignment";
import { useNavigate } from "react-router-dom";

const boxStyles = {
  height: 220,
  width: "100%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexDirection: "column",
  borderRadius: 4,
  cursor: "pointer",
  transition: "0.3s",
  boxShadow: 3,
  "&:hover": {
    boxShadow: 6,
    transform: "scale(1.02)",
    backgroundColor: "#f9f9ff",
  },
};

const CitizenManager: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Box sx={{ padding: 4 }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Citizen Management
      </Typography>

      <Divider sx={{ mb: 4 }} />

      <Grid container spacing={4}>
        {/* Box 1 - Citizen Info */}
        <Grid item xs={12} md={4}>
          <Paper
            sx={boxStyles}
            onClick={() => navigate("/citizen-info")}
            elevation={4}
          >
            <PersonIcon sx={{ fontSize: 50, color: "#4a148c", mb: 1 }} />
            <Typography variant="h6" fontWeight={600}>
              Personal Information
            </Typography>
            <Typography variant="body2" color="text.secondary">
              View or update citizen personal data
            </Typography>
          </Paper>
        </Grid>

        {/* Box 2 - Registration Requests */}
        <Grid item xs={12} md={4}>
          <Paper
            sx={boxStyles}
            onClick={() => navigate("/citizen-applications")}
            elevation={4}
          >
            <AssignmentIcon sx={{ fontSize: 50, color: "#1565c0", mb: 1 }} />
            <Typography variant="h6" fontWeight={600}>
              Registration Requests
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Review and process citizen requests
            </Typography>
          </Paper>
        </Grid>
         
         {/* Box 3 - Violation History */}
          <Grid item xs={12} md={4}>
          <Paper
            sx={boxStyles}
            onClick={() => navigate("/citizen-violation")}
            elevation={4}
          >
            <AssignmentIcon sx={{ fontSize: 50, color: "#1565c0", mb: 1 }} />
            <Typography variant="h6" fontWeight={600}>
              Violation History
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Review and process citizen requests
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default CitizenManager;
