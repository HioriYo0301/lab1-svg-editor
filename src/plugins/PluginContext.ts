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
    this.ensureUnique("command", plugin.name, this.commands);
    this.commands.set(plugin.name, plugin);
  }
  public registerShape(provider: ShapeProvider): void {
    this.ensureUnique("shape", provider.name, this.shapes);
    this.shapes.set(provider.name, provider);
  }
  public registerDecorator(decorator: TreeDecorator): void {
    this.ensureUnique("decorator", decorator.name, this.decorators);
    this.decorators.set(decorator.name, decorator);
  }
  public registerAttribute(handler: AttributeHandler): void {
    this.ensureUnique("attribute", handler.name, this.attributes);
    this.attributes.set(handler.name, handler);
  }

  private ensureUnique<T>(category: string, name: string, registry: Map<string, T>): void {
    if (!/^\S+$/.test(name)) throw new Error(`${category} name must not be empty`);
    if (registry.has(name)) throw new Error(`duplicate registration: ${category}/${name}`);
  }
}
