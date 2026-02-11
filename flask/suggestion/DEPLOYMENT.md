# DEPLOYMENT.md

# Production Deployment Guide

This guide covers deploying the Carbon Optimizer API in production environments.

## Table of Contents
1. [AWS Deployment (ECS)](#aws-deployment-ecs)
2. [Kubernetes Deployment](#kubernetes-deployment)
3. [Docker Deployment](#docker-deployment)
4. [Configuration](#configuration)
5. [Monitoring](#monitoring)
6. [Security](#security)

---

## AWS Deployment (ECS)

### Prerequisites
- AWS CLI configured
- Docker installed
- ECR repository created

### Step 1: Build and Push Docker Image

```bash
# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin <account-id>.dkr.ecr.us-east-1.amazonaws.com

# Build image
docker build -t carbon-optimizer .

# Tag image
docker tag carbon-optimizer:latest <account-id>.dkr.ecr.us-east-1.amazonaws.com/carbon-optimizer:latest

# Push to ECR
docker push <account-id>.dkr.ecr.us-east-1.amazonaws.com/carbon-optimizer:latest
```

### Step 2: Create Task Definition

```json
{
  "family": "carbon-optimizer",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "512",
  "memory": "1024",
  "containerDefinitions": [
    {
      "name": "carbon-optimizer",
      "image": "<account-id>.dkr.ecr.us-east-1.amazonaws.com/carbon-optimizer:latest",
      "portMappings": [
        {
          "containerPort": 5000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {
          "name": "FLASK_ENV",
          "value": "production"
        }
      ],
      "secrets": [
        {
          "name": "EL_MAPS_API_KEY",
          "valueFrom": "arn:aws:secretsmanager:us-east-1:<account-id>:secret:el-maps-api-key"
        }
      ],
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/carbon-optimizer",
          "awslogs-region": "us-east-1",
          "awslogs-stream-prefix": "ecs"
        }
      },
      "healthCheck": {
        "command": ["CMD-SHELL", "curl -f http://localhost:5000/health || exit 1"],
        "interval": 30,
        "timeout": 5,
        "retries": 3,
        "startPeriod": 60
      }
    }
  ]
}
```

### Step 3: Create ECS Service

```bash
aws ecs create-service \
  --cluster carbon-optimizer-cluster \
  --service-name carbon-optimizer \
  --task-definition carbon-optimizer \
  --desired-count 2 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx],securityGroups=[sg-xxx],assignPublicIp=ENABLED}" \
  --load-balancers "targetGroupArn=arn:aws:elasticloadbalancing:...,containerName=carbon-optimizer,containerPort=5000"
```

### Step 4: Configure Application Load Balancer

```bash
# Create target group
aws elbv2 create-target-group \
  --name carbon-optimizer-tg \
  --protocol HTTP \
  --port 5000 \
  --vpc-id vpc-xxx \
  --health-check-path /health \
  --target-type ip

# Create ALB listener rule
aws elbv2 create-listener \
  --load-balancer-arn arn:aws:elasticloadbalancing:... \
  --protocol HTTP \
  --port 80 \
  --default-actions Type=forward,TargetGroupArn=arn:aws:elasticloadbalancing:...
```

---

## Kubernetes Deployment

### Step 1: Create Secret for API Key

```bash
kubectl create secret generic carbon-optimizer-secrets \
  --from-literal=el-maps-api-key=<your-api-key>
```

### Step 2: Deployment Manifest

```yaml
# carbon-optimizer-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: carbon-optimizer
  labels:
    app: carbon-optimizer
spec:
  replicas: 3
  selector:
    matchLabels:
      app: carbon-optimizer
  template:
    metadata:
      labels:
        app: carbon-optimizer
    spec:
      containers:
      - name: carbon-optimizer
        image: <your-registry>/carbon-optimizer:latest
        ports:
        - containerPort: 5000
        env:
        - name: FLASK_ENV
          value: "production"
        - name: EL_MAPS_API_KEY
          valueFrom:
            secretKeyRef:
              name: carbon-optimizer-secrets
              key: el-maps-api-key
        resources:
          requests:
            memory: "512Mi"
            cpu: "250m"
          limits:
            memory: "1Gi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 5000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /health
            port: 5000
          initialDelaySeconds: 10
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: carbon-optimizer
spec:
  selector:
    app: carbon-optimizer
  ports:
  - protocol: TCP
    port: 80
    targetPort: 5000
  type: LoadBalancer
```

### Step 3: Deploy

```bash
kubectl apply -f carbon-optimizer-deployment.yaml
```

### Step 4: Configure Ingress (Optional)

```yaml
# ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: carbon-optimizer
  annotations:
    kubernetes.io/ingress.class: nginx
    cert-manager.io/cluster-issuer: letsencrypt-prod
spec:
  tls:
  - hosts:
    - api.carbon-optimizer.example.com
    secretName: carbon-optimizer-tls
  rules:
  - host: api.carbon-optimizer.example.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: carbon-optimizer
            port:
              number: 80
```

---

## Docker Deployment

### Simple Docker Deployment

```bash
# Create .env file
cat > .env << EOF
EL_MAPS_API_KEY=your_api_key_here
FLASK_ENV=production
EOF

# Run with Docker
docker build -t carbon-optimizer .
docker run -d \
  --name carbon-optimizer \
  -p 5000:5000 \
  --env-file .env \
  --restart unless-stopped \
  carbon-optimizer
```

### Docker Compose Deployment

```bash
# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# Scale replicas
docker-compose up -d --scale carbon-optimizer=3

# Stop services
docker-compose down
```

---

## Configuration

### Environment Variables

| Variable | Required | Description | Default |
|----------|----------|-------------|---------|
| `EL_MAPS_API_KEY` | Yes | Electricity Maps API key | None |
| `FLASK_ENV` | No | Flask environment | `production` |
| `FLASK_DEBUG` | No | Enable debug mode | `0` |
| `GUNICORN_WORKERS` | No | Number of worker processes | `4` |
| `GUNICORN_THREADS` | No | Threads per worker | `2` |

### Gunicorn Configuration

Create `gunicorn.conf.py`:

```python
# gunicorn.conf.py
import multiprocessing

bind = "0.0.0.0:5000"
workers = multiprocessing.cpu_count() * 2 + 1
threads = 2
worker_class = "sync"
worker_connections = 1000
max_requests = 1000
max_requests_jitter = 50
timeout = 30
keepalive = 5

# Logging
accesslog = "-"
errorlog = "-"
loglevel = "info"
access_log_format = '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s" %(D)s'

# Process naming
proc_name = "carbon-optimizer"

# Server mechanics
daemon = False
pidfile = None
umask = 0
user = None
group = None
tmp_upload_dir = None

# SSL
keyfile = None
certfile = None
```

Run with:
```bash
gunicorn -c gunicorn.conf.py app:app
```

---

## Monitoring

### CloudWatch Metrics (AWS)

Create CloudWatch dashboard:

```json
{
  "widgets": [
    {
      "type": "metric",
      "properties": {
        "metrics": [
          ["AWS/ECS", "CPUUtilization", {"stat": "Average"}],
          [".", "MemoryUtilization", {"stat": "Average"}]
        ],
        "period": 300,
        "stat": "Average",
        "region": "us-east-1",
        "title": "ECS Service Metrics"
      }
    }
  ]
}
```

### Prometheus Metrics

Add to `requirements.txt`:
```
prometheus-flask-exporter==0.22.4
```

Add to `app.py`:
```python
from prometheus_flask_exporter import PrometheusMetrics

metrics = PrometheusMetrics(app)

# Custom metrics
request_count = metrics.counter(
    'api_requests_total', 'Total API requests',
    labels={'endpoint': lambda: request.endpoint}
)
```

### Health Check Monitoring

```bash
# Simple health check script
#!/bin/bash
HEALTH_URL="http://localhost:5000/health"
RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" $HEALTH_URL)

if [ $RESPONSE -eq 200 ]; then
  echo "OK"
  exit 0
else
  echo "FAILED"
  exit 1
fi
```

---

## Security

### 1. API Rate Limiting

Install Flask-Limiter:
```bash
pip install Flask-Limiter
```

Add to `app.py`:
```python
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address

limiter = Limiter(
    app=app,
    key_func=get_remote_address,
    default_limits=["100 per hour"]
)

@app.route('/api/v1/optimize', methods=['POST'])
@limiter.limit("20 per minute")
def optimize_workload():
    # ...
```

### 2. CORS Configuration

```python
from flask_cors import CORS

CORS(app, resources={
    r"/api/*": {
        "origins": ["https://yourdomain.com"],
        "methods": ["GET", "POST"],
        "allow_headers": ["Content-Type"]
    }
})
```

### 3. HTTPS/TLS

Use reverse proxy (nginx):

```nginx
server {
    listen 443 ssl http2;
    server_name api.carbon-optimizer.com;

    ssl_certificate /etc/ssl/certs/cert.pem;
    ssl_certificate_key /etc/ssl/private/key.pem;
    
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    location / {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 4. Secrets Management

**AWS Secrets Manager:**
```python
import boto3
import json

def get_secret():
    client = boto3.client('secretsmanager', region_name='us-east-1')
    response = client.get_secret_value(SecretId='el-maps-api-key')
    return json.loads(response['SecretString'])['api_key']

API_KEY = get_secret()
```

**HashiCorp Vault:**
```python
import hvac

client = hvac.Client(url='http://vault:8200')
secret = client.secrets.kv.v2.read_secret_version(path='carbon-optimizer')
API_KEY = secret['data']['data']['api_key']
```

---

## Performance Optimization

### 1. Redis Caching

Update `engine.py` to use Redis:

```python
import redis
import json

class CarbonEngine:
    def __init__(self, api_key: str, redis_url: str = None):
        self.api_key = api_key
        if redis_url:
            self.redis_client = redis.from_url(redis_url)
        else:
            self.redis_client = None
    
    def get_carbon_intensity(self, zone: str):
        if self.redis_client:
            cached = self.redis_client.get(f"carbon:{zone}")
            if cached:
                return json.loads(cached)
        
        # Fetch from API
        data = self._fetch_from_api(zone)
        
        if self.redis_client:
            self.redis_client.setex(
                f"carbon:{zone}",
                300,  # 5 minutes
                json.dumps(data)
            )
        
        return data
```

### 2. Connection Pooling

```python
from requests.adapters import HTTPAdapter
from requests.packages.urllib3.util.retry import Retry

session = requests.Session()
retry = Retry(total=3, backoff_factor=0.3)
adapter = HTTPAdapter(max_retries=retry, pool_connections=10, pool_maxsize=20)
session.mount('http://', adapter)
session.mount('https://', adapter)
```

---

## Backup and Disaster Recovery

### Database Backup (if using persistent storage)

```bash
# Backup Redis
redis-cli --rdb /backup/dump.rdb

# Restore
redis-cli --rdb /backup/dump.rdb RESTORE
```

### Application State

The API is stateless, so no application state backup needed. Ensure:
- API keys are backed up in secrets manager
- Configuration is in version control
- Docker images are tagged and stored in registry

---

## Troubleshooting

### Common Issues

1. **API returns 500 errors**
   - Check Electricity Maps API key is valid
   - Verify network connectivity
   - Check logs: `docker logs carbon-optimizer`

2. **High latency**
   - Enable Redis caching
   - Increase worker count
   - Check Electricity Maps API rate limits

3. **Out of memory**
   - Increase container memory limit
   - Reduce cache TTL
   - Limit concurrent requests

### Debug Mode

```bash
# Enable debug logging
export FLASK_DEBUG=1
python app.py
```

---

## Scaling Recommendations

| Requests/sec | Workers | Memory | CPU |
|--------------|---------|--------|-----|
| < 10 | 2 | 512MB | 0.5 |
| 10-50 | 4 | 1GB | 1.0 |
| 50-100 | 8 | 2GB | 2.0 |
| > 100 | 12+ | 4GB+ | 4.0+ |

Add horizontal scaling with load balancer for > 100 req/sec.
