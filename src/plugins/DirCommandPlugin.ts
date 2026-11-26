import { CliApplication } from "../cli/CliApplication.js";
import { DirectoryAccess } from "../io/DirectoryAccess.js";
import { NodeDirectoryAccess } from "../io/NodeDirectoryAccess.js";
import { CommandPlugin } from "./CommandPlugin.js";

export class DirCommandPlugin implements CommandPlugin {
  public readonly name = "dir";
  public readonly minArgs = 0;
  public readonly maxArgs = 0;
  public readonly help = "dir";
  public constructor(private readonly access: DirectoryAccess = new NodeDirectoryAccess(), private readonly cwd = process.cwd()) {}

  public execute(_application: CliApplication): string {
    try {
      const entries = [...this.access.list(this.cwd)];
      const directories = entries.filter((entry) => entry.kind === "directory").sort((a, b) => a.name.localeCompare(b.name));
      const files = entries.filter((entry) => entry.kind !== "directory").sort((a, b) => a.name.localeCompare(b.name));
      if (entries.length === 0) return "(empty directory)";
      return [...directories.map((entry) => `[DIR]  ${entry.name}`), ...files.map((entry) => `[FILE]  ${entry.name}`)].join("\n");
    } catch {
      return `error: cannot read directory: ${this.cwd}`;
    }
  }
}
