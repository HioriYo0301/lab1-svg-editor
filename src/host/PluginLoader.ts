import { readFileSync } from "node:fs";
import { dirname, isAbsolute, join, resolve } from "node:path";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import { PluginContext } from "../plugins/PluginContext.js";
import type { Plugin } from "../plugins/Plugin.js";

const categories = ["shapes", "commands", "decorators", "attributes"] as const;
type Category = typeof categories[number];
type Contributions = Record<Category, string[]>;
export interface PluginManifest {
  readonly name: string;
  readonly contributes?: Partial<Record<Category, readonly string[]>>;
}
export interface PluginHost { installExtensions(staged: PluginContext): void; }
export interface ConfigEntry { readonly module: string; readonly enabled?: boolean; readonly options?: unknown; }
const record = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);

/** Host-side only. No imports, mappings or branches for concrete plugins. */
export class PluginLoader {
  public constructor(private readonly host: PluginHost, private readonly report: (message: string) => void = console.log) {}

  /** Both static assembly and dynamic loading enter this transaction. */
  public async load(plugin: unknown, manifest: PluginManifest, options?: unknown): Promise<boolean> {
    const name = typeof manifest?.name === "string" ? manifest.name : "<unnamed>";
    try {
      const declared = this.declarations(manifest);
      if (!record(plugin) || typeof plugin.activate !== "function") throw new Error("default export must implement activate");
      const staged = new PluginContext();
      await (plugin as unknown as Plugin).activate(staged, options);
      const registered = Object.fromEntries(categories.map((category) => [category, [...staged[category].keys()].sort()])) as Contributions;
      if (JSON.stringify(declared) !== JSON.stringify(registered)) {
        this.report(`error: plugin manifest mismatch: ${name} (declared: ${JSON.stringify(declared)}, registered: ${JSON.stringify(registered)})`);
        return false;
      }
      // Commit is synchronous and preflights all categories before publishing any.
      this.host.installExtensions(staged);
      return true;
    } catch (error) {
      this.failure(name, error);
      return false;
    }
  }

  public async loadConfig(configPath: string): Promise<void> {
    let entries: ConfigEntry[];
    const absolute = resolve(configPath);
    try {
      const config: unknown = JSON.parse(readFileSync(absolute, "utf8"));
      if (!record(config) || !Array.isArray(config.plugins)) throw new Error("invalid config");
      for (const entry of config.plugins) {
        if (!record(entry) || typeof entry.module !== "string" || !entry.module.trim() ||
            (entry.enabled !== undefined && typeof entry.enabled !== "boolean")) throw new Error("invalid config");
      }
      entries = config.plugins as ConfigEntry[];
    } catch {
      this.report("error: invalid plugin config");
      return;
    }
    for (const entry of entries) {
      if (entry.enabled === false) continue;
      await this.loadModule(entry, absolute);
    }
  }

  private async loadModule(entry: ConfigEntry, configPath: string): Promise<void> {
    const resolver = createRequire(pathToFileURL(configPath));
    let resolved: string;
    try {
      const specifier = entry.module.startsWith(".") || isAbsolute(entry.module)
        ? resolve(dirname(configPath), entry.module) : entry.module;
      resolved = resolver.resolve(specifier);
    } catch (error) {
      if (record(error) && error.code === "MODULE_NOT_FOUND") this.report(`error: plugin not found: ${entry.module}`);
      else this.failure(entry.module, error);
      return;
    }
    let manifest: PluginManifest;
    try {
      manifest = this.readManifest(resolved);
    } catch (error) { this.failure(entry.module, error); return; }
    try {
      // Resolution has already succeeded: evaluation/dependency errors are NOT "not found".
      const namespace: Record<string, unknown> = await import(pathToFileURL(resolved).href);
      if (namespace.default === undefined) {
        this.report(`error: plugin has no default export: ${entry.module}`);
        return;
      }
      await this.load(namespace.default, manifest, entry.options);
    } catch (error) { this.failure(manifest.name, error); }
  }

  private readManifest(entry: string): PluginManifest {
    let directory = dirname(entry);
    while (true) {
      try { return JSON.parse(readFileSync(join(directory, "package.json"), "utf8")) as PluginManifest; }
      catch (error) {
        if (!(record(error) && error.code === "ENOENT")) throw error;
      }
      const parent = dirname(directory);
      if (parent === directory) throw new Error("plugin package.json not found");
      directory = parent;
    }
  }

  private declarations(manifest: PluginManifest): Contributions {
    if (!record(manifest) || typeof manifest.name !== "string" || !manifest.name.trim()) throw new Error("invalid plugin manifest");
    const contributes: unknown = manifest.contributes ?? {};
    if (!record(contributes) || Object.keys(contributes).some((key) => !categories.includes(key as Category))) throw new Error("invalid contributes");
    return Object.fromEntries(categories.map((category) => {
      const names: unknown = contributes[category] ?? [];
      if (!Array.isArray(names) || names.some((name) => typeof name !== "string" || !/^\S+$/.test(name)) || new Set(names).size !== names.length) throw new Error(`invalid contributes: ${category}`);
      return [category, [...names].sort()];
    })) as Contributions;
  }

  private failure(name: string, error: unknown): void {
    const reason = error instanceof Error ? error.message : String(error);
    this.report(reason.startsWith("duplicate registration: ") ? `error: ${reason}` : `error: plugin failed to activate: ${name} (${reason})`);
  }
}
