from typing import List, Dict, Any, Optional
from datetime import datetime
import uuid

class AlertRuleEngine:
    def __init__(self):
        self.rules = {
            'high_density': {
                'threshold': 4.0,
                'severity': 'critical',
                'title': 'Critical Crowd Density',
                'message_template': 'Density reached {density:.2f} people/m² in {location}. Immediate action required.'
            },
            'high_count': {
                'threshold': 100,
                'severity': 'high',
                'title': 'High Crowd Count',
                'message_template': 'Crowd count reached {count} people in {location}. Monitor closely.'
            },
            'predicted_surge': {
                'threshold_multiplier': 1.3,
                'severity': 'medium',
                'title': 'Predicted Crowd Surge',
                'message_template': 'AI predicts crowd will reach {forecast} in {minutes} minutes at {location}.'
            },
            'high_risk_score': {
                'threshold': 75,
                'severity': 'high',
                'title': 'Elevated Risk Score',
                'message_template': 'Risk score reached {risk_score} at {location}. Enhanced monitoring advised.'
            },
            'low_flow_rate': {
                'threshold': 10,
                'severity': 'medium',
                'title': 'Low Movement Detected',
                'message_template': 'Crowd movement has stalled in {location}. Flow rate: {flow_rate:.1f}/min.'
            }
        }

    def evaluate(self, metrics: Dict[str, Any], event_id: str,
                camera_id: Optional[str] = None, location: str = "Unknown") -> List[Dict[str, Any]]:
        alerts = []

        if metrics.get('density', 0) > self.rules['high_density']['threshold']:
            alert = self._create_alert(
                'high_density',
                event_id,
                camera_id,
                location,
                density=metrics['density']
            )
            alerts.append(alert)

        if metrics.get('count', 0) > self.rules['high_count']['threshold']:
            alert = self._create_alert(
                'high_count',
                event_id,
                camera_id,
                location,
                count=metrics['count']
            )
            alerts.append(alert)

        if metrics.get('risk_score', 0) > self.rules['high_risk_score']['threshold']:
            alert = self._create_alert(
                'high_risk_score',
                event_id,
                camera_id,
                location,
                risk_score=metrics['risk_score']
            )
            alerts.append(alert)

        if metrics.get('flow_rate', 100) < self.rules['low_flow_rate']['threshold']:
            if metrics.get('count', 0) > 20:
                alert = self._create_alert(
                    'low_flow_rate',
                    event_id,
                    camera_id,
                    location,
                    flow_rate=metrics['flow_rate']
                )
                alerts.append(alert)

        forecast = metrics.get('forecast_10min', 0)
        current = metrics.get('count', 0)
        if forecast > current * self.rules['predicted_surge']['threshold_multiplier']:
            alert = self._create_alert(
                'predicted_surge',
                event_id,
                camera_id,
                location,
                forecast=forecast,
                minutes=10
            )
            alerts.append(alert)

        return alerts

    def _create_alert(self, rule_name: str, event_id: str, camera_id: Optional[str],
                     location: str, **kwargs) -> Dict[str, Any]:
        rule = self.rules[rule_name]

        message = rule['message_template'].format(location=location, **kwargs)

        return {
            'id': str(uuid.uuid4()),
            'event_id': event_id,
            'camera_id': camera_id,
            'severity': rule['severity'],
            'title': rule['title'],
            'message': message,
            'location': location,
            'alert_type': rule_name,
            'resolved': False,
            'timestamp': datetime.utcnow().isoformat()
        }

    def add_custom_rule(self, rule_name: str, rule_config: Dict[str, Any]):
        self.rules[rule_name] = rule_config

    def remove_rule(self, rule_name: str):
        if rule_name in self.rules:
            del self.rules[rule_name]
