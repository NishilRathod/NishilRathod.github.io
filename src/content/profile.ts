export type SocialLink = {
  label: string;
  href: string;
};

export type Profile = {
  name: string;
  /** One line, above the fold. Says what he does, not what he is. */
  tagline: string;
  /** Short factual line under the tagline. Avoid unverifiable claims. */
  status: string;
  /** Split so the address never appears as a contiguous string in the bundle. */
  emailUser: string;
  emailDomain: string;
  socials: SocialLink[];
};

export const profile: Profile = {
  name: "Nishil Rathod",

  // DRAFT — rewrite in Nishil's own voice before publishing.
  tagline:
    "I build backend systems and the tools around them — caching layers, APIs, scrapers, and the occasional smart contract.",

  // Deliberately does not claim "graduated" or "final year": the B.E. runs
  // 2023–2026 and which side of it he is on has not been confirmed.
  status: "Computer Engineering, A.P. Shah Institute of Technology · Mumbai, India",

  emailUser: "nishilrathod2512",
  emailDomain: "gmail.com",

  socials: [
    { label: "GitHub", href: "https://github.com/NishilRathod" },
    { label: "LinkedIn", href: "https://www.linkedin.com/in/nishil-rathod-04a8b627a/" },
    { label: "LeetCode", href: "https://leetcode.com/u/NishilRathod/" },
  ],
};
