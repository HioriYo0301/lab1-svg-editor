import { SvgDocument } from "../document/SvgDocument.js";
import { Group } from "../shapes/Group.js";
import { Command } from "./Command.js";
import { CommandError } from "./CommandError.js";

export class UngroupCommand implements Command {
  public constructor(private readonly document: SvgDocument, private readonly groupId: string) {}

  public execute(): string {
    const shape = this.document.requireById(this.groupId);
    if (!(shape instanceof Group)) throw new CommandError(`cannot ungroup non-container: ${this.groupId}`);
    if (shape.parent === null) throw new CommandError(`cannot ungroup top-level container: ${this.groupId}`);
    const count = this.document.ungroup(shape);
    return `g#${this.groupId} ungrouped (${count} children)`;
  }
}
