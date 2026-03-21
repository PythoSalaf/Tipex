import { useState } from "react";
import { MdContentCopy, MdCheckCircle, MdClose } from "react-icons/md";
import { BsShieldLock } from "react-icons/bs";
import { IoWarning } from "react-icons/io5";

const SeedPhraseModal = ({ seed, onConfirm, onCancel }) => {
  const [copied, setCopied] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const words = seed.trim().split(" ");

  const handleCopy = () => {
    navigator.clipboard.writeText(seed);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative w-full max-w-md bg-[#0d1117] border border-[#1e2a35] rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-[#0a1520] px-6 pt-6 pb-4 border-b border-[#1e2a35]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 mb-1">
              <div className="h-9 w-9 rounded-xl bg-[#1ee3bf]/10 flex items-center justify-center">
                <BsShieldLock className="h-5 w-5 text-[#1ee3bf]" />
              </div>
              <div>
                <h2 className="text-white font-semibold text-base">
                  Your Seed Phrase
                </h2>
                <p className="text-[#687e8e] text-xs">
                  Wallet created on Base Sepolia
                </p>
              </div>
            </div>
            <button
              onClick={onCancel}
              className="text-[#687e8e] hover:text-white transition-colors p-1 rounded-lg hover:bg-[#1e2a35]"
            >
              <MdClose className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="px-6 py-5 space-y-4">
          {/* Warning */}
          <div className="flex items-start gap-2.5 bg-yellow-500/10 border border-yellow-500/20 rounded-xl px-4 py-3">
            <IoWarning className="text-yellow-400 h-4 w-4 shrink-0 mt-0.5" />
            <p className="text-yellow-300 text-xs leading-relaxed">
              Write this down and store it safely. Anyone with this phrase can
              access your wallet. We cannot recover it for you.
            </p>
          </div>

          {/* Seed word grid */}
          <div className="grid grid-cols-3 gap-2">
            {words.map((word, i) => (
              <div
                key={i}
                className="flex items-center gap-1.5 bg-[#111820] border border-[#1e2a35] rounded-lg px-2.5 py-1.5"
              >
                <span className="text-[#3a4a5a] text-xs w-4 text-right shrink-0">
                  {i + 1}.
                </span>
                <span className="text-white text-xs font-medium">{word}</span>
              </div>
            ))}
          </div>

          {/* Copy button */}
          <button
            onClick={handleCopy}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-[#1e2a35] text-[#687e8e] hover:border-[#1ee3bf]/40 hover:text-[#1ee3bf] transition-all text-sm"
          >
            {copied ? (
              <>
                <MdCheckCircle className="h-4 w-4 text-[#1ee3bf]" />
                <span className="text-[#1ee3bf]">Copied!</span>
              </>
            ) : (
              <>
                <MdContentCopy className="h-4 w-4" />
                Copy seed phrase
              </>
            )}
          </button>

          {/* Confirmation checkbox */}
          <label className="flex items-start gap-2.5 cursor-pointer group">
            <div className="relative mt-0.5 shrink-0">
              <input
                type="checkbox"
                className="sr-only"
                checked={confirmed}
                onChange={(e) => setConfirmed(e.target.checked)}
              />
              <div
                className={`h-4 w-4 rounded border transition-all ${confirmed ? "bg-[#1ee3bf] border-[#1ee3bf]" : "border-[#3a4a5a] bg-transparent"} flex items-center justify-center`}
              >
                {confirmed && (
                  <MdCheckCircle className="h-3.5 w-3.5 text-black" />
                )}
              </div>
            </div>
            <span className="text-[#687e8e] text-xs leading-relaxed group-hover:text-white transition-colors">
              I have saved my seed phrase in a safe place and understand I
              cannot recover it if lost.
            </span>
          </label>

          {/* CTA */}
          <button
            onClick={onConfirm}
            disabled={!confirmed}
            className="w-full bg-[#1ee3bf] text-black font-semibold py-2.5 rounded-xl text-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#17c9aa]"
          >
            I've saved it — Continue
          </button>
        </div>
      </div>
    </div>
  );
};

export default SeedPhraseModal;
