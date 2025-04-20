capture_dict = {}
frames = {} # {stream_name: frame}
urls_camera = {} # {url_input: stream_name}

THRESHOLD_PLATE = 0.5 # 50% confidence threshold for plate recognition

THRESHOLD_PLATE_CERTAIN = 0.85
THRESHOLD_NOHELMET_CERTAIN = 0.85