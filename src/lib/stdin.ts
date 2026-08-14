/**
 * Reads stdin if it's being piped in (not a TTY), otherwise returns null.
 * Lets every command work standalone OR as the receiving end of a pipe.
 */
export async function readStdin(): Promise<string | null> {
  if (process.stdin.isTTY) return null;

  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(Buffer.from(chunk));
  }
  const data = Buffer.concat(chunks).toString("utf8").trim();
  return data.length > 0 ? data : null;
}

/**
 * Splits piped stdin into lines, ignoring blank lines.
 * Most devkit commands treat one-line-per-item as the interchange format,
 * so `devkit a | devkit b` composes without extra plumbing.
 */
export async function readStdinLines(): Promise<string[]> {
  const raw = await readStdin();
  if (!raw) return [];
  return raw.split("\n").map((l) => l.trim()).filter(Boolean);
}

/**
 * Reads and parses piped stdin as JSON. Returns null if there's no input
 * or it isn't valid JSON, so callers can fall back to their own defaults.
 */
export async function readStdinJson<T = unknown>(): Promise<T | null> {
  const raw = await readStdin();
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}
