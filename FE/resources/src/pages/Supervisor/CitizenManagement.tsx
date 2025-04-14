import React, { useState } from "react";
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper,
  Button, Dialog, DialogTitle, DialogContent, DialogActions, Typography, Box, Chip
} from "@mui/material";
import { ExpandMore, CheckCircle, Cancel } from "@mui/icons-material";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Dữ liệu giả lập API
const mockCitizens = [
  {
    citizen_id: "CIT001",
    citizen_identity_id: "ID001",
    full_name: "Nguyễn Văn A",
    phone_number: "0123456789",
    email: "nguyenvana@email.com",
    address: "Hà Nội, Việt Nam",
    identity_card: "/images/id_card_1.jpg",
    card_parrot_id: "CAR001",
    card_parrot: "/images/car_parrot_1.jpg",
    status: "submit",
  },
  {
    citizen_id: "CIT002",
    citizen_identity_id: "ID002",
    full_name: "Trần Thị B",
    phone_number: "0987654321",
    email: "tranthib@email.com",
    address: "TP. HCM, Việt Nam",
    identity_card: "/images/id_card_2.jpg",
    card_parrot_id: "CAR002",
    card_parrot: "/images/car_parrot_2.jpg",
    status: "submit",
  }
];

const statusColors = {
  submit: { label: "Chờ duyệt", color: "warning" },
  approve: { label: "Đã duyệt", color: "success" },
  reject: { label: "Từ chối", color: "error" }
};

const CitizenManagement: React.FC = () => {
  const [citizens, setCitizens] = useState(mockCitizens);
  const [selectedCitizen, setSelectedCitizen] = useState<any>(null);
  const [openDialog, setOpenDialog] = useState(false);

  // Mở dialog xem chi tiết
  const handleViewDetails = (citizen: any) => {
    setSelectedCitizen(citizen);
    setOpenDialog(true);
  };

  // Đóng dialog
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedCitizen(null);
  };

  // Hiển thị toast theo màu trạng thái
  const showToast = (message: string, type: "success" | "error") => {
    toast(message, {
      type,
      position: "top-right",
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      theme: "colored"
    });
  };

  // Cập nhật trạng thái
  const updateStatus = (status: "approve" | "reject") => {
    setCitizens(prev =>
      prev.map(c => c.citizen_id === selectedCitizen.citizen_id ? { ...c, status } : c)
    );
    showToast(
      `Đơn đăng ký của ${selectedCitizen.full_name} đã được ${status === "approve" ? "duyệt" : "từ chối"}`,
      status === "approve" ? "success" : "error"
    );
    handleCloseDialog();
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3, color: "primary.main", fontWeight: "bold" }}>
        Citizen Registration Management
      </Typography>

      {/* Table hiển thị danh sách */}
      <TableContainer component={Paper} sx={{ boxShadow: 3 }}>
        <Table>
          <TableHead sx={{ bgcolor: "grey.200" }}>
            <TableRow>
              {["Citizen ID", "Full Name", "Phone Number", "Email", "Status", "Actions"].map((header) => (
                <TableCell key={header} sx={{ fontWeight: "bold" }}>{header}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {citizens.map((citizen) => (
              <TableRow key={citizen.citizen_id} hover>
                <TableCell>{citizen.citizen_id}</TableCell>
                <TableCell>{citizen.full_name}</TableCell>
                <TableCell>{citizen.phone_number}</TableCell>
                <TableCell>{citizen.email}</TableCell>
                <TableCell>
                  <Chip
                    label={statusColors[citizen.status].label}
                    color={statusColors[citizen.status].color}
                    sx={{ fontWeight: "bold" }}
                  />
                </TableCell>
                <TableCell>
                  <Button
                    variant="contained"
                    startIcon={<ExpandMore />}
                    onClick={() => handleViewDetails(citizen)}
                  >
                    Xem chi tiết
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Dialog hiển thị chi tiết */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        {selectedCitizen && (
          <>
            <DialogTitle>
              <Typography variant="h6" fontWeight="bold">
                Chi tiết công dân: {selectedCitizen.full_name}
              </Typography>
            </DialogTitle>
            <DialogContent dividers>
              <Typography><strong>📍 Address:</strong> {selectedCitizen.address}</Typography>
              <Typography><strong>🆔 Citizen Identify:</strong> {selectedCitizen.citizen_identity_id}</Typography>
              <Typography><strong>🚗 Plate Number:</strong> {selectedCitizen.card_parrot_id}</Typography>

              <Box sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
                gap: 2, mt: 2
              }}>
                {[{
                  title: "📄 IDENTITY CARD",
                  src: selectedCitizen.identity_card
                }, {
                  title: "🚙 CARD PARROTS",
                  src: selectedCitizen.card_parrot
                }].map((item, index) => (
                  <Box key={index} sx={{ textAlign: "center" }}>
                    <Typography variant="subtitle1" fontWeight="bold">{item.title}</Typography>
                    <Box sx={{
                      overflow: "hidden",
                      borderRadius: 2,
                      boxShadow: 3,
                      "& img": {
                        width: "100%",
                        transition: "transform 0.3s ease-in-out",
                        "&:hover": { transform: "scale(1.05)" }
                      }
                    }}>
                      <img src={item.src} alt={item.title} />
                    </Box>
                  </Box>
                ))}
              </Box>
            </DialogContent>
            <DialogActions>
              <Button
                variant="contained"
                color="success"
                startIcon={<CheckCircle />}
                onClick={() => updateStatus("approve")}
              >
                Duyệt đơn
              </Button>
              <Button
                variant="contained"
                color="error"
                startIcon={<Cancel />}
                onClick={() => updateStatus("reject")}
              >
                Từ chối
              </Button>
              <Button onClick={handleCloseDialog} color="secondary">
                Đóng
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Toast Notification */}
      <ToastContainer />
    </Box>
  );
};

export default CitizenManagement;
