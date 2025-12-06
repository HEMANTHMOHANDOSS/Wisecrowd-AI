from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

class EventCreate(BaseModel):
    id: str
    name: str
    location_lat: float
    location_lng: float
    location_address: Optional[str] = None
    status: str = "scheduled"
    start_time: Optional[str] = None

class Event(EventCreate):
    attendees: int = 0
    risk_score: int = 0
    created_at: Optional[str] = None

class CameraRegister(BaseModel):
    id: str
    event_id: str
    name: str
    location: Optional[str] = None
    stream_url: Optional[str] = None
    capacity: int = 500
    coordinates_x: Optional[float] = None
    coordinates_y: Optional[float] = None

class Camera(CameraRegister):
    status: str = "offline"
    created_at: Optional[str] = None

class CrowdSample(BaseModel):
    event_id: str
    camera_id: Optional[str] = None
    timestamp: str
    count: int
    density: Optional[float] = None
    flow_rate: Optional[float] = None
    risk_score: Optional[float] = None
    metadata: Optional[Dict[str, Any]] = None

class Alert(BaseModel):
    id: str
    event_id: str
    camera_id: Optional[str] = None
    severity: str
    title: str
    message: str
    location: Optional[str] = None
    alert_type: Optional[str] = "density"
    resolved: bool = False
    timestamp: Optional[str] = None

class Job(BaseModel):
    id: str
    event_id: str
    camera_id: Optional[str] = None
    type: str
    status: str = "pending"
    progress: float = 0.0
    video_path: Optional[str] = None
    result: Optional[str] = None
    error: Optional[str] = None

class InferenceResult(BaseModel):
    camera_id: str
    timestamp: str
    frame_number: int
    count: int
    bboxes: List[Dict[str, Any]]
    heatmap: Optional[List[List[float]]] = None
    movement_vectors: Optional[List[Dict[str, Any]]] = None
    density: float
    metadata: Optional[Dict[str, Any]] = None

class MetricsResponse(BaseModel):
    event_id: str
    current_count: int
    peak_count: int
    average_count: float
    risk_score: float
    density: float
    flow_rate: float
    last_updated: str
    recent_samples: List[Dict[str, Any]]

class ForecastResponse(BaseModel):
    event_id: str
    current_count: int
    forecast_10min: int
    forecast_30min: int
    risk_score: float
    confidence: float
    trend: str
    timestamp: str

class WebSocketMessage(BaseModel):
    type: str
    data: Dict[str, Any]
    timestamp: str
