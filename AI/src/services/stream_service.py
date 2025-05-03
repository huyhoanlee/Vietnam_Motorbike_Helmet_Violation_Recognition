# src/services/stream_service.py
import asyncio
import time
import uuid
from typing import Dict, List, Optional, Tuple, AsyncGenerator
import cv2
import numpy as np
from loguru import logger
from src.modules.ai_service import AI_Service, DeviceDetection, AIService
from src.models.schema import FrameData, AIResult
from src.config import AppConfig_2 as AppConfig
from src.utils import compress_frame_to_jpeg

class StreamError(Exception):
    """Base exception for stream-related errors"""
    pass

class StreamConnectionError(StreamError):
    """Exception raised when connection to a stream fails"""
    pass

class StreamProcessingError(StreamError):
    """Exception raised when processing a stream fails"""
    pass

class StreamService:
    def __init__(self):
        self.ai_services = {}
        self.streams = {}  # url -> stream_id mapping
        self.stream_ids = {}  # stream_id -> url mapping
        self.capture_dict = {}  # url -> cv2.VideoCapture
        self.frames = {}  # stream_id -> latest jpeg frame
        self.latest_result = None
        self.latest_results = {}  # stream_id -> latest AI result
        self.active = True
        self.processing_interval = AppConfig.PROCESSING_INTERVAL
        self.health_check_interval = AppConfig.HEALTH_CHECK_INTERVAL
        self.max_retry_attempts = AppConfig.MAX_RETRY_ATTEMPTS
        self.retry_cooldown = AppConfig.RETRY_COOLDOWN
        self.rate_limiter = asyncio.Semaphore(AppConfig.MAX_CONCURRENT_PROCESSING)
        self.frame_capture_timeout = 99999  # seconds
        self.stream_errors = {}  # url -> {count, last_error, last_time}
        
        # Locks for thread safety
        self._streams_lock = asyncio.Lock()
        self._results_lock = asyncio.Lock()
        self._frames_lock = asyncio.Lock()
        self._errors_lock = asyncio.Lock()
    
    async def add_stream(self, url: str) -> Tuple[str, str]:
        """Add a new camera stream and return its ID and public stream URL"""
        async with self._streams_lock:
            # Check if stream already exists first
            if url in self.streams:
                return self.streams[url], f"{AppConfig.HOST_STREAM}{self.streams[url]}"
            
            # Generate a deterministic but unique ID for the stream
            stream_id = uuid.uuid5(uuid.NAMESPACE_URL, url).hex[:8]
            
            # Initialize AI service for this stream
            try:
                self.ai_services[url] = AIService(url)
            except Exception as e:
                logger.error(f"Failed to initialize AI service for {url}: {str(e)}")
                raise StreamError(f"AI service initialization failed: {str(e)}")
            
            # Store mappings
            self.streams[url] = stream_id
            self.stream_ids[stream_id] = url
            self.stream_errors[url] = {"count": 0, "last_error": None, "last_time": None}
            
            rtsp_stream = f"{AppConfig.HOST_STREAM}{stream_id}"
            logger.info(f"Added camera stream: {url} with ID: {stream_id}")
            
            return stream_id, rtsp_stream
    
    async def initialize_stream(self, url: str) -> bool:
        """Initialize video capture for the given URL"""
        try:
            # Release existing capture if any
            if url in self.capture_dict:
                self.capture_dict[url].release()
            
            capture = cv2.VideoCapture(url)
            if not capture.isOpened():
                logger.error(f"Failed to open video stream: {url}")
                return False
            
            # Try to read first frame to confirm connection
            ret, _ = capture.read()
            if not ret:
                capture.release()
                logger.error(f"Could read first frame from: {url}")
                return False
                
            async with self._streams_lock:
                self.capture_dict[url] = capture
                
            logger.info(f"Successfully initialized stream: {url}")
            return True
        except Exception as e:
            logger.error(f"Error initializing stream {url}: {str(e)}")
            return False
            
    async def remove_stream(self, url: str) -> None:
        """Remove a camera stream and release associated resources"""
        async with self._streams_lock:
            if url not in self.streams:
                logger.warning(f"Stream URL not found: {url}")
                return
            
            stream_id = self.streams[url]
            
            # Release video capture if it exists
            if url in self.capture_dict:
                self.capture_dict[url].release()
                del self.capture_dict[url]
            
            # Remove AI_Service instance
            if url in self.ai_services:
                del self.ai_services[url]
            
            # Remove from error tracking
            if url in self.stream_errors:
                del self.stream_errors[url]
            
            # Remove frames if they exist
            async with self._frames_lock:
                if stream_id in self.frames:
                    del self.frames[stream_id]
            
            # Remove results if they exist
            async with self._results_lock:
                if stream_id in self.latest_results:
                    del self.latest_results[stream_id]
            
            # Remove mappings
            del self.streams[url]
            del self.stream_ids[stream_id]
            
            logger.info(f"Removed camera stream: {url}")
    
    def get_all_streams(self) -> Dict[str, Dict]:
        """Get all active camera streams with their IDs"""
        return {url: {"stream_id": stream_id, "stream_url": f"{AppConfig.HOST_STREAM}{stream_id}"} 
                for url, stream_id in self.streams.items()}
    
    def is_valid_stream_id(self, stream_id: str) -> bool:
        """Check if a stream ID is valid"""
        return stream_id in self.stream_ids
    
    async def _capture_frame(self, url: str) -> Optional[np.ndarray]:
        """Capture a single frame from the given URL with timeout"""
        if url not in self.capture_dict:
            logger.warning(f"No capture object for URL: {url}")
            return None
            
        capture = self.capture_dict[url]
        if not capture.isOpened():
            logger.warning(f"Capture not opened for URL: {url}")
            return None
        
        try:
            # Create a task for frame capture with timeout
            loop = asyncio.get_event_loop()
            frame_task = loop.run_in_executor(None, lambda: capture.read())
            ret, frame = await asyncio.wait_for(frame_task, timeout=self.frame_capture_timeout)
            
            if not ret or frame is None:
                await self._record_stream_error(url, "Failed to read frame")
                return None
                
            # Reset error count on successful frame capture
            await self._reset_stream_error(url)
            return frame
            
        except asyncio.TimeoutError:
            await self._record_stream_error(url, "Frame capture timeout")
            logger.warning(f"Timeout while capturing frame from URL: {url}")
            return None
        except Exception as e:
            await self._record_stream_error(url, str(e))
            logger.error(f"Error capturing frame from {url}: {str(e)}")
            return None
    
    async def _record_stream_error(self, url: str, error_msg: str) -> None:
        """Record a stream error for circuit breaker pattern"""
        async with self._errors_lock:
            if url in self.stream_errors:
                self.stream_errors[url]["count"] += 1
                self.stream_errors[url]["last_error"] = error_msg
                self.stream_errors[url]["last_time"] = time.time()
    
    async def _reset_stream_error(self, url: str) -> None:
        """Reset error count for a stream"""
        async with self._errors_lock:
            if url in self.stream_errors:
                self.stream_errors[url]["count"] = 0
    
    async def _process_stream(self, url: str) -> Optional[FrameData]:
        """Process a single stream and return frame data"""
        try:
            # Check if stream has too many errors (circuit breaker pattern)
            async with self._errors_lock:
                if url in self.stream_errors and self.stream_errors[url]["count"] > 5:
                    cooldown_time = 30  # seconds
                    last_time = self.stream_errors[url]["last_time"] or 0
                    if time.time() - last_time < cooldown_time:
                        # Skip processing this stream temporarily
                        return None
            
            frame = await self._capture_frame(url)
            if frame is None:
                return None
                
            # Get stream ID
            stream_id = self.streams.get(url)
            if not stream_id:
                return None
                
            # Compress frame for streaming
            jpeg_frame = compress_frame_to_jpeg(frame)
            
            # Store frame safely
            async with self._frames_lock:
                self.frames[stream_id] = jpeg_frame
            
            # Create frame data object for AI processing
            frame_count = int(self.capture_dict[url].get(cv2.CAP_PROP_POS_FRAMES))
            frame_data = FrameData(
                url=url,
                frame=frame,
                frame_count=frame_count
            )
            
            return frame_data
        except Exception as e:
            await self._record_stream_error(url, str(e))
            logger.error(f"Error processing stream {url}: {str(e)}")
            return None
    
    async def _capture_all_frames(self) -> List[FrameData]:
        """Capture frames from all active streams"""
        frame_data_list = []
        async with self._streams_lock:
            urls = list(self.streams.keys())
        
        async def process_url(url):
            async with self.rate_limiter:
                result = await self._process_stream(url)
                if result:
                    return result
            return None
            
        # Process all URLs concurrently with rate limiting
        tasks = [process_url(url) for url in urls]
        results = await asyncio.gather(*tasks)
        
        # Filter out None results
        return [r for r in results if r is not None]
    
    async def _check_stream_health(self) -> None:
        """Check the health of all streams and attempt to reconnect failed ones"""
        async with self._streams_lock:
            for url in list(self.streams.keys()):
                needs_reconnect = False
                
                # Check if capture exists and is open
                if url not in self.capture_dict or not self.capture_dict[url].isOpened():
                    needs_reconnect = True
                
                # Check error count (part of circuit breaker)
                async with self._errors_lock:
                    if (url in self.stream_errors and 
                        self.stream_errors[url]["count"] >= self.max_retry_attempts):
                        needs_reconnect = True
                        self.stream_errors[url]["count"] = 0  # Reset counter to try again
                
                if needs_reconnect:
                    logger.warning(f"Stream {url} is down, attempting to reconnect")
                    
                    # Release existing capture if any
                    if url in self.capture_dict:
                        self.capture_dict[url].release()
                    
                    # Try to reconnect
                    for attempt in range(self.max_retry_attempts):
                        if await self.initialize_stream(url):
                            logger.info(f"Successfully reconnected to {url}")
                            break
                        else:
                            logger.warning(f"Reconnect attempt {attempt+1}/{self.max_retry_attempts} failed for {url}")
                            await asyncio.sleep(self.retry_cooldown)
    
    async def process_streams(self) -> None:
        """Main processing loop for all camera streams"""
        health_check_counter = 0
        
        while self.active:
            try:
                # Periodically check stream health
                health_check_counter += 1
                if health_check_counter >= (self.health_check_interval // self.processing_interval):
                    asyncio.create_task(self._check_stream_health())
                    health_check_counter = 0
                
                # Skip processing if no streams
                if not self.streams:
                    await asyncio.sleep(self.processing_interval)
                    continue
                
                # Capture frames from all streams
                frame_data_list = await self._capture_all_frames()
                if not frame_data_list:
                    await asyncio.sleep(self.processing_interval)
                    continue
                
                device_detections = []
                # Process frames with AI service
                for frame_data in frame_data_list:
                    url = frame_data.get("url")
                    if url in self.ai_services:
                        try:
                            detections: List[DeviceDetection] = await self.ai_services[url].process_frames([frame_data])
                            if detections:
                                device_detections.extend(detections)
                        except Exception as e:
                            logger.error(f"AI processing error for {url}: {str(e)}")
                
                # Update latest result
                if device_detections:
                    current_time = time.time()
                    async with self._results_lock:
                        for detection in device_detections:
                            camera_id = detection.camera_id
                            if camera_id in self.streams:
                                stream_id = self.streams[camera_id]
                                self.latest_results[stream_id] = {
                                "time": current_time,
                                "device_list": [detection]  # Store detection specific to this stream
                                }
                        
                        self.latest_result = {
                            "time": current_time,
                            "device_list": device_detections
                        }
                
            except Exception as e:
                import traceback
                logger.error(f"Exception in stream processing: {traceback.format_exc()}")
                logger.error(f"Error in stream processing loop: {str(e)}")
            
            # Sleep to control processing rate
            await asyncio.sleep(self.processing_interval)
    
    def get_latest_result(self) -> Optional[AIResult]:
        """Get the latest AI processing result"""
        return self.latest_result
    
    def get_latest_result_camera_id(self, camera_id: str) -> Optional[Dict]:
        """Get the latest AI processing result for a specific camera_id"""
        if not self.is_valid_stream_id(camera_id):
            logger.warning(f"Invalid camera_id: {camera_id}")
            return None
        return self.latest_results.get(camera_id)
    
    def is_valid_camera_id(self, camera_id: str) -> bool:
        """Check if a camera ID is valid"""
        return camera_id in self.stream_ids
    
    async def generate_frames(self, stream_id: str) -> AsyncGenerator[bytes, None]:
        """Generate frames for video streaming"""
        if not self.is_valid_stream_id(stream_id):
            logger.error(f"Invalid stream_id in generate_frames: {stream_id}")
            return
            
        while self.active:
            try:
                jpeg_frame = None
                
                # Safely access frames
                async with self._frames_lock:
                    if stream_id in self.frames:
                        jpeg_frame = self.frames[stream_id]
                
                if not jpeg_frame:
                    # If no frame available, wait a bit and try again
                    await asyncio.sleep(0.1)
                    continue
                
                # Check if we need to overlay AI detections
                url = self.stream_ids.get(stream_id)
                if url:
                    process_result = False
                    post_frame = None
                    
                    async with self._results_lock:
                        if stream_id in self.latest_results:
                            result = self.latest_results[stream_id]
                            if result and "device_list" in result:
                                device_list = result.get("device_list", [])
                                if device_list and len(device_list) > 0:
                                    # Try to get post-processed frame if available
                                    detection = device_list[0]
                                    if hasattr(detection, 'post_frame') and detection.post_frame is not None:
                                        post_frame = detection.post_frame
                                        process_result = True
                
                # Use post-processed frame if available, otherwise use the regular frame
                output_frame = post_frame if process_result else jpeg_frame
                
                yield (b'--frame\r\n'
                        b'Content-Type: image/jpeg\r\n\r\n' + 
                        output_frame + 
                        b'\r\n')
                        
                # Small delay to control frame rate
                await asyncio.sleep(0.033)  # ~30 FPS
                
            except Exception as e:
                logger.error(f"Error in generate_frames for {stream_id}: {str(e)}")
                await asyncio.sleep(0.5)  # Longer delay on error
    
    async def shutdown(self) -> None:
        """Clean shutdown of the service"""
        logger.info("Shutting down stream service...")
        self.active = False
        
        # Allow ongoing tasks to complete
        await asyncio.sleep(1)
        
        # Release all video captures
        async with self._streams_lock:
            for url, capture in self.capture_dict.items():
                try:
                    capture.release()
                    logger.info(f"Released capture for {url}")
                except Exception as e:
                    logger.error(f"Error releasing capture for {url}: {str(e)}")
        
        # Clear all data structures
        self.capture_dict.clear()
        self.frames.clear()
        self.streams.clear()
        self.stream_ids.clear()
        self.latest_results.clear()
        self.stream_errors.clear()
        
        logger.info("Stream service shut down successfully")
