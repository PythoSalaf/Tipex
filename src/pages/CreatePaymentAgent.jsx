import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { GloveProvider, useGlove } from "glove-react";
import { FaRobot } from "react-icons/fa6";
import { IoSend } from "react-icons/io5";
import { gloveClient } from "../lib/gloveClient";

// ── Inner chat UI (uses useGlove inside GloveProvider) ───────────────────────
function AgentChat() {
  const navigate = useNavigate();
  const { timeline, streamingText, busy, slots, sendMessage, renderSlot, renderToolResult } = useGlove();
  const [input, setInput] = useState("");
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const hasGreeted = useRef(false);

  // Auto-scroll
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

  const submit = () => {
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    sendMessage(text);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div className="w-full h-screen pt-14 text-white flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-[#1e2a35] bg-[#0a0f15] flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-[#1ee3bf]/10 flex items-center justify-center">
            <FaRobot className="h-4 w-4 text-[#1ee3bf] animate-pulse" />
          </div>
          <div>
            <p className="text-sm font-semibold">Tipex AI</p>
            <p className="text-[#687e8e] text-xs">
              {busy ? "Thinking…" : "Payment Agent Assistant · Base Sepolia"}
            </p>
          </div>
        </div>
        <button
          onClick={() => navigate(-1)}
          className="text-[#687e8e] hover:text-white text-xs transition-colors"
        >
          ← Back
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">

        {/* Capabilities card — always shown at top */}
        <div className="bg-gradient-to-b from-[#0d1f1a] to-[#0d1117] border border-[#1ee3bf]/15 rounded-2xl overflow-hidden">
          {/* Header */}
          <div className="px-4 pt-4 pb-3 flex items-center gap-3 border-b border-[#1e2a35]">
            <div className="h-10 w-10 rounded-xl bg-[#1ee3bf]/10 border border-[#1ee3bf]/20 flex items-center justify-center shrink-0">
              <FaRobot className="h-5 w-5 text-[#1ee3bf]" />
            </div>
            <div>
              <p className="text-white text-sm font-bold">What can I help you with?</p>
              <p className="text-[#687e8e] text-xs">Click a command or type naturally below</p>
            </div>
          </div>

          {/* Command buttons */}
          <div className="p-3 grid grid-cols-2 gap-2">
            {[
              { icon: "🤖", label: "Create agent",   desc: "Set up a new autonomous payment", msg: "I want to create a new payment agent", color: "hover:border-[#1ee3bf]/50 hover:bg-[#0a1f1a]" },
              { icon: "📋", label: "List agents",    desc: "View all your payment agents",    msg: "show me my agents",                  color: "hover:border-[#1ee3bf]/50 hover:bg-[#0a1f1a]" },
              { icon: "💰", label: "Check balance",  desc: "USDC + ETH in an agent wallet",   msg: "check balance",                      color: "hover:border-blue-500/40 hover:bg-blue-500/5" },
              { icon: "📊", label: "Agent status",   desc: "Full health report for agents",   msg: "show me agent status",               color: "hover:border-purple-500/40 hover:bg-purple-500/5" },
              { icon: "⏸", label: "Pause agent",    desc: "Pause an agent's payments",       msg: "pause an agent",                     color: "hover:border-yellow-500/40 hover:bg-yellow-500/5" },
              { icon: "▶", label: "Resume agent",   desc: "Restart a paused agent",          msg: "resume an agent",                    color: "hover:border-[#1ee3bf]/50 hover:bg-[#0a1f1a]" },
              { icon: "✏️", label: "Edit agent",     desc: "Update amount or schedule",       msg: "I want to edit an agent",            color: "hover:border-orange-500/40 hover:bg-orange-500/5" },
              { icon: "🗑", label: "Delete agent",   desc: "Remove an agent permanently",     msg: "delete an agent",                    color: "hover:border-red-500/40 hover:bg-red-500/5" },
              { icon: "📜", label: "Payment logs",   desc: "View transaction history",        msg: "show payment logs",                  color: "hover:border-[#1ee3bf]/50 hover:bg-[#0a1f1a]" },
              { icon: "🕐", label: "Next payment",   desc: "See upcoming payment schedule",   msg: "when is the next payment",           color: "hover:border-[#1ee3bf]/50 hover:bg-[#0a1f1a]" },
            ].map((item) => (
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
        </div>

        {(() => {
          // When busy, pull the last user message out so slots render before it
          const lastEntry = timeline[timeline.length - 1];
          const pendingUserEntry = busy && lastEntry?.kind === "user" ? lastEntry : null;
          const visibleTimeline = pendingUserEntry ? timeline.slice(0, -1) : timeline;

          const renderEntry = (entry, i) => {
            if (entry.kind === "user") {
              return (
                <div key={i} className="flex justify-end">
                  <div className="max-w-[78%] px-4 py-2.5 rounded-2xl rounded-tr-sm bg-[#1ee3bf] text-black text-sm font-medium leading-relaxed">
                    {entry.text}
                  </div>
                </div>
              );
            }
            if (entry.kind === "agent_text") {
              return (
                <div key={i} className="flex justify-start gap-2">
                  <div className="h-7 w-7 rounded-lg bg-[#1ee3bf]/10 flex items-center justify-center mt-1 shrink-0">
                    <FaRobot className="h-3.5 w-3.5 text-[#1ee3bf]" />
                  </div>
                  <div className="max-w-[78%] px-4 py-2.5 rounded-2xl rounded-tl-sm bg-[#111820] border border-[#1e2a35] text-[#d0dce8] text-sm leading-relaxed">
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
                    <div className="max-w-[78%]">{renderToolResult(entry)}</div>
                  </div>
                );
              }
              if (entry.status === "running") {
                return (
                  <div key={i} className="flex justify-start gap-2">
                    <div className="h-7 w-7 rounded-lg bg-[#1ee3bf]/10 flex items-center justify-center mt-1 shrink-0">
                      <FaRobot className="h-3.5 w-3.5 text-[#1ee3bf]" />
                    </div>
                    <div className="px-4 py-2.5 rounded-2xl rounded-tl-sm bg-[#111820] border border-[#1e2a35]">
                      <span className="flex gap-1 py-1">
                        <span className="w-1.5 h-1.5 bg-[#687e8e] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                        <span className="w-1.5 h-1.5 bg-[#687e8e] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                        <span className="w-1.5 h-1.5 bg-[#687e8e] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                      </span>
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
                {slots.map((slot) => (
                  <div key={slot.id}>{renderSlot(slot)}</div>
                ))}
              </div>
            </div>
          ) : null;

          return (
            <>
              {visibleTimeline.map((entry, i) => renderEntry(entry, i))}

              {/* Stay slots appear here — before the pending user message */}
              {slotsBlock}

              {/* The user message that triggered current processing */}
              {pendingUserEntry && renderEntry(pendingUserEntry, "pending")}

              {/* Streaming text */}
              {streamingText && (
                <div className="flex justify-start gap-2">
                  <div className="h-7 w-7 rounded-lg bg-[#1ee3bf]/10 flex items-center justify-center mt-1 shrink-0">
                    <FaRobot className="h-3.5 w-3.5 text-[#1ee3bf]" />
                  </div>
                  <div className="max-w-[78%] px-4 py-2.5 rounded-2xl rounded-tl-sm bg-[#111820] border border-[#1e2a35] text-[#d0dce8] text-sm leading-relaxed">
                    {streamingText}
                    <span className="inline-block w-1 h-3.5 bg-[#1ee3bf] animate-pulse ml-0.5 align-middle" />
                  </div>
                </div>
              )}

              {/* Loading dots when busy but no streaming/slots yet */}
              {busy && !streamingText && slots.length === 0 && (
                <div className="flex justify-start gap-2">
                  <div className="h-7 w-7 rounded-lg bg-[#1ee3bf]/10 flex items-center justify-center mt-1 shrink-0">
                    <FaRobot className="h-3.5 w-3.5 text-[#1ee3bf]" />
                  </div>
                  <div className="px-4 py-3 rounded-2xl rounded-tl-sm bg-[#111820] border border-[#1e2a35]">
                    <span className="flex gap-1">
                      <span className="w-1.5 h-1.5 bg-[#687e8e] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                      <span className="w-1.5 h-1.5 bg-[#687e8e] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                      <span className="w-1.5 h-1.5 bg-[#687e8e] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                    </span>
                  </div>
                </div>
              )}
            </>
          );
        })()}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-[#1e2a35] bg-[#0a0f15] shrink-0">
        <div className="flex items-center gap-3 bg-[#0d1117] border border-[#1e2a35] rounded-2xl px-4 py-2.5 focus-within:border-[#1ee3bf]/40 transition-colors">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={busy}
            placeholder={busy ? "Tipex AI is thinking…" : "Type a message or answer a question…"}
            className="flex-1 bg-transparent outline-none text-sm text-white placeholder:text-[#3a4a5a] disabled:opacity-50"
          />
          <button
            onClick={submit}
            disabled={!input.trim() || busy}
            className="h-8 w-8 rounded-xl bg-[#1ee3bf] text-black flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed hover:bg-[#17c9aa] transition-all shrink-0"
          >
            <IoSend className="h-3.5 w-3.5" />
          </button>
        </div>
        <p className="text-[#2a3a4a] text-xs text-center mt-2">
          Powered by Glove · WDK · Base Sepolia
        </p>
      </div>
    </div>
  );
}

// ── Page wrapper with GloveProvider ──────────────────────────────────────────
const CreatePaymentAgent = () => {
  return (
    <GloveProvider client={gloveClient}>
      <AgentChat />
    </GloveProvider>
  );
};

export default CreatePaymentAgent;
