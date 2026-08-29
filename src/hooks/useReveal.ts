import { useEffect, useRef, useState } from "react";

import { prefersReducedMotion } from "../lib/motion";

const canObserve = () =>
  typeof window !== "undefined" && typeof window.IntersectionObserver === "function";

/**
 * Fades an element in as it scrolls into view.
 *
 * Starts *visible* whenever the animation can't or shouldn't run — reduced
 * motion, or no IntersectionObserver. Failing closed here would leave the page
 * permanently blank, which is a far worse outcome than a missing flourish.
 */
export function useReveal<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [revealed, setRevealed] = useState(() => !(canObserve() && !prefersReducedMotion()));

  // Whether the very first render was already visible. Callers use this to skip
  // entrance animations outright rather than playing one from a state the
  // element was never actually in.
  const [startedRevealed] = useState(revealed);

  useEffect(() => {
    if (revealed) return;

    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setRevealed(true);
            observer.disconnect();
          }
        }
      },
      { rootMargin: "0px 0px -10% 0px", threshold: 0.05 },
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [revealed]);

  return { ref, revealed, startedRevealed };
}
