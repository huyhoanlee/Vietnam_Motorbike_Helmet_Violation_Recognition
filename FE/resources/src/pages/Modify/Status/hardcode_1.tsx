// import React, { useState, useEffect } from "react";
// import {
//   Box,
//   Button,
//   IconButton,
//   Tabs,
//   Tab,
//   Table,
//   TableBody,
//   TableCell,
//   TableContainer,
//   TableHead,
//   TableRow,
//   Paper,
//   Typography,
//   CircularProgress,
//   Dialog,
//   DialogTitle,
//   DialogContent,
//   DialogActions,
//   TextField,
//   Snackbar,
//   Alert,
//   Grid,
// } from "@mui/material";
// import { Edit, Delete, ExpandMore } from "@mui/icons-material";
// import { useForm } from "react-hook-form";

// interface Status {
//   id: string;
//   name: string;
//   description: string;
// }

// interface Violation {
//   id: string;
//   description: string;
//   images: string[];
//   statusId: string;
// }

// interface SnackbarState {
//   open: boolean;
//   message: string;
//   severity: "success" | "error";
// }

// interface StatusForm {
//   name: string;
//   description: string;
// }

// const HardCodeStatus: React.FC = () => {
//   const [statuses, setStatuses] = useState<Status[]>([]);
//   const [violations, setViolations] = useState<Violation[]>([]);
//   const [loading, setLoading] = useState<boolean>(true);
//   const [openDialog, setOpenDialog] = useState<boolean>(false);
//   const [dialogMode, setDialogMode] = useState<"create" | "edit">("create");
//   const [currentStatus, setCurrentStatus] = useState<Status | null>(null);
//   const [snackbar, setSnackbar] = useState<SnackbarState>({
//     open: false,
//     message: "",
//     severity: "success",
//   });
//   const [tabIndex, setTabIndex] = useState<number>(0);
//   const [expandedStatusId, setExpandedStatusId] = useState<string | null>(null);
//   const [pagination, setPagination] = useState<Record<string, number>>({});

//   const handlePageChange = (statusId: string, direction: "next" | "prev", totalPages: number) => {
//   setPagination((prev) => {
//     const currentPage = prev[statusId] || 1;
//     const newPage =
//       direction === "next"
//         ? Math.min(currentPage + 1, totalPages)
//         : Math.max(currentPage - 1, 1);
//     return { ...prev, [statusId]: newPage };
//   });
// };
//   const {
//     register,
//     handleSubmit,
//     setValue,
//     reset,
//     formState: { errors },
//   } = useForm<StatusForm>();

//   useEffect(() => {
//     const hardcodedStatuses: Status[] = [
//       { id: "1", name: "AI Detected", description: "Violations captured by AI." },
//       { id: "2", name: "Approved", description: "Violations have checked by Supervisor." },
//       { id: "3", name: "Rejected", description: "Violations have conflict to resolve." },
//     ];

//     const hardcodedViolations: Violation[] = [
//       {
//         id: "v001",
//         description: "Violations captured by AI",
//         images: ["/images/car_parrot_2.jpg", "/images/car_parrot_2.jpg"],
//         statusId: "1",
//       },
//       {
//         id: "v002",
//         description: "Violations captured by AI",
//         images: [],
//         statusId: "2",
//       },
//       {
//         id: "v003",
//         description: "Violations captured by AI",
//         images: ["/images/car_parrot_2.jpg"],
//         statusId: "1",
//       },
//     ];

//     setStatuses(hardcodedStatuses);
//     setViolations(hardcodedViolations);
//     setLoading(false);
//   }, []);

//   const handleOpenDialog = (mode: "create" | "edit", status: Status | null = null) => {
//     setDialogMode(mode);
//     setCurrentStatus(status);
//     if (status) {
//       setValue("name", status.name);
//       setValue("description", status.description);
//     } else {
//       reset();
//     }
//     setOpenDialog(true);
//   };

//   const handleCloseDialog = () => {
//     setOpenDialog(false);
//     reset();
//   };

//   const onSubmit = (data: StatusForm) => {
//     const { name, description } = data;
//     const existingStatus = statuses.find(
//       (status) => status.name.toLowerCase() === name.toLowerCase()
//     );

//     if (existingStatus && dialogMode === "create") {
//       setSnackbar({
//         open: true,
//         message: "Duplicated status, please check it!",
//         severity: "error",
//       });
//       return;
//     }

//     if (/[^a-zA-Z0-9\s\u00C0-\u1EF9]/.test(name)) {
//       setSnackbar({
//         open: true,
//         message: "Status can not contains special enums",
//         severity: "error",
//       });
//       return;
//     }

//     if (dialogMode === "create") {
//       const newStatus: Status = {
//         id: `${Date.now()}`,
//         name,
//         description,
//       };
//       setStatuses([...statuses, newStatus]);
//       setSnackbar({
//         open: true,
//         message: "Create Status Susscessfull!",
//         severity: "success",
//       });
//     } else if (dialogMode === "edit" && currentStatus) {
//       const updatedStatuses = statuses.map((s) =>
//         s.id === currentStatus.id ? { ...s, name, description } : s
//       );
//       setStatuses(updatedStatuses);
//       setSnackbar({
//         open: true,
//         message: "Create Status Susscessfull!",
//         severity: "success",
//       });
//     }

//     handleCloseDialog();
//   };

//   const handleDelete = (statusId: string) => {
//     const isLinked = violations.some((v) => v.statusId === statusId);

//     if (isLinked) {
//       setSnackbar({
//         open: true,
//         message: "Không thể xóa status này vì đang liên kết với vi phạm.",
//         severity: "error",
//       });
//       return;
//     }

//     if (window.confirm("Bạn có chắc chắn muốn xóa status này? Hành động này không thể hoàn tác.")) {
//       setStatuses(statuses.filter((s) => s.id !== statusId));
//       setSnackbar({
//         open: true,
//         message: "Xóa status thành công!",
//         severity: "success",
//       });
//     }
//   };

//   const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
//     setTabIndex(newValue);
//   };

//   return (
//   <Paper sx={{ padding: 4, margin: 3, borderRadius: 3, boxShadow: 4 }}>
//     <Typography variant="h5" fontWeight="bold" gutterBottom>
//       Quản lý Status
//     </Typography>

//     <Tabs value={tabIndex} onChange={handleTabChange} sx={{ marginBottom: 2 }}>
//       <Tab label="Quản lý Status" />
//       <Tab label="Vi phạm theo Status" />
//     </Tabs>

//     {tabIndex === 0 && (
//       <>
//         <Button
//           variant="contained"
//           color="primary"
//           startIcon={<Edit />}
//           onClick={() => handleOpenDialog("create")}
//           sx={{ borderRadius: 2, fontWeight: "bold", textTransform: "none" }}
//         >
//           Tạo mới Status
//         </Button>

//         {loading ? (
//           <CircularProgress sx={{ display: "block", margin: "20px auto" }} />
//         ) : (
//           <TableContainer component={Paper} sx={{ marginTop: 3, borderRadius: 3 }}>
//             <Table>
//               <TableHead>
//                 <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
//                   <TableCell><b>Tên Status</b></TableCell>
//                   <TableCell><b>Mô tả</b></TableCell>
//                   <TableCell><b>Hành động</b></TableCell>
//                 </TableRow>
//               </TableHead>
//               <TableBody>
//                 {statuses.map((status) => (
//                   <TableRow key={status.id} hover>
//                     <TableCell>{status.name}</TableCell>
//                     <TableCell>{status.description}</TableCell>
//                     <TableCell>
//                       <IconButton color="primary" onClick={() => handleOpenDialog("edit", status)}>
//                         <Edit />
//                       </IconButton>
//                       <IconButton color="error" onClick={() => handleDelete(status.id)}>
//                         <Delete />
//                       </IconButton>
//                     </TableCell>
//                   </TableRow>
//                 ))}
//               </TableBody>
//             </Table>
//           </TableContainer>
//         )}
//       </>
//     )}

//       {tabIndex === 1 && (
//     <Box mt={3}>
//       <Grid container spacing={2}>
//         {statuses.map((status) => {
//           const relatedViolations = violations.filter((v) => v.statusId === status.id);
//           const previewImages = relatedViolations
//             .flatMap((v) => v.images)
//             .filter(Boolean)
//             .slice(0, 4); // lấy 4 ảnh đại diện đầu

//           const isExpanded = expandedStatusId === status.id;

//           return (
//             <Grid item xs={12} sm={6} md={4} key={status.id}>
//               <Paper
//                 elevation={3}
//                 sx={{
//                   p: 2,
//                   borderRadius: 2,
//                   cursor: "pointer",
//                   transition: "0.3s",
//                   '&:hover': { boxShadow: 6, backgroundColor: "#f9f9f9" },
//                 }}
//                 onClick={() =>
//                   setExpandedStatusId(isExpanded ? null : status.id)
//                 }
//               >
//                 <Typography fontWeight="bold" gutterBottom>
//                   {status.name} ({relatedViolations.length} vi phạm)
//                 </Typography>

//                 <Box
//                   display="flex"
//                   gap={1}
//                   flexWrap="wrap"
//                   justifyContent="flex-start"
//                 >
//                   {previewImages.length > 0 ? (
//                     previewImages.map((img, idx) => (
//                       <Box
//                         key={idx}
//                         sx={{
//                           width: 60,
//                           height: 60,
//                           backgroundImage: `url(${img})`,
//                           backgroundSize: "cover",
//                           backgroundPosition: "center",
//                           borderRadius: 1,
//                           border: "1px solid #ccc",
//                         }}
//                       />
//                     ))
//                   ) : (
//                     <Typography variant="body2" color="text.secondary">
//                       Không có ảnh
//                     </Typography>
//                   )}
//                 </Box>

// {isExpanded && (
//   <Box mt={2}>
//     {relatedViolations.map((violation) => {
//       const currentPage = pagination[status.id] || 1;
//       const imagesPerPage = 4;
//       const totalImages = violation.images.length;
//       const totalPages = Math.ceil(totalImages / imagesPerPage);
//       const startIdx = (currentPage - 1) * imagesPerPage;
//       const endIdx = startIdx + imagesPerPage;
//       const paginatedImages = violation.images.slice(startIdx, endIdx);

//       return (
//         <Box key={violation.id} mb={2}>
//           <Typography fontWeight="500" gutterBottom>
//             Mã vi phạm: {violation.id}
//           </Typography>
//           <Box display="flex" gap={1} flexWrap="wrap">
//             {paginatedImages.length > 0 ? (
//               paginatedImages.map((img, i) => (
//                 <Box
//                   key={i}
//                   sx={{
//                     width: 100,
//                     height: 100,
//                     backgroundImage: `url(${img})`,
//                     backgroundSize: "cover",
//                     backgroundPosition: "center",
//                     borderRadius: 1,
//                     border: "1px solid #ddd",
//                   }}
//                 />
//               ))
//             ) : (
//               <Typography variant="body2" color="text.secondary">
//                 Không có ảnh
//               </Typography>
//             )}
//           </Box>

//           {/* Pagination Buttons */}
//           {totalPages > 1 && (
//             <Box mt={1} display="flex" gap={1}>
//               <Button
//                 size="small"
//                 onClick={(e) => {
//                   e.stopPropagation();
//                   handlePageChange(status.id, "prev", totalPages);
//                 }}
//                 disabled={currentPage === 1}
//               >
//                 Trước
//               </Button>
//               <Typography variant="body2" alignSelf="center">
//                 Trang {currentPage}/{totalPages}
//               </Typography>
//               <Button
//                 size="small"
//                 onClick={(e) => {
//                   e.stopPropagation();
//                   handlePageChange(status.id, "next", totalPages);
//                 }}
//                 disabled={currentPage === totalPages}
//               >
//                 Sau
//               </Button>
//             </Box>
//           )}
//         </Box>
//       );
//     })}
//   </Box>
// )}
//               </Paper>
//             </Grid>
//           );
//         })}
//       </Grid>
//     </Box>
//       )}

//       {/* Dialog */}
//       <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
//         <DialogTitle>{dialogMode === "create" ? "Tạo mới Status" : "Chỉnh sửa Status"}</DialogTitle>
//         <form onSubmit={handleSubmit(onSubmit)}>
//           <DialogContent>
//             <TextField
//               label="Tên Status"
//               fullWidth
//               margin="normal"
//               {...register("name", { required: "Tên status không được để trống" })}
//               error={!!errors.name}
//               helperText={errors.name?.message}
//             />
//             <TextField
//               label="Lý do tạo / Mô tả"
//               fullWidth
//               margin="normal"
//               multiline
//               rows={3}
//               {...register("description", { required: "Mô tả không được để trống" })}
//               error={!!errors.description}
//               helperText={errors.description?.message}
//             />
//           </DialogContent>
//           <DialogActions>
//             <Button onClick={handleCloseDialog}>Hủy</Button>
//             <Button variant="contained" type="submit">
//               {dialogMode === "create" ? "Tạo mới" : "Cập nhật"}
//             </Button>
//           </DialogActions>
//         </form>
//       </Dialog>

//       {/* Snackbar */}
//       <Snackbar
//         open={snackbar.open}
//         autoHideDuration={4000}
//         onClose={() => setSnackbar({ ...snackbar, open: false })}
//         anchorOrigin={{ vertical: "top", horizontal: "center" }}
//       >
//         <Alert
//           severity={snackbar.severity}
//           onClose={() => setSnackbar({ ...snackbar, open: false })}
//           sx={{ width: "100%" }}
//         >
//           {snackbar.message}
//         </Alert>
//       </Snackbar>
//     </Paper>
//   );
// };

// export default HardCodeStatus;
