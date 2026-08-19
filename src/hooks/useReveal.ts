import { useEffect, useRef, useState } from "react";

const prefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true;

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

  return { ref, revealed };
}
