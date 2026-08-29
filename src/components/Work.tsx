import { contributions, projects } from "../content/projects";
import { ProjectCard } from "./ProjectCard";
import { Reveal } from "./Reveal";
import { Section } from "./Section";

export function Work() {
  return (
    <Section index="01" title="Work" id="work">
      <div className="space-y-6">
        {projects.map((project, i) => (
          <Reveal key={project.name} delay={i * 80} variant="lift">
            <ProjectCard project={project} />
          </Reveal>
        ))}
      </div>

      <Reveal>
        <p className="mt-10 text-sm leading-relaxed text-muted">
          Also chips in on open source —{" "}
          {contributions.map((contribution, i) => (
            <span key={contribution.name}>
              <a
                href={contribution.href}
                target="_blank"
                rel="noreferrer noopener"
                className="link-wipe font-mono text-accent"
              >
                {contribution.name}
              </a>
              <span className="text-muted"> ({contribution.note})</span>
              {i < contributions.length - 1 ? ", " : "."}
            </span>
          ))}
        </p>
      </Reveal>
    </Section>
  );
}
