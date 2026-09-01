import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { LegacyPage } from "../components/LegacyPage";
import { journey } from "../content/journey";
import { profile } from "../content/profile";
import { contributions, projects } from "../content/projects";
import { skills } from "../content/skills";

/**
 * The retired scrolling design, still held to every guarantee it shipped with.
 *
 * `LegacyPage` is not rendered by the app any more — the site is the train. It
 * is kept, and kept passing, so the previous design stays genuinely restorable
 * rather than merely present in the tree. If these ever become expensive to
 * keep green, that is the signal to delete the old design outright rather than
 * to weaken the assertions.
 */
describe("page content", () => {
  it("renders a card for every project, with its repo link", () => {
    render(<LegacyPage />);

    for (const project of projects) {
      const heading = screen.getByRole("heading", { name: project.name, level: 3 });
      const card = heading.closest("article");
      expect(card).not.toBeNull();

      const source = within(card as HTMLElement).getByRole("link", {
        name: new RegExp(`source for ${project.name}`, "i"),
      });
      expect(source).toHaveAttribute("href", project.repoUrl);
    }
  });

  it("only shows a live link when the project actually has one", () => {
    render(<LegacyPage />);

    for (const project of projects) {
      const card = screen
        .getByRole("heading", { name: project.name, level: 3 })
        .closest("article") as HTMLElement;

      const live = within(card).queryByRole("link", {
        name: new RegExp(`live demo of ${project.name}`, "i"),
      });

      if (project.liveUrl) {
        expect(live).toHaveAttribute("href", project.liveUrl);
      } else {
        expect(live).toBeNull();
      }
    }
  });

  it("renders journey entries in chronological order", () => {
    const { container } = render(<LegacyPage />);

    const timeline = container.querySelector("#journey ol");
    expect(timeline).not.toBeNull();

    const rendered = Array.from((timeline as HTMLElement).querySelectorAll(":scope > li h3")).map(
      (node) => node.textContent,
    );
    expect(rendered).toEqual(journey.map((entry) => entry.title));
  });

  it("positions timeline nodes without absolute positioning", () => {
    const { container } = render(<LegacyPage />);

    // Regression: the node used to be `absolute`, resolved against the nearest
    // transformed ancestor. `Reveal` applies a transform, so the containing
    // block became the <li> and the node landed on top of the year. Flex
    // columns have no such dependency — keep it that way.
    const positioned = container.querySelectorAll("#journey [class*='absolute']");
    expect(positioned).toHaveLength(0);
  });

  it("draws a rail segment between entries but not after the last one", () => {
    const { container } = render(<LegacyPage />);

    const items = container.querySelectorAll("#journey ol > li");
    expect(items).toHaveLength(journey.length);

    items.forEach((item, i) => {
      const rail = item.querySelector("[class*='grow']");
      if (i === journey.length - 1) {
        expect(rail).toBeNull();
      } else {
        expect(rail).not.toBeNull();
      }
    });
  });

  it("lists every skill in every group", () => {
    const { container } = render(<LegacyPage />);

    const toolbelt = container.querySelector("#toolbelt") as HTMLElement;
    expect(toolbelt).not.toBeNull();

    for (const group of skills) {
      expect(within(toolbelt).getByText(group.label)).toBeInTheDocument();
      for (const item of group.items) {
        expect(within(toolbelt).getByText(item)).toBeInTheDocument();
      }
    }
  });

  it("frames open-source work as contributions, not owned projects", () => {
    render(<LegacyPage />);

    // The wording must not imply ownership — he made small contributions only.
    expect(screen.getByText(/chips in on open source/i)).toBeInTheDocument();

    for (const contribution of contributions) {
      expect(screen.getByRole("link", { name: contribution.name })).toHaveAttribute(
        "href",
        contribution.href,
      );
    }
  });
});

describe("contact details", () => {
  it("builds a working mailto link from the split address", () => {
    render(<LegacyPage />);

    const expected = `${profile.emailUser}@${profile.emailDomain}`;
    const link = screen.getByRole("link", { name: expected });
    expect(link).toHaveAttribute("href", `mailto:${expected}`);
  });

  it("gives every icon-only social link an accessible name", () => {
    render(<LegacyPage />);

    for (const social of profile.socials) {
      // Icon links carry no text, so the name must come from aria-label —
      // without it a screen reader announces nothing but "link".
      const link = screen.getByRole("link", {
        name: `${social.label} (opens in a new tab)`,
      });
      expect(link).toHaveAttribute("href", social.href);
      expect(link.querySelector("svg")).not.toBeNull();
    }
  });
});

describe("decorative backdrop", () => {
  it("stays out of the accessibility tree and out of the way of clicks", () => {
    const { container } = render(<LegacyPage />);

    const backdrop = container.querySelector("[class*='pointer-events-none'][aria-hidden='true']");
    expect(backdrop).not.toBeNull();
    expect((backdrop as HTMLElement).className).toContain("pointer-events-none");
  });

  it("falls back to CSS motes when WebGL is unavailable", () => {
    // jsdom has no WebGL, which is exactly the fallback path: no canvas should
    // be left stranded on the page, and the motes take over.
    const { container } = render(<LegacyPage />);

    expect(container.querySelectorAll(".mote").length).toBeGreaterThan(0);
    expect(container.querySelector("canvas")).toBeNull();
  });

  it("renders the fallback deterministically", () => {
    const first = render(<LegacyPage />).container.querySelectorAll(".mote").length;
    const second = render(<LegacyPage />).container.querySelectorAll(".mote").length;

    expect(second).toBe(first);
  });
});

describe("page structure", () => {
  it("has exactly one h1, and it names him", () => {
    render(<LegacyPage />);

    const headings = screen.getAllByRole("heading", { level: 1 });
    expect(headings).toHaveLength(1);
    expect(headings[0]).toHaveTextContent(profile.name);
  });

  it("offers a skip link that targets the main landmark", () => {
    render(<LegacyPage />);

    expect(screen.getByRole("link", { name: /skip to content/i })).toHaveAttribute(
      "href",
      "#main",
    );
    expect(document.querySelector("main")).toHaveAttribute("id", "main");
  });
});
