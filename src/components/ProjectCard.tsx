import { useMotionTemplate, useMotionValue, useSpring, useTransform } from "motion/react";
import * as m from "motion/react-m";
import { useState, type PointerEvent } from "react";

import type { Project } from "../content/projects";
import { hasFinePointer } from "../lib/motion";

const STATUS_LABEL: Record<Project["status"], string> = {
  building: "building",
  shipped: "shipped",
};

/** Degrees of tilt at the corners. Enough to give the card a surface; not
 *  enough to make it feel like it is swinging. */
const MAX_TILT = 5;

const SPRING = { stiffness: 150, damping: 20, mass: 0.6 };

function useCardTilt(enabled: boolean) {
  // -0.5 … 0.5, relative to the centre of the card.
  const px = useMotionValue(0);
  const py = useMotionValue(0);

  const rotateX = useSpring(useTransform(py, [-0.5, 0.5], [MAX_TILT, -MAX_TILT]), SPRING);
  const rotateY = useSpring(useTransform(px, [-0.5, 0.5], [-MAX_TILT, MAX_TILT]), SPRING);

  // The sheen tracks the raw pointer rather than the spring, so the highlight
  // stays under the cursor instead of lagging behind it.
  const sheenX = useTransform(px, (v) => `${(v + 0.5) * 100}%`);
  const sheenY = useTransform(py, (v) => `${(v + 0.5) * 100}%`);
  const sheen = useMotionTemplate`radial-gradient(40rem circle at ${sheenX} ${sheenY}, rgba(255,255,255,0.055), transparent 45%)`;

  const onPointerMove = (event: PointerEvent<HTMLElement>) => {
    if (!enabled) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    px.set((event.clientX - bounds.left) / bounds.width - 0.5);
    py.set((event.clientY - bounds.top) / bounds.height - 0.5);
  };

  const onPointerLeave = () => {
    px.set(0);
    py.set(0);
  };

  return { rotateX, rotateY, sheen, onPointerMove, onPointerLeave };
}

export function ProjectCard({ project }: { project: Project }) {
  // Read once on mount: a tilt that can never be triggered is dead weight on a
  // touch device, and this must not differ between server and first paint.
  const [tiltable] = useState(hasFinePointer);
  const { rotateX, rotateY, sheen, onPointerMove, onPointerLeave } = useCardTilt(tiltable);

  return (
    <div style={tiltable ? { perspective: 800 } : undefined}>
      <m.article
        onPointerMove={tiltable ? onPointerMove : undefined}
        onPointerLeave={tiltable ? onPointerLeave : undefined}
        style={tiltable ? { rotateX, rotateY, transformStyle: "preserve-3d" } : undefined}
        className="relative overflow-hidden rounded-lg border border-hairline bg-surface p-6 transition-colors hover:border-accent/40 sm:p-8"
      >
        {/* Specular highlight, following the cursor across the surface. */}
        {tiltable ? (
          <m.span
            aria-hidden="true"
            style={{ backgroundImage: sheen }}
            className="pointer-events-none absolute inset-0 rounded-lg"
          />
        ) : null}

        <div className="relative flex flex-wrap items-center gap-x-4 gap-y-2">
          <h3 className="font-display text-2xl font-medium">{project.name}</h3>

          <span className="inline-flex items-center gap-2 rounded-full bg-accent-tint px-3 py-1 font-mono text-xs text-muted">
            <span
              aria-hidden="true"
              className={`size-1.5 rounded-full ${
                project.status === "building" ? "bg-live" : "bg-muted"
              }`}
            />
            {STATUS_LABEL[project.status]}
          </span>

          <span className="ml-auto font-mono text-xs text-muted">{project.period}</span>
        </div>

        <p className="relative mt-4 leading-relaxed text-muted">{project.summary}</p>

        <ul className="relative mt-5 space-y-2.5">
          {project.highlights.map((highlight) => (
            <li key={highlight} className="flex gap-3 text-sm leading-relaxed">
              <span aria-hidden="true" className="mt-2 size-1 shrink-0 rounded-full bg-accent" />
              <span>{highlight}</span>
            </li>
          ))}
        </ul>

        <ul className="relative mt-6 flex flex-wrap gap-2">
          {project.stack.map((tech) => (
            <li
              key={tech}
              className="rounded border border-hairline px-2 py-1 font-mono text-xs text-muted"
            >
              {tech}
            </li>
          ))}
        </ul>

        <div className="relative mt-6 flex flex-wrap gap-x-6 gap-y-2 font-mono text-sm">
          <a
            href={project.repoUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="link-wipe text-accent"
          >
            source<span className="sr-only"> for {project.name}</span> ↗
          </a>
          {project.liveUrl ? (
            <a
              href={project.liveUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="link-wipe text-accent"
            >
              live<span className="sr-only"> demo of {project.name}</span> ↗
            </a>
          ) : null}
        </div>
      </m.article>
    </div>
  );
}
