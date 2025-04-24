import subprocess

def start_rtsp_stream(stream_name: str, input_url: str):
    output_file = f"/tmp/{stream_name}.m3u8"
    command = [
        "ffmpeg", "-re", "-i", input_url,
        "-c:v", "libx264", "-preset", "ultrafast",
        "-f", "hls", "-hls_time", "2", "-hls_list_size", "3",
        "-hls_segment_filename", f"/tmp/{stream_name}_%03d.ts",
        output_file
    
    ]
    process = subprocess.Popen(command, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    return process
    
def update_rtsp_stream(output_url: str, frame):
    process = subprocess.Popen(
        ["ffmpeg", "-y", "-f", "rawvideo", "-pix_fmt", "bgr24", "-s", "640x480",
         "-i", "-", "-c:v", "libx264", "-f", "rtsp", output_url
        ],
        stdin=subprocess.PIPE
    )
    process.stdin.write(frame)
    process.stdin.close()

def stop_rtsp_stream(process):
    if process:
        process.terminate()
        process.wait(timeout=5)