import type { Plugin } from "../../src/plugins/Plugin.js";
import { DirCommandPlugin } from "../../src/plugins/DirCommandPlugin.js";
import { NodeDirectoryAccess } from "../../src/io/NodeDirectoryAccess.js";
class DirectoryPlugin implements Plugin {
  public activate(context: Parameters<Plugin["activate"]>[0]): void {
    context.registerCommand(new DirCommandPlugin(new NodeDirectoryAccess(), process.cwd()));
  }
}
export default new DirectoryPlugin();
