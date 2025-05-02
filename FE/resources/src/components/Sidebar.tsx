import React, { useState, useEffect } from "react";
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
import VideoCameraFrontIcon from '@mui/icons-material/VideoCameraFront';
import DescriptionIcon from "@mui/icons-material/Description";
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import EmojiPeopleIcon from '@mui/icons-material/EmojiPeople';
import HomeIcon from '@mui/icons-material/Home';
import PermContactCalendarIcon from '@mui/icons-material/PermContactCalendar';
import TwoWheelerIcon from '@mui/icons-material/TwoWheeler';
import CameraEnhanceIcon from '@mui/icons-material/CameraEnhance';


const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [selected, setSelected] = useState(location.pathname);
  const [role, setRole] = useState<string>(''); 
  // const username = localStorage.getItem("username") || "User";
 
  useEffect(() => {
    const userRole = localStorage.getItem("user_role"); 
    setRole(userRole || ""); 
  }, []);

  const handleNavigation = (path: string) => {
    setSelected(path);
    navigate(path);
  };

  // Cập nhật danh sách menu dựa trên role
  const menuItems = [
    { text: "Dashboard", icon: <DashboardIcon />, path: "/dashboard", roles: ["Supervisor", "Admin"] },
    { text: "Account", icon: <AccountCircleIcon />, path: "/account", roles: ["Admin"] },
    { text: "Supervisor Maintainance", icon: <ManageAccountsIcon />, path: "/modify", roles: ["Supervisor"] },
    { text: "Citizen Management", icon: <EmojiPeopleIcon />, path: "/citizen-management", roles: ["Supervisor"] },
    { text: "Devices", icon: <VideoCameraFrontIcon />, path: "/devices", roles: ["Supervisor"] },
    { text: "Streaming View", icon: <AssessmentIcon />, path: "/data-detection", roles: ["Supervisor"] },
    { text: "Violation Detection", icon: <WarningIcon />, path: "/violation-detection", roles: ["Supervisor"] },
    { text: "Reports", icon: <DescriptionIcon />, path: "/reports", roles: ["Supervisor"] },
    { text: "Citizen Home", icon: <HomeIcon />, path: "/citizen", roles: ["Citizen"] },
    { text: "My Infomation", icon: <PermContactCalendarIcon />, path: "/citizen-info", roles: ["Citizen"] },
    { text: "Vehicle Registration", icon: <TwoWheelerIcon />, path: "/citizen-applications", roles: ["Citizen"] },
    { text: "Citizen Reports", icon: <CameraEnhanceIcon />, path: "/report-proofs", roles: ["Citizen"] },
  ];

  // Lọc các menu item phù hợp với role người dùng
  const filteredMenuItems = menuItems.filter(item => item.roles?.includes(role));

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
        paddingTop: "30px",
        paddingLeft: "16px",
        paddingRight: "16px",
      }}
    >
      {/* Avatar + Thông tin */}
      <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
        <Avatar
          src="/path/to/avatar.jpg"
          sx={{ width: 80, height: 80 }}
        />
        {/* <Typography variant="h6" sx={{ mt: 1, fontWeight: "bold" }}>
          {username}
        </Typography> */}
        <Typography variant="body2" color="textSecondary">
          {role}
        </Typography>
        {/* <Typography variant="body2" color="textSecondary">
          Logged in: 10hr
        </Typography> */}
      </Box>

      {/* Danh sách Menu */}
      <List component="nav" sx={{ width: "100%", marginTop: "30px" }}>
        {filteredMenuItems.map((item, index) => (
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
                  fontSize: "15px",
                  color: selected === item.path ? "#5c47d2" : "#333",
                }}
              />
            </ListItemButton>
            {index !== filteredMenuItems.length - 1 && <Divider />}
          </React.Fragment>
        ))}
      </List>
    </div>
  );
};

export default Sidebar;
