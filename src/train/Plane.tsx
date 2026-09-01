import type { CSSProperties, ReactNode } from "react";

/**
 * One flat surface in the carriage.
 *
 * Every plane is a fixed-size box centred on its parent's origin, then pushed
 * into place by a transform. Doing the centring here — rather than folding a
 * `translate(-50%, -50%)` into every call — leaves each transform readable as
 * pure placement: where the surface is and which way it faces, nothing else.
 *
 * Sizes are scene pixels. See `src/lib/train.ts` for why those are not screen
 * pixels and how the two relate.
 */
export function Plane({
  w,
  h,
  transform,
  className = "",
  style,
  children,
}: {
  w: number;
  h: number;
  transform: string;
  className?: string;
  style?: CSSProperties;
  children?: ReactNode;
}) {
  return (
    <div
      className={`plane ${className}`}
      style={{ width: w, height: h, marginLeft: -w / 2, marginTop: -h / 2, transform, ...style }}
    >
      {children}
    </div>
  );
}
