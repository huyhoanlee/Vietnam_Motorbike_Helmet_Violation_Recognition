// import React, { useEffect, useState, useRef } from "react";
// import { Box, Button, Typography, CircularProgress } from "@mui/material";
// import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";

// interface MJPEGStreamViewerProps {
//   streamUrl: string;
// }

// const MJPEGStreamViewer: React.FC<MJPEGStreamViewerProps> = ({ streamUrl }) => {
//   const [isPaused, setIsPaused] = useState(false);
//   const [isLoading, setIsLoading] = useState(true);
//   const [error, setError] = useState<string | null>(null);
//   const imgRef = useRef<HTMLImageElement>(null);
//   const canvasRef = useRef<HTMLCanvasElement | null>(null); // Hidden canvas to capture frames
//   const lastFrameRef = useRef<string | null>(null); // Store last frame as data URL

//   useEffect(() => {
//     if (!streamUrl) {
//       setError("No stream URL provided");
//       setIsLoading(false);
//       return;
//     }

//     const img = imgRef.current;
//     if (!img) return;

//     // Create a hidden canvas to capture frames
//     const canvas = document.createElement("canvas");
//     canvasRef.current = canvas;

//     const handleLoad = () => {
//       setIsLoading(false);
//       setError(null);
//       // Capture the current frame as a data URL
//       if (canvasRef.current) {
//         canvasRef.current.width = img.naturalWidth;
//         canvasRef.current.height = img.naturalHeight;
//         const ctx = canvasRef.current.getContext("2d");
//         if (ctx) {
//           ctx.drawImage(img, 0, 0);
//           lastFrameRef.current = canvasRef.current.toDataURL("image/jpeg");
//         }
//       }
//     };

//     const handleError = () => {
//       setIsLoading(false);
//       setError("Failed to load stream. Please check the connection or try again.");
//     };

//     let intervalId: NodeJS.Timeout | null = null;

//     if (!isPaused) {
//       // Continuously update the stream when not paused
//       const updateStream = () => {
//         img.src = `${streamUrl}?t=${Date.now()}`; // Add timestamp to prevent caching
//       };

//       updateStream(); // Initial load
//       intervalId = setInterval(updateStream, 100); // Update every 100ms for MJPEG
//       img.onload = handleLoad;
//       img.onerror = handleError;
//     }

//     return () => {
//       if (intervalId) clearInterval(intervalId);
//       if (img) {
//         img.onload = null;
//         img.onerror = null;
//         img.src = ""; // Clean up on unmount
//       }
//     };
//   }, [streamUrl, isPaused]);

//   const togglePause = () => {
//     setIsPaused((prev) => !prev);
//   };

//   return (
//     <Box sx={{ textAlign: "center" }}>
//       {error ? (
//         <Typography color="error">{error}</Typography>
//       ) : (
//         <Box sx={{ position: "relative", width: "100%", maxWidth: "1280px", margin: "auto" }}>
//           {isLoading && !lastFrameRef.current && (
//             <Box
//               sx={{
//                 position: "absolute",
//                 top: "50%",
//                 left: "50%",
//                 transform: "translate(-50%, -50%)",
//                 zIndex: 2,
//               }}
//             >
//               <CircularProgress />
//             </Box>
//           )}
//           <img
//             ref={imgRef}
//             alt="MJPEG Stream"
//             style={{
//               width: "100%",
//               height: "auto",
//               maxHeight: "640px",
//               borderRadius: 8,
//               objectFit: "contain",
//               opacity: isLoading && !lastFrameRef.current ? 0.5 : 1,
//               transition: "opacity 0.2s ease-in-out",
//             }}
//           />
//           <Box
//             sx={{
//               position: "absolute",
//               top: 10,
//               right: 10,
//               display: "flex",
//               alignItems: "center",
//               gap: 1,
//               background: "rgba(0,0,0,0.4)",
//               padding: "4px 10px",
//               borderRadius: 6,
//               color: "#fff",
//             }}
//           >
//             <FiberManualRecordIcon sx={{ color: isPaused ? "gray" : "red" }} />
//             <Typography variant="body2">{isPaused ? "Paused" : "Live"}</Typography>
//           </Box>
//           <Button
//             variant="contained"
//             color={isPaused ? "success" : "warning"}
//             onClick={togglePause}
//             sx={{ position: "absolute", top: 10, left: 10 }}
//           >
//             {isPaused ? "Resume" : "Pause"}
//           </Button>
//         </Box>
//       )}
//     </Box>
//   );
// };

// export default MJPEGStreamViewer;

import React, { useEffect, useState, useRef } from "react";
import { Box, Button, Typography } from "@mui/material";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";

interface MJPEGStreamViewerProps {
  streamUrl: string;
}

const MJPEGStreamViewer: React.FC<MJPEGStreamViewerProps> = ({ streamUrl }) => {
  const [isPaused, setIsPaused] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const lastFrameRef = useRef<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Capture the current frame
  const captureFrame = () => {
    const img = imgRef.current;
    if (!img || !img.complete || img.naturalWidth === 0) return false;

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
        lastFrameRef.current = canvas.toDataURL("image/jpeg");
        return true;
      } catch (e) {
        console.error("Error capturing frame:", e);
      }
    }
    return false;
  };

  // Toggle pause/resume
  const togglePause = () => {
    if (!isPaused) {
      // About to pause - ensure we have the latest frame
      captureFrame();
      
      // Stop fetch interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    }
    
    setIsPaused(prev => !prev);
  };

  useEffect(() => {
    if (!streamUrl) {
      setError("No stream URL provided");
      return;
    }

    const img = imgRef.current;
    if (!img) return;

    // Clear any existing interval first
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (!isPaused) {
      // Setup handlers for live streaming
      const handleLoad = () => {
        setError(null);
        captureFrame(); // Capture frame on successful load
      };

      const handleError = () => {
        setError("Failed to load stream. Please check the connection or try again.");
      };

      // Set up handlers
      img.onload = handleLoad;
      img.onerror = handleError;

      // Initial load
      img.src = `${streamUrl}?t=${Date.now()}`;

      // Set up interval for continuous updates - simpler approach
      intervalRef.current = setInterval(() => {
        if (!isPaused && img) {
          img.src = `${streamUrl}?t=${Date.now()}`;
        }
      }, 100);
    } else {
      // We're paused - display the last captured frame
      if (lastFrameRef.current) {
        img.onload = null; // Remove handlers when paused
        img.onerror = null;
        img.src = lastFrameRef.current;
      }
    }

    return () => {
      // Clean up
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      
      if (img) {
        img.onload = null;
        img.onerror = null;
      }
    };
  }, [streamUrl, isPaused]);

  return (
    <Box sx={{ textAlign: "center" }}>
      {error ? (
        <Typography color="error">{error}</Typography>
      ) : (
        <Box
          sx={{
            position: "relative",
            width: "100%",
            maxWidth: "1280px",
            margin: "auto",
            aspectRatio: "16 / 9",
            height: "640px",
            overflow: "hidden",
          }}
        >
          <img
            ref={imgRef}
            alt="MJPEG Stream"
            style={{
              width: "100%",
              height: "100%",
              borderRadius: 8,
              objectFit: "contain",
              opacity: 1,
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
