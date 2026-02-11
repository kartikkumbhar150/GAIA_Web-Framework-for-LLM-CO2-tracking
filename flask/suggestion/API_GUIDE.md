# API Usage Guide

Quick reference for using the Carbon Optimizer API with curl, Python, and JavaScript examples.

## Base URL

```
http://localhost:5000
```

For production, replace with your deployed URL (e.g., `https://api.carbon-optimizer.com`)

---

## Quick Examples

### 1. Health Check

```bash
curl http://localhost:5000/health
```

### 2. Get Greenest Regions

```bash
curl http://localhost:5000/api/v1/regions
```

### 3. Optimize ML Training Workload

```bash
curl -X POST http://localhost:5000/api/v1/optimize \
  -H "Content-Type: application/json" \
  -d '{
    "workload": "training",
    "priority": "carbon",
    "duration_hours": 24
  }'
```

### 4. Calculate CO2 for Specific Instance

```bash
curl -X POST http://localhost:5000/api/v1/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "region": "us-east-1",
    "instance_type": "p4d.24xlarge",
    "duration_hours": 168
  }'
```

### 5. Compare Multiple Options

```bash
curl -X POST http://localhost:5000/api/v1/compare \
  -H "Content-Type: application/json" \
  -d '{
    "options": [
      {"region": "us-east-1", "instance_type": "inf2.xlarge"},
      {"region": "ca-central-1", "instance_type": "inf2.xlarge"},
      {"region": "eu-west-3", "instance_type": "inf2.xlarge"}
    ],
    "duration_hours": 720
  }'
```

---

## Python Examples

### Basic Client

```python
import requests

BASE_URL = "http://localhost:5000"

# Get optimization recommendation
response = requests.post(
    f"{BASE_URL}/api/v1/optimize",
    json={
        "workload": "inference",
        "priority": "carbon",
        "duration_hours": 24
    }
)

result = response.json()
print(f"Best region: {result['recommendation']['recommendations'][0]['region']}")
print(f"CO2: {result['recommendation']['recommendations'][0]['estimated_co2_emissions_kg']} kg")
```

### Using the Client Class

```python
from example_client import CarbonOptimizerClient

client = CarbonOptimizerClient("http://localhost:5000")

# Get recommendations
result = client.optimize_workload(
    workload="training",
    priority="carbon",
    duration_hours=48
)

# List all regions
regions = client.list_regions()

# Compare options
comparison = client.compare_options([
    {"region": "us-west-2", "instance_type": "g5.xlarge"},
    {"region": "ca-central-1", "instance_type": "g5.xlarge"}
], duration_hours=24)
```

---

## JavaScript/Node.js Examples

```javascript
// Using fetch (Node.js 18+)
async function optimizeWorkload() {
  const response = await fetch('http://localhost:5000/api/v1/optimize', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      workload: 'inference',
      priority: 'carbon',
      duration_hours: 24
    })
  });
  
  const data = await response.json();
  console.log('Best region:', data.recommendation.recommendations[0].region);
  console.log('CO2 emissions:', data.recommendation.recommendations[0].estimated_co2_emissions_kg, 'kg');
}

// Using axios
const axios = require('axios');

async function listRegions() {
  const response = await axios.get('http://localhost:5000/api/v1/regions');
  console.log(`Found ${response.data.total_regions} regions`);
  
  // Show top 5 greenest
  response.data.regions.slice(0, 5).forEach((region, i) => {
    console.log(`${i + 1}. ${region.region}: ${region.carbon_intensity} gCO2/kWh`);
  });
}
```

---

## Use Cases

### Use Case 1: CI/CD Carbon Optimization

Integrate into your CI/CD pipeline to choose the greenest region for builds:

```bash
#!/bin/bash
# deploy-green.sh

# Get best region for deployment
BEST_REGION=$(curl -s -X POST http://localhost:5000/api/v1/optimize \
  -H "Content-Type: application/json" \
  -d '{"workload": "containers", "priority": "carbon", "duration_hours": 1}' \
  | jq -r '.recommendation.recommendations[0].region')

echo "Deploying to greenest region: $BEST_REGION"

# Deploy to that region
aws ecs update-service --cluster my-cluster --service my-service --region $BEST_REGION
```

### Use Case 2: Scheduled ML Training

Find the optimal time window and schedule training:

```python
import requests
from datetime import datetime
import subprocess

def schedule_training(region, duration_hours):
    # Find optimal time window
    response = requests.post(
        "http://localhost:5000/api/v1/schedule",
        json={"region": region, "duration_hours": duration_hours}
    )
    
    window = response.json()['optimal_window']
    start_time = datetime.fromisoformat(window['start_time'].replace('Z', '+00:00'))
    
    # Schedule with cron or AWS EventBridge
    print(f"Schedule training for {start_time}")
    print(f"Expected carbon intensity: {window['avg_carbon_intensity']} gCO2/kWh")
    
    return start_time

# Schedule 24-hour training job
schedule_training("us-west-2", 24)
```

### Use Case 3: Multi-Region Cost-Carbon Analysis

```python
import requests
import pandas as pd

regions = ["us-east-1", "us-west-2", "eu-west-1", "ap-southeast-1"]
instance = "p4d.24xlarge"
duration = 720  # 1 month

options = [{"region": r, "instance_type": instance} for r in regions]

response = requests.post(
    "http://localhost:5000/api/v1/compare",
    json={"options": options, "duration_hours": duration}
)

comparisons = response.json()['comparisons']

# Create DataFrame for analysis
df = pd.DataFrame(comparisons)
df['co2_per_day'] = df['co2_emissions_kg'] / 30

print(df[['region', 'carbon_intensity_gco2_kwh', 'co2_emissions_kg', 'renewable_percentage']])

# Add cost data and optimize for both
# df['monthly_cost'] = df['region'].map(pricing_data)
# df['cost_per_kg_co2'] = df['monthly_cost'] / df['co2_emissions_kg']
```

### Use Case 4: Kubernetes Cluster Placement

```yaml
# k8s-green-scheduler.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: green-scheduler-config
data:
  api_url: "http://carbon-optimizer.default.svc.cluster.local/api/v1/optimize"
  
---
# Custom scheduler that queries the API
apiVersion: apps/v1
kind: Deployment
metadata:
  name: green-scheduler
spec:
  template:
    spec:
      containers:
      - name: scheduler
        image: custom-green-scheduler:latest
        env:
        - name: CARBON_API_URL
          valueFrom:
            configMapKeyRef:
              name: green-scheduler-config
              key: api_url
```

---

## Response Examples

### Optimize Response (Abbreviated)

```json
{
  "status": "success",
  "request_id": "carbon_req_000001",
  "recommendation": {
    "workload_type": "training",
    "priority": "carbon",
    "recommendations": [
      {
        "region": "ca-central-1",
        "zone": "CA-QC",
        "instance_type": "g4dn.xlarge",
        "carbon_intensity_gco2_kwh": 30,
        "renewable_percentage": 99.8,
        "estimated_co2_emissions_kg": 0.576,
        "power_consumption_kwh": 19.2,
        "optimal_time_window": {
          "start_time": "2026-02-11T14:00:00Z",
          "avg_carbon_intensity": 28.5
        }
      }
    ],
    "carbon_savings": {
      "potential_savings_kg": 5.234,
      "potential_savings_percentage": 90.1
    }
  }
}
```

### Regions List Response

```json
{
  "status": "success",
  "regions": [
    {
      "region": "ca-central-1",
      "zone": "CA-QC",
      "carbon_intensity": 30,
      "renewable_percentage": 99.8
    },
    {
      "region": "eu-north-1",
      "zone": "SE",
      "carbon_intensity": 35,
      "renewable_percentage": 95.2
    }
  ]
}
```

---

## Error Handling

All errors follow this format:

```json
{
  "status": "error",
  "error_type": "validation_error",
  "message": "Invalid workload. Must be one of: training, inference, general, database, containers, serverless",
  "timestamp": "2026-02-11T10:30:00Z"
}
```

Error Types:
- `validation_error` (400): Invalid input parameters
- `not_found` (404): Resource not found
- `method_not_allowed` (405): Wrong HTTP method
- `internal_error` (500): Server error

---

## Rate Limits

- Electricity Maps Free Tier: 1000 requests/day
- API has internal caching (5 min for carbon data, 30 min for forecasts)
- Consider implementing your own rate limiting for production use

---

## Best Practices

1. **Cache Results**: The API caches internally, but cache results on your end for frequently accessed data
2. **Batch Requests**: Use the compare endpoint instead of multiple calculate calls
3. **Error Handling**: Always handle both network errors and API errors
4. **Timeout**: Set reasonable timeouts (5-10 seconds recommended)
5. **Retry Logic**: Implement exponential backoff for transient failures

```python
import requests
from requests.adapters import HTTPAdapter
from requests.packages.urllib3.util.retry import Retry

session = requests.Session()
retries = Retry(total=3, backoff_factor=1, status_forcelist=[500, 502, 503, 504])
session.mount('http://', HTTPAdapter(max_retries=retries))

response = session.post(url, json=data, timeout=10)
```

---

## Support

- API Documentation: See README.md
- Deployment Guide: See DEPLOYMENT.md
- Example Code: See example_client.py
- Issues: Report via GitHub issues
