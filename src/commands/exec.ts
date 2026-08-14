import { $ } from "zx";
import { Command } from "commander";
import { readStdinLines } from "../lib/stdin.js";
import { logStatus } from "../lib/output.js";

/**
 * Runs a command template once per piped line, substituting {} with the line
 * (à la `xargs`/`find -exec`). This is the escape hatch that lets devkit
 * compose with any external tool, not just other devkit commands.
 */
export function registerExec(program: Command): void {
  program
    .command("exec <template>")
    .description("Run a shell command per piped line, e.g. devkit git:changed | devkit exec 'prettier --write {}'")
    .option("-p, --parallel", "run all commands concurrently instead of sequentially", false)
    .action(async (template: string, opts: { parallel: boolean }) => {
      $.verbose = false;
      const lines = await readStdinLines();

      if (lines.length === 0) {
        logStatus("No input piped in — devkit exec expects stdin.");
        return;
      }

      const run = async (line: string) => {
        const cmd = template.includes("{}") ? template.replace(/\{\}/g, line) : `${template} ${line}`;
        try {
          const result = await $`sh -c ${cmd}`;
          process.stdout.write(result.stdout);
        } catch (err) {
          logStatus(`exec failed for "${line}": ${(err as Error).message}`);
          process.exitCode = 1;
        }
      };

      if (opts.parallel) {
        await Promise.all(lines.map(run));
      } else {
        for (const line of lines) await run(line);
      }
    });
}
