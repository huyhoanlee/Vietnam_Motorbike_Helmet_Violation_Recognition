import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import axios from "axios";

const API_REFRESH_URL = "https://hanaxuan-backend.hf.space/api/accounts/refresh/?refresh={{refresh}}";

interface PrivateRouteProps {
  element: JSX.Element;
  requiredRole?: string; 
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ element, requiredRole }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("access_token");
      const role = localStorage.getItem("user_role");
      
      if (!token) {
        setIsAuthenticated(false);
        return;
      }

      try {
        // Kiểm tra token có hợp lệ không
        await axios.get("https://hanaxuan-backend.hf.space/api/accounts/get-all/", {
          headers: { Authorization: `Bearer ${token}` },
        });

        setIsAuthenticated(true);
        setUserRole(role);
      } catch (error) {
        // Nếu token hết hạn, thử refresh token
        const refreshToken = localStorage.getItem("refresh_token");

        if (refreshToken) {
          try {
            const response = await axios.post(API_REFRESH_URL, { refresh: refreshToken });
            const newToken = response.data.access;
            const newRole = response.data.role || role;
            localStorage.setItem("access_token", newToken);
            localStorage.setItem("user_role", newRole);
            
            setIsAuthenticated(true);
            setUserRole(newRole);
          } catch {
            setIsAuthenticated(false);
          }
        } else {
          setIsAuthenticated(false);
        }
      }
    };

    checkAuth();
  }, []);

  if (isAuthenticated === null) return <div>Loading...</div>;

  if (!isAuthenticated) return <Navigate to="/" />;
  

  if (requiredRole && requiredRole !== userRole) return <Navigate to="/dashboard" />;

  return element;
};

export default PrivateRoute;
