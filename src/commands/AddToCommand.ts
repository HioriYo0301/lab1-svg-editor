import { SvgDocument } from "../document/SvgDocument.js";
import { Group } from "../shapes/Group.js";
import { Shape } from "../shapes/Shape.js";
import { Command } from "./Command.js";
import { CommandError } from "./CommandError.js";

export class AddToCommand implements Command {
  public constructor(private readonly document: SvgDocument, private readonly groupId: string, private readonly shapeId: string) {}

  public execute(): string {
    const groupShape = this.document.requireById(this.groupId);
    if (!(groupShape instanceof Group)) throw new CommandError(`not a container: ${this.groupId}`);
    const shape = this.document.requireById(this.shapeId);
    if (shape === groupShape || this.isDescendant(shape, groupShape)) {
      throw new CommandError("cannot add a container into its own descendant");
    }
    this.document.remove(shape);
    this.document.add(shape, groupShape);
    return `${shape.type}#${shape.id} added to g#${groupShape.id}`;
  }

  private isDescendant(ancestor: Shape, candidate: Group): boolean {
    let current = candidate.parent;
    while (current !== null) {
      if (current === ancestor) return true;
      current = current.parent;
    }
    return false;
  }
}
