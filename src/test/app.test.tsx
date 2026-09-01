import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { act } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import App from "../App";
import { MIN_TRAIN_WIDTH } from "../lib/train";

/**
 * Which of the two views you get, and how you cross between them.
 *
 * The interesting behaviour is entirely in the media query: below
 * `MIN_TRAIN_WIDTH` the stage scales down far enough that poster text stops
 * being legible, so the carriage is not offered at all. jsdom has no layout, so
 * the query is stubbed with one that can actually be flipped mid-test — the
 * crossing is the case worth covering, and a static stub would never reach it.
 */

let wide = false;
const listeners = new Set<() => void>();

const frames: FrameRequestCallback[] = [];
const advance = () =>
  act(() => {
    for (const frame of frames.splice(0)) frame(16);
  });

/** Cross the threshold the way a window resize would. */
const setWide = (next: boolean) => {
  wide = next;
  act(() => {
    for (const listener of [...listeners]) listener();
  });
};

beforeEach(() => {
  wide = false;
  listeners.clear();
  frames.length = 0;

  vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) =>
    frames.push(callback),
  );
  vi.stubGlobal("cancelAnimationFrame", () => {});
  vi.stubGlobal("matchMedia", (query: string) => ({
    matches: query.includes("min-width") ? wide : false,
    media: query,
    addEventListener: (_: string, listener: () => void) => listeners.add(listener),
    removeEventListener: (_: string, listener: () => void) => listeners.delete(listener),
  }));
});

afterEach(() => {
  vi.unstubAllGlobals();
  window.history.replaceState(null, "", " ");
});

/** The train is up if its escape hatch is. */
const riding = () => screen.queryByRole("button", { name: /read as a page/i }) !== null;
const reading = () => screen.queryByText(/service manifest/i) !== null;

describe("choosing a view", () => {
  it(`sends a screen under ${MIN_TRAIN_WIDTH}px to the readable page`, () => {
    render(<App />);

    expect(reading()).toBe(true);
    expect(riding()).toBe(false);
    // And says why, rather than silently withholding the site's whole idea.
    expect(screen.getByText(/needs a wider screen/i)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /board the train/i })).toBeNull();
  });

  it("boards a wide screen straight away", () => {
    wide = true;
    render(<App />);
    advance();

    expect(riding()).toBe(true);
    expect(reading()).toBe(false);
  });

  it("follows the window across the threshold in both directions", () => {
    render(<App />);
    expect(reading()).toBe(true);

    setWide(true);
    advance();
    expect(riding()).toBe(true);

    setWide(false);
    expect(reading()).toBe(true);
    expect(riding()).toBe(false);
  });
});

describe("crossing between the views", () => {
  it("hands the reader the page, and takes them back to the train", async () => {
    const user = userEvent.setup();
    wide = true;
    render(<App />);
    advance();

    await user.click(screen.getByRole("button", { name: /read as a page/i }));
    expect(reading()).toBe(true);
    expect(document.body).not.toHaveClass("is-riding");

    await user.click(screen.getByRole("button", { name: /board the train/i }));
    advance();
    expect(riding()).toBe(true);
    expect(document.body).toHaveClass("is-riding");
  });

  it("puts them back in the car they left, not on the platform", async () => {
    // `Train` writes the car into the hash on arrival and reads it back on
    // mount, which is the whole of the mechanism — there is no state to keep.
    const user = userEvent.setup();
    wide = true;
    window.history.replaceState(null, "", "#tech-stack");
    render(<App />);
    advance();

    await user.click(screen.getByRole("button", { name: /read as a page/i }));
    await user.click(screen.getByRole("button", { name: /board the train/i }));
    advance();

    expect(screen.getByRole("button", { current: true })).toHaveAttribute(
      "aria-label",
      "Car 07, Tech stack",
    );
  });
});
