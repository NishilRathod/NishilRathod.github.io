import { profile } from "../content/profile";

export function Hero() {
  return (
    <header className="flex min-h-[90svh] flex-col justify-start pt-[18vh] pb-20 sm:pt-[20vh]">
      <p className="mb-6 font-mono text-xs tracking-[0.2em] text-accent uppercase">
        Portfolio
      </p>

      <h1 className="font-display text-5xl leading-[1.05] font-medium sm:text-7xl">
        {profile.name}
      </h1>

      <p className="mt-8 max-w-2xl text-lg leading-relaxed text-balance sm:text-xl">
        {profile.tagline}
      </p>

      <p className="mt-4 max-w-2xl font-mono text-sm text-muted">{profile.status}</p>

      <a
        href="#work"
        className="mt-auto inline-flex w-fit items-center gap-2 pt-16 font-mono text-sm text-muted transition-colors hover:text-accent"
      >
        scroll
        <span aria-hidden="true" className="motion-safe:animate-bounce">
          ↓
        </span>
      </a>
    </header>
  );
}
