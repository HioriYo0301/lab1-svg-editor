import { SvgDocument } from "../document/SvgDocument.js";
import { Command } from "./Command.js";

export class MoveCommand implements Command {
  public constructor(private readonly document: SvgDocument, private readonly id: string, private readonly dx: number, private readonly dy: number) {}
  public execute(): string {
    const shape = this.document.requireById(this.id);
    shape.move(this.dx, this.dy);
    return `${shape.type}#${shape.id} moved by (${this.dx},${this.dy})`;
  }
  public undo(): string {
    const shape = this.document.requireById(this.id);
    shape.move(-this.dx, -this.dy);
    return `${shape.type}#${shape.id} moved back by (${-this.dx},${-this.dy})`;
  }
}
