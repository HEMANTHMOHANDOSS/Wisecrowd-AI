import numpy as np
import cv2
from typing import List, Dict, Any, Tuple, Optional
from .detector import YOLODetector
import base64
from io import BytesIO
from PIL import Image

class FrameProcessor:
    def __init__(self, detector: YOLODetector, grid_size: Tuple[int, int] = (10, 10)):
        self.detector = detector
        self.grid_size = grid_size
        self.prev_detections = []
        self.frame_count = 0

    def decode_frame(self, frame_data: str) -> np.ndarray:
        if frame_data.startswith('data:image'):
            frame_data = frame_data.split(',')[1]

        img_bytes = base64.b64decode(frame_data)
        img = Image.open(BytesIO(img_bytes))
        frame = cv2.cvtColor(np.array(img), cv2.COLOR_RGB2BGR)
        return frame

    def generate_heatmap(self, detections: List[Dict[str, Any]], frame_shape: Tuple[int, int]) -> List[List[float]]:
        h, w = frame_shape
        grid_h, grid_w = self.grid_size
        heatmap = np.zeros((grid_h, grid_w), dtype=np.float32)

        cell_h = h / grid_h
        cell_w = w / grid_w

        for det in detections:
            x, y, box_w, box_h = det['bbox']
            center_x = (x + box_w / 2) * w
            center_y = (y + box_h / 2) * h

            grid_x = int(min(center_x / cell_w, grid_w - 1))
            grid_y = int(min(center_y / cell_h, grid_h - 1))

            heatmap[grid_y, grid_x] += 1.0

        max_val = np.max(heatmap)
        if max_val > 0:
            heatmap = heatmap / max_val

        return heatmap.tolist()

    def compute_movement_vectors(self, current_detections: List[Dict[str, Any]],
                                 prev_detections: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        if not prev_detections:
            return []

        vectors = []
        for curr in current_detections:
            curr_center = self._get_bbox_center(curr['bbox'])

            best_match = None
            min_dist = float('inf')

            for prev in prev_detections:
                prev_center = self._get_bbox_center(prev['bbox'])
                dist = np.linalg.norm(np.array(curr_center) - np.array(prev_center))

                if dist < min_dist and dist < 0.15:
                    min_dist = dist
                    best_match = prev

            if best_match:
                prev_center = self._get_bbox_center(best_match['bbox'])
                dx = curr_center[0] - prev_center[0]
                dy = curr_center[1] - prev_center[1]
                magnitude = np.sqrt(dx**2 + dy**2)

                if magnitude > 0.01:
                    vectors.append({
                        'start': prev_center,
                        'end': curr_center,
                        'magnitude': float(magnitude),
                        'direction': [float(dx), float(dy)]
                    })

        return vectors

    def _get_bbox_center(self, bbox: List[float]) -> Tuple[float, float]:
        x, y, w, h = bbox
        return (x + w / 2, y + h / 2)

    def compute_density(self, count: int, frame_shape: Tuple[int, int],
                       area_sq_meters: Optional[float] = None) -> float:
        if area_sq_meters is None:
            h, w = frame_shape
            pixels_per_meter = 100
            area_sq_meters = (h * w) / (pixels_per_meter ** 2)

        density = count / max(area_sq_meters, 1.0)
        return round(density, 2)

    def compute_flow_rate(self, movement_vectors: List[Dict[str, Any]],
                         time_delta: float = 1.0) -> float:
        if not movement_vectors:
            return 0.0

        avg_magnitude = np.mean([v['magnitude'] for v in movement_vectors])
        flow_rate = (avg_magnitude * len(movement_vectors)) / time_delta
        return round(flow_rate * 100, 2)

    def process_frame(self, frame: np.ndarray, camera_id: str,
                     frame_number: int) -> Dict[str, Any]:
        detections = self.detector.detect_people(frame)
        count = len(detections)

        h, w = frame.shape[:2]
        heatmap = self.generate_heatmap(detections, (h, w))

        movement_vectors = self.compute_movement_vectors(detections, self.prev_detections)
        self.prev_detections = detections

        density = self.compute_density(count, (h, w))
        flow_rate = self.compute_flow_rate(movement_vectors)

        risk_score = self._calculate_risk_score(count, density, flow_rate)

        result = {
            'camera_id': camera_id,
            'frame_number': frame_number,
            'count': count,
            'density': density,
            'flow_rate': flow_rate,
            'risk_score': risk_score,
            'bboxes': detections,
            'heatmap': heatmap,
            'movement_vectors': movement_vectors,
            'metadata': {
                'frame_width': w,
                'frame_height': h,
                'detection_confidence_avg': np.mean([d['confidence'] for d in detections]) if detections else 0.0
            }
        }

        self.frame_count += 1
        return result

    def _calculate_risk_score(self, count: int, density: float, flow_rate: float) -> float:
        count_risk = min(count / 50.0, 1.0) * 40
        density_risk = min(density / 5.0, 1.0) * 40
        flow_risk = max(0, (30 - flow_rate) / 30.0) * 20

        total_risk = count_risk + density_risk + flow_risk
        return round(min(total_risk, 100.0), 2)

    def reset(self):
        self.prev_detections = []
        self.frame_count = 0
