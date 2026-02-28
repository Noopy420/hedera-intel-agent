/**
 * Hedera Network Analytics Module for HederaIntel Agent.
 *
 * Fetches real-time Hedera network stats from the Mirror Node API.
 * Provides HBAR-specific intelligence that differentiates our agent
 * from generic crypto tools.
 */

const https = require("https");

class NetworkAnalytics {
  constructor(network = "testnet") {
    this.baseUrl =
      network === "mainnet"
        ? "https://mainnet-public.mirrornode.hedera.com"
        : "https://testnet.mirrornode.hedera.com";
  }

  /**
   * Get HBAR supply and staking stats.
   */
  async getNetworkSupply() {
    try {
      const data = await this._get("/api/v1/network/supply");
      return {
        totalSupply: data.total_supply
          ? (parseInt(data.total_supply) / 1e8).toLocaleString()
          : "N/A",
        releasedSupply: data.released_supply
          ? (parseInt(data.released_supply) / 1e8).toLocaleString()
          : "N/A",
        timestamp: new Date().toISOString(),
      };
    } catch (err) {
      console.warn(`[Network] Supply fetch failed: ${err.message}`);
      return null;
    }
  }

  /**
   * Get recent HCS message activity — indicator of network usage.
   */
  async getRecentHCSActivity(limit = 25) {
    try {
      const data = await this._get(
        `/api/v1/topics/messages?limit=${limit}&order=desc`
      );
      if (!data.messages || data.messages.length === 0) {
        return { messageCount: 0, topics: [], avgInterval: null };
      }

      const topics = new Set();
      const timestamps = [];

      for (const msg of data.messages) {
        topics.add(msg.topic_id);
        if (msg.consensus_timestamp) {
          timestamps.push(parseFloat(msg.consensus_timestamp));
        }
      }

      // Calculate average interval between messages
      let avgInterval = null;
      if (timestamps.length > 1) {
        const sorted = timestamps.sort((a, b) => b - a);
        let totalInterval = 0;
        for (let i = 0; i < sorted.length - 1; i++) {
          totalInterval += sorted[i] - sorted[i + 1];
        }
        avgInterval = totalInterval / (sorted.length - 1);
      }

      return {
        messageCount: data.messages.length,
        uniqueTopics: topics.size,
        avgIntervalSeconds: avgInterval
          ? Math.round(avgInterval * 100) / 100
          : null,
        sample: data.messages.slice(0, 3).map((m) => ({
          topicId: m.topic_id,
          sequenceNumber: m.sequence_number,
          timestamp: m.consensus_timestamp,
          size: m.message ? Buffer.from(m.message, "base64").length : 0,
        })),
      };
    } catch (err) {
      console.warn(`[Network] HCS activity fetch failed: ${err.message}`);
      return null;
    }
  }

  /**
   * Get recent transaction volume — indicator of economic activity.
   */
  async getRecentTransactions(limit = 25) {
    try {
      const data = await this._get(
        `/api/v1/transactions?limit=${limit}&order=desc&transactiontype=CRYPTOTRANSFER`
      );
      if (!data.transactions || data.transactions.length === 0) {
        return { count: 0, totalHbar: 0 };
      }

      let totalTinybar = 0;
      for (const tx of data.transactions) {
        if (tx.transfers) {
          for (const transfer of tx.transfers) {
            if (transfer.amount > 0) {
              totalTinybar += transfer.amount;
            }
          }
        }
      }

      return {
        count: data.transactions.length,
        totalHbar: Math.round(totalTinybar / 1e8),
        avgHbarPerTx:
          data.transactions.length > 0
            ? Math.round(totalTinybar / 1e8 / data.transactions.length)
            : 0,
      };
    } catch (err) {
      console.warn(`[Network] Transaction fetch failed: ${err.message}`);
      return null;
    }
  }

  /**
   * Get network nodes info.
   */
  async getNodeCount() {
    try {
      const data = await this._get("/api/v1/network/nodes?limit=100");
      if (!data.nodes) return null;

      return {
        totalNodes: data.nodes.length,
        consensusNodes: data.nodes.filter(
          (n) => n.service_endpoints && n.service_endpoints.length > 0
        ).length,
      };
    } catch (err) {
      console.warn(`[Network] Node info fetch failed: ${err.message}`);
      return null;
    }
  }

  /**
   * Generate a comprehensive Hedera network health report.
   */
  async generateNetworkReport() {
    console.log("[Network] Gathering Hedera network analytics...");

    const [supply, hcsActivity, transactions, nodes] =
      await Promise.allSettled([
        this.getNetworkSupply(),
        this.getRecentHCSActivity(),
        this.getRecentTransactions(),
        this.getNodeCount(),
      ]);

    const report = {
      type: "hedera_network_health",
      timestamp: new Date().toISOString(),
      network: this.baseUrl.includes("mainnet") ? "mainnet" : "testnet",
      supply: supply.status === "fulfilled" ? supply.value : null,
      hcsActivity:
        hcsActivity.status === "fulfilled" ? hcsActivity.value : null,
      transactions:
        transactions.status === "fulfilled" ? transactions.value : null,
      nodes: nodes.status === "fulfilled" ? nodes.value : null,
    };

    // Generate health score
    report.healthScore = this._calculateHealthScore(report);

    console.log(
      `[Network] Report complete. Health: ${report.healthScore}/100`
    );
    return report;
  }

  /**
   * Calculate a simple network health score (0-100).
   */
  _calculateHealthScore(report) {
    let score = 50; // Baseline

    if (report.hcsActivity?.messageCount > 0) score += 15;
    if (report.transactions?.count > 0) score += 15;
    if (report.nodes?.totalNodes > 0) score += 10;
    if (report.supply) score += 10;

    return Math.min(score, 100);
  }

  /**
   * HTTP GET helper for Mirror Node API.
   */
  _get(path) {
    return new Promise((resolve, reject) => {
      const url = `${this.baseUrl}${path}`;
      https
        .get(url, (res) => {
          let data = "";
          res.on("data", (chunk) => (data += chunk));
          res.on("end", () => {
            try {
              resolve(JSON.parse(data));
            } catch (e) {
              reject(
                new Error(`Failed to parse response from ${path}: ${data.slice(0, 200)}`)
              );
            }
          });
          res.on("error", reject);
        })
        .on("error", reject);
    });
  }
}

module.exports = { NetworkAnalytics };
