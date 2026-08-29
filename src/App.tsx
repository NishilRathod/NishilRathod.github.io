import { LazyMotion, MotionConfig, domAnimation } from "motion/react";

import { Backdrop } from "./components/Backdrop";
import { Connect } from "./components/Connect";
import { Hero } from "./components/Hero";
import { ScrollProgress } from "./components/ScrollProgress";
import { Timeline } from "./components/Timeline";
import { Toolbelt } from "./components/Toolbelt";
import { Work } from "./components/Work";
import { profile } from "./content/profile";

/**
 * The Motion providers live here rather than in `main.tsx` so that anything
 * rendering `<App />` — the tests included — gets the same runtime the browser
 * does. Without the provider, `m.*` components render their initial styles and
 * then silently never animate, which is a very quiet way for a test suite to
 * stop testing anything.
 *
 * `domAnimation` is the small feature bundle: transforms, variants, and
 * gestures, but none of the layout projection this site never uses. `strict`
 * makes the `motion.*` components throw, so a stray import cannot quietly pull
 * the full bundle back in — every component here uses `m.*`.
 */
export default function App() {
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
