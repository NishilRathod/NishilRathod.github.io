import type { SkillGroup } from "../../content/skills";
import { Chip, ChipRow, Eyebrow } from "./Plate";

/**
 * Languages, frameworks, tools. Plain lists with no proficiency bars — a number
 * next to a language is unfalsifiable, and this wall's only job is credibility.
 */
export function StackPoster({ groups }: { groups: SkillGroup[] }) {
  return (
    <div className="flex flex-col gap-[1.2em]">
      <h2 className="text-[1.15em] leading-tight font-bold uppercase tracking-[0.12em] text-enamel">
        Tech stack
      </h2>

      {groups.map((group) => (
        <div key={group.label} className="flex flex-col gap-[0.55em]">
          <Eyebrow>{group.label}</Eyebrow>
          <ChipRow label={group.label}>
            {group.items.map((item) => (
              <Chip key={item}>{item}</Chip>
            ))}
          </ChipRow>
        </div>
      ))}
    </div>
  );
}
