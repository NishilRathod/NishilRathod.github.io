import type { ElementType, ReactNode } from "react";

import { useReveal } from "../hooks/useReveal";

type RevealProps = {
  children: ReactNode;
  as?: ElementType;
  className?: string;
  /** Stagger, in milliseconds, for items revealed as a group. */
  delay?: number;
};

export function Reveal({ children, as: Tag = "div", className = "", delay = 0 }: RevealProps) {
  const { ref, revealed } = useReveal<HTMLElement>();

  return (
    <Tag
      ref={ref}
      style={revealed && delay ? { transitionDelay: `${delay}ms` } : undefined}
      className={`transition-[opacity,transform] duration-700 ease-out motion-reduce:transition-none ${
        revealed ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
      } ${className}`}
    >
      {children}
    </Tag>
  );
}
