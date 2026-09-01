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

const WINDOW_W = 520;
const WINDOW_H = 420;
/** Left edges along the wall, which spans CAR_D. */
const WINDOW_X = [180, 900, 1620];

function Window() {
  return (
    <div
      className="absolute overflow-hidden rounded-[26px] border-[6px] border-black/50 bg-[#03060f]"
      style={{ width: WINDOW_W, height: WINDOW_H, top: 250 }}
    >
      {/* The night outside is the only cold light in the carriage. */}
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

      {WINDOW_X.map((x) => (
        <div key={x} className="absolute" style={{ left: x }}>
          <Window />
        </div>
      ))}

      {/* Seating, implied. Modelling actual seats in CSS planes gets you grey
          boxes in the aisle you are trying to read down; a moquette band reads
          as upholstery and stays out of the way. */}
      <div
        className="absolute inset-x-0 bottom-0 h-[230px]"
        style={{
          background:
            "repeating-linear-gradient(58deg, var(--color-moquette) 0 14px, #2a2130 14px 28px)",
          opacity: 0.55,
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
            "linear-gradient(90deg, #111318 0 40%, " +
            "color-mix(in srgb, var(--color-lamp) 78%, transparent) 46% 54%, " +
            "#111318 60% 100%)",
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
