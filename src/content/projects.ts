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
 * Occasional contributions — NOT his projects. These are AISquare-Studio's
 * repos; his own copies are forks. Presented modestly on purpose: anyone can
 * check the commit history in thirty seconds, and overclaiming here would cost
 * more credibility than the mention is worth.
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
];
