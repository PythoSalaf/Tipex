/**
 * Animation presets and utilities for Framer Motion
 * Provides reusable animation variants with accessibility support
 */

import { useReducedMotion } from "framer-motion";

/**
 * Check if user prefers reduced motion
 * @returns {boolean} - Whether to reduce motion
 */
export const useAnimationPreferences = () => {
    const shouldReduceMotion = useReducedMotion();
    return { shouldReduceMotion };
};

// Page transition variants
export const pageVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -20 }
};

// Faster page transitions for reduced motion
export const pageVariantsReduced = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 }
};

// Fade variants
export const fadeIn = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 }
};

// Slide from bottom
export const slideUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0 }
};

// Slide from left
export const slideLeft = {
    hidden: { opacity: 0, x: -30 },
    visible: { opacity: 1, x: 0 }
};

// Scale in
export const scaleIn = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { opacity: 1, scale: 1 }
};

// Stagger container for lists
export const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.1,
            delayChildren: 0.1
        }
    }
};

// Stagger item
export const staggerItem = {
    hidden: { opacity: 0, y: 20 },
    visible: {
        opacity: 1,
        y: 0,
        transition: {
            type: "spring",
            stiffness: 100,
            damping: 20
        }
    }
};

// Button hover/tap variants
export const buttonHover = {
    rest: { scale: 1 },
    hover: { scale: 1.05 },
    tap: { scale: 0.95 }
};

// Card hover variants
export const cardHover = {
    rest: { scale: 1, y: 0 },
    hover: {
        scale: 1.02,
        y: -5,
        transition: { type: "spring", stiffness: 300, damping: 20 }
    }
};

// Glow effect variants
export const glowEffect = {
    rest: { boxShadow: "0 0 0 rgba(30, 227, 191, 0)" },
    hover: {
        boxShadow: "0 10px 30px rgba(30, 227, 191, 0.2)",
        transition: { duration: 0.3 }
    }
};

// Timing presets
export const timing = {
    fast: { duration: 0.15 },
    normal: { duration: 0.3 },
    slow: { duration: 0.5 },
    spring: { type: "spring", stiffness: 300, damping: 25 }
};

/**
 * Get appropriate page variants based on motion preferences
 * @param {boolean} shouldReduceMotion - Whether to reduce motion
 * @returns {object} - Page variants
 */
export const getPageVariants = (shouldReduceMotion) => {
    return shouldReduceMotion ? pageVariantsReduced : pageVariants;
};

/**
 * Get staggered variants based on motion preferences
 * @param {boolean} shouldReduceMotion - Whether to reduce motion
 * @returns {object} - Stagger container variants
 */
export const getStaggerVariants = (shouldReduceMotion) => {
    if (shouldReduceMotion) {
        return {
            hidden: { opacity: 0 },
            visible: { opacity: 1 }
        };
    }
    return staggerContainer;
};
