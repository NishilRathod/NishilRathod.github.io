import { useScroll, useSpring } from "motion/react";
import * as m from "motion/react-m";
import { useState } from "react";

import { prefersReducedMotion } from "../lib/motion";

/**
 * A hairline at the top of the viewport tracking how far down the page you are.
 *
 * Purely decorative — `aria-hidden`, non-interactive, and it duplicates
 * information the scrollbar already carries for anyone who needs it.
 */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const [reduced] = useState(prefersReducedMotion);

  // Raw scroll progress is exact but twitchy on trackpads. A stiff spring keeps
  // it honest while smoothing the jitter out.
  const scaleX = useSpring(scrollYProgress, { stiffness: 220, damping: 40, restDelta: 0.001 });

  // The whole bar *is* a transform. Under reduced motion that transform gets
  // stripped, which would leave a full-width accent bar pinned to the top of
  // the page permanently — worse than no bar at all. The scrollbar already
  // says everything this does.
  if (reduced) return null;

  return (
    <m.div
      aria-hidden="true"
      style={{ scaleX }}
      className="pointer-events-none fixed inset-x-0 top-0 z-50 h-0.5 origin-left bg-accent"
    />
  );
}
