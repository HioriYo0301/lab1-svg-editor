import type { Plugin } from "../../src/plugins/Plugin.js";
import { StatsCommandPlugin } from "../../src/plugins/StatsCommandPlugin.js";
class StatsPlugin implements Plugin {
  public activate(context: Parameters<Plugin["activate"]>[0]): void { context.registerCommand(new StatsCommandPlugin()); }
}
export default new StatsPlugin();
