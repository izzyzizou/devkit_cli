import { $ } from "zx";
import { Command } from "commander";
import { printLines, logStatus } from "../lib/output.js";

export function registerGitChanged(program: Command): void {
  program
    .command("git:changed")
    .description("List files changed vs a base ref (default: working tree vs HEAD)")
    .option("-b, --base <ref>", "base ref to diff against", "HEAD")
    .option("--staged", "only show staged files", false)
    .action(async (opts: { base: string; staged: boolean }) => {
      $.verbose = false;

      const args = opts.staged
        ? ["diff", "--name-only", "--staged"]
        : ["diff", "--name-only", opts.base];

      try {
        const result = await $`git ${args}`;
        const files = result.stdout.split("\n").map((f) => f.trim()).filter(Boolean);

        if (files.length === 0) {
          logStatus("No changed files.");
          return;
        }

        printLines(files);
      } catch (err) {
        logStatus(`git:changed failed — are you in a git repo? (${(err as Error).message})`);
        process.exitCode = 1;
      }
    });
}
