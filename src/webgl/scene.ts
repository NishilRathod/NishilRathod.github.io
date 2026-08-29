/**
 * Host for the WebGL backdrop.
 *
 * Owns the one context, the one animation frame loop, and the inputs every
 * layer reads from — time, scroll position, cursor, and how much of the hero is
 * still on screen. Layers are pure draw calls; none of them touches the DOM or
 * React, so the loop never triggers a render.
 *
 * Returns a teardown function, or null when WebGL is unavailable, so the caller
 * can fall back to something else.
 */

import type { Frame, Layer } from "./gl";
import { createHeroForm } from "./heroForm";
import { createParticleField } from "./particleField";

/** Retina is worth it; past 2x it is invisible and costs fill rate. */
const MAX_PIXEL_RATIO = 2;

/** How far the accent's hue rotates between the top and bottom of the page, in
 *  degrees. Small enough to be felt rather than seen. */
const HUE_DRIFT = 14;

/** Per-frame approach rate for the cursor. Low enough that the scene trails the
 *  pointer instead of snapping to it. */
const POINTER_EASE = 0.05;

type Hsl = { h: number; s: number; l: number };

function rgbToHsl([r, g, b]: [number, number, number]): Hsl {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  const delta = max - min;

  if (delta === 0) return { h: 0, s: 0, l };

  const s = delta / (1 - Math.abs(2 * l - 1));
  let h: number;
  if (max === r) h = ((g - b) / delta) % 6;
  else if (max === g) h = (b - r) / delta + 2;
  else h = (r - g) / delta + 4;

  return { h: (h * 60 + 360) % 360, s, l };
}

function hslToRgb({ h, s, l }: Hsl): [number, number, number] {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;

  const [r, g, b] =
    h < 60
      ? [c, x, 0]
      : h < 120
        ? [x, c, 0]
        : h < 180
          ? [0, c, x]
          : h < 240
            ? [0, x, c]
            : h < 300
              ? [x, 0, c]
              : [c, 0, x];

  return [r + m, g + m, b + m];
}

const clamp01 = (value: number) => (value < 0 ? 0 : value > 1 ? 1 : value);

export function startScene(canvas: HTMLCanvasElement, accent: [number, number, number]) {
  // getContext can throw rather than return null — jsdom does, and so do some
  // browsers when the context is blocked or the GPU is blacklisted.
  let gl: WebGLRenderingContext | null = null;
  try {
    gl = canvas.getContext("webgl", {
      alpha: true,
      antialias: true,
      depth: false,
      powerPreference: "low-power",
    }) as WebGLRenderingContext | null;
  } catch (error) {
    if (import.meta.env.DEV) console.warn(`[backdrop] getContext threw: ${String(error)}`);
    return null;
  }
  if (!gl) {
    if (import.meta.env.DEV) console.warn("[backdrop] no webgl context (getContext returned null)");
    return null;
  }

  const layers: Layer[] = [];
  for (const create of [createParticleField, createHeroForm]) {
    const layer = create(gl);
    // A layer that failed to build has already explained itself. Keep whatever
    // else compiled rather than losing the whole backdrop to one bad shader.
    if (layer) layers.push(layer);
  }
  if (layers.length === 0) return null;

  // Additive blending with no depth buffer: overlapping geometry should
  // accumulate light rather than occlude itself.
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE);
  gl.clearColor(0, 0, 0, 0);

  const reducedMotion =
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches === true;

  const accentHsl = rgbToHsl(accent);

  let pixelRatio = 1;
  let scroll = 0;
  let heroFade = 1;
  let pointerTargetX = 0;
  let pointerTargetY = 0;
  let pointerX = 0;
  let pointerY = 0;

  const readScroll = () => {
    const scrollable = document.documentElement.scrollHeight - window.innerHeight;
    scroll = scrollable > 0 ? clamp01(window.scrollY / scrollable) : 0;

    // Measured off the real header so the fade stays in step if the hero's
    // height changes; `min-h-[90svh]` is the fallback.
    const heroHeight =
      document.querySelector("header")?.getBoundingClientRect().height ||
      window.innerHeight * 0.9;
    heroFade = 1 - clamp01(window.scrollY / heroHeight);
  };

  const resize = () => {
    pixelRatio = Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO);
    const width = Math.max(1, Math.floor(canvas.clientWidth * pixelRatio));
    const height = Math.max(1, Math.floor(canvas.clientHeight * pixelRatio));

    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    gl.viewport(0, 0, canvas.width, canvas.height);
  };

  const draw = (seconds: number) => {
    // Scroll parallax is exactly the kind of motion a reduced-motion visitor
    // asked not to see, so the scene reads a scroll of zero for them. The hero
    // fade still applies — otherwise the hero's geometry would hang over the
    // rest of the page forever.
    const frame: Frame = {
      time: seconds,
      scroll: reducedMotion ? 0 : scroll,
      pointerX,
      pointerY,
      heroFade,
      color: hslToRgb({
        ...accentHsl,
        h: (accentHsl.h + (reducedMotion ? 0 : scroll) * HUE_DRIFT + 360) % 360,
      }),
      width: canvas.width,
      height: canvas.height,
      pixelRatio,
    };

    gl.clear(gl.COLOR_BUFFER_BIT);
    for (const layer of layers) layer.draw(frame);
  };

  let frame = 0;
  let origin = 0;
  let elapsed = 0;

  const loop = (now: number) => {
    if (!origin) origin = now;

    pointerX += (pointerTargetX - pointerX) * POINTER_EASE;
    pointerY += (pointerTargetY - pointerY) * POINTER_EASE;

    resize();
    draw(elapsed + (now - origin) / 1000);
    frame = requestAnimationFrame(loop);
  };

  const stopLoop = () => {
    if (!frame) return;
    cancelAnimationFrame(frame);
    frame = 0;
    // Bank the time so a resumed scene continues rather than snapping back.
    elapsed += origin ? (performance.now() - origin) / 1000 : 0;
    origin = 0;
  };

  const startLoop = () => {
    if (frame || reducedMotion) return;
    origin = 0;
    frame = requestAnimationFrame(loop);
  };

  /** One frozen frame, for the reduced-motion path. Coalesced through rAF so a
   *  burst of scroll events costs one redraw rather than dozens. */
  let stillPending = 0;
  const redrawStill = () => {
    if (stillPending) return;
    stillPending = requestAnimationFrame(() => {
      stillPending = 0;
      resize();
      draw(0);
    });
  };

  const onScroll = () => {
    readScroll();
    if (reducedMotion) redrawStill();
  };

  const onPointerMove = (event: PointerEvent) => {
    // Coarse pointers report a position on tap, which would yank the scene
    // sideways on every touch. Only a real cursor gets to steer.
    if (event.pointerType !== "mouse") return;
    pointerTargetX = (event.clientX / window.innerWidth) * 2 - 1;
    pointerTargetY = (event.clientY / window.innerHeight) * 2 - 1;
  };

  // A hidden tab should not burn battery redrawing a background nobody can see.
  const onVisibility = () => {
    if (document.hidden) stopLoop();
    else startLoop();
  };

  const onResize = () => {
    readScroll();
    if (reducedMotion) redrawStill();
  };

  const onContextLost = (event: Event) => {
    event.preventDefault();
    stopLoop();
  };

  canvas.addEventListener("webglcontextlost", onContextLost);
  document.addEventListener("visibilitychange", onVisibility);
  window.addEventListener("resize", onResize);
  window.addEventListener("scroll", onScroll, { passive: true });
  if (!reducedMotion) window.addEventListener("pointermove", onPointerMove, { passive: true });

  readScroll();

  if (reducedMotion) {
    // Still show the scene, just frozen — the depth reads fine without motion,
    // and motion is the part that causes trouble.
    resize();
    draw(0);
  } else {
    startLoop();
  }

  return () => {
    stopLoop();
    if (stillPending) cancelAnimationFrame(stillPending);
    canvas.removeEventListener("webglcontextlost", onContextLost);
    document.removeEventListener("visibilitychange", onVisibility);
    window.removeEventListener("resize", onResize);
    window.removeEventListener("scroll", onScroll);
    window.removeEventListener("pointermove", onPointerMove);

    for (const layer of layers) layer.dispose();

    // Deliberately NOT calling WEBGL_lose_context.loseContext() here. Losing
    // the context poisons the canvas permanently — a later getContext on the
    // same element hands back the same dead context, where every call fails
    // silently. StrictMode mounts, tears down, and remounts in development, so
    // that turned the whole scene invisible. Deleting the resources is enough;
    // the context goes when the canvas does.
  };
}
