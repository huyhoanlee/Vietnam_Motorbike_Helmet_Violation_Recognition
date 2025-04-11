import {
  Box, Typography, Grid, TextField, Snackbar, Alert,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Card, CardContent, CardMedia, Chip, IconButton, Modal,
  Button, Fade, Backdrop, Stack
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import AddCircleOutlineIcon from "@mui/icons-material/AddCircleOutline";
import { useState } from "react";

interface Application {
  car_parrot_id: number;
  plate_number: string;
  status: "submitted" | "verified" | "rejected";
  image: string;
  citizen_id: number;
}

let nextId = 4; // Tăng dần để tạo ID giả lập

const CardApplicationHardCode = () => {
  const [applications, setApplications] = useState<Application[]>([
    {
      car_parrot_id: 1,
      plate_number: "ABC123",
      status: "submitted",
      image: "/images/car_parrot_2.jpg",
      citizen_id: 5,
    },
    {
      car_parrot_id: 2,
      plate_number: "XYZ789",
      status: "verified",
      image: "/images/car_parrot_2.jpg",
      citizen_id: 5,
    },
    {
      car_parrot_id: 3,
      plate_number: "DEF456",
      status: "rejected",
      image: "/images/car_parrot_2.jpg",
      citizen_id: 5,
    },
  ]);

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

  const handleEditClick = (app: Application) => {
    setSelectedApp(app);
    setNewPlate(app.plate_number);
    setPreviewImage(app.image);
    setNewImage(null);
    setEditDialogOpen(true);
  };

  const handleUpdate = () => {
    if (!newPlate || !previewImage) {
      setSnackbarMsg("Plate number and image are required.");
      setSnackbarType("error");
      return;
    }

    setApplications((prev) =>
      prev.map((app) =>
        app.car_parrot_id === selectedApp?.car_parrot_id
          ? {
              ...app,
              plate_number: newPlate,
              image: newImage ? previewImage : app.image,
            }
          : app
      )
    );

    setSnackbarMsg("Application updated successfully.");
    setSnackbarType("success");
    setEditDialogOpen(false);
  };

  const handleCreate = () => {
    if (!formPlate || !formPreview) {
      setSnackbarMsg("Please enter plate number and select image.");
      setSnackbarType("error");
      return;
    }

    const exists = applications.some((a) => a.plate_number === formPlate);
    if (exists) {
      setSnackbarMsg("Plate number already registered.");
      setSnackbarType("error");
      return;
    }

    const newApp: Application = {
      car_parrot_id: nextId++,
      plate_number: formPlate,
      status: "submitted",
      image: formPreview,
      citizen_id: 5,
    };

    setApplications((prev) => [newApp, ...prev]);
    setSnackbarMsg("Car plate registered successfully.");
    setSnackbarType("success");

    setFormPlate("");
    setFormImage(null);
    setFormPreview(null);
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1200, mx: "auto" }}>
      <Typography variant="h4" fontWeight={700} mb={3}>
        Vehicle Plate Applications
      </Typography>

      {/* Create new application */}
      <Box
        sx={{
          mb: 4,
          p: 2,
          border: "1px solid #ccc",
          borderRadius: 2,
          background: "#f9f9f9",
        }}
      >
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
                      app.status === "submitted"
                        ? "warning"
                        : app.status === "verified"
                        ? "success"
                        : "error"
                    }
                  />
                  {app.status === "submitted" && (
                    <IconButton onClick={() => handleEditClick(app)} size="small">
                      <EditIcon />
                    </IconButton>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

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
              maxWidth: 500,
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

export default CardApplicationHardCode;
