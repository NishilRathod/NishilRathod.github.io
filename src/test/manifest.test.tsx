import { render, screen, within } from "@testing-library/react";
import { LazyMotion, domAnimation } from "motion/react";
import { describe, expect, it } from "vitest";

import { compartments, type Poster } from "../content/compartments";
import { profile } from "../content/profile";
import { skills } from "../content/skills";
import { Manifest } from "../train/Manifest";
import { POSTER_KINDS } from "../train/posters";

/**
 * The readable view of the train.
 *
 * Everything here is derived from `compartments.ts` rather than hard-coded, so
 * adding a car cannot quietly go untested — a new compartment is asserted the
 * moment it is declared, and a poster kind with no case in the registry fails
 * before it can render as nothing.
 *
 * This is also where the content guarantees live now. The 3D view renders the
 * identical poster components, so asserting them here covers both without
 * driving a carriage in jsdom.
 */

/** The same Motion runtime `App` mounts. The contact poster reuses
 *  `MagneticLink`, which is an `m.a` and silently loses its gestures without a
 *  provider — rendering it bare here would test a page the app never serves. */
const renderManifest = (boardable = true) =>
  render(
    <LazyMotion features={domAnimation} strict>
      <Manifest onBoard={() => {}} boardable={boardable} />
    </LazyMotion>,
  );

/** Every poster on the train, with the car it is bolted to. */
const allPosters = compartments.flatMap((car) => car.posters.map((poster) => ({ car, poster })));

const postersOfKind = <K extends Poster["kind"]>(kind: K) =>
  allPosters
    .map(({ poster }) => poster)
    .filter((poster): poster is Extract<Poster, { kind: K }> => poster.kind === kind);

describe("the manifest", () => {
  it("gives every car a labelled section, numbered by position", () => {
    renderManifest();

    compartments.forEach((car, position) => {
      expect(car.code).toBe(String(position + 1).padStart(2, "0"));
      expect(
        screen.getByRole("region", { name: `Car ${car.code} — ${car.destination}` }),
      ).toBeInTheDocument();
    });
  });

  it("never issues the same car number twice", () => {
    // Two cars both calling themselves 04 is the exact failure the derived
    // numbering exists to prevent, so assert the property rather than trusting
    // the derivation.
    const codes = compartments.map((car) => car.code);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it("has a registered component for every poster kind on the train", () => {
    // The claim `posters/index.tsx` makes about itself. Without this, adding a
    // kind and forgetting the registry renders an empty wall.
    const used = new Set(allPosters.map(({ poster }) => poster.kind));

    for (const kind of used) expect(POSTER_KINDS).toContain(kind);
  });
});

describe("what the cars carry", () => {
  it("renders every project with its source link, live link only when real", () => {
    renderManifest();

    for (const { project } of postersOfKind("project")) {
      expect(screen.getByRole("heading", { name: project.name, level: 2 })).toBeInTheDocument();

      expect(screen.getByRole("link", { name: `Source for ${project.name}` })).toHaveAttribute(
        "href",
        project.repoUrl,
      );

      const live = screen.queryByRole("link", { name: `Live demo of ${project.name}` });
      if (project.liveUrl) expect(live).toHaveAttribute("href", project.liveUrl);
      else expect(live).toBeNull();
    }
  });

  it("renders every dated entry declared on a timeline poster", () => {
    renderManifest();

    for (const poster of postersOfKind("timeline")) {
      for (const item of poster.entries) {
        expect(screen.getByRole("heading", { name: item.title, level: 3 })).toBeInTheDocument();
      }
    }
  });

  it("lists every skill in every group", () => {
    renderManifest();

    for (const group of skills) {
      // `getAllByText` throughout: a tool named on the stack wall is often also
      // a chip on a project, and a duplicate is correct rather than a failure.
      for (const item of group.items) expect(screen.getAllByText(item).length).toBeGreaterThan(0);
      expect(screen.getAllByText(group.label).length).toBeGreaterThan(0);
    }
  });

  it("builds a working mailto from the split address", () => {
    renderManifest();

    const address = `${profile.emailUser}@${profile.emailDomain}`;
    expect(screen.getByRole("link", { name: address })).toHaveAttribute("href", `mailto:${address}`);
  });

  it("has exactly one h1, and it names him", () => {
    renderManifest();

    const headings = screen.getAllByRole("heading", { level: 1 });
    expect(headings).toHaveLength(1);
    expect(headings[0]).toHaveTextContent(profile.name);
  });
});

describe("boarding from the page", () => {
  it("offers the train when the screen can take it", () => {
    renderManifest(true);

    expect(screen.getByRole("button", { name: /board the train/i })).toBeInTheDocument();
    expect(screen.queryByText(/needs a wider screen/i)).toBeNull();
  });

  it("says why, rather than offering a ride that would be unreadable", () => {
    renderManifest(false);

    expect(screen.queryByRole("button", { name: /board the train/i })).toBeNull();
    expect(screen.getByText(/needs a wider screen/i)).toBeInTheDocument();
  });
});

describe("the header", () => {
  it("names the service", () => {
    const { container } = renderManifest();

    expect(within(container).getByText(/service manifest/i)).toBeInTheDocument();
  });
});
