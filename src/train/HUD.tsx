import type { Compartment } from "../content/compartments";
import { profile } from "../content/profile";

/**
 * The overlay on the glass.
 *
 * Kept deliberately quiet. The carriage already has one thing that glows — the
 * destination board over the door — and a second competing light would spend
 * the effect twice. Everything here is hairlines and small tracked mono, sized
 * so it reads as instrumentation rather than as chrome.
 *
 * The line map is the navigation: one stop on a rail per car, the way the strip
 * above a metro door tells you where you are on the line. It is genuinely a
 * sequence, so numbering it is honest rather than decorative. It is also the
 * only way to jump: there are more cars than number keys, and every stop is a
 * button that says which car it is when you point at it.
 */

/**
 * What you read while still on the platform.
 *
 * Without this the opening frame is a dark carriage at a distance under a hint
 * that says "hold W to go forward", which reads as a page that has not finished
 * loading. A departure board says the train is about to leave and that going is
 * your move to make.
 *
 * No `h1` in here. The only one on the site is on the title poster inside car
 * 01, and a second would leave the document with two competing titles for the
 * sake of an overlay that is gone ten seconds later.
 */
function Departure({ terminus }: { terminus: string }) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-end pb-[14vh]">
      <div className="flex flex-col items-center gap-6 px-8 text-center">
        <p className="text-[0.62rem] uppercase tracking-[0.36em] text-enamel/40">Now departing</p>

        <p className="text-[1.7rem] leading-none font-bold uppercase tracking-[0.2em] text-enamel sm:text-[2.1rem]">
          {profile.name}
        </p>

        <span aria-hidden="true" className="block h-px w-16 bg-lamp/40" />

        <p className="text-[0.66rem] uppercase tracking-[0.28em] text-enamel/45">
          All stations to <span className="text-lamp">{terminus}</span>
        </p>

        {/* The one instruction that matters here. The full controls appear once
            they are aboard and have something to drive. */}
        <p className="pt-4 text-[0.7rem] uppercase tracking-[0.3em] text-lamp/80">
          Press <span className="text-lamp">W</span> to board
        </p>
      </div>
    </div>
  );
}

export function HUD({
  cars,
  index,
  boarded,
  showHint,
  onJump,
  onLeave,
}: {
  cars: Compartment[];
  index: number;
  /** False while still on the platform, before the boarding move has run. */
  boarded: boolean;
  showHint: boolean;
  onJump: (index: number) => void;
  onLeave: () => void;
}) {
  const car = cars[index];

  return (
    <div className="pointer-events-none absolute inset-0 z-10 font-mono text-enamel">
      <div className="flex items-start justify-between p-6 sm:p-8">
        {/* There is nothing to be at car 01 of until you are on the train. */}
        {boarded ? (
          <p className="text-[0.7rem] uppercase tracking-[0.24em] text-enamel/50">
            Car {car.code}
            <span className="px-2 text-enamel/25">/</span>
            {String(cars.length).padStart(2, "0")}
            <span className="px-3 text-enamel/25">&#183;</span>
            <span className="text-lamp">{car.destination}</span>
          </p>
        ) : (
          <span />
        )}

        <button
          type="button"
          onClick={onLeave}
          className="pointer-events-auto rounded-[2px] border border-enamel/20 px-3 py-2 text-[0.62rem] uppercase tracking-[0.2em] text-enamel/60 transition-colors hover:border-lamp/50 hover:text-lamp"
        >
          Read as a page
        </button>
      </div>

      {boarded ? (
        <div className="absolute inset-x-0 bottom-0 flex flex-col items-center gap-5 p-6 sm:p-8">
          <p
            className={`text-[0.62rem] uppercase tracking-[0.28em] text-enamel/40 transition-opacity duration-700 ${
              showHint ? "opacity-100" : "opacity-0"
            }`}
          >
            Hold W to go forward &#183; S to go back
          </p>

          <nav aria-label="Cars" className="pointer-events-auto w-full max-w-xl">
            <ol className="flex items-center">
              {cars.map((stop, position) => {
                const current = position === index;
                const visited = position < index;

                return (
                  <li key={stop.id} className="flex flex-1 items-center last:flex-none">
                    <button
                      type="button"
                      onClick={() => onJump(position)}
                      aria-current={current ? "true" : undefined}
                      aria-label={`Car ${stop.code}, ${stop.destination}`}
                      className="group relative flex size-7 shrink-0 items-center justify-center"
                    >
                      <span
                        aria-hidden="true"
                        className={`block rounded-full transition-all ${
                          current
                            ? "size-3 bg-lamp shadow-[0_0_14px_var(--color-lamp)]"
                            : visited
                              ? "size-1.5 bg-enamel/45 group-hover:bg-lamp"
                              : "size-1.5 bg-enamel/20 group-hover:bg-lamp"
                        }`}
                      />
                      {/* Only the current stop is labelled all the time. A label
                          per stop on a rail this narrow would collide, so the
                          rest name themselves on hover or keyboard focus —
                          above the rail, clear of the current stop's label
                          below it. The ends are pinned to their edge so the
                          first and last labels do not hang off the rail. */}
                      {current ? (
                        <span className="absolute top-8 whitespace-nowrap text-[0.58rem] uppercase tracking-[0.22em] text-lamp/70">
                          {stop.destination}
                        </span>
                      ) : (
                        <span
                          aria-hidden="true"
                          data-stop-label
                          className={`pointer-events-none absolute bottom-7 whitespace-nowrap text-[0.58rem] uppercase tracking-[0.22em] text-enamel/75 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100 ${
                            position === 0
                              ? "left-0"
                              : position === cars.length - 1
                                ? "right-0"
                                : "left-1/2 -translate-x-1/2"
                          }`}
                        >
                          Car {stop.code} &#183; {stop.destination}
                        </span>
                      )}
                    </button>

                    {position < cars.length - 1 ? (
                      <span
                        aria-hidden="true"
                        className={`h-px flex-1 ${visited ? "bg-enamel/30" : "bg-enamel/12"}`}
                      />
                    ) : null}
                  </li>
                );
              })}
            </ol>
          </nav>

          <div className="pointer-events-auto flex gap-3 pt-6">
            <button
              type="button"
              onClick={() => onJump(index - 1)}
              disabled={index === 0}
              className="rounded-[2px] border border-enamel/20 px-4 py-2 text-[0.62rem] uppercase tracking-[0.2em] text-enamel/60 transition-colors enabled:hover:border-lamp/50 enabled:hover:text-lamp disabled:opacity-25"
            >
              <span aria-hidden="true">&#9660;</span> Back a car
            </button>
            <button
              type="button"
              onClick={() => onJump(index + 1)}
              disabled={index === cars.length - 1}
              className="rounded-[2px] border border-enamel/20 px-4 py-2 text-[0.62rem] uppercase tracking-[0.2em] text-enamel/60 transition-colors enabled:hover:border-lamp/50 enabled:hover:text-lamp disabled:opacity-25"
            >
              <span aria-hidden="true">&#9650;</span> Forward a car
            </button>
          </div>
        </div>
      ) : (
        <Departure terminus={cars[cars.length - 1].destination} />
      )}
    </div>
  );
}
