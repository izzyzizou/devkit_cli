/**
 * Prints one item per line to stdout — the default interchange format,
 * so output from one command can be piped straight into the next.
 */
export function printLines(items: string[]): void {
  for (const item of items) {
    process.stdout.write(item + "\n");
  }
}

/**
 * Prints a JSON payload to stdout for commands that need structured output.
 * Pretty-printed when stdout is a TTY (human reading it), compact when piped
 * (downstream command parsing it).
 */
export function printJson(data: unknown): void {
  const pretty = Boolean(process.stdout.isTTY);
  process.stdout.write(JSON.stringify(data, null, pretty ? 2 : 0) + "\n");
}

/** Writes a status/progress message to stderr so it never pollutes piped stdout. */
export function logStatus(message: string): void {
  process.stderr.write(`\x1b[2m${message}\x1b[0m\n`);
}
