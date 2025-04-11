import React from "react";
import { Box, Typography, Paper, Grid } from "@mui/material";
import { useNavigate } from "react-router-dom";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import VerifiedIcon from "@mui/icons-material/Verified";

const boxStyles = {
  height: 160,
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
    backgroundColor: "#f3f3ff",
  },
};

const Modify: React.FC = () => {
  const navigate = useNavigate();

  return (
    <Box sx={{ padding: 4 }}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
       Modify - Notify & Management
      </Typography>

      <Grid container spacing={4} mt={2}>
        {/* Box 1 - Status */}
        <Grid item xs={12} sm={4} md={2}>
          <Paper
            sx={boxStyles}
            onClick={() => navigate("/manage-status")}
            elevation={4}
          >
            <VerifiedIcon sx={{ fontSize: 40, color: "#6a1b9a", mb: 1 }} />
            <Typography variant="h6" fontWeight="500">
              Status
            </Typography>
            <Typography variant="body2" color="text.secondary">
              View or update status types
            </Typography>
          </Paper>
        </Grid>

        {/* Box 2 - Location */}
        <Grid item xs={12} sm={4} md={2}>
          <Paper
            sx={boxStyles}
            onClick={() => navigate("/manage-location")}
            elevation={4}
          >
            <LocationOnIcon sx={{ fontSize: 40, color: "#1565c0", mb: 1 }} />
            <Typography variant="h6" fontWeight="500">
              Location
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Add or edit location points
            </Typography>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Modify;
