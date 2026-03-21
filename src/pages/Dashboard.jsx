import { FaRobot, FaArrowRight, FaGift } from "react-icons/fa6";
import { IoPlayOutline, IoBriefcase } from "react-icons/io5";
import { IoMdTime, IoIosPause } from "react-icons/io";
import { BsCalendar2Fill } from "react-icons/bs";
import { RiDeleteBinLine } from "react-icons/ri";
import { GoZap } from "react-icons/go";
import { IoSwapHorizontal } from "react-icons/io5";
import { MdContentCopy } from "react-icons/md";
import { RiExternalLinkLine } from "react-icons/ri";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getAgents, saveAgents } from "../lib/agentStore";

const Dashboard = () => {
  const [agents, setAgents] = useState([]);
  const navigate = useNavigate();

  // Load from localStorage on mount + poll for engine updates
  useEffect(() => {
    const load = () => setAgents(getAgents());
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, []);

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
      amount: agents.reduce((sum, a) => sum + (Number(a.amount) || 0), 0) + " USDT",
      label: "Total Scheduled",
      icon: <IoMdTime className="h-5 w-5 md:h-6 md:w-6 text-[#1ee3bf]" />,
    },
  ];

  return (
    <div className="w-full pt-16 pb-5 md:pb-9 text-white">
      <div className="w-[95%] mx-auto">
        {/* header */}
        <div className="flex items-center justify-between flex-col md:flex-row gap-y-5 md:gap-y-0">
          <div>
            <h3 className="text-2xl font-semibold">Dashboard</h3>
            <p className="text-[#687e8e]">Manage your autonomous payment agents</p>
          </div>
          <button
            className="w-full md:w-fit bg-[#1ee3bf] text-black font-semibold cursor-pointer px-4 py-1.5 rounded-2xl hover:bg-[#17c9aa] transition-all"
            onClick={() => navigate("/create-agent")}
          >
            + New Agent
          </button>
        </div>

        {/* stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          {dashData.map((item, index) => (
            <div key={index} className="bg-[#12151a] rounded-2xl border border-[#141a1e] py-3">
              <div className="w-[92%] mx-auto flex gap-5">
                <div className="h-10 w-10 flex items-center justify-center bg-[#13413e] rounded-xl">
                  {item.icon}
                </div>
                <div>
                  <h2 className="text-xl font-semibold">{item.amount}</h2>
                  <p className="text-[#687e8e]">{item.label}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* agents list */}
        <div className="mt-9 space-y-4">
          {agents.length === 0 ? (
            <div className="bg-[#12151a] rounded-2xl border border-[#141a1e] py-12 flex flex-col items-center justify-center gap-4">
              <FaRobot className="h-10 w-10 text-[#2a3a4a]" />
              <p className="text-[#687e8e]">No agents yet. Create your first one!</p>
              <button
                onClick={() => navigate("/create-agent")}
                className="bg-[#1ee3bf] text-black font-semibold px-5 py-2 rounded-xl text-sm hover:bg-[#17c9aa] transition-all"
              >
                Create Agent
              </button>
            </div>
          ) : (
            agents.map((agent) => (
              <div key={agent.id} className="bg-[#12151a] rounded-2xl border border-[#141a1e] py-3">
                <div className="w-[96%] mx-auto flex flex-col md:flex-row gap-y-3 justify-between">
                  {/* left */}
                  <div className="flex gap-4">
                    <div className="h-10 w-10 bg-[#13413e] rounded-xl flex items-center justify-center shrink-0">
                      {getIcon(agent.ruleType)}
                    </div>
                    <div>
                      <h3 className="flex flex-wrap items-center gap-2">
                        <span className="text-[#1ee3bf] capitalize">{agent.ruleType}</span>
                        <span className="font-bold">{agent.amount} USDT</span>
                        <FaArrowRight className="text-[#687e8e]" />
                        <span className="font-bold">{agent.name}</span>
                        {agent.active ? (
                          <span className="text-xs text-green-400 bg-green-400/10 px-2 py-0.5 rounded-full animate-pulse">
                            Active
                          </span>
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
                        {agent.lastRun && (
                          <span>Last run: {new Date(agent.lastRun).toLocaleDateString()}</span>
                        )}
                      </div>
                      {agent.agentWalletAddress && (
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="text-[#3a4a5a] text-xs font-mono">
                            {agent.agentWalletAddress.slice(0, 8)}...{agent.agentWalletAddress.slice(-6)}
                          </span>
                          <button
                            onClick={() => copyAddress(agent.agentWalletAddress)}
                            className="text-[#3a4a5a] hover:text-[#1ee3bf] transition-colors"
                          >
                            <MdContentCopy className="h-3 w-3" />
                          </button>
                          <a
                            href={`https://sepolia.basescan.org/address/${agent.agentWalletAddress}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[#3a4a5a] hover:text-[#1ee3bf] transition-colors"
                          >
                            <RiExternalLinkLine className="h-3 w-3" />
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* right */}
                  <div className="flex items-end justify-end md:justify-normal md:items-center gap-2 md:gap-3">
                    <button
                      onClick={() => toggleAgent(agent.id)}
                      className="flex items-center gap-1.5 text-xs border border-[#1e2a35] hover:border-[#1ee3bf]/40 px-3 py-1.5 rounded-xl text-[#687e8e] hover:text-white transition-all"
                    >
                      {agent.active ? <IoIosPause className="h-3.5 w-3.5" /> : <IoPlayOutline className="h-3.5 w-3.5" />}
                      {agent.active ? "Pause" : "Resume"}
                    </button>
                    <button
                      onClick={() => deleteAgent(agent.id)}
                      className="w-8 h-8 flex items-center justify-center border border-[#1e2a35] hover:border-red-500/40 rounded-xl transition-all"
                    >
                      <RiDeleteBinLine className="text-red-500 h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {agents.length > 0 && (
          <div className="mt-6 flex justify-end">
            <button
              onClick={() => navigate("/logs")}
              className="text-[#687e8e] text-sm hover:text-[#1ee3bf] transition-colors"
            >
              View execution logs →
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
