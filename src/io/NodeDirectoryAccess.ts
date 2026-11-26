import { readdirSync } from "node:fs";
import { DirectoryAccess, DirectoryEntry } from "./DirectoryAccess.js";

export class NodeDirectoryAccess implements DirectoryAccess {
  public list(path: string): readonly DirectoryEntry[] {
    return readdirSync(path, { withFileTypes: true }).map((entry) => ({
      name: entry.name,
      kind: entry.isDirectory() ? "directory" : entry.isFile() ? "file" : "other",
    }));
  }
}
