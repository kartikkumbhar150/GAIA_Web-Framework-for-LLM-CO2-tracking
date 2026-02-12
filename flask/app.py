from flask import Flask, request, jsonify
from flask_cors import CORS
import datetime
import requests
from dataclasses import dataclass, asdict
from typing import Dict, Optional, List
import os

app = Flask(__name__)

# ✅ CORS Configuration
CORS(app, resources={
    r"/*": {
        "origins": [
            "http://localhost:3000",
            "https://*.vercel.app",
            os.getenv("FRONTEND_URL", "")
        ],
        "methods": ["GET", "POST", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"]
    }
})

# =========================
# DATA MODELS
# =========================

@dataclass
class ModelSpec:
    parameters_billion: float
    energy_per_1k_tokens_kwh: float
    provider: str
    architecture: str


@dataclass
class GridSpec:
    carbon_intensity_g_per_kwh: float
    grid_zone: str
    timestamp: str
    source: str


# =========================
# CORE TRACKER
# =========================

class EnvironmentalImpactTracker:

    def __init__(
        self,
        cloud_provider: str = "gcp",
        cloud_region: str = "asia-south1",
        electricity_maps_api_key: Optional[str] = None,
        pue: float = 1.1,
        gpu_utilization: float = 0.65,
        batching_efficiency: float = 0.9,
        confidence_margin: float = 0.30
    ):
        self.cloud_provider = cloud_provider.lower()
        self.cloud_region = cloud_region.lower()
        self.api_key = electricity_maps_api_key

        self.pue = pue
        self.gpu_utilization = gpu_utilization
        self.batching_efficiency = batching_efficiency
        self.confidence_margin = confidence_margin

        self.models = self._load_models()
        self.zone_map = self._load_cloud_zone_map()
        self.grid = self._fetch_hourly_grid_data()

    # =========================
    # MODEL DATABASE (EXTENDED 2026)
    # =========================

    def _load_models(self) -> Dict[str, ModelSpec]:
        return {
            # OpenAI
            "gpt-4o": ModelSpec(180, 0.0029, "openai", "transformer"),
            "gpt-4-turbo": ModelSpec(110, 0.0022, "openai", "transformer"),
            "gpt-4o-mini": ModelSpec(8, 0.00045, "openai", "transformer"),
            "gpt-3.5-turbo": ModelSpec(20, 0.00035, "openai", "transformer"),
            "o1-preview": ModelSpec(120, 0.0150, "openai", "o1-reasoning"),
            "o1-mini": ModelSpec(60, 0.0055, "openai", "o1-reasoning"),

            # Google
            "gemini-1.5-pro": ModelSpec(120, 0.0026, "google", "transformer-moe"),
            "gemini-1.5-flash": ModelSpec(15, 0.00012, "google", "transformer"),
            "gemini-2.0-flash": ModelSpec(25, 0.00018, "google", "transformer"),

            # Anthropic
            "claude-3-opus": ModelSpec(130, 0.0024, "anthropic", "transformer"),
            "claude-3.5-sonnet": ModelSpec(70, 0.0016, "anthropic", "transformer"),
            "claude-3-sonnet": ModelSpec(70, 0.0014, "anthropic", "transformer"),
            "claude-3-haiku": ModelSpec(20, 0.0003, "anthropic", "transformer"),

            # Meta
            "llama-3-8b": ModelSpec(8, 0.00006, "meta", "transformer"),
            "llama-3-70b": ModelSpec(70, 0.0013, "meta", "transformer"),
            "llama-3.1-8b": ModelSpec(8, 0.00008, "meta", "transformer"),
            "llama-3.1-70b": ModelSpec(70, 0.0015, "meta", "transformer"),
            "llama-3.1-405b": ModelSpec(405, 0.0070, "meta", "transformer"),

            # Mistral
            "mistral-large-2": ModelSpec(123, 0.0022, "mistral", "transformer"),
            "mixtral-8x7b": ModelSpec(46, 0.0008, "mistral", "moe"),
            "mixtral-8x22b": ModelSpec(141, 0.0020, "mistral", "moe"),

            # xAI
            "grok-2": ModelSpec(314, 0.0025, "xai", "moe"),

            # DeepSeek
            "deepseek-v3": ModelSpec(671, 0.0010, "deepseek", "moe"),

            # Alibaba
            "qwen2.5-72b": ModelSpec(72, 0.0013, "qwen", "transformer"),
        }

    # =========================
    # CLOUD → GRID ZONE MAP
    # =========================

    def _load_cloud_zone_map(self) -> Dict[str, Dict[str, str]]:
        return {
            "gcp": {
                "asia-south1": "IN",
                "us-central1": "US-MIDW-MISO",
                "europe-west1": "BE",
                "us-east1": "US-EAST-PJM",
                "us-west1": "US-CAL-CISO",
                "europe-north1": "FI",
                "asia-southeast1": "SG",
                "asia-northeast1": "JP-TK"
            },
            "aws": {
                "ap-south-1": "IN",
                "us-east-1": "US-EAST-PJM",
                "us-west-2": "US-NW-PACW",
                "eu-west-1": "IE",
                "eu-central-1": "DE",
                "ap-southeast-1": "SG",
                "ap-northeast-1": "JP-TK"
            },
            "azure": {
                "centralindia": "IN",
                "eastus": "US-EAST-PJM",
                "westus": "US-CAL-CISO",
                "westeurope": "NL",
                "northeurope": "IE",
                "southeastasia": "SG"
            }
        }

    # =========================
    # REAL-TIME + HOURLY GRID DATA
    # =========================

    def _fetch_hourly_grid_data(self) -> GridSpec:
        zone = self.zone_map.get(self.cloud_provider, {}).get(
            self.cloud_region, "IN"
        )

        # ---- fallback (no API key) ----
        if not self.api_key:
            # Regional fallback values (2025-26 averages)
            fallback_intensities = {
                "IN": 708,
                "US-MIDW-MISO": 420,
                "US-EAST-PJM": 385,
                "US-CAL-CISO": 250,
                "BE": 150,
                "FR": 90,
                "DE": 380,
                "IE": 320,
                "NL": 400,
                "FI": 85,
                "SG": 410,
                "JP-TK": 475
            }
            
            return GridSpec(
                carbon_intensity_g_per_kwh=fallback_intensities.get(zone, 450),
                grid_zone=zone,
                timestamp=datetime.datetime.now(datetime.timezone.utc).isoformat(),
                source=f"static fallback ({zone})"
            )

        # ---- Electricity Maps API ----
        headers = {"auth-token": self.api_key}
        url = (
            "https://api.electricitymap.org/v3/"
            f"carbon-intensity/latest?zone={zone}"
        )

        try:
            response = requests.get(url, headers=headers, timeout=6)
            response.raise_for_status()
            data = response.json()

            return GridSpec(
                carbon_intensity_g_per_kwh=data["carbonIntensity"],
                grid_zone=zone,
                timestamp=data["datetime"],
                source="electricity-maps (real-time)"
            )

        except Exception as e:
            print(f"Electricity Maps API error: {e}")
            # Use fallback on API error
            fallback_intensities = {
                "IN": 708,
                "US-MIDW-MISO": 420,
                "US-EAST-PJM": 385,
                "US-CAL-CISO": 250,
                "BE": 150
            }
            
            return GridSpec(
                carbon_intensity_g_per_kwh=fallback_intensities.get(zone, 450),
                grid_zone=zone,
                timestamp=datetime.datetime.now(datetime.timezone.utc).isoformat(),
                source=f"fallback (api error)"
            )

    # =========================
    # IMPACT ESTIMATION
    # =========================

    def estimate(
        self,
        model_name: str,
        input_tokens: int,
        output_tokens: int,
        cached: bool = False
    ) -> Dict:

        if model_name not in self.models:
            raise ValueError(f"Unsupported model: {model_name}")

        model = self.models[model_name]
        total_tokens = input_tokens + output_tokens

        base_energy = (total_tokens / 1000) * model.energy_per_1k_tokens_kwh

        total_energy_kwh = (
            base_energy
            * (1 / self.gpu_utilization)
            * (1 / self.batching_efficiency)
            * self.pue
            * (0.2 if cached else 1.0)
        )

        co2_g = total_energy_kwh * self.grid.carbon_intensity_g_per_kwh
        water_l = total_energy_kwh * 1.8

        return {
            "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
            "model": model_name,
            "provider": model.provider,
            "architecture": model.architecture,
            "parameters_billion": model.parameters_billion,
            "cloud": {
                "provider": self.cloud_provider,
                "region": self.cloud_region,
                "grid_zone": self.grid.grid_zone
            },
            "grid_data": {
                "carbon_intensity_g_per_kwh": self.grid.carbon_intensity_g_per_kwh,
                "measured_at": self.grid.timestamp,
                "source": self.grid.source
            },
            "tokens": {
                "input": input_tokens,
                "output": output_tokens,
                "total": total_tokens
            },
            "energy_kwh": round(total_energy_kwh, 6),
            "co2_grams": round(co2_g, 4),
            "water_liters": round(water_l, 4),
            "assumptions": {
                "pue": self.pue,
                "gpu_utilization": self.gpu_utilization,
                "batching_efficiency": self.batching_efficiency,
                "cached": cached
            },
            "confidence_interval": f"±{int(self.confidence_margin * 100)}%"
        }

    def get_supported_models(self) -> List[Dict]:
        """Return list of supported models with their specs"""
        return [
            {
                "name": name,
                "provider": spec.provider,
                "parameters_billion": spec.parameters_billion,
                "energy_per_1k_tokens_kwh": spec.energy_per_1k_tokens_kwh,
                "architecture": spec.architecture
            }
            for name, spec in self.models.items()
        ]


# =========================
# FLASK ROUTES
# =========================

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "service": "GAIA CO2 Calculator",
        "version": "1.0.0",
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat()
    }), 200


@app.route('/models', methods=['GET'])
def get_models():
    """Return supported models"""
    try:
        tracker = EnvironmentalImpactTracker(
            electricity_maps_api_key=os.getenv("ELECTRICITY_MAPS_API_KEY")
        )
        models = tracker.get_supported_models()
        
        return jsonify({
            "success": True,
            "count": len(models),
            "models": models
        }), 200
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 500


@app.route('/calculate', methods=['POST'])
def calculate():
    """Calculate environmental impact for a prompt"""
    try:
        # ✅ Validate request
        data = request.get_json()
        
        if not data:
            return jsonify({
                "success": False,
                "error": "Request body is required"
            }), 400
        
        # ✅ Extract parameters
        model_name = data.get('model_name')
        input_tokens = data.get('input_tokens')
        output_tokens = data.get('output_tokens')
        cached = data.get('cached', False)
        cloud_provider = data.get('cloud_provider', 'gcp')
        cloud_region = data.get('cloud_region', 'asia-south1')
        
        # ✅ Validation
        if not model_name:
            return jsonify({
                "success": False,
                "error": "model_name is required"
            }), 400
        
        if input_tokens is None or not isinstance(input_tokens, (int, float)) or input_tokens < 0:
            return jsonify({
                "success": False,
                "error": "input_tokens must be a non-negative number"
            }), 400
        
        if output_tokens is None or not isinstance(output_tokens, (int, float)) or output_tokens < 0:
            return jsonify({
                "success": False,
                "error": "output_tokens must be a non-negative number"
            }), 400
        
        # ✅ Create tracker instance
        tracker = EnvironmentalImpactTracker(
            cloud_provider=cloud_provider,
            cloud_region=cloud_region,
            electricity_maps_api_key=os.getenv("ELECTRICITY_MAPS_API_KEY")
        )
        
        # ✅ Calculate impact
        result = tracker.estimate(
            model_name=model_name,
            input_tokens=int(input_tokens),
            output_tokens=int(output_tokens),
            cached=bool(cached)
        )
        
        return jsonify(result), 200
        
    except ValueError as e:
        return jsonify({
            "success": False,
            "error": str(e)
        }), 400
        
    except Exception as e:
        print(f"Calculation error: {e}")
        return jsonify({
            "success": False,
            "error": "Internal server error",
            "message": str(e) if os.getenv("FLASK_ENV") == "development" else None
        }), 500


@app.route('/batch-calculate', methods=['POST'])
def batch_calculate():
    """Calculate environmental impact for multiple prompts"""
    try:
        data = request.get_json()
        
        if not data or 'prompts' not in data or not isinstance(data['prompts'], list):
            return jsonify({
                "success": False,
                "error": "Request must contain 'prompts' array"
            }), 400
        
        prompts = data['prompts']
        
        if len(prompts) > 100:
            return jsonify({
                "success": False,
                "error": "Maximum 100 prompts per batch request"
            }), 400
        
        # Get common settings
        cloud_provider = data.get('cloud_provider', 'gcp')
        cloud_region = data.get('cloud_region', 'asia-south1')
        
        tracker = EnvironmentalImpactTracker(
            cloud_provider=cloud_provider,
            cloud_region=cloud_region,
            electricity_maps_api_key=os.getenv("ELECTRICITY_MAPS_API_KEY")
        )
        
        results = []
        errors = []
        
        for idx, prompt in enumerate(prompts):
            try:
                result = tracker.estimate(
                    model_name=prompt['model_name'],
                    input_tokens=int(prompt['input_tokens']),
                    output_tokens=int(prompt['output_tokens']),
                    cached=prompt.get('cached', False)
                )
                results.append({
                    "index": idx,
                    "success": True,
                    "data": result
                })
            except Exception as e:
                errors.append({
                    "index": idx,
                    "error": str(e)
                })
        
        return jsonify({
            "success": True,
            "total": len(prompts),
            "successful": len(results),
            "failed": len(errors),
            "results": results,
            "errors": errors if errors else None
        }), 200
        
    except Exception as e:
        return jsonify({
            "success": False,
            "error": "Internal server error",
            "message": str(e)
        }), 500


# =========================
# MAIN
# =========================

if __name__ == "__main__":
    port = int(os.getenv("PORT", 5001))
    debug = os.getenv("FLASK_ENV") == "development"
    
    print(f"""
    ╔══════════════════════════════════════════════╗
    ║   GAIA - AI Carbon Footprint Calculator     ║
    ║   Flask Service Started                     ║
    ║   Port: {port}                                   ║
    ║   Debug: {debug}                                ║
    ╚══════════════════════════════════════════════╝
    """)
    
    app.run(
        host='0.0.0.0',
        port=port,
        debug=debug
    )