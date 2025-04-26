import  { useEffect, useState } from "react";
import {
  Paper, Typography, TextField, Grid, Button, Snackbar, Alert, MenuItem, CircularProgress
} from "@mui/material";
import axios from "axios";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
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



const DEFAULT_POSITION: LatLngExpression = [13.782289, 109.219272]; // Quy Nhơn

function ClickHandler({ onClick }: { onClick: (pos: LatLngExpression) => void }) {
  useMapEvents({
    click(e) {
      onClick([e.latlng.lat, e.latlng.lng]);
    },
  });
  return null;
}

const LocationCreator = () => {
  const [cities, setCities] = useState<string[]>([]);
  const [districts, setDistricts] = useState<string[]>([]);
  const [roads, setRoads] = useState<string[]>([]);

  const [selectedCity, setSelectedCity] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedRoad, setSelectedRoad] = useState("");

  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [markerPos, setMarkerPos] = useState<LatLngExpression>(DEFAULT_POSITION);

  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success" as "success" | "error"
  });

  const handleCloseSnackbar = () => setSnackbar({ ...snackbar, open: false });

useEffect(() => {
  console.log("Fetching cities...");
  axiosInstance.get(`${API_BASE_URL}locations/cities/`)
    .then(res => {
      console.log("Cities fetched:", res.data);
      setCities(res.data.cities);
    })
    .catch((err) => {
      console.error("Unable to load city list", err);
    });
}, []);

useEffect(() => {
  if (selectedCity) {
    console.log("City selected:", selectedCity);
    axiosInstance.get(`${API_BASE_URL}locations/districts/?city=${selectedCity}`)
      .then(res => {
        console.log("Districts fetched:", res.data);
        setDistricts(res.data.districts);
      })
      .catch((err) => {
        console.error("Error fetch districts:", err);
        setDistricts([]);
      });
  }
}, [selectedCity]);


useEffect(() => {
  if (selectedCity && selectedDistrict) {
    console.log("City and District selected:", selectedCity, selectedDistrict);
    axiosInstance.get(`${API_BASE_URL}locations/roads/?city=${encodeURIComponent(selectedCity)}&district=${encodeURIComponent(selectedDistrict)}`)
      .then(res => {
        console.log("Roads fetched:", res.data);
        setRoads(res.data.roads || res.data); // tùy thuộc vào format của response
      })
      .catch((err) => {
        console.error("Error fetch roads:", err.response?.data || err);
        setRoads([]);
      });
  }
}, [selectedCity, selectedDistrict]);

const handleCreate = async () => {
  if (!name || !selectedCity || !selectedDistrict || !selectedRoad) {
    console.warn("Incomplete information:", { name, selectedCity, selectedDistrict, selectedRoad });
    setSnackbar({ open: true, message: "Please enter complete information", severity: "error" });
    return;
  }

    const payload = {
      name,
      city: selectedCity,
      dist: selectedDistrict,
      road: selectedRoad
    };
     console.log("Sending create request with payload:", payload);

    setLoading(true);
    try {
      const res = await axiosInstance.post(`${API_BASE_URL}locations/create/`, payload);
      console.log("Create response:", res.data);
      setSnackbar({ open: true, message: "Create a successful location!", severity: "success" });
      setName("");
      setSelectedCity("");
      setSelectedDistrict("");
      setSelectedRoad("");
      setMarkerPos(DEFAULT_POSITION);
    } catch (err) {
      console.error("Error creating location:", err);
      setSnackbar({ open: true, message: "Create failed. Check data!", severity: "error" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper sx={{ p: 4, maxWidth: 800, mx: "auto", mt: 5, borderRadius: 3, boxShadow: 5 }}>
      <Typography variant="h5" fontWeight="bold" gutterBottom>
        Create new location (Supervisor)
      </Typography>

      <Grid container spacing={2}>
        <Grid item xs={12}>
          <TextField
            label="Location Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            fullWidth
            required
          />
        </Grid>

        <Grid item xs={12} sm={4}>
          <TextField
            label="City"
            select
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            fullWidth
            required
          >
            {cities.map((city) => (
              <MenuItem key={city} value={city}>{city}</MenuItem>
            ))}
          </TextField>
        </Grid>

        <Grid item xs={12} sm={4}>
          <TextField
            label="District"
            select
            value={selectedDistrict}
            onChange={(e) => setSelectedDistrict(e.target.value)}
            fullWidth
            required
            disabled={!selectedCity}
          >
            {districts.map((dist) => (
              <MenuItem key={dist} value={dist}>{dist}</MenuItem>
            ))}
          </TextField>
        </Grid>

        <Grid item xs={12} sm={4}>
          <TextField
            label="Road"
            select
            value={selectedRoad}
            onChange={(e) => setSelectedRoad(e.target.value)}
            fullWidth
            required
            disabled={!selectedDistrict}
          >
            {roads.map((road) => (
              <MenuItem key={road} value={road}>{road}</MenuItem>
            ))}
          </TextField>
        </Grid>

        <Grid item xs={12}>
          <MapContainer
            center={markerPos}
            zoom={16}
            scrollWheelZoom={false}
            style={{ height: "300px", width: "100%", borderRadius: 10 }}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={markerPos}>
              <Popup>The location you choose</Popup>
            </Marker>
            <ClickHandler onClick={(pos) => setMarkerPos(pos)} />
          </MapContainer>
        </Grid>

        <Grid item xs={12} textAlign="right">
          <Button
            variant="contained"
            color="primary"
            onClick={handleCreate}
            disabled={loading}
            sx={{ minWidth: 160, fontWeight: "bold", borderRadius: 2 }}
          >
            {loading ? <CircularProgress size={24} color="inherit" /> : "Create a location"}
          </Button>
        </Grid>
      </Grid>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: "100%" }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Paper>
  );
};

export default LocationCreator;
