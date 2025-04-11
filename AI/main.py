import cv2
import time
from src.modules.ai_service import AI_Service

# Khởi tạo AI service
AI_service = AI_Service()

# Đường dẫn tới file video (thay bằng path thực tế của bạn)
video_path = "MVI_0332.MOV"  # Ví dụ: "videos/test.mp4"

def process_and_display_video():
    """Đọc frame từ video file, xử lý AI và hiển thị lên màn hình với FPS."""
    # Mở video từ đường dẫn
    cap = cv2.VideoCapture(video_path)
    
    if not cap.isOpened():
        print(f"Không thể mở video từ: {video_path}")
        return
    
    frame_count = 0  # Đếm số frame
    total_time = 0   # Tổng thời gian xử lý
    prev_time = time.time()  # Thời gian bắt đầu để tính FPS
    
    while True:
        # Đọc frame từ video
        ret, frame = cap.read()
        
        if not ret:
            print("Hết video hoặc lỗi khi đọc frame.")
            break
        
        # Xử lý frame qua AI_service
        start_time = time.time()
        post_frame = AI_service.test_process_frame(frame, frame_count)
        end_time = time.time()
        process_time = end_time - start_time
        total_time += process_time
        
        # Tính FPS
        current_time = time.time()
        fps = 1 / (current_time - prev_time) if (current_time - prev_time) > 0 else 0
        prev_time = current_time
        
        # In thông tin lên frame: FPS, thời gian xử lý, số frame
        info_text = f"FPS: {fps:.2f}, Process Time: {process_time:.3f}s, Frame: {frame_count}"
        cv2.putText(post_frame, info_text, (10, 30), 
                   cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 2)
        
        # Hiển thị frame
        cv2.imshow("Video", post_frame)
        
        # Nhấn 'q' để thoát
        if cv2.waitKey(1) & 0xFF == ord('q'):
            break
        
        frame_count += 1
    
    # Giải phóng tài nguyên và in tổng thời gian
    print(f"Tổng thời gian xử lý: {total_time:.2f}s")
    print(f"Số frame xử lý: {frame_count}")
    print(f"FPS trung bình: {frame_count / total_time:.2f}" if total_time > 0 else "FPS trung bình: N/A")
    cap.release()
    cv2.destroyAllWindows()

def process_and_display_frame():
    """Đọc frame từ video file, xử lý AI và hiển thị lên màn hình với FPS."""
    # Mở video từ đường dẫn
    for i in range(200):
        frame = cv2.imread('CAM013_20250214_1108_Mua_14.jpg')
        
        frame_count = 0  # Đếm số frame
        total_time = 0   # Tổng thời gian xử lý
        
        # Xử lý frame qua AI_service
        start_time = time.time()
        post_frame = AI_service.test_process_frame(frame, frame_count)
        end_time = time.time()
        process_time = end_time - start_time
        total_time += process_time
        
        # In thông tin lên frame: FPS, thời gian xử lý, số frame
        info_text = f"Process Time: {process_time:.3f}s, Frame: {frame_count}"
        cv2.putText(post_frame, info_text, (10, 30), 
                    cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 2)
        
        # Hiển thị frame
        cv2.imshow("Video", post_frame)
        cv2.waitKey() 
        cv2.destroyAllWindows()

if __name__ == "__main__":
    # Run
    process_and_display_frame()
    # process_and_display_video()

#no track
# Tổng thời gian xử lý: 60.68s
# Số frame xử lý: 1454
# FPS trung bình: 23.96
#track
# Tổng thời gian xử lý: 91.19s
# Số frame xử lý: 1454
# FPS trung bình: 15.95