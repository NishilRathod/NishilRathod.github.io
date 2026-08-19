export type JourneyEntry = {
  year: string;
  title: string;
  /** Prose, not resume bullets. One or two sentences. */
  body: string;
  /** Optional link for the place or thing named. */
  href?: string;
};

/** Oldest first — the section reads as a narrative, top to bottom. */
export const journey: JourneyEntry[] = [
  {
    year: "2020",
    title: "Started at VES Polytechnic",
    body: "Took the diploma route into computer engineering in Mumbai rather than waiting for a degree to begin. Three years of fundamentals, finishing at 84.9%.",
  },
  {
    year: "2023",
    title: "Into the degree at A.P. Shah Institute of Technology",
    body: "Moved to Thane for the B.E. in Computer Engineering, carrying the diploma work forward instead of restarting from zero.",
  },
  {
    year: "2023",
    title: "Founding member, Coder's Club @APSIT",
    body: "Helped start the college's coding club and ran it as Content Head — teaching data structures, coaching people through their first few hundred LeetCode problems, and running department competitions. Somewhere along the way, cleared 700+ problems personally.",
  },
  {
    year: "2024",
    title: "Software Developer Intern at Logout.world",
    body: "Remote, July to November. Built a Django and Selenium scraper that pulled travel itineraries and images at volume, and shipped responsive front-end forms alongside it. First real exposure to working a shared codebase with other engineers.",
    href: "https://logout.world/",
  },
  {
    year: "2026",
    title: "Building in the open",
    body: "AvaxGods in the spring, WeatherBoard through the summer — one pushing into smart contracts, the other into caching, rate limiting, and statistics. Both built to be read, not just to run.",
  },
  {
    year: "2026",
    title: "Graduated",
    body: "B.E. in Computer Engineering, finished at 8.33. Six years from the first day of the diploma to here, and the interesting part starts now.",
  },
];
