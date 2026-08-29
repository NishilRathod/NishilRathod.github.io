/**
 * Shared motion vocabulary. Every animation on the page draws its easing and
 * timing from here, so the whole thing moves like one hand made it.
 */

import type { Transition, Variants } from "motion/react";

/** Expo-out. Leaves fast, lands slowly — the restrained-but-expensive curve. */
export const EASE_OUT_EXPO = [0.16, 1, 0.3, 1] as const;

/** Long enough to read as deliberate, short enough not to hold up the page. */
export const REVEAL_DURATION = 0.6;

export const revealTransition: Transition = {
  duration: REVEAL_DURATION,
  ease: EASE_OUT_EXPO,
};

/**
 * Entrance flavours. Body copy rises, cards lift toward the reader, and
 * timeline entries slide out from their rail — the movement says something
 * about what the content is.
 */
export const REVEAL_VARIANTS = {
  up: {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0 },
  },
  lift: {
    hidden: { opacity: 0, y: 24, scale: 0.98 },
    visible: { opacity: 1, y: 0, scale: 1 },
  },
  slide: {
    hidden: { opacity: 0, x: -16 },
    visible: { opacity: 1, x: 0 },
  },
  /**
   * Moves nothing itself; exists purely to hand the hidden/visible label down
   * to children that animate on their own terms. Without it, a wrapper that
   * only orchestrates would still fade, and its children's motion would be
   * lost inside the parent's.
   */
  none: {
    hidden: {},
    visible: {},
  },
} satisfies Record<string, Variants>;

export type RevealVariant = keyof typeof REVEAL_VARIANTS;

/** True only for devices that can actually hover a cursor over a card. */
export const hasFinePointer = () =>
  typeof window !== "undefined" && window.matchMedia?.("(pointer: fine)").matches === true;

/**
 * Read at call time rather than through Motion's `useReducedMotion`, which
 * resolves the query once when its module first loads. Querying live keeps the
 * answer honest and keeps it stubbable from a test.
 */
export const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true;
