import { useState, useEffect, useRef } from "react";
import { Link, NavLink } from "react-router-dom";
import { motion } from "framer-motion";
import { FaRobot } from "react-icons/fa6";
import { PiWalletFill } from "react-icons/pi";
import {
  MdMenu,
  MdClose,
  MdContentCopy,
  MdCheckCircle,
  MdLogout,
  MdSwapHoriz,
} from "react-icons/md";
import { RiExternalLinkLine } from "react-icons/ri";
import { IoChevronDown } from "react-icons/io5";
import { createWallet } from "../lib/createWallet";
import { loadWallet } from "../lib/loadWallet";
import { restoreWallet } from "../lib/restoreWallet";
import { initEvmWallet } from "../lib/wdkWallet";
import { getUSDCBalance, getETHBalance } from "../lib/getBalance";
import { getAgents } from "../lib/agentStore";
import SeedPhraseModal from "./SeedPhraseModal";
import RestoreWalletModal from "./RestoreWalletModal";

// USDC contract addresses
const USDC_SEPOLIA = "0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238"; // Ethereum Sepolia
const WETH_SEPOLIA = "0xfFf9976782d46CC05630D1f6eBAb18b2324d6B14"; // Ethereum Sepolia

async function fetchEthSepoliaBalance(address) {
  const res = await fetch("https://ethereum-sepolia.publicnode.com", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "eth_getBalance",
      params: [address, "latest"],
    }),
  });
  const { result } = await res.json();
  return parseInt(result, 16) / 1e18;
}

// ── Swap Modal ────────────────────────────────────────────────────────────────
function SwapModal({ onClose, ethSepoliaBalance }) {
  const [tab, setTab] = useState("swap");
  const [fromToken, setFromToken] = useState("ETH");
  const [toToken, setToToken] = useState("USDC");
  const [amount, setAmount] = useState("");

  const flipTokens = () => {
    setFromToken(toToken);
    setToToken(fromToken);
  };

  const uniswapUrl = () => {
    const inp = fromToken === "ETH" ? "ETH" : USDC_SEPOLIA;
    const out = toToken === "ETH" ? "ETH" : USDC_SEPOLIA;
    let url = `https://app.uniswap.org/swap?chain=sepolia&inputCurrency=${inp}&outputCurrency=${out}`;
    if (amount) url += `&exactAmount=${amount}&exactField=input`;
    return url;
  };

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center px-4"
      onClick={onClose}
    >
      <div
        className="bg-[#0d1117] border border-[#1e2a35] rounded-2xl p-5 w-full max-w-[340px]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white text-sm font-semibold">Swap / Bridge</h3>
          <button
            onClick={onClose}
            className="text-[#687e8e] hover:text-white text-lg leading-none"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-[#111820] rounded-xl p-1 mb-4">
          {["swap", "bridge"].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                tab === t
                  ? "bg-[#1ee3bf] text-black"
                  : "text-[#687e8e] hover:text-white"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        {tab === "swap" ? (
          <>
            <p className="text-[#687e8e] text-xs mb-3">
              Swap tokens on Ethereum Sepolia via Uniswap
            </p>

            {/* From */}
            <div className="bg-[#111820] rounded-xl p-3 mb-1.5">
              <p className="text-[#687e8e] text-xs mb-1.5">From</p>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.0"
                  className="flex-1 bg-transparent text-white text-base outline-none placeholder:text-[#3a4a5a] min-w-0"
                />
                <select
                  value={fromToken}
                  onChange={(e) => setFromToken(e.target.value)}
                  className="bg-[#1e2a35] text-white text-xs px-2 py-1 rounded-lg outline-none cursor-pointer"
                >
                  <option value="ETH">ETH</option>
                  <option value="USDC">USDC</option>
                </select>
              </div>
              {fromToken === "ETH" && ethSepoliaBalance !== null && (
                <p className="text-[#3a4a5a] text-xs mt-1">
                  Balance: {ethSepoliaBalance.toFixed(5)} ETH
                </p>
              )}
            </div>

            {/* Flip button */}
            <div className="flex justify-center my-1.5">
              <button
                onClick={flipTokens}
                className="h-7 w-7 rounded-lg bg-[#1e2a35] hover:bg-[#1ee3bf]/20 text-[#687e8e] hover:text-[#1ee3bf] flex items-center justify-center transition-all"
              >
                <MdSwapHoriz className="h-4 w-4 rotate-90" />
              </button>
            </div>

            {/* To */}
            <div className="bg-[#111820] rounded-xl p-3 mb-4">
              <p className="text-[#687e8e] text-xs mb-1.5">To</p>
              <div className="flex items-center gap-2">
                <span className="flex-1 text-[#3a4a5a] text-base">~</span>
                <select
                  value={toToken}
                  onChange={(e) => setToToken(e.target.value)}
                  className="bg-[#1e2a35] text-white text-xs px-2 py-1 rounded-lg outline-none cursor-pointer"
                >
                  <option value="USDC">USDC</option>
                  <option value="ETH">ETH</option>
                </select>
              </div>
            </div>

            <a
              href={uniswapUrl()}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 w-full bg-[#1ee3bf] text-black py-2.5 rounded-xl text-sm font-semibold hover:bg-[#17c9aa] transition-colors"
            >
              Swap on Uniswap
              <RiExternalLinkLine className="h-3.5 w-3.5" />
            </a>
            <p className="text-[#3a4a5a] text-xs text-center mt-2">
              Opens Uniswap with your tokens pre-selected
            </p>
          </>
        ) : (
          <>
            <p className="text-[#687e8e] text-xs mb-4">
              Move ETH from Ethereum Sepolia to Base Sepolia for gas fees in the
              app.
            </p>

            <a
              href="https://superbridge.app/base-sepolia"
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 w-full bg-[#1ee3bf] text-black py-2.5 rounded-xl text-sm font-semibold mb-2 hover:bg-[#17c9aa] transition-colors"
            >
              Bridge on Superbridge
              <RiExternalLinkLine className="h-3.5 w-3.5" />
            </a>

            <a
              href="https://faucet.circle.com"
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 w-full bg-[#111820] border border-[#1e2a35] text-[#a0b0c0] py-2.5 rounded-xl text-sm hover:border-[#1ee3bf]/30 hover:text-white transition-all"
            >
              Get Base Sepolia USDC
              <RiExternalLinkLine className="h-3.5 w-3.5" />
            </a>

            <p className="text-[#3a4a5a] text-xs text-center mt-3">
              Circle faucet gives free USDC directly on Base Sepolia
            </p>
          </>
        )}
      </div>
    </div>
  );
}

// ── Navbar ────────────────────────────────────────────────────────────────────
const Navbar = () => {
  const [address, setAddress] = useState("");
  const [showRestore, setShowRestore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showSwap, setShowSwap] = useState(false);
  const [copied, setCopied] = useState(false);
  const [balances, setBalances] = useState({
    usdc: null,
    ethBase: null,
    ethSepolia: null,
    loadingBal: false,
  });
  const [tempSeed, setTempSeed] = useState("");
  const [restoreError, setRestoreError] = useState("");
  const dropdownRef = useRef(null);

  // Load wallet on start
  useEffect(() => {
    loadWallet().then((w) => {
      if (w) setAddress(w.address);
    });
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Create wallet
  // const handleCreate = async () => {
  //   if (address) {
  //     alert("Wallet already connected");
  //     return;
  //   }
  //   setLoading(true);
  //   const res = await createWallet();
  //   setAddress(res.address);
  //   setLoading(false);
  //   setNewSeed(res.seed);
  // };
  const handleCreate = async () => {
    if (address) {
      alert("Wallet already connected");
      return;
    }

    setLoading(true);

    const res = await createWallet(true);
    // pass flag if needed, or just generate seed

    setLoading(false);

    setTempSeed(res.seed); // store temporarily
  };

  const handleConfirmSeed = async () => {
    if (!tempSeed) return;

    const res = await createWallet(tempSeed);

    setAddress(res.address);

    localStorage.setItem("seed", tempSeed);

    setTempSeed("");
  };

  const handleCancelSeed = () => {
    setTempSeed("");
  };

  // Fetch balances when dropdown opens
  const handleToggleDropdown = async () => {
    const next = !showDropdown;
    setShowDropdown(next);
    if (next && address) {
      setBalances((b) => ({ ...b, loadingBal: true }));
      try {
        const seed = localStorage.getItem("seed");
        const [ethSepolia, baseBalances] = await Promise.all([
          fetchEthSepoliaBalance(address),
          seed
            ? (async () => {
                const { wdk } = initEvmWallet(seed);
                const account = await wdk.getAccount("ethereum", 0);
                const [usdc, ethBase] = await Promise.all([
                  getUSDCBalance(account),
                  getETHBalance(account),
                ]);
                return { usdc, ethBase };
              })()
            : Promise.resolve({ usdc: null, ethBase: null }),
        ]);
        setBalances({ ...baseBalances, ethSepolia, loadingBal: false });
      } catch {
        setBalances({
          usdc: null,
          ethBase: null,
          ethSepolia: null,
          loadingBal: false,
        });
      }
    }
  };

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDisconnect = () => {
    localStorage.removeItem("seed");
    localStorage.removeItem("address");
    setAddress("");
    setShowDropdown(false);
  };

  const handleRestore = async (phrase) => {
    setLoading(true);
    setRestoreError("");
    try {
      const addr = await restoreWallet(phrase);
      localStorage.setItem("seed", phrase);
      setAddress(addr);
      setShowRestore(false);
    } catch (err) {
      setRestoreError(
        err?.message || "Invalid seed phrase. Please check and try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  const BalSkeleton = () => (
    <div className="h-4 w-14 bg-[#1e2a35] rounded animate-pulse" />
  );

  return (
    <>
      <motion.div
        className="w-full fixed bg-black/80 backdrop-blur-xl z-50 py-2.5 border-b border-[#1e2a35]/50"
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 20 }}
      >
        <div className="bg-black text-white flex items-center justify-between w-[95%] mx-auto">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <FaRobot className="w-7 h-7 animate-bounce text-[#1ee3bf]" />
            <Link to="/" className="text-2xl font-bold text-gradient">
              Tipex
            </Link>
          </div>

          {/* Nav links */}
          <div className="hidden md:flex items-center gap-4">
            <NavLink to="/">Home</NavLink>
            <NavLink to="/create-agent">Create Agent</NavLink>
            <NavLink to="/dashboard">Dashboard</NavLink>
            <NavLink to="/logs">Logs</NavLink>
          </div>

          {/* Wallet area */}
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
                  <IoChevronDown
                    className={`h-3.5 w-3.5 transition-transform ${showDropdown ? "rotate-180" : ""}`}
                  />
                </button>

                {/* Dropdown */}
                {showDropdown && (
                  <div className="absolute right-0 top-full mt-2 w-80 bg-[#0d1117] border border-[#1e2a35] rounded-2xl shadow-2xl overflow-hidden z-50">
                    {/* Header */}
                    <div className="px-4 pt-4 pb-3 border-b border-[#1e2a35]">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full bg-[#1ee3bf] animate-pulse" />
                          <span className="text-[#1ee3bf] text-xs font-semibold">
                            Base Sepolia
                          </span>
                        </div>
                        <span className="text-[#687e8e] text-xs">
                          {getAgents().length} agent
                          {getAgents().length !== 1 ? "s" : ""}
                        </span>
                      </div>
                      <p className="text-white text-xs font-mono break-all leading-relaxed">
                        {address}
                      </p>
                    </div>

                    {/* Base Sepolia balances */}
                    <div className="px-4 pt-3 pb-2">
                      <p className="text-[#3a4a5a] text-xs uppercase tracking-wider mb-2">
                        Base Sepolia
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-[#0a1f1a] border border-[#1ee3bf]/15 rounded-xl px-3 py-2">
                          <p className="text-[#687e8e] text-xs mb-0.5">USDC</p>
                          {balances.loadingBal ? (
                            <BalSkeleton />
                          ) : (
                            <p className="text-[#1ee3bf] text-sm font-bold">
                              {balances.usdc !== null
                                ? balances.usdc.toFixed(2)
                                : "—"}
                            </p>
                          )}
                        </div>
                        <div className="bg-[#0a0f15] border border-[#1e2a35] rounded-xl px-3 py-2">
                          <p className="text-[#687e8e] text-xs mb-0.5">
                            ETH (gas)
                          </p>
                          {balances.loadingBal ? (
                            <BalSkeleton />
                          ) : (
                            <p className="text-white text-sm font-bold">
                              {balances.ethBase !== null
                                ? balances.ethBase.toFixed(5)
                                : "—"}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Ethereum Sepolia balance */}
                    <div className="px-4 pt-2 pb-3 border-b border-[#1e2a35]">
                      <p className="text-[#3a4a5a] text-xs uppercase tracking-wider mb-2">
                        Ethereum Sepolia
                      </p>
                      <div className="bg-[#0a0f15] border border-[#1e2a35] rounded-xl px-3 py-2 flex items-center justify-between">
                        <div>
                          <p className="text-[#687e8e] text-xs mb-0.5">ETH</p>
                          {balances.loadingBal ? (
                            <BalSkeleton />
                          ) : (
                            <p className="text-white text-sm font-bold">
                              {balances.ethSepolia !== null
                                ? balances.ethSepolia.toFixed(5)
                                : "—"}
                            </p>
                          )}
                        </div>
                        <a
                          href={`https://sepolia.etherscan.io/address/${address}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[#3a4a5a] hover:text-[#1ee3bf] transition-colors"
                          title="View on Etherscan"
                        >
                          <RiExternalLinkLine className="h-3.5 w-3.5" />
                        </a>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="p-2 space-y-0.5">
                      {/* Swap / Bridge */}
                      <button
                        onClick={() => {
                          setShowSwap(true);
                          setShowDropdown(false);
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-[#a0b0c0] hover:bg-[#111820] hover:text-white transition-all"
                      >
                        <MdSwapHoriz className="h-4 w-4" />
                        Swap / Bridge
                      </button>

                      <button
                        onClick={handleCopyAddress}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-[#a0b0c0] hover:bg-[#111820] hover:text-white transition-all"
                      >
                        {copied ? (
                          <MdCheckCircle className="h-4 w-4 text-[#1ee3bf]" />
                        ) : (
                          <MdContentCopy className="h-4 w-4" />
                        )}
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
                  Restore Wallet
                </button>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Swap / Bridge modal */}
      {showSwap && (
        <SwapModal
          onClose={() => setShowSwap(false)}
          ethSepoliaBalance={balances.ethSepolia}
        />
      )}

      {/* Seed phrase modal */}
      {/* {newSeed && (
        <SeedPhraseModal seed={newSeed} onClose={() => setNewSeed("")} />
      )} */}

      {tempSeed && (
        <SeedPhraseModal
          seed={tempSeed}
          onConfirm={handleConfirmSeed}
          onCancel={handleCancelSeed}
        />
      )}

      {/* Restore wallet modal */}
      {showRestore && !address && (
        <RestoreWalletModal
          onRestore={handleRestore}
          onClose={() => {
            setShowRestore(false);
            setRestoreError("");
          }}
          loading={loading}
          error={restoreError}
        />
      )}
    </>
  );
};

export default Navbar;
