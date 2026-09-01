import { render, screen, waitFor } from "@testing-library/react";
import { act } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { LegacyPage } from "../components/LegacyPage";

type Callback = (entries: { isIntersecting: boolean }[]) => void;

const callbacks: Callback[] = [];

class MockIntersectionObserver {
  constructor(callback: Callback) {
    callbacks.push(callback);
  }
  observe() {}
  disconnect() {}
  unobserve() {}
}

/**
 * Content Motion is currently holding at zero opacity.
 *
 * Checked through the style object rather than a `[style*="opacity: 0"]`
 * selector, because that substring also matches the backdrop motes'
 * `--mote-opacity: 0.45` custom property and would report false positives.
 *
 * Decoration is excluded: the timeline's node rings animate *to* zero opacity
 * by design, so counting them would both fail the guarantee spuriously and make
 * the result depend on when the assertion happened to sample. What matters is
 * that nothing a reader needs is stuck invisible.
 */
const hiddenIn = (root: HTMLElement) =>
  [...root.querySelectorAll<HTMLElement>("[style]")].filter(
    (el) => el.style.opacity === "0" && !el.closest('[aria-hidden="true"]'),
  );

/** The scroll-revealed content. The hero is excluded deliberately — it plays a
 *  fixed-duration entrance on mount and never consults an observer. */
const mainOf = (container: HTMLElement) => container.querySelector<HTMLElement>("#main")!;

describe("scroll reveal", () => {
  beforeEach(() => {
    callbacks.length = 0;
    vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("starts hidden, then reveals once the observer reports intersection", async () => {
    const { container } = render(<LegacyPage />);

    // Before intersecting, revealed content is transparent.
    expect(hiddenIn(mainOf(container)).length).toBeGreaterThan(0);

    act(() => {
      for (const callback of callbacks) callback([{ isIntersecting: true }]);
    });

    // A class swap would land synchronously; a tween takes real time. The
    // slowest here is the 0.6s reveal plus a 0.24s stagger, so wait for it to
    // finish rather than sampling it mid-flight.
    await waitFor(() => expect(hiddenIn(mainOf(container))).toHaveLength(0), { timeout: 4000 });
  });

  it("renders visible from the start when motion is reduced", () => {
    vi.stubGlobal("matchMedia", (query: string) => ({
      matches: query.includes("prefers-reduced-motion"),
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    }));

    const { container } = render(<LegacyPage />);

    // Nothing may depend on an observer firing, and nothing may fade in either:
    // a reduced-motion visitor must see the whole page immediately, hero
    // included.
    expect(hiddenIn(container)).toHaveLength(0);
    expect(screen.getByRole("heading", { name: "Journey", level: 2 })).toBeVisible();
  });

  it("stays visible when IntersectionObserver is missing entirely", () => {
    vi.stubGlobal("IntersectionObserver", undefined);

    const { container } = render(<LegacyPage />);

    // Failing closed here would leave the page permanently blank.
    expect(hiddenIn(mainOf(container))).toHaveLength(0);
  });
});
