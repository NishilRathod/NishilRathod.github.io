import type { Compartment as CompartmentData } from "../content/compartments";
import { PITCH } from "../lib/train";
import { Bulkhead } from "./Bulkhead";
import { Shell } from "./Shell";

/**
 * One car, placed along the train.
 *
 * The group has no size of its own — it is just an origin at the car's reading
 * position, with the room built around it. Everything inside is positioned
 * relative to where you stand when parked here, which is why the geometry in
 * `Shell` and `Bulkhead` reads as offsets from the viewer rather than as
 * absolute coordinates down the length of the train.
 *
 * It is a real `<section>` with a real label: someone tabbing through the
 * carriage should get told which car they are in, not just find a run of
 * anonymous links.
 */
export function Compartment({
  car,
  index,
  nextDestination,
  isCurrent,
}: {
  car: CompartmentData;
  index: number;
  nextDestination: string | null;
  isCurrent: boolean;
}) {
  return (
    <section
      aria-label={`Car ${car.code} — ${car.destination}`}
      className="absolute top-1/2 left-1/2"
      style={{ transformStyle: "preserve-3d", transform: `translateZ(${-index * PITCH}px)` }}
    >
      <Shell car={car} />
      <Bulkhead car={car} nextDestination={nextDestination} isCurrent={isCurrent} />
    </section>
  );
}
