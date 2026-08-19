import { render, screen } from "@testing-library/react";
import { act } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import App from "../App";

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

describe("scroll reveal", () => {
  beforeEach(() => {
    callbacks.length = 0;
    vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("starts hidden, then reveals once the observer reports intersection", () => {
    const { container } = render(<App />);

    // Before intersecting, revealed content is transparent.
    expect(container.querySelectorAll("[class*='opacity-0']").length).toBeGreaterThan(0);

    act(() => {
      for (const callback of callbacks) callback([{ isIntersecting: true }]);
    });

    expect(container.querySelectorAll("[class*='opacity-0']")).toHaveLength(0);
    expect(container.querySelectorAll("[class*='opacity-100']").length).toBeGreaterThan(0);
  });

  it("renders visible from the start when motion is reduced", () => {
    vi.stubGlobal("matchMedia", (query: string) => ({
      matches: query.includes("prefers-reduced-motion"),
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    }));

    const { container } = render(<App />);

    // Nothing may depend on an observer firing: a reduced-motion visitor must
    // see the whole page immediately.
    expect(container.querySelectorAll("[class*='opacity-0']")).toHaveLength(0);
    expect(screen.getByRole("heading", { name: "Journey", level: 2 })).toBeVisible();
  });

  it("stays visible when IntersectionObserver is missing entirely", () => {
    vi.stubGlobal("IntersectionObserver", undefined);

    const { container } = render(<App />);

    // Failing closed here would leave the page permanently blank.
    expect(container.querySelectorAll("[class*='opacity-0']")).toHaveLength(0);
  });
});
