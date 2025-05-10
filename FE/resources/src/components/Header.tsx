import React, { useState, useEffect } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Badge,
  Menu,
  MenuItem,
  IconButton,
  Divider,
  CircularProgress,
  ListItemText,
  Avatar,
  useTheme,
  alpha,
  Tooltip,
  ListItemIcon
} from "@mui/material";
import NotificationsIcon from "@mui/icons-material/Notifications";
import LogoutIcon from "@mui/icons-material/Logout";
import PersonIcon from "@mui/icons-material/Person";
import DashboardIcon from "@mui/icons-material/Dashboard";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../services/axiosInstance";

interface Notification {
  id: number;
  licensePlate: string;
  violation: string;
  dateTime: string;
  cameraId: string;
}

const Header: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [notificationAnchorEl, setNotificationAnchorEl] = useState<null | HTMLElement>(null);
  const [profileAnchorEl, setProfileAnchorEl] = useState<null | HTMLElement>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [role, setRole] = useState<string>(''); 
 
  useEffect(() => {
    const userRole = localStorage.getItem("user_role"); 
    setRole(userRole || ""); 
  }, []);

  useEffect(() => {
    const fetchNotifications = async () => {
      setLoading(true);
      try {
        const response = await axiosInstance.get("https://hanaxuan-ai-service.hf.space/result");
        const formattedData: Notification[] = response.data.device_list.flatMap(
          (device: any) =>
            device.detected_result.map((detection: any) => ({
              id: detection.vehicle_id,
              licensePlate: detection.plate_numbers,
              violation: detection.violation,
              dateTime: detection.timestamp,
              cameraId: device.camera_id,
            }))
        );
        setNotifications(formattedData.slice(0, 5));
      } catch (err) {
        setError("Failed to fetch notifications.");
      }
      setLoading(false);
    };

    fetchNotifications();
  }, []);

  const handleOpenNotifications = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationAnchorEl(event.currentTarget);
  };

  const handleCloseNotifications = () => {
    setNotificationAnchorEl(null);
  };

  const handleOpenProfileMenu = (event: React.MouseEvent<HTMLElement>) => {
    setProfileAnchorEl(event.currentTarget);
  };

  const handleCloseProfileMenu = () => {
    setProfileAnchorEl(null);
  };

  const handleNotificationClick = (id: number) => {
    navigate(`/detection-detail/${id}`);
    handleCloseNotifications();
  };

  const handleProfileClick = () => {
    navigate("/profile");
    handleCloseProfileMenu();
  };

  const handleDashboardClick = () => {
    navigate("/dashboard");
    handleCloseProfileMenu();
  };

  const handleLogout = async () => {
    try {
      await axiosInstance.post("https://hanaxuan-backend.hf.space/api/accounts/logout/");
    } catch (error) {
      console.error("Error logging out:", error);
    }

    localStorage.setItem("access_token", "undefined");
    localStorage.setItem("refresh_token", "undefined");
    localStorage.setItem("is_citizen_authenticated", "undefined");
    localStorage.setItem("user_role", "undefined");
    navigate("/");
  };

  // Generate greeting based on time of day
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  // Format relative time for notifications
  const formatRelativeTime = (dateTime: string) => {
    try {
      const date = new Date(dateTime);
      const now = new Date();
      const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
      
      if (diffInMinutes < 1) return 'Just now';
      if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
      
      const diffInHours = Math.floor(diffInMinutes / 60);
      if (diffInHours < 24) return `${diffInHours}h ago`;
      
      const diffInDays = Math.floor(diffInHours / 24);
      if (diffInDays < 7) return `${diffInDays}d ago`;
      
      return date.toLocaleDateString();
    } catch (e) {
      return dateTime;
    }
  };

  // Role-based color
  const getRoleColor = () => {
    switch(role) {
      case 'Admin': return theme.palette.error.main;
      case 'Supervisor': return theme.palette.primary.main;
      case 'Citizen': return theme.palette.success.main;
      default: return theme.palette.text.secondary;
    }
  };

  return (
    <AppBar 
      position="sticky" 
      elevation={0}
      sx={{
        background: `linear-gradient(90deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
        borderBottom: `1px solid ${alpha(theme.palette.common.white, 0.1)}`,
      }}
    >
      <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
        {/* Left section */}
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <Typography 
            variant="h6" 
            component="div" 
            sx={{ 
              fontWeight: 600,
              letterSpacing: 0.5,
              fontSize: { xs: 16, sm: 20 }
            }}
          >
            Traffic Monitoring System
          </Typography>
        </Box>
        
        {/* Right section */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {/* Welcome message */}
          <Box sx={{ 
            display: { xs: 'none', md: 'flex' }, 
            flexDirection: 'column', 
            alignItems: 'flex-end', 
            mr: 2 
          }}>
            <Typography variant="body2" sx={{ color: alpha(theme.palette.common.white, 0.8) }}>
              {getGreeting()}
            </Typography>
            <Typography variant="body2" sx={{ 
              fontWeight: 'bold', 
              color: getRoleColor(),
              bgcolor: alpha(theme.palette.common.white, 0.9),
              px: 1,
              py: 0.2,
              borderRadius: 1,
              fontSize: 12,
              letterSpacing: 0.5
            }}>
              {role || 'Guest'}
            </Typography>
          </Box>
          
          {/* Notifications */}
          <Tooltip title="Notifications">
            <IconButton 
              color="inherit" 
              onClick={handleOpenNotifications}
              sx={{
                bgcolor: alpha(theme.palette.common.white, 0.1),
                '&:hover': {
                  bgcolor: alpha(theme.palette.common.white, 0.2),
                }
              }}
            >
              <Badge 
                badgeContent={notifications.length} 
                color="error"
                sx={{
                  '& .MuiBadge-badge': {
                    bgcolor: theme.palette.error.main,
                    color: theme.palette.common.white,
                  }
                }}
              >
                <NotificationsIcon />
              </Badge>
            </IconButton>
          </Tooltip>

          {/* Profile */}
          <Tooltip title="My Account">
            <IconButton 
              onClick={handleOpenProfileMenu}
              sx={{
                bgcolor: alpha(theme.palette.common.white, 0.1),
                '&:hover': {
                  bgcolor: alpha(theme.palette.common.white, 0.2),
                },
                ml: 1
              }}
            >
              <Avatar 
                sx={{ 
                  width: 32, 
                  height: 32,
                  bgcolor: theme.palette.primary.light,
                  color: theme.palette.common.white,
                  fontSize: 16,
                  fontWeight: 'bold'
                }}
              >
                {role.charAt(0)}
              </Avatar>
            </IconButton>
          </Tooltip>

          {/* Notifications Menu */}
          <Menu
            anchorEl={notificationAnchorEl}
            open={Boolean(notificationAnchorEl)}
            onClose={handleCloseNotifications}
            PaperProps={{
              elevation: 3,
              sx: { 
                width: "350px",
                maxHeight: '400px',
                borderRadius: 2,
                mt: 1.5,
                overflow: 'hidden'
              },
            }}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            <Box sx={{ p: 2, bgcolor: theme.palette.primary.main, color: 'white' }}>
              <Typography sx={{ fontWeight: "bold" }}>Notifications</Typography>
              <Typography variant="caption">
                You have {notifications.length} unread {notifications.length === 1 ? 'notification' : 'notifications'}
              </Typography>
            </Box>
            <Divider />
            
            <Box sx={{ maxHeight: '300px', overflow: 'auto' }}>
              {loading ? (
                <Box sx={{ p: 2, display: 'flex', justifyContent: 'center' }}>
                  <CircularProgress size={24} />
                </Box>
              ) : error ? (
                <MenuItem>{error}</MenuItem>
              ) : notifications.length === 0 ? (
                <Box sx={{ p: 3, textAlign: 'center' }}>
                  <Typography variant="body2" color="textSecondary">No new notifications</Typography>
                </Box>
              ) : (
                notifications.map((notification) => (
                  <MenuItem 
                    key={notification.id} 
                    onClick={() => handleNotificationClick(notification.id)}
                    sx={{ 
                      py: 1.5,
                      borderLeft: `4px solid ${
                        notification.violation.toLowerCase().includes('speed') 
                          ? theme.palette.error.main 
                          : theme.palette.warning.main
                      }`,
                      '&:hover': {
                        bgcolor: alpha(theme.palette.primary.light, 0.1)
                      }
                    }}
                  >
                    <ListItemText
                      primary={
                        <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 0.5 }}>
                          {notification.violation}
                        </Typography>
                      }
                      secondary={
                        <>
                          <Typography variant="caption" component="div" sx={{ mb: 0.5 }}>
                            🚗 {notification.licensePlate} • 📷 Camera {notification.cameraId}
                          </Typography>
                          <Typography variant="caption" color="textSecondary">
                            {formatRelativeTime(notification.dateTime)}
                          </Typography>
                        </>
                      }
                    />
                  </MenuItem>
                ))
              )}
            </Box>
            
            {notifications.length > 0 && (
              <>
                <Divider />
                <Box sx={{ p: 1 }}>
                  <Button 
                    fullWidth 
                    size="small" 
                    onClick={() => navigate('/violation-detection')}
                    sx={{ textTransform: 'none' }}
                  >
                    View all notifications
                  </Button>
                </Box>
              </>
            )}
          </Menu>

          {/* Profile Menu */}
          <Menu
            anchorEl={profileAnchorEl}
            open={Boolean(profileAnchorEl)}
            onClose={handleCloseProfileMenu}
            PaperProps={{
              elevation: 3,
              sx: { 
                width: "200px",
                borderRadius: 2,
                mt: 1.5
              },
            }}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            <Box sx={{ p: 2, pb: 1 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                {role}
              </Typography>
              <Typography variant="caption" color="textSecondary">
                Account options
              </Typography>
            </Box>
            <Divider />
            
            <MenuItem onClick={handleDashboardClick}>
              <ListItemIcon>
                <DashboardIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="Dashboard" />
            </MenuItem>
            
            <MenuItem onClick={handleProfileClick}>
              <ListItemIcon>
                <PersonIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="My Profile" />
            </MenuItem>
            
            <Divider />
            
            <MenuItem onClick={handleLogout} sx={{ color: theme.palette.error.main }}>
              <ListItemIcon>
                <LogoutIcon fontSize="small" color="error" />
              </ListItemIcon>
              <ListItemText primary="Logout" />
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;