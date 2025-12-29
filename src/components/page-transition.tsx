"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { usePathname } from "next/navigation";

type PageTransitionProps = {
  children: React.ReactNode;
};

export function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname();
  const shouldReduceMotion = useReducedMotion();

  const transition = shouldReduceMotion
    ? { duration: 0 }
    : { duration: 0.2, ease: "easeOut" };
  const initial = shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 6 };
  const animate = shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 1, y: 0 };
  const exit = shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: -6 };

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={initial}
        animate={animate}
        exit={exit}
        transition={transition}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
