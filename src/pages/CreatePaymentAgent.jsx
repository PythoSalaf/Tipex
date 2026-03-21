import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { GloveProvider, useGlove } from "glove-react";
import { FaRobot } from "react-icons/fa6";
import { IoSend, IoRefresh, IoChevronDown, IoChevronUp } from "react-icons/io5";
import { gloveClient, onModelSwitch } from "../lib/gloveClient";

// ── Tool name → friendly label ────────────────────────────────────────────────
const TOOL_LABELS = {
  choose_payment_type:    "Preparing payment options…",
  collect_recipient_info: "Preparing recipient form…",
  collect_payment_details:"Preparing payment details…",
  review_and_confirm:     "Preparing review summary…",
  create_agent_wallet:    "Creating agent wallet…",
  list_agents:            "Loading your agents…",
  check_balance:          "Fetching wallet balance…",
  agent_status:           "Checking agent health…",
  pause_agent:            "Pausing agent…",
  resume_agent:           "Resuming agent…",
  delete_agent:           "Preparing deletion…",
  edit_agent:             "Loading agent settings…",
  check_logs:             "Loading payment logs…",
  next_payment:           "Calculating schedules…",
};

const COMMANDS = [
  { icon: "🤖", label: "Create agent",  desc: "Set up a new autonomous payment",  msg: "I want to create a new payment agent", color: "hover:border-[#1ee3bf]/50 hover:bg-[#0a1f1a]" },
  { icon: "📋", label: "List agents",   desc: "View all your payment agents",      msg: "show me my agents",                   color: "hover:border-[#1ee3bf]/50 hover:bg-[#0a1f1a]" },
  { icon: "💰", label: "Check balance", desc: "USDC + ETH in an agent wallet",     msg: "check balance",                       color: "hover:border-blue-500/40 hover:bg-blue-500/5" },
  { icon: "📊", label: "Agent status",  desc: "Full health report for agents",     msg: "show me agent status",                color: "hover:border-purple-500/40 hover:bg-purple-500/5" },
  { icon: "⏸",  label: "Pause agent",  desc: "Pause an agent's payments",         msg: "pause an agent",                      color: "hover:border-yellow-500/40 hover:bg-yellow-500/5" },
  { icon: "▶",  label: "Resume agent", desc: "Restart a paused agent",            msg: "resume an agent",                     color: "hover:border-[#1ee3bf]/50 hover:bg-[#0a1f1a]" },
  { icon: "✏️",  label: "Edit agent",   desc: "Update amount or schedule",         msg: "I want to edit an agent",             color: "hover:border-orange-500/40 hover:bg-orange-500/5" },
  { icon: "🗑",  label: "Delete agent", desc: "Remove an agent permanently",       msg: "delete an agent",                     color: "hover:border-red-500/40 hover:bg-red-500/5" },
  { icon: "📜", label: "Payment logs",  desc: "View transaction history",          msg: "show payment logs",                   color: "hover:border-[#1ee3bf]/50 hover:bg-[#0a1f1a]" },
  { icon: "🕐", label: "Next payment",  desc: "See upcoming payment schedule",     msg: "when is the next payment",            color: "hover:border-[#1ee3bf]/50 hover:bg-[#0a1f1a]" },
];

// ── Inner chat UI ─────────────────────────────────────────────────────────────
function AgentChat() {
  const navigate = useNavigate();
  const { timeline, streamingText, busy, slots, sendMessage, renderSlot, renderToolResult } = useGlove();
  const [input, setInput] = useState("");
  const [cardOpen, setCardOpen] = useState(true);
  const [modelNotice, setModelNotice] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const hasGreeted = useRef(false);

  // Subscribe to model waterfall switches
  useEffect(() => {
    onModelSwitch((model) => {
      const label = model.includes("8b") ? "llama-3.1-8b-instant (fast)" : model;
      setModelNotice(`Rate limit hit — switched to ${label}`);
      setTimeout(() => setModelNotice(null), 8000);
    });
  }, []);

  // Auto-scroll on new content
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [timeline, streamingText, slots]);

  // Trigger greeting once on mount
  useEffect(() => {
    if (!hasGreeted.current) {
      hasGreeted.current = true;
      sendMessage("hello");
    }
  }, [sendMessage]);

  // Auto-collapse capabilities card once AI has responded
  const conversationStarted = timeline.some((e) => e.kind === "agent_text");
  useEffect(() => {
    if (conversationStarted) setCardOpen(false);
  }, [conversationStarted]);

  const submit = () => {
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    sendMessage(text);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submit(); }
  };

  // Find the currently-running tool name from timeline
  const runningTool = timeline.find((e) => e.kind === "tool" && e.status === "running");
  const runningLabel = runningTool ? (TOOL_LABELS[runningTool.toolName] || "Working…") : null;

  // Determine header status text
  const headerStatus = busy
    ? (runningLabel || "Thinking…")
    : "Payment Agent Assistant · Base Sepolia";

  return (
    <div className="w-full h-screen pt-14 text-white flex flex-col overflow-hidden bg-[#060a0f]">

      {/* Model-switch notice */}
      {modelNotice && (
        <div className="shrink-0 flex items-center gap-2 px-4 py-2 bg-yellow-500/10 border-b border-yellow-500/20 text-yellow-400 text-xs">
          <span>⚡</span>
          <span>{modelNotice}</span>
          <button onClick={() => setModelNotice(null)} className="ml-auto text-yellow-400/60 hover:text-yellow-400">✕</button>
        </div>
      )}

      {/* Header */}
      <div className="px-4 py-3 border-b border-[#1e2a35] bg-[#0a0f15] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className={`h-8 w-8 rounded-lg flex items-center justify-center transition-colors ${busy ? "bg-[#1ee3bf]/20" : "bg-[#1ee3bf]/10"}`}>
            <FaRobot className={`h-4 w-4 text-[#1ee3bf] ${busy ? "animate-spin" : ""}`} />
          </div>
          <div>
            <p className="text-sm font-semibold">Tipex AI</p>
            <p className={`text-xs transition-colors ${busy ? "text-[#1ee3bf]" : "text-[#687e8e]"}`}>
              {headerStatus}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.location.reload()}
            title="New conversation"
            className="flex items-center gap-1.5 text-[#687e8e] hover:text-white text-xs px-2.5 py-1.5 rounded-lg hover:bg-[#111820] transition-all"
          >
            <IoRefresh className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">New chat</span>
          </button>
          <button
            onClick={() => navigate(-1)}
            className="text-[#687e8e] hover:text-white text-xs px-2.5 py-1.5 rounded-lg hover:bg-[#111820] transition-all"
          >
            ← Back
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">

        {/* Capabilities card — collapsible */}
        <div className="bg-gradient-to-b from-[#0d1f1a] to-[#0d1117] border border-[#1ee3bf]/15 rounded-2xl overflow-hidden">
          <button
            onClick={() => setCardOpen((o) => !o)}
            className="w-full px-4 py-3 flex items-center justify-between hover:bg-white/[0.02] transition-colors"
          >
            <div className="flex items-center gap-2">
              <FaRobot className="h-4 w-4 text-[#1ee3bf]" />
              <span className="text-white text-sm font-semibold">What can Tipex AI do?</span>
            </div>
            {cardOpen
              ? <IoChevronUp className="h-4 w-4 text-[#687e8e]" />
              : <IoChevronDown className="h-4 w-4 text-[#687e8e]" />}
          </button>

          {cardOpen && (
            <>
              <div className="px-3 pb-3 grid grid-cols-2 gap-2">
                {COMMANDS.map((item) => (
                  <button
                    key={item.label}
                    disabled={busy}
                    onClick={() => { setInput(""); sendMessage(item.msg); }}
                    className={`flex items-center gap-3 px-3 py-3 bg-[#0a0f15] border border-[#1e2a35] rounded-xl text-left transition-all group disabled:opacity-40 disabled:cursor-not-allowed ${item.color}`}
                  >
                    <span className="text-lg shrink-0 group-hover:scale-110 transition-transform">{item.icon}</span>
                    <div className="min-w-0">
                      <p className="text-white text-xs font-semibold truncate">{item.label}</p>
                      <p className="text-[#687e8e] text-xs leading-tight truncate">{item.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
              <p className="text-[#2a3a4a] text-xs text-center pb-3">
                Or type naturally — e.g. "create a salary agent" or "check ken's balance"
              </p>
            </>
          )}
        </div>

        {/* Chat messages */}
        {(() => {
          // Skip the auto-greeting "hello" user bubble
          const visibleTimeline = timeline.filter((e, i) => !(i === 0 && e.kind === "user" && e.text?.toLowerCase() === "hello"));

          // When busy, pull the last user message before slots render
          const lastEntry = visibleTimeline[visibleTimeline.length - 1];
          const pendingUserEntry = busy && lastEntry?.kind === "user" ? lastEntry : null;
          const displayTimeline = pendingUserEntry ? visibleTimeline.slice(0, -1) : visibleTimeline;

          const isError = (text) => typeof text === "string" && (text.startsWith("Error:") || text.startsWith("Error "));

          const renderEntry = (entry, i) => {
            if (entry.kind === "user") {
              return (
                <div key={i} className="flex justify-end">
                  <div className="max-w-[78%] px-4 py-2.5 rounded-2xl rounded-tr-sm bg-[#1ee3bf] text-black text-sm font-medium leading-relaxed shadow-sm">
                    {entry.text}
                  </div>
                </div>
              );
            }

            if (entry.kind === "agent_text") {
              const error = isError(entry.text);
              return (
                <div key={i} className="flex justify-start gap-2">
                  <div className={`h-7 w-7 rounded-lg flex items-center justify-center mt-1 shrink-0 ${error ? "bg-red-500/10" : "bg-[#1ee3bf]/10"}`}>
                    <FaRobot className={`h-3.5 w-3.5 ${error ? "text-red-400" : "text-[#1ee3bf]"}`} />
                  </div>
                  <div className={`max-w-[78%] px-4 py-2.5 rounded-2xl rounded-tl-sm text-sm leading-relaxed ${
                    error
                      ? "bg-red-500/10 border border-red-500/30 text-red-300"
                      : "bg-[#111820] border border-[#1e2a35] text-[#d0dce8]"
                  }`}>
                    {error && <span className="text-red-400 font-semibold mr-1">⚠</span>}
                    {entry.text}
                  </div>
                </div>
              );
            }

            if (entry.kind === "tool") {
              if (entry.status !== "running" && entry.renderData !== undefined) {
                return (
                  <div key={i} className="flex justify-start gap-2">
                    <div className="h-7 w-7 rounded-lg bg-[#1ee3bf]/10 flex items-center justify-center mt-1 shrink-0">
                      <FaRobot className="h-3.5 w-3.5 text-[#1ee3bf]" />
                    </div>
                    <div className="max-w-[88%] w-full">{renderToolResult(entry)}</div>
                  </div>
                );
              }
              if (entry.status === "running") {
                const label = TOOL_LABELS[entry.toolName] || "Working…";
                return (
                  <div key={i} className="flex justify-start gap-2">
                    <div className="h-7 w-7 rounded-lg bg-[#1ee3bf]/10 flex items-center justify-center mt-1 shrink-0">
                      <FaRobot className="h-3.5 w-3.5 text-[#1ee3bf] animate-pulse" />
                    </div>
                    <div className="px-4 py-2.5 rounded-2xl rounded-tl-sm bg-[#111820] border border-[#1e2a35] flex items-center gap-2">
                      <span className="flex gap-1">
                        <span className="w-1.5 h-1.5 bg-[#1ee3bf] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="w-1.5 h-1.5 bg-[#1ee3bf] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="w-1.5 h-1.5 bg-[#1ee3bf] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                      </span>
                      <span className="text-[#687e8e] text-xs">{label}</span>
                    </div>
                  </div>
                );
              }
            }
            return null;
          };

          const slotsBlock = slots.length > 0 ? (
            <div className="flex justify-start gap-2">
              <div className="h-7 w-7 rounded-lg bg-[#1ee3bf]/10 flex items-center justify-center mt-1 shrink-0">
                <FaRobot className="h-3.5 w-3.5 text-[#1ee3bf]" />
              </div>
              <div className="max-w-[88%] w-full space-y-3">
                {slots.map((slot) => <div key={slot.id}>{renderSlot(slot)}</div>)}
              </div>
            </div>
          ) : null;

          return (
            <>
              {displayTimeline.map((entry, i) => renderEntry(entry, i))}

              {/* Stay slots before the pending user message */}
              {slotsBlock}

              {/* Pending user message */}
              {pendingUserEntry && renderEntry(pendingUserEntry, "pending")}

              {/* Streaming text */}
              {streamingText && (
                <div className="flex justify-start gap-2">
                  <div className="h-7 w-7 rounded-lg bg-[#1ee3bf]/10 flex items-center justify-center mt-1 shrink-0">
                    <FaRobot className="h-3.5 w-3.5 text-[#1ee3bf]" />
                  </div>
                  <div className="max-w-[78%] px-4 py-2.5 rounded-2xl rounded-tl-sm bg-[#111820] border border-[#1e2a35] text-[#d0dce8] text-sm leading-relaxed">
                    {streamingText}
                    <span className="inline-block w-0.5 h-3.5 bg-[#1ee3bf] animate-pulse ml-0.5 align-middle rounded-full" />
                  </div>
                </div>
              )}

              {/* Thinking dots — only when busy and nothing else showing */}
              {busy && !streamingText && slots.length === 0 && !runningTool && (
                <div className="flex justify-start gap-2">
                  <div className="h-7 w-7 rounded-lg bg-[#1ee3bf]/10 flex items-center justify-center mt-1 shrink-0">
                    <FaRobot className="h-3.5 w-3.5 text-[#1ee3bf] animate-pulse" />
                  </div>
                  <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-[#111820] border border-[#1e2a35] flex items-center gap-2">
                    <span className="flex gap-1">
                      <span className="w-1.5 h-1.5 bg-[#687e8e] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-1.5 h-1.5 bg-[#687e8e] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-1.5 h-1.5 bg-[#687e8e] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </span>
                    <span className="text-[#3a4a5a] text-xs">Thinking…</span>
                  </div>
                </div>
              )}
            </>
          );
        })()}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="px-4 pt-2 pb-3 border-t border-[#1e2a35] bg-[#0a0f15] shrink-0 space-y-2">
        <div className={`flex items-center gap-3 bg-[#0d1117] border rounded-2xl px-4 py-2.5 transition-colors ${busy ? "border-[#1e2a35] opacity-70" : "border-[#1e2a35] focus-within:border-[#1ee3bf]/40"}`}>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={busy}
            placeholder={
              busy
                ? (runningLabel || "Tipex AI is working…")
                : "Ask anything — type a command or question"
            }
            className="flex-1 bg-transparent outline-none text-sm text-white placeholder:text-[#3a4a5a] disabled:cursor-not-allowed"
          />
          <button
            onClick={submit}
            disabled={!input.trim() || busy}
            className="h-8 w-8 rounded-xl bg-[#1ee3bf] text-black flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#17c9aa] active:scale-95 transition-all shrink-0"
          >
            <IoSend className="h-3.5 w-3.5" />
          </button>
        </div>
        <p className="text-[#1e2a35] text-xs text-center">
          Powered by Glove · WDK · Base Sepolia
        </p>
      </div>
    </div>
  );
}

// ── Page wrapper ──────────────────────────────────────────────────────────────
const CreatePaymentAgent = () => (
  <GloveProvider client={gloveClient}>
    <AgentChat />
  </GloveProvider>
);

export default CreatePaymentAgent;
