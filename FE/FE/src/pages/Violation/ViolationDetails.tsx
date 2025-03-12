import React, { useState } from "react";
import {
  Box,
  Typography,
  Button,
  TextField,
  Card,
  CardMedia,
  CardContent,
  Grid,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import SaveIcon from "@mui/icons-material/Save";
import CancelIcon from "@mui/icons-material/Cancel";

// Giả lập quyền user
const userRole = "admin"; // Đổi thành "supervisor" để test

interface ViolationDetailProps {
  violation: {
    id: number;
    location: string;
    camera_id: string
    plate_number: string;
    status: string;
    detected_at: string;
    image_url: string;
  };
}

const ViolationDetail: React.FC<ViolationDetailProps> = ({ violation }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedData, setEditedData] = useState({ ...violation });

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleSaveClick = () => {
    console.log("Saving data:", editedData);
    setIsEditing(false);
  };

  const handleCancelClick = () => {
    setEditedData({ ...violation }); // Reset về giá trị cũ
    setIsEditing(false);
  };

  const handleChange = (field: string, value: string) => {
    setEditedData({ ...editedData, [field]: value });
  };

  return (
    <Card sx={{ display: "flex", p: 2, boxShadow: 3, backgroundColor: "#fafafa", borderRadius: 3 }}>
      {/* Hình ảnh lỗi vi phạm */}
      <CardMedia
        component="img"
        sx={{ width: 150, height: 150, borderRadius: 2, border: "1px solid #ddd" }}
        image={editedData.image_url}
        alt="Violation Image"
      />

      {/* Thông tin lỗi */}
      <CardContent sx={{ flex: 1, ml: 2 }}>
        <Grid container spacing={2}>
          <Grid item xs={6}>
            <Typography variant="subtitle1" fontWeight="bold">
              Address:
            </Typography>
            {isEditing ? (
              <TextField
                fullWidth
                size="small"
                variant="outlined"
                value={editedData.location}
                onChange={(e) => handleChange("location", e.target.value)}
              />
            ) : (
              <Typography>{editedData.location}</Typography>
            )}
          </Grid>

          <Grid item xs={6}>
            <Typography variant="subtitle1" fontWeight="bold">
              License Plate:
            </Typography>
            {isEditing ? (
              <TextField
                fullWidth
                size="small"
                variant="outlined"
                value={editedData.plate_number}
                onChange={(e) => handleChange("plate_number", e.target.value)}
              />
            ) : (
              <Typography>{editedData.plate_number}</Typography>
            )}
          </Grid>

          <Grid item xs={6}>
            <Typography variant="subtitle1" fontWeight="bold">
              Status:
            </Typography>
            {isEditing ? (
              <TextField
                fullWidth
                size="small"
                variant="outlined"
                value={editedData.status}
                onChange={(e) => handleChange("status", e.target.value)}
              />
            ) : (
              <Typography sx={{ color: editedData.status === "Critical" ? "red" : "orange" }}>
                {editedData.status}
              </Typography>
            )}
          </Grid>

          <Grid item xs={6}>
            <Typography variant="subtitle1" fontWeight="bold">
              Detected_at:
            </Typography>
            {isEditing ? (
              <TextField
                fullWidth
                size="small"
                variant="outlined"
                value={editedData.detected_at}
                onChange={(e) => handleChange("detected_at", e.target.value)}
              />
            ) : (
              <Typography>{editedData.detected_at}</Typography>
            )}
          </Grid>

          <Grid item xs={12}>
            <Typography variant="subtitle1" fontWeight="bold">
              Camera:
            </Typography>
            {isEditing ? (
              <TextField
                fullWidth
                size="small"
                variant="outlined"
                multiline
                value={editedData.camera_id}
                onChange={(e) => handleChange("description", e.target.value)}
              />
            ) : (
              <Typography>{editedData.camera_id}</Typography>
            )}
          </Grid>
        </Grid>

        {/* Nút chỉnh sửa chỉ hiển thị với admin */}
        {userRole === "admin" && (
          <Box sx={{ mt: 2, display: "flex", gap: 1 }}>
            {isEditing ? (
              <>
                <Button
                  variant="contained"
                  startIcon={<SaveIcon />}
                  sx={{ backgroundColor: "#4caf50", "&:hover": { backgroundColor: "#388e3c" } }}
                  onClick={handleSaveClick}
                >
                  Save
                </Button>
                <Button
                  variant="outlined"
                  startIcon={<CancelIcon />}
                  sx={{ color: "#d32f2f", borderColor: "#d32f2f", "&:hover": { backgroundColor: "#fddede" } }}
                  onClick={handleCancelClick}
                >
                  Cancel
                </Button>
              </>
            ) : (
              <Button
                variant="contained"
                startIcon={<EditIcon />}
                sx={{ backgroundColor: "#673ab7", "&:hover": { backgroundColor: "#512da8" } }}
                onClick={handleEditClick}
              >
                Edit
              </Button>
            )}
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default ViolationDetail;
