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
} from "@mui/material";
import NotificationsIcon from "@mui/icons-material/Notifications";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
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
  // const username = localStorage.getItem("username") || "User";

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
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
    setAnchorEl(event.currentTarget);
  };

  const handleCloseNotifications = () => {
    setAnchorEl(null);
  };

  const handleNotificationClick = (id: number) => {
    navigate(`/detection-detail/${id}`);
    handleCloseNotifications();
  };
  const handleProfileClick = () => {
    navigate("/profile");
  };

  const handleLogout = async () => {
    try {
      await axiosInstance.post("https://hanaxuan-backend.hf.space/api/accounts/logout/");
    } catch (error) {
      console.error("Error logging out:", error);
    }

    // Đặt token về trạng thái hết hạn thay vì xóa hoàn toàn
    localStorage.setItem("access_token", "undefined");
    localStorage.setItem("refresh_token", "undefined");
    localStorage.setItem("is_citizen_authenticated", "undefined");
    localStorage.setItem("user_role", "undefined");
    navigate("/");
  };

  return (
    <AppBar position="static" style={{ backgroundColor: "#3f51b5" }}>
      <Toolbar>
        <Box sx={{ display: "flex", alignItems: "center", flexGrow: 1 }}>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Welcome {role}
          </Typography>
        </Box>

        <IconButton color="inherit" onClick={handleOpenNotifications}>
          <Badge badgeContent={notifications.length} color="error">
            <NotificationsIcon />
          </Badge>
        </IconButton>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleCloseNotifications}
          PaperProps={{
            style: { width: "300px" },
          }}
        >
          <Typography sx={{ p: 2, fontWeight: "bold" }}>Notifications</Typography>
          <Divider />
          {loading ? (
            <MenuItem>
              <CircularProgress size={24} />
            </MenuItem>
          ) : error ? (
            <MenuItem>{error}</MenuItem>
          ) : notifications.length === 0 ? (
            <MenuItem>No new notifications</MenuItem>
          ) : (
            notifications.map((notification) => (
              <MenuItem key={notification.id} onClick={() => handleNotificationClick(notification.id)}>
                <ListItemText
                  primary={`🚨 Violation: ${notification.violation}`}
                  secondary={`${notification.licensePlate} | ${notification.dateTime}`}
                />
              </MenuItem>
            ))
          )}
        </Menu>

        <Button color="inherit" startIcon={<AccountCircleIcon />} onClick={handleProfileClick}>
          Profile
        </Button>

        <Button color="inherit" onClick={handleLogout}>Logout</Button>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
