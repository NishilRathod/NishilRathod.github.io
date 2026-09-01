import "@testing-library/jest-dom/vitest";

// jsdom has no canvas implementation and throws a noisy "Not implemented"
// through its virtual console. Returning null instead is both quieter and a
// truthful simulation of a browser without WebGL, which is the path these
// tests exercise.
HTMLCanvasElement.prototype.getContext = () => null;

// jsdom answers every media query with `false` and, depending on the version,
// may not answer at all. `App` subscribes to one to decide whether the carriage
// will fit on screen and `prefersReducedMotion` asks for another, so this has to
// exist and has to support `addEventListener`.
//
// False across the board is the honest default for a 1024x768 headless window
// with no OS preferences: narrow, motion allowed. Tests that care about either
// stub over it with `vi.stubGlobal` and are restored to this afterwards.
if (typeof window.matchMedia !== "function") {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList;
}
