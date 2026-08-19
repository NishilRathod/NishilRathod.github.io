import { journey } from "../content/journey";
import { Reveal } from "./Reveal";
import { Section } from "./Section";

export function Timeline() {
  return (
    <Section index="02" title="Journey" id="journey">
      {/*
        Two columns per entry — a rail column and a content column — rather than
        absolutely positioning the node against the list. `Reveal` applies a
        transform, and a transformed element becomes the containing block for
        its absolutely positioned descendants, which dragged the node on top of
        the year. Flex has no such failure mode.
      */}
      <ol>
        {journey.map((entry, i) => {
          const isLast = i === journey.length - 1;

          return (
            <li key={`${entry.year}-${entry.title}`} className="flex gap-5 sm:gap-6">
              <div aria-hidden="true" className="flex w-2 shrink-0 flex-col items-center">
                <span className="mt-2 size-2 shrink-0 rounded-full bg-accent" />
                {isLast ? null : <span className="mt-2 w-px grow bg-hairline" />}
              </div>

              <Reveal delay={i * 60} className={isLast ? "min-w-0" : "min-w-0 pb-12"}>
                <p className="font-mono text-sm text-accent">{entry.year}</p>

                <h3 className="mt-2 text-lg font-medium">
                  {entry.href ? (
                    <a
                      href={entry.href}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="underline-offset-4 hover:text-accent hover:underline"
                    >
                      {entry.title}
                    </a>
                  ) : (
                    entry.title
                  )}
                </h3>

                <p className="mt-2 max-w-2xl leading-relaxed text-muted">{entry.body}</p>
              </Reveal>
            </li>
          );
        })}
      </ol>
    </Section>
  );
}
