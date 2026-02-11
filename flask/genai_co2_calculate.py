import datetime
import requests
from dataclasses import dataclass
from typing import Dict, Optional


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
                "us-central1": "US",
                "europe-west1": "FR"
            },
            "aws": {
                "ap-south-1": "IN",
                "us-east-1": "US",
                "eu-west-1": "FR"
            },
            "azure": {
                "centralindia": "IN",
                "eastus": "US",
                "westeurope": "FR"
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
            return GridSpec(
                carbon_intensity_g_per_kwh=708,
                grid_zone=zone,
                timestamp=datetime.datetime.now(datetime.timezone.utc).isoformat(),
                source="static fallback (India avg 2025–26)"
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
                source="electricity-maps (hourly)"
            )

        except Exception:
            return GridSpec(
                carbon_intensity_g_per_kwh=708,
                grid_zone=zone,
                timestamp=datetime.datetime.now(datetime.timezone.utc).isoformat(),
                source="fallback (api error)"
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


# =========================
# EXAMPLE RUN
# =========================

if __name__ == "__main__":
    tracker = EnvironmentalImpactTracker(
        cloud_provider="gcp",
        cloud_region="asia-south1",
        electricity_maps_api_key=None  # add key for live grid data
    )

    report = tracker.estimate(
        model_name="deepseek-v3",
        input_tokens=1200,
        output_tokens=800,
        cached=False
    )

    for k, v in report.items():
        print(f"{k}: {v}")
