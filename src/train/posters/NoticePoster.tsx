/**
 * The panel across the door from the main poster, styled after the notices
 * screwed to a real carriage wall: a ruled box, a mark, tracked mono lettering.
 *
 * The lines are not numbered. Numbering would claim these are steps in a
 * sequence, and they are independent facts — the marker has to be true about
 * the content or it is decoration pretending to be structure.
 */
export function NoticePoster({ heading, lines }: { heading: string; lines: string[] }) {
  return (
    <div className="flex flex-col gap-[0.8em] border border-lamp/25 bg-lamp/[0.04] p-[1.1em]">
      <div className="flex items-center gap-[0.55em]">
        <span
          aria-hidden="true"
          className="inline-block size-0 border-x-[0.32em] border-b-[0.55em] border-x-transparent border-b-lamp/70"
        />
        <h2 className="font-mono text-[0.62em] font-medium uppercase tracking-[0.24em] text-lamp">
          {heading}
        </h2>
      </div>

      <ul className="flex flex-col gap-[0.7em]">
        {lines.map((line) => (
          <li key={line} className="flex gap-[0.6em] text-[0.74em] leading-[1.6] text-enamel/60">
            <span aria-hidden="true" className="text-lamp/40">
              &#8212;
            </span>
            <span>{line}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
