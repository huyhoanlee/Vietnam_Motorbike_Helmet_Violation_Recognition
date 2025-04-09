import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import axios from "axios";

const API_REFRESH_URL = "https://hanaxuan-backend.hf.space/api/auth/refresh/";

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
        await axios.get(API_REFRESH_URL, {
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
            localStorage.setItem("access_token", newToken);

            setIsAuthenticated(true);
            setUserRole(role);
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
  
  // Phân quyền: chỉ admin mới vào được trang quản lý tài khoản
  if (requiredRole && requiredRole !== userRole) return <Navigate to="/dashboard" />;

  return element;
};

export default PrivateRoute;
