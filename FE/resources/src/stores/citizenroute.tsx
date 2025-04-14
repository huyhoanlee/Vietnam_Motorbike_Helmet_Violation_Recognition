import React from "react";
import { Navigate } from "react-router-dom";

interface Props {
  element: JSX.Element;
}

const CitizenRoute: React.FC<Props> = ({ element }) => {
  const isAuthenticated = localStorage.getItem("is_citizen_authenticated") === "true";

  return isAuthenticated ? element : <Navigate to="/citizen" />;
};

export default CitizenRoute;
