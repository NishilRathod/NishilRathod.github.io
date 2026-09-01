import type { Project } from "../../content/projects";
import { Body, Chip, ChipRow, Departure, Eyebrow } from "./Plate";

/**
 * One project. What it is, what it is built from, where to read it.
 *
 * The highlights are deliberately NOT here — they ride on the notice panel
 * across the door, so the two walls of a project car divide into "what this is"
 * and "how it works" instead of saying the same thing twice.
 */
export function ProjectPoster({ project }: { project: Project }) {
  const shipped = project.status === "shipped";

  return (
    <div className="flex flex-col gap-[0.85em]">
      <div className="flex items-center gap-[0.7em]">
        <Eyebrow>{project.period}</Eyebrow>
        <span
          className={`font-mono text-[0.56em] uppercase tracking-[0.2em] ${
            shipped ? "text-live" : "text-amber"
          }`}
        >
          {shipped ? "Shipped" : "Building"}
        </span>
      </div>

      <h2 className="text-[1.35em] leading-[1.1] font-bold uppercase tracking-[0.07em] text-enamel">
        {project.name}
      </h2>

      <Body>{project.summary}</Body>

      <ChipRow label={`Built with, on ${project.name}`}>
        {project.stack.map((tool) => (
          <Chip key={tool}>{tool}</Chip>
        ))}
      </ChipRow>

      <div className="flex flex-wrap gap-[1.2em] pt-[0.2em]">
        <Departure href={project.repoUrl}>Source for {project.name}</Departure>
        {project.liveUrl ? (
          <Departure href={project.liveUrl}>Live demo of {project.name}</Departure>
        ) : null}
      </div>
    </div>
  );
}
