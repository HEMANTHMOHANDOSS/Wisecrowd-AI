from fastapi import FastAPI, WebSocket, WebSocketDisconnect, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, List, Optional
import json
import asyncio
from datetime import datetime
import uuid

from database import init_database, get_db, dict_from_row
from models import (
    Event, EventCreate, Camera, CameraRegister, CrowdSample,
    Alert, Job, MetricsResponse, ForecastResponse, WebSocketMessage
)
from inference import YOLODetector, FrameProcessor, MetricsAggregator
from analytics.forecast import SimpleForecastEngine
from analytics.alerts import AlertRuleEngine
from utils.video_processing import VideoProcessor, save_uploaded_video, validate_video_file

app = FastAPI(title="WiseCrowd AI Backend", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

detector = YOLODetector(conf_threshold=0.5)
forecast_engine = SimpleForecastEngine()
alert_engine = AlertRuleEngine()

active_connections: Dict[str, List[WebSocket]] = {}
event_processors: Dict[str, FrameProcessor] = {}
event_aggregators: Dict[str, MetricsAggregator] = {}

@app.on_event("startup")
async def startup_event():
    init_database()
    print("WiseCrowd AI Backend Started")

@app.get("/")
async def root():
    return {
        "service": "WiseCrowd AI Backend",
        "version": "1.0.0",
        "status": "operational"
    }

@app.post("/api/events", response_model=Event)
async def create_event(event: EventCreate):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO events (id, name, location_lat, location_lng, location_address, status, start_time)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (event.id, event.name, event.location_lat, event.location_lng,
              event.location_address, event.status, event.start_time))

        cursor.execute("SELECT * FROM events WHERE id = ?", (event.id,))
        row = cursor.fetchone()
        return dict_from_row(row)

@app.get("/api/events", response_model=List[Event])
async def list_events():
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM events ORDER BY created_at DESC")
        rows = cursor.fetchall()
        return [dict_from_row(row) for row in rows]

@app.get("/api/events/{event_id}", response_model=Event)
async def get_event(event_id: str):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM events WHERE id = ?", (event_id,))
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Event not found")
        return dict_from_row(row)

@app.post("/api/camera/register", response_model=Camera)
async def register_camera(camera: CameraRegister):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO cameras (id, event_id, name, location, stream_url, capacity,
                               coordinates_x, coordinates_y, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active')
        """, (camera.id, camera.event_id, camera.name, camera.location,
              camera.stream_url, camera.capacity, camera.coordinates_x, camera.coordinates_y))

        cursor.execute("SELECT * FROM cameras WHERE id = ?", (camera.id,))
        row = cursor.fetchone()
        return dict_from_row(row)

@app.get("/api/event/{event_id}/cameras", response_model=List[Camera])
async def get_event_cameras(event_id: str):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM cameras WHERE event_id = ?", (event_id,))
        rows = cursor.fetchall()
        return [dict_from_row(row) for row in rows]

@app.get("/api/event/{event_id}/metrics", response_model=MetricsResponse)
async def get_event_metrics(event_id: str, limit: int = 20):
    with get_db() as conn:
        cursor = conn.cursor()

        cursor.execute("""
            SELECT * FROM crowd_samples
            WHERE event_id = ?
            ORDER BY timestamp DESC
            LIMIT ?
        """, (event_id, limit))
        samples = [dict_from_row(row) for row in cursor.fetchall()]

        if not samples:
            return {
                'event_id': event_id,
                'current_count': 0,
                'peak_count': 0,
                'average_count': 0.0,
                'risk_score': 0.0,
                'density': 0.0,
                'flow_rate': 0.0,
                'last_updated': datetime.utcnow().isoformat(),
                'recent_samples': []
            }

        counts = [s['count'] for s in samples]
        densities = [s.get('density', 0) for s in samples]
        flow_rates = [s.get('flow_rate', 0) for s in samples]
        risk_scores = [s.get('risk_score', 0) for s in samples]

        return {
            'event_id': event_id,
            'current_count': counts[0] if counts else 0,
            'peak_count': max(counts) if counts else 0,
            'average_count': round(sum(counts) / len(counts), 2) if counts else 0.0,
            'risk_score': round(sum(risk_scores) / len(risk_scores), 2) if risk_scores else 0.0,
            'density': round(sum(densities) / len(densities), 2) if densities else 0.0,
            'flow_rate': round(sum(flow_rates) / len(flow_rates), 2) if flow_rates else 0.0,
            'last_updated': samples[0]['timestamp'] if samples else datetime.utcnow().isoformat(),
            'recent_samples': samples[:10]
        }

@app.get("/api/event/{event_id}/forecast", response_model=ForecastResponse)
async def get_event_forecast(event_id: str):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            SELECT * FROM crowd_samples
            WHERE event_id = ?
            ORDER BY timestamp DESC
            LIMIT 50
        """, (event_id,))
        samples = [dict_from_row(row) for row in cursor.fetchall()]

        if not samples:
            return {
                'event_id': event_id,
                'current_count': 0,
                'forecast_10min': 0,
                'forecast_30min': 0,
                'risk_score': 0.0,
                'confidence': 0.0,
                'trend': 'stable',
                'timestamp': datetime.utcnow().isoformat()
            }

        current_count = samples[0]['count']
        current_density = samples[0].get('density', 0)

        forecast_10 = forecast_engine.exponential_smoothing_forecast(samples, minutes_ahead=10)
        forecast_30 = forecast_engine.exponential_smoothing_forecast(samples, minutes_ahead=30)
        trend = forecast_engine.get_trend_analysis(samples)

        risk_score = forecast_engine.calculate_risk_score(
            current_count, forecast_10['forecast'], current_density
        )

        return {
            'event_id': event_id,
            'current_count': current_count,
            'forecast_10min': forecast_10['forecast'],
            'forecast_30min': forecast_30['forecast'],
            'risk_score': risk_score,
            'confidence': forecast_10['confidence'],
            'trend': trend,
            'timestamp': datetime.utcnow().isoformat()
        }

@app.post("/api/upload-video")
async def upload_video(
    file: UploadFile = File(...),
    event_id: str = None,
    camera_id: str = None,
    background_tasks: BackgroundTasks = None
):
    if not event_id:
        raise HTTPException(status_code=400, detail="event_id is required")

    content = await file.read()
    filepath = save_uploaded_video(content, file.filename)

    if not validate_video_file(filepath):
        raise HTTPException(status_code=400, detail="Invalid video file")

    job_id = str(uuid.uuid4())

    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO jobs (id, event_id, camera_id, type, status, video_path)
            VALUES (?, ?, ?, 'video_processing', 'pending', ?)
        """, (job_id, event_id, camera_id, filepath))

    background_tasks.add_task(process_video_job, job_id, event_id, camera_id or f"upload_{job_id[:8]}", filepath)

    return {
        'job_id': job_id,
        'status': 'pending',
        'message': 'Video uploaded successfully. Processing started.'
    }

@app.get("/api/jobs/{job_id}")
async def get_job_status(job_id: str):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM jobs WHERE id = ?", (job_id,))
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Job not found")
        return dict_from_row(row)

@app.get("/api/event/{event_id}/alerts", response_model=List[Alert])
async def get_event_alerts(event_id: str, resolved: Optional[bool] = None):
    with get_db() as conn:
        cursor = conn.cursor()
        if resolved is None:
            cursor.execute("""
                SELECT * FROM alerts WHERE event_id = ? ORDER BY timestamp DESC
            """, (event_id,))
        else:
            cursor.execute("""
                SELECT * FROM alerts WHERE event_id = ? AND resolved = ? ORDER BY timestamp DESC
            """, (event_id, 1 if resolved else 0))
        rows = cursor.fetchall()
        return [dict_from_row(row) for row in rows]

@app.post("/api/alerts/{alert_id}/resolve")
async def resolve_alert(alert_id: str):
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("UPDATE alerts SET resolved = 1 WHERE id = ?", (alert_id,))
        if cursor.rowcount == 0:
            raise HTTPException(status_code=404, detail="Alert not found")
        return {"message": "Alert resolved successfully"}

@app.websocket("/ws/event/{event_id}")
async def websocket_event_stream(websocket: WebSocket, event_id: str):
    await websocket.accept()

    if event_id not in active_connections:
        active_connections[event_id] = []
    active_connections[event_id].append(websocket)

    if event_id not in event_processors:
        event_processors[event_id] = FrameProcessor(detector)
    if event_id not in event_aggregators:
        event_aggregators[event_id] = MetricsAggregator()

    try:
        await websocket.send_json({
            'type': 'connected',
            'data': {'event_id': event_id, 'message': 'Connected to real-time stream'},
            'timestamp': datetime.utcnow().isoformat()
        })

        while True:
            data = await websocket.receive_json()
            message_type = data.get('type')

            if message_type == 'frame':
                await handle_frame_message(event_id, data, websocket)
            elif message_type == 'ping':
                await websocket.send_json({
                    'type': 'pong',
                    'timestamp': datetime.utcnow().isoformat()
                })

    except WebSocketDisconnect:
        active_connections[event_id].remove(websocket)
        if not active_connections[event_id]:
            del active_connections[event_id]

async def handle_frame_message(event_id: str, data: dict, websocket: WebSocket):
    try:
        frame_data = data.get('frame')
        camera_id = data.get('camera_id', 'live_stream')
        frame_number = data.get('frame_number', 0)

        processor = event_processors[event_id]
        aggregator = event_aggregators[event_id]

        frame = processor.decode_frame(frame_data)

        result = processor.process_frame(frame, camera_id, frame_number)

        sample = {
            'event_id': event_id,
            'camera_id': camera_id,
            'timestamp': datetime.utcnow().isoformat(),
            'count': result['count'],
            'density': result['density'],
            'flow_rate': result['flow_rate'],
            'risk_score': result['risk_score'],
            'metadata': json.dumps(result['metadata'])
        }

        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO crowd_samples (event_id, camera_id, timestamp, count,
                                         density, flow_rate, risk_score, metadata)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (sample['event_id'], sample['camera_id'], sample['timestamp'],
                  sample['count'], sample['density'], sample['flow_rate'],
                  sample['risk_score'], sample['metadata']))

            cursor.execute("""
                UPDATE events SET attendees = ?, risk_score = ?
                WHERE id = ?
            """, (result['count'], int(result['risk_score']), event_id))

        aggregator.add_sample(result)

        await broadcast_to_event(event_id, {
            'type': 'metrics_update',
            'data': {
                'count': result['count'],
                'density': result['density'],
                'flow_rate': result['flow_rate'],
                'risk_score': result['risk_score'],
                'bboxes': result['bboxes'][:10],
                'heatmap': result['heatmap'],
                'camera_id': camera_id
            },
            'timestamp': datetime.utcnow().isoformat()
        })

        alert_check = aggregator.should_alert(threshold=80, density_threshold=4.0)
        if alert_check['should_alert']:
            alert_data = {
                'id': str(uuid.uuid4()),
                'event_id': event_id,
                'camera_id': camera_id,
                'severity': alert_check['severity'],
                'title': f"{alert_check['severity'].upper()} Alert",
                'message': ' | '.join(alert_check['reasons']),
                'location': camera_id,
                'alert_type': 'real_time',
                'resolved': False,
                'timestamp': datetime.utcnow().isoformat()
            }

            with get_db() as conn:
                cursor = conn.cursor()
                cursor.execute("""
                    INSERT INTO alerts (id, event_id, camera_id, severity, title,
                                      message, location, alert_type, resolved, timestamp)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (alert_data['id'], alert_data['event_id'], alert_data['camera_id'],
                      alert_data['severity'], alert_data['title'], alert_data['message'],
                      alert_data['location'], alert_data['alert_type'],
                      1 if alert_data['resolved'] else 0, alert_data['timestamp']))

            await broadcast_to_event(event_id, {
                'type': 'alert',
                'data': alert_data,
                'timestamp': datetime.utcnow().isoformat()
            })

    except Exception as e:
        print(f"Error processing frame: {str(e)}")
        await websocket.send_json({
            'type': 'error',
            'data': {'message': str(e)},
            'timestamp': datetime.utcnow().isoformat()
        })

async def broadcast_to_event(event_id: str, message: dict):
    if event_id in active_connections:
        disconnected = []
        for connection in active_connections[event_id]:
            try:
                await connection.send_json(message)
            except:
                disconnected.append(connection)

        for conn in disconnected:
            active_connections[event_id].remove(conn)

async def process_video_job(job_id: str, event_id: str, camera_id: str, video_path: str):
    try:
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                UPDATE jobs SET status = 'processing', updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            """, (job_id,))

        processor = FrameProcessor(detector)
        aggregator = MetricsAggregator()

        with VideoProcessor(video_path) as vp:
            metadata = vp.get_metadata()
            total_frames = metadata['total_frames']
            skip_frames = max(1, metadata['fps'] // 2)

            processed_frames = 0
            for frame_idx, frame in vp.extract_frames(skip_frames=skip_frames):
                result = processor.process_frame(frame, camera_id, frame_idx)

                sample = {
                    'event_id': event_id,
                    'camera_id': camera_id,
                    'timestamp': datetime.utcnow().isoformat(),
                    'count': result['count'],
                    'density': result['density'],
                    'flow_rate': result['flow_rate'],
                    'risk_score': result['risk_score'],
                    'metadata': json.dumps(result['metadata'])
                }

                with get_db() as conn:
                    cursor = conn.cursor()
                    cursor.execute("""
                        INSERT INTO crowd_samples (event_id, camera_id, timestamp, count,
                                                 density, flow_rate, risk_score, metadata)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    """, (sample['event_id'], sample['camera_id'], sample['timestamp'],
                          sample['count'], sample['density'], sample['flow_rate'],
                          sample['risk_score'], sample['metadata']))

                aggregator.add_sample(result)

                processed_frames += 1
                progress = (processed_frames * skip_frames / total_frames) * 100

                if processed_frames % 10 == 0:
                    with get_db() as conn:
                        cursor = conn.cursor()
                        cursor.execute("""
                            UPDATE jobs SET progress = ?, updated_at = CURRENT_TIMESTAMP
                            WHERE id = ?
                        """, (min(progress, 99), job_id))

                    await broadcast_to_event(event_id, {
                        'type': 'job_progress',
                        'data': {
                            'job_id': job_id,
                            'progress': min(progress, 99),
                            'metrics': aggregator.get_current_metrics()
                        },
                        'timestamp': datetime.utcnow().isoformat()
                    })

                await asyncio.sleep(0.01)

        final_metrics = aggregator.get_current_metrics()

        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                UPDATE jobs SET status = 'completed', progress = 100,
                               result = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            """, (json.dumps(final_metrics), job_id))

            cursor.execute("""
                UPDATE events SET attendees = ?, risk_score = ?
                WHERE id = ?
            """, (final_metrics['peak_count'], int(final_metrics['risk_score']), event_id))

        await broadcast_to_event(event_id, {
            'type': 'job_completed',
            'data': {
                'job_id': job_id,
                'metrics': final_metrics
            },
            'timestamp': datetime.utcnow().isoformat()
        })

    except Exception as e:
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                UPDATE jobs SET status = 'failed', error = ?, updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            """, (str(e), job_id))

        await broadcast_to_event(event_id, {
            'type': 'job_failed',
            'data': {
                'job_id': job_id,
                'error': str(e)
            },
            'timestamp': datetime.utcnow().isoformat()
        })

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
