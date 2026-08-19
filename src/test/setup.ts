import "@testing-library/jest-dom/vitest";

// jsdom has no canvas implementation and throws a noisy "Not implemented"
// through its virtual console. Returning null instead is both quieter and a
// truthful simulation of a browser without WebGL, which is the path these
// tests exercise.
HTMLCanvasElement.prototype.getContext = () => null;
