/**
 * Pharmico Admin Load Testing Benchmark
 * Simulates expected launch traffic against the Admin API.
 * Measures throughput (RPS), error rate, and p50/p90/p95/p99 latencies.
 */

const BASE_URL = process.env.API_URL || "http://localhost:5001";
const DURATION_SECONDS = Number(process.env.DURATION || 5);
const CONCURRENCY = Number(process.env.CONCURRENCY || 15);

const TARGETS = [
  { name: "Liveness Check", path: "/health", method: "GET" },
  { name: "Component Readiness", path: "/api/health", method: "GET" },
  { name: "Public Swagger Specs", path: "/api/docs/", method: "GET" },
];

async function runScenario(target) {
  const url = `${BASE_URL}${target.path}`;
  const latencies = [];
  let successCount = 0;
  let failCount = 0;

  const endTime = Date.now() + DURATION_SECONDS * 1000;

  async function worker() {
    while (Date.now() < endTime) {
      const t0 = performance.now();
      try {
        const res = await fetch(url, { method: target.method });
        const ms = performance.now() - t0;
        latencies.push(ms);
        if (res.status < 400) {
          successCount++;
        } else {
          failCount++;
        }
      } catch (err) {
        const ms = performance.now() - t0;
        latencies.push(ms);
        failCount++;
      }
    }
  }

  // Spawn concurrent workers
  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));

  latencies.sort((a, b) => a - b);
  const total = latencies.length;
  if (total === 0) return null;

  const getPercentile = (p) => {
    const idx = Math.min(Math.floor((p / 100) * total), total - 1);
    return latencies[idx].toFixed(2);
  };

  const avg = (latencies.reduce((a, b) => a + b, 0) / total).toFixed(2);

  return {
    name: target.name,
    path: target.path,
    totalRequests: total,
    success: successCount,
    failed: failCount,
    rps: (total / DURATION_SECONDS).toFixed(1),
    avgMs: avg,
    p50: getPercentile(50),
    p90: getPercentile(90),
    p95: getPercentile(95),
    p99: getPercentile(99),
  };
}

async function main() {
  console.log("\n==================================================================");
  console.log("🚀 STARTING PHARMICO ADMIN API LOAD TEST BENCHMARK");
  console.log(`Target: ${BASE_URL} | Concurrency: ${CONCURRENCY} | Duration: ${DURATION_SECONDS}s`);
  console.log("==================================================================\n");

  const results = [];
  for (const target of TARGETS) {
    process.stdout.write(`Testing [${target.name}] (${target.path})... `);
    const res = await runScenario(target);
    if (res) {
      results.push(res);
      console.log(`Done (${res.totalRequests} reqs, ${res.rps} req/s, p95=${res.p95}ms)`);
    } else {
      console.log("Failed (no requests recorded)");
    }
  }

  console.log("\n------------------------------------------------------------------------------------------------------");
  console.log("| Target Endpoint          | Reqs  | RPS    | Success | Failed | Avg(ms) | p50(ms) | p95(ms) | p99(ms) |");
  console.log("------------------------------------------------------------------------------------------------------");

  for (const r of results) {
    const name = r.name.padEnd(24);
    const reqs = String(r.totalRequests).padStart(5);
    const rps = String(r.rps).padStart(6);
    const succ = String(r.success).padStart(7);
    const fail = String(r.failed).padStart(6);
    const avg = String(r.avgMs).padStart(7);
    const p50 = String(r.p50).padStart(7);
    const p95 = String(r.p95).padStart(7);
    const p99 = String(r.p99).padStart(7);
    console.log(`| ${name} | ${reqs} | ${rps} | ${succ} | ${fail} | ${avg} | ${p50} | ${p95} | ${p99} |`);
  }
  console.log("------------------------------------------------------------------------------------------------------\n");

  const allPassed = results.every((r) => Number(r.p95) < 500 && r.failed === 0);
  if (allPassed) {
    console.log("✅ LOAD TEST PASSED: All endpoints met p95 < 500ms latency and 0% failure rate.\n");
  } else {
    console.log("⚠️ NOTICE: Some endpoints exceeded latency budgets or had failed requests.\n");
  }
}

main().catch((err) => {
  console.error("Load test failed:", err);
  process.exit(1);
});
