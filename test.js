/**
 * Test suite for HederaIntel Agent.
 * Tests all modules without requiring Hedera credentials.
 */

const { IntelEngine } = require("./src/intel");
const { HederaService } = require("./src/hedera");
const { NetworkAnalytics } = require("./src/network");
const { AgentProtocol, PROTOCOL_NAME, PROTOCOL_VERSION } = require("./src/agent-protocol");
const { OpenConvAIAgent, AGENT_NAME, AGENT_DESCRIPTION, AGENT_CAPABILITIES } = require("./src/hcs10");

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

  // ─── Test 1: IntelEngine ────────────────────────
  console.log("Test 1: IntelEngine");
  const engine = new IntelEngine();
  assert(engine !== null, "IntelEngine instantiates");
  assert(engine.reportCount === 0, "Report count starts at 0");

  // ─── Test 2: Report Generation ──────────────────
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

  // ─── Test 3: Multiple Reports ───────────────────
  console.log("\nTest 3: Multiple Reports");
  const report2 = await engine.generateReport({
    assets: ["SOL", "HBAR"],
    focus: "l1",
  });
  assert(report2.title !== report.title, "Second report has different title");
  assert(engine.reportCount === 2, "Report count is 2");

  // ─── Test 4: HederaService ──────────────────────
  console.log("\nTest 4: HederaService");
  const hedera = new HederaService();
  assert(hedera !== null, "HederaService instantiates");
  assert(hedera.client === null, "Client starts null (not connected)");
  assert(hedera.topicId === null, "Topic ID starts null");

  // ─── Test 5: Content Hashing ────────────────────
  console.log("\nTest 5: Content Hashing");
  const hash1 = hedera._hashContent("test content");
  const hash2 = hedera._hashContent("test content");
  const hash3 = hedera._hashContent("different content");
  assert(hash1 === hash2, "Same content produces same hash");
  assert(hash1 !== hash3, "Different content produces different hash");
  assert(hash1.length === 16, "Hash is 16 characters");

  // ─── Test 6: Report Serialization ───────────────
  console.log("\nTest 6: Report Serialization");
  const serialized = JSON.stringify(report);
  assert(serialized.length > 0, "Report serializes to JSON");
  const deserialized = JSON.parse(serialized);
  assert(deserialized.title === report.title, "Deserialized title matches");

  // ─── Test 7: NetworkAnalytics ───────────────────
  console.log("\nTest 7: NetworkAnalytics");
  const net = new NetworkAnalytics("testnet");
  assert(net !== null, "NetworkAnalytics instantiates");
  assert(net.baseUrl.includes("testnet"), "Uses testnet mirror node");

  const netMainnet = new NetworkAnalytics("mainnet");
  assert(netMainnet.baseUrl.includes("mainnet"), "Mainnet URL correct");

  // ─── Test 8: Live Network Data ──────────────────
  console.log("\nTest 8: Live Network Data (Mirror Node)");
  const supply = await net.getNetworkSupply();
  assert(supply !== null, "Network supply fetched");
  assert(supply.totalSupply !== undefined, "Total supply present");

  const nodes = await net.getNodeCount();
  assert(nodes !== null, "Node info fetched");
  assert(nodes.totalNodes > 0, "Has consensus nodes");

  // ─── Test 9: Network Report ─────────────────────
  console.log("\nTest 9: Network Health Report");
  const netReport = await net.generateNetworkReport();
  assert(netReport.type === "hedera_network_health", "Correct report type");
  assert(netReport.healthScore > 0, "Health score is positive");
  assert(netReport.network === "testnet", "Network is testnet");

  // ─── Test 10: AgentProtocol ─────────────────────
  console.log("\nTest 10: Agent Protocol");
  assert(PROTOCOL_NAME === "hedera-intel", "Protocol name correct");
  assert(PROTOCOL_VERSION === "1.0", "Protocol version correct");

  // Test protocol without Hedera connection (mock)
  const mockHedera = { publishReport: async () => ({ sequenceNumber: "1" }) };
  const protocol = new AgentProtocol(mockHedera, engine);
  assert(protocol !== null, "AgentProtocol instantiates");
  assert(protocol.handlers.size >= 4, "Has 4+ default handlers");

  // ─── Test 11: Protocol Message Creation ─────────
  console.log("\nTest 11: Protocol Messages");
  const msg = protocol.createMessage("query", { queryType: "market_report" });
  assert(msg.protocol === "hedera-intel", "Message has correct protocol");
  assert(msg.type === "query", "Message type is query");
  assert(msg.timestamp !== undefined, "Message has timestamp");
  assert(msg.agent === "HederaIntel", "Message identifies agent");

  // ─── Test 12: Protocol Query Processing ─────────
  console.log("\nTest 12: Protocol Query Processing");
  const capQuery = JSON.stringify({
    protocol: "hedera-intel",
    type: "query",
    queryType: "capabilities",
  });
  const capResponse = await protocol.processMessage(capQuery);
  assert(capResponse !== null, "Capabilities query returns response");
  assert(capResponse.status === "ok", "Response status is ok");
  assert(
    capResponse.capabilities.includes("market_report"),
    "Lists market_report capability"
  );

  // Test unknown query type
  const unknownQuery = JSON.stringify({
    protocol: "hedera-intel",
    type: "query",
    queryType: "nonexistent",
  });
  const unknownResponse = await protocol.processMessage(unknownQuery);
  assert(unknownResponse.status === "error", "Unknown query returns error");

  // Test non-protocol message (should be ignored)
  const ignored = await protocol.processMessage('{"random": "data"}');
  assert(ignored === null, "Non-protocol messages ignored");

  // ─── Test 13: HCS-10 OpenConvAI Module ──────────
  console.log("\nTest 13: HCS-10 OpenConvAI Module");
  assert(AGENT_NAME === "HederaIntel", "Agent name is HederaIntel");
  assert(AGENT_DESCRIPTION.length > 50, "Agent description is detailed");
  assert(AGENT_CAPABILITIES.includes("market_report"), "Has market_report capability");
  assert(AGENT_CAPABILITIES.includes("natural_language_query"), "Has NL query capability");

  const convAgent = new OpenConvAIAgent(engine, net);
  assert(convAgent !== null, "OpenConvAIAgent instantiates");
  assert(convAgent.client === null, "Client starts null (not connected)");
  assert(convAgent.connections instanceof Map, "Has connections map");

  // ─── Test 14: HCS-10 Natural Language Routing ────
  console.log("\nTest 14: HCS-10 Natural Language Routing");

  // Test price query routing
  const priceResponse = await convAgent._processQuery("What's the price of BTC?");
  assert(priceResponse.type === "price_check", "Routes price query correctly");
  assert(priceResponse.assets !== undefined, "Price response has assets");

  // Test narrative query routing
  const narrativeResponse = await convAgent._processQuery("What are the current market trends?");
  assert(narrativeResponse.type === "narrative_detection", "Routes narrative query correctly");
  assert(narrativeResponse.narratives !== undefined, "Narrative response has data");

  // Test hedera network query routing
  const hederaResponse = await convAgent._processQuery("How is the Hedera network doing?");
  assert(hederaResponse.type === "hedera_intelligence", "Routes Hedera query correctly");
  assert(hederaResponse.networkHealth !== undefined, "Has network health data");

  // Test capabilities query routing
  const capabilitiesResponse = await convAgent._processQuery("What can you do?");
  assert(capabilitiesResponse.type === "capabilities", "Routes capabilities query correctly");
  assert(capabilitiesResponse.capabilities.length > 0, "Lists capabilities");

  // Test default fallback to full report
  const generalResponse = await convAgent._processQuery("Give me a full market report");
  assert(generalResponse.type === "market_report", "Default routes to market_report");
  assert(generalResponse.summary !== undefined, "Full report has summary");

  // ─── Test 15: Asset Extraction from NL ────────────
  console.log("\nTest 15: Asset Extraction from Natural Language");
  const btcEth = convAgent._extractAssets("what is the price of bitcoin and ethereum?");
  assert(btcEth !== null, "Extracts assets from sentence");
  assert(btcEth.includes("BTC"), "Finds BTC");
  assert(btcEth.includes("ETH"), "Finds ETH");

  const hbar = convAgent._extractAssets("hedera network health");
  assert(hbar !== null, "Extracts HBAR from 'hedera'");
  assert(hbar.includes("HBAR"), "Maps 'hedera' to HBAR");

  const noAssets = convAgent._extractAssets("give me a report");
  assert(noAssets === null, "Returns null when no assets found");

  // ─── Test 16: HCS-10 Agent Status ────────────────
  console.log("\nTest 16: HCS-10 Agent Status");
  const status = convAgent.getStatus();
  assert(status.agent === "HederaIntel", "Status has agent name");
  assert(status.capabilities.length === AGENT_CAPABILITIES.length, "Status has all capabilities");
  assert(status.connections === 0, "Starts with 0 connections");

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
