import { useState } from "react";
import { GloveClient, defineTool, createRemoteModel, MemoryStore } from "glove-react";
import { z } from "zod";
import { getAgents, saveAgents, getLogs } from "./agentStore";
import { initEvmWallet } from "./wdkWallet";
import { getUSDCBalance, getETHBalance } from "./getBalance";
import { sendUSDC, sendETH } from "./sendPayment";
import { EXPLORER_TX } from "./constants";

// ── Agent Created card with inline funding ────────────────────────────────────
function AgentCreatedCard({ data: d }) {
  const [amount, setAmount]     = useState("");
  const [funding, setFunding]   = useState(false);
  const [txHash, setTxHash]     = useState(null);
  const [fundErr, setFundErr]   = useState("");
  const [copied, setCopied]     = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(d.agentWalletAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const GAS_RESERVE_ETH = 0.003; // enough for ~10+ USDC transfers on Base Sepolia

  const handleFund = async () => {
    const amt = parseFloat(amount);
    if (!amt || amt <= 0) return;
    setFunding(true);
    setFundErr("");
    try {
      const seed = localStorage.getItem("seed");
      if (!seed) throw new Error("Wallet not connected");
      const { wdk } = initEvmWallet(seed);
      const masterAccount = await wdk.getAccount("ethereum", 0);
      const agentAccount  = await wdk.getAccount("ethereum", d.walletIndex);

      // Check agent ETH balance; top up from master if below threshold
      const agentEth = await getETHBalance(agentAccount);
      if (agentEth < GAS_RESERVE_ETH) {
        await sendETH({
          account: masterAccount,
          recipient: d.agentWalletAddress,
          amountEth: GAS_RESERVE_ETH,
        });
      }

      // Send USDC to agent wallet
      const { txHash: hash } = await sendUSDC({
        account: masterAccount,
        recipient: d.agentWalletAddress,
        amount: amt,
      });
      setTxHash(hash);
      setAmount("");
    } catch (err) {
      const msg = err.message || "";
      if (msg.includes("INSUFFICIENT_FUNDS") || msg.includes("insufficient funds for intrinsic")) {
        setFundErr("no_gas");
      } else {
        setFundErr(msg || "Transfer failed");
      }
    } finally {
      setFunding(false);
    }
  };

  return (
    <div className="bg-[#0a1f1a] border border-[#1ee3bf]/30 rounded-2xl p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-lg bg-[#1ee3bf]/10 flex items-center justify-center text-base">🤖</div>
        <div>
          <p className="text-white text-sm font-semibold">Agent Created!</p>
          <p className="text-[#687e8e] text-xs capitalize">{d.ruleType} · {d.amount} USDC · {d.schedule}</p>
        </div>
      </div>

      {/* Wallet address */}
      <div className="bg-[#0d1117] border border-[#1e2a35] rounded-xl p-3">
        <p className="text-[#687e8e] text-xs mb-1.5">Agent Wallet</p>
        <div className="flex items-center gap-2">
          <p className="text-white text-xs font-mono break-all flex-1">{d.agentWalletAddress}</p>
          <button onClick={copy} className="text-[#687e8e] hover:text-[#1ee3bf] transition-colors shrink-0 text-xs">
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      </div>

      {/* Fund agent section */}
      {txHash ? (
        <div className="bg-[#0d1117] border border-[#1ee3bf]/20 rounded-xl p-3 space-y-1.5">
          <p className="text-[#1ee3bf] text-xs font-semibold">✓ Agent funded!</p>
          <a
            href={`${EXPLORER_TX}/${txHash}`}
            target="_blank"
            rel="noreferrer"
            className="text-[#687e8e] hover:text-[#1ee3bf] text-xs font-mono truncate block transition-colors"
          >
            {txHash.slice(0, 20)}…{txHash.slice(-6)} ↗
          </a>
        </div>
      ) : (
        <div className="bg-[#0d1117] border border-[#1e2a35] rounded-xl p-3 space-y-2">
          <p className="text-[#687e8e] text-xs">Fund agent wallet with USDC — gas ETH included automatically</p>
          <div className="flex gap-2">
            <div className="flex-1 flex items-center bg-[#0a0f15] border border-[#1e2a35] rounded-lg px-3 focus-within:border-[#1ee3bf]/40 transition-colors">
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={`e.g. ${d.amount * 5}`}
                className="flex-1 bg-transparent text-white text-sm outline-none py-2 min-w-0"
              />
              <span className="text-[#3a4a5a] text-xs ml-1 shrink-0">USDC</span>
            </div>
            <button
              onClick={handleFund}
              disabled={funding || !amount}
              className="px-4 py-2 bg-[#1ee3bf] text-black text-xs font-semibold rounded-lg hover:bg-[#17c9aa] disabled:opacity-40 disabled:cursor-not-allowed transition-colors shrink-0"
            >
              {funding ? "Sending…" : "Fund"}
            </button>
          </div>
          {fundErr === "no_gas" ? (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-2.5 space-y-1.5">
              <p className="text-yellow-400 text-xs font-semibold">⚠ No ETH for gas on Base Sepolia</p>
              <p className="text-yellow-400/80 text-xs">
                USDC transfers need ETH to pay gas fees. Your Base Sepolia ETH balance is 0.
              </p>
              <a
                href="https://www.alchemy.com/faucets/base-sepolia"
                target="_blank"
                rel="noreferrer"
                className="block text-xs text-yellow-400 underline hover:text-yellow-300"
              >
                Get free Base Sepolia ETH → alchemy.com/faucets/base-sepolia
              </a>
            </div>
          ) : fundErr ? (
            <p className="text-red-400 text-xs">{fundErr}</p>
          ) : null}
          <p className="text-[#2a3a4a] text-xs">0.003 ETH for gas is included automatically with the USDC transfer</p>
        </div>
      )}

      <a
        href={`https://sepolia.basescan.org/address/${d.agentWalletAddress}`}
        target="_blank"
        rel="noreferrer"
        className="block text-center text-xs text-[#687e8e] hover:text-[#1ee3bf] transition-colors"
      >
        View on Basescan ↗
      </a>

      {/* Follow-up chips */}
      {txHash && (
        <div className="pt-1 space-y-1.5">
          <p className="text-[#3a4a5a] text-[10px] text-center">What would you like to do next?</p>
          <div className="flex flex-wrap gap-2 justify-center">
            {[
              { label: "Check balance",    msg: `check balance of ${d.name}` },
              { label: "Show all agents",  msg: "show me my agents" },
              { label: "Create another",   msg: "I want to create a new payment agent" },
            ].map((chip) => (
              <button
                key={chip.label}
                onClick={() => dispatchChatMessage(chip.msg)}
                className="px-3 py-1 text-xs rounded-xl border border-[#1e2a35] text-[#687e8e] hover:border-[#1ee3bf]/40 hover:text-white transition-all"
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Groq (fetch-based, browser-safe) ─────────────────────────────────────────
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;

// Model waterfall — primary for quality, fallback has a separate daily quota
const GROQ_MODELS = [
  "llama-3.3-70b-versatile", // primary — best reasoning
  "llama-3.1-8b-instant",    // fallback — separate daily quota, much faster
];
let activeModelIndex = 0;

async function groqChatWithModel(model, messages, tools) {
  const body = { model, messages, max_tokens: 800, stream: false };
  if (tools?.length) { body.tools = tools; body.tool_choice = "auto"; }
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${GROQ_API_KEY}` },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const errText = await res.text();
    // Parse wait time — if it's a short TPM limit (< 60s), retry same model
    if (res.status === 429) {
      const secMatch = errText.match(/try again in ([\d.]+)s/i);
      const minMatch = errText.match(/try again in (\d+)m([\d.]+)s/i);
      const waitSec = minMatch
        ? parseInt(minMatch[1]) * 60 + parseFloat(minMatch[2])
        : secMatch ? parseFloat(secMatch[1]) : 999;
      if (waitSec < 60) {
        // Short TPM wait — retry after delay
        await new Promise((r) => setTimeout(r, Math.ceil(waitSec * 1000) + 300));
        return groqChatWithModel(model, messages, tools);
      }
      // Long TPD/daily limit — signal caller to try next model
      throw Object.assign(new Error("RATE_LIMIT_DAILY"), { isDaily: true });
    }
    // Groq rejects native function-call format with 400 tool_use_failed.
    // Rescue by parsing the failed_generation field ourselves.
    if (res.status === 400) {
      try {
        const errJson = JSON.parse(errText);
        const failedGen = errJson?.error?.failed_generation;
        if (failedGen && errJson?.error?.code === "tool_use_failed") {
          const nativeCalls = parseLlamaFunctionCalls(failedGen);
          if (nativeCalls.length > 0) {
            return {
              choices: [{
                message: {
                  role: "assistant",
                  content: null,
                  tool_calls: nativeCalls,
                },
              }],
              usage: {},
            };
          }
        }
      } catch { /* fall through to generic error */ }
    }
    throw new Error(`Groq ${res.status}: ${errText}`);
  }
  return res.json();
}

// Fired when the active model changes — UI can subscribe via onModelSwitch
let modelSwitchCallback = null;
export function onModelSwitch(cb) { modelSwitchCallback = cb; }

// Bridge: tool renders can dispatch messages back to the chat via CustomEvent
export function dispatchChatMessage(text) {
  window.dispatchEvent(new CustomEvent("tipex:sendmsg", { detail: { text } }));
}

async function groqChat(messages, tools) {
  for (let i = activeModelIndex; i < GROQ_MODELS.length; i++) {
    try {
      const data = await groqChatWithModel(GROQ_MODELS[i], messages, tools);
      if (i !== activeModelIndex) {
        activeModelIndex = i;
        modelSwitchCallback?.(GROQ_MODELS[i]);
      }

      // Fallback: parse Llama native <function=name({...})> format from text
      const msg = data.choices?.[0]?.message;
      if (msg && !msg.tool_calls?.length && msg.content) {
        const nativeCalls = parseLlamaFunctionCalls(msg.content);
        if (nativeCalls.length > 0) {
          msg.tool_calls = nativeCalls;
          msg.content = stripLlamaFunctionCalls(msg.content) || null;
        }
      }
      // If the model produced both text AND tool calls (reasoning leak), clear the text
      if (msg?.tool_calls?.length && msg.content) {
        msg.content = null;
      }

      return data;
    } catch (err) {
      if (err.isDaily && i + 1 < GROQ_MODELS.length) {
        activeModelIndex = i + 1;
        modelSwitchCallback?.(GROQ_MODELS[i + 1]);
        continue;
      }
      throw err;
    }
  }
  throw new Error("All Groq models have hit their daily limit. Please try again tomorrow or add a billing method at console.groq.com");
}

// Parse Llama's native function call formats:
//   <function=name({"key":"val"})>         — paren-style with args
//   <function=name()>  /  <function=name/> — paren/self-closing, no args
//   <function=name>{"key":"val"}</function> — body-style, named close
//   <function=name>{"key":"val"}<function>  — body-style, bare close (actual Groq output)
// Only the FIRST call is extracted — the model must call one tool per turn.
function parseLlamaFunctionCalls(text) {
  const calls = [];

  // Format 1: <function=name(args?)>  or  <function=name/>  (self-contained, ends with >)
  const parenRegex = /<function=(\w+)(?:\(([^]*?)\)|\/?)>/g;
  // Format 2: <function=name>args?</function>  OR  <function=name>args?<function>
  const bodyRegex = /<function=(\w+)>([^]*?)(?:<\/function>|<function>)/g;
  // Format 3: <function=name(args?)></function>  (paren-style with explicit closing tag — actual Groq output)
  const parenCloseRegex = /<function=(\w+)\(([^]*?)\)<\/function>/g;

  const seen = new Set();
  for (const regex of [parenCloseRegex, parenRegex, bodyRegex]) {
    let match;
    while ((match = regex.exec(text)) !== null) {
      if (seen.has(match.index)) continue;
      seen.add(match.index);
      let args = {};
      const raw = match[2]?.trim();
      if (raw && raw !== "{}") {
        try { args = JSON.parse(raw); } catch { /* leave empty */ }
      }
      calls.push({
        id: `tool_${Date.now()}_${calls.length}`,
        type: "function",
        function: { name: match[1], arguments: JSON.stringify(args) },
      });
    }
  }

  // Return only the first call — sequential tool use must happen across turns
  return calls.slice(0, 1);
}

// Strip all Llama function-call syntax from text (all known formats)
function stripLlamaFunctionCalls(text) {
  return text
    .replace(/<function=\w+\([^]*?\)<\/function>/g, "")               // paren + explicit close
    .replace(/<function=\w+>[^]*?(?:<\/function>|<function>)/g, "")  // body-style
    .replace(/<function=\w+(?:\([^]*?\)|\/?)>/g, "")                  // paren/self-closing
    .replace(/<\/?function>/g, "")                                     // stray tags
    .replace(/\{\}\s*$/m, "")                                          // trailing {} artifact
    .trim();
}

// ── Message format converters ─────────────────────────────────────────────────

function gloveMessagesToOpenAI(messages) {
  const result = [];
  for (const msg of messages) {
    if (msg.is_compaction) {
      result.push({ role: "assistant", content: msg.text || "" });
      continue;
    }
    if (msg.sender === "user") {
      if (msg.tool_results?.length > 0) {
        for (const tr of msg.tool_results) {
          const toolContent =
            tr.result.status === "error"
              ? `Error: ${tr.result.message || "Unknown error"}`
              : typeof tr.result.data === "string"
              ? tr.result.data
              : JSON.stringify(tr.result.data);
          result.push({
            role: "tool",
            tool_call_id: tr.id || tr.tool_name,
            content: toolContent,
          });
        }
      } else {
        result.push({ role: "user", content: msg.text || "" });
      }
    } else {
      // agent
      const assistantMsg = { role: "assistant", content: msg.text || null };
      if (msg.tool_calls?.length > 0) {
        assistantMsg.tool_calls = msg.tool_calls.map((tc) => ({
          id: tc.id || tc.tool_name,
          type: "function",
          function: {
            name: tc.tool_name,
            arguments: JSON.stringify(tc.input_args ?? {}),
          },
        }));
      }
      result.push(assistantMsg);
    }
  }
  return result;
}

function gloveToolsToOpenAI(tools) {
  return tools.map((t) => ({
    type: "function",
    function: {
      name: t.name,
      description: t.description,
      parameters: t.parameters,
    },
  }));
}

// ── Custom Groq model adapter ─────────────────────────────────────────────────
const tipexModel = createRemoteModel(GROQ_MODELS[0], {
  async *promptStream(request, signal) {
    const messages = [
      { role: "system", content: request.systemPrompt },
      ...gloveMessagesToOpenAI(request.messages),
    ];

    const openAITools = request.tools?.length
      ? gloveToolsToOpenAI(request.tools)
      : undefined;

    // Use non-streaming for reliability with tool use
    const response = await groqChat(messages, openAITools);

    if (signal?.aborted) return;

    const msg = response.choices?.[0]?.message;
    let fullText = "";
    const toolCalls = [];

    // Only show text when the model is NOT also calling a tool (suppress reasoning leaks)
    if (msg?.content && !msg?.tool_calls?.length) {
      fullText = msg.content;
      yield { type: "text_delta", text: msg.content };
    }

    if (msg?.tool_calls?.length) {
      for (const tc of msg.tool_calls) {
        let input = {};
        try { input = JSON.parse(tc.function.arguments); } catch { /* leave empty */ }
        const tcObj = { id: tc.id, name: tc.function.name, input };
        toolCalls.push(tcObj);
        yield { type: "tool_use", id: tcObj.id, name: tcObj.name, input: tcObj.input };
      }
    }

    yield {
      type: "done",
      message: {
        sender: "agent",
        text: fullText,
        tool_calls: toolCalls.map((tc) => ({
          tool_name: tc.name,
          input_args: tc.input,
          id: tc.id,
        })),
      },
      tokens_in: response.usage?.prompt_tokens ?? 0,
      tokens_out: response.usage?.completion_tokens ?? 0,
    };
  },
});

// ── Shared utilities ─────────────────────────────────────────────────────────

const SCHEDULE_MS = {
  "every5min": 300_000,
  daily: 86_400_000,
  weekly: 604_800_000,
  monthly: 2_592_000_000,
  yearly: 31_536_000_000,
};

function computeNextRun(agent) {
  if (!agent.active) return null;
  const interval = SCHEDULE_MS[agent.schedule] || SCHEDULE_MS.monthly;
  const last = agent.lastRun ? new Date(agent.lastRun).getTime() : 0;
  return new Date(last + interval);
}

function formatCountdown(date) {
  if (!date) return "Paused";
  const diff = date.getTime() - Date.now();
  if (diff <= 0) return "Overdue";
  const secs = Math.floor(diff / 1_000);
  if (secs < 60) return `in ${secs}s`;
  const mins = Math.floor(diff / 60_000);
  if (mins < 60) return `in ${mins}m`;
  const hrs = Math.floor(diff / 3_600_000);
  if (hrs < 24) return `in ${hrs}h`;
  const days = Math.floor(diff / 86_400_000);
  return `in ${days}d`;
}

async function resolveAgent(nameInput) {
  const agents = getAgents();
  const lower = nameInput?.toLowerCase() || "";
  const agent = agents.find(
    (a) =>
      a.name?.toLowerCase() === lower ||
      a.name?.toLowerCase().includes(lower)
  );
  if (!agent) throw new Error(`No agent found matching "${nameInput}". Available: ${agents.map((a) => a.name).join(", ") || "none"}`);
  return { agent, agents };
}

async function resolveAgentWithAccount(nameInput) {
  const { agent, agents } = await resolveAgent(nameInput);
  const seed = localStorage.getItem("seed");
  if (!seed) throw new Error("No wallet connected. Please connect your wallet first.");
  const { wdk } = initEvmWallet(seed);
  const account = await wdk.getAccount("ethereum", agent.walletIndex);
  return { agent, agents, account };
}

// ── Shared UI helpers ─────────────────────────────────────────────────────────

// Progress stepper shown at the top of each agent-creation tool
function StepBar({ step, total, label }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <div className="flex gap-1">
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            className={`h-1 rounded-full transition-all ${
              i < step ? "w-6 bg-[#1ee3bf]" : i === step - 1 ? "w-6 bg-[#1ee3bf]" : "w-3 bg-[#1e2a35]"
            }`}
          />
        ))}
      </div>
      <span className="text-[#687e8e] text-[10px]">Step {step} of {total} — {label}</span>
    </div>
  );
}

// ── Tool definitions ──────────────────────────────────────────────────────────

// 1. Choose payment type
const choosePaymentTypeTool = defineTool({
  name: "choose_payment_type",
  description:
    "Show the user a selection of payment agent types so they can pick one. Call this first.",
  inputSchema: z.object({
    question: z.string().describe("Question to ask the user"),
  }),
  displayPropsSchema: z.object({
    question: z.string(),
  }),
  resolveSchema: z.string(),
  displayStrategy: "hide-on-complete",
  async do(input, display) {
    const selected = await display.pushAndWait(input);
    return {
      status: "success",
      data: `User chose payment type: ${selected}`,
      renderData: { question: input.question, selected },
    };
  },
  render({ props, resolve }) {
    const options = [
      { value: "salary", label: "💼 Salary", desc: "Recurring pay to employees or contractors" },
      { value: "gift", label: "🎁 Gift", desc: "One-time or recurring gifts to someone" },
      { value: "subscription", label: "🔄 Subscription", desc: "Regular service or platform payments" },
      { value: "conditional", label: "⚡ Conditional", desc: "Transfers triggered by balance rules" },
    ];
    return (
      <div className="space-y-2">
        <StepBar step={1} total={4} label="Payment Type" />
        <p className="text-white text-sm font-medium mb-3">{props.question}</p>
        {options.map((o) => (
          <button
            key={o.value}
            onClick={() => resolve(o.value)}
            className="w-full text-left px-4 py-3 rounded-xl bg-[#0d1117] border border-[#1e2a35] hover:border-[#1ee3bf]/50 hover:bg-[#0a1f1a] transition-all group"
          >
            <p className="text-white text-sm font-semibold">{o.label}</p>
            <p className="text-[#687e8e] text-xs mt-0.5 group-hover:text-[#9acfbe]">{o.desc}</p>
          </button>
        ))}
      </div>
    );
  },
  renderResult({ data }) {
    const { selected } = data;
    const labels = { salary: "💼 Salary", gift: "🎁 Gift", subscription: "🔄 Subscription", conditional: "⚡ Conditional" };
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#0a1f1a] border border-[#1ee3bf]/30 rounded-xl text-sm text-[#1ee3bf]">
        {labels[selected] || selected}
      </div>
    );
  },
});

// 2. Collect recipient info
const collectRecipientTool = defineTool({
  name: "collect_recipient_info",
  description:
    "Show a form to collect the recipient name and their EVM wallet address.",
  inputSchema: z.object({
    instruction: z.string().describe("Brief instruction shown above the form"),
  }),
  displayPropsSchema: z.object({ instruction: z.string() }),
  resolveSchema: z.object({
    name: z.string(),
    address: z.string(),
  }),
  displayStrategy: "hide-on-complete",
  async do(input, display) {
    const { name, address } = await display.pushAndWait(input);
    return {
      status: "success",
      data: `Recipient: ${name}, Address: ${address}`,
      renderData: { name, address },
    };
  },
  render({ props, resolve }) {
    function RecipientForm() {
      const [name, setName]       = useState("");
      const [address, setAddress] = useState("");

      const addrValid   = address.startsWith("0x") && address.length === 42;
      const addrTouched = address.length > 0;
      const canSubmit   = name.trim() && addrValid;

      return (
        <div className="space-y-3">
          <StepBar step={2} total={4} label="Recipient" />
          <p className="text-white text-sm font-medium">{props.instruction}</p>
          <div className="space-y-2">
            <div className="bg-[#0a0f15] border border-[#1e2a35] rounded-xl px-3 py-2.5 focus-within:border-[#1ee3bf]/40 transition-colors">
              <label className="text-[#687e8e] text-xs block mb-1">Recipient Name</label>
              <input
                type="text"
                value={name}
                placeholder="e.g. John Smith"
                className="w-full bg-transparent outline-none text-white text-sm placeholder:text-[#3a4a5a]"
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            <div className={`bg-[#0a0f15] border rounded-xl px-3 py-2.5 transition-colors ${addrTouched && !addrValid ? "border-red-500/50" : "border-[#1e2a35] focus-within:border-[#1ee3bf]/40"}`}>
              <div className="flex items-center justify-between mb-1">
                <label className="text-[#687e8e] text-xs">Wallet Address</label>
                {addrTouched && (
                  <span className={`text-[10px] font-semibold ${addrValid ? "text-[#1ee3bf]" : "text-red-400"}`}>
                    {addrValid ? "✓ Valid" : address.length < 42 ? `${address.length}/42 chars` : "✗ Invalid"}
                  </span>
                )}
              </div>
              <input
                type="text"
                value={address}
                placeholder="0x..."
                className="w-full bg-transparent outline-none text-white text-sm font-mono placeholder:text-[#3a4a5a]"
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>
          </div>
          <button
            onClick={() => canSubmit && resolve({ name: name.trim(), address: address.trim() })}
            disabled={!canSubmit}
            className="w-full bg-[#1ee3bf] text-black font-semibold py-2.5 rounded-xl text-sm hover:bg-[#17c9aa] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            Continue →
          </button>
        </div>
      );
    }
    return <RecipientForm />;
  },
  renderResult({ data }) {
    const { name, address } = data;
    return (
      <div className="flex items-center justify-between px-3 py-2 bg-[#0a1f1a] border border-[#1ee3bf]/30 rounded-xl">
        <span className="text-white text-sm font-semibold">{name}</span>
        <span className="text-[#687e8e] text-xs font-mono">{String(address).slice(0, 8)}…{String(address).slice(-4)}</span>
      </div>
    );
  },
});

// 3. Collect payment details
const collectPaymentDetailsTool = defineTool({
  name: "collect_payment_details",
  description:
    "Show a form to collect the USDC amount, schedule frequency, and minimum balance threshold.",
  inputSchema: z.object({
    instruction: z.string().describe("Brief instruction shown above the form"),
    ruleType: z.string().describe("The type of payment rule already chosen"),
  }),
  displayPropsSchema: z.object({
    instruction: z.string(),
    ruleType: z.string(),
  }),
  resolveSchema: z.object({
    amount: z.number(),
    schedule: z.string(),
    minBal: z.number(),
  }),
  displayStrategy: "hide-on-complete",
  async do(input, display) {
    const details = await display.pushAndWait(input);
    return {
      status: "success",
      data: `Amount: ${details.amount} USDC, Schedule: ${details.schedule}, Min balance: ${details.minBal} USDC`,
      renderData: details,
    };
  },
  render({ props, resolve }) {
    const scheduleOptions = [
      { value: "every5min", label: "5 min",   badge: "test" },
      { value: "daily",     label: "Daily" },
      { value: "weekly",    label: "Weekly" },
      { value: "monthly",   label: "Monthly" },
      { value: "yearly",    label: "Yearly" },
    ];
    function DetailsForm() {
      const [amount,   setAmount]   = useState("");
      const [schedule, setSchedule] = useState("monthly");
      const [minBal,   setMinBal]   = useState("");

      // Auto-suggest 2× amount as min balance when amount changes
      const handleAmountChange = (val) => {
        setAmount(val);
        const n = parseFloat(val);
        if (n > 0 && !minBal) setMinBal(String(n * 2));
      };

      const canSubmit = parseFloat(amount) > 0 && parseFloat(minBal) > 0;

      return (
        <div className="space-y-3">
          <StepBar step={3} total={4} label="Payment Details" />
          <p className="text-white text-sm font-medium">{props.instruction}</p>
          <div className="space-y-2">
            <div className="bg-[#0a0f15] border border-[#1e2a35] rounded-xl px-3 py-2.5 focus-within:border-[#1ee3bf]/40 transition-colors">
              <label className="text-[#687e8e] text-xs block mb-1">Amount (USDC)</label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={amount}
                placeholder="e.g. 1200"
                className="w-full bg-transparent outline-none text-white text-sm placeholder:text-[#3a4a5a]"
                onChange={(e) => handleAmountChange(e.target.value)}
              />
            </div>
            <div className="bg-[#0a0f15] border border-[#1e2a35] rounded-xl px-3 py-2.5">
              <label className="text-[#687e8e] text-xs block mb-1">Schedule</label>
              <div className="flex gap-2 flex-wrap mt-1">
                {scheduleOptions.map((s) => (
                  <button
                    key={s.value}
                    onClick={() => setSchedule(s.value)}
                    className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs border transition-all ${
                      schedule === s.value
                        ? "border-[#1ee3bf] text-[#1ee3bf] bg-[#0a1f1a]"
                        : "border-[#1e2a35] text-[#687e8e] hover:border-[#1ee3bf]/50"
                    }`}
                  >
                    {s.label}
                    {s.badge && <span className="text-[10px] px-1 py-0.5 bg-yellow-500/20 text-yellow-400 rounded">{s.badge}</span>}
                  </button>
                ))}
              </div>
            </div>
            <div className="bg-[#0a0f15] border border-[#1e2a35] rounded-xl px-3 py-2.5 focus-within:border-[#1ee3bf]/40 transition-colors">
              <div className="flex items-center justify-between mb-1">
                <label className="text-[#687e8e] text-xs">Min Balance (USDC)</label>
                <span className="text-[#3a4a5a] text-[10px]">agent pauses below this</span>
              </div>
              <input
                type="number"
                min="0"
                step="1"
                value={minBal}
                placeholder="e.g. 2400"
                className="w-full bg-transparent outline-none text-white text-sm placeholder:text-[#3a4a5a]"
                onChange={(e) => setMinBal(e.target.value)}
              />
            </div>
          </div>
          <button
            onClick={() => canSubmit && resolve({ amount: parseFloat(amount), schedule, minBal: parseFloat(minBal) })}
            disabled={!canSubmit}
            className="w-full bg-[#1ee3bf] text-black font-semibold py-2.5 rounded-xl text-sm hover:bg-[#17c9aa] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            Continue →
          </button>
        </div>
      );
    }
    return <DetailsForm />;
  },
  renderResult({ data }) {
    const { amount, schedule, minBal } = data;
    return (
      <div className="flex items-center gap-3 px-3 py-2 bg-[#0a1f1a] border border-[#1ee3bf]/30 rounded-xl text-sm">
        <span className="text-[#1ee3bf] font-semibold">{amount} USDC</span>
        <span className="text-[#687e8e]">·</span>
        <span className="text-white capitalize">{schedule}</span>
        <span className="text-[#687e8e]">·</span>
        <span className="text-[#687e8e]">min ${minBal}</span>
      </div>
    );
  },
});

// 4. Review and confirm the full plan
const reviewAndConfirmTool = defineTool({
  name: "review_and_confirm",
  description:
    "Show the user a complete summary of their agent configuration and ask them to approve or cancel before creating the wallet.",
  inputSchema: z.object({
    ruleType: z.string().describe("Payment type"),
    name: z.string().describe("Recipient name"),
    address: z.string().describe("Recipient wallet address"),
    amount: z.number().describe("USDC amount per payment"),
    schedule: z.string().describe("Payment frequency"),
    minBal: z.number().describe("Minimum agent wallet balance"),
    chain: z.string().describe("Blockchain network"),
  }),
  displayPropsSchema: z.object({
    ruleType: z.string(),
    name: z.string(),
    address: z.string(),
    amount: z.number(),
    schedule: z.string(),
    minBal: z.number(),
    chain: z.string(),
  }),
  resolveSchema: z.boolean(),
  displayStrategy: "hide-on-complete",
  unAbortable: true,
  async do(input, display) {
    const approved = await display.pushAndWait(input);
    if (!approved) {
      return {
        status: "success",
        data: "User cancelled the agent creation.",
        renderData: { cancelled: true, ...input },
      };
    }
    return {
      status: "success",
      data: "User approved the agent configuration. Proceed to create the agent wallet.",
      renderData: { cancelled: false, ...input },
    };
  },
  render({ props, resolve }) {
    const rows = [
      ["Type", props.ruleType],
      ["Recipient", props.name],
      ["Wallet", `${props.address.slice(0, 10)}…${props.address.slice(-6)}`],
      ["Amount", `${props.amount} USDC`],
      ["Schedule", props.schedule],
      ["Min Balance", `${props.minBal} USDC`],
      ["Chain", props.chain],
    ];
    return (
      <div className="space-y-3">
        <StepBar step={4} total={4} label="Review & Confirm" />
        <p className="text-white text-sm font-semibold">Review Agent Configuration</p>
        <div className="bg-[#0d1117] border border-[#1e2a35] rounded-xl overflow-hidden">
          {rows.map(([label, value], i) => (
            <div key={label} className={`flex items-center justify-between px-4 py-2.5 ${i < rows.length - 1 ? "border-b border-[#0a0f15]" : ""}`}>
              <span className="text-[#687e8e] text-xs">{label}</span>
              <span className="text-white text-xs font-semibold capitalize">{value}</span>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => resolve(false)}
            className="flex-1 border border-[#1e2a35] text-[#687e8e] hover:text-white py-2.5 rounded-xl text-sm transition-all"
          >
            Cancel
          </button>
          <button
            onClick={() => resolve(true)}
            className="flex-1 bg-[#1ee3bf] text-black font-semibold py-2.5 rounded-xl text-sm hover:bg-[#17c9aa] transition-all"
          >
            Create Agent ✓
          </button>
        </div>
      </div>
    );
  },
  renderResult({ data }) {
    const d = data;
    if (d?.cancelled) {
      return <div className="text-yellow-400 text-xs px-3 py-2 bg-yellow-500/10 rounded-xl border border-yellow-500/20">Agent creation cancelled.</div>;
    }
    return (
      <div className="text-[#1ee3bf] text-xs px-3 py-2 bg-[#0a1f1a] rounded-xl border border-[#1ee3bf]/30">
        ✓ Agent plan approved — creating wallet…
      </div>
    );
  },
});

// 5. Create agent wallet (WDK)
const createAgentWalletTool = defineTool({
  name: "create_agent_wallet",
  description:
    "Create the autonomous agent wallet using WDK and save the agent to storage. Call this only after the user has approved the plan.",
  inputSchema: z.object({
    ruleType: z.string(),
    name: z.string(),
    address: z.string(),
    amount: z.number(),
    schedule: z.string(),
    minBal: z.number(),
    chain: z.string(),
  }),
  displayPropsSchema: z.object({
    ruleType: z.string(),
    name: z.string(),
    amount: z.number(),
    schedule: z.string(),
    agentWalletAddress: z.string(),
    walletIndex: z.number(),
  }),
  // "hide-on-complete" ensures the live slot is removed after the tool finishes,
  // so the card never lingers into future list_agents calls.
  // The full "Agent Created" card is rendered via renderResult (timeline entry), not the slot.
  displayStrategy: "hide-on-complete",
  async do(input, display) {
    const seed = localStorage.getItem("seed");
    if (!seed) {
      return { status: "error", data: null, message: "No wallet connected. Please connect first." };
    }

    const { wdk } = initEvmWallet(seed);
    const agents = getAgents();
    const walletIndex = agents.length > 0
      ? Math.max(...agents.map(a => a.walletIndex || 0)) + 1
      : 1;

    // Show a progress indicator in the slot while wallet is being derived
    await display.pushAndForget({ ruleType: input.ruleType, name: input.name, amount: input.amount, schedule: input.schedule, agentWalletAddress: "", walletIndex });

    const agentAccount = await wdk.getAccount("ethereum", walletIndex);
    const agentWalletAddress = await agentAccount.getAddress();

    const newAgent = {
      id: Date.now(),
      ...input,
      active: true,
      lastRun: null,
      walletIndex,
      agentWalletAddress,
      createdAt: new Date().toISOString(),
    };

    saveAgents([...agents, newAgent]);

    const displayData = {
      ruleType: input.ruleType,
      name: input.name,
      amount: input.amount,
      schedule: input.schedule,
      agentWalletAddress,
      walletIndex,
    };

    return {
      status: "success",
      data: `Agent wallet created successfully! Wallet address: ${agentWalletAddress}. The agent is now active and will autonomously execute ${input.ruleType} payments of ${input.amount} USDC to ${input.name} on a ${input.schedule} basis. Fund the agent wallet to activate it.`,
      renderData: displayData,
    };
  },
  render({ props }) {
    // Slot shown only briefly during wallet derivation
    return (
      <div className="px-3 py-2 bg-[#0a1f1a] border border-[#1ee3bf]/20 rounded-xl flex items-center gap-2 text-xs text-[#1ee3bf]">
        <span className="w-1.5 h-1.5 rounded-full bg-[#1ee3bf] animate-pulse" />
        Creating wallet for {props.name}…
      </div>
    );
  },
  renderResult({ data }) {
    if (!data?.agentWalletAddress) return null;
    return <AgentCreatedCard data={data} />;
  },
});

// 6a. Select agent (picker UI — used before agent-specific actions when no name given)
const selectAgentTool = defineTool({
  name: "select_agent",
  description: "Show a clickable list of agents so the user can pick one. Call this when you need an agent name but the user hasn't specified which agent they mean.",
  inputSchema: z.object({
    action: z.string().describe("Short label for what we're doing, e.g. 'check balance', 'pause', 'resume', 'edit', 'delete'"),
  }),
  displayPropsSchema: z.object({
    action: z.string(),
    agents: z.array(z.object({
      name: z.string(),
      ruleType: z.string(),
      amount: z.number(),
      schedule: z.string(),
      active: z.boolean(),
    })),
  }),
  resolveSchema: z.string(),
  displayStrategy: "hide-on-complete",
  async do(input, display) {
    const agents = getAgents();
    if (!agents.length) {
      return { status: "error", data: null, message: "No agents found. Create an agent first." };
    }
    if (agents.length === 1) {
      // Auto-select the only agent — no need to show a picker
      return { status: "success", data: agents[0].name, renderData: { agentName: agents[0].name } };
    }
    const selected = await display.pushAndWait({
      action: input.action,
      agents: agents.map((a) => ({
        name: a.name,
        ruleType: a.ruleType,
        amount: a.amount,
        schedule: a.schedule,
        active: a.active,
      })),
    });
    return { status: "success", data: selected, renderData: { agentName: selected } };
  },
  render({ props, resolve }) {
    return (
      <div className="space-y-2">
        <p className="text-[#687e8e] text-xs mb-1">Which agent would you like to {props.action}?</p>
        {props.agents.map((a) => (
          <button
            key={a.name}
            onClick={() => resolve(a.name)}
            className="w-full text-left px-4 py-3 rounded-xl bg-[#0d1117] border border-[#1e2a35] hover:border-[#1ee3bf]/50 hover:bg-[#0a1f1a] transition-all"
          >
            <div className="flex items-center justify-between">
              <span className="text-white text-sm font-semibold">{a.name}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${a.active ? "bg-[#1ee3bf]/10 text-[#1ee3bf]" : "bg-yellow-500/10 text-yellow-400"}`}>
                {a.active ? "Active" : "Paused"}
              </span>
            </div>
            <p className="text-[#687e8e] text-xs mt-0.5 capitalize">{a.ruleType} · {a.amount} USDC · {a.schedule}</p>
          </button>
        ))}
      </div>
    );
  },
  renderResult({ data }) {
    if (!data) return null;
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#0a1f1a] border border-[#1ee3bf]/30 rounded-xl text-xs text-[#1ee3bf]">
        ✓ {data.agentName}
      </div>
    );
  },
});

// 6. List agents
const listAgentsTool = defineTool({
  name: "list_agents",
  description: "Show the user all their created payment agents. Call this when the user asks about their agents, wants to see them, or asks how many they have.",
  inputSchema: z.object({}),
  displayPropsSchema: z.object({
    agents: z.array(z.object({
      id: z.number(),
      name: z.string(),
      ruleType: z.string(),
      amount: z.number(),
      schedule: z.string(),
      agentWalletAddress: z.string(),
      active: z.boolean(),
    })),
  }),
  displayStrategy: "hide-on-complete",
  async do(_input, display) {
    const agents = getAgents();
    await display.pushAndForget({ agents: agents.map(a => ({
      id: a.id,
      name: a.name,
      ruleType: a.ruleType,
      amount: a.amount,
      schedule: a.schedule,
      agentWalletAddress: a.agentWalletAddress,
      active: a.active,
    })) });
    if (!agents.length) {
      return { status: "success", data: "The user has no agents yet.", renderData: { agents: [] } };
    }
    const summary = agents.map(a => `${a.name} (${a.ruleType}, ${a.amount} USDC ${a.schedule}, wallet: ${a.agentWalletAddress}, ${a.active ? "active" : "paused"})`).join("; ");
    return { status: "success", data: `User has ${agents.length} agent(s): ${summary}`, renderData: { agents } };
  },
  render({ props }) {
    const { agents } = props;
    if (!agents.length) {
      return (
        <div className="px-4 py-8 bg-[#0d1117] border border-[#1e2a35] rounded-2xl text-center space-y-3">
          <p className="text-[#687e8e] text-sm">You have no agents yet.</p>
          <button
            onClick={() => dispatchChatMessage("I want to create a new payment agent")}
            className="px-4 py-2 bg-[#1ee3bf] text-black text-xs font-semibold rounded-xl hover:bg-[#17c9aa] transition-all"
          >
            Create your first agent →
          </button>
        </div>
      );
    }
    function AgentListCard({ a }) {
      const [copied, setCopied] = useState(false);
      const copy = () => {
        navigator.clipboard.writeText(a.agentWalletAddress);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      };
      return (
        <div className="bg-[#0d1117] border border-[#1e2a35] rounded-xl p-3 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-white text-sm font-semibold">{a.name}</span>
              <span className="text-[#687e8e] text-xs capitalize">{a.ruleType}</span>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full ${a.active ? "bg-[#1ee3bf]/10 text-[#1ee3bf]" : "bg-yellow-500/10 text-yellow-400"}`}>
              {a.active ? "Active" : "Paused"}
            </span>
          </div>
          <p className="text-[#687e8e] text-xs">{a.amount} USDC · {a.schedule}</p>
          {/* Copyable wallet address */}
          <button
            onClick={copy}
            className="flex items-center gap-1.5 group w-full"
            title="Copy address"
          >
            <span className="text-[#3a4a5a] text-xs font-mono truncate group-hover:text-[#687e8e] transition-colors">
              {a.agentWalletAddress.slice(0, 14)}…{a.agentWalletAddress.slice(-8)}
            </span>
            <span className={`text-[10px] shrink-0 transition-colors ${copied ? "text-[#1ee3bf]" : "text-[#2a3a4a] group-hover:text-[#687e8e]"}`}>
              {copied ? "Copied!" : "copy"}
            </span>
          </button>
          {/* Quick actions */}
          <div className="flex gap-1.5 pt-0.5">
            <button
              onClick={() => dispatchChatMessage(`check balance of ${a.name}`)}
              className="flex-1 text-xs py-1.5 rounded-lg border border-[#1e2a35] text-[#687e8e] hover:border-[#1ee3bf]/40 hover:text-white transition-all"
            >
              💰 Balance
            </button>
            <button
              onClick={() => dispatchChatMessage(`fund ${a.name}`)}
              className="flex-1 text-xs py-1.5 rounded-lg border border-[#1e2a35] text-[#687e8e] hover:border-[#1ee3bf]/40 hover:text-white transition-all"
            >
              ⬆ Fund
            </button>
            <button
              onClick={() => dispatchChatMessage(a.active ? `pause ${a.name}` : `resume ${a.name}`)}
              className="flex-1 text-xs py-1.5 rounded-lg border border-[#1e2a35] text-[#687e8e] hover:border-yellow-500/40 hover:text-yellow-400 transition-all"
            >
              {a.active ? "⏸ Pause" : "▶ Resume"}
            </button>
          </div>
        </div>
      );
    }
    return (
      <div className="space-y-2">
        <p className="text-white text-sm font-semibold mb-1">Your Payment Agents ({agents.length})</p>
        {agents.map((a) => <AgentListCard key={a.id} a={a} />)}
      </div>
    );
  },
  renderResult({ data }) {
    const { agents } = data;
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#0a1f1a] border border-[#1ee3bf]/30 rounded-xl text-xs text-[#1ee3bf]">
        📋 {agents.length} agent{agents.length !== 1 ? "s" : ""} listed
      </div>
    );
  },
});

// 7. Check balance
const checkBalanceTool = defineTool({
  name: "check_balance",
  description: "Check the USDC and ETH balance of a specific agent's wallet. Call this when the user asks about a wallet balance or how much is in an agent.",
  inputSchema: z.object({
    agentName: z.string().describe("Name of the agent whose balance to check"),
  }),
  displayPropsSchema: z.object({
    agentName: z.string(),
    agentWalletAddress: z.string(),
    usdc: z.number(),
    eth: z.number(),
    healthy: z.boolean(),
    minBal: z.number(),
  }),
  displayStrategy: "stay",
  async do(input, display) {
    try {
      const { agent, account } = await resolveAgentWithAccount(input.agentName);
      const [usdc, eth] = await Promise.all([getUSDCBalance(account), getETHBalance(account)]);
      const displayData = {
        agentName: agent.name,
        agentWalletAddress: agent.agentWalletAddress,
        usdc,
        eth,
        healthy: usdc >= agent.minBal,
        minBal: agent.minBal,
      };
      await display.pushAndForget(displayData);
      return {
        status: "success",
        data: `${agent.name}'s wallet: ${usdc.toFixed(2)} USDC, ${eth.toFixed(6)} ETH. ${usdc < agent.minBal ? "Balance is below minimum threshold." : "Balance is healthy."}`,
        renderData: displayData,
      };
    } catch (e) {
      return { status: "error", data: null, message: e.message };
    }
  },
  render({ props }) {
    return (
      <div className="bg-[#0d1117] border border-[#1e2a35] rounded-2xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-white text-sm font-semibold">{props.agentName} — Balance</p>
          <span className={`text-xs px-2 py-0.5 rounded-full ${props.healthy ? "bg-[#1ee3bf]/10 text-[#1ee3bf]" : "bg-red-500/10 text-red-400"}`}>
            {props.healthy ? "Healthy" : "Low Balance"}
          </span>
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-between px-3 py-2 bg-[#0a1f1a] border border-[#1ee3bf]/20 rounded-xl">
            <span className="text-[#687e8e] text-xs">USDC</span>
            <span className="text-[#1ee3bf] text-sm font-bold">{props.usdc.toFixed(2)}</span>
          </div>
          <div className="flex items-center justify-between px-3 py-2 bg-[#0a0f15] border border-[#1e2a35] rounded-xl">
            <span className="text-[#687e8e] text-xs">ETH (gas)</span>
            <span className="text-white text-sm font-bold">{props.eth.toFixed(6)}</span>
          </div>
          {!props.healthy && (
            <p className="text-red-400 text-xs px-1">⚠ Balance below minimum threshold of {props.minBal} USDC</p>
          )}
        </div>
        <a
          href={`https://sepolia.basescan.org/address/${props.agentWalletAddress}`}
          target="_blank" rel="noreferrer"
          className="block text-center text-xs text-[#687e8e] hover:text-[#1ee3bf] transition-colors"
        >
          View on Basescan ↗
        </a>
      </div>
    );
  },
  renderResult({ data }) {
    if (!data) return null;
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#0a1f1a] border border-[#1ee3bf]/30 rounded-xl text-xs text-[#1ee3bf]">
        💰 {data.agentName}: {data.usdc.toFixed(2)} USDC · {data.eth.toFixed(5)} ETH
      </div>
    );
  },
});

// 8. Pause agent
const pauseAgentTool = defineTool({
  name: "pause_agent",
  description: "Pause a payment agent so it stops executing payments. Call when user says pause, stop, or disable an agent.",
  inputSchema: z.object({
    agentName: z.string().describe("Name of the agent to pause"),
  }),
  displayPropsSchema: z.object({
    agentName: z.string(),
    ruleType: z.string(),
    amount: z.number(),
    schedule: z.string(),
    agentWalletAddress: z.string(),
  }),
  displayStrategy: "stay",
  async do(input, display) {
    try {
      const { agent, agents } = await resolveAgent(input.agentName);
      if (!agent.active) {
        return { status: "success", data: `Agent "${agent.name}" is already paused.`, renderData: null };
      }
      saveAgents(agents.map((a) => (a.id === agent.id ? { ...a, active: false } : a)));
      const displayData = { agentName: agent.name, ruleType: agent.ruleType, amount: agent.amount, schedule: agent.schedule, agentWalletAddress: agent.agentWalletAddress };
      await display.pushAndForget(displayData);
      return { status: "success", data: `Agent "${agent.name}" has been paused. No payments will execute until resumed.`, renderData: displayData };
    } catch (e) {
      return { status: "error", data: null, message: e.message };
    }
  },
  render({ props }) {
    return (
      <div className="bg-[#0d1117] border border-yellow-500/30 rounded-2xl p-4 space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-yellow-400 text-base">⏸</span>
          <p className="text-white text-sm font-semibold">{props.agentName} — Paused</p>
        </div>
        <p className="text-[#687e8e] text-xs capitalize">{props.ruleType} · {props.amount} USDC · {props.schedule}</p>
        <p className="text-[#3a4a5a] text-xs font-mono truncate">{props.agentWalletAddress}</p>
      </div>
    );
  },
  renderResult({ data }) {
    if (!data) return null;
    return <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-yellow-500/10 border border-yellow-500/30 rounded-xl text-xs text-yellow-400">⏸ {data.agentName} paused</div>;
  },
});

// 9. Resume agent
const resumeAgentTool = defineTool({
  name: "resume_agent",
  description: "Resume a paused payment agent so it starts executing payments again. Call when user says resume, start, enable, or activate an agent.",
  inputSchema: z.object({
    agentName: z.string().describe("Name of the agent to resume"),
  }),
  displayPropsSchema: z.object({
    agentName: z.string(),
    ruleType: z.string(),
    amount: z.number(),
    schedule: z.string(),
    agentWalletAddress: z.string(),
  }),
  displayStrategy: "stay",
  async do(input, display) {
    try {
      const { agent, agents } = await resolveAgent(input.agentName);
      if (agent.active) {
        return { status: "success", data: `Agent "${agent.name}" is already active.`, renderData: null };
      }
      saveAgents(agents.map((a) => (a.id === agent.id ? { ...a, active: true } : a)));
      const displayData = { agentName: agent.name, ruleType: agent.ruleType, amount: agent.amount, schedule: agent.schedule, agentWalletAddress: agent.agentWalletAddress };
      await display.pushAndForget(displayData);
      return { status: "success", data: `Agent "${agent.name}" has been resumed and will execute payments on schedule.`, renderData: displayData };
    } catch (e) {
      return { status: "error", data: null, message: e.message };
    }
  },
  render({ props }) {
    return (
      <div className="bg-[#0d1117] border border-[#1ee3bf]/30 rounded-2xl p-4 space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-[#1ee3bf] text-base">▶</span>
          <p className="text-white text-sm font-semibold">{props.agentName} — Active</p>
        </div>
        <p className="text-[#687e8e] text-xs capitalize">{props.ruleType} · {props.amount} USDC · {props.schedule}</p>
        <p className="text-[#3a4a5a] text-xs font-mono truncate">{props.agentWalletAddress}</p>
      </div>
    );
  },
  renderResult({ data }) {
    if (!data) return null;
    return <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0a1f1a] border border-[#1ee3bf]/30 rounded-xl text-xs text-[#1ee3bf]">▶ {data.agentName} resumed</div>;
  },
});

// 10. Delete agent
const deleteAgentTool = defineTool({
  name: "delete_agent",
  description: "Permanently delete a payment agent after user confirms. The tool handles the confirmation UI — call it directly when user asks to delete or remove an agent.",
  inputSchema: z.object({
    agentName: z.string().describe("Name of the agent to delete"),
  }),
  displayPropsSchema: z.object({
    agentName: z.string(),
    ruleType: z.string(),
    amount: z.number(),
    schedule: z.string(),
    agentWalletAddress: z.string(),
  }),
  resolveSchema: z.boolean(),
  displayStrategy: "hide-on-complete",
  async do(input, display) {
    try {
      const { agent, agents } = await resolveAgent(input.agentName);
      const confirmed = await display.pushAndWait({
        agentName: agent.name,
        ruleType: agent.ruleType,
        amount: agent.amount,
        schedule: agent.schedule,
        agentWalletAddress: agent.agentWalletAddress,
      });
      if (!confirmed) {
        return { status: "success", data: "Deletion cancelled.", renderData: { cancelled: true, agentName: agent.name } };
      }
      saveAgents(agents.filter((a) => a.id !== agent.id));
      return { status: "success", data: `Agent "${agent.name}" has been permanently deleted.`, renderData: { cancelled: false, agentName: agent.name } };
    } catch (e) {
      return { status: "error", data: null, message: e.message };
    }
  },
  render({ props, resolve }) {
    return (
      <div className="space-y-3">
        <p className="text-red-400 text-sm font-semibold">⚠ Delete Agent?</p>
        <div className="bg-[#0d1117] border border-[#1e2a35] rounded-xl overflow-hidden">
          {[["Name", props.agentName], ["Type", props.ruleType], ["Amount", `${props.amount} USDC`], ["Schedule", props.schedule], ["Wallet", `${props.agentWalletAddress.slice(0, 10)}…${props.agentWalletAddress.slice(-6)}`]].map(([label, value], i, arr) => (
            <div key={label} className={`flex items-center justify-between px-4 py-2.5 ${i < arr.length - 1 ? "border-b border-[#0a0f15]" : ""}`}>
              <span className="text-[#687e8e] text-xs">{label}</span>
              <span className="text-white text-xs font-semibold capitalize">{value}</span>
            </div>
          ))}
        </div>
        <p className="text-[#687e8e] text-xs">This cannot be undone. Any funds in the agent wallet must be manually retrieved.</p>
        <div className="flex gap-2">
          <button onClick={() => resolve(false)} className="flex-1 border border-[#1e2a35] text-[#687e8e] hover:text-white py-2.5 rounded-xl text-sm transition-all">Cancel</button>
          <button onClick={() => resolve(true)} className="flex-1 bg-red-500 text-white font-semibold py-2.5 rounded-xl text-sm hover:bg-red-600 transition-all">Delete Agent</button>
        </div>
      </div>
    );
  },
  renderResult({ data }) {
    if (!data) return null;
    if (data.cancelled) return <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0a0f15] border border-[#1e2a35] rounded-xl text-xs text-[#687e8e]">Deletion cancelled</div>;
    return <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-400">🗑 {data.agentName} deleted</div>;
  },
});

// 11. Edit agent
const editAgentTool = defineTool({
  name: "edit_agent",
  description: "Modify an existing agent's amount, schedule, or minimum balance. Call when user wants to change, update, or edit an agent's settings.",
  inputSchema: z.object({
    agentName: z.string().describe("Name of the agent to edit"),
    instruction: z.string().describe("Brief instruction shown above the form"),
  }),
  displayPropsSchema: z.object({
    agentName: z.string(),
    instruction: z.string(),
    currentAmount: z.number(),
    currentSchedule: z.string(),
    currentMinBal: z.number(),
  }),
  resolveSchema: z.object({ amount: z.number(), schedule: z.string(), minBal: z.number() }),
  displayStrategy: "hide-on-complete",
  async do(input, display) {
    try {
      const { agent, agents } = await resolveAgent(input.agentName);
      const { amount, schedule, minBal } = await display.pushAndWait({
        agentName: agent.name,
        instruction: input.instruction,
        currentAmount: agent.amount,
        currentSchedule: agent.schedule,
        currentMinBal: agent.minBal,
      });
      saveAgents(agents.map((a) => (a.id === agent.id ? { ...a, amount, schedule, minBal } : a)));
      return {
        status: "success",
        data: `Agent "${agent.name}" updated: ${amount} USDC ${schedule}, min balance ${minBal} USDC.`,
        renderData: { agentName: agent.name, amount, schedule, minBal },
      };
    } catch (e) {
      return { status: "error", data: null, message: e.message };
    }
  },
  render({ props, resolve }) {
    function EditForm() {
      const [amount, setAmount] = useState(String(props.currentAmount));
      const [schedule, setSchedule] = useState(props.currentSchedule);
      const [minBal, setMinBal] = useState(String(props.currentMinBal));
      const submit = () => {
        const amt = parseFloat(amount);
        const min = parseFloat(minBal);
        if (!amt || amt <= 0 || !min || min <= 0) return;
        resolve({ amount: amt, schedule, minBal: min });
      };
      const scheduleOptions = [
        { value: "every5min", label: "5 min", badge: "test" },
        { value: "daily",     label: "Daily" },
        { value: "weekly",    label: "Weekly" },
        { value: "monthly",   label: "Monthly" },
        { value: "yearly",    label: "Yearly" },
      ];
      return (
        <div className="space-y-3">
          <p className="text-white text-sm font-medium">{props.instruction}</p>
          <div className="space-y-2">
            <div className="bg-[#0a0f15] border border-[#1e2a35] rounded-xl px-3 py-2.5 focus-within:border-[#1ee3bf]/40 transition-colors">
              <label className="text-[#687e8e] text-xs block mb-1">Amount (USDC)</label>
              <input type="number" min="0.01" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full bg-transparent outline-none text-white text-sm" />
            </div>
            <div className="bg-[#0a0f15] border border-[#1e2a35] rounded-xl px-3 py-2.5">
              <label className="text-[#687e8e] text-xs block mb-1">Schedule</label>
              <div className="flex gap-2 flex-wrap mt-1">
                {scheduleOptions.map((s) => (
                  <button key={s.value} onClick={() => setSchedule(s.value)}
                    className={`flex items-center gap-1 px-3 py-1 rounded-lg text-xs border transition-all ${schedule === s.value ? "border-[#1ee3bf] text-[#1ee3bf] bg-[#0a1f1a]" : "border-[#1e2a35] text-[#687e8e] hover:border-[#1ee3bf]/50"}`}>
                    {s.label}
                    {s.badge && <span className="text-[10px] px-1 py-0.5 bg-yellow-500/20 text-yellow-400 rounded">{s.badge}</span>}
                  </button>
                ))}
              </div>
            </div>
            <div className="bg-[#0a0f15] border border-[#1e2a35] rounded-xl px-3 py-2.5 focus-within:border-[#1ee3bf]/40 transition-colors">
              <label className="text-[#687e8e] text-xs block mb-1">Min Balance (USDC)</label>
              <input type="number" min="0" step="1" value={minBal} onChange={(e) => setMinBal(e.target.value)} className="w-full bg-transparent outline-none text-white text-sm" />
            </div>
          </div>
          <button onClick={submit} className="w-full bg-[#1ee3bf] text-black font-semibold py-2.5 rounded-xl text-sm hover:bg-[#17c9aa] transition-all">Save Changes →</button>
        </div>
      );
    }
    return <EditForm />;
  },
  renderResult({ data }) {
    if (!data) return null;
    return (
      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#0a1f1a] border border-[#1ee3bf]/30 rounded-xl text-xs text-[#1ee3bf]">
        ✏ {data.agentName}: {data.amount} USDC · {data.schedule} · min ${data.minBal}
      </div>
    );
  },
});

// 12. Fund agent
const fundAgentTool = defineTool({
  name: "fund_agent",
  description: "Let the user fund an agent wallet with USDC. Shows a funding form and automatically handles the ETH gas top-up. Call when the user wants to fund, top-up, or add USDC to an agent.",
  inputSchema: z.object({
    agentName: z.string().describe("Name of the agent to fund"),
  }),
  displayPropsSchema: z.object({
    agentName: z.string(),
    agentWalletAddress: z.string(),
    suggestedAmount: z.number(),
  }),
  resolveSchema: z.object({ txHash: z.string(), amount: z.number() }),
  displayStrategy: "hide-on-complete",
  async do(input, display) {
    try {
      const { agent } = await resolveAgent(input.agentName);
      const seed = localStorage.getItem("seed");
      if (!seed) throw new Error("No wallet connected. Please connect your wallet first.");

      const result = await display.pushAndWait({
        agentName: agent.name,
        agentWalletAddress: agent.agentWalletAddress,
        suggestedAmount: agent.amount * 5,
      });

      return {
        status: "success",
        data: `Agent "${agent.name}" funded with ${result.amount} USDC. Tx: ${result.txHash}`,
        renderData: { agentName: agent.name, txHash: result.txHash, amount: result.amount },
      };
    } catch (e) {
      return { status: "error", data: null, message: e.message };
    }
  },
  render({ props, resolve }) {
    function FundForm() {
      const [amount, setAmount]   = useState(String(props.suggestedAmount));
      const [busy, setBusy]       = useState(false);
      const [err, setErr]         = useState("");

      const handleFund = async () => {
        const amt = parseFloat(amount);
        if (!amt || amt <= 0) return;
        setBusy(true);
        setErr("");
        try {
          const seed = localStorage.getItem("seed");
          if (!seed) throw new Error("Wallet not connected");
          const { wdk } = initEvmWallet(seed);
          const masterAccount = await wdk.getAccount("ethereum", 0);

          // Top up ETH for gas if needed
          const { getETHBalance } = await import("./getBalance");
          const { sendETH } = await import("./sendPayment");
          const agentEth = await getETHBalance(await wdk.getAccount("ethereum",
            getAgents().find(a => a.agentWalletAddress === props.agentWalletAddress)?.walletIndex ?? 1
          ));
          if (agentEth < 0.003) {
            await sendETH({ account: masterAccount, recipient: props.agentWalletAddress, amountEth: 0.003 });
          }

          const { sendUSDC } = await import("./sendPayment");
          const { txHash } = await sendUSDC({ account: masterAccount, recipient: props.agentWalletAddress, amount: amt });
          resolve({ txHash, amount: amt });
        } catch (e) {
          const msg = e.message || "";
          if (msg.includes("INSUFFICIENT_FUNDS") || msg.includes("insufficient funds for intrinsic")) {
            setErr("Your main wallet has no ETH for gas on Base Sepolia. Get some at alchemy.com/faucets/base-sepolia");
          } else {
            setErr(msg || "Transfer failed");
          }
          setBusy(false);
        }
      };

      return (
        <div className="bg-[#0a1f1a] border border-[#1ee3bf]/30 rounded-2xl p-4 space-y-3">
          <div>
            <p className="text-white text-sm font-semibold">Fund Agent: {props.agentName}</p>
            <p className="text-[#687e8e] text-xs font-mono mt-0.5 break-all">{props.agentWalletAddress}</p>
          </div>
          <div className="bg-[#0d1117] border border-[#1e2a35] rounded-xl px-3 py-2.5 focus-within:border-[#1ee3bf]/40 transition-colors">
            <label className="text-[#687e8e] text-xs block mb-1">Amount (USDC)</label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={busy}
              className="w-full bg-transparent outline-none text-white text-sm disabled:opacity-50"
            />
          </div>
          {err && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-2.5">
              <p className="text-yellow-400 text-xs">⚠ {err}</p>
            </div>
          )}
          <button
            onClick={handleFund}
            disabled={busy || !amount}
            className="w-full bg-[#1ee3bf] text-black font-semibold py-2.5 rounded-xl text-sm hover:bg-[#17c9aa] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
          >
            {busy ? "Sending…" : `Fund with ${amount || "—"} USDC →`}
          </button>
          <p className="text-[#2a3a4a] text-xs text-center">0.003 ETH for gas is included automatically</p>
        </div>
      );
    }
    return <FundForm />;
  },
  renderResult({ data }) {
    if (!data) return null;
    return (
      <div className="space-y-1.5">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#0a1f1a] border border-[#1ee3bf]/30 rounded-xl text-xs text-[#1ee3bf]">
          ✓ {data.agentName} funded with {data.amount} USDC
        </div>
        <a
          href={`https://sepolia.basescan.org/tx/${data.txHash}`}
          target="_blank"
          rel="noreferrer"
          className="block text-xs text-[#687e8e] hover:text-[#1ee3bf] transition-colors font-mono truncate"
        >
          {data.txHash?.slice(0, 24)}…{data.txHash?.slice(-6)} ↗
        </a>
      </div>
    );
  },
});

// 13. Check logs
const checkLogsTool = defineTool({
  name: "check_logs",
  description: "Show recent payment execution history for a specific agent or all agents. Call when user asks about payment history, logs, or past transactions.",
  inputSchema: z.object({
    agentName: z.string().optional().describe("Agent name to filter logs. Omit for all agents."),
    limit: z.number().optional().describe("Max entries to show, default 8"),
  }),
  displayPropsSchema: z.object({
    title: z.string(),
    logs: z.array(z.object({
      status: z.string(),
      agentName: z.string(),
      amount: z.number(),
      recipient: z.string(),
      balance: z.string(),
      reason: z.string(),
      date: z.string(),
      txHash: z.string().nullable(),
    })),
  }),
  displayStrategy: "stay",
  async do(input, display) {
    let logs = getLogs();
    let title = "All Agents — Recent Logs";
    if (input.agentName) {
      const lower = input.agentName.toLowerCase();
      logs = logs.filter((l) => l.agentName?.toLowerCase().includes(lower));
      title = `${input.agentName} — Recent Logs`;
    }
    const limit = Math.min(input.limit || 8, 20);
    logs = logs.slice(0, limit);
    const displayData = { title, logs };
    await display.pushAndForget(displayData);
    if (!logs.length) return { status: "success", data: "No logs found.", renderData: displayData };
    const counts = logs.reduce((acc, l) => { acc[l.status] = (acc[l.status] || 0) + 1; return acc; }, {});
    return {
      status: "success",
      data: `Last ${logs.length} log(s): ${Object.entries(counts).map(([s, n]) => `${n} ${s}`).join(", ")}.`,
      renderData: displayData,
    };
  },
  render({ props }) {
    if (!props.logs.length) {
      return <div className="px-4 py-3 bg-[#0d1117] border border-[#1e2a35] rounded-2xl text-[#687e8e] text-sm">No execution logs yet.</div>;
    }
    const icon = (s) => s === "success" ? "✓" : s === "skipped" ? "–" : "✕";
    const color = (s) => s === "success" ? "text-[#1ee3bf]" : s === "skipped" ? "text-yellow-400" : "text-red-400";
    return (
      <div className="space-y-2">
        <p className="text-white text-sm font-semibold">{props.title}</p>
        <div className="bg-[#0d1117] border border-[#1e2a35] rounded-xl overflow-hidden">
          {props.logs.map((log, i) => (
            <div key={i} className={`flex items-center justify-between px-3 py-2.5 ${i < props.logs.length - 1 ? "border-b border-[#0a0f15]" : ""}`}>
              <div className="flex items-center gap-2 min-w-0">
                <span className={`text-xs font-bold shrink-0 ${color(log.status)}`}>{icon(log.status)}</span>
                <div className="min-w-0">
                  <p className="text-white text-xs truncate">{log.agentName} → {log.amount} USDC</p>
                  <p className="text-[#687e8e] text-xs truncate" title={log.reason}>{log.reason}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-2">
                <span className="text-[#3a4a5a] text-xs">{log.date}</span>
                {log.txHash && (
                  <a href={`${EXPLORER_TX}/${log.txHash}`} target="_blank" rel="noreferrer" className="text-[#687e8e] hover:text-[#1ee3bf] text-xs transition-colors">↗</a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  },
  renderResult({ data }) {
    if (!data) return null;
    return (
      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0a1f1a] border border-[#1ee3bf]/30 rounded-xl text-xs text-[#1ee3bf]">
        📋 {data.logs.length} log{data.logs.length !== 1 ? "s" : ""}
      </div>
    );
  },
});

// 13. Next payment
const nextPaymentTool = defineTool({
  name: "next_payment",
  description: "Show when each agent will next execute a payment based on their schedule and last run time. Call when user asks 'when does X pay next' or 'next payment'.",
  inputSchema: z.object({
    agentName: z.string().optional().describe("Agent name to check. Omit for all agents."),
  }),
  displayPropsSchema: z.object({
    schedule: z.array(z.object({
      name: z.string(),
      ruleType: z.string(),
      active: z.boolean(),
      amount: z.number(),
      scheduleFreq: z.string(),
      nextRunISO: z.string().nullable(),
      overdue: z.boolean(),
    })),
  }),
  displayStrategy: "stay",
  async do(input, display) {
    let agents = getAgents();
    if (input.agentName) {
      const lower = input.agentName.toLowerCase();
      agents = agents.filter((a) => a.name?.toLowerCase().includes(lower));
    }
    const schedule = agents.map((a) => {
      const nextRun = computeNextRun(a);
      return {
        name: a.name,
        ruleType: a.ruleType,
        active: a.active,
        amount: a.amount,
        scheduleFreq: a.schedule,
        nextRunISO: nextRun ? nextRun.toISOString() : null,
        overdue: nextRun ? nextRun.getTime() < Date.now() : false,
      };
    }).sort((a, b) => {
      if (!a.nextRunISO) return 1;
      if (!b.nextRunISO) return -1;
      return new Date(a.nextRunISO) - new Date(b.nextRunISO);
    });
    await display.pushAndForget({ schedule });
    const summary = schedule.map((s) => `${s.name}: ${s.nextRunISO ? formatCountdown(new Date(s.nextRunISO)) : "paused"}`).join(", ");
    return { status: "success", data: summary, renderData: { schedule } };
  },
  render({ props }) {
    if (!props.schedule.length) {
      return <div className="px-4 py-3 bg-[#0d1117] border border-[#1e2a35] rounded-2xl text-[#687e8e] text-sm">No agents found.</div>;
    }
    return (
      <div className="space-y-2">
        <p className="text-white text-sm font-semibold">Next Payments</p>
        <div className="bg-[#0d1117] border border-[#1e2a35] rounded-xl overflow-hidden">
          {props.schedule.map((s, i) => {
            const countdown = s.nextRunISO ? formatCountdown(new Date(s.nextRunISO)) : "Paused";
            const isOverdue = s.overdue;
            return (
              <div key={i} className={`flex items-center justify-between px-4 py-3 ${i < props.schedule.length - 1 ? "border-b border-[#0a0f15]" : ""}`}>
                <div>
                  <p className="text-white text-sm font-semibold">{s.name}</p>
                  <p className="text-[#687e8e] text-xs capitalize">{s.ruleType} · {s.amount} USDC · {s.scheduleFreq}</p>
                </div>
                <span className={`text-xs font-semibold px-2 py-1 rounded-lg ${
                  !s.active ? "bg-[#1e2a35] text-[#687e8e]" :
                  isOverdue ? "bg-yellow-500/10 text-yellow-400" :
                  "bg-[#0a1f1a] text-[#1ee3bf]"
                }`}>
                  {countdown}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  },
  renderResult({ data }) {
    if (!data) return null;
    const first = data.schedule[0];
    if (!first) return null;
    return (
      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0a1f1a] border border-[#1ee3bf]/30 rounded-xl text-xs text-[#1ee3bf]">
        🕐 Next: {first.name} {first.nextRunISO ? formatCountdown(new Date(first.nextRunISO)) : "paused"}
      </div>
    );
  },
});

// 14. Agent status
const agentStatusTool = defineTool({
  name: "agent_status",
  description: "Full health report for one or all agents: balance, next run, active state, low-balance warning. Call when user asks for status, health check, or overview.",
  inputSchema: z.object({
    agentName: z.string().optional().describe("Agent name to inspect. Omit for all agents."),
  }),
  displayPropsSchema: z.object({
    agents: z.array(z.object({
      name: z.string(),
      ruleType: z.string(),
      active: z.boolean(),
      amount: z.number(),
      schedule: z.string(),
      minBal: z.number(),
      agentWalletAddress: z.string(),
      usdc: z.number(),
      eth: z.number(),
      healthy: z.boolean(),
      nextRunISO: z.string().nullable(),
      overdue: z.boolean(),
    })),
  }),
  displayStrategy: "stay",
  async do(input, display) {
    try {
      const seed = localStorage.getItem("seed");
      if (!seed) return { status: "error", data: null, message: "No wallet connected." };
      let agents = getAgents();
      if (input.agentName) {
        const lower = input.agentName.toLowerCase();
        agents = agents.filter((a) => a.name?.toLowerCase().includes(lower));
      }
      if (!agents.length) return { status: "success", data: "No agents found.", renderData: { agents: [] } };
      const { wdk } = initEvmWallet(seed);
      const enriched = await Promise.all(
        agents.map(async (a) => {
          const account = await wdk.getAccount("ethereum", a.walletIndex);
          const [usdc, eth] = await Promise.all([getUSDCBalance(account), getETHBalance(account)]);
          const nextRun = computeNextRun(a);
          return {
            name: a.name, ruleType: a.ruleType, active: a.active,
            amount: a.amount, schedule: a.schedule, minBal: a.minBal,
            agentWalletAddress: a.agentWalletAddress,
            usdc, eth, healthy: usdc >= a.minBal,
            nextRunISO: nextRun ? nextRun.toISOString() : null,
            overdue: nextRun ? nextRun.getTime() < Date.now() : false,
          };
        })
      );
      await display.pushAndForget({ agents: enriched });
      const summary = enriched.map((a) =>
        `${a.name}: ${a.usdc.toFixed(2)} USDC, ${a.active ? "active" : "paused"}, next run ${a.nextRunISO ? formatCountdown(new Date(a.nextRunISO)) : "paused"}`
      ).join("; ");
      return { status: "success", data: summary, renderData: { agents: enriched } };
    } catch (e) {
      return { status: "error", data: null, message: e.message };
    }
  },
  render({ props }) {
    if (!props.agents.length) return <div className="px-4 py-3 bg-[#0d1117] border border-[#1e2a35] rounded-2xl text-[#687e8e] text-sm">No agents found.</div>;
    return (
      <div className="space-y-3">
        <p className="text-white text-sm font-semibold">Agent Status ({props.agents.length})</p>
        {props.agents.map((a) => (
          <div key={a.name} className={`bg-[#0d1117] border rounded-2xl p-4 space-y-3 ${!a.healthy ? "border-red-500/30" : a.active ? "border-[#1ee3bf]/20" : "border-[#1e2a35]"}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <p className="text-white text-sm font-semibold">{a.name}</p>
                <span className="text-[#687e8e] text-xs capitalize">{a.ruleType}</span>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full ${a.active ? "bg-[#1ee3bf]/10 text-[#1ee3bf]" : "bg-yellow-500/10 text-yellow-400"}`}>
                {a.active ? "Active" : "Paused"}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-[#0a1f1a] rounded-xl px-3 py-2">
                <p className="text-[#687e8e] text-xs mb-0.5">USDC</p>
                <p className={`text-sm font-bold ${a.healthy ? "text-[#1ee3bf]" : "text-red-400"}`}>{a.usdc.toFixed(2)}</p>
              </div>
              <div className="bg-[#0a0f15] rounded-xl px-3 py-2">
                <p className="text-[#687e8e] text-xs mb-0.5">ETH (gas)</p>
                <p className="text-white text-sm font-bold">{a.eth.toFixed(5)}</p>
              </div>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#687e8e]">{a.amount} USDC · {a.schedule} · min {a.minBal}</span>
              <span className={`font-semibold ${a.overdue ? "text-yellow-400" : "text-[#1ee3bf]"}`}>
                {a.nextRunISO ? formatCountdown(new Date(a.nextRunISO)) : "Paused"}
              </span>
            </div>
            {!a.healthy && <p className="text-red-400 text-xs">⚠ Balance below minimum threshold</p>}
          </div>
        ))}
      </div>
    );
  },
  renderResult({ data }) {
    if (!data?.agents?.length) return null;
    const healthy = data.agents.filter((a) => a.healthy).length;
    return (
      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0a1f1a] border border-[#1ee3bf]/30 rounded-xl text-xs text-[#1ee3bf]">
        📊 {data.agents.length} agents · {healthy} healthy
      </div>
    );
  },
});

// ── System prompt ─────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are Tipex AI — an autonomous payment agent creation assistant for the Tipex platform, built on Base Sepolia testnet using Tether's WDK (Wallet Development Kit).

Your job is to guide users through creating autonomous on-chain USDC payment agents. Each agent gets its own dedicated WDK wallet and executes payments automatically based on rules.

## Your workflow:

### On greeting (user says "hello" or similar):
1. Greet warmly in 1 sentence. Ask: "Would you like to create a new payment agent, or see your existing ones?"
2. Wait for the user's response — do NOT call any tool yet.

### If user wants to see their agents:
- Call \`list_agents\` immediately. After showing them, ask if they'd like to create another. Stop and wait.

### If user wants to create a new agent:
1. Call \`choose_payment_type\` — do not describe options in text, use the tool.
2. Once they choose a type, call \`collect_recipient_info\`.
3. Then call \`collect_payment_details\`.
4. Then call \`review_and_confirm\` with all collected data — always use chain: "Base".
5. If approved, call \`create_agent_wallet\` immediately.
6. Tell the user to fund the agent wallet to activate it (1 sentence). Stop — do NOT call any more tools.

## Rules:
- CRITICAL: Call ONE tool per response. NEVER call two tools in the same message. Wait for each tool's result before calling the next.
- NEVER call \`choose_payment_type\` unless the user has explicitly said they want to create a new agent.
- NEVER call any tool without clear user intent for that action.
- NEVER list options or collect info via plain text — always use the appropriate tool.
- chain is always "Base" (Base Sepolia testnet).
- Responses between tool calls: 1-2 sentences max.

## STOP rules — after these tools complete, send ONE short confirmation sentence then STOP. Do NOT call any other tool, especially NOT list_agents:
- After \`fund_agent\`: say "✓ Done — [agent] funded with [amount] USDC." STOP.
- After \`pause_agent\`: say "✓ [agent] paused." STOP.
- After \`resume_agent\`: say "✓ [agent] resumed." STOP.
- After \`delete_agent\`: say "✓ [agent] deleted." STOP.
- After \`edit_agent\`: say "✓ [agent] updated." STOP.
- After \`check_balance\`: STOP — the balance card is already shown, no need to add text.
- After \`check_logs\`: STOP — logs are shown in the card.
- After \`next_payment\`: STOP — schedule is shown in the card.
- After \`agent_status\`: STOP — status is shown in the card.
- After \`list_agents\`, STOP and wait for user input — do not start the creation flow automatically.
- After \`create_agent_wallet\`, STOP — do not call any other tool.
- For \`delete_agent\`: call it directly — it handles the confirmation UI, do NOT ask "are you sure?" in text.
- For \`edit_agent\`: call it directly with the agent name — it handles the form, do NOT collect changes via text.
- For \`fund_agent\`: call it directly — it handles the USDC transfer and ETH gas automatically. NEVER tell users to fund manually.

### Managing existing agents — trigger phrases:
- "check balance" / "how much in X" → if X is named, call \`check_balance\` directly; if no agent specified, call \`select_agent\` (action: "check balance") first, then call \`check_balance\` with the returned name
- "status" / "health" / "overview" → \`agent_status\` (agentName optional — omit to show all agents)
- "pause X" / "stop X" / "disable X" → if X is named, call \`pause_agent\` directly; if no agent specified, call \`select_agent\` (action: "pause") first, then call \`pause_agent\`
- "resume X" / "start X" / "enable X" → if X is named, call \`resume_agent\` directly; if no agent specified, call \`select_agent\` (action: "resume") first, then call \`resume_agent\`
- "delete X" / "remove X" → if X is named, call \`delete_agent\` directly; if no agent specified, call \`select_agent\` (action: "delete") first, then call \`delete_agent\`
- "edit X" / "change X" / "update X" → if X is named, call \`edit_agent\` directly; if no agent specified, call \`select_agent\` (action: "edit") first, then call \`edit_agent\`
- "fund X" / "top up X" / "add USDC to X" / "I want to fund" / "fund this agent" → if X is named, call \`fund_agent\` directly; if no agent specified, call \`select_agent\` (action: "fund") first, then call \`fund_agent\`
- CRITICAL: NEVER tell users to fund manually or explain that "you don't need a tool". ALWAYS call \`fund_agent\` — it handles the transaction automatically.
- "logs" / "history" / "transactions" → \`check_logs\` (agentName optional — omit for all agents)
- "next payment" / "when does X pay" → \`next_payment\` (agentName optional — omit for all agents)
- "show agents" / "list agents" → \`list_agents\`

### select_agent rule:
- ALWAYS call \`select_agent\` (never ask in plain text) when you need an agent name but the user hasn't specified one.
- Call ONE tool per response. STOP after calling \`select_agent\` and wait for the result. Then, in your NEXT response, call the intended tool (check_balance, pause_agent, etc.) using the agent name returned by select_agent.
- NEVER call two tools in the same response.

Available tools:
- select_agent: Clickable agent picker — use when agent name is not specified
- list_agents: Show all existing agents
- check_balance: USDC + ETH balance of an agent wallet
- agent_status: Full health report (balance + next run + active state) for one or all agents
- pause_agent: Pause an agent by name
- resume_agent: Resume a paused agent by name
- delete_agent: Delete an agent (handles confirmation UI)
- edit_agent: Edit amount, schedule, or min balance (handles form UI)
- fund_agent: Fund an agent wallet with USDC (handles ETH gas top-up automatically)
- check_logs: Recent payment execution history
- next_payment: When each agent will next execute
- choose_payment_type: Show 4 payment type buttons (salary, gift, subscription, conditional)
- collect_recipient_info: Form for recipient name + wallet address
- collect_payment_details: Form for USDC amount, schedule (every5min/daily/weekly/monthly/yearly), min balance
- review_and_confirm: Full plan summary for user approval
- create_agent_wallet: Creates WDK wallet and saves agent (call only after approval)`;

// ── GloveClient export ────────────────────────────────────────────────────────
export const gloveClient = new GloveClient({
  createModel: () => tipexModel,
  createStore: (sessionId) => new MemoryStore(sessionId),
  systemPrompt: SYSTEM_PROMPT,
  tools: [
    selectAgentTool,
    listAgentsTool,
    checkBalanceTool,
    agentStatusTool,
    pauseAgentTool,
    resumeAgentTool,
    deleteAgentTool,
    editAgentTool,
    fundAgentTool,
    checkLogsTool,
    nextPaymentTool,
    choosePaymentTypeTool,
    collectRecipientTool,
    collectPaymentDetailsTool,
    reviewAndConfirmTool,
    createAgentWalletTool,
  ],
  compaction: {
    compaction_instructions:
      "Summarize the agent creation conversation, preserving all collected fields (ruleType, name, address, amount, schedule, minBal, chain).",
    max_turns: 60,
  },
});
