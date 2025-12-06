# WiseCrowd AI - Quick Start Guide

Complete real-time crowd analysis system with live video processing, WebSocket streaming, and AI inference.

## 🚀 Quick Setup (5 minutes)

### Step 1: Backend Setup

```bash
# Navigate to backend
cd backend

# Run startup script (auto-installs dependencies)
# Linux/Mac:
bash start.sh

# Windows:
start.bat
```

Backend will be available at: `http://localhost:8000`
API Documentation: `http://localhost:8000/docs`

### Step 2: Frontend Setup

```bash
# In project root directory
cp .env.example .env.local

# Edit .env.local and add your Gemini API key:
# VITE_BACKEND_URL=http://localhost:8000
# GEMINI_API_KEY=your_api_key_here

# Install dependencies (if not already done)
npm install

# Start frontend
npm run dev
```

Frontend will be available at: `http://localhost:3000`

### Step 3: Test the System

```bash
# In a new terminal, run the API test suite
cd backend
source venv/bin/activate  # or venv\Scripts\activate on Windows
python test_api.py
```

## 📹 Usage Modes

### Mode 1: Upload Video for Analysis

1. Navigate to Admin Panel in the frontend
2. Use the **VideoUploader** component
3. Select a video file (MP4, MOV, AVI)
4. Click "Upload & Process"
5. Monitor progress in the **JobMonitor** component
6. View results in real-time via WebSocket updates

**Code Example**:
```tsx
<VideoUploader
  eventId="your-event-id"
  cameraId="upload-cam"
  onUploadComplete={(jobId) => console.log('Job started:', jobId)}
/>
```

### Mode 2: Live Camera Streaming

1. Add **LiveStreamingPanel** component to your dashboard
2. Click "Start Streaming"
3. Allow camera access when prompted
4. Frames are sent to backend every second
5. Receive real-time metrics, bounding boxes, and alerts

**Code Example**:
```tsx
<LiveStreamingPanel
  eventId="your-event-id"
  cameraId="live-cam-1"
  onMetricsUpdate={(metrics) => {
    console.log('People count:', metrics.count);
    console.log('Risk score:', metrics.risk_score);
  }}
/>
```

### Mode 3: Fetch Historical Data

Replace mock data with real backend data:

```tsx
import { backendService } from './services/backendService';

// Get current metrics
const metrics = await backendService.getEventMetrics(eventId);

// Get forecast
const forecast = await backendService.getEventForecast(eventId);

// Get alerts
const alerts = await backendService.getEventAlerts(eventId);
```

## 🔧 Configuration

### Alert Thresholds

Edit `backend/analytics/alerts.py`:

```python
'high_density': {'threshold': 4.0, 'severity': 'critical'}
'high_count': {'threshold': 100, 'severity': 'high'}
'high_risk_score': {'threshold': 75, 'severity': 'high'}
```

### Frame Processing Rate

Edit `backend/main_api.py` for live streaming:

```python
# Send 1 frame per second (adjust interval as needed)
intervalRef.current = setInterval(captureFrame, 1000);
```

Edit `backend/main_api.py` for video processing:

```python
# Process 2 frames per second from video
skip_frames = max(1, metadata['fps'] // 2)
```

### Using Real YOLO Model (Optional)

1. Install ONNX runtime:
```bash
pip install onnxruntime
```

2. Export YOLOv8 to ONNX:
```bash
pip install ultralytics
yolo export model=yolov8n.pt format=onnx
```

3. Update `backend/main_api.py`:
```python
from inference import RealYOLODetector
detector = RealYOLODetector(model_path='yolov8n.onnx', conf_threshold=0.5)
```

## 📊 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/events` | GET | List all events |
| `/api/events` | POST | Create new event |
| `/api/event/{id}/metrics` | GET | Get current metrics |
| `/api/event/{id}/forecast` | GET | Get 10min & 30min predictions |
| `/api/event/{id}/alerts` | GET | Get all alerts |
| `/api/camera/register` | POST | Register new camera |
| `/api/upload-video` | POST | Upload video for processing |
| `/api/jobs/{id}` | GET | Check job status |
| `/ws/event/{id}` | WS | Real-time WebSocket stream |

## 🧪 Test Commands

### Create Test Event
```bash
curl -X POST http://localhost:8000/api/events \
  -H "Content-Type: application/json" \
  -d '{
    "id": "test-1",
    "name": "Test Event",
    "location_lat": 13.0827,
    "location_lng": 80.2707,
    "location_address": "Chennai, India"
  }'
```

### Register Test Camera
```bash
curl -X POST http://localhost:8000/api/camera/register \
  -H "Content-Type: application/json" \
  -d '{
    "id": "cam-1",
    "event_id": "test-1",
    "name": "Main Gate Camera",
    "location": "Entrance",
    "capacity": 500
  }'
```

### Upload Video
```bash
curl -X POST http://localhost:8000/api/upload-video \
  -F "file=@test_video.mp4" \
  -F "event_id=test-1" \
  -F "camera_id=cam-1"
```

### Get Metrics
```bash
curl http://localhost:8000/api/event/test-1/metrics
```

## 🌐 WebSocket Testing

Use browser console or a WebSocket client:

```javascript
const ws = new WebSocket('ws://localhost:8000/ws/event/test-1');

ws.onopen = () => {
  console.log('Connected!');

  // Send a frame (base64 image)
  ws.send(JSON.stringify({
    type: 'frame',
    frame: 'data:image/jpeg;base64,...',
    camera_id: 'cam-1',
    frame_number: 1
  }));
};

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  console.log('Received:', message.type, message.data);
};
```

## 📂 Project Structure

```
project/
├── backend/
│   ├── main_api.py              # FastAPI application
│   ├── database.py              # SQLite with WAL mode
│   ├── models.py                # Pydantic models
│   ├── requirements.txt         # Python dependencies
│   ├── start.sh / start.bat     # Startup scripts
│   ├── test_api.py              # Test suite
│   ├── inference/
│   │   ├── detector.py          # YOLOv8 stub/real detector
│   │   ├── processor.py         # Frame processing pipeline
│   │   └── aggregator.py        # Metrics aggregation
│   ├── analytics/
│   │   ├── forecast.py          # Forecasting engine
│   │   └── alerts.py            # Alert rule engine
│   └── utils/
│       └── video_processing.py  # Video I/O utilities
│
├── services/
│   └── backendService.ts        # Frontend API client
│
├── components/
│   ├── VideoUploader.tsx        # Video upload UI
│   ├── LiveStreamingPanel.tsx   # Live camera streaming
│   └── JobMonitor.tsx           # Job progress tracking
│
└── BACKEND_INTEGRATION.md       # Detailed integration guide
```

## 🔍 Troubleshooting

### Backend won't start
- Check Python version: `python --version` (need 3.9+)
- Install dependencies manually: `pip install -r backend/requirements.txt`
- Check port 8000 is free: `lsof -i :8000` (Mac/Linux)

### WebSocket connection fails
- Ensure backend is running
- Check browser console for errors
- Verify VITE_BACKEND_URL in .env.local
- Try using `ws://` instead of `wss://` for local development

### Camera access denied
- Grant browser camera permissions
- Use HTTPS in production (required for getUserMedia)
- Test in Chrome/Firefox (best WebRTC support)

### Video upload fails
- Check file format (MP4, MOV, AVI supported)
- Verify video is not corrupted: `ffmpeg -i video.mp4`
- Check backend logs for detailed error

## 📚 Next Steps

1. **Production Deployment**:
   - Use Gunicorn/Uvicorn with multiple workers
   - Deploy backend on AWS/GCP/Azure
   - Use NGINX for reverse proxy
   - Enable HTTPS (required for camera access)

2. **Scale Performance**:
   - Replace SQLite with PostgreSQL
   - Add Redis for caching metrics
   - Use message queue (RabbitMQ) for video processing
   - Implement GPU acceleration for inference

3. **Advanced Features**:
   - Multi-camera aggregation
   - Heat map visualization
   - Historical trend analysis
   - Email/SMS alert notifications
   - Admin dashboard for rule configuration

## 📞 Support

- Backend API docs: `http://localhost:8000/docs`
- Frontend integration: See `BACKEND_INTEGRATION.md`
- Backend details: See `backend/README.md`

## ✅ System Capabilities

- ✅ Real-time video processing with AI inference
- ✅ Live camera streaming via WebSocket
- ✅ Background video processing with job queue
- ✅ People detection and counting
- ✅ Density and flow rate calculation
- ✅ Risk scoring and alerts
- ✅ 10min & 30min crowd forecasting
- ✅ Heatmap generation
- ✅ Movement vector tracking
- ✅ REST APIs for all operations
- ✅ WebSocket for real-time updates
- ✅ SQLite with WAL mode
- ✅ Frontend integration components
- ✅ Test suite included

Your system is now fully operational with real-time AI-powered crowd analysis!
