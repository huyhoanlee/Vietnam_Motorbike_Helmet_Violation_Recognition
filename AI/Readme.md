# 🤖 AI API with FastAPI

This project provides a simple AI-powered API built using **FastAPI**. It is designed to expose AI model inference endpoints via RESTful APIs. The main application logic resides in `app.py`, and the server is run using **Uvicorn**.

---

## 🚀 Features

- 🧠 AI model inference endpoint (with stream url)
- ⚡ Streaming detected frames
- 🌐 Send detected results to Backend

---

## 📦 Requirements

- Python 3.8 or higher  
- pip (Python package installer)  
- (Optional) virtualenv  

Install dependencies:

```bash
pip install -r requirements.txt
```

---

## ⚙️ Installation & Running

### 1. Clone the repository

```bash
git clone https://github.com/huyhoanlee/Vietnam_Motorbike_Helmet_Violation_Recognition.git
cd AI
```

### 2. Create virtual environment (optional but recommended)

```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Run the application

```bash
uvicorn app:app --reload
```

Access API docs at: [http://localhost:8000/docs](http://localhost:8000/docs)

---

## 📁 Project Structure

```bash
AI/
├── app.py               # Main FastAPI app
├── src/                 # AI/ML models and logic
│   ├── config
│   ├── extractors       # Extract license plate information module
│   ├── models           # Models weights
│   ├── modules          # Components in the system
│   ├── services         # Stream services
│   └── utils.py
├── requirements.txt     # Python dependencies
├── Readme.md            # Project documentation
└── .env                 # Environment variables (optional)
```

---

## ▶️ Example Usage

### 🔗 1. Push a New Stream URL

Add a video stream URL to start processing.

**Request:**

```bash
curl -X POST "http://localhost:8000/push_url" \
     -F "url=https://your-stream-url"
```

**Response:**

```json
{
  "message": "URL added",
  "urls": {
    "rtsp://your-stream-url": "a343sd"
  },
  "url": "http://localhost:8000/stream/a343sd"
}
```

---

### ❌ 2. Delete a Stream URL

Remove a previously added URL.

**Request:**

```bash
curl -X POST "http://localhost:8000/delete_url" \
     -F "url=https://your-stream-url"
```

**Response:**

```json
{
  "message": "URL removed",
  "urls": {}
}
```

---

### 📋 3. Get All Active Stream URLs

Retrieve currently tracked stream URLs.

**Request:**

```bash
curl -X GET "http://localhost:8000/get_url"
```

**Response:**

```json
{
  "https://your-stream-url": "a343sd"
}
```

---

### 🎥 4. Stream Video Feed

Access the video stream from a specific `id`.

**Request:**

Visit in browser or video client:

```
http://localhost:8000/stream/a343sd
```

> ⚠️ This returns a `multipart/x-mixed-replace` stream, viewable in browsers or tools that support MJPEG (e.g., VLC).
