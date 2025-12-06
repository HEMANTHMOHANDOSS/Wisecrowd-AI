# WiseCrowd AI Backend - Real-Time Crowd Analysis System

Complete FastAPI backend with Python AI inference for real-time video processing and crowd analytics.

## Features

- **Real-time Video Processing**: Live frame-by-frame analysis with WebSocket streaming
- **Video Upload Mode**: Background processing of uploaded videos with job management
- **AI Inference**: YOLOv8-based people detection with configurable models
- **Analytics Engine**: Forecasting, risk scoring, and alert generation
- **SQLite Database**: WAL mode for concurrent access, full CRUD operations
- **WebSocket Broadcasting**: Real-time metrics and alerts to all subscribers
- **REST APIs**: Complete CRUD for events, cameras, metrics, and jobs

## Architecture

```
backend/
├── main_api.py              # FastAPI application with REST + WebSocket endpoints
├── database.py              # SQLite setup with WAL mode
├── models.py                # Pydantic models for API validation
├── inference/
│   ├── detector.py          # YOLOv8 stub detector (replaceable with ONNX model)
│   ├── processor.py         # Frame processing, heatmaps, movement vectors
│   └── aggregator.py        # Metrics aggregation and time-series analysis
├── analytics/
│   ├── forecast.py          # Forecasting engine (EWMA, moving average)
│   └── alerts.py            # Alert rule engine with thresholds
└── utils/
    └── video_processing.py  # Video I/O, frame extraction
```

## Installation

### Prerequisites
- Python 3.9+
- pip

### Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Initialize database
python -c "from database import init_database; init_database()"

# Run server
python main_api.py
```

Server will start at `http://localhost:8000`

## API Endpoints

### Events
- `POST /api/events` - Create new event
- `GET /api/events` - List all events
- `GET /api/events/{event_id}` - Get specific event

### Cameras
- `POST /api/camera/register` - Register camera with stream URL
- `GET /api/event/{event_id}/cameras` - List cameras for event

### Metrics
- `GET /api/event/{event_id}/metrics` - Get real-time metrics
- `GET /api/event/{event_id}/forecast` - Get 10min & 30min forecasts

### Video Upload
- `POST /api/upload-video` - Upload video file (multipart/form-data)
  - Parameters: `file`, `event_id`, `camera_id` (optional)
  - Returns: `job_id`

### Jobs
- `GET /api/jobs/{job_id}` - Check job status and progress

### Alerts
- `GET /api/event/{event_id}/alerts` - Get alerts (filter by resolved status)
- `POST /api/alerts/{alert_id}/resolve` - Mark alert as resolved

### WebSocket
- `WS /ws/event/{event_id}` - Real-time bidirectional communication

## WebSocket Protocol

### Client → Server

**Send Frame for Processing**:
```json
{
  "type": "frame",
  "frame": "data:image/jpeg;base64,...",
  "camera_id": "cam-1",
  "frame_number": 42
}
```

**Ping**:
```json
{
  "type": "ping"
}
```

### Server → Client

**Connection Confirmation**:
```json
{
  "type": "connected",
  "data": {
    "event_id": "evt-1",
    "message": "Connected to real-time stream"
  },
  "timestamp": "2025-12-06T10:30:00Z"
}
```

**Metrics Update** (sent after each frame processed):
```json
{
  "type": "metrics_update",
  "data": {
    "count": 42,
    "density": 2.5,
    "flow_rate": 35.2,
    "risk_score": 45.3,
    "bboxes": [...],
    "heatmap": [[...]],
    "camera_id": "cam-1"
  },
  "timestamp": "2025-12-06T10:30:01Z"
}
```

**Alert** (sent when thresholds exceeded):
```json
{
  "type": "alert",
  "data": {
    "id": "alert-uuid",
    "event_id": "evt-1",
    "severity": "high",
    "title": "High Crowd Count",
    "message": "Crowd count reached 150 people in Main Gate",
    "location": "Main Gate"
  },
  "timestamp": "2025-12-06T10:30:05Z"
}
```

**Job Progress** (video upload processing):
```json
{
  "type": "job_progress",
  "data": {
    "job_id": "job-uuid",
    "progress": 65.5,
    "metrics": {
      "current_count": 38,
      "peak_count": 52
    }
  },
  "timestamp": "2025-12-06T10:30:10Z"
}
```

## Database Schema

### Tables

**events**
- `id` (TEXT, PRIMARY KEY)
- `name`, `location_lat`, `location_lng`, `location_address`
- `status` (scheduled/active/ended)
- `attendees`, `risk_score`, `start_time`, `created_at`

**cameras**
- `id` (TEXT, PRIMARY KEY)
- `event_id` (FK → events)
- `name`, `location`, `stream_url`, `status`, `capacity`
- `coordinates_x`, `coordinates_y`, `created_at`

**crowd_samples**
- `id` (INTEGER, AUTOINCREMENT)
- `event_id` (FK → events), `camera_id` (FK → cameras)
- `timestamp`, `count`, `density`, `flow_rate`, `risk_score`
- `metadata` (JSON)

**jobs**
- `id` (TEXT, PRIMARY KEY)
- `event_id` (FK → events), `camera_id`, `type`, `status`, `progress`
- `video_path`, `result` (JSON), `error`, `created_at`, `updated_at`

**alerts**
- `id` (TEXT, PRIMARY KEY)
- `event_id` (FK → events), `camera_id`, `severity`, `title`, `message`
- `location`, `alert_type`, `resolved`, `timestamp`

## Configuration

### Alert Thresholds
Edit `analytics/alerts.py`:
```python
'high_density': {'threshold': 4.0, 'severity': 'critical'}
'high_count': {'threshold': 100, 'severity': 'high'}
'high_risk_score': {'threshold': 75, 'severity': 'high'}
```

### Using Real ONNX Model
Replace stub detector in `main_api.py`:
```python
from inference import RealYOLODetector
detector = RealYOLODetector(model_path='yolov8n.onnx', conf_threshold=0.5)
```

Requires:
```bash
pip install onnxruntime
```

Download YOLOv8 ONNX model:
```bash
pip install ultralytics
yolo export model=yolov8n.pt format=onnx
```

## Performance Optimization

### Frame Skipping (Video Upload)
Adjust in `process_video_job()`:
```python
skip_frames = max(1, metadata['fps'] // 2)  # Process 2 FPS from source
```

### Batch Processing
Implement in `FrameProcessor`:
```python
results = detector.detect_batch([frame1, frame2, frame3])
```

### Database Optimization
SQLite is configured with WAL mode. For high-throughput scenarios, consider:
- PostgreSQL for concurrent writes
- Redis for real-time metrics caching
- Message queue (RabbitMQ/Redis) for job processing

## Testing

```bash
# Test event creation
curl -X POST http://localhost:8000/api/events \
  -H "Content-Type: application/json" \
  -d '{
    "id": "test-event-1",
    "name": "Test Event",
    "location_lat": 40.7128,
    "location_lng": -74.0060,
    "location_address": "New York, NY"
  }'

# Test video upload
curl -X POST http://localhost:8000/api/upload-video \
  -F "file=@test_video.mp4" \
  -F "event_id=test-event-1"

# Get metrics
curl http://localhost:8000/api/event/test-event-1/metrics

# Get forecast
curl http://localhost:8000/api/event/test-event-1/forecast
```

## Deployment

### Production Setup
```bash
# Install production server
pip install gunicorn

# Run with workers
gunicorn main_api:app -w 4 -k uvicorn.workers.UvicornWorker -b 0.0.0.0:8000
```

### Docker
```dockerfile
FROM python:3.9-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY . .
CMD ["uvicorn", "main_api:app", "--host", "0.0.0.0", "--port", "8000"]
```

## Troubleshooting

**Database locked error**:
- WAL mode should prevent this. Ensure database is initialized correctly.

**WebSocket disconnects**:
- Check firewall/proxy settings
- Increase timeout in Uvicorn: `uvicorn main_api:app --timeout-keep-alive 300`

**Out of memory during video processing**:
- Increase frame skipping
- Process videos in chunks
- Use lower resolution input

## License
MIT
