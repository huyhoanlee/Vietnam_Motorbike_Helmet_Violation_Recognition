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
  useTheme,
  alpha,
  Collapse,
  Button,
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
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';

const Sidebar: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [selected, setSelected] = useState(location.pathname);
  const [role, setRole] = useState<string>(''); 
  const theme = useTheme();
  const [open, setOpen] = useState(true);
  
  useEffect(() => {
    const userRole = localStorage.getItem("user_role"); 
    setRole(userRole || ""); 
    
    // Update selected when location changes
    setSelected(location.pathname);
  }, [location.pathname]);

  const handleNavigation = (path: string) => {
    setSelected(path);
    navigate(path);
  };

  const handleClick = () => {
    setOpen(!open);
  };

  // Group menu items
  const adminMenuItems = [
    { text: "Dashboard", icon: <DashboardIcon />, path: "/dashboard" },
    { text: "Account Management", icon: <AccountCircleIcon />, path: "/account" },
  ];

  const supervisorMenuItems = [
    { text: "Dashboard", icon: <DashboardIcon />, path: "/dashboard" },
    { text: "Supervisor Maintenance", icon: <ManageAccountsIcon />, path: "/modify" },
    { text: "Citizen Management", icon: <EmojiPeopleIcon />, path: "/citizen-management" },
    { text: "Devices", icon: <VideoCameraFrontIcon />, path: "/devices" },
  ];

  const dataMenuItems = [
    { text: "Streaming View", icon: <AssessmentIcon />, path: "/data-detection" },
    { text: "Violation Detection", icon: <WarningIcon />, path: "/violation-detection" },
    { text: "Reports", icon: <DescriptionIcon />, path: "/reports" },
  ];

  const citizenMenuItems = [
    { text: "Citizen Home", icon: <HomeIcon />, path: "/citizen" },
    { text: "My Information", icon: <PermContactCalendarIcon />, path: "/citizen-info" },
    { text: "Vehicle Registration", icon: <TwoWheelerIcon />, path: "/citizen-applications" },
    { text: "Citizen Reports", icon: <CameraEnhanceIcon />, path: "/report-proofs" },
  ];

  // Get greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <Box
      sx={{
        width: "260px",
        height: "100vh",
        background: `linear-gradient(180deg, ${alpha(theme.palette.primary.dark, 0.15)} 0%, ${alpha(theme.palette.primary.light, 0.05)} 100%)`,
        color: theme.palette.text.primary,
        boxShadow: "2px 0 10px rgba(0, 0, 0, 0.05)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        position: "sticky",
        top: 0,
      }}
    >
      {/* Profile Section */}
      <Box 
        sx={{ 
          p: 3,
          display: "flex", 
          flexDirection: "column", 
          alignItems: "center",
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
          pb: 3
        }}
      >
        <Avatar
          sx={{ 
            width: 70, 
            height: 70,
            bgcolor: theme.palette.primary.main,
            color: theme.palette.common.white,
            fontSize: 28,
            fontWeight: 'bold',
            mb: 1,
            boxShadow: `0 4px 12px ${alpha(theme.palette.primary.main, 0.3)}`
          }}
        >
          {role.charAt(0)}
        </Avatar>
        
        <Box sx={{ textAlign: "center", mt: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: "600" }}>
            {getGreeting()}
          </Typography>
          <Typography 
            variant="body2" 
            sx={{ 
              fontWeight: 'bold', 
              color: theme.palette.primary.main,
              bgcolor: alpha(theme.palette.primary.light, 0.2),
              px: 2,
              py: 0.5,
              borderRadius: 1,
              display: 'inline-block',
              mt: 0.5
            }}
          >
            {role || 'Guest'}
          </Typography>
        </Box>
      </Box>

      {/* Menu Section with Scrolling */}
      <Box
        sx={{
          overflowY: "auto",
          flex: 1,
          "&::-webkit-scrollbar": {
            width: "6px",
          },
          "&::-webkit-scrollbar-track": {
            background: alpha(theme.palette.background.paper, 0.5),
          },
          "&::-webkit-scrollbar-thumb": {
            background: alpha(theme.palette.primary.main, 0.3),
            borderRadius: "3px",
          },
          "&::-webkit-scrollbar-thumb:hover": {
            background: alpha(theme.palette.primary.main, 0.5),
          },
        }}
      >
        <List component="nav" sx={{ width: "100%", p: 2 }}>
          {/* Admin Menu */}
          {role === "Admin" && adminMenuItems.map((item) => (
            <ListItemButton
              key={item.text}
              onClick={() => handleNavigation(item.path)}
              sx={{
                backgroundColor: selected === item.path ? alpha(theme.palette.primary.main, 0.15) : "transparent",
                borderRadius: "8px",
                mb: 1,
                "&:hover": { 
                  backgroundColor: alpha(theme.palette.primary.main, 0.1),
                },
                transition: "0.2s",
              }}
            >
              <ListItemIcon 
                sx={{ 
                  color: selected === item.path ? theme.palette.primary.main : theme.palette.text.secondary,
                  minWidth: '40px'
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.text}
                primaryTypographyProps={{
                  fontWeight: selected === item.path ? "600" : "400",
                  fontSize: "14px",
                  color: selected === item.path ? theme.palette.primary.main : theme.palette.text.primary,
                }}
              />
            </ListItemButton>
          ))}

          {/* Supervisor Menu */}
          {role === "Supervisor" && (
            <>
              {supervisorMenuItems.map((item) => (
                <ListItemButton
                  key={item.text}
                  onClick={() => handleNavigation(item.path)}
                  sx={{
                    backgroundColor: selected === item.path ? alpha(theme.palette.primary.main, 0.15) : "transparent",
                    borderRadius: "8px",
                    mb: 1,
                    "&:hover": { 
                      backgroundColor: alpha(theme.palette.primary.main, 0.1),
                    },
                    transition: "0.2s",
                  }}
                >
                  <ListItemIcon 
                    sx={{ 
                      color: selected === item.path ? theme.palette.primary.main : theme.palette.text.secondary,
                      minWidth: '40px'
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.text}
                    primaryTypographyProps={{
                      fontWeight: selected === item.path ? "600" : "400",
                      fontSize: "14px",
                      color: selected === item.path ? theme.palette.primary.main : theme.palette.text.primary,
                    }}
                  />
                </ListItemButton>
              ))}
              
              <ListItemButton onClick={handleClick} sx={{ borderRadius: "8px", mb: 1 }}>
                <ListItemIcon sx={{ minWidth: '40px' }}>
                  <AssessmentIcon />
                </ListItemIcon>
                <ListItemText 
                  primary="Data & Reports" 
                  primaryTypographyProps={{ fontSize: "14px" }}
                />
                {open ? <ExpandLess /> : <ExpandMore />}
              </ListItemButton>
              
              <Collapse in={open} timeout="auto" unmountOnExit>
                <List component="div" disablePadding>
                  {dataMenuItems.map((item) => (
                    <ListItemButton
                      key={item.text}
                      onClick={() => handleNavigation(item.path)}
                      sx={{
                        pl: 4,
                        backgroundColor: selected === item.path ? alpha(theme.palette.primary.main, 0.15) : "transparent",
                        borderRadius: "8px",
                        ml: 2,
                        mb: 1,
                        "&:hover": { 
                          backgroundColor: alpha(theme.palette.primary.main, 0.1),
                        },
                      }}
                    >
                      <ListItemIcon 
                        sx={{ 
                          color: selected === item.path ? theme.palette.primary.main : theme.palette.text.secondary,
                          minWidth: '40px'
                        }}
                      >
                        {item.icon}
                      </ListItemIcon>
                      <ListItemText
                        primary={item.text}
                        primaryTypographyProps={{
                          fontWeight: selected === item.path ? "600" : "400",
                          fontSize: "14px",
                          color: selected === item.path ? theme.palette.primary.main : theme.palette.text.primary,
                        }}
                      />
                    </ListItemButton>
                  ))}
                </List>
              </Collapse>
            </>
          )}

          {/* Citizen Menu */}
          {role === "Citizen" && citizenMenuItems.map((item) => (
            <ListItemButton
              key={item.text}
              onClick={() => handleNavigation(item.path)}
              sx={{
                backgroundColor: selected === item.path ? alpha(theme.palette.primary.main, 0.15) : "transparent",
                borderRadius: "8px",
                mb: 1,
                "&:hover": { 
                  backgroundColor: alpha(theme.palette.primary.main, 0.1),
                },
                transition: "0.2s",
              }}
            >
              <ListItemIcon 
                sx={{ 
                  color: selected === item.path ? theme.palette.primary.main : theme.palette.text.secondary,
                  minWidth: '40px'
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.text}
                primaryTypographyProps={{
                  fontWeight: selected === item.path ? "600" : "400",
                  fontSize: "14px",
                  color: selected === item.path ? theme.palette.primary.main : theme.palette.text.primary,
                }}
              />
            </ListItemButton>
          ))}
        </List>
      </Box>
      
      {/* Footer */}
      <Box 
        sx={{ 
          p: 2, 
          borderTop: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
          display: 'flex',
          justifyContent: 'center'
        }}
      >
        <Button
          variant="outlined"
          size="small"
          color="primary"
          onClick={() => navigate("/")}
          fullWidth
          sx={{ 
            borderRadius: '8px',
            textTransform: 'none',
            py: 1
          }}
        >
          Traffic Monitoring System
        </Button>
      </Box>
    </Box>
  );
};

export default Sidebar;