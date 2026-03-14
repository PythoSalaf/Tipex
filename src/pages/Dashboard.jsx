import { FaRobot, FaArrowRight } from "react-icons/fa6";
import { IoPlayOutline, IoBriefcase } from "react-icons/io5";
import { IoMdTime, IoIosPause } from "react-icons/io";
import { BsCalendar2Fill } from "react-icons/bs";
import { RiDeleteBinLine } from "react-icons/ri";
import { GoZap } from "react-icons/go";
import { FaGift } from "react-icons/fa";
import { IoSwapHorizontal } from "react-icons/io5";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const Dashboard = () => {
  const [agents, setAgents] = useState([
    {
      id: 1,
      type: "gift",
      receiver: "Sarah",
      amount: 50,
      schedule: "yearly",
      date: "4/12/2026",
      minBal: 2000,
      active: true,
    },
    {
      id: 2,
      type: "salary",
      receiver: "John",
      amount: 1200,
      schedule: "monthly",
      date: "1/1/2026",
      minBal: 5000,
      active: true,
    },
    {
      id: 3,
      type: "subscription",
      receiver: "Netflix",
      amount: 15,
      schedule: "monthly",
      date: "2/1/2026",
      minBal: 100,
      active: false,
    },
    {
      id: 4,
      type: "conditional",
      receiver: "Mike",
      amount: 300,
      schedule: "weekly",
      date: "3/1/2026",
      minBal: 500,
      active: true,
    },
  ]);

  const navigate = useNavigate();

  const dashData = [
    {
      amount: agents.length,
      label: "Total Rules",
      icon: <FaRobot className="h-5 w-5 md:h-6 md:w-6 text-[#1ee3bf]" />,
    },
    {
      amount: agents.filter((a) => a.active).length,
      label: "Active Agents",
      icon: <IoPlayOutline className="h-5 w-5 md:h-6 md:w-6 text-[#1ee3bf]" />,
    },
    {
      amount: "$12,000",
      label: "Total Scheduled",
      icon: <IoMdTime className="h-5 w-5 md:h-6 md:w-6 text-[#1ee3bf]" />,
    },
  ];

  // icon selector
  const getIcon = (type) => {
    switch (type) {
      case "salary":
        return <IoBriefcase className="text-[#1ee3bf] h-4 w-4 md:w-5 md:h-5" />;
      case "gift":
        return <FaGift className="text-[#1ee3bf] h-4 w-4 md:w-5 md:h-5" />;
      case "subscription":
        return (
          <IoSwapHorizontal className="text-[#1ee3bf] h-4 w-4 md:w-5 md:h-5" />
        );
      case "conditional":
        return <GoZap className="text-[#1ee3bf] h-4 w-4 md:w-5 md:h-5" />;
      default:
        return <FaRobot className="text-[#1ee3bf] h-4 w-4 md:w-5 md:h-5" />;
    }
  };

  // toggle play pause
  const toggleAgent = (id) => {
    setAgents((prev) =>
      prev.map((a) => (a.id === id ? { ...a, active: !a.active } : a)),
    );
  };

  // delete
  const deleteAgent = (id) => {
    setAgents((prev) => prev.filter((a) => a.id !== id));
  };

  return (
    <div className="w-full pt-16 pb-5 md:pb-9 text-white">
      <div className="w-[95%] mx-auto">
        {/* header */}
        <div className="flex items-center justify-between flex-col md:flex-row gap-y-5 md:gap-y-0">
          <div>
            <h3 className="text-2xl font-semibold">Dashboard</h3>
            <p className="text-[#687e8e]">
              Manage your autonomous payment agents
            </p>
          </div>

          <button
            className="w-full md:w-fit bg-purple-600 font-semibold cursor-pointer px-4 py-1 md:py-1.5 rounded-2xl"
            onClick={() => navigate("/create-agent")}
          >
            New Agent
          </button>
        </div>

        {/* stats */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          {dashData.map((item, index) => (
            <div
              key={index}
              className="bg-[#12151a] rounded-2xl border border-[#141a1e] py-3"
            >
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
          {agents.map((agent) => (
            <div
              key={agent.id}
              className="bg-[#12151a] rounded-2xl border border-[#141a1e] py-3"
            >
              <div className="w-[96%] mx-auto flex flex-col md:flex-row gap-y-3 justify-between">
                {/* left */}
                <div className="flex gap-4">
                  <div className="h-10 w-10 bg-[#13413e] rounded-xl flex items-center justify-center">
                    {getIcon(agent.type)}
                  </div>

                  <div>
                    <h3 className="flex items-center gap-2">
                      <span className="text-purple-600 capitalize">
                        {agent.type}
                      </span>

                      <span className="font-bold">{agent.amount} USD₮</span>

                      <FaArrowRight className="text-[#687e8e]" />

                      <span className="font-bold">{agent.receiver}</span>

                      {agent.active ? (
                        <span className="text-xs text-green-400 bg-green-400/10 px-2 py-1 rounded-full animate-pulse">
                          Active
                        </span>
                      ) : (
                        <span className="text-xs text-yellow-400 bg-yellow-400/10 px-2 py-1 rounded-full animate-pulse">
                          Paused
                        </span>
                      )}
                    </h3>

                    <p className="flex gap-3 text-xs text-[#687e8e] pt-1">
                      <BsCalendar2Fill />
                      {agent.date}
                      <span>{agent.schedule}</span>
                      <span>Min bal: ${agent.minBal}</span>
                    </p>
                  </div>
                </div>

                {/* right */}
                <div className="flex items-end justify-end md:justify-normal md:items-center gap-2 md:gap-4">
                  <button className="hover:bg-purple-500 px-2 py-1 rounded-xl">
                    Details
                  </button>

                  <button
                    onClick={() => toggleAgent(agent.id)}
                    className="hover:bg-purple-500 w-8 h-8 flex items-center justify-center rounded-xl"
                  >
                    {agent.active ? <IoIosPause /> : <IoPlayOutline />}
                  </button>

                  <button
                    onClick={() => deleteAgent(agent.id)}
                    className="hover:bg-purple-500 w-8 h-8 flex items-center justify-center rounded-xl"
                  >
                    <RiDeleteBinLine className="text-red-500" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
