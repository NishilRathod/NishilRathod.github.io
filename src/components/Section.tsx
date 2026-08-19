import type { ReactNode } from "react";

import { Reveal } from "./Reveal";

type SectionProps = {
  /** Two-digit numeral, e.g. "01". */
  index: string;
  title: string;
  id: string;
  children: ReactNode;
};

export function Section({ index, title, id, children }: SectionProps) {
  const headingId = `${id}-heading`;

  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className="border-t border-hairline py-20 sm:py-28"
    >
      <Reveal>
        <div className="mb-12 flex items-baseline gap-4 sm:mb-16">
          <span aria-hidden="true" className="font-mono text-sm text-accent">
            {index}
          </span>
          <h2 id={headingId} className="font-display text-3xl font-medium sm:text-4xl">
            {title}
          </h2>
        </div>
      </Reveal>
      {children}
    </section>
  );
}
