# example_client.py
"""
Example client demonstrating how to use the Carbon Optimizer API.
"""

import requests
import json
from typing import Dict, List


class CarbonOptimizerClient:
    """Client for interacting with the Carbon Optimizer API."""
    
    def __init__(self, base_url: str = "http://localhost:5000"):
        """Initialize client with API base URL."""
        self.base_url = base_url
        self.session = requests.Session()
    
    def health_check(self) -> Dict:
        """Check API health."""
        response = self.session.get(f"{self.base_url}/health")
        response.raise_for_status()
        return response.json()
    
    def optimize_workload(
        self,
        workload: str,
        priority: str = "carbon",
        region: str = None,
        duration_hours: float = 1.0
    ) -> Dict:
        """
        Get optimization recommendations for a workload.
        
        Args:
            workload: Type of workload (training, inference, general, etc.)
            priority: Optimization priority (carbon, performance, balanced)
            region: Optional specific region
            duration_hours: Expected duration
            
        Returns:
            Dict with recommendations and carbon impact analysis
        """
        payload = {
            "workload": workload,
            "priority": priority,
            "duration_hours": duration_hours
        }
        if region:
            payload["region"] = region
        
        response = self.session.post(
            f"{self.base_url}/api/v1/optimize",
            json=payload
        )
        response.raise_for_status()
        return response.json()
    
    def list_regions(self) -> Dict:
        """Get all regions ranked by carbon intensity."""
        response = self.session.get(f"{self.base_url}/api/v1/regions")
        response.raise_for_status()
        return response.json()
    
    def get_region_details(self, region: str) -> Dict:
        """Get detailed carbon information for a region."""
        response = self.session.get(f"{self.base_url}/api/v1/regions/{region}")
        response.raise_for_status()
        return response.json()
    
    def calculate_emissions(
        self,
        region: str,
        instance_type: str,
        duration_hours: float = 1.0
    ) -> Dict:
        """Calculate CO2 emissions for a specific instance and region."""
        response = self.session.post(
            f"{self.base_url}/api/v1/calculate",
            json={
                "region": region,
                "instance_type": instance_type,
                "duration_hours": duration_hours
            }
        )
        response.raise_for_status()
        return response.json()
    
    def compare_options(self, options: List[Dict], duration_hours: float = 1.0) -> Dict:
        """
        Compare multiple deployment options.
        
        Args:
            options: List of dicts with 'region' and 'instance_type'
            duration_hours: Duration for comparison
            
        Returns:
            Comparison results with best/worst options
        """
        response = self.session.post(
            f"{self.base_url}/api/v1/compare",
            json={
                "options": options,
                "duration_hours": duration_hours
            }
        )
        response.raise_for_status()
        return response.json()
    
    def find_optimal_schedule(self, region: str, duration_hours: int = 4) -> Dict:
        """Find the optimal time window for running a workload."""
        response = self.session.post(
            f"{self.base_url}/api/v1/schedule",
            json={
                "region": region,
                "duration_hours": duration_hours
            }
        )
        response.raise_for_status()
        return response.json()


def example_1_find_greenest_region_for_training():
    """Example: Find the greenest region for ML training."""
    print("\n=== Example 1: Find Greenest Region for ML Training ===\n")
    
    client = CarbonOptimizerClient()
    
    result = client.optimize_workload(
        workload="training",
        priority="carbon",
        duration_hours=48
    )
    
    top_recommendation = result['recommendation']['recommendations'][0]
    
    print(f"Best Region: {top_recommendation['region']}")
    print(f"Instance Type: {top_recommendation['instance_type']}")
    print(f"Carbon Intensity: {top_recommendation['carbon_intensity_gco2_kwh']} gCO2/kWh")
    print(f"Estimated CO2 Emissions: {top_recommendation['estimated_co2_emissions_kg']:.2f} kg")
    print(f"Renewable Energy: {top_recommendation['renewable_percentage']:.1f}%")
    
    savings = result['recommendation']['carbon_savings']
    print(f"\nCarbon Savings: {savings['potential_savings_kg']:.2f} kg ({savings['potential_savings_percentage']:.1f}%)")


def example_2_compare_deployment_options():
    """Example: Compare different deployment options."""
    print("\n=== Example 2: Compare Deployment Options ===\n")
    
    client = CarbonOptimizerClient()
    
    options = [
        {"region": "us-east-1", "instance_type": "inf2.xlarge"},
        {"region": "us-west-2", "instance_type": "inf2.xlarge"},
        {"region": "ca-central-1", "instance_type": "inf2.xlarge"},
        {"region": "eu-west-3", "instance_type": "inf2.xlarge"},
    ]
    
    result = client.compare_options(options, duration_hours=720)  # 1 month
    
    print("Comparison Results (sorted by lowest carbon):\n")
    
    for i, comparison in enumerate(result['comparisons'], 1):
        print(f"{i}. {comparison['region']} - {comparison['instance_type']}")
        print(f"   CO2: {comparison['co2_emissions_kg']:.2f} kg")
        print(f"   Carbon Intensity: {comparison['carbon_intensity_gco2_kwh']} gCO2/kWh")
        print(f"   Renewables: {comparison['renewable_percentage']:.1f}%\n")
    
    analysis = result['analysis']
    print(f"Choosing {analysis['best_option']['region']} over {analysis['worst_option']['region']}")
    print(f"saves {analysis['difference_kg']:.2f} kg CO2 ({analysis['difference_percentage']:.1f}%)")


def example_3_find_optimal_time_window():
    """Example: Find the optimal time to run a batch job."""
    print("\n=== Example 3: Find Optimal Time Window ===\n")
    
    client = CarbonOptimizerClient()
    
    result = client.find_optimal_schedule(
        region="eu-west-1",
        duration_hours=6
    )
    
    if result['status'] == 'success':
        window = result['optimal_window']
        print(f"Optimal Time Window:")
        print(f"  Start: {window['start_time']}")
        print(f"  End: {window['end_time']}")
        print(f"  Avg Carbon Intensity: {window['avg_carbon_intensity']} gCO2/kWh")
        
        savings = result['savings_potential']
        print(f"\nRunning during this window vs. now saves:")
        print(f"  {savings['current_vs_optimal_gco2_kwh']} gCO2/kWh")


def example_4_list_all_regions_by_carbon():
    """Example: Get all regions ranked by carbon intensity."""
    print("\n=== Example 4: Regions Ranked by Carbon Intensity ===\n")
    
    client = CarbonOptimizerClient()
    
    result = client.list_regions()
    
    print(f"Total Regions: {result['total_regions']}\n")
    print("Top 10 Greenest Regions:")
    print("-" * 70)
    
    for i, region in enumerate(result['regions'][:10], 1):
        renewable = region.get('renewable_percentage', 'N/A')
        renewable_str = f"{renewable:.1f}%" if renewable != 'N/A' else 'N/A'
        
        print(f"{i:2d}. {region['region']:20s} {region['carbon_intensity']:4.0f} gCO2/kWh  "
              f"({renewable_str} renewable)")


def example_5_detailed_region_analysis():
    """Example: Get detailed analysis for a specific region."""
    print("\n=== Example 5: Detailed Region Analysis ===\n")
    
    client = CarbonOptimizerClient()
    
    region = "us-west-2"
    result = client.get_region_details(region)
    
    details = result['region_details']
    
    print(f"Region: {details['region']} (Zone: {details['zone']})")
    print(f"Current Carbon Intensity: {details['current_carbon_intensity']} gCO2/kWh")
    print(f"Renewable Percentage: {details['renewable_percentage']:.1f}%")
    
    forecast = details['forecast_24h']
    if forecast['average']:
        print(f"\n24-Hour Forecast:")
        print(f"  Average: {forecast['average']:.1f} gCO2/kWh")
        print(f"  Minimum: {forecast['minimum']:.1f} gCO2/kWh")
        print(f"  Maximum: {forecast['maximum']:.1f} gCO2/kWh")
    
    if details['optimal_hours_utc']:
        print(f"\nOptimal Hours (UTC): {details['optimal_hours_utc']}")


def example_6_calculate_specific_workload():
    """Example: Calculate emissions for a specific workload."""
    print("\n=== Example 6: Calculate Specific Workload Emissions ===\n")
    
    client = CarbonOptimizerClient()
    
    # Calculate for 1 week of continuous operation
    result = client.calculate_emissions(
        region="us-east-1",
        instance_type="p4d.24xlarge",
        duration_hours=168  # 1 week
    )
    
    calc = result['calculation']
    
    print(f"Workload: {calc['instance_type']} in {calc['region']}")
    print(f"Duration: {calc['duration_hours']} hours (1 week)")
    print(f"Carbon Intensity: {calc['carbon_intensity_gco2_kwh']} gCO2/kWh")
    print(f"\nResults:")
    print(f"  Power Consumption: {calc['power_consumption_kwh']:.2f} kWh")
    print(f"  CO2 Emissions: {calc['co2_emissions_kg']:.2f} kg")
    print(f"                 ({calc['co2_emissions_g']:.0f} grams)")
    
    # Put it in perspective
    trees_to_offset = calc['co2_emissions_kg'] / 22  # ~22kg CO2/tree/year
    print(f"\nTo offset: {trees_to_offset:.1f} trees for 1 year")


def main():
    """Run all examples."""
    client = CarbonOptimizerClient()
    
    # Check API health first
    try:
        health = client.health_check()
        print(f"API Status: {health['status']}")
        print(f"API Configured: {health['api_configured']}")
    except requests.exceptions.RequestException as e:
        print(f"Error: Cannot connect to API at http://localhost:5000")
        print(f"Make sure the API is running: python app.py")
        return
    
    # Run examples
    try:
        example_1_find_greenest_region_for_training()
        example_2_compare_deployment_options()
        example_3_find_optimal_time_window()
        example_4_list_all_regions_by_carbon()
        example_5_detailed_region_analysis()
        example_6_calculate_specific_workload()
        
        print("\n" + "=" * 70)
        print("All examples completed successfully!")
        print("=" * 70)
        
    except requests.exceptions.HTTPError as e:
        print(f"\nAPI Error: {e}")
        print(f"Response: {e.response.text}")
    except Exception as e:
        print(f"\nError: {e}")


if __name__ == "__main__":
    main()
