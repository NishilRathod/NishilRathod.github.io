import * as m from "motion/react-m";
import type { Variants } from "motion/react";
import { useState } from "react";

import { profile } from "../content/profile";
import { EASE_OUT_EXPO, prefersReducedMotion, revealTransition } from "../lib/motion";

/** The hero is above the fold, so it plays on mount rather than on scroll. */
const container: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};

const line: Variants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: revealTransition },
};

/**
 * The name arrives from under its own mask instead of fading. At 7xl in
 * Fraunces, a wipe reads as typesetting; a fade reads as a loading state.
 */
const wipe: Variants = {
  hidden: { y: "110%" },
  visible: { y: "0%", transition: { duration: 0.9, ease: EASE_OUT_EXPO } },
};

export function Hero() {
  // The hero plays on mount, so there is no observer to fail open for us here.
  // Someone who asked for reduced motion gets the finished frame directly
  // rather than watching their name fade up out of nothing.
  const [reduced] = useState(prefersReducedMotion);

  return (
    <m.header
      initial={reduced ? false : "hidden"}
      animate="visible"
      variants={container}
      className="flex min-h-[90svh] flex-col justify-start pt-[18vh] pb-20 sm:pt-[20vh]"
    >
      <m.p
        variants={line}
        className="mb-6 font-mono text-xs tracking-[0.2em] text-accent uppercase"
      >
        Portfolio
      </m.p>

      <h1 className="font-display text-5xl leading-[1.05] font-medium sm:text-7xl">
        {/*
          The mask needs its own block with hidden overflow, and the padding
          keeps Fraunces' descenders from being clipped by it at rest.
        */}
        <span className="block overflow-hidden pb-[0.12em]">
          <m.span variants={wipe} className="block">
            {profile.name}
          </m.span>
        </span>
      </h1>

      <m.p
        variants={line}
        className="mt-8 max-w-2xl text-lg leading-relaxed text-balance sm:text-xl"
      >
        {profile.tagline}
      </m.p>

      <m.p variants={line} className="mt-4 max-w-2xl font-mono text-sm text-muted">
        {profile.status}
      </m.p>

      <m.a
        variants={line}
        href="#work"
        className="mt-auto inline-flex w-fit items-center gap-2 pt-16 font-mono text-sm text-muted transition-colors hover:text-accent"
      >
        scroll
        <span aria-hidden="true" className="motion-safe:animate-bounce">
          ↓
        </span>
      </m.a>
    </m.header>
  );
}
