// lib/co2-worker.ts
// ================================================================
// Background Worker — polls llmprompts for rows that need CO₂
// calculation and calls Flask, then writes results back.
//
// BUGS FIXED vs previous version:
//  1. WHERE co2_calculated IS NOT TRUE  →  catches NULL rows too
//  2. Default Flask port 5001 (matches flask-backend.py)
//  3. FOR UPDATE SKIP LOCKED  →  prevents double-processing
//  4. ensureSchema() backfills NULL→FALSE AND marks already-done rows
//  5. Health-check on startup with clear error if Flask is down
//  6. Correct retry column reset when row succeeds
// ================================================================

import { Pool, PoolClient } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 5,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000,
});

const FLASK_URL        = process.env.FLASK_SERVICE_URL ?? "http://localhost:5001"; // ✅ port 5001
const POLL_MS          = Number(process.env.CO2_WORKER_POLL_MS   ?? 5_000);
const BATCH            = Number(process.env.CO2_WORKER_BATCH_SIZE ?? 10);
const MAX_RETRY        = Number(process.env.CO2_WORKER_MAX_RETRY  ?? 3);

interface PendingRow {
  id: number;
  model: string;
  llm: string | null;
  input_tokens: number;
  output_tokens: number;
  is_cached: boolean;
  cloud_provider: string | null;
  cloud_region: string | null;
  retry_count: number;
}

interface FlaskResult {
  energy_kwh: number;
  co2_grams: number;
  water_liters: number;
  cloud: { grid_zone: string };
  grid_data: { carbon_intensity_g_per_kwh: number };
}

// ── 1. One-time schema migration ─────────────────────────────────
async function ensureSchema(): Promise<void> {
  // Add columns if absent
  await pool.query(`
    ALTER TABLE llmprompts
      ADD COLUMN IF NOT EXISTS co2_calculated BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS retry_count    INTEGER NOT NULL DEFAULT 0,
      ADD COLUMN IF NOT EXISTS last_error     TEXT
  `);

  // ✅ FIX 3: Rows inserted BEFORE column existed come back as NULL.
  //    NULL IS NOT FALSE in SQL → "WHERE co2_calculated = FALSE" misses them.
  //    We must normalise NULL → FALSE first.
  const { rowCount: nullFixed } = await pool.query(`
    UPDATE llmprompts SET co2_calculated = FALSE
    WHERE co2_calculated IS NULL
  `);
  if ((nullFixed ?? 0) > 0)
    console.log(`[CO2Worker] Normalised ${nullFixed} NULL rows → FALSE`);

  // Mark rows that already have results as done (avoids re-work on restart)
  const { rowCount: alreadyDone } = await pool.query(`
    UPDATE llmprompts
    SET co2_calculated = TRUE
    WHERE co2_grams   IS NOT NULL
      AND energy_kwh  IS NOT NULL
      AND co2_calculated = FALSE
  `);
  if ((alreadyDone ?? 0) > 0)
    console.log(`[CO2Worker] Marked ${alreadyDone} already-calculated rows as done`);

  // Index: only unprocessed rows, helps polling query
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_llmprompts_co2_pending
      ON llmprompts (id, retry_count)
      WHERE co2_calculated = FALSE
  `);

  console.log("[CO2Worker] ✅ Schema ready");
}

// ── 2. Flask health-check ─────────────────────────────────────────
async function checkFlaskHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${FLASK_URL}/health`, {
      signal: AbortSignal.timeout(5_000),
    });
    if (res.ok) {
      const body = await res.json().catch(() => ({}));
      console.log(`[CO2Worker] ✅ Flask UP — ${body.service ?? "ok"} at ${FLASK_URL}`);
      return true;
    }
    console.warn(`[CO2Worker] ⚠️  Flask at ${FLASK_URL} responded HTTP ${res.status}`);
    return false;
  } catch (err: any) {
    console.error(
      `\n[CO2Worker] ❌ FLASK IS UNREACHABLE at ${FLASK_URL}\n` +
      `  ➜ Start Flask:  python flask-backend.py\n` +
      `  ➜ Check port:   PORT=5001 in flask-backend.py\n` +
      `  ➜ Error detail: ${err.message}\n`
    );
    return false;
  }
}

// ── 3. Fetch a locked batch of unprocessed rows ───────────────────
async function fetchPending(client: PoolClient): Promise<PendingRow[]> {
  // ✅ FIX 1: "IS NOT TRUE" matches both FALSE and NULL
  // ✅ FIX 6: FOR UPDATE SKIP LOCKED — concurrent ticks don't double-process
  const { rows } = await client.query<PendingRow>(`
    SELECT
      id, model, llm,
      input_tokens, output_tokens, is_cached,
      cloud_provider, cloud_region,
      retry_count
    FROM llmprompts
    WHERE co2_calculated IS NOT TRUE       -- ✅ catches NULL and FALSE
      AND retry_count < $1
      AND input_tokens  IS NOT NULL
      AND output_tokens IS NOT NULL
      AND model         IS NOT NULL
    ORDER BY id ASC
    LIMIT $2
    FOR UPDATE SKIP LOCKED                 -- ✅ safe for concurrent ticks
  `, [MAX_RETRY, BATCH]);
  return rows;
}

// ── 4. Call Flask /calculate ──────────────────────────────────────
async function callFlask(row: PendingRow): Promise<FlaskResult> {
  const res = await fetch(`${FLASK_URL}/calculate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model_name:     row.model,
      input_tokens:   row.input_tokens,
      output_tokens:  row.output_tokens,
      cached:         row.is_cached ?? false,
      cloud_provider: row.cloud_provider ?? "gcp",
      cloud_region:   row.cloud_region   ?? "asia-south1",
    }),
    signal: AbortSignal.timeout(10_000),
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Flask HTTP ${res.status}: ${txt.slice(0, 200)}`);
  }

  const data = await res.json();

  // ── validate essential fields ──────────────────────────────────
  if (typeof data.co2_grams    !== "number") throw new Error("Flask response missing co2_grams");
  if (typeof data.energy_kwh   !== "number") throw new Error("Flask response missing energy_kwh");
  if (typeof data.water_liters !== "number") throw new Error("Flask response missing water_liters");

  return data as FlaskResult;
}

// ── 5. Write result back ──────────────────────────────────────────
async function persistResult(client: any, id: number, r: FlaskResult): Promise<void> {
  await client.query(`
    UPDATE llmprompts SET
      energy_kwh                 = $1,
      co2_grams                  = $2,
      water_liters               = $3,
      grid_zone                  = $4,
      carbon_intensity_g_per_kwh = $5,
      co2_calculated             = TRUE,   -- ✅ mark done
      retry_count                = 0,      -- ✅ reset retries on success
      last_error                 = NULL
    WHERE id = $6
  `, [
    r.energy_kwh,
    r.co2_grams,
    r.water_liters,
    r.cloud?.grid_zone                   ?? "UNKNOWN",
    r.grid_data?.carbon_intensity_g_per_kwh ?? 0,
    id,
  ]);
}

// ── 6. Record failure ─────────────────────────────────────────────
async function markFailure(client: any, id: number, msg: string): Promise<void> {
  await client.query(`
    UPDATE llmprompts SET
      retry_count = retry_count + 1,
      last_error  = $1
    WHERE id = $2
  `, [msg.slice(0, 500), id]);
}

// ── 7. One poll tick ──────────────────────────────────────────────
async function tick(): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const rows = await fetchPending(client);

    if (rows.length === 0) {
      await client.query("ROLLBACK");
      return;
    }

    console.log(`[CO2Worker] ⚙️  Processing ${rows.length} row(s)…`);

    // Process sequentially inside the transaction to keep the lock clean
    for (const row of rows) {
      try {
        const result = await callFlask(row);
        await persistResult(client, row.id, result);
        console.log(`[CO2Worker] ✅ id=${row.id} model=${row.model} → co2=${result.co2_grams}g`);
      } catch (err: any) {
        console.error(`[CO2Worker] ❌ id=${row.id} → ${err.message}`);
        await markFailure(client, row.id, err.message);
      }
    }

    await client.query("COMMIT");
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

// ── 8. Public API ─────────────────────────────────────────────────
let timer: NodeJS.Timeout | null = null;
let running = false;

export async function startCO2Worker(): Promise<void> {
  if (running) {
    console.log("[CO2Worker] Already running — skipping duplicate start");
    return;
  }

  console.log(`\n[CO2Worker] ═══════════════════════════════════`);
  console.log(`[CO2Worker]  Starting CO₂ background worker`);
  console.log(`[CO2Worker]  Flask  : ${FLASK_URL}`);
  console.log(`[CO2Worker]  Poll   : every ${POLL_MS}ms`);
  console.log(`[CO2Worker]  Batch  : ${BATCH} rows/tick`);
  console.log(`[CO2Worker]  Retries: max ${MAX_RETRY}`);
  console.log(`[CO2Worker] ═══════════════════════════════════\n`);

  // One-time DB migration
  try {
    await ensureSchema();
  } catch (err) {
    console.error("[CO2Worker] Schema setup failed — worker will NOT start:", err);
    return;
  }

  // Flask health-check — warn but don't abort (Flask may start later)
  await checkFlaskHealth();

  running = true;

  const loop = async () => {
    try {
      await tick();
    } catch (err) {
      console.error("[CO2Worker] tick error:", err);
    }
    timer = setTimeout(loop, POLL_MS);
  };

  loop();
  console.log("[CO2Worker] ✅ Worker started");
}

export function stopCO2Worker(): void {
  if (timer) { clearTimeout(timer); timer = null; }
  running = false;
  console.log("[CO2Worker] Stopped");
}