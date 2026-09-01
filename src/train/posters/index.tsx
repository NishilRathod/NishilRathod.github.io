import type { ReactNode } from "react";

import type { Compartment, Poster } from "../../content/compartments";
import { ContactPoster } from "./ContactPoster";
import { NoticePoster } from "./NoticePoster";
import { ProjectPoster } from "./ProjectPoster";
import { StackPoster } from "./StackPoster";
import { TimelinePoster } from "./TimelinePoster";
import { TitlePoster } from "./TitlePoster";

/**
 * The one place a declared poster becomes a component.
 *
 * Nothing below knows about 3D. A poster renders semantic content and nothing
 * else; whether that content ends up bolted to a bulkhead or stacked on a page
 * is entirely the caller's business. That boundary is what makes the readable
 * page nearly free — it is the same call with a different container.
 *
 * The switch is exhaustive by construction: adding a variant to `Poster`
 * without adding a case here fails to compile, because `never` has no
 * assignable value.
 */
export function renderPoster(poster: Poster, car: Compartment): ReactNode {
  switch (poster.kind) {
    case "title":
      return <TitlePoster />;
    case "timeline":
      return <TimelinePoster entries={poster.entries} heading={car.destination} />;
    case "project":
      return <ProjectPoster project={poster.project} />;
    case "stack":
      return <StackPoster groups={poster.groups} />;
    case "contact":
      return <ContactPoster />;
    case "notice":
      return <NoticePoster heading={poster.heading} lines={poster.lines} />;
    default: {
      const unreachable: never = poster;
      return unreachable;
    }
  }
}

/** Every kind the registry handles. Asserted against the manifest in tests. */
export const POSTER_KINDS = [
  "title",
  "timeline",
  "project",
  "stack",
  "contact",
  "notice",
] as const satisfies readonly Poster["kind"][];
