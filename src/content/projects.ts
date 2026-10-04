export type ProjectStatus = "building" | "shipped";

export type Project = {
  name: string;
  /** One sentence. What it is, not how proud he is of it. */
  summary: string;
  /** Two or three concrete details — the parts that show engineering judgment. */
  highlights: string[];
  stack: string[];
  status: ProjectStatus;
  period: string;
  repoUrl: string;
  /** Only set when something is actually deployed and reachable. */
  liveUrl?: string;
};

/**
 * The single place to add or edit work. Order is deliberate: strongest first.
 *
 * None of these carry a `liveUrl` — every "Link" on the resume points at a
 * GitHub repo, not a deployment. Add one only when a real URL exists.
 */
export const projects: Project[] = [
  {
    name: "gitscout",
    summary:
      "A GitHub radar that finds projects worth contributing to, ranked against what you have actually written — and refuses to overstate what it knows.",
    highlights: [
      "GitHub no longer exposes star history, so it keeps its own JSON Lines snapshots — and calls a first run's figures an average rather than a measured rate.",
      "Popularity and contributability are scored apart: one repo showed 195k stars against 23 contributors and one merged PR, and blending them would rank it top.",
      "Zero dependencies, standard library only, and budget-aware — a contributor count costs one request via the Link rel=\"last\" header instead of paginating.",
    ],
    stack: ["Go", "GitHub REST API", "GitHub Actions"],
    status: "shipped",
    period: "2026",
    repoUrl: "https://github.com/NishilRathod/gitscout",
  },
  {
    name: "WeatherBoard",
    summary:
      "A full-stack weather dashboard built around a cache that does the hard thinking, so the upstream API doesn't have to.",
    highlights: [
      "Redis cache-aside layer paired with an async token-bucket rate limiter and retry logic, so upstream failures degrade gracefully instead of cascading.",
      "Statistical anomaly engine ranking cities by standard-deviation and median-MAD departure from historical seasonal norms — computed offline to avoid extra API load.",
      "FastAPI backend with single-city, paginated multi-city, and autocomplete endpoints; the whole stack containerized with Docker Compose.",
    ],
    stack: ["FastAPI", "React", "TypeScript", "Redis", "Docker"],
    status: "building",
    period: "2026",
    repoUrl: "https://github.com/NishilRathod/WeatherBoard",
  },
  {
    name: "AvaxGods",
    summary:
      "A decentralized card battle game where the rules of fair play are enforced on-chain rather than trusted to a server.",
    highlights: [
      "ERC-1155 contracts for efficient multi-token management, built on OpenZeppelin, with a move-verification system that makes cheating uneconomical.",
      "Custom Web3 integration over Ethers.js and Web3Modal, handling wallet connectivity and real-time contract event listening across the app.",
      "On-chain random generation for card attributes, so nobody — including the developer — can predict a draw.",
    ],
    stack: ["Solidity", "React", "Hardhat", "Ethers.js", "Vite"],
    status: "shipped",
    period: "2026",
    repoUrl: "https://github.com/NishilRathod/AvaxGods",
  },
  {
    name: "Blog Website",
    summary:
      "A multi-user Django blog with profiles and authentication — the project where the fundamentals got learned properly.",
    highlights: [
      "Session-based auth backed by SQLite, with user profiles that can be created, updated, and viewed by others.",
      "Post authoring and a shared feed visible across all users.",
    ],
    stack: ["Python", "Django", "SQLite"],
    status: "shipped",
    period: "2024",
    repoUrl: "https://github.com/NishilRathod/Blog-website---Django",
  },
];

export type Contribution = {
  name: string;
  href: string;
  note: string;
};

/**
 * Occasional contributions — NOT his projects. aisquare-cli and pipe are
 * AISquare-Studio's repos, openrig is mvschwarz's and corsair is corsairdev's;
 * his own copies are forks.
 * Presented modestly on purpose: anyone can check the commit history in thirty
 * seconds, and overclaiming here would cost more credibility than the mention
 * is worth.
 */
export const contributions: Contribution[] = [
  {
    name: "aisquare-cli",
    href: "https://github.com/AISquare-Studio/aisquare-cli",
    note: "persistent memory for coding agents",
  },
  {
    name: "pipe",
    href: "https://github.com/AISquare-Studio/pipe",
    note: "universal connector framework",
  },
  {
    name: "openrig",
    href: "https://github.com/mvschwarz/openrig",
    note: "coordination layer for coding agents",
  },
  {
    name: "corsair",
    href: "https://github.com/corsairdev/corsair",
    note: "integration layer for AI agents",
  },
];

export type PullRequest = {
  /** Who owns the repo, as GitHub names them, e.g. "AISquare-Studio". */
  owner: string;
  repo: string;
  number: number;
  title: string;
  href: string;
  /** Month it landed, e.g. "Sep 2026". */
  merged: string;
};

/**
 * Merged pull requests to AISquare-Studio's repos — the record behind the
 * AISquare contributions above. Merged only: an open PR is a proposal, and
 * listing it here would claim work the maintainers have not accepted. Add one
 * when it lands. Newest first.
 */
export const pullRequests: PullRequest[] = [
  {
    owner: "AISquare-Studio",
    repo: "aisquare-cli",
    number: 79,
    title: "Make the test suite hermetic against ambient routing variables",
    href: "https://github.com/AISquare-Studio/aisquare-cli/pull/79",
    merged: "Sep 2026",
  },
  {
    owner: "AISquare-Studio",
    repo: "aisquare-cli",
    number: 65,
    title: "Green Windows CI — port the suite off POSIX-only assumptions, and two bugs it uncovered",
    href: "https://github.com/AISquare-Studio/aisquare-cli/pull/65",
    merged: "Sep 2026",
  },
  {
    owner: "AISquare-Studio",
    repo: "aisquare-cli",
    number: 48,
    title: "Run on Windows — five defects, POSIX behaviour unchanged",
    href: "https://github.com/AISquare-Studio/aisquare-cli/pull/48",
    merged: "Aug 2026",
  },
];

/** What those pull requests actually involved. Drawn only from merged work. */
export const openSourceNotes: string[] = [
  "Brought up a Windows CI lane on a suite that had only ever run on Linux, fixing 35 platform-divergence failures across 65 files (PATHEXT resolution, NTFS DACLs vs POSIX mode bits, path separators, clock granularity).",
  "Replaced NTFS file-permission handling that was silently a no-op — chmod(0600) does nothing on Windows, leaving API keys and bearer tokens world-readable — with a single atomic icacls call that verifies the resulting ACL rather than trusting the exit code.",
  "Eliminated a class of false-green tests: guards that passed because their premise had quietly stopped holding on the new platform. Each fix shipped with a mutation check proving the test still fails when the behaviour regresses.",
];

/**
 * Merged pull requests to other people's repos, outside AISquare — their
 * projects, my fixes. Same rule as above: merged only, newest first.
 */
export const moreOpenSourcePullRequests: PullRequest[] = [
  {
    owner: "corsairdev",
    repo: "corsair",
    number: 1825,
    title: "Remove the Zendesk plugin's generator example webhook",
    href: "https://github.com/corsairdev/corsair/pull/1825",
    merged: "Oct 2026",
  },
  {
    owner: "mvschwarz",
    repo: "openrig",
    number: 515,
    title: "Keep literal = session names exact in tmux discovery",
    href: "https://github.com/mvschwarz/openrig/pull/515",
    merged: "Oct 2026",
  },
];

/** What those pull requests actually involved. Drawn only from merged work. */
export const moreOpenSourceNotes: string[] = [
  "OpenRig — tmux treats a leading = as its exact-match marker, so discovery misfiled a session named \"=lit\" or threw. The scanner now passes exact targets (\"==lit\").",
  "OpenRig — the test double resolves targets the way tmux does, so the new cases fail on the old code; checked before and after on real tmux 3.6.",
  "Corsair — removed the Zendesk plugin's generator stub webhook, which only matched a \"type: example\" payload Zendesk never sends; kept its signature verification and tests.",
  "Corsair — lint, typecheck and all 354 build tasks passed; the test failures were all in untouched plugins, mostly needing credentials or Postgres, and the PR listed them.",
];
