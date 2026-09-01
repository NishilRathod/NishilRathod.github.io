/**
 * Dimensions and physics for the carriage scene.
 *
 * Distances are scene-pixels, not screen-pixels. The scene is authored against
 * a fixed stage and the stage is scaled to cover the window, so every visitor
 * sees the same carriage at the same proportions rather than a differently
 * shaped one — the alternative, sizing the geometry in viewport units, changes
 * the room's shape as the window resizes and looks broken while you drag.
 *
 * The numbers below are the outcome of one constraint that drives everything
 * else: poster text has to be READABLE. A perspective projection shrinks the
 * far wall by `PERSPECTIVE / (PERSPECTIVE + distance)`. Parked at the middle of
 * a realistically long car, that factor is around 0.53 and 20px body text lands
 * at 10px on screen, which is useless. So the camera parks near the end of the
 * car it is reading — `READ_GAP` from the wall, the distance you would actually
 * stand at to read something bolted to it — which buys back 0.68 while keeping
 * the perspective wide enough that the side walls still fill the periphery and
 * the thing reads as a room.
 */

/** Interior width, wall to wall. */
export const CAR_W = 1920;
/** Floor to ceiling. */
export const CAR_H = 1140;
/** Length of the passenger section. */
export const CAR_D = 2400;
/** The dark connector between cars. Short, so it reads as a threshold rather
 *  than a corridor of its own. */
export const VESTIBULE_D = 460;
/** Distance between one car's reading position and the next. */
export const PITCH = CAR_D + VESTIBULE_D;

/** How far the parked camera stands off the bulkhead it is reading. */
export const READ_GAP = 420;

/** Focal length. Short enough that the side walls converge and the carriage has
 *  depth; long enough that the far wall does not smear. */
export const PERSPECTIVE = 900;

/** The scene is composed against this box, then scaled to cover the window. */
export const STAGE_W = 1280;
export const STAGE_H = 760;

/** Below this the stage scales down far enough that poster text stops being
 *  legible, so narrow screens are sent to the readable page instead. */
export const MIN_TRAIN_WIDTH = 900;

/** Where you stand before boarding: outside car 01, short of its doorway. */
export const PLATFORM_Z = -2600;

// ---------------------------------------------------------------------------
// Motion. Scene-pixels and seconds.
// ---------------------------------------------------------------------------

/** Applied while a direction is held. */
export const ACCEL = 10000;
/** Hard speed cap. A car crosses in about 1.1s — long enough to register as
 *  travel, short enough not to be a chore on the way to car 08. */
export const CRUISE = 2600;
/** Exponential velocity decay per second while travelling. Also sets how far a
 *  release coasts: v / DRAG, so a little under a third of a car from full
 *  speed — enough that letting go just short of a doorway carries you in. */
export const DRAG = 3;

/** Spring pulling a released camera onto a reading position. */
export const SNAP_K = 25;
/** Critical damping for SNAP_K — 2 * sqrt(25). Underdamping rocks the camera
 *  past the wall and back, which reads as nausea rather than as a train. */
export const SNAP_DAMPING = 10;

/** Below both of these the camera is parked and the loop stops integrating. */
export const REST_DISTANCE = 0.5;
export const REST_SPEED = 2;

/** Seconds for the scripted boarding move from the platform into car 01. */
export const BOARDING_DURATION = 1.6;

/** A backgrounded tab hands back a multi-second delta on its first waking
 *  frame. Clamping stops that from teleporting the camera down the train. */
export const MAX_DT = 1 / 30;

// ---------------------------------------------------------------------------
// Bulkhead composition. The end wall is built from parts rather than cut with a
// hole, because CSS has no way to punch an aperture through an element.
// ---------------------------------------------------------------------------

/** Doorway through to the next car. */
export const DOOR_W = 440;
export const DOOR_H = 900;
/** The poster panel either side of the door. */
export const PANEL_W = (CAR_W - DOOR_W) / 2;
/** Header above the door, carrying the destination board. */
export const HEADER_H = CAR_H - DOOR_H;

/** Base font size inside a poster panel, in scene pixels. Everything in a
 *  poster is sized in `em` against this, so the whole hierarchy scales from one
 *  number — see `posters/Plate.tsx`. */
export const PANEL_FONT = 26;

/** Local z of a car's geometric centre, measured from its reading position. */
export const CAR_CENTER_Z = (CAR_D - 2 * READ_GAP) / 2;

/** The gangway behind each car: a shorter, narrower tube, so the doorway you
 *  are looking through reads as a frame rather than as more corridor. */
export const VESTIBULE_W = 620;
export const VESTIBULE_H = 940;
export const VESTIBULE_CENTER_Z = CAR_D - READ_GAP + VESTIBULE_D / 2;

/** How far the streak gradients tile, in scene pixels. The render loop wraps
 *  the offsets against these so a long journey never scrolls them off. */
export const STREAK_FAR_PERIOD = 420;
export const STREAK_NEAR_PERIOD = 190;
