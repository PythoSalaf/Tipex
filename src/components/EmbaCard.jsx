import { motion } from "framer-motion";
import { FaRobot } from "react-icons/fa6";
import { useAnimationPreferences } from "../lib/animations";

const EmbaCard = ({ title, status, schedule, amount, receiver, condition }) => {
  const { shouldReduceMotion } = useAnimationPreferences();

  return (
    <motion.div
      className="w-87.5 shrink-0 bg-[#12151c] rounded-xl cursor-pointer"
      whileHover={
        shouldReduceMotion
          ? {}
          : {
              scale: 1.02,
              boxShadow: "0 20px 40px rgba(30, 227, 191, 0.15)",
              borderColor: "rgba(30, 227, 191, 0.2)",
            }
      }
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    >
      <div className="p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <motion.div
              className="bg-[#13413e] rounded-xl flex items-center justify-center w-8 h-8"
              whileHover={shouldReduceMotion ? {} : { rotate: 15, scale: 1.1 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <FaRobot className="h-4 w-4 text-[#1ee3bf]" />
            </motion.div>

            <div>
              <h3 className="text-base font-semibold">{title}</h3>

              <p className="text-xs">
                {status} · {schedule}
              </p>
            </div>
          </div>

          <motion.h4
            className="bg-[#153029] text-[#2d8259] text-sm px-3 py-0.5 rounded-2xl"
            whileHover={shouldReduceMotion ? {} : { scale: 1.05 }}
          >
            {status}
          </motion.h4>
        </div>

        <p className="text-sm text-[#687e8e] font-mono">
          Pay <span className="text-green-500 font-semibold">{amount}</span> to{" "}
          <span className="text-purple-400 font-semibold">{receiver}</span>{" "}
          {condition}
        </p>
      </div>
    </motion.div>
  );
};

export default EmbaCard;
