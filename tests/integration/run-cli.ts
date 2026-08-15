import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const CLI_PATH = path.resolve(__dirname, "../../dist/cli.js");

export interface RunResult {
  stdout: string;
  stderr: string;
  status: number | null;
}

/**
 * Runs the built CLI (`node dist/cli.js <args>`) as a real subprocess.
 * `input` simulates piped stdin, matching how commands are actually composed
 * on the command line.
 */
export function runCli(args: string[], opts: { cwd?: string; input?: string } = {}): RunResult {
  const result = spawnSync("node", [CLI_PATH, ...args], {
    cwd: opts.cwd,
    input: opts.input ?? "",
    encoding: "utf8",
  });

  return {
    stdout: result.stdout,
    stderr: result.stderr,
    status: result.status,
  };
}
