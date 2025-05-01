import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";

interface PrivateRouteProps {
  element: JSX.Element;
  requiredRole?: string | string[];
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ element, requiredRole }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  useEffect(() => {
    const accessToken = localStorage.getItem("access_token");
    const role = localStorage.getItem("user_role");

    if (accessToken) {
      setIsAuthenticated(true);
      setUserRole(role);
    } else {
      setIsAuthenticated(false);
    }
  }, []);

  if (isAuthenticated === null) return <div>Loading...</div>;

  if (!isAuthenticated) return <Navigate to="/" />;

  if (requiredRole) {
  const allowedRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
  if (!userRole || !allowedRoles.includes(userRole)) {
    return <Navigate to="/dashboard" />;
  }
}

  return element;
};

export default PrivateRoute;
