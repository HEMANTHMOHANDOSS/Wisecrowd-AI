
export interface CrowdMetric {
  time: string;
  count: number;
  density: number; // people per sq meter
  flowRate: number; // people per minute
  predictedCount?: number; // AI forecast
  riskScore: number; // 0-100
}

export interface CameraFeed {
  id: string;
  name: string;
  location: string;
  status: 'active' | 'offline' | 'warning';
  currentCount: number;
  capacity: number;
  imageUrl?: string; // Static snapshot
  streamUrl?: string; // MJPEG stream or HLS
  riskLevel: 'low' | 'moderate' | 'high' | 'critical';
  threshold?: number; // Alert threshold
  lastMaintenance?: string;
}

export interface Alert {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  timestamp: string; // ISO string from backend
  location: string;
  resolved: boolean;
  type: 'density' | 'flow' | 'anomaly' | 'system';
}

export enum ViewState {
  LOGIN = 'LOGIN',
  GLOBAL_MAP = 'GLOBAL_MAP',
  DASHBOARD = 'DASHBOARD',
  MAP = 'MAP',
  ANALYTICS = 'ANALYTICS',
  ALERTS = 'ALERTS',
  ADMIN = 'ADMIN',
  SETTINGS = 'SETTINGS',
}

export interface VenueZone {
  id: string;
  name: string;
  capacity: number;
  occupancy: number;
  coordinates: { x: number; y: number; width: number; height: number };
  status: 'safe' | 'warning' | 'critical';
}

export interface Detection {
  id: number;
  x: number; // Percentage 0-100
  y: number; // Percentage 0-100
  w: number; // Percentage 0-100
  h: number; // Percentage 0-100
  label: string;
  confidence: number;
  color: string;
}

export interface SafeRoute {
  id: string;
  fromZone: string;
  toExit: string;
  pathCoordinates: string; // SVG path d
  status: 'recommended' | 'congested';
}

export interface SoundSettings {
  enabled: boolean;
  volume: number; // 0.0 to 1.0
}

export type UserRole = 'admin' | 'viewer';

export interface User {
  id: string;
  username: string;
  password?: string; // For mock auth only
  role: UserRole;
  email: string;
  status: 'active' | 'inactive';
  lastLogin?: string;
}

export interface TimeRange {
  label: string;
  value: '1h' | '24h' | '7d' | '30d';
}

export interface Event {
  id: string;
  name: string;
  location: { lat: number; lng: number; address: string };
  status: 'active' | 'scheduled' | 'ended';
  attendees: number;
  riskScore: number;
  thumbnail?: string;
  startTime: string;
}

export interface SystemState {
  metrics: CrowdMetric[];
  feeds: CameraFeed[];
  zones: VenueZone[];
  alerts: Alert[];
  detections: Record<string, Detection[]>;
}
