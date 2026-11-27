import type { Plugin } from "../../src/plugins/Plugin.js";
import { BoxTypeDecorator } from "../../src/plugins/BoxTypeDecorator.js";
class BoxLabelPlugin implements Plugin {
  public activate(context: Parameters<Plugin["activate"]>[0]): void { context.registerDecorator(new BoxTypeDecorator()); }
}
export default new BoxLabelPlugin();
