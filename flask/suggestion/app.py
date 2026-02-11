# app.py
"""
Production-ready Flask API for carbon-aware cloud optimization.
"""

from flask import Flask, request, jsonify
from engine import CarbonEngine
import os
import logging
from datetime import datetime
from functools import wraps

from dotenv import load_dotenv
load_dotenv()
 
# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
app.config['JSON_SORT_KEYS'] = False

# Get API key from environment
API_KEY = os.getenv("EL_MAPS_API_KEY")
if not API_KEY:
    logger.warning("EL_MAPS_API_KEY not set - API will use fallback estimates")

# Initialize carbon engine
engine = CarbonEngine(API_KEY)

# Request counter for IDs
request_counter = {"count": 0}


def generate_request_id():
    """Generate unique request ID."""
    request_counter["count"] += 1
    return f"carbon_req_{request_counter['count']:06d}"


def handle_errors(f):
    """Decorator for error handling."""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            return f(*args, **kwargs)
        except ValueError as e:
            logger.error(f"Validation error: {e}")
            return jsonify({
                "status": "error",
                "error_type": "validation_error",
                "message": str(e),
                "timestamp": datetime.utcnow().isoformat()
            }), 400
        except Exception as e:
            logger.error(f"Internal error: {e}", exc_info=True)
            return jsonify({
                "status": "error",
                "error_type": "internal_error",
                "message": "An internal error occurred",
                "timestamp": datetime.utcnow().isoformat()
            }), 500
    return decorated_function


@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint."""
    return jsonify({
        "status": "healthy",
        "service": "carbon-optimizer",
        "timestamp": datetime.utcnow().isoformat(),
        "api_configured": API_KEY is not None
    })


@app.route('/api/v1/optimize', methods=['POST'])
@handle_errors
def optimize_workload():
    """
    Main optimization endpoint.
    
    Request body:
    {
        "workload": "training|inference|general|database|containers|serverless",
        "priority": "carbon|performance|balanced",
        "region": "us-east-1" (optional),
        "duration_hours": 1.0 (optional)
    }
    """
    data = request.get_json()
    
    if not data:
        return jsonify({
            "status": "error",
            "message": "Request body required"
        }), 400
    
    # Extract and validate parameters
    workload = data.get('workload', 'general')
    priority = data.get('priority', 'carbon')
    region = data.get('region')
    duration_hours = float(data.get('duration_hours', 1.0))
    
    # Validate workload
    valid_workloads = ['training', 'inference', 'general', 'database', 'containers', 'serverless']
    if workload not in valid_workloads:
        return jsonify({
            "status": "error",
            "message": f"Invalid workload. Must be one of: {', '.join(valid_workloads)}"
        }), 400
    
    # Validate priority
    valid_priorities = ['carbon', 'performance', 'balanced']
    if priority not in valid_priorities:
        return jsonify({
            "status": "error",
            "message": f"Invalid priority. Must be one of: {', '.join(valid_priorities)}"
        }), 400
    
    # Validate duration
    if duration_hours <= 0 or duration_hours > 8760:  # Max 1 year
        return jsonify({
            "status": "error",
            "message": "duration_hours must be between 0 and 8760"
        }), 400
    
    logger.info(f"Optimization request: workload={workload}, priority={priority}, region={region}")
    
    # Get recommendation
    recommendation = engine.suggest(
        workload=workload,
        priority=priority,
        region_preference=region,
        duration_hours=duration_hours
    )
    
    return jsonify({
        "status": "success",
        "request_id": generate_request_id(),
        "recommendation": recommendation
    })


@app.route('/api/v1/regions', methods=['GET'])
@handle_errors
def list_regions():
    """
    List all regions ranked by carbon intensity.
    
    Returns current carbon intensity for all AWS regions.
    """
    logger.info("Listing all regions by carbon intensity")
    
    regions = engine.rank_regions_by_carbon()
    
    return jsonify({
        "status": "success",
        "request_id": generate_request_id(),
        "timestamp": datetime.utcnow().isoformat(),
        "total_regions": len(regions),
        "regions": regions
    })


@app.route('/api/v1/regions/<region>', methods=['GET'])
@handle_errors
def get_region_details(region):
    """
    Get detailed carbon information for a specific region.
    
    Includes current intensity, forecast, and optimal scheduling windows.
    """
    logger.info(f"Fetching details for region: {region}")
    
    details = engine.get_region_details(region)
    
    return jsonify({
        "status": "success",
        "request_id": generate_request_id(),
        "region_details": details
    })


@app.route('/api/v1/calculate', methods=['POST'])
@handle_errors
def calculate_emissions():
    """
    Calculate CO2 emissions for a specific instance and region.
    
    Request body:
    {
        "region": "us-east-1",
        "instance_type": "p4d.24xlarge",
        "duration_hours": 24
    }
    """
    data = request.get_json()
    
    if not data:
        return jsonify({
            "status": "error",
            "message": "Request body required"
        }), 400
    
    region = data.get('region')
    instance_type = data.get('instance_type')
    duration_hours = float(data.get('duration_hours', 1.0))
    
    if not region or not instance_type:
        return jsonify({
            "status": "error",
            "message": "region and instance_type are required"
        }), 400
    
    # Get region details
    details = engine.get_region_details(region)
    carbon_intensity = details['current_carbon_intensity']
    
    # Calculate emissions
    calculation = engine.calculate_instance_carbon_output(
        instance_type=instance_type,
        carbon_intensity=carbon_intensity,
        duration_hours=duration_hours
    )
    
    return jsonify({
        "status": "success",
        "request_id": generate_request_id(),
        "calculation": {
            **calculation,
            "region": region,
            "zone": details['zone'],
            "carbon_intensity_gco2_kwh": carbon_intensity,
        }
    })


@app.route('/api/v1/compare', methods=['POST'])
@handle_errors
def compare_options():
    """
    Compare multiple region/instance combinations.
    
    Request body:
    {
        "options": [
            {"region": "us-east-1", "instance_type": "p4d.24xlarge"},
            {"region": "us-west-2", "instance_type": "p4d.24xlarge"},
            {"region": "ca-central-1", "instance_type": "p4d.24xlarge"}
        ],
        "duration_hours": 24
    }
    """
    data = request.get_json()
    
    if not data:
        return jsonify({
            "status": "error",
            "message": "Request body required"
        }), 400
    
    options = data.get('options', [])
    duration_hours = float(data.get('duration_hours', 1.0))
    
    if not options or len(options) > 20:
        return jsonify({
            "status": "error",
            "message": "Provide 1-20 options to compare"
        }), 400
    
    comparisons = []
    
    for opt in options:
        region = opt.get('region')
        instance_type = opt.get('instance_type')
        
        if not region or not instance_type:
            continue
        
        try:
            details = engine.get_region_details(region)
            carbon_intensity = details['current_carbon_intensity']
            
            calculation = engine.calculate_instance_carbon_output(
                instance_type=instance_type,
                carbon_intensity=carbon_intensity,
                duration_hours=duration_hours
            )
            
            comparisons.append({
                "region": region,
                "zone": details['zone'],
                "instance_type": instance_type,
                "carbon_intensity_gco2_kwh": carbon_intensity,
                "co2_emissions_kg": calculation['co2_emissions_kg'],
                "co2_emissions_g": calculation['co2_emissions_g'],
                "power_consumption_kwh": calculation['power_consumption_kwh'],
                "renewable_percentage": details.get('renewable_percentage'),
            })
        except Exception as e:
            logger.error(f"Error comparing option {opt}: {e}")
            continue
    
    # Sort by emissions (lowest first)
    comparisons.sort(key=lambda x: x['co2_emissions_kg'])
    
    # Calculate differences
    if comparisons:
        best = comparisons[0]
        worst = comparisons[-1]
        difference_kg = worst['co2_emissions_kg'] - best['co2_emissions_kg']
        difference_pct = (difference_kg / worst['co2_emissions_kg'] * 100) if worst['co2_emissions_kg'] > 0 else 0
    else:
        difference_kg = 0
        difference_pct = 0
    
    return jsonify({
        "status": "success",
        "request_id": generate_request_id(),
        "comparisons": comparisons,
        "analysis": {
            "best_option": comparisons[0] if comparisons else None,
            "worst_option": comparisons[-1] if comparisons else None,
            "difference_kg": round(difference_kg, 4),
            "difference_percentage": round(difference_pct, 2),
            "total_options_compared": len(comparisons)
        }
    })


@app.route('/api/v1/schedule', methods=['POST'])
@handle_errors
def find_optimal_schedule():
    """
    Find optimal scheduling window for a workload.
    
    Request body:
    {
        "region": "us-east-1",
        "duration_hours": 4
    }
    """
    data = request.get_json()
    
    if not data:
        return jsonify({
            "status": "error",
            "message": "Request body required"
        }), 400
    
    region = data.get('region')
    duration_hours = int(data.get('duration_hours', 4))
    
    if not region:
        return jsonify({
            "status": "error",
            "message": "region is required"
        }), 400
    
    # Get region details
    details = engine.get_region_details(region)
    zone = details['zone']
    
    # Find optimal window
    window = engine.find_best_time_window(zone, duration_hours)
    
    if not window:
        return jsonify({
            "status": "error",
            "message": "Unable to generate forecast for this region"
        }), 404
    
    return jsonify({
        "status": "success",
        "request_id": generate_request_id(),
        "region": region,
        "zone": zone,
        "optimal_window": window,
        "current_intensity": details['current_carbon_intensity'],
        "savings_potential": {
            "current_vs_optimal_gco2_kwh": round(
                details['current_carbon_intensity'] - window['avg_carbon_intensity'], 
                2
            )
        }
    })


@app.errorhandler(404)
def not_found(e):
    """Handle 404 errors."""
    return jsonify({
        "status": "error",
        "error_type": "not_found",
        "message": "Endpoint not found",
        "timestamp": datetime.utcnow().isoformat()
    }), 404


@app.errorhandler(405)
def method_not_allowed(e):
    """Handle 405 errors."""
    return jsonify({
        "status": "error",
        "error_type": "method_not_allowed",
        "message": "Method not allowed",
        "timestamp": datetime.utcnow().isoformat()
    }), 405


if __name__ == '__main__':
    # Development server
    logger.info("Starting Carbon Optimizer API in development mode")
    app.run(host='0.0.0.0', port=5000, debug=False)
