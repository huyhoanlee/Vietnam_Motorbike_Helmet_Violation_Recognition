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
import axios from "axios";
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

  const fetchStatuses = async () => {
    setLoading(true);
    try {
      const response = await axios.get<Status[]>(
        "https://hanaxuan-backend.hf.space/api/violation_status/get-all"
      );
      setStatuses(response.data);
    } catch (error) {
      console.error("Failed to fetch statuses", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchViolations = async () => {
    try {
      const response = await axios.get<Violation[]>(
        "https://hanaxuan-backend.hf.space/api/violations/get-all/"
      );
      setViolations(response.data);
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
        message: "Status này đã tồn tại.",
        severity: "error",
      });
      return;
    }

    if (/[^a-zA-Z0-9\s]/.test(name)) {
      setSnackbar({
        open: true,
        message: "Tên Status không được chứa ký tự đặc biệt.",
        severity: "error",
      });
      return;
    }

    try {
      if (dialogMode === "create") {
        await axios.post(
          "https://hanaxuan-backend.hf.space/api/violation_status/create",
          { name, description }
        );
        setSnackbar({
          open: true,
          message: "Tạo mới status thành công!",
          severity: "success",
        });
      } else if (dialogMode === "edit" && currentStatus) {
        await axios.put(
          `https://hanaxuan-backend.hf.space/api/violations/change-status/${currentStatus.id}`,
          { name, description }
        );
        setSnackbar({
          open: true,
          message: "Cập nhật status thành công!",
          severity: "success",
        });
      }
      fetchStatuses();
      handleCloseDialog();
    } catch (error) {
      setSnackbar({
        open: true,
        message: "Có lỗi xảy ra. Vui lòng thử lại.",
        severity: "error",
      });
    }
  };

  const handleDelete = async (statusId: string) => {
    const isLinked = violations.some((v) => v.statusId === statusId);

    if (isLinked) {
      setSnackbar({
        open: true,
        message: "Không thể xóa status này vì đang liên kết với vi phạm.",
        severity: "error",
      });
      return;
    }

    if (
      window.confirm("Bạn có chắc chắn muốn xóa status này? Hành động này không thể hoàn tác.")
    ) {
      try {
        await axios.delete(
          `https://hanaxuan-backend.hf.space/api/violation_status/delete/${statusId}`
        );
        setSnackbar({
          open: true,
          message: "Xóa status thành công!",
          severity: "success",
        });
        fetchStatuses();
      } catch (error) {
        setSnackbar({
          open: true,
          message: "Không thể xóa status. Vui lòng thử lại.",
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
        Quản lý Status
      </Typography>
      <Tabs value={tabIndex} onChange={handleTabChange}>
        <Tab label="Quản lý Status" />
        <Tab label="Vi phạm theo Status" />
     
      </Tabs>

      {/* Tab 1: Quản lý Status */}
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
                    <TableCell>Tên Status</TableCell>
                    <TableCell>Mô tả</TableCell>
                    <TableCell>Hành động</TableCell>
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
              (v) => v.statusId === status.id
            );

            return (
              <Accordion key={status.id} sx={{ mb: 2 }}>
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Typography fontWeight="bold">
                    {status.name} ({relatedViolations.length} vi phạm)
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  {relatedViolations.length === 0 ? (
                    <Typography>Không có vi phạm nào với status này.</Typography>
                  ) : (
                    relatedViolations.map((violation) => (
                      <Paper
                        key={violation.id}
                        sx={{ p: 2, mb: 2, backgroundColor: "#fafafa" }}
                        elevation={1}
                      >
                        <Typography fontWeight="500">
                          Mã vi phạm: {violation.id}
                        </Typography>
                        <Typography variant="body2" gutterBottom>
                          Mô tả: {violation.description || "Không có mô tả"}
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
          {dialogMode === "create" ? "Tạo mới Status" : "Chỉnh sửa Status"}
        </DialogTitle>
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

 
