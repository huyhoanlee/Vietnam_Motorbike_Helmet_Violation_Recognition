import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  IconButton,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Snackbar,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  ImageList,
  ImageListItem,
} from "@mui/material";
import { Edit, Delete, ExpandMore } from "@mui/icons-material";
import { useForm } from "react-hook-form";
import axiosInstance from "../../../services/axiosInstance";
import config from "../../../config";

const API_BASE_URL = `${config.API_URL}`;

interface Status {
  id: string;
  name: string;
  description: string;
}

interface Violation {
  id: string;
  plate_number: string;
  images: string[];
  statusId: string;
}

interface SnackbarState {
  open: boolean;
  message: string;
  severity: "success" | "error";
}

interface StatusForm {
  name: string;
  description: string;
}

const StatusManagement: React.FC = () => {
  const [statuses, setStatuses] = useState<Status[]>([]);
  const [violations, setViolations] = useState<Violation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
  const [currentStatus, setCurrentStatus] = useState<Status | null>(null);
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: "",
    severity: "success",
  });
  const [tabIndex, setTabIndex] = useState<number>(0);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<StatusForm>();

  useEffect(() => {
    fetchStatuses();
    fetchViolations();
  }, []);
  useEffect(() => {
  console.log("Statuses:", statuses);
  console.log("Violations:", violations);
}, [statuses, violations]);


  const fetchStatuses = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get(
        `${API_BASE_URL}violation_status/get-all/`
      );
      const mapped = response.data.data.map((item: any) => ({
        id: String(item.id),
        name: item.status_name,
        description: item.description,
      }));
      setStatuses(mapped);
    } catch (error) {
      console.error("Failed to fetch statuses", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchViolations = async () => {
    try {
      const response = await axiosInstance.get(
        `${API_BASE_URL}violations/get-all/`
      );
      const mappedViolations = response.data.data.map((v: any) => ({
        id: String(v.violation_id),
        plate_number: v.plate_number,
        images: [], 
        statusId: v.status, 
      }));
      setViolations(mappedViolations);
    } catch (error) {
      console.error("Failed to fetch violations", error);
    }
  };

  const handleOpenDialog = (mode: "create" | "edit", status: Status | null = null) => {
    setDialogMode(mode);
    setCurrentStatus(status);
    if (status) {
      setValue("name", status.name);
      setValue("description", status.description);
    } else {
      reset();
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    reset();
  };

  const onSubmit = async (data: StatusForm) => {
    const { name, description } = data;
    const existingStatus = statuses.find(
      (status) => status.name.toLowerCase() === name.toLowerCase()
    );

    if (existingStatus && dialogMode === "create") {
      setSnackbar({
        open: true,
        message: "This status already exists.",
        severity: "error",
      });
      return;
    }

    if (/[^a-zA-Z0-9\s]/.test(name)) {
      setSnackbar({
        open: true,
        message: "Status name cannot contain special characters.",
        severity: "error",
      });
      return;
    }

    try {
      if (dialogMode === "create") {
        await axiosInstance.post(
          `${API_BASE_URL}violation_status/create/`,
          { status_name: name, description }
        );
        setSnackbar({
          open: true,
          message: "Create new status successfully!",
          severity: "success",
        });
      } else if (dialogMode === "edit" && currentStatus) {
        await axiosInstance.patch(
          `${API_BASE_URL}violation_status/change-status/${currentStatus.id}/`,
          { status_name: name, description }
        );
        setSnackbar({
          open: true,
          message: "Status updated successfully!",
          severity: "success",
        });
      }
      fetchStatuses();
      handleCloseDialog();
    } catch (error) {
      setSnackbar({
        open: true,
        message: "An error occurred. Please try again.",
        severity: "error",
      });
    }
  };

  const handleDelete = async (statusId: string) => {
    const isLinked = violations.some((v) => v.statusId === statusId);

    if (isLinked) {
      setSnackbar({
        open: true,
        message: "This status cannot be deleted because it is linked to a violation..",
        severity: "error",
      });
      return;
    }

    if (
      window.confirm("Are you sure you want to delete this status? This action cannot be undone..")
    ) {
      try {
        await axiosInstance.delete(
          `${API_BASE_URL}violation_status/delete/${statusId}/`
        );
        setSnackbar({
          open: true,
          message: "Delete status successfully!",
          severity: "success",
        });
        fetchStatuses();
      } catch (error) {
        setSnackbar({
          open: true,
          message: "Unable to delete status. Please try again..",
          severity: "error",
        });
      }
    }
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabIndex(newValue);
  };

  return (
    <Box sx={{ padding: 4 }}>
      <Typography variant="h4" gutterBottom>
        Status Management
      </Typography>
      <Tabs value={tabIndex} onChange={handleTabChange}>
        <Tab label="Status Management" />
        {/* <Tab label="Violation by Status" /> */}
     
      </Tabs>

      {/* Tab 1: Status Management*/}
      {tabIndex === 0 && (
        <>
          <Button
            variant="contained"
            color="primary"
            sx={{ mt: 2 }}
            onClick={() => handleOpenDialog("create")}
          >
            Tạo mới Status
          </Button>

          {loading ? (
            <CircularProgress sx={{ display: "block", margin: "20px auto" }} />
          ) : (
            <TableContainer component={Paper} sx={{ mt: 2 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Status Name</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {statuses.map((status) => (
                    <TableRow key={status.id}>
                      <TableCell>{status.name}</TableCell>
                      <TableCell>{status.description}</TableCell>
                      <TableCell>
                        <IconButton
                          color="primary"
                          onClick={() => handleOpenDialog("edit", status)}
                        >
                          <Edit />
                        </IconButton>
                        <IconButton
                          color="error"
                          onClick={() => handleDelete(status.id)}
                        >
                          <Delete />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </>
      )}

      {/* Tab 2: Vi phạm theo Status */}
      {tabIndex === 1 && (
        <Box mt={3}>
          {statuses.map((status) => {
            const relatedViolations = violations.filter(
              (v) => v.statusId === status.name
            );

            return (
              <Accordion key={status.id} sx={{ mb: 2 }}>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography fontWeight="bold">
                    {status.name} ({relatedViolations.length} Violations)
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  {relatedViolations.length === 0 ? (
                    <Typography>There are no violations with this status.</Typography>
                  ) : (
                    relatedViolations.map((violation) => (
                      <Paper
                        key={violation.id}
                        sx={{ p: 2, mb: 2, backgroundColor: "#fafafa" }}
                        elevation={1}
                      >
                        <Typography fontWeight="500">
                          Violation ID: {violation.id}
                        </Typography>
                        <Typography variant="body2" gutterBottom>
                          Plate Number: {violation.plate_number || "No license plate"}
                        </Typography>
                        {violation.images && violation.images.length > 0 && (
                          <ImageList cols={3} gap={8}>
                            {violation.images.map((img, index) => (
                              <ImageListItem key={index}>
                                <img
                                  src={img}
                                  alt={`violation-${violation.id}-${index}`}
                                  loading="lazy"
                                  style={{ borderRadius: 8 }}
                                />
                              </ImageListItem>
                            ))}
                          </ImageList>
                        )}
                      </Paper>
                    ))
                  )}
                </AccordionDetails>
              </Accordion>
            );
          })}
        </Box>
      )}

      {/* Dialog tạo / chỉnh sửa Status */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {dialogMode === "create" ? "Create new Status" : "Edit Status"}
        </DialogTitle>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogContent>
            <TextField
              label="Status Name"
              fullWidth
              margin="normal"
              {...register("name", { required: "Status name cannot be blank" })}
              error={!!errors.name}
              helperText={errors.name?.message}
            />
            <TextField
              label="Reason for creation / Description"
              fullWidth
              margin="normal"
              multiline
              rows={3}
              {...register("description", { required: "Description cannot be empty" })}
              error={!!errors.description}
              helperText={errors.description?.message}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Hủy</Button>
            <Button variant="contained" type="submit">
              {dialogMode === "create" ? "Create" : "Update"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Snackbar thông báo */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          severity={snackbar.severity as "success" | "error"}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default StatusManagement;

 
