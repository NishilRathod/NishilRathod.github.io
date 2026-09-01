import { MagneticLink } from "../../components/MagneticLink";
import { ObfuscatedEmail } from "../../components/ObfuscatedEmail";
import { SOCIAL_ICONS } from "../../components/Icons";
import { profile } from "../../content/profile";
import { Body, Eyebrow, Rule } from "./Plate";

/**
 * End of the line. Reuses `ObfuscatedEmail`, which assembles the address from
 * two halves at render time — `src/test/privacy.test.ts` asserts no contiguous
 * address reaches the built bundle, and writing the mailto by hand here would
 * quietly defeat that.
 */
export function ContactPoster() {
  return (
    <div className="flex flex-col gap-[0.9em]">
      <Eyebrow>End of the line</Eyebrow>

      <h2 className="text-[1.35em] leading-[1.1] font-bold uppercase tracking-[0.08em] text-enamel">
        Get in touch
      </h2>

      <Rule />

      <Body>Open to graduate and backend roles. Mail gets read; the rest is public.</Body>

      <ObfuscatedEmail className="link-wipe font-mono text-[0.68em] tracking-[0.06em] text-lamp transition-colors hover:text-amber" />

      <ul className="flex gap-[0.7em] pt-[0.3em]">
        {profile.socials.map((social) => {
          const Icon = SOCIAL_ICONS[social.label as keyof typeof SOCIAL_ICONS];
          if (!Icon) return null;

          return (
            <li key={social.label}>
              <MagneticLink
                href={social.href}
                // Icon-only, so the name has to come from here — without it a
                // screen reader announces nothing but "link".
                aria-label={`${social.label} (opens in a new tab)`}
                title={social.label}
                className="flex size-[2.2em] items-center justify-center rounded-[2px] border border-enamel/15 bg-enamel/5 text-enamel/60 transition-colors hover:border-lamp/40 hover:text-lamp"
              >
                <Icon className="size-[1em]" />
              </MagneticLink>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
