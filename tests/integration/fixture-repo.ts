import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

/**
 * Creates a temp git repo with a few staged files (one with a TODO, one with
 * a FIXME, one clean) so tests exercise git:changed / todo:find against
 * something real instead of mocking git or the filesystem.
 */
export function makeFixtureRepo(): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "devkit-test-"));

  const git = (...args: string[]) =>
    spawnSync("git", args, { cwd: dir, encoding: "utf8", env: { ...process.env, GIT_AUTHOR_NAME: "t", GIT_AUTHOR_EMAIL: "t@t.com" } });

  git("init", "-q");
  git("config", "user.email", "t@t.com");
  git("config", "user.name", "t");

  fs.writeFileSync(path.join(dir, "a.ts"), "function a() {\n  // TODO: refactor this\n}\n");
  fs.writeFileSync(path.join(dir, "b.js"), "const x = 1; // FIXME broken\n");
  fs.writeFileSync(path.join(dir, "c.txt"), "no markers here\n");

  git("add", "-A");

  return dir;
}

export function cleanupFixtureRepo(dir: string): void {
  fs.rmSync(dir, { recursive: true, force: true });
}
