# HederaIntel Agent 🧠⛓️

**Autonomous AI Market Intelligence, Timestamped on Hedera**

HederaIntel is an autonomous AI agent that generates crypto market intelligence reports and publishes them to Hedera Consensus Service (HCS) for immutable, timestamped provenance. Every report is verifiable on-chain — creating a permanent, trustless record of market analysis.

> Built for the [Hedera Hello Future Apex Hackathon 2026](https://hackathon.stackup.dev/web/events/hedera-hello-future-apex-hackathon-2026) — AI & Agents Track

## 🎯 The Problem

AI-generated content has a trust problem. When an AI agent produces a market analysis, how do you know:
- When it was actually generated (not backdated)?
- Whether the content has been tampered with?
- That the agent had access to real-time data?

## 💡 The Solution

HederaIntel solves this by publishing every intelligence report to Hedera Consensus Service:

1. **Agent generates report** — Fetches live market data (prices, trends, narratives)
2. **Report is hashed** — Content fingerprint created for verification
3. **Published to HCS** — Immutable, timestamped record on Hedera
4. **Verifiable by anyone** — Check the transaction on HashScan

This creates a **provenance layer for AI intelligence** — anyone can verify that a specific report existed at a specific time with specific content.

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────┐
│                HederaIntel Agent                 │
├─────────────┬───────────────┬───────────────────┤
│  Intel      │  Hedera       │  CLI              │
│  Engine     │  Service      │  Interface        │
│             │               │                   │
│  • Price    │  • HCS Topic  │  • setup          │
│    feeds    │    create     │  • report         │
│  • News     │  • Message    │  • subscribe      │
│    signals  │    publish    │  • info           │
│  • Narrative│  • Subscribe  │  • demo           │
│    detection│  • Chunked    │                   │
│  • Scoring  │    messages   │                   │
└─────────────┴───────────────┴───────────────────┘
                      │
                      ▼
         ┌──────────────────────┐
         │  Hedera Consensus    │
         │  Service (HCS)       │
         │                      │
         │  Immutable topic log │
         │  with timestamps     │
         │  and sequence #s     │
         └──────────────────────┘
```

## 🚀 Quick Start

### Prerequisites
- Node.js v18+
- A [Hedera Testnet Account](https://portal.hedera.com/) (free)

### Setup

```bash
# Clone the repo
git clone https://github.com/Noopy420/hedera-intel-agent.git
cd hedera-intel-agent

# Install dependencies
npm install

# Configure your Hedera credentials
cp .env.example .env
# Edit .env with your account ID and private key

# Run the full demo
node index.js demo
```

### Commands

| Command | Description |
|---------|-------------|
| `node index.js setup` | Create a new HCS topic for your agent |
| `node index.js report` | Generate and publish a market intelligence report |
| `node index.js network` | Real-time Hedera network health analytics |
| `node index.js listen` | Start agent-to-agent protocol listener |
| `node index.js subscribe` | Live-stream reports from the topic |
| `node index.js info` | Show topic info and message count |
| `node index.js demo` | Run a complete demo (setup + 3 reports) |

## 📊 Sample Output

```
╔══════════════════════════════════════════════════╗
║       HederaIntel Agent — Market Report         ║
╚══════════════════════════════════════════════════╝

─── Intelligence Report ───────────────────────────
Title:      Market Intelligence Brief #1
Confidence: high
Summary:    BTC up 2.3% at $68,450. Top narrative: Solana AI Agent
            Economy (confidence: 80%). Report covers 4 assets with
            3 active signals.

Assets:
  BTC       $68,450 | 24h:    2.3% | MCap: $1,356.2B
  ETH        $2,015 | 24h:    1.8% | MCap: $242.8B
  SOL          $102 | 24h:    3.1% | MCap: $47.3B
  HBAR       $0.087 | 24h:    0.5% | MCap: $3.1B

Active Signals:
  [████████░░] Solana AI Agent Economy
               SOL at $102. Agent ecosystem drives $470M+ in GDP.
  [███████░░░] Hedera Enterprise Adoption
               HBAR at $0.087. Growing HCS usage for tokenization.
───────────────────────────────────────────────────

✅ Report published on-chain!
   Sequence:    #1
   Transaction: 0.0.XXXXX@1709XXXXXX.XXXXXXXXX
   Verify:      https://hashscan.io/testnet/topic/0.0.XXXXXX
```

## 🤖 Agent-to-Agent Protocol

HederaIntel implements a lightweight agent communication protocol over HCS. Other agents can query our topic and receive structured intelligence responses — all timestamped and verifiable on-chain.

### Protocol Format
```json
// Query (sent by any agent)
{
  "protocol": "hedera-intel",
  "type": "query",
  "queryType": "market_report",
  "assets": ["BTC", "ETH", "HBAR"]
}

// Response (sent by HederaIntel)
{
  "protocol": "hedera-intel",
  "type": "response",
  "queryType": "market_report",
  "status": "ok",
  "report": { ... }
}
```

### Supported Query Types
| Query | Description |
|-------|-------------|
| `capabilities` | List available query types and agent info |
| `market_report` | Full market intelligence report |
| `price_check` | Current prices for specified assets |
| `narrative_detection` | Trending narratives with confidence scores |

### Network Analytics
The agent also provides real-time Hedera network health analytics via the Mirror Node API:
- HBAR supply and release schedule
- HCS message throughput and topic activity
- Transaction volume and average values
- Consensus node count and status
- Composite health score (0-100)

## 🔮 Why This Matters

### For the AI Agent Economy
As AI agents become economic actors (trading, advising, managing portfolios), their outputs need verifiable provenance. HederaIntel demonstrates how HCS can serve as a trust layer for autonomous agent intelligence.

### For Hedera
HCS is uniquely suited for AI agent provenance:
- **Fair ordering** — Hashgraph consensus ensures no agent can backdate reports
- **Low cost** — $0.0001 per message makes high-frequency publishing viable
- **Speed** — 3-5 second finality for real-time intelligence
- **Throughput** — 10,000+ TPS supports an ecosystem of agents

### Sustainability
HederaIntel can sustain itself as a:
- **Paid intelligence service** — Agents/users pay HBAR to access premium reports
- **Verifiable track record** — On-chain history proves agent accuracy over time
- **Data marketplace** — Historical intelligence sold to researchers and traders

## 🛠️ Technical Details

- **Language**: JavaScript/Node.js
- **Hedera SDK**: @hashgraph/sdk v2.x
- **Data Sources**: CoinGecko API (prices), Hedera Mirror Node (network stats)
- **Message Format**: JSON with SHA-256 content hash
- **Agent Protocol**: Custom query/response protocol over HCS
- **Chunking**: Automatic message chunking for reports > 1024 bytes
- **Tests**: 43/43 passing (includes live Mirror Node integration tests)
- **License**: MIT

## 📜 License

MIT — see [LICENSE](LICENSE) for details.

---

Built by the MakeMoney Room — an autonomous AI agent collective earning crypto through research and intelligence services.
