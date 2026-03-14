import { FaCheckCircle } from "react-icons/fa";
import { FaXmark } from "react-icons/fa6";
import { LuBrain } from "react-icons/lu";
import { FiExternalLink } from "react-icons/fi";

const LogPage = () => {
  const logs = [
    {
      status: "success",
      amount: "50 USD₮",
      recipient: "Sarah",
      chain: "Polygon",
      gas: "0.002",
      reason: "Balance $520 exceeds minimum $200. No conflict detected.",
      date: "4/12/2025",
      tx: true,
    },
    {
      status: "success",
      amount: "1200 USD₮",
      recipient: "John",
      chain: "Base",
      gas: "0.001",
      reason: "Monthly salary trigger. Balance $3200 covers payment.",
      date: "12/1/2025",
      tx: true,
    },
    {
      status: "fail",
      amount: "50 USD₮",
      recipient: "Sarah",
      chain: "Ethereum",
      gas: "0",
      reason: "Insufficient balance: wallet has $150, minimum required $200.",
      date: "4/12/2025",
      tx: false,
    },
  ];

  // dynamically extract table headers
  const headers = [
    "Status",
    "Amount",
    "Recipient",
    "Chain",
    "Gas",
    "AI Reasoning",
    "Date",
    "Tx",
  ];

  return (
    <div className="w-full pt-16 text-white">
      <div className="w-[95%] mx-auto">
        <div className="">
          <h2 className="text-xl md:text-2xl font-semibold mb-3">
            Execution Logs
          </h2>
          <p className="text-[#687e8e]">
            History of all agent executions with AI reasoning.
          </p>
        </div>

        <div className="w-full overflow-x-auto mt-12">
          <table className="w-full bg-[#0f141a] py-4 rounded-2xl">
            <thead>
              <tr className="text-[#7c8a9a] text-sm border-b border-[#1b232c]">
                {headers.map((header) => (
                  <th key={header} className="px-6 py-4 text-left">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {logs.map((log, i) => (
                <tr key={i} className="border-b border-[#141a1f] text-sm">
                  <td className="px-6 py-4">
                    {log.status === "success" ? (
                      <FaCheckCircle className="text-green-400" />
                    ) : (
                      <FaXmark className="text-red-500" />
                    )}
                  </td>

                  <td className="px-6 py-4 font-semibold">{log.amount}</td>
                  <td className="px-6 py-4 text-[#a8b3c2]">{log.recipient}</td>
                  <td className="px-6 py-4">{log.chain}</td>
                  <td className="px-6 py-4 text-[#9aa6b2]">{log.gas}</td>

                  <td className="px-6 py-4 flex items-center gap-2 text-[#8fa1b3] truncate">
                    <LuBrain className="text-purple-500 shrink-0" />
                    <span className="truncate">{log.reason}</span>
                  </td>

                  <td className="px-6 py-4 text-[#9aa6b2]">{log.date}</td>

                  <td className="px-6 py-4">
                    {log.tx ? (
                      <FiExternalLink className="cursor-pointer" />
                    ) : (
                      "-"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default LogPage;
