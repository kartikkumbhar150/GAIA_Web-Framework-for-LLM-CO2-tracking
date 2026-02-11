# test_api.py
"""
Comprehensive test suite for the Carbon Optimizer API.
Run with: pytest test_api.py -v
"""

import pytest
import json
from app import app, engine


@pytest.fixture
def client():
    """Create test client."""
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client


class TestHealthEndpoint:
    """Test health check endpoint."""
    
    def test_health_check(self, client):
        """Test health endpoint returns 200."""
        response = client.get('/health')
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['status'] == 'healthy'
        assert 'timestamp' in data


class TestOptimizeEndpoint:
    """Test main optimization endpoint."""
    
    def test_optimize_training_workload(self, client):
        """Test optimization for training workload."""
        response = client.post('/api/v1/optimize',
            json={
                'workload': 'training',
                'priority': 'carbon',
                'duration_hours': 24
            },
            content_type='application/json'
        )
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['status'] == 'success'
        assert 'recommendation' in data
        assert len(data['recommendation']['recommendations']) > 0
    
    def test_optimize_inference_workload(self, client):
        """Test optimization for inference workload."""
        response = client.post('/api/v1/optimize',
            json={
                'workload': 'inference',
                'priority': 'performance',
                'duration_hours': 1
            },
            content_type='application/json'
        )
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['status'] == 'success'
    
    def test_optimize_with_region_preference(self, client):
        """Test optimization with specific region."""
        response = client.post('/api/v1/optimize',
            json={
                'workload': 'general',
                'priority': 'balanced',
                'region': 'us-west-2',
                'duration_hours': 2
            },
            content_type='application/json'
        )
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['status'] == 'success'
    
    def test_optimize_invalid_workload(self, client):
        """Test optimization with invalid workload."""
        response = client.post('/api/v1/optimize',
            json={
                'workload': 'invalid',
                'priority': 'carbon'
            },
            content_type='application/json'
        )
        assert response.status_code == 400
    
    def test_optimize_missing_body(self, client):
        """Test optimization without request body."""
        response = client.post('/api/v1/optimize')
        assert response.status_code == 400


class TestRegionsEndpoint:
    """Test regions listing endpoint."""
    
    def test_list_regions(self, client):
        """Test listing all regions."""
        response = client.get('/api/v1/regions')
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['status'] == 'success'
        assert 'regions' in data
        assert len(data['regions']) > 0
        assert data['total_regions'] > 0
    
    def test_get_region_details(self, client):
        """Test getting specific region details."""
        response = client.get('/api/v1/regions/us-west-2')
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['status'] == 'success'
        assert data['region_details']['region'] == 'us-west-2'
        assert 'current_carbon_intensity' in data['region_details']
    
    def test_get_invalid_region(self, client):
        """Test getting details for invalid region."""
        response = client.get('/api/v1/regions/invalid-region')
        assert response.status_code == 500  # Will fail validation in engine


class TestCalculateEndpoint:
    """Test emissions calculation endpoint."""
    
    def test_calculate_emissions(self, client):
        """Test calculating emissions for specific instance."""
        response = client.post('/api/v1/calculate',
            json={
                'region': 'us-east-1',
                'instance_type': 'p4d.24xlarge',
                'duration_hours': 24
            },
            content_type='application/json'
        )
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['status'] == 'success'
        assert 'calculation' in data
        assert data['calculation']['co2_emissions_kg'] > 0
    
    def test_calculate_missing_parameters(self, client):
        """Test calculation with missing parameters."""
        response = client.post('/api/v1/calculate',
            json={'region': 'us-east-1'},
            content_type='application/json'
        )
        assert response.status_code == 400


class TestCompareEndpoint:
    """Test comparison endpoint."""
    
    def test_compare_multiple_options(self, client):
        """Test comparing multiple region/instance combinations."""
        response = client.post('/api/v1/compare',
            json={
                'options': [
                    {'region': 'us-east-1', 'instance_type': 'p4d.24xlarge'},
                    {'region': 'us-west-2', 'instance_type': 'p4d.24xlarge'},
                    {'region': 'ca-central-1', 'instance_type': 'p4d.24xlarge'}
                ],
                'duration_hours': 24
            },
            content_type='application/json'
        )
        assert response.status_code == 200
        data = json.loads(response.data)
        assert data['status'] == 'success'
        assert len(data['comparisons']) == 3
        assert 'analysis' in data
    
    def test_compare_too_many_options(self, client):
        """Test comparison with too many options."""
        options = [{'region': f'us-east-{i}', 'instance_type': 't3.micro'} for i in range(25)]
        response = client.post('/api/v1/compare',
            json={'options': options},
            content_type='application/json'
        )
        assert response.status_code == 400


class TestScheduleEndpoint:
    """Test optimal scheduling endpoint."""
    
    def test_find_optimal_schedule(self, client):
        """Test finding optimal time window."""
        response = client.post('/api/v1/schedule',
            json={
                'region': 'us-west-2',
                'duration_hours': 4
            },
            content_type='application/json'
        )
        # Note: This might return 404 if forecast is unavailable
        assert response.status_code in [200, 404]


class TestEngine:
    """Test core engine functionality."""
    
    def test_get_carbon_intensity(self):
        """Test fetching carbon intensity."""
        # This will use fallback if API key not configured
        result = engine.get_carbon_intensity("US-NW-PACW")
        assert result is not None
        assert 'carbon_intensity' in result
        assert result['carbon_intensity'] > 0
    
    def test_calculate_instance_carbon(self):
        """Test carbon calculation for instance."""
        result = engine.calculate_instance_carbon_output(
            "p4d.24xlarge",
            carbon_intensity=100,
            duration_hours=24
        )
        assert result['co2_emissions_kg'] > 0
        assert result['power_consumption_kwh'] > 0
    
    def test_rank_regions_by_carbon(self):
        """Test region ranking."""
        regions = engine.rank_regions_by_carbon()
        assert len(regions) > 0
        # Verify sorted by carbon intensity
        for i in range(len(regions) - 1):
            assert regions[i]['carbon_intensity'] <= regions[i + 1]['carbon_intensity']


class TestErrorHandling:
    """Test error handling."""
    
    def test_404_error(self, client):
        """Test 404 error handling."""
        response = client.get('/nonexistent')
        assert response.status_code == 404
        data = json.loads(response.data)
        assert data['error_type'] == 'not_found'
    
    def test_405_error(self, client):
        """Test method not allowed."""
        response = client.get('/api/v1/optimize')
        assert response.status_code == 405


if __name__ == '__main__':
    pytest.main([__file__, '-v'])
