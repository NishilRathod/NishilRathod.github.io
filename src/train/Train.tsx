import { useCallback, useEffect, useRef, useState } from "react";

import { compartments } from "../content/compartments";
import { PERSPECTIVE, STAGE_H, STAGE_W } from "../lib/train";
import type { Intent } from "../lib/trainCamera";
import { Compartment } from "./Compartment";
import { HUD } from "./HUD";
import { useTrainCamera } from "./useTrainCamera";
import { useTrainInput } from "./useTrainInput";

/**
 * The carriage, assembled.
 *
 * The nesting is load-bearing and none of it is decorative:
 *
 *   stage    fills the window, clips, and catches drags
 *   frame    the fixed 1280x760 box the scene is composed against, scaled to
 *            cover the window — scaling here, OUTSIDE the perspective element,
 *            is what makes it a uniform zoom. Scaling inside would change the
 *            focal length with the window size and warp the room as you resize.
 *   viewport carries the perspective
 *   bob      the rise of the train on its bogies
 *   roll     and its roll — a separate element because the two are sines at
 *            different frequencies, so they cannot be one animation, and both
 *            are CSS so the render loop never has to wake up for them
 *   world    the camera: one translateZ, written by the render loop
 *
 * Every car is rendered, not just the ones nearby. Eight of them is a couple of
 * hundred elements, and keeping them all mounted means the whole résumé stays
 * in the document — findable with Ctrl+F, reachable by a screen reader — rather
 * than blinking in and out as you drive.
 *
 * What is culled is scenery, never content. Only the car you are in and its two
 * neighbours get lit windows, and everything past that gets a dark pane: the
 * detail is invisible at that distance anyway, and paying for it meant 96 live
 * gradients on screen at once. The bulkheads and every poster on them render
 * regardless of where you are standing.
 */

/** Fills the window rather than fitting inside it; letterboxing a first-person
 *  view breaks the illusion that you are inside the thing. */
const coverScale = () =>
  Math.max(window.innerWidth / STAGE_W, window.innerHeight / STAGE_H);

const carFromHash = () => {
  const id = window.location.hash.replace(/^#/, "");
  const found = compartments.findIndex((car) => car.id === id);
  return found === -1 ? 0 : found;
};

export function Train({ reduced, onLeave }: { reduced: boolean; onLeave: () => void }) {
  const stageRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const worldRef = useRef<HTMLDivElement>(null);

  const intentRef = useRef<Intent>(0);
  const impulseRef = useRef(0);

  const [startIndex] = useState(carFromHash);
  const [showHint, setShowHint] = useState(true);

  const { index, boarded, board, jumpTo, wake } = useTrainCamera({
    worldRef,
    carCount: compartments.length,
    intentRef,
    impulseRef,
    reduced,
    startIndex,
  });

  // The listeners read the index without being rebound every time it changes.
  const indexRef = useRef(index);
  indexRef.current = index;

  // The first input of any kind — a key, the wheel, a drag — is both "they have
  // seen the hint" and "they have decided to go", so it retires the one and
  // triggers the other.
  const onFirstMove = useCallback(() => {
    setShowHint(false);
    board();
  }, [board]);

  useTrainInput({
    enabled: true,
    reduced,
    carCount: compartments.length,
    stageRef,
    intentRef,
    impulseRef,
    indexRef,
    onJump: jumpTo,
    onFirstMove,
    wake,
  });

  // Scale the composed stage to cover the window.
  useEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;

    const fit = () => {
      frame.style.transform = `scale(${coverScale()})`;
    };

    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, []);

  // The train fills the window and has nothing to scroll.
  useEffect(() => {
    document.body.classList.add("is-riding");
    return () => document.body.classList.remove("is-riding");
  }, []);

  // Every car is a URL, so one can be linked to and the back button works.
  useEffect(() => {
    const car = compartments[index];
    if (!car || window.location.hash === `#${car.id}`) return;
    window.history.replaceState(null, "", `#${car.id}`);
  }, [index]);

  useEffect(() => {
    const onHashChange = () => jumpTo(carFromHash());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, [jumpTo]);

  return (
    <div
      ref={stageRef}
      className="fixed inset-0 touch-none overflow-hidden bg-bg select-none"
    >
      <div
        ref={frameRef}
        className="absolute top-1/2 left-1/2"
        style={{
          width: STAGE_W,
          height: STAGE_H,
          marginLeft: -STAGE_W / 2,
          marginTop: -STAGE_H / 2,
          transformOrigin: "center",
        }}
      >
        <div
          className="relative size-full"
          style={{ perspective: PERSPECTIVE, perspectiveOrigin: "50% 50%" }}
        >
          <div className="cabin-bob absolute inset-0" style={{ transformStyle: "preserve-3d" }}>
            <div className="cabin-roll absolute inset-0" style={{ transformStyle: "preserve-3d" }}>
              <div
                ref={worldRef}
                className="absolute inset-0"
                style={{ transformStyle: "preserve-3d" }}
              >
                {compartments.map((car, position) => (
                  <Compartment
                    key={car.id}
                    car={car}
                    index={position}
                    nextDestination={compartments[position + 1]?.destination ?? null}
                    isCurrent={position === index}
                    near={Math.abs(position - index) <= 1}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Depth. Dark at the vanishing point so the train recedes into the night
          rather than stopping at a wall — sized to sit over the doorway and not
          over the panels you are reading either side of it. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 22% 34% at 50% 52%, var(--color-bg) 0%, " +
            "color-mix(in srgb, var(--color-bg) 72%, transparent) 58%, transparent 100%)",
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 78% 78% at 50% 50%, transparent 38%, #000000cc 100%)",
        }}
      />

      <HUD
        cars={compartments}
        index={index}
        boarded={boarded}
        showHint={showHint}
        onJump={jumpTo}
        onLeave={onLeave}
      />
    </div>
  );
}
