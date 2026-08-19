import { profile } from "../content/profile";

/**
 * Assembles the address at render time from two halves that are stored
 * separately. Naive scrapers grep built assets for `something@something.tld`;
 * splitting the literal means there is no such string to find, while humans
 * and screen readers get an ordinary mailto link.
 */
export function ObfuscatedEmail({ className = "" }: { className?: string }) {
  const address = `${profile.emailUser}${String.fromCharCode(64)}${profile.emailDomain}`;

  return (
    <a href={`mailto:${address}`} className={className}>
      {address}
    </a>
  );
}
