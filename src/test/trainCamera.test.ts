import { describe, expect, it } from "vitest";

import { CRUISE, DRAG, MAX_DT, PITCH } from "../lib/train";
import {
  aimAt,
  carIndexAt,
  initialState,
  isAtRest,
  settleAt,
  step,
  zForCar,
  type CameraState,
  type Intent,
} from "../lib/trainCamera";

/**
 * The camera's physics.
 *
 * This is the part of the train most worth testing and the part least amenable
 * to being tested through a browser: every guarantee here is about how the
 * carriage *feels*, and every one of them fails silently. A camera that snaps
 * backwards on release, or that teleports down the train after a tab wakes up,
 * still renders perfectly — it just makes the site unpleasant in a way no
 * assertion about the DOM would ever catch.
 *
 * Which is exactly why `lib/trainCamera.ts` has no React and no DOM in it. The
 * whole of it is reachable by calling a function in a loop.
 */

const CARS = 8;
const FRAME = 1 / 60;

/** Run the simulation for `seconds` at a steady frame rate. */
function run(state: CameraState, intent: Intent, seconds: number): CameraState {
  let next = state;
  for (let t = 0; t < seconds; t += FRAME) next = step(next, intent, FRAME, CARS);
  return next;
}

describe("under power", () => {
  it("accelerates up to the cruise cap and no further", () => {
    // Terminal velocity from drag alone is ACCEL / DRAG, comfortably above
    // CRUISE, so the cap is what has to hold — not the drag.
    const state = run(initialState(0), 1, 6);

    expect(state.v).toBeLessThanOrEqual(CRUISE);
    expect(state.v).toBeCloseTo(CRUISE, 0);
  });

  it("drops the settle target while a direction is held", () => {
    // Keeping it would mean a spring still pulling backwards against the
    // direction being driven.
    expect(run(initialState(0), 1, 0.3).target).toBeNull();
  });
});

describe("settling", () => {
  it("comes to rest exactly on a car centre", () => {
    const moving = run(initialState(0), 1, 1);
    const settled = run(moving, 0, 6);

    expect(isAtRest(settled)).toBe(true);
    expect(settled.v).toBe(0);
    expect(settled.z % PITCH).toBe(0);
  });

  it("carries forward when released short of a doorway, rather than snapping back", () => {
    // The regression this exists for: choosing the nearest car centre from where
    // the camera IS drags you back to the car you just left. It has to be chosen
    // from where the camera would COAST to, which is z + v / DRAG.
    const z = 1000;
    const coastingTo = z + CRUISE / DRAG;

    // The setup has to be one where the two rules disagree, or the test proves
    // nothing: nearest-now is car 01, nearest-after-coasting is car 02.
    expect(carIndexAt(z, CARS)).toBe(0);
    expect(carIndexAt(coastingTo, CARS)).toBe(1);

    const released = run({ z, v: CRUISE, target: null }, 0, 6);

    expect(released.z).toBe(zForCar(1));
  });

  it("does not overshoot the car it is settling into", () => {
    // Underdamping rocks the camera past the wall and back, which reads as
    // nausea rather than as a train. Sample every frame, not just the end.
    let state: CameraState = { z: zForCar(2) - 400, v: 0, target: null };
    let furthest = state.z;

    for (let t = 0; t < 6; t += FRAME) {
      state = step(state, 0, FRAME, CARS);
      furthest = Math.max(furthest, state.z);
    }

    expect(furthest).toBeLessThanOrEqual(zForCar(2));
  });
});

describe("the ends of the train", () => {
  it("stops at car 01 rather than reversing out of the train", () => {
    const state = run(initialState(0), -1, 3);

    expect(state.z).toBe(0);
    expect(state.v).toBe(0);
  });

  it("stops at the terminus", () => {
    const state = run(initialState(0), 1, 40);

    expect(state.z).toBe(zForCar(CARS - 1));
    expect(state.v).toBe(0);
  });
});

describe("which car the camera is in", () => {
  it("flips at the midpoint between two cars, not at either doorway", () => {
    expect(carIndexAt(PITCH / 2 - 1, CARS)).toBe(0);
    expect(carIndexAt(PITCH / 2 + 1, CARS)).toBe(1);
  });

  it("clamps to the train that exists", () => {
    expect(carIndexAt(-5000, CARS)).toBe(0);
    expect(carIndexAt(zForCar(99), CARS)).toBe(CARS - 1);
  });
});

describe("jumping", () => {
  it("aims the settle spring at the requested car, clamped to the train", () => {
    expect(aimAt(initialState(0), 3, CARS).target).toBe(zForCar(3));
    expect(aimAt(initialState(0), 99, CARS).target).toBe(zForCar(CARS - 1));
  });

  it("arrives instantly and at rest, for the reduced-motion path", () => {
    const state = settleAt(4, CARS);

    expect(state.z).toBe(zForCar(4));
    expect(state.v).toBe(0);
    expect(isAtRest(state)).toBe(true);
  });
});

describe("a backgrounded tab", () => {
  it("clamps a multi-second frame instead of teleporting down the train", () => {
    // A tab that has been hidden hands back its whole absence as one delta on
    // the first waking frame. Unclamped, that is a jump of several cars.
    const woken = step(initialState(0), 1, 5, CARS);
    const clamped = step(initialState(0), 1, MAX_DT, CARS);

    expect(woken).toEqual(clamped);
    expect(woken.z).toBeLessThan(PITCH);
  });
});
