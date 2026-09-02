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
 *
 * `near` is a scenery budget, not a visibility flag. Out of range a car keeps
 * its bulkhead and every word on its posters and loses only the room around
 * them — which nobody can see anyway. The camera only ever translates, it never
 * turns, so the view forward is stopped dead by the next bulkhead and its shut
 * door leaves, and a car two along is behind an opaque wall. There is no pop as
 * one comes into range either: `index` flips at the midpoint of the vestibule,
 * so a car's shell is built the moment the door that will reveal it *starts*
 * opening, 620ms before it has opened.
 *
 * The saving is not subtle. A shell is sixteen planes, two of them 1920x2400,
 * and each one is a separate compositor layer because it lives in a 3D context
 * and has to be depth-sorted. Eight shells came to ~650MB of backing store
 * against a GPU tile budget of a few hundred, so Chrome spent its time evicting
 * tiles and rasterising them again — which is what "the screen keeps crumbling"
 * actually looks like.
 *
 * Nothing readable is ever conditional on where the camera happens to be.
 */
export function Compartment({
  car,
  index,
  nextDestination,
  isCurrent,
  near,
}: {
  car: CompartmentData;
  index: number;
  nextDestination: string | null;
  isCurrent: boolean;
  /** Within a car of the camera, and so worth lighting the windows for. */
  near: boolean;
}) {
  return (
    <section
      aria-label={`Car ${car.code} — ${car.destination}`}
      className="absolute top-1/2 left-1/2"
      style={{ transformStyle: "preserve-3d", transform: `translateZ(${-index * PITCH}px)` }}
    >
      {near ? <Shell car={car} /> : null}
      <Bulkhead car={car} index={index} nextDestination={nextDestination} isCurrent={isCurrent} />
    </section>
  );
}
