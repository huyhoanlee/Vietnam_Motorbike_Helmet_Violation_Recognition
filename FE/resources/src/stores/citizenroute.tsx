import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { Box, CircularProgress, Typography } from "@mui/material";

interface CitizenRouteProps {
  element: JSX.Element;
  redirectPath?: string;
}

const CitizenRoute: React.FC<CitizenRouteProps> = ({ 
  element, 
  redirectPath = "/citizen/login" 
}) => {
  const [authState, setAuthState] = useState<{
    isAuthenticated: boolean | null;
    isLoading: boolean;
  }>({
    isAuthenticated: null,
    isLoading: true,
  });

  useEffect(() => {
    // Check citizen authentication
    const checkAuth = () => {
      const isAuthenticated = localStorage.getItem("is_citizen_authenticated") === "true";
      const userRole = localStorage.getItem("user_role");
      
      // Ensure both authentication and correct role
      setAuthState({
        isAuthenticated: isAuthenticated && userRole === "Citizen",
        isLoading: false
      });
    };

    // Add small delay to simulate verification and improve UX
    const timer = setTimeout(checkAuth, 300);
    return () => clearTimeout(timer);
  }, []);

  // Show loading spinner while checking authentication
  if (authState.isLoading) {
    return (
      <Box 
        sx={{ 
          display: "flex", 
          flexDirection: "column",
          justifyContent: "center", 
          alignItems: "center", 
          minHeight: "100vh",
          bgcolor: "#f5f5f5"
        }}
      >
        <CircularProgress size={60} thickness={4} color="secondary" />
        <Typography variant="h6" sx={{ mt: 2, color: "#666" }}>
          Verifying citizen access...
        </Typography>
      </Box>
    );
  }

  return authState.isAuthenticated ? element : <Navigate to={redirectPath} />;
};

export default CitizenRoute;