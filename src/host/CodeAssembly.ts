import { readFileSync } from "node:fs";
import type { PluginLoader, PluginManifest } from "./PluginLoader.js";
import stats from "../../plugins/stats/index.js";
import directory from "../../plugins/dir/index.js";
import box from "../../plugins/box/index.js";
import boxLabel from "../../plugins/box-label/index.js";
import treeStar from "../../plugins/tree-star/index.js";

/** The ONLY concrete plugin list for code assembly; loader is independent. */
export async function loadCodePlugins(loader: PluginLoader): Promise<void> {
  for (const [plugin, manifestUrl] of [
    [stats, new URL("../../plugins/stats/package.json", import.meta.url)],
    [directory, new URL("../../plugins/dir/package.json", import.meta.url)],
    [box, new URL("../../plugins/box/package.json", import.meta.url)],
    [boxLabel, new URL("../../plugins/box-label/package.json", import.meta.url)],
    [treeStar, new URL("../../plugins/tree-star/package.json", import.meta.url)],
  ] as const) {
    await loader.load(plugin, JSON.parse(readFileSync(manifestUrl, "utf8")) as PluginManifest);
  }
}
