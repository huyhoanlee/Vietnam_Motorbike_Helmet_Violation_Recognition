import React from "react";
import { Typography, Box } from "@mui/material";

const NotFound: React.FC = () => {
  return (
    <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
      <Typography variant="h4" color="error">
        404 - Page Not Found
      </Typography>
    </Box>
  );
};

export default NotFound;
