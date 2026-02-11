# GAIA Backend - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Get Your Neon DB Connection String

1. Go to [Neon Console](https://console.neon.tech)
2. Sign in or create an account
3. Create a new project (or select existing)
4. Click **"Connection Details"**
5. Copy the connection string (looks like this):
   ```
   postgresql://username:password@ep-xxx.region.aws.neon.tech/dbname?sslmode=require
   ```

### Step 2: Set Up Environment Variables

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and paste your Neon DB connection string:
   ```bash
   nano .env
   ```
   
   Replace this line:
   ```
   DATABASE_URL=postgresql://your_username:your_password@ep-example-123456.us-east-2.aws.neon.tech/neondb?sslmode=require
   ```
   
   With your actual connection string.

3. Generate a strong JWT secret:
   ```bash
   python3 -c "import secrets; print(secrets.token_hex(32))"
   ```
   
   Copy the output and replace `JWT_SECRET` in `.env`

### Step 3: Create Database Table

Run this SQL in your Neon DB console:

```sql
-- First, ensure you have a users table (if not already exists)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create the llmprompts table
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

-- Create indexes for better performance
CREATE INDEX idx_llmprompts_user_id ON llmprompts(user_id);
CREATE INDEX idx_llmprompts_captured_at ON llmprompts(captured_at DESC);
CREATE INDEX idx_llmprompts_llm ON llmprompts(llm);
```

### Step 4: Install Dependencies

```bash
# Create virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### Step 5: Start the Server

```bash
# Option 1: Using the startup script
chmod +x start.sh
./start.sh

# Option 2: Directly with Python
python app.py
```

You should see:
```
 * Running on http://0.0.0.0:3000
```

### Step 6: Test the API

In a new terminal, test the health endpoint:
```bash
curl http://localhost:3000/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "database": "connected",
  "timestamp": "2024-02-11T10:30:00"
}
```

## 🧪 Testing with JWT Token

### Generate a Test Token

```bash
python generate_token.py
```

This will output a JWT token. Copy it.

### Test Authenticated Endpoints

Use the test script:
```bash
python test_api.py
```

Or manually with curl:
```bash
TOKEN="your-generated-token-here"

# Save metrics
curl -X POST http://localhost:3000/api/extension/metrics \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "site": "ChatGPT",
    "model": "GPT-4",
    "input_tokens_before": 150,
    "input_tokens_after": 200,
    "output_tokens": 350
  }'

# Get user metrics
curl http://localhost:3000/api/metrics/user \
  -H "Authorization: Bearer $TOKEN"

# Get summary
curl http://localhost:3000/api/metrics/summary \
  -H "Authorization: Bearer $TOKEN"
```

## 🔧 Troubleshooting

### "Database connection error"

1. Check your `DATABASE_URL` in `.env`
2. Verify the connection string is correct
3. Ensure `?sslmode=require` is at the end
4. Test connection in Neon console

### "Token is missing" or "Invalid token"

1. Make sure you're sending the token in the header:
   ```
   Authorization: Bearer <your-token>
   ```
2. Verify `JWT_SECRET` matches in `.env`
3. Generate a new token with `python generate_token.py`

### "Port 3000 already in use"

Change the port in `.env`:
```
PORT=3001
```

Or stop the process using port 3000:
```bash
# Find process
lsof -i :3000

# Kill it
kill -9 <PID>
```

### Import errors

Make sure virtual environment is activated:
```bash
source venv/bin/activate
pip install -r requirements.txt
```

## 📱 Connect Your Chrome Extension

Update your extension's background script to use this backend:

```javascript
// In your extension's background.js or service worker
const BACKEND_URL = "http://localhost:3000";

// Store the JWT token
chrome.storage.local.set({ token: "your-jwt-token-here" });

// Send metrics
async function sendMetrics(data) {
  const { token } = await chrome.storage.local.get(['token']);
  
  const response = await fetch(`${BACKEND_URL}/api/extension/metrics`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });
  
  return response.json();
}
```

## 🚀 Production Deployment

### Using Gunicorn

```bash
gunicorn -w 4 -b 0.0.0.0:3000 app:app
```

### Environment Variables for Production

```env
FLASK_ENV=production
FLASK_DEBUG=False
DATABASE_URL=your-neon-connection-string
JWT_SECRET=super-strong-random-key
```

### Deploy to Cloud

**Heroku:**
```bash
# Add Procfile
echo "web: gunicorn app:app" > Procfile

# Deploy
git push heroku main
```

**Railway/Render:**
- Set environment variables in dashboard
- Connect GitHub repo
- Auto-deploy

## 📚 Next Steps

1. ✅ Test all endpoints with Postman/curl
2. ✅ Integrate with your Chrome extension
3. ✅ Set up user authentication (if not already)
4. ✅ Monitor metrics in your database
5. ✅ Deploy to production

## 🆘 Need Help?

- Check the full [README.md](README.md) for detailed documentation
- Review the code comments in `app.py`
- Test with `python test_api.py`

---

**Happy Coding! 🎉**
