/**
 * The camera's physics, as a pure function.
 *
 * This is deliberately free of React, the DOM, and `requestAnimationFrame`: the
 * feel of the train is the part most likely to need tuning and most likely to
 * break silently, so it has to be testable by calling it in a loop rather than
 * by driving a browser. `useTrainCamera` is the only thing that knows this runs
 * sixty times a second.
 *
 * Two regimes, switched by whether a direction is being held:
 *
 *   under power   constant acceleration against exponential drag, speed capped
 *   released      a critically damped spring onto the nearest car centre
 *
 * The spring's target is chosen once, at the moment of release, from where the
 * camera *would* coast to rather than where it currently is. Releasing at speed
 * a little short of a car therefore carries you into it, instead of yanking you
 * backwards to the one you just left — which is what picking the nearest centre
 * on every frame would do, and it feels awful.
 */

import {
  ACCEL,
  CRUISE,
  DRAG,
  MAX_DT,
  PITCH,
  REST_DISTANCE,
  REST_SPEED,
  SNAP_DAMPING,
  SNAP_K,
} from "./train";

/** -1 travels back down the train, +1 forward, 0 is hands off the controls. */
export type Intent = -1 | 0 | 1;

export type CameraState = {
  /** Scene-pixels travelled from the centre of car 01. */
  z: number;
  /** Scene-pixels per second. */
  v: number;
  /** Where the settling spring is pulling, or null while under power. */
  target: number | null;
};

const clamp = (value: number, min: number, max: number) =>
  value < min ? min : value > max ? max : value;

/** Where the camera sits when parked in car `index`. */
export const zForCar = (index: number) => index * PITCH;

/** Which car the camera is in — the nearest centre, so the index flips at the
 *  midpoint of the vestibule rather than at either doorway. */
export const carIndexAt = (z: number, carCount: number) =>
  clamp(Math.round(z / PITCH), 0, carCount - 1);

export const initialState = (index = 0): CameraState => ({
  z: zForCar(index),
  v: 0,
  target: zForCar(index),
});

/** True once the camera has stopped moving, so the render loop can idle. */
export const isAtRest = (state: CameraState) =>
  state.target !== null &&
  Math.abs(state.z - state.target) < REST_DISTANCE &&
  Math.abs(state.v) < REST_SPEED;

/** Aim the settling spring at a specific car. Used by the number keys, the line
 *  map, and the URL hash — all of which are "go here" rather than "drive". */
export const aimAt = (state: CameraState, index: number, carCount: number): CameraState => ({
  ...state,
  target: zForCar(clamp(index, 0, carCount - 1)),
});

/** Arrive instantly. The reduced-motion path, which cuts between cars rather
 *  than gliding — a long smooth translation is exactly the motion that setting
 *  asks us not to produce. */
export const settleAt = (index: number, carCount: number): CameraState =>
  initialState(clamp(index, 0, carCount - 1));

export function step(
  state: CameraState,
  intent: Intent,
  dt: number,
  carCount: number,
): CameraState {
  const delta = Math.min(dt, MAX_DT);
  const maxZ = zForCar(carCount - 1);

  let { z, v, target } = state;

  if (intent !== 0) {
    // Under power. The target is dropped so that releasing recomputes it from
    // the speed you released at.
    target = null;
    v = (v + intent * ACCEL * delta) * Math.exp(-DRAG * delta);
    v = clamp(v, -CRUISE, CRUISE);
  } else {
    if (target === null) {
      // v / DRAG is the exact distance a body under exponential drag covers
      // before stopping. Rounding that to a car centre is the "magnet".
      target = zForCar(carIndexAt(z + v / DRAG, carCount));
    }
    v = (v + -SNAP_K * (z - target) * delta) * Math.exp(-SNAP_DAMPING * delta);
  }

  z += v * delta;

  if (z < 0) {
    z = 0;
    v = 0;
  } else if (z > maxZ) {
    z = maxZ;
    v = 0;
  }

  const next = { z, v, target };
  // Snap the last fraction of a pixel away rather than approaching it forever,
  // so the loop has something definite to stop on.
  return isAtRest(next) ? { z: target as number, v: 0, target } : next;
}
