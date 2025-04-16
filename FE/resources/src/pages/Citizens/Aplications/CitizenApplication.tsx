import {
  Box, Typography, Grid, TextField, Snackbar, Alert,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Card, CardContent, CardMedia, Chip, IconButton, Modal,
  Button, Fade, Backdrop, Stack, CircularProgress
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import { useEffect, useState } from "react";
import axios from "axios";

// 👉 Base API and axios setup
const API_BASE_URL = "https://hanaxuan-backend.hf.space/api/";

interface Application {
  car_parrot_id: number;
  plate_number: string;
  status: "submitted" | "verified" | "rejected";
  image: string;
  citizen_id: number;
}

const CitizenApplication = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState<Application | null>(null);
  const [newPlate, setNewPlate] = useState("");
  const [newImage, setNewImage] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [imgModalOpen, setImgModalOpen] = useState(false);
  const [viewImageSrc, setViewImageSrc] = useState("");
  const [snackbarMsg, setSnackbarMsg] = useState("");
  const [snackbarType, setSnackbarType] = useState<"success" | "error">("success");

  const [formPlate, setFormPlate] = useState("");
  const [formImage, setFormImage] = useState<File | null>(null);
  const [formPreview, setFormPreview] = useState<string | null>(null);

  const citizenId = Number(localStorage.getItem("citizen_id") || 1); // fallback = 1

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}citizens/get-applications/${citizenId}/`);
      console.log("🔍 Applications from API:", res.data.applications);
      setApplications(res.data.applications || []);
    } catch (error) {
      console.error("Error fetching applications", error);
    } finally {
      setLoading(false);
    }
  };
  const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};
const handleCreate = async () => {
  if (!formPlate || !formImage) {
    setSnackbarMsg("Please enter plate number and upload image.");
    setSnackbarType("error");
    return;
  }

  try {
    const base64Image = await fileToBase64(formImage);

    const payload = {
      plate_number: formPlate,
      image: base64Image,
    };

    const res = await axios.post(
      `${API_BASE_URL}citizens/register-car-parrot/${citizenId}/`,
      payload
    );

    setSnackbarMsg(res.data.message || "Application submitted.");
    setSnackbarType("success");
    setFormPlate("");
    setFormImage(null);
    setFormPreview(null);
    fetchApplications();
  } catch (err: any) {
    const msg = err.response?.data?.error || "Something went wrong.";
    setSnackbarMsg(msg);
    setSnackbarType("error");
  }
};

  const handleEditClick = (app: Application) => {
    setSelectedApp(app);
    setNewPlate(app.plate_number);
    setPreviewImage(app.image);
    setNewImage(null);
    setEditDialogOpen(true);
  };
  
  const handleUpdate = async () => {
    if (!newPlate || !previewImage || !selectedApp) {
      setSnackbarMsg("Plate number and image are required.");
      setSnackbarType("error");
      return;
    }

  try {
    let imageBase64 = previewImage;

    if (newImage) {
      imageBase64 = await fileToBase64(newImage);
    }

    if (!imageBase64) {
      setSnackbarMsg("Image is required.");
      setSnackbarType("error");
      return;
    }

    const payload = {
      plate_number: newPlate,
      image: imageBase64,
    };
      await axios.patch(`${API_BASE_URL}car_parrots/update/${selectedApp.car_parrot_id}/`, payload);
      setSnackbarMsg("Application updated successfully.");
      setSnackbarType("success");
      fetchApplications();
    } catch (err: any) {
      const msg = err.response?.data?.error || "Update failed.";
      setSnackbarMsg(msg);
      setSnackbarType("error");
    } finally {
      setEditDialogOpen(false);
    }
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1200, mx: "auto" }}>
      <Typography variant="h4" fontWeight={700} mb={3}>
        Vehicle Plate Applications
      </Typography>

      {/* Create form */}
      <Box sx={{ mb: 4, p: 2, border: "1px solid #ccc", borderRadius: 2, background: "#f9f9f9" }}>
        <Typography variant="h6" mb={2}>
          <AddCircleOutlineIcon sx={{ mr: 1 }} />
          New Application
        </Typography>
        <Stack spacing={2}>
          <TextField
            label="Plate Number"
            fullWidth
            value={formPlate}
            onChange={(e) => setFormPlate(e.target.value)}
          />
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                setFormImage(file);
                setFormPreview(URL.createObjectURL(file));
              }
            }}
          />
          {formPreview && (
            <img
              src={formPreview}
              alt="Preview"
              style={{ maxHeight: 200, borderRadius: 8 }}
            />
          )}
          <Button variant="contained" color="primary" onClick={handleCreate}>
            Submit Application
          </Button>
        </Stack>
      </Box>

      {/* Application list */}
      {loading ? (
        <Box textAlign="center" mt={4}>
          <CircularProgress />
        </Box>
      ) : (
        <Grid container spacing={3}>
          {applications.map((app) => (
            <Grid item xs={12} sm={6} md={4} key={app.car_parrot_id}>
              <Card sx={{ borderRadius: 2, boxShadow: 3 }}>
                <CardMedia
                  component="img"
                  height="200"
                  image={app.image}
                  alt={`Plate ${app.plate_number}`}
                  sx={{ cursor: "pointer", objectFit: "cover" }}
                  onClick={() => {
                    setViewImageSrc(app.image);
                    setImgModalOpen(true);
                  }}
                />
                <CardContent>
                  <Typography variant="subtitle1" fontWeight={600}>
                    Plate: {app.plate_number}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    ID: {app.car_parrot_id}
                  </Typography>
                  <Box mt={1} display="flex" justifyContent="space-between" alignItems="center">
                    <Chip
                      label={app.status}
                      color={
                        app.status.toLowerCase() === "submitted"
                          ? "warning"
                          : app.status === "verified"
                          ? "success"
                          : "error"
                      }
                    />
                    {app.status.toLowerCase() === "submitted" && (
                      <IconButton onClick={() => handleEditClick(app)} size="small" >
                        <EditIcon />
                      </IconButton>
                    )}
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Update Plate Information</DialogTitle>
        <DialogContent dividers>
          <Typography mb={2}>
            Are you sure you want to update the plate number and image?
          </Typography>
          <TextField
            label="Plate Number"
            fullWidth
            value={newPlate}
            onChange={(e) => setNewPlate(e.target.value)}
            sx={{ mb: 2 }}
          />
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                setNewImage(file);
                setPreviewImage(URL.createObjectURL(file));
              }
            }}
          />
          {previewImage && (
            <Box mt={2}>
              <img src={previewImage} alt="Preview" style={{ maxWidth: "100%", borderRadius: 8 }} />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" color="primary" onClick={handleUpdate}>
            Confirm Update
          </Button>
        </DialogActions>
      </Dialog>

      {/* Modal Preview Image */}
      <Modal
        open={imgModalOpen}
        onClose={() => setImgModalOpen(false)}
        closeAfterTransition
        BackdropComponent={Backdrop}
        BackdropProps={{ timeout: 300 }}
      >
        <Fade in={imgModalOpen}>
          <Box
            sx={{
              position: "absolute",
              top: "50%", left: "50%", transform: "translate(-50%, -50%)",
              bgcolor: "background.paper", borderRadius: 2,
              boxShadow: 24, p: 1,
              maxWidth: 600,
            }}
          >
            <img
              src={viewImageSrc}
              alt="Car plate preview"
              style={{ width: "100%", borderRadius: 8 }}
            />
          </Box>
        </Fade>
      </Modal>

      {/* Snackbar */}
      <Snackbar
        open={!!snackbarMsg}
        autoHideDuration={3000}
        onClose={() => setSnackbarMsg("")}
      >
        <Alert severity={snackbarType}>{snackbarMsg}</Alert>
      </Snackbar>
    </Box>
  );
};

export default CitizenApplication;
