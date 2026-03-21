import { motion } from "framer-motion";
import { useAnimationPreferences } from "../lib/animations";

const WorkCard = ({ title, icon, description }) => {
  const { shouldReduceMotion } = useAnimationPreferences();

  // Scroll-triggered animation variants
  const cardVariants = shouldReduceMotion
    ? {
        hidden: { opacity: 0 },
        visible: { opacity: 1 }
      }
    : {
        hidden: { opacity: 0, y: 30, scale: 0.95 },
        visible: {
          opacity: 1,
          y: 0,
          scale: 1,
          transition: {
            type: "spring",
            stiffness: 100,
            damping: 20
          }
        }
      };

  return (
    <motion.div
      className="w-[95%] h-56 md:w-full mx-auto bg-[#12151a] rounded-2xl border border-[#141a1e] cursor-pointer"
      variants={cardVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-50px" }}
      whileHover={
        shouldReduceMotion
          ? {}
          : {
              y: -5,
              scale: 1.02,
              boxShadow: "0 20px 40px rgba(30, 227, 191, 0.15)",
              borderColor: "rgba(30, 227, 191, 0.3)",
              transition: { type: "spring", stiffness: 300, damping: 20 }
            }
      }
      transition={{ duration: 0.3 }}
    >
      <div className="w-[90%] mx-auto py-3">
        <motion.div
          className="bg-[#13413e] rounded-xl flex items-center justify-center w-8 md:w-10 h-8 md:h-10"
          whileHover={shouldReduceMotion ? {} : { scale: 1.1, rotate: 5 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          {icon}
        </motion.div>
        <h3 className="text-lg md:text-xl lg:text-2xl font-semibold mt-5 mb-3">
          {title}
        </h3>
        <p className="text-[#687e8e]">{description}</p>
      </div>
    </motion.div>
  );
};

export default WorkCard;
