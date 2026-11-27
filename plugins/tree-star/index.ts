import type { Plugin } from "../../src/plugins/Plugin.js";
import { ModifiedStarDecorator } from "../../src/plugins/ModifiedStarDecorator.js";
class TreeStarPlugin implements Plugin {
  public activate(context: Parameters<Plugin["activate"]>[0]): void { context.registerDecorator(new ModifiedStarDecorator()); }
}
export default new TreeStarPlugin();
