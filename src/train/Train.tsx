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
 *   clatter  the bogies crossing rail joints, on a third period again, so the
 *            three never line up into a rhythm you can predict
 *   world    the camera: one translateZ, written by the render loop
 *
 * Every car is rendered, not just the ones nearby. Eight of them is a couple of
 * hundred elements, and keeping them all mounted means the whole résumé stays
 * in the document — findable with Ctrl+F, reachable by a screen reader — rather
 * than blinking in and out as you drive.
 *
 * What is culled is scenery, never content. Only the car you are in and the one
 * ahead of it get a room built around them; the bulkheads and every poster on
 * them render wherever you are standing.
 *
 * Ahead only, because behind is never visible. The camera translates and never
 * turns, so the car you just left is behind your head — even caught at the
 * midpoint of a crossing, its nearest surface is still a couple of hundred
 * scene-px back. Building it cost a third of the scenery on screen, including
 * eight windows and the sixteen animating layers their streaks run on, for a
 * room nobody can look at.
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
      className={`fixed inset-0 touch-none overflow-hidden bg-bg select-none ${
        boarded ? "" : "is-platform"
      }`}
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
                className="cabin-clatter absolute inset-0"
                style={{ transformStyle: "preserve-3d" }}
              >
                <div
                  ref={worldRef}
                  className="train-world absolute inset-0"
                  style={{ transformStyle: "preserve-3d" }}
                >
                  {compartments.map((car, position) => (
                    <Compartment
                      key={car.id}
                      car={car}
                      index={position}
                      nextDestination={compartments[position + 1]?.destination ?? null}
                      isCurrent={position === index}
                      near={position === index || position === index + 1}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Depth. Dark at the vanishing point so the train recedes into the night
          rather than stopping at a wall — sized to sit over the doorway and not
          over the panels you are reading either side of it.

          Retuned twice as the camera stepped back, because it is drawn in
          screen space around a doorway that keeps getting smaller: at
          READ_GAP 420 it was sized for a wall that filled the frame, and it has
          shrunk with the door each time since. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 9% 26% at 50% 50%, " +
            "#05070cd1 0%, " +
            "#05070c94 58%, transparent 100%)",
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

      {/* The platform.

          Car 01 is fully built and lit while you are still outside it, so its
          posters and its notice plate read straight through the departure card
          — a wall of body copy behind the one screen that is meant to say only
          "this train is leaving, press W". Holding it back until you board is
          not a loading state: it is the difference between arriving at a train
          and arriving at a page about a train.

          Deliberately light. A scrim heavy enough to hide the poster text also
          flattens the carriage into a black rectangle, and the lit windows down
          the platform are the reason to stand there at all — so the text is
          taken out separately by `.is-platform .poster-slot` and this only has
          to settle the rest of the scene behind the card. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 transition-opacity duration-[1200ms] ease-out"
        style={{
          background: "var(--color-bg)",
          opacity: boarded ? 0 : 0.55,
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
