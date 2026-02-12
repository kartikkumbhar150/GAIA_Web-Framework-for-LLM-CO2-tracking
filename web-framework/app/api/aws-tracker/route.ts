import { NextRequest, NextResponse } from 'next/server';
import { parse } from 'csv-parse/sync';
import jwt from 'jsonwebtoken';
import { Pool } from 'pg';

// Initialize PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

interface JWTPayload {
  userId: string;
  email: string;
}

interface AWSCarbonRecord {
  usage_account_id: string;
  total_mbm_emissions_value: number;
  total_mbm_emissions_unit: string;
  total_lbm_emissions_value: number;
  total_lbm_emissions_unit: string;
  product_code: string;
  location: string;
  usage_month: string;
  model_version?: string;
}

interface ProcessingResult {
  success: boolean;
  recordsProcessed: number;
  recordsFailed: number;
  errorMessage?: string;
  uploadId?: string;
}

// Helper function to verify JWT and extract user ID
function getUserFromToken(request: NextRequest): string | null {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) {
      return null;
    }

    const secret = process.env.JWT_SECRET || 'your-secret-key';
    const decoded = jwt.verify(token, secret) as JWTPayload;
    return decoded.userId;
  } catch (error) {
    console.error('JWT verification failed:', error);
    return null;
  }
}

// Validate CSV record
function validateRecord(record: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!record.usage_account_id) errors.push('Missing usage_account_id');
  if (record.total_mbm_emissions_value === undefined || record.total_mbm_emissions_value === '') {
    errors.push('Missing total_mbm_emissions_value');
  }
  if (record.total_lbm_emissions_value === undefined || record.total_lbm_emissions_value === '') {
    errors.push('Missing total_lbm_emissions_value');
  }
  if (!record.product_code) errors.push('Missing product_code');
  if (!record.location) errors.push('Missing location');
  if (!record.usage_month) errors.push('Missing usage_month');

  return { valid: errors.length === 0, errors };
}

// Parse usage_month to date
function parseUsageMonth(usageMonth: string): Date | null {
  try {
    // Format: YYYY-MM or YYYY-MM-DD
    const parts = usageMonth.split('-');
    if (parts.length >= 2) {
      const year = parseInt(parts[0]);
      const month = parseInt(parts[1]) - 1; // JavaScript months are 0-indexed
      return new Date(year, month, 1);
    }
    return null;
  } catch (error) {
    return null;
  }
}

// Generate AI-powered recommendations
async function generateRecommendations(
  userId: string,
  carbonData: AWSCarbonRecord[]
): Promise<void> {
  const client = await pool.connect();
  try {
    // Analyze data for recommendations
    const serviceEmissions = new Map<string, number>();
    const regionEmissions = new Map<string, number>();
    let totalEmissions = 0;

    carbonData.forEach(record => {
      const emissions = record.total_mbm_emissions_value;
      totalEmissions += emissions;

      // Aggregate by service
      const currentService = serviceEmissions.get(record.product_code) || 0;
      serviceEmissions.set(record.product_code, currentService + emissions);

      // Aggregate by region
      const currentRegion = regionEmissions.get(record.location) || 0;
      regionEmissions.set(record.location, currentRegion + emissions);
    });

    const recommendations: Array<{
      category: string;
      priority: string;
      title: string;
      description: string;
      potential_co2_reduction: number;
      action_items: any;
      related_service?: string;
      related_region?: string;
    }> = [];

    // Service optimization recommendations
    const sortedServices = Array.from(serviceEmissions.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3);

    sortedServices.forEach(([service, emissions]) => {
      const percentage = (emissions / totalEmissions) * 100;
      if (percentage > 20) {
        recommendations.push({
          category: 'service_optimization',
          priority: 'high',
          title: `Optimize ${service} Usage`,
          description: `${service} accounts for ${percentage.toFixed(1)}% of your carbon footprint. Consider optimizing resource usage, implementing auto-scaling, or right-sizing instances.`,
          potential_co2_reduction: emissions * 0.3, // Estimate 30% reduction potential
          action_items: [
            'Review instance types and sizes',
            'Implement auto-scaling policies',
            'Schedule non-critical workloads during off-peak hours',
            'Consider reserved instances for predictable workloads'
          ],
          related_service: service
        });
      }
    });

    // Region-based recommendations
    const sortedRegions = Array.from(regionEmissions.entries())
      .sort((a, b) => b[1] - a[1]);

    const highCarbonRegions = ['US East (N. Virginia)', 'Asia Pacific (Singapore)', 'Middle East (Bahrain)'];
    const lowCarbonRegions = ['EU (Frankfurt)', 'Canada (Central)', 'US West (Oregon)'];

    sortedRegions.forEach(([region, emissions]) => {
      if (highCarbonRegions.some(hcr => region.includes(hcr))) {
        const alternativeRegion = lowCarbonRegions[0];
        recommendations.push({
          category: 'region_migration',
          priority: 'medium',
          title: `Consider Migrating from ${region}`,
          description: `${region} has a higher carbon intensity. Migrating to greener regions like ${alternativeRegion} could reduce emissions by up to 50%.`,
          potential_co2_reduction: emissions * 0.5,
          action_items: [
            'Analyze workload latency requirements',
            'Evaluate data residency regulations',
            'Plan phased migration strategy',
            'Test performance in alternative regions'
          ],
          related_region: region
        });
      }
    });

    // General best practices
    if (totalEmissions > 10) {
      recommendations.push({
        category: 'cost_saving',
        priority: 'medium',
        title: 'Implement AWS Compute Optimizer',
        description: 'AWS Compute Optimizer provides recommendations for optimal AWS resource configurations, which can reduce both costs and carbon emissions.',
        potential_co2_reduction: totalEmissions * 0.15,
        action_items: [
          'Enable AWS Compute Optimizer',
          'Review EC2 instance recommendations',
          'Implement Lambda memory optimization',
          'Consider Graviton-based instances for better efficiency'
        ]
      });

      recommendations.push({
        category: 'resource_right_sizing',
        priority: 'high',
        title: 'Right-Size Storage Resources',
        description: 'Optimize EBS volumes and S3 storage classes to reduce unnecessary storage and associated emissions.',
        potential_co2_reduction: totalEmissions * 0.1,
        action_items: [
          'Identify and delete unused EBS volumes',
          'Implement S3 Intelligent-Tiering',
          'Set lifecycle policies for older data',
          'Use S3 Glacier for archival data'
        ]
      });
    }

    // Insert recommendations into database
    for (const rec of recommendations) {
      await client.query(
        `INSERT INTO aws_carbon_recommendations 
        (user_id, category, priority, title, description, potential_co2_reduction, 
         action_items, related_service, related_region, status)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT DO NOTHING`,
        [
          userId,
          rec.category,
          rec.priority,
          rec.title,
          rec.description,
          rec.potential_co2_reduction,
          JSON.stringify(rec.action_items),
          rec.related_service || null,
          rec.related_region || null,
          'active'
        ]
      );
    }
  } finally {
    client.release();
  }
}

// POST: Upload and process CSV file
export async function POST(request: NextRequest) {
  const client = await pool.connect();
  
  try {
    // Verify user authentication
    const userId = getUserFromToken(request);
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in.' },
        { status: 401 }
      );
    }

    // Parse form data
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.name.endsWith('.csv')) {
      return NextResponse.json(
        { error: 'Invalid file type. Please upload a CSV file.' },
        { status: 400 }
      );
    }

    // Read file content
    const fileContent = await file.text();

    // Create upload history record
    const uploadResult = await client.query(
      `INSERT INTO aws_upload_history (user_id, file_name, file_size, status)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [userId, file.name, file.size, 'processing']
    );
    const uploadId = uploadResult.rows[0].id;

    let recordsProcessed = 0;
    let recordsFailed = 0;
    const errors: string[] = [];

    try {
      // Parse CSV
      const records = parse(fileContent, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
      }) as any[];

      if (records.length === 0) {
        throw new Error('CSV file is empty or contains only headers');
      }

      // Start transaction
      await client.query('BEGIN');

      const validRecords: AWSCarbonRecord[] = [];
      const uniqueMonths = new Set<string>();

      // Process each record
      for (const record of records) {
        const validation = validateRecord(record);
        
        if (!validation.valid) {
          recordsFailed++;
          errors.push(`Row ${recordsProcessed + recordsFailed}: ${validation.errors.join(', ')}`);
          continue;
        }

        const usageDate = parseUsageMonth(record.usage_month);
        if (!usageDate) {
          recordsFailed++;
          errors.push(`Row ${recordsProcessed + recordsFailed}: Invalid usage_month format`);
          continue;
        }

        try {
          // Insert carbon footprint data
          await client.query(
            `INSERT INTO aws_carbon_footprint 
            (user_id, usage_account_id, total_mbm_emissions_value, total_mbm_emissions_unit,
             total_lbm_emissions_value, total_lbm_emissions_unit, product_code, location,
             usage_month, model_version, file_name)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            ON CONFLICT (user_id, usage_account_id, product_code, location, usage_month)
            DO UPDATE SET
              total_mbm_emissions_value = EXCLUDED.total_mbm_emissions_value,
              total_lbm_emissions_value = EXCLUDED.total_lbm_emissions_value,
              model_version = EXCLUDED.model_version,
              updated_at = NOW()`,
            [
              userId,
              record.usage_account_id,
              parseFloat(record.total_mbm_emissions_value),
              record.total_mbm_emissions_unit || 'mtCO2e',
              parseFloat(record.total_lbm_emissions_value),
              record.total_lbm_emissions_unit || 'mtCO2e',
              record.product_code,
              record.location,
              usageDate,
              record.model_version || null,
              file.name
            ]
          );

          validRecords.push({
            usage_account_id: record.usage_account_id,
            total_mbm_emissions_value: parseFloat(record.total_mbm_emissions_value),
            total_mbm_emissions_unit: record.total_mbm_emissions_unit || 'mtCO2e',
            total_lbm_emissions_value: parseFloat(record.total_lbm_emissions_value),
            total_lbm_emissions_unit: record.total_lbm_emissions_unit || 'mtCO2e',
            product_code: record.product_code,
            location: record.location,
            usage_month: record.usage_month,
            model_version: record.model_version
          });

          uniqueMonths.add(usageDate.toISOString().substring(0, 10));
          recordsProcessed++;
        } catch (dbError: any) {
          recordsFailed++;
          errors.push(`Row ${recordsProcessed + recordsFailed}: Database error - ${dbError.message}`);
        }
      }

      // Calculate aggregated metrics for each unique month
      for (const month of uniqueMonths) {
        await client.query(
          'SELECT calculate_aws_carbon_metrics($1, $2)',
          [userId, month]
        );
      }

      // Generate recommendations
      if (validRecords.length > 0) {
        await generateRecommendations(userId, validRecords);
      }

      // Update upload history
      await client.query(
        `UPDATE aws_upload_history 
         SET status = $1, records_processed = $2, records_failed = $3,
             error_message = $4, processing_completed_at = NOW()
         WHERE id = $5`,
        [
          recordsFailed > 0 ? 'completed_with_errors' : 'completed',
          recordsProcessed,
          recordsFailed,
          errors.length > 0 ? errors.slice(0, 10).join('; ') : null,
          uploadId
        ]
      );

      // Commit transaction
      await client.query('COMMIT');

      return NextResponse.json({
        success: true,
        message: `Successfully processed ${recordsProcessed} records${recordsFailed > 0 ? ` with ${recordsFailed} failures` : ''}`,
        data: {
          recordsProcessed,
          recordsFailed,
          uploadId,
          errors: errors.slice(0, 10) // Return first 10 errors
        }
      });

    } catch (parseError: any) {
      await client.query('ROLLBACK');
      
      // Update upload history with error
      await client.query(
        `UPDATE aws_upload_history 
         SET status = $1, error_message = $2, processing_completed_at = NOW()
         WHERE id = $3`,
        ['failed', parseError.message, uploadId]
      );

      return NextResponse.json(
        { error: `Failed to process CSV: ${parseError.message}` },
        { status: 400 }
      );
    }

  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('AWS tracker upload error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}

// GET: Retrieve AWS carbon footprint data and analytics
export async function GET(request: NextRequest) {
  const client = await pool.connect();
  
  try {
    // Verify user authentication
    const userId = getUserFromToken(request);
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in.' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const timeRange = parseInt(searchParams.get('timeRange') || '6'); // Default 6 months
    const analysisType = searchParams.get('type') || 'overview';

    if (analysisType === 'overview') {
      // Get overview analytics
      const [metricsResult, trendsResult, servicesResult, regionsResult, recommendationsResult] = await Promise.all([
        // Overall metrics - FIXED: Changed usage_month to metric_month
        client.query(
          `SELECT 
            COUNT(DISTINCT metric_month) as total_months,
            SUM(total_mbm_emissions) as total_emissions,
            AVG(total_mbm_emissions) as avg_monthly_emissions,
            MAX(total_mbm_emissions) as peak_emissions,
            MIN(total_mbm_emissions) as lowest_emissions
           FROM aws_carbon_metrics
           WHERE user_id = $1
             AND metric_month >= NOW() - INTERVAL '1 month' * $2`,
          [userId, timeRange]
        ),

        // Monthly trends
        client.query(
          `SELECT 
            metric_month,
            total_mbm_emissions,
            total_lbm_emissions,
            mom_change_percentage,
            total_records
           FROM aws_carbon_metrics
           WHERE user_id = $1
             AND metric_month >= NOW() - INTERVAL '1 month' * $2
           ORDER BY metric_month DESC`,
          [userId, timeRange]
        ),

        // Top services
        client.query(
          `SELECT 
            product_code,
            SUM(total_mbm_emissions_value) as total_emissions,
            COUNT(*) as record_count,
            AVG(total_mbm_emissions_value) as avg_emissions
           FROM aws_carbon_footprint
           WHERE user_id = $1
             AND usage_month >= NOW() - INTERVAL '1 month' * $2
           GROUP BY product_code
           ORDER BY total_emissions DESC
           LIMIT 10`,
          [userId, timeRange]
        ),

        // Top regions
        client.query(
          `SELECT 
            location,
            SUM(total_mbm_emissions_value) as total_emissions,
            COUNT(*) as record_count,
            AVG(total_mbm_emissions_value) as avg_emissions
           FROM aws_carbon_footprint
           WHERE user_id = $1
             AND usage_month >= NOW() - INTERVAL '1 month' * $2
           GROUP BY location
           ORDER BY total_emissions DESC
           LIMIT 10`,
          [userId, timeRange]
        ),

        // Active recommendations
        client.query(
          `SELECT 
            id, category, priority, title, description,
            potential_co2_reduction, action_items,
            related_service, related_region, generated_at
           FROM aws_carbon_recommendations
           WHERE user_id = $1 AND status = 'active'
           ORDER BY 
             CASE priority 
               WHEN 'high' THEN 1
               WHEN 'medium' THEN 2
               WHEN 'low' THEN 3
             END,
             potential_co2_reduction DESC
           LIMIT 10`,
          [userId]
        )
      ]);

      return NextResponse.json({
        success: true,
        data: {
          metrics: metricsResult.rows[0] || {},
          trends: trendsResult.rows || [],
          topServices: servicesResult.rows || [],
          topRegions: regionsResult.rows || [],
          recommendations: recommendationsResult.rows || []
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: {}
    });

  } catch (error: any) {
    console.error('AWS tracker GET error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}

// DELETE: Remove specific upload or all data
export async function DELETE(request: NextRequest) {
  const client = await pool.connect();
  
  try {
    // Verify user authentication
    const userId = getUserFromToken(request);
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized. Please log in.' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const uploadId = searchParams.get('uploadId');

    await client.query('BEGIN');

    if (uploadId) {
      // Delete specific upload data
      await client.query(
        `DELETE FROM aws_carbon_footprint 
         WHERE user_id = $1 
           AND file_name = (SELECT file_name FROM aws_upload_history WHERE id = $2)`,
        [userId, uploadId]
      );

      await client.query(
        `DELETE FROM aws_upload_history WHERE id = $1 AND user_id = $2`,
        [uploadId, userId]
      );
    } else {
      // Delete all AWS data for user
      await client.query('DELETE FROM aws_carbon_footprint WHERE user_id = $1', [userId]);
      await client.query('DELETE FROM aws_carbon_metrics WHERE user_id = $1', [userId]);
      await client.query('DELETE FROM aws_carbon_recommendations WHERE user_id = $1', [userId]);
      await client.query('DELETE FROM aws_upload_history WHERE user_id = $1', [userId]);
    }

    await client.query('COMMIT');

    return NextResponse.json({
      success: true,
      message: 'Data deleted successfully'
    });

  } catch (error: any) {
    await client.query('ROLLBACK');
    console.error('AWS tracker DELETE error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  } finally {
    client.release();
  }
}