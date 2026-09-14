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

Requirements: Node.js 18+ and Git.

From a checkout of this repository:

```bash
npm install
npm run build
```

Then choose how you want to run the CLI:

```bash
# Run the built CLI directly from this checkout
npm start -- --help

# Or make `devkit` available globally while you develop it
npm link
devkit --help
```

For source-mode development without rebuilding, use `npm run dev --` followed
by the command and options:

```bash
npm run dev -- git:changed --staged
```

## Commands

`devkit` is intentionally small: each command does one thing and keeps stdout
pipeable for the next command.

| Command       | Input                         | Output                         | Common options                                  |
|---------------|-------------------------------|--------------------------------|-------------------------------------------------|
| `git:changed` | current Git repository        | changed file paths, one/line   | `--base <ref>` (default `HEAD`), `--staged`     |
| `todo:find`   | file args or file paths stdin | TODO/FIXME/HACK hits           | `--json` for structured output                  |
| `filter`      | stdin lines                   | matching stdin lines           | `-v`/`--invert`, `-i`/`--ignore-case`           |
| `exec`        | stdin lines                   | command stdout                 | `-p`/`--parallel`; `{}` substitutes each line   |

Run `devkit <command> --help` for full options.

### Command details

#### `git:changed`

Lists files changed in the current repository. By default it compares the
working tree with `HEAD`; use `--staged` to list only staged paths or
`--base <ref>` to compare against another ref.

```bash
devkit git:changed
devkit git:changed --staged
devkit git:changed --base main
```

#### `todo:find`

Scans files for `TODO`, `FIXME`, and `HACK` markers. Pass files explicitly, or
pipe file names from another command.

```bash
devkit todo:find src/cli.ts README.md
devkit git:changed | devkit todo:find
devkit todo:find --json src/cli.ts
```

#### `filter`

Keeps only piped lines that match a JavaScript regular expression.

```bash
devkit git:changed | devkit filter '\.ts$'
devkit git:changed | devkit filter -i 'readme|license'
devkit git:changed | devkit filter -v '\.md$'
```

#### `exec`

Runs a shell command template once for each piped line. Include `{}` where the
line should be inserted; if omitted, the line is appended to the template.

```bash
devkit git:changed | devkit exec 'wc -l {}'
devkit git:changed | devkit filter '\.ts$' | devkit exec 'npx prettier --check {}'
```

## End-to-end workflow: review changed TODOs before committing

This workflow starts with a Git working tree, narrows the file list, scans for
work markers, and optionally runs another tool over the same changed files.

1. Install and expose the CLI:

   ```bash
   npm install
   npm run build
   npm link
   ```

2. In any Git repository, make or stage a change that contains a marker such as:

   ```ts
   // TODO: replace the placeholder implementation
   ```

3. See the changed files that `devkit` can compose over:

   ```bash
   devkit git:changed
   # or, if you staged the files:
   devkit git:changed --staged
   ```

4. Find only TODO/FIXME/HACK markers in changed TypeScript files:

   ```bash
   devkit git:changed \
     | devkit filter '\.ts$' \
     | devkit todo:find
   ```

   Example output:

   ```text
   src/example.ts:12: [TODO] replace the placeholder implementation
   ```

5. Reuse the same changed-file stream with an external command:

   ```bash
   devkit git:changed \
     | devkit filter '\.ts$' \
     | devkit exec 'npx prettier --check {}'
   ```

Because every command writes data to stdout and status messages to stderr, the
pipeline remains safe to extend with standard shell tools such as `sort`,
`uniq`, `tee`, or `xargs`.

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
