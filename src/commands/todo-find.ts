import { $, fs } from "zx";
import { Command } from "commander";
import path from "node:path";
import { readStdinLines } from "../lib/stdin.js";
import { printJson, printLines, logStatus } from "../lib/output.js";

const MARKER_RE = /(TODO|FIXME|HACK)\b:?\s*(.*)/;

interface TodoHit {
  file: string;
  line: number;
  marker: string;
  text: string;
}

export function registerTodoFind(program: Command): void {
  program
    .command("todo:find [files...]")
    .description(
      "Scan files for TODO/FIXME/HACK comments. Reads file list from stdin if none given, so it composes with git:changed."
    )
    .option("--json", "output structured JSON instead of plain lines", false)
    .action(async (files: string[], opts: { json: boolean }) => {
      $.verbose = false;

      let targets = files.length > 0 ? files : await readStdinLines();

      if (targets.length === 0) {
        logStatus("No files given (pass args or pipe a file list in).");
        return;
      }

      const hits: TodoHit[] = [];

      for (const file of targets) {
        const full = path.resolve(file);
        if (!(await fs.pathExists(full))) continue;
        const stat = await fs.stat(full);
        if (!stat.isFile()) continue;

        const content = await fs.readFile(full, "utf8");
        content.split("\n").forEach((lineText: string, idx: number) => {
          const match = lineText.match(MARKER_RE);
          if (match) {
            hits.push({
              file,
              line: idx + 1,
              marker: match[1],
              text: match[2].trim(),
            });
          }
        });
      }

      if (opts.json) {
        printJson(hits);
        return;
      }

      if (hits.length === 0) {
        logStatus("No TODO/FIXME/HACK markers found.");
        return;
      }

      printLines(hits.map((h) => `${h.file}:${h.line}: [${h.marker}] ${h.text}`));
    });
}
