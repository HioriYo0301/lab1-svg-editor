import type { CliApplication } from "../cli/CliApplication.js";

export interface CommandPlugin {
  readonly name: string;
  readonly minArgs: number;
  readonly maxArgs: number;
  readonly help: string;
  execute(application: CliApplication, args: readonly string[]): string;
}
