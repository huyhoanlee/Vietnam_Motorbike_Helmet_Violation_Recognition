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
  Button,
} from "@mui/material";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import PhotoCameraIcon from "@mui/icons-material/PhotoCamera";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import PauseIcon from "@mui/icons-material/Pause";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import RefreshIcon from "@mui/icons-material/Refresh";

interface MJPEGStreamViewerProps {
  streamUrl: string;
  cameraName?: string;
  location?: string;
  status?: string;
}

interface StreamError {
  message: string;
  timestamp: number;
  retryCount: number;
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
  const [snackbarSeverity, setSnackbarSeverity] = useState<"success" | "error" | "info" | "warning">("success");

  // Stream handling refs
  const imgRef = useRef<HTMLImageElement>(null);
  const streamTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const errorInfoRef = useRef<StreamError | null>(null);
  const requestIdRef = useRef<number>(0);
  const lastFrameUrlRef = useRef<string | null>(null);

  // Load image with timeout and error handling
  const loadImageWithTimeout = (url: string, timeoutMs: number = 10000): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const currentRequestId = ++requestIdRef.current;
      
      console.log(`[${currentRequestId}] Loading image from: ${url}`);
      
      const timeoutId = setTimeout(() => {
        console.warn(`[${currentRequestId}] Image load timeout after ${timeoutMs}ms`);
        img.src = "";
        reject(new Error("Image loading timeout"));
      }, timeoutMs);
      
      img.onload = () => {
        console.log(`[${currentRequestId}] Image loaded successfully`);
        clearTimeout(timeoutId);
        resolve(url);
      };
      
      img.onerror = (e) => {
        console.error(`[${currentRequestId}] Image load error:`, e);
        clearTimeout(timeoutId);
        if (e instanceof Event && e.type === "error") {
          console.warn(`[${currentRequestId}] Potential CORS issue: Ensure the server allows cross-origin requests with proper headers.`);
          reject(new Error("Failed to load image, possibly due to CORS restrictions"));
        } else {
          reject(new Error("Failed to load image"));
        }
      };
      
      img.crossOrigin = "anonymous";
      img.src = `${url}?t=${Date.now()}`;
    });
  };

  // Capture current frame by storing its URL (không sử dụng canvas)
  const captureFrame = (): string | null => {
    try {
      if (imgRef.current && imgRef.current.src) {
        console.log("Capturing current frame URL:", imgRef.current.src);
        return imgRef.current.src;
      }
      console.warn("Cannot capture frame: Image not ready or imgRef is null");
      return null;
    } catch (err) {
      console.error("Error capturing frame:", err);
      return null;
    }
  };

  // Toggle pause/resume
  const togglePause = () => {
    try {
      if (!isPaused) {
        console.log("Pausing stream and capturing current frame");
        const frameSrc = captureFrame();
        if (frameSrc) {
          console.log("Frame captured successfully while pausing:", frameSrc);
          lastFrameUrlRef.current = frameSrc;
          if (imgRef.current) {
            imgRef.current.src = frameSrc;
          }
        } else {
          console.warn("Failed to capture frame while pausing");
          setSnackbarMessage("Không thể chụp frame hiện tại khi tạm dừng.");
          setSnackbarSeverity("warning");
          setShowSnackbar(true);
        }
        if (streamTimerRef.current) {
          clearTimeout(streamTimerRef.current);
          streamTimerRef.current = null;
        }
      } else {
        console.log("Resuming stream");
        setIsLoading(true);
        fetchNextFrame();
      }
      setIsPaused((prev) => !prev);
    } catch (err) {
      console.error("Error in togglePause:", err);
      setSnackbarMessage("Đã xảy ra lỗi khi tạm dừng/phát lại stream.");
      setSnackbarSeverity("error");
      setShowSnackbar(true);
    }
  };

  // Handle capturing an image
  const handleCaptureImage = () => {
    try {
      console.log("Capturing image requested");
      const capturedImageSrc = isPaused ? lastFrameUrlRef.current : captureFrame();
      if (capturedImageSrc) {
        console.log("Image captured successfully:", capturedImageSrc);
        setCapturedImage(capturedImageSrc);
        setSnackbarMessage("Đã chụp được hình ảnh vi phạm!");
        setSnackbarSeverity("success");
        setShowSnackbar(true);
      } else {
        console.error("Failed to capture image: No valid frame available");
        setSnackbarMessage("Không thể chụp hình ảnh. Vui lòng thử lại.");
        setSnackbarSeverity("error");
        setShowSnackbar(true);
      }
    } catch (err) {
      console.error("Error in handleCaptureImage:", err);
      setSnackbarMessage("Đã xảy ra lỗi khi chụp hình ảnh.");
      setSnackbarSeverity("error");
      setShowSnackbar(true);
    }
  };

  // Download captured image directly via Blob
  const downloadCapturedImage = () => {
    const imageToDownload = capturedImage || lastFrameUrlRef.current;
    
    if (!imageToDownload) {
      console.warn("No image available to download");
      setSnackbarMessage("Không có hình ảnh để tải xuống!");
      setSnackbarSeverity("warning");
      setShowSnackbar(true);
      return;
    }

    console.log("Downloading captured image:", imageToDownload);
    
    try {
      const timestamp = new Date().toISOString().replace(/:/g, "-").replace(/\..+/, "");
      const filename = `vi_pham_${cameraName.replace(/\s+/g, "_")}_${timestamp}.jpg`;
      
      fetch(imageToDownload)
        .then(response => {
          if (!response.ok) {
            console.error("Fetch response not ok:", response.status, response.statusText);
            throw new Error(`Network response was not ok: ${response.statusText}`);
          }
          return response.blob();
        })
        .then(blob => {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = filename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
          
          console.log(`Image downloaded as: ${filename}`);
          setSnackbarMessage("Đã lưu hình ảnh vi phạm thành công!");
          setSnackbarSeverity("success");
          setShowSnackbar(true);
        })
        .catch(err => {
          console.error("Error downloading image in fetch operation:", err);
          throw err;
        });
    } catch (error) {
      console.error("Error downloading image:", error);
      setSnackbarMessage("Lỗi khi tải hình ảnh. Vui lòng thử lại.");
      setSnackbarSeverity("error");
      setShowSnackbar(true);
    }
  };

  // Function to fetch the next frame
  const fetchNextFrame = async () => {
    if (isPaused || !streamUrl || status !== "active") {
      console.log("Skipping fetchNextFrame: Stream is paused, invalid URL, or status is not active");
      return;
    }

    try {
      const frameSrc = await loadImageWithTimeout(streamUrl);
      
      if (imgRef.current && !isPaused) {
        imgRef.current.src = frameSrc;
        lastFrameUrlRef.current = frameSrc;
        setError(null);
        setIsLoading(false);
        
        errorInfoRef.current = null;
        
        streamTimerRef.current = setTimeout(fetchNextFrame, 200);
      }
    } catch (err) {
      console.error("Error fetching frame:", err);
      
      if (!errorInfoRef.current) {
        errorInfoRef.current = {
          message: err instanceof Error ? err.message : String(err),
          timestamp: Date.now(),
          retryCount: 1
        };
      } else {
        errorInfoRef.current.retryCount++;
      }
      
      if (errorInfoRef.current.retryCount >= 3) {
        setError(`Không thể tải luồng video. Lỗi: ${errorInfoRef.current.message}`);
        setIsLoading(false);
        console.warn("Maximum retry attempts reached. Stream stopped.");
      } else {
        const backoffDelay = Math.min(1000 * (2 ** (errorInfoRef.current.retryCount - 1)), 5000);
        console.log(`Retrying in ${backoffDelay}ms (attempt ${errorInfoRef.current.retryCount})`);
        streamTimerRef.current = setTimeout(fetchNextFrame, backoffDelay);
      }
    }
  };

  // Handle manual refresh
  const handleRefresh = () => {
    try {
      console.log("Manual refresh requested");
      setIsLoading(true);
      setError(null);
      
      errorInfoRef.current = null;
      
      if (streamTimerRef.current) {
        clearTimeout(streamTimerRef.current);
      }
      
      fetchNextFrame();
      
      setSnackbarMessage("Đang làm mới luồng video...");
      setSnackbarSeverity("info");
      setShowSnackbar(true);
    } catch (err) {
      console.error("Error in handleRefresh:", err);
      setSnackbarMessage("Đã xảy ra lỗi khi làm mới luồng video.");
      setSnackbarSeverity("error");
      setShowSnackbar(true);
    }
  };

  // Initialize and clean up stream
  useEffect(() => {
    console.log(`Initializing stream with URL: ${streamUrl}, status: ${status}`);
    
    if (!streamUrl || status !== "active") {
      setError(status !== "active" ? "Camera hiện đang không hoạt động" : "Không có URL luồng video");
      setIsLoading(false);
      console.warn("Stream initialization skipped: Invalid stream URL or inactive status");
      return;
    }

    setIsLoading(true);
    setError(null);
    
    fetchNextFrame();

    return () => {
      console.log("Cleaning up stream resources");
      if (streamTimerRef.current) {
        clearTimeout(streamTimerRef.current);
        streamTimerRef.current = null;
      }
    };
  }, [streamUrl, status]);

  // Handle image loading status changes on pause/resume
  useEffect(() => {
    if (isPaused && imgRef.current && lastFrameUrlRef.current) {
      console.log("Updating display with last captured frame:", lastFrameUrlRef.current);
      imgRef.current.src = lastFrameUrlRef.current;
      setIsLoading(false);
    }
  }, [isPaused]);

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
                  Đang tải luồng video...
                </Typography>
              </Box>
            )}

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
                    Camera này hiện không hoạt động. Vui lòng kiểm tra trạng thái camera hoặc thử lại sau.
                  </Typography>
                )}
                <Button 
                  variant="contained" 
                  startIcon={<RefreshIcon />}
                  onClick={handleRefresh}
                  sx={{ mt: 2 }}
                >
                  Thử lại
                </Button>
              </Box>
            )}

            <img
              ref={imgRef}
              alt="Luồng Camera"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
                opacity: isLoading && !isPaused ? 0.7 : 1,
                transition: "opacity 0.3s ease",
                display: error ? "none" : "block",
              }}
              onError={(e) => {
                console.error("Image error event:", e);
              }}
              crossOrigin="anonymous"
            />

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
                  {isPaused ? "Đã dừng" : "Trực tiếp"}
                </Typography>
              </Box>
            )}

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
                <Tooltip title={isPaused ? "Tiếp tục phát" : "Tạm dừng"}>
                  <span>
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
                  </span>
                </Tooltip>

                <Tooltip title="Chụp hình ảnh vi phạm">
                  <span>
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
                  </span>
                </Tooltip>

                <Tooltip title="Tải hình ảnh về máy">
                  <span>
                    <IconButton
                      onClick={downloadCapturedImage}
                      disabled={!capturedImage && !lastFrameUrlRef.current}
                      sx={{
                        color: "#fff",
                        backgroundColor: "rgba(255, 193, 7, 0.2)",
                        "&:hover": {
                          backgroundColor: !capturedImage && !lastFrameUrlRef.current ? "rgba(255, 193, 7, 0.2)" : "rgba(255, 193, 7, 0.4)",
                        },
                        opacity: !capturedImage && !lastFrameUrlRef.current ? 0.5 : 1,
                        transition: "all 0.2s ease",
                      }}
                    >
                      <FileDownloadIcon />
                    </IconButton>
                  </span>
                </Tooltip>

                <Tooltip title="Làm mới luồng">
                  <span>
                    <IconButton
                      onClick={handleRefresh}
                      sx={{
                        color: "#fff",
                        backgroundColor: "rgba(156, 39, 176, 0.2)",
                        "&:hover": {
                          backgroundColor: "rgba(156, 39, 176, 0.4)",
                        },
                        transition: "all 0.2s ease",
                      }}
                    >
                      <RefreshIcon />
                    </IconButton>
                  </span>
                </Tooltip>
              </Box>
            )}
          </Box>
        </Box>

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
                  {status === "active" ? "Hoạt động" : "Không hoạt động"}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Box>

        {capturedImage && (
          <Box 
            sx={{ 
              position: 'absolute', 
              bottom: 80, 
              right: 16, 
              width: 180, 
              height: 120, 
              borderRadius: 1, 
              overflow: 'hidden',
              border: '2px solid #fff',
              boxShadow: 3,
              zIndex: 20,
              backgroundColor: '#000',
              '&:hover': {
                transform: 'scale(1.05)',
                transition: 'transform 0.2s ease',
              }
            }}
          >
            <img 
              src={capturedImage} 
              alt="Captured Violation" 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
              crossOrigin="anonymous"
            />
            <Box
              sx={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                right: 0,
                padding: '4px',
                backgroundColor: 'rgba(0,0,0,0.7)',
                display: 'flex',
                justifyContent: 'center',
              }}
            >
              <Typography variant="caption" sx={{ color: '#fff', fontSize: '0.7rem' }}>
                Hình ảnh đã chụp
              </Typography>
            </Box>
          </Box>
        )}
      </Paper>

      <Snackbar
        open={showSnackbar}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      > 
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbarSeverity}
          sx={{ width: "100%" }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default MJPEGStreamViewer;