import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { runCli } from "./run-cli.js";
import { makeFixtureRepo, cleanupFixtureRepo } from "./fixture-repo.js";

describe("devkit CLI (integration)", () => {
  let repo: string;

  beforeAll(() => {
    repo = makeFixtureRepo();
  });

  afterAll(() => {
    cleanupFixtureRepo(repo);
  });

  it("git:changed lists staged files", () => {
    const result = runCli(["git:changed", "--staged"], { cwd: repo });
    const files = result.stdout.trim().split("\n").sort();
    expect(files).toEqual(["a.ts", "b.js", "c.txt"]);
  });

  it("git:changed | todo:find finds TODO/FIXME across piped files", () => {
    const changed = runCli(["git:changed", "--staged"], { cwd: repo });
    const found = runCli(["todo:find"], { cwd: repo, input: changed.stdout });

    expect(found.stdout).toContain("a.ts:2: [TODO] refactor this");
    expect(found.stdout).toContain("b.js:1: [FIXME] broken");
    expect(found.stdout).not.toContain("c.txt");
  });

  it("todo:find --json emits structured, parseable output", () => {
    const found = runCli(["todo:find", "a.ts", "b.js"], { cwd: repo, input: "" });
    // rerun with --json since the first call used plain text
    const jsonResult = runCli(["todo:find", "--json", "a.ts", "b.js"], { cwd: repo });
    const parsed = JSON.parse(jsonResult.stdout);

    expect(parsed).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ file: "a.ts", marker: "TODO" }),
        expect.objectContaining({ file: "b.js", marker: "FIXME" }),
      ])
    );
  });

  it("git:changed | filter narrows to a pattern", () => {
    const changed = runCli(["git:changed", "--staged"], { cwd: repo });
    const filtered = runCli(["filter", "\\.ts$"], { input: changed.stdout });

    expect(filtered.stdout.trim()).toBe("a.ts");
  });

  it("git:changed | exec runs a command per file", () => {
    const changed = runCli(["git:changed", "--staged"], { cwd: repo });
    const result = runCli(["exec", "wc -l {}"], { cwd: repo, input: changed.stdout });

    expect(result.status).toBe(0);
    expect(result.stdout).toMatch(/a\.ts/);
    expect(result.stdout).toMatch(/b\.js/);
  });

  it("commands with no piped input exit cleanly with a stderr hint, not a crash", () => {
    const result = runCli(["filter", "foo"], { input: "" });
    expect(result.status).toBe(0);
    expect(result.stderr).toContain("No input piped in");
  });
});
