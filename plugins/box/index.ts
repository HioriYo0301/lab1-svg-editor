import type { Plugin } from "../../src/plugins/Plugin.js";
import { activateBoxPlugin } from "../../src/plugins/BoxPlugin.js";
class BoxPlugin implements Plugin {
  public activate(context: Parameters<Plugin["activate"]>[0]): void { activateBoxPlugin(context); }
}
export default new BoxPlugin();
