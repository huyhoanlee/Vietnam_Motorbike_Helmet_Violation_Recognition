import React, { useEffect, useState } from "react";
import { Typography, Box, Button, Container, Paper } from "@mui/material";
import SecurityIcon from "@mui/icons-material/Security";
import { useNavigate } from "react-router-dom";

const Unauthorized: React.FC = () => {
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState<string | null>(null);
  
  useEffect(() => {
    // Get current user role for better guidance
    const role = localStorage.getItem("user_role");
    setUserRole(role);
  }, []);

  // Determine where to redirect based on user role
  const handleRedirect = () => {
    if (userRole === "Citizen") {
      navigate("/citizen");
    } else if (userRole === "Supervisor" || userRole === "Admin") {
      navigate("/dashboard");
    } else {
      navigate("/");
    }
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ 
        minHeight: "100vh", 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center",
        py: 4
      }}>
        <Paper elevation={3} sx={{ 
          p: 5, 
          textAlign: "center",
          borderRadius: 2,
          backgroundColor: "#f9f9f9",
          borderTop: "5px solid #f44336"
        }}>
          <SecurityIcon sx={{ fontSize: 80, color: "#f44336", mb: 2 }} />
          
          <Typography variant="h4" fontWeight="bold" color="error" gutterBottom>
            Unauthorized Access
          </Typography>
          
          <Typography variant="h6" color="textSecondary" sx={{ mb: 4 }}>
            You don't have permission to access this page.
          </Typography>
          
          <Typography variant="body1" sx={{ mb: 3 }}>
            {userRole 
              ? `Your current role (${userRole}) does not have sufficient privileges for this resource.`
              : "Please log in to access this system with the appropriate credentials."}
          </Typography>
          
          <Box sx={{ mt: 3, display: "flex", justifyContent: "center", gap: 2 }}>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={handleRedirect}
              size="large"
            >
              Go to Dashboard
            </Button>
            
            <Button 
              variant="outlined"
              onClick={() => navigate("/")}
              size="large"
            >
              Back to Home
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Unauthorized;