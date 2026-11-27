import { CommandPlugin } from "./CommandPlugin.js";
import { ShapeProvider } from "./ShapeProvider.js";
import { TreeDecorator } from "./TreeDecorator.js";
import { AttributeHandler } from "./AttributeHandler.js";

export class PluginContext {
  public readonly commands = new Map<string, CommandPlugin>();
  public readonly shapes = new Map<string, ShapeProvider>();
  public readonly decorators = new Map<string, TreeDecorator>();
  public readonly attributes = new Map<string, AttributeHandler>();

  public registerCommand(plugin: CommandPlugin): void {
    this.ensureUnique("commands", plugin.name, this.commands);
    if (!Number.isInteger(plugin.minArgs) || plugin.minArgs < 0 || !Number.isInteger(plugin.maxArgs) || plugin.maxArgs < plugin.minArgs || typeof plugin.help !== "string" || typeof plugin.execute !== "function") throw new Error(`invalid command contract: ${plugin.name}`);
    this.commands.set(plugin.name, plugin);
  }
  public registerShape(provider: ShapeProvider): void {
    this.ensureUnique("shapes", provider.name, this.shapes);
    if (typeof provider.create !== "function") throw new Error(`invalid shape contract: ${provider.name}`);
    this.shapes.set(provider.name, provider);
  }
  public registerDecorator(decorator: TreeDecorator): void {
    this.ensureUnique("decorators", decorator.name, this.decorators);
    if (typeof decorator.decorate !== "function") throw new Error(`invalid decorator contract: ${decorator.name}`);
    this.decorators.set(decorator.name, decorator);
  }
  public registerAttribute(handler: AttributeHandler): void {
    this.ensureUnique("attributes", handler.name, this.attributes);
    if (typeof handler.handles !== "function" || typeof handler.apply !== "function") throw new Error(`invalid attribute contract: ${handler.name}`);
    this.attributes.set(handler.name, handler);
  }

  private ensureUnique<T>(category: string, name: string, registry: Map<string, T>): void {
    if (typeof name !== "string" || !/^\S+$/.test(name)) throw new Error(`${category} name must not be empty`);
    if (registry.has(name)) throw new Error(`duplicate registration: ${category}/${name}`);
  }
}
