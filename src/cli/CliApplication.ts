import { CommandError } from "../commands/CommandError.js";
import { CommandParser, ParsedCommand } from "./CommandParser.js";
import { ShapeFactory } from "../shapes/ShapeFactory.js";
import { Group } from "../shapes/Group.js";
import { Shape } from "../shapes/Shape.js";
import { SvgDocument } from "../document/SvgDocument.js";

export class CliApplication {
  private document: SvgDocument | null = null;
  private readonly parser = new CommandParser();
  private readonly factory = new ShapeFactory();

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

  private execute(command: ParsedCommand): string {
    switch (command.name) {
      case "init": return this.init(command.args);
      case "create": return this.create(command.args);
      case "tree": return this.tree(command.args);
      case "show": return this.show(command.args);
      case "help": return this.help();
      case "canvas": return this.canvas(command.args);
      default: throw new CommandError(`command not implemented yet: ${command.name}`);
    }
  }

  private init(args: readonly string[]): string {
    const width = args[0] === undefined ? 800 : this.number(args[0], "width");
    const height = args[1] === undefined ? 600 : this.number(args[1], "height");
    this.document = new SvgDocument(width, height);
    return `canvas ${width}x${height} created`;
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
    ].join("\n");
  }

  private canvas(args: readonly string[]): string {
    const document = this.requireDocument();
    if (args.length === 0) return `canvas ${document.width}x${document.height}`;
    const width = this.number(args[0], "width");
    const height = this.number(args[1], "height");
    document.setCanvasSize(width, height);
    return `canvas resized to ${width}x${height}`;
  }

  private appendTree(lines: string[], shape: Shape, prefix: string, last: boolean): void {
    lines.push(`${prefix}${last ? "└── " : "├── "}${shape.describe()}`);
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
}
