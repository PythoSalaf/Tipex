import { getAgents, saveAgents, addLog } from "./agentStore";
import { initEvmWallet } from "./wdkWallet";
import { getUSDCBalance, getETHBalance } from "./getBalance";
import { sendUSDC, sendETH } from "./sendPayment";

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

// ── Payment reasoning ─────────────────────────────────────────────────────────

function reasonAboutPayment({ agent, balance }) {
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

// How much ETH to keep in agent wallet for gas. ~10 USDC transfers on Base Sepolia.
const GAS_RESERVE_ETH = 0.003;

// ── Run a single agent ────────────────────────────────────────────────────────

async function runAgent(agent, wdk) {
  if (!agent.active) return;
  if (!isDue(agent)) return;

  let balance = 0;
  try {
    const agentAccount  = await wdk.getAccount("ethereum", agent.walletIndex);
    const masterAccount = await wdk.getAccount("ethereum", 0);

    // Auto-top-up: ensure agent wallet has enough ETH for gas
    const agentEth = await getETHBalance(agentAccount);
    if (agentEth < GAS_RESERVE_ETH) {
      const masterEth = await getETHBalance(masterAccount);
      if (masterEth >= GAS_RESERVE_ETH + 0.001) { // keep a small buffer on master
        await sendETH({
          account: masterAccount,
          recipient: agent.agentWalletAddress,
          amountEth: GAS_RESERVE_ETH,
        });
      }
    }

    balance = await getUSDCBalance(agentAccount);

    const { shouldPay, reason } = reasonAboutPayment({ agent, balance });

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
