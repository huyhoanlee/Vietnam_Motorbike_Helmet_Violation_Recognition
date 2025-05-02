import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import axios from "axios";
import { Box, CircularProgress, Typography } from "@mui/material";
import config from "../config";

const API_BASE_URL = config.API_URL;
const API_REFRESH_URL = `${API_BASE_URL}accounts/refresh/`;

interface PrivateRouteProps {
  element: JSX.Element;
  requiredRole?: string | string[]; // Allow single role or array of roles
  redirectPath?: string; // Allow custom redirect path
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ 
  element, 
  requiredRole, 
  redirectPath = "/" 
}) => {
  const [authState, setAuthState] = useState<{
    isAuthenticated: boolean | null;
    userRole: string | null;
    isLoading: boolean;
    error: string | null;
  }>({
    isAuthenticated: null,
    userRole: null,
    isLoading: true,
    error: null
  });

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("access_token");
      const role = localStorage.getItem("user_role");
      
      if (!token || token === "undefined") {
        setAuthState({
          isAuthenticated: false,
          userRole: null,
          isLoading: false,
          error: "No valid token found"
        });
        return;
      }

      try {
        // Validate token
        await axios.get(`${API_BASE_URL}accounts/get-all/`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        setAuthState({
          isAuthenticated: true,
          userRole: role,
          isLoading: false,
          error: null
        });
      } catch (error) {
        // Try refresh token if original token expired
        const refreshToken = localStorage.getItem("refresh_token");

        if (refreshToken && refreshToken !== "undefined") {
          try {
            const response = await axios.post(
              API_REFRESH_URL,
              { refresh: refreshToken }
            );
            
            const newToken = response.data.access;
            const newRole = response.data.role || role;
            
            localStorage.setItem("access_token", newToken);
            localStorage.setItem("user_role", newRole);
            
            setAuthState({
              isAuthenticated: true,
              userRole: newRole,
              isLoading: false,
              error: null
            });
          } catch (refreshError) {
            setAuthState({
              isAuthenticated: false,
              userRole: null,
              isLoading: false,
              error: "Token refresh failed"
            });
          }
        } else {
          setAuthState({
            isAuthenticated: false,
            userRole: null,
            isLoading: false,
            error: "No refresh token available"
          });
        }
      }
    };

    checkAuth();
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
        <CircularProgress size={60} thickness={4} />
        <Typography variant="h6" sx={{ mt: 2, color: "#666" }}>
          Verifying access...
        </Typography>
      </Box>
    );
  }

  // Redirect to login if not authenticated
  if (!authState.isAuthenticated) {
    return <Navigate to={redirectPath} />;
  }
  
  // Check for role-based access
  if (requiredRole) {
    const userRole = authState.userRole;
    
    // Handle multiple allowed roles
    const allowedRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
    
    if (!userRole || !allowedRoles.includes(userRole)) {
      // Redirect to unauthorized page
      return <Navigate to="/unauthorized" />;
    }
  }

  return element;
};

export default PrivateRoute;