import * as m from "motion/react-m";

import { journey } from "../content/journey";
import type { JourneyEntry } from "../content/journey";
import { useReveal } from "../hooks/useReveal";
import { EASE_OUT_EXPO, REVEAL_VARIANTS, revealTransition } from "../lib/motion";
import { Section } from "./Section";

type EntryProps = {
  entry: JourneyEntry;
  isLast: boolean;
  delay: number;
};

/**
 * One stop on the timeline.
 *
 * Owns its own reveal state rather than delegating to `Reveal`, because the
 * rail, the node, and the copy all key off the same moment — the connector
 * draws downward as the entry arrives, which is what makes the list read as a
 * line being traced rather than a stack of paragraphs.
 *
 * Two columns — a rail column and a content column — rather than absolutely
 * positioning the node against the list. The content column carries a
 * transform, and a transformed element becomes the containing block for its
 * absolutely positioned descendants, which dragged the node on top of the year.
 * Flex has no such failure mode.
 */
function TimelineEntry({ entry, isLast, delay }: EntryProps) {
  const { ref, revealed, startedRevealed } = useReveal<HTMLLIElement>();
  const seconds = delay / 1000;

  return (
    <li ref={ref} className="flex gap-5 sm:gap-6">
      <div aria-hidden="true" className="relative flex w-2 shrink-0 flex-col items-center">
        <span className="mt-2 size-2 shrink-0 rounded-full bg-accent" />

        {/*
          A ring that expands out of the node once, as the entry lands. There is
          no arrival to punctuate when the page renders already-visible, so it
          is simply not rendered in that case.
        */}
        {startedRevealed ? null : (
          <m.span
            className="pointer-events-none absolute top-2 size-2 rounded-full border border-accent"
            initial={{ opacity: 0, scale: 0.6 }}
            animate={revealed ? { opacity: [0, 0.5, 0], scale: [0.6, 1.8, 2] } : undefined}
            transition={{ duration: 1.1, ease: "easeOut", delay: seconds }}
          />
        )}

        {isLast ? null : (
          <m.span
            className="mt-2 w-px grow origin-top bg-hairline"
            initial={startedRevealed ? false : { scaleY: 0 }}
            animate={revealed ? { scaleY: 1 } : { scaleY: 0 }}
            transition={{ duration: 0.5, ease: EASE_OUT_EXPO, delay: seconds }}
          />
        )}
      </div>

      <m.div
        variants={REVEAL_VARIANTS.slide}
        initial={startedRevealed ? false : "hidden"}
        animate={revealed ? "visible" : "hidden"}
        transition={{ ...revealTransition, delay: seconds }}
        className={isLast ? "min-w-0" : "min-w-0 pb-12"}
      >
        <p className="font-mono text-sm text-accent">{entry.year}</p>

        <h3 className="mt-2 text-lg font-medium">
          {entry.href ? (
            <a
              href={entry.href}
              target="_blank"
              rel="noreferrer noopener"
              className="link-wipe hover:text-accent"
            >
              {entry.title}
            </a>
          ) : (
            entry.title
          )}
        </h3>

        <p className="mt-2 max-w-2xl leading-relaxed text-muted">{entry.body}</p>
      </m.div>
    </li>
  );
}

export function Timeline() {
  return (
    <Section index="02" title="Journey" id="journey">
      <ol>
        {journey.map((entry, i) => (
          <TimelineEntry
            key={`${entry.year}-${entry.title}`}
            entry={entry}
            isLast={i === journey.length - 1}
            delay={i * 60}
          />
        ))}
      </ol>
    </Section>
  );
}
