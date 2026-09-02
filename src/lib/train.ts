/**
 * Dimensions and physics for the carriage scene.
 *
 * Distances are scene-pixels, not screen-pixels. The scene is authored against
 * a fixed stage and the stage is scaled to cover the window, so every visitor
 * sees the same carriage at the same proportions rather than a differently
 * shaped one — the alternative, sizing the geometry in viewport units, changes
 * the room's shape as the window resizes and looks broken while you drag.
 *
 * Two constraints fight over these numbers, and the reading position is where
 * they are settled.
 *
 * A perspective projection shrinks everything at distance `d` by
 * `PERSPECTIVE / (PERSPECTIVE + d)`. Readable poster text therefore wants the
 * camera CLOSE to the end wall it is reading. But a surface running down the
 * length of the car only enters the frame at all beyond
 *
 *     d > PERSPECTIVE * (CAR_W / STAGE_W)      = 450
 *
 * and the side walls' far end is the bulkhead itself, so standing closer than
 * that means no side wall, no ceiling, no floor, no windows — you are looking
 * at nothing but the end wall. Seeing the carriage wants the camera FAR.
 *
 * This used to be settled at `READ_GAP = 420`, which is on the wrong side of
 * that line, and the comment here claimed the periphery was still full of side
 * wall. It was not: the room measured exactly zero pixels while parked, the
 * car's cross-section aspect being identical to the stage's (1920/1140 and
 * 1280/760 are both 1.684) so the end wall overflowed the frame in both
 * directions at once and hid everything behind it. The site read as a train
 * only while you were moving, and became a dark web page the moment you stopped
 * to read — which is the moment you spend nearly all of your time in.
 *
 * It is settled at the middle of the car now — far enough that windows, the lit
 * ceiling strip, the converging floor and the seats are all in frame while you
 * read, with the end wall at about 64% of the frame's width. Standing in the
 * middle of a carriage is also simply where a passenger stands, and it means
 * the walk to the next car passes through a room rather than at a wall.
 *
 * Stepping back scales the whole wall uniformly, so nothing about the poster
 * layout changes except its size, and `PANEL_FONT` buys most of that back.
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

/** How far the parked camera stands off the bulkhead it is reading — the middle
 *  of the car, which is where you would actually stand. Must stay comfortably
 *  above `PERSPECTIVE * (CAR_W / STAGE_W)`: below that the room disappears
 *  behind the end wall. See the note at the top. */
export const READ_GAP = CAR_D / 2;

/** Focal length. Short enough that the side walls converge and the carriage has
 *  depth; long enough that the far wall does not smear. */
export const PERSPECTIVE = 900;

/** The scene is composed against this box, then scaled to cover the window. */
export const STAGE_W = 1280;
export const STAGE_H = 760;

/**
 * How far away a lengthwise surface — side wall, ceiling, floor — has to be
 * before it is inside the frame rather than off its edge.
 *
 * This is the number that makes `READ_GAP` a constraint rather than a taste.
 * Nothing nearer than this is ever seen, so a reading position closer than it
 * puts the visitor in front of a flat wall with no carriage around it. The car
 * happens to have the stage's exact aspect ratio, so the same figure governs
 * the walls and the ceiling alike.
 */
export const HORIZON = PERSPECTIVE * (CAR_W / STAGE_W) - PERSPECTIVE;

/**
 * Below this the stage scales down far enough that poster text stops being
 * legible, so narrow screens are sent to the readable page instead.
 *
 * Raised twice, each time by measurement rather than by feel: 900 -> 1100 when
 * the camera stepped back to 900, and 1100 -> this when it went to the middle
 * of the car. Both times the same paragraph in the same car was measured
 * against the deployed build and the cutoff moved by the proportion the type
 * lost — 22.7px to 19.0px the first time, 20.4px to 16.8px the second.
 *
 * This is the real bill for standing in the middle of the carriage, and it is
 * not small: at 1280 wide a line of poster prose lands at 15px, under the floor
 * the site has held since it was built, so a 1366x768 laptop now gets the
 * readable page instead of the train. That is the honest outcome — a carriage
 * you cannot read is worse than no carriage — but if the train should reach
 * those screens again, the lever is `READ_GAP`, or a wider `CAR_W` giving the
 * poster panels more room so `PANEL_FONT` can rise without the prose
 * overflowing.
 */
export const MIN_TRAIN_WIDTH = 1400;

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
 *  number — see `posters/Plate.tsx`.
 *
 *  Raised twice as the camera stepped back — 26, then 30, now this. Stepping
 *  back shrinks the whole wall uniformly, poster and panel alike, so the layout
 *  is untouched and only its on-screen size falls; this buys most of it back.
 *
 *  It is not a free trade. The type gets larger relative to the panel holding
 *  it each time, so the measure narrows and the longest paragraph on the train
 *  takes more lines. That is the ceiling on this number: past it the prose
 *  stops fitting the panel, and the answer becomes smaller text rather than a
 *  bigger font. */
export const PANEL_FONT = 28;

/** Local z of a car's geometric centre, measured from its reading position. */
export const CAR_CENTER_Z = (CAR_D - 2 * READ_GAP) / 2;

/** The gangway behind each car: a shorter, narrower tube, so the doorway you
 *  are looking through reads as a frame rather than as more corridor. */
export const VESTIBULE_W = 620;
export const VESTIBULE_H = 940;
export const VESTIBULE_CENTER_Z = CAR_D - READ_GAP + VESTIBULE_D / 2;

// How far the streak gradients tile used to live here, for a render loop that
// wrapped the offsets by hand every frame. The strips are CSS animations now,
// so the period is a number the stylesheet has to agree with itself about — the
// gradient tiles at it and the keyframe translates by it — and splitting that
// across two files could only ever put them out of step. See `.streak-far` and
// `.streak-near` in `index.css`.
