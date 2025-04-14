capture_dict = {}
frames = {} # {stream_name: frame}
urls_camera = {} # {url_input: stream_name}

THRESHOLD_PALATE = 0.5 # 50% confidence threshold for plate recognition