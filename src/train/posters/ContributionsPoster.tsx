import type { PullRequest } from "../../content/projects";
import { Body, Departure, Eyebrow } from "./Plate";

/**
 * Work merged into someone else's repository.
 *
 * Grouped by repo, and the ownership line is stated outright rather than left
 * to be inferred: these are other people's projects, and the poster must not
 * read as though they were his. When one poster spans several owners, every
 * repo is named as `owner/repo` so no project borrows another's ownership line.
 * The pull request numbers are shown because they are the claim's receipt —
 * anyone can open one and check.
 */
export function ContributionsPoster({ pullRequests }: { pullRequests: PullRequest[] }) {
  const owners = [...new Set(pullRequests.map((pr) => pr.owner))];
  const severalOwners = owners.length > 1;
  const label = (pr: PullRequest) => (severalOwners ? `${pr.owner}/${pr.repo}` : pr.repo);
  const repos = [...new Set(pullRequests.map(label))];
  const severalRepos = repos.length > 1;
  const severalPullRequests = pullRequests.length > 1;

  return (
    <div className="flex flex-col gap-[0.85em]">
      <Eyebrow>{owners.join(" · ")}</Eyebrow>

      <h2 className="text-[1.35em] leading-[1.1] font-bold uppercase tracking-[0.07em] text-enamel">
        Open source
      </h2>

      <Body>
        {severalOwners
          ? "Contributions to other people's repos"
          : `Contributions to ${owners[0]}'s ${severalRepos ? "repos" : "repo"}`}{" "}
        — {severalRepos ? "their projects" : "their project"}, my{" "}
        {severalPullRequests ? "pull requests" : "pull request"}.
      </Body>

      {repos.map((repo) => (
        <div key={repo} className="flex flex-col gap-[0.6em]">
          <h3 className="font-mono text-[0.62em] font-medium uppercase tracking-[0.24em] text-lamp">
            {repo}
          </h3>

          <ul className="flex flex-col gap-[0.75em]">
            {pullRequests
              .filter((pr) => label(pr) === repo)
              .map((pr) => (
                <li key={pr.number} className="flex flex-col gap-[0.3em]">
                  <div className="flex items-center gap-[0.7em]">
                    <span className="font-mono text-[0.58em] tracking-[0.14em] text-enamel/50">
                      #{pr.number}
                    </span>
                    <span className="font-mono text-[0.56em] uppercase tracking-[0.2em] text-live">
                      Merged · {pr.merged}
                    </span>
                  </div>
                  <p className="text-[0.8em] leading-[1.5] text-enamel/80">{pr.title}</p>
                  <Departure href={pr.href}>
                    Pull request {pr.number} on {repo}
                  </Departure>
                </li>
              ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
