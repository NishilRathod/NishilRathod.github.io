import { type RefObject, useCallback, useEffect, useRef, useState } from "react";

import { BOARDING_DURATION, PLATFORM_Z } from "../lib/train";
import {
  aimAt,
  carIndexAt,
  initialState,
  isAtRest,
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
 * The train is always moving, but this loop is not. The sway of the carriage
 * and what goes past the windows are CSS animations (see `.cabin-bob` and
 * `.streak` in `index.css`), so they keep running on the compositor whether or
 * not anything here is awake, and the world outside still does not freeze when
 * you stop to read. That leaves this loop with exactly one job — moving YOU —
 * and it can therefore stop the moment you are parked, which is the state a
 * visitor spends nearly all their time in.
 *
 * Driving the sway and the streaks from here was the single most expensive
 * thing on the page. It wrote two custom properties per frame onto the element
 * every car inherits from, and inherited custom properties invalidate the style
 * of the entire subtree: ~800 elements restyled sixty times a second, about 40%
 * of the frame budget, running even while standing still on the platform.
 */

/** Decelerating ease for the scripted boarding move. */
const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

type Phase = "platform" | "boarding" | "riding";

export function useTrainCamera({
  worldRef,
  carCount,
  intentRef,
  impulseRef,
  reduced,
  startIndex,
}: {
  worldRef: RefObject<HTMLDivElement | null>;
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
   * Restart the loop.
   *
   * Since the loop parks itself, every route that changes what it would compute
   * has to be able to wake it — otherwise a key pressed while stopped sets an
   * intent nothing is reading. Held in a ref because `start` only exists inside
   * the effect, and the identity of what callers get has to stay stable so the
   * input listeners are not rebound.
   */
  const wakeRef = useRef<() => void>(() => {});
  const wake = useCallback(() => wakeRef.current(), []);

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
    wake();
  }, [wake]);

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
    if (!world) return;

    let frame = 0;
    let last = 0;
    let elapsed = 0;
    let boardingStart = 0;

    const render = (z: number) => {
      world.style.transform = `translate3d(0px, 0px, ${z}px)`;
    };

    /** Nothing left to integrate: parked, hands off the controls, no jump
     *  queued. The loop stops here and `wake` is what starts it again. */
    const settled = () =>
      intentRef.current === 0 &&
      impulseRef.current === 0 &&
      pendingJumpRef.current === null &&
      isAtRest(stateRef.current);

    const tick = (now: number) => {
      const dt = last ? (now - last) / 1000 : 0;
      last = now;
      elapsed += dt;

      if (phaseRef.current === "platform") {
        if (intentRef.current !== 0 || impulseRef.current !== 0) {
          phaseRef.current = "boarding";
        } else {
          // The platform is a still frame. Draw it once and stop — the sway
          // and the streaks are CSS and carry on without us.
          render(PLATFORM_Z);
          frame = 0;
          return;
        }
      }

      if (phaseRef.current === "boarding") {
        if (!boardingStart) boardingStart = elapsed;
        const t = (elapsed - boardingStart) / BOARDING_DURATION;

        if (t < 1) {
          render(PLATFORM_Z * (1 - easeOut(t)));
          frame = requestAnimationFrame(tick);
          return;
        }

        phaseRef.current = "riding";
        setBoarded(true);
        stateRef.current = initialState(0);
      }

      // Read only once there is somewhere for it to go. Taking it at the top of
      // the tick meant a jump requested from the platform — pressing 3 on the
      // opening screen, which is exactly what the hint invites — was cleared on
      // the first frame and then thrown away by the boarding move that ran for
      // the next 1.6 seconds, landing you in car 01 with no sign anything had
      // happened.
      const jump = pendingJumpRef.current;
      pendingJumpRef.current = null;

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

      render(stateRef.current.z);

      const at = carIndexAt(stateRef.current.z, carCount);
      setIndex((current) => (current === at ? current : at));

      if (settled()) {
        frame = 0;
        return;
      }
      frame = requestAnimationFrame(tick);
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

    wakeRef.current = start;

    // A hidden tab should not burn battery animating a train nobody can see.
    // Waking a settled loop on the way back is harmless: it draws one frame,
    // finds nothing to do, and parks again.
    const onVisibility = () => (document.hidden ? stop() : start());
    document.addEventListener("visibilitychange", onVisibility);

    // One frame is enough to place the camera; the loop parks itself after it
    // unless something is actually moving.
    start();

    return () => {
      stop();
      wakeRef.current = () => {};
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [worldRef, carCount, intentRef, impulseRef, reduced]);

  return { index, boarded, board, jumpTo, wake };
}
