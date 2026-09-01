import { LazyMotion, MotionConfig, domAnimation } from "motion/react";

import { Backdrop } from "./Backdrop";
import { Connect } from "./Connect";
import { Hero } from "./Hero";
import { ScrollProgress } from "./ScrollProgress";
import { Timeline } from "./Timeline";
import { Toolbelt } from "./Toolbelt";
import { Work } from "./Work";
import { profile } from "../content/profile";

/**
 * The previous design: a scrolling single-page portfolio.
 *
 * Retired, not deleted. `11eced8` is the last commit where this was the live
 * site; everything after it is the train. Nothing in the app imports this — the
 * only thing that renders it now is its own test suite, which is the point.
 * Code kept as a comment rots silently, and a directory of files nothing
 * compiles rots almost as fast. Kept this way, the old site still typechecks and
 * still has to pass its assertions, so it is genuinely restorable rather than
 * merely present: point `App` back at it and it is the site again.
 *
 * `Hero`, `Work`, `Timeline`, `Toolbelt`, `Connect`, `Backdrop`,
 * `ScrollProgress`, `ProjectCard`, `Reveal`, `useReveal` and the WebGL backdrop
 * under `src/webgl/` are untouched and reachable from here alone. `Icons`,
 * `MagneticLink` and `ObfuscatedEmail` are not — the posters use those too, so
 * they are shared code rather than retired code.
 */
export function LegacyPage() {
  return (
    <LazyMotion features={domAnimation} strict>
      {/*
        Drops transform animations when the OS asks for reduced motion while
        leaving opacity alone. Components that need to skip an entrance
        outright check `prefersReducedMotion()` themselves.
      */}
      <MotionConfig reducedMotion="user">
        <Backdrop />
        <ScrollProgress />

        <div className="relative z-10 mx-auto w-full max-w-3xl px-6 sm:px-8">
          <a
            href="#main"
            className="sr-only rounded bg-accent px-4 py-2 font-mono text-sm font-medium text-bg focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50"
          >
            Skip to content
          </a>

          <Hero />

          <main id="main">
            <Work />
            <Timeline />
            <Toolbelt />
            <Connect />
          </main>

          <footer className="border-t border-hairline py-10 font-mono text-xs text-muted">
            <p>
              Built from scratch by {profile.name} · {new Date().getFullYear()}
            </p>
          </footer>
        </div>
      </MotionConfig>
    </LazyMotion>
  );
}
