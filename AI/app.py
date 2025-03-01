import cv2
import time
from src.modules.ai_service import AI_Service

# Initialize AI service
AI_service = AI_Service()

# Define input video path
input_video_path = "MVI_0334.MOV"  # Change this to your video file

# Open the input video
cap = cv2.VideoCapture(input_video_path)

# Get video properties
fps = int(cap.get(cv2.CAP_PROP_FPS))  # Frames per second
total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))

# Start processing
total_start_time = time.time()
frame_count = 0

while cap.isOpened():
    ret, frame = cap.read()
    if not ret:
        break  # Stop when video ends

    # Measure processing time per frame
    start_time = time.time()
    result_json = AI_service.process_frame(frame, frame_count)
    end_time = time.time()

    # Show processed frame
    cv2.imshow("Processed Video", result_json["post_frame"])

    # Print frame processing time
    print(f"Processed frame {frame_count+1}/{total_frames} in {end_time - start_time:.4f} seconds")

    frame_count += 1

    # Press 'q' to exit early
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

# Release resources
cap.release()
cv2.destroyAllWindows()

# End total processing timer
total_end_time = time.time()
total_time = total_end_time - total_start_time

print(f"\nTotal processing time: {total_time:.4f} seconds")
print(f"Processed {frame_count} frames.")
