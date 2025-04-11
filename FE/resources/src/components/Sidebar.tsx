import React, { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  Avatar,
  Box,
  Typography,
} from "@mui/material";
import DashboardIcon from "@mui/icons-material/Dashboard";
import AssessmentIcon from "@mui/icons-material/Assessment";
import WarningIcon from "@mui/icons-material/Warning";
import DevicesIcon from "@mui/icons-material/Devices";
import DescriptionIcon from "@mui/icons-material/Description";
import AccountCircleIcon from '@mui/icons-material/AccountCircle';

const menuItems = [
  { text: "Dashboard", icon: <DashboardIcon />, path: "/dashboard" },
  { text: "Account", icon: <AccountCircleIcon />, path: "/account" },
  { text: "Streaming View", icon: <AssessmentIcon />, path: "/data-detection" },
  { text: "Violation Detection", icon: <WarningIcon />, path: "/violation-detection" },
  { text: "Devices", icon: <DevicesIcon />, path: "/devices" },
  { text: "Modify", icon: <DevicesIcon />, path: "/modify" },
  { text: "Reports", icon: <DescriptionIcon />, path: "/reports" },
];

const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [selected, setSelected] = useState(location.pathname);

  const handleNavigation = (path: string) => {
    setSelected(path);
    navigate(path);
  };

  return (
    <div
      style={{
        width: "250px",
        height: "100vh",
        backgroundColor: "#f7f3fa",
        color: "#333",
        boxShadow: "2px 0 5px rgba(0, 0, 0, 0.1)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        paddingTop: "20px",
      }}
    >
      {/* Avatar + Thông tin */}
      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <Avatar
          alt="Kien Nguyen"
          src="/path/to/avatar.jpg"
          sx={{ width: 80, height: 80 }}
        />
        <Typography variant="h6" sx={{ mt: 1, fontWeight: "bold" }}>
          Kien Nguyen
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Admin
        </Typography>
        <Typography variant="body2" color="textSecondary">
          Logged in: 10hr
        </Typography>
      </Box>

      {/* Danh sách Menu */}
      <List component="nav" sx={{ width: "100%", marginTop: "20px" }}>
        {menuItems.map((item, index) => (
          <React.Fragment key={item.text}>
            <ListItemButton
              onClick={() => handleNavigation(item.path)}
              sx={{
                backgroundColor: selected === item.path ? "#d6d2eb" : "transparent",
                "&:hover": { backgroundColor: "#e0d6f8" },
                transition: "0.3s",
              }}
            >
              <ListItemIcon sx={{ color: selected === item.path ? "#5c47d2" : "#333" }}>
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.text}
                primaryTypographyProps={{
                  fontWeight: selected === item.path ? "bold" : "normal",
                  color: selected === item.path ? "#5c47d2" : "#333",
                }}
              />
            </ListItemButton>
            {index !== menuItems.length - 1 && <Divider />}
          </React.Fragment>
        ))}
      </List>
    </div>
  );
};

export default Sidebar;
