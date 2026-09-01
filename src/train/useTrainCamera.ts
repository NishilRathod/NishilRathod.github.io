import { type RefObject, useCallback, useEffect, useRef, useState } from "react";

import {
  BOARDING_DURATION,
  PLATFORM_Z,
  STREAK_FAR_PERIOD,
  STREAK_NEAR_PERIOD,
} from "../lib/train";
import {
  aimAt,
  carIndexAt,
  initialState,
  settleAt,
  step,
  type CameraState,
  type Intent,
} from "../lib/trainCamera";

/**
 * Drives the carriage.
 *
 * One `requestAnimationFrame` loop owns the camera, and it writes to the DOM
 * directly rather than through React. The position has to update sixty times a
 * second; putting it in state would mean sixty reconciliations a second of a
 * tree containing every poster on the train, which is the difference between
 * this being smooth and being a slideshow. The only thing that reaches React is
 * `index` — which car you are in — and that changes about eight times a visit.
 *
 * The train is always moving. You are walking around inside one that is already
 * under way, so the sway and what goes past the windows are driven by elapsed
 * time and never stop, while W and S move only you. Tying the streaks to your
 * own speed would mean the world outside froze whenever you stopped to read,
 * which is a much stranger thing to look at than it sounds.
 */

/** Roll and rise of the carriage on its bogies. Small: this is a suggestion of
 *  movement, and anything you can actually measure by eye becomes nausea. */
const ROLL_DEG = 0.32;
const BOB_PX = 3.4;

/** How fast the two window layers pass. The ratio between them is the parallax
 *  that reads as distance; the absolute values are just "fast". */
const STREAK_FAR_RATE = 150;
const STREAK_NEAR_RATE = 620;

/** Decelerating ease for the scripted boarding move. */
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

type Phase = "platform" | "boarding" | "riding";

export function useTrainCamera({
  worldRef,
  cabinRef,
  carCount,
  intentRef,
  impulseRef,
  reduced,
  startIndex,
}: {
  worldRef: RefObject<HTMLDivElement | null>;
  cabinRef: RefObject<HTMLDivElement | null>;
  carCount: number;
  intentRef: RefObject<Intent>;
  /** Velocity handed over by the wheel or a drag, consumed on the next frame. */
  impulseRef: RefObject<number>;
  reduced: boolean;
  startIndex: number;
}) {
  const [index, setIndex] = useState(startIndex);

  const stateRef = useRef<CameraState>(initialState(startIndex));
  // Arriving by link skips the platform: you asked for a specific car, so being
  // made to board first would be theatre in the way of the thing you asked for.
  const phaseRef = useRef<Phase>(startIndex === 0 && !reduced ? "platform" : "riding");
  const pendingJumpRef = useRef<number | null>(null);

  // Whether the scripted boarding move has finished. The one thing about the
  // phase the HUD needs, and it changes once a visit — the rest stays in the ref
  // where the loop can read it sixty times a second for free.
  //
  // Anyone arriving by link or under reduced motion starts out riding, so the
  // departure card never flashes on the way to the car they asked for.
  const [boarded, setBoarded] = useState(phaseRef.current === "riding");

  /**
   * Leave the platform.
   *
   * Called the moment the visitor does anything at all, rather than left to the
   * loop's own check on whether a direction happens to be held when the next
   * frame samples it. A key pressed and released between two frames sets the
   * intent and clears it again with no frame in between, so an impatient tap of
   * W on the platform did nothing whatsoever — the one input the opening screen
   * actually asks for.
   */
  const board = useCallback(() => {
    if (phaseRef.current === "platform") phaseRef.current = "boarding";
  }, []);

  const jumpTo = useCallback(
    (target: number) => {
      pendingJumpRef.current = target;
      // A jump is also a boarding trigger — you have said where you want to be.
      board();
    },
    [board],
  );

  useEffect(() => {
    const world = worldRef.current;
    const cabin = cabinRef.current;
    if (!world || !cabin) return;

    let frame = 0;
    let last = 0;
    let elapsed = 0;
    let boardingStart = 0;

    const render = (z: number, time: number) => {
      world.style.transform = `translate3d(0px, 0px, ${z}px)`;

      if (reduced) return;

      cabin.style.transform =
        `translateY(${Math.sin(time * 1.7) * BOB_PX}px) ` +
        `rotateZ(${Math.sin(time * 1.1) * ROLL_DEG}deg)`;

      // Written once here and inherited by every window on the train, so sixty
      // panes of glass cost two style writes rather than sixty.
      world.style.setProperty(
        "--streak-far",
        `${-((time * STREAK_FAR_RATE) % STREAK_FAR_PERIOD)}px`,
      );
      world.style.setProperty(
        "--streak-near",
        `${-((time * STREAK_NEAR_RATE) % STREAK_NEAR_PERIOD)}px`,
      );
    };

    const tick = (now: number) => {
      frame = requestAnimationFrame(tick);

      const dt = last ? (now - last) / 1000 : 0;
      last = now;
      elapsed += dt;

      const jump = pendingJumpRef.current;
      pendingJumpRef.current = null;

      if (phaseRef.current === "platform") {
        if (intentRef.current !== 0 || impulseRef.current !== 0) {
          phaseRef.current = "boarding";
        } else {
          render(PLATFORM_Z, elapsed);
          return;
        }
      }

      if (phaseRef.current === "boarding") {
        if (!boardingStart) boardingStart = elapsed;
        const t = (elapsed - boardingStart) / BOARDING_DURATION;

        if (t < 1) {
          render(PLATFORM_Z * (1 - easeOut(t)), elapsed);
          return;
        }

        phaseRef.current = "riding";
        setBoarded(true);
        stateRef.current = initialState(0);
      }

      if (reduced) {
        // Cut rather than glide. A long smooth translation across the whole
        // screen is precisely the motion this setting asks us not to make.
        if (jump !== null) stateRef.current = settleAt(jump, carCount);
      } else {
        if (jump !== null) stateRef.current = aimAt(stateRef.current, jump, carCount);

        const impulse = impulseRef.current;
        if (impulse !== 0) {
          impulseRef.current = 0;
          // Clearing the target lets the settle recompute from the new speed,
          // so a flick of the wheel carries forward instead of being dragged
          // back to the car it was already aiming at.
          stateRef.current = { ...stateRef.current, v: stateRef.current.v + impulse, target: null };
        }

        stateRef.current = step(stateRef.current, intentRef.current, dt, carCount);
      }

      render(stateRef.current.z, elapsed);

      const at = carIndexAt(stateRef.current.z, carCount);
      setIndex((current) => (current === at ? current : at));
    };

    const start = () => {
      if (frame) return;
      last = 0;
      frame = requestAnimationFrame(tick);
    };

    const stop = () => {
      if (!frame) return;
      cancelAnimationFrame(frame);
      frame = 0;
    };

    // A hidden tab should not burn battery animating a train nobody can see.
    const onVisibility = () => (document.hidden ? stop() : start());
    document.addEventListener("visibilitychange", onVisibility);

    // Under reduced motion nothing animates on its own, so one frame is enough
    // to place the camera — but the loop still has to run to react to a jump.
    start();

    return () => {
      stop();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [worldRef, cabinRef, carCount, intentRef, impulseRef, reduced]);

  return { index, boarded, board, jumpTo };
}
