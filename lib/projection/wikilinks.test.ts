import { describe, it, expect } from "vitest";
import { parseWikilinks, normalizeTitle } from "./wikilinks";

describe("parseWikilinks", () => {
  it("extracts simple wikilinks", () => {
    const links = parseWikilinks("See [[Motor Design]] and [[Thermal Model]].");
    expect(links.map((l) => l.target)).toEqual(["Motor Design", "Thermal Model"]);
  });

  it("handles aliases and headings", () => {
    const links = parseWikilinks("Ref [[Motor Design|the motor]] and [[Notes#intro]]");
    expect(links[0]).toMatchObject({ target: "Motor Design", alias: "the motor" });
    expect(links[1]).toMatchObject({ target: "Notes", heading: "intro" });
  });

  it("ignores empty and malformed tokens", () => {
    expect(parseWikilinks("[[]] [single] text")).toHaveLength(0);
    expect(parseWikilinks("")).toHaveLength(0);
  });

  it("normalizes titles case-insensitively", () => {
    expect(normalizeTitle("  Motor Design ")).toBe("motor design");
  });
});
