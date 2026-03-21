import { useState, useEffect, useRef } from "react";
import { Link, NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import { FaRobot } from "react-icons/fa6";
import { PiWalletFill } from "react-icons/pi";
import { MdMenu, MdClose, MdContentCopy, MdCheckCircle, MdLogout } from "react-icons/md";
import { RiExternalLinkLine } from "react-icons/ri";
import { IoChevronDown } from "react-icons/io5";

import { createWallet } from "../lib/createWallet";
import { loadWallet } from "../lib/loadWallet";
import { restoreWallet } from "../lib/restoreWallet";
import { initEvmWallet } from "../lib/wdkWallet";
import { getUSDTBalance, getETHBalance } from "../lib/getBalance";
import { getAgents } from "../lib/agentStore";
import SeedPhraseModal from "./SeedPhraseModal";
import RestoreWalletModal from "./RestoreWalletModal";

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [address, setAddress] = useState("");
  const [showRestore, setShowRestore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newSeed, setNewSeed] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [copied, setCopied] = useState(false);
  const [balances, setBalances] = useState({ usdc: null, eth: null, loadingBal: false });
  const dropdownRef = useRef(null);

  // ✅ load wallet on start
  useEffect(() => {
    async function init() {
      const wallet = await loadWallet();

      if (wallet) {
        setAddress(wallet.address);
      }
    }

    init();
  }, []);

  // ✅ create wallet
  const handleCreate = async () => {
    if (address) {
      alert("Wallet already connected");
      return;
    }

    setLoading(true);
    const res = await createWallet();
    setAddress(res.address);
    setLoading(false);
    setNewSeed(res.seed);
  };

  // ✅ close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ✅ fetch balances when dropdown opens
  const handleToggleDropdown = async () => {
    const next = !showDropdown;
    setShowDropdown(next);
    if (next && address) {
      setBalances((b) => ({ ...b, loadingBal: true }));
      try {
        const seed = localStorage.getItem("seed");
        if (seed) {
          const { wdk } = initEvmWallet(seed);
          const account = await wdk.getAccount("ethereum", 0);
          const [usdc, eth] = await Promise.all([getUSDTBalance(account), getETHBalance(account)]);
          setBalances({ usdc, eth, loadingBal: false });
        }
      } catch {
        setBalances({ usdc: null, eth: null, loadingBal: false });
      }
    }
  };

  // ✅ copy address
  const handleCopyAddress = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ✅ disconnect wallet
  const handleDisconnect = () => {
    localStorage.removeItem("seed");
    localStorage.removeItem("address");
    setAddress("");
    setShowDropdown(false);
  };

  // ✅ restore wallet
  const [restoreError, setRestoreError] = useState("");

  const handleRestore = async (phrase) => {
    setLoading(true);
    setRestoreError("");
    try {
      const addr = await restoreWallet(phrase);
      localStorage.setItem("seed", phrase);
      setAddress(addr);
      setShowRestore(false);
    } catch (err) {
      setRestoreError(err?.message || "Invalid seed phrase. Please check and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      className="w-full fixed bg-black/80 backdrop-blur-xl z-50 py-2.5 border-b border-[#1e2a35]/50"
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ type: "spring", stiffness: 100, damping: 20 }}
    >
      <div className="bg-black text-white flex items-center justify-between w-[95%] mx-auto">
        <div className="flex items-center gap-2">
          <FaRobot className="w-7 h-7 animate-bounce text-[#1ee3bf]" />

          <Link to="/" className="text-2xl font-bold text-gradient">
            Tipex
          </Link>
        </div>

        <div className="hidden md:flex items-center gap-4">
          <NavLink to="/">Home</NavLink>
          <NavLink to="/create-agent">Create Agent</NavLink>
          <NavLink to="/dashboard">Dashboard</NavLink>
          <NavLink to="/logs">Logs</NavLink>
        </div>

        <div className="flex items-center gap-2">
          {address ? (
            <div className="relative" ref={dropdownRef}>
              {/* Wallet button */}
              <button
                onClick={handleToggleDropdown}
                className="flex items-center gap-2 bg-[#0d1f1a] border border-[#1ee3bf]/30 hover:border-[#1ee3bf] text-[#1ee3bf] px-3 py-1.5 rounded-xl text-sm font-mono transition-all"
              >
                <span className="h-2 w-2 rounded-full bg-[#1ee3bf] animate-pulse" />
                {address.slice(0, 6)}...{address.slice(-4)}
                <IoChevronDown className={`h-3.5 w-3.5 transition-transform ${showDropdown ? "rotate-180" : ""}`} />
              </button>

              {/* Dropdown */}
              {showDropdown && (
                <div className="absolute right-0 top-full mt-2 w-72 bg-[#0d1117] border border-[#1e2a35] rounded-2xl shadow-2xl overflow-hidden z-50">

                  {/* Header */}
                  <div className="px-4 pt-4 pb-3 border-b border-[#1e2a35]">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-[#1ee3bf] animate-pulse" />
                        <span className="text-[#1ee3bf] text-xs font-semibold">Base Sepolia</span>
                      </div>
                      <span className="text-[#687e8e] text-xs">{getAgents().length} agent{getAgents().length !== 1 ? "s" : ""}</span>
                    </div>
                    <p className="text-white text-xs font-mono break-all leading-relaxed">{address}</p>
                  </div>

                  {/* Balances */}
                  <div className="px-4 py-3 border-b border-[#1e2a35] grid grid-cols-2 gap-2">
                    <div className="bg-[#0a1f1a] border border-[#1ee3bf]/15 rounded-xl px-3 py-2">
                      <p className="text-[#687e8e] text-xs mb-0.5">USDC</p>
                      {balances.loadingBal ? (
                        <div className="h-4 w-14 bg-[#1e2a35] rounded animate-pulse" />
                      ) : (
                        <p className="text-[#1ee3bf] text-sm font-bold">
                          {balances.usdc !== null ? balances.usdc.toFixed(2) : "—"}
                        </p>
                      )}
                    </div>
                    <div className="bg-[#0a0f15] border border-[#1e2a35] rounded-xl px-3 py-2">
                      <p className="text-[#687e8e] text-xs mb-0.5">ETH (gas)</p>
                      {balances.loadingBal ? (
                        <div className="h-4 w-14 bg-[#1e2a35] rounded animate-pulse" />
                      ) : (
                        <p className="text-white text-sm font-bold">
                          {balances.eth !== null ? balances.eth.toFixed(5) : "—"}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="p-2 space-y-0.5">
                    <button
                      onClick={handleCopyAddress}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-[#a0b0c0] hover:bg-[#111820] hover:text-white transition-all"
                    >
                      {copied ? <MdCheckCircle className="h-4 w-4 text-[#1ee3bf]" /> : <MdContentCopy className="h-4 w-4" />}
                      {copied ? "Copied!" : "Copy address"}
                    </button>

                    <a
                      href={`https://sepolia.basescan.org/address/${address}`}
                      target="_blank"
                      rel="noreferrer"
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-[#a0b0c0] hover:bg-[#111820] hover:text-white transition-all"
                    >
                      <RiExternalLinkLine className="h-4 w-4" />
                      View on Basescan
                    </a>

                    <div className="border-t border-[#1e2a35] my-1" />

                    <button
                      onClick={handleDisconnect}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-red-400 hover:bg-red-500/10 transition-all"
                    >
                      <MdLogout className="h-4 w-4" />
                      Disconnect
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-2">
              <button
                className="bg-[#1ee3bf] text-black px-2 py-1 rounded-xl flex items-center gap-1.5 cursor-pointer text-sm font-semibold"
                onClick={handleCreate}
                disabled={loading}
              >
                <PiWalletFill className="h-5 w-5" />
                {loading ? "Creating..." : "Connect Wallet"}
              </button>
              <button
                className="border border-[#1ee3bf] text-[#1ee3bf] px-2 py-1 rounded-xl text-sm font-semibold cursor-pointer"
                onClick={() => setShowRestore(!showRestore)}
              >
                Restore
              </button>
            </div>
          )}
        </div>

        {/* Seed phrase modal */}
        {newSeed && (
          <SeedPhraseModal seed={newSeed} onClose={() => setNewSeed("")} />
        )}

        {/* Restore wallet modal */}
        {showRestore && !address && (
          <RestoreWalletModal
            onRestore={handleRestore}
            onClose={() => { setShowRestore(false); setRestoreError(""); }}
            loading={loading}
            error={restoreError}
          />
        )}
      </div>
    </motion.div>
  );
};

export default Navbar;
