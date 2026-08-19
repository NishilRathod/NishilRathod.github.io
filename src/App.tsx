import { Connect } from "./components/Connect";
import { Hero } from "./components/Hero";
import { Timeline } from "./components/Timeline";
import { Toolbelt } from "./components/Toolbelt";
import { Work } from "./components/Work";
import { profile } from "./content/profile";

export default function App() {
  return (
    <div className="mx-auto w-full max-w-3xl px-6 sm:px-8">
      <a
        href="#main"
        className="sr-only rounded bg-accent px-4 py-2 font-mono text-sm font-medium text-bg focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50"
      >
        Skip to content
      </a>

      <Hero />

      <main id="main">
        <Work />
        <Timeline />
        <Toolbelt />
        <Connect />
      </main>

      <footer className="border-t border-hairline py-10 font-mono text-xs text-muted">
        <p>
          Built from scratch by {profile.name} · {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  );
}
