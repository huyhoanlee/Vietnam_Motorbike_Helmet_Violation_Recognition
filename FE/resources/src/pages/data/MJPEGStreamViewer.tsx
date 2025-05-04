import React, { useEffect, useState, useRef } from "react";
import {
  Box,
  Typography,
  CircularProgress,
  Snackbar,
  Alert,
  Paper,
  Grid,
  IconButton,
  Tooltip,
} from "@mui/material";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import PauseIcon from "@mui/icons-material/Pause";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";

interface MJPEGStreamViewerProps {
  streamUrl: string;
  cameraName?: string;
  location?: string;
  status?: string;
}

const MJPEGStreamViewer: React.FC<MJPEGStreamViewerProps> = ({
  streamUrl,
  cameraName = "Camera",
  location = "Unknown Location",
  status = "active",
}) => {
  const [isPaused, setIsPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [showSnackbar, setShowSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const lastFrameRef = useRef<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Function to capture the current frame
  const captureFrame = () => {
    const img = imgRef.current;
    if (!img || !img.complete || img.naturalWidth === 0) {
      console.warn("Cannot capture frame: Image not ready");
      return null;
    }

    if (!canvasRef.current) {
      canvasRef.current = document.createElement("canvas");
    }

    const canvas = canvasRef.current;
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;

    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.drawImage(img, 0, 0);
      try {
        const imageDataUrl = canvas.toDataURL("image/jpeg", 0.9); // Use JPEG with 90% quality
        lastFrameRef.current = imageDataUrl;
        return imageDataUrl;
      } catch (e) {
        console.error("Error capturing frame:", e);
        return null;
      }
    }
    return null;
  };

  // Toggle pause/resume
  const togglePause = () => {
    if (!isPaused) {
      // About to pause: capture the current frame
      const frame = captureFrame();
      if (frame) {
        lastFrameRef.current = frame;
      }
      // Stop fetching new frames
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    } else {
      // Resuming: restart the stream
      setIsLoading(true);
    }
    setIsPaused((prev) => !prev);
  };

  // Handle capturing an image
  const handleCaptureImage = () => {
    const capturedImageData = captureFrame();
    if (capturedImageData) {
      setCapturedImage(capturedImageData);
      setSnackbarMessage("Image captured successfully!");
      setShowSnackbar(true);
    } else {
      setSnackbarMessage("Failed to capture image. Please try again.");
      setShowSnackbar(true);
    }
  };

  // Download captured image
  const downloadCapturedImage = () => {
    if (!capturedImage) return;

    const link = document.createElement("a");
    link.href = capturedImage;
    link.download = `${cameraName.replace(/\s+/g, "_")}_${new Date().toISOString().replace(/:/g, "-")}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setSnackbarMessage("Image downloaded successfully!");
    setShowSnackbar(true);
  };

  useEffect(() => {
    if (!streamUrl || status !== "active") {
      setError(status !== "active" ? "Camera is currently inactive" : "No stream URL provided");
      setIsLoading(false);
      return;
    }

    const img = imgRef.current;
    if (!img) return;

    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (!isPaused) {
      setIsLoading(true);

      const handleLoad = () => {
        setIsLoading(false);
        setError(null);
        // Capture the frame immediately after loading
        captureFrame();
      };

      const handleError = () => {
        setIsLoading(false);
        setError("Failed to load stream. Please check the connection or try again.");
      };

      img.onload = handleLoad;
      img.onerror = handleError;

      // Load initial image
      img.src = `${streamUrl}?t=${Date.now()}`;

      // Set up interval for continuous updates (aligned with Python's frame-by-frame approach)
      intervalRef.current = setInterval(() => {
        if (!isPaused && img) {
          img.src = `${streamUrl}?t=${Date.now()}`;
        }
      }, 250); // Adjusted to 250ms for smoother performance
    } else if (lastFrameRef.current) {
      // Paused: display the last captured frame
      img.onload = null;
      img.onerror = null;
      img.src = lastFrameRef.current;
      setIsLoading(false);
    }

    return () => {
      // Cleanup
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      if (img) {
        img.onload = null;
        img.onerror = null;
      }
    };
  }, [streamUrl, isPaused, status]);

  const handleCloseSnackbar = () => {
    setShowSnackbar(false);
  };

  return (
    <Box sx={{ width: "100%", height: "100%" }}>
      <Paper
        elevation={3}
        sx={{
          borderRadius: 2,
          overflow: "hidden",
          backgroundColor: "#f8f9fa",
          height: "100%",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <Box sx={{ position: "relative", width: "100%", flexGrow: 1, minHeight: 0 }}>
          {/* Stream container */}
          <Box
            sx={{
              position: "relative",
              width: "100%",
              height: "100%",
              backgroundColor: "#000",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              overflow: "hidden",
            }}
          >
            {/* Loading indicator */}
            {isLoading && !error && (
              <Box
                sx={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  zIndex: 2,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 2,
                }}
              >
                <CircularProgress sx={{ color: "#fff" }} />
                <Typography variant="body2" sx={{ color: "#fff" }}>
                  Loading stream...
                </Typography>
              </Box>
            )}

            {/* Error display */}
            {error && (
              <Box
                sx={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  zIndex: 2,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 2,
                  p: 3,
                  textAlign: "center",
                }}
              >
                <ErrorOutlineIcon sx={{ fontSize: 60, color: "#f44336" }} />
                <Typography variant="h6" sx={{ color: "#fff" }}>
                  {error}
                </Typography>
                {status !== "active" && (
                  <Typography variant="body2" sx={{ color: "#bbb", maxWidth: "80%" }}>
                    This camera is currently inactive. Please check the camera status or try again later.
                  </Typography>
                )}
              </Box>
            )}

            {/* Stream image */}
            <img
              ref={imgRef}
              alt="MJPEG Stream"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
                opacity: isLoading && !isPaused ? 0.7 : 1,
                transition: "opacity 0.3s ease",
                display: error ? "none" : "block",
              }}
            />

            {/* Status indicator */}
            {!error && (
              <Box
                sx={{
                  position: "absolute",
                  top: 16,
                  right: 16,
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                  background: "rgba(0,0,0,0.6)",
                  padding: "6px 12px",
                  borderRadius: 6,
                  color: "#fff",
                  zIndex: 10,
                  backdropFilter: "blur(4px)",
                }}
              >
                <FiberManualRecordIcon
                  sx={{
                    color: isPaused ? "gray" : "#f44336",
                    animation: isPaused ? "none" : "pulse 1.5s infinite ease-in-out",
                    "@keyframes pulse": {
                      "0%": { opacity: 1 },
                      "50%": { opacity: 0.5 },
                      "100%": { opacity: 1 },
                    },
                  }}
                />
                <Typography variant="body2" fontWeight="medium">
                  {isPaused ? "Paused" : "Live"}
                </Typography>
              </Box>
            )}

            {/* Control buttons */}
            {!error && (
              <Box
                sx={{
                  position: "absolute",
                  bottom: 16,
                  left: "50%",
                  transform: "translateX(-50%)",
                  display: "flex",
                  gap: 2,
                  background: "rgba(0,0,0,0.6)",
                  padding: "8px 16px",
                  borderRadius: 8,
                  backdropFilter: "blur(4px)",
                  zIndex: 10,
                }}
              >
                <Tooltip title={isPaused ? "Resume stream" : "Pause stream"}>
                  <IconButton
                    onClick={togglePause}
                    sx={{
                      color: "#fff",
                      backgroundColor: isPaused ? "rgba(76, 175, 80, 0.2)" : "rgba(244, 67, 54, 0.2)",
                      "&:hover": {
                        backgroundColor: isPaused ? "rgba(76, 175, 80, 0.4)" : "rgba(244, 67, 54, 0.4)",
                      },
                      transition: "all 0.2s ease",
                    }}
                  >
                    {isPaused ? <PlayArrowIcon /> : <PauseIcon />}
                  </IconButton>
                </Tooltip>

                <Tooltip title="Capture image">
                  <IconButton
                    onClick={handleCaptureImage}
                    sx={{
                      color: "#fff",
                      backgroundColor: "rgba(33, 150, 243, 0.2)",
                      "&:hover": {
                        backgroundColor: "rgba(33, 150, 243, 0.4)",
                      },
                      transition: "all 0.2s ease",
                    }}
                  >
                    <PhotoCameraIcon />
                  </IconButton>
                </Tooltip>

                {capturedImage && (
                  <Tooltip title="Download captured image">
                    <IconButton
                      onClick={downloadCapturedImage}
                      sx={{
                        color: "#fff",
                        backgroundColor: "rgba(255, 193, 7, 0.2)",
                        "&:hover": {
                          backgroundColor: "rgba(255, 193, 7, 0.4)",
                        },
                        transition: "all 0.2s ease",
                      }}
                    >
                      <FileDownloadIcon />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
            )}
          </Box>
        </Box>

        {/* Info panel */}
        <Box sx={{ p: 2, backgroundColor: "#fff" }}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                {cameraName}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {location}
              </Typography>
            </Grid>
            <Grid
              item
              xs={12}
              md={6}
              sx={{ display: "flex", justifyContent: { xs: "flex-start", md: "flex-end" }, alignItems: "center" }}
            >
              <Box
                sx={{
                  display: "inline-flex",
                  alignItems: "center",
                  px: 1.5,
                  py: 0.5,
                  borderRadius: 4,
                  backgroundColor: status === "active" ? "rgba(76, 175, 80, 0.1)" : "rgba(244, 67, 54, 0.1)",
                  color: status === "active" ? "success.main" : "error.main",
                  border: 1,
                  borderColor: status === "active" ? "success.light" : "error.light",
                }}
              >
                <FiberManualRecordIcon sx={{ fontSize: 12, mr: 0.5 }} />
                <Typography variant="caption" fontWeight="medium">
                  {status === "active" ? "Active" : "Inactive"}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Paper>

      {/* Notification */}
      <Snackbar
        open={showSnackbar}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbarMessage.includes("Failed") ? "error" : "success"}
          sx={{ width: "100%" }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default MJPEGStreamViewer;