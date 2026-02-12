// app/api/analytics/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
});

export async function GET(request: NextRequest) {
  try {
    // ── Auth ────────────────────────────────────────────────────
    const cookieStore = await cookies();
    const token = cookieStore.get("token")?.value;
    if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    let decoded: { userId: string };
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { userId: string };
    } catch {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get("timeRange") || "30d";
    const groupBy   = searchParams.get("groupBy")   || "day";
    const uid       = decoded.userId;

    const startDate =
      timeRange === "7d"  ? new Date(Date.now() - 7  * 86_400_000) :
      timeRange === "90d" ? new Date(Date.now() - 90 * 86_400_000) :
                            new Date(Date.now() - 30 * 86_400_000);

    // ── 1. Summary ──────────────────────────────────────────────
    const { rows: [smry] } = await pool.query(`
      SELECT
        COUNT(*)                                                   AS total_prompts,
        COALESCE(SUM(total_tokens),  0)                            AS total_tokens,
        COALESCE(SUM(co2_grams),     0)                            AS total_co2_grams,
        COALESCE(SUM(energy_kwh),    0)                            AS total_energy_kwh,
        COALESCE(SUM(water_liters),  0)                            AS total_water_liters,
        COALESCE(AVG(co2_grams),     0)                            AS avg_co2_per_prompt,
        COALESCE(AVG(total_tokens),  0)                            AS avg_tokens_per_prompt,
        COUNT(CASE WHEN is_cached    THEN 1 END)                   AS cached_prompts,
        COUNT(DISTINCT model)                                      AS unique_models,

        -- ✅ FIX: count NULL rows too (IS NOT TRUE catches both NULL and FALSE)
        COUNT(CASE WHEN co2_calculated IS NOT TRUE THEN 1 END)     AS pending_calculations
      FROM llmprompts
      WHERE user_id = $1 AND captured_at >= $2
    `, [uid, startDate]);

    const totalCO2Kg  = parseFloat(smry.total_co2_grams) / 1000;
    const cacheEff    = parseInt(smry.total_prompts) > 0
      ? (parseInt(smry.cached_prompts) / parseInt(smry.total_prompts)) * 100
      : 0;
    const tokensSaved = parseInt(smry.cached_prompts) * parseFloat(smry.avg_tokens_per_prompt) * 0.8;
    const effScore    = Math.min(100, Math.round(
      cacheEff * 0.4 +
      Math.max(0, 100 - parseFloat(smry.avg_co2_per_prompt) * 10) * 0.4 +
      20
    ));

    // ── 2. Time series ──────────────────────────────────────────
    const tsBucket = groupBy === "week" ? "week" : groupBy === "month" ? "month" : "day";
    const { rows: ts } = await pool.query(`
      SELECT
        TO_CHAR(DATE_TRUNC($1, captured_at), 'YYYY-MM-DD') AS date,
        COUNT(*)                                            AS prompts,
        COALESCE(SUM(co2_grams),   0)                       AS co2_grams,
        COALESCE(SUM(energy_kwh),  0)                       AS energy_kwh,
        COALESCE(SUM(total_tokens),0)                       AS tokens
      FROM llmprompts
      WHERE user_id = $2
        AND captured_at >= $3
        AND co2_calculated = TRUE          -- only show rows that are done
      GROUP BY DATE_TRUNC($1, captured_at)
      ORDER BY DATE_TRUNC($1, captured_at) ASC
    `, [tsBucket, uid, startDate]);

    // ── 3. Model breakdown ──────────────────────────────────────
    const { rows: models } = await pool.query(`
      SELECT
        model, llm,
        COUNT(*)                         AS usage_count,
        COALESCE(SUM(co2_grams),   0)    AS total_co2_grams,
        COALESCE(SUM(energy_kwh),  0)    AS total_energy_kwh,
        COALESCE(AVG(co2_grams),   0)    AS avg_co2_per_prompt,
        COALESCE(AVG(total_tokens),0)    AS avg_tokens_per_prompt
      FROM llmprompts
      WHERE user_id = $1
        AND captured_at >= $2
        AND co2_calculated = TRUE
      GROUP BY model, llm
      ORDER BY total_co2_grams DESC
    `, [uid, startDate]);

    // ── 4. Hourly pattern ───────────────────────────────────────
    const { rows: hourly } = await pool.query(`
      SELECT
        EXTRACT(HOUR FROM captured_at) AS hour,
        COUNT(*)                       AS prompts,
        COALESCE(AVG(co2_grams), 0)    AS avg_co2
      FROM llmprompts
      WHERE user_id = $1
        AND co2_calculated = TRUE
      GROUP BY EXTRACT(HOUR FROM captured_at)
      ORDER BY hour ASC
    `, [uid]);

    // ── 5. Cloud breakdown ──────────────────────────────────────
    const { rows: cloud } = await pool.query(`
      SELECT
        COALESCE(cloud_provider, 'unknown') AS provider,
        COALESCE(cloud_region,   'unknown') AS region,
        COUNT(*)                            AS usage_count,
        COALESCE(SUM(co2_grams), 0)         AS total_co2_grams
      FROM llmprompts
      WHERE user_id = $1
        AND captured_at >= $2
        AND co2_calculated = TRUE
      GROUP BY cloud_provider, cloud_region
      ORDER BY total_co2_grams DESC
    `, [uid, startDate]);

    // ── Response ────────────────────────────────────────────────
    return NextResponse.json({
      success: true,
      data: {
        summary: {
          total_prompts:         parseInt(smry.total_prompts),
          total_tokens:          parseInt(smry.total_tokens),
          total_co2_kg:          parseFloat(totalCO2Kg.toFixed(3)),
          total_co2_grams:       parseFloat(smry.total_co2_grams),
          total_energy_kwh:      parseFloat(parseFloat(smry.total_energy_kwh).toFixed(4)),
          total_water_liters:    parseFloat(parseFloat(smry.total_water_liters).toFixed(2)),
          tokens_saved:          Math.round(tokensSaved),
          efficiency_score:      effScore,
          cached_prompts:        parseInt(smry.cached_prompts),
          cache_efficiency:      parseFloat(cacheEff.toFixed(1)),
          avg_co2_per_prompt:    parseFloat(parseFloat(smry.avg_co2_per_prompt).toFixed(4)),
          avg_tokens_per_prompt: Math.round(parseFloat(smry.avg_tokens_per_prompt)),
          unique_models_used:    parseInt(smry.unique_models),
          // ✅ FIX: now counts NULL rows too
          pending_calculations:  parseInt(smry.pending_calculations),
        },
        timeSeries: ts.map(r => ({
          date:       r.date,
          prompts:    parseInt(r.prompts),
          co2_grams:  parseFloat(parseFloat(r.co2_grams).toFixed(2)),
          co2_kg:     parseFloat((parseFloat(r.co2_grams) / 1000).toFixed(4)),
          energy_kwh: parseFloat(parseFloat(r.energy_kwh).toFixed(4)),
          tokens:     parseInt(r.tokens),
        })),
        modelBreakdown: models.map(m => ({
          model:                 m.model,
          llm:                   m.llm,
          usage_count:           parseInt(m.usage_count),
          total_co2_grams:       parseFloat(parseFloat(m.total_co2_grams).toFixed(2)),
          total_energy_kwh:      parseFloat(parseFloat(m.total_energy_kwh).toFixed(4)),
          avg_co2_per_prompt:    parseFloat(parseFloat(m.avg_co2_per_prompt).toFixed(4)),
          avg_tokens_per_prompt: Math.round(parseFloat(m.avg_tokens_per_prompt)),
          efficiency_score:      Math.max(0, Math.min(100,
            Math.round(100 - parseFloat(m.avg_co2_per_prompt) * 10)
          )),
        })),
        hourlyPattern: hourly.map(h => ({
          hour:    parseInt(h.hour),
          prompts: parseInt(h.prompts),
          avg_co2: parseFloat(parseFloat(h.avg_co2).toFixed(4)),
        })),
        cloudBreakdown: cloud.map(c => ({
          provider:        c.provider,
          region:          c.region,
          usage_count:     parseInt(c.usage_count),
          total_co2_grams: parseFloat(parseFloat(c.total_co2_grams).toFixed(2)),
        })),
      },
    }, { headers: { "Cache-Control": "private, max-age=25" } });

  } catch (err: any) {
    console.error("[analytics] Error:", err);
    return NextResponse.json(
      { error: "Internal Server Error", message: process.env.NODE_ENV === "development" ? err.message : undefined },
      { status: 500 }
    );
  }
}