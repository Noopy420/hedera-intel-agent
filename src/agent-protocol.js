/**
 * Agent Communication Protocol over HCS.
 *
 * Enables agent-to-agent communication using Hedera Consensus Service.
 * Other agents can send queries to our HCS topic, and we respond with
 * intelligence reports — all verifiable and timestamped on-chain.
 *
 * Protocol Format:
 *   Query:  { "protocol": "hedera-intel", "type": "query", "query": "..." }
 *   Response: { "protocol": "hedera-intel", "type": "response", "data": {...} }
 *   Heartbeat: { "protocol": "hedera-intel", "type": "heartbeat" }
 */

const PROTOCOL_VERSION = "1.0";
const PROTOCOL_NAME = "hedera-intel";

class AgentProtocol {
  constructor(hederaService, intelEngine) {
    this.hedera = hederaService;
    this.intel = intelEngine;
    this.handlers = new Map();
    this.isListening = false;

    // Register default query handlers
    this._registerDefaults();
  }

  /**
   * Register default query handlers.
   */
  _registerDefaults() {
    // Handle market report requests
    this.registerHandler("market_report", async (query) => {
      const assets = query.assets || ["BTC", "ETH", "SOL", "HBAR"];
      const report = await this.intel.generateReport({ assets, focus: "query" });
      return {
        status: "ok",
        report: {
          title: report.title,
          summary: report.summary,
          assets: report.assets,
          confidence: report.confidence,
          signals: report.signals.slice(0, 3),
        },
      };
    });

    // Handle price check requests
    this.registerHandler("price_check", async (query) => {
      const assets = query.assets || ["BTC", "ETH"];
      const report = await this.intel.generateReport({ assets, focus: "prices" });
      return {
        status: "ok",
        prices: report.assets,
      };
    });

    // Handle capability query
    this.registerHandler("capabilities", async () => {
      return {
        status: "ok",
        agent: "HederaIntel",
        version: PROTOCOL_VERSION,
        capabilities: [
          "market_report",
          "price_check",
          "narrative_detection",
          "hedera_network_stats",
        ],
        description:
          "Autonomous AI market intelligence agent with Hedera timestamping",
      };
    });

    // Handle narrative detection
    this.registerHandler("narrative_detection", async (query) => {
      const report = await this.intel.generateReport({
        assets: ["BTC", "ETH", "SOL", "HBAR"],
        focus: "narratives",
      });
      return {
        status: "ok",
        narratives: report.signals,
        actionItems: report.actionItems,
      };
    });
  }

  /**
   * Register a custom query handler.
   */
  registerHandler(queryType, handler) {
    this.handlers.set(queryType, handler);
  }

  /**
   * Create a protocol message.
   */
  createMessage(type, data = {}) {
    return {
      protocol: PROTOCOL_NAME,
      version: PROTOCOL_VERSION,
      type,
      timestamp: new Date().toISOString(),
      agent: "HederaIntel",
      ...data,
    };
  }

  /**
   * Send a heartbeat to the topic (announces agent is alive).
   */
  async sendHeartbeat() {
    const message = this.createMessage("heartbeat", {
      capabilities: Array.from(this.handlers.keys()),
      uptime: process.uptime(),
    });

    return await this.hedera.publishReport({
      title: "Agent Heartbeat",
      summary: JSON.stringify(message),
    });
  }

  /**
   * Process an incoming message and generate a response if needed.
   */
  async processMessage(rawMessage) {
    try {
      const msg =
        typeof rawMessage === "string" ? JSON.parse(rawMessage) : rawMessage;

      // Only process messages following our protocol
      if (msg.protocol !== PROTOCOL_NAME) return null;

      // Only respond to queries
      if (msg.type !== "query") return null;

      const queryType = msg.queryType || msg.query_type;
      const handler = this.handlers.get(queryType);

      if (!handler) {
        return this.createMessage("response", {
          status: "error",
          error: `Unknown query type: ${queryType}`,
          availableTypes: Array.from(this.handlers.keys()),
        });
      }

      console.log(`[Protocol] Processing ${queryType} query...`);
      const result = await handler(msg);

      return this.createMessage("response", {
        queryType,
        inResponseTo: msg.timestamp,
        ...result,
      });
    } catch (err) {
      console.error(`[Protocol] Error processing message: ${err.message}`);
      return this.createMessage("response", {
        status: "error",
        error: err.message,
      });
    }
  }

  /**
   * Start listening for queries on the topic and auto-respond.
   */
  async startListening() {
    if (this.isListening) {
      console.log("[Protocol] Already listening.");
      return;
    }

    this.isListening = true;
    console.log("[Protocol] Listening for agent queries...");

    // Send initial heartbeat
    await this.sendHeartbeat();

    // Subscribe to topic
    await this.hedera.subscribe(async (message) => {
      const response = await this.processMessage(message.content);

      if (response) {
        console.log(`[Protocol] Sending response...`);
        await this.hedera.publishReport({
          title: `Response: ${response.queryType || "unknown"}`,
          summary: JSON.stringify(response),
        });
      }
    });
  }

  /**
   * Send a query to another agent's topic.
   */
  async sendQuery(queryType, params = {}) {
    const message = this.createMessage("query", {
      queryType,
      ...params,
    });

    return await this.hedera.publishReport({
      title: `Query: ${queryType}`,
      summary: JSON.stringify(message),
    });
  }
}

module.exports = { AgentProtocol, PROTOCOL_NAME, PROTOCOL_VERSION };
