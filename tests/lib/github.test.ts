import { describe, it, expect } from "vitest";
import { parseGithubUrl } from "@/lib/github";

describe("parseGithubUrl", () => {
  it("parses full HTTPS URL", () => {
    const result = parseGithubUrl("https://github.com/owner/repo");
    expect(result).toEqual({ owner: "owner", repo: "repo" });
  });

  it("strips .git suffix", () => {
    const result = parseGithubUrl("https://github.com/owner/repo.git");
    expect(result).toEqual({ owner: "owner", repo: "repo" });
  });

  it("parses owner/repo shorthand", () => {
    const result = parseGithubUrl("owner/repo");
    expect(result).toEqual({ owner: "owner", repo: "repo" });
  });

  it("handles github.com/ prefix without protocol", () => {
    const result = parseGithubUrl("github.com/owner/repo");
    expect(result).toEqual({ owner: "owner", repo: "repo" });
  });

  it("strips trailing slash", () => {
    const result = parseGithubUrl("https://github.com/owner/repo/");
    expect(result).toEqual({ owner: "owner", repo: "repo" });
  });

  it("throws on single segment", () => {
    expect(() => parseGithubUrl("owner")).toThrow("Invalid GitHub URL");
  });

  it("throws on empty string", () => {
    expect(() => parseGithubUrl("")).toThrow("Invalid GitHub URL");
  });
});
