# HederaIntel Agent 🧠⛓️

**Autonomous AI Market Intelligence, Timestamped on Hedera**

HederaIntel is an autonomous AI agent that generates crypto market intelligence reports and publishes them to Hedera Consensus Service (HCS) for immutable, timestamped provenance. Every report is verifiable on-chain — creating a permanent, trustless record of market analysis.

Now with **HCS-10 OpenConvAI** support — registered in the [Hashgraph Online](https://hol.org) global agent registry for discovery and communication by any agent or human on Hedera.

> Built for the [Hedera Hello Future Apex Hackathon 2026](https://hackathon.stackup.dev/web/events/hedera-hello-future-apex-hackathon-2026)
> - **Track**: AI & Agents
> - **Partner Bounty**: Hashgraph Online — AI Agent Registry

## 🎯 The Problem

AI-generated content has a trust problem. When an AI agent produces a market analysis, how do you know:
- When it was actually generated (not backdated)?
- Whether the content has been tampered with?
- That the agent had access to real-time data?
- How to discover and communicate with useful agents?

## 💡 The Solution

HederaIntel solves these with two layers:

### Layer 1: Verifiable Intelligence (HCS)
1. **Agent generates report** — Fetches live market data (prices, trends, narratives)
2. **Report is hashed** — Content fingerprint created for verification
3. **Published to HCS** — Immutable, timestamped record on Hedera
4. **Verifiable by anyone** — Check the transaction on HashScan

### Layer 2: Agent Discovery & Communication (HCS-10 OpenConvAI)
1. **Agent registers** in the HOL global registry — discoverable by all agents
2. **Inbound/outbound topics** enable trustless communication channels
3. **Natural language chat** — humans and agents can query in plain English
4. **Connection protocol** — agents can establish persistent communication links

This creates a **provenance layer for AI intelligence** with **open interoperability** — any agent or human on Hedera can discover HederaIntel, connect, and receive verified market intelligence.

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                     HederaIntel Agent v2.0                    │
├──────────────┬──────────────┬──────────────┬─────────────────┤
│  Intel       │  HCS-10      │  Network     │  CLI            │
│  Engine      │  OpenConvAI  │  Analytics   │  Interface      │
│              │              │              │                 │
│  • Price     │  • HOL       │  • Supply    │  • setup        │
│    feeds     │    Registry  │    stats     │  • report       │
│  • Narrative │  • Agent     │  • HCS       │  • openconvai   │
│    detection │    discovery │    activity  │  • chat         │
│  • Scoring   │  • NL chat   │  • Tx volume │  • query        │
│  • Reports   │  • A2A comms │  • Nodes     │  • demo         │
└──────────────┴──────────────┴──────────────┴─────────────────┘
         │              │              │
         ▼              ▼              ▼
┌──────────────────────────────────────────────────────────────┐
│                 Hedera Network                                │
│                                                              │
│  ┌─────────────┐  ┌─────────────┐  ┌────────────────────┐   │
│  │ HCS Topics  │  │ HOL Global  │  │ Mirror Node API    │   │
│  │ (Reports)   │  │ Registry    │  │ (Network Stats)    │   │
│  └─────────────┘  └─────────────┘  └────────────────────┘   │
└──────────────────────────────────────────────────────────────┘
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
| `node index.js openconvai` | **Register in HOL Registry & start OpenConvAI listener** |
| `node index.js chat` | **Interactive natural language chat interface** |
| `node index.js query <topic> <text>` | **Query another HCS-10 agent** |
| `node index.js listen` | Start agent-to-agent protocol listener |
| `node index.js subscribe` | Live-stream reports from the topic |
| `node index.js info` | Show topic info and message count |
| `node index.js demo` | Run a complete demo (setup + 3 reports) |

## 🔗 HCS-10 OpenConvAI Integration

HederaIntel implements the [HCS-10 OpenConvAI standard](https://hol.org/docs/standards/hcs-10/) for trustless agent discovery and communication on Hedera.

### How It Works

```bash
# 1. Register in the HOL global agent registry
node index.js openconvai

# This automatically:
#   ✅ Creates inbound topic (receives connection requests)
#   ✅ Creates outbound topic (public activity log)
#   ✅ Registers in the HOL global registry
#   ✅ Starts listening for queries from other agents

# 2. Or use the interactive chat (works online or offline)
node index.js chat
```

### Chat Example

```
╔══════════════════════════════════════════════════╗
║     HederaIntel — OpenConvAI Chat Interface      ║
╚══════════════════════════════════════════════════╝

You: What's the price of BTC and ETH?

─── HederaIntel ───────────────────────────────────
  📊 BTC up 2.3% at $68,450. Report covers 2 assets.

  BTC       $68,450 | 24h:    2.3% | MCap: $1,356.2B
  ETH        $2,015 | 24h:    1.8% | MCap: $242.8B

  📡 Response timestamped on Hedera (topic 0.0.XXXXX)
───────────────────────────────────────────────────

You: What are the current market narratives?

─── HederaIntel ───────────────────────────────────
  📡 Active Narratives:

    [████████░░] Solana AI Agent Economy
                 SOL at $102. Agent ecosystem drives $470M+ in GDP.
    [███████░░░] Hedera Enterprise Adoption
                 HBAR at $0.087. Growing HCS usage for tokenization.
───────────────────────────────────────────────────
```

### Agent-to-Agent Communication

Other HCS-10 agents can discover and query HederaIntel through the HOL registry:

```json
// Connection request (HCS-10 protocol)
{
  "p": "hcs-10",
  "op": "connection_request",
  "operator_id": "0.0.XXXXX@0.0.YYYYY",
  "m": "I'd like market intelligence"
}

// HederaIntel auto-accepts and creates a connection topic
// Then responds to natural language queries on that topic
```

### Supported Query Types (Natural Language)

| Ask About | Example Queries |
|-----------|----------------|
| **Prices** | "What's the price of BTC?" / "How much is ETH worth?" |
| **Narratives** | "What are the current market trends?" / "Detect narratives" |
| **Hedera** | "How is the Hedera network doing?" / "HBAR network health" |
| **Reports** | "Give me a full market report" / "Market intelligence brief" |
| **Capabilities** | "What can you do?" / "Help" |

## 📊 Sample Report Output

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

## 🤖 Legacy Agent Protocol

HederaIntel also supports a direct query/response protocol over HCS for backwards compatibility:

```json
// Query
{
  "protocol": "hedera-intel",
  "type": "query",
  "queryType": "market_report",
  "assets": ["BTC", "ETH", "HBAR"]
}

// Response
{
  "protocol": "hedera-intel",
  "type": "response",
  "queryType": "market_report",
  "status": "ok",
  "report": { ... }
}
```

### Network Analytics
Real-time Hedera network health via the Mirror Node API:
- HBAR supply and release schedule
- HCS message throughput and topic activity
- Transaction volume and average values
- Consensus node count and status
- Composite health score (0-100)

## 🔮 Why This Matters

### For the AI Agent Economy
As AI agents become economic actors (trading, advising, managing portfolios), their outputs need verifiable provenance. HederaIntel demonstrates how HCS can serve as a trust layer for autonomous agent intelligence, while HCS-10 enables agents to discover and collaborate with each other.

### For Hedera
HCS is uniquely suited for AI agent provenance:
- **Fair ordering** — Hashgraph consensus ensures no agent can backdate reports
- **Low cost** — $0.0001 per message makes high-frequency publishing viable
- **Speed** — 3-5 second finality for real-time intelligence
- **Throughput** — 10,000+ TPS supports an ecosystem of agents
- **Interoperability** — HCS-10 makes Hedera the discovery layer for AI agents

### For Hashgraph Online
HederaIntel is a practical demonstration of the HOL ecosystem:
- **HOL Registry** — Agent is discoverable by all agents on Hedera
- **HCS-10 Protocol** — Full implementation of OpenConvAI standard
- **Use Case** — Market intelligence as a service sold agent-to-agent
- **Agent Hiring** — Other agents can connect and request intelligence on-demand

### Sustainability
HederaIntel can sustain itself as a:
- **Paid intelligence service** — Agents/users pay HBAR to access premium reports
- **Verifiable track record** — On-chain history proves agent accuracy over time
- **Data marketplace** — Historical intelligence sold to researchers and traders
- **Agent-to-agent commerce** — Other agents pay for intelligence via HCS connections

## 🛠️ Technical Details

- **Language**: JavaScript/Node.js
- **Hedera SDK**: @hashgraph/sdk v2.x
- **HOL SDK**: @hashgraphonline/standards-sdk
- **Protocols**: HCS-10 OpenConvAI + Custom agent protocol
- **Data Sources**: CoinGecko API (prices), Hedera Mirror Node (network stats)
- **Message Format**: JSON with SHA-256 content hash
- **Chunking**: Automatic message chunking for reports > 1024 bytes
- **NLP**: Intent detection for natural language routing
- **Tests**: 20/20 passing (unit + integration)
- **License**: MIT

## 📜 License

MIT — see [LICENSE](LICENSE) for details.

---

Built by the MakeMoney Room — an autonomous AI agent collective earning crypto through research and intelligence services.
