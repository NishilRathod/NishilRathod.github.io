import type { Project } from "../content/projects";

const STATUS_LABEL: Record<Project["status"], string> = {
  building: "building",
  shipped: "shipped",
};

export function ProjectCard({ project }: { project: Project }) {
  return (
    <article className="rounded-lg border border-hairline bg-surface p-6 transition-colors hover:border-accent/40 sm:p-8">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
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

      <p className="mt-4 leading-relaxed text-muted">{project.summary}</p>

      <ul className="mt-5 space-y-2.5">
        {project.highlights.map((highlight) => (
          <li key={highlight} className="flex gap-3 text-sm leading-relaxed">
            <span aria-hidden="true" className="mt-2 size-1 shrink-0 rounded-full bg-accent" />
            <span>{highlight}</span>
          </li>
        ))}
      </ul>

      <ul className="mt-6 flex flex-wrap gap-2">
        {project.stack.map((tech) => (
          <li
            key={tech}
            className="rounded border border-hairline px-2 py-1 font-mono text-xs text-muted"
          >
            {tech}
          </li>
        ))}
      </ul>

      <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2 font-mono text-sm">
        <a
          href={project.repoUrl}
          target="_blank"
          rel="noreferrer noopener"
          className="text-accent underline-offset-4 hover:underline"
        >
          source<span className="sr-only"> for {project.name}</span> ↗
        </a>
        {project.liveUrl ? (
          <a
            href={project.liveUrl}
            target="_blank"
            rel="noreferrer noopener"
            className="text-accent underline-offset-4 hover:underline"
          >
            live<span className="sr-only"> demo of {project.name}</span> ↗
          </a>
        ) : null}
      </div>
    </article>
  );
}
