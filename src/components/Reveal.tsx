import * as m from "motion/react-m";
import type { ReactNode } from "react";

import { useReveal } from "../hooks/useReveal";
import { REVEAL_VARIANTS, revealTransition, type RevealVariant } from "../lib/motion";

type RevealProps = {
  children: ReactNode;
  className?: string;
  /** Stagger, in milliseconds, for items revealed as a group. */
  delay?: number;
  /** Which entrance flavour to use. See REVEAL_VARIANTS. */
  variant?: RevealVariant;
};

/**
 * Fades content in as it scrolls into view.
 *
 * Deliberately *not* Motion's `whileInView`: `useReveal` owns the decision about
 * whether to hide anything at all, and it fails open when there is no
 * IntersectionObserver or the visitor asked for reduced motion. Motion only
 * does the tweening.
 */
export function Reveal({ children, className = "", delay = 0, variant = "up" }: RevealProps) {
  // If the hook was visible on its very first render, there is nothing to
  // animate — `initial={false}` paints the final state instead of playing an
  // entrance nobody asked for.
  const { ref, revealed, startedRevealed } = useReveal<HTMLDivElement>();

  return (
    <m.div
      ref={ref}
      className={className}
      variants={REVEAL_VARIANTS[variant]}
      initial={startedRevealed ? false : "hidden"}
      animate={revealed ? "visible" : "hidden"}
      transition={{ ...revealTransition, delay: delay / 1000 }}
    >
      {children}
    </m.div>
  );
}
