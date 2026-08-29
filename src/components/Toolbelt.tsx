import { skills } from "../content/skills";
import { Reveal } from "./Reveal";
import { Section } from "./Section";

export function Toolbelt() {
  return (
    <Section index="03" title="Toolbelt" id="toolbelt">
      <dl className="grid gap-10 sm:grid-cols-3">
        {skills.map((group, i) => (
          <Reveal key={group.label} delay={i * 80}>
            <dt className="font-mono text-xs tracking-[0.15em] text-accent uppercase">
              {group.label}
            </dt>
            <dd className="mt-4">
              <ul className="space-y-2">
                {group.items.map((item) => (
                  <li key={item} className="text-muted">
                    {item}
                  </li>
                ))}
              </ul>
            </dd>
          </Reveal>
        ))}
      </dl>
    </Section>
  );
}
