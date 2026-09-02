import type { Compartment } from "../content/compartments";
import {
  CAR_CENTER_Z,
  CAR_D,
  CAR_H,
  CAR_W,
  VESTIBULE_CENTER_Z,
  VESTIBULE_D,
  VESTIBULE_H,
  VESTIBULE_W,
} from "../lib/train";
import { Plane } from "./Plane";

/**
 * The room itself: floor, ceiling, the two side walls, and the gangway behind.
 *
 * Nothing in here is readable content — that all lives on the bulkhead, where
 * it faces you square-on. These surfaces carry the things a glance can take in
 * at an angle while you drive past: the car number, the destination, windows.
 *
 * Lighting is entirely static gradients. A dim interior lit by one strip
 * overhead is a case where faked light is indistinguishable from computed
 * light, and computed light would have cost a WebGL renderer and the poster
 * text along with it.
 */

const WINDOW_W = 460;
const WINDOW_H = 420;

/**
 * Where the windows sit, as distance BACK FROM THE BULKHEAD — not as a CSS
 * offset along the wall.
 *
 * The two walls are mirror images: one is `rotateY(90deg)` and the other
 * `rotateY(-90deg)`, which map the plane's local x to depth in opposite
 * directions. A single shared list of `left` offsets therefore does not
 * describe one carriage, it describes two different ones — it used to put the
 * third window at the front of the left wall and the first window at the front
 * of the right. Measuring from the bulkhead states the intent, and `offsetFor`
 * is the only place that has to know about the mirror.
 *
 * Parked, only the band from `HORIZON` to `READ_GAP` is in frame — 750 deep —
 * so you see the first of these whole and the leading edge of the second. That
 * is the right amount: a window running off the edge of your vision is what
 * being inside a carriage looks like, where one floating complete in the middle
 * of the view looks like a picture of a window. The rest of the run exists for
 * the travel between cars, which is when the length of the carriage shows.
 */
const WINDOW_FROM_BULKHEAD = [40, 660, 1280, 1900];

/** Local `left` offset along a wall plane, which spans CAR_D with its far end
 *  at the bulkhead on the left side and at the rear on the right. */
const offsetFor = (fromBulkhead: number, side: "left" | "right") =>
  side === "left" ? CAR_D - fromBulkhead - WINDOW_W : fromBulkhead;

function Window() {
  return (
    <div
      className="absolute overflow-hidden rounded-[26px] border-[6px] border-black/50 bg-[#03060f]"
      style={{ width: WINDOW_W, height: WINDOW_H, top: 250 }}
    >
      {/* The night outside is the only cold light in the carriage. Both strips
          are animated by the stylesheet rather than by the render loop — see
          `.streak` in `index.css` for why that matters so much. */}
      <div className="streak streak-far" />
      <div className="streak streak-near" />

      {/* Glass: a sheen across the top, and the interior's warmth reflecting
          back off it near the bottom edge. */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(160deg, #ffffff14 0%, transparent 38%), " +
            "linear-gradient(to top, color-mix(in srgb, var(--color-lamp) 10%, transparent), transparent 30%)",
        }}
      />
      <div className="absolute inset-0 shadow-[inset_0_0_60px_rgba(0,0,0,0.85)]" />
    </div>
  );
}

/**
 * A bank of seats down one side.
 *
 * Two planes, not forty. Individual seat units would be sixteen or so per car
 * and every one of them its own compositor layer in a 3D context; the run of
 * seat backs is a repeating gradient on one long plane instead, with a second
 * plane laid flat across the top to give the bank thickness where you look down
 * on it. It reads as a row of seats and costs four planes a car.
 *
 * The heights are the whole trick. The camera sits at the vertical middle of
 * the car, so a seat back at a realistic 1.2m would come up past your eyeline
 * and the aisle would close over — the "grey boxes in the aisle you are trying
 * to read down" that the old moquette band existed to avoid. `SEAT_H` keeps the
 * backs below eye level so you look along the tops of them to the far wall, and
 * `SEAT_DEPTH` keeps them hard against the sides so the middle of the frame,
 * where the doorway and most of the poster are, stays clear.
 */
const SEAT_H = 240;
const SEAT_DEPTH = 260;
/** One seat's worth of pitch along the car, so the backs repeat believably. */
const SEAT_PITCH = 260;

function SeatBank({ side }: { side: "left" | "right" }) {
  const outward = side === "left" ? -1 : 1;
  const x = outward * (CAR_W / 2 - SEAT_DEPTH);
  const topY = CAR_H / 2 - SEAT_H;

  return (
    <>
      {/* The aisle-facing side of the bank: seat backs as a repeating run, with
          the strip light catching along the headrest line. */}
      <Plane
        w={CAR_D}
        h={SEAT_H}
        transform={`translateX(${x}px) translateY(${CAR_H / 2 - SEAT_H / 2}px) translateZ(${CAR_CENTER_Z}px) rotateY(${side === "left" ? 90 : -90}deg)`}
        style={{
          background:
            // One seat: upholstery, then the dark slot where the next one is
            // bolted on. The slot has to be wide and near-black or the run
            // reads as a bench with lines drawn on it rather than as chairs.
            `repeating-linear-gradient(90deg, ` +
            `var(--color-moquette) 0 ${SEAT_PITCH - 64}px, ` +
            `#0d0a12 ${SEAT_PITCH - 64}px ${SEAT_PITCH - 6}px, ` +
            `#241d2b ${SEAT_PITCH - 6}px ${SEAT_PITCH}px), ` +
            "linear-gradient(to bottom, " +
            "color-mix(in srgb, var(--color-lamp) 10%, transparent) 0%, " +
            "transparent 26%, #00000066 100%)",
        }}
      >
        {/* The lit top edge of each backrest, broken by the same slots, so the
            headrests read as separate objects catching the strip light. */}
        <div
          className="absolute inset-x-0 top-0 h-[26px]"
          style={{
            background:
              `repeating-linear-gradient(90deg, ` +
              `color-mix(in srgb, var(--color-lamp) 30%, #2b2333) 0 ${SEAT_PITCH - 64}px, ` +
              `transparent ${SEAT_PITCH - 64}px ${SEAT_PITCH}px)`,
          }}
        />
        <div className="absolute inset-x-0 bottom-0 h-[70px] bg-black/45" />
      </Plane>

      {/* The top of the bank, laid flat. Without it the seats are a painted
          stripe on a wall; with it they have a surface you are looking down on
          and the carriage gets a floor plan.

          Sized SEAT_DEPTH across by CAR_D along rather than the other way with
          a rotateZ to fix it up: after rotateX the plane's own width runs
          across the car and its height runs down the length, so stating it in
          that order is the whole transform and the seat divisions land along
          the car instead of across it. */}
      <Plane
        w={SEAT_DEPTH}
        h={CAR_D}
        transform={`translateX(${outward * (CAR_W / 2 - SEAT_DEPTH / 2)}px) translateY(${topY}px) translateZ(${CAR_CENTER_Z}px) rotateX(90deg)`}
        style={{
          background:
            `repeating-linear-gradient(0deg, ` +
            `#241d2b 0 ${SEAT_PITCH - 64}px, ` +
            `#0b0810 ${SEAT_PITCH - 64}px ${SEAT_PITCH}px), ` +
            `linear-gradient(to ${side === "left" ? "left" : "right"}, #00000070, transparent 70%)`,
        }}
      />
    </>
  );
}

/**
 * The car number, engraved rather than printed — very large, very low contrast,
 * so it reads as part of the wall at a glance and never competes with the
 * poster you are actually meant to be reading.
 */
function SideWall({ car, side }: { car: Compartment; side: "left" | "right" }) {
  const inward = side === "left" ? 90 : -90;

  return (
    <Plane
      w={CAR_D}
      h={CAR_H}
      transform={`translateX(${(side === "left" ? -1 : 1) * (CAR_W / 2)}px) translateZ(${CAR_CENTER_Z}px) rotateY(${inward}deg)`}
      className="overflow-hidden"
      style={{
        background:
          "linear-gradient(to bottom, " +
          "color-mix(in srgb, var(--color-lamp) 14%, var(--color-car-shell)) 0%, " +
          "var(--color-car-shell) 26%, " +
          "var(--color-car-lacquer) 78%, " +
          "#0d0b09 100%)",
      }}
    >
      {/* Handrail: one line, catching the strip light along its top edge. */}
      <div
        className="absolute inset-x-0 h-[10px]"
        style={{
          top: 150,
          background:
            "linear-gradient(to bottom, color-mix(in srgb, var(--color-lamp) 55%, transparent), #00000060)",
        }}
      />

      {WINDOW_FROM_BULKHEAD.map((fromBulkhead) => (
        <div
          key={fromBulkhead}
          className="absolute"
          style={{ left: offsetFor(fromBulkhead, side) }}
        >
          <Window />
        </div>
      ))}

      {/* The moquette behind the seats, so the wall between and above them is
          upholstered rather than bare where a gap shows through. */}
      <div
        className="absolute inset-x-0 bottom-0"
        style={{
          height: SEAT_H,
          background:
            "repeating-linear-gradient(58deg, var(--color-moquette) 0 14px, #2a2130 14px 28px)",
          opacity: 0.4,
        }}
      />

      {side === "left" ? (
        <div
          className="absolute flex items-baseline gap-9"
          style={{ left: 180, bottom: 268 }}
          aria-hidden="true"
        >
          <span className="font-mono text-[190px] leading-none font-thin text-enamel/[0.07]">
            {car.code}
          </span>
          <span className="flex flex-col gap-3">
            <span className="font-mono text-[26px] uppercase tracking-[0.42em] text-lamp/35">
              {car.label}
            </span>
            <span className="text-[52px] leading-none font-bold uppercase tracking-[0.16em] text-enamel/25">
              {car.destination}
            </span>
          </span>
        </div>
      ) : null}
    </Plane>
  );
}

export function Shell({ car }: { car: Compartment }) {
  return (
    <>
      {/* Ceiling, with the strip light running the length of the car. It is the
          only light source indoors, so every other surface's gradient is lit
          from this direction. */}
      <Plane
        w={CAR_W}
        h={CAR_D}
        transform={`translateY(${-CAR_H / 2}px) translateZ(${CAR_CENTER_Z}px) rotateX(-90deg)`}
        style={{
          background:
            "linear-gradient(90deg, #111318 0 42%, " +
            "color-mix(in srgb, var(--color-lamp) 40%, transparent) 47% 53%, " +
            "#111318 58% 100%)",
        }}
      />

      {/* Floor. Dark, with the strip light pooling back off it down the middle
          — the reflection is what makes the aisle read as a walkable surface
          rather than as a hole. */}
      <Plane
        w={CAR_W}
        h={CAR_D}
        transform={`translateY(${CAR_H / 2}px) translateZ(${CAR_CENTER_Z}px) rotateX(90deg)`}
        style={{
          background:
            "linear-gradient(90deg, transparent 0 30%, " +
            "color-mix(in srgb, var(--color-lamp) 9%, transparent) 50%, " +
            "transparent 70% 100%), " +
            "linear-gradient(to bottom, #14161b, #08090c)",
        }}
      />

      <SideWall car={car} side="left" />
      <SideWall car={car} side="right" />

      <SeatBank side="left" />
      <SeatBank side="right" />

      {/* The gangway behind this car: narrower and shorter than the saloon, so
          the doorway you look back through frames it. */}
      <Plane
        w={VESTIBULE_W}
        h={VESTIBULE_D}
        transform={`translateY(${-VESTIBULE_H / 2}px) translateZ(${VESTIBULE_CENTER_Z}px) rotateX(-90deg)`}
        style={{ background: "#0b0c0f" }}
      />
      <Plane
        w={VESTIBULE_W}
        h={VESTIBULE_D}
        transform={`translateY(${VESTIBULE_H / 2}px) translateZ(${VESTIBULE_CENTER_Z}px) rotateX(90deg)`}
        style={{ background: "#0a0b0e" }}
      />
      {(["left", "right"] as const).map((side) => (
        <Plane
          key={side}
          w={VESTIBULE_D}
          h={VESTIBULE_H}
          transform={`translateX(${(side === "left" ? -1 : 1) * (VESTIBULE_W / 2)}px) translateZ(${VESTIBULE_CENTER_Z}px) rotateY(${side === "left" ? 90 : -90}deg)`}
          style={{
            background:
              "linear-gradient(to bottom, #1a1c21, #0a0b0e), " +
              "repeating-linear-gradient(90deg, #ffffff08 0 2px, transparent 2px 22px)",
          }}
        />
      ))}
    </>
  );
}
