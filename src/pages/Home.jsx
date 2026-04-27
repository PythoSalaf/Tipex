import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { GoZap } from "react-icons/go";
import { LuBrain } from "react-icons/lu";
import { FaRobot } from "react-icons/fa6";
import { BsShield } from "react-icons/bs";
import { PiSwapBold } from "react-icons/pi";
import { GiStaryu } from "react-icons/gi";
import { motion } from "framer-motion";
import { useAnimationPreferences } from "../lib/animations";
import { EmblaRow, Section, WorkCard } from "../components";

const Home = () => {
  const navigate = useNavigate();
  const [isConnected, setIsConnected] = useState(false);
  const { shouldReduceMotion } = useAnimationPreferences();

  useEffect(() => {
    setIsConnected(!!localStorage.getItem("seed"));
  }, []);

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

  // Animation variants
  const containerVariants = shouldReduceMotion
    ? { hidden: { opacity: 0 }, visible: { opacity: 1 } }
    : {
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: { staggerChildren: 0.1, delayChildren: 0.2 },
        },
      };

  const itemVariants = shouldReduceMotion
    ? { hidden: { opacity: 0 }, visible: { opacity: 1 } }
    : {
        hidden: { opacity: 0, y: 30 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { type: "spring", stiffness: 100, damping: 20 },
        },
      };

  return (
    <div className="w-full text-white">
      <header className="w-full h-[75vh] md:h-screen bg-gradient-hero pt-24 overflow-hidden relative">
        {/* Animated background gradient blobs */}
        {!shouldReduceMotion && (
          <>
            <motion.div
              className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#1ee3bf]/10 rounded-full blur-3xl"
              animate={{
                scale: [1, 1.2, 1],
                x: [0, 50, 0],
                y: [0, -30, 0],
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
            <motion.div
              className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl"
              animate={{
                scale: [1, 1.3, 1],
                x: [0, -40, 0],
                y: [0, 40, 0],
              }}
              transition={{
                duration: 10,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 1,
              }}
            />
          </>
        )}

        <div className="w-[95%] mx-auto flex items-center justify-center flex-col relative z-10">
          {/* Animated badge */}
          <motion.div
            className="flex items-center gap-2 rounded-full border border-[#23a272]/30 px-4 py-1.5 text-sm md:text-base text-[#23a272] bg-[#23a272]/10 mb-4"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <motion.div
              animate={
                shouldReduceMotion
                  ? {}
                  : {
                      scale: [1, 1.2, 1],
                    }
              }
              transition={{ duration: 2, repeat: Infinity }}
            >
              <GoZap className="h-3 md:h-4 w-3 md:w-4" />
            </motion.div>
            <h3 className="">Autonomous Payment Agents</h3>
          </motion.div>

          {/* Animated title */}
          <motion.h1
            className="text-3xl md:text-5xl lg:text-6xl font-bold text-center tracking-tight leading-14 md:leading-20 lg:leading-24 mb-4.5"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <motion.span
              className="text-gradient"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              Autonomous
            </motion.span>
            <br />
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.6 }}
            >
              Stablecoin Payments
            </motion.span>
          </motion.h1>

          <motion.p
            className="text-[#687e8e] text-base md:text-lg lg:text-xl text-center max-w-3xl leading-9"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.8 }}
          >
            Create autonomous agents that execute gifts, salaries, subscriptions
            & conditional transfers on-chain using USD₮ and XAU₮ all hands-free.
          </motion.p>

          <motion.div
            className="mt-10 flex items-center gap-x-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1 }}
          >
            {!isConnected && (
              <motion.button
                onClick={() => navigate("/")}
                className="bg-[#1ee3bf] text-black px-4 text-base font-semibold cursor-pointer rounded-2xl py-1.5"
                whileHover={
                  shouldReduceMotion
                    ? {}
                    : {
                        scale: 1.05,
                        boxShadow: "0 10px 30px rgba(30, 227, 191, 0.3)",
                      }
                }
                whileTap={shouldReduceMotion ? {} : { scale: 0.95 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                Create Wallet
              </motion.button>
            )}
            <motion.button
              onClick={() =>
                navigate(isConnected ? "/create-agent" : "/dashboard")
              }
              className="border border-[#23a272] px-5 py-1.5 rounded-2xl font-semibold cursor-pointer"
              whileHover={
                shouldReduceMotion
                  ? {}
                  : { scale: 1.05, borderColor: "#1ee3bf" }
              }
              whileTap={shouldReduceMotion ? {} : { scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              {isConnected ? "Create Agent" : "Get started"}
            </motion.button>
          </motion.div>
        </div>
      </header>

      <motion.div
        className="w-[95%] mx-auto my-14"
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{ duration: 0.6 }}
      >
        <Section />
      </motion.div>

      <motion.section
        className="mt-10 md:mt-14 mb-7 w-[95%] mx-auto"
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
      >
        <motion.h3
          className="text-center font-bold text-2xl md:text-3xl lg:text-4xl"
          variants={itemVariants}
        >
          How it work
        </motion.h3>
        <div className="mt-7 grid grid-cols-1 md:gridcls-2 lg:grid-cols-3 gap-4 md:gap-6 ">
          {workData.map((item) => (
            <WorkCard key={item.id} {...item} />
          ))}
        </div>
      </motion.section>

      <motion.div
        className="mt-8 md:mt-14 mb-6 w-[85%] md:w-[70%] lg:w-[60%] mx-auto py-5 bg-[#12151a] rounded-2xl border border-[#141a1e]"
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5 }}
        whileHover={
          shouldReduceMotion
            ? {}
            : {
                borderColor: "rgba(30, 227, 191, 0.3)",
                boxShadow: "0 20px 40px rgba(30, 227, 191, 0.1)",
              }
        }
      >
        <div className="flex flex-col items-center justify-center">
          <motion.div
            animate={
              shouldReduceMotion
                ? {}
                : {
                    y: [0, -10, 0],
                  }
            }
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            <FaRobot className="h-7 w-7 md:h-9 md:w-9 text-[#1ee3bf]" />
          </motion.div>
          <h3 className="text-xl md:text-2xl lg:text-3xl font-semibold my-5 text-center">
            Ready to automate your payments?
          </h3>
          <p className="text-[#687e8e] text-sm md:text-base lg:text-lg text-center max-w-xl">
            {isConnected
              ? "Your wallet is connected. Create your first autonomous payment agent now."
              : "Connect your wallet and create your first autonomous payment agent in under a minute."}
          </p>
          <div className="mt-7 mb-2">
            <motion.button
              onClick={() => navigate(isConnected ? "/create-agent" : "/")}
              className="bg-[#1ee3bf] text-black px-4 text-base font-semibold cursor-pointer rounded-2xl py-1.5"
              whileHover={
                shouldReduceMotion
                  ? {}
                  : {
                      scale: 1.05,
                      boxShadow: "0 10px 30px rgba(30, 227, 191, 0.3)",
                    }
              }
              whileTap={shouldReduceMotion ? {} : { scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              {isConnected ? "Create Agent" : "Create Wallet"}
            </motion.button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Home;
