import { FaRobot, FaArrowRight, FaGift } from "react-icons/fa6";
import { IoPlayOutline, IoBriefcase } from "react-icons/io5";
import { IoMdTime, IoIosPause } from "react-icons/io";
import { BsCalendar2Fill } from "react-icons/bs";
import { RiDeleteBinLine, RiEditLine } from "react-icons/ri";
import { GoZap } from "react-icons/go";
import { IoSwapHorizontal, IoClose } from "react-icons/io5";
import { MdContentCopy } from "react-icons/md";
import { RiExternalLinkLine } from "react-icons/ri";
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { getAgents, saveAgents } from "../lib/agentStore";
import { getUSDCBalance } from "../lib/getBalance";
import { initEvmWallet } from "../lib/wdkWallet";
import { 
  staggerContainer, 
  staggerItem, 
  cardHover,
  useAnimationPreferences 
} from "../lib/animations";

const SCHEDULES = ["every5min", "daily", "weekly", "monthly", "yearly"];

function EditModal({ agent, onSave, onClose }) {
  const [form, setForm] = useState({
    name:     agent.name     || "",
    address:  agent.address  || "",
    amount:   agent.amount   || "",
    schedule: agent.schedule || "monthly",
    minBal:   agent.minBal   || "",
  });

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleSave = () => {
    if (!form.name || !form.address || !form.amount || !form.minBal) return;
    onSave({ id: agent.id, ...form, amount: Number(form.amount), minBal: Number(form.minBal) });
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      <motion.div
        className="relative w-full max-w-md bg-[#0d1117] border border-[#1e2a35] rounded-2xl p-6 space-y-5 z-10"
        initial={{ scale: 0.95, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 20 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-white font-semibold">Edit Agent</h3>
            <p className="text-[#687e8e] text-xs capitalize mt-0.5">{agent.ruleType} · wallet index {agent.walletIndex}</p>
          </div>
          <button onClick={onClose} className="text-[#687e8e] hover:text-white transition-colors">
            <IoClose className="h-5 w-5" />
          </button>
        </div>

        {/* Fields */}
        <div className="space-y-3">
          <div>
            <label className="text-[#687e8e] text-xs mb-1.5 block">Recipient Name</label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => set("name", e.target.value)}
              className="w-full bg-[#0a0f15] border border-[#1e2a35] focus:border-[#1ee3bf]/40 rounded-xl px-3 py-2.5 text-sm text-white outline-none transition-colors"
            />
          </div>
          <div>
            <label className="text-[#687e8e] text-xs mb-1.5 block">Recipient Address</label>
            <input
              type="text"
              value={form.address}
              onChange={(e) => set("address", e.target.value)}
              className="w-full bg-[#0a0f15] border border-[#1e2a35] focus:border-[#1ee3bf]/40 rounded-xl px-3 py-2.5 text-sm text-white outline-none font-mono transition-colors"
              placeholder="0x..."
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[#687e8e] text-xs mb-1.5 block">Amount (USDC)</label>
              <input
                type="number"
                min="0"
                value={form.amount}
                onChange={(e) => set("amount", e.target.value)}
                className="w-full bg-[#0a0f15] border border-[#1e2a35] focus:border-[#1ee3bf]/40 rounded-xl px-3 py-2.5 text-sm text-white outline-none transition-colors"
              />
            </div>
            <div>
              <label className="text-[#687e8e] text-xs mb-1.5 block">Min Balance (USDC)</label>
              <input
                type="number"
                min="0"
                value={form.minBal}
                onChange={(e) => set("minBal", e.target.value)}
                className="w-full bg-[#0a0f15] border border-[#1e2a35] focus:border-[#1ee3bf]/40 rounded-xl px-3 py-2.5 text-sm text-white outline-none transition-colors"
              />
            </div>
          </div>
          <div>
            <label className="text-[#687e8e] text-xs mb-1.5 block">Schedule</label>
            <select
              value={form.schedule}
              onChange={(e) => set("schedule", e.target.value)}
              className="w-full bg-[#0a0f15] border border-[#1e2a35] focus:border-[#1ee3bf]/40 rounded-xl px-3 py-2.5 text-sm text-white outline-none transition-colors"
            >
              {SCHEDULES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-1">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl border border-[#1e2a35] text-[#687e8e] hover:text-white text-sm transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!form.name || !form.address || !form.amount || !form.minBal}
            className="flex-1 py-2.5 rounded-xl bg-[#1ee3bf] text-black font-semibold text-sm hover:bg-[#17c9aa] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Save Changes
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

const Dashboard = () => {
  const [agents, setAgents]         = useState([]);
  const [editingAgent, setEditingAgent] = useState(null);
  // balances: { [agentId]: number | null }
  const [balances, setBalances]     = useState({});
  const navigate = useNavigate();
  const { shouldReduceMotion } = useAnimationPreferences();

  // Load from localStorage on mount + poll for engine updates
  useEffect(() => {
    const load = () => setAgents(getAgents());
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, []);

  // Fetch USDC balances for all agents (non-blocking, best-effort)
  const fetchBalances = useCallback(async (agentList) => {
    const seed = localStorage.getItem("seed");
    if (!seed || !agentList.length) return;
    try {
      const { wdk } = initEvmWallet(seed);
      const results = await Promise.allSettled(
        agentList.map(async (a) => {
          const acc = await wdk.getAccount("ethereum", a.walletIndex);
          const usdc = await getUSDCBalance(acc);
          return { id: a.id, usdc };
        })
      );
      const map = {};
      results.forEach((r) => { if (r.status === "fulfilled") map[r.value.id] = r.value.usdc; });
      setBalances(map);
    } catch { /* silently skip if wallet not ready */ }
  }, []);

  useEffect(() => {
    if (agents.length) fetchBalances(agents);
  }, [agents, fetchBalances]);

  const persist = (updated) => {
    saveAgents(updated);
    setAgents(updated);
  };

  const getIcon = (type) => {
    switch (type) {
      case "salary":
        return <IoBriefcase className="text-[#1ee3bf] h-4 w-4 md:w-5 md:h-5" />;
      case "gift":
        return <FaGift className="text-[#1ee3bf] h-4 w-4 md:w-5 md:h-5" />;
      case "subscription":
        return <IoSwapHorizontal className="text-[#1ee3bf] h-4 w-4 md:w-5 md:h-5" />;
      case "conditional":
        return <GoZap className="text-[#1ee3bf] h-4 w-4 md:w-5 md:h-5" />;
      default:
        return <FaRobot className="text-[#1ee3bf] h-4 w-4 md:w-5 md:h-5" />;
    }
  };

  const toggleAgent = (id) => {
    persist(agents.map((a) => (a.id === id ? { ...a, active: !a.active } : a)));
  };

  const deleteAgent = (id) => {
    persist(agents.filter((a) => a.id !== id));
  };

  const copyAddress = (addr) => {
    navigator.clipboard.writeText(addr);
  };

  const saveEdit = (updated) => {
    persist(agents.map((a) => (a.id === updated.id ? { ...a, ...updated } : a)));
    setEditingAgent(null);
  };

  const dashData = [
    {
      amount: agents.length,
      label: "Total Agents",
      icon: <FaRobot className="h-5 w-5 md:h-6 md:w-6 text-[#1ee3bf]" />,
    },
    {
      amount: agents.filter((a) => a.active).length,
      label: "Active Agents",
      icon: <IoPlayOutline className="h-5 w-5 md:h-6 md:w-6 text-[#1ee3bf]" />,
    },
    {
      amount: agents.reduce((sum, a) => sum + (Number(a.amount) || 0), 0) + " USDC",
      label: "Total Scheduled",
      icon: <IoMdTime className="h-5 w-5 md:h-6 md:w-6 text-[#1ee3bf]" />,
    },
  ];

  // Animation variants
  const containerVariants = shouldReduceMotion
    ? { hidden: { opacity: 0 }, visible: { opacity: 1 } }
    : staggerContainer;

  const itemVariants = shouldReduceMotion
    ? { hidden: { opacity: 0 }, visible: { opacity: 1 } }
    : staggerItem;

  return (
    <div className="w-full pt-16 pb-5 md:pb-9 text-white">
      <div className="w-[95%] mx-auto">
        {/* header */}
        <motion.div 
          className="flex items-center justify-between flex-col md:flex-row gap-y-5 md:gap-y-0"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <div>
            <h3 className="text-2xl font-semibold">Dashboard</h3>
            <p className="text-[#687e8e]">Manage your autonomous payment agents</p>
          </div>
          <motion.button
            className="w-full md:w-fit bg-[#1ee3bf] text-black font-semibold cursor-pointer px-4 py-1.5 rounded-2xl"
            onClick={() => navigate("/create-agent")}
            whileHover={shouldReduceMotion ? {} : { scale: 1.05 }}
            whileTap={shouldReduceMotion ? {} : { scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            + New Agent
          </motion.button>
        </motion.div>

        {/* stats */}
        <motion.div 
          className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {dashData.map((item, index) => (
            <motion.div 
              key={index} 
              className="bg-[#12151a] rounded-2xl border border-[#141a1e] py-3"
              variants={itemVariants}
              whileHover={shouldReduceMotion ? {} : { 
                scale: 1.02,
                borderColor: "rgba(30, 227, 191, 0.3)",
                transition: { type: "spring", stiffness: 300 }
              }}
            >
              <div className="w-[92%] mx-auto flex gap-5">
                <motion.div 
                  className="h-10 w-10 flex items-center justify-center bg-[#13413e] rounded-xl"
                  whileHover={shouldReduceMotion ? {} : { rotate: 10, scale: 1.1 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  {item.icon}
                </motion.div>
                <div>
                  <motion.h2 
                    className="text-xl font-semibold"
                    key={item.amount}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    {item.amount}
                  </motion.h2>
                  <p className="text-[#687e8e]">{item.label}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* agents list */}
        <div className="mt-9 space-y-4">
          {agents.length === 0 ? (
            <motion.div 
              className="bg-[#12151a] rounded-2xl border border-[#141a1e] py-12 flex flex-col items-center justify-center gap-4"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
            >
              <motion.div
                animate={shouldReduceMotion ? {} : { 
                  y: [0, -10, 0],
                }}
                transition={{ 
                  duration: 2, 
                  repeat: Infinity,
                  ease: "easeInOut" 
                }}
              >
                <FaRobot className="h-10 w-10 text-[#2a3a4a]" />
              </motion.div>
              <p className="text-[#687e8e]">No agents yet. Create your first one!</p>
              <motion.button
                onClick={() => navigate("/create-agent")}
                className="bg-[#1ee3bf] text-black font-semibold px-5 py-2 rounded-xl text-sm"
                whileHover={shouldReduceMotion ? {} : { scale: 1.05 }}
                whileTap={shouldReduceMotion ? {} : { scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                Create Agent
              </motion.button>
            </motion.div>
          ) : (
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              <AnimatePresence mode="popLayout">
                {agents.map((agent) => (
                  <motion.div
                    key={agent.id}
                    className="bg-[#12151a] rounded-2xl border border-[#141a1e] py-3"
                    variants={itemVariants}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20, scale: 0.95 }}
                    transition={{ duration: 0.3 }}
                    whileHover={shouldReduceMotion ? {} : { 
                      borderColor: "rgba(30, 227, 191, 0.2)"
                    }}
                  >
                    <div className="w-[96%] mx-auto flex flex-col md:flex-row gap-y-3 justify-between">
                      {/* left */}
                      <div className="flex gap-4">
                        <motion.div 
                          className="h-10 w-10 bg-[#13413e] rounded-xl flex items-center justify-center shrink-0"
                          whileHover={shouldReduceMotion ? {} : { rotate: 15, scale: 1.05 }}
                          transition={{ type: "spring", stiffness: 300 }}
                        >
                          {getIcon(agent.ruleType)}
                        </motion.div>
                        <div>
                          <h3 className="flex flex-wrap items-center gap-2">
                            <span className="text-[#1ee3bf] capitalize">{agent.ruleType}</span>
                            <span className="font-bold">{agent.amount} USDC</span>
                            <FaArrowRight className="text-[#687e8e]" />
                            <span className="font-bold">{agent.name}</span>
                            {agent.active ? (
                              <motion.span 
                                className="text-xs text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full"
                                animate={shouldReduceMotion ? {} : { 
                                  scale: [1, 1.05, 1],
                                }}
                                transition={{ 
                                  duration: 2, 
                                  repeat: Infinity,
                                  ease: "easeInOut" 
                                }}
                              >
                                Active
                              </motion.span>
                            ) : (
                              <span className="text-xs text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded-full">
                                Paused
                              </span>
                            )}
                          </h3>
                          <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-[#687e8e] pt-1">
                            <span className="flex items-center gap-1">
                              <BsCalendar2Fill className="h-3 w-3" />
                              {agent.schedule}
                            </span>
                            <span>Min bal: ${agent.minBal}</span>
                            {/* Live balance health */}
                            {balances[agent.id] !== undefined ? (
                              balances[agent.id] < agent.minBal ? (
                                <span className="flex items-center gap-1 text-red-400 font-medium">
                                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 inline-block" />
                                  Low funds ({balances[agent.id].toFixed(1)} USDC)
                                </span>
                              ) : (
                                <span className="flex items-center gap-1 text-[#1ee3bf]">
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#1ee3bf] inline-block" />
                                  {balances[agent.id].toFixed(1)} USDC
                                </span>
                              )
                            ) : null}
                            {agent.lastRun && (
                              <span>Last run: {new Date(agent.lastRun).toLocaleDateString()}</span>
                            )}
                          </div>
                          {agent.agentWalletAddress && (
                            <div className="flex items-center gap-1.5 mt-1">
                              <span className="text-[#3a4a5a] text-xs font-mono">
                                {agent.agentWalletAddress.slice(0, 8)}...{agent.agentWalletAddress.slice(-6)}
                              </span>
                              <motion.button
                                onClick={() => copyAddress(agent.agentWalletAddress)}
                                className="text-[#3a4a5a] hover:text-[#1ee3bf] transition-colors"
                                whileHover={shouldReduceMotion ? {} : { scale: 1.2 }}
                                whileTap={shouldReduceMotion ? {} : { scale: 0.9 }}
                              >
                                <MdContentCopy className="h-3 w-3" />
                              </motion.button>
                              <motion.a
                                href={`https://sepolia.basescan.org/address/${agent.agentWalletAddress}`}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[#3a4a5a] hover:text-[#1ee3bf] transition-colors"
                                whileHover={shouldReduceMotion ? {} : { scale: 1.2 }}
                              >
                                <RiExternalLinkLine className="h-3 w-3" />
                              </motion.a>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* right */}
                      <div className="flex items-end justify-end md:justify-normal md:items-center gap-2 md:gap-3">
                        <motion.button
                          onClick={() => toggleAgent(agent.id)}
                          className="flex items-center gap-1.5 text-xs border border-[#1e2a35] hover:border-[#1ee3bf]/40 px-3 py-1.5 rounded-xl text-[#687e8e] hover:text-white transition-all"
                          whileHover={shouldReduceMotion ? {} : { scale: 1.05 }}
                          whileTap={shouldReduceMotion ? {} : { scale: 0.95 }}
                        >
                          {agent.active ? (
                            <IoIosPause className="h-3.5 w-3.5" />
                          ) : (
                            <IoPlayOutline className="h-3.5 w-3.5" />
                          )}
                          {agent.active ? "Pause" : "Resume"}
                        </motion.button>
                        <motion.button
                          onClick={() => setEditingAgent(agent)}
                          className="w-8 h-8 flex items-center justify-center border border-[#1e2a35] hover:border-[#1ee3bf]/40 rounded-xl transition-all"
                          whileHover={shouldReduceMotion ? {} : { scale: 1.1 }}
                          whileTap={shouldReduceMotion ? {} : { scale: 0.9 }}
                          title="Edit agent"
                        >
                          <RiEditLine className="text-[#687e8e] hover:text-white h-4 w-4" />
                        </motion.button>
                        <motion.button
                          onClick={() => deleteAgent(agent.id)}
                          className="w-8 h-8 flex items-center justify-center border border-[#1e2a35] hover:border-red-500/40 rounded-xl transition-all"
                          whileHover={shouldReduceMotion ? {} : { scale: 1.1 }}
                          whileTap={shouldReduceMotion ? {} : { scale: 0.9 }}
                        >
                          <RiDeleteBinLine className="text-red-500 h-4 w-4" />
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>

        {agents.length > 0 && (
          <motion.div
            className="mt-6 flex justify-end"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <motion.button
              onClick={() => navigate("/logs")}
              className="text-[#687e8e] text-sm hover:text-[#1ee3bf] transition-colors"
              whileHover={shouldReduceMotion ? {} : { x: 5 }}
            >
              View execution logs →
            </motion.button>
          </motion.div>
        )}
      </div>

      {/* Edit modal */}
      <AnimatePresence>
        {editingAgent && (
          <EditModal
            agent={editingAgent}
            onSave={saveEdit}
            onClose={() => setEditingAgent(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Dashboard;
