import type { JourneyEntry } from "../../content/journey";
import { Body, Departure } from "./Plate";

/**
 * A run of dated entries.
 *
 * An ordered list, and the years are shown, because these genuinely are a
 * sequence — the order carries meaning a reader needs. The hairline running
 * down the left is the only ornament, and it stops at the last entry rather
 * than trailing off the bottom of the panel.
 */
export function TimelinePoster({ entries, heading }: { entries: JourneyEntry[]; heading: string }) {
  return (
    <div className="flex flex-col gap-[1em]">
      <h2 className="text-[1.15em] leading-tight font-bold uppercase tracking-[0.12em] text-enamel">
        {heading}
      </h2>

      <ol className="flex flex-col">
        {entries.map((item, index) => (
          <li key={item.title} className="flex gap-[0.9em]">
            <div className="flex shrink-0 flex-col items-center pt-[0.3em]">
              <span className="size-[0.4em] rounded-full bg-lamp/70" aria-hidden="true" />
              {index < entries.length - 1 ? (
                <span className="w-px grow bg-enamel/12" aria-hidden="true" />
              ) : null}
            </div>

            <div className="flex flex-col gap-[0.35em] pb-[1.1em] last:pb-0">
              <p className="font-mono text-[0.58em] uppercase tracking-[0.24em] text-lamp/60">
                {item.year}
              </p>
              <h3 className="text-[0.86em] leading-snug font-semibold text-enamel">{item.title}</h3>
              <Body>{item.body}</Body>
              {item.href ? <Departure href={item.href}>Visit</Departure> : null}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
