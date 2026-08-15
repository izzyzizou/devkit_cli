#!/usr/bin/env node
import { Command } from "commander";
import { registerAllCommands } from "./commands/index.js";

const program = new Command();

program
  .name("devkit")
  .description(
    "A composable command-line toolkit for automating repetitive development workflows.\n" +
      "Every command reads plain lines (or JSON, where noted) from stdin and writes the same to stdout,\n" +
      "so any command can be piped into any other, e.g.:\n\n" +
      "  devkit git:changed | devkit todo:find\n" +
      "  devkit git:changed | devkit filter '\\.ts$' | devkit exec 'eslint {}'",
  )
  .version("1.0.0");

registerAllCommands(program);

program.parseAsync(process.argv);
