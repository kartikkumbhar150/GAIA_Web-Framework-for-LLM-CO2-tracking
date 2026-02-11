# engine.py
"""
Carbon-aware cloud optimization engine.
Integrates with Electricity Maps API for real-time carbon intensity data.
"""

import requests
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple
from cachetools import TTLCache
import logging

from mapping import (
    REGION_TO_ZONE,
    INSTANCE_CATALOG,
    INSTANCE_CARBON_FACTORS,
    SERVICE_OPTIMIZATIONS,
    REGION_LOW_CARBON_HOURS,
)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class CarbonEngine:
    """
    Main engine for carbon-aware cloud resource recommendations.
    """
    
    def __init__(self, api_key: str):
        """
        Initialize the carbon engine.
        
        Args:
            api_key: Electricity Maps API key
        """
        self.api_key = api_key
        self.base_url = "https://api.electricitymap.org/v3"
        
        # Cache carbon intensity data for 5 minutes
        self.carbon_cache = TTLCache(maxsize=100, ttl=300)
        
        # Cache forecast data for 30 minutes
        self.forecast_cache = TTLCache(maxsize=100, ttl=1800)
    
    def get_carbon_intensity(self, zone: str) -> Optional[Dict]:
        """
        Get current carbon intensity for a zone from Electricity Maps.
        
        Args:
            zone: Electricity Maps zone identifier
            
        Returns:
            Dict with carbon intensity data or None if unavailable
        """
        # Check cache first
        if zone in self.carbon_cache:
            logger.info(f"Using cached carbon data for {zone}")
            return self.carbon_cache[zone]
        
        try:
            headers = {"auth-token": self.api_key}
            url = f"{self.base_url}/carbon-intensity/latest"
            params = {"zone": zone}
            
            response = requests.get(url, headers=headers, params=params, timeout=5)
            response.raise_for_status()
            
            data = response.json()
            
            result = {
                "carbon_intensity": data.get("carbonIntensity"),  # gCO2eq/kWh
                "fossil_percentage": data.get("fossilFreePercentage"),
                "renewable_percentage": data.get("renewablePercentage"),
                "zone": zone,
                "datetime": data.get("datetime"),
            }
            
            # Cache the result
            self.carbon_cache[zone] = result
            
            logger.info(f"Fetched carbon intensity for {zone}: {result['carbon_intensity']} gCO2eq/kWh")
            return result
            
        except requests.RequestException as e:
            logger.error(f"Error fetching carbon intensity for {zone}: {e}")
            # Return estimated fallback data
            return self._get_fallback_intensity(zone)
    
    def get_carbon_forecast(self, zone: str) -> Optional[List[Dict]]:
        """
        Get 24-hour carbon intensity forecast for a zone.
        
        Args:
            zone: Electricity Maps zone identifier
            
        Returns:
            List of forecasted carbon intensity data points
        """
        # Check cache first
        if zone in self.forecast_cache:
            logger.info(f"Using cached forecast data for {zone}")
            return self.forecast_cache[zone]
        
        try:
            headers = {"auth-token": self.api_key}
            url = f"{self.base_url}/carbon-intensity/forecast"
            params = {"zone": zone}
            
            response = requests.get(url, headers=headers, params=params, timeout=5)
            response.raise_for_status()
            
            data = response.json()
            forecast = data.get("forecast", [])
            
            # Cache the result
            self.forecast_cache[zone] = forecast
            
            logger.info(f"Fetched forecast for {zone}: {len(forecast)} data points")
            return forecast
            
        except requests.RequestException as e:
            logger.error(f"Error fetching forecast for {zone}: {e}")
            return None
    
    def _get_fallback_intensity(self, zone: str) -> Dict:
        """
        Provide estimated carbon intensity when API is unavailable.
        Based on known grid mix characteristics.
        """
        # Fallback estimates based on typical grid mix (gCO2eq/kWh)
        fallback_intensities = {
            "CA-QC": 30,      # Hydro-dominant
            "SE": 35,         # Hydro/Nuclear
            "FR": 60,         # Nuclear-dominant
            "CH": 50,         # Hydro/Nuclear
            "US-NW-PACW": 85, # Hydro + some gas
            "BR-CS": 90,      # Hydro + some fossil
            "IE": 280,        # Wind + gas
            "GB": 250,        # Mix
            "DE": 380,        # Coal + renewables
            "US-CAL-CISO": 260,
            "US-MIDW-PJM": 420,  # Coal-heavy
            "IN-WE": 650,     # Coal-dominant
            "SG": 480,        # Gas-dominant
            "AUS-NSW": 650,   # Coal-heavy
            "ZA": 900,        # Coal-dominant
        }
        
        return {
            "carbon_intensity": fallback_intensities.get(zone, 400),
            "fossil_percentage": None,
            "renewable_percentage": None,
            "zone": zone,
            "datetime": datetime.utcnow().isoformat(),
            "is_estimate": True,
        }
    
    def calculate_instance_carbon_output(
        self, 
        instance_type: str, 
        carbon_intensity: float,
        duration_hours: float = 1.0
    ) -> Dict:
        """
        Calculate CO2 emissions for an instance type.
        
        Args:
            instance_type: AWS instance type (e.g., 'p4d.24xlarge')
            carbon_intensity: Grid carbon intensity in gCO2eq/kWh
            duration_hours: Duration to calculate for
            
        Returns:
            Dict with carbon emissions data
        """
        # Extract instance family
        family = instance_type.split('.')[0]
        
        # Get carbon factor (relative power consumption)
        carbon_factor = INSTANCE_CARBON_FACTORS.get(family, 0.3)
        
        # Estimate power consumption in kWh
        # Base assumption: factor represents average kW draw
        power_kwh = carbon_factor * duration_hours
        
        # Calculate CO2 emissions
        co2_emissions_g = power_kwh * carbon_intensity
        co2_emissions_kg = co2_emissions_g / 1000
        
        return {
            "instance_type": instance_type,
            "power_consumption_kwh": round(power_kwh, 3),
            "co2_emissions_g": round(co2_emissions_g, 2),
            "co2_emissions_kg": round(co2_emissions_kg, 4),
            "duration_hours": duration_hours,
            "carbon_intensity_used": carbon_intensity,
        }
    
    def rank_regions_by_carbon(self) -> List[Dict]:
        """
        Rank all AWS regions by current carbon intensity.
        
        Returns:
            List of regions sorted by carbon intensity (lowest first)
        """
        region_data = []
        
        for region, zone in REGION_TO_ZONE.items():
            intensity_data = self.get_carbon_intensity(zone)
            if intensity_data:
                region_data.append({
                    "region": region,
                    "zone": zone,
                    "carbon_intensity": intensity_data["carbon_intensity"],
                    "renewable_percentage": intensity_data.get("renewable_percentage"),
                    "is_estimate": intensity_data.get("is_estimate", False),
                })
        
        # Sort by carbon intensity (ascending)
        region_data.sort(key=lambda x: x["carbon_intensity"])
        
        return region_data
    
    def find_best_time_window(self, zone: str, duration_hours: int = 4) -> Optional[Dict]:
        """
        Find the optimal time window with lowest carbon intensity.
        
        Args:
            zone: Electricity Maps zone
            duration_hours: Required duration for the workload
            
        Returns:
            Dict with optimal time window information
        """
        forecast = self.get_carbon_forecast(zone)
        if not forecast or len(forecast) < duration_hours:
            return None
        
        best_window = None
        best_avg_intensity = float('inf')
        
        # Sliding window to find optimal period
        for i in range(len(forecast) - duration_hours + 1):
            window = forecast[i:i + duration_hours]
            avg_intensity = sum(point.get("carbonIntensity", 0) for point in window) / len(window)
            
            if avg_intensity < best_avg_intensity:
                best_avg_intensity = avg_intensity
                best_window = {
                    "start_time": window[0].get("datetime"),
                    "end_time": window[-1].get("datetime"),
                    "avg_carbon_intensity": round(avg_intensity, 2),
                    "duration_hours": duration_hours,
                }
        
        return best_window
    
    def suggest(
        self, 
        workload: str, 
        priority: str = "carbon",
        region_preference: Optional[str] = None,
        duration_hours: float = 1.0
    ) -> Dict:
        """
        Main recommendation engine.
        
        Args:
            workload: Type of workload (training, inference, general, database, containers, serverless)
            priority: Optimization priority (carbon, performance, balanced)
            region_preference: Optional preferred region
            duration_hours: Expected workload duration
            
        Returns:
            Comprehensive recommendation with carbon impact analysis
        """
        logger.info(f"Generating recommendation for workload={workload}, priority={priority}")
        
        # Get all regions ranked by carbon
        ranked_regions = self.rank_regions_by_carbon()
        
        # Filter by region preference if provided
        if region_preference:
            ranked_regions = [r for r in ranked_regions if r["region"] == region_preference]
            if not ranked_regions:
                raise ValueError(f"Region {region_preference} not found or unavailable")
        
        # Select top regions based on priority
        if priority == "carbon":
            top_regions = ranked_regions[:5]  # Top 5 lowest carbon
        elif priority == "performance":
            top_regions = ranked_regions  # Consider all, will prioritize performance instances
        else:  # balanced
            top_regions = ranked_regions[:10]
        
        # Get instance recommendations for the workload
        instances = self._get_workload_instances(workload, priority)
        
        # Calculate carbon impact for each region-instance combination
        recommendations = []
        
        for region_info in top_regions[:3]:  # Top 3 regions
            region = region_info["region"]
            zone = region_info["zone"]
            carbon_intensity = region_info["carbon_intensity"]
            
            # Get optimal time window
            time_window = self.find_best_time_window(zone, int(duration_hours))
            
            for instance_type in instances[:5]:  # Top 5 instances per region
                carbon_data = self.calculate_instance_carbon_output(
                    instance_type, 
                    carbon_intensity,
                    duration_hours
                )
                
                recommendations.append({
                    "region": region,
                    "zone": zone,
                    "instance_type": instance_type,
                    "carbon_intensity_gco2_kwh": carbon_intensity,
                    "renewable_percentage": region_info.get("renewable_percentage"),
                    "estimated_co2_emissions_kg": carbon_data["co2_emissions_kg"],
                    "estimated_co2_emissions_g": carbon_data["co2_emissions_g"],
                    "power_consumption_kwh": carbon_data["power_consumption_kwh"],
                    "duration_hours": duration_hours,
                    "optimal_time_window": time_window,
                    "is_carbon_estimate": region_info.get("is_estimate", False),
                })
        
        # Sort recommendations
        if priority == "carbon":
            recommendations.sort(key=lambda x: x["estimated_co2_emissions_kg"])
        elif priority == "performance":
            # Performance instances come first in the list, so maintain order
            pass
        else:  # balanced
            # Balance between carbon and performance
            recommendations.sort(key=lambda x: (
                x["estimated_co2_emissions_kg"] * 0.6 + 
                (1 if 'graviton' not in x["instance_type"].lower() else 0) * 0.4
            ))
        
        # Get service-specific optimizations
        service_opts = SERVICE_OPTIMIZATIONS.get("ec2", {})
        
        # Calculate carbon savings compared to worst option
        if recommendations:
            worst_co2 = max(r["estimated_co2_emissions_kg"] for r in recommendations)
            best_co2 = recommendations[0]["estimated_co2_emissions_kg"]
            carbon_savings_kg = worst_co2 - best_co2
            carbon_savings_pct = ((worst_co2 - best_co2) / worst_co2 * 100) if worst_co2 > 0 else 0
        else:
            carbon_savings_kg = 0
            carbon_savings_pct = 0
        
        return {
            "workload_type": workload,
            "priority": priority,
            "timestamp": datetime.utcnow().isoformat(),
            "recommendations": recommendations[:10],  # Top 10
            "carbon_savings": {
                "potential_savings_kg": round(carbon_savings_kg, 4),
                "potential_savings_percentage": round(carbon_savings_pct, 2),
                "comparison": f"Best option emits {carbon_savings_pct:.1f}% less CO2 than worst option"
            },
            "service_optimizations": service_opts.get("recommendations", []),
            "metadata": {
                "total_regions_analyzed": len(ranked_regions),
                "duration_hours": duration_hours,
                "api_data_freshness": "Real-time (5min cache)" if not recommendations[0].get("is_carbon_estimate") else "Estimated",
            }
        }
    
    def _get_workload_instances(self, workload: str, priority: str) -> List[str]:
        """
        Get recommended instance types for a workload based on priority.
        """
        instances = []
        
        workload_catalog = INSTANCE_CATALOG.get(workload, {})
        
        if priority == "carbon":
            # Prioritize Graviton and efficient instances
            if workload == "training":
                instances.extend(workload_catalog.get("gpu_cost_optimized", []))
                instances.extend(workload_catalog.get("gpu_standard", []))
            elif workload == "inference":
                instances.extend(workload_catalog.get("inferentia", []))
                instances.extend(workload_catalog.get("cpu_inference", []))
            elif workload == "general":
                instances.extend(workload_catalog.get("graviton_optimized", []))
            elif workload == "database":
                instances.extend(workload_catalog.get("memory_optimized", []))
            elif workload == "containers":
                instances.extend(workload_catalog.get("fargate", []))
                instances.extend(workload_catalog.get("eks_nodes", []))
            elif workload == "serverless":
                instances.extend(workload_catalog.get("lambda", []))
        
        elif priority == "performance":
            # Prioritize highest performance instances
            if workload == "training":
                instances.extend(workload_catalog.get("gpu_high_performance", []))
                instances.extend(workload_catalog.get("gpu_standard", []))
            elif workload == "inference":
                instances.extend(workload_catalog.get("gpu_inference", []))
                instances.extend(workload_catalog.get("inferentia", []))
            elif workload == "general":
                instances.extend(workload_catalog.get("standard", []))
                instances.extend(workload_catalog.get("graviton_optimized", []))
            elif workload == "database":
                instances.extend(workload_catalog.get("memory_optimized", []))
            elif workload == "containers":
                instances.extend(workload_catalog.get("eks_nodes", []))
            elif workload == "serverless":
                instances.extend(workload_catalog.get("lambda", []))
        
        else:  # balanced
            # Mix of efficient and performant instances
            for category in workload_catalog.values():
                if isinstance(category, list):
                    instances.extend(category)
        
        return instances[:15] if instances else ["t3.medium"]  # Fallback
    
    def get_region_details(self, region: str) -> Dict:
        """
        Get detailed carbon information for a specific region.
        """
        zone = REGION_TO_ZONE.get(region)
        if not zone:
            raise ValueError(f"Region {region} not supported")
        
        intensity_data = self.get_carbon_intensity(zone)
        forecast = self.get_carbon_forecast(zone)
        
        # Calculate 24h average from forecast
        avg_24h = None
        min_24h = None
        max_24h = None
        
        if forecast:
            intensities = [p.get("carbonIntensity") for p in forecast if p.get("carbonIntensity")]
            if intensities:
                avg_24h = sum(intensities) / len(intensities)
                min_24h = min(intensities)
                max_24h = max(intensities)
        
        return {
            "region": region,
            "zone": zone,
            "current_carbon_intensity": intensity_data.get("carbon_intensity"),
            "renewable_percentage": intensity_data.get("renewable_percentage"),
            "fossil_free_percentage": intensity_data.get("fossil_percentage"),
            "forecast_24h": {
                "average": round(avg_24h, 2) if avg_24h else None,
                "minimum": round(min_24h, 2) if min_24h else None,
                "maximum": round(max_24h, 2) if max_24h else None,
            },
            "optimal_hours_utc": REGION_LOW_CARBON_HOURS.get(region, []),
            "timestamp": intensity_data.get("datetime"),
        }
