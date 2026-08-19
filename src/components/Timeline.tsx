import { journey } from "../content/journey";
import { Reveal } from "./Reveal";
import { Section } from "./Section";

export function Timeline() {
  return (
    <Section index="02" title="Journey" id="journey">
      <ol className="relative border-l border-hairline pl-8 sm:pl-10">
        {journey.map((entry, i) => (
          <Reveal as="li" key={`${entry.year}-${entry.title}`} delay={i * 60} className="block pb-12 last:pb-0">
            <span
              aria-hidden="true"
              className="absolute -left-[4.5px] mt-2 size-2 rounded-full bg-accent ring-4 ring-bg"
            />

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
        ))}
      </ol>
    </Section>
  );
}
