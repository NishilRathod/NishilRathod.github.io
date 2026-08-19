/**
 * Ambient depth behind the whole page: two soft accent blooms, plus motes that
 * drift slowly upward. Purely decorative — `aria-hidden` and non-interactive,
 * so it never reaches the accessibility tree or swallows a click.
 *
 * Values are a fixed list rather than randomised so every render, test and
 * build produces the same layout.
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

export function Backdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <div
        // No blend mode: the wrapper's negative z-index makes it its own
        // stacking context, so `mix-blend-screen` would blend against nothing.
        className="absolute inset-0 opacity-[0.13]"
        style={{
          background:
            "radial-gradient(42% 36% at 16% 20%, var(--color-accent), transparent 70%), " +
            "radial-gradient(46% 40% at 84% 76%, var(--color-accent), transparent 72%)",
        }}
      />

      {MOTES.map((mote) => (
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
      ))}
    </div>
  );
}
