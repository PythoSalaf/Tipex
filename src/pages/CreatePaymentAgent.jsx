import { LuSparkles } from "react-icons/lu";
import { FaRobot } from "react-icons/fa6";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const CreatePaymentAgent = () => {
  const [prompt, setPrompt] = useState("");
  const navigate = useNavigate();

  const [form, setForm] = useState({
    ruleType: "",
    name: "",
    address: "",
    token: "",
    amount: "",
    balance: "",
    schedule: "",
    date: "",
    chain: "",
  });

  const ruleType = [
    { value: "gift", label: "🎁 Gift" },
    { value: "salary", label: "💼 Salary" },
    { value: "subscription", label: "🔄 Subscription" },
    { value: "conditional", label: "⚡ Conditional" },
  ];

  // ✅ PARSER

  const parseRule = () => {
    const text = prompt.toLowerCase();

    let type = "";

    if (text.includes("salary")) type = "salary";
    else if (text.includes("gift")) type = "gift";
    else if (text.includes("subscription")) type = "subscription";
    else if (text.includes("if")) type = "conditional";

    const amountMatch = text.match(/pay\s+(\d+)/);
    const tokenMatch = text.match(/(usdt|usd|eth|btc)/);
    const nameMatch = text.match(/to\s+([a-z]+)/);
    const scheduleMatch = text.match(/(daily|weekly|monthly|yearly)/);
    const balanceMatch = text.match(/balance\s*>\s*(\d+)/);

    let chain = "";

    if (text.includes("ethereum")) chain = "Ethereum";
    else if (text.includes("polygon")) chain = "Polygon";
    else if (text.includes("arbitrum")) chain = "Arbitrum";
    else if (text.includes("base")) chain = "Base";
    else if (text.includes("optimism")) chain = "Optimism";

    setForm({
      ...form,
      ruleType: type,
      name: nameMatch ? nameMatch[1] : "",
      token: tokenMatch ? tokenMatch[1].toUpperCase() : "",
      amount: amountMatch ? amountMatch[1] : "",
      schedule: scheduleMatch ? scheduleMatch[1] : "",
      balance: balanceMatch ? balanceMatch[1] : "",
      chain,
    });
  };

  return (
    <div className="w-full pt-16 text-white">
      <div className="flex flex-col items-center justify-center ">
        <h3 className="text-xl md:text-2xl lg:text-3xl font-semibold mt-4">
          Create Payment Agent
        </h3>

        <p className="mt-3 text-[#687e8e] text-sm md:text-base lg:text-lg text-center">
          Define payment conditions and let your AI agent handle the rest.
        </p>

        <div className="w-[95%] mx-auto md:w-[80%] lg:w-[60%]">
          {/* AI Rule Builder */}

          <div className="bg-[#12151a] rounded-xl border border-[#141a1e] py-4 mt-10 shadow-2xl">
            <div className="w-[92%] mx-auto">
              <div className="flex items-center gap-2.5">
                <LuSparkles className="h-5 md:h-7 w-5 md:w-7 text-purple-500" />
                <h4 className="text-sm md:text-base font-semibold lg:text-lg">
                  AI Rule Builder
                </h4>
              </div>

              <div className="flex items-center gap-3 mt-4 mb-3">
                <input
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  type="text"
                  className="bg-[#0e1116] outline-0 w-[86%] rounded-xl h-10 border border-[#687e8e]/30 px-3 text-sm md:text-base lg:text-lg placeholder:text-sm placeholder:text-[#687e8e] font-semibold"
                  placeholder='"Pay 1200 USD₮ salary to John every month if balance > $2000"'
                />

                <button
                  onClick={parseRule}
                  className="ml-auto bg-purple-600 py-1 text-white px-5 rounded-lg text-base font-semibold cursor-pointer"
                >
                  Parse
                </button>
              </div>
            </div>
          </div>

          {/* Automation Type */}

          <div className="mt-7">
            <h3 className="text-lg md:text-xl lg:text-2xl font-semibold">
              Automation Type
            </h3>

            <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-4 ">
              {ruleType.map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() =>
                    setForm({
                      ...form,
                      ruleType: item.value,
                    })
                  }
                  className={`text-xs md:text-sm rounded-full flex items-center border font-semibold px-4 py-1 transition-all
                    ${
                      form.ruleType === item.value
                        ? "border-primary bg-[#1ee3bf] text-black  "
                        : "border-[#687e8e]/30 text-primary"
                    }
                  `}
                >
                  {item.label}
                </button>
              ))}
            </div>

            {/* FORM */}

            <div className="w-full mt-8 mb-4">
              <div className="flex flex-col md:flex-row items-center gap-8 justify-between">
                <div className="w-full">
                  <label>Recipient Name</label>
                  <input
                    value={form.name}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        name: e.target.value,
                      })
                    }
                    type="text"
                    className="w-full rounded-xl px-2 h-9 border mt-3 border-[#687e8e]/30 "
                  />
                </div>

                <div className="w-full">
                  <label>Recipient Address</label>
                  <input
                    value={form.address}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        address: e.target.value,
                      })
                    }
                    type="text"
                    className="w-full rounded-xl px-2 h-9 border mt-3 border-[#687e8e]/30 "
                  />
                </div>
              </div>

              <div className="flex flex-col md:flex-row items-center mt-4 md:mt-8 gap-8 justify-between">
                <div className="w-full">
                  <label>Token</label>
                  <input
                    value={form.token}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        token: e.target.value,
                      })
                    }
                    type="text"
                    className="w-full rounded-xl px-2 h-9 border mt-3 border-[#687e8e]/30 "
                  />
                </div>

                <div className="w-full">
                  <label>Amount</label>
                  <input
                    value={form.amount}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        amount: e.target.value,
                      })
                    }
                    type="number"
                    className="w-full rounded-xl px-2 h-9 border mt-3 border-[#687e8e]/30 "
                  />
                </div>

                <div className="w-full">
                  <label>Balance($)</label>
                  <input
                    value={form.balance}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        balance: e.target.value,
                      })
                    }
                    type="number"
                    className="w-full rounded-xl px-2 h-9 border mt-3 border-[#687e8e]/30 "
                  />
                </div>
              </div>

              <div className="flex flex-col md:flex-row items-center mt-4 md:mt-8 gap-8 justify-between">
                <div className="w-full">
                  <label>Schedule</label>
                  <input
                    value={form.schedule}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        schedule: e.target.value,
                      })
                    }
                    type="text"
                    className="w-full rounded-xl px-2 h-9 border mt-3 border-[#687e8e]/30 "
                  />
                </div>

                <div className="w-full">
                  <label>Start Date</label>
                  <input
                    value={form.date}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        date: e.target.value,
                      })
                    }
                    type="date"
                    className="w-full rounded-xl px-2 h-9 border mt-3 border-[#687e8e]/30 "
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Preferred Chains */}

          <div className="my-5">
            <h3 className="text-lg md:text-xl lg:text-2xl font-semibold">
              Preferred Chains
            </h3>

            <div className="mt-5 grid grid-cols-3 md:grid-cols-5 gap-4 ">
              {["Ethereum", "Polygon", "Arbitrum", "Base", "Optimism"].map(
                (item, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() =>
                      setForm({
                        ...form,
                        chain: item,
                      })
                    }
                    className={`text-xs md:text-sm rounded-full flex items-center font-semibold justify-center border px-4 py-1 transition-all
                      ${
                        form.chain === item
                          ? "border-primary bg-[#1ee3bf] text-black"
                          : "border-[#687e8e]/30 text-primary"
                      }
                    `}
                  >
                    {item}
                  </button>
                ),
              )}
            </div>
          </div>

          <div className="mt-10 mb-6 flex gap-10">
            <button className="bg-[#1ee3bf] text-black px-3 py-2 rounded-xl text-base font-semibold flex items-center gap-1.5 cursor-pointer">
              <FaRobot className="h-5 w-5" />
              Create Agent
            </button>

            <button
              className="border border-purple-600 px-4 py-0.5 cursor-pointer rounded-2xl font-semibold text-sm md:text-base "
              onClick={() => navigate(-1)}
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatePaymentAgent;
