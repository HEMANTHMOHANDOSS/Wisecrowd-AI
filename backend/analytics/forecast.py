import numpy as np
from typing import List, Dict, Any
from datetime import datetime, timedelta

class SimpleForecastEngine:
    def __init__(self):
        self.min_samples = 10

    def moving_average_forecast(self, samples: List[Dict[str, Any]],
                                minutes_ahead: int = 10) -> Dict[str, Any]:
        if len(samples) < self.min_samples:
            return {
                'forecast': 0,
                'confidence': 0.0,
                'method': 'insufficient_data'
            }

        counts = [s['count'] for s in samples[-50:]]

        window_size = min(10, len(counts) // 3)
        ma = np.convolve(counts, np.ones(window_size) / window_size, mode='valid')

        if len(ma) < 2:
            forecast = int(np.mean(counts))
            confidence = 0.5
        else:
            trend = (ma[-1] - ma[0]) / len(ma)
            forecast = int(ma[-1] + trend * minutes_ahead)
            forecast = max(0, forecast)

            std_dev = np.std(counts)
            avg = np.mean(counts)
            confidence = max(0.4, min(1.0, 1.0 - (std_dev / max(avg, 1)) * 0.3))

        return {
            'forecast': forecast,
            'confidence': round(confidence, 2),
            'method': 'moving_average'
        }

    def exponential_smoothing_forecast(self, samples: List[Dict[str, Any]],
                                      minutes_ahead: int = 10,
                                      alpha: float = 0.3) -> Dict[str, Any]:
        if len(samples) < self.min_samples:
            return {
                'forecast': 0,
                'confidence': 0.0,
                'method': 'insufficient_data'
            }

        counts = [s['count'] for s in samples[-50:]]

        smoothed = [counts[0]]
        for count in counts[1:]:
            smoothed.append(alpha * count + (1 - alpha) * smoothed[-1])

        if len(smoothed) < 3:
            forecast = int(smoothed[-1])
            trend_factor = 1.0
        else:
            recent_trend = (smoothed[-1] - smoothed[-5]) / 5 if len(smoothed) >= 5 else 0
            trend_factor = 1.0 + (recent_trend / max(smoothed[-1], 1)) * minutes_ahead * 0.1
            forecast = int(smoothed[-1] * trend_factor)

        forecast = max(0, forecast)

        error = np.mean([abs(counts[i] - smoothed[i]) for i in range(len(counts))])
        confidence = max(0.5, min(1.0, 1.0 - (error / max(np.mean(counts), 1))))

        return {
            'forecast': forecast,
            'confidence': round(confidence, 2),
            'method': 'exponential_smoothing'
        }

    def get_trend_analysis(self, samples: List[Dict[str, Any]]) -> str:
        if len(samples) < 5:
            return 'stable'

        counts = [s['count'] for s in samples[-20:]]

        half = len(counts) // 2
        first_half_avg = np.mean(counts[:half])
        second_half_avg = np.mean(counts[half:])

        pct_change = ((second_half_avg - first_half_avg) / max(first_half_avg, 1)) * 100

        if pct_change > 15:
            return 'rising'
        elif pct_change < -15:
            return 'falling'
        else:
            return 'stable'

    def calculate_risk_score(self, current_count: int, forecast: int,
                            density: float, capacity: int = 1000) -> float:
        occupancy_pct = (current_count / max(capacity, 1)) * 100
        forecast_pct = (forecast / max(capacity, 1)) * 100

        occupancy_risk = min(occupancy_pct / 100 * 40, 40)
        forecast_risk = min(forecast_pct / 100 * 30, 30)
        density_risk = min(density / 5.0 * 30, 30)

        total_risk = occupancy_risk + forecast_risk + density_risk
        return min(round(total_risk, 2), 100.0)
