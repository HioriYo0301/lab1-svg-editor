import { describe, expect, it } from "vitest";
import { CliApplication } from "../src/cli/CliApplication.js";
import { DirectoryAccess } from "../src/io/DirectoryAccess.js";
import { DirCommandPlugin } from "../src/plugins/DirCommandPlugin.js";

class FakeDirectory implements DirectoryAccess {
  public constructor(private readonly entries: readonly { name: string; kind: "directory" | "file" | "other" }[], private readonly failure = false) {}
  public list(_path: string) { if (this.failure) throw new Error("denied"); return this.entries; }
}

describe("command plugins", () => {
  it("registers stats and exposes it in help without changing document state", () => {
    const app = new CliApplication();
    expect(app.handleLine("init 100 100")).toBe("canvas 100x100 created");
    expect(app.handleLine("create rect r1 0 0 10 10")).toBe("rect#r1 created");
    expect(app.handleLine("create circle c1 20 20 3")).toBe("circle#c1 created");
    const before = app.handleLine("tree");
    expect(app.handleLine("stats")).toBe("rect: 1  circle: 1  (total 2, containers 0)");
    expect(app.handleLine("tree")).toBe(before);
    expect(app.handleLine("help")).toContain("stats");
  });

  it("uses a directory test double, sorts directories before files, and handles empty/failure", () => {
    const entries = [
      { name: "z.txt", kind: "file" as const }, { name: ".env", kind: "file" as const },
      { name: "b", kind: "directory" as const }, { name: "a", kind: "directory" as const },
    ];
    const app = new CliApplication(undefined, undefined, undefined, [new DirCommandPlugin(new FakeDirectory(entries), "fixed")]);
    expect(app.handleLine("dir")).toBe("[DIR]  a\n[DIR]  b\n[FILE]  .env\n[FILE]  z.txt");
    const empty = new CliApplication(undefined, undefined, undefined, [new DirCommandPlugin(new FakeDirectory([]), "empty")]);
    expect(empty.handleLine("dir")).toBe("(empty directory)");
    const failed = new CliApplication(undefined, undefined, undefined, [new DirCommandPlugin(new FakeDirectory([], true), "denied")]);
    expect(failed.handleLine("dir")).toBe("error: cannot read directory: denied");
  });
});
