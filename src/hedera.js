/**
 * Hedera Consensus Service (HCS) integration for HederaIntel Agent.
 *
 * Uses HCS to create immutable, timestamped records of market intelligence
 * reports. Every report published by the agent is verifiable on-chain.
 */

const {
  Client,
  TopicCreateTransaction,
  TopicMessageSubmitTransaction,
  TopicMessageQuery,
  TopicInfoQuery,
  AccountBalanceQuery,
  Hbar,
} = require("@hashgraph/sdk");

class HederaService {
  constructor() {
    this.client = null;
    this.topicId = null;
    this.accountId = null;
  }

  /**
   * Initialize the Hedera client with testnet or mainnet credentials.
   */
  async initialize(accountId, privateKey, network = "testnet") {
    this.accountId = accountId;

    if (network === "testnet") {
      this.client = Client.forTestnet();
    } else if (network === "mainnet") {
      this.client = Client.forMainnet();
    } else {
      throw new Error(`Unknown network: ${network}`);
    }

    this.client.setOperator(accountId, privateKey);
    this.client.setDefaultMaxTransactionFee(new Hbar(2));
    this.client.setDefaultMaxQueryPayment(new Hbar(1));

    // Verify connection
    const balance = await new AccountBalanceQuery()
      .setAccountId(accountId)
      .execute(this.client);

    console.log(`[Hedera] Connected to ${network}`);
    console.log(`[Hedera] Account: ${accountId}`);
    console.log(`[Hedera] Balance: ${balance.hbars.toString()}`);

    return { accountId, balance: balance.hbars.toString(), network };
  }

  /**
   * Create a new HCS topic for publishing intelligence reports.
   * Topics are permanent, append-only logs — perfect for provenance.
   */
  async createTopic(memo = "HederaIntel Agent - Market Intelligence Feed") {
    const tx = await new TopicCreateTransaction()
      .setTopicMemo(memo)
      .execute(this.client);

    const receipt = await tx.getReceipt(this.client);
    this.topicId = receipt.topicId.toString();

    console.log(`[Hedera] Created topic: ${this.topicId}`);
    console.log(`[Hedera] View at: https://hashscan.io/testnet/topic/${this.topicId}`);

    return this.topicId;
  }

  /**
   * Set an existing topic ID (for resuming sessions).
   */
  setTopicId(topicId) {
    this.topicId = topicId;
    console.log(`[Hedera] Using existing topic: ${this.topicId}`);
  }

  /**
   * Publish a market intelligence report to HCS.
   * Returns the transaction ID and sequence number for verification.
   */
  async publishReport(report) {
    if (!this.topicId) {
      throw new Error("No topic ID set. Call createTopic() or setTopicId() first.");
    }

    const message = JSON.stringify({
      type: "market_intelligence",
      version: "1.0",
      agent: "HederaIntel",
      timestamp: new Date().toISOString(),
      report: {
        title: report.title,
        summary: report.summary,
        signals: report.signals || [],
        confidence: report.confidence || "medium",
        hash: this._hashContent(report.summary),
      },
    });

    // HCS messages max 1024 bytes. If larger, chunk it.
    if (Buffer.byteLength(message) > 1024) {
      return await this._publishChunked(message);
    }

    const tx = await new TopicMessageSubmitTransaction()
      .setTopicId(this.topicId)
      .setMessage(message)
      .execute(this.client);

    const receipt = await tx.getReceipt(this.client);

    const result = {
      topicId: this.topicId,
      sequenceNumber: receipt.topicSequenceNumber.toString(),
      transactionId: tx.transactionId.toString(),
      timestamp: new Date().toISOString(),
      hashscanUrl: `https://hashscan.io/testnet/topic/${this.topicId}`,
    };

    console.log(`[Hedera] Published report #${result.sequenceNumber}`);
    console.log(`[Hedera] TX: ${result.transactionId}`);

    return result;
  }

  /**
   * Publish a chunked message for reports exceeding 1024 bytes.
   */
  async _publishChunked(message) {
    const chunkSize = 900; // Leave room for metadata
    const chunks = [];
    const totalChunks = Math.ceil(message.length / chunkSize);

    for (let i = 0; i < message.length; i += chunkSize) {
      chunks.push(message.slice(i, i + chunkSize));
    }

    const results = [];
    for (let i = 0; i < chunks.length; i++) {
      const chunkMsg = JSON.stringify({
        _chunk: { index: i, total: totalChunks },
        data: chunks[i],
      });

      const tx = await new TopicMessageSubmitTransaction()
        .setTopicId(this.topicId)
        .setMessage(chunkMsg)
        .execute(this.client);

      const receipt = await tx.getReceipt(this.client);
      results.push({
        sequenceNumber: receipt.topicSequenceNumber.toString(),
        transactionId: tx.transactionId.toString(),
      });
    }

    console.log(`[Hedera] Published chunked report (${totalChunks} parts)`);
    return {
      topicId: this.topicId,
      chunks: results,
      totalChunks,
      hashscanUrl: `https://hashscan.io/testnet/topic/${this.topicId}`,
    };
  }

  /**
   * Subscribe to topic messages (live feed of intelligence reports).
   */
  async subscribe(callback) {
    if (!this.topicId) {
      throw new Error("No topic ID set.");
    }

    new TopicMessageQuery()
      .setTopicId(this.topicId)
      .subscribe(this.client, null, (message) => {
        const content = Buffer.from(message.contents).toString("utf-8");
        try {
          const parsed = JSON.parse(content);
          callback({
            sequenceNumber: message.sequenceNumber.toString(),
            timestamp: message.consensusTimestamp.toDate().toISOString(),
            content: parsed,
          });
        } catch {
          callback({
            sequenceNumber: message.sequenceNumber.toString(),
            timestamp: message.consensusTimestamp.toDate().toISOString(),
            content: content,
          });
        }
      });

    console.log(`[Hedera] Subscribed to topic: ${this.topicId}`);
  }

  /**
   * Get topic info (message count, memo, etc).
   */
  async getTopicInfo() {
    if (!this.topicId) {
      throw new Error("No topic ID set.");
    }

    const info = await new TopicInfoQuery()
      .setTopicId(this.topicId)
      .execute(this.client);

    return {
      topicId: this.topicId,
      memo: info.topicMemo,
      sequenceNumber: info.sequenceNumber.toString(),
      expirationTime: info.expirationTime?.toDate()?.toISOString(),
    };
  }

  /**
   * Simple hash for content fingerprinting.
   */
  _hashContent(content) {
    const crypto = require("crypto");
    return crypto.createHash("sha256").update(content).digest("hex").slice(0, 16);
  }
}

module.exports = { HederaService };
