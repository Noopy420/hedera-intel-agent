/**
 * HCS-10 OpenConvAI Integration for HederaIntel Agent.
 *
 * Registers the agent in the Hashgraph Online (HOL) global registry
 * and enables agent-to-agent + human-to-agent communication using
 * the HCS-10 OpenConvAI standard.
 *
 * This integration enables:
 *   - Agent discovery via the HOL Registry
 *   - Natural language queries from humans and other agents
 *   - Trustless, on-chain message history
 *   - Interoperability with the Hedera agent ecosystem
 *
 * Built for the Hedera Hello Future Apex Hackathon 2026.
 * Target: AI & Agents Track + Hashgraph Online Partner Bounty
 *
 * @see https://hol.org/docs/standards/hcs-10/
 * @see https://hashgraphonline.com/docs/libraries/standards-sdk/
 */

const {
  Client,
  TopicCreateTransaction,
  TopicMessageSubmitTransaction,
  TopicMessageQuery,
  TopicInfoQuery,
  AccountBalanceQuery,
  Hbar,
  PrivateKey,
} = require("@hashgraph/sdk");

const PROTOCOL = "hcs-10";
const AGENT_NAME = "HederaIntel";
const AGENT_DESCRIPTION =
  "Autonomous AI market intelligence agent. Generates real-time crypto market analysis, " +
  "narrative detection, and Hedera network health reports — all timestamped immutably on HCS.";
const AGENT_CAPABILITIES = [
  "market_report",
  "price_check",
  "narrative_detection",
  "hedera_network_stats",
  "natural_language_query",
];

/**
 * HCS-10 OpenConvAI Agent implementation.
 *
 * Manages the agent's HCS-10 lifecycle:
 *   1. Create inbound/outbound topics
 *   2. Register in the global registry
 *   3. Accept connections
 *   4. Handle incoming messages with natural language understanding
 *   5. Respond with market intelligence
 */
class OpenConvAIAgent {
  constructor(intelEngine, networkAnalytics) {
    this.intel = intelEngine;
    this.network = networkAnalytics;
    this.client = null;
    this.accountId = null;
    this.privateKey = null;

    // HCS-10 topic infrastructure
    this.inboundTopicId = null; // Receives connection requests
    this.outboundTopicId = null; // Public activity log
    this.registryTopicId = null; // HOL global registry

    // Active connections (topicId -> metadata)
    this.connections = new Map();

    // Operation ID counter
    this.opCounter = 0;
  }

  /**
   * Initialize the OpenConvAI agent with Hedera credentials.
   */
  async initialize(accountId, privateKey, network = "testnet") {
    this.accountId = accountId;
    this.privateKey = privateKey;

    if (network === "testnet") {
      this.client = Client.forTestnet();
      // HOL testnet registry topic
      this.registryTopicId = "0.0.6813087";
    } else {
      this.client = Client.forMainnet();
      // HOL mainnet registry topic
      this.registryTopicId = "0.0.5878443";
    }

    this.client.setOperator(accountId, privateKey);
    this.client.setDefaultMaxTransactionFee(new Hbar(5));
    this.client.setDefaultMaxQueryPayment(new Hbar(2));

    // Verify connection
    const balance = await new AccountBalanceQuery()
      .setAccountId(accountId)
      .execute(this.client);

    console.log(`[HCS-10] Initialized on ${network}`);
    console.log(`[HCS-10] Account: ${accountId}`);
    console.log(`[HCS-10] Balance: ${balance.hbars.toString()}`);
    console.log(`[HCS-10] Registry: ${this.registryTopicId}`);

    return { accountId, balance: balance.hbars.toString() };
  }

  /**
   * Create the inbound and outbound topics required by HCS-10.
   *
   * Inbound topic: receives connection requests (public)
   * Outbound topic: agent's public activity log (submit-key restricted)
   */
  async createTopics() {
    console.log("[HCS-10] Creating agent topics...");

    // Create inbound topic (public — anyone can submit connection requests)
    const inboundTx = await new TopicCreateTransaction()
      .setTopicMemo(
        `hcs-10:inbound:${AGENT_NAME} - Market Intelligence Agent`
      )
      .execute(this.client);

    const inboundReceipt = await inboundTx.getReceipt(this.client);
    this.inboundTopicId = inboundReceipt.topicId.toString();

    console.log(`[HCS-10] Inbound topic:  ${this.inboundTopicId}`);

    // Create outbound topic (submit-key restricted to this agent)
    const key = PrivateKey.fromStringDer(this.privateKey);
    const outboundTx = await new TopicCreateTransaction()
      .setTopicMemo(
        `hcs-10:outbound:${AGENT_NAME} - Activity Log`
      )
      .setSubmitKey(key.publicKey)
      .execute(this.client);

    const outboundReceipt = await outboundTx.getReceipt(this.client);
    this.outboundTopicId = outboundReceipt.topicId.toString();

    console.log(`[HCS-10] Outbound topic: ${this.outboundTopicId}`);

    return {
      inboundTopicId: this.inboundTopicId,
      outboundTopicId: this.outboundTopicId,
    };
  }

  /**
   * Set existing topic IDs (for resuming a registered agent).
   */
  setTopics(inboundTopicId, outboundTopicId) {
    this.inboundTopicId = inboundTopicId;
    this.outboundTopicId = outboundTopicId;
    console.log(`[HCS-10] Using existing topics:`);
    console.log(`  Inbound:  ${this.inboundTopicId}`);
    console.log(`  Outbound: ${this.outboundTopicId}`);
  }

  /**
   * Register the agent in the HOL global registry.
   *
   * Publishes a registration message to the registry topic following
   * the HCS-10 standard format.
   */
  async register() {
    if (!this.inboundTopicId || !this.outboundTopicId) {
      throw new Error(
        "Topics not created. Call createTopics() or setTopics() first."
      );
    }

    const operatorId = `${this.inboundTopicId}@${this.accountId}`;

    const registrationMessage = JSON.stringify({
      p: PROTOCOL,
      op: "register",
      operator_id: operatorId,
      data: JSON.stringify({
        name: AGENT_NAME,
        description: AGENT_DESCRIPTION,
        capabilities: AGENT_CAPABILITIES,
        type: "autonomous",
        inbound_topic: this.inboundTopicId,
        outbound_topic: this.outboundTopicId,
        model: "custom-intel-engine",
        created: new Date().toISOString(),
        metadata: {
          hackathon: "Hedera Hello Future Apex 2026",
          track: "AI & Agents",
          bounty: "Hashgraph Online",
          version: "2.0.0",
          github: "https://github.com/Noopy420/hedera-intel-agent",
        },
      }),
      m: `${AGENT_NAME} - Autonomous AI Market Intelligence Agent`,
    });

    console.log("[HCS-10] Registering agent in HOL global registry...");

    const tx = await new TopicMessageSubmitTransaction()
      .setTopicId(this.registryTopicId)
      .setMessage(registrationMessage)
      .execute(this.client);

    const receipt = await tx.getReceipt(this.client);

    const result = {
      operatorId,
      registryTopicId: this.registryTopicId,
      sequenceNumber: receipt.topicSequenceNumber.toString(),
      transactionId: tx.transactionId.toString(),
      hashscanUrl: `https://hashscan.io/testnet/topic/${this.registryTopicId}`,
    };

    console.log(`[HCS-10] ✅ Agent registered!`);
    console.log(`[HCS-10] Operator ID: ${operatorId}`);
    console.log(`[HCS-10] Registry Seq: #${result.sequenceNumber}`);
    console.log(`[HCS-10] Verify: ${result.hashscanUrl}`);

    // Also announce on outbound topic
    await this._publishOutbound("register", {
      name: AGENT_NAME,
      capabilities: AGENT_CAPABILITIES,
      inbound_topic: this.inboundTopicId,
    });

    return result;
  }

  /**
   * Start listening for incoming messages and connection requests.
   * This is the main event loop for the OpenConvAI agent.
   */
  async startListening() {
    if (!this.inboundTopicId) {
      throw new Error("Inbound topic not set. Register first.");
    }

    console.log("\n[HCS-10] 🤖 Agent is LIVE and listening...");
    console.log(`[HCS-10] Inbound:  ${this.inboundTopicId}`);
    console.log(`[HCS-10] Outbound: ${this.outboundTopicId}`);
    console.log("[HCS-10] Waiting for connections and queries...\n");

    // Send heartbeat
    await this._sendHeartbeat();

    // Subscribe to inbound topic for messages
    new TopicMessageQuery()
      .setTopicId(this.inboundTopicId)
      .subscribe(this.client, null, async (message) => {
        const content = Buffer.from(message.contents).toString("utf-8");
        await this._handleInboundMessage(content, message);
      });
  }

  /**
   * Handle an incoming message on the inbound topic.
   */
  async _handleInboundMessage(rawContent, metadata) {
    try {
      const msg = JSON.parse(rawContent);

      // Check if it follows HCS-10 protocol
      if (msg.p === PROTOCOL || msg.protocol === PROTOCOL) {
        await this._handleProtocolMessage(msg, metadata);
      } else if (msg.type === "query" || msg.query) {
        // Handle direct queries (backwards compatibility)
        await this._handleDirectQuery(msg, metadata);
      } else {
        // Treat as natural language
        await this._handleNaturalLanguage(rawContent, metadata);
      }
    } catch {
      // Non-JSON message — treat as natural language query
      await this._handleNaturalLanguage(rawContent, metadata);
    }
  }

  /**
   * Handle HCS-10 protocol messages.
   */
  async _handleProtocolMessage(msg, metadata) {
    const op = msg.op || msg.operation;

    switch (op) {
      case "connection_request": {
        console.log(`[HCS-10] Connection request from: ${msg.operator_id}`);
        await this._handleConnectionRequest(msg);
        break;
      }

      case "message": {
        console.log(`[HCS-10] Message from: ${msg.operator_id}`);
        const response = await this._processQuery(msg.data || msg.m);
        await this._sendResponse(msg, response);
        break;
      }

      case "close_connection": {
        console.log(`[HCS-10] Connection closed: ${msg.operator_id}`);
        this.connections.delete(msg.operator_id);
        break;
      }

      default:
        console.log(`[HCS-10] Unknown operation: ${op}`);
    }
  }

  /**
   * Handle a connection request from another agent.
   * Auto-accepts connections (open agent policy).
   */
  async _handleConnectionRequest(msg) {
    const requesterId = msg.operator_id;

    // Create a connection topic for this conversation
    const connTx = await new TopicCreateTransaction()
      .setTopicMemo(
        `hcs-10:connection:${AGENT_NAME}<>${requesterId}`
      )
      .execute(this.client);

    const connReceipt = await connTx.getReceipt(this.client);
    const connectionTopicId = connReceipt.topicId.toString();

    // Store connection
    this.connections.set(requesterId, {
      topicId: connectionTopicId,
      connectedAt: new Date().toISOString(),
      requester: requesterId,
    });

    // Send connection_created response
    const response = JSON.stringify({
      p: PROTOCOL,
      op: "connection_created",
      operator_id: `${this.inboundTopicId}@${this.accountId}`,
      data: JSON.stringify({
        connection_topic_id: connectionTopicId,
        accepted: true,
        agent: AGENT_NAME,
        capabilities: AGENT_CAPABILITIES,
        message:
          "Connected! Ask me anything about crypto markets, narratives, or Hedera network health.",
      }),
      m: "Connection accepted by HederaIntel",
    });

    await new TopicMessageSubmitTransaction()
      .setTopicId(this.inboundTopicId)
      .setMessage(response)
      .execute(this.client);

    console.log(
      `[HCS-10] ✅ Connection established with ${requesterId} on topic ${connectionTopicId}`
    );

    // Subscribe to connection topic for ongoing messages
    new TopicMessageQuery()
      .setTopicId(connectionTopicId)
      .subscribe(this.client, null, async (message) => {
        const content = Buffer.from(message.contents).toString("utf-8");
        await this._handleConnectionMessage(
          content,
          connectionTopicId,
          requesterId
        );
      });
  }

  /**
   * Handle a message on a connection topic.
   */
  async _handleConnectionMessage(rawContent, connectionTopicId, requesterId) {
    try {
      const msg = JSON.parse(rawContent);
      // Skip our own responses
      if (msg.operator_id === `${this.inboundTopicId}@${this.accountId}`) {
        return;
      }
      const queryText = msg.data || msg.m || JSON.stringify(msg);
      const response = await this._processQuery(queryText);

      // Send response on the connection topic
      const responseMsg = JSON.stringify({
        p: PROTOCOL,
        op: "message",
        operator_id: `${this.inboundTopicId}@${this.accountId}`,
        data: JSON.stringify(response),
        m: response.summary || "HederaIntel response",
      });

      await new TopicMessageSubmitTransaction()
        .setTopicId(connectionTopicId)
        .setMessage(responseMsg)
        .execute(this.client);

      console.log(`[HCS-10] Responded to ${requesterId} on ${connectionTopicId}`);
    } catch (err) {
      console.error(`[HCS-10] Error handling connection message: ${err.message}`);
    }
  }

  /**
   * Handle a direct (non-protocol) query.
   */
  async _handleDirectQuery(msg, metadata) {
    const queryType = msg.queryType || msg.type;
    const response = await this._processQuery(queryType, msg);
    await this._publishOutbound("response", {
      inResponseTo: metadata?.sequenceNumber?.toString(),
      ...response,
    });
  }

  /**
   * Handle natural language input — the core chat experience.
   */
  async _handleNaturalLanguage(text, metadata) {
    console.log(`[HCS-10] Natural language query: "${text.slice(0, 80)}..."`);
    const response = await this._processQuery(text);
    await this._publishOutbound("response", {
      inResponseTo: metadata?.sequenceNumber?.toString(),
      ...response,
    });
  }

  /**
   * Process a query (natural language or structured) and generate a response.
   * This is the intelligence routing layer.
   */
  async _processQuery(queryText, params = {}) {
    const query = typeof queryText === "string" ? queryText.toLowerCase() : "";

    // Route based on intent detection
    if (
      query.includes("price") ||
      query.includes("how much") ||
      query.includes("worth")
    ) {
      const assets = this._extractAssets(query) || ["BTC", "ETH", "SOL", "HBAR"];
      const report = await this.intel.generateReport({
        assets,
        focus: "prices",
      });
      return {
        type: "price_check",
        summary: report.summary,
        assets: report.assets,
        confidence: report.confidence,
        generatedAt: report.generatedAt,
      };
    }

    if (
      query.includes("narrative") ||
      query.includes("trend") ||
      query.includes("signal")
    ) {
      const report = await this.intel.generateReport({
        assets: ["BTC", "ETH", "SOL", "HBAR"],
        focus: "narratives",
      });
      return {
        type: "narrative_detection",
        summary: report.summary,
        narratives: report.signals,
        actionItems: report.actionItems,
        confidence: report.confidence,
        generatedAt: report.generatedAt,
      };
    }

    if (
      query.includes("hedera") ||
      query.includes("hbar") ||
      query.includes("network") ||
      query.includes("health")
    ) {
      const networkReport = await this.network.generateNetworkReport();
      const marketReport = await this.intel.generateReport({
        assets: ["HBAR"],
        focus: "hedera",
      });
      return {
        type: "hedera_intelligence",
        summary: `Hedera network health: ${networkReport.healthScore}/100. ${marketReport.summary}`,
        networkHealth: networkReport,
        marketData: marketReport.assets,
        signals: marketReport.signals,
        generatedAt: new Date().toISOString(),
      };
    }

    if (
      query.includes("capabilit") ||
      query.includes("what can you") ||
      query.includes("help") ||
      query.includes("who are you")
    ) {
      return {
        type: "capabilities",
        agent: AGENT_NAME,
        description: AGENT_DESCRIPTION,
        capabilities: AGENT_CAPABILITIES,
        usage: [
          "Ask about prices: 'What's the price of BTC and ETH?'",
          "Detect narratives: 'What are the current market trends?'",
          "Hedera intel: 'How is the Hedera network doing?'",
          "Full report: 'Give me a market intelligence report'",
        ],
        version: "2.0.0",
      };
    }

    // Default: generate full market intelligence report
    const assets = this._extractAssets(query) || [
      "BTC",
      "ETH",
      "SOL",
      "HBAR",
    ];
    const report = await this.intel.generateReport({ assets, focus: "general" });
    return {
      type: "market_report",
      title: report.title,
      summary: report.summary,
      assets: report.assets,
      signals: report.signals,
      actionItems: report.actionItems,
      confidence: report.confidence,
      generatedAt: report.generatedAt,
    };
  }

  /**
   * Extract asset symbols from natural language query.
   */
  _extractAssets(query) {
    const assetMap = {
      bitcoin: "BTC",
      btc: "BTC",
      ethereum: "ETH",
      eth: "ETH",
      solana: "SOL",
      sol: "SOL",
      hedera: "HBAR",
      hbar: "HBAR",
      avalanche: "AVAX",
      avax: "AVAX",
      near: "NEAR",
      polkadot: "DOT",
      dot: "DOT",
    };

    const found = [];
    for (const [keyword, symbol] of Object.entries(assetMap)) {
      if (query.includes(keyword)) {
        if (!found.includes(symbol)) found.push(symbol);
      }
    }

    return found.length > 0 ? found : null;
  }

  /**
   * Publish a message to the outbound topic.
   */
  async _publishOutbound(operation, data) {
    if (!this.outboundTopicId) return;

    const message = JSON.stringify({
      p: PROTOCOL,
      op: operation,
      operator_id: `${this.inboundTopicId}@${this.accountId}`,
      data: JSON.stringify(data),
      m: `${AGENT_NAME} ${operation}`,
      t: new Date().toISOString(),
    });

    try {
      // Handle messages > 1024 bytes with chunking
      if (Buffer.byteLength(message) > 1024) {
        await this._publishChunked(this.outboundTopicId, message);
      } else {
        await new TopicMessageSubmitTransaction()
          .setTopicId(this.outboundTopicId)
          .setMessage(message)
          .execute(this.client);
      }
    } catch (err) {
      console.error(`[HCS-10] Outbound publish error: ${err.message}`);
    }
  }

  /**
   * Publish chunked message for large payloads.
   */
  async _publishChunked(topicId, message) {
    const chunkSize = 900;
    const totalChunks = Math.ceil(message.length / chunkSize);

    for (let i = 0; i < totalChunks; i++) {
      const chunk = message.slice(i * chunkSize, (i + 1) * chunkSize);
      const chunkMsg = JSON.stringify({
        _chunk: { index: i, total: totalChunks, id: `${Date.now()}` },
        data: chunk,
      });

      await new TopicMessageSubmitTransaction()
        .setTopicId(topicId)
        .setMessage(chunkMsg)
        .execute(this.client);
    }
  }

  /**
   * Send response to a specific message.
   */
  async _sendResponse(originalMsg, response) {
    await this._publishOutbound("message", {
      inResponseTo: originalMsg.operator_id,
      ...response,
    });
  }

  /**
   * Send a heartbeat message to the outbound topic.
   */
  async _sendHeartbeat() {
    await this._publishOutbound("heartbeat", {
      agent: AGENT_NAME,
      status: "online",
      capabilities: AGENT_CAPABILITIES,
      uptime: process.uptime(),
      connections: this.connections.size,
      timestamp: new Date().toISOString(),
    });
    console.log("[HCS-10] Heartbeat sent");
  }

  /**
   * Send a query to another agent via their inbound topic.
   */
  async queryAgent(targetInboundTopicId, queryText) {
    const message = JSON.stringify({
      p: PROTOCOL,
      op: "message",
      operator_id: `${this.inboundTopicId}@${this.accountId}`,
      data: queryText,
      m: `Query from ${AGENT_NAME}`,
    });

    const tx = await new TopicMessageSubmitTransaction()
      .setTopicId(targetInboundTopicId)
      .setMessage(message)
      .execute(this.client);

    const receipt = await tx.getReceipt(this.client);

    console.log(`[HCS-10] Query sent to ${targetInboundTopicId}`);
    return {
      transactionId: tx.transactionId.toString(),
      sequenceNumber: receipt.topicSequenceNumber.toString(),
    };
  }

  /**
   * Interactive chat mode — process queries from stdin.
   */
  async startChat() {
    const readline = require("readline");
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    console.log("\n╔══════════════════════════════════════════════════╗");
    console.log("║     HederaIntel — OpenConvAI Chat Interface      ║");
    console.log("╠══════════════════════════════════════════════════╣");
    console.log("║  Ask me anything about crypto markets!           ║");
    console.log("║                                                  ║");
    console.log("║  Try:                                            ║");
    console.log("║    • What's the price of BTC?                    ║");
    console.log("║    • What are the current market narratives?     ║");
    console.log("║    • How is the Hedera network doing?            ║");
    console.log("║    • Give me a full market report                ║");
    console.log("║    • What can you do?                            ║");
    console.log("║                                                  ║");
    console.log("║  Type 'quit' or 'exit' to leave.                 ║");
    console.log("╚══════════════════════════════════════════════════╝\n");

    const prompt = () => {
      rl.question("You: ", async (input) => {
        const trimmed = input.trim();
        if (!trimmed || trimmed === "quit" || trimmed === "exit") {
          console.log("\n[HederaIntel] Goodbye! All reports are timestamped on Hedera.\n");
          rl.close();
          return;
        }

        try {
          console.log("\n[HederaIntel] Thinking...\n");
          const response = await this._processQuery(trimmed);

          // Display response
          this._displayChatResponse(response);

          // Publish to HCS if connected
          if (this.outboundTopicId) {
            await this._publishOutbound("chat_response", response);
            console.log(`  📡 Response timestamped on Hedera (topic ${this.outboundTopicId})\n`);
          }
        } catch (err) {
          console.log(`\n[HederaIntel] Error: ${err.message}\n`);
        }

        prompt();
      });
    };

    prompt();
  }

  /**
   * Display a formatted chat response.
   */
  _displayChatResponse(response) {
    console.log("─── HederaIntel ───────────────────────────────────");

    if (response.type === "capabilities") {
      console.log(`\n  🤖 ${response.agent} v${response.version}`);
      console.log(`  ${response.description}\n`);
      console.log("  I can help with:");
      for (const usage of response.usage) {
        console.log(`    • ${usage}`);
      }
      console.log();
    } else if (response.type === "price_check") {
      console.log(`\n  📊 ${response.summary}\n`);
      if (response.assets) {
        for (const asset of response.assets) {
          console.log(
            `  ${asset.symbol.padEnd(6)} ${asset.price.padStart(12)} | 24h: ${asset.change24h.padStart(8)} | MCap: ${asset.marketCap}`
          );
        }
        console.log();
      }
    } else if (response.type === "narrative_detection") {
      console.log(`\n  📡 ${response.summary}\n`);
      if (response.narratives) {
        console.log("  Active Narratives:");
        for (const n of response.narratives) {
          const bar = "█".repeat(Math.round(n.score * 10)).padEnd(10, "░");
          console.log(`    [${bar}] ${n.narrative}`);
          console.log(`             ${n.evidence}`);
        }
        console.log();
      }
    } else if (response.type === "hedera_intelligence") {
      console.log(`\n  🌐 ${response.summary}\n`);
      if (response.networkHealth) {
        const nh = response.networkHealth;
        console.log(`  Network Health: ${nh.healthScore}/100`);
        if (nh.hcsActivity) {
          console.log(`  HCS Messages (recent): ${nh.hcsActivity.messageCount}`);
        }
        if (nh.transactions) {
          console.log(`  Recent Transactions: ${nh.transactions.count}`);
        }
        console.log();
      }
    } else {
      // Full market report
      console.log(`\n  📈 ${response.title || "Market Intelligence Report"}\n`);
      console.log(`  ${response.summary}\n`);

      if (response.assets) {
        console.log("  Assets:");
        for (const asset of response.assets) {
          console.log(
            `    ${asset.symbol.padEnd(6)} ${asset.price.padStart(12)} | 24h: ${asset.change24h.padStart(8)} | MCap: ${asset.marketCap}`
          );
        }
        console.log();
      }

      if (response.signals && response.signals.length > 0) {
        console.log("  Signals:");
        for (const s of response.signals.slice(0, 3)) {
          console.log(`    → ${s.narrative}: ${s.evidence}`);
        }
        console.log();
      }

      if (response.actionItems && response.actionItems.length > 0) {
        console.log("  Actions:");
        for (const a of response.actionItems) {
          console.log(`    ✦ ${a}`);
        }
        console.log();
      }
    }

    console.log("───────────────────────────────────────────────────\n");
  }

  /**
   * Get agent status summary.
   */
  getStatus() {
    return {
      agent: AGENT_NAME,
      accountId: this.accountId,
      inboundTopicId: this.inboundTopicId,
      outboundTopicId: this.outboundTopicId,
      registryTopicId: this.registryTopicId,
      connections: this.connections.size,
      capabilities: AGENT_CAPABILITIES,
      uptime: process.uptime(),
    };
  }
}

module.exports = {
  OpenConvAIAgent,
  AGENT_NAME,
  AGENT_DESCRIPTION,
  AGENT_CAPABILITIES,
};
