import { profile } from "../../content/profile";
import { Body, Eyebrow, Rule } from "./Plate";

/**
 * The only h1 on the site. Lives on the boarding car, so the first wall you
 * read says who this is before it says anything else.
 */
export function TitlePoster() {
  return (
    <div className="flex flex-col gap-[0.9em]">
      <Eyebrow>This service</Eyebrow>

      <h1 className="text-[1.55em] leading-[1.05] font-bold uppercase tracking-[0.07em] text-enamel">
        {profile.name}
      </h1>

      <Rule />

      <Body>{profile.tagline}</Body>

      <p className="font-mono text-[0.6em] leading-[1.7] uppercase tracking-[0.12em] text-enamel/45">
        {profile.status}
      </p>
    </div>
  );
}
