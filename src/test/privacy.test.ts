import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

import { describe, expect, it } from "vitest";

/**
 * The phone number from the résumé must never reach the public site. Public
 * phone numbers get scraped and the spam is permanent — there is no undo once
 * it is indexed. This asserts against both the source and the built output.
 */
const PHONE_FRAGMENTS = ["8850241414", "88502 41414", "+918850241414"];

const TEXT_EXTENSIONS = [".ts", ".tsx", ".css", ".html", ".js", ".json", ".svg", ".yml"];

function collectFiles(dir: string): string[] {
  if (!existsSync(dir)) return [];

  return readdirSync(dir).flatMap((entry) => {
    if (entry === "node_modules" || entry === ".git") return [];

    const full = join(dir, entry);
    if (statSync(full).isDirectory()) return collectFiles(full);
    return TEXT_EXTENSIONS.some((ext) => full.endsWith(ext)) ? [full] : [];
  });
}

describe("no personal contact details leak", () => {
  it("keeps the phone number out of the source tree", () => {
    const offenders = collectFiles("src")
      .concat(existsSync("index.html") ? ["index.html"] : [])
      .filter((file) => {
        if (file.includes("privacy.test")) return false;
        const contents = readFileSync(file, "utf8");
        return PHONE_FRAGMENTS.some((fragment) => contents.includes(fragment));
      });

    expect(offenders).toEqual([]);
  });

  it("keeps the phone number out of the production build", () => {
    const files = collectFiles("dist");
    // Only meaningful once `npm run build` has run; skip rather than pass falsely.
    if (files.length === 0) {
      expect(existsSync("dist")).toBe(false);
      return;
    }

    const offenders = files.filter((file) => {
      const contents = readFileSync(file, "utf8");
      return PHONE_FRAGMENTS.some((fragment) => contents.includes(fragment));
    });

    expect(offenders).toEqual([]);
  });

  it("does not ship the email as a contiguous string in the built JS", () => {
    const bundles = collectFiles("dist").filter((file) => file.endsWith(".js"));
    if (bundles.length === 0) return;

    for (const bundle of bundles) {
      const contents = readFileSync(bundle, "utf8");
      expect(contents).not.toMatch(/[A-Za-z0-9._%+-]+@gmail\.com/);
    }
  });
});
