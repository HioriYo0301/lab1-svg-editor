import { CliApplication } from "../cli/CliApplication.js";
import { PluginLoader } from "./PluginLoader.js";

/** Configuration mode does not evaluate the code-assembly plugin modules. */
export async function createApplication(configPath?: string, report: (message: string) => void = console.log): Promise<CliApplication> {
  // No optional commands installed by the compatibility constructor.
  const application = new CliApplication(undefined, undefined, undefined, []);
  const loader = new PluginLoader(application, report);
  if (configPath !== undefined) await loader.loadConfig(configPath);
  else await (await import("./CodeAssembly.js")).loadCodePlugins(loader);
  return application;
}
