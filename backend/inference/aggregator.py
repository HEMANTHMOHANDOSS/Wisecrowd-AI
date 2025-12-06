import numpy as np
from typing import List, Dict, Any
from datetime import datetime, timedelta
from collections import deque

class MetricsAggregator:
    def __init__(self, window_size: int = 100):
        self.window_size = window_size
        self.samples = deque(maxlen=window_size)

    def add_sample(self, sample: Dict[str, Any]):
        self.samples.append(sample)

    def get_current_metrics(self) -> Dict[str, Any]:
        if not self.samples:
            return {
                'current_count': 0,
                'peak_count': 0,
                'average_count': 0.0,
                'risk_score': 0.0,
                'density': 0.0,
                'flow_rate': 0.0
            }

        counts = [s['count'] for s in self.samples]
        densities = [s.get('density', 0) for s in self.samples]
        flow_rates = [s.get('flow_rate', 0) for s in self.samples]
        risk_scores = [s.get('risk_score', 0) for s in self.samples]

        return {
            'current_count': counts[-1] if counts else 0,
            'peak_count': max(counts) if counts else 0,
            'average_count': round(np.mean(counts), 2) if counts else 0.0,
            'risk_score': round(np.mean(risk_scores), 2) if risk_scores else 0.0,
            'density': round(np.mean(densities), 2) if densities else 0.0,
            'flow_rate': round(np.mean(flow_rates), 2) if flow_rates else 0.0
        }

    def get_trend(self, lookback: int = 10) -> str:
        if len(self.samples) < lookback:
            return 'stable'

        recent = list(self.samples)[-lookback:]
        counts = [s['count'] for s in recent]

        first_half = np.mean(counts[:len(counts)//2])
        second_half = np.mean(counts[len(counts)//2:])

        diff_pct = ((second_half - first_half) / max(first_half, 1)) * 100

        if diff_pct > 10:
            return 'rising'
        elif diff_pct < -10:
            return 'falling'
        else:
            return 'stable'

    def forecast_simple(self, minutes_ahead: int = 10) -> Dict[str, Any]:
        if len(self.samples) < 10:
            current = self.samples[-1]['count'] if self.samples else 0
            return {
                'forecast': current,
                'confidence': 0.3,
                'method': 'insufficient_data'
            }

        recent = list(self.samples)[-30:]
        counts = [s['count'] for s in recent]

        weights = np.exp(np.linspace(-2, 0, len(counts)))
        weights = weights / weights.sum()
        weighted_avg = np.average(counts, weights=weights)

        trend = self.get_trend(lookback=15)
        if trend == 'rising':
            forecast = weighted_avg * (1.0 + 0.02 * minutes_ahead)
        elif trend == 'falling':
            forecast = weighted_avg * (1.0 - 0.02 * minutes_ahead)
        else:
            forecast = weighted_avg

        forecast = max(0, int(forecast))

        std_dev = np.std(counts)
        confidence = max(0.5, min(1.0, 1.0 - (std_dev / max(weighted_avg, 1)) * 0.5))

        return {
            'forecast': forecast,
            'confidence': round(confidence, 2),
            'method': 'exponential_weighted_moving_average'
        }

    def should_alert(self, threshold: int = 100, density_threshold: float = 4.0) -> Dict[str, Any]:
        if not self.samples:
            return {'should_alert': False}

        latest = self.samples[-1]
        current_count = latest['count']
        current_density = latest.get('density', 0)
        risk_score = latest.get('risk_score', 0)

        reasons = []
        severity = 'low'

        if current_count > threshold:
            reasons.append(f"Count exceeded threshold: {current_count} > {threshold}")
            severity = 'high'

        if current_density > density_threshold:
            reasons.append(f"Density critical: {current_density:.2f} people/m²")
            severity = 'critical'

        if risk_score > 75:
            reasons.append(f"Risk score critical: {risk_score}")
            severity = 'critical' if risk_score > 85 else 'high'

        forecast_10 = self.forecast_simple(10)
        if forecast_10['forecast'] > threshold * 1.2:
            reasons.append(f"Predicted surge in 10 minutes: {forecast_10['forecast']}")
            if severity == 'low':
                severity = 'medium'

        return {
            'should_alert': len(reasons) > 0,
            'severity': severity,
            'reasons': reasons,
            'metrics': {
                'count': current_count,
                'density': current_density,
                'risk_score': risk_score
            }
        }

    def clear(self):
        self.samples.clear()
