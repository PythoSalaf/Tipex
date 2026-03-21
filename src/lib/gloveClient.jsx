import { GloveClient, defineTool, createRemoteModel, MemoryStore } from "glove-react";
import { z } from "zod";
import { getAgents, saveAgents } from "./agentStore";
import { initEvmWallet } from "./wdkWallet";

// ── Groq (fetch-based, browser-safe) ─────────────────────────────────────────
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_MODEL = "llama-3.3-70b-versatile";

async function groqChat(messages, tools) {
  const body = {
    model: GROQ_MODEL,
    messages,
    max_tokens: 1024,
    stream: false,
  };
  if (tools?.length) {
    body.tools = tools;
    body.tool_choice = "auto";
  }
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${GROQ_API_KEY}`,
    },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Groq ${res.status}: ${err}`);
  }
  const data = await res.json();

  // Fallback: parse Llama native <function=name({...})> format from text
  const msg = data.choices?.[0]?.message;
  if (msg && !msg.tool_calls?.length && msg.content) {
    const nativeCalls = parseLlamaFunctionCalls(msg.content);
    if (nativeCalls.length > 0) {
      msg.tool_calls = nativeCalls;
      msg.content = msg.content.replace(/<function=\w+\([\s\S]*?\)>/g, "").trim() || null;
    }
  }

  return data;
}

// Parse Llama's native <function=tool_name({"key":"val"})> format
function parseLlamaFunctionCalls(text) {
  const calls = [];
  const regex = /<function=(\w+)\(([\s\S]*?)\)>/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    const name = match[1];
    let args = {};
    try { args = JSON.parse(match[2]); } catch { /* leave empty */ }
    calls.push({
      id: `tool_${Date.now()}_${calls.length}`,
      type: "function",
      function: { name, arguments: JSON.stringify(args) },
    });
  }
  return calls;
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
const tipexModel = createRemoteModel(GROQ_MODEL, {
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

    if (msg?.content) {
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
    let name = "";
    let address = "";
    const submit = () => {
      if (!name.trim() || !address.trim()) return;
      if (!address.startsWith("0x") || address.length !== 42) {
        alert("Invalid wallet address. Must start with 0x and be 42 characters.");
        return;
      }
      resolve({ name: name.trim(), address: address.trim() });
    };
    return (
      <div className="space-y-3">
        <p className="text-white text-sm font-medium">{props.instruction}</p>
        <div className="space-y-2">
          <div className="bg-[#0a0f15] border border-[#1e2a35] rounded-xl px-3 py-2.5 focus-within:border-[#1ee3bf]/40 transition-colors">
            <label className="text-[#687e8e] text-xs block mb-1">Recipient Name</label>
            <input
              type="text"
              placeholder="e.g. John Smith"
              className="w-full bg-transparent outline-none text-white text-sm placeholder:text-[#3a4a5a]"
              onChange={(e) => { name = e.target.value; }}
            />
          </div>
          <div className="bg-[#0a0f15] border border-[#1e2a35] rounded-xl px-3 py-2.5 focus-within:border-[#1ee3bf]/40 transition-colors">
            <label className="text-[#687e8e] text-xs block mb-1">Wallet Address</label>
            <input
              type="text"
              placeholder="0x..."
              className="w-full bg-transparent outline-none text-white text-sm font-mono placeholder:text-[#3a4a5a]"
              onChange={(e) => { address = e.target.value; }}
            />
          </div>
        </div>
        <button
          onClick={submit}
          className="w-full bg-[#1ee3bf] text-black font-semibold py-2.5 rounded-xl text-sm hover:bg-[#17c9aa] transition-all"
        >
          Continue →
        </button>
      </div>
    );
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
    "Show a form to collect the USDT amount, schedule frequency, and minimum balance threshold.",
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
      data: `Amount: ${details.amount} USDT, Schedule: ${details.schedule}, Min balance: ${details.minBal} USDT`,
      renderData: details,
    };
  },
  render({ props, resolve }) {
    let amount = "";
    let schedule = "monthly";
    let minBal = "";
    const scheduleOptions = ["daily", "weekly", "monthly", "yearly"];
    const submit = () => {
      const amt = parseFloat(amount);
      const min = parseFloat(minBal);
      if (!amt || amt <= 0) return;
      if (!min || min <= 0) return;
      resolve({ amount: amt, schedule, minBal: min });
    };
    return (
      <div className="space-y-3">
        <p className="text-white text-sm font-medium">{props.instruction}</p>
        <div className="space-y-2">
          <div className="bg-[#0a0f15] border border-[#1e2a35] rounded-xl px-3 py-2.5 focus-within:border-[#1ee3bf]/40 transition-colors">
            <label className="text-[#687e8e] text-xs block mb-1">Amount (USDT)</label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              placeholder="e.g. 1200"
              className="w-full bg-transparent outline-none text-white text-sm placeholder:text-[#3a4a5a]"
              onChange={(e) => { amount = e.target.value; }}
            />
          </div>
          <div className="bg-[#0a0f15] border border-[#1e2a35] rounded-xl px-3 py-2.5">
            <label className="text-[#687e8e] text-xs block mb-1">Schedule</label>
            <div className="flex gap-2 flex-wrap mt-1">
              {scheduleOptions.map((s) => (
                <button
                  key={s}
                  onClick={() => { schedule = s; }}
                  className="px-3 py-1 rounded-lg text-xs border border-[#1e2a35] text-[#687e8e] hover:border-[#1ee3bf]/50 hover:text-[#1ee3bf] capitalize transition-all"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div className="bg-[#0a0f15] border border-[#1e2a35] rounded-xl px-3 py-2.5 focus-within:border-[#1ee3bf]/40 transition-colors">
            <label className="text-[#687e8e] text-xs block mb-1">Min Balance (USDT) — agent won't pay below this</label>
            <input
              type="number"
              min="0"
              step="1"
              placeholder="e.g. 2000"
              className="w-full bg-transparent outline-none text-white text-sm placeholder:text-[#3a4a5a]"
              onChange={(e) => { minBal = e.target.value; }}
            />
          </div>
        </div>
        <button
          onClick={submit}
          className="w-full bg-[#1ee3bf] text-black font-semibold py-2.5 rounded-xl text-sm hover:bg-[#17c9aa] transition-all"
        >
          Continue →
        </button>
      </div>
    );
  },
  renderResult({ data }) {
    const { amount, schedule, minBal } = data;
    return (
      <div className="flex items-center gap-3 px-3 py-2 bg-[#0a1f1a] border border-[#1ee3bf]/30 rounded-xl text-sm">
        <span className="text-[#1ee3bf] font-semibold">{amount} USDT</span>
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
    amount: z.number().describe("USDT amount per payment"),
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
      ["Amount", `${props.amount} USDT`],
      ["Schedule", props.schedule],
      ["Min Balance", `${props.minBal} USDT`],
      ["Chain", props.chain],
    ];
    return (
      <div className="space-y-3">
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
  displayStrategy: "stay",
  async do(input, display) {
    const seed = localStorage.getItem("seed");
    if (!seed) {
      return { status: "error", data: null, message: "No wallet connected. Please connect first." };
    }

    const { wdk } = initEvmWallet(seed);
    const agents = getAgents();
    // Use max existing walletIndex + 1 to avoid collisions when agents are deleted/recreated
    const walletIndex = agents.length > 0 
      ? Math.max(...agents.map(a => a.walletIndex || 0)) + 1 
      : 1;
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

    await display.pushAndForget(displayData);

    return {
      status: "success",
      data: `Agent wallet created successfully! Wallet address: ${agentWalletAddress}. The agent is now active and will autonomously execute ${input.ruleType} payments of ${input.amount} USDT to ${input.name} on a ${input.schedule} basis. Fund the agent wallet to activate it.`,
      renderData: displayData,
    };
  },
  render({ props }) {
    const copy = () => navigator.clipboard.writeText(props.agentWalletAddress);
    return (
      <div className="bg-[#0a1f1a] border border-[#1ee3bf]/30 rounded-2xl p-4 space-y-3">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-[#1ee3bf]/10 flex items-center justify-center text-base">🤖</div>
          <div>
            <p className="text-white text-sm font-semibold">Agent Created!</p>
            <p className="text-[#687e8e] text-xs capitalize">{props.ruleType} · {props.amount} USDT · {props.schedule}</p>
          </div>
        </div>
        <div className="bg-[#0d1117] border border-[#1e2a35] rounded-xl p-3">
          <p className="text-[#687e8e] text-xs mb-1.5">Agent Wallet — fund this to activate</p>
          <div className="flex items-center gap-2">
            <p className="text-white text-xs font-mono break-all flex-1">{props.agentWalletAddress}</p>
            <button onClick={copy} className="text-[#687e8e] hover:text-[#1ee3bf] transition-colors shrink-0 text-xs">
              Copy
            </button>
          </div>
        </div>
        <a
          href={`https://sepolia.basescan.org/address/${props.agentWalletAddress}`}
          target="_blank"
          rel="noreferrer"
          className="block text-center text-xs text-[#687e8e] hover:text-[#1ee3bf] transition-colors"
        >
          View on Basescan ↗
        </a>
      </div>
    );
  },
  renderResult({ data }) {
    if (!data) return null;
    const d = data;
    return (
      <div className="px-3 py-2 bg-[#0a1f1a] border border-[#1ee3bf]/30 rounded-xl text-xs text-[#1ee3bf]">
        ✓ Agent wallet: {String(d.agentWalletAddress).slice(0, 10)}…{String(d.agentWalletAddress).slice(-6)}
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
    const summary = agents.map(a => `${a.name} (${a.ruleType}, ${a.amount} USDT ${a.schedule}, wallet: ${a.agentWalletAddress}, ${a.active ? "active" : "paused"})`).join("; ");
    return { status: "success", data: `User has ${agents.length} agent(s): ${summary}`, renderData: { agents } };
  },
  render({ props }) {
    const { agents } = props;
    if (!agents.length) {
      return (
        <div className="px-4 py-3 bg-[#0d1117] border border-[#1e2a35] rounded-2xl text-[#687e8e] text-sm">
          You have no agents yet. Let's create your first one!
        </div>
      );
    }
    return (
      <div className="space-y-2">
        <p className="text-white text-sm font-semibold mb-1">Your Payment Agents ({agents.length})</p>
        {agents.map((a) => (
          <div key={a.id} className="bg-[#0d1117] border border-[#1e2a35] rounded-xl p-3 space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-white text-sm font-semibold">{a.name}</span>
                <span className="text-[#687e8e] text-xs capitalize">{a.ruleType}</span>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full ${a.active ? "bg-[#1ee3bf]/10 text-[#1ee3bf]" : "bg-yellow-500/10 text-yellow-400"}`}>
                {a.active ? "Active" : "Paused"}
              </span>
            </div>
            <p className="text-[#687e8e] text-xs">{a.amount} USDT · {a.schedule}</p>
            <p className="text-[#3a4a5a] text-xs font-mono truncate">{a.agentWalletAddress}</p>
          </div>
        ))}
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

// ── System prompt ─────────────────────────────────────────────────────────────
const SYSTEM_PROMPT = `You are Tipex AI — an autonomous payment agent creation assistant for the Tipex platform, built on Base Sepolia testnet using Tether's WDK (Wallet Development Kit).

Your job is to guide users through creating autonomous on-chain USDT payment agents. Each agent gets its own dedicated WDK wallet and executes payments automatically based on rules.

## Your workflow — follow this exact sequence:

1. Greet the user warmly (1-2 sentences). Ask what kind of payment they want to automate.
2. Call \`choose_payment_type\` immediately — do not describe options in text, use the tool.
3. Once they choose a type, call \`collect_recipient_info\` to get the recipient name and wallet address.
4. Then call \`collect_payment_details\` to get amount, schedule, and minimum balance.
5. Then call \`review_and_confirm\` with all collected data — always use chain: "Base".
6. If approved, call \`create_agent_wallet\` immediately with the same data.
7. After wallet creation, tell the user to fund the agent wallet to activate it. Keep it brief (1 sentence).

## Rules:
- NEVER list options or collect info via plain text — always use the appropriate tool.
- After the user picks a type or fills a form, briefly acknowledge in 1 sentence, then call the next tool.
- chain is always "Base" (Base Sepolia testnet).
- If the user asks about their agents or wants to see them, call \`list_agents\` immediately.
- If the user asks a question mid-flow, answer briefly then continue with the next tool.
- Responses between tool calls: 1-2 sentences max.

Available tools:
- list_agents: Show all the user's existing payment agents
- choose_payment_type: Show 4 payment type buttons (salary, gift, subscription, conditional)
- collect_recipient_info: Form for recipient name + wallet address
- collect_payment_details: Form for USDT amount, schedule, min balance
- review_and_confirm: Full plan summary for user approval (requires all 7 fields)
- create_agent_wallet: Creates WDK wallet and saves agent (call only after approval)`;

// ── GloveClient export ────────────────────────────────────────────────────────
export const gloveClient = new GloveClient({
  createModel: () => tipexModel,
  createStore: (sessionId) => new MemoryStore(sessionId),
  systemPrompt: SYSTEM_PROMPT,
  tools: [
    listAgentsTool,
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
