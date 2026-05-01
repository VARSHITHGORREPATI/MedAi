#!/usr/bin/env python3
"""
Quick test script to verify health log creation works
"""
import requests
import json

# Test data
test_log = {
    "vital_signs": {
        "blood_pressure_systolic": 120,
        "blood_pressure_diastolic": 80,
        "heart_rate": 72
    },
    "symptoms": [],
    "mood": "good",
    "notes": "Feeling great today"
}

print("Testing health log creation...")
print(f"Payload: {json.dumps(test_log, indent=2)}")

# You'll need to replace this with a valid token
# token = "your_token_here"
# headers = {"Authorization": f"Bearer {token}"}
# response = requests.post("http://localhost:8000/api/health/logs", json=test_log, headers=headers)
# print(f"Status: {response.status_code}")
# print(f"Response: {response.json()}")
