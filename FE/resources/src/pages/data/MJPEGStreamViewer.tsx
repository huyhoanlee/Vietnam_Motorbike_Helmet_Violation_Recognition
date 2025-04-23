import React, { useEffect, useState, useRef } from "react";
import { Box, Button, Typography, CircularProgress } from "@mui/material";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";

interface MJPEGStreamViewerProps {
  streamUrl: string;
}

const MJPEGStreamViewer: React.FC<MJPEGStreamViewerProps> = ({ streamUrl }) => {
  const [isPaused, setIsPaused] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const lastFrameRef = useRef<string | null>(null); // Store last frame URL for pause

  // Handle stream loading and errors
  useEffect(() => {
    if (!streamUrl) {
      setError("No stream URL provided");
      setIsLoading(false);
      return;
    }

    const img = imgRef.current;
    if (!img) return;

    const handleLoad = () => {
      setIsLoading(false);
      setError(null);
    };

    const handleError = () => {
      setIsLoading(false);
      setError("Failed to load stream. Please check the connection or try again.");
    };

    if (!isPaused) {
      // Only update src if not paused
      const timestampedUrl = `${streamUrl}?t=${Date.now()}`;
      img.src = timestampedUrl;
      lastFrameRef.current = timestampedUrl; // Store last frame URL
      img.onload = handleLoad;
      img.onerror = handleError;
    }

    return () => {
      if (img) {
        img.onload = null;
        img.onerror = null;
        img.src = ""; // Clean up on unmount
      }
    };
  }, [streamUrl, isPaused]);

  // Toggle pause/resume
  const togglePause = () => {
    setIsPaused((prev) => {
      const newPausedState = !prev;
      const img = imgRef.current;
      if (newPausedState && img) {
        // Pause: Keep last frame
        img.src = lastFrameRef.current || "";
      } else if (!newPausedState && img && streamUrl) {
        // Resume: Reload stream
        const timestampedUrl = `${streamUrl}?t=${Date.now()}`;
        img.src = timestampedUrl;
        lastFrameRef.current = timestampedUrl;
      }
      return newPausedState;
    });
  };

  return (
    <Box sx={{ textAlign: "center" }}>
      {error ? (
        <Typography color="error">{error}</Typography>
      ) : (
        <Box sx={{ position: "relative", width: "100%", maxWidth: "1280px", margin: "auto" }}>
          {isLoading && (
            <Box
              sx={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                zIndex: 2,
              }}
            >
              <CircularProgress />
            </Box>
          )}
          <img
            ref={imgRef}
            alt="MJPEG Stream"
            style={{
              width: "100%",
              height: "auto",
              maxHeight: "640px",
              borderRadius: 8,
              objectFit: "contain",
              opacity: isLoading ? 0.5 : 1,
              transition: "opacity 0.2s ease-in-out",
            }}
          />
          <Box
            sx={{
              position: "absolute",
              top: 10,
              right: 10,
              display: "flex",
              alignItems: "center",
              gap: 1,
              background: "rgba(0,0,0,0.4)",
              padding: "4px 10px",
              borderRadius: 6,
              color: "#fff",
            }}
          >
            <FiberManualRecordIcon sx={{ color: isPaused ? "gray" : "red" }} />
            <Typography variant="body2">{isPaused ? "Paused" : "Live"}</Typography>
          </Box>
          <Button
            variant="contained"
            color={isPaused ? "success" : "warning"}
            onClick={togglePause}
            sx={{ position: "absolute", top: 10, left: 10 }}
          >
            {isPaused ? "Resume" : "Pause"}
          </Button>
        </Box>
      )}
    </Box>
  );
};

export default MJPEGStreamViewer;