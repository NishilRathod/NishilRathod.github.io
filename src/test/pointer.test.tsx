import { render, screen } from "@testing-library/react";
import { LazyMotion, domAnimation } from "motion/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ProjectCard } from "../components/ProjectCard";
import { projects } from "../content/projects";

/** Same Motion runtime App sets up; without it `m.*` renders but never animates. */
const renderCard = () =>
  render(
    <LazyMotion features={domAnimation} strict>
      <ProjectCard project={projects[0]} />
    </LazyMotion>,
  );

const stubPointer = (fine: boolean) => {
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: query.includes("pointer: fine") ? fine : false,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  }));
};

describe("project card tilt", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("tilts under a fine pointer", () => {
    stubPointer(true);
    renderCard();

    const card = screen.getByRole("article");
    // Motion writes the rest-state transform up front once tilt is wired up.
    expect(card.getAttribute("style")).toContain("transform");
  });

  it("skips the tilt entirely on a coarse pointer", () => {
    stubPointer(false);
    const { container } = renderCard();

    // A tilt that can never be triggered is dead weight on a touch device: no
    // perspective wrapper, no transform, and no sheen overlay to composite.
    const card = screen.getByRole("article");
    expect(card.getAttribute("style")).toBeNull();
    expect(container.querySelector("[style*='perspective']")).toBeNull();
    expect(container.querySelectorAll("span[aria-hidden='true']")).toHaveLength(
      // Only the status dot and the highlight bullets — no sheen.
      1 + projects[0].highlights.length,
    );
  });
});
