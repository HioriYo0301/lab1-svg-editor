import { readFileSync, writeFileSync } from "node:fs";
import { FileSystem } from "./FileSystem.js";

export class NodeFileSystem implements FileSystem {
  public readFile(path: string): string { return readFileSync(path, "utf8"); }
  public writeFile(path: string, content: string): void { writeFileSync(path, content, "utf8"); }
}
