import { type RefObject, useCallback, useEffect, useRef } from "react";

import type { Intent } from "../lib/trainCamera";

/**
 * Everything a visitor can do to move, funnelled into two values the render
 * loop reads: a direction being held, and an impulse handed over once.
 *
 * Four ways in, deliberately. W and S are the ones advertised, but the first
 * instinct on any page is to scroll, and on a phone it is to drag — a train you
 * can only drive with a key you have to be told about is a train most people
 * never board. The on-screen buttons are real `<button>`s so they are in the
 * tab order too.
 *
 * Nothing here writes React state. The loop reads these refs directly, so
 * holding W for two seconds costs zero renders.
 *
 * Because the render loop parks itself once you stop moving, everything that
 * sets an intent or an impulse has to `wake` it too. A ref written while
 * nothing is reading it is the failure mode this guards against, and it is a
 * silent one — the input registers, the train just never moves.
 */

/** Scroll notches are around 100 units. This turns one notch into a shove of
 *  roughly a third of a car. */
const WHEEL_GAIN = 7;
const WHEEL_MAX = 900;

/** A drag should move the train about as far as your thumb travelled, scaled
 *  from screen pixels into scene pixels. */
const DRAG_GAIN = 26;

/** Below this a touch is a tap, not a drag, and should not launch the train. */
const DRAG_THRESHOLD = 4;

export function useTrainInput({
  enabled,
  reduced,
  carCount,
  stageRef,
  intentRef,
  impulseRef,
  indexRef,
  onJump,
  onFirstMove,
  wake,
}: {
  enabled: boolean;
  reduced: boolean;
  carCount: number;
  stageRef: RefObject<HTMLElement | null>;
  intentRef: RefObject<Intent>;
  impulseRef: RefObject<number>;
  /** Read, never written, so the listeners never need rebinding. */
  indexRef: RefObject<number>;
  onJump: (index: number) => void;
  onFirstMove: () => void;
  /** Restarts the render loop, which parks itself whenever you are stopped. */
  wake: () => void;
}) {
  const movedRef = useRef(false);

  const noteMovement = useCallback(() => {
    if (movedRef.current) return;
    movedRef.current = true;
    onFirstMove();
  }, [onFirstMove]);

  /** Shared by the keyboard and the on-screen controls. */
  const press = useCallback(
    (direction: Exclude<Intent, 0>) => {
      noteMovement();
      // Reduced motion has no notion of holding a direction — there is no
      // travel to hold through, only arrival.
      if (reduced) onJump(Math.min(Math.max(indexRef.current + direction, 0), carCount - 1));
      else {
        intentRef.current = direction;
        wake();
      }
    },
    [reduced, carCount, indexRef, intentRef, onJump, noteMovement, wake],
  );

  const release = useCallback(() => {
    intentRef.current = 0;
  }, [intentRef]);

  useEffect(() => {
    if (!enabled) {
      intentRef.current = 0;
      return;
    }

    const stage = stageRef.current;

    const directionFor = (code: string): Exclude<Intent, 0> | null => {
      if (code === "KeyW" || code === "ArrowUp") return 1;
      if (code === "KeyS" || code === "ArrowDown") return -1;
      return null;
    };

    const isTyping = () => {
      const active = document.activeElement;
      if (!active) return false;
      return (
        active instanceof HTMLInputElement ||
        active instanceof HTMLTextAreaElement ||
        active instanceof HTMLSelectElement ||
        (active instanceof HTMLElement && active.isContentEditable)
      );
    };

    const onKeyDown = (event: KeyboardEvent) => {
      // Ctrl+S must still save the page and Cmd+Down must still scroll — a
      // single-letter binding that swallows chords is a broken browser.
      if (event.ctrlKey || event.metaKey || event.altKey || isTyping()) return;

      const direction = directionFor(event.code);
      if (direction) {
        // Held keys repeat; the intent is already set and re-pressing under
        // reduced motion would run the whole train past at the repeat rate.
        if (!event.repeat) press(direction);
        event.preventDefault();
        return;
      }

      const digit = /^Digit([1-9])$/.exec(event.code);
      if (digit) {
        const target = Number(digit[1]) - 1;
        if (target < carCount) {
          noteMovement();
          onJump(target);
          event.preventDefault();
        }
      }
    };

    const onKeyUp = (event: KeyboardEvent) => {
      if (directionFor(event.code)) release();
    };

    const onWheel = (event: WheelEvent) => {
      if (event.ctrlKey) return; // pinch-zoom, not travel
      noteMovement();
      const shove = Math.max(-WHEEL_MAX, Math.min(WHEEL_MAX, event.deltaY * WHEEL_GAIN));
      impulseRef.current += shove;
      wake();
    };

    // A key held while the window loses focus never gets its keyup, which would
    // leave the train accelerating into the buffers for as long as you are away.
    const onBlur = () => release();
    const onVisibility = () => {
      if (document.hidden) release();
    };

    let pointer: number | null = null;
    let lastY = 0;
    let travelled = 0;

    const onPointerDown = (event: PointerEvent) => {
      if (event.pointerType === "mouse") return; // the mouse has the wheel
      pointer = event.pointerId;
      lastY = event.clientY;
      travelled = 0;
    };

    const onPointerMove = (event: PointerEvent) => {
      if (pointer !== event.pointerId) return;

      const dy = event.clientY - lastY;
      lastY = event.clientY;
      travelled += Math.abs(dy);
      if (travelled < DRAG_THRESHOLD) return;

      noteMovement();
      // Dragging up pulls the train toward you, the same direction a scroll
      // gesture moves a page.
      impulseRef.current += -dy * DRAG_GAIN;
      wake();
    };

    const onPointerUp = (event: PointerEvent) => {
      if (pointer === event.pointerId) pointer = null;
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("wheel", onWheel, { passive: true });
    stage?.addEventListener("pointerdown", onPointerDown);
    stage?.addEventListener("pointermove", onPointerMove);
    stage?.addEventListener("pointerup", onPointerUp);
    stage?.addEventListener("pointercancel", onPointerUp);

    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("wheel", onWheel);
      stage?.removeEventListener("pointerdown", onPointerDown);
      stage?.removeEventListener("pointermove", onPointerMove);
      stage?.removeEventListener("pointerup", onPointerUp);
      stage?.removeEventListener("pointercancel", onPointerUp);
      intentRef.current = 0;
    };
  }, [
    enabled,
    carCount,
    stageRef,
    intentRef,
    impulseRef,
    onJump,
    press,
    release,
    noteMovement,
    wake,
  ]);

  return { press, release };
}
