import numpy as np
import cv2
from typing import List, Dict, Tuple, Any
import time

class YOLODetector:
    def __init__(self, conf_threshold: float = 0.5, nms_threshold: float = 0.4):
        self.conf_threshold = conf_threshold
        self.nms_threshold = nms_threshold
        self.input_size = (640, 640)
        print("YOLOv8 Detector initialized (stub mode)")

    def preprocess(self, frame: np.ndarray) -> np.ndarray:
        frame_resized = cv2.resize(frame, self.input_size)
        frame_rgb = cv2.cvtColor(frame_resized, cv2.COLOR_BGR2RGB)
        frame_normalized = frame_rgb.astype(np.float32) / 255.0
        frame_transposed = np.transpose(frame_normalized, (2, 0, 1))
        frame_batch = np.expand_dims(frame_transposed, axis=0)
        return frame_batch

    def detect_people(self, frame: np.ndarray) -> List[Dict[str, Any]]:
        start_time = time.time()
        h, w = frame.shape[:2]

        detections = []
        num_people = np.random.randint(5, 25)

        for i in range(num_people):
            x = np.random.randint(50, w - 150)
            y = np.random.randint(50, h - 200)
            bbox_w = np.random.randint(40, 80)
            bbox_h = np.random.randint(100, 180)

            x_norm = x / w
            y_norm = y / h
            w_norm = bbox_w / w
            h_norm = bbox_h / h

            confidence = np.random.uniform(self.conf_threshold, 0.95)

            detections.append({
                'bbox': [x_norm, y_norm, w_norm, h_norm],
                'bbox_pixels': [x, y, bbox_w, bbox_h],
                'confidence': float(confidence),
                'class': 'person',
                'class_id': 0
            })

        inference_time = time.time() - start_time

        return detections

    def detect_batch(self, frames: List[np.ndarray]) -> List[List[Dict[str, Any]]]:
        results = []
        for frame in frames:
            results.append(self.detect_people(frame))
        return results

class RealYOLODetector(YOLODetector):
    def __init__(self, model_path: str = None, conf_threshold: float = 0.5, nms_threshold: float = 0.4):
        super().__init__(conf_threshold, nms_threshold)
        self.model = None
        if model_path:
            try:
                import onnxruntime as ort
                self.model = ort.InferenceSession(model_path)
                print(f"Loaded ONNX model from {model_path}")
            except Exception as e:
                print(f"Failed to load model: {e}. Using stub detector.")

    def detect_people(self, frame: np.ndarray) -> List[Dict[str, Any]]:
        if self.model is None:
            return super().detect_people(frame)

        h, w = frame.shape[:2]
        input_tensor = self.preprocess(frame)

        outputs = self.model.run(None, {self.model.get_inputs()[0].name: input_tensor})
        predictions = outputs[0][0]

        detections = []
        for pred in predictions:
            if pred[4] > self.conf_threshold:
                class_scores = pred[5:]
                class_id = np.argmax(class_scores)

                if class_id == 0:
                    x_center, y_center, box_w, box_h = pred[:4]
                    x = (x_center - box_w / 2) / self.input_size[0]
                    y = (y_center - box_h / 2) / self.input_size[1]
                    w_norm = box_w / self.input_size[0]
                    h_norm = box_h / self.input_size[1]

                    detections.append({
                        'bbox': [x, y, w_norm, h_norm],
                        'bbox_pixels': [int(x * w), int(y * h), int(w_norm * w), int(h_norm * h)],
                        'confidence': float(pred[4]),
                        'class': 'person',
                        'class_id': 0
                    })

        return detections
