import { LazyMotion, MotionConfig, domAnimation } from "motion/react";
import { useCallback, useState, useSyncExternalStore } from "react";

import { prefersReducedMotion } from "./lib/motion";
import { MIN_TRAIN_WIDTH } from "./lib/train";
import { Manifest } from "./train/Manifest";
import { Train } from "./train/Train";

/**
 * Which of the two views of the same content you get.
 *
 * The train is the site. The manifest is not a fallback in the apologetic
 * sense — it is the identical posters rendered as a document, and it is what a
 * screen reader, a search engine, a phone, and anyone who just wants to skim a
 * résumé gets. Two containers, one source of truth; see `train/Manifest.tsx`.
 *
 * The carriage itself is CSS transforms and one `requestAnimationFrame` loop —
 * nothing under `src/train/` imports Motion. The providers are still here for
 * one reason: the contact poster reuses `MagneticLink`, which is an `m.a`. An
 * `m.*` component outside a `LazyMotion` provider does not fail, it renders a
 * plain element and drops every gesture on the floor, so leaving them out would
 * have shipped social links that look animated in the source and are inert in
 * the browser. `strict` keeps that from spreading: a stray `motion.*` import
 * would throw rather than quietly pull the full bundle back in.
 */

const WIDE_ENOUGH = `(min-width: ${MIN_TRAIN_WIDTH}px)`;

/** Null where there is no `matchMedia` at all — jsdom without the stub, or any
 *  non-browser render. Narrow is the safe answer in that case: the manifest
 *  needs nothing but a document. */
const query = () =>
  typeof window !== "undefined" && typeof window.matchMedia === "function"
    ? window.matchMedia(WIDE_ENOUGH)
    : null;

/**
 * Subscribing to the media query rather than to `resize` is the whole reason
 * this is a store. `resize` fires continuously while a window is dragged and
 * every one of those would re-render the entire train; the query fires twice in
 * a session, on the crossings that actually change which view is right.
 */
const subscribe = (onChange: () => void) => {
  const media = query();
  media?.addEventListener("change", onChange);
  return () => media?.removeEventListener("change", onChange);
};

const isWideEnough = () => query()?.matches === true;

export default function App() {
  // Below MIN_TRAIN_WIDTH the stage scales down far enough that poster text
  // stops being legible — see the constant's note in `lib/train.ts`. A carriage
  // you cannot read is worse than no carriage.
  const boardable = useSyncExternalStore(subscribe, isWideEnough, () => false);

  // Read once. A visitor who changes this OS setting mid-visit is not a case
  // worth a subscription, and re-rendering the train on it would remount the
  // camera and put them back on the platform.
  const [reduced] = useState(prefersReducedMotion);

  // Whether they have asked for the plain page. Not persisted: boarding is the
  // point of the site, and a stored preference would quietly hide it from
  // someone who clicked through once.
  const [reading, setReading] = useState(false);

  const read = useCallback(() => setReading(true), []);
  const board = useCallback(() => setReading(false), []);

  return (
    <LazyMotion features={domAnimation} strict>
      {/* Drops transform animations when the OS asks for reduced motion while
          leaving opacity alone. The camera checks `reduced` itself. */}
      <MotionConfig reducedMotion="user">
        {/* Boarding again returns you to the car you left with no extra
            plumbing: `Train` writes `#<car-id>` on every arrival and reads it
            back on mount. */}
        {boardable && !reading ? (
          <Train reduced={reduced} onLeave={read} />
        ) : (
          <Manifest onBoard={board} boardable={boardable} />
        )}
      </MotionConfig>
    </LazyMotion>
  );
}
