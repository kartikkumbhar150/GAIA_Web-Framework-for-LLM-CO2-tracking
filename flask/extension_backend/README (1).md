# GAIA Flask Backend

Flask backend for storing LLM metrics from the GAIA Chrome extension into Neon DB (PostgreSQL).

## Features

- ✅ Receives metrics from Chrome extension
- ✅ JWT authentication
- ✅ Stores data in Neon DB PostgreSQL
- ✅ Calculates environmental impact (energy, CO2, water)
- ✅ User-specific metrics tracking
- ✅ Aggregated statistics endpoint
- ✅ CORS enabled for browser extensions

## Setup Instructions

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Configure Environment Variables

Create a `.env` file in the project root with your Neon DB credentials:

```env
DATABASE_URL=postgresql://username:password@your-neon-host.neon.tech/your-database-name?sslmode=require
JWT_SECRET=your-super-secret-jwt-key-change-this
```

To get your Neon DB connection string:
1. Go to https://console.neon.tech
2. Select your project
3. Click "Connection Details"
4. Copy the connection string
5. Paste it into `.env` file

### 3. Run the Server

```bash
python app.py
```

The server will start on `http://localhost:3000`

### 4. Test the API

**Health Check:**
```bash
curl http://localhost:3000/api/health
```

**Save Metrics (requires JWT token):**
```bash
curl -X POST http://localhost:3000/api/extension/metrics \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -d '{
    "site": "ChatGPT",
    "model": "GPT-4",
    "input_tokens_before": 150,
    "input_tokens_after": 200,
    "output_tokens": 350,
    "total_tokens": 550,
    "timestamp": 1234567890,
    "session_id": "session_xxx"
  }'
```

## API Endpoints

### `GET /api/health`
Health check endpoint to verify database connection.

**Response:**
```json
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "2024-02-11T10:30:00"
}
```

### `POST /api/extension/metrics`
Save LLM usage metrics (requires authentication).

**Headers:**
- `Authorization: Bearer <JWT_TOKEN>`
- `Content-Type: application/json`

**Request Body:**
```json
{
  "site": "ChatGPT",
  "model": "GPT-4",
  "input_tokens_before": 150,
  "input_tokens_after": 200,
  "output_tokens": 350,
  "timestamp": 1234567890,
  "session_id": "session_xxx"
}
```

**Response:**
```json
{
  "success": true,
  "id": 123,
  "message": "Metrics saved successfully",
  "environmental_impact": {
    "energy_kwh": 0.00055,
    "co2_grams": 0.26125,
    "water_liters": 0.275
  }
}
```

### `GET /api/metrics/user`
Get all metrics for authenticated user.

**Query Parameters:**
- `limit` (optional, default: 100)
- `offset` (optional, default: 0)

**Response:**
```json
{
  "success": true,
  "total": 250,
  "limit": 100,
  "offset": 0,
  "metrics": [...]
}
```

### `GET /api/metrics/summary`
Get aggregated metrics summary for authenticated user.

**Response:**
```json
{
  "success": true,
  "summary": {
    "total_prompts": 250,
    "total_input_tokens": 50000,
    "total_output_tokens": 75000,
    "total_tokens": 125000,
    "total_energy_kwh": 0.125,
    "total_co2_grams": 59.375,
    "total_water_liters": 62.5
  },
  "llm_breakdown": [
    {"llm": "ChatGPT", "count": 150, "tokens": 75000},
    {"llm": "Claude", "count": 100, "tokens": 50000}
  ]
}
```

## Database Schema

The backend expects this PostgreSQL table structure:

```sql
CREATE TABLE llmprompts (
    id SERIAL PRIMARY KEY,
    user_id UUID NOT NULL,
    input_raw BIGINT,
    input_tokens INTEGER,
    output_tokens INTEGER,
    total_tokens INTEGER
        GENERATED ALWAYS AS (input_tokens + output_tokens) STORED,
    is_cached BOOLEAN DEFAULT FALSE,
    model VARCHAR(255),
    llm VARCHAR(255),
    energy_kwh NUMERIC(15, 8),
    co2_grams NUMERIC(15, 4),
    water_liters NUMERIC(15, 4),
    cloud_provider VARCHAR(20),
    cloud_region VARCHAR(50),
    grid_zone VARCHAR(10),
    carbon_intensity_g_per_kwh INTEGER,
    captured_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user
        FOREIGN KEY (user_id)
        REFERENCES users(id)
        ON DELETE CASCADE
);
```

## Environmental Impact Calculations

The backend automatically calculates:

1. **Energy (kWh)**: Based on token count and model type
2. **CO2 Emissions (grams)**: Energy × Carbon Intensity
3. **Water Usage (liters)**: Based on data center operations

Default values are approximations. Update the helper functions in `app.py` for more accurate calculations.

## Production Deployment

### Using Gunicorn

```bash
gunicorn -w 4 -b 0.0.0.0:3000 app:app
```

### Environment Variables for Production

```env
FLASK_ENV=production
FLASK_DEBUG=False
DATABASE_URL=postgresql://...
JWT_SECRET=strong-random-secret-key
```

## Security Notes

- Always use HTTPS in production
- Keep JWT_SECRET secure and never commit it
- Use strong database passwords
- Enable Neon DB IP allowlist if possible
- Implement rate limiting for production

## Troubleshooting

**Database Connection Error:**
- Verify your Neon DB connection string
- Check if your IP is allowed (Neon DB settings)
- Ensure SSL mode is required: `?sslmode=require`

**JWT Token Invalid:**
- Check if JWT_SECRET matches between frontend and backend
- Verify token is being sent in Authorization header
- Ensure token hasn't expired

## License

MIT
