import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  Box,
  Typography,
  CircularProgress,
  Paper,
  Grid,
  IconButton,
  Tooltip,
  Button,
} from "@mui/material";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import PauseIcon from "@mui/icons-material/Pause";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import RefreshIcon from "@mui/icons-material/Refresh";

interface MJPEGStreamViewerProps {
  streamUrl: string;
  cameraName?: string;
  location?: string;
  status?: string;
  onPause?: () => void;
  onResume?: () => void;
}

// Default image to use as fallback when pause capture fails
const DEFAULT_PLACEHOLDER = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjQwIiBoZWlnaHQ9IjQ4MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjMjIyIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIyNCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9IjAuMzVlbSIgZmlsbD0iI2FhYSI+UGF1c2VkPC90ZXh0Pjwvc3ZnPg==";

const MJPEGStreamViewer: React.FC<MJPEGStreamViewerProps> = ({
  streamUrl,
  cameraName = "Camera",
  location = "Unknown Location",
  status = "active",
  onPause,
  onResume,
}) => {
  // Core state
  const [isPaused, setIsPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [frozenFrame, setFrozenFrame] = useState<string | null>(null);
  
  // Video refs
  const liveVideoRef = useRef<HTMLImageElement>(null); // For live streaming
  const hiddenVideoRef = useRef<HTMLImageElement>(null); // For capturing on pause
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  // Control refs
  const isUnmountedRef = useRef<boolean>(false);
  const errorCountRef = useRef<number>(0);
  const streamRequestTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const captureTimestampRef = useRef<number>(0);
  
  // Completely clear frozen frame when resuming
  useEffect(() => {
    if (!isPaused) {
      setFrozenFrame(null);
    }
  }, [isPaused]);
  
  // Get the most recent frame from an image element
  const captureFrame = useCallback((sourceEl: HTMLImageElement | null) => {
    if (!sourceEl || !canvasRef.current) return null;
    
    try {
      // Check if image is loaded
      if (!sourceEl.complete || sourceEl.naturalWidth === 0) {
        console.log("Image not fully loaded for capture");
        return null;
      }
      
      const canvas = canvasRef.current;
      
      // Set canvas dimensions to match source image
      canvas.width = sourceEl.naturalWidth || sourceEl.width || 640;
      canvas.height = sourceEl.naturalHeight || sourceEl.height || 480;
      
      // Draw the frame onto canvas
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;
      
      ctx.drawImage(sourceEl, 0, 0, canvas.width, canvas.height);
      
      // Try to get data URL
      try {
        const dataUrl = canvas.toDataURL('image/jpeg');
        if (dataUrl && dataUrl !== 'data:,') {
          return dataUrl;
        }
      } catch (e) {
        console.error("Error creating data URL:", e);
      }
    } catch (e) {
      console.error("Error capturing frame:", e);
    }
    
    return null;
  }, []);
  
  // Create a unique URL for the stream that will bypass browser cache
  const getUniqueStreamUrl = useCallback(() => {
    if (!streamUrl) return '';
    const timestamp = Date.now();
    captureTimestampRef.current = timestamp; // Store the timestamp for validation later
    return `${streamUrl}?t=${timestamp}`;
  }, [streamUrl]);
  
  // Handle pause/resume actions with prioritized capture
  const handlePause = useCallback(() => {
    if (isPaused) {
      // RESUMING - Simple and quick
      console.log("Resuming video stream");
      setIsPaused(false);
      
      // Schedule pre-fetch of new frames immediately after setState completes
      setTimeout(() => {
        if (liveVideoRef.current) {
          liveVideoRef.current.src = getUniqueStreamUrl();
        }
        
        if (hiddenVideoRef.current) {
          const timestamp = Date.now() + 50;
          hiddenVideoRef.current.src = `${streamUrl}?t=${timestamp}`;
        }
      }, 0);
      
      onResume?.();
      return;
    }
    
    // PAUSING - Capture the current frame with highest priority
    console.log("Pausing video stream - immediate capture");
    
    // First capture the frame BEFORE changing any state to minimize delay
    let capturedFrame = null;
    
    // Try liveVideoRef first - this is what the user is seeing right now
    if (liveVideoRef.current && liveVideoRef.current.complete) {
      capturedFrame = captureFrame(liveVideoRef.current);
      if (capturedFrame) {
        console.log("Successfully captured current visible frame instantly");
      }
    }
    
    // If we couldn't get the live frame, try the hidden frame
    if (!capturedFrame && hiddenVideoRef.current && hiddenVideoRef.current.complete) {
      capturedFrame = captureFrame(hiddenVideoRef.current);
      if (capturedFrame) {
        console.log("Used hidden frame for instant capture");
      }
    }
    
    // NOW set the isPaused state AFTER we've captured the frame
    setIsPaused(true);
    
    // Set the captured frame if we have one
    if (capturedFrame) {
      setFrozenFrame(capturedFrame);
      onPause?.();
      return;
    }
    
    // If we're here, we couldn't capture immediately, so try more aggressive methods
    console.log("Immediate capture failed, trying alternate methods");
    setFrozenFrame(null); // Clear any previous frame
    
    // Create a temporary image to load the very latest frame
    const tempImg = new Image();
    tempImg.crossOrigin = "anonymous";
    
    // Set up capture for when image loads
    tempImg.onload = () => {
      if (canvasRef.current) {
        try {
          const canvas = canvasRef.current;
          canvas.width = tempImg.naturalWidth || 640;
          canvas.height = tempImg.naturalHeight || 480;
          
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(tempImg, 0, 0);
            
            const dataUrl = canvas.toDataURL('image/jpeg');
            if (dataUrl && dataUrl !== 'data:,') {
              setFrozenFrame(dataUrl);
              console.log("Captured fresh frame with delayed method");
            } else {
              setFrozenFrame(DEFAULT_PLACEHOLDER);
              console.log("Failed to get data URL from canvas");
            }
          }
        } catch (e) {
          console.error("Error in delayed capture:", e);
          setFrozenFrame(DEFAULT_PLACEHOLDER);
        }
      }
    };
    
    tempImg.onerror = () => {
      console.error("Failed to load temporary image");
      setFrozenFrame(DEFAULT_PLACEHOLDER);
    };
    
    // Use a unique URL with the exact pause timestamp
    const pauseTimestamp = Date.now();
    tempImg.src = `${streamUrl}?t=${pauseTimestamp}`;
    
    // Notify parent that we've paused
    onPause?.();
  }, [isPaused, captureFrame, onPause, onResume, getUniqueStreamUrl, streamUrl]);
  
  // Handler for successfully loaded frames
  const handleImageLoad = useCallback(() => {
    // Don't process if component is unmounted
    if (isUnmountedRef.current) return;
    
    // Update loading state only once
    if (isLoading) {
      setIsLoading(false);
      errorCountRef.current = 0;
    }
  }, [isLoading]);
  
  // Handle image load errors
  const handleImageError = useCallback(() => {
    // Don't process if unmounted
    if (isUnmountedRef.current) return;
    
    errorCountRef.current++;
    
    // Only show error after multiple failures
    if (errorCountRef.current > 3 && !isUnmountedRef.current) {
      setError("Unable to load video stream. Please try again later..");
      setIsLoading(false);
      
      // Stop streaming
      if (streamRequestTimerRef.current) {
        clearTimeout(streamRequestTimerRef.current);
        streamRequestTimerRef.current = null;
      }
    }
  }, []);
  
  // Handle refresh button
  const handleRefresh = useCallback(() => {
    setIsLoading(true);
    setError(null);
    errorCountRef.current = 0;
    
    // Reset pause state
    setIsPaused(false);
    setFrozenFrame(null);
    
    // Force refresh both videos
    if (liveVideoRef.current) {
      liveVideoRef.current.src = getUniqueStreamUrl();
    }
    
    if (hiddenVideoRef.current) {
      const timestamp = Date.now() + 50;
      hiddenVideoRef.current.src = `${streamUrl}?t=${timestamp}`;
    }
  }, [streamUrl, getUniqueStreamUrl]);
  
  // Stream update loop - more efficient approach
  useEffect(() => {
    // Don't run if paused, unmounted, or no URL
    if (isUnmountedRef.current || isPaused || !streamUrl || status !== "active") {
      return;
    }
    
    let phase = 0; // Alternating between two videos to always have a frame ready
    
    const updateStream = () => {
      if (isUnmountedRef.current || isPaused) return;
      
      // Alternate between updating the two video elements
      // This ensures we always have at least one fully loaded frame
      if (phase === 0 && liveVideoRef.current) {
        liveVideoRef.current.src = getUniqueStreamUrl();
        phase = 1;
      } else if (phase === 1 && hiddenVideoRef.current) {
        const timestamp = Date.now() + 20; // Reduced offset to get frames closer to current time
        hiddenVideoRef.current.src = `${streamUrl}?t=${timestamp}`;
        phase = 0;
      }
      
      // Schedule next update (higher frame rate for more responsive pausing)
      streamRequestTimerRef.current = setTimeout(updateStream, 50); // Increased frame rate
    };
    
    // Start update loop
    updateStream();
    
    // Cleanup
    return () => {
      if (streamRequestTimerRef.current) {
        clearTimeout(streamRequestTimerRef.current);
        streamRequestTimerRef.current = null;
      }
    };
  }, [isPaused, streamUrl, status, getUniqueStreamUrl]);
  
  // Setup and cleanup
  useEffect(() => {
    isUnmountedRef.current = false;
    
    // Initial setup
    if (streamUrl && status === "active") {
      // Initialize both video elements
      if (liveVideoRef.current) {
        liveVideoRef.current.src = getUniqueStreamUrl();
      }
      
      if (hiddenVideoRef.current) {
        const timestamp = Date.now() + 50;
        hiddenVideoRef.current.src = `${streamUrl}?t=${timestamp}`;
      }
    } else {
      setError(status !== "active" ? "Camera is currently not working" : "No video stream URL");
      setIsLoading(false);
    }
    
    return () => {
      isUnmountedRef.current = true;
      
      if (streamRequestTimerRef.current) {
        clearTimeout(streamRequestTimerRef.current);
        streamRequestTimerRef.current = null;
      }
    };
  }, [streamUrl, status, getUniqueStreamUrl]);
  
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
            {error && (
              <Box
                sx={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  zIndex: 20,
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
                    This camera is currently unavailable. Please check the camera status or try again later.
                  </Typography>
                )}
                <Button
                  variant="contained"
                  startIcon={<RefreshIcon />}
                  onClick={handleRefresh}
                  sx={{ mt: 2 }}
                >
                  Retry
                </Button>
              </Box>
            )}

            {!error && (
              <Box sx={{ position: "relative", width: "100%", height: "100%" }}>
                {/* Live stream video - visible when not paused */}
                {!isPaused && (
                  <img
                    ref={liveVideoRef}
                    src={streamUrl ? getUniqueStreamUrl() : ''}
                    alt="Streaming Camera"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "contain",
                    }}
                    onLoad={handleImageLoad}
                    onError={handleImageError}
                    crossOrigin="anonymous"
                  />
                )}
                
                {/* Hidden video element - always loaded but invisible, used for capture redundancy */}
                <img
                  ref={hiddenVideoRef}
                  src={streamUrl ? `${streamUrl}?t=${Date.now()+100}` : ''}
                  alt="Hidden Video"
                  style={{
                    display: 'none', 
                    position: 'absolute',
                  }}
                  onLoad={handleImageLoad}
                  crossOrigin="anonymous"
                />
                
                {/* Frozen frame image - shown when paused */}
                {isPaused && frozenFrame && (
                  <img
                    src={frozenFrame}
                    alt="Photo paused"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "contain",
                    }}
                  />
                )}
                
                {/* Canvas used for capturing frames - always hidden */}
                <canvas
                  ref={canvasRef}
                  style={{
                    display: 'none',
                    position: 'absolute',
                  }}
                />
                
                {/* Pause overlay indicator */}
                {isPaused && (
                  <Box
                    sx={{
                      position: "absolute",
                      bottom: 16,
                      left: 16,
                      background: "rgba(0,0,0,0.6)",
                      color: "white",
                      padding: "4px 8px",
                      borderRadius: 1,
                      fontSize: "0.75rem",
                      zIndex: 20,
                    }}
                  >
                    Paused
                  </Box>
                )}
                
                {/* Only show loading indicator when initially loading, not during streaming */}
                {isLoading && !isPaused && (
                  <Box
                    sx={{
                      position: "absolute",
                      top: "50%",
                      left: "50%",
                      transform: "translate(-50%, -50%)",
                      zIndex: 20,
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 2,
                    }}
                  >
                    <CircularProgress sx={{ color: "#fff" }} />
                    <Typography variant="body2" sx={{ color: "#fff" }}>
                      Initializing...
                    </Typography>
                  </Box>
                )}
              </Box>
            )}

            {/* Live/Paused status indicator */}
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
                  zIndex: 30,
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
                  {isPaused ? "Pause" : "Live"}
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
                  zIndex: 30,
                }}
              >
                <Tooltip title={isPaused ? "Continue" : "Pause"}>
                  <span>
                    <IconButton
                      onClick={handlePause}
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

                <Tooltip title="Refresh stream">
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
                  {status === "active" ? "Active" : "Inactive"}
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Box>
  );
};

export default MJPEGStreamViewer;