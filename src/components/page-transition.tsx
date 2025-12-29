"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { usePathname } from "next/navigation";

import { getFadeMotion, getMotionTransition } from "@/lib/motion";

type PageTransitionProps = {
  children: React.ReactNode;
};

export function PageTransition({ children }: PageTransitionProps) {
  const pathname = usePathname();
  const shouldReduceMotion = useReducedMotion() ?? false;

  const transition = getMotionTransition(shouldReduceMotion);
  const { initial, animate, exit } = getFadeMotion(shouldReduceMotion, { enterY: 6, exitY: -6 });

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
