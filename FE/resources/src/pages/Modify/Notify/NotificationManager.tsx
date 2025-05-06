import { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Snackbar,
  Alert,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  TextField,
  SelectChangeEvent,
  Card,
  Chip,
  Fade,
  useTheme,
  useMediaQuery,
  IconButton,
  Tooltip,
  Divider,
  Stack,
  Badge,
  Container,
  LinearProgress,
} from "@mui/material";
import { 
  DataGrid, 
  GridColDef, 
  GridRowsProp,
  gridClasses,
  GridToolbar 
} from "@mui/x-data-grid";
import axiosInstance from "../../../services/axiosInstance";
import config from "../../../config";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";

dayjs.extend(relativeTime);
import RefreshIcon from "@mui/icons-material/Refresh";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import FilterAltIcon from "@mui/icons-material/FilterAlt";
import { alpha } from "@mui/material/styles";

const API_BASE = `${config.API_URL}notifications/`;

type Notification = {
  notification_id: number;
  status: string;
  created_at: string;
};

type SnackbarState = {
  open: boolean;
  message: string;
  severity: "success" | "error" | "info" | "warning";
};

const NotificationManager = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.down("md"));
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filterType, setFilterType] = useState<"all" | "violation" | "status">("all");
  const [filterValue, setFilterValue] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [totalNotifications, setTotalNotifications] = useState<number>(0);
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: "",
    severity: "success",
  });

  useEffect(() => {
    fetchNotifications();
  }, [filterType, filterValue]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      let response;

      if (filterType === "violation") {
        if (!filterValue.trim()) {
          setNotifications([]);
          setLoading(false);
          return;
        }

        response = await axiosInstance.get(`${API_BASE}search-by-violation/`, {
          params: { violation_id: filterValue },
        });
      } else if (filterType === "status") {
        response = await axiosInstance.get(`${API_BASE}search-by-status/`, {
          params: { status: filterValue },
        });
      } else {
        response = await axiosInstance.get(`${API_BASE}view_all/`);
      }

      const data: Notification[] = response.data.data || [];
      setNotifications(data);
      setTotalNotifications(data.length);
      setSnackbar({
        open: true,
        message: "Notifications loaded successfully",
        severity: "success",
      });
    } catch (error) {
      console.error("Error fetching notifications:", error);
      setSnackbar({
        open: true,
        message: "Failed to load notifications.",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  // Status styling based on value
  const getStatusChipProps = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending':
        return { label: 'Pending', color: 'warning' as const, icon: <span className="pulse-dot orange" /> };
      case 'resolved':
        return { label: 'Resolved', color: 'success' as const, icon: <span className="pulse-dot green" /> };
      case 'processing':
        return { label: 'Processing', color: 'info' as const, icon: <span className="pulse-dot blue" /> };
      case 'failed':
        return { label: 'Failed', color: 'error' as const, icon: <span className="pulse-dot red" /> };
      default:
        return { label: status, color: 'default' as const, icon: undefined };
    }
  };

  const columns: GridColDef[] = [
    { 
      field: "notification_id", 
      headerName: "Notification ID", 
      flex: 1,
      minWidth: 130,
      renderCell: (params) => (
        <Typography variant="body2" fontWeight="medium">
          #{params.value}
        </Typography>
      )
    },
    { 
      field: "status", 
      headerName: "Status", 
      flex: 1,
      minWidth: 130,
      renderCell: (params) => {
        const { label, color, icon } = getStatusChipProps(params.value);
        return (
          <Chip
            label={label}
            color={color}
            size="small"
            icon={icon}
            sx={{
              fontWeight: 'medium',
              '& .MuiChip-label': { px: 1.5 },
              minWidth: 90,
            }}
          />
        );
      }
    },
    {
      field: "created_at",
      headerName: "Created At",
      flex: 1.5,
      minWidth: 180,
      valueFormatter: (params: { value: string }) =>
        dayjs(params.value).format("DD/MM/YYYY HH:mm:ss"),
      renderCell: (params) => {
        const formattedDate = dayjs(params.value).format("DD/MM/YYYY HH:mm:ss");
        const relativeTime = dayjs(params.value).fromNow();
        
        return (
          <Tooltip title={formattedDate} arrow>
            <Typography variant="body2">
              {relativeTime}
            </Typography>
          </Tooltip>
        );
      }
    },
  ];

  const rows: GridRowsProp = notifications.map((item) => ({
    id: item.notification_id,
    ...item,
  }));

  const handleFilterChange = (event: SelectChangeEvent) => {
    const selected = event.target.value as "all" | "violation" | "status";
    setFilterType(selected);
    setFilterValue("");
  };

  const handleRefresh = () => {
    fetchNotifications();
  };

  return (
    <Container maxWidth="lg" sx={{ pb: 4 }}>
      <Fade in={true} timeout={800}>
        <Box>
          <Card 
            elevation={0} 
            sx={{ 
              mb: 3, 
              p: 2,
              background: theme.palette.mode === 'dark' 
                ? alpha(theme.palette.primary.main, 0.1) 
                : alpha(theme.palette.primary.light, 0.1),
              borderRadius: 2
            }}
          >
            <Stack 
              direction={isMobile ? "column" : "row"} 
              justifyContent="space-between" 
              alignItems={isMobile ? "flex-start" : "center"}
              spacing={2}
            >
              <Box display="flex" alignItems="center">
                <NotificationsActiveIcon 
                  sx={{ 
                    mr: 1.5, 
                    color: theme.palette.primary.main,
                    fontSize: 28
                  }} 
                />
                <Box>
                  <Typography variant="h4" fontWeight="bold">
                    Notification Manager
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Manage and monitor all system notifications
                  </Typography>
                </Box>
              </Box>
              
              <Stack direction="row" spacing={1} alignItems="center">
                <Badge 
                  badgeContent={totalNotifications} 
                  color="primary" 
                  max={999}
                  sx={{ mr: 1 }}
                >
                  <Chip 
                    label={`${totalNotifications} Notifications`} 
                    color="primary" 
                    variant="outlined"
                  />
                </Badge>
                
                <Tooltip title="Refresh notifications">
                  <IconButton 
                    onClick={handleRefresh} 
                    color="primary"
                    sx={{ 
                      backgroundColor: theme.palette.background.paper,
                      boxShadow: 1,
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.primary.main, 0.1),
                      }
                    }}
                  >
                    <RefreshIcon />
                  </IconButton>
                </Tooltip>
              </Stack>
            </Stack>
          </Card>

          <Paper 
            elevation={2} 
            sx={{ 
              p: 3, 
              borderRadius: 2,
              transition: 'all 0.3s ease-in-out',
              '&:hover': {
                boxShadow: '0 8px 24px rgba(0,0,0,0.12)'
              }
            }}
          >
            <Stack 
              direction={isTablet ? "column" : "row"} 
              spacing={2} 
              mb={3} 
              alignItems={isTablet ? "flex-start" : "center"}
            >
              <Box display="flex" alignItems="center">
                <FilterAltIcon sx={{ mr: 1, color: theme.palette.text.secondary }} />
                <Typography variant="subtitle1" fontWeight="medium">
                  Filters
                </Typography>
              </Box>
              
              <Stack 
                direction={isMobile ? "column" : "row"} 
                spacing={2} 
                width={isTablet ? "100%" : "auto"}
              >
                <FormControl 
                  size="small" 
                  sx={{ 
                    minWidth: 160,
                    width: isMobile ? "100%" : "auto"
                  }}
                >
                  <InputLabel>Filter By</InputLabel>
                  <Select 
                    value={filterType} 
                    label="Filter By" 
                    onChange={handleFilterChange}
                  >
                    <MenuItem value="all">All</MenuItem>
                    <MenuItem value="violation">Violation ID</MenuItem>
                    <MenuItem value="status">Status</MenuItem>
                  </Select>
                </FormControl>

                {(filterType === "violation" || filterType === "status") && (
                  <Fade in={true}>
                    <TextField
                      size="small"
                      label={filterType === "violation" ? "Violation ID" : "Status"}
                      value={filterValue}
                      onChange={(e) => setFilterValue(e.target.value)}
                      fullWidth={isMobile}
                      sx={{
                        minWidth: isMobile ? "100%" : 200,
                      }}
                    />
                  </Fade>  
                )}
              </Stack>
            </Stack>

            <Divider sx={{ mb: 3 }} />

            {loading && (
              <LinearProgress sx={{ mb: 2, borderRadius: 1 }} />
            )}

            <Box
              sx={{
                height: 500,
                width: "100%",
                '.MuiDataGrid-root': {
                  border: 'none',
                  borderRadius: 2,
                  '& .MuiDataGrid-cell:focus-within, & .MuiDataGrid-cell:focus': {
                    outline: 'none',
                  },
                  '& .MuiDataGrid-columnHeaders': {
                    backgroundColor: theme.palette.mode === 'dark' 
                      ? alpha(theme.palette.primary.dark, 0.1)
                      : alpha(theme.palette.primary.light, 0.1),
                    borderRadius: '8px 8px 0 0',
                  },
                  [`& .${gridClasses.row}.even`]: {
                    backgroundColor: theme.palette.mode === 'dark' 
                      ? alpha(theme.palette.common.white, 0.05)
                      : alpha(theme.palette.common.black, 0.02),
                  },
                  '& .MuiDataGrid-virtualScroller': {
                    backgroundColor: theme.palette.background.paper,
                  },
                  '& .MuiDataGrid-footerContainer': {
                    borderTop: 'none',
                    backgroundColor: theme.palette.mode === 'dark' 
                      ? alpha(theme.palette.primary.dark, 0.05)
                      : alpha(theme.palette.primary.light, 0.05),
                    borderRadius: '0 0 8px 8px'
                  },
                  '& .MuiDataGrid-virtualScrollerContent': {
                    paddingLeft: 1,
                    paddingRight: 1,
                  }
                }
              }}
            >
              <DataGrid
                rows={rows}
                columns={columns}
                paginationModel={{ pageSize: 10, page: 0 }}
                pageSizeOptions={[5, 10, 25, 50]}
                slots={{ toolbar: GridToolbar }}
                slotProps={{
                  toolbar: {
                    showQuickFilter: true,
                    quickFilterProps: { debounceMs: 500 },
                  },
                  pagination: {
                    sx: { px: 2 }
                  }
                }}
                loading={loading}
                disableRowSelectionOnClick
                getRowClassName={(params) => 
                  params.indexRelativeToCurrentPage % 2 === 0 ? 'even' : 'odd'
                }
                sx={{
                  animation: 'fadeIn 0.5s ease-in-out',
                  '@keyframes fadeIn': {
                    '0%': {
                      opacity: 0,
                      transform: 'translateY(10px)'
                    },
                    '100%': {
                      opacity: 1,
                      transform: 'translateY(0)'
                    },
                  },
                }}
              />
            </Box>
          </Paper>
        </Box>
      </Fade>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        TransitionComponent={Fade}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          severity={snackbar.severity} 
          variant="filled"
          sx={{ 
            width: '100%',
            boxShadow: 3,
            '.MuiAlert-icon': {
              fontSize: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              mr: 1
            }
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      <style>{`
        .pulse-dot {
          display: inline-block;
          width: 8px;
          height: 8px;
          border-radius: 50%;
          margin-right: 6px;
          animation: pulse 1.5s infinite;
        }
        
        .pulse-dot.green {
          background-color: #4caf50;
          box-shadow: 0 0 0 rgba(76, 175, 80, 0.4);
        }
        
        .pulse-dot.orange {
          background-color: #ff9800;
          box-shadow: 0 0 0 rgba(255, 152, 0, 0.4);
        }
        
        .pulse-dot.red {
          background-color: #f44336;
          box-shadow: 0 0 0 rgba(244, 67, 54, 0.4);
        }
        
        .pulse-dot.blue {
          background-color: #2196f3;
          box-shadow: 0 0 0 rgba(33, 150, 243, 0.4);
        }
        
        @keyframes pulse {
          0% {
            box-shadow: 0 0 0 0 rgba(0, 0, 0, 0.4);
          }
          70% {
            box-shadow: 0 0 0 6px rgba(0, 0, 0, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(0, 0, 0, 0);
          }
        }
      `}</style>
    </Container>
  );
};

export default NotificationManager;