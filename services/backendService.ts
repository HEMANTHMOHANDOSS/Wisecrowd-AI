const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';

export interface BackendEvent {
  id: string;
  name: string;
  location_lat: number;
  location_lng: number;
  location_address: string;
  status: string;
  attendees: number;
  risk_score: number;
  start_time: string;
}

export interface BackendCamera {
  id: string;
  event_id: string;
  name: string;
  location: string;
  stream_url?: string;
  status: string;
  capacity: number;
  coordinates_x?: number;
  coordinates_y?: number;
}

export interface CrowdMetrics {
  event_id: string;
  current_count: number;
  peak_count: number;
  average_count: number;
  risk_score: number;
  density: number;
  flow_rate: number;
  last_updated: string;
  recent_samples: any[];
}

export interface ForecastData {
  event_id: string;
  current_count: number;
  forecast_10min: number;
  forecast_30min: number;
  risk_score: number;
  confidence: number;
  trend: string;
  timestamp: string;
}

class BackendService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;

  async fetchEvents(): Promise<BackendEvent[]> {
    const response = await fetch(`${API_BASE_URL}/api/events`);
    if (!response.ok) throw new Error('Failed to fetch events');
    return response.json();
  }

  async createEvent(event: Partial<BackendEvent>): Promise<BackendEvent> {
    const response = await fetch(`${API_BASE_URL}/api/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(event)
    });
    if (!response.ok) throw new Error('Failed to create event');
    return response.json();
  }

  async registerCamera(camera: Partial<BackendCamera>): Promise<BackendCamera> {
    const response = await fetch(`${API_BASE_URL}/api/camera/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(camera)
    });
    if (!response.ok) throw new Error('Failed to register camera');
    return response.json();
  }

  async getEventCameras(eventId: string): Promise<BackendCamera[]> {
    const response = await fetch(`${API_BASE_URL}/api/event/${eventId}/cameras`);
    if (!response.ok) throw new Error('Failed to fetch cameras');
    return response.json();
  }

  async getEventMetrics(eventId: string): Promise<CrowdMetrics> {
    const response = await fetch(`${API_BASE_URL}/api/event/${eventId}/metrics`);
    if (!response.ok) throw new Error('Failed to fetch metrics');
    return response.json();
  }

  async getEventForecast(eventId: string): Promise<ForecastData> {
    const response = await fetch(`${API_BASE_URL}/api/event/${eventId}/forecast`);
    if (!response.ok) throw new Error('Failed to fetch forecast');
    return response.json();
  }

  async uploadVideo(file: File, eventId: string, cameraId?: string): Promise<{ job_id: string; status: string }> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('event_id', eventId);
    if (cameraId) formData.append('camera_id', cameraId);

    const response = await fetch(`${API_BASE_URL}/api/upload-video`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) throw new Error('Failed to upload video');
    return response.json();
  }

  async getJobStatus(jobId: string): Promise<any> {
    const response = await fetch(`${API_BASE_URL}/api/jobs/${jobId}`);
    if (!response.ok) throw new Error('Failed to fetch job status');
    return response.json();
  }

  async getEventAlerts(eventId: string, resolved?: boolean): Promise<any[]> {
    let url = `${API_BASE_URL}/api/event/${eventId}/alerts`;
    if (resolved !== undefined) url += `?resolved=${resolved}`;

    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch alerts');
    return response.json();
  }

  async resolveAlert(alertId: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/alerts/${alertId}/resolve`, {
      method: 'POST'
    });
    if (!response.ok) throw new Error('Failed to resolve alert');
  }

  connectWebSocket(
    eventId: string,
    onMessage: (message: any) => void,
    onError?: (error: any) => void,
    onClose?: () => void
  ): WebSocket {
    const wsUrl = API_BASE_URL.replace('http', 'ws');
    this.ws = new WebSocket(`${wsUrl}/ws/event/${eventId}`);

    this.ws.onopen = () => {
      console.log('WebSocket connected to event:', eventId);
      this.reconnectAttempts = 0;
    };

    this.ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        onMessage(message);
      } catch (e) {
        console.error('Failed to parse WebSocket message:', e);
      }
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      if (onError) onError(error);
    };

    this.ws.onclose = () => {
      console.log('WebSocket closed');
      if (onClose) onClose();

      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        setTimeout(() => {
          console.log(`Reconnecting... Attempt ${this.reconnectAttempts}`);
          this.connectWebSocket(eventId, onMessage, onError, onClose);
        }, 2000 * this.reconnectAttempts);
      }
    };

    return this.ws;
  }

  sendFrame(frame: string, cameraId: string, frameNumber: number): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        type: 'frame',
        frame: frame,
        camera_id: cameraId,
        frame_number: frameNumber
      }));
    } else {
      console.warn('WebSocket is not connected');
    }
  }

  disconnectWebSocket(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  async captureFrameFromVideo(videoElement: HTMLVideoElement): Promise<string> {
    const canvas = document.createElement('canvas');
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Failed to get canvas context');

    ctx.drawImage(videoElement, 0, 0);
    return canvas.toDataURL('image/jpeg', 0.8);
  }
}

export const backendService = new BackendService();
