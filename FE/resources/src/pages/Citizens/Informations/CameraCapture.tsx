import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
  Paper,
  CircularProgress,
} from "@mui/material";
import { useState, useRef, useEffect } from "react";
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import CameraIcon from '@mui/icons-material/Camera';
import FlipCameraIosIcon from '@mui/icons-material/FlipCameraIos';
import ReplayIcon from '@mui/icons-material/Replay';

interface CameraCaptureProps {
  onImageCapture: (base64Image: string) => void;
  disabled?: boolean;
}

const CameraCapture = ({ onImageCapture, disabled = false }: CameraCaptureProps) => {
  const [openCamera, setOpenCamera] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [facingMode, setFacingMode] = useState<"user" | "environment">("user");
  const [loading, setLoading] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Make sure video ref is ready before accessing
  const [videoElementMounted, setVideoElementMounted] = useState(false);

  // Start camera when dialog opens
  useEffect(() => {
    if (openCamera && !capturedImage && videoElementMounted) {
      console.log("Dialog is open and video element is mounted, starting camera");
      startCamera();
    }
    
    // Cleanup when component unmounts
    return () => {
      stopCamera();
    };
  }, [openCamera, facingMode, videoElementMounted]);

  const startCamera = async () => {
    try {
      setLoading(true);
      setCameraError(null);
      
      if (streamRef.current) {
        stopCamera();
      }

      const constraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      };

      console.log("Requesting camera access with constraints:", constraints);
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log("Camera access granted, stream obtained:", stream);
      
      // Store stream reference immediately
      streamRef.current = stream;
      
      // Use a small delay to ensure DOM is ready before accessing videoRef
      setTimeout(() => {
        if (videoRef.current) {
          console.log("Video ref found, attaching stream");
          videoRef.current.srcObject = stream;
          
          // Add event listeners to ensure video starts playing
          videoRef.current.onloadedmetadata = () => {
            console.log("Video metadata loaded");
            if (videoRef.current) {
              videoRef.current.play()
                .then(() => {
                  console.log("Video playing successfully");
                  setIsCameraActive(true);
                })
                .catch(err => {
                  console.error("Error playing video:", err);
                  setCameraError(`Error playing video: ${err.message}`);
                });
            }
          };
          
          videoRef.current.onerror = (event) => {
            console.error("Video element error:", event);
            setCameraError("Video element encountered an error");
          };
        } else {
          console.error("Video ref is still null after delay");
          setCameraError("Video element not available. Try closing and reopening the camera.");
        }
      }, 100); // Small delay to ensure ref is available
    } catch (error: any) {
      console.error("Error accessing camera:", error);
      setCameraError(`Cannot access camera: ${error.message || "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  const stopCamera = () => {
    console.log("Stopping camera");
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => {
        console.log("Stopping track:", track);
        track.stop();
      });
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      try {
        videoRef.current.pause();
        videoRef.current.srcObject = null;
        videoRef.current.onloadedmetadata = null;
        videoRef.current.onerror = null;
      } catch (error) {
        console.error("Error while cleaning up video element:", error);
      }
    }
    
    setIsCameraActive(false);
  };

  const handleOpenCamera = () => {
    setCapturedImage(null);
    setVideoElementMounted(false); // Reset video element mounted state
    setOpenCamera(true);
  };

  const handleCloseCamera = () => {
    stopCamera();
    setOpenCamera(false);
  };

  const handleCapture = () => {
    if (!videoRef.current) {
      console.error("Video reference not available for capture");
      return;
    }

    const video = videoRef.current;
    
    // Check if video dimensions are available
    if (video.videoWidth === 0 || video.videoHeight === 0) {
      console.error("Video dimensions not available, cannot capture");
      setCameraError("Cannot capture: video dimensions not available");
      return;
    }
    
    const canvas = document.createElement("canvas");
    
    // Match canvas dimensions to the video dimensions
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const context = canvas.getContext("2d");
    if (context) {
      // Draw the current video frame on the canvas
      try {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        // Convert to base64 image
        const base64Image = canvas.toDataURL("image/jpeg");
        console.log("Image captured successfully");
        setCapturedImage(base64Image);
        stopCamera();
      } catch (err) {
        console.error("Error capturing image:", err);
        setCameraError(`Error capturing image: ${err instanceof Error ? err.message : "Unknown error"}`);
      }
    } else {
      console.error("Could not get canvas context");
      setCameraError("Could not get canvas context for image capture");
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    startCamera();
  };

  const handleConfirm = () => {
    if (capturedImage) {
      onImageCapture(capturedImage);
      handleCloseCamera();
    }
  };

  const toggleCamera = () => {
    setFacingMode(facingMode === "user" ? "environment" : "user");
  };

  
  // Function to detect if the device has multiple cameras
  const [hasMultipleCameras, setHasMultipleCameras] = useState(false);
  
  useEffect(() => {
    const checkDevices = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter(device => device.kind === 'videoinput');
        setHasMultipleCameras(videoDevices.length > 1);
      } catch (err) {
        console.error("Error checking for camera devices:", err);
        // Default to showing the toggle button if we can't check
        setHasMultipleCameras(true);
      }
    };
    
    if (openCamera) {
      checkDevices();
    }
  }, [openCamera]);

  return (
    <>
      <Button
        variant="outlined"
        startIcon={<CameraAltIcon />}
        onClick={handleOpenCamera}
        disabled={disabled}
        sx={{
          mt: 2,
          mb: 2,
          borderColor: "primary.main",
          "&:hover": {
            borderColor: "primary.dark",
            backgroundColor: "rgba(25, 118, 210, 0.04)",
          },
        }}
      >
        Take Photo
      </Button>

      <Dialog 
        open={openCamera} 
        onClose={handleCloseCamera}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {capturedImage ? "Confirm Your Photo" : "Take Your Photo"}
        </DialogTitle>
        <DialogContent>
          {loading && (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 320 }}>
              <CircularProgress />
              <Typography variant="body2" sx={{ ml: 2 }}>
                Activating camera...
              </Typography>
            </Box>
          )}

          {cameraError && (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 3 }}>
              <Typography color="error" variant="body1" gutterBottom>
                {cameraError}
              </Typography>
              <Button 
                variant="contained" 
                onClick={startCamera}
                startIcon={<ReplayIcon />}
              >
                Try Again
              </Button>
            </Box>
          )}

          {!loading && !cameraError && (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              {capturedImage ? (
                <Paper elevation={3} sx={{ p: 1, mb: 2 }}>
                  <img 
                    src={capturedImage} 
                    alt="Captured" 
                    style={{ maxWidth: '100%', maxHeight: '60vh', display: 'block' }} 
                  />
                </Paper>
              ) : (
                <Paper elevation={3} sx={{ p: 1, mb: 2, backgroundColor: '#000', minHeight: '320px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                  <video
                    ref={(element) => {
                      (videoRef as React.MutableRefObject<HTMLVideoElement | null>).current = element;
                      if (element) {
                        console.log("Video element mounted");
                        setVideoElementMounted(true);
                      }
                    }}
                    autoPlay
                    playsInline
                    muted
                    style={{ 
                      maxWidth: '100%', 
                      maxHeight: '60vh',
                      display: isCameraActive ? 'block' : 'none',
                      transform: facingMode === "user" ? "scaleX(-1)" : "none"
                    }}
                  />
                  {!isCameraActive && !loading && !cameraError && (
                    <Typography color="white" variant="body2">
                      Waiting for camera...
                    </Typography>
                  )}
                </Paper>
              )}

              <Typography variant="body2" color="textSecondary" sx={{ mb: 2, textAlign: 'center' }}>
                {capturedImage 
                  ? "Please check if your face is clearly visible in the photo."
                  : "Position your face within the frame and ensure good lighting."}
              </Typography>

              {!capturedImage && isCameraActive && (
                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center' }}>
                  {hasMultipleCameras && (
                    <IconButton 
                      onClick={toggleCamera} 
                      color="primary"
                      aria-label="switch camera"
                    >
                      <FlipCameraIosIcon />
                    </IconButton>
                  )}
                  <IconButton
                    onClick={handleCapture}
                    color="primary"
                    aria-label="take photo"
                    sx={{ 
                      width: 64,
                      height: 64,
                      border: '2px solid #1976d2',
                      '&:hover': {
                        backgroundColor: 'rgba(25, 118, 210, 0.1)',
                      }
                    }}
                  >
                    <CameraIcon sx={{ fontSize: 32 }} />
                  </IconButton>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ justifyContent: 'space-between', px: 3, pb: 2 }}>
          {capturedImage ? (
            <>
              <Button 
                onClick={handleRetake}
                startIcon={<ReplayIcon />}
                variant="outlined"
              >
                Retake
              </Button>
              <Button 
                onClick={handleConfirm}
                variant="contained"
                color="primary"
              >
                Confirm
              </Button>
            </>
          ) : (
            <Button onClick={handleCloseCamera} color="primary">
              Cancel
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </>
  );
};

export default CameraCapture;