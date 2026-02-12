// app/api/calculate/route.ts
import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

const FLASK_SERVICE_URL = process.env.FLASK_SERVICE_URL || "http://localhost:5001";

interface CalculateRequest {
  model_name: string;
  input_tokens: number;
  output_tokens: number;
  cached?: boolean;
  cloud_provider?: string;
  cloud_region?: string;
  input_raw?: number;
  llm?: string;
}

interface FlaskResult {
  timestamp: string;
  model: string;
  provider: string;
  cloud: { provider: string; region: string; grid_zone: string };
  grid_data: { carbon_intensity_g_per_kwh: number };
  tokens: { input: number; output: number; total: number };
  energy_kwh: number;
  co2_grams: number;
  water_liters: number;
  assumptions: { cached: boolean };
  confidence_interval: string;
}

export async function POST(request: NextRequest) {
  // ── Auth ──────────────────────────────────────────────────────
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let decoded: { userId: string; email: string };
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET as string) as typeof decoded;
  } catch {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  // ── Parse & validate body ─────────────────────────────────────
  let body: CalculateRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!body.model_name || typeof body.model_name !== "string") {
    return NextResponse.json({ error: "model_name is required" }, { status: 400 });
  }
  if (typeof body.input_tokens !== "number" || body.input_tokens < 0) {
    return NextResponse.json({ error: "input_tokens must be a non-negative number" }, { status: 400 });
  }
  if (typeof body.output_tokens !== "number" || body.output_tokens < 0) {
    return NextResponse.json({ error: "output_tokens must be a non-negative number" }, { status: 400 });
  }

  // ── Call Flask ────────────────────────────────────────────────
  let calc: FlaskResult;
  try {
    const flaskRes = await fetch(`${FLASK_SERVICE_URL}/calculate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model_name:     body.model_name,
        input_tokens:   body.input_tokens,
        output_tokens:  body.output_tokens,
        cached:         body.cached ?? false,
        cloud_provider: body.cloud_provider ?? "gcp",
        cloud_region:   body.cloud_region   ?? "asia-south1",
      }),
      signal: AbortSignal.timeout(10_000),
    });

    if (!flaskRes.ok) {
      const txt = await flaskRes.text();
      console.error("[calculate] Flask error:", txt);
      return NextResponse.json(
        { error: "Calculation service error", details: txt },
        { status: flaskRes.status }
      );
    }

    calc = await flaskRes.json();
  } catch (err: any) {
    console.error("[calculate] Flask unreachable:", err.message);
    return NextResponse.json(
      { error: "Calculation service unreachable", message: err.message },
      { status: 503 }
    );
  }

  // ── Persist to DB ─────────────────────────────────────────────
  // ✅ FIX 1: co2_calculated = TRUE is now in the INSERT.
  //           Because Flask was called successfully RIGHT HERE,
  //           there is no need for the worker to re-process this row.
  // ✅ FIX 2: All 16 columns listed explicitly — nothing implicit.
  try {
    const { rows } = await pool.query<{ id: number; captured_at: Date }>(
      `INSERT INTO llmprompts (
        user_id,
        input_raw,
        input_tokens,
        output_tokens,
        is_cached,
        model,
        llm,
        energy_kwh,
        co2_grams,
        water_liters,
        cloud_provider,
        cloud_region,
        grid_zone,
        carbon_intensity_g_per_kwh,
        captured_at,
        co2_calculated          -- ✅ CRITICAL: mark as done so worker skips it
      ) VALUES (
        $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,
        TRUE                    -- ✅ already calculated, worker must not touch it
      )
      RETURNING id, captured_at`,
      [
        decoded.userId,
        body.input_raw                          ?? null,
        calc.tokens.input,
        calc.tokens.output,
        calc.assumptions.cached,
        calc.model,
        body.llm                                ?? calc.provider,
        calc.energy_kwh,
        calc.co2_grams,
        calc.water_liters,
        calc.cloud.provider,
        calc.cloud.region,
        calc.cloud.grid_zone,
        calc.grid_data.carbon_intensity_g_per_kwh,
        new Date(calc.timestamp),
      ]
    );

    const row = rows[0];

    // Quick 30-day summary for the response
    const { rows: [s] } = await pool.query(
      `SELECT
         COUNT(*)                       AS total_prompts,
         COALESCE(SUM(total_tokens), 0) AS total_tokens,
         COALESCE(SUM(co2_grams),    0) AS total_co2_grams,
         COALESCE(SUM(energy_kwh),   0) AS total_energy_kwh
       FROM llmprompts
       WHERE user_id = $1
         AND captured_at >= NOW() - INTERVAL '30 days'`,
      [decoded.userId]
    );

    return NextResponse.json({
      success: true,
      data: {
        id:         row.id,
        captured_at: row.captured_at,
        model:      calc.model,
        provider:   calc.provider,
        tokens:     calc.tokens,
        impact: {
          energy_kwh:  calc.energy_kwh,
          co2_grams:   calc.co2_grams,
          co2_kg:      (calc.co2_grams / 1000).toFixed(4),
          water_liters: calc.water_liters,
        },
        cloud:               calc.cloud,
        grid_data:           calc.grid_data,
        cached:              calc.assumptions.cached,
        confidence_interval: calc.confidence_interval,
        summary_30d: {
          total_prompts:   parseInt(s.total_prompts),
          total_tokens:    parseInt(s.total_tokens),
          total_co2_kg:    (parseFloat(s.total_co2_grams) / 1000).toFixed(3),
          total_energy_kwh: parseFloat(s.total_energy_kwh).toFixed(4),
        },
      },
    }, { status: 201, headers: { "Cache-Control": "no-store" } });

  } catch (err: any) {
    console.error("[calculate] DB insert error:", err.message);
    return NextResponse.json(
      { error: "Database error", message: process.env.NODE_ENV === "development" ? err.message : undefined },
      { status: 500 }
    );
  }
}

// GET — list supported models (proxy to Flask)
export async function GET() {
  try {
    const res = await fetch(`${FLASK_SERVICE_URL}/models`, {
      signal: AbortSignal.timeout(5_000),
    });
    if (!res.ok) throw new Error(`Flask returned ${res.status}`);
    const models = await res.json();
    return NextResponse.json({ success: true, data: models }, {
      headers: { "Cache-Control": "public, max-age=3600" },
    });
  } catch (err: any) {
    return NextResponse.json({ error: "Could not fetch models", message: err.message }, { status: 503 });
  }
}