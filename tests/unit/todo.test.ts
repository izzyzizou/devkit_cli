import { describe, it, expect } from "vitest";
import { scanForTodos } from "../../src/lib/todo";


describe("scanForTodos", () => {
  it("finds a TODO with a colon and message", () => {
    const hits = scanForTodos("a.ts", "function f() {\n  // TODO: refactor this\n}");
    expect(hits).toEqual([{ file: "a.ts", line: 2, marker: "TODO", text: "refactor this" }]);
  });

  it("finds FIXME without a colon", () => {
    const hits = scanForTodos("b.js", "const x = 1; // FIXME broken");
    expect(hits).toEqual([{ file: "b.js", line: 1, marker: "FIXME", text: "broken" }]);
  });

  it("finds multiple markers across lines", () => {
    const content = ["// TODO: one", "no marker here", "// HACK: two"].join("\n");
    const hits = scanForTodos("c.ts", content);
    expect(hits).toHaveLength(2);
    expect(hits[0]).toMatchObject({ line: 1, marker: "TODO", text: "one" });
    expect(hits[1]).toMatchObject({ line: 3, marker: "HACK", text: "two" });
  });

  it("returns an empty array when there are no markers", () => {
    expect(scanForTodos("d.txt", "nothing to see here")).toEqual([]);
  });

  it("does not match TODO as part of another word", () => {
    // "TODONE" should not match \bTODO\b
    expect(scanForTodos("e.ts", "const TODONE = true;")).toEqual([]);
  });
});
