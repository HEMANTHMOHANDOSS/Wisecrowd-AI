import sqlite3
from contextlib import contextmanager
from typing import Generator
import json
from datetime import datetime

DATABASE_PATH = "crowdsafe.db"

def init_database():
    conn = sqlite3.connect(DATABASE_PATH)
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA synchronous=NORMAL")
    cursor = conn.cursor()

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS events (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        location_lat REAL NOT NULL,
        location_lng REAL NOT NULL,
        location_address TEXT,
        status TEXT DEFAULT 'scheduled',
        attendees INTEGER DEFAULT 0,
        risk_score INTEGER DEFAULT 0,
        start_time TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS cameras (
        id TEXT PRIMARY KEY,
        event_id TEXT NOT NULL,
        name TEXT NOT NULL,
        location TEXT,
        stream_url TEXT,
        status TEXT DEFAULT 'offline',
        capacity INTEGER DEFAULT 500,
        coordinates_x REAL,
        coordinates_y REAL,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS crowd_samples (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        event_id TEXT NOT NULL,
        camera_id TEXT,
        timestamp TEXT NOT NULL,
        count INTEGER NOT NULL,
        density REAL,
        flow_rate REAL,
        risk_score REAL,
        metadata TEXT,
        FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
        FOREIGN KEY (camera_id) REFERENCES cameras(id) ON DELETE CASCADE
    )
    """)

    cursor.execute("""
    CREATE INDEX IF NOT EXISTS idx_crowd_event_time
    ON crowd_samples(event_id, timestamp DESC)
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS jobs (
        id TEXT PRIMARY KEY,
        event_id TEXT NOT NULL,
        camera_id TEXT,
        type TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        progress REAL DEFAULT 0,
        video_path TEXT,
        result TEXT,
        error TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS alerts (
        id TEXT PRIMARY KEY,
        event_id TEXT NOT NULL,
        camera_id TEXT,
        severity TEXT NOT NULL,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        location TEXT,
        alert_type TEXT,
        resolved INTEGER DEFAULT 0,
        timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE
    )
    """)

    cursor.execute("""
    CREATE TABLE IF NOT EXISTS detections (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        camera_id TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        frame_number INTEGER,
        bboxes TEXT,
        heatmap TEXT,
        movement_vectors TEXT,
        metadata TEXT,
        FOREIGN KEY (camera_id) REFERENCES cameras(id) ON DELETE CASCADE
    )
    """)

    conn.commit()
    conn.close()
    print("Database initialized successfully with WAL mode")

@contextmanager
def get_db() -> Generator[sqlite3.Connection, None, None]:
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
        conn.commit()
    except Exception:
        conn.rollback()
        raise
    finally:
        conn.close()

def dict_from_row(row: sqlite3.Row) -> dict:
    return dict(zip(row.keys(), row))
