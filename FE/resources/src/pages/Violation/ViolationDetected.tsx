import React, { useEffect, useState, useCallback } from "react";
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  IconButton, Typography, Box, CircularProgress, Snackbar, Alert,
  TextField, InputAdornment, Select, MenuItem, Grid, 
  FormControl, InputLabel, Card, CardContent, Chip, Fade, useTheme,
  useMediaQuery, Skeleton, Divider, Tooltip, Badge
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import SearchIcon from "@mui/icons-material/Search";
import SortIcon from "@mui/icons-material/Sort";
import FilterListIcon from "@mui/icons-material/FilterList";
import RefreshIcon from "@mui/icons-material/Refresh";
import KeyboardArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import FirstPageIcon from '@mui/icons-material/FirstPage';
import LastPageIcon from '@mui/icons-material/LastPage';
import ViolationDetail from "./ViolationDetails";
import { format } from "date-fns";
import axiosInstance from "../../services/axiosInstance";
import config from "../../config";

const API_BASE_URL = config.API_URL;
const STATUS_API_URL = `${config.API_URL}violation_status/get-all/`;

interface Violation {
  id: number;
  location: string | null;
  camera_id?: string;
  plate_number: string;
  status: string;
  status_name: string;
  detected_at: string;
  violation_image: string[];
}

interface Status {
  description: string;
  id: number; 
  status_name: string;
}

interface StatusSelectProps {
  filterStatus: string;
  setFilterStatus: (value: string) => void;
  statusList: Status[];
  loading: boolean;
}

const StatusSelect: React.FC<StatusSelectProps> = ({ filterStatus, setFilterStatus, statusList, loading }) => {
  const theme = useTheme();

  return (
    <FormControl fullWidth size="medium">
      <InputLabel>Filter Status</InputLabel>
      <Select
        value={filterStatus}
        onChange={(e) => setFilterStatus(e.target.value as string)}
        label="Filter Status"
        disabled={loading}
        sx={{ 
          "& .MuiSelect-select": { display: "flex", alignItems: "center" },
          "& .MuiOutlinedInput-notchedOutline": {
            borderColor: theme.palette.mode === "light" ? "rgba(0, 0, 0, 0.23)" : "rgba(255, 255, 255, 0.23)",
          },
          "&:hover .MuiOutlinedInput-notchedOutline": {
            borderColor: theme.palette.primary.main,
          },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: theme.palette.primary.main,
          }
        }}
        renderValue={(selected) => (
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <FilterListIcon fontSize="small" />
            {selected}
          </Box>
        )}
      >
        <MenuItem value="All">All Status</MenuItem>
        {statusList.map((status) => (
          <MenuItem key={status.id} value={status.status_name}>
            <Chip 
              size="small" 
              label={status.status_name}
              sx={{ 
                backgroundColor: getStatusBackgroundColor(status.status_name),
                color: getStatusColor(status.status_name),
                mr: 1
              }} 
            />
            {status.status_name}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
};

const CustomPagination: React.FC<{
  count: number;
  page: number;
  onChange: (event: React.ChangeEvent<unknown>, value: number) => void;
  disabled?: boolean;
  size?: 'small' | 'medium' | 'large';
}> = ({ count, page, onChange, disabled = false, size = 'medium' }) => {
  const theme = useTheme();
  // const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const handleFirstPage = () => {
    if (!disabled && page !== 1) onChange({} as React.ChangeEvent<unknown>, 1);
  };
  
  const handlePrevPage = () => {
    if (!disabled && page > 1) onChange({} as React.ChangeEvent<unknown>, page - 1);
  };
  
  const handleNextPage = () => {
    if (!disabled && page < count) onChange({} as React.ChangeEvent<unknown>, page + 1);
  };
  
  const handleLastPage = () => {
    if (!disabled && page !== count) onChange({} as React.ChangeEvent<unknown>, count);
  };

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
      }}
    >
      <IconButton 
        onClick={handleFirstPage}
        disabled={disabled || page === 1}
        size={size}
        sx={{ 
          color: page === 1 ? theme.palette.action.disabled : theme.palette.primary.main,
          '&:hover': { bgcolor: theme.palette.action.hover },
        }}
      >
        <FirstPageIcon fontSize={size} />
      </IconButton>
      
      <IconButton 
        onClick={handlePrevPage}
        disabled={disabled || page === 1}
        size={size}
        sx={{ 
          color: page === 1 ? theme.palette.action.disabled : theme.palette.primary.main,
          '&:hover': { bgcolor: theme.palette.action.hover },
        }}
      >
        <KeyboardArrowLeftIcon fontSize={size} />
      </IconButton>
      
      <Box 
        sx={{ 
          px: 2, 
          minWidth: '80px', 
          textAlign: 'center',
          bgcolor: theme.palette.background.paper,
          borderRadius: 1,
          border: `1px solid ${theme.palette.divider}`,
          py: 0.5,
          fontSize: size === 'small' ? '0.8rem' : '0.9rem',
          fontWeight: 'medium',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {page} / {count || 1}
      </Box>
      
      <IconButton 
        onClick={handleNextPage}
        disabled={disabled || page === count || count === 0}
        size={size}
        sx={{ 
          color: page === count || count === 0 ? theme.palette.action.disabled : theme.palette.primary.main,
          '&:hover': { bgcolor: theme.palette.action.hover },
        }}
      >
        <KeyboardArrowRightIcon fontSize={size} />
      </IconButton>
      
      <IconButton 
        onClick={handleLastPage}
        disabled={disabled || page === count || count === 0}
        size={size}
        sx={{ 
          color: page === count || count === 0 ? theme.palette.action.disabled : theme.palette.primary.main, 
          '&:hover': { bgcolor: theme.palette.action.hover },
        }}
      >
        <LastPageIcon fontSize={size} />
      </IconButton>
    </Box>
  );
};

const ViolationDetected: React.FC = () => {
  const [violations, setViolations] = useState<Violation[]>([]);
  const [totalViolations, setTotalViolations] = useState(0);
  const [loading, setLoading] = useState(true);
  const [expandedRow, setExpandedRow] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchPlate, setSearchPlate] = useState("");
  const [searchPlateQuery, setSearchPlateQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [sortOrder, setSortOrder] = useState("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error",
  });
  const [statusList, setStatusList] = useState<Status[]>([]);
  const [statusLoading, setStatusLoading] = useState(true);
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.down('md'));

  const normalizeBase64Image = (data: string, format: "jpeg" | "png" = "png") => {
    if (!data) return "/placeholder-image.png";
    if (data.startsWith("data:image/")) return data;
    return `data:image/${format};base64,${data}`;
  };

  // Fetch all available violation statuses
  useEffect(() => {
    setStatusLoading(true);
    console.log("Fetching all available violation statuses...");
    axiosInstance
      .get(STATUS_API_URL)
      .then((response) => {
        console.log("Available statuses:", response.data.data);
        setStatusList(response.data.data || []);
      })
      .catch((error) => {
        console.error("Failed to fetch statuses:", error);
      })
      .finally(() => setStatusLoading(false));
  }, []);

  const fetchViolationCount = useCallback(async () => {
    try {
      // Build query parameters to make the count match the filters
      let params = new URLSearchParams();
      
      if (searchPlateQuery) {
        params.append('plate_number', searchPlateQuery);
      }
      
      // Use same filtering logic as fetchData
      if (filterStatus !== "All") {
        // Find the matching status in our list
        const matchingStatus = statusList.find(s => s.status_name === filterStatus);
        
        if (matchingStatus) {
          // If we found a matching status, use its ID - this is the most reliable way
          params.append('status_id', matchingStatus.id.toString());
          console.log(`Count API: Using status_id=${matchingStatus.id} for "${matchingStatus.status_name}"`);
        } else {
          // Fallback: try using the status name directly
          console.warn(`Count API: No matching status found for "${filterStatus}" in the status list!`);
          params.append('status_name', filterStatus);
        }
      }

      const countUrl = `${API_BASE_URL}violations/count-all/?${params.toString()}`;
      console.log("Fetching count from:", countUrl);
      
      const response = await axiosInstance.get(countUrl);
      console.log("Count API response:", response.data);
      setTotalViolations(response.data.total_count || 0);
    } catch (err) {
      console.error("Failed to fetch violation count:", err);
      setError("Failed to fetch violation count.");
    }
  }, [searchPlateQuery, filterStatus, statusList]);

  const fetchData = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      // Build query parameters
      let params = new URLSearchParams();
      params.append('per_page', itemsPerPage.toString());
      params.append('page_number', page.toString());
      
      if (searchPlateQuery) {
        params.append('plate_number', searchPlateQuery);
      }
      
      // Improved status filtering using server-provided status information
      if (filterStatus !== "All") {
        console.log("Filtering by status:", filterStatus);
        console.log("Available status list:", statusList);
        
        // Find the matching status in our list
        const matchingStatus = statusList.find(s => s.status_name === filterStatus);
        
        if (matchingStatus) {
          // If we found a matching status, use its ID - this is the most reliable way
          params.append('status_id', matchingStatus.id.toString());
          console.log(`Found matching status: ID=${matchingStatus.id}, name="${matchingStatus.status_name}"`);
        } else {
          // Fallback: try using the status name directly
          console.warn(`No matching status found for "${filterStatus}" in the status list!`);
          params.append('status_name', filterStatus);
        }
      }
      
      params.append('sort', sortOrder);

      const apiUrl = `${API_BASE_URL}violations/get-all/?${params.toString()}`;
      console.log("Making API request to:", apiUrl);
      
      const response = await axiosInstance.get(apiUrl);
      console.log("API response:", response.data);
      
      if (response.data && response.data.data) {
        const mappedViolations = response.data.data.map((v: any) => ({
          id: v.violation_id,
          plate_number: v.plate_number,
          camera_id: v.camera_id || "Unknown",
          detected_at: v.detected_at,
          status: v.status_name || "Unknown", 
          status_name: v.status_name || "Unknown",
          location: v.location || "Unknown",
          violation_image: v.violation_image?.map((img: string) => normalizeBase64Image(img)) || [],
        }));
        
        console.log(`Received ${mappedViolations.length} violations`);
        
        // Check if we're getting the correct filtered results
        if (filterStatus !== "All") {
          console.log("Checking filtered results:");
          
          // Find the expected status ID 
          const expectedStatusId = statusList.find(s => s.status_name === filterStatus)?.id;
          
          if (expectedStatusId) {
            console.log(`Expected status: name="${filterStatus}", id=${expectedStatusId}`);
            
            // Get unique status names from response
            const statusNames = [...new Set(mappedViolations.map((v: Violation) => v.status_name))];
            console.log("Status names in response:", statusNames);
            
            // Check if any results match our filter exactly
            const matchingResults = mappedViolations.filter((v: Violation) => v.status_name === filterStatus);
            console.log(`Results matching "${filterStatus}" exactly: ${matchingResults.length}/${mappedViolations.length}`);
            
            // If we have mismatched results but have a match for our filter, use client-side filtering
            if (matchingResults.length > 0 && matchingResults.length !== mappedViolations.length) {
              console.log("Applying client-side filtering to show only matching results");
              setViolations(matchingResults);
            } else if (matchingResults.length === 0 && mappedViolations.length > 0) {
              console.warn("No results match our filter! The backend might be ignoring our filter parameter.");
              
              // Check if there are any results with a name like our filter (case insensitive)
              const fuzzyMatches = mappedViolations.filter((v: Violation) => 
                v.status_name.toLowerCase().includes(filterStatus.toLowerCase())
              );
              
              if (fuzzyMatches.length > 0) {
                console.log(`Found ${fuzzyMatches.length} results with names similar to "${filterStatus}"`);
                setViolations(fuzzyMatches);
              } else {
                // Keep original results as fallback
                setViolations(mappedViolations);
              }
            } else {
              // Normal case - all results match our filter or no results at all
              setViolations(mappedViolations);
            }
          } else {
            console.warn(`Status "${filterStatus}" not found in status list!`);
            setViolations(mappedViolations);
          }
        } else {
          // No filter, use all results
          setViolations(mappedViolations);
        }
      } else {
        console.log("No data in response or empty data array");
        setViolations([]);
      }
      
      // Fetch the total count with the same filters
      fetchViolationCount();
    } catch (err) {
      console.error("Failed to fetch data:", err);
      setError("Failed to fetch violation data, please try again later.");
      setSnackbar({
        open: true,
        message: "Failed to fetch violation data",
        severity: "error"
      });
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, [itemsPerPage, searchPlateQuery, filterStatus, sortOrder, fetchViolationCount, statusList]);

  useEffect(() => {
    fetchViolationCount();
  }, [fetchViolationCount]);

  useEffect(() => {
    fetchData(currentPage);
  }, [fetchData, currentPage]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchViolationCount();
    fetchData(currentPage);
  };

  const handleSearch = () => {
    setSearchPlateQuery(searchPlate);
    setCurrentPage(1);
    // We need to wait for state update to complete
    setTimeout(() => fetchData(1), 0);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const toggleRow = (id: number) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  const handleStatusUpdate = (id: number, newStatus: string) => {
    setViolations((prev) =>
      prev.map((v) => (v.id === id ? { ...v, status: newStatus, status_name: newStatus } : v))
    );
    setSnackbar({
      open: true,
      message: `Violation #${id} status updated to ${newStatus}`,
      severity: "success",
    });
    
    // Refresh the data to ensure consistent filtering
    fetchData(currentPage);
  };

  const handleChangePage = (_e: React.ChangeEvent<unknown>, newPage: number) => {
    setCurrentPage(newPage);
  };

  const totalPages = Math.ceil(totalViolations / itemsPerPage);

  return (
    <Fade in={true} timeout={800}>
      <Box sx={{ padding: { xs: 2, sm: 3, md: 4 }, maxWidth: "100%" }}>
        {/* Header Section */}
        <Box sx={{ 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center", 
          mb: 3,
          flexDirection: { xs: 'column', sm: 'row' },
          gap: { xs: 2, sm: 0 }
        }}>
          <Typography variant="h4" sx={{ 
            fontWeight: "bold", 
            fontSize: { xs: "1.5rem", sm: "1.8rem", md: "2.2rem" },
            color: theme.palette.primary.main,
            textAlign: { xs: 'center', sm: 'left' }
          }}>
            Violation Management
          </Typography>
          
          <Tooltip title="Refresh data">
            <IconButton 
              onClick={handleRefresh} 
              disabled={loading || isRefreshing}
              sx={{ 
                bgcolor: theme.palette.background.paper,
                boxShadow: 1,
                "&:hover": { bgcolor: theme.palette.action.hover }
              }}
            >
              {loading || isRefreshing ? (
                <CircularProgress size={24} color="primary" />
              ) : (
                <RefreshIcon sx={{ 
                  animation: isRefreshing ? 'spin 1s linear infinite' : 'none',
                  '@keyframes spin': {
                    '0%': { transform: 'rotate(0deg)' },
                    '100%': { transform: 'rotate(360deg)' },
                  }
                }} />
              )}
            </IconButton>
          </Tooltip>
        </Box>

        {/* Search and Filter Section */}
        <Card elevation={3} sx={{ 
          mb: 4, 
          borderRadius: 2, 
          overflow: "hidden",
          transition: 'box-shadow 0.3s',
          '&:hover': {
            boxShadow: 6
          }
        }}>
          <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={5}>
                <TextField
                  fullWidth
                  variant="outlined"
                  placeholder="Enter plate number..."
                  label="Search Plate Number"
                  value={searchPlate}
                  onChange={(e) => setSearchPlate(e.target.value)}
                  onKeyPress={handleKeyPress}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                    endAdornment: searchPlate && (
                      <InputAdornment position="end">
                        <IconButton 
                          onClick={handleSearch}
                          edge="end"
                          disabled={loading}
                          sx={{ 
                            color: theme.palette.primary.main,
                            "&:hover": { color: theme.palette.primary.dark }
                          }}
                        >
                          <SearchIcon />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      "&:hover .MuiOutlinedInput-notchedOutline": {
                        borderColor: theme.palette.primary.main,
                      }
                    }
                  }}
                />
              </Grid>
              
              <Grid item xs={12} sm={6} md={4}>
                <StatusSelect 
                  filterStatus={filterStatus} 
                  setFilterStatus={(status) => {
                    setFilterStatus(status);
                    setCurrentPage(1);
                    setTimeout(() => fetchData(1), 0);
                  }}
                  statusList={statusList}
                  loading={statusLoading}
                />
              </Grid>
              
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth size="medium">
                  <InputLabel>Sort Order</InputLabel>
                  <Select
                    value={sortOrder}
                    onChange={(e) => {
                      setSortOrder(e.target.value);
                      setCurrentPage(1);
                      setTimeout(() => fetchData(1), 0);
                    }}
                    label="Sort Order"
                    sx={{ 
                      "& .MuiSelect-select": { display: "flex", alignItems: "center" },
                      "& .MuiOutlinedInput-notchedOutline": {
                        borderColor: theme.palette.mode === "light" ? "rgba(0, 0, 0, 0.23)" : "rgba(255, 255, 255, 0.23)",
                      },
                      "&:hover .MuiOutlinedInput-notchedOutline": {
                        borderColor: theme.palette.primary.main,
                      },
                      "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                        borderColor: theme.palette.primary.main,
                      }
                    }}
                    renderValue={(selected) => (
                      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                        <SortIcon fontSize="small" />
                        {selected === "desc" ? "Newest First" : "Oldest First"}
                      </Box>
                    )}
                  >
                    <MenuItem value="desc">Newest First</MenuItem>
                    <MenuItem value="asc">Oldest First</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* Violation Count and Items Per Page */}
        <Box sx={{ 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center", 
          mb: 2,
          flexDirection: { xs: "column", sm: "row" },
          gap: 1
        }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Badge 
              badgeContent={totalViolations} 
              color="primary"
              max={999}
              sx={{ "& .MuiBadge-badge": { fontSize: "0.8rem", fontWeight: "bold" } }}
            >
              <Typography variant="subtitle1" fontWeight="500">
                Total Violations
              </Typography>
            </Badge>
            {filterStatus !== "All" && (
              <Chip 
                label={`Filtered by: ${filterStatus}`}
                onDelete={() => {
                  setFilterStatus("All");
                  setCurrentPage(1);
                  setTimeout(() => fetchData(1), 0);
                }}
                size="small"
                color="primary"
                variant="outlined"
              />
            )}
          </Box>
          
          <FormControl size="small" sx={{ minWidth: 100 }}>
            <InputLabel id="per-page-label">Per Page</InputLabel>
            <Select
              labelId="per-page-label"
              value={itemsPerPage}
              label="Per Page"
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
                setTimeout(() => fetchData(1), 0);
              }}
              sx={{
                "& .MuiOutlinedInput-notchedOutline": {
                  borderColor: theme.palette.mode === "light" ? "rgba(0, 0, 0, 0.23)" : "rgba(255, 255, 255, 0.23)",
                },
                "&:hover .MuiOutlinedInput-notchedOutline": {
                  borderColor: theme.palette.primary.main,
                },
                "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                  borderColor: theme.palette.primary.main,
                }
              }}
            >
              <MenuItem value={5}>5</MenuItem>
              <MenuItem value={10}>10</MenuItem>
              <MenuItem value={20}>20</MenuItem>
              <MenuItem value={50}>50</MenuItem>
            </Select>
          </FormControl>
        </Box>

        {/* Loading State */}
        {loading ? (
          <Card elevation={3} sx={{ borderRadius: 2, overflow: "hidden", mb: 4 }}>
            <CardContent>
              {[...Array(5)].map((_, index) => (
                <Box key={index} sx={{ mb: 2, display: "flex", flexDirection: "column", gap: 1 }}>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
                    <Skeleton variant="rounded" width={60} height={60} />
                    <Box sx={{ flexGrow: 1 }}>
                      <Skeleton variant="text" width="40%" height={30} />
                      <Skeleton variant="text" width="70%" height={20} />
                    </Box>
                    <Skeleton variant="circular" width={40} height={40} />
                  </Box>
                  <Divider sx={{ my: 1 }} />
                </Box>
              ))}
            </CardContent>
          </Card>
        ) : error ? (
          <Alert 
            severity="error" 
            sx={{ 
              mb: 4,
              borderRadius: 2,
              boxShadow: 2 
            }}
            action={
              <IconButton
                color="inherit"
                size="small"
                onClick={handleRefresh}
              >
                <RefreshIcon fontSize="small" />
              </IconButton>
            }
          >
            {error}
          </Alert>
        ) : (
          <>
            {isMobile ? (
              // Mobile card view
              <Box sx={{ mb: 4 }}>
                {violations.length === 0 ? (
                  <Card elevation={3} sx={{ borderRadius: 2, p: 3, textAlign: "center" }}>
                    <Typography variant="subtitle1">
                      {filterStatus !== "All" 
                        ? `No violations with status "${filterStatus}" found.` 
                        : "No violations match your filter."}
                    </Typography>
                  </Card>
                ) : (
                  violations.map((violation) => (
                    <Card 
                      key={violation.id} 
                      elevation={2} 
                      sx={{ 
                        mb: 2, 
                        borderRadius: 2,
                        borderLeft: `4px solid ${getStatusColor(violation.status_name)}`,
                        transition: "all 0.2s ease-in-out",
                        "&:hover": { 
                          transform: "translateY(-2px)",
                          boxShadow: 4
                        }
                      }}
                    >
                      <CardContent sx={{ p: 2 }}>
                        <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                          <Typography variant="subtitle1" fontWeight="bold">
                            ID: {violation.id}
                          </Typography>
                          <Chip 
                            label={violation.status_name} 
                            size="small"
                            sx={{ 
                              backgroundColor: getStatusBackgroundColor(violation.status_name),
                              color: getStatusColor(violation.status_name),
                              fontWeight: "bold"
                            }} 
                          />
                        </Box>
                        
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          <strong>Plate:</strong> {violation.plate_number}
                        </Typography>
                        
                        <Typography variant="body2" sx={{ mb: 1 }} noWrap>
                          <strong>Location:</strong> {violation.location}
                        </Typography>
                        
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          <strong>Date:</strong> {format(new Date(violation.detected_at), "dd/MM/yyyy HH:mm")}
                        </Typography>
                        
                        <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 1 }}>
                          <IconButton 
                            onClick={() => toggleRow(violation.id)}
                            sx={{ 
                              transform: expandedRow === violation.id ? "rotate(180deg)" : "rotate(0deg)",
                              transition: "0.3s"
                            }}
                          >
                            <ExpandMoreIcon />
                          </IconButton>
                        </Box>
                        
                        <Fade in={expandedRow === violation.id} timeout={500}>
                          <Box sx={{ display: expandedRow === violation.id ? "block" : "none" }}>
                            <Divider sx={{ my: 2 }} />
                            <ViolationDetail 
                              violation={violation}
                              onStatusUpdate={handleStatusUpdate}
                            />
                          </Box>
                        </Fade>
                      </CardContent>
                    </Card>
                  ))
                )}
              </Box>
            ) : (
              // Desktop table view
              <TableContainer 
                component={Paper} 
                sx={{ 
                  borderRadius: 2, 
                  mb: 4, 
                  boxShadow: 3,
                  overflow: "hidden"
                }}
              >
                <Table sx={{ minWidth: 650 }}>
                  <TableHead sx={{ 
                    backgroundColor: theme.palette.primary.main,
                    "& .MuiTableCell-head": { 
                      color: "white", 
                      fontWeight: "bold" 
                    }
                  }}>
                    <TableRow>
                      <TableCell>ID</TableCell>
                      <TableCell>Detection Address</TableCell>
                      <TableCell>Plate Number</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Date</TableCell>
                      <TableCell align="center">Details</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {violations.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                          <Typography variant="subtitle1">
                            {filterStatus !== "All" 
                              ? `No violations with status "${filterStatus}" found.` 
                              : "No violations match your filter."}
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      violations.map((violation) => (
                        <React.Fragment key={violation.id}>
                          <TableRow 
                            sx={{ 
                              "&:hover": { backgroundColor: theme.palette.action.hover },
                              transition: "background-color 0.2s",
                              cursor: 'pointer',
                              borderLeft: `4px solid ${getStatusColor(violation.status_name)}`,
                            }}
                            onClick={() => toggleRow(violation.id)}
                          >
                            <TableCell>{violation.id}</TableCell>
                            <TableCell>{violation.location}</TableCell>
                            <TableCell>{violation.plate_number}</TableCell>
                            <TableCell>
                              <Chip 
                                label={violation.status_name} 
                                size="small"
                                sx={{ 
                                  backgroundColor: getStatusBackgroundColor(violation.status_name),
                                  color: getStatusColor(violation.status_name),
                                  fontWeight: "bold"
                                }} 
                              />
                            </TableCell>
                            <TableCell>{format(new Date(violation.detected_at), "dd/MM/yyyy HH:mm")}</TableCell>
                            <TableCell align="center">
                              <IconButton 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleRow(violation.id);
                                }}
                                sx={{ 
                                  transform: expandedRow === violation.id ? "rotate(180deg)" : "rotate(0deg)",
                                  transition: "0.3s",
                                  backgroundColor: expandedRow === violation.id ? theme.palette.action.selected : "transparent"
                                }}
                              >
                                <ExpandMoreIcon />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                          <TableRow>
                            <TableCell colSpan={6} sx={{ padding: 0 }}>
                              <Fade in={expandedRow === violation.id} timeout={500}>
                                <Box sx={{ display: expandedRow === violation.id ? "block" : "none" }}>
                                  <ViolationDetail 
                                    violation={violation}
                                    onStatusUpdate={handleStatusUpdate}
                                  />
                                </Box>
                              </Fade>
                            </TableCell>
                          </TableRow>
                        </React.Fragment>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            {/* Pagination Section */}
            <Box 
              display="flex" 
              justifyContent="space-between" 
              alignItems="center"
              flexDirection={isTablet ? "column" : "row"}
              gap={2}
              mt={2}
            >
              <Box sx={{ display: { xs: "none", sm: "block" } }}>
                <Typography variant="body2" color="textSecondary">
                  {totalViolations > 0 ? (
                    `Showing ${Math.min((currentPage - 1) * itemsPerPage + 1, totalViolations)} - ${Math.min(currentPage * itemsPerPage, totalViolations)} of ${totalViolations} violations`
                  ) : (
                    'No violations found'
                  )}
                </Typography>
              </Box>
              
              <CustomPagination
                count={totalPages}
                page={currentPage}
                onChange={handleChangePage}
                disabled={loading || totalViolations === 0}
                size={isTablet ? "small" : "medium"}
              />
            </Box>
          </>
        )}

        {/* Snackbar Notifications */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={3000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: "top", horizontal: "right" }}
        >
          <Alert
            severity={snackbar.severity} 
            variant="filled"
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </Fade>
  );
};

// Helper functions for status colors
const getStatusColor = (status: string) => {
  // Don't convert to lowercase to maintain exact case matching
  switch (status) {
    case "Rejected":
      return "#d32f2f"; // red
    case "AI detected":
      return "#ed6c02"; // orange
    case "AI reliable":
      return "#f59e0b"; // amber
    case "Reported":
      return "#0288d1"; // blue
    case "Verified":
      return "#2e7d32"; // green
    default:
      return "#757575"; // gray
  }
};

const getStatusBackgroundColor = (status: string) => {
  // Don't convert to lowercase to maintain exact case matching
  switch (status) {
    case "Rejected":
      return "rgba(211, 47, 47, 0.1)"; // red background
    case "AI detected":
      return "rgba(237, 108, 2, 0.1)"; // orange background
    case "AI reliable":
      return "rgba(245, 158, 11, 0.1)"; // amber background
    case "Reported":
      return "rgba(2, 136, 209, 0.1)"; // blue background
    case "Verified":
      return "rgba(46, 125, 50, 0.1)"; // green background
    default:
      return "rgba(117, 117, 117, 0.1)"; // gray background
  }
};

export default ViolationDetected;