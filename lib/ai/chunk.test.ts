import { describe, it, expect } from "vitest";
import { chunkMarkdown } from "./chunk";

describe("chunkMarkdown", () => {
  it("returns empty for blank input", () => {
    expect(chunkMarkdown("")).toEqual([]);
    expect(chunkMarkdown("   \n  ")).toEqual([]);
  });

  it("keeps small content as a single chunk", () => {
    const chunks = chunkMarkdown("# Title\n\nA short note.");
    expect(chunks).toHaveLength(1);
    expect(chunks[0].index).toBe(0);
    expect(chunks[0].content).toContain("Title");
  });

  it("splits long content into multiple ordered chunks", () => {
    const para = "word ".repeat(400); // ~2000 chars
    const chunks = chunkMarkdown(`${para}\n\n${para}\n\n${para}`, 800, 100);
    expect(chunks.length).toBeGreaterThan(1);
    chunks.forEach((c, i) => expect(c.index).toBe(i));
  });
});
