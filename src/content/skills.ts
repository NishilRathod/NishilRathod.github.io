export type SkillGroup = {
  label: string;
  items: string[];
};

/**
 * Plain lists, deliberately. No proficiency percentages — a number like
 * "Python 85%" is unfalsifiable and reads as filler on a page whose only job
 * is credibility.
 */
export const skills: SkillGroup[] = [
  {
    label: "Languages",
    items: ["Java", "Python", "C / C++", "JavaScript", "TypeScript", "SQL", "PHP"],
  },
  {
    label: "Frameworks",
    items: ["Django", "FastAPI", "React", "React Native", "Spring Boot", "Selenium", "Tailwind"],
  },
  {
    label: "Tools",
    items: ["Git", "GitHub", "Docker", "Redis", "Claude Code", "VS Code", "Android Studio"],
  },
];
