import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createApplication } from "../src/host/CompositionRoot.js";
import { PluginLoader } from "../src/host/PluginLoader.js";
import { CliApplication } from "../src/cli/CliApplication.js";
import directory from "../plugins/dir/index.js";
import { DirCommandPlugin } from "../src/plugins/DirCommandPlugin.js";
import type { DirectoryAccess } from "../src/io/DirectoryAccess.js";

describe("assembly and directory adapter", () => {
  let folder: string;
  beforeEach(() => { folder = mkdtempSync(join(tmpdir(), "svg-assembly-test-")); });
  afterEach(() => { rmSync(folder, { recursive: true, force: true }); });
  it("loads all four extension categories in identical order through A/B", async () => {
    const errors: string[] = [];
    const code = await createApplication(undefined, (message) => errors.push(message));
    const config = await createApplication("plugins.config.json", (message) => errors.push(message));
    expect(errors).toEqual([]);
    for (const category of ["shapes", "commands", "decorators", "attributes"] as const) {
      expect([...config.extensions[category].keys()]).toEqual([...code.extensions[category].keys()]);
      expect(config.extensions[category].size).toBeGreaterThan(0);
    }
    const lines = ["help", "init", 'create box n1 0 0 10 10 "x"', "move n1 2 0", "tree", "stats", "undo", "tree", "dir"];
    expect(lines.map((line) => config.handleLine(line))).toEqual(lines.map((line) => code.handleLine(line)));
  });
  it("disables optional plugins and retains the six built-in shapes", async () => {
    const app = await createApplication("plugins.disabled.config.json");
    expect(app.handleLine("help")).not.toContain("stats");
    expect(() => app.handleLine("stats")).toThrow("unknown command: stats");
    expect(() => app.handleLine("dir")).toThrow("unknown command: dir");
    app.handleLine("init");
    for (const line of ["create rect r 0 0 1 1", "create circle c 0 0 1", "create ellipse e 0 0 1 2", "create line l 0 0 1 1", 'create text t 0 0 "x"', "create g group"]) expect(app.handleLine(line)).toContain("created");
    expect(app.handleLine('create box n 0 0 1 1 "x"')).toContain("unknown shape type: box");
    expect(app.handleLine("tree")).not.toContain("*");
  });
  it("can independently enable dir without stats or box", async () => {
    const app = new CliApplication();
    const errors: string[] = [];
    await new PluginLoader(app, (message) => errors.push(message)).load(directory, { name: "dir", contributes: { commands: ["dir"] } });
    expect(errors).toEqual([]);
    expect(app.handleLine("dir")).toContain("[DIR]");
    expect(() => app.handleLine("stats")).toThrow("unknown command: stats");
    expect(app.currentDocument).toBeNull();
  });
  it("integrates with real temporary directories, hidden files, stable sorting and failure", () => {
    mkdirSync(join(folder, "z")); mkdirSync(join(folder, "a"));
    writeFileSync(join(folder, "z.txt"), "z"); writeFileSync(join(folder, ".hidden"), "h");
    const app = new CliApplication(undefined, undefined, undefined, [new DirCommandPlugin(undefined, folder)]);
    const expected = "[DIR]  a\n[DIR]  z\n[FILE]  .hidden\n[FILE]  z.txt";
    expect(app.handleLine("dir")).toBe(expected);
    expect(app.handleLine("dir")).toBe(expected);
    const empty = join(folder, "empty"); mkdirSync(empty);
    expect(new DirCommandPlugin(undefined, empty).execute(app)).toBe("(empty directory)");
    expect(new DirCommandPlugin(undefined, join(folder, "missing")).execute(app)).toBe(`error: cannot read directory: ${join(folder, "missing")}`);
  });
  it.each([false, true])("dir preserves undo/redo and document state on failure=%s", (failure) => {
    const access: DirectoryAccess = { list() { if (failure) throw new Error("denied"); return []; } };
    const app = new CliApplication(undefined, undefined, undefined, [new DirCommandPlugin(access, folder)]);
    app.handleLine("init"); app.handleLine("create rect r 0 0 10 10"); app.handleLine("move r 4 0"); app.handleLine("undo");
    const before = app.handleLine("tree"); const cwd = process.cwd();
    app.handleLine("dir");
    expect(app.handleLine("tree")).toBe(before);
    expect(process.cwd()).toBe(cwd);
    expect(app.handleLine("redo")).toBe("rect#r moved by (4,0)");
    expect(app.currentDocument?.requireById("r").getAttributeValue("x")).toBe("4");
    app.handleLine("undo"); expect(app.handleLine("tree")).toBe(before);
    expect(() => app.handleLine("dir unexpected")).toThrow("invalid arguments for dir");
  });
});
