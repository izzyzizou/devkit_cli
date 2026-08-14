import { Command } from "commander";
import { registerGitChanged } from "./git-changed.js";
import { registerTodoFind } from "./todo-find.js";
import { registerFilter } from "./filter.js";
import { registerExec } from "./exec.js";

/**
 * Central registry. Add new commands here — each `register*` function
 * owns its own `commander` subcommand definition, so commands stay
 * self-contained and don't need to know about each other.
 */
export function registerAllCommands(program: Command): void {
  registerGitChanged(program);
  registerTodoFind(program);
  registerFilter(program);
  registerExec(program);
}
