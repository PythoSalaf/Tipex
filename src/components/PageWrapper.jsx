/**
 * PageWrapper - Page transition wrapper component
 * Provides smooth enter/exit animations for routes
 */

import { motion } from "framer-motion";
import { useAnimationPreferences, getPageVariants } from "../lib/animations";

const PageWrapper = ({ children, className = "" }) => {
    const { shouldReduceMotion } = useAnimationPreferences();
    const variants = getPageVariants(shouldReduceMotion);

    return (
        <motion.div
            className={className}
            variants={variants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{
                duration: shouldReduceMotion ? 0.15 : 0.3,
                ease: "easeOut"
            }}
        >
            {children}
        </motion.div>
    );
};

export default PageWrapper;
