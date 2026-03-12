import { GoZap } from "react-icons/go";
import { LuBrain } from "react-icons/lu";
import { FaRobot } from "react-icons/fa6";
import { BsShield } from "react-icons/bs";
import { PiSwapBold } from "react-icons/pi";
import { GiStaryu } from "react-icons/gi";
import { EmblaRow, WorkCard } from "../components";

const Home = () => {
  const workData = [
    {
      id: 1,
      title: "Autonomous Agents",
      icon: <FaRobot className="h-4 w-4 md:h-6 md:w-6 text-[#1ee3bf]" />,
      description:
        "Set rules once. Your AI agent monitors conditions, reasons about execution, and transfers tokens automatically.",
    },
    {
      id: 2,
      title: "AI Reasoning Engine",
      icon: <LuBrain className="h-4 w-4 md:h-6 md:w-6 text-[#1ee3bf]" />,
      description:
        "Before every payment, AI evaluates your balance, upcoming obligations, and economic sustainability to make smart decisions.",
    },
    {
      id: 3,
      title: "Multi-Chain Optimization",
      icon: <GoZap className="h-4 w-4 md:h-6 md:w-6 text-[#1ee3bf]" />,
      description:
        "Agents pick the cheapest chain for each transaction across Ethereum, Polygon, Arbitrum, Base & more.",
    },
    {
      id: 4,
      title: "Self-Custodial Wallets",
      icon: <BsShield className="h-4 w-4 md:h-6 md:w-6 text-[#1ee3bf]" />,
      description:
        "Each rule gets a dedicated agent wallet. You stay in control fund it, pause it, or shut it down anytime.",
    },
    {
      id: 5,
      title: "All Payment Types",
      icon: <PiSwapBold className="h-4 w-4 md:h-6 md:w-6 text-[#1ee3bf]" />,
      description:
        "Gifts, salaries, subscriptions, conditional transfers  automate any recurring or one-time payment with USD₮ and XAU₮.",
    },
    {
      id: 6,
      title: "Natural Language Rules",
      icon: <GiStaryu className="h-4 w-4 md:h-6 md:w-6 text-[#1ee3bf]" />,
      description:
        "Pay 1200 USD₮ salary to John every month if balance > $2000 just type it and the agent understands.",
    },
  ];
  return (
    <div className="w-full  text-white">
      <header className="w-full h-[75vh] md:h-screen bg-gradient-hero pt-24">
        <div className="w-[95%] mx-auto flex  items-center justify-center flex-col">
          <div className="flex items-center gap-2 rounded-full border border-[#23a272]/30  px-4 py-1.5 text-sm md:text-base text-[#23a272] bg-[#23a272]/10 mb-4 animate-pulse">
            <GoZap className="h-3 md:h-4 w-3 md:w-4" />
            <h3 className="">Autonomous Payment Agents</h3>
          </div>
          <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-center tracking-tight leading-14 md:leading-20 lg:leading-24 mb-4.5">
            <span className="text-gradient">Autonomous </span> <br /> Stablecoin
            Payments
          </h1>
          <p className="text-[#687e8e] text-base md:text-lg lg:text-xl text-center max-w-3xl leading-9">
            Create autonomous agents that execute gifts, salaries, subscriptions
            & conditional transfers on-chain using USD₮ and XAU₮ all hands-free.
          </p>
          <div className="mt-10 flex items-center gap-x-8">
            <div className="">
              <button className="bg-[#1ee3bf] text-black px-4 text-base  font-semibold cursor-pointer rounded-2xl py-1.5">
                Connect Wallet
              </button>
            </div>
            <button className="border border-[#23a272] px-5 py-1.5 rounded-2xl font-semibold cursor-pointer  ">
              Get started
            </button>
          </div>
        </div>
      </header>
      <div className="w-[95%] mx-auto my-20">
        <EmblaRow reverse={false} />
        {/* <div className="mt-5">
          ,<EmblaRow reverse={true} />
        </div> */}
      </div>
      <section className="mt-10 mb-7 w-[95%] mx-auto">
        <h3 className="text-center font-bold text-2xl md:text-3xl lg:text-4xl">
          How it work
        </h3>
        <div className="mt-7 grid grid-cols-1 md:gridcls-2 lg:grid-cols-3 gap-4 md:gap-6 ">
          {workData.map((item) => (
            <WorkCard key={item.id} {...item} />
          ))}
        </div>
      </section>
      <div className="mt-8 md:mt-14 mb-6 w-[85%] md:w-[70%] lg:w-[60%] mx-auto py-5 bg-[#12151a] rounded-2xl border border-[#141a1e]">
        <div className="flex flex-col items-center justify-center">
          <FaRobot className="h-7 w-7 md:h-9 md:w-9 text-[#1ee3bf] animate-bounce" />
          <h3 className="text-xl md:text-2xl lg:text-3xl font-semibold my-5 text-center">
            Ready to automate your payments?
          </h3>
          <p className="text-[#687e8e] text-sm md:text-base lg:text-lg text-center  max-w-xl">
            Connect your wallet and create your first autonomous payment agent
            in under a minute.
          </p>
          <div className="mt-7 mb-2">
            <button className="bg-[#1ee3bf] text-black px-4 text-base  font-semibold cursor-pointer rounded-2xl py-1.5">
              Connect Wallet
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
