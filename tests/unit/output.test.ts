import { describe, it, expect, vi, afterEach } from "vitest";
import { printLines, printJson, logStatus } from "../../src/lib/output.js";

describe("printLines", () => {
  afterEach(() => vi.restoreAllMocks());

  it("writes one line per item, newline-terminated", () => {
    const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    printLines(["a", "b", "c"]);
    expect(writeSpy).toHaveBeenCalledTimes(3);
    expect(writeSpy).toHaveBeenNthCalledWith(1, "a\n");
    expect(writeSpy).toHaveBeenNthCalledWith(3, "c\n");
  });

  it("writes nothing for an empty array", () => {
    const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    printLines([]);
    expect(writeSpy).not.toHaveBeenCalled();
  });
});

describe("printJson", () => {
  const originalIsTTY = process.stdout.isTTY;

  afterEach(() => {
    vi.restoreAllMocks();
    Object.defineProperty(process.stdout, "isTTY", { value: originalIsTTY, configurable: true });
  });

  it("emits compact JSON when stdout is not a TTY (piped)", () => {
    Object.defineProperty(process.stdout, "isTTY", { value: false, configurable: true });
    const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

    printJson({ a: 1 });

    expect(writeSpy).toHaveBeenCalledWith(JSON.stringify({ a: 1 }) + "\n");
  });

  it("emits pretty JSON when stdout is a TTY", () => {
    Object.defineProperty(process.stdout, "isTTY", { value: true, configurable: true });
    const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

    printJson({ a: 1 });

    expect(writeSpy).toHaveBeenCalledWith(JSON.stringify({ a: 1 }, null, 2) + "\n");
  });
});

describe("logStatus", () => {
  afterEach(() => vi.restoreAllMocks());

  it("writes to stderr, never stdout", () => {
    const stderrSpy = vi.spyOn(process.stderr, "write").mockImplementation(() => true);
    const stdoutSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);

    logStatus("hello");

    expect(stderrSpy).toHaveBeenCalledTimes(1);
    expect(stdoutSpy).not.toHaveBeenCalled();
  });
});
