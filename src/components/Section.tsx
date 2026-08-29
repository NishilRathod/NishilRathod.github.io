import * as m from "motion/react-m";
import type { ReactNode } from "react";

import { revealTransition } from "../lib/motion";
import { Reveal } from "./Reveal";

type SectionProps = {
  /** Two-digit numeral, e.g. "01". */
  index: string;
  title: string;
  id: string;
  children: ReactNode;
};

/** The numeral arrives first, from the margin, and the title follows it in. */
const numeral = {
  hidden: { opacity: 0, x: -8 },
  visible: { opacity: 1, x: 0, transition: revealTransition },
};

const heading = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { ...revealTransition, delay: 0.1 } },
};

export function Section({ index, title, id, children }: SectionProps) {
  const headingId = `${id}-heading`;

  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className="border-t border-hairline py-20 sm:py-28"
    >
      <Reveal variant="none" className="mb-12 flex items-baseline gap-4 sm:mb-16">
        <m.span variants={numeral} aria-hidden="true" className="font-mono text-sm text-accent">
          {index}
        </m.span>
        <m.h2 variants={heading} id={headingId} className="font-display text-3xl font-medium sm:text-4xl">
          {title}
        </m.h2>
      </Reveal>
      {children}
    </section>
  );
}
