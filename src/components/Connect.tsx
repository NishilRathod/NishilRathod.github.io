import { profile } from "../content/profile";
import { SOCIAL_ICONS } from "./Icons";
import { ObfuscatedEmail } from "./ObfuscatedEmail";
import { Reveal } from "./Reveal";
import { Section } from "./Section";

export function Connect() {
  return (
    <Section index="04" title="Connect" id="connect">
      <Reveal>
        <p className="max-w-2xl text-lg leading-relaxed">
          Open to interesting problems and good conversation. The inbox is the surest way to
          reach me.
        </p>

        <ObfuscatedEmail className="mt-8 inline-block font-mono text-xl text-accent underline-offset-4 hover:underline sm:text-2xl" />

        <ul className="mt-10 flex flex-wrap gap-4">
          {profile.socials.map((social) => {
            const Icon = SOCIAL_ICONS[social.label as keyof typeof SOCIAL_ICONS];

            return (
              <li key={social.label}>
                <a
                  href={social.href}
                  target="_blank"
                  rel="noreferrer noopener"
                  // The icon is decorative, so the accessible name comes from
                  // aria-label — a bare icon link is unusable without one.
                  aria-label={`${social.label} (opens in a new tab)`}
                  title={social.label}
                  className="flex size-11 items-center justify-center rounded-lg border border-hairline text-muted transition-colors hover:border-accent/50 hover:bg-accent-tint hover:text-accent"
                >
                  {Icon ? <Icon className="size-5" /> : social.label}
                </a>
              </li>
            );
          })}
        </ul>
      </Reveal>
    </Section>
  );
}
