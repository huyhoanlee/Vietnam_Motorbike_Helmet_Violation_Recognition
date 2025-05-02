import React from "react";
import {
  Box,
  Grid,
  Typography,
  Paper,
  Divider,
  useTheme,
  useMediaQuery,
  Container
} from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";
import AssignmentIcon from "@mui/icons-material/Assignment";
import ManageSearchIcon from '@mui/icons-material/ManageSearch';
import CenterFocusWeakIcon from '@mui/icons-material/CenterFocusWeak';
import DownloadDoneIcon from '@mui/icons-material/DownloadDone';
import { useNavigate } from "react-router-dom";

const CitizenManager: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));

  // Custom menu items with all their properties
  const menuItems = [
    {
      title: "Information",
      subtitle: "Personal",
      icon: <PersonIcon sx={{ fontSize: isMobile ? 40 : 50, color: theme.palette.primary.main }} />,
      path: "/citizen-info",
      color: theme.palette.primary.main
    },
    {
      title: "Application",
      subtitle: "Process Vehicle Card Parrot",
      icon: <AssignmentIcon sx={{ fontSize: isMobile ? 40 : 50, color: theme.palette.secondary.main }} />,
      path: "/citizen-applications",
      color: theme.palette.secondary.main
    },
    {
      title: "Violation History",
      subtitle: "Exist Violation by Plate Number",
      icon: <ManageSearchIcon sx={{ fontSize: isMobile ? 40 : 50, color: theme.palette.info.main }} />,
      path: "/citizen-violation",
      color: theme.palette.info.main
    },
    {
      title: "Violation Reports",
      subtitle: "Upload Violations Detected",
      icon: <CenterFocusWeakIcon sx={{ fontSize: isMobile ? 40 : 50, color: theme.palette.warning.main }} />,
      path: "/report-proofs",
      color: theme.palette.warning.main
    },
    {
      title: "Vehicle Owner",
      subtitle: "Plate Number",
      icon: <DownloadDoneIcon sx={{ fontSize: isMobile ? 40 : 50, color: theme.palette.success.main }} />,
      path: "/notificattions",
      color: theme.palette.success.main
    }
  ];

  // Determine card height based on screen size
  const getCardHeight = () => {
    if (isMobile) return 180;
    if (isTablet) return 200;
    return 220;
  };

  return (
    <Container maxWidth="xl">
      <Box sx={{ padding: isMobile ? 2 : 4 }}>
        <Typography 
          variant={isMobile ? "h5" : "h4"} 
          fontWeight="bold" 
          gutterBottom
          sx={{ mb: 2 }}
        >
          Citizen Management
        </Typography>

        <Divider sx={{ mb: isMobile ? 2 : 4 }} />

        <Grid container spacing={isMobile ? 2 : 3}>
          {menuItems.map((item, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Paper
                elevation={2}
                sx={{
                  height: getCardHeight(),
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: 2,
                  cursor: "pointer",
                  transition: "all 0.25s ease-in-out",
                  position: "relative",
                  overflow: "hidden",
                  p: 3,
                  "&:hover": {
                    transform: "translateY(-5px)",
                    boxShadow: theme.shadows[8],
                    "& .card-highlight": {
                      width: "100%",
                    },
                    "& .card-icon": {
                      transform: "scale(1.1)",
                    }
                  },
                }}
                onClick={() => navigate(item.path)}
              >
                {/* Top highlight bar */}
                <Box 
                  className="card-highlight"
                  sx={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    height: 4,
                    width: "30%",
                    backgroundColor: item.color,
                    transition: "width 0.3s ease",
                  }}
                />
                
                {/* Card content */}
                <Box 
                  className="card-icon"
                  sx={{ 
                    transition: "transform 0.3s ease",
                    mb: 2,
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    height: 70
                  }}
                >
                  {item.icon}
                </Box>
                
                <Typography 
                  variant="h6" 
                  fontWeight={600} 
                  align="center"
                  sx={{ mb: 1 }}
                >
                  {item.title}
                </Typography>
                
                <Typography 
                  variant="body2" 
                  color="text.secondary" 
                  align="center"
                >
                  {item.subtitle}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Box>
    </Container>
  );
};

export default CitizenManager;