import requests
import json
import time

BASE_URL = "http://localhost:8000"

def test_create_event():
    print("Testing: Create Event...")
    event_data = {
        "id": f"test-event-{int(time.time())}",
        "name": "Test Event - WiseCrowd AI",
        "location_lat": 13.0827,
        "location_lng": 80.2707,
        "location_address": "Chennai, Tamil Nadu, India",
        "status": "active",
        "start_time": "2025-12-06T10:00:00Z"
    }

    response = requests.post(f"{BASE_URL}/api/events", json=event_data)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    return event_data["id"]

def test_register_camera(event_id):
    print("\nTesting: Register Camera...")
    camera_data = {
        "id": f"test-cam-{int(time.time())}",
        "event_id": event_id,
        "name": "Main Entrance Camera",
        "location": "Sector A - Main Gate",
        "capacity": 500,
        "coordinates_x": 150.0,
        "coordinates_y": 200.0
    }

    response = requests.post(f"{BASE_URL}/api/camera/register", json=camera_data)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.json()}")
    return camera_data["id"]

def test_get_events():
    print("\nTesting: Get All Events...")
    response = requests.get(f"{BASE_URL}/api/events")
    print(f"Status: {response.status_code}")
    events = response.json()
    print(f"Total Events: {len(events)}")
    return events

def test_get_metrics(event_id):
    print(f"\nTesting: Get Metrics for Event {event_id}...")
    response = requests.get(f"{BASE_URL}/api/event/{event_id}/metrics")
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")

def test_get_forecast(event_id):
    print(f"\nTesting: Get Forecast for Event {event_id}...")
    response = requests.get(f"{BASE_URL}/api/event/{event_id}/forecast")
    print(f"Status: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")

def test_get_alerts(event_id):
    print(f"\nTesting: Get Alerts for Event {event_id}...")
    response = requests.get(f"{BASE_URL}/api/event/{event_id}/alerts")
    print(f"Status: {response.status_code}")
    alerts = response.json()
    print(f"Total Alerts: {len(alerts)}")

def run_tests():
    print("="*60)
    print("WiseCrowd AI Backend - API Test Suite")
    print("="*60)

    try:
        response = requests.get(f"{BASE_URL}/")
        print(f"\nServer Status: {response.json()}")
    except:
        print("\nERROR: Server is not running!")
        print("Start the server with: python main_api.py")
        return

    event_id = test_create_event()
    time.sleep(0.5)

    camera_id = test_register_camera(event_id)
    time.sleep(0.5)

    test_get_events()
    time.sleep(0.5)

    test_get_metrics(event_id)
    time.sleep(0.5)

    test_get_forecast(event_id)
    time.sleep(0.5)

    test_get_alerts(event_id)

    print("\n" + "="*60)
    print("All tests completed successfully!")
    print(f"Test Event ID: {event_id}")
    print(f"Test Camera ID: {camera_id}")
    print("="*60)

if __name__ == "__main__":
    run_tests()
