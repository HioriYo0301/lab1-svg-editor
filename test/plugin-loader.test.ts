import { describe, expect, it, beforeEach, afterEach } from "vitest";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { CliApplication } from "../src/cli/CliApplication.js";
import { PluginLoader } from "../src/host/PluginLoader.js";
import type { Plugin } from "../src/plugins/Plugin.js";

class ProbeCommand {
  public readonly minArgs = 0;
  public readonly maxArgs = 0;
  public constructor(public readonly name: string, public readonly help = name) {}
  public execute(): string { return this.help; }
}
class ProbePlugin implements Plugin {
  public activate(context: Parameters<Plugin["activate"]>[0], options?: unknown): void {
    context.registerCommand(new ProbeCommand("probe", String(options)));
  }
}

describe("plugin loading transaction", () => {
  let folder: string;
  let app: CliApplication;
  let errors: string[];
  let loader: PluginLoader;
  beforeEach(() => {
    folder = mkdtempSync(join(tmpdir(), "svg-loader-"));
    app = new CliApplication(); errors = [];
    loader = new PluginLoader(app, (message) => errors.push(message));
  });
  afterEach(() => { rmSync(folder, { recursive: true, force: true }); });
  function fixture(name: string, source: string, contributes: unknown = {}) {
    const dir = join(folder, name);
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, "package.json"), JSON.stringify({ name, type: "module", main: "index.mjs", contributes }));
    writeFileSync(join(dir, "index.mjs"), source);
  }
  async function config(plugins: unknown[]) {
    const path = join(folder, "plugins.config.json");
    writeFileSync(path, JSON.stringify({ plugins }));
    await loader.loadConfig(path);
  }
  it("passes options through the shared static registration transaction", async () => {
    expect(await loader.load(new ProbePlugin(), { name: "probe-plugin", contributes: { commands: ["probe"] } }, "hello")).toBe(true);
    expect(app.handleLine("probe")).toBe("hello");
    expect(app.handleLine("help")).toContain("hello");
    expect(errors).toEqual([]);
  });
  it("rolls back all categories on manifest mismatch", async () => {
    const plugin: Plugin = { activate(ctx) {
      ctx.registerCommand(new ProbeCommand("probe"));
      ctx.registerDecorator({ name: "label", decorate: (_shape, label) => label });
    } };
    expect(await loader.load(plugin, { name: "wrong", contributes: { commands: ["probe"] } })).toBe(false);
    expect(errors[0]).toMatch(/^error: plugin manifest mismatch: wrong \(declared: .*registered: /);
    expect(app.extensions.commands.size).toBe(0);
    expect(app.extensions.decorators.size).toBe(0);
    expect(await loader.load(new ProbePlugin(), { name: "later", contributes: { commands: ["probe"] } }, "ok")).toBe(true);
    expect(app.handleLine("probe")).toBe("ok");
  });
  it("rolls back a partial activation throw, including asynchronous failure", async () => {
    const plugin: Plugin = { async activate(ctx) { ctx.registerCommand(new ProbeCommand("probe")); throw new Error("boom"); } };
    expect(await loader.load(plugin, { name: "broken", contributes: { commands: ["probe"] } })).toBe(false);
    expect(errors).toEqual(["error: plugin failed to activate: broken (boom)"]);
    expect(app.extensions.commands.size).toBe(0);
    expect(app.handleLine("help")).not.toContain("probe");
  });
  it("rejects duplicates against earlier plugins and preserves them", async () => {
    const manifest = { name: "probe", contributes: { commands: ["probe"] } };
    await loader.load(new ProbePlugin(), manifest, "first");
    const second: Plugin = { activate(ctx) { ctx.registerCommand(new ProbeCommand("fresh")); ctx.registerCommand(new ProbeCommand("probe")); } };
    expect(await loader.load(second, { name: "second", contributes: { commands: ["fresh", "probe"] } })).toBe(false);
    expect(errors).toEqual(["error: duplicate registration: commands/probe"]);
    expect(app.handleLine("probe")).toBe("first");
    expect(app.extensions.commands.has("fresh")).toBe(false);
  });
  it("rejects duplicates within activation and built-in collisions", async () => {
    await loader.load({ activate(ctx: Parameters<Plugin["activate"]>[0]) {
      ctx.registerCommand(new ProbeCommand("probe")); ctx.registerCommand(new ProbeCommand("probe"));
    } }, { name: "duplicate", contributes: { commands: ["probe"] } });
    await loader.load({ activate(ctx: Parameters<Plugin["activate"]>[0]) {
      ctx.registerCommand(new ProbeCommand("init"));
    } }, { name: "builtin", contributes: { commands: ["init"] } });
    expect(errors).toEqual(["error: duplicate registration: commands/probe", "error: duplicate registration: commands/init"]);
    expect(app.extensions.commands.size).toBe(0);
    expect(app.handleLine("init")).toContain("canvas");
  });
  it("preflights cross-category collisions before publishing commands", async () => {
    await loader.load({ activate(ctx: Parameters<Plugin["activate"]>[0]) { ctx.registerDecorator({ name: "label", decorate: (_shape, label) => label }); } }, { name: "first", contributes: { decorators: ["label"] } });
    await loader.load({ activate(ctx: Parameters<Plugin["activate"]>[0]) {
      ctx.registerCommand(new ProbeCommand("probe"));
      ctx.registerDecorator({ name: "label", decorate: (_shape, label) => label });
    } }, { name: "second", contributes: { commands: ["probe"], decorators: ["label"] } });
    expect(errors).toEqual(["error: duplicate registration: decorators/label"]);
    expect(app.extensions.commands.size).toBe(0);
    expect(app.extensions.decorators.size).toBe(1);
  });
  it("handles missing modules/no default and continues to later plugins with options", async () => {
    fixture("no-default", "export const value = 1;");
    fixture("good", 'export default {activate(ctx, options){ctx.registerCommand({name:"probe",minArgs:0,maxArgs:0,help:"probe",execute(){return options.value;}});}};', { commands: ["probe"] });
    await config([{ module: "./absent" }, { module: "./no-default" }, { module: "./good", options: { value: "configured" } }]);
    expect(errors).toEqual(["error: plugin not found: ./absent", "error: plugin has no default export: ./no-default"]);
    expect(app.handleLine("probe")).toBe("configured");
  });
  it("does not misreport dependency/evaluation errors as a missing top-level module", async () => {
    fixture("dependency", 'import "./missing-dependency.mjs"; export default {activate(){}};');
    fixture("evaluation", 'throw new Error("evaluation failed"); export default {activate(){}};');
    await config([{ module: "./dependency" }, { module: "./evaluation" }]);
    expect(errors).toHaveLength(2);
    expect(errors[0]).toMatch(/^error: plugin failed to activate: dependency \(/);
    expect(errors[1]).toContain("error: plugin failed to activate: evaluation (evaluation failed)");
  });
  it("loads packages using the config directory and entirely skips disabled plugins", async () => {
    fixture("node_modules/probe-package", 'export default {activate(ctx){ctx.registerCommand({name:"probe",minArgs:0,maxArgs:0,help:"probe",execute(){return "package";}});}};', { commands: ["probe"] });
    fixture("disabled", 'throw new Error("must never evaluate");');
    await config([{ module: "./disabled", enabled: false }, { module: "./also-missing", enabled: false }, { module: "probe-package" }]);
    expect(errors).toEqual([]);
    expect(app.handleLine("probe")).toBe("package");
  });
  it.each(["{", "null", "{}", '{"plugins":{}}', '{"plugins":[{"module":"x","enabled":"no"}]}', '{"plugins":[{"module":""}]}', '{"plugins":[null]}'])
    ("invalid config starts with only built-in capabilities: %s", async (content) => {
      const file = join(folder, "invalid.json"); writeFileSync(file, content);
      await loader.loadConfig(file);
      expect(errors).toEqual(["error: invalid plugin config"]);
      expect(app.extensions.commands.size).toBe(0);
      expect(app.handleLine("init")).toContain("created");
    });
  it("validates the whole config before loading the first module", async () => {
    fixture("first", 'throw new Error("must not evaluate");');
    await config([{ module: "./first" }, { module: 4 }]);
    expect(errors).toEqual(["error: invalid plugin config"]);
  });
  it("uses set equality for manifests and validates command contracts", async () => {
    await loader.load({ activate(ctx: Parameters<Plugin["activate"]>[0]) {
      ctx.registerCommand(new ProbeCommand("z")); ctx.registerCommand(new ProbeCommand("a"));
    } }, { name: "unordered", contributes: { commands: ["a", "z"] } });
    expect(errors).toEqual([]);
    await loader.load({ activate(ctx: Parameters<Plugin["activate"]>[0]) {
      ctx.registerCommand({ ...new ProbeCommand("bad"), maxArgs: -1, execute: () => "bad" });
    } }, { name: "bad", contributes: { commands: ["bad"] } });
    expect(errors[0]).toContain("invalid command contract: bad");
    expect(app.extensions.commands.has("bad")).toBe(false);
  });
});
