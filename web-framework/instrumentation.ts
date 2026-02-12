// instrumentation.ts
// ──────────────────────────────────────────────────────────────
// Next.js Instrumentation Hook (Next 14+)
// This file is auto-executed by Next.js when the server starts.
// Place it at the ROOT of your Next.js project (same level as app/)
//
// Docs: https://nextjs.org/docs/app/building-your-application/optimizing/instrumentation
// ──────────────────────────────────────────────────────────────

export async function register() {
  // Only run in Node.js server runtime, not in edge or client
  if (process.env.NEXT_RUNTIME === "nodejs") {
    console.log("[Instrumentation] Server started — booting CO₂ worker...");

    const { startCO2Worker } = await import("./lib/co2-worker");
    await startCO2Worker();
  }
}