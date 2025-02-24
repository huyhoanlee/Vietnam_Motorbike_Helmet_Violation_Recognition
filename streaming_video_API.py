from fastapi import FastAPI, Response
import cv2
import threading
import time
from starlette.responses import StreamingResponse

from controllers.ai_service import AIController


app = FastAPI()

# Open the video source (use 0 for webcam, or provide a file path)
video_source = 'MVI_0334.MOV'  # Change this to your video file
cap = cv2.VideoCapture(video_source)

ai_controllers = AIController()

latest_frame = None  # Store the latest frame for external API access

def capture_frames():
    """ Continuously read frames and store the latest frame """
    global latest_frame
    i = 0
    while cap.isOpened():
        success, frame = cap.read()

        i += 1
        res = ai_controllers.process_frame(frame, i)

        if not success:
            cap.set(cv2.CAP_PROP_POS_FRAMES, 0)  # Loop video
            continue

        _, buffer = cv2.imencode('.jpg', res)
        latest_frame = buffer.tobytes()  # Save the latest frame
        # time.sleep(0.03)  # Adjust frame rate

# Start frame capture in a background thread
threading.Thread(target=capture_frames, daemon=True).start()

@app.get("/video")
def video_feed():
    """ Stream video as MJPEG """
    def generate_frames():
        while True:
            if latest_frame:
                yield (b'--frame\r\n'
                       b'Content-Type: image/jpeg\r\n\r\n' + latest_frame + b'\r\n')

    return StreamingResponse(generate_frames(), media_type="multipart/x-mixed-replace; boundary=frame")

@app.get("/frame")
def get_frame():
    """ Return the latest frame as a single image """
    # while True:
    if latest_frame:
        return Response(content=latest_frame, media_type="image/jpeg")
    return {"error": "No frame available"}

@app.on_event("shutdown")
def shutdown_event():
    cap.release()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, port=8000)
