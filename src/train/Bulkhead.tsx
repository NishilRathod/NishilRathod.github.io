import type { Compartment, Wall } from "../content/compartments";
import {
  CAR_H,
  CAR_W,
  DOOR_H,
  DOOR_W,
  HEADER_H,
  PANEL_FONT,
  PANEL_W,
  READ_GAP,
} from "../lib/train";
import { Plane } from "./Plane";
import { renderPoster } from "./posters";

/**
 * The wall you are parked in front of, and the only thing in the carriage
 * carrying prose.
 *
 * It is built from parts rather than cut with a hole, because CSS cannot punch
 * an aperture through an element: two full-height panels either side, a header
 * above, and the doorway is simply the gap left between them.
 *
 * The two panels are deliberately not a matched pair. The left one is the wall
 * itself, with the substance printed on it; the right is a smaller notice
 * plate screwed on higher up. Real carriages are assembled, not laid out on a
 * grid, and a symmetric pair reads instantly as CSS.
 */

/**
 * The doorway through to the next car's gangway, which that car renders. The
 * only thing drawn here is the frame around the opening and the two leaves that
 * part across it.
 *
 * The leaves are driven by `isCurrent` — a class flip, transitioned by CSS —
 * rather than by the camera's distance from the wall. The render loop writes
 * straight to the DOM sixty times a second and the two custom properties it
 * sets are inherited by every car at once, so there is no per-car value to be
 * had from it without giving that cheapness up. `isCurrent` is the honest
 * signal anyway: the door ahead opens as you settle into the car, and the one
 * you came through closes behind you once you are past it.
 */
function Doorway({ open }: { open: boolean }) {
  return (
    <div
      className={`absolute overflow-hidden ${open ? "door-open" : ""}`}
      style={{ left: PANEL_W, top: HEADER_H, width: DOOR_W, height: DOOR_H }}
    >
      <span aria-hidden="true" className="door-leaf door-leaf-left" />
      <span aria-hidden="true" className="door-leaf door-leaf-right" />

      {/* Frame last, so the leaves slide away behind it rather than over it. */}
      <div
        className="pointer-events-none absolute inset-0 border-x-[10px] border-t-[10px] border-black/60"
        style={{
          background:
            "linear-gradient(to bottom, #ffffff10, transparent 14%), " +
            "linear-gradient(to top, #00000090, transparent 30%)",
        }}
      />
    </div>
  );
}

/**
 * End of the line. The doorway is bricked up and carries the one red thing in
 * the entire carriage — spend a signal colour twice and it stops meaning stop.
 */
function EndWall() {
  return (
    <div
      className="absolute flex flex-col items-center justify-center gap-10 border-[10px] border-black/60"
      style={{
        left: PANEL_W,
        top: HEADER_H,
        width: DOOR_W,
        height: DOOR_H,
        background: "linear-gradient(to bottom, #23262c, #101216)",
      }}
    >
      <div className="flex flex-col items-center gap-4">
        <span
          aria-hidden="true"
          className="h-[70px] w-[130px] rounded-[8px] border-[5px] border-signal/70 bg-signal/15"
        />
        <span className="font-mono text-[19px] uppercase tracking-[0.3em] text-signal/80">
          Emergency
        </span>
      </div>

      <span
        className="text-center font-mono text-[22px] leading-[1.8] uppercase tracking-[0.34em] text-enamel/30"
        aria-hidden="true"
      >
        End of
        <br />
        the line
      </span>
    </div>
  );
}

/**
 * The destination board. The one glowing thing in the carriage, and the one
 * piece of decoration that also does a job: it names what is ahead, so you can
 * decide whether to keep driving.
 *
 * Remounted on arrival — see the `key` at the call site — so it catches and
 * settles the way a real dot-matrix panel does when the service changes.
 */
function DestinationBoard({ text, catching }: { text: string; catching: boolean }) {
  return (
    <div
      className="absolute overflow-hidden border-[8px] border-black/70"
      style={{ left: PANEL_W, top: 0, width: DOOR_W, height: HEADER_H }}
    >
      <div
        className={`board absolute inset-0 flex items-center justify-center px-6 ${
          catching ? "board-catch" : ""
        }`}
      >
        <span className="truncate font-mono text-[27px] font-medium uppercase tracking-[0.22em]">
          {text}
        </span>
      </div>
    </div>
  );
}

function slot(wall: Wall) {
  return wall === "left"
    ? // The wall itself: full height, content optically centred.
      { left: 56, top: 0, width: PANEL_W - 112, height: CAR_H, alignItems: "center" as const }
    : // A plate screwed on, mounted high.
      {
        left: PANEL_W + DOOR_W + 56,
        top: 170,
        width: PANEL_W - 112,
        height: 720,
        alignItems: "flex-start" as const,
      };
}

export function Bulkhead({
  car,
  nextDestination,
  isCurrent,
}: {
  car: Compartment;
  /** The car ahead, or null at the terminus. */
  nextDestination: string | null;
  isCurrent: boolean;
}) {
  return (
    <Plane
      w={CAR_W}
      h={CAR_H}
      transform={`translateZ(${-READ_GAP}px)`}
      style={{
        background:
          "linear-gradient(to bottom, " +
          "color-mix(in srgb, var(--color-lamp) 11%, var(--color-car-shell)) 0%, " +
          "var(--color-car-shell) 30%, " +
          "var(--color-car-lacquer) 100%)",
      }}
    >
      {/* Seams where the wall panels meet the doorframe. Structure, not
          decoration — they are where a real end wall is actually joined. */}
      {[PANEL_W, PANEL_W + DOOR_W].map((x) => (
        <span
          key={x}
          aria-hidden="true"
          className="absolute inset-y-0 w-px bg-black/50"
          style={{ left: x }}
        />
      ))}

      {nextDestination === null ? <EndWall /> : <Doorway open={isCurrent} />}

      <DestinationBoard
        // Remounting replays the catch animation on arrival.
        key={`${car.id}-${isCurrent}`}
        catching={isCurrent}
        text={nextDestination === null ? "End of the line" : `Next — ${nextDestination}`}
      />

      {car.posters.map((poster) => {
        const { alignItems, ...box } = slot(poster.wall);

        return (
          <div
            key={`${poster.kind}-${poster.wall}`}
            className="absolute flex overflow-hidden"
            style={{ ...box, alignItems, fontSize: PANEL_FONT }}
          >
            <div className="w-full">{renderPoster(poster, car)}</div>
          </div>
        );
      })}
    </Plane>
  );
}
