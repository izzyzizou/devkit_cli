export interface TodoHit {
  file: string;
  line: number;
  marker: string;
  text: string;
}

const MARKER_RE = /(TODO|FIXME|HACK)\b:?\s*(.*)/;

/**
 * Scans file content for TODO/FIXME/HACK markers. Pure function (no fs, no
 * process) so it can be unit tested directly without touching disk.
 */
export function scanForTodos(file: string, content: string): TodoHit[] {
  const hits: TodoHit[] = [];

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

  return hits;
}
