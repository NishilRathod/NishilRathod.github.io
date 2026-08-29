import { useMotionValue, useSpring } from "motion/react";
import * as m from "motion/react-m";
import { useState, type PointerEvent, type ReactNode } from "react";

import { hasFinePointer } from "../lib/motion";

/** Maximum pull, in pixels. Enough to feel alive, small enough that the target
 *  never runs away from the cursor trying to click it. */
const PULL = 3;

const SPRING = { stiffness: 260, damping: 18, mass: 0.4 };

type MagneticLinkProps = {
  href: string;
  className?: string;
  "aria-label": string;
  title?: string;
  children: ReactNode;
};

/**
 * An external link that leans toward the cursor.
 *
 * Skipped entirely on coarse pointers, where there is no cursor to lean
 * toward. Movement is capped well below the size of the hit area, so the
 * element can never drift out from under a click.
 */
export function MagneticLink({ href, className, title, children, ...rest }: MagneticLinkProps) {
  const [magnetic] = useState(hasFinePointer);

  const x = useSpring(useMotionValue(0), SPRING);
  const y = useSpring(useMotionValue(0), SPRING);

  const onPointerMove = (event: PointerEvent<HTMLAnchorElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    x.set(((event.clientX - bounds.left) / bounds.width - 0.5) * 2 * PULL);
    y.set(((event.clientY - bounds.top) / bounds.height - 0.5) * 2 * PULL);
  };

  const settle = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <m.a
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      title={title}
      className={className}
      style={magnetic ? { x, y } : undefined}
      onPointerMove={magnetic ? onPointerMove : undefined}
      onPointerLeave={magnetic ? settle : undefined}
      // Keyboard focus has no cursor position to follow, so it just settles.
      onBlur={magnetic ? settle : undefined}
      whileHover={magnetic ? { scale: 1.05 } : undefined}
      whileTap={magnetic ? { scale: 0.97 } : undefined}
      {...rest}
    >
      {children}
    </m.a>
  );
}
