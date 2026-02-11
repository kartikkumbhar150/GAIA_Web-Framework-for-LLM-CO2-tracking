import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyJWT } from "@/lib/jwt";

// 🔐 CORS Headers (allow extension requests)
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Max-Age": "86400", // 24 hours
};

// Handle preflight OPTIONS request
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: corsHeaders,
  });
}

export async function POST(req: Request) {
  try {
    /* ---------------- AUTH ---------------- */
    const auth = req.headers.get("authorization");
    if (!auth) {
      return NextResponse.json(
        { error: "Missing authorization header" },
        { status: 401, headers: corsHeaders }
      );
    }

    const token = auth.replace("Bearer ", "");
    const payload = await verifyJWT(token);

    if (!payload?.userId) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401, headers: corsHeaders }
      );
    }

    /* ---------------- BODY ---------------- */
    const body = await req.json();
    
    const {
      site,
      model,
      input_tokens_before,
      input_tokens_after,
      output_tokens,
      
      // Optional fields
      input_raw,
      is_cached = false,
      energy_kwh,
      co2_grams,
      water_liters,
      cloud_provider,
      cloud_region,
      grid_zone,
      carbon_intensity_g_per_kwh
    } = body;

    /* ---------------- VALIDATION ---------------- */
    if (!site || !model) {
      return NextResponse.json(
        { error: "Missing required fields: site and model" },
        { status: 400, headers: corsHeaders }
      );
    }

    if (output_tokens == null) {
      return NextResponse.json(
        { error: "Missing output_tokens" },
        { status: 400, headers: corsHeaders }
      );
    }

    // Use input_tokens_after as the final input_tokens
    const finalInputTokens = input_tokens_after ?? input_tokens_before ?? 0;

    /* ---------------- INSERT INTO llmprompts TABLE ---------------- */
    // Format: model name + site in llm field (e.g., "ChatGPT", "Claude")
    await db.query(
      `
      INSERT INTO llmprompts (
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
        carbon_intensity_g_per_kwh
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
      )
      `,
      [
        payload.userId,                          // user_id (UUID)
        input_raw ?? null,                       // input_raw (BIGINT or NULL)
        finalInputTokens,                        // input_tokens (INTEGER)
        output_tokens,                           // output_tokens (INTEGER)
        is_cached,                               // is_cached (BOOLEAN)
        model,                                   // model (VARCHAR) - e.g., "GPT-4", "Claude Sonnet"
        site,                                    // llm (VARCHAR) - e.g., "ChatGPT", "Claude"
        energy_kwh ?? null,                      // energy_kwh (NUMERIC)
        co2_grams ?? null,                       // co2_grams (NUMERIC)
        water_liters ?? null,                    // water_liters (NUMERIC)
        cloud_provider ?? null,                  // cloud_provider (VARCHAR)
        cloud_region ?? null,                    // cloud_region (VARCHAR)
        grid_zone ?? null,                       // grid_zone (VARCHAR)
        carbon_intensity_g_per_kwh ?? null       // carbon_intensity_g_per_kwh (INTEGER)
      ]
    );

    console.log(`✅ Metrics saved for user ${payload.userId}: ${site} - ${model}`);
    console.log(`📊 Tokens: input=${finalInputTokens}, output=${output_tokens}`);

    return NextResponse.json(
      { 
        success: true,
        message: "Metrics saved successfully",
        data: {
          llm: site,
          model: model,
          input_tokens: finalInputTokens,
          output_tokens: output_tokens,
          total_tokens: finalInputTokens + output_tokens
        }
      },
      { status: 200, headers: corsHeaders }
    );

  } catch (err) {
    console.error("❌ EXTENSION METRICS ERROR:", err);

    return NextResponse.json(
      { 
        error: "Internal server error",
        details: process.env.NODE_ENV === 'development' ? String(err) : undefined
      },
      { status: 500, headers: corsHeaders }
    );
  }
}