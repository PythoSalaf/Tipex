import Anthropic from "@anthropic-ai/sdk";
import { getAgents, saveAgents, addLog } from "./agentStore";
import { initEvmWallet } from "./wdkWallet";
import { getUSDCBalance } from "./getBalance";
import { sendUSDC } from "./sendPayment";

const client = new Anthropic({
  apiKey: import.meta.env.VITE_ANTHROPIC_API_KEY,
  dangerouslyAllowBrowser: true,
});

// ── Schedule helpers ──────────────────────────────────────────────────────────

const MS = {
  "every5min": 5 * 60 * 1000,
  daily: 24 * 60 * 60 * 1000,
  weekly: 7 * 24 * 60 * 60 * 1000,
  monthly: 30 * 24 * 60 * 60 * 1000,
  yearly: 365 * 24 * 60 * 60 * 1000,
};

function isDue(agent) {
  if (!agent.lastRun) return true;
  const elapsed = Date.now() - new Date(agent.lastRun).getTime();
  return elapsed >= (MS[agent.schedule] || MS.monthly);
}

// ── AI reasoning ─────────────────────────────────────────────────────────────

async function reasonAboutPayment({ agent, balance }) {
  const prompt = `You are an autonomous payment agent reasoning engine.

Agent configuration:
- Rule type: ${agent.ruleType}
- Recipient: ${agent.name} (${agent.address})
- Amount: ${agent.amount} USDC
- Schedule: ${agent.schedule}
- Minimum balance required: ${agent.minBal} USDC
- Chain: Base Sepolia testnet
- Last execution: ${agent.lastRun || "never"}

Current state:
- Agent wallet USDC balance: ${balance.toFixed(4)} USDC

Your task: Decide whether to execute this payment RIGHT NOW.

Respond with a JSON object only, no markdown:
{
  "shouldPay": true or false,
  "reason": "one concise sentence explaining your decision"
}`;

  try {
    const response = await client.messages.create({
      model: "claude-haiku-4-5",
      max_tokens: 200,
      messages: [{ role: "user", content: prompt }],
    });

    const text = response.content[0]?.text || "";
    const match = text.match(/\{[\s\S]*\}/);
    if (match) return JSON.parse(match[0]);
  } catch {
    // fallback: simple rule-based decision
  }

  // Fallback logic if AI call fails
  if (balance < agent.minBal) {
    return {
      shouldPay: false,
      reason: `Insufficient balance: ${balance.toFixed(2)} USDC < minimum ${agent.minBal} USDC`,
    };
  }
  if (balance < agent.amount) {
    return {
      shouldPay: false,
      reason: `Balance ${balance.toFixed(2)} USDC is less than payment amount ${agent.amount} USDC`,
    };
  }
  return {
    shouldPay: true,
    reason: `Balance ${balance.toFixed(2)} USDC satisfies minimum ${agent.minBal} USDC requirement`,
  };
}

// ── Run a single agent ────────────────────────────────────────────────────────

async function runAgent(agent, wdk) {
  if (!agent.active) return;
  if (!isDue(agent)) return;

  let balance = 0;
  try {
    const agentAccount = await wdk.getAccount("ethereum", agent.walletIndex);
    balance = await getUSDCBalance(agentAccount);

    const { shouldPay, reason } = await reasonAboutPayment({ agent, balance });

    if (!shouldPay) {
      addLog({
        agentId: agent.id,
        agentName: agent.name,
        status: "skipped",
        amount: agent.amount,
        recipient: agent.name,
        recipientAddress: agent.address,
        chain: agent.chain || "Base",
        balance: balance.toFixed(4),
        reason,
        txHash: null,
      });
      // Still update lastRun so it doesn't retry every tick
      updateAgentLastRun(agent.id);
      return;
    }

    // Execute the payment
    const { txHash } = await sendUSDC({
      account: agentAccount,
      recipient: agent.address,
      amount: agent.amount,
    });

    addLog({
      agentId: agent.id,
      agentName: agent.name,
      status: "success",
      amount: agent.amount,
      recipient: agent.name,
      recipientAddress: agent.address,
      chain: agent.chain || "Base",
      balance: balance.toFixed(4),
      reason,
      txHash,
    });

    updateAgentLastRun(agent.id);
  } catch (err) {
    addLog({
      agentId: agent.id,
      agentName: agent.name,
      status: "error",
      amount: agent.amount,
      recipient: agent.name,
      recipientAddress: agent.address,
      chain: agent.chain || "Base",
      balance: balance.toFixed(4),
      reason: err.message || "Unexpected error during execution",
      txHash: null,
    });
  }
}

function updateAgentLastRun(agentId) {
  const agents = getAgents();
  saveAgents(
    agents.map((a) =>
      a.id === agentId ? { ...a, lastRun: new Date().toISOString() } : a
    )
  );
}

// ── Engine ────────────────────────────────────────────────────────────────────

let engineInterval = null;

export function startAgentEngine() {
  if (engineInterval) return; // already running

  const tick = async () => {
    const seed = localStorage.getItem("seed");
    if (!seed) return;

    const agents = getAgents();
    if (!agents.length) return;

    try {
      const { wdk } = initEvmWallet(seed);
      for (const agent of agents) {
        await runAgent(agent, wdk);
      }
    } catch (err) {
      // Log errors but don't crash the app - agent engine should be resilient
      console.warn("Agent engine tick error:", err.message);
    }
  };

  // Run once immediately, then every 30 seconds
  tick();
  engineInterval = setInterval(tick, 30_000);
}

export function stopAgentEngine() {
  if (engineInterval) {
    clearInterval(engineInterval);
    engineInterval = null;
  }
}
