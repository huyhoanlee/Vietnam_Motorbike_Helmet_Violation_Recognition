// import React, { useEffect, useState } from "react";
// import { useParams } from "react-router-dom";
// import axios from "axios";
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableContainer,
//   TableHead,
//   TableRow,
//   Paper,
//   Typography,
//   Avatar,
//   Chip,
// } from "@mui/material";
// interface DetectionDetail {
//   id: string;
//   licensePlate: string;
//   vehicleType: string;
//   dateTime: string;
//   location: string;
//   cameraId: string;
//   imageUrl: string;
//   status: string;
//   processedBy: string;
// }
// const mockViolations: DetectionDetail[] = [
//   {
//     id: "1",
//     licensePlate: "ABC-1234",
//     vehicleType: "Motobike",
//     dateTime: "2024-02-15 14:30",
//     location: "Highway A1",
//     cameraId: "1",
//     imageUrl: "/images/speeding1.jpg",
//     status: "Unprocessed",
//     processedBy: "Officer A",
//   },
//   {
//     id: "2",
//     licensePlate: "XYZ-5678",
//     vehicleType: "Motobike",
//     dateTime: "2024-02-14 10:15",
//     location: "Downtown B2",
//     cameraId: "2",
//     imageUrl: "/images/redlight1.jpg",
//     status: "Processed",
//     processedBy: "Officer B",
//   },
// ];
// const DetectionDetail: React.FC = () => {
//   const { deviceId } = useParams();
//   // const [detections, setDetections] = useState<DetectionDetail[]>([]);

//   // useEffect(() => {
//   //   axios.get(`/api/detections?cameraId=${cameraId}`)
//   //     .then((res) => setDetections(res.data))
//   //     .catch((err) => console.error(err));
//   // }, [cameraId]);
//     const [detections] = useState<DetectionDetail[]>(
//     mockViolations.filter((v) => v.id === deviceId)
//   );

//    return (
//     <Paper sx={{ padding: 3, margin: 2 }}>
//       <Typography variant="h5" sx={{ mb: 2, fontWeight: "bold", color: "#007bff" }}>
//         Detection Details for Camera {deviceId}
//       </Typography>
//       <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 3 }}>
//         <Table>
//           <TableHead>
//             <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
//               <TableCell align="center"><b>Violation ID</b></TableCell>
//               <TableCell align="center"><b>License Plate</b></TableCell>
//               <TableCell align="center"><b>Vehicle Type</b></TableCell>
//               <TableCell align="center"><b>Date & Time</b></TableCell>
//               <TableCell align="center"><b>Location</b></TableCell>
//               <TableCell align="center"><b>Image</b></TableCell>
//               <TableCell align="center"><b>Status</b></TableCell>
//               <TableCell align="center"><b>Processed By</b></TableCell>
//             </TableRow>
//           </TableHead>
//           <TableBody>
//             {detections.map((item) => (
//               <TableRow key={item.id} sx={{ "&:nth-of-type(odd)": { backgroundColor: "#fafafa" } }}>
//                 <TableCell align="center">{item.id}</TableCell>
//                 <TableCell align="center">{item.licensePlate}</TableCell>
//                 <TableCell align="center">{item.vehicleType}</TableCell>
//                 <TableCell align="center">{item.dateTime}</TableCell>
//                 <TableCell align="center">{item.location}</TableCell>
//                 <TableCell align="center">
//                   <Avatar variant="rounded" src={item.imageUrl} sx={{ width: 80, height: 60 }} />
//                 </TableCell>
//                 <TableCell align="center">
//                   <Chip
//                     label={item.status}
//                     color={
//                       item.status === "Processed"
//                         ? "success"
//                         : item.status === "Unprocessed"
//                         ? "warning"
//                         : "default"
//                     }
//                     sx={{ fontWeight: "bold" }}
//                   />
//                 </TableCell>
//                 <TableCell align="center">{item.processedBy}</TableCell>
//               </TableRow>
//             ))}
//           </TableBody>
//         </Table>
//       </TableContainer>
//     </Paper>
//   );
// };


// export default DetectionDetail;
