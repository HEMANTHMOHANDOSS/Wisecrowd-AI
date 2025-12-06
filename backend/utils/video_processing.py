import cv2
import numpy as np
from typing import Generator, Tuple, Optional
import tempfile
import os
from pathlib import Path

class VideoProcessor:
    def __init__(self, video_path: str):
        self.video_path = video_path
        self.cap = None
        self.fps = 0
        self.frame_count = 0
        self.width = 0
        self.height = 0

    def __enter__(self):
        self.cap = cv2.VideoCapture(self.video_path)
        if not self.cap.isOpened():
            raise ValueError(f"Cannot open video file: {self.video_path}")

        self.fps = int(self.cap.get(cv2.CAP_PROP_FPS))
        self.frame_count = int(self.cap.get(cv2.CAP_PROP_FRAME_COUNT))
        self.width = int(self.cap.get(cv2.CAP_PROP_FRAME_WIDTH))
        self.height = int(self.cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        if self.cap:
            self.cap.release()

    def extract_frames(self, skip_frames: int = 1) -> Generator[Tuple[int, np.ndarray], None, None]:
        frame_idx = 0
        while True:
            ret, frame = self.cap.read()
            if not ret:
                break

            if frame_idx % skip_frames == 0:
                yield frame_idx, frame

            frame_idx += 1

    def get_metadata(self) -> dict:
        return {
            'fps': self.fps,
            'total_frames': self.frame_count,
            'width': self.width,
            'height': self.height,
            'duration_seconds': self.frame_count / max(self.fps, 1)
        }

def save_uploaded_video(file_content: bytes, filename: str) -> str:
    upload_dir = Path("uploads")
    upload_dir.mkdir(exist_ok=True)

    safe_filename = "".join(c for c in filename if c.isalnum() or c in "._-")
    timestamp = int(np.random.random() * 1000000)
    final_filename = f"{timestamp}_{safe_filename}"

    filepath = upload_dir / final_filename
    with open(filepath, "wb") as f:
        f.write(file_content)

    return str(filepath)

def validate_video_file(filepath: str) -> bool:
    try:
        cap = cv2.VideoCapture(filepath)
        if not cap.isOpened():
            return False
        ret, _ = cap.read()
        cap.release()
        return ret
    except Exception:
        return False
