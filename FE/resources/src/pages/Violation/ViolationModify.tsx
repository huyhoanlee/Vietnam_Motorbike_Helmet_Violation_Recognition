// import React, { useEffect, useState } from "react";
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableContainer,
//   TableHead,
//   TableRow,
//   Paper,
//   Checkbox,
//   IconButton,
//   Typography,
//   Box,
//   Button,
//   Collapse,
//   CircularProgress,
//   Snackbar,
//   Alert,
//   Dialog,
//   DialogActions,
//   DialogContent,
//   DialogContentText,
//   DialogTitle,
// } from "@mui/material";
// import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
// import { format } from "date-fns";
// import ViolationDetail from "./ViolationDetails";
// interface Violation {
//   id: number;
//   location: string;
//   camera_id: string;
//   plate_number: string;
//   status: string;
//   detected_at: string;
//   image_url: string;
//   notified?: boolean;
// }

// // Mock Data
// const mockViolations = [
//   {
//     id: 1,
//     location: "Street 1",
//     camera_id: "Camera 1",
//     plate_number: "ABC123",
//     status: "Critical",
//     detected_at: "2025-04-07T12:30:00Z",
//     image_url: "https://via.placeholder.com/150",
//     notified: false,
//   },
//   {
//     id: 2,
//     location: "Street 2",
//     camera_id: "Camera 2",
//     plate_number: "XYZ456",
//     status: "Warning",
//     detected_at: "2025-04-06T15:45:00Z",
//     image_url: "https://via.placeholder.com/150",
//     notified: true,
//   },
// ];

// const mockCitizens = [
//   {
//     plate_number: "ABC123",
//     email: "citizen1@example.com",
//   },
//   {
//     plate_number: "XYZ456",
//     email: "citizen2@example.com",
//   },
// ];

// const Violation: React.FC = () => {
//   const [violations, setViolations] = useState(mockViolations);
//   const [loading, setLoading] = useState(false);
//   const [expandedRow, setExpandedRow] = useState<number | null>(null);
//   const [error, setError] = useState<string | null>(null);
//   const [openSnackbar, setOpenSnackbar] = useState(false);
//   const [selectedViolations, setSelectedViolations] = useState<number[]>([]);
//   const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
//   const [actionType, setActionType] = useState<"notifyAll" | "notifySelected">("notifyAll");

//   const toggleRow = (id: number) => {
//     setExpandedRow(expandedRow === id ? null : id);
//   };

//   const handleSelectViolation = (id: number) => {
//     setSelectedViolations((prevSelected) =>
//       prevSelected.includes(id)
//         ? prevSelected.filter((violationId) => violationId !== id)
//         : [...prevSelected, id]
//     );
//   };

//   const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
//     if (event.target.checked) {
//       const allViolationIds = violations.map((v) => v.id);
//       setSelectedViolations(allViolationIds);
//     } else {
//       setSelectedViolations([]);
//     }
//   };

//   const handleNotifyAll = () => {
//     setActionType("notifyAll");
//     setConfirmDialogOpen(true);
//   };

//   const handleNotifySelected = () => {
//     setActionType("notifySelected");
//     setConfirmDialogOpen(true);
//   };

//   const handleConfirmAction = async () => {
//     setConfirmDialogOpen(false);
//     try {
//       let violationsToNotify: Violation[] = [];

//       if (actionType === "notifyAll") {
//         violationsToNotify = violations;
//       } else if (actionType === "notifySelected") {
//         violationsToNotify = violations.filter((violation) =>
//           selectedViolations.includes(violation.id)
//         );
//       }

//       for (let violation of violationsToNotify) {
//         const citizen = mockCitizens.find(
//           (citizen) => citizen.plate_number === violation.plate_number
//         );

//         if (!citizen || !citizen.email) {
//           setError(`No email registered for citizen with plate number ${violation.plate_number}`);
//           setOpenSnackbar(true);
//           continue;
//         }

//         // Update violation as notified
//         setViolations((prevViolations) =>
//           prevViolations.map((v) =>
//             v.id === violation.id ? { ...v, notified: true } : v
//           )
//         );
//         console.log(`Notification sent for violation ID: ${violation.id}`);
//       }

//       setOpenSnackbar(true);
//     } catch (err) {
//       setError("Failed to send notifications.");
//       setOpenSnackbar(true);
//     }
//   };

//   return (
//     <Box sx={{ padding: 4 }}>
//       <Typography variant="h4" sx={{ fontWeight: "bold", mb: 2 }}>
//         Violation Management
//       </Typography>

//       {loading ? (
//         <CircularProgress />
//       ) : error ? (
//         <Typography color="error">{error}</Typography>
//       ) : (
//         <>
//           <Typography variant="subtitle1" sx={{ mb: 2, color: "#666" }}>
//             {violations.length} Violations Detected By AI
//           </Typography>

//             {selectedViolations.length > 0 && (
//                         <Button
//                           variant="contained"
//                           color="primary"
//                           sx={{ mt: 2, borderRadius: "20px" }}
//                           onClick={handleNotifySelected}
//                         >
//                           Notify Selected Violations
//                         </Button>
//                       )}
            
//           <Button
//             variant="outlined"
//             onClick={handleNotifyAll}
//             sx={{
//               borderRadius: "20px",
//               float: "right",
//               borderColor: "#555",
//               color: "#555",
//               "&:hover": { backgroundColor: "#eee" },
//             }}
//           >
//             Notify All Violations
//           </Button>

//           <TableContainer component={Paper} sx={{ borderRadius: "10px", mt: 4 }}>
//             <Table>
//               <TableHead sx={{ backgroundColor: "#f0e6ff" }}>
//                 <TableRow>
//                   <TableCell padding="checkbox">
//                     <Checkbox
//                       indeterminate={
//                         selectedViolations.length > 0 &&
//                         selectedViolations.length < violations.length
//                       }
//                       checked={
//                         violations.length > 0 &&
//                         selectedViolations.length === violations.length
//                       }
//                       onChange={handleSelectAll}
//                     />
//                   </TableCell>
//                   <TableCell>ID</TableCell>
//                   <TableCell>Detection Address</TableCell>
//                   <TableCell>License Plate</TableCell>
//                   <TableCell>Status</TableCell>
//                   <TableCell>Date</TableCell>
//                   <TableCell align="center">Actions</TableCell>
//                 </TableRow>
//               </TableHead>
//               <TableBody>
//                 {violations.map((violation) => (
//                   <React.Fragment key={violation.id}>
//                     <TableRow
//                       sx={{
//                         backgroundColor: violation.notified ? "#d1ffd6" : "transparent", 
//                         "&:hover": { backgroundColor: "#f9f9f9" },
//                         transition: "0.3s",
//                       }}
//                     >
//                       <TableCell padding="checkbox">
//                         <Checkbox
//                           checked={selectedViolations.includes(violation.id)}
//                           onChange={() => handleSelectViolation(violation.id)}
//                         />
//                       </TableCell>
//                       <TableCell>{violation.id}</TableCell>
//                       <TableCell>{violation.location}</TableCell>
//                       <TableCell>{violation.plate_number}</TableCell>
//                       <TableCell
//                         sx={{
//                           color: violation.status === "Critical" ? "red" : "orange",
//                         }}
//                       >
//                         {violation.status}
//                       </TableCell>
//                       <TableCell>{format(new Date(violation.detected_at), "dd/MM/yyyy")}</TableCell>
//                       <TableCell align="center">
//                         <IconButton onClick={() => toggleRow(violation.id)}>
//                           <ExpandMoreIcon
//                             sx={{
//                               transform:
//                                 expandedRow === violation.id
//                                   ? "rotate(180deg)"
//                                   : "rotate(0deg)",
//                               transition: "0.3s",
//                             }}
//                           />
//                         </IconButton>
//                       </TableCell>
//                     </TableRow>

//                     {/* Row Detail */}
//                     <TableRow>
//                       <TableCell colSpan={7} sx={{ paddingBottom: 0, paddingTop: 0 }}>
//                         <Collapse in={expandedRow === violation.id} timeout="auto" unmountOnExit>
//                           <ViolationDetail violation={violation} />
//                         </Collapse>
//                       </TableCell>
//                     </TableRow>
//                   </React.Fragment>
//                 ))}
//               </TableBody>
//             </Table>
//           </TableContainer>

//           {/* {selectedViolations.length > 0 && (
//             <Button
//               variant="contained"
//               color="secondary"
//               sx={{ mt: 2, borderRadius: "20px" }}
//               onClick={handleNotifySelected}
//             >
//               Notify Selected Violations
//             </Button>
//           )} */}

//           <Snackbar
//             open={openSnackbar}
//             autoHideDuration={3000}
//             onClose={() => setOpenSnackbar(false)}
//           >
//             <Alert severity="error">{error}</Alert>
//           </Snackbar>
//         </>
//       )}

//       {/* Confirm Dialog */}
//       <Dialog open={confirmDialogOpen} onClose={() => setConfirmDialogOpen(false)}>
//         <DialogTitle>Confirm Action</DialogTitle>
//         <DialogContent>
//           <DialogContentText>
//             {actionType === "notifyAll"
//               ? "Are you sure you want to send notifications to all citizens?"
//               : `Are you sure you want to notify ${selectedViolations.length} selected violation(s)?`}
//           </DialogContentText>
//         </DialogContent>
//         <DialogActions>
//           <Button onClick={() => setConfirmDialogOpen(false)}>Cancel</Button>
//           <Button onClick={handleConfirmAction} color="primary">
//             Confirm
//           </Button>
//         </DialogActions>
//       </Dialog>
//     </Box>
//   );
// };

// export default Violation;
