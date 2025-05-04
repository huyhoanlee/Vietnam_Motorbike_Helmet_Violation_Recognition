import React, { useState } from "react";
import { 
  Box, 
  Typography, 
  Grid, 
  Container, 
  useTheme, 
  Card,
  CardContent,
  Zoom,
  Divider
} from "@mui/material";
import { useNavigate } from "react-router-dom";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import VerifiedIcon from "@mui/icons-material/Verified";
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import DashboardIcon from '@mui/icons-material/Dashboard';

const Modify: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  // Management card items
  const managementItems = [
    {
      id: "status",
      title: "Status Management",
      subtitle: "View and update violation status types",
      icon: <VerifiedIcon sx={{ fontSize: 56, color: "#6a1b9a" }} />,
      path: "/manage-status",
      description: "Create, edit, and delete status types for helmet violations",
      color: "#f3e5f5"
    },
    {
      id: "location",
      title: "Location Management",
      subtitle: "Add or edit location points",
      icon: <LocationOnIcon sx={{ fontSize: 56, color: "#1565c0" }} />,
      path: "/manage-location",
      description: "Define and manage geographical locations for cameras and detection points",
      color: "#e3f2fd"
    },
    {
      id: "notification",
      title: "Notification Center",
      subtitle: "View and manage notifications",
      icon: <NotificationsActiveIcon sx={{ fontSize: 56, color: "#f57c00" }} />,
      path: "/manage-notifications",
      description: "Monitor and filter system notifications by status and violation ID",
      color: "#fff3e0"
    }
  ];

  const handleCardClick = (path: string) => {
    navigate(path);
  };

  const handleCardHover = (id: string | null) => {
    setHoveredCard(id);
  };

  return (
    <Box 
      sx={{ 
        minHeight: "100vh", 
        backgroundColor: "#f9fafc",
        pt: 4,
        pb: 6
      }}
    >
      <Container maxWidth="lg">
        {/* Header Section */}
        <Box mb={4} sx={{ textAlign: 'center' }}>
          <Box 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              mb: 1
            }}
          >
            <DashboardIcon 
              sx={{ 
                fontSize: 36, 
                color: theme.palette.primary.main, 
                mr: 1.5 
              }} 
            />
            <Typography variant="h3" fontWeight="600" color="primary">
              Supervisor Privilege
            </Typography>
          </Box>
          <Typography variant="subtitle1" color="text.secondary" gutterBottom>
            Manage violations, locations, and system notifications
          </Typography>
          <Divider sx={{ mt: 3, width: '60%', mx: 'auto' }} />
        </Box>

        {/* Cards Grid */}
        <Grid container spacing={4} mt={2}>
          {managementItems.map((item) => (
            <Grid item xs={12} sm={6} md={4} key={item.id}>
              <Zoom in={true} style={{ transitionDelay: '150ms' }}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    borderRadius: 4,
                    overflow: 'hidden',
                    transition: 'all 0.3s ease',
                    cursor: 'pointer',
                    boxShadow: hoveredCard === item.id ? '0px 8px 20px rgba(0, 0, 0, 0.15)' : '0px 4px 12px rgba(0, 0, 0, 0.08)',
                    transform: hoveredCard === item.id ? 'translateY(-8px)' : 'none',
                    '&:hover': {
                      boxShadow: '0px 10px 25px rgba(0, 0, 0, 0.2)',
                    },
                    position: 'relative',
                    backgroundColor: hoveredCard === item.id ? item.color : '#ffffff',
                  }}
                  onClick={() => handleCardClick(item.path)}
                  onMouseEnter={() => handleCardHover(item.id)}
                  onMouseLeave={() => handleCardHover(null)}
                >
                  <CardContent sx={{ 
                    p: 3, 
                    display: 'flex', 
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center', 
                    flex: 1
                  }}>
                    <Box 
                      sx={{ 
                        mb: 2,
                        p: 2,
                        borderRadius: '50%',
                        backgroundColor: item.color,
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        width: 100,
                        height: 100,
                        transition: 'all 0.3s ease',
                        transform: hoveredCard === item.id ? 'scale(1.1)' : 'scale(1)',
                      }}
                    >
                      {item.icon}
                    </Box>
                    
                    <Typography variant="h5" component="h2" fontWeight="bold" gutterBottom>
                      {item.title}
                    </Typography>
                    
                    <Typography variant="body1" color="text.secondary" mb={2}>
                      {item.subtitle}
                    </Typography>

                    <Divider sx={{ width: '60%', mb: 2 }} />
                    
                    <Typography variant="body2" color="text.secondary" sx={{ 
                      opacity: hoveredCard === item.id ? 1 : 0.8,
                      transition: 'opacity 0.3s ease'
                    }}>
                      {item.description}
                    </Typography>
                  </CardContent>
                </Card>
              </Zoom>
            </Grid>
          ))}
        </Grid>

        {/* Footer Section */}
        <Box mt={8} textAlign="center">
          <Typography variant="body2" color="text.secondary">
            Helmet Violation Detection Management System • Supervisor Access
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default Modify;