import { useState, useEffect } from "react";
import { FaCheckCircle } from "react-icons/fa";
import { FaXmark } from "react-icons/fa6";
import { LuBrain } from "react-icons/lu";
import { FiExternalLink } from "react-icons/fi";
import { IoPauseCircleOutline } from "react-icons/io5";
import { getLogs as getStoredLogs } from "../lib/agentStore";
import { EXPLORER_TX } from "../lib/constants";

const LogPage = () => {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    const load = () => setLogs(getStoredLogs());
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, []);

  const statusIcon = (status) => {
    if (status === "success") return <FaCheckCircle className="text-green-400 h-4 w-4" />;
    if (status === "skipped") return <IoPauseCircleOutline className="text-yellow-400 h-4 w-4" />;
    return <FaXmark className="text-red-500 h-4 w-4" />;
  };

  return (
    <div className="w-full pt-16 pb-10 text-white">
      <div className="w-[95%] mx-auto">
        <div>
          <h2 className="text-xl md:text-2xl font-semibold mb-1">Execution Logs</h2>
          <p className="text-[#687e8e]">History of all agent executions with AI reasoning.</p>
        </div>

        {logs.length === 0 ? (
          <div className="mt-12 bg-[#0f141a] rounded-2xl border border-[#1b232c] py-16 flex flex-col items-center justify-center gap-3">
            <LuBrain className="h-10 w-10 text-[#2a3a4a]" />
            <p className="text-[#687e8e]">No executions yet. Agents will log activity here.</p>
          </div>
        ) : (
          <div className="w-full overflow-x-auto mt-8">
            <table className="w-full bg-[#0f141a] rounded-2xl">
              <thead>
                <tr className="text-[#7c8a9a] text-sm border-b border-[#1b232c]">
                  <th className="px-6 py-4 text-left">Status</th>
                  <th className="px-6 py-4 text-left">Amount</th>
                  <th className="px-6 py-4 text-left">Recipient</th>
                  <th className="px-6 py-4 text-left">Chain</th>
                  <th className="px-6 py-4 text-left">Balance</th>
                  <th className="px-6 py-4 text-left">AI Reasoning</th>
                  <th className="px-6 py-4 text-left">Date</th>
                  <th className="px-6 py-4 text-left">Tx</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-[#141a1f] text-sm">
                    <td className="px-6 py-4">{statusIcon(log.status)}</td>
                    <td className="px-6 py-4 font-semibold">{log.amount} USDC</td>
                    <td className="px-6 py-4 text-[#a8b3c2]">{log.recipient}</td>
                    <td className="px-6 py-4">{log.chain || "Base"}</td>
                    <td className="px-6 py-4 text-[#9aa6b2]">{log.balance ? `$${log.balance}` : "—"}</td>
                    <td className="px-6 py-4 max-w-xs">
                      <div className="flex items-start gap-2 text-[#8fa1b3]">
                        <LuBrain className="text-purple-500 shrink-0 mt-0.5 h-3.5 w-3.5" />
                        <span className="line-clamp-2 text-xs">{log.reason}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-[#9aa6b2] whitespace-nowrap">{log.date}</td>
                    <td className="px-6 py-4">
                      {log.txHash ? (
                        <a
                          href={`${EXPLORER_TX}/${log.txHash}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[#1ee3bf] hover:text-white transition-colors"
                        >
                          <FiExternalLink className="h-4 w-4" />
                        </a>
                      ) : (
                        <span className="text-[#3a4a5a]">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default LogPage;
