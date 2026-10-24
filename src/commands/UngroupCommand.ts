import { SvgDocument } from "../document/SvgDocument.js";
import { Group } from "../shapes/Group.js";
import { Shape } from "../shapes/Shape.js";
import { Command } from "./Command.js";
import { CommandError } from "./CommandError.js";

export class UngroupCommand implements Command {
  private group: Group | undefined;
  private targetParent: Group | undefined;
  private parentIndex = -1;
  private children: readonly Shape[] = [];
  public constructor(private readonly document: SvgDocument, private readonly groupId: string) {}

  public execute(): string {
    const shape = this.document.requireById(this.groupId);
    if (!(shape instanceof Group)) throw new CommandError(`cannot ungroup non-container: ${this.groupId}`);
    if (shape.parent === null) throw new CommandError(`cannot ungroup top-level container: ${this.groupId}`);
    this.group = shape;
    this.targetParent = shape.parent;
    this.parentIndex = shape.parent.indexOf(shape);
    this.children = [...shape];
    const count = this.document.ungroup(shape);
    return `g#${this.groupId} ungrouped (${count} children)`;
  }

  public undo(): string {
    if (this.group === undefined || this.targetParent === undefined || this.group.parent !== null) throw new CommandError("ungroup command cannot be undone");
    for (const child of this.children) this.document.remove(child);
    for (const child of this.children) this.group.addChild(child);
    this.document.add(this.group, this.targetParent, this.parentIndex);
    return `g#${this.group.id} restored`;
  }
}
