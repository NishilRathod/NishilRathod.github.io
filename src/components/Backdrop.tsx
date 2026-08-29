import { useEffect, useRef, useState } from "react";

import { startScene } from "../webgl/scene";

/** The accent, #6b8cff, as linear 0–1 components for the shader. */
const ACCENT_RGB: [number, number, number] = [0x6b / 255, 0x8c / 255, 0xff / 255];

/**
 * CSS fallback for machines with no WebGL — a handful of motes drifting upward.
 * Fixed values rather than random ones so every render is identical.
 */
const MOTES = [
  { left: "6%", size: 3, duration: 34, delay: 0, opacity: 0.45 },
  { left: "17%", size: 2, duration: 46, delay: 7, opacity: 0.3 },
  { left: "29%", size: 4, duration: 28, delay: 3, opacity: 0.4 },
  { left: "41%", size: 2, duration: 52, delay: 12, opacity: 0.28 },
  { left: "54%", size: 3, duration: 38, delay: 5, opacity: 0.42 },
  { left: "63%", size: 2, duration: 44, delay: 16, opacity: 0.3 },
  { left: "72%", size: 4, duration: 31, delay: 9, opacity: 0.38 },
  { left: "84%", size: 2, duration: 49, delay: 2, opacity: 0.32 },
  { left: "93%", size: 3, duration: 36, delay: 14, opacity: 0.4 },
];

/**
 * Ambient depth behind the page: two soft accent blooms, with a WebGL scene
 * drawn over them — a rotating particle field that responds to scroll and
 * cursor, plus a wireframe icosahedron beside the hero that dissolves as the
 * hero scrolls away.
 *
 * Entirely decorative — aria-hidden and non-interactive, so it never reaches
 * the accessibility tree or swallows a click.
 */
export function Backdrop() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [useFallback, setUseFallback] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const teardown = startScene(canvas, ACCENT_RGB);
    if (!teardown) {
      // No WebGL — an old browser, a blocked context, or a headless test.
      setUseFallback(true);
      return;
    }

    return teardown;
  }, []);

  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div
        className="absolute inset-0 opacity-[0.13]"
        style={{
          background:
            "radial-gradient(42% 36% at 16% 20%, var(--color-accent), transparent 70%), " +
            "radial-gradient(46% 40% at 84% 76%, var(--color-accent), transparent 72%)",
        }}
      />

      {useFallback ? null : <canvas ref={canvasRef} className="absolute inset-0 size-full" />}

      {useFallback
        ? MOTES.map((mote) => (
            <span
              key={mote.left}
              className="mote absolute top-full rounded-full bg-accent"
              style={
                {
                  left: mote.left,
                  width: `${mote.size}px`,
                  height: `${mote.size}px`,
                  "--mote-opacity": mote.opacity,
                  "--mote-duration": `${mote.duration}s`,
                  "--mote-delay": `${mote.delay}s`,
                } as React.CSSProperties
              }
            />
          ))
        : null}
    </div>
  );
}
