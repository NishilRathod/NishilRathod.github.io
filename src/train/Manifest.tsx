import { compartments } from "../content/compartments";
import { profile } from "../content/profile";
import { renderPoster } from "./posters";

/**
 * The same train, read as a document.
 *
 * Not a second copy of the content — the identical poster components, rendered
 * without the walls around them. That is the whole reason posters know nothing
 * about 3D: one source of truth, two containers, and no chance of the readable
 * version quietly falling behind the one people look at.
 *
 * This is what a screen reader gets, what search engines index, what Ctrl+F
 * searches, what narrow screens get, and what anyone who simply wants to skim a
 * résumé without driving a train gets. It is a first-class view, so it is
 * written like one.
 */
export function Manifest({
  onBoard,
  boardable,
}: {
  onBoard: () => void;
  /** False on screens too narrow to render the carriage legibly. */
  boardable: boolean;
}) {
  return (
    <div className="mx-auto w-full max-w-2xl px-6 py-16 sm:px-8">
      <header className="flex flex-wrap items-start justify-between gap-6 border-b border-hairline pb-10">
        <p className="font-mono text-[0.65rem] uppercase tracking-[0.3em] text-lamp/60">
          Service manifest
        </p>

        {boardable ? (
          <button
            type="button"
            onClick={onBoard}
            className="rounded-[2px] border border-enamel/20 px-3 py-2 font-mono text-[0.62rem] uppercase tracking-[0.2em] text-enamel/60 transition-colors hover:border-lamp/50 hover:text-lamp"
          >
            Board the train
          </button>
        ) : (
          <p className="max-w-[22ch] text-right font-mono text-[0.6rem] leading-relaxed uppercase tracking-[0.16em] text-enamel/35">
            The carriage needs a wider screen
          </p>
        )}
      </header>

      <main id="main" className="flex flex-col">
        {compartments.map((car) => (
          <section
            key={car.id}
            id={car.id}
            aria-label={`Car ${car.code} — ${car.destination}`}
            className="flex flex-col gap-7 border-b border-hairline py-12 last:border-0"
            style={{ fontSize: 17 }}
          >
            <p className="font-mono text-[0.62em] uppercase tracking-[0.3em] text-enamel/30">
              Car {car.code}
              <span className="px-3 text-enamel/20">&#183;</span>
              {car.label}
            </p>

            {car.posters.map((poster) => (
              <div key={`${poster.kind}-${poster.wall}`}>{renderPoster(poster, car)}</div>
            ))}
          </section>
        ))}
      </main>

      <footer className="border-t border-hairline py-10 font-mono text-[0.65rem] uppercase tracking-[0.2em] text-enamel/30">
        Built from scratch by {profile.name} &#183; {new Date().getFullYear()}
      </footer>
    </div>
  );
}
