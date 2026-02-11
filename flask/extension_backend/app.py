from flask import Flask, request, jsonify
from flask_cors import CORS
from datetime import datetime, timedelta
import psycopg2
from psycopg2.extras import RealDictCursor
import os
from dotenv import load_dotenv
import jwt
from functools import wraps
import bcrypt
import re
import uuid

# Load environment variables
load_dotenv()

app = Flask(__name__)

# CORS Configuration - Allow Chrome extension
CORS(app, resources={
    r"/api/*": {
        "origins": ["chrome-extension://*", "http://localhost:*"],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"],
        "expose_headers": ["Content-Type", "Authorization"],
        "supports_credentials": True
    }
})

# JWT Secret Key
JWT_SECRET = os.getenv('JWT_SECRET', 'your-secret-key-change-this-in-production')
JWT_ALGORITHM = 'HS256'
JWT_EXPIRATION_HOURS = 720  # 30 days

# Database connection configuration
DATABASE_URL = os.getenv('DATABASE_URL')

def get_db_connection():
    """Create and return a database connection"""
    try:
        conn = psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)
        return conn
    except Exception as e:
        print(f"❌ Database connection error: {e}")
        raise

def token_required(f):
    """Decorator to validate JWT tokens"""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = None
        
        # Get token from Authorization header
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            try:
                token = auth_header.split(' ')[1]  # Bearer <token>
            except IndexError:
                return jsonify({'error': 'Invalid token format'}), 401
        
        if not token:
            return jsonify({'error': 'Token is missing'}), 401
        
        try:
            # Decode JWT token
            data = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
            current_user_id = data['user_id']
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token has expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Invalid token'}), 401
        
        return f(current_user_id, *args, **kwargs)
    
    return decorated

def validate_email(email):
    """Validate email format"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def validate_password(password):
    """Validate password strength (minimum 6 characters)"""
    return len(password) >= 6

# ==================== AUTHENTICATION ENDPOINTS ====================

@app.route('/api/auth/exbackend', methods=['POST', 'OPTIONS'])
def login():
    """
    User login endpoint
    Expected JSON payload:
    {
        "email": "user@example.com",
        "password": "password123"
    }
    """
    if request.method == 'OPTIONS':
        return '', 204
    
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        email = data.get('email', '').strip().lower()
        password = data.get('password', '')
        
        # Validate input
        if not email or not password:
            return jsonify({'error': 'Email and password are required'}), 400
        
        if not validate_email(email):
            return jsonify({'error': 'Invalid email format'}), 400
        
        # Get user from database
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute(
            "SELECT id, name, email, password_hash FROM users WHERE email = %s",
            (email,)
        )
        
        user = cursor.fetchone()
        cursor.close()
        conn.close()
        
        if not user:
            return jsonify({'error': 'Invalid credentials'}), 401
        
        # Verify password
        if not bcrypt.checkpw(password.encode('utf-8'), user['password_hash'].encode('utf-8')):
            return jsonify({'error': 'Invalid credentials'}), 401
        
        # Convert UUID to string for JSON serialization
        user_id = str(user['id'])
        
        # Generate JWT token
        token_payload = {
            'user_id': user_id,
            'email': user['email'],
            'exp': datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS),
            'iat': datetime.utcnow()
        }
        
        token = jwt.encode(token_payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
        
        print(f"✅ Login successful: {email}")
        
        return jsonify({
            'success': True,
            'token': token,
            'user': {
                'id': user_id,
                'name': user['name'],
                'email': user['email']
            }
        }), 200
        
    except Exception as e:
        print(f"❌ Login error: {e}")
        return jsonify({'error': 'Login failed', 'details': str(e)}), 500

@app.route('/api/auth/register', methods=['POST', 'OPTIONS'])
def register():
    """
    User registration endpoint
    Expected JSON payload:
    {
        "email": "user@example.com",
        "password": "password123",
        "name": "User Name" (optional, defaults to email prefix)
    }
    """
    if request.method == 'OPTIONS':
        return '', 204
    
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
        
        email = data.get('email', '').strip().lower()
        password = data.get('password', '')
        name = data.get('name', '').strip() or email.split('@')[0]
        
        # Validate input
        if not email or not password:
            return jsonify({'error': 'Email and password are required'}), 400
        
        if not validate_email(email):
            return jsonify({'error': 'Invalid email format'}), 400
        
        if not validate_password(password):
            return jsonify({'error': 'Password must be at least 6 characters'}), 400
        
        # Check if user exists
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute("SELECT id FROM users WHERE email = %s", (email,))
        existing_user = cursor.fetchone()
        
        if existing_user:
            cursor.close()
            conn.close()
            return jsonify({'error': 'User already exists'}), 409
        
        # Hash password
        password_hash = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')
        
        # Create user (UUID generated automatically by database)
        cursor.execute(
            """
            INSERT INTO users (name, email, password_hash)
            VALUES (%s, %s, %s)
            RETURNING id, name, email
            """,
            (name, email, password_hash)
        )
        
        new_user = cursor.fetchone()
        conn.commit()
        cursor.close()
        conn.close()
        
        # Convert UUID to string for JSON serialization
        user_id = str(new_user['id'])
        
        # Generate JWT token
        token_payload = {
            'user_id': user_id,
            'email': new_user['email'],
            'exp': datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS),
            'iat': datetime.utcnow()
        }
        
        token = jwt.encode(token_payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
        
        print(f"✅ Registration successful: {email}")
        
        return jsonify({
            'success': True,
            'token': token,
            'user': {
                'id': user_id,
                'name': new_user['name'],
                'email': new_user['email']
            }
        }), 201
        
    except Exception as e:
        print(f"❌ Registration error: {e}")
        return jsonify({'error': 'Registration failed', 'details': str(e)}), 500

@app.route('/api/auth/verify', methods=['GET', 'OPTIONS'])
@token_required
def verify_token(current_user_id):
    """Verify if token is valid"""
    if request.method == 'OPTIONS':
        return '', 204
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        cursor.execute(
            "SELECT id, name, email FROM users WHERE id = %s",
            (str(current_user_id),)
        )
        
        user = cursor.fetchone()
        cursor.close()
        conn.close()
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        return jsonify({
            'success': True,
            'valid': True,
            'user': {
                'id': str(user['id']),
                'name': user['name'],
                'email': user['email']
            }
        }), 200
        
    except Exception as e:
        print(f"❌ Token verification error: {e}")
        return jsonify({'error': 'Verification failed', 'details': str(e)}), 500

# ==================== HEALTH CHECK ====================

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    try:
        conn = get_db_connection()
        conn.close()
        return jsonify({
            'status': 'healthy',
            'database': 'connected',
            'timestamp': datetime.utcnow().isoformat()
        }), 200
    except Exception as e:
        return jsonify({
            'status': 'unhealthy',
            'database': 'disconnected',
            'error': str(e)
        }), 500

# ==================== METRICS ENDPOINTS ====================

@app.route('/api/extension/metrics', methods=['POST', 'OPTIONS'])
@token_required
def save_metrics(current_user_id):
    """
    Save LLM metrics from browser extension
    Expected JSON payload:
    {
        "site": "ChatGPT",
        "model": "GPT-4",
        "input_tokens_before": 150,
        "input_tokens_after": 200,
        "output_tokens": 350,
        "timestamp": 1234567890,
        "session_id": "session_xxx"
    }
    """
    if request.method == 'OPTIONS':
        return '', 204
    
    try:
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['site', 'model', 'input_tokens_after', 'output_tokens']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Extract metrics from payload
        llm = data.get('site', 'Unknown')
        model = data.get('model', 'Unknown')
        input_raw = data.get('input_tokens_before', 0)
        input_tokens = data.get('input_tokens_after', 0)
        output_tokens = data.get('output_tokens', 0)
        
        # Optional fields with defaults
        is_cached = data.get('is_cached', False)
        cloud_provider = data.get('cloud_provider', 'unknown')
        cloud_region = data.get('cloud_region', 'unknown')
        
        # Calculate environmental impact
        energy_kwh = calculate_energy(input_tokens, output_tokens, model)
        carbon_intensity = get_carbon_intensity(cloud_region)
        co2_grams = calculate_co2(energy_kwh, carbon_intensity)
        water_liters = calculate_water(input_tokens, output_tokens)
        grid_zone = get_grid_zone(cloud_region)
        
        # Insert into database (total_tokens is computed automatically)
        conn = get_db_connection()
        cursor = conn.cursor()
        
        insert_query = """
            INSERT INTO llmprompts (
                user_id, input_raw, input_tokens, output_tokens,
                is_cached, model, llm, energy_kwh, co2_grams,
                water_liters, cloud_provider, cloud_region,
                grid_zone, carbon_intensity_g_per_kwh
            ) VALUES (
                %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
            ) RETURNING id, total_tokens;
        """
        
        cursor.execute(insert_query, (
            str(current_user_id),
            input_raw,
            input_tokens,
            output_tokens,
            is_cached,
            model,
            llm,
            energy_kwh,
            co2_grams,
            water_liters,
            cloud_provider,
            cloud_region,
            grid_zone,
            carbon_intensity
        ))
        
        result = cursor.fetchone()
        conn.commit()
        cursor.close()
        conn.close()
        
        print(f"✅ Metrics saved for user {current_user_id}")
        
        return jsonify({
            'success': True,
            'id': result['id'],
            'message': 'Metrics saved successfully',
            'environmental_impact': {
                'energy_kwh': float(energy_kwh),
                'co2_grams': float(co2_grams),
                'water_liters': float(water_liters)
            },
            'total_tokens': result['total_tokens']
        }), 201
        
    except Exception as e:
        print(f"❌ Error saving metrics: {e}")
        return jsonify({'error': 'Failed to save metrics', 'details': str(e)}), 500

@app.route('/api/metrics/user', methods=['GET', 'OPTIONS'])
@token_required
def get_user_metrics(current_user_id):
    """Get all metrics for the current user"""
    if request.method == 'OPTIONS':
        return '', 204
    
    try:
        # Optional query parameters
        limit = request.args.get('limit', 100, type=int)
        offset = request.args.get('offset', 0, type=int)
        
        conn = get_db_connection()
        cursor = conn.cursor()
        
        query = """
            SELECT 
                id, input_raw, input_tokens, output_tokens, total_tokens,
                is_cached, model, llm, energy_kwh, co2_grams, water_liters,
                cloud_provider, cloud_region, captured_at
            FROM llmprompts
            WHERE user_id = %s
            ORDER BY captured_at DESC
            LIMIT %s OFFSET %s;
        """
        
        cursor.execute(query, (str(current_user_id), limit, offset))
        metrics = cursor.fetchall()
        
        # Get total count
        cursor.execute("SELECT COUNT(*) as count FROM llmprompts WHERE user_id = %s", (str(current_user_id),))
        total_count = cursor.fetchone()['count']
        
        cursor.close()
        conn.close()
        
        return jsonify({
            'success': True,
            'total': total_count,
            'limit': limit,
            'offset': offset,
            'metrics': metrics
        }), 200
        
    except Exception as e:
        print(f"❌ Error fetching metrics: {e}")
        return jsonify({'error': 'Failed to fetch metrics', 'details': str(e)}), 500

@app.route('/api/metrics/summary', methods=['GET', 'OPTIONS'])
@token_required
def get_metrics_summary(current_user_id):
    """Get aggregated metrics summary for the current user"""
    if request.method == 'OPTIONS':
        return '', 204
    
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        query = """
            SELECT 
                COUNT(*) as total_prompts,
                COALESCE(SUM(input_tokens), 0) as total_input_tokens,
                COALESCE(SUM(output_tokens), 0) as total_output_tokens,
                COALESCE(SUM(total_tokens), 0) as total_tokens,
                COALESCE(SUM(energy_kwh), 0) as total_energy_kwh,
                COALESCE(SUM(co2_grams), 0) as total_co2_grams,
                COALESCE(SUM(water_liters), 0) as total_water_liters,
                COALESCE(AVG(input_tokens), 0) as avg_input_tokens,
                COALESCE(AVG(output_tokens), 0) as avg_output_tokens
            FROM llmprompts
            WHERE user_id = %s;
        """
        
        cursor.execute(query, (str(current_user_id),))
        summary = cursor.fetchone()
        
        # Get breakdown by LLM
        cursor.execute("""
            SELECT 
                llm,
                COUNT(*) as count,
                SUM(total_tokens) as tokens
            FROM llmprompts
            WHERE user_id = %s
            GROUP BY llm
            ORDER BY count DESC;
        """, (str(current_user_id),))
        
        llm_breakdown = cursor.fetchall()
        
        cursor.close()
        conn.close()
        
        return jsonify({
            'success': True,
            'summary': summary,
            'llm_breakdown': llm_breakdown
        }), 200
        
    except Exception as e:
        print(f"❌ Error fetching summary: {e}")
        return jsonify({'error': 'Failed to fetch summary', 'details': str(e)}), 500

# ==================== HELPER FUNCTIONS ====================

def calculate_energy(input_tokens: int, output_tokens: int, model: str) -> float:
    """
    Calculate energy consumption in kWh
    Based on research: https://arxiv.org/abs/2311.16863
    """
    energy_per_token = {
        'GPT-4': 0.000001,
        'GPT-3.5': 0.0000005,
        'Claude': 0.0000008,
        'ChatGPT': 0.0000007,
        'Gemini': 0.0000006,
        'Copilot': 0.0000007,
        'default': 0.0000007
    }
    
    rate = energy_per_token.get(model, energy_per_token['default'])
    total_tokens = input_tokens + output_tokens
    return round(total_tokens * rate, 8)

def calculate_co2(energy_kwh: float, carbon_intensity: int = 475) -> float:
    """
    Calculate CO2 emissions in grams
    """
    return round(energy_kwh * carbon_intensity, 4)

def calculate_water(input_tokens: int, output_tokens: int) -> float:
    """
    Calculate water consumption in liters
    """
    total_tokens = input_tokens + output_tokens
    return round((total_tokens / 1000) * 0.5, 4)

def get_carbon_intensity(region: str) -> int:
    """
    Get carbon intensity for a region (g CO2/kWh)
    """
    intensities = {
        'us-east-1': 415,
        'us-west-2': 250,
        'eu-west-1': 300,
        'ap-south-1': 700,
        'unknown': 475
    }
    return intensities.get(region, intensities['unknown'])

def get_grid_zone(region: str) -> str:
    """Map cloud region to grid zone"""
    zones = {
        'us-east-1': 'US-EAST',
        'us-west-2': 'US-WEST',
        'eu-west-1': 'EU-WEST',
        'ap-south-1': 'ASIA-PAC',
        'unknown': 'GLOBAL'
    }
    return zones.get(region, zones['unknown'])

# ==================== ERROR HANDLERS ====================

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    print("🚀 Starting GAIA Flask Backend on port 3001...")
    print("📍 Authentication endpoint: http://localhost:3001/api/auth/exbackend")
    print("📍 Metrics endpoint: http://localhost:3001/api/extension/metrics")
    app.run(host='0.0.0.0', port=3001, debug=True)