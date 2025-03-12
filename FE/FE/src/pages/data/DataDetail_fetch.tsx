import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Avatar,
  Chip,
  CircularProgress,
} from "@mui/material";

// Interface định nghĩa dữ liệu
interface DetectionDetail {
  vehicleId: number;
  licensePlate: string;
  violation: string;
  cameraId: string;
  imageUrl: string;
}

interface CameraInfo {
  id: string;
  name: string;
}

const DetectionDetail: React.FC = () => {
  const { deviceId } = useParams();
  const [detections, setDetections] = useState<DetectionDetail[]>([]);
  const [cameraInfo, setCameraInfo] = useState<CameraInfo | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch dữ liệu nhận diện
        const res = await axios.get("https://hanaxuan-ai-service.hf.space/result");
        const formattedData: DetectionDetail[] = res.data.device_list
          .filter((device: any) => device.camera_id.includes(deviceId || ""))
          .flatMap((device: any) =>
            device.detected_result.map((detection: any) => ({
              vehicleId: detection.vehicle_id,
              licensePlate: detection.plate_numbers,
              violation: detection.violation,
              cameraId: device.camera_id.split("/").pop(), // Lấy ID camera
              imageUrl: `data:image/jpeg;base64,${device.post_frame}`, 
            }))
          );
        setDetections(formattedData);

        // Fetch thông tin camera
        if (!deviceId) throw new Error("Invalid device ID.");

        console.log("Fetching camera info for deviceId:", deviceId);
        const cameraRes = await axios.get(`https://binhdinh.ttgt.vn/api/cameras/${deviceId}`);
        console.log("Camera Info Response:", cameraRes.data);
        
        if (!cameraRes.data || !cameraRes.data._id) {
          throw new Error("Camera not found.");
        }

        setCameraInfo({
          id: cameraRes.data._id, // Chuyển sang `_id` nếu cần
          name: cameraRes.data.name || "Unknown Camera",
        });

      } catch (err: any) {
        console.error("Error fetching data:", err);
        setError(err.message || "Failed to fetch data.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [deviceId]);

  if (loading) return <CircularProgress />;
  if (error) return <Typography color="error">{error}</Typography>;

  return (
    <Paper sx={{ padding: 3, margin: 2 }}>
      <Typography variant="h5" sx={{ mb: 2, fontWeight: "bold", color: "#007bff" }}>
        Detection Details for Camera: <b>{cameraInfo?.name || "Unknown"}</b> (ID: {cameraInfo?.id || deviceId})
      </Typography>
      <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: 3 }}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
              <TableCell align="center"><b>Vehicle ID</b></TableCell>
              <TableCell align="center"><b>License Plate</b></TableCell>
              <TableCell align="center"><b>Violation</b></TableCell>
              <TableCell align="center"><b>Camera ID</b></TableCell>
              <TableCell align="center"><b>Image</b></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {detections.map((item) => (
              <TableRow key={item.vehicleId} sx={{ "&:nth-of-type(odd)": { backgroundColor: "#fafafa" } }}>
                <TableCell align="center">{item.vehicleId}</TableCell>
                <TableCell align="center">{item.licensePlate}</TableCell>
                <TableCell align="center">
                  <Chip label={item.violation} color="error" sx={{ fontWeight: "bold" }} />
                </TableCell>
                <TableCell align="center">{cameraInfo?.name}</TableCell>
                <TableCell align="center">
                  <Avatar variant="rounded" src={item.imageUrl} sx={{ width: 100, height: 70 }} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};

export default DetectionDetail;
