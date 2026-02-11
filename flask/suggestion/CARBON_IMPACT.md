# Carbon Impact Comparison

This document shows the dramatic differences in CO2 emissions when choosing different AWS regions for your workloads.

## Example: Training a Large ML Model (p4d.24xlarge for 1 week)

### Scenario
- Instance: p4d.24xlarge (8x A100 GPUs)
- Duration: 168 hours (1 week)
- Power consumption: ~52.8 kWh

### CO2 Emissions by Region

| Rank | Region | Zone | Carbon Intensity | CO2 Emissions | Renewable % |
|------|--------|------|------------------|---------------|-------------|
| 1 🏆 | ca-central-1 | CA-QC | 30 gCO2/kWh | **1.58 kg** | 99.8% |
| 2 | eu-north-1 | SE | 35 gCO2/kWh | **1.85 kg** | 95.2% |
| 3 | eu-west-3 | FR | 60 gCO2/kWh | **3.17 kg** | 70% (Nuclear) |
| 4 | eu-central-2 | CH | 50 gCO2/kWh | **2.64 kg** | 85% |
| 5 | us-west-2 | US-NW-PACW | 85 gCO2/kWh | **4.49 kg** | 78% |
| 10 | eu-west-1 | IE | 280 gCO2/kWh | **14.78 kg** | 65% |
| 15 | us-east-1 | US-MIDW-PJM | 420 gCO2/kWh | **22.18 kg** | 35% |
| 20 | ap-south-1 | IN-WE | 650 gCO2/kWh | **34.32 kg** | 25% |
| 26 ❌ | af-south-1 | ZA | 900 gCO2/kWh | **47.52 kg** | 10% |

### Key Insights

**💚 Best Choice: ca-central-1 (Montreal)**
- 1.58 kg CO2 for 1 week
- Nearly 100% hydro power
- Lowest carbon footprint

**❌ Worst Choice: af-south-1 (Cape Town)**
- 47.52 kg CO2 for 1 week
- Coal-heavy grid
- **30x more CO2** than best option

**🎯 The Impact:**
Choosing Canada over South Africa saves **45.94 kg CO2** per week - equivalent to:
- Planting 2 trees for a year
- Driving 180 km in a gasoline car
- Avoiding 51 liters of gasoline

---

## Yearly Impact Comparison

Running the same instance 24/7 for one year:

| Region | Annual CO2 (kg) | Trees Needed* | Cost of Carbon** |
|--------|-----------------|---------------|------------------|
| ca-central-1 | 82 | 4 | $2.46 |
| us-west-2 | 234 | 11 | $7.02 |
| us-east-1 | 1,154 | 52 | $34.62 |
| ap-south-1 | 1,786 | 81 | $53.58 |
| af-south-1 | 2,472 | 112 | $74.16 |

\* Trees to offset CO2 for one year (22 kg CO2/tree/year average)  
** At $30/tonne carbon price

**Annual Savings:** Choosing Canada over US-East-1 saves **1,072 kg CO2/year** ($32.16)

---

## Different Workload Types

### Inference Workload (inf2.xlarge, running 24/7 for 1 month)

| Region | Monthly CO2 | Difference vs Best |
|--------|-------------|-------------------|
| ca-central-1 | 0.22 kg | Baseline ✓ |
| eu-north-1 | 0.25 kg | +14% |
| us-west-2 | 0.61 kg | +177% |
| us-east-1 | 3.02 kg | +1,273% |
| ap-south-1 | 4.68 kg | +2,027% |

### Serverless Lambda (1 million requests/month, 1GB RAM, ARM64)

| Region | Monthly CO2 | Cost |
|--------|-------------|------|
| ca-central-1 | 0.72 g | $0.00002 |
| us-west-2 | 2.04 g | $0.00006 |
| us-east-1 | 10.08 g | $0.00030 |

---

## Real-World Examples

### Example 1: Startup Training ML Models

**Scenario:** AI startup trains models 40 hours/week on p4d.24xlarge

**Annual Comparison:**
- **Using us-east-1:** 462 kg CO2/year
- **Using ca-central-1:** 33 kg CO2/year
- **Savings:** 429 kg CO2/year (93% reduction)
- **Equivalent to:** Not driving 1,680 km

### Example 2: SaaS Company Running Inference

**Scenario:** 10x inf2.xlarge instances running 24/7

**Monthly Comparison:**
- **Using ap-south-1:** 46.8 kg CO2/month
- **Using ca-central-1:** 2.2 kg CO2/month
- **Savings:** 44.6 kg CO2/month (95% reduction)
- **Annual Savings:** 535 kg CO2/year

### Example 3: Large Enterprise Multi-Region Deployment

**Scenario:** 100x m6g.large instances distributed across regions

**Best Strategy:**
1. Primary: ca-central-1 (20 instances) - 1.1 kg CO2/month
2. EU: eu-north-1 (30 instances) - 1.9 kg CO2/month
3. US West: us-west-2 (30 instances) - 4.6 kg CO2/month
4. Asia: ap-southeast-2 (20 instances) - 7.8 kg CO2/month

**Total: 15.4 kg CO2/month**

**Worst Strategy (all in high-carbon regions):**
- Total: 78.2 kg CO2/month

**Savings: 62.8 kg CO2/month (80% reduction)**

---

## Time-Based Optimization

Some regions have lower carbon intensity during specific hours:

### US-West-2 (Oregon)

| Time (UTC) | Carbon Intensity | Best For |
|------------|------------------|----------|
| 06:00-14:00 | 65-75 gCO2/kWh | Batch jobs, training |
| 15:00-21:00 | 85-95 gCO2/kWh | Regular workloads |
| 22:00-05:00 | 95-110 gCO2/kWh | Avoid if possible |

**Impact:** Running during optimal hours (vs worst hours) saves ~35% carbon

### EU-West-1 (Ireland)

| Condition | Carbon Intensity | When |
|-----------|------------------|------|
| High wind | 180-220 gCO2/kWh | Windy days |
| Normal | 280-320 gCO2/kWh | Typical |
| Low wind + peak | 350-400 gCO2/kWh | Calm evenings |

**Impact:** Scheduling during windy periods saves ~40% carbon

---

## Cost-Carbon Tradeoffs

Sometimes the greenest region isn't the cheapest:

| Region | p4d.24xlarge/hour | Monthly Cost | Monthly CO2 | $/kg CO2 |
|--------|-------------------|--------------|-------------|----------|
| ca-central-1 | $36.29 | $26,129 | 6.6 kg | $3,959 |
| us-west-2 | $32.77 | $23,595 | 18.7 kg | $1,262 |
| us-east-1 | $32.77 | $23,595 | 92.4 kg | $255 |

**Analysis:**
- Canada is 11% more expensive but 86% greener than US-East
- For carbon-conscious companies: Extra $2,534/month prevents 85.8 kg CO2
- Carbon cost: $29.55/kg CO2 avoided

---

## Recommendations by Use Case

### Maximum Carbon Reduction
1. ca-central-1 (Montreal) - Hydro
2. eu-north-1 (Stockholm) - Hydro/Nuclear
3. eu-west-3 (Paris) - Nuclear

### Balanced (Carbon + Performance)
1. us-west-2 (Oregon) - Good connectivity, moderate carbon
2. eu-west-1 (Ireland) - Central EU location, variable but improving
3. ca-central-1 (Montreal) - Excellent carbon, good NA coverage

### Global Coverage with Best Carbon
- Americas: ca-central-1, us-west-2
- Europe: eu-north-1, eu-west-3
- Asia: ap-southeast-2 (Melbourne has better grid than Sydney)

---

## Take Action

### Immediate Wins (< 1 hour):
1. Move dev/test workloads to low-carbon regions
2. Schedule batch jobs during low-carbon hours
3. Use spot instances in green regions for fault-tolerant workloads

### Short-term (< 1 month):
1. Migrate primary workloads to greener regions
2. Implement multi-region strategy prioritizing low-carbon zones
3. Use Graviton instances (60% more energy efficient)

### Long-term Strategy:
1. Build carbon awareness into deployment pipelines
2. Track carbon metrics alongside cost metrics
3. Set carbon budgets for teams
4. Optimize for carbon during low-traffic periods

---

**Remember:** The greenest compute is the compute you don't use. Optimize your code, shut down idle resources, and right-size your instances!

For real-time data and optimization, use the Carbon Optimizer API:
```bash
curl -X POST http://localhost:5000/api/v1/optimize \
  -H "Content-Type: application/json" \
  -d '{"workload": "training", "priority": "carbon", "duration_hours": 168}'
```
