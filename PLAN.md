# Personal Portfolio Site — Nishil Rathod

## Context

Nishil wants a personal portfolio website as a **calling card**: one memorable URL that represents him, low-maintenance, no CMS. The visual reference is `harshtomar.com` — a dark, minimal, text-first single page with numbered sections — but this is an inspiration, not a clone target.

Content comes from `C:\Users\NISHIL\Downloads\Nishil_Resume_6.pdf` and his public GitHub (`NishilRathod`).

Decisions already made with the user:

| Decision | Choice |
|---|---|
| Purpose | Personal identity / calling card |
| Sections | Work, Journey timeline, Skills/toolbelt, Connect (no blog — he has no posts, and an empty writing section reads worse than none) |
| Contact | Email (scrape-resistant) + GitHub / LinkedIn / LeetCode. **No phone number.** |
| Hosting | GitHub Pages, repo `NishilRathod.github.io` |
| Stack | Vite + React 19 + TypeScript + Tailwind 4 (mirrors his existing `WeatherBoard/frontend`) |
| Colors | Lifted from the reference site's stylesheet |
| AISquare-Studio | He made **occasional/small contributions** — presented as a modest "contributions" line, never as owned projects |

## Design Tokens

Extracted from `harshtomar.com/_next/static/chunks/0hly~2vgrypak.css`. All foreground/background pairs clear WCAG AA on the dark background.

```
--bg          #05070c   near-black, blue-tinted
--surface     #ffffff05 barely-there card fill
--text        #eef2fb   cool off-white
--muted       #9fb0c8   blue-grey secondary
--accent      #6b8cff   periwinkle — links, section numerals
--accent-tint #6b8cff0f pill / card background
--live        #57d98a   green status dot
--alert       #ff3b30   rare emphasis
--hairline    #ffffff1a borders, dividers
```

Type: **Geist Sans** (body/UI), **Geist Mono** (section numerals, tags, metadata), **Fraunces** (display — hero name and section titles only). All OFL-licensed. Self-host via `@fontsource` packages rather than Google Fonts CDN — no third-party requests, no layout shift, works offline.

## Page Structure

Single scrolling page. Sections numbered in mono like the reference, but the section *names* are Nishil's own — not a copy of Building/Signals/Journey/Connect.

**Hero** — `Nishil Rathod` in Fraunces, a one-line positioning statement, a short status line (education + location), and a `scroll ↓` cue.

**`01 — Work`** — project cards, ordered strongest first:

| Project | Framing | Stack tags |
|---|---|---|
| WeatherBoard | Flagship. Lead on the Redis cache-aside layer, token-bucket rate limiter, and the std-dev/median-MAD anomaly engine — the parts that show real engineering judgment | FastAPI, React/TS, Redis, Docker |
| AvaxGods | Range beyond backend — ERC-1155 contracts, OpenZeppelin, move verification, Ethers.js/Web3Modal | Solidity, React, Hardhat |
| Blog Website | Earlier Django work; keep the card compact so it doesn't dilute the two above | Python, Django, SQLite |

Optional fourth card from `Scraper` or `JobSearch-native` only if the grid looks thin at desktop width. Below the cards, a single quiet line: *"Also contribute occasionally to open source — [aisquare-cli](…), [pipe](…)."*

Each card: title, one-line summary, 2–3 substance bullets, mono stack tags, status pill, and repo / live links.

**`02 — Journey`** — vertical timeline with a hairline rail and accent nodes: 2020 VES Polytechnic → 2023 Diploma (84.9%) → 2023 APSIT B.E. → 2024 Logout.world intern → Coder's Club founding member, 700+ LeetCode → 2026 graduating. Prose beats, not resume bullets.

**`03 — Toolbelt`** — three grouped mono columns (Languages / Frameworks / Tools) from the resume. Plain text, no skill-percentage bars — they're meaningless and read as filler.

**`04 — Connect`** — email plus GitHub, LinkedIn, LeetCode.

Footer: a short built-from-scratch line and the year.

## Session Continuity

Work spans multiple sessions, so progress lives **in the project folder**, not in conversation context. Mirrors the `RESUME.md` convention already used in `N:\Projects\pipe`.

Two files created in the project root before any code:

- **`PLAN.md`** — this document, copied in verbatim. The spec. Changes only when a decision changes.
- **`RESUME.md`** — mutable progress log. Updated at the end of every working session and after each completed step of the Implementation Order.

`RESUME.md` holds: which numbered step is done / in progress / not started, the exact next action to take, any content gaps still unanswered (see below), and anything that broke or surprised us. A new session reads `PLAN.md` then `RESUME.md` and resumes without re-asking questions already settled.

Answers to the four content gaps get written into `RESUME.md` as they arrive, so they survive too.

## Files

Build in a new directory `N:\Projects\nishilrathod.github.io`.

```
index.html                      meta, OG tags, favicon, theme-color
vite.config.ts                  base: '/'  (user site — root path)
package.json / tsconfig*.json   mirror WeatherBoard/frontend's setup
src/
  main.tsx
  App.tsx                       composes the sections in order
  index.css                     Tailwind 4 @import + @theme with the tokens above
  content/
    profile.ts                  name, tagline, status line, social links
    projects.ts                 Project[] — the single place to add work
    journey.ts                  JourneyEntry[]
    skills.ts                   SkillGroup[]
  components/
    Hero.tsx
    Section.tsx                 numbered-section shell (numeral + title + children)
    ProjectCard.tsx
    Timeline.tsx
    Toolbelt.tsx
    Connect.tsx
    ObfuscatedEmail.tsx
  hooks/
    useReveal.ts                IntersectionObserver fade/rise on scroll
.github/workflows/deploy.yml    build + actions/deploy-pages on push to main
```

**All copy lives in `src/content/*.ts` behind exported TypeScript types.** Adding a project later is a one-file edit with no JSX involved — this is what makes the site low-maintenance, which was the stated goal.

Reuse `WeatherBoard/frontend/package.json` as the dependency baseline (React 19, Vite 8, Tailwind 4 via `@tailwindcss/vite`, Vitest 4, Testing Library) — same versions, so the toolchain is already proven on this machine. Drop what isn't needed here: `react-router-dom` (single page) and `@tanstack/react-query` (no data fetching).

## Implementation Order

0. Create `N:\Projects\nishilrathod.github.io`, `git init`, and write `PLAN.md` + `RESUME.md`.
1. Scaffold Vite + React + TS; wire Tailwind 4 and the `@theme` tokens; self-host fonts via `@fontsource`.
2. Content modules with types, populated from the resume and GitHub.
3. `Section` shell + `Hero`, then Work, Journey, Toolbelt, Connect.
4. `useReveal` scroll animation, gated behind `prefers-reduced-motion`.
5. Accessibility + SEO pass.
6. GitHub Actions workflow for Pages.

## Accessibility and Correctness Requirements

- Honour `prefers-reduced-motion: reduce` — reveal animations become instant, no transform.
- Semantic landmarks (`header`/`main`/`section`/`footer`), one `h1`, ordered headings; visible focus rings in `--accent`; skip-to-content link.
- Every section reachable and readable with JS animation disabled — content is in the DOM, animation only adjusts opacity/transform.
- Email assembled in JS from parts at click/render time so plain-text scrapers miss it. **Never render the phone number.**
- Responsive from 320px up; project cards single-column on mobile.
- `<title>`, meta description, OG/Twitter tags, and an OG image so shared links don't look broken.

## Content Gaps — confirm before or during the build

These are unknown and must not be invented:

1. **Hero tagline** — I'll draft one from the resume for Nishil to correct.
2. **Live URLs** — the resume says "Link" for all three projects but the targets are unknown. If a project isn't deployed, the card shows a repo link only and no "live" pill.
3. **Graduation status** — B.E. is listed 2023–2026 and today is Aug 2026. Needs confirming as *graduated* vs *final year* before the status line goes public.
4. **Public email** — resume shows `nishilrathod2512@gmail.com`; git commits use `nishilrathod7105@gmail.com`. Confirm which is the public one.

## Verification

- `npm run dev` — walk all four sections at 320px, 768px, and 1440px widths.
- `npm run build && npm run preview` — confirm the production bundle renders identically and the build emits to `dist/`.
- `npx vitest run` — component tests: every `projects.ts` entry renders a card; timeline renders all entries in order; `ObfuscatedEmail` produces a correct `mailto:`; the phone number appears nowhere in the built output (assert against `dist/`).
- Toggle OS "reduce motion" and reload — content must appear immediately, fully legible.
- Keyboard-only pass: tab through the whole page, confirm every link is reachable with a visible focus ring.
- Lighthouse in Chrome on the preview build — target ≥95 on Performance, Accessibility, and SEO.
- Deploy: push to `NishilRathod.github.io`, confirm the Action succeeds and the live URL serves correctly (fonts loaded, no console errors).

**Nothing is pushed to GitHub without Nishil's explicit go-ahead** — creating the repo makes his name, education, and links publicly indexable, so that's his call to make, not an implementation detail.
