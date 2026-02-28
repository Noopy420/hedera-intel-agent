/**
 * Basic test suite for HederaIntel Agent.
 * Tests intelligence engine without requiring Hedera credentials.
 */

const { IntelEngine } = require("./src/intel");
const { HederaService } = require("./src/hedera");

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✅ ${message}`);
    passed++;
  } else {
    console.error(`  ❌ ${message}`);
    failed++;
  }
}

async function runTests() {
  console.log("\n╔══════════════════════════════════════════════════╗");
  console.log("║          HederaIntel Agent — Test Suite          ║");
  console.log("╚══════════════════════════════════════════════════╝\n");

  // Test 1: IntelEngine instantiation
  console.log("Test 1: IntelEngine");
  const engine = new IntelEngine();
  assert(engine !== null, "IntelEngine instantiates");
  assert(engine.reportCount === 0, "Report count starts at 0");

  // Test 2: Report generation
  console.log("\nTest 2: Report Generation");
  const report = await engine.generateReport({
    assets: ["BTC", "ETH"],
    focus: "test",
  });
  assert(report.title !== undefined, "Report has title");
  assert(report.summary !== undefined, "Report has summary");
  assert(report.generatedAt !== undefined, "Report has timestamp");
  assert(report.confidence !== undefined, "Report has confidence");
  assert(Array.isArray(report.assets), "Report has assets array");
  assert(Array.isArray(report.signals), "Report has signals array");
  assert(Array.isArray(report.actionItems), "Report has action items");
  assert(engine.reportCount === 1, "Report count incremented");

  // Test 3: Multiple reports
  console.log("\nTest 3: Multiple Reports");
  const report2 = await engine.generateReport({
    assets: ["SOL", "HBAR"],
    focus: "l1",
  });
  assert(report2.title !== report.title, "Second report has different title");
  assert(engine.reportCount === 2, "Report count is 2");

  // Test 4: HederaService instantiation
  console.log("\nTest 4: HederaService");
  const hedera = new HederaService();
  assert(hedera !== null, "HederaService instantiates");
  assert(hedera.client === null, "Client starts null (not connected)");
  assert(hedera.topicId === null, "Topic ID starts null");

  // Test 5: Hash function
  console.log("\nTest 5: Content Hashing");
  const hash1 = hedera._hashContent("test content");
  const hash2 = hedera._hashContent("test content");
  const hash3 = hedera._hashContent("different content");
  assert(hash1 === hash2, "Same content produces same hash");
  assert(hash1 !== hash3, "Different content produces different hash");
  assert(hash1.length === 16, "Hash is 16 characters");

  // Test 6: Report serialization
  console.log("\nTest 6: Report Serialization");
  const serialized = JSON.stringify(report);
  assert(serialized.length > 0, "Report serializes to JSON");
  const deserialized = JSON.parse(serialized);
  assert(deserialized.title === report.title, "Deserialized title matches");

  // Summary
  console.log("\n───────────────────────────────────────────────────");
  console.log(`  Results: ${passed} passed, ${failed} failed`);
  console.log("───────────────────────────────────────────────────\n");

  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch((err) => {
  console.error(`Test error: ${err.message}`);
  process.exit(1);
});
