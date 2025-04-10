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
} from "@mui/material";
import { Edit, Delete} from "@mui/icons-material";
import { useForm } from "react-hook-form";

interface Status {
  id: string;
  name: string;
  description: string;
}

interface Violation {
  id: string;
  description: string;
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

const HardCodeStatus: React.FC = () => {
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
  const [expandedStatusId, setExpandedStatusId] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [openImageDialog, setOpenImageDialog] = useState<boolean>(false);

  const handleOpenImage = (img: string) => {
  setSelectedImage(img);
  setOpenImageDialog(true);
};

  const handleCloseImage = () => {
    setOpenImageDialog(false);
    setSelectedImage(null);
  };

  const toggleExpand = (statusId: string) => {
  setExpandedStatusId((prev) => (prev === statusId ? null : statusId));
};
  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<StatusForm>();

  useEffect(() => {
    const hardcodedStatuses: Status[] = [
      { id: "1", name: "AI Detected", description: "Violations captured by AI." },
      { id: "2", name: "Approved", description: "Violations have checked by Supervisor." },
      { id: "3", name: "Rejected", description: "Violations have conflict to resolve." },
    ];

    const hardcodedViolations: Violation[] = [
      {
        id: "v001",
        description: "Violations captured by AI",
        images: ["/images/car_parrot_2.jpg", "/images/car_parrot_2.jpg","/images/car_parrot_2.jpg","/images/car_parrot_2.jpg","/images/car_parrot_2.jpg","/images/car_parrot_2.jpg","/images/car_parrot_2.jpg","/images/car_parrot_2.jpg","/images/car_parrot_2.jpg","/images/car_parrot_2.jpg","/images/car_parrot_2.jpg","/images/car_parrot_2.jpg","/images/car_parrot_2.jpg","/images/car_parrot_2.jpg"],
        statusId: "1",
      },
      {
        id: "v002",
        description: "Violations captured by AI",
        images: [],
        statusId: "2",
      },
      {
        id: "v003",
        description: "Violations captured by AI",
        images: ["/images/car_parrot_2.jpg"],
        statusId: "1",
      },
    ];

    setStatuses(hardcodedStatuses);
    setViolations(hardcodedViolations);
    setLoading(false);
  }, []);

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

  const onSubmit = (data: StatusForm) => {
    const { name, description } = data;
    const existingStatus = statuses.find(
      (status) => status.name.toLowerCase() === name.toLowerCase()
    );

    if (existingStatus && dialogMode === "create") {
      setSnackbar({
        open: true,
        message: "Duplicated status, please check it!",
        severity: "error",
      });
      return;
    }

    if (/[^a-zA-Z0-9\s\u00C0-\u1EF9]/.test(name)) {
      setSnackbar({
        open: true,
        message: "Status can not contains special enums",
        severity: "error",
      });
      return;
    }

    if (dialogMode === "create") {
      const newStatus: Status = {
        id: `${Date.now()}`,
        name,
        description,
      };
      setStatuses([...statuses, newStatus]);
      setSnackbar({
        open: true,
        message: "Create Status Susscessfull!",
        severity: "success",
      });
    } else if (dialogMode === "edit" && currentStatus) {
      const updatedStatuses = statuses.map((s) =>
        s.id === currentStatus.id ? { ...s, name, description } : s
      );
      setStatuses(updatedStatuses);
      setSnackbar({
        open: true,
        message: "Create Status Susscessfull!",
        severity: "success",
      });
    }

    handleCloseDialog();
  };

  const handleDelete = (statusId: string) => {
    const isLinked = violations.some((v) => v.statusId === statusId);

    if (isLinked) {
      setSnackbar({
        open: true,
        message: "Không thể xóa status này vì đang liên kết với vi phạm.",
        severity: "error",
      });
      return;
    }

    if (window.confirm("Bạn có chắc chắn muốn xóa status này? Hành động này không thể hoàn tác.")) {
      setStatuses(statuses.filter((s) => s.id !== statusId));
      setSnackbar({
        open: true,
        message: "Xóa status thành công!",
        severity: "success",
      });
    }
  };

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabIndex(newValue);
  };

  return (
  <Paper sx={{ padding: 4, margin: 3, borderRadius: 3, boxShadow: 4 }}>
    <Typography variant="h5" fontWeight="bold" gutterBottom>
      Quản lý Status
    </Typography>

    <Tabs value={tabIndex} onChange={handleTabChange} sx={{ marginBottom: 2 }}>
      <Tab label="Quản lý Status" />
      <Tab label="Vi phạm theo Status" />
    </Tabs>

    {tabIndex === 0 && (
      <>
        <Button
          variant="contained"
          color="primary"
          startIcon={<Edit />}
          onClick={() => handleOpenDialog("create")}
          sx={{ borderRadius: 2, fontWeight: "bold", textTransform: "none" }}
        >
          Tạo mới Status
        </Button>

        {loading ? (
          <CircularProgress sx={{ display: "block", margin: "20px auto" }} />
        ) : (
          <TableContainer component={Paper} sx={{ marginTop: 3, borderRadius: 3 }}>
            <Table>
              <TableHead>
                <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                  <TableCell><b>Tên Status</b></TableCell>
                  <TableCell><b>Mô tả</b></TableCell>
                  <TableCell><b>Hành động</b></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {statuses.map((status) => (
                  <TableRow key={status.id} hover>
                    <TableCell>{status.name}</TableCell>
                    <TableCell>{status.description}</TableCell>
                    <TableCell>
                      <IconButton color="primary" onClick={() => handleOpenDialog("edit", status)}>
                        <Edit />
                      </IconButton>
                      <IconButton color="error" onClick={() => handleDelete(status.id)}>
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

    {tabIndex === 1 && (
        <Box mt={3}>
        <Box
        sx={{
          display: "flex",
          flexWrap: "nowrap",        
          justifyContent: "space-evenly", 
          alignItems: "center",
          mb: 2,
          overflowX: "auto",          
          pr: 1,                      
        }}
      >
    {statuses.map((status) => {
      const relatedViolations = violations.filter((v) => v.statusId === status.id);
      const isExpanded = expandedStatusId === status.id;

      return (
        <Box key={status.id}>
          <Button
            variant={isExpanded ? "contained" : "outlined"}
            color="primary"
            onClick={() => toggleExpand(status.id)}
            sx={{
              flex:1,
              minWidth: 140,
              borderRadius: 3,
              mx: 1, 
              fontWeight: "bold",
              textTransform: "none",
              whiteSpace: "nowrap",  
            }}
          >
            {status.name} ({relatedViolations.length})
          </Button>

          {/* Chi tiết vi phạm nếu được mở */}
          {isExpanded && (
            <Box
              mt={2}
              sx={{
                backgroundColor: "#f9f9f9",
                padding: 2,
                borderRadius: 2,
                maxWidth: "100%",
              }}
            >
              {relatedViolations.length === 0 ? (
                <Typography>Không có vi phạm nào với status này.</Typography>
              ) : (
                relatedViolations.map((violation) => (
                  <Box
                    key={violation.id}
                    sx={{
                      mb: 2,
                      p: 2,
                      borderRadius: 2,
                      backgroundColor: "#fff",
                      boxShadow: 1,
                    }}
                  >
                    <Typography fontWeight="bold">
                      Mã vi phạm: {violation.id}
                    </Typography>
                    <Typography variant="body2" mb={1}>
                      Mô tả: {violation.description || "Không có mô tả"}
                    </Typography>

                    {violation.images.length > 0 && (
                      <Box
                        sx={{
                          display: "flex",
                          flexWrap: "wrap",
                          gap: 1.5,
                          justifyContent: "flex-start",
                        }}
                      >
                        {violation.images.map((img, index) => (
                          <Box
                            key={index}
                            component="img"
                            src={img}
                            alt={`violation-${violation.id}-${index}`}
                            onClick={() => handleOpenImage(img)} 
                            sx={{
                              width: { xs: "100%", sm: "48%", md: "32%", lg: "23%" },
                              height: 120,
                              objectFit: "cover",
                              borderRadius: 2,
                              boxShadow: 1,
                              cursor: "pointer", 
                              transition: "0.2s",
                              "&:hover": {
                                transform: "scale(1.02)",
                                boxShadow: 3,
                              },
                            }}
                          />
                        ))}
                      </Box>
                    )}
                  </Box>
                ))
              )}
            </Box>
          )}
        </Box>
      );
    })}
  </Box>
</Box>

    )}

      {/* Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{dialogMode === "create" ? "Tạo mới Status" : "Chỉnh sửa Status"}</DialogTitle>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogContent>
            <TextField
              label="Tên Status"
              fullWidth
              margin="normal"
              {...register("name", { required: "Tên status không được để trống" })}
              error={!!errors.name}
              helperText={errors.name?.message}
            />
            <TextField
              label="Lý do tạo / Mô tả"
              fullWidth
              margin="normal"
              multiline
              rows={3}
              {...register("description", { required: "Mô tả không được để trống" })}
              error={!!errors.description}
              helperText={errors.description?.message}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Hủy</Button>
            <Button variant="contained" type="submit">
              {dialogMode === "create" ? "Tạo mới" : "Cập nhật"}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          sx={{ width: "100%" }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

          <Dialog open={openImageDialog} onClose={handleCloseImage} maxWidth="md">
            <Box sx={{ position: "relative", p: 2 }}>
              <Box
                component="img"
                src={selectedImage || ""}
                alt="Full size"
                sx={{
                  maxWidth: "100%",
                  maxHeight: "80vh",
                  borderRadius: 2,
                  objectFit: "contain",
                }}
              />
            </Box>
            </Dialog>
    </Paper>
  );
};

export default HardCodeStatus;
