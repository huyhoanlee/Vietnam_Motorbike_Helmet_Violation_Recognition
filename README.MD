# Video Streaming API

This project provides a FastAPI-based application for streaming video content from a video file or webcam. It supports real-time video streaming using MJPEG format and allows retrieval of the latest video frame as a single image via API endpoints.

## Features
- **Real-time video streaming**: Streams video content as MJPEG over HTTP.
- **Single frame access**: Retrieve the latest video frame as a JPEG image.
- **Configurable video source**: Supports both video files and webcam input.
- **Background frame capture**: Uses threading to continuously capture and update frames.
- **Graceful shutdown**: Properly releases video resources on application shutdown.

## Prerequisites
Before running the application, ensure you have the following installed:
- Python 3.8 or higher
- `pip` (Python package manager)
- A compatible video file (e.g., `0424.mp4`) or a webcam

## Installation
1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd <repository-directory>
   ```

2. **Create a virtual environment** (optional but recommended):
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. **Install dependencies**:
   ```bash
   pip install fastapi uvicorn opencv-python starlette
   ```

4. **Prepare the video source**:
   - Place your video file (e.g., `0424.mp4`) in the project directory or update the `video_source` variable in `main.py` to point to your file or use `0` for webcam input.

## Usage
1. **Run the application**:
   ```bash
   python main.py
   ```
   The server will start on `http://localhost:8000`.

2. **Access the API**:
   - **Video Stream**: Open `http://localhost:8000/video` in a browser to view the MJPEG video stream.
   - **Latest Frame**: Access `http://localhost:8000/frame` to retrieve the latest frame as a JPEG image.

3. **Stop the server**:
   Press `Ctrl+C` in the terminal to stop the server. The application will release the video capture resource automatically.

## API Endpoints
| Endpoint        | Method | Description                              | Response Type                     |
|-----------------|--------|------------------------------------------|-----------------------------------|
| `/video`        | GET    | Streams video as MJPEG                   | `multipart/x-mixed-replace`       |
| `/frame`        | GET    | Returns the latest frame as a JPEG image | `image/jpeg` or JSON (on error)   |

### Example Responses
- **`/video`**:
  Streams video frames in MJPEG format, suitable for display in browsers or compatible clients.
- **`/frame`**:
  - Success: Returns a JPEG image.
  - Error: `{"error": "No frame available"}` if no frame is captured.

## Project Structure
```
├── main.py           # Main FastAPI application
├── 0424.mp4         # Example video file (replace with your own)
├── README.md        # This file
└── requirements.txt  # List of dependencies (optional)
```

## Configuration
- **Video Source**: Modify the `video_source` variable in `main.py`:
  - Use a file path (e.g., `'0424.mp4'`) for video files.
  - Use `0` for the default webcam.
- **Frame Rate**: Uncomment and adjust `time.sleep(0.03)` in the `capture_frames` function to control the frame capture rate.
- **Port**: Change the port in `uvicorn.run(app, port=8000)` if needed.

## Notes
- The application loops the video automatically when it reaches the end.
- Ensure sufficient memory and CPU resources for smooth streaming, especially with high-resolution videos.
- For production, consider deploying with a WSGI server like Gunicorn instead of Uvicorn's development server.

## Troubleshooting
- **"No frame available" error**: Ensure the video source is valid and accessible.
- **Stream not loading**: Check if the browser supports MJPEG or try accessing the `/frame` endpoint to verify frame capture.
- **Dependency issues**: Verify all required packages are installed using `pip list`.

## Contributing
1. Fork the repository.
2. Create a new branch (`git checkout -b feature-x`).
3. Commit your changes (`git commit -m "Add feature X"`).
4. Push to the branch (`git push origin feature-x`).
5. Create a Pull Request.

## License
This project is licensed under the MIT License. See the `LICENSE` file for details.