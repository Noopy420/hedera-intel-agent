#!/usr/bin/env node

/**
 * HederaIntel Agent — Autonomous Market Intelligence on Hedera
 *
 * An AI-powered agent that generates crypto market intelligence reports
 * and publishes them to Hedera Consensus Service (HCS) for immutable,
 * timestamped provenance. Every report is verifiable on-chain.
 *
 * Usage:
 *   node index.js setup          — Create a new HCS topic
 *   node index.js report          — Generate and publish a report
 *   node index.js network         — Hedera network health analytics
 *   node index.js listen          — Start agent protocol listener
 *   node index.js subscribe       — Live-stream reports from the topic
 *   node index.js info            — Show topic info and stats
 *   node index.js demo            — Run a full demo cycle
 *
 * Built for the Hedera Hello Future Apex Hackathon 2026.
 * Track: AI & Agents
 */

require("dotenv").config();

const { HederaService } = require("./src/hedera");
const { IntelEngine } = require("./src/intel");
const { NetworkAnalytics } = require("./src/network");
const { AgentProtocol } = require("./src/agent-protocol");
const { OpenConvAIAgent } = require("./src/hcs10");
const fs = require("fs");
const path = require("path");

const hedera = new HederaService();
const intel = new IntelEngine();
const network = new NetworkAnalytics(process.env.HEDERA_NETWORK || "testnet");

// ─── Configuration ──────────────────────────────────────────────────────────

const CONFIG = {
  accountId: process.env.HEDERA_ACCOUNT_ID,
  privateKey: process.env.HEDERA_PRIVATE_KEY,
  network: process.env.HEDERA_NETWORK || "testnet",
  topicId: process.env.HEDERA_TOPIC_ID || null,
};

// ─── Commands ───────────────────────────────────────────────────────────────

async function setup() {
  console.log("\n╔══════════════════════════════════════════════════╗");
  console.log("║       HederaIntel Agent — Initial Setup         ║");
  console.log("╚══════════════════════════════════════════════════╝\n");

  await hedera.initialize(CONFIG.accountId, CONFIG.privateKey, CONFIG.network);

  const topicId = await hedera.createTopic(
    "HederaIntel Agent — Autonomous Market Intelligence Feed"
  );

  // Save topic ID for future use
  const envPath = path.join(__dirname, ".env");
  if (fs.existsSync(envPath)) {
    let envContent = fs.readFileSync(envPath, "utf-8");
    if (envContent.includes("HEDERA_TOPIC_ID=")) {
      envContent = envContent.replace(
        /HEDERA_TOPIC_ID=.*/,
        `HEDERA_TOPIC_ID=${topicId}`
      );
    } else {
      envContent += `\nHEDERA_TOPIC_ID=${topicId}\n`;
    }
    fs.writeFileSync(envPath, envContent);
  }

  console.log(`\n✅ Setup complete!`);
  console.log(`   Topic ID: ${topicId}`);
  console.log(`   Explorer: https://hashscan.io/${CONFIG.network}/topic/${topicId}`);
  console.log(`\n   Run 'node index.js report' to publish your first report.\n`);
}

async function generateAndPublish() {
  console.log("\n╔══════════════════════════════════════════════════╗");
  console.log("║       HederaIntel Agent — Market Report         ║");
  console.log("╚══════════════════════════════════════════════════╝\n");

  await hedera.initialize(CONFIG.accountId, CONFIG.privateKey, CONFIG.network);

  if (CONFIG.topicId) {
    hedera.setTopicId(CONFIG.topicId);
  } else {
    console.log("[Agent] No topic ID found. Creating one...");
    await hedera.createTopic("HederaIntel Agent — Market Intelligence");
  }

  // Generate the intelligence report
  const report = await intel.generateReport({
    assets: ["BTC", "ETH", "SOL", "HBAR"],
    focus: "general",
  });

  // Display the report
  console.log("\n─── Intelligence Report ───────────────────────────");
  console.log(`Title:      ${report.title}`);
  console.log(`Generated:  ${report.generatedAt}`);
  console.log(`Confidence: ${report.confidence}`);
  console.log(`Summary:    ${report.summary}`);
  console.log("\nAssets:");
  for (const asset of report.assets) {
    console.log(
      `  ${asset.symbol.padEnd(6)} ${asset.price.padStart(12)} | 24h: ${asset.change24h.padStart(8)} | MCap: ${asset.marketCap}`
    );
  }
  if (report.signals.length > 0) {
    console.log("\nActive Signals:");
    for (const signal of report.signals) {
      const bar = "█".repeat(Math.round(signal.score * 10)).padEnd(10, "░");
      console.log(`  [${bar}] ${signal.narrative}`);
      console.log(`           ${signal.evidence}`);
    }
  }
  if (report.actionItems.length > 0) {
    console.log("\nAction Items:");
    for (const action of report.actionItems) {
      console.log(`  → ${action}`);
    }
  }
  console.log("───────────────────────────────────────────────────\n");

  // Publish to Hedera Consensus Service
  console.log("[Agent] Publishing to Hedera Consensus Service...");
  const txResult = await hedera.publishReport(report);

  console.log(`\n✅ Report published on-chain!`);
  console.log(`   Sequence:    #${txResult.sequenceNumber || txResult.totalChunks + " chunks"}`);
  console.log(`   Transaction: ${txResult.transactionId || txResult.chunks?.[0]?.transactionId}`);
  console.log(`   Verify:      ${txResult.hashscanUrl}`);
  console.log(`\n   This report is now permanently timestamped on Hedera.\n`);

  return { report, txResult };
}

async function subscribe() {
  console.log("\n╔══════════════════════════════════════════════════╗");
  console.log("║       HederaIntel Agent — Live Feed             ║");
  console.log("╚══════════════════════════════════════════════════╝\n");

  if (!CONFIG.topicId) {
    console.error("Error: No HEDERA_TOPIC_ID set. Run 'node index.js setup' first.");
    process.exit(1);
  }

  await hedera.initialize(CONFIG.accountId, CONFIG.privateKey, CONFIG.network);
  hedera.setTopicId(CONFIG.topicId);

  console.log(`Listening for reports on topic ${CONFIG.topicId}...`);
  console.log("Press Ctrl+C to stop.\n");

  await hedera.subscribe((message) => {
    console.log(`\n─── New Report [#${message.sequenceNumber}] ────────`);
    console.log(`  Time: ${message.timestamp}`);
    if (message.content?.report) {
      console.log(`  Title: ${message.content.report.title}`);
      console.log(`  Summary: ${message.content.report.summary}`);
    } else {
      console.log(`  Content: ${JSON.stringify(message.content).slice(0, 200)}`);
    }
    console.log(`───────────────────────────────────────\n`);
  });
}

async function info() {
  console.log("\n╔══════════════════════════════════════════════════╗");
  console.log("║       HederaIntel Agent — Topic Info            ║");
  console.log("╚══════════════════════════════════════════════════╝\n");

  if (!CONFIG.topicId) {
    console.error("Error: No HEDERA_TOPIC_ID set. Run 'node index.js setup' first.");
    process.exit(1);
  }

  await hedera.initialize(CONFIG.accountId, CONFIG.privateKey, CONFIG.network);
  hedera.setTopicId(CONFIG.topicId);

  const topicInfo = await hedera.getTopicInfo();

  console.log(`  Topic ID:        ${topicInfo.topicId}`);
  console.log(`  Memo:            ${topicInfo.memo}`);
  console.log(`  Messages:        ${topicInfo.sequenceNumber}`);
  console.log(`  Expires:         ${topicInfo.expirationTime || "N/A"}`);
  console.log(`  Explorer:        https://hashscan.io/${CONFIG.network}/topic/${topicInfo.topicId}`);
  console.log();
}

async function demo() {
  console.log("\n╔══════════════════════════════════════════════════╗");
  console.log("║       HederaIntel Agent — Full Demo             ║");
  console.log("╚══════════════════════════════════════════════════╝\n");
  console.log("This demo creates a topic, generates 3 reports, and");
  console.log("publishes them to Hedera for permanent timestamping.\n");

  await hedera.initialize(CONFIG.accountId, CONFIG.privateKey, CONFIG.network);

  // Step 1: Create topic
  console.log("═══ Step 1: Creating HCS Topic ═══");
  const topicId = await hedera.createTopic("HederaIntel Demo — Market Intelligence");

  // Step 2: Generate and publish reports
  const categories = [
    { assets: ["BTC", "ETH"], focus: "major_caps" },
    { assets: ["SOL", "HBAR"], focus: "l1_ecosystems" },
    { assets: ["BTC", "ETH", "SOL", "HBAR"], focus: "general" },
  ];

  const results = [];

  for (let i = 0; i < categories.length; i++) {
    console.log(`\n═══ Step ${i + 2}: Report ${i + 1}/${categories.length} ═══`);
    const report = await intel.generateReport(categories[i]);
    const txResult = await hedera.publishReport(report);
    results.push({ report, txResult });

    console.log(`  ✅ Published: ${report.title}`);
    console.log(`     Sequence: #${txResult.sequenceNumber || "chunked"}`);

    // Small delay between transactions
    if (i < categories.length - 1) {
      await new Promise((r) => setTimeout(r, 2000));
    }
  }

  // Summary
  console.log("\n╔══════════════════════════════════════════════════╗");
  console.log("║                  Demo Complete!                  ║");
  console.log("╚══════════════════════════════════════════════════╝\n");
  console.log(`  Topic:      ${topicId}`);
  console.log(`  Reports:    ${results.length} published`);
  console.log(`  Explorer:   https://hashscan.io/${CONFIG.network}/topic/${topicId}`);
  console.log(`\n  All reports are now permanently timestamped on Hedera.`);
  console.log(`  Anyone can verify their existence and content on-chain.\n`);

  return { topicId, results };
}

async function networkHealth() {
  console.log("\n╔══════════════════════════════════════════════════╗");
  console.log("║     HederaIntel Agent — Network Analytics        ║");
  console.log("╚══════════════════════════════════════════════════╝\n");

  const report = await network.generateNetworkReport();

  console.log(`  Network:     ${report.network}`);
  console.log(`  Health:      ${report.healthScore}/100`);

  if (report.supply) {
    console.log(`\n  ─── Supply ───`);
    console.log(`  Total:       ${report.supply.totalSupply} HBAR`);
    console.log(`  Released:    ${report.supply.releasedSupply} HBAR`);
  }

  if (report.hcsActivity) {
    console.log(`\n  ─── HCS Activity (recent) ───`);
    console.log(`  Messages:    ${report.hcsActivity.messageCount}`);
    console.log(`  Topics:      ${report.hcsActivity.uniqueTopics || 0}`);
    if (report.hcsActivity.avgIntervalSeconds) {
      console.log(`  Avg interval: ${report.hcsActivity.avgIntervalSeconds}s`);
    }
  }

  if (report.transactions) {
    console.log(`\n  ─── Transactions (recent) ───`);
    console.log(`  Count:       ${report.transactions.count}`);
    console.log(`  Total HBAR:  ${report.transactions.totalHbar}`);
    console.log(`  Avg/tx:      ${report.transactions.avgHbarPerTx} HBAR`);
  }

  if (report.nodes) {
    console.log(`\n  ─── Nodes ───`);
    console.log(`  Total:       ${report.nodes.totalNodes}`);
    console.log(`  Consensus:   ${report.nodes.consensusNodes}`);
  }

  console.log();

  // Also publish to HCS if connected
  if (CONFIG.accountId && CONFIG.topicId) {
    await hedera.initialize(CONFIG.accountId, CONFIG.privateKey, CONFIG.network);
    hedera.setTopicId(CONFIG.topicId);
    console.log("[Agent] Publishing network report to HCS...");
    const txResult = await hedera.publishReport({
      title: "Hedera Network Health Report",
      summary: JSON.stringify(report),
    });
    console.log(`✅ Published: ${txResult.hashscanUrl}\n`);
  }

  return report;
}

async function listen() {
  console.log("\n╔══════════════════════════════════════════════════╗");
  console.log("║     HederaIntel Agent — Protocol Listener        ║");
  console.log("╚══════════════════════════════════════════════════╝\n");

  if (!CONFIG.accountId || !CONFIG.topicId) {
    console.error("Error: Set HEDERA_ACCOUNT_ID, HEDERA_PRIVATE_KEY, and HEDERA_TOPIC_ID.");
    console.error("Run 'node index.js setup' first.");
    process.exit(1);
  }

  await hedera.initialize(CONFIG.accountId, CONFIG.privateKey, CONFIG.network);
  hedera.setTopicId(CONFIG.topicId);

  const protocol = new AgentProtocol(hedera, intel);

  console.log("Starting agent protocol listener...");
  console.log("Other agents can query this topic for market intelligence.");
  console.log("Press Ctrl+C to stop.\n");

  await protocol.startListening();
}

// ─── HCS-10 OpenConvAI Commands ─────────────────────────────────────────────

async function openconvai() {
  console.log("\n╔══════════════════════════════════════════════════╗");
  console.log("║   HederaIntel — HCS-10 OpenConvAI Agent Setup    ║");
  console.log("╠══════════════════════════════════════════════════╣");
  console.log("║  Registers in the Hashgraph Online (HOL) global  ║");
  console.log("║  agent registry and starts listening for queries. ║");
  console.log("╚══════════════════════════════════════════════════╝\n");

  const agent = new OpenConvAIAgent(intel, network);
  await agent.initialize(CONFIG.accountId, CONFIG.privateKey, CONFIG.network);

  // Check for existing HCS-10 topics
  const hcs10Inbound = process.env.HCS10_INBOUND_TOPIC_ID;
  const hcs10Outbound = process.env.HCS10_OUTBOUND_TOPIC_ID;

  if (hcs10Inbound && hcs10Outbound) {
    agent.setTopics(hcs10Inbound, hcs10Outbound);
    console.log("[Agent] Using existing HCS-10 topics.");
  } else {
    console.log("[Agent] Creating new HCS-10 topics...");
    const topics = await agent.createTopics();

    // Save to .env
    const envPath = path.join(__dirname, ".env");
    if (fs.existsSync(envPath)) {
      let envContent = fs.readFileSync(envPath, "utf-8");
      envContent += `\nHCS10_INBOUND_TOPIC_ID=${topics.inboundTopicId}\n`;
      envContent += `HCS10_OUTBOUND_TOPIC_ID=${topics.outboundTopicId}\n`;
      fs.writeFileSync(envPath, envContent);
    }
  }

  // Register in HOL global registry
  const isRegistered = process.env.HCS10_REGISTERED === "true";
  if (!isRegistered) {
    const result = await agent.register();
    console.log(`\n[Agent] Registered in HOL Registry!`);
    console.log(`[Agent] Operator: ${result.operatorId}`);
    console.log(`[Agent] Verify: ${result.hashscanUrl}\n`);

    // Mark as registered
    const envPath = path.join(__dirname, ".env");
    if (fs.existsSync(envPath)) {
      let envContent = fs.readFileSync(envPath, "utf-8");
      envContent += `\nHCS10_REGISTERED=true\n`;
      fs.writeFileSync(envPath, envContent);
    }
  } else {
    console.log("[Agent] Already registered in HOL Registry.");
  }

  // Start listening
  console.log("\nStarting OpenConvAI listener...");
  console.log("Other agents and humans can now discover and query this agent");
  console.log("through the HOL Registry on Hedera.\n");
  console.log("Press Ctrl+C to stop.\n");

  await agent.startListening();
}

async function chat() {
  console.log("\n[HederaIntel] Starting chat mode...\n");

  const agent = new OpenConvAIAgent(intel, network);

  // If credentials are available, connect to Hedera for timestamping
  if (CONFIG.accountId && CONFIG.privateKey) {
    try {
      await agent.initialize(CONFIG.accountId, CONFIG.privateKey, CONFIG.network);

      const hcs10Outbound = process.env.HCS10_OUTBOUND_TOPIC_ID || CONFIG.topicId;
      if (hcs10Outbound) {
        agent.outboundTopicId = hcs10Outbound;
        console.log(`[HederaIntel] Connected to Hedera. Responses will be timestamped.\n`);
      }
    } catch (err) {
      console.log(`[HederaIntel] Running in offline mode (no Hedera connection).\n`);
    }
  } else {
    console.log(`[HederaIntel] Running in offline mode. Set HEDERA_ACCOUNT_ID and HEDERA_PRIVATE_KEY to enable on-chain timestamping.\n`);
  }

  await agent.startChat();
}

async function queryAgent() {
  const targetTopic = process.argv[3];
  const queryText = process.argv.slice(4).join(" ") || "Give me a market report";

  if (!targetTopic) {
    console.error("Usage: node index.js query <target-inbound-topic-id> <query text>");
    process.exit(1);
  }

  const agent = new OpenConvAIAgent(intel, network);
  await agent.initialize(CONFIG.accountId, CONFIG.privateKey, CONFIG.network);

  const hcs10Inbound = process.env.HCS10_INBOUND_TOPIC_ID;
  const hcs10Outbound = process.env.HCS10_OUTBOUND_TOPIC_ID;
  if (hcs10Inbound && hcs10Outbound) {
    agent.setTopics(hcs10Inbound, hcs10Outbound);
  }

  console.log(`[Agent] Sending query to ${targetTopic}: "${queryText}"`);
  const result = await agent.queryAgent(targetTopic, queryText);
  console.log(`[Agent] ✅ Query sent! TX: ${result.transactionId}`);
}

// ─── CLI Router ─────────────────────────────────────────────────────────────

const command = process.argv[2] || "help";

const commands = {
  setup,
  report: generateAndPublish,
  network: networkHealth,
  listen,
  subscribe,
  info,
  demo,
  openconvai,
  chat,
  query: queryAgent,
  help: () => {
    console.log(`
HederaIntel Agent — Autonomous Market Intelligence on Hedera
Version 2.0 — Now with HCS-10 OpenConvAI Support!

Usage:
  node index.js setup        Create a new HCS topic
  node index.js report       Generate and publish a market report
  node index.js network      Hedera network health analytics
  node index.js listen       Start agent-to-agent protocol listener
  node index.js subscribe    Live-stream reports from the topic
  node index.js info         Show topic info and stats
  node index.js demo         Run a full demo (setup + 3 reports)

  HCS-10 OpenConvAI:
  node index.js openconvai   Register in HOL Registry & start OpenConvAI listener
  node index.js chat         Interactive chat with market intelligence
  node index.js query <topic> <text>  Query another HCS-10 agent

  node index.js help         Show this help message

Environment Variables (set in .env):
  HEDERA_ACCOUNT_ID          Your Hedera testnet account ID
  HEDERA_PRIVATE_KEY         Your Hedera private key
  HEDERA_NETWORK             testnet or mainnet (default: testnet)
  HEDERA_TOPIC_ID            Existing topic ID (optional)
  HCS10_INBOUND_TOPIC_ID     HCS-10 inbound topic (auto-created)
  HCS10_OUTBOUND_TOPIC_ID    HCS-10 outbound topic (auto-created)
  HCS10_REGISTERED           Whether agent is registered in HOL (auto-set)

Protocols:
  Custom Protocol — Direct agent queries via HCS topic messages
  HCS-10 OpenConvAI — Hashgraph Online standard for agent discovery & chat
    Query types: market_report, price_check, narrative_detection,
                 hedera_network_stats, natural_language_query

Built for Hedera Hello Future Apex Hackathon 2026.
Track: AI & Agents | Bounty: Hashgraph Online
`);
  },
};

if (commands[command]) {
  const result = commands[command]();
  if (result && typeof result.catch === "function") {
    result.catch((err) => {
      console.error(`\n❌ Error: ${err.message}`);
      process.exit(1);
    });
  }
} else {
  console.error(`Unknown command: ${command}`);
  commands.help();
}
