import { journey, type JourneyEntry } from "./journey";
import { contributions, projects, type Project } from "./projects";
import { skills, type SkillGroup } from "./skills";

/**
 * The train's manifest — the one file to edit when the portfolio grows.
 *
 * A compartment is whatever you decide it is: a list of entries, a single
 * project, a way to get in touch. Adding a car is appending one object to
 * `manifest` below; the numbering, the line map, the URL hash and the plain-text
 * page all follow from it.
 *
 * Posters are declared, not written. Each one names a `kind`, which
 * `src/train/posters/index.ts` resolves to a component. That indirection is what
 * lets the same declaration render as a panel bolted to a wall in the 3D view
 * and as a plain `<section>` in the readable one.
 */

/** Which side of the connecting door a poster is bolted to. */
export type Wall = "left" | "right";

export type Poster =
  | { kind: "title"; wall: Wall }
  | { kind: "timeline"; wall: Wall; entries: JourneyEntry[] }
  | { kind: "project"; wall: Wall; project: Project }
  | { kind: "stack"; wall: Wall; groups: SkillGroup[] }
  | { kind: "contact"; wall: Wall }
  | { kind: "notice"; wall: Wall; heading: string; lines: string[] };

export type Compartment = {
  /** Stable across renumbering — it is the URL hash and the test key. */
  id: string;
  /** "04". Derived from position, never hand-written; see below. */
  code: string;
  /** Small type on the side wall. What kind of car this is. */
  label: string;
  /** Enamel lettering on the side wall and the destination board. */
  destination: string;
  posters: Poster[];
};

type CompartmentSpec = Omit<Compartment, "code">;

/**
 * Look content up by name rather than by array index, and fail loudly at import
 * time when a name stops matching. An index would silently shift the moment a
 * journey entry is inserted, and a wrong-but-plausible car is worse than a
 * missing one.
 */
function entry(title: string): JourneyEntry {
  const found = journey.find((item) => item.title === title);
  if (!found) throw new Error(`compartments: no journey entry titled "${title}"`);
  return found;
}

function project(name: string): Project {
  const found = projects.find((item) => item.name === name);
  if (!found) throw new Error(`compartments: no project named "${name}"`);
  return found;
}

/**
 * A project always fills a car the same way: the work on the left, the
 * engineering that went into it on the right. Keeping the shape in one function
 * means a new project is one line at the call site, and the two never drift
 * apart into slightly different layouts.
 */
function projectCar(name: string, id: string): CompartmentSpec {
  const it = project(name);

  return {
    id,
    label: "Project",
    destination: it.name,
    posters: [
      { kind: "project", wall: "left", project: it },
      { kind: "notice", wall: "right", heading: "Engineering notes", lines: it.highlights },
    ],
  };
}

const manifest: CompartmentSpec[] = [
  {
    id: "boarding",
    label: "Boarding",
    destination: "Nishil Rathod",
    posters: [
      { kind: "title", wall: "left" },
      {
        kind: "notice",
        wall: "right",
        heading: "How to travel",
        lines: [
          "Hold W or the up arrow to move forward.",
          "Hold S or the down arrow to go back.",
          "Press a number to jump straight to that car.",
        ],
      },
    ],
  },
  {
    id: "education",
    label: "Education",
    destination: "Education",
    posters: [
      {
        kind: "timeline",
        wall: "left",
        entries: [
          entry("Started at VES Polytechnic"),
          entry("Into the degree at A.P. Shah Institute of Technology"),
          entry("Graduated"),
        ],
      },
    ],
  },
  {
    id: "experience",
    label: "Experience",
    destination: "Experience",
    posters: [
      {
        kind: "timeline",
        wall: "left",
        entries: [
          entry("Founding member, Coder's Club @APSIT"),
          entry("Software Developer Intern at Logout.world"),
          entry("Building in the open"),
        ],
      },
      {
        kind: "notice",
        wall: "right",
        heading: "Chips in on open source",
        // Contributions, not ownership — these are AISquare-Studio's repos.
        lines: contributions.map((it) => `${it.name} — ${it.note}`),
      },
    ],
  },
  projectCar("gitscout", "gitscout"),
  projectCar("WeatherBoard", "weatherboard"),
  projectCar("AvaxGods", "avaxgods"),
  projectCar("Blog Website", "blog-website"),
  {
    id: "tech-stack",
    label: "Tech stack",
    destination: "Tech stack",
    posters: [{ kind: "stack", wall: "left", groups: skills }],
  },
  {
    id: "terminus",
    label: "End of the line",
    destination: "Terminus",
    posters: [{ kind: "contact", wall: "left" }],
  },
];

/**
 * Car numbers come from position, so inserting a compartment renumbers the rest
 * instead of leaving two cars both calling themselves 04.
 */
export const compartments: Compartment[] = manifest.map((spec, index) => ({
  ...spec,
  code: String(index + 1).padStart(2, "0"),
}));

export const carCount = compartments.length;

export const indexOfCar = (id: string) => compartments.findIndex((car) => car.id === id);
