/**
 * AnimatedCounter - Animated number counter component
 * Counts up from 0 to the target value when in view
 */

import { useEffect, useRef, useState } from "react";
import { motion, useInView, useSpring, useTransform } from "framer-motion";
import { useAnimationPreferences } from "../lib/animations";

const AnimatedCounter = ({
    value,
    suffix = "",
    prefix = "",
    duration = 1.5,
    className = ""
}) => {
    const ref = useRef(null);
    const { shouldReduceMotion } = useAnimationPreferences();
    const isInView = useInView(ref, { once: true, margin: "-50px" });
    const [displayValue, setDisplayValue] = useState(0);

    // Parse the value - handle both numbers and strings like "1200 USDT"
    const numericValue = typeof value === 'string'
        ? parseFloat(value.replace(/[^0-9.-]/g, '')) || 0
        : value;

    // Spring animation for smooth counting
    const spring = useSpring(0, {
        stiffness: shouldReduceMotion ? 100 : 50,
        damping: shouldReduceMotion ? 30 : 20,
        duration: shouldReduceMotion ? 0.3 : duration
    });

    // Transform spring value to display
    const display = useTransform(spring, (latest) => {
        return Math.round(latest).toLocaleString();
    });

    useEffect(() => {
        if (isInView && !shouldReduceMotion) {
            spring.set(numericValue);
        } else if (isInView) {
            setDisplayValue(numericValue);
        }
    }, [isInView, numericValue, shouldReduceMotion, spring]);

    // For reduced motion, just show the value
    useEffect(() => {
        if (shouldReduceMotion && isInView) {
            setDisplayValue(numericValue);
        }
    }, [shouldReduceMotion, isInView, numericValue]);

    // Subscribe to display changes for non-spring mode
    useEffect(() => {
        if (!shouldReduceMotion) {
            const unsubscribe = display.on("change", (latest) => {
                setDisplayValue(latest);
            });
            return () => unsubscribe();
        }
    }, [display, shouldReduceMotion]);

    // Handle runtime shouldReduceMotion changes
    useEffect(() => {
        if (shouldReduceMotion && numericValue !== displayValue) {
            setDisplayValue(numericValue);
            spring.set(numericValue);
        }
    }, [shouldReduceMotion, numericValue, displayValue, spring]);

    return (
        <motion.span
            ref={ref}
            className={className}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
        >
            {prefix}
            {shouldReduceMotion ? numericValue.toLocaleString() : displayValue}
            {suffix}
        </motion.span>
    );
};

export default AnimatedCounter;
