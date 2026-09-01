import type { ReactNode } from "react";

/**
 * Shared type treatment for everything bolted to a wall.
 *
 * Sizes are in `em`, never `rem`. The same poster renders twice: once on a
 * bulkhead where a perspective projection shrinks it to about two thirds, and
 * once on the readable page at native scale. Anchoring to the inherited font
 * size lets each container set one number and have the whole hierarchy follow,
 * instead of maintaining two parallel sets of sizes that drift apart.
 */

/** Small tracked mono label. What kind of thing you are looking at. */
export function Eyebrow({ children }: { children: ReactNode }) {
  return (
    <p className="font-mono text-[0.58em] font-medium uppercase tracking-[0.3em] text-lamp/60">
      {children}
    </p>
  );
}

/** Hairline under a heading, the width of the lettering rather than the panel —
 *  a full-width rule would read as a divider between two things. */
export function Rule({ className = "" }: { className?: string }) {
  return <span className={`block h-px w-10 bg-lamp/40 ${className}`} aria-hidden="true" />;
}

export function Body({ children }: { children: ReactNode }) {
  return <p className="text-[0.8em] leading-[1.65] text-enamel/65">{children}</p>;
}

/** One item of data: a language, a tool, a period. */
export function Chip({ children }: { children: ReactNode }) {
  return (
    <li className="rounded-[2px] border border-enamel/15 bg-enamel/5 px-[0.6em] py-[0.25em] font-mono text-[0.58em] uppercase tracking-[0.14em] text-enamel/70">
      {children}
    </li>
  );
}

export function ChipRow({ children, label }: { children: ReactNode; label: string }) {
  return (
    <ul aria-label={label} className="flex flex-wrap gap-[0.4em]">
      {children}
    </ul>
  );
}

/**
 * External link with the arrow built in. Carries `rel="noreferrer"` because
 * every one of these leaves the site.
 */
export function Departure({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="link-wipe inline-flex items-center gap-[0.4em] font-mono text-[0.62em] uppercase tracking-[0.18em] text-lamp transition-colors hover:text-amber"
    >
      {children}
      <span aria-hidden="true">&#8594;</span>
    </a>
  );
}
