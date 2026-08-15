# devkit-cli

A composable command-line toolkit for automating repetitive development workflows,
built with **TypeScript**, **Node**, and **[zx](https://github.com/google/zx)**.

Every command reads plain lines (or JSON, where noted) from stdin and writes the
same format to stdout. That's the only contract commands need to honor, which
means any command can be piped into any other — including ones you add yourself.

```bash
devkit git:changed | devkit todo:find
devkit git:changed | devkit filter '\.ts$' | devkit exec 'eslint {}'
```

## Install

```bash
npm install
npm run build
npm link   # optional: makes `devkit` available globally
```

Or run without building, via `tsx`:

```bash
npm run dev -- git:changed
```

## Commands

| Command       | Description                                                              |
|---------------|---------------------------------------------------------------------------|
| `git:changed` | List files changed vs a base ref (`--base`, `--staged`)                  |
| `todo:find`   | Scan files for `TODO`/`FIXME`/`HACK` comments (reads args or stdin)      |
| `filter`      | Keep piped lines matching a regex (`-v` invert, `-i` ignore case)        |
| `exec`        | Run a shell template per piped line, `{}` substitutes the line           |

Run `devkit <command> --help` for full options.

## Testing

Tests run on [Vitest](https://vitest.dev), split into two layers:

```bash
npm test          # build + full suite (unit + integration)
npm run test:unit # unit tests only, no build needed
npm run test:watch
```

- **`tests/unit/`** — tests pure logic directly, no subprocess, no disk I/O.
  e.g. `scanForTodos()` and the `printLines`/`printJson`/`logStatus` output
  contract. These are the fast, comprehensive layer — new commands should
  push their parsing/formatting logic into `src/lib/` specifically so it's
  unit-testable like this instead of buried in a command's `.action()`.
- **`tests/integration/`** — spawns the *actual built CLI* (`node
  dist/cli.js ...`) as a real subprocess against a throwaway git repo fixture,
  piping one command's stdout into another's stdin exactly like a user would
  on the command line. This is what guarantees composability doesn't silently
  break — e.g. `git:changed | todo:find`, `git:changed | filter | exec`.
  `npm test` builds first (`pretest` script) so these always run against
  current code, not a stale `dist/`.

Adding a command? Pair it with:
1. A unit test for any parsing/formatting you pulled into `src/lib/`.
2. One integration test proving it composes with at least one other command
   via a real pipe.

## Writing your own command

Commands are self-contained modules under `src/commands/`. The pattern:

```ts
// src/commands/my-command.ts
import { Command } from "commander";
import { readStdinLines } from "../lib/stdin.js";
import { printLines } from "../lib/output.js";

export function registerMyCommand(program: Command): void {
  program
    .command("my:command")
    .description("...")
    .action(async () => {
      const input = await readStdinLines(); // accept piped input
      printLines(input);                     // emit pipeable output
    });
}
```

Then register it in `src/commands/index.ts`. Because every command shares the
same `readStdin*` / `print*` helpers in `src/lib/`, new commands automatically
compose with the existing ones — no glue code required.

### Design notes

- **stdout is data, stderr is noise.** Status/progress messages go through
  `logStatus()` (stderr) so they never corrupt a pipeline; only the actual
  result goes to stdout.
- **Lines are the default interchange format**, JSON is opt-in (`--json`
  flags) for commands where structure matters (e.g. `todo:find --json`).
- **TTY detection** means every command still works standalone — piping is
  optional, not required.

## Project structure

```
devkit-cli/
├── bin/devkit          # published entrypoint (points at dist/cli.js)
├── src/
│   ├── cli.ts           # program setup
│   ├── commands/        # one file per subcommand
│   └── lib/
│       ├── stdin.ts      # readStdin / readStdinLines / readStdinJson
│       └── output.ts     # printLines / printJson / logStatus
└── tsconfig.json
```
