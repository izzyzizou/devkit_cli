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
