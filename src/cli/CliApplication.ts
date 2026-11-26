import { CommandError } from "../commands/CommandError.js";
import { CommandParser, ParsedCommand } from "./CommandParser.js";
import { ShapeFactory } from "../shapes/ShapeFactory.js";
import { Group } from "../shapes/Group.js";
import { Shape } from "../shapes/Shape.js";
import { SvgDocument } from "../document/SvgDocument.js";
import { Command } from "../commands/Command.js";
import { MoveCommand } from "../commands/MoveCommand.js";
import { ScaleCommand } from "../commands/ScaleCommand.js";
import { SetAttributeCommand } from "../commands/SetAttributeCommand.js";
import { DeleteCommand } from "../commands/DeleteCommand.js";
import { ZOrderCommand } from "../commands/ZOrderCommand.js";
import { GroupCommand } from "../commands/GroupCommand.js";
import { UngroupCommand } from "../commands/UngroupCommand.js";
import { AddToCommand } from "../commands/AddToCommand.js";
import { History } from "../history/History.js";
import { FileSystem } from "../io/FileSystem.js";
import { NodeFileSystem } from "../io/NodeFileSystem.js";
import { SvgReader } from "../parser/SvgReader.js";
import { SvgWriter } from "../serializer/SvgWriter.js";
import { PluginContext } from "../plugins/PluginContext.js";
import { CommandPlugin } from "../plugins/CommandPlugin.js";
import { StatsCommandPlugin } from "../plugins/StatsCommandPlugin.js";
import { DirCommandPlugin } from "../plugins/DirCommandPlugin.js";
import { CommandRegistry } from "./CommandRegistry.js";
import { ShapeProvider } from "../plugins/ShapeProvider.js";
import { TreeDecorator } from "../plugins/TreeDecorator.js";
import { ModifiedStarDecorator } from "../plugins/ModifiedStarDecorator.js";

export class CliApplication {
  private document: SvgDocument | null = null;
  private readonly parser = new CommandParser();
  private readonly pluginContext = new PluginContext();
  private readonly pluginCommands = new Map<string, CommandPlugin>();
  private readonly treeDecorators: TreeDecorator[] = [];
  private readonly factory = new ShapeFactory();
  private readonly history = new History();
  private currentPath: string | undefined;
  private readonly reader: SvgReader;
  private readonly writer: SvgWriter;
  private savedMarkup: string | undefined;

  public constructor(private readonly fileSystem: FileSystem = new NodeFileSystem(), reader = new SvgReader(), writer = new SvgWriter(), plugins: readonly CommandPlugin[] = [new StatsCommandPlugin(), new DirCommandPlugin()]) {
    this.reader = reader;
    this.writer = writer;
    for (const plugin of plugins) this.registerCommandPlugin(plugin);
  }

  public handleLine(line: string): string | null {
    const command = this.parser.parse(line);
    if (command === null) return null;
    try {
      return this.execute(command);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return `error: ${message}`;
    }
  }

  public get currentDocument(): SvgDocument | null { return this.document; }
  public get extensions(): PluginContext { return this.pluginContext; }

  public registerCommandPlugin(plugin: CommandPlugin): void {
    if (this.pluginCommands.has(plugin.name)) throw new CommandError(`duplicate registration: command/${plugin.name}`);
    this.parser.register(plugin.name, plugin.minArgs, plugin.maxArgs);
    this.pluginContext.registerCommand({ name: plugin.name, minArgs: plugin.minArgs, maxArgs: plugin.maxArgs, help: plugin.help, execute: plugin.execute });
    this.pluginCommands.set(plugin.name, plugin);
  }

  public registerShapeProvider(provider: ShapeProvider): void {
    this.factory.register(provider);
    this.reader.registerShapeProvider(provider);
    this.pluginContext.registerShape(provider);
  }
  public registerTreeDecorator(decorator: TreeDecorator): void { this.pluginContext.registerDecorator(decorator); this.treeDecorators.push(decorator); }

  private execute(command: ParsedCommand): string {
    const plugin = this.pluginCommands.get(command.name);
    if (plugin !== undefined) return plugin.execute(this, command.args);
    switch (command.name) {
      case "init": return this.init(command.args);
      case "read": return this.read(command.args[0]);
      case "save": return this.save(command.args[0]);
      case "create": return this.create(command.args);
      case "tree": return this.tree(command.args);
      case "show": return this.show(command.args);
      case "help": return this.help();
      case "canvas": return this.canvas(command.args);
      case "move": return this.executeEditing(new MoveCommand(this.requireDocument(), command.args[0], this.number(command.args[1], "dx"), this.number(command.args[2], "dy")));
      case "scale": return this.executeEditing(new ScaleCommand(this.requireDocument(), command.args[0], this.number(command.args[1], "factor")));
      case "set": return this.executeEditing(new SetAttributeCommand(this.requireDocument(), command.args[0], command.args[1], command.args[2]));
      case "delete": return this.executeEditing(new DeleteCommand(this.requireDocument(), command.args[0]));
      case "front": return this.executeEditing(new ZOrderCommand(this.requireDocument(), command.args[0], "front"));
      case "back": return this.executeEditing(new ZOrderCommand(this.requireDocument(), command.args[0], "back"));
      case "group": return this.executeEditing(new GroupCommand(this.requireDocument(), command.args[0], command.args.slice(1)));
      case "ungroup": return this.executeEditing(new UngroupCommand(this.requireDocument(), command.args[0]));
      case "addto": return this.executeEditing(new AddToCommand(this.requireDocument(), command.args[0], command.args[1]));
      case "undo": { const result = this.history.undo(); this.syncDirty(); return result; }
      case "redo": { const result = this.history.redo(); this.syncDirty(); return result; }
      default: throw new CommandError(`command not implemented yet: ${command.name}`);
    }
  }

  private init(args: readonly string[]): string {
    const width = args[0] === undefined ? 800 : this.number(args[0], "width");
    const height = args[1] === undefined ? 600 : this.number(args[1], "height");
    this.document = new SvgDocument(width, height);
    this.savedMarkup = this.writer.write(this.document);
    this.syncDirty();
    this.currentPath = undefined;
    this.history.markIoBoundary();
    return `canvas ${width}x${height} created`;
  }

  private read(path: string): string {
    let content: string;
    try { content = this.fileSystem.readFile(path); }
    catch { throw new CommandError(`cannot read file: ${path}`); }
    let result;
    try { result = this.reader.read(content); }
    catch (error) { throw new CommandError(`cannot read file: ${path}`); }
    this.document = result.document;
    this.savedMarkup = this.writer.write(this.document);
    this.syncDirty();
    this.currentPath = path;
    this.history.markIoBoundary();
    const warningText = result.warnings.length === 0 ? [] : [...result.warnings];
    return [...warningText, `read ${path} (${result.document.elementCount} elements)`].join("\n");
  }

  private save(path: string | undefined): string {
    const document = this.requireDocument();
    const target = path ?? this.currentPath;
    if (target === undefined) throw new CommandError("cannot write file: no path specified");
    try { this.fileSystem.writeFile(target, this.writer.write(document)); }
    catch { throw new CommandError(`cannot write file: ${target}`); }
    this.currentPath = target;
    this.savedMarkup = this.writer.write(document);
    this.syncDirty();
    this.history.markIoBoundary();
    return `saved to ${target} (${document.elementCount} elements)`;
  }

  private create(args: readonly string[]): string {
    const document = this.requireDocument();
    const [type, id, ...rawParameters] = args;
    const { parameters, parentId } = this.splitParentClause(rawParameters);
    const shape = this.factory.create(type, id, parameters);
    const parent = parentId === undefined ? null : this.requireContainer(document, parentId);
    document.add(shape, parent);
    return parent === null ? `${shape.type}#${shape.id} created` : `${shape.type}#${shape.id} created in g#${parent.id}`;
  }

  private tree(args: readonly string[]): string {
    const document = this.requireDocument();
    const root = args[0] === undefined ? null : document.requireById(args[0]);
    const lines = root === null ? [`svg (${document.width}x${document.height})`] : [];
    const shapes = root === null ? [...document] : [root];
    shapes.forEach((shape, index) => this.appendTree(lines, shape, "", index === shapes.length - 1));
    return lines.join("\n");
  }

  private show(args: readonly string[]): string {
    const shape = this.requireDocument().requireById(args[0]);
    const parent = shape.parent === null ? "svg" : `g#${shape.parent.id}`;
    return `${shape.describe()} parent=${parent}`;
  }

  private help(): string {
    return [
      "init [w] [h]", "read <file.svg>", "save [file.svg]", "canvas [w] [h]",
      "create <type> <id> [params...] [in <containerId>]", "delete <id>",
      "move <id> <dx> <dy>", "scale <id> <factor>", "set <id> <attr> <value>",
      "group <newGid> <id1> <id2>...", "ungroup <gid>", "addto <gid> <id>",
      "front/back <id>", "tree [id]", "show <id>", "undo", "redo",
      ...[...this.pluginCommands.values()].map((plugin) => plugin.help),
    ].join("\n");
  }

  private canvas(args: readonly string[]): string {
    const document = this.requireDocument();
    if (args.length === 0) return `canvas ${document.width}x${document.height}`;
    const width = this.number(args[0], "width");
    const height = this.number(args[1], "height");
    document.setCanvasSize(width, height);
    this.history.markIoBoundary();
    return `canvas resized to ${width}x${height}`;
  }

  private appendTree(lines: string[], shape: Shape, prefix: string, last: boolean): void {
    let label = shape.describe();
    for (const decorator of this.treeDecorators) label = decorator.decorate(shape, label);
    lines.push(`${prefix}${last ? "└── " : "├── "}${label}`);
    if (shape instanceof Group) {
      const children = [...shape];
      const childPrefix = `${prefix}${last ? "    " : "│   "}`;
      children.forEach((child, index) => this.appendTree(lines, child, childPrefix, index === children.length - 1));
    }
  }

  private splitParentClause(parameters: readonly string[]): { parameters: string[]; parentId?: string } {
    const inIndex = parameters.length - 2;
    if (inIndex >= 0 && parameters[inIndex] === "in") {
      return { parameters: parameters.slice(0, inIndex), parentId: parameters[inIndex + 1] };
    }
    return { parameters: [...parameters] };
  }

  private requireContainer(document: SvgDocument, id: string): Group {
    const shape = document.requireById(id);
    if (!(shape instanceof Group)) throw new CommandError(`not a container: ${id}`);
    return shape;
  }

  private requireDocument(): SvgDocument {
    if (this.document === null) throw new CommandError("no document. use 'init' or 'read' first");
    return this.document;
  }

  private number(value: string, name: string): number {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) throw new CommandError(`${name} must be a finite number`);
    return parsed;
  }

  private executeEditing(command: Command): string {
    const result = this.history.execute(command);
    this.syncDirty();
    return result;
  }
  private syncDirty(): void {
    const document = this.document;
    if (document === null) return;
    const dirty = this.savedMarkup !== this.writer.write(document);
    for (const decorator of this.treeDecorators) if (decorator instanceof ModifiedStarDecorator) {
      if (!dirty) decorator.clear();
      else { const ids: string[] = []; for (const shape of document) this.collectIds(shape, ids); decorator.setDirty(ids); }
    }
  }
  private collectIds(shape: Shape, ids: string[]): void { ids.push(shape.id); if (shape instanceof Group) for (const child of shape) this.collectIds(child, ids); }
}
