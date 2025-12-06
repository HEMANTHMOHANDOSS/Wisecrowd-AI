# Frontend Integration Guide

This guide shows how to integrate the real-time backend with your existing React/TypeScript frontend.

## Setup

### 1. Environment Variables

Create `.env.local` in the project root:

```env
VITE_BACKEND_URL=http://localhost:8000
GEMINI_API_KEY=your_gemini_api_key_here
```

### 2. Install Dependencies

The backend service and new components are already created. No additional npm packages are required.

### 3. Start Backend Server

```bash
cd backend
source venv/bin/activate  # or venv\Scripts\activate on Windows
python main_api.py
```

Server runs at `http://localhost:8000`

## Usage Examples

### Example 1: Video Upload with Job Monitoring

```tsx
import React, { useState } from 'react';
import VideoUploader from './components/VideoUploader';
import JobMonitor from './components/JobMonitor';

function MyComponent() {
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const eventId = 'evt-123';

  const handleUploadComplete = (jobId: string) => {
    setActiveJobId(jobId);
  };

  const handleJobComplete = (result: any) => {
    console.log('Processing complete:', result);
    // Update your state with real metrics
  };

  return (
    <div className="space-y-6">
      <VideoUploader
        eventId={eventId}
        cameraId="cam-upload"
        onUploadComplete={handleUploadComplete}
      />

      {activeJobId && (
        <JobMonitor
          jobId={activeJobId}
          onComplete={handleJobComplete}
        />
      )}
    </div>
  );
}
```

### Example 2: Live Camera Streaming

```tsx
import React, { useState } from 'react';
import LiveStreamingPanel from './components/LiveStreamingPanel';

function LiveMonitoring() {
  const [currentMetrics, setCurrentMetrics] = useState<any>(null);

  const handleMetricsUpdate = (metrics: any) => {
    setCurrentMetrics(metrics);
    console.log('Real-time metrics:', metrics);

    // Update your dashboard state
    // Trigger alerts if needed
  };

  return (
    <div>
      <LiveStreamingPanel
        eventId="evt-123"
        cameraId="live-cam-1"
        onMetricsUpdate={handleMetricsUpdate}
      />

      {currentMetrics && (
        <div className="mt-4 p-4 glass rounded-xl">
          <h3 className="font-bold text-white mb-2">Live Metrics</h3>
          <p className="text-slate-300">Count: {currentMetrics.count}</p>
          <p className="text-slate-300">Density: {currentMetrics.density}</p>
          <p className="text-slate-300">Risk: {currentMetrics.risk_score}</p>
        </div>
      )}
    </div>
  );
}
```

### Example 3: Fetch and Display Metrics

Replace mock data in your existing components:

```tsx
import { useEffect, useState } from 'react';
import { backendService } from './services/backendService';

function Dashboard({ eventId }: { eventId: string }) {
  const [metrics, setMetrics] = useState<any>(null);
  const [forecast, setForecast] = useState<any>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const metricsData = await backendService.getEventMetrics(eventId);
        const forecastData = await backendService.getEventForecast(eventId);

        setMetrics(metricsData);
        setForecast(forecastData);
      } catch (error) {
        console.error('Failed to load data:', error);
      }
    };

    loadData();

    // Refresh every 10 seconds
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, [eventId]);

  if (!metrics) return <div>Loading...</div>;

  return (
    <div className="grid grid-cols-3 gap-4">
      <div className="glass p-4 rounded-xl">
        <h3 className="text-sm text-slate-400">Current Count</h3>
        <p className="text-3xl font-bold text-white">{metrics.current_count}</p>
      </div>
      <div className="glass p-4 rounded-xl">
        <h3 className="text-sm text-slate-400">Risk Score</h3>
        <p className="text-3xl font-bold text-white">{metrics.risk_score.toFixed(1)}</p>
      </div>
      <div className="glass p-4 rounded-xl">
        <h3 className="text-sm text-slate-400">10min Forecast</h3>
        <p className="text-3xl font-bold text-white">{forecast?.forecast_10min || 0}</p>
      </div>
    </div>
  );
}
```

### Example 4: WebSocket for Real-Time Updates

```tsx
import { useEffect, useState } from 'react';
import { backendService } from './services/backendService';

function RealTimeMonitor({ eventId }: { eventId: string }) {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [liveMetrics, setLiveMetrics] = useState<any>(null);

  useEffect(() => {
    const ws = backendService.connectWebSocket(
      eventId,
      (message) => {
        if (message.type === 'metrics_update') {
          setLiveMetrics(message.data);
        } else if (message.type === 'alert') {
          setAlerts(prev => [message.data, ...prev]);
          // Play sound, show notification, etc.
        }
      },
      (error) => console.error('WebSocket error:', error),
      () => console.log('WebSocket closed')
    );

    return () => {
      backendService.disconnectWebSocket();
    };
  }, [eventId]);

  return (
    <div>
      {liveMetrics && (
        <div className="glass p-4 rounded-xl mb-4">
          <h3 className="font-bold text-white mb-2">Live Stream Data</h3>
          <p className="text-slate-300">People: {liveMetrics.count}</p>
          <p className="text-slate-300">Density: {liveMetrics.density} ppl/m²</p>
        </div>
      )}

      <div className="space-y-2">
        {alerts.map(alert => (
          <div key={alert.id} className="glass p-3 rounded-lg border border-red-500/20">
            <h4 className="font-bold text-red-400">{alert.title}</h4>
            <p className="text-sm text-slate-300">{alert.message}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

## Replacing Mock Data in Existing Components

### App.tsx - Replace Mock State

Before:
```tsx
const [metrics, setMetrics] = useState<CrowdMetric[]>(GENERATE_MOCK_METRICS());
```

After:
```tsx
const [metrics, setMetrics] = useState<CrowdMetric[]>([]);

useEffect(() => {
  const loadMetrics = async () => {
    if (!selectedEvent) return;

    const data = await backendService.getEventMetrics(selectedEvent.id);

    // Transform backend format to your existing CrowdMetric format
    const transformedMetrics = data.recent_samples.map(sample => ({
      time: new Date(sample.timestamp).toLocaleTimeString(),
      count: sample.count,
      density: sample.density,
      flowRate: sample.flow_rate,
      riskScore: sample.risk_score
    }));

    setMetrics(transformedMetrics);
  };

  loadMetrics();
  const interval = setInterval(loadMetrics, 5000);
  return () => clearInterval(interval);
}, [selectedEvent]);
```

### LiveFeed.tsx - Add Real Frame Processing

Add button to each camera feed:

```tsx
<button onClick={() => handleAnalyzeWithBackend(feed.id)}>
  Analyze with AI
</button>

const handleAnalyzeWithBackend = async (cameraId: string) => {
  // Get frame from camera feed image
  const response = await fetch(feed.imageUrl);
  const blob = await response.blob();

  // Convert to base64
  const reader = new FileReader();
  reader.onloadend = () => {
    const base64 = reader.result as string;

    // Send via WebSocket
    backendService.sendFrame(base64, cameraId, Date.now());
  };
  reader.readAsDataURL(blob);
};
```

### Analytics.tsx - Use Real Historical Data

```tsx
useEffect(() => {
  const loadHistoricalData = async () => {
    const metricsData = await backendService.getEventMetrics(eventId, 100);

    const chartData = metricsData.recent_samples.map(s => ({
      time: new Date(s.timestamp).toLocaleTimeString(),
      count: s.count,
      density: s.density,
      flowRate: s.flow_rate,
      riskScore: s.risk_score
    }));

    setData(chartData);
  };

  loadHistoricalData();
}, [eventId]);
```

## API Response Examples

### GET /api/event/{event_id}/metrics

```json
{
  "event_id": "evt-123",
  "current_count": 42,
  "peak_count": 58,
  "average_count": 35.5,
  "risk_score": 45.2,
  "density": 2.3,
  "flow_rate": 28.5,
  "last_updated": "2025-12-06T10:30:00Z",
  "recent_samples": [
    {
      "id": 1,
      "event_id": "evt-123",
      "camera_id": "cam-1",
      "timestamp": "2025-12-06T10:30:00Z",
      "count": 42,
      "density": 2.3,
      "flow_rate": 28.5,
      "risk_score": 45.2,
      "metadata": "{\"frame_width\": 1920, \"frame_height\": 1080}"
    }
  ]
}
```

### GET /api/event/{event_id}/forecast

```json
{
  "event_id": "evt-123",
  "current_count": 42,
  "forecast_10min": 48,
  "forecast_30min": 55,
  "risk_score": 52.3,
  "confidence": 0.85,
  "trend": "rising",
  "timestamp": "2025-12-06T10:30:00Z"
}
```

## Testing the Integration

1. **Start Backend**:
```bash
cd backend
python main_api.py
```

2. **Start Frontend**:
```bash
npm run dev
```

3. **Create Test Event**:
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

4. **Upload Test Video** via frontend VideoUploader component, or:
```bash
curl -X POST http://localhost:8000/api/upload-video \
  -F "file=@test_video.mp4" \
  -F "event_id=test-1"
```

5. **Monitor via WebSocket** - Use LiveStreamingPanel or RealTimeMonitor components

## Complete Integration Checklist

- [ ] Backend server running on port 8000
- [ ] Frontend .env.local configured with VITE_BACKEND_URL
- [ ] VideoUploader component added to admin/settings view
- [ ] LiveStreamingPanel component added to dashboard
- [ ] JobMonitor component connected to upload flow
- [ ] Replace mock metrics in App.tsx with backendService.getEventMetrics()
- [ ] Replace mock alerts with backendService.getEventAlerts()
- [ ] Add WebSocket connection for real-time updates
- [ ] Test video upload → processing → results flow
- [ ] Test live camera streaming → metrics → alerts flow

## Performance Tips

1. **Throttle WebSocket Messages**: Don't send frames faster than your backend can process
2. **Use Job System for Videos**: Large videos should always use upload + background processing
3. **Cache Metrics**: Store recent metrics in frontend state to reduce API calls
4. **Batch Updates**: Update UI in batches rather than on every metric update
5. **Implement Reconnection**: WebSocket can disconnect - handle reconnection gracefully

## Support

For issues or questions:
1. Check backend logs: `tail -f backend_logs.txt` (if configured)
2. Check browser console for frontend errors
3. Verify WebSocket connection in Network tab
4. Test API endpoints directly with curl/Postman
