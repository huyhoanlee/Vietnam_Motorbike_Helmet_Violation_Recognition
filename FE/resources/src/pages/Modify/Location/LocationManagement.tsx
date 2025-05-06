import { useEffect, useState, useMemo } from "react";
import {
  Paper, Typography, TextField, Grid, Button, Snackbar, Alert, MenuItem, CircularProgress,
  Box, Tabs, Tab, Divider, Chip, Card, CardContent, CardActions, Fade, useTheme, useMediaQuery,
  IconButton
} from "@mui/material";
import {
  LocationOn, Add, Refresh, Search, Close, 
  ExpandMore, ExpandLess, FilterList, Map as MapIcon
} from "@mui/icons-material";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from "react-leaflet";
import L, { LatLngExpression } from "leaflet";
import "leaflet/dist/leaflet.css";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
import config from "../../../config";
import axiosInstance from "../../../services/axiosInstance";

const API_BASE_URL = `${config.API_URL}`;

// Fix icon marker không hiển thị
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

// Default location (Quy Nhơn)
const DEFAULT_POSITION: LatLngExpression = [13.782289, 109.219272];

// Interface for location data
interface LocationData {
  id: number;
  city: string;
  dist: string;
  road: string;
  name: string;
}

// Component to handle map clicks and move the marker
function MapClickHandler({ onClick }: { onClick: (pos: LatLngExpression) => void }) {
  useMapEvents({
    click(e) {
      onClick([e.latlng.lat, e.latlng.lng]);
    },
  });
  return null;
}

// Component to center map view on marker position
function MapCenterUpdater({ position }: { position: LatLngExpression }) {
  const map = useMap();
  useEffect(() => {
    map.setView(position, map.getZoom());
  }, [position, map]);
  return null;
}

// Tab panel component
function TabPanel(props: {
  children?: React.ReactNode;
  index: number;
  value: number;
}) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`location-tabpanel-${index}`}
      aria-labelledby={`location-tab-${index}`}
      {...other}
      style={{ width: '100%' }}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const LocationManagement = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  // Tab state
  const [tabValue, setTabValue] = useState(0);

  // Location creation state
  const [cities, setCities] = useState<string[]>([]);
  const [districts, setDistricts] = useState<string[]>([]);
  const [roads, setRoads] = useState<string[]>([]);
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedRoad, setSelectedRoad] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [markerPos, setMarkerPos] = useState<LatLngExpression>(DEFAULT_POSITION);

  // Locations list state
  const [locations, setLocations] = useState<LocationData[]>([]);
  const [loadingLocations, setLoadingLocations] = useState(false);
  const [expandedLocation, setExpandedLocation] = useState<number | null>(null);
  // const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  // const [locationToDelete, setLocationToDelete] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCity, setFilterCity] = useState<string>("");

  // Snackbar state
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error"
  });

  // Fetch cities on component mount
  useEffect(() => {
    fetchCities();
    fetchLocations();
  }, []);

  // Fetch districts when city is selected
  useEffect(() => {
    if (selectedCity) {
      fetchDistricts(selectedCity);
    } else {
      setDistricts([]);
      setSelectedDistrict("");
    }
  }, [selectedCity]);

  // Fetch roads when district is selected
  useEffect(() => {
    if (selectedCity && selectedDistrict) {
      fetchRoads(selectedCity, selectedDistrict);
    } else {
      setRoads([]);
      setSelectedRoad("");
    }
  }, [selectedCity, selectedDistrict]);

  // Filter locations based on search term and filter city
  const filteredLocations = useMemo(() => {
    return locations.filter(location => {
      const matchesSearch = searchTerm === "" || 
        location.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        location.road.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesCity = filterCity === "" || location.city === filterCity;
      
      return matchesSearch && matchesCity;
    });
  }, [locations, searchTerm, filterCity]);

  // Fetch all cities
  const fetchCities = async () => {
    try {
      const res = await axiosInstance.get(`${API_BASE_URL}locations/cities/`);
      setCities(res.data.cities);
    } catch (err) {
      console.error("Unable to load city list", err);
      setSnackbar({ 
        open: true, 
        message: "Failed to load cities. Please try again.", 
        severity: "error" 
      });
    }
  };

  // Fetch districts by city
  const fetchDistricts = async (city: string) => {
    try {
      const res = await axiosInstance.get(`${API_BASE_URL}locations/districts/?city=${encodeURIComponent(city)}`);
      setDistricts(res.data.districts);
    } catch (err) {
      console.error("Error fetch districts:", err);
      setDistricts([]);
    }
  };

  // Fetch roads by city and district
  const fetchRoads = async (city: string, district: string) => {
    try {
      const res = await axiosInstance.get(
        `${API_BASE_URL}locations/roads/?city=${encodeURIComponent(city)}&district=${encodeURIComponent(district)}`
      );
      setRoads(res.data.roads || res.data);
    } catch (err) {
      console.error("Error fetch roads:", err);
      setRoads([]);
    }
  };

  // Fetch all locations
  const fetchLocations = async () => {
    setLoadingLocations(true);
    try {
      const res = await axiosInstance.get(`${API_BASE_URL}locations/get-all/`);
      setLocations(res.data.data);
    } catch (err) {
      console.error("Error fetching locations:", err);
      setSnackbar({ 
        open: true, 
        message: "Failed to load locations. Please try again.", 
        severity: "error" 
      });
    } finally {
      setLoadingLocations(false);
    }
  };

  // Create new location
  const handleCreateLocation = async () => {
    if (!name || !selectedCity || !selectedDistrict || !selectedRoad) {
      setSnackbar({ 
        open: true, 
        message: "Please enter complete information", 
        severity: "error" 
      });
      return;
    }

    const payload = {
      name,
      city: selectedCity,
      dist: selectedDistrict,
      road: selectedRoad
    };

    setLoading(true);
    try {
      await axiosInstance.post(`${API_BASE_URL}locations/create/`, payload);
      setSnackbar({ 
        open: true, 
        message: "Location created successfully!", 
        severity: "success" 
      });
      resetForm();
      fetchLocations(); // Refresh locations list
      setTabValue(1); // Switch to locations list tab
    } catch (err) {
      console.error("Error creating location:", err);
      setSnackbar({ 
        open: true, 
        message: "Failed to create location. Please check your data.", 
        severity: "error" 
      });
    } finally {
      setLoading(false);
    }
  };

  // // Delete location
  // const handleDeleteLocation = async () => {
  //   if (locationToDelete === null) return;
    
  //   try {
  //     // Replace with your actual delete endpoint
  //     await axiosInstance.delete(`${API_BASE_URL}locations/delete/${locationToDelete}`);
  //     setSnackbar({ 
  //       open: true, 
  //       message: "Location deleted successfully!", 
  //       severity: "success" 
  //     });
  //     fetchLocations(); // Refresh locations list
  //   } catch (err) {
  //     console.error("Error deleting location:", err);
  //     setSnackbar({ 
  //       open: true, 
  //       message: "Failed to delete location. Please try again.", 
  //       severity: "error" 
  //     });
  //   } finally {
  //     setDeleteDialogOpen(false);
  //     setLocationToDelete(null);
  //   }
  // };

  // Reset form fields
  const resetForm = () => {
    setName("");
    setSelectedCity("");
    setSelectedDistrict("");
    setSelectedRoad("");
    setMarkerPos(DEFAULT_POSITION);
  };

  // Handle tab change
  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Handle snackbar close
  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  // Toggle location card expanded state
  const toggleLocationExpand = (id: number) => {
    setExpandedLocation(expandedLocation === id ? null : id);
  };

  // Confirm location deletion
  // const confirmDelete = (id: number) => {
  //   setLocationToDelete(id);
  //   setDeleteDialogOpen(true);
  // };

  // Handle map marker position update
  const handleMarkerPosChange = (pos: LatLngExpression) => {
    setMarkerPos(pos);
  };

  return (
    <Box sx={{ width: '100%', minHeight: '100vh', bgcolor: 'background.default', py: 3 }}>
      <Paper 
        elevation={5}
        sx={{ 
          maxWidth: 1200, 
          mx: 'auto', 
          borderRadius: 4, 
          overflow: 'hidden',
          boxShadow: theme => `0 8px 24px ${theme.palette.primary.main}22`
        }}
      >
        {/* Header */}
        <Box
          sx={{
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
            p: 3,
            backgroundImage: 'linear-gradient(135deg, #0077b6 0%, #0096c7 100%)',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <LocationOn sx={{ fontSize: 40, mr: 2 }} />
            <Typography variant="h4" fontWeight="bold">
              Location Management
            </Typography>
          </Box>
          <Typography variant="subtitle1">
            Create and manage location data with interactive map visualization
          </Typography>
        </Box>

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange}
            variant={isMobile ? "fullWidth" : "standard"}
            centered={!isMobile}
            sx={{
              '& .MuiTab-root': {
                fontWeight: 600,
                fontSize: '1rem',
                py: 2,
              },
              '& .Mui-selected': {
                color: 'primary.main',
              }
            }}
          >
            <Tab 
              icon={<Add />} 
              iconPosition="start" 
              label="Create Location" 
              id="location-tab-0"
              aria-controls="location-tabpanel-0"
            />
            <Tab 
              icon={<MapIcon />}
              iconPosition="start"
              label="View Locations" 
              id="location-tab-1"
              aria-controls="location-tabpanel-1" 
            />
          </Tabs>
        </Box>
        
        {/* Create Location Tab */}
        <TabPanel value={tabValue} index={0}>
          <Fade in={tabValue === 0}>
            <Box>
              <Typography variant="h6" fontWeight="bold" gutterBottom color="primary">
                Add New Location
              </Typography>
              <Divider sx={{ mb: 3 }} />
              
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    label="Location Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    fullWidth
                    required
                    placeholder="Enter a descriptive name for this location"
                    InputProps={{
                      startAdornment: <LocationOn color="action" sx={{ mr: 1 }} />,
                    }}
                    sx={{ mb: 1 }}
                  />
                </Grid>

                <Grid item xs={12} md={4}>
                  <TextField
                    label="City"
                    select
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                    fullWidth
                    required
                    helperText="Select the city"
                  >
                    {cities.map((city) => (
                      <MenuItem key={city} value={city}>{city}</MenuItem>
                    ))}
                  </TextField>
                </Grid>

                <Grid item xs={12} md={4}>
                  <TextField
                    label="District"
                    select
                    value={selectedDistrict}
                    onChange={(e) => setSelectedDistrict(e.target.value)}
                    fullWidth
                    required
                    disabled={!selectedCity}
                    helperText={!selectedCity ? "Select a city first" : "Select the district"}
                  >
                    {districts.map((dist) => (
                      <MenuItem key={dist} value={dist}>{dist}</MenuItem>
                    ))}
                  </TextField>
                </Grid>

                <Grid item xs={12} md={4}>
                  <TextField
                    label="Road"
                    select
                    value={selectedRoad}
                    onChange={(e) => setSelectedRoad(e.target.value)}
                    fullWidth
                    required
                    disabled={!selectedDistrict}
                    helperText={!selectedDistrict ? "Select a district first" : "Select the road"}
                  >
                    {roads.map((road) => (
                      <MenuItem key={road} value={road}>{road}</MenuItem>
                    ))}
                  </TextField>
                </Grid>

                <Grid item xs={12}>
                  <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, mt: 2 }}>
                    Click on the map to select precise location
                  </Typography>
                  
                  <Paper elevation={3} sx={{ overflow: 'hidden', borderRadius: 2, height: 400 }}>
                    <MapContainer
                      center={markerPos}
                      zoom={16}
                      scrollWheelZoom={true}
                      style={{ height: "100%", width: "100%" }}
                    >
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      <Marker position={markerPos}>
                        <Popup>
                          <Typography variant="body2" fontWeight="bold">
                            {name || "Selected Location"}
                          </Typography>
                          <Typography variant="caption">
                            {selectedCity && `${selectedCity}, `}
                            {selectedDistrict && `${selectedDistrict}, `}
                            {selectedRoad || ""}
                          </Typography>
                        </Popup>
                      </Marker>
                      <MapClickHandler onClick={handleMarkerPosChange} />
                      <MapCenterUpdater position={markerPos} />
                    </MapContainer>
                  </Paper>
                </Grid>

                <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 2 }}>
                  <Button
                    variant="outlined"
                    onClick={resetForm}
                    color="secondary"
                    sx={{ borderRadius: 2, px: 3 }}
                  >
                    Reset
                  </Button>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleCreateLocation}
                    disabled={loading}
                    sx={{ 
                      borderRadius: 2, 
                      px: 4,
                      py: 1.5,
                      fontWeight: "bold",
                      boxShadow: 3,
                      '&:hover': {
                        boxShadow: 5,
                      }
                    }}
                    startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Add />}
                  >
                    {loading ? "Creating..." : "Create Location"}
                  </Button>
                </Grid>
              </Grid>
            </Box>
          </Fade>
        </TabPanel>

        {/* View Locations Tab */}
        <TabPanel value={tabValue} index={1}>
          <Fade in={tabValue === 1}>
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                <Typography variant="h6" fontWeight="bold" color="primary">
                  Existing Locations
                </Typography>
                
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <Button
                    startIcon={<Refresh />}
                    onClick={fetchLocations}
                    variant="outlined"
                    disabled={loadingLocations}
                    sx={{ borderRadius: 2 }}
                  >
                    Refresh
                  </Button>
                </Box>
              </Box>

              {/* Search and Filter */}
              <Grid container spacing={2} sx={{ mb: 3 }}>
                <Grid item xs={12} md={8}>
                  <TextField
                    fullWidth
                    placeholder="Search by name or road..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                      startAdornment: <Search color="action" sx={{ mr: 1 }} />,
                      endAdornment: searchTerm && (
                        <IconButton size="small" onClick={() => setSearchTerm("")}>
                          <Close fontSize="small" />
                        </IconButton>
                      ),
                    }}
                    variant="outlined"
                    sx={{ bgcolor: 'background.paper' }}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField
                    select
                    fullWidth
                    label="Filter by City"
                    value={filterCity}
                    onChange={(e) => setFilterCity(e.target.value)}
                    InputProps={{
                      startAdornment: <FilterList color="action" sx={{ mr: 1 }} />
                    }}
                    sx={{ bgcolor: 'background.paper' }}
                  >
                    <MenuItem value="">All Cities</MenuItem>
                    {cities.map((city) => (
                      <MenuItem key={city} value={city}>{city}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
              </Grid>

              <Divider sx={{ mb: 3 }} />

              {/* Locations List */}
              {loadingLocations ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
                  <CircularProgress />
                </Box>
              ) : filteredLocations.length === 0 ? (
                <Box sx={{ textAlign: 'center', p: 5, bgcolor: 'background.paper', borderRadius: 2 }}>
                  <Typography variant="h6" color="text.secondary">No locations found</Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    {searchTerm || filterCity ? "Try adjusting your search or filters" : "Create your first location to get started"}
                  </Typography>
                </Box>
              ) : (
                <Grid container spacing={3}>
                  {filteredLocations.map((location) => (
                    <Grid item xs={12} sm={6} md={4} key={location.id}>
                      <Card 
                        elevation={3}
                        sx={{ 
                          borderRadius: 2,
                          transition: 'all 0.3s ease',
                          '&:hover': {
                            transform: 'translateY(-4px)',
                            boxShadow: 6,
                          }
                        }}
                      >
                        <CardContent>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <Typography variant="h6" fontWeight="bold" noWrap sx={{ mb: 1, maxWidth: '70%' }}>
                              {location.name}
                            </Typography>
                            <Chip 
                              label={location.city} 
                              size="small" 
                              color="primary" 
                              variant="outlined" 
                            />
                          </Box>
                          
                          <Divider sx={{ my: 1 }} />
                          
                          <Box sx={{ mt: 2 }}>
                            <Typography variant="body2">
                              <strong>District:</strong> {location.dist}
                            </Typography>
                            <Typography variant="body2">
                              <strong>Road:</strong> {location.road}
                            </Typography>
                          </Box>
                        </CardContent>
                        
                        <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
                          <Button 
                            size="small" 
                            onClick={() => toggleLocationExpand(location.id)}
                            endIcon={expandedLocation === location.id ? <ExpandLess /> : <ExpandMore />}
                          >
                            {expandedLocation === location.id ? "Less" : "More"}
                          </Button>
                          
                          <Box>
                            {/* <Tooltip title="Edit Location">
                              <IconButton 
                                size="small" 
                                color="primary"
                                onClick={() => {
                                  // Implement edit functionality
                                  console.log("Edit location", location.id);
                                }}
                              >
                                <Edit fontSize="small" />
                              </IconButton>
                            </Tooltip> */}
                            
                            {/* <Tooltip title="Delete Location">
                              <IconButton 
                                size="small" 
                                color="error"
                                onClick={() => confirmDelete(location.id)}
                              >
                                <Delete fontSize="small" />
                              </IconButton>
                            </Tooltip> */}
                          </Box>
                        </CardActions>
                        
                        {/* Expanded view with map */}
                        {expandedLocation === location.id && (
                          <Fade in={expandedLocation === location.id}>
                            <Box sx={{ p: 2, bgcolor: 'background.paper', borderTop: 1, borderColor: 'divider' }}>
                              <Typography variant="subtitle2" gutterBottom>
                                Location Preview
                              </Typography>
                              <Box 
                                sx={{ 
                                  height: 200, 
                                  width: '100%', 
                                  borderRadius: 1, 
                                  overflow: 'hidden',
                                  border: 1,
                                  borderColor: 'divider'
                                }}
                              >
                                <MapContainer
                                  center={DEFAULT_POSITION} // Use actual location coordinates when available
                                  zoom={15}
                                  scrollWheelZoom={false}
                                  style={{ height: "100%", width: "100%" }}
                                >
                                  <TileLayer
                                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                  />
                                  <Marker position={DEFAULT_POSITION}>
                                    <Popup>
                                      {location.name}<br />
                                      {location.road}, {location.dist}, {location.city}
                                    </Popup>
                                  </Marker>
                                </MapContainer>
                              </Box>
                            </Box>
                          </Fade>
                        )}
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}
            </Box>
          </Fade>
        </TabPanel>
      </Paper>

      {/* Delete Confirmation Dialog */}
      {/* <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        aria-labelledby="delete-dialog-title"
      >
        <DialogTitle id="delete-dialog-title">
          Confirm Deletion
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this location? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialogOpen(false)} color="primary">
            Cancel
          </Button>
          <Button onClick={handleDeleteLocation} color="error" variant="contained">
            Delete
          </Button>
        </DialogActions>
      </Dialog> */}

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity} 
          variant="filled"
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default LocationManagement;