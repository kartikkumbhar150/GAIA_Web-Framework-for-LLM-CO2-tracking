# Carbon-Aware Cloud Optimizer API

Production-ready API for optimizing cloud workloads based on real-time carbon intensity data. Integrates with Electricity Maps to provide carbon-aware recommendations for AWS infrastructure.

## 🌍 Features

- **Real-time Carbon Data**: Live carbon intensity from 40+ AWS regions via Electricity Maps API
- **Comprehensive Instance Coverage**: All major AWS instance types (EC2, Lambda, Fargate, RDS)
- **CO2 Emission Calculations**: Accurate carbon footprint estimates for each recommendation
- **Optimal Scheduling**: Find the greenest time windows to run workloads
- **Multi-region Comparison**: Compare carbon impact across regions and instance types
- **Workload-specific Recommendations**: Optimized for training, inference, databases, containers, serverless
- **Production-ready**: Error handling, logging, caching, and comprehensive API endpoints

## 📋 Prerequisites

- Python 3.8+
- Electricity Maps API key (get free key at https://api-portal.electricitymaps.com/)
- AWS knowledge (for understanding instance types and regions)

## 🚀 Quick Start

### 1. Installation

```bash
# Clone or download the code
git clone <your-repo>
cd carbon-optimizer

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### 2. Configuration

```bash
# Copy environment template
cp .env.example .env

# Edit .env and add your Electricity Maps API key
# EL_MAPS_API_KEY=your_actual_key_here
```

### 3. Run the API

```bash
# Development
python app.py

# Production (recommended)
gunicorn -w 4 -b 0.0.0.0:5000 app:app
```

The API will be available at `http://localhost:5000`

## 📚 API Endpoints

### 1. Health Check
```bash
GET /health
```

**Response:**
```json
{
  "status": "healthy",
  "service": "carbon-optimizer",
  "timestamp": "2026-02-11T10:30:00Z",
  "api_configured": true
}
```

---

### 2. Optimize Workload (Main Endpoint)
```bash
POST /api/v1/optimize
```

**Request:**
```json
{
  "workload": "training",
  "priority": "carbon",
  "region": "us-west-2",
  "duration_hours": 24
}
```

**Parameters:**
- `workload` (required): `training`, `inference`, `general`, `database`, `containers`, `serverless`
- `priority` (required): `carbon`, `performance`, `balanced`
- `region` (optional): Specific AWS region (e.g., `us-east-1`)
- `duration_hours` (optional): Workload duration (default: 1.0)

**Response:**
```json
{
  "status": "success",
  "request_id": "carbon_req_000001",
  "recommendation": {
    "workload_type": "training",
    "priority": "carbon",
    "timestamp": "2026-02-11T10:30:00Z",
    "recommendations": [
      {
        "region": "ca-central-1",
        "zone": "CA-QC",
        "instance_type": "g4dn.xlarge",
        "carbon_intensity_gco2_kwh": 30,
        "renewable_percentage": 99.8,
        "estimated_co2_emissions_kg": 0.576,
        "estimated_co2_emissions_g": 576,
        "power_consumption_kwh": 19.2,
        "duration_hours": 24,
        "optimal_time_window": {
          "start_time": "2026-02-11T14:00:00Z",
          "end_time": "2026-02-12T14:00:00Z",
          "avg_carbon_intensity": 28.5,
          "duration_hours": 24
        }
      }
    ],
    "carbon_savings": {
      "potential_savings_kg": 5.234,
      "potential_savings_percentage": 90.1,
      "comparison": "Best option emits 90.1% less CO2 than worst option"
    },
    "service_optimizations": [
      "Use Graviton instances for 60% better energy efficiency",
      "Enable EC2 Instance Scheduler to stop instances during idle periods"
    ],
    "metadata": {
      "total_regions_analyzed": 26,
      "duration_hours": 24,
      "api_data_freshness": "Real-time (5min cache)"
    }
  }
}
```

---

### 3. List All Regions
```bash
GET /api/v1/regions
```

**Response:**
```json
{
  "status": "success",
  "request_id": "carbon_req_000002",
  "timestamp": "2026-02-11T10:30:00Z",
  "total_regions": 26,
  "regions": [
    {
      "region": "ca-central-1",
      "zone": "CA-QC",
      "carbon_intensity": 30,
      "renewable_percentage": 99.8,
      "is_estimate": false
    },
    {
      "region": "eu-north-1",
      "zone": "SE",
      "carbon_intensity": 35,
      "renewable_percentage": 95.2,
      "is_estimate": false
    }
  ]
}
```

---

### 4. Get Region Details
```bash
GET /api/v1/regions/{region}
```

**Example:**
```bash
GET /api/v1/regions/us-west-2
```

**Response:**
```json
{
  "status": "success",
  "request_id": "carbon_req_000003",
  "region_details": {
    "region": "us-west-2",
    "zone": "US-NW-PACW",
    "current_carbon_intensity": 85,
    "renewable_percentage": 78.5,
    "fossil_free_percentage": 82.3,
    "forecast_24h": {
      "average": 82.3,
      "minimum": 65.2,
      "maximum": 102.1
    },
    "optimal_hours_utc": [6, 7, 8, 9, 10, 11, 12, 13, 14],
    "timestamp": "2026-02-11T10:30:00Z"
  }
}
```

---

### 5. Calculate Emissions
```bash
POST /api/v1/calculate
```

**Request:**
```json
{
  "region": "us-east-1",
  "instance_type": "p4d.24xlarge",
  "duration_hours": 24
}
```

**Response:**
```json
{
  "status": "success",
  "request_id": "carbon_req_000004",
  "calculation": {
    "instance_type": "p4d.24xlarge",
    "power_consumption_kwh": 52.8,
    "co2_emissions_g": 22176,
    "co2_emissions_kg": 22.176,
    "duration_hours": 24,
    "carbon_intensity_used": 420,
    "region": "us-east-1",
    "zone": "US-MIDW-PJM",
    "carbon_intensity_gco2_kwh": 420
  }
}
```

---

### 6. Compare Options
```bash
POST /api/v1/compare
```

**Request:**
```json
{
  "options": [
    {"region": "us-east-1", "instance_type": "p4d.24xlarge"},
    {"region": "us-west-2", "instance_type": "p4d.24xlarge"},
    {"region": "ca-central-1", "instance_type": "p4d.24xlarge"}
  ],
  "duration_hours": 24
}
```

**Response:**
```json
{
  "status": "success",
  "request_id": "carbon_req_000005",
  "comparisons": [
    {
      "region": "ca-central-1",
      "zone": "CA-QC",
      "instance_type": "p4d.24xlarge",
      "carbon_intensity_gco2_kwh": 30,
      "co2_emissions_kg": 1.584,
      "co2_emissions_g": 1584,
      "power_consumption_kwh": 52.8,
      "renewable_percentage": 99.8
    },
    {
      "region": "us-west-2",
      "zone": "US-NW-PACW",
      "instance_type": "p4d.24xlarge",
      "carbon_intensity_gco2_kwh": 85,
      "co2_emissions_kg": 4.488,
      "co2_emissions_g": 4488,
      "power_consumption_kwh": 52.8,
      "renewable_percentage": 78.5
    },
    {
      "region": "us-east-1",
      "zone": "US-MIDW-PJM",
      "instance_type": "p4d.24xlarge",
      "carbon_intensity_gco2_kwh": 420,
      "co2_emissions_kg": 22.176,
      "co2_emissions_g": 22176,
      "power_consumption_kwh": 52.8,
      "renewable_percentage": 35.2
    }
  ],
  "analysis": {
    "best_option": { /* first option */ },
    "worst_option": { /* last option */ },
    "difference_kg": 20.592,
    "difference_percentage": 92.9,
    "total_options_compared": 3
  }
}
```

---

### 7. Find Optimal Schedule
```bash
POST /api/v1/schedule
```

**Request:**
```json
{
  "region": "us-west-2",
  "duration_hours": 4
}
```

**Response:**
```json
{
  "status": "success",
  "request_id": "carbon_req_000006",
  "region": "us-west-2",
  "zone": "US-NW-PACW",
  "optimal_window": {
    "start_time": "2026-02-11T16:00:00Z",
    "end_time": "2026-02-11T20:00:00Z",
    "avg_carbon_intensity": 65.2,
    "duration_hours": 4
  },
  "current_intensity": 85,
  "savings_potential": {
    "current_vs_optimal_gco2_kwh": 19.8
  }
}
```

## 🌟 Usage Examples

### Example 1: Find the Greenest Region for ML Training

```bash
curl -X POST http://localhost:5000/api/v1/optimize \
  -H "Content-Type: application/json" \
  -d '{
    "workload": "training",
    "priority": "carbon",
    "duration_hours": 48
  }'
```

### Example 2: Compare Multiple Deployment Options

```bash
curl -X POST http://localhost:5000/api/v1/compare \
  -H "Content-Type: application/json" \
  -d '{
    "options": [
      {"region": "us-east-1", "instance_type": "inf2.xlarge"},
      {"region": "eu-west-3", "instance_type": "inf2.xlarge"},
      {"region": "ca-central-1", "instance_type": "inf2.xlarge"}
    ],
    "duration_hours": 720
  }'
```

### Example 3: Find Best Time to Run Batch Job

```bash
curl -X POST http://localhost:5000/api/v1/schedule \
  -H "Content-Type: application/json" \
  -d '{
    "region": "eu-west-1",
    "duration_hours": 6
  }'
```

## 🏗️ Architecture

```
carbon-optimizer/
├── app.py              # Flask API application
├── engine.py           # Core optimization engine
├── mapping.py          # Region/instance mappings
├── requirements.txt    # Python dependencies
├── .env.example        # Environment template
└── README.md          # Documentation
```

## 📊 Supported Workloads

1. **Training**: GPU instances for ML model training (P5, P4d, P3, G5, G4dn)
2. **Inference**: Inferentia, GPU, and CPU instances optimized for inference
3. **General**: General-purpose compute with Graviton optimization
4. **Database**: Memory and storage optimized instances
5. **Containers**: Fargate and EKS node recommendations
6. **Serverless**: Lambda with ARM64 architecture support

## 🌍 Coverage

- **26 AWS Regions** across all continents
- **40+ Electricity Maps Zones** for accurate carbon data
- **100+ Instance Types** across all major AWS services
- **Real-time Data** with 5-minute caching for performance

## 🔐 Security & Production Considerations

### Environment Variables
- Never commit `.env` file to version control
- Use secrets management (AWS Secrets Manager, HashiCorp Vault) in production

### Rate Limiting
- Electricity Maps free tier: 1000 requests/day
- Consider implementing API rate limiting for production use

### Monitoring
```python
# Add to app.py for monitoring
from prometheus_flask_exporter import PrometheusMetrics
metrics = PrometheusMetrics(app)
```

### Error Handling
- All endpoints have comprehensive error handling
- Fallback to estimated carbon intensity when API unavailable
- Detailed error messages in development, generic in production

## 📈 Carbon Intensity Reference

| Region | Zone | Typical gCO2/kWh | Primary Sources |
|--------|------|------------------|-----------------|
| ca-central-1 | CA-QC | 30 | Hydro (99.8%) |
| eu-north-1 | SE | 35 | Hydro + Nuclear |
| eu-west-3 | FR | 60 | Nuclear (70%) |
| us-west-2 | US-NW-PACW | 85 | Hydro + Gas |
| eu-west-1 | IE | 280 | Wind + Gas |
| us-east-1 | US-MIDW-PJM | 420 | Coal + Gas |
| ap-south-1 | IN-WE | 650 | Coal (75%) |

## 🤝 Contributing

Contributions welcome! Areas for enhancement:
- Support for GCP, Azure regions
- Historical carbon data analysis
- Cost optimization integration
- Kubernetes scheduling integration
- Carbon budget tracking

## 📝 License

MIT License - see LICENSE file for details

## 🔗 Resources

- [Electricity Maps API](https://api-portal.electricitymaps.com/)
- [AWS Sustainability](https://aws.amazon.com/sustainability/)
- [Cloud Carbon Footprint](https://www.cloudcarbonfootprint.org/)
- [Green Software Foundation](https://greensoftware.foundation/)

## ⚡ Performance Notes

- **Caching**: 5-minute cache for carbon intensity, 30-minute for forecasts
- **Fallback Data**: Provides estimates when API unavailable
- **Parallel Requests**: Can handle multiple simultaneous optimization requests
- **Memory Usage**: ~50MB baseline, scales with concurrent requests

## 🎯 Roadmap

- [ ] GraphQL API support
- [ ] WebSocket for real-time carbon updates
- [ ] Cost-carbon tradeoff analysis
- [ ] CI/CD carbon impact reporting
- [ ] Integration with AWS Organizations
- [ ] Custom emission factors configuration
- [ ] Multi-cloud support (GCP, Azure)
