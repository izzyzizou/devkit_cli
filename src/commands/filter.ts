import { Command } from "commander";
import { readStdinLines } from "../lib/stdin.js";
import { printLines, logStatus } from "../lib/output.js";

export function registerFilter(program: Command): void {
  program
    .command("filter <pattern>")
    .description("Keep piped lines matching a regex pattern (generic pipeline primitive)")
    .option("-v, --invert", "keep lines that do NOT match", false)
    .option("-i, --ignore-case", "case-insensitive match", false)
    .action(async (pattern: string, opts: { invert: boolean; ignoreCase: boolean }) => {
      const lines = await readStdinLines();

      if (lines.length === 0) {
        logStatus("No input piped in — devkit filter expects stdin, e.g. `devkit x | devkit filter foo`");
        return;
      }

      const re = new RegExp(pattern, opts.ignoreCase ? "i" : "");
      const result = lines.filter((line) => (opts.invert ? !re.test(line) : re.test(line)));

      printLines(result);
    });
}
