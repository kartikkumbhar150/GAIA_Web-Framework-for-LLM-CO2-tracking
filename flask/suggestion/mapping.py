# mapping.py
"""
Comprehensive mapping of AWS regions to Electricity Maps zones and instance catalogs.
Updated with all AWS regions and major cloud services.
"""

# AWS Region to Electricity Maps Zone Mapping
REGION_TO_ZONE = {
    # US Regions
    "us-east-1": "US-MIDW-PJM",      # North Virginia
    "us-east-2": "US-MIDW-MISO",     # Ohio
    "us-west-1": "US-CAL-CISO",      # Northern California
    "us-west-2": "US-NW-PACW",       # Oregon (Hydro-heavy)
    
    # Canada
    "ca-central-1": "CA-QC",         # Montreal (Hydro-heavy, very low carbon)
    "ca-west-1": "CA-AB",            # Calgary
    
    # Europe
    "eu-west-1": "IE",               # Ireland (Wind-heavy)
    "eu-west-2": "GB",               # London
    "eu-west-3": "FR",               # Paris (Nuclear, very low carbon)
    "eu-central-1": "DE",            # Frankfurt
    "eu-central-2": "CH",            # Zurich (Hydro, very low carbon)
    "eu-north-1": "SE",              # Stockholm (Hydro/Nuclear, very low carbon)
    "eu-south-1": "IT-NO",           # Milan
    "eu-south-2": "ES",              # Spain
    
    # Asia Pacific
    "ap-south-1": "IN-WE",           # Mumbai (Coal-heavy, high carbon)
    "ap-south-2": "IN-SO",           # Hyderabad
    "ap-northeast-1": "JP-TK",       # Tokyo
    "ap-northeast-2": "KR",          # Seoul
    "ap-northeast-3": "JP-KN",       # Osaka
    "ap-southeast-1": "SG",          # Singapore
    "ap-southeast-2": "AUS-NSW",     # Sydney
    "ap-southeast-3": "ID-JW",       # Jakarta
    "ap-southeast-4": "AUS-VIC",     # Melbourne
    "ap-east-1": "HK",               # Hong Kong
    
    # Middle East
    "me-south-1": "AE",              # Bahrain
    "me-central-1": "IL",            # Tel Aviv
    
    # South America
    "sa-east-1": "BR-CS",            # São Paulo (Hydro-heavy, low carbon)
    
    # Africa
    "af-south-1": "ZA",              # Cape Town
}

# Instance type catalog organized by workload and service
INSTANCE_CATALOG = {
    # ML Training Workloads
    "training": {
        "gpu_high_performance": [
            "p5.48xlarge",    # H100 GPUs - Latest, highest performance
            "p4d.24xlarge",   # A100 GPUs - High performance
            "p4de.24xlarge",  # A100 with more memory
        ],
        "gpu_standard": [
            "p3.16xlarge",    # V100 GPUs
            "p3.8xlarge",
            "p3.2xlarge",
            "p3dn.24xlarge",  # V100 with 100Gbps networking
        ],
        "gpu_cost_optimized": [
            "g5.48xlarge",    # A10G GPUs
            "g5.12xlarge",
            "g5.2xlarge",
            "g4dn.12xlarge",  # T4 GPUs
            "g4dn.xlarge",
        ],
    },
    
    # ML Inference Workloads
    "inference": {
        "inferentia": [
            "inf2.48xlarge",  # Inferentia2 chips - most efficient
            "inf2.24xlarge",
            "inf2.8xlarge",
            "inf2.xlarge",
            "inf1.24xlarge",  # Inferentia1
            "inf1.6xlarge",
            "inf1.2xlarge",
        ],
        "gpu_inference": [
            "g5.xlarge",      # A10G for inference
            "g4dn.xlarge",    # T4 for inference
        ],
        "cpu_inference": [
            "c7g.16xlarge",   # Graviton3 - energy efficient
            "c7g.8xlarge",
            "c7g.2xlarge",
            "c6g.16xlarge",   # Graviton2
            "m6g.8xlarge",
        ],
    },
    
    # General Compute
    "general": {
        "graviton_optimized": [  # ARM-based, more energy efficient
            "t4g.micro",
            "t4g.small",
            "t4g.medium",
            "m7g.large",
            "m7g.xlarge",
            "m6g.large",
            "c7g.large",
        ],
        "standard": [
            "t3.micro",
            "t3.small",
            "t3.medium",
            "m6i.large",
            "m6i.xlarge",
            "c6i.large",
        ],
    },
    
    # Database Workloads
    "database": {
        "memory_optimized": [
            "r7g.16xlarge",   # Graviton3 memory optimized
            "r6g.8xlarge",    # Graviton2 memory optimized
            "r6i.8xlarge",
            "x2gd.8xlarge",   # Extreme memory with Graviton
        ],
        "storage_optimized": [
            "i4g.16xlarge",   # Graviton with NVMe
            "i3en.12xlarge",
        ],
    },
    
    # Container/Kubernetes Workloads
    "containers": {
        "fargate": [
            "fargate-graviton",  # Serverless containers with Graviton
            "fargate-standard",
        ],
        "eks_nodes": [
            "t4g.medium",     # Graviton for EKS
            "m7g.large",
            "c7g.large",
        ],
    },
    
    # Serverless
    "serverless": {
        "lambda": [
            "lambda-arm64",   # Graviton-based Lambda (20% better price/performance)
            "lambda-x86_64",
        ],
    },
    
    # Storage Services
    "storage": {
        "s3_classes": [
            "S3 Intelligent-Tiering",
            "S3 Standard",
            "S3 Standard-IA",
            "S3 One Zone-IA",
            "S3 Glacier Instant Retrieval",
            "S3 Glacier Flexible Retrieval",
            "S3 Glacier Deep Archive",
        ],
    },
}

# Carbon intensity estimates for instance types (gCO2eq/hour baseline)
# These are relative estimates based on TDP and efficiency
INSTANCE_CARBON_FACTORS = {
    # GPU instances - high power consumption
    "p5": 2.5,      # H100 - high power but very efficient per compute
    "p4d": 2.2,     # A100
    "p4de": 2.3,
    "p3": 1.8,      # V100
    "g5": 1.2,      # A10G - more efficient
    "g4dn": 0.8,    # T4 - most efficient GPU
    
    # Inferentia - optimized for inference
    "inf2": 0.4,    # Very efficient
    "inf1": 0.5,
    
    # Graviton (ARM) - 60% better energy efficiency
    "t4g": 0.15,
    "m7g": 0.25,
    "m6g": 0.22,
    "c7g": 0.23,
    "r7g": 0.30,
    "r6g": 0.28,
    
    # Standard x86 instances
    "t3": 0.25,
    "m6i": 0.35,
    "c6i": 0.33,
    "r6i": 0.45,
    
    # Serverless
    "lambda-arm64": 0.10,
    "lambda-x86_64": 0.12,
    "fargate-graviton": 0.20,
    "fargate-standard": 0.25,
}

# Service-specific carbon optimization recommendations
SERVICE_OPTIMIZATIONS = {
    "ec2": {
        "recommendations": [
            "Use Graviton instances for 60% better energy efficiency",
            "Enable EC2 Instance Scheduler to stop instances during idle periods",
            "Use Auto Scaling to match capacity to demand",
            "Consider Spot Instances for fault-tolerant workloads",
        ]
    },
    "lambda": {
        "recommendations": [
            "Use ARM64 architecture for 19% better performance and lower carbon",
            "Optimize memory allocation (carbon scales with allocated memory)",
            "Reduce cold starts with provisioned concurrency only when needed",
        ]
    },
    "s3": {
        "recommendations": [
            "Use S3 Intelligent-Tiering for automatic cost and carbon optimization",
            "Enable S3 Lifecycle policies to move data to colder storage tiers",
            "Use S3 Glacier for archival data (significantly lower carbon footprint)",
        ]
    },
    "rds": {
        "recommendations": [
            "Use Graviton-based instances for databases",
            "Enable Aurora Serverless v2 for variable workloads",
            "Use read replicas in low-carbon regions",
            "Schedule automated snapshots during low-carbon intensity periods",
        ]
    },
}

# Time-based carbon intensity patterns (UTC hours when carbon is typically lower)
# This varies by region due to solar/wind patterns
REGION_LOW_CARBON_HOURS = {
    "us-west-2": [6, 7, 8, 9, 10, 11, 12, 13, 14],      # Daytime - solar + hydro
    "eu-west-1": [10, 11, 12, 13, 14, 15, 16],          # Daytime - wind + solar
    "ca-central-1": [0, 1, 2, 3, 4, 5, 6, 7, 8, 9],     # Hydro - consistent but lower demand
    "eu-north-1": [9, 10, 11, 12, 13, 14, 15],          # Nordic - hydro/nuclear
    "sa-east-1": [11, 12, 13, 14, 15, 16, 17],          # Hydro - daytime
}
