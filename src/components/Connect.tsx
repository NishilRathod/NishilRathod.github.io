import { profile } from "../content/profile";
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

        <ul className="mt-10 flex flex-wrap gap-x-8 gap-y-3">
          {profile.socials.map((social) => (
            <li key={social.label}>
              <a
                href={social.href}
                target="_blank"
                rel="noreferrer noopener"
                className="font-mono text-sm text-muted transition-colors hover:text-accent"
              >
                {social.label} ↗
              </a>
            </li>
          ))}
        </ul>
      </Reveal>
    </Section>
  );
}
