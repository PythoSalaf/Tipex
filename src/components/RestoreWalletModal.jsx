import { useState, useRef } from "react";
import { BsShieldLock } from "react-icons/bs";
import { MdClose } from "react-icons/md";
import { IoWarning } from "react-icons/io5";
import { FaEye, FaEyeSlash } from "react-icons/fa";

const RestoreWalletModal = ({ onRestore, onClose, loading, error: externalError }) => {
  const [words, setWords] = useState(Array(12).fill(""));
  const [revealed, setRevealed] = useState(false);
  const [error, setError] = useState("");
  const inputRefs = useRef([]);

  const handleChange = (index, value) => {
    // Strip extra spaces from single word input
    const cleaned = value.trim().replace(/\s+/g, " ");
    const updated = [...words];
    updated[index] = cleaned;
    setWords(updated);
    setError("");
  };

  // When user pastes anywhere in the grid, auto-fill all 24 boxes
  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").trim();
    const pastedWords = pasted.split(/\s+/);
    if (pastedWords.length >= 12) {
      const updated = Array(12).fill("");
      pastedWords.slice(0, 12).forEach((w, i) => {
        updated[i] = w;
      });
      setWords(updated);
      setError("");
      // Focus last filled input
      const lastIndex = Math.min(pastedWords.length - 1, 11);
      inputRefs.current[lastIndex]?.focus();
    }
  };

  // Tab to next input
  const handleKeyDown = (e, index) => {
    if (e.key === "Tab" || e.key === " " || e.key === "Enter") {
      e.preventDefault();
      const next = inputRefs.current[index + 1];
      if (next) next.focus();
    }
  };

  const handleSubmit = () => {
    const filled = words.filter((w) => w.trim() !== "");
    if (filled.length !== 12) {
      setError(`Please fill all 12 words. You have ${filled.length} so far.`);
      return;
    }
    onRestore(words.join(" "));
  };

  const isReady = words.every((w) => w.trim() !== "");

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/75 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-[#0d1117] border border-[#1e2a35] rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-[#1e2a35] shrink-0">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-[#1ee3bf]/10 flex items-center justify-center">
              <BsShieldLock className="h-5 w-5 text-[#1ee3bf]" />
            </div>
            <div>
              <h2 className="text-white font-semibold text-base">Restore Wallet</h2>
              <p className="text-[#687e8e] text-xs">Enter your 12-word seed phrase</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[#687e8e] hover:text-white transition-colors p-1 rounded-lg hover:bg-[#1e2a35]"
          >
            <MdClose className="h-5 w-5" />
          </button>
        </div>

        {/* Body — scrollable */}
        <div className="overflow-y-auto px-6 py-5 space-y-4">
          {/* Warning */}
          <div className="flex items-start gap-2.5 bg-yellow-500/10 border border-yellow-500/20 rounded-xl px-4 py-3">
            <IoWarning className="text-yellow-400 h-4 w-4 shrink-0 mt-0.5" />
            <p className="text-yellow-300 text-xs leading-relaxed">
              Never share your seed phrase. Tipex will never ask for it outside this screen.
            </p>
          </div>

          {/* Reveal / hide toggle + paste hint */}
          <div className="flex items-center justify-between">
            <p className="text-[#687e8e] text-xs">
              You can paste your full phrase into any box
            </p>
            <button
              onClick={() => setRevealed(!revealed)}
              className="flex items-center gap-1.5 text-xs text-[#687e8e] hover:text-[#1ee3bf] transition-colors"
            >
              {revealed
                ? <><FaEyeSlash className="h-3.5 w-3.5" /> Hide</>
                : <><FaEye className="h-3.5 w-3.5" /> Show</>}
            </button>
          </div>

          {/* 24-word grid */}
          <div className="grid grid-cols-3 gap-2">
            {words.map((word, i) => (
              <div
                key={i}
                className="flex items-center gap-1.5 bg-[#0a0f15] border border-[#1e2a35] rounded-xl px-2.5 py-2 focus-within:border-[#1ee3bf]/60 transition-colors"
              >
                <span className="text-[#3a4a5a] text-xs w-5 text-right shrink-0 select-none">
                  {i + 1}.
                </span>
                <input
                  ref={(el) => (inputRefs.current[i] = el)}
                  type={revealed ? "text" : "password"}
                  value={word}
                  onChange={(e) => handleChange(i, e.target.value)}
                  onPaste={handlePaste}
                  onKeyDown={(e) => handleKeyDown(e, i)}
                  autoComplete="off"
                  spellCheck={false}
                  className="flex-1 bg-transparent outline-none text-white text-xs font-medium w-full placeholder:text-[#2a3a4a]"
                  placeholder="word"
                />
              </div>
            ))}
          </div>

          {/* Error — local validation or external (from WDK) */}
          {(error || externalError) && (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
              <span className="text-red-400 text-xs">{externalError || error}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 pb-5 pt-3 border-t border-[#1e2a35] shrink-0 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 border border-[#1e2a35] text-[#687e8e] hover:text-white hover:border-[#3a4a5a] py-2.5 rounded-xl text-sm font-semibold transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!isReady || loading}
            className="flex-1 bg-[#1ee3bf] text-black font-semibold py-2.5 rounded-xl text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#17c9aa]"
          >
            {loading ? "Restoring..." : "Restore Wallet"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default RestoreWalletModal;
