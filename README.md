# Tipex — Autonomous Stablecoin Payment Agents

> Powered by [Tether WDK](https://docs.wdk.tether.io) · [Glove](https://glove.so) · Base Sepolia

Tipex lets you create AI agents that autonomously execute stablecoin payments on-chain — salaries, subscriptions, gifts, and conditional transfers — without any manual intervention. You set the rule once; the agent reasons, decides, and pays.

---

## What It Does

Each **payment agent** in Tipex is an autonomous on-chain actor:

1. **Holds its own self-custodial wallet** — derived via WDK from your master seed phrase. Each agent gets a dedicated EVM wallet at a unique deterministic index.
2. **Runs on a schedule** — every 5 minutes (for testing), daily, weekly, monthly, or yearly.
3. **Reasons with AI before paying** — before executing, the agent calls a language model that evaluates the current balance, minimum reserve requirements, and the payment rule. It returns `shouldPay: true/false` with a written reason.
4. **Executes or skips autonomously** — if conditions are met, `account.transfer()` fires the USDC transaction on-chain. If not, the agent logs why it skipped and records `lastRun`.
5. **Logs everything** — every decision (success, skip, error) is recorded with txHash, balance snapshot, and AI reasoning text.

---

## How WDK Is Used

WDK is the **core infrastructure** for all wallet and transaction operations. No third-party wallet service, no custodian — keys never leave the browser.

```
@tetherto/wdk            — core orchestrator, seed phrase management
@tetherto/wdk-wallet-evm — EVM wallet module (Base Sepolia)
```

### Wallet initialization

```js
// src/lib/wdk.js
import WDK from "@tetherto/wdk";

const wdk = new WDK(seedPhrase);
const wdkWithWallet = wdk.registerWallet("ethereum", WalletManagerEvm, {
  provider: "https://sepolia.base.org",
});
```

### Per-agent wallet derivation (one wallet per agent)

```js
// Each agent gets a deterministic wallet by index — no collisions, no shared keys
const agentAccount = await wdk.getAccount("ethereum", agent.walletIndex);
const agentAddress  = await agentAccount.getAddress();
```

### Balance checking

```js
// src/lib/getBalance.js
const usdcBalance = await agentAccount.getTokenBalance(USDC_CONTRACT); // token balance
const ethBalance  = await agentAccount.getBalance();                   // gas balance
```

### Autonomous payment execution

```js
// src/lib/sendPayment.js
const result = await agentAccount.transfer({
  token:     "0x036CbD53842c5426634e7929541eC2318f3dCF7e", // USDC on Base Sepolia
  recipient: agent.address,
  amount:    rawAmount,  // 6-decimal bigint
});
// result.hash — on-chain tx hash, logged and linkable on Basescan
```

---

## Architecture

```
┌──────────────────────────────────────────────────────────┐
│                      Browser (React)                      │
│                                                           │
│  ┌────────────────────┐   ┌───────────────────────────┐  │
│  │   Tipex AI Chat    │   │      Agent Engine         │  │
│  │  (Glove + Groq)    │   │    (30-second tick)       │  │
│  │                    │   │                           │  │
│  │  14 natural-lang   │   │  for each active agent:   │  │
│  │  tools to manage   │   │  1. isDue(schedule)?      │  │
│  │  agents via chat   │   │  2. getUSDCBalance()      │  │
│  └────────┬───────────┘   │  3. AI: shouldPay?        │  │
│           │               │  4. account.transfer()    │  │
│           │               │  5. addLog(result)        │  │
│           │               └────────────┬──────────────┘  │
│           │                            │                  │
│  ┌────────▼────────────────────────────▼──────────────┐  │
│  │                    WDK Layer                        │  │
│  │       @tetherto/wdk + @tetherto/wdk-wallet-evm      │  │
│  │                                                     │  │
│  │  Master wallet  (index 0) — user's main wallet     │  │
│  │  Agent wallet   (index 1) — e.g. "Salary → Ken"   │  │
│  │  Agent wallet   (index 2) — e.g. "Rent → Alice"   │  │
│  │  Agent wallet   (index N) — unlimited agents       │  │
│  └─────────────────────────┬───────────────────────────┘  │
└─────────────────────────────┼────────────────────────────┘
                              │
                     Base Sepolia Testnet
                     USDC: 0x036CbD53842c5426634e7929541eC2318f3dCF7e
```

### Key files

| File | Purpose |
|------|---------|
| `src/lib/wdk.js` | WDK initialization with seed phrase |
| `src/lib/wdkWallet.js` | EVM wallet module registration |
| `src/lib/sendPayment.js` | `account.transfer()` wrapper |
| `src/lib/getBalance.js` | `getTokenBalance()` + `getBalance()` |
| `src/lib/agentEngine.js` | Autonomous tick loop + AI reasoning |
| `src/lib/agentStore.js` | Agent + log persistence (localStorage) |
| `src/lib/gloveClient.jsx` | AI chat client with 14 tools |
| `src/pages/CreatePaymentAgent.jsx` | Conversational agent creation UI |
| `src/pages/Dashboard.jsx` | Agent management dashboard |
| `src/pages/LogPage.jsx` | Payment history + audit trail |

---

## Agent Engine: How Autonomy Works

```js
// src/lib/agentEngine.js — ticks every 30 seconds in the background

async function runAgent(agent, wdk) {
  if (!agent.active) return;
  if (!isDue(agent)) return;           // checks elapsed time vs. schedule

  const agentAccount = await wdk.getAccount("ethereum", agent.walletIndex);
  const balance = await getUSDCBalance(agentAccount);

  // AI decides whether to pay — evaluates balance, minimum reserves, rule type
  const { shouldPay, reason } = await reasonAboutPayment({ agent, balance });

  if (shouldPay) {
    const { txHash } = await sendUSDC({ account: agentAccount, recipient: agent.address, amount: agent.amount });
    addLog({ status: "success", txHash, reason, balance, ... });
  } else {
    addLog({ status: "skipped", reason, balance, ... });
  }

  updateAgentLastRun(agent.id);
}
```

Supported schedules: `every5min` · `daily` · `weekly` · `monthly` · `yearly`

The AI reasoning uses `claude-haiku-4-5` and returns a JSON decision:
```json
{ "shouldPay": true, "reason": "Balance 12.5 USDC satisfies minimum 5 USDC requirement." }
```
If the AI call fails, a deterministic fallback (balance vs. minBal check) ensures the engine never crashes.

---

## Tipex AI — Conversational Agent Management

The chat interface (Glove + Groq `llama-3.3-70b-versatile`) exposes **14 tools** for managing agents via natural language:

| Tool | What it does |
|------|-------------|
| `create_agent_wallet` | Derives a new WDK wallet and saves the agent |
| `list_agents` | Shows all agents with name, status, schedule |
| `check_balance` | USDC + ETH balance for any agent wallet |
| `agent_status` | Health report — balance, next run, active state |
| `pause_agent` | Suspends autonomous execution |
| `resume_agent` | Resumes a paused agent |
| `edit_agent` | Update amount or schedule inline |
| `delete_agent` | Remove agent with confirmation UI |
| `check_logs` | Full payment history with AI reasoning |
| `next_payment` | Countdown to next scheduled execution |
| `choose_payment_type` | Guides payment type selection |
| `collect_recipient_info` | Recipient name + wallet address form |
| `collect_payment_details` | Amount, schedule, minimum balance form |
| `review_and_confirm` | Full plan summary before wallet creation |

Example commands:
```
"Create a salary agent that pays Ken 500 USDC monthly, min balance 1000"
"Check my agent balances"
"Pause the subscription agent"
"Show me the last 5 payments"
"When is the next scheduled payment?"
"Edit Ken's agent to pay weekly instead"
```

---

## Getting Started

### Prerequisites
- Node.js 18+
- A Groq API key — free at [console.groq.com](https://console.groq.com)

### Install

```bash
git clone https://github.com/PythoSalaf/Tipex.git
cd Tipex
npm install
```

### Environment

Create `.env`:
```env
VITE_GROQ_API_KEY=your_groq_api_key_here
```

For Vercel production, add `GROQ_API_KEY` as an environment variable in the dashboard — the serverless proxy at `api/chat.js` uses it server-side.

### Run

```bash
npm run dev
# → http://localhost:5173
```

---

## Testing the Autonomous Agent

The fastest demo path using the `every5min` schedule:

**Step 1 — Connect wallet**
Click "Connect Wallet" in the navbar. Save the seed phrase shown in the modal.

**Step 2 — Create a test agent**
Go to **Create Agent** and type:
> "Create a salary agent that pays 0.5 USDC to `0xYourTestAddress` every 5 minutes, minimum balance 0.1 USDC"

The AI will walk you through confirmation and derive a dedicated WDK wallet for the agent.

**Step 3 — Fund the agent wallet**
Copy the agent wallet address from the "Agent Created" card.

Get testnet funds:
| What | Faucet |
|------|--------|
| ETH (gas) | [alchemy.com/faucets/base-sepolia](https://www.alchemy.com/faucets/base-sepolia) |
| USDC | [faucet.circle.com](https://faucet.circle.com) — select Base Sepolia |

Send at least **0.5 USDC + a small amount of ETH** to the agent wallet address.

**Step 4 — Watch it fire**
The engine ticks every 30 seconds and checks `isDue()`. Within 5 minutes the agent will:
1. Check its USDC balance via `getTokenBalance()`
2. Ask the AI: should I pay?
3. Call `account.transfer()` to send USDC on-chain
4. Log the result with txHash

**Step 5 — View results**
- Go to **Logs** to see the AI's decision + txHash
- Click the txHash to open it on [Basescan](https://sepolia.basescan.org)
- Or ask the AI: `"show me the payment logs"`

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Wallet infrastructure | [Tether WDK](https://docs.wdk.tether.io) — `@tetherto/wdk`, `@tetherto/wdk-wallet-evm` |
| AI chat framework | [Glove](https://glove.so) — `glove-react` |
| LLM (chat + tools) | Groq `llama-3.3-70b-versatile` → fallback `llama-3.1-8b-instant` |
| LLM (payment reasoning) | Anthropic `claude-haiku-4-5` |
| Chain | Base Sepolia testnet (chain ID 84532) |
| Token | USDC `0x036CbD53842c5426634e7929541eC2318f3dCF7e` |
| Frontend | React 19 · Vite · Tailwind CSS v4 · Framer Motion |
| Deployment | Vercel |

---

## Live Demo

[tipex.vercel.app](https://tipex.vercel.app)

