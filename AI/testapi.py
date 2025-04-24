from fastapi import FastAPI
from fastapi.responses import JSONResponse
import threading

from main import process_and_display_video  # Thay 'your_module_path' bằng tên file nếu không cùng file

app = FastAPI()

@app.get("/run-video-process")
def run_video_process():
    # Chạy process_and_display_video() trong thread riêng để không block FastAPI
    thread = threading.Thread(target=process_and_display_video)
    thread.start()
    return JSONResponse(content={"message": "Đang chạy xử lý video..."})